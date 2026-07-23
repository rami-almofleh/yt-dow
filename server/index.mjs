import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import express from 'express';

import { config } from './config.mjs';
import { requestLogger } from './middleware/requestLogger.mjs';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.mjs';
import { downloadRateLimiter, infoRateLimiter } from './middleware/rateLimit.mjs';
import { downloadRouter } from './routes/download.route.mjs';
import { healthRouter } from './routes/health.route.mjs';
import { infoRouter } from './routes/info.route.mjs';
import { sweepOrphanedTempFiles } from './services/cleanup.service.mjs';

const CLEANUP_INTERVAL_MS = 15 * 60 * 1000;

const app = express();

// Nur einer echten Reverse-Proxy-Konfiguration vertrauen (siehe config.mjs) -
// sonst könnten Clients X-Forwarded-For fälschen und das Rate-Limiting unten
// umgehen.
app.set('trust proxy', config.trustProxy ? 1 : false);

app.use(express.json());
app.use(requestLogger);

app.use('/api', healthRouter);
if (config.appMode === 'desktop') {
  app.use('/api', infoRouter);
  app.use('/api', downloadRouter);
} else {
  app.use('/api', infoRateLimiter, infoRouter);
  app.use('/api', downloadRateLimiter, downloadRouter);
}

// Serves the built Angular app from the same origin as /api, so the Electron
// desktop build needs no CORS/proxy config - frontend calls to /api/* keep
// working unchanged. No-op on the VPS today (dist/reelio/browser isn't
// deployed there; nginx serves the frontend separately).
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const staticDir = process.env.STATIC_DIR || path.join(__dirname, '..', 'dist', 'reelio', 'browser');
if (fs.existsSync(staticDir)) {
  app.use(express.static(staticDir));
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api')) return next();
    res.sendFile(path.join(staticDir, 'index.html'));
  });
}

app.use(notFoundHandler);
app.use(errorHandler);

sweepOrphanedTempFiles();
setInterval(sweepOrphanedTempFiles, CLEANUP_INTERVAL_MS);

export const server = app.listen(config.port, config.host, () => {
  const { port } = server.address();
  console.log(`API-Server läuft auf http://${config.host ?? 'localhost'}:${port} (${config.nodeEnv})`);
});
