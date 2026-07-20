import type { AdSlotVariant } from '../shared/ad-slot/ad-slot';

// TODO: Sobald ein AdSense-Konto genehmigt ist, echte Werte eintragen.
// Solange ADSENSE_CLIENT_ID leer ist, zeigt AdSlot ausschließlich den
// neutralen "Anzeigenplatz"-Platzhalter an - es wird nie ein Request mit
// einer erfundenen/ungültigen Client-ID an Google geschickt.
export const ADSENSE_CLIENT_ID = '';

export const AD_SLOT_IDS: Record<AdSlotVariant, string> = {
  top: '',
  'in-content': '',
  sidebar: '',
  bottom: '',
};
