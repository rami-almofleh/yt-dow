import ffmpegStaticPath from 'ffmpeg-static';

export const config = {
  // PORT=0 (ephemeral, OS-assigned port - used by the Electron desktop build)
  // is falsy in JS, so `|| 3000` would silently ignore it.
  port: process.env.PORT !== undefined ? Number(process.env.PORT) : 3000,
  // undefined = bind all interfaces (today's default). The Electron build sets
  // this to '127.0.0.1' so the local API server isn't exposed to the LAN.
  host: process.env.HOST || undefined,
  nodeEnv: process.env.NODE_ENV || 'development',
  // Bundled static ffmpeg binary so the app doesn't depend on a system install
  // (important for the Docker deployment planned in Phase 4).
  ffmpegPath: process.env.FFMPEG_PATH || ffmpegStaticPath,
  // systemd services don't get the shell's PATH (e.g. snap/pip install
  // locations), so default to bare "yt-dlp" only for local/dev shells and
  // require an explicit absolute path in production via env var.
  ytDlpPath: process.env.YTDLP_PATH || 'yt-dlp',
  // Same PATH caveat as ytDlpPath - used for yt-dlp's JS-challenge solving.
  denoPath: process.env.DENO_PATH || 'deno',
  // 'desktop' (set by the Electron build) skips the IP-based rate limiters
  // below, which exist to stop multi-tenant abuse of the shared VPS - not a
  // concern when each user runs their own local instance.
  appMode: process.env.APP_MODE || 'server',
  // Path to a browser-exported cookies.txt (Netscape format), treated as a
  // protected master export. yt-dlp's --cookies is bidirectional - it reads
  // the file AND rewrites the cookie jar back into it after every run, so if
  // the account cookies ever get flagged as stale mid-session it silently
  // overwrites this path with a demoted, unauthenticated jar, permanently
  // destroying a working export. To avoid that, the app never hands this
  // path to yt-dlp directly - see buildCookiesArgs() in ytdlp.service.mjs,
  // which copies it to a disposable working file before every invocation.
  // Datacenter IPs (VPS/cloud) get flagged by YouTube's anti-bot check ("Sign
  // in to confirm you're not a bot") even for fully public videos -
  // authenticated cookies are the workaround. Optional: undefined means no
  // --cookies flag is passed.
  cookiesPath: process.env.YTDLP_COOKIES_PATH || undefined,
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
