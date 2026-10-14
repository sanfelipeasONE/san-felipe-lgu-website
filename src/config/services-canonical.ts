/**
 * Canonical Municipal Service Page Definitions for San Felipe, Zambales.
 * Phase 13 — Services Content Management.
 *
 * These represent the four permanent, stable municipal service page identities.
 * CMS users cannot rename, alter the route keys, or create arbitrary new service pages.
 */

export interface CanonicalServicePageDef {
  serviceKey: string;
  title: string;
  publicPath: string;
  adminEditPath: string;
  adminPreviewPath: string;
  description: string | null;
  eyebrow: string;
  breadcrumbLabel: string;
}

export const CANONICAL_SERVICE_KEYS = [
  "citizens-charter",
  "business-permits",
  "downloadable-forms",
  "job-opportunities",
] as const;

export type CanonicalServiceKey = (typeof CANONICAL_SERVICE_KEYS)[number];

export const CANONICAL_SERVICE_PAGES: Record<CanonicalServiceKey, CanonicalServicePageDef> = {
  "citizens-charter": {
    serviceKey: "citizens-charter",
    title: "Citizen's Charter",
    publicPath: "/services/citizens-charter",
    adminEditPath: "/admin/services/citizens-charter/edit",
    adminPreviewPath: "/admin/services/citizens-charter/preview",
    description: null,
    eyebrow: "PUBLIC SERVICES",
    breadcrumbLabel: "Citizen's Charter",
  },
  "business-permits": {
    serviceKey: "business-permits",
    title: "Business Permits",
    publicPath: "/services/business-permits",
    adminEditPath: "/admin/services/business-permits/edit",
    adminPreviewPath: "/admin/services/business-permits/preview",
    description: null,
    eyebrow: "PUBLIC SERVICES",
    breadcrumbLabel: "Business Permits",
  },
  "downloadable-forms": {
    serviceKey: "downloadable-forms",
    title: "Downloadable Forms",
    publicPath: "/services/downloadable-forms",
    adminEditPath: "/admin/services/downloadable-forms/edit",
    adminPreviewPath: "/admin/services/downloadable-forms/preview",
    description: null,
    eyebrow: "PUBLIC SERVICES",
    breadcrumbLabel: "Downloadable Forms",
  },
  "job-opportunities": {
    serviceKey: "job-opportunities",
    title: "Job Opportunities",
    publicPath: "/services/job-opportunities",
    adminEditPath: "/admin/services/job-opportunities/edit",
    adminPreviewPath: "/admin/services/job-opportunities/preview",
    description: null,
    eyebrow: "PUBLIC SERVICES",
    breadcrumbLabel: "Job Opportunities",
  },
};

export function isCanonicalServiceKey(key: string): key is CanonicalServiceKey {
  return (CANONICAL_SERVICE_KEYS as readonly string[]).includes(key);
}

export function getCanonicalServicePageDef(key: string): CanonicalServicePageDef | undefined {
  if (isCanonicalServiceKey(key)) {
    return CANONICAL_SERVICE_PAGES[key as CanonicalServiceKey];
  }
  return undefined;
}
