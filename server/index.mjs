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
app.use('/api', infoRateLimiter, infoRouter);
app.use('/api', downloadRateLimiter, downloadRouter);

app.use(notFoundHandler);
app.use(errorHandler);

sweepOrphanedTempFiles();
setInterval(sweepOrphanedTempFiles, CLEANUP_INTERVAL_MS);

app.listen(config.port, () => {
  console.log(`API-Server läuft auf http://localhost:${config.port} (${config.nodeEnv})`);
});
