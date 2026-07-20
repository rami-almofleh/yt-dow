import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink, RouterOutlet } from '@angular/router';

import { AdConsentService } from './core/ad-consent.service';
import { ConsentBanner } from './features/consent-banner/consent-banner';
import { AdSlot } from './shared/ad-slot/ad-slot';

const THEME_STORAGE_KEY = 'amapin-theme';

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
  imports: [RouterOutlet, RouterLink, MatButtonModule, AdSlot, ConsentBanner],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly consent = inject(AdConsentService);
  protected readonly isDarkMode = signal(this.resolveInitialDarkMode());

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

  private resolveInitialDarkMode(): boolean {
    const stored = readStoredTheme();
    if (stored) return stored === 'dark';
    return prefersDarkColorScheme();
  }

  private applyColorScheme(isDark: boolean): void {
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
  }
}
