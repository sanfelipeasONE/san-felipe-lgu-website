import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  isSystemScoped,
  isOfficeScoped,
  canAccessOffice,
  canManageOfficeContent,
  getAuthorityLevel,
  getAuthoritySummary,
} from "../src/lib/authz/scope";
import { getVisibleNavSections, ADMIN_NAV_CONFIG } from "../src/config/admin-navigation";

async function runCMSFoundationTests() {
  console.log("=======================================================");
  console.log("SAN FELIPE LGU CMS FOUNDATION TEST SUITE (PHASE 11)");
  console.log("=======================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName} ${detail ? `- ${detail}` : ""}`);
      failed++;
    }
  }

  // -------------------------------------------------------------
  // Test 1: Scope & Authority Helpers (SYSTEM vs OFFICE Scope)
  // -------------------------------------------------------------
  console.log("1. Scope & Authority Helpers (SYSTEM vs OFFICE Scope)");

  const superAdminUser = {
    id: "user-super-admin",
    name: "Municipal System Administrator",
    email: "admin@sanfelipe.gov.ph",
    isSystemScope: true,
    officeId: "office-icto",
    office: { name: "ICT Management Office", shortName: "ICTO" },
    permissions: [
      "users.view", "users.create", "users.update", "users.disable",
      "offices.view", "offices.update",
      "posts.view", "posts.create", "posts.update", "posts.delete", "posts.submit", "posts.approve", "posts.publish",
      "documents.view", "documents.create", "documents.update", "documents.delete", "documents.approve", "documents.publish",
      "events.create", "events.update", "events.publish",
      "audit.view", "settings.manage",
      "services.view", "services.update", "services.publish",
    ],
  };

  const officeAdminUser = {
    id: "user-office-admin",
    name: "MHO Department Head",
    email: "mho.admin@sanfelipe.gov.ph",
    isSystemScope: false,
    officeId: "office-mho",
    office: { name: "Municipal Health Office", shortName: "MHO" },
    permissions: [
      "users.view",
      "offices.view",
      "posts.view", "posts.create", "posts.update", "posts.approve", "posts.publish",
      "documents.view", "documents.create", "documents.update",
      "services.view", "services.update", "services.publish",
    ],
  };

  const staffUser = {
    id: "user-treasury-staff",
    name: "Treasury Content Staff",
    email: "treasury.staff@sanfelipe.gov.ph",
    isSystemScope: false,
    officeId: "office-treasury",
    office: { name: "Municipal Treasury Office", shortName: "MTO" },
    permissions: ["posts.view", "posts.create", "posts.update", "posts.publish"],
  };

  const viewerUser = {
    id: "user-plain-viewer",
    name: "Read-only Staff",
    email: "viewer@sanfelipe.gov.ph",
    isSystemScope: false,
    officeId: "office-planning",
    office: { name: "Municipal Planning & Development Office", shortName: "MPDO" },
    permissions: ["documents.view"],
  };

  // Permission checks
  assert(hasPermission(superAdminUser, "users.create"), "Super Admin has users.create permission");
  assert(hasAnyPermission(officeAdminUser, ["users.create", "users.view"]), "Office Admin hasAnyPermission for user oversight");
  assert(!hasAllPermissions(officeAdminUser, ["users.create", "audit.view"]), "Office Admin lacks audit.view in hasAllPermissions");

  // Scope detection
  assert(isSystemScoped(superAdminUser), "Super Admin is identified as system-scoped");
  assert(!isSystemScoped(officeAdminUser), "Office Admin is NOT system-scoped");
  assert(!isSystemScoped(staffUser), "Staff user is NOT system-scoped");
  assert(isOfficeScoped(officeAdminUser), "Office Admin is identified as office-scoped");
  assert(isOfficeScoped(staffUser), "Staff user is identified as office-scoped");

  // Authority Level computation without brittle role names
  assert(getAuthorityLevel(superAdminUser) === "SUPER_ADMIN", "Super Admin resolves to SUPER_ADMIN level");
  assert(getAuthorityLevel(officeAdminUser) === "OFFICE_ADMIN", "Office Admin with users.view resolves to OFFICE_ADMIN level");
  assert(getAuthorityLevel(staffUser) === "STAFF", "Staff user without users.view resolves to STAFF level");

  // Authority Summary metadata
  const superSummary = getAuthoritySummary(superAdminUser);
  assert(superSummary.canManageUsers, "Super Admin summary indicates canManageUsers");
  assert(superSummary.canManageOffices, "Super Admin summary indicates canManageOffices");
  assert(superSummary.canManageRoles, "Super Admin summary indicates canManageRoles");
  assert(superSummary.canViewAudit, "Super Admin summary indicates canViewAudit");
  assert(superSummary.isSystem, "Super Admin summary reflects system scope");

  const officeAdminSummary = getAuthoritySummary(officeAdminUser);
  assert(officeAdminSummary.canManageUsers, "Office Admin summary indicates canManageUsers (within office)");
  assert(!officeAdminSummary.canManageOffices, "Office Admin cannot manage global offices");
  assert(!officeAdminSummary.canManageRoles, "Office Admin cannot manage roles");
  assert(!officeAdminSummary.canViewAudit, "Office Admin cannot view system audit logs");
  assert(!officeAdminSummary.isSystem, "Office Admin summary reflects office scope");

  const staffSummary = getAuthoritySummary(staffUser);
  assert(!staffSummary.canManageUsers, "Staff summary does NOT indicate canManageUsers");
  assert(!staffSummary.canManageOffices, "Staff cannot manage offices");
  assert(!staffSummary.canManageRoles, "Staff cannot manage roles");
  assert(!staffSummary.canViewAudit, "Staff cannot view audit logs");
  assert(staffSummary.canPublishNews, "Staff summary reflects canPublishNews");

  // -------------------------------------------------------------
  // Test 2: Office Access & Content Ownership Boundaries
  // -------------------------------------------------------------
  console.log("\n2. Office Access & Content Ownership Boundaries");

  // System-scoped user access
  assert(canAccessOffice(superAdminUser, "office-mho"), "System scope user can access MHO office context");
  assert(canAccessOffice(superAdminUser, "office-treasury"), "System scope user can access Treasury office context");
  assert(canAccessOffice(superAdminUser, "office-any"), "System scope user can access arbitrary office context");

  // Office-scoped user access
  assert(canAccessOffice(officeAdminUser, "office-mho"), "Office Admin can access own office (office-mho)");
  assert(!canAccessOffice(officeAdminUser, "office-treasury"), "Office Admin is DENIED access to Treasury office");
  assert(!canAccessOffice(officeAdminUser, "office-icto"), "Office Admin is DENIED access to ICT office");

  assert(canAccessOffice(staffUser, "office-treasury"), "Treasury Staff can access own office (office-treasury)");
  assert(!canAccessOffice(staffUser, "office-mho"), "Treasury Staff is DENIED access to MHO office");

  // Content ownership checks
  assert(
    canManageOfficeContent(staffUser, "office-treasury", "posts.publish"),
    "Treasury staff can publish content for Treasury office"
  );
  assert(
    !canManageOfficeContent(staffUser, "office-mho", "posts.publish"),
    "Treasury staff CANNOT publish content for MHO office (cross-office denial)"
  );
  assert(
    !canManageOfficeContent(viewerUser, "office-planning", "posts.publish"),
    "Read-only staff CANNOT publish content for own office due to missing permission"
  );
  assert(
    canManageOfficeContent(superAdminUser, "office-mho", "posts.publish"),
    "System-scoped Super Admin can publish content for MHO office"
  );

  // -------------------------------------------------------------
  // Test 3: Permission-Aware Navigation Filtering
  // -------------------------------------------------------------
  console.log("\n3. Permission-Aware Navigation Filtering");

  // Super Admin Navigation
  const superSections = getVisibleNavSections(superAdminUser);
  const superSectionKeys = superSections.map((s) => s.key);
  const superItemIds = superSections.flatMap((s) => s.items.map((i) => i.id));

  assert(superSectionKeys.includes("main"), "Super Admin receives Main navigation section");
  assert(superSectionKeys.includes("content"), "Super Admin receives Content navigation section");
  assert(superSectionKeys.includes("administration"), "Super Admin receives Administration navigation section");
  assert(superSectionKeys.includes("system"), "Super Admin receives System navigation section");

  assert(superItemIds.includes("dashboard"), "Super Admin has Dashboard item");
  assert(superItemIds.includes("news"), "Super Admin has News item");
  assert(superItemIds.includes("services"), "Super Admin has Services item");
  assert(superItemIds.includes("citizens-charter"), "Super Admin has Citizen's Charter item");
  assert(superItemIds.includes("business-permits"), "Super Admin has Business Permits item");
  assert(superItemIds.includes("downloadable-forms"), "Super Admin has Downloadable Forms item");
  assert(superItemIds.includes("job-opportunities"), "Super Admin has Job Opportunities item");
  assert(superItemIds.includes("emergency-hotlines"), "Super Admin has Emergency Hotlines item");
  assert(superItemIds.includes("offices"), "Super Admin has Municipal Offices item");
  assert(superItemIds.includes("users"), "Super Admin has Staff Accounts item");
  assert(superItemIds.includes("roles"), "Super Admin has Roles & Permissions item");
  assert(superItemIds.includes("audit-logs"), "Super Admin has Audit Logs item");

  // Office Admin Navigation
  const officeAdminSections = getVisibleNavSections(officeAdminUser);
  const officeAdminSectionKeys = officeAdminSections.map((s) => s.key);
  const officeAdminItemIds = officeAdminSections.flatMap((s) => s.items.map((i) => i.id));

  assert(officeAdminSectionKeys.includes("main"), "Office Admin receives Main section");
  assert(officeAdminSectionKeys.includes("content"), "Office Admin receives Content section");
  assert(officeAdminSectionKeys.includes("administration"), "Office Admin receives Administration section");
  assert(!officeAdminSectionKeys.includes("system"), "Office Admin does NOT receive System section (empty section stripped)");

  assert(officeAdminItemIds.includes("dashboard"), "Office Admin has Dashboard item");
  assert(officeAdminItemIds.includes("news"), "Office Admin has News item (posts.view)");
  assert(officeAdminItemIds.includes("services"), "Office Admin has Services item (services.view)");
  assert(officeAdminItemIds.includes("users"), "Office Admin has Staff Accounts item (users.view)");
  assert(!officeAdminItemIds.includes("offices"), "Office Admin does NOT have Offices item (system-only)");
  assert(!officeAdminItemIds.includes("roles"), "Office Admin does NOT have Roles item (system-only)");
  assert(!officeAdminItemIds.includes("audit-logs"), "Office Admin does NOT have Audit Logs item (system-only)");
  assert(!officeAdminItemIds.includes("emergency-hotlines"), "Office Admin does NOT have Emergency Hotlines item (system-only)");

  // Staff Navigation
  const staffSections = getVisibleNavSections(staffUser);
  const staffSectionKeys = staffSections.map((s) => s.key);
  const staffItemIds = staffSections.flatMap((s) => s.items.map((i) => i.id));

  assert(staffSectionKeys.includes("main"), "Staff receives Main section");
  assert(staffSectionKeys.includes("content"), "Staff receives Content section");
  assert(!staffSectionKeys.includes("administration"), "Staff does NOT receive Administration section");
  assert(!staffSectionKeys.includes("system"), "Staff does NOT receive System section");

  assert(staffItemIds.includes("dashboard"), "Staff has Dashboard item");
  assert(staffItemIds.includes("news"), "Staff has News item (posts.view)");
  assert(!staffItemIds.includes("users"), "Staff does NOT have Staff Accounts item");
  assert(!staffItemIds.includes("offices"), "Staff does NOT have Offices item");
  assert(!staffItemIds.includes("roles"), "Staff does NOT have Roles item");
  assert(!staffItemIds.includes("audit-logs"), "Staff does NOT have Audit Logs item");

  // User without posts.view
  const viewerSections = getVisibleNavSections(viewerUser);
  const viewerItemIds = viewerSections.flatMap((s) => s.items.map((i) => i.id));
  assert(!viewerItemIds.includes("news"), "User without posts.view does NOT see News navigation item");

  // -------------------------------------------------------------
  // Test 4: Link Safety (No 404 Links for Unfinished Modules)
  // -------------------------------------------------------------
  console.log("\n4. Link Safety & Implementation Verification");

  const allConfigItems = ADMIN_NAV_CONFIG.flatMap((s) => s.items);
  const implementedItems = allConfigItems.filter((i) => i.isImplemented);
  const upcomingItems = allConfigItems.filter((i) => !i.isImplemented);

  assert(
    implementedItems.length === 4,
    "Exactly 4 routes are marked isImplemented: true in Phase 14 (/admin, /admin/news, /admin/services, and /admin/documents)"
  );
  assert(
    implementedItems.some((i) => i.href === "/admin") &&
      implementedItems.some((i) => i.href === "/admin/news") &&
      implementedItems.some((i) => i.href === "/admin/services") &&
      implementedItems.some((i) => i.href === "/admin/documents"),
    "The active implemented routes are /admin, /admin/news, /admin/services, and /admin/documents"
  );

  const newsItem = allConfigItems.find((i) => i.id === "news");
  assert(newsItem?.isImplemented === true, "News item is activated with isImplemented: true in Phase 12");

  const servicesItem = allConfigItems.find((i) => i.id === "services");
  assert(servicesItem?.isImplemented === true, "Services item is activated with isImplemented: true in Phase 13");

  const downloadableFormsItem = allConfigItems.find((i) => i.id === "downloadable-forms");
  assert(downloadableFormsItem?.isImplemented === true, "Downloadable Forms item is activated with isImplemented: true in Phase 14");

  const usersItem = allConfigItems.find((i) => i.id === "users");
  assert(usersItem?.isImplemented === false, "Users item is marked isImplemented: false (scheduled for Phase 17)");
  assert(usersItem?.phaseLabel === "Phase 17", "Users item displays Phase 17 badge");

  assert(
    upcomingItems.every((item) => Boolean(item.phaseLabel)),
    "All upcoming items have explicit phase labels to render as accessible non-link badges"
  );

  // -------------------------------------------------------------
  // Test 5: Server-Component Boundary & DataTable Architecture (Phase 12 Regression)
  // -------------------------------------------------------------
  console.log("\n5. Server-Component Boundary & DataTable Architecture");

  const fs = await import("fs");
  const path = await import("path");

  const dataTableContent = fs.readFileSync(
    path.resolve(process.cwd(), "src/components/admin/data-table.tsx"),
    "utf-8"
  );
  assert(
    !dataTableContent.trim().startsWith('"use client"') && !dataTableContent.trim().startsWith("'use client'"),
    "DataTable is a Server Component (no 'use client' directive, allowing renderRow callbacks from RSC)"
  );

  const paginationContent = fs.readFileSync(
    path.resolve(process.cwd(), "src/components/admin/data-table-pagination.tsx"),
    "utf-8"
  );
  assert(
    paginationContent.includes('"use client"') || paginationContent.includes("'use client'"),
    "DataTablePagination is an isolated Client Component ('use client') with serializable numeric/string props"
  );

  const searchContent = fs.readFileSync(
    path.resolve(process.cwd(), "src/components/admin/data-table-search.tsx"),
    "utf-8"
  );
  assert(
    searchContent.includes('"use client"') || searchContent.includes("'use client'"),
    "DataTableSearch is an isolated Client Component ('use client') with serializable string props"
  );

  // -------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------
  console.log("\n=======================================================");
  console.log(`CMS FOUNDATION TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runCMSFoundationTests().catch((err) => {
  console.error("Unhandled test runner error:", err);
  process.exit(1);
});
