import type { DesktopOs } from './downloads.config';

// jsdom (unit tests) and prerendering contexts may not expose `navigator` -
// same defensive pattern as the theme detection in app.ts.
export function detectOs(): DesktopOs | 'unknown' {
  if (typeof navigator === 'undefined') return 'unknown';
  const ua = navigator.userAgent;
  // No desktop build targets mobile - treat phones/tablets as "unknown"
  // rather than misreporting them as their underlying OS family.
  if (/iPhone|iPad|iPod|Android/.test(ua)) return 'unknown';
  if (/Mac/.test(ua)) return 'mac';
  if (/Win/.test(ua)) return 'windows';
  if (/Linux/.test(ua)) return 'linux';
  return 'unknown';
}
