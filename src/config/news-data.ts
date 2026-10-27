import { ASSETS, type AssetProvenance } from "@/config/assets";

export type NewsType = "news" | "announcement" | "advisory" | "notice";

export interface ArticleBodyBlock {
  type: "p" | "h2" | "h3" | "ul" | "callout";
  content?: string;
  items?: string[];
  calloutType?: "info" | "warning" | "advisory";
}

export interface ArticleAttachment {
  id: string;
  name: string;
  fileType: string;
  fileSize: string;
  downloadUrl?: string;
  isAvailable: boolean;
}

export interface PublishingOffice {
  id: string;
  name: string;
  slug: string;
  acronym?: string;
}

export interface NewsArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: ArticleBodyBlock[];
  type: NewsType;
  category: string;
  publishingOffice?: PublishingOffice;
  publishedAt: string; // ISO date
  publishedAtFormatted: string;
  year: string;
  featuredImage?: {
    src: string;
    alt: string;
    provenance: AssetProvenance;
  };
  attachments?: ArticleAttachment[];
  isFeatured?: boolean;
  isImportant?: boolean;
  isPrototypeContent: boolean;
  status: "published" | "draft" | "archived";
}

/**
 * Centrally managed prototype news & announcements dataset for Phase 4.
 * Explicitly marked as prototype content to ensure documentation integrity.
 */
export const NEWS_ARTICLES: NewsArticle[] = [
  {
    id: "news-001",
    slug: "road-clearing-tree-trimming-operations-national-highway",
    title: "Advisory on Road Clearing and Preventive Tree Trimming Operations Along National Highway",
    excerpt: "The Municipal Disaster Risk Reduction and Management Office announces scheduled preventive roadside clearing and vegetation management along the San Felipe national highway corridor.",
    type: "advisory",
    category: "PUBLIC SAFETY & INFRASTRUCTURE",
    publishingOffice: {
      id: "mdrrmo",
      name: "Municipal Disaster Risk Reduction & Management Office",
      slug: "mdrrmo",
      acronym: "MDRRMO",
    },
    publishedAt: "2025-10-31",
    publishedAtFormatted: "October 31, 2025",
    year: "2025",
    featuredImage: {
      src: ASSETS.news.undasBanner.src,
      alt: "Road clearing and municipal safety advisory banner (Design placeholder)",
      provenance: ASSETS.news.undasBanner.provenance,
    },
    attachments: [
      {
        id: "att-001",
        name: "MDRRMO-Advisory-Road-Safety-Guidelines.pdf",
        fileType: "PDF",
        fileSize: "1.4 MB",
        isAvailable: false,
      },
      {
        id: "att-002",
        name: "Traffic-Rerouting-Corridor-Map.pdf",
        fileType: "PDF",
        fileSize: "2.1 MB",
        isAvailable: false,
      },
    ],
    isFeatured: true,
    isImportant: true,
    isPrototypeContent: true,
    status: "published",
    body: [
      {
        type: "p",
        content:
          "In coordination with the Department of Public Works and Highways and local barangay councils, the Municipal Disaster Risk Reduction and Management Office (MDRRMO) will conduct scheduled preventive tree trimming and road clearing operations along designated sections of the national highway.",
      },
      {
        type: "callout",
        calloutType: "advisory",
        content:
          "Motorists and commuters are advised to observe traffic marshals, maintain safe braking distances, and anticipate intermittent lane stops during scheduled daytime operations.",
      },
      {
        type: "h2",
        content: "Operation Objectives & Public Safety Measures",
      },
      {
        type: "p",
        content:
          "The initiative focuses on mitigating hazards caused by overgrown tree branches encroaching on utility lines, clearing obstruction points along pedestrian lanes, and reinforcing stormwater drainage clearance across frontline barangays.",
      },
      {
        type: "ul",
        items: [
          "Vegetation trimming of overhead branches within clearance safety zones",
          "Removal of roadside debris and temporary sidewalk obstructions",
          "Inspection of emergency drainage inlets and culverts",
          "Deployment of municipal traffic enforcers and emergency medical standby units",
        ],
      },
      {
        type: "h2",
        content: "Citizen Cooperation & Advisory Desks",
      },
      {
        type: "p",
        content:
          "Residents with properties adjacent to the operations are requested to coordinate with their respective barangay halls regarding designated green-waste collection schedules. For queries or roadside concerns, the public may reach out to municipal assistance desks.",
      },
    ],
  },
  {
    id: "news-002",
    slug: "schedule-business-permit-licensing-renewal-2026",
    title: "Schedule and Guidelines for Business Permit Licensing and Annual Renewal FY 2026",
    excerpt: "The Business Permits and Licensing Office issues step-by-step procedures, documentary requirements, and electronic assessment guidelines for the upcoming municipal business registration cycle.",
    type: "announcement",
    category: "COMMERCE & LICENSING",
    publishingOffice: {
      id: "bplo",
      name: "Business Permits and Licensing Office",
      slug: "bplo",
      acronym: "BPLO",
    },
    publishedAt: "2025-10-28",
    publishedAtFormatted: "October 28, 2025",
    year: "2025",
    featuredImage: {
      src: ASSETS.news.placeholder.src,
      alt: "Business permit renewal information notice (Design placeholder)",
      provenance: ASSETS.news.placeholder.provenance,
    },
    attachments: [
      {
        id: "att-003",
        name: "BPLO-Business-Permit-Checklist-2026.pdf",
        fileType: "PDF",
        fileSize: "850 KB",
        isAvailable: false,
      },
    ],
    isFeatured: true,
    isImportant: false,
    isPrototypeContent: true,
    status: "published",
    body: [
      {
        type: "p",
        content:
          "The Business Permits and Licensing Office (BPLO) encourages commercial establishments, cooperatives, and sole proprietors operating within the Municipality of San Felipe to review the documentary checklist and processing schedule for Fiscal Year 2026.",
      },
      {
        type: "h2",
        content: "Core Renewal Requirements",
      },
      {
        type: "ul",
        items: [
          "Duly accomplished Unified Business Permit Application Form",
          "Barangay Business Clearance from the host barangay",
          "Previous year Official Receipt of municipal business tax payment",
          "Comprehensive General Liability Insurance / Fire Safety Inspection Certificate",
          "Sanitary Permit and Health Certificates for food and service establishments",
        ],
      },
      {
        type: "callout",
        calloutType: "info",
        content:
          "To avoid processing queues, taxpayers are encouraged to complete preliminary document verification at the Business One-Stop Shop (BOSS) frontline counters.",
      },
    ],
  },
  {
    id: "news-003",
    slug: "annual-municipal-coastal-cleanup-mangrove-planting",
    title: "Annual Municipal Coastal Cleanup and Mangrove Restoration Initiative Along San Felipe Coast",
    excerpt: "Volunteer organizations, student groups, and municipal staff unite across coastal barangays to conduct environmental monitoring, beach cleanup, and mangrove seedling propagation.",
    type: "news",
    category: "ENVIRONMENT & NATURAL RESOURCES",
    publishingOffice: {
      id: "menro",
      name: "Municipal Environment & Natural Resources Office",
      slug: "menro",
      acronym: "MENRO",
    },
    publishedAt: "2025-10-20",
    publishedAtFormatted: "October 20, 2025",
    year: "2025",
    featuredImage: {
      src: ASSETS.news.placeholder.src,
      alt: "Coastal cleanup environmental documentation (Design placeholder)",
      provenance: ASSETS.news.placeholder.provenance,
    },
    isFeatured: true,
    isImportant: false,
    isPrototypeContent: true,
    status: "published",
    body: [
      {
        type: "p",
        content:
          "The Municipal Environment and Natural Resources Office (MENRO), in partnership with coastal barangay councils, spearheaded the annual community coastal cleanup drive and mangrove propagation activity along the shores of San Felipe.",
      },
      {
        type: "h2",
        content: "Protecting Marine Biodiversity and Coastal Buffer Zones",
      },
      {
        type: "p",
        content:
          "Participants collected segregated recyclable materials and marine debris, while environment officers conducted an orientation on preserving natural foreshore vegetation. Over 500 mangrove propagules were prepared for nursery acclimatization.",
      },
      {
        type: "p",
        content:
          "MENRO continues to monitor shoreline water quality and invites community members to participate in continuing ecological stewardship programs.",
      },
    ],
  },
  {
    id: "news-004",
    slug: "mobile-healthcare-screening-immunization-mission-barangays",
    title: "Mobile Healthcare Screening and Immunization Drive Deployed to Upland and Coastal Communities",
    excerpt: "The Municipal Health Office mobilizes clinical teams to provide free primary medical consultations, diagnostic screenings, and routine pediatric vaccinations.",
    type: "news",
    category: "PUBLIC HEALTH & SOCIAL SERVICES",
    publishingOffice: {
      id: "mho",
      name: "Municipal Health Office",
      slug: "mho",
      acronym: "MHO",
    },
    publishedAt: "2025-10-15",
    publishedAtFormatted: "October 15, 2025",
    year: "2025",
    featuredImage: {
      src: ASSETS.news.placeholder.src,
      alt: "Municipal healthcare mission documentation (Design placeholder)",
      provenance: ASSETS.news.placeholder.provenance,
    },
    isFeatured: false,
    isImportant: false,
    isPrototypeContent: true,
    status: "published",
    body: [
      {
        type: "p",
        content:
          "As part of the municipal government's commitment to accessible public healthcare, the Municipal Health Office (MHO) has rolled out mobile clinical outreach missions across barangay health stations.",
      },
      {
        type: "h2",
        content: "Offered Medical Services",
      },
      {
        type: "ul",
        items: [
          "General primary medical examinations and blood pressure screening",
          "Pediatric growth monitoring and routine immunization",
          "Maternal prenatal wellness counseling and nutrition education",
          "Distribution of essential maintenance medicines and vitamins",
        ],
      },
      {
        type: "p",
        content:
          "Patients requiring specialized interventions are provided referral documentation to district healthcare facilities. Residents may inquire with their Barangay Health Workers for station schedules.",
      },
    ],
  },
  {
    id: "news-005",
    slug: "public-notice-schedule-real-property-tax-assessment-discounts",
    title: "Public Notice: Early Payment Discounts for Real Property Tax Assessment FY 2026",
    excerpt: "The Municipal Treasurer's Office advises all real property owners of prompt payment discounts available for advance tax settlement of land, buildings, and improvements.",
    type: "notice",
    category: "TREASURY & TAXATION",
    publishingOffice: {
      id: "mto",
      name: "Municipal Treasurer's Office",
      slug: "mto",
      acronym: "MTO",
    },
    publishedAt: "2025-10-10",
    publishedAtFormatted: "October 10, 2025",
    year: "2025",
    featuredImage: {
      src: ASSETS.news.placeholder.src,
      alt: "Real property tax notice graphic (Design placeholder)",
      provenance: ASSETS.news.placeholder.provenance,
    },
    attachments: [
      {
        id: "att-004",
        name: "MTO-Tax-Discount-Schedule-2026.pdf",
        fileType: "PDF",
        fileSize: "620 KB",
        isAvailable: false,
      },
    ],
    isFeatured: false,
    isImportant: false,
    isPrototypeContent: true,
    status: "published",
    body: [
      {
        type: "p",
        content:
          "The Municipal Treasurer's Office announces the schedule of prompt payment discounts for the payment of the Basic Real Property Tax (RPT) and Special Education Fund (SEF) for the calendar year 2026.",
      },
      {
        type: "h2",
        content: "Discount Tiers for Prompt Settlement",
      },
      {
        type: "p",
        content:
          "Property owners who pay their annual real property taxes in advance or on time may avail of early payment incentives pursuant to the local revenue code:",
      },
      {
        type: "ul",
        items: [
          "Twenty percent (20%) discount for full advance payments settled on or before December 31",
          "Ten percent (10%) discount for prompt payments settled within the first quarter calendar period",
          "Installment payment option available across four regular quarterly installments",
        ],
      },
      {
        type: "callout",
        calloutType: "info",
        content:
          "Payments may be processed at the Treasury Hall cashier counters. Property owners are requested to bring their latest official tax receipt and tax declaration number.",
      },
    ],
  },
  {
    id: "news-006",
    slug: "peso-announces-special-recruitment-skills-training-program",
    title: "PESO Announces Special Local Recruitment Activity and Technical Skills Training Programs",
    excerpt: "In partnership with regional employers and vocational training institutes, the Public Employment Service Office conducts a community job fair and livelihood capability training.",
    type: "announcement",
    category: "LIVELIHOOD & CAREERS",
    publishingOffice: {
      id: "peso",
      name: "Public Employment Service Office",
      slug: "peso",
      acronym: "PESO",
    },
    publishedAt: "2025-10-05",
    publishedAtFormatted: "October 05, 2025",
    year: "2025",
    featuredImage: {
      src: ASSETS.news.placeholder.src,
      alt: "PESO employment recruitment notice (Design placeholder)",
      provenance: ASSETS.news.placeholder.provenance,
    },
    isFeatured: false,
    isImportant: false,
    isPrototypeContent: true,
    status: "published",
    body: [
      {
        type: "p",
        content:
          "The Public Employment Service Office (PESO) invites jobseekers, high school and college graduates, and displaced workers to take part in the upcoming Municipal Special Recruitment Activity.",
      },
      {
        type: "h2",
        content: "Participating Sectors & Qualifications",
      },
      {
        type: "p",
        content:
          "Participating accredited employers are offering vacancies in administrative support, customer relations, retail management, logistics, and skilled trades. Free pre-employment registration assistance will be provided on-site.",
      },
      {
        type: "p",
        content:
          "Applicants are advised to bring multiple copies of their updated resume, government IDs, and training credentials.",
      },
    ],
  },
  {
    id: "news-007",
    slug: "notice-public-hearing-proposed-municipal-zoning-ordinance",
    title: "Notice of Public Hearing: Comprehensive Land Use Plan and Proposed Municipal Zoning Ordinance",
    excerpt: "The Municipal Planning and Development Office invites community stakeholders, agricultural associations, and business owners to a public consultation on updated spatial zoning.",
    type: "notice",
    category: "URBAN PLANNING & POLICY",
    publishingOffice: {
      id: "mpdo",
      name: "Municipal Planning & Development Office",
      slug: "mpdo",
      acronym: "MPDO",
    },
    publishedAt: "2025-09-28",
    publishedAtFormatted: "September 28, 2025",
    year: "2025",
    featuredImage: {
      src: ASSETS.news.placeholder.src,
      alt: "Zoning consultation announcement (Design placeholder)",
      provenance: ASSETS.news.placeholder.provenance,
    },
    isFeatured: false,
    isImportant: false,
    isPrototypeContent: true,
    status: "published",
    body: [
      {
        type: "p",
        content:
          "Notice is hereby given that the Municipal Planning and Development Office (MPDO), in joint session with the Sangguniang Bayan Committee on Land Use, will conduct a formal public hearing on the proposed Comprehensive Land Use Plan (CLUP) updates.",
      },
      {
        type: "h2",
        content: "Agenda Items for Discussion",
      },
      {
        type: "ul",
        items: [
          "Review of agricultural and environmental conservation zone boundaries",
          "Expansion of commercial and light institutional development corridors",
          "Disaster risk reduction buffers along river systems and shoreline zones",
          "Public feedback and stakeholder position paper submission protocols",
        ],
      },
    ],
  },
  {
    id: "news-008",
    slug: "water-service-maintenance-scheduled-interruption-notice",
    title: "Water Service Advisory: Scheduled Preventive Upgrades for Central Distribution System",
    excerpt: "The Municipal Engineering Office advises residents of central barangays regarding temporary pressure reduction during scheduled pipeline maintenance and pressure testing.",
    type: "advisory",
    category: "UTILITIES & PUBLIC WORKS",
    publishingOffice: {
      id: "meo",
      name: "Municipal Engineering Office",
      slug: "meo",
      acronym: "MEO",
    },
    publishedAt: "2025-09-18",
    publishedAtFormatted: "September 18, 2025",
    year: "2025",
    featuredImage: {
      src: ASSETS.news.placeholder.src,
      alt: "Municipal water engineering maintenance (Design placeholder)",
      provenance: ASSETS.news.placeholder.provenance,
    },
    isFeatured: false,
    isImportant: false,
    isPrototypeContent: true,
    status: "published",
    body: [
      {
        type: "p",
        content:
          "The Municipal Engineering Office (MEO) issues this public utility advisory regarding scheduled preventive maintenance on the primary distribution lines serving central barangay corridors.",
      },
      {
        type: "callout",
        calloutType: "advisory",
        content:
          "Affected households are encouraged to store adequate water supplies prior to the commencement of maintenance hours. Water tankers will remain on standby for emergency facility needs.",
      },
      {
        type: "h2",
        content: "Restoration Schedule",
      },
      {
        type: "p",
        content:
          "Full service pressure is anticipated to normalize progressively following line flushing. The municipality appreciates the public's understanding as we upgrade civic infrastructure.",
      },
    ],
  },
];

// Helper queries for presentation
export function getAllPublishedArticles(): NewsArticle[] {
  return NEWS_ARTICLES.filter((article) => article.status === "published").sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

export function getFeaturedArticles(): {
  primary: NewsArticle;
  secondary: NewsArticle[];
} {
  const all = getAllPublishedArticles();
  const featured = all.filter((a) => a.isFeatured);
  const primary = featured[0] || all[0];
  const secondary = featured.slice(1, 4).length > 0 ? featured.slice(1, 4) : all.slice(1, 4);
  return { primary, secondary };
}

export function getLatestImportantAdvisory(): NewsArticle | undefined {
  return getAllPublishedArticles().find((a) => a.isImportant);
}

export function getArticleBySlug(slug: string): NewsArticle | undefined {
  return NEWS_ARTICLES.find((a) => a.slug === slug && a.status === "published");
}

export function getRelatedArticles(
  currentSlug: string,
  limit: number = 3
): NewsArticle[] {
  const current = getArticleBySlug(currentSlug);
  if (!current) return [];

  const others = getAllPublishedArticles().filter((a) => a.slug !== currentSlug);

  // Match by office first, then by type
  const currentOfficeId = current.publishingOffice?.id;
  const matchedOffice = currentOfficeId
    ? others.filter((a) => a.publishingOffice?.id === currentOfficeId)
    : [];
  const matchedType = others.filter(
    (a) => a.type === current.type && (!currentOfficeId || a.publishingOffice?.id !== currentOfficeId)
  );
  const remaining = others.filter(
    (a) =>
      (!currentOfficeId || a.publishingOffice?.id !== currentOfficeId) &&
      a.type !== current.type
  );

  return [...matchedOffice, ...matchedType, ...remaining].slice(0, limit);
}

export function getOtherArticles(
  currentSlug: string,
  limit: number = 4
): NewsArticle[] {
  return getAllPublishedArticles()
    .filter((a) => a.slug !== currentSlug)
    .slice(0, limit);
}

export function getFilterMetadata() {
  const all = getAllPublishedArticles();

  const types: { value: string; label: string }[] = [
    { value: "all", label: "All Types" },
    { value: "news", label: "News" },
    { value: "announcement", label: "Announcement" },
    { value: "advisory", label: "Advisory" },
    { value: "notice", label: "Public Notice" },
  ];

  const officeMap = new Map<string, string>();
  all.forEach((a) => {
    if (a.publishingOffice) {
      officeMap.set(a.publishingOffice.id, a.publishingOffice.name);
    }
  });
  const offices: { value: string; label: string }[] = [
    { value: "all", label: "All Offices" },
    ...Array.from(officeMap.entries()).map(([id, name]) => ({
      value: id,
      label: name,
    })),
  ];

  const yearSet = new Set<string>();
  all.forEach((a) => yearSet.add(a.year));
  const years: { value: string; label: string }[] = [
    { value: "all", label: "All Years" },
    ...Array.from(yearSet).map((yr) => ({ value: yr, label: yr })),
  ];

  return { types, offices, years };
}
