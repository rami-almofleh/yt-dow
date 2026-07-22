export const SUPPORTED_LANGS = ['de', 'en', 'ar', 'fr'] as const;
export type SupportedLang = (typeof SUPPORTED_LANGS)[number];

const FALLBACK_LANG: SupportedLang = 'en';
const RTL_LANGS: ReadonlySet<SupportedLang> = new Set(['ar']);

// navigator.languages (ordered by user preference, e.g. ["en-US", "de"]) is
// preferred over the single navigator.language - some embedded webviews only
// expose the latter, hence the fallback array. Works identically in the
// Electron desktop app (Chromium renderer reflects the OS locale) and the
// public website.
export function detectBrowserLang(): SupportedLang {
  if (typeof navigator === 'undefined') return FALLBACK_LANG;
  const candidates = navigator.languages?.length ? navigator.languages : [navigator.language];

  for (const raw of candidates) {
    if (!raw) continue;
    // "en-US" -> "en", "ar-EG" -> "ar", "fr-CA" -> "fr", "de" -> "de"
    const primary = raw.split('-')[0].toLowerCase();
    const match = SUPPORTED_LANGS.find((lang) => lang === primary);
    if (match) return match;
  }
  return FALLBACK_LANG;
}

// Accepts a plain string (not just SupportedLang) since TranslocoService's
// langChanges$ emits its own generic `string`-typed active-lang value.
export function applyDocumentLanguage(document: Document, lang: string): void {
  document.documentElement.lang = lang;
  document.documentElement.dir = RTL_LANGS.has(lang as SupportedLang) ? 'rtl' : 'ltr';
}
