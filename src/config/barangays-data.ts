/**
 * Authoritative Barangay Directory for the Municipality of San Felipe, Zambales.
 *
 * PROVENANCE: VERIFIED_MUNICIPAL_INFORMATION
 * Exactly 11 verified barangays authorized by the Municipal Government of San Felipe.
 *
 * Emergency hotlines and official Facebook pages are populated from municipal verification.
 */

export interface BarangayHotline {
  id: string;
  slug: string;
  name: string;
  phone?: string;
  mobile?: string;
  alternateNumbers?: string[];
  facebook?: string;
  isContactProvided: boolean;
}

export const AUTHORITATIVE_BARANGAYS: BarangayHotline[] = [
  {
    id: "amagna",
    slug: "amagna",
    name: "Amagna",
    phone: "0963-585-6103",
    facebook: "https://www.facebook.com/amagna.san.felipe.zambales",
    isContactProvided: true,
  },
  {
    id: "apostol",
    slug: "apostol",
    name: "Apostol",
    phone: "0938-922-9295",
    facebook: "https://www.facebook.com/share/18ZT5rhVPZ/?mibextid=wwXIfr",
    isContactProvided: true,
  },
  {
    id: "balincaguing",
    slug: "balincaguing",
    name: "Balincaguing",
    phone: "0977-081-4255",
    facebook: "https://www.facebook.com/share/1JrvnSo1T4/?mibextid=wwXIfr",
    isContactProvided: true,
  },
  {
    id: "faranal",
    slug: "faranal",
    name: "Farañal",
    phone: "0908-187-6380",
    facebook: "https://www.facebook.com/share/1UkVWYeaG9/?mibextid=wwXIfr",
    isContactProvided: true,
  },
  {
    id: "feria",
    slug: "feria",
    name: "Feria",
    phone: "0992-337-7881",
    facebook: "https://www.facebook.com/share/1DorigfCqP/?mibextid=wwXIfr",
    isContactProvided: true,
  },
  {
    id: "maloma",
    slug: "maloma",
    name: "Maloma",
    phone: "0929-587-7085",
    facebook: "https://www.facebook.com/share/17nUAPNkVR/?mibextid=wwXIfr",
    isContactProvided: true,
  },
  {
    id: "manglicmot",
    slug: "manglicmot",
    name: "Manglicmot",
    phone: "0919-424-0540",
    facebook: "https://www.facebook.com/share/1Ex5apzjgQ/?mibextid=wwXIfr",
    isContactProvided: true,
  },
  {
    id: "rosete",
    slug: "rosete",
    name: "Rosete",
    phone: "0939-724-1315",
    facebook: "https://www.facebook.com/barangayrosete",
    isContactProvided: true,
  },
  {
    id: "san-rafael",
    slug: "san-rafael",
    name: "San Rafael",
    phone: "0912-454-3858",
    facebook: "https://www.facebook.com/share/1HUpnaTBcV/?mibextid=wwXIfr",
    isContactProvided: true,
  },
  {
    id: "sindol",
    slug: "sindol",
    name: "Sindol",
    phone: "0919-833-1239",
    facebook: "https://www.facebook.com/share/1Gqhmi4QTR/?mibextid=wwXIfr",
    isContactProvided: true,
  },
  {
    id: "sto-nino",
    slug: "sto-nino",
    name: "Sto. Niño",
    phone: "0998-420-5352",
    facebook: "https://www.facebook.com/share/19stNKYaxV/?mibextid=wwXIfr",
    isContactProvided: true,
  },
];

export const AUTHORITATIVE_BARANGAY_COUNT = AUTHORITATIVE_BARANGAYS.length; // Exactly 11

export function getAuthoritativeBarangays(): BarangayHotline[] {
  return [...AUTHORITATIVE_BARANGAYS];
}
