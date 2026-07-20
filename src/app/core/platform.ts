export type Platform = 'youtube' | 'facebook' | 'instagram' | 'tiktok';

export const PLATFORM_LABELS: Record<Platform, string> = {
  youtube: 'YouTube',
  facebook: 'Facebook',
  instagram: 'Instagram',
  tiktok: 'TikTok',
};

// Client-seitige Vorabprüfung, rein für sofortiges UI-Feedback beim Tippen
// (Icon-Erkennung, offensichtlich falsche Links direkt abfangen ohne
// Server-Roundtrip). Spiegelt bewusst die Whitelist aus
// server/services/platform.service.mjs - die Backend-Prüfung bleibt die
// eigentliche Autorität, hier reicht eine best-effort Kopie.
const PLATFORM_HOSTNAMES: Record<Platform, string[]> = {
  youtube: ['youtube.com', 'youtu.be'],
  facebook: ['facebook.com', 'fb.watch'],
  instagram: ['instagram.com'],
  tiktok: ['tiktok.com'],
};

function matchesHostname(hostname: string, allowed: string): boolean {
  return hostname === allowed || hostname.endsWith(`.${allowed}`);
}

export function detectPlatform(rawUrl: string): Platform | null {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return null;
  }

  const hostname = url.hostname.toLowerCase();
  for (const [platform, hostnames] of Object.entries(PLATFORM_HOSTNAMES) as [Platform, string[]][]) {
    if (hostnames.some((allowed) => matchesHostname(hostname, allowed))) {
      return platform;
    }
  }
  return null;
}
