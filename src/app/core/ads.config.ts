import type { AdSlotVariant } from '../shared/ad-slot/ad-slot';

// AdSense-Konto ist genehmigt, Publisher-ID vom Nutzer erhalten.
// Explizit als `string` typisiert (nicht als literaler Typ inferiert) - sonst
// hält TypeScript den `!== ''`-Vergleich in ad-slot.ts für unmöglich, sobald
// hier ein fester Wert statt eines leeren Strings steht.
export const ADSENSE_CLIENT_ID: string = 'ca-pub-7617535858242424';

export const AD_SLOT_IDS: Record<AdSlotVariant, string> = {
  top: '4447644912',
  'in-content': '1542014047',
  sidebar: '5772903091',
  bottom: '5050280145',
};
