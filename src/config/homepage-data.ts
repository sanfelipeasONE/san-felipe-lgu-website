/**
 * Centralized Demo & Placeholder Data for the San Felipe LGU Homepage (Phase 2)
 *
 * NOTE: Per Project Rule 22, unverified municipal contact numbers, officials,
 * and announcements are explicitly tagged as placeholders until verified
 * client data or CMS database records are integrated in future phases.
 */

export const ADVISORY_DATA = {
  badge: "LATEST ADVISORY",
  title: "SCHEDULE: ADVISORY ON THE CONDUCT OF ROAD CLEARING AND TREE TRIMMING OPERATIONS ALONG NATIONAL HIGHWAY",
  date: "October 31, 2024 (Demo)",
  href: "/news/road-clearing-advisory-demo",
};

export interface ServiceItem {
  id: string;
  title: string;
  description: string;
  actionText: string;
  href: string;
  iconName: "file-text" | "building" | "download" | "briefcase" | "phone";
  topAccentColor: string; // Tailwind class
}

export const SERVICES_DATA: ServiceItem[] = [
  {
    id: "citizens-charter",
    title: "Citizen's Charter",
    description: "Detailed service standards, processing requirements, and step-by-step procedures for frontline transactions.",
    actionText: "View Service Guide",
    href: "/services/citizens-charter",
    iconName: "file-text",
    topAccentColor: "border-t-blue-600",
  },
  {
    id: "business-permits",
    title: "Business Permits",
    description: "New business registration and annual renewal process, requirements, and compliance guidelines.",
    actionText: "Apply / Inquire",
    href: "/services/business-permits",
    iconName: "building",
    topAccentColor: "border-t-amber-500",
  },
  {
    id: "downloadable-forms",
    title: "Downloadable Forms",
    description: "Official municipal application forms, clearance templates, and request documents ready for download.",
    actionText: "Download Forms",
    href: "/services/forms",
    iconName: "download",
    topAccentColor: "border-t-burgundy-700",
  },
  {
    id: "job-opportunities",
    title: "Job Opportunities",
    description: "Current municipal government vacancies, eligibility requirements, and application procedures via PESO.",
    actionText: "Browse Openings",
    href: "/services/careers",
    iconName: "briefcase",
    topAccentColor: "border-t-indigo-600",
  },
  {
    id: "emergency-hotlines",
    title: "Emergency Hotlines",
    description: "24/7 direct municipal emergency telephone numbers for disaster response, police, medical, and fire rescue.",
    actionText: "View Directory",
    href: "#emergency-hotlines",
    iconName: "phone",
    topAccentColor: "border-t-red-600",
  },
];

export interface OfficialItem {
  name: string;
  role: string;
  officeTitle: string;
  quote: string;
  imageAlt: string;
  isMayor?: boolean;
}

export const OFFICIALS_DATA = {
  mayor: {
    name: 'HON. ENGR. REINHARD "HART" E. JERESANO',
    role: "Municipal Mayor",
    officeTitle: "OFFICE OF THE MUNICIPAL MAYOR",
    subtitle: "Municipal Mayor, San Felipe, Zambales",
    quote: "Serbisyong May Puso",
    imageAlt: "Hon. Engr. Reinhard Hart E. Jeresano, Municipal Mayor of San Felipe, Zambales",
  },
  viceMayor: {
    name: "HON. VICE-MAYOR MARY ANN R. QUIBA",
    role: "Municipal Vice Mayor",
    officeTitle: "OFFICE OF THE SANGGUNIANG BAYAN",
    subtitle: "Municipal Vice Mayor & SB Presiding Officer",
    committee: "Chairwoman, ADHOC Committee on Legislative and Executive Affairs",
    quote: "Serbisyong Todo-Todo Mula Noon Hanggang Ngayon",
    imageAlt: "Hon. Vice-Mayor Mary Ann R. Quiba, Municipal Vice Mayor of San Felipe, Zambales",
  },
};

export interface OfficeItem {
  name: string;
  acronym?: string;
  description: string;
  href: string;
  iconName: "briefcase" | "gavel" | "compass" | "wrench" | "landmark" | "file-spreadsheet" | "heart" | "activity" | "shield-alert";
}

export const OFFICES_DATA: OfficeItem[] = [
  {
    name: "Office of the Mayor",
    acronym: "OM",
    description: "Executive leadership, overall municipal administration, and citizen assistance programs.",
    href: "/offices",
    iconName: "briefcase",
  },
  {
    name: "Office of the Sangguniang Bayan",
    acronym: "OSB",
    description: "The legislative branch of the municipality, formulating municipal ordinances and resolutions.",
    href: "/offices",
    iconName: "gavel",
  },
  {
    name: "Municipal Planning and Development Office",
    acronym: "MPDO",
    description: "Formulates comprehensive socio-economic development plans, zoning policies, and infrastructure roadmaps.",
    href: "/offices",
    iconName: "compass",
  },
  {
    name: "Municipal Engineering Office",
    acronym: "MEO",
    description: "Building permits, infrastructure monitoring, public works maintenance, and structural safety.",
    href: "/offices",
    iconName: "wrench",
  },
  {
    name: "Municipal Treasury Office",
    acronym: "MTO",
    description: "Local revenue collection, business taxes, community tax certificates, and municipal treasury funds.",
    href: "/offices",
    iconName: "landmark",
  },
  {
    name: "Municipal Assessor’s Office",
    acronym: "MAO",
    description: "Real property assessment, tax declarations, property valuation records, and cadastral mapping.",
    href: "/offices",
    iconName: "file-spreadsheet",
  },
  {
    name: "Municipal Social Welfare and Development Office",
    acronym: "MSWDO",
    description: "Social assistance programs, senior citizen and PWD benefits, family counseling, and emergency relief.",
    href: "/offices",
    iconName: "heart",
  },
  {
    name: "Municipal Health Office",
    acronym: "MHO",
    description: "Primary healthcare, immunization, maternal health, sanitary inspections, and community medicine.",
    href: "/offices",
    iconName: "activity",
  },
  {
    name: "Municipal Disaster Risk Reduction and Management Office",
    acronym: "MDRRMO",
    description: "24/7 disaster preparedness, disaster response operations, search and rescue, and weather monitoring.",
    href: "/offices",
    iconName: "shield-alert",
  },
];

export interface NewsItem {
  id: string;
  title: string;
  category: string;
  publishingOffice: string;
  date: string;
  excerpt: string;
  href: string;
  isFeatured?: boolean;
}

export const NEWS_DATA = {
  featured: {
    id: "undas-2024-advisory",
    title: "ARAW NG MGA PATAY 2024: MUNICIPAL ADVISORY & SAFETY GUIDELINES",
    category: "ADVISORY & EVENTS",
    publishingOffice: "MDRRMO & Office of the Mayor",
    date: "October 31, 2024 (Demo)",
    excerpt: "The Municipal Government of San Felipe announces public guidelines, traffic rerouting, cemetery visiting hours, and emergency station locations for Undas 2024.",
    href: "/news/araw-ng-patay-2024-advisory-demo",
  },
  secondary: [
    {
      id: "business-tax-renewal",
      title: "Notice on Early Business Permit Renewal & Tax Amnesty Guidelines",
      category: "TREASURY & PERMITS",
      publishingOffice: "BPLO & Municipal Treasury",
      date: "October 28, 2024 (Demo)",
      excerpt: "Business owners are advised of the upcoming renewal period and requirements for FY 2025 operations.",
      href: "/news/business-permit-renewal-notice-demo",
    },
    {
      id: "coastal-cleanup-drive",
      title: "Annual Municipal Coastal Cleanup & Mangrove Tree Planting Project",
      category: "ENVIRONMENT & TOURISM",
      publishingOffice: "MENRO & Tourism Office",
      date: "October 20, 2024 (Demo)",
      excerpt: "Volunteers, barangay councils, and civic groups unite along the San Felipe coast to protect marine ecosystems.",
      href: "/news/coastal-cleanup-mangrove-demo",
    },
    {
      id: "medical-mission-schedule",
      title: "Free Healthcare Screening & Immunization Mission Across Barangays",
      category: "HEALTH SERVICES",
      publishingOffice: "Municipal Health Office",
      date: "October 15, 2024 (Demo)",
      excerpt: "The Municipal Health Office deploys mobile clinical teams providing primary consultations and free medicine.",
      href: "/news/free-health-mission-demo",
    },
  ],
};

export interface TransparencyItem {
  title: string;
  description: string;
  code: string;
  href: string;
}

export const TRANSPARENCY_DATA: TransparencyItem[] = [
  {
    title: "Full Disclosure Policy",
    description: "Compliance records posted in accordance with DILG Memorandum Circulars on public financial postings.",
    code: "FDP-2024",
    href: "/transparency#fdp",
  },
  {
    title: "Annual Budget",
    description: "Approved Annual Executive Budget, internal revenue allotment utilization, and capital expenditure reports.",
    code: "AEB-2024",
    href: "/transparency#budget",
  },
  {
    title: "Financial Reports",
    description: "Quarterly statement of receipts and expenditures, cash flow, and Commission on Audit (COA) compliance.",
    code: "SRE-Q3",
    href: "/transparency#financials",
  },
  {
    title: "Bids & Awards Committee",
    description: "Invitations to Bid, Minutes of Bidding Conferences, and Bid Evaluation Reports under RA 9184.",
    code: "BAC-PROC",
    href: "/transparency#bac",
  },
  {
    title: "Procurement Monitoring",
    description: "Annual Procurement Plan (APP), Notice of Award, Notice to Proceed, and purchase records.",
    code: "APP-FY24",
    href: "/transparency#procurement",
  },
  {
    title: "Ordinances & Resolutions",
    description: "Official municipal legislative enactments, executive orders, and administrative resolutions.",
    code: "SB-LEGIS",
    href: "/transparency#ordinances",
  },
];

export interface EmergencyItem {
  name: string;
  office: string;
  numbers: string[];
  imageSrc: string;
  imageAlt: string;
}

export const EMERGENCY_DATA: EmergencyItem[] = [
  {
    name: "MDRRMO San Felipe",
    office: "Municipal Disaster Risk Reduction & Management",
    numbers: ["0929-183-8441"],
    imageSrc: "/images/mdrrmo-sfz.jpg",
    imageAlt: "MDRRMO San Felipe Official Logo",
  },
  {
    name: "San Felipe Mps Zppo",
    office: "Philippine National Police (PNP)",
    numbers: ["0998-598-5509"],
    imageSrc: "/images/sfz-pnp.png",
    imageAlt: "San Felipe MPS ZPPO Official Logo",
  },
  {
    name: "BFP R3 San Felipe Fire Station - Zambales",
    office: "Bureau of Fire Protection (BFP)",
    numbers: ["0946-451-2121"],
    imageSrc: "/images/bfp-sfz.jpg",
    imageAlt: "BFP R3 San Felipe Fire Station Official Logo",
  },
  {
    name: "RHU San Felipe",
    office: "Rural Health Unit (RHU)",
    numbers: ["0931-793-8035"],
    imageSrc: "/images/rhu-sfz.jpg",
    imageAlt: "RHU San Felipe Official Logo",
  },
];

export const MUNICIPAL_CONTACT_DATA = {
  hallName: "San Felipe Town Hall",
  hallSubtitle: "Municipal Government Center Compound",
  address: "Municipal Hall Compound, National Highway, San Felipe, Zambales 2204 (Placeholder)",
  hours: "Monday - Friday: 8:00 AM - 5:00 PM (Except Holidays)",
  phone: "(047) 000-0000 (Placeholder)",
  email: "info@sanfelipe.gov.ph (Placeholder)",
  facebook: "facebook.com/sanfelipegov (Placeholder)",
  mapAdvisory: "Public Advisory: The Municipal Hall is conveniently situated along the National Highway, accessible via public bus and provincial transit routes.",
};
