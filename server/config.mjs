import ffmpegStaticPath from 'ffmpeg-static';

export const config = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  // Bundled static ffmpeg binary so the app doesn't depend on a system install
  // (important for the Docker deployment planned in Phase 4).
  ffmpegPath: process.env.FFMPEG_PATH || ffmpegStaticPath,
  downloadTimeoutMs: Number(process.env.DOWNLOAD_TIMEOUT_MS) || 10 * 60 * 1000,
  // Only honour X-Forwarded-For when we know we're actually behind a reverse
  // proxy - otherwise it lets clients spoof their IP and bypass rate limits.
  trustProxy: process.env.TRUST_PROXY === 'true',
  rateLimit: {
    infoWindowMs: Number(process.env.RATE_LIMIT_INFO_WINDOW_MS) || 10 * 60 * 1000,
    infoMax: Number(process.env.RATE_LIMIT_INFO_MAX) || 30,
    // Downloads spawn yt-dlp+ffmpeg and use real bandwidth, so they get a
    // noticeably stricter budget than metadata lookups.
    downloadWindowMs: Number(process.env.RATE_LIMIT_DOWNLOAD_WINDOW_MS) || 10 * 60 * 1000,
    downloadMax: Number(process.env.RATE_LIMIT_DOWNLOAD_MAX) || 10,
  },
};
