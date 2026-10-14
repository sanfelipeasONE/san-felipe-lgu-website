export {};

// Standalone test mock for server-only marker package
const serverOnlyPath = require.resolve("server-only");
require.cache[serverOnlyPath] = {
  id: serverOnlyPath,
  filename: serverOnlyPath,
  loaded: true,
  exports: {},
  children: [],
  paths: [],
} as unknown as NodeJS.Module;

async function runAuditLogTestSuite() {
  const fs = await import("fs");
  const path = await import("path");

  // Load .env dynamically if present
  try {
    const envPath = path.resolve(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, "utf-8");
      for (const line of envContent.split("\n")) {
        const match = line.match(/^\s*([A-Za-z0-9_]+)=(.*)$/);
        if (match && !process.env[match[1]]) {
          process.env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, "");
        }
      }
    }
  } catch {}

  const { canViewAuditLogs, listAuditLogs, getAuditLogById } = await import("../src/server/audit/query");
  const { recordAuditEvent, redactSensitiveMetadata } = await import("../src/server/audit/service");
  const { prisma } = await import("../src/server/db/client");
  type SessionUser = import("../src/server/auth/session").SessionUser;

  console.log("=======================================================");
  console.log("SAN FELIPE LGU AUDIT LOGS TEST SUITE (PHASE 18)");
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

  const createdLogIds: string[] = [];
  const createdUserIds: string[] = [];

  try {
    // -------------------------------------------------------------
    // Setup temporary test user in PostgreSQL
    // -------------------------------------------------------------
    const superAdminRole = await prisma.role.findUniqueOrThrow({ where: { slug: "super-admin" } });
    const dummyHash = "$argon2id$v=19$m=19456,t=2,p=1$fake$fake";
    const dbAdmin = await prisma.user.create({
      data: {
        name: "Test Audit Super Admin",
        email: "test.superadmin.audit@sanfelipe.gov.ph",
        passwordHash: dummyHash,
        roleId: superAdminRole.id,
        status: "ACTIVE",
      },
    });
    createdUserIds.push(dbAdmin.id);

    // Mock Session Users
    const superAdminUser: SessionUser = {
      id: dbAdmin.id,
      name: dbAdmin.name,
      email: dbAdmin.email,
      status: "ACTIVE",
      officeId: null,
      office: null,
      roleId: superAdminRole.id,
      role: {
        id: superAdminRole.id,
        name: superAdminRole.name,
        slug: superAdminRole.slug,
        isSystemScope: true,
      },
      isSystemScope: true,
      permissions: ["audit.view", "users.view", "settings.manage"],
      sessionId: "test-session-super-admin",
    };

    const systemUserNoAuditPerm: SessionUser = {
      id: "test-user-sys-no-audit",
      name: "System User Without Audit",
      email: "test.sys.noaudit@sanfelipe.gov.ph",
      status: "ACTIVE",
      officeId: null,
      office: null,
      roleId: "role-custom-system",
      role: {
        id: "role-custom-system",
        name: "Custom System Role",
        slug: "custom-system",
        isSystemScope: true,
      },
      isSystemScope: true,
      permissions: ["users.view"], // lacks audit.view
      sessionId: "test-session-sys-no-audit",
    };

    const officeAdminUser: SessionUser = {
      id: "test-user-office-admin",
      name: "Test Office Admin",
      email: "test.officeadmin.audit@sanfelipe.gov.ph",
      status: "ACTIVE",
      officeId: "office-mho",
      office: { id: "office-mho", name: "Municipal Health Office", shortName: "MHO", slug: "mho" },
      roleId: "role-office-admin",
      role: {
        id: "role-office-admin",
        name: "Office Administrator",
        slug: "office-admin",
        isSystemScope: false,
      },
      isSystemScope: false,
      permissions: ["users.view", "posts.view"],
      sessionId: "test-session-office-admin",
    };

    const staffUser: SessionUser = {
      id: "test-user-staff",
      name: "Test Staff",
      email: "test.staff.audit@sanfelipe.gov.ph",
      status: "ACTIVE",
      officeId: "office-mho",
      office: { id: "office-mho", name: "Municipal Health Office", shortName: "MHO", slug: "mho" },
      roleId: "role-staff",
      role: {
        id: "role-staff",
        name: "Staff Member",
        slug: "staff",
        isSystemScope: false,
      },
      isSystemScope: false,
      permissions: ["posts.view"],
      sessionId: "test-session-staff",
    };

    // -------------------------------------------------------------
    // 1. Authorization Rules (SYSTEM scope + audit.view)
    // -------------------------------------------------------------
    console.log("1. Authorization Rules");

    assert(canViewAuditLogs(superAdminUser), "SYSTEM + audit.view is granted audit log access");
    assert(!canViewAuditLogs(systemUserNoAuditPerm), "SYSTEM without audit.view is DENIED audit log access");
    assert(!canViewAuditLogs(officeAdminUser), "Office Admin is strictly DENIED audit log access");
    assert(!canViewAuditLogs(staffUser), "Staff member is strictly DENIED audit log access");

    let officeAdminBlocked = false;
    try {
      await listAuditLogs(officeAdminUser, {});
    } catch (e: unknown) {
      if (e instanceof Error && e.message.includes("FORBIDDEN")) officeAdminBlocked = true;
    }
    assert(officeAdminBlocked, "listAuditLogs throws FORBIDDEN error for Office Admin");

    let staffBlocked = false;
    try {
      await listAuditLogs(staffUser, {});
    } catch (e: unknown) {
      if (e instanceof Error && e.message.includes("FORBIDDEN")) staffBlocked = true;
    }
    assert(staffBlocked, "listAuditLogs throws FORBIDDEN error for Staff member");

    let sysNoAuditBlocked = false;
    try {
      await listAuditLogs(systemUserNoAuditPerm, {});
    } catch (e: unknown) {
      if (e instanceof Error && e.message.includes("FORBIDDEN")) sysNoAuditBlocked = true;
    }
    assert(sysNoAuditBlocked, "listAuditLogs throws FORBIDDEN error for SYSTEM user without audit.view");

    // -------------------------------------------------------------
    // 2. Querying, Sorting, and Pagination
    // -------------------------------------------------------------
    console.log("\n2. Querying, Sorting, and Pagination");

    // Create 2 targeted test audit log records
    const testActionA = "AUTH_LOGIN_SUCCESS";
    const testActionB = "AUTH_LOGIN_FAILED";

    await recordAuditEvent({
      action: testActionA,
      userId: superAdminUser.id,
      details: { step: "test-1", note: "Login check" },
      ipAddress: "192.168.1.100",
      userAgent: "AuditTestAgent/1.0",
    });

    await recordAuditEvent({
      action: testActionB,
      userId: superAdminUser.id,
      details: { step: "test-2", note: "Failed attempt" },
      ipAddress: "192.168.1.101",
      userAgent: "AuditTestAgent/1.0",
    });

    const recentLogs = await prisma.auditLog.findMany({
      where: { ipAddress: { in: ["192.168.1.100", "192.168.1.101"] } },
      select: { id: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
    for (const r of recentLogs) {
      createdLogIds.push(r.id);
    }

    const queriedList = await listAuditLogs(superAdminUser, {
      search: "192.168.1.10",
      pageSize: 10,
    });

    assert(queriedList.data.length >= 2, "Search by IP retrieves created test audit logs");
    assert(
      queriedList.data[0].createdAt >= queriedList.data[1].createdAt,
      "Audit logs are returned in newest-first order (createdAt DESC)"
    );

    // Filter by specific action
    const filteredByAction = await listAuditLogs(superAdminUser, {
      action: testActionA,
      search: "192.168.1.100",
    });
    assert(
      filteredByAction.data.every((l) => l.action === testActionA),
      "Action filter strictly restricts returned logs to requested action"
    );

    // Pagination validation
    const paged = await listAuditLogs(superAdminUser, {
      page: 1,
      pageSize: 1,
    });
    assert(paged.data.length === 1, "Page size limit of 1 returns exactly 1 item");
    assert(paged.page === 1, "Returned page matches requested page number");
    assert(paged.totalPages >= 1, "totalPages is computed accurately");

    // -------------------------------------------------------------
    // 3. Immutability & Safe Single Record Access
    // -------------------------------------------------------------
    console.log("\n3. Immutability & Safe Single Record Access");

    const singleRecord = await getAuditLogById(superAdminUser, createdLogIds[0]);
    assert(singleRecord !== null, "getAuditLogById retrieves specific record for authorized SYSTEM user");
    assert(singleRecord?.id === createdLogIds[0], "Retrieved audit log ID matches target ID");

    let singleOfficeAdminBlocked = false;
    try {
      await getAuditLogById(officeAdminUser, createdLogIds[0]);
    } catch (e: unknown) {
      if (e instanceof Error && e.message.includes("FORBIDDEN")) singleOfficeAdminBlocked = true;
    }
    assert(singleOfficeAdminBlocked, "getAuditLogById throws FORBIDDEN error for Office Admin");

    // -------------------------------------------------------------
    // 4. Recursive Sensitive Metadata Redaction
    // -------------------------------------------------------------
    console.log("\n4. Recursive Sensitive Metadata Redaction");

    const sensitivePayload = {
      plainText: "super-secret-password-123",
      password: "adminPassword!",
      passwordHash: "$argon2id$v=19$m=19456,t=2,p=1$fake",
      token: "secret-bearer-session-token",
      tokenHash: "abc123hash",
      sessionToken: "sess_xyz789",
      secret: "totp-shared-secret-base32",
      totpSecret: "secretkeyhere",
      recoveryCode: "ABCDE-12345",
      recoveryCodes: ["CODE-1", "CODE-2"],
      apiKey: "cloudinary-api-secret-12345",
      authorization: "Bearer sensitive-jwt",
      cookie: "sfz_session=abc",
      harmlessId: "cmv1234567890",
      userEmail: "safe.officer@sanfelipe.gov.ph",
      serviceKey: "business-permits",
      key: "harmless-lookup-key",
      nestedObject: {
        internalSecret: "nested-private-key",
        normalDescription: "Permit approved",
      },
      arrayOfObjects: [
        { code: "1234", password: "array-item-password" },
        { code: "5678", publicLabel: "Safe item" },
      ],
    };

    interface RedactedPayload {
      plainText?: unknown;
      password?: unknown;
      passwordHash?: unknown;
      token?: unknown;
      sessionToken?: unknown;
      secret?: unknown;
      recoveryCode?: unknown;
      apiKey?: unknown;
      authorization?: unknown;
      cookie?: unknown;
      harmlessId?: unknown;
      userEmail?: unknown;
      serviceKey?: unknown;
      key?: unknown;
      nestedObject?: {
        internalSecret?: unknown;
        normalDescription?: unknown;
      };
      arrayOfObjects?: Array<{
        code?: unknown;
        password?: unknown;
        publicLabel?: unknown;
      }>;
    }

    const redacted = redactSensitiveMetadata(sensitivePayload) as RedactedPayload;

    assert(redacted.password === "[REDACTED]", "Direct password field is redacted");
    assert(redacted.plainText === "[REDACTED]", "plainText field is redacted");
    assert(redacted.passwordHash === "[REDACTED]", "passwordHash field is redacted");
    assert(redacted.token === "[REDACTED]", "token field is redacted");
    assert(redacted.sessionToken === "[REDACTED]", "sessionToken field is redacted");
    assert(redacted.secret === "[REDACTED]", "secret field is redacted");
    assert(redacted.recoveryCode === "[REDACTED]", "recoveryCode field is redacted");
    assert(redacted.apiKey === "[REDACTED]", "apiKey field is redacted");
    assert(redacted.authorization === "[REDACTED]", "authorization field is redacted");
    assert(redacted.cookie === "[REDACTED]", "cookie field is redacted");
    assert(redacted.nestedObject?.internalSecret === "[REDACTED]", "Nested secret in object is recursively redacted");
    assert(redacted.arrayOfObjects?.[0]?.password === "[REDACTED]", "Sensitive field inside array object is recursively redacted");
    assert(redacted.harmlessId === "cmv1234567890", "Harmless resource ID is preserved intact");
    assert(redacted.userEmail === "safe.officer@sanfelipe.gov.ph", "Non-sensitive user email is preserved intact");
    assert(redacted.serviceKey === "business-permits", "Benign serviceKey is preserved without over-redaction");
    assert(redacted.key === "harmless-lookup-key", "Benign general key is preserved without over-redaction");
    assert(redacted.nestedObject?.normalDescription === "Permit approved", "Non-sensitive nested string is preserved intact");
    assert(redacted.arrayOfObjects?.[1]?.publicLabel === "Safe item", "Non-sensitive array item property is preserved intact");
  } finally {
    // -------------------------------------------------------------
    // Cleanup temporary test audit records
    // -------------------------------------------------------------
    if (createdLogIds.length > 0) {
      await prisma.auditLog.deleteMany({
        where: { id: { in: createdLogIds } },
      });
    }
    if (createdUserIds.length > 0) {
      await prisma.user.deleteMany({
        where: { id: { in: createdUserIds } },
      });
    }
    await prisma.$disconnect();
  }

  console.log("\n=======================================================");
  console.log(`AUDIT LOGS TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runAuditLogTestSuite().catch((err) => {
  console.error("Audit log test suite execution failed:", err);
  process.exit(1);
});
