/**
 * Centralized Demo & Placeholder Data for the San Felipe LGU Homepage (Phase 2)
 *
 * NOTE: Per Project Rule 22, unverified municipal contact numbers, officials,
 * and announcements are explicitly tagged as placeholders until verified
 * client data or CMS database records are integrated in future phases.
 */

export interface AdvisoryItem {
  badge: string;
  title: string;
  date: string;
  href: string;
}

export const ADVISORIES_DATA: AdvisoryItem[] = [
  {
    badge: "LATEST ADVISORY",
    title: "SCHEDULE: ADVISORY ON THE CONDUCT OF ROAD CLEARING AND TREE TRIMMING OPERATIONS ALONG NATIONAL HIGHWAY",
    date: "October 31, 2024",
    href: "/news/road-clearing-tree-trimming-operations-national-highway",
  },
  {
    badge: "PUBLIC NOTICE",
    title: "SCHEDULE: BUSINESS PERMIT & LICENSING RENEWAL PERIOD FOR CALENDAR YEAR 2026",
    date: "January 5, 2026",
    href: "/news/schedule-business-permit-licensing-renewal-2026",
  },
];

export const ADVISORY_DATA = ADVISORIES_DATA[0];

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
    href: "/services/downloadable-forms",
    iconName: "download",
    topAccentColor: "border-t-burgundy-700",
  },
  {
    id: "job-opportunities",
    title: "Job Opportunities",
    description: "Current municipal government vacancies, eligibility requirements, and application procedures via PESO.",
    actionText: "Browse Openings",
    href: "/services/job-opportunities",
    iconName: "briefcase",
    topAccentColor: "border-t-indigo-600",
  },
  {
    id: "emergency-hotlines",
    title: "Emergency Hotlines",
    description: "24/7 direct municipal emergency telephone numbers for disaster response, police, medical, and fire rescue.",
    actionText: "View Directory",
    href: "/#emergency-hotlines",
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
    description: "Executive leadership, overall municipal administration, and citizen assistance programs.",
    href: "/offices",
    iconName: "briefcase",
  },
  {
    name: "Office of the Sangguniang Bayan",
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
    description: "Building permits, infrastructure monitoring, public works maintenance, and structural safety.",
    href: "/offices",
    iconName: "wrench",
  },
  {
    name: "Municipal Treasury Office",
    description: "Local revenue collection, business taxes, community tax certificates, and municipal treasury funds.",
    href: "/offices",
    iconName: "landmark",
  },
  {
    name: "Municipal Assessor’s Office",
    description: "Real property assessment, tax declarations, property valuation records, and cadastral mapping.",
    href: "/offices",
    iconName: "file-spreadsheet",
  },
  {
    name: "Municipal Social Welfare and Development Office",
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
  imageUrl?: string;
  imageAlt?: string;
}


export const NEWS_DATA = {
  featured: {
    id: "road-clearing-tree-trimming-operations-national-highway",
    title: "Advisory on Road Clearing and Preventive Tree Trimming Operations Along National Highway",
    category: "PUBLIC SAFETY & INFRASTRUCTURE",
    publishingOffice: "MDRRMO",
    date: "October 31, 2025",
    excerpt: "The Municipal Disaster Risk Reduction and Management Office announces scheduled preventive roadside clearing and vegetation management along the San Felipe national highway corridor.",
    href: "/news/road-clearing-tree-trimming-operations-national-highway",
  },
  secondary: [
    {
      id: "schedule-business-permit-licensing-renewal-2026",
      title: "Schedule and Guidelines for Business Permit Licensing and Annual Renewal FY 2026",
      category: "COMMERCE & LICENSING",
      publishingOffice: "BPLO",
      date: "October 28, 2025",
      excerpt: "The Business Permits and Licensing Office issues step-by-step procedures, documentary requirements, and electronic assessment guidelines for the upcoming municipal business registration cycle.",
      href: "/news/schedule-business-permit-licensing-renewal-2026",
    },
    {
      id: "annual-municipal-coastal-cleanup-mangrove-planting",
      title: "Annual Municipal Coastal Cleanup and Mangrove Restoration Initiative Along San Felipe Coast",
      category: "ENVIRONMENT & NATURAL RESOURCES",
      publishingOffice: "MENRO",
      date: "October 20, 2025",
      excerpt: "Volunteer organizations, student groups, and municipal staff unite across coastal barangays to conduct environmental monitoring, beach cleanup, and mangrove seedling propagation.",
      href: "/news/annual-municipal-coastal-cleanup-mangrove-planting",
    },
    {
      id: "mobile-healthcare-screening-immunization-mission-barangays",
      title: "Mobile Primary Healthcare Screening and Immunization Drive Across Barangays",
      category: "HEALTH & WELLNESS",
      publishingOffice: "Municipal Health Office",
      date: "October 15, 2025",
      excerpt: "The Municipal Health Office deploys mobile clinical teams providing primary consultations, vital signs checks, and routine pediatric immunizations.",
      href: "/news/mobile-healthcare-screening-immunization-mission-barangays",
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
    href: "#",
  },
  {
    title: "Annual Budget",
    description: "Approved Annual Executive Budget, internal revenue allotment utilization, and capital expenditure reports.",
    code: "AEB-2024",
    href: "#",
  },
  {
    title: "Financial Reports",
    description: "Quarterly statement of receipts and expenditures, cash flow, and Commission on Audit (COA) compliance.",
    code: "SRE-Q3",
    href: "#",
  },
  {
    title: "Bids & Awards Committee",
    description: "Invitations to Bid, Minutes of Bidding Conferences, and Bid Evaluation Reports under RA 9184.",
    code: "BAC-PROC",
    href: "#",
  },
  {
    title: "Procurement Monitoring",
    description: "Annual Procurement Plan (APP), Notice of Award, Notice to Proceed, and purchase records.",
    code: "APP-FY24",
    href: "#",
  },
  {
    title: "Ordinances & Resolutions",
    description: "Official municipal legislative enactments, executive orders, and administrative resolutions.",
    code: "SB-LEGIS",
    href: "#",
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
  hallName: "San Felipe Municipal Hall",
  hallSubtitle: "Municipal Government Center Compound",
  address: "Municipal Hall Compound, National Highway, San Felipe, Zambales 2204",
  hours: "Monday - Friday: 8:00 AM - 5:00 PM",
  phone: "0969-540-9138",
  email: "lgu.sanfelipe@gmail.com",
  facebook: "facebook.com/sanfelipeasone",
  facebookUrl: "https://www.facebook.com/sanfelipeasone",
  mapAdvisory: "Public Advisory: The Municipal Hall is conveniently situated along the National Highway, accessible via public bus and provincial transit routes.",
};
