import { Component, DestroyRef, ElementRef, computed, effect, inject, input, signal } from '@angular/core';

import { AdConsentService } from '../../core/ad-consent.service';
import { AD_SLOT_IDS, ADSENSE_CLIENT_ID } from '../../core/ads.config';

export type AdSlotVariant = 'top' | 'in-content' | 'sidebar' | 'bottom';

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/**
 * Reservierter Anzeigenplatz mit fester Größe je Variante (verhindert Layout-
 * Shift, egal ob eine echte Anzeige lädt oder nicht). Lädt die eigentliche
 * AdSense-Anzeige erst, wenn (a) eine Client-ID konfiguriert ist
 * (ads.config.ts - solange leer, wird nie geladen), (b) der Nutzer zugestimmt
 * hat (AdConsentService, Banner siehe ConsentBanner) und (c) der Slot
 * tatsächlich im Viewport sichtbar ist.
 */
@Component({
  selector: 'app-ad-slot',
  templateUrl: './ad-slot.html',
  styleUrl: './ad-slot.scss',
  // Jede Variante braucht andere Außenmaße (z. B. schmale Inhaltsspalte für
  // "in-content" vs. volle Shell-Breite für "top"/"bottom", nur-Desktop für
  // "sidebar") - als data-Attribut am Host statt mehrerer boolescher Klassen,
  // damit ad-slot.scss die einzige Stelle bleibt, die das entscheidet.
  host: {
    '[attr.data-variant]': 'variant()',
    '[attr.role]': "variant() === 'sidebar' ? 'complementary' : null",
    '[attr.aria-label]': "variant() === 'sidebar' ? 'Werbung' : null",
  },
})
export class AdSlot {
  readonly variant = input.required<AdSlotVariant>();

  private readonly consent = inject(AdConsentService);
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);

  private hasPushedAd = false;

  protected readonly isVisible = signal(false);
  protected readonly adSenseClientId = ADSENSE_CLIENT_ID;
  protected readonly adUnitId = computed(() => AD_SLOT_IDS[this.variant()]);
  protected readonly shouldLoadAd = computed(
    () => this.isVisible() && this.consent.granted() && ADSENSE_CLIENT_ID !== '' && this.adUnitId() !== '',
  );

  constructor() {
    if (typeof IntersectionObserver === 'undefined') {
      // Uralte Browser oder Testumgebung (jsdom kennt IntersectionObserver
      // nicht) - ohne Lazy-Loading-Fähigkeit lieber sofort als nie laden.
      this.isVisible.set(true);
    } else {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            this.isVisible.set(true);
            observer.disconnect();
          }
        },
        { rootMargin: '200px' },
      );
      observer.observe(this.elementRef.nativeElement);
      this.destroyRef.onDestroy(() => observer.disconnect());
    }

    effect(() => {
      if (this.shouldLoadAd() && !this.hasPushedAd) {
        this.hasPushedAd = true;
        this.pushAd();
      }
    });
  }

  private pushAd(): void {
    this.ensureAdSenseScriptLoaded();
    try {
      (window.adsbygoogle ??= []).push({});
    } catch {
      // AdSense-Skript evtl. noch nicht bereit oder von einem Blocker
      // verhindert - der reservierte Platzhalter bleibt dann einfach leer.
    }
  }

  private ensureAdSenseScriptLoaded(): void {
    if (document.querySelector('script[data-amapin-adsense]')) {
      return;
    }
    const script = document.createElement('script');
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${this.adSenseClientId}`;
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.dataset['amapinAdsense'] = 'true';
    document.head.appendChild(script);
  }
}
