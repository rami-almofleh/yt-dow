export const SUPPORTED_LANGS = ['de', 'en', 'ar', 'fr'] as const;
export type SupportedLang = (typeof SUPPORTED_LANGS)[number];

// Each language shown in its own native name (not translated) - the
// convention every language switcher follows, since a label like "German"
// is useless to someone who only reads Arabic.
export const LANG_LABELS: Record<SupportedLang, string> = {
  de: 'Deutsch',
  en: 'English',
  ar: 'العربية',
  fr: 'Français',
};

const FALLBACK_LANG: SupportedLang = 'en';
const RTL_LANGS: ReadonlySet<SupportedLang> = new Set(['ar']);
const LANG_STORAGE_KEY = 'reelio-lang';

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

// localStorage can throw (Safari private browsing, blocked by an extension) -
// same defensive treatment as app.ts's theme storage. A manual language
// choice is a nice-to-have, not worth crashing startup over.
export function readStoredLang(): SupportedLang | null {
  try {
    const value = localStorage.getItem(LANG_STORAGE_KEY);
    return SUPPORTED_LANGS.find((lang) => lang === value) ?? null;
  } catch {
    return null;
  }
}

export function writeStoredLang(lang: SupportedLang): void {
  try {
    localStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch {
    // Sprachwahl gilt dann eben nur für diese Sitzung.
  }
}
