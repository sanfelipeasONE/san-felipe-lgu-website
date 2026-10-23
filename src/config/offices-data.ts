/**
 * Centralized Canonical Municipal Office Directory for San Felipe, Zambales.
 *
 * PROVENANCE: VERIFIED_CLIENT_INFORMATION
 * All 18 office names and official wording supplied and confirmed by the client.
 *
 * ORDERING RULE:
 * Canonical website display order strictly follows:
 * 1. Office of the Mayor (First)
 * 2. Office of the Sangguniang Bayan (Second)
 * Followed by frontline, administrative, and regulatory executive offices (3-18).
 * Display order is decoupled from database identity or creation timestamp.
 */

export interface MunicipalOffice {
  id: string;
  slug: string;
  name: string;
  displayOrder: number;
  acronym?: string;
  head?: string;
  headTitle?: string;
  email?: string;
  location?: string;
  telephone?: string;
  officeHours?: string;
  isVerified: boolean;
  facebookUrl?: string;
}

export const VERIFIED_MUNICIPAL_OFFICES: MunicipalOffice[] = [
  {
    id: "office-of-the-mayor",
    slug: "office-of-the-mayor",
    name: "Office of the Mayor",
    displayOrder: 1,
    acronym: "",
    head: "HON. ENGR. REINHARD E. JERESANO",
    headTitle: "Municipal Mayor",
    telephone: "0976-566-0872",
    email: "SanFelipeasone@gmail.com",
    location: "2nd Floor, Municipal Hall Complex, San Felipe, Zambales",
    isVerified: true,
  },
  {
    id: "office-of-the-sangguniang-bayan",
    slug: "office-of-the-sangguniang-bayan",
    name: "Office of the Sangguniang Bayan",
    displayOrder: 2,
    acronym: "",
    head: "HON. MARY ANN R. QUIBA",
    headTitle: "Municipal Vice Mayor / Presiding Officer",
    telephone: "0919-819-6214",
    email: "sanfelipesangguniangbayan@gmail.com",
    location: "2nd Floor, Municipal Hall Complex, San Felipe, Zambales",
    isVerified: true,
  },
  {
    id: "municipal-planning-and-development-office",
    slug: "municipal-planning-and-development-office",
    name: "Municipal Planning and Development Office",
    displayOrder: 3,
    acronym: "MPDO",
    head: "FREDERICK F. TORRES",
    telephone: "0919-003-2388",
    email: "lgusf.mpdoffice@gmail.com",
    location: "Municipal Hall Complex, San Felipe, Zambales",
    isVerified: true,
  },
  {
    id: "municipal-health-office",
    slug: "municipal-health-office",
    name: "Municipal Health Office",
    displayOrder: 4,
    acronym: "MHO",
    head: "SALOME F. ARINDUQUE",
    telephone: "0931-793-8035",
    email: "rhusanfelipezambs@gmail.com",
    location: "Municipal Health Center, San Felipe, Zambales",
    isVerified: true,
  },
  {
    id: "municipal-budget-office",
    slug: "municipal-budget-office",
    name: "Municipal Budget Office",
    displayOrder: 5,
    acronym: "MBO",
    head: "DAISY R. NERY",
    telephone: "0998-551-9742",
    email: "sfzbudgetoffice@gmail.com",
    location: "Municipal Hall Complex, San Felipe, Zambales",
    isVerified: true,
  },
  {
    id: "municipal-accounting-office",
    slug: "municipal-accounting-office",
    name: "Municipal Accounting Office",
    displayOrder: 6,
    acronym: "",
    head: "MICHELLE ANN N. CALLES",
    telephone: "602-5181",
    email: "acctgsfz@gmail.com",
    location: "Municipal Hall Complex, San Felipe, Zambales",
    isVerified: true,
  },
  {
    id: "municipal-treasury-office",
    slug: "municipal-treasury-office",
    name: "Municipal Treasury Office",
    displayOrder: 7,
    acronym: "",
    head: "ELSIE C. ALIP",
    telephone: "0918-959-4783",
    email: "lgusanfelipetreasury@gmail.com",
    location: "Ground Floor, Municipal Hall Complex, San Felipe, Zambales",
    isVerified: true,
  },
  {
    id: "municipal-assessors-office",
    slug: "municipal-assessors-office",
    name: "Municipal Assessor’s Office",
    displayOrder: 8,
    acronym: "",
    head: "GERALDINE B. BADA",
    telephone: "0945-673-2688",
    email: "Oma.sanfelipe.zambales@gmail.com",
    location: "Ground Floor, Municipal Hall Complex, San Felipe, Zambales",
    isVerified: true,
  },
  {
    id: "municipal-social-welfare-and-development-office",
    slug: "municipal-social-welfare-and-development-office",
    name: "Municipal Social Welfare and Development Office",
    displayOrder: 9,
    acronym: "",
    head: "ROWEL A. VILLANUEVA",
    telephone: "0949-995-0694",
    email: "Mswdo.sanfelipezambales@gmail.com",
    location: "Ground Floor, Municipal Hall Complex, San Felipe, Zambales",
    isVerified: true,
  },
  {
    id: "local-civil-registrars-office",
    slug: "local-civil-registrars-office",
    name: "Local Civil Registrar’s Office",
    displayOrder: 10,
    acronym: "",
    head: "JEANELLENE R. SALES (OIC)",
    location: "Ground Floor, Municipal Hall Complex, San Felipe, Zambales",
    isVerified: true,
  },
  {
    id: "municipal-engineering-office",
    slug: "municipal-engineering-office",
    name: "Municipal Engineering Office",
    displayOrder: 11,
    acronym: "",
    head: "BENEDICT F. JADLOC",
    telephone: "0919-096-5198",
    email: "lgusfz.bfjadloc@gmail.com",
    location: "Municipal Hall Complex, San Felipe, Zambales",
    isVerified: true,
  },
  {
    id: "municipal-agriculture-office",
    slug: "municipal-agriculture-office",
    name: "Municipal Agriculture Office",
    displayOrder: 12,
    acronym: "",
    head: "JOHN REY F. FUNIESTAS (OIC)",
    telephone: "09097884173 / 09100757895",
    email: "sanfelipeagri@gmail.com",
    location: "Municipal Hall Complex, San Felipe, Zambales",
    isVerified: true,
  },
  {
    id: "municipal-disaster-risk-reduction-and-management-office",
    slug: "municipal-disaster-risk-reduction-and-management-office",
    name: "Municipal Disaster Risk Reduction and Management Office",
    displayOrder: 13,
    acronym: "MDRRMO",
    head: "RAYMOND F. DE JESUS",
    telephone: "0929-183-8441",
    email: "mdrrmosanfelipe@gmail.com",
    location: "MDRRM Operations Center, San Felipe, Zambales",
    isVerified: true,
  },
  {
    id: "municipal-tourism-and-investments-promotions-office",
    slug: "municipal-tourism-and-investments-promotions-office",
    name: "Municipal Tourism and Investments Promotions Office",
    displayOrder: 14,
    acronym: "",
    head: "DWAIN O. DOCTANA",
    telephone: "0927-462-6661",
    email: "sanfelipemunicipaltourism@gmail.com",
    location: "Municipal Hall Complex, San Felipe, Zambales",
    isVerified: true,
  },
  {
    id: "local-youth-development-office",
    slug: "local-youth-development-office",
    name: "Local Youth Development Office",
    displayOrder: 15,
    acronym: "LYDO",
    head: "ADRIAN LUKE R. GALLARDO",
    telephone: "0961-342-9942",
    email: "sanfelipeyouth2024@gmail.com",
    location: "Municipal Hall Complex, San Felipe, Zambales",
    isVerified: true,
  },
  {
    id: "municipal-ecological-and-natural-resources-office",
    slug: "municipal-ecological-and-natural-resources-office",
    name: "Municipal Ecological and Natural Resources Office",
    displayOrder: 16,
    acronym: "",
    head: "ANDRE CARLO A. DASIG",
    telephone: "09467585305",
    email: "loveleelacaferrer@gmail.com",
    location: "Municipal Hall Complex, San Felipe, Zambales",
    isVerified: true,
  },
  {
    id: "human-resource-management-office",
    slug: "human-resource-management-office",
    name: "Human Resource Management Office",
    displayOrder: 17,
    acronym: "HRMO",
    head: "MERCEDES L. FORONDA",
    location: "2nd Floor, Municipal Hall Complex, San Felipe, Zambales",
    isVerified: true,
  },
  {
    id: "public-employment-service-office",
    slug: "public-employment-service-office",
    name: "Public Employment Service Office",
    displayOrder: 18,
    acronym: "PESO",
    head: "FREDERICK F. TORRES",
    telephone: "0948-990-5334",
    email: "pesosanfelipe@gmail.com",
    location: "Ground Floor, Municipal Hall Complex, San Felipe, Zambales",
    isVerified: true,
  },
];

export function getCanonicalOffices(): MunicipalOffice[] {
  return [...VERIFIED_MUNICIPAL_OFFICES].sort((a, b) => a.displayOrder - b.displayOrder);
}

export function getOfficeBySlug(slug: string): MunicipalOffice | undefined {
  return VERIFIED_MUNICIPAL_OFFICES.find((o) => o.slug === slug);
}

export function getOfficeById(id: string): MunicipalOffice | undefined {
  return VERIFIED_MUNICIPAL_OFFICES.find((o) => o.id === id);
}
