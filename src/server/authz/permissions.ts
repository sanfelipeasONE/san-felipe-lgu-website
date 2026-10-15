/**
 * Canonical permission codes for the San Felipe LGU Digital Portal & CMS.
 * Authorization decisions are evaluated strictly against permission codes,
 * never by brittle role name string matching.
 */
export const PERMISSIONS = {
  // User Management
  USERS_VIEW: "users.view",
  USERS_CREATE: "users.create",
  USERS_UPDATE: "users.update",
  USERS_DISABLE: "users.disable",
  USERS_DELETE: "users.delete",

  // Office Management
  OFFICES_VIEW: "offices.view",
  OFFICES_UPDATE: "offices.update",

  // Posts & Announcements
  POSTS_VIEW: "posts.view",
  POSTS_CREATE: "posts.create",
  POSTS_UPDATE: "posts.update",
  POSTS_DELETE: "posts.delete",
  POSTS_SUBMIT: "posts.submit",
  POSTS_APPROVE: "posts.approve",
  POSTS_PUBLISH: "posts.publish",
  POSTS_ARCHIVE: "posts.archive",

  // Official Documents & Transparency
  DOCUMENTS_VIEW: "documents.view",
  DOCUMENTS_CREATE: "documents.create",
  DOCUMENTS_UPDATE: "documents.update",
  DOCUMENTS_DELETE: "documents.delete",
  DOCUMENTS_APPROVE: "documents.approve",
  DOCUMENTS_PUBLISH: "documents.publish",
  DOCUMENTS_ARCHIVE: "documents.archive",

  // Municipal Events & Advisories
  EVENTS_CREATE: "events.create",
  EVENTS_UPDATE: "events.update",
  EVENTS_PUBLISH: "events.publish",

  // Audit Logs
  AUDIT_VIEW: "audit.view",

  // Portal Settings
  SETTINGS_MANAGE: "settings.manage",

  // Municipal Services (Phase 13)
  SERVICES_VIEW: "services.view",
  SERVICES_UPDATE: "services.update",
  SERVICES_PUBLISH: "services.publish",

  // Municipal Job Opportunities (Phase 15)
  JOBS_VIEW: "jobs.view",
  JOBS_CREATE: "jobs.create",
  JOBS_UPDATE: "jobs.update",
  JOBS_PUBLISH: "jobs.publish",
  JOBS_ARCHIVE: "jobs.archive",
  JOBS_DELETE: "jobs.delete",
} as const;

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
