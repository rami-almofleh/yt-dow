import { rateLimit } from 'express-rate-limit';

import { config } from '../config.mjs';

function rateLimitHandler(req, res) {
  res.status(429).json({
    error: {
      code: 'RATE_LIMITED',
      message: 'Zu viele Anfragen. Bitte warte kurz, bevor du es erneut versuchst.',
    },
  });
}

export const infoRateLimiter = rateLimit({
  windowMs: config.rateLimit.infoWindowMs,
  limit: config.rateLimit.infoMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

// Deutlich enger als infoRateLimiter: Downloads spawnen yt-dlp+ffmpeg und
// verbrauchen echte Bandbreite/CPU, Metadaten-Abfragen sind dagegen billig.
export const downloadRateLimiter = rateLimit({
  windowMs: config.rateLimit.downloadWindowMs,
  limit: config.rateLimit.downloadMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});
