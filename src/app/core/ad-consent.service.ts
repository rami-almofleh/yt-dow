import { Injectable, computed, signal } from '@angular/core';

import { updateGoogleAdConsent } from './google-consent';

const CONSENT_STORAGE_KEY = 'reelio-ads-consent';

export type ConsentStatus = 'undecided' | 'granted' | 'denied';

/**
 * Zentraler Consent-Zustand für Werbung. `AdSlot` (Schritt 10) liest
 * `granted()` als Lade-Gate, `ConsentBanner` (Schritt 11) ist die einzige
 * Stelle, die `grant()`/`deny()` aufruft.
 */
@Injectable({ providedIn: 'root' })
export class AdConsentService {
  private readonly _status = signal<ConsentStatus>(this.readStoredStatus());
  // Banner offen halten, bis der Nutzer sich entschieden hat, oder erneut
  // öffnen, wenn er seine Wahl über "Cookie-Einstellungen" im Footer ändern
  // möchte.
  private readonly _bannerOpen = signal<boolean>(this._status() === 'undecided');

  readonly status = this._status.asReadonly();
  readonly granted = computed(() => this._status() === 'granted');
  readonly bannerOpen = this._bannerOpen.asReadonly();

  grant(): void {
    this.setStatus('granted');
  }

  deny(): void {
    this.setStatus('denied');
  }

  reopenBanner(): void {
    this._bannerOpen.set(true);
  }

  private setStatus(status: 'granted' | 'denied'): void {
    this._status.set(status);
    this._bannerOpen.set(false);
    this.writeStoredStatus(status);
    updateGoogleAdConsent(status === 'granted');
  }

  private readStoredStatus(): ConsentStatus {
    try {
      const value = localStorage.getItem(CONSENT_STORAGE_KEY);
      return value === 'granted' || value === 'denied' ? value : 'undecided';
    } catch {
      return 'undecided';
    }
  }

  private writeStoredStatus(status: 'granted' | 'denied'): void {
    try {
      localStorage.setItem(CONSENT_STORAGE_KEY, status);
    } catch {
      // Storage blockiert/voll - Zustimmung gilt dann nur für diese Sitzung.
    }
  }
}
