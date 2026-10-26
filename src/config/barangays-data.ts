/**
 * Authoritative Barangay Directory for the Municipality of San Felipe, Zambales.
 *
 * PROVENANCE: VERIFIED_MUNICIPAL_INFORMATION
 * Exactly 10 barangays authorized by the Municipal Government of San Felipe.
 *
 * NOTE: Emergency contact details (telephone, mobile, officials) are intentionally
 * not yet provided by the municipality and will be published upon endorsement.
 */

export interface BarangayHotline {
  id: string;
  slug: string;
  name: string;
  phone?: string;
  mobile?: string;
  alternateNumbers?: string[];
  isContactProvided: boolean;
}

export const AUTHORITATIVE_BARANGAYS: BarangayHotline[] = [
  { id: "amagna", slug: "amagna", name: "Amagna", isContactProvided: false },
  { id: "apostol", slug: "apostol", name: "Apostol", isContactProvided: false },
  { id: "balincaguing", slug: "balincaguing", name: "Balincaguing", isContactProvided: false },
  { id: "feria", slug: "feria", name: "Feria", isContactProvided: false },
  { id: "maloma", slug: "maloma", name: "Maloma", isContactProvided: false },
  { id: "manglicmot", slug: "manglicmot", name: "Manglicmot", isContactProvided: false },
  { id: "rosete", slug: "rosete", name: "Rosete", isContactProvided: false },
  { id: "san-rafael", slug: "san-rafael", name: "San Rafael", isContactProvided: false },
  { id: "sindol", slug: "sindol", name: "Sindol", isContactProvided: false },
  { id: "sto-nino", slug: "sto-nino", name: "Sto. Niño", isContactProvided: false },
];

export const AUTHORITATIVE_BARANGAY_COUNT = AUTHORITATIVE_BARANGAYS.length; // Exactly 10

export function getAuthoritativeBarangays(): BarangayHotline[] {
  return [...AUTHORITATIVE_BARANGAYS];
}
