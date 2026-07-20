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
  const message = status >= 500 ? 'Interner Serverfehler' : err.message;
  res.status(status).json({ error: { code, message } });
}
