import { config } from '../config.mjs';

export class HttpError extends Error {
  constructor(status, message, code = 'ERROR') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function notFoundHandler(req, res) {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route nicht gefunden' } });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const status = err instanceof HttpError ? err.status : 500;
  if (status >= 500) {
    console.error(err);
  }

  // Downloads stream for minutes and can fail after headers/bytes are already
  // sent (e.g. yt-dlp dies mid-transfer) - at that point we can no longer send
  // a JSON error body, so just cut the connection instead of crashing.
  if (res.headersSent || res.writableEnded) {
    res.destroy();
    return;
  }

  const code = status >= 500 ? 'INTERNAL_ERROR' : err instanceof HttpError ? err.code : 'ERROR';
  // Masking the raw message on 5xx exists to avoid leaking internals on the
  // shared VPS (config.appMode === 'server'). In desktop mode there's no
  // other tenant to leak to - it's the same person on their own machine - so
  // showing the real message (e.g. "spawn .../yt-dlp ENOENT") directly in the
  // UI is strictly more useful than a generic "Interner Serverfehler" the
  // user has no way to act on.
  const message = status < 500 || config.appMode === 'desktop' ? err.message : 'Interner Serverfehler';
  res.status(status).json({ error: { code, message } });
}
