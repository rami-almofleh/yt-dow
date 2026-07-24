import { DOCUMENT } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  isDevMode,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideTransloco, TranslocoService } from '@jsverse/transloco';
import { firstValueFrom } from 'rxjs';

import { routes } from './app.routes';
import { applyDocumentLanguage, detectBrowserLang, readStoredLang } from './core/language-detection';
import { TranslocoHttpLoader } from './core/transloco-loader';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(),
    provideTransloco({
      config: {
        availableLangs: ['de', 'en', 'ar', 'fr'],
        defaultLang: 'en',
        fallbackLang: 'en',
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
      },
      loader: TranslocoHttpLoader,
    }),
    // Detects and applies the browser's language BEFORE first render (avoids
    // a flash of the wrong language) - see language-detection.ts. Keeps
    // <html lang>/dir in sync with any later language change too.
    provideAppInitializer(() => {
      const transloco = inject(TranslocoService);
      const document = inject(DOCUMENT);
      const lang = readStoredLang() ?? detectBrowserLang();

      applyDocumentLanguage(document, lang);
      transloco.langChanges$.subscribe((activeLang) => applyDocumentLanguage(document, activeLang));

      transloco.setActiveLang(lang);
      return firstValueFrom(transloco.load(lang));
    }),
  ],
};
