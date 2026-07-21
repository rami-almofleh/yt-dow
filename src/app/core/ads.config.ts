import type { AdSlotVariant } from '../shared/ad-slot/ad-slot';

// Deaktiviert: die Website ist jetzt reine Download-Seite für die Desktop-App,
// keine Werbeflächen mehr. Publisher-ID bewusst nicht gelöscht, nur geleert -
// shouldLoadAd() in ad-slot.ts schaltet dadurch komplett ab, ohne den
// Ads-/Consent-Code zu entfernen, falls er später wieder gebraucht wird.
// Explizit als `string` typisiert (nicht als literaler Typ inferiert) - sonst
// hält TypeScript den `!== ''`-Vergleich in ad-slot.ts für unmöglich, sobald
// hier ein fester Wert statt eines leeren Strings steht.
export const ADSENSE_CLIENT_ID: string = '';

export const AD_SLOT_IDS: Record<AdSlotVariant, string> = {
  top: '4447644912',
  'in-content': '1542014047',
  sidebar: '5772903091',
  bottom: '5050280145',
};
