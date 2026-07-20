declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Aktualisiert Google Consent Mode v2 zur Laufzeit (Nutzer trifft während der
 * Sitzung eine Wahl im Banner). Der initiale "default: denied"-Zustand wird
 * bewusst nicht hier gesetzt, sondern per Inline-Skript in index.html - der
 * muss laufen, bevor überhaupt irgendein Google-Tag feuert, also vor dem
 * Laden des Angular-Bundles. `window.gtag` ist durch dieses Inline-Skript
 * bereits definiert.
 */
export function updateGoogleAdConsent(granted: boolean): void {
  window.gtag?.('consent', 'update', {
    ad_storage: granted ? 'granted' : 'denied',
    ad_user_data: granted ? 'granted' : 'denied',
    ad_personalization: granted ? 'granted' : 'denied',
  });
}
