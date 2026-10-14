/**
 * Public Services Data Architecture for San Felipe, Zambales.
 *
 * PROVENANCE: DESIGN_PLACEHOLDER / PENDING_CMS_PUBLICATION
 * This file establishes the typed data structures and public query functions
 * for the Municipality's four public service modules:
 * 1. Citizen's Charter (/services/citizens-charter)
 * 2. Business Permits (/services/business-permits)
 * 3. Downloadable Forms (/services/downloadable-forms)
 * 4. Job Opportunities (/services/job-opportunities)
 *
 * All datasets default to empty collections or pending states to strictly prevent
 * fabricating municipal transactions, fees, requirements, or vacancies before
 * official CMS content approval.
 */

// ============================================================
// 1. CITIZEN'S CHARTER TYPES & CONTRACTS
// ============================================================

export interface CitizensCharterRequirement {
  document: string;
  whereToSecure: string;
  notes?: string;
}

export interface CitizensCharterStep {
  stepNumber: number;
  clientAction: string;
  agencyAction: string;
  fees: string;
  processingTime: string;
  responsiblePerson: string;
}

export interface CitizensCharterEntry {
  id: string;
  slug: string;
  serviceName: string;
  officeId: string; // References canonical MunicipalOffice.id in offices-data.ts
  officeName?: string;
  classification: "Simple" | "Complex" | "Highly Technical";
  transactionType: "G2C" | "G2B" | "G2G";
  whoMayAvail: string[];
  requirements: CitizensCharterRequirement[];
  steps: CitizensCharterStep[];
  totalFees?: string;
  totalProcessingTime?: string;
  relatedFormIds?: string[];
  status: "published" | "draft" | "archived";
  publishedAt?: string;
}

// ============================================================
// 2. BUSINESS PERMITS TYPES & CONTRACTS
// ============================================================

export interface BusinessPermitRequirement {
  item: string;
  issuingAgency?: string;
  mandatory: boolean;
}

export interface BusinessPermitStep {
  stepNumber: number;
  title: string;
  description: string;
  responsibleOffice: string;
  timeframe?: string;
}

export interface BusinessPermitTrack {
  id: "new-business" | "renewal";
  title: string;
  subtitle: string;
  overview: string;
  responsibleOfficeId?: string; // References canonical MunicipalOffice.id
  requirements: BusinessPermitRequirement[];
  procedure: BusinessPermitStep[];
  feesNote?: string;
  processingTimeNote?: string;
  relatedFormIds: string[]; // References canonical DownloadableForm.id
  isPublished: boolean;
}

// ============================================================
// 3. DOWNLOADABLE FORMS TYPES & CONTRACTS
// ============================================================

export type FormCategory =
  | "Business & Licensing"
  | "Civil Registry"
  | "Building & Engineering"
  | "Taxation & Revenue"
  | "Social Services"
  | "General Administration";

export type FormFileType = "PDF" | "DOCX" | "XLSX";

export interface DownloadableForm {
  id: string;
  slug: string;
  title: string;
  description: string;
  officeId: string; // References canonical MunicipalOffice.id in offices-data.ts
  officeName?: string;
  category: FormCategory;
  fileType: FormFileType;
  fileSize: string;
  fileUrl?: string; // S3 storage link when published
  publishedAt?: string;
  updatedAt?: string;
  isAvailable: boolean;
}

// ============================================================
// 4. JOB OPPORTUNITIES TYPES & CONTRACTS
// ============================================================

export type EmploymentType =
  | "Permanent"
  | "Contractual"
  | "Casual"
  | "Co-Terminous";

export type JobStatus = "open" | "closed" | "cancelled";

export interface JobOpportunity {
  id: string;
  slug: string;
  positionTitle: string;
  itemNumber?: string;
  officeId: string; // References canonical MunicipalOffice.id in offices-data.ts
  officeName?: string;
  employmentType?: EmploymentType | string;
  salaryGrade?: string;
  monthlySalary?: string;
  postingDate: string; // ISO date
  closingDate: string; // ISO date
  educationRequirement?: string;
  trainingRequirement?: string;
  experienceRequirement?: string;
  eligibilityRequirement?: string;
  competencyRequirements?: string[];
  applicationInstructions?: string[];
  officialAttachmentUrl?: string;
  status: JobStatus;
}

// ============================================================
// DATA COLLECTIONS (DEFAULT EMPTY / PENDING PUBLICATION)
// ============================================================

/**
 * Verified Citizen's Charter Entries.
 * Currently empty pending official LGU digital publication.
 */
export const CITIZENS_CHARTER_ENTRIES: CitizensCharterEntry[] = [];

/**
 * Business Permit Content Tracks.
 * Structured for New Business Applications and Permit Renewals.
 * Marked as pending publication until verified guidelines are confirmed.
 */
export const BUSINESS_PERMIT_TRACKS: BusinessPermitTrack[] = [
  {
    id: "new-business",
    title: "New Business Application",
    subtitle: "Registration requirements and initial permitting for new commercial establishments",
    overview:
      "Official guidelines, requirements, and procedures for new commercial establishment applications in the Municipality of San Felipe will appear here upon publication.",
    responsibleOfficeId: "office-of-the-mayor",
    requirements: [],
    procedure: [],
    relatedFormIds: [],
    isPublished: false,
  },
  {
    id: "renewal",
    title: "Business Permit Renewal",
    subtitle: "Annual renewal guidelines, clearance verification, and assessment period",
    overview:
      "Official guidelines, requirements, and procedures for annual business permit renewals in the Municipality of San Felipe will appear here upon publication.",
    responsibleOfficeId: "office-of-the-mayor",
    requirements: [],
    procedure: [],
    relatedFormIds: [],
    isPublished: false,
  },
];

/**
 * Canonical Downloadable Forms Repository.
 * Currently empty pending authorized CMS document uploads.
 */
export const DOWNLOADABLE_FORMS: DownloadableForm[] = [];

/**
 * Canonical Job Opportunities & Recruitment Notices.
 * Currently empty pending CSC-compliant publication of vacant positions.
 */
export const JOB_OPPORTUNITIES: JobOpportunity[] = [];

// ============================================================
// QUERY HELPERS (CMS-READY EXTENSION POINTS)
// ============================================================

export function getCitizensCharterEntries(): CitizensCharterEntry[] {
  return CITIZENS_CHARTER_ENTRIES.filter((e) => e.status === "published");
}

export function getBusinessPermitTrack(id: "new-business" | "renewal"): BusinessPermitTrack | undefined {
  return BUSINESS_PERMIT_TRACKS.find((t) => t.id === id);
}

export function getDownloadableForms(category?: FormCategory): DownloadableForm[] {
  if (!category) return DOWNLOADABLE_FORMS.filter((f) => f.isAvailable);
  return DOWNLOADABLE_FORMS.filter((f) => f.isAvailable && f.category === category);
}

export function getJobOpportunities(status: JobStatus = "open"): JobOpportunity[] {
  return JOB_OPPORTUNITIES.filter((j) => j.status === status);
}
