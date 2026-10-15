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
}

export const VERIFIED_MUNICIPAL_OFFICES: MunicipalOffice[] = [
  {
    id: "office-of-the-mayor",
    slug: "office-of-the-mayor",
    name: "Office of the Mayor",
    displayOrder: 1,
    acronym: "",
    head: 'Hon. Engr. Reinhard "Hart" E. Jeresano',
    headTitle: "Municipal Mayor",
    location: "2nd Floor, Municipal Hall Complex, San Felipe, Zambales",
    isVerified: true,
  },
  {
    id: "office-of-the-sangguniang-bayan",
    slug: "office-of-the-sangguniang-bayan",
    name: "Office of the Sangguniang Bayan",
    displayOrder: 2,
    acronym: "",
    head: "Hon. Mary Ann R. Quiba",
    headTitle: "Municipal Vice Mayor / Presiding Officer",
    location: "2nd Floor, Municipal Hall Complex, San Felipe, Zambales",
    isVerified: true,
  },
  {
    id: "municipal-planning-and-development-office",
    slug: "municipal-planning-and-development-office",
    name: "Municipal Planning and Development Office",
    displayOrder: 3,
    acronym: "MPDO",
    location: "Municipal Hall Complex, San Felipe, Zambales",
    isVerified: true,
  },
  {
    id: "municipal-health-office",
    slug: "municipal-health-office",
    name: "Municipal Health Office",
    displayOrder: 4,
    acronym: "MHO",
    location: "Municipal Health Center, San Felipe, Zambales",
    isVerified: true,
  },
  {
    id: "municipal-budget-office",
    slug: "municipal-budget-office",
    name: "Municipal Budget Office",
    displayOrder: 5,
    acronym: "MBO",
    location: "Municipal Hall Complex, San Felipe, Zambales",
    isVerified: true,
  },
  {
    id: "municipal-accounting-office",
    slug: "municipal-accounting-office",
    name: "Municipal Accounting Office",
    displayOrder: 6,
    acronym: "",
    location: "Municipal Hall Complex, San Felipe, Zambales",
    isVerified: true,
  },
  {
    id: "municipal-treasury-office",
    slug: "municipal-treasury-office",
    name: "Municipal Treasury Office",
    displayOrder: 7,
    acronym: "",
    location: "Ground Floor, Municipal Hall Complex, San Felipe, Zambales",
    isVerified: true,
  },
  {
    id: "municipal-assessors-office",
    slug: "municipal-assessors-office",
    name: "Municipal Assessor’s Office",
    displayOrder: 8,
    acronym: "",
    location: "Ground Floor, Municipal Hall Complex, San Felipe, Zambales",
    isVerified: true,
  },
  {
    id: "municipal-social-welfare-and-development-office",
    slug: "municipal-social-welfare-and-development-office",
    name: "Municipal Social Welfare and Development Office",
    displayOrder: 9,
    acronym: "",
    location: "Ground Floor, Municipal Hall Complex, San Felipe, Zambales",
    isVerified: true,
  },
  {
    id: "local-civil-registrars-office",
    slug: "local-civil-registrars-office",
    name: "Local Civil Registrar’s Office",
    displayOrder: 10,
    acronym: "",
    location: "Ground Floor, Municipal Hall Complex, San Felipe, Zambales",
    isVerified: true,
  },
  {
    id: "municipal-engineering-office",
    slug: "municipal-engineering-office",
    name: "Municipal Engineering Office",
    displayOrder: 11,
    acronym: "",
    location: "Municipal Hall Complex, San Felipe, Zambales",
    isVerified: true,
  },
  {
    id: "municipal-agriculture-office",
    slug: "municipal-agriculture-office",
    name: "Municipal Agriculture Office",
    displayOrder: 12,
    acronym: "",
    location: "Municipal Hall Complex, San Felipe, Zambales",
    isVerified: true,
  },
  {
    id: "municipal-disaster-risk-reduction-and-management-office",
    slug: "municipal-disaster-risk-reduction-and-management-office",
    name: "Municipal Disaster Risk Reduction and Management Office",
    displayOrder: 13,
    acronym: "MDRRMO",
    location: "MDRRM Operations Center, San Felipe, Zambales",
    isVerified: true,
  },
  {
    id: "municipal-tourism-and-investments-promotions-office",
    slug: "municipal-tourism-and-investments-promotions-office",
    name: "Municipal Tourism and Investments Promotions Office",
    displayOrder: 14,
    acronym: "",
    location: "Municipal Hall Complex, San Felipe, Zambales",
    isVerified: true,
  },
  {
    id: "local-youth-development-office",
    slug: "local-youth-development-office",
    name: "Local Youth Development Office",
    displayOrder: 15,
    acronym: "LYDO",
    location: "Municipal Hall Complex, San Felipe, Zambales",
    isVerified: true,
  },
  {
    id: "municipal-ecological-and-natural-resources-office",
    slug: "municipal-ecological-and-natural-resources-office",
    name: "Municipal Ecological and Natural Resources Office",
    displayOrder: 16,
    acronym: "",
    location: "Municipal Hall Complex, San Felipe, Zambales",
    isVerified: true,
  },
  {
    id: "human-resource-management-office",
    slug: "human-resource-management-office",
    name: "Human Resource Management Office",
    displayOrder: 17,
    acronym: "HRMO",
    location: "2nd Floor, Municipal Hall Complex, San Felipe, Zambales",
    isVerified: true,
  },
  {
    id: "public-employment-service-office",
    slug: "public-employment-service-office",
    name: "Public Employment Service Office",
    displayOrder: 18,
    acronym: "PESO",
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
