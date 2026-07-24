import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { RouterLink, RouterOutlet } from '@angular/router';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';

import {
  LANG_LABELS,
  SUPPORTED_LANGS,
  SupportedLang,
  writeStoredLang,
} from './core/language-detection';

const THEME_STORAGE_KEY = 'reelio-theme';

// localStorage can throw (Safari private browsing, blocked by an extension,
// or simply absent in the test environment) - the theme preference is a nice
// -to-have, not worth crashing the whole app over.
function readStoredTheme(): 'light' | 'dark' | null {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    return value === 'dark' || value === 'light' ? value : null;
  } catch {
    return null;
  }
}

function writeStoredTheme(value: 'light' | 'dark'): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, value);
  } catch {
    // Theme-Wahl gilt dann eben nur für diese Sitzung.
  }
}

// jsdom (used in unit tests) doesn't implement matchMedia at all, and some
// embedded webviews are also known to omit it - same defensive treatment as
// localStorage above.
function getDarkColorSchemeMediaQuery(): MediaQueryList | null {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return null;
  try {
    return window.matchMedia('(prefers-color-scheme: dark)');
  } catch {
    return null;
  }
}

function prefersDarkColorScheme(): boolean {
  return getDarkColorSchemeMediaQuery()?.matches ?? false;
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, MatButtonModule, MatMenuModule, TranslocoDirective],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly transloco = inject(TranslocoService);

  protected readonly isDarkMode = signal(this.resolveInitialDarkMode());

  protected readonly langs = SUPPORTED_LANGS;
  protected readonly langLabels = LANG_LABELS;
  // App-Initializer (app.config.ts) hat setActiveLang() schon vor dem ersten
  // Render aufgerufen - toSignal() liefert also ab dem ersten Wert die echte
  // aktive Sprache, nie einen Zwischenzustand.
  protected readonly currentLang = toSignal(this.transloco.langChanges$, {
    initialValue: this.transloco.getActiveLang(),
  });

  constructor() {
    if (readStoredTheme()) {
      this.applyColorScheme(this.isDarkMode());
    } else {
      // No manual choice yet: keep following the OS preference live instead
      // of freezing whatever it was at page load.
      getDarkColorSchemeMediaQuery()?.addEventListener('change', (event) =>
        this.isDarkMode.set(event.matches),
      );
    }
  }

  protected toggleTheme(): void {
    const next = !this.isDarkMode();
    this.isDarkMode.set(next);
    this.applyColorScheme(next);
    writeStoredTheme(next ? 'dark' : 'light');
  }

  // setActiveLang() triggers langChanges$ (see app.config.ts), which re-runs
  // applyDocumentLanguage() itself - no need to touch <html lang>/dir here.
  protected setLanguage(lang: SupportedLang): void {
    this.transloco.setActiveLang(lang);
    writeStoredLang(lang);
  }

  private resolveInitialDarkMode(): boolean {
    const stored = readStoredTheme();
    if (stored) return stored === 'dark';
    return prefersDarkColorScheme();
  }

  private applyColorScheme(isDark: boolean): void {
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
  }
}
