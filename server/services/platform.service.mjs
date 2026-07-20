import { HttpError } from '../middleware/errorHandler.mjs';

const PLATFORMS = [
  { id: 'youtube', label: 'YouTube', hostnames: ['youtube.com', 'youtu.be'] },
  { id: 'facebook', label: 'Facebook', hostnames: ['facebook.com', 'fb.watch'] },
  { id: 'instagram', label: 'Instagram', hostnames: ['instagram.com'] },
  { id: 'tiktok', label: 'TikTok', hostnames: ['tiktok.com'] },
];

function matchesHostname(hostname, allowed) {
  return hostname === allowed || hostname.endsWith(`.${allowed}`);
}

/**
 * Parses and whitelists a video URL. Throws HttpError for anything that isn't
 * a well-formed http(s) link to one of the four supported platforms - this is
 * the app's only line of defense against being abused as an open SSRF proxy.
 */
export function detectPlatform(rawUrl) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new HttpError(400, 'Das ist keine gültige URL.', 'INVALID_URL');
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new HttpError(400, 'Es werden nur http(s)-Links unterstützt.', 'INVALID_URL');
  }

  const hostname = url.hostname.toLowerCase();
  const platform = PLATFORMS.find((p) => p.hostnames.some((h) => matchesHostname(hostname, h)));
  if (!platform) {
    throw new HttpError(
      400,
      'Diese Plattform wird nicht unterstützt. Erlaubt sind YouTube, Facebook, Instagram und TikTok.',
      'UNSUPPORTED_PLATFORM',
    );
  }

  return platform;
}
