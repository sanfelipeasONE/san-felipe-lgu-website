export {};

// Standalone test mocks for server-only and next/headers packages
const serverOnlyPath = require.resolve("server-only");
require.cache[serverOnlyPath] = {
  id: serverOnlyPath,
  filename: serverOnlyPath,
  loaded: true,
  exports: {},
  children: [],
  paths: [],
} as unknown as NodeJS.Module;

const nextHeadersPath = require.resolve("next/headers");
require.cache[nextHeadersPath] = {
  id: nextHeadersPath,
  filename: nextHeadersPath,
  loaded: true,
  exports: {
    headers: async () => ({
      get: (headerName: string) => {
        const lower = headerName.toLowerCase();
        if (lower === "host") return "localhost:3000";
        if (lower === "origin") return "http://localhost:3000";
        if (lower === "x-real-ip") return "127.0.0.1";
        if (lower === "user-agent") return "Mozilla/5.0 (Windows NT 10.0; Win64; x64) TestBrowser/1.0";
        return null;
      },
    }),
    cookies: async () => ({
      set: () => {},
      get: () => undefined,
      delete: () => {},
    }),
  },
  children: [],
  paths: [],
} as unknown as NodeJS.Module;

async function runSecurityHardeningTestSuite() {
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

  const { AUTH_CONFIG } = await import("../src/server/auth/config");
  const {
    hashSessionToken,
    generateSessionToken,
    listUserSessions,
    revokeSessionById,
    revokeAllOtherSessions,
  } = await import("../src/server/auth/session");
  const { redactSensitiveMetadata } = await import("../src/server/audit/service");
  const { prisma } = await import("../src/server/db/client");
  const { authenticateStaff } = await import("../src/app/(auth)/staff/login/actions");
  const { hashPassword } = await import("../src/server/auth/password");
  const { authRateLimiter } = await import("../src/server/auth/rate-limit");

  console.log("=======================================================");
  console.log("SAN FELIPE LGU SECURITY HARDENING TEST SUITE (PHASE 18.1)");
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

  const createdUserIds: string[] = [];
  const createdOfficeIds: string[] = [];

  try {
    // -------------------------------------------------------------
    // 1. Cookie Security Configuration
    // -------------------------------------------------------------
    console.log("1. Cookie Security Configuration");

    assert(AUTH_CONFIG.cookieOptions.httpOnly === true, "Session cookie has httpOnly: true (inaccessible to client JavaScript)");
    assert(AUTH_CONFIG.cookieOptions.sameSite === "lax", "Session cookie enforces SameSite: lax (CSRF protection)");
    assert(AUTH_CONFIG.cookieOptions.path === "/", "Session cookie path is scoped to root (/)");
    assert(AUTH_CONFIG.sessionTtlSeconds === 8 * 60 * 60, "Session lifetime is strictly bounded to 8 hours (never permanent)");

    // -------------------------------------------------------------
    // 2. Security Headers & CSP in next.config.ts
    // -------------------------------------------------------------
    console.log("\n2. Security Headers & CSP Configuration");

    const nextConfigPath = path.resolve(process.cwd(), "next.config.ts");
    const nextConfigContent = fs.readFileSync(nextConfigPath, "utf-8");

    assert(nextConfigContent.includes("X-Content-Type-Options"), "next.config.ts configures X-Content-Type-Options header");
    assert(nextConfigContent.includes("nosniff"), "X-Content-Type-Options is set to nosniff (prevents MIME confusion)");
    assert(nextConfigContent.includes("X-Frame-Options"), "next.config.ts configures legacy X-Frame-Options header");
    assert(nextConfigContent.includes("DENY"), "X-Frame-Options is set to DENY (clickjacking protection)");
    assert(nextConfigContent.includes("Referrer-Policy"), "next.config.ts configures Referrer-Policy header");
    assert(nextConfigContent.includes("strict-origin-when-cross-origin"), "Referrer-Policy is set to strict-origin-when-cross-origin");
    assert(nextConfigContent.includes("Permissions-Policy"), "next.config.ts configures Permissions-Policy header");
    assert(nextConfigContent.includes("camera=()"), "Permissions-Policy restricts unused camera hardware");
    assert(nextConfigContent.includes("microphone=()"), "Permissions-Policy restricts unused microphone hardware");
    assert(nextConfigContent.includes("geolocation=()"), "Permissions-Policy restricts unused geolocation hardware");
    assert(nextConfigContent.includes("Content-Security-Policy"), "next.config.ts configures modern Content-Security-Policy");
    assert(nextConfigContent.includes("frame-ancestors 'none'"), "CSP specifies frame-ancestors 'none' (robust framing denial)");
    assert(nextConfigContent.includes("res.cloudinary.com"), "CSP img-src and connect-src permit legitimate Cloudinary assets");
    assert(!nextConfigContent.includes("img-src 'self' data:"), "CSP img-src removes data: URI loosening now that QR codes are removed");

    // -------------------------------------------------------------
    // 3. Session Fixation & Cryptographic Token Separation
    // -------------------------------------------------------------
    console.log("\n3. Session Fixation & Token Separation");

    const tokenA = generateSessionToken();
    const tokenB = generateSessionToken();
    const hashA = hashSessionToken(tokenA);
    const hashB = hashSessionToken(tokenB);

    assert(tokenA !== tokenB, "Distinct session tokens generated each time (high entropy)");
    assert(hashA !== hashB, "Distinct session token hashes computed");
    assert(hashA !== tokenA, "Session token hash is distinct from raw token (never plaintext at rest)");
    assert(hashA.length === 64, "Token hash is a 256-bit SHA-256 hexadecimal string");

    // -------------------------------------------------------------
    // 4. Session Revocation & Ownership Boundary
    // -------------------------------------------------------------
    console.log("\n4. Session Revocation & Ownership Boundary");

    const dummyHash = "$argon2id$v=19$m=19456,t=2,p=1$fake$fake";
    const superAdminRole = await prisma.role.findUniqueOrThrow({ where: { slug: "super-admin" } });

    const user1 = await prisma.user.create({
      data: {
        name: "Security Test User 1",
        email: "sec.test.user1@sanfelipe.gov.ph",
        passwordHash: dummyHash,
        roleId: superAdminRole.id,
      },
    });
    createdUserIds.push(user1.id);

    const user2 = await prisma.user.create({
      data: {
        name: "Security Test User 2",
        email: "sec.test.user2@sanfelipe.gov.ph",
        passwordHash: dummyHash,
        roleId: superAdminRole.id,
      },
    });
    createdUserIds.push(user2.id);

    // Create 2 sessions for user1 and 1 session for user2
    const s1 = await prisma.session.create({
      data: {
        userId: user1.id,
        tokenHash: hashSessionToken(generateSessionToken()),
        expiresAt: new Date(Date.now() + 3600_000),
      },
    });
    const s2 = await prisma.session.create({
      data: {
        userId: user1.id,
        tokenHash: hashSessionToken(generateSessionToken()),
        expiresAt: new Date(Date.now() + 3600_000),
      },
    });
    const s3 = await prisma.session.create({
      data: {
        userId: user2.id,
        tokenHash: hashSessionToken(generateSessionToken()),
        expiresAt: new Date(Date.now() + 3600_000),
      },
    });

    const activeList = await listUserSessions(user1.id, s1.id);
    assert(activeList.length === 2, "listUserSessions lists only active sessions for the target user");
    assert(activeList.find((s) => s.id === s1.id)?.isCurrent === true, "Marks caller's current session accurately");
    assert(activeList.find((s) => s.id === s2.id)?.isCurrent === false, "Other active session is marked isCurrent: false");

    // Cross-user session revocation attempt: user1 tries to revoke user2's session
    const crossRevokeSuccess = await revokeSessionById(user1.id, s3.id);
    assert(!crossRevokeSuccess, "Caller CANNOT revoke sessions belonging to other users");

    const s3StillActive = await prisma.session.findUniqueOrThrow({ where: { id: s3.id } });
    assert(s3StillActive.revokedAt === null, "Target session remains unrevoked after cross-user attack attempt");

    // Legitimate revocation of own secondary session
    const ownRevokeSuccess = await revokeSessionById(user1.id, s2.id);
    assert(ownRevokeSuccess, "User can successfully revoke their own secondary session");

    const s2Revoked = await prisma.session.findUniqueOrThrow({ where: { id: s2.id } });
    assert(s2Revoked.revokedAt !== null, "Own secondary session is marked revoked in database");

    // Revoke all other sessions retains current session
    const s4 = await prisma.session.create({
      data: {
        userId: user1.id,
        tokenHash: hashSessionToken(generateSessionToken()),
        expiresAt: new Date(Date.now() + 3600_000),
      },
    });
    assert(s4.id !== s1.id, "Session s4 created for non-current session revocation test");
    const revokedCount = await revokeAllOtherSessions(user1.id, s1.id);
    assert(revokedCount === 1, "revokeAllOtherSessions revokes only non-current sessions");

    const s1Retained = await prisma.session.findUniqueOrThrow({ where: { id: s1.id } });
    assert(s1Retained.revokedAt === null, "Current session is strictly preserved");

    // -------------------------------------------------------------
    // 5. Inactive Office Enforcement Regression
    // -------------------------------------------------------------
    console.log("\n5. Inactive Office Enforcement Regression");

    const officeContent = fs.readFileSync(
      path.resolve(process.cwd(), "src/server/auth/session.ts"),
      "utf-8"
    );
    assert(
      officeContent.includes("user.office?.status === \"INACTIVE\""),
      "getCurrentUser strictly blocks office-scoped users assigned to an inactive municipal office"
    );
    assert(
      officeContent.includes("!user.role.isSystemScope"),
      "System-scoped administrators remain unblocked by individual office status changes"
    );

    // -------------------------------------------------------------
    // 6. Sensitive Logging & Error Leakage Audit
    // -------------------------------------------------------------
    console.log("\n6. Sensitive Logging & Metadata Redaction Audit");

    const loginActionPath = path.resolve(process.cwd(), "src/app/(auth)/staff/login/actions.ts");
    const loginActionContent = fs.readFileSync(loginActionPath, "utf-8");

    assert(
      !loginActionContent.includes("console.log(rawPassword)") &&
        !loginActionContent.includes("console.log(data)"),
      "authenticateStaff never logs raw password or raw credentials"
    );

    interface TestRedactionPayload {
      password?: unknown;
      secret?: unknown;
      apiKey?: unknown;
      privateKey?: unknown;
      serviceKey?: unknown;
      key?: unknown;
      safeDescription?: unknown;
    }

    const testRedaction = redactSensitiveMetadata({
      password: "secretpassword",
      secret: "base32secret",
      apiKey: "test-api-key",
      privateKey: "private-signing-key",
      serviceKey: "business-permits",
      key: "normal-dict-key",
      safeDescription: "Audit test",
    }) as TestRedactionPayload;

    assert(testRedaction.password === "[REDACTED]", "Redaction strips password");
    assert(testRedaction.secret === "[REDACTED]", "Redaction strips secret");
    assert(testRedaction.apiKey === "[REDACTED]", "Redaction strips apiKey");
    assert(testRedaction.privateKey === "[REDACTED]", "Redaction strips privateKey");
    assert(testRedaction.serviceKey === "business-permits", "Redaction preserves benign serviceKey");
    assert(testRedaction.key === "normal-dict-key", "Redaction preserves benign general key");
    assert(testRedaction.safeDescription === "Audit test", "Redaction preserves safe description");

    // -------------------------------------------------------------
    // 7. Login Enumeration Resistance & Generic Failure Semantics
    // -------------------------------------------------------------
    console.log("\n7. Login Enumeration Resistance & Failure Semantics");

    const testRawPassword = "ComplexPassword2026!@#";
    const hashedPwd = await hashPassword(testRawPassword);

    // Create an active municipal office and an inactive municipal office
    const activeOffice = await prisma.office.create({
      data: {
        name: "Security Active Office",
        slug: "sec-active-office",
        status: "ACTIVE",
      },
    });
    createdOfficeIds.push(activeOffice.id);

    const inactiveOffice = await prisma.office.create({
      data: {
        name: "Security Inactive Office",
        slug: "sec-inactive-office",
        status: "INACTIVE",
      },
    });
    createdOfficeIds.push(inactiveOffice.id);

    const staffRole = await prisma.role.findUniqueOrThrow({ where: { slug: "staff" } });

    // Active user with active office
    const validUser = await prisma.user.create({
      data: {
        name: "Valid Staff Officer",
        email: "valid.staff@sanfelipe.gov.ph",
        passwordHash: hashedPwd,
        status: "ACTIVE",
        roleId: staffRole.id,
        officeId: activeOffice.id,
      },
    });
    createdUserIds.push(validUser.id);

    // Inactive (disabled) user
    const disabledUser = await prisma.user.create({
      data: {
        name: "Disabled Staff Officer",
        email: "disabled.staff@sanfelipe.gov.ph",
        passwordHash: hashedPwd,
        status: "INACTIVE",
        roleId: staffRole.id,
        officeId: activeOffice.id,
      },
    });
    createdUserIds.push(disabledUser.id);

    // Suspended user
    const suspendedUser = await prisma.user.create({
      data: {
        name: "Suspended Staff Officer",
        email: "suspended.staff@sanfelipe.gov.ph",
        passwordHash: hashedPwd,
        status: "SUSPENDED",
        roleId: staffRole.id,
        officeId: activeOffice.id,
      },
    });
    createdUserIds.push(suspendedUser.id);

    // Active user assigned to inactive office
    const inactiveOfficeUser = await prisma.user.create({
      data: {
        name: "Inactive Office Officer",
        email: "inactive.office.user@sanfelipe.gov.ph",
        passwordHash: hashedPwd,
        status: "ACTIVE",
        roleId: staffRole.id,
        officeId: inactiveOffice.id,
      },
    });
    createdUserIds.push(inactiveOfficeUser.id);

    // Reset rate limiter keys before tests
    authRateLimiter.reset("ip:127.0.0.1");
    authRateLimiter.reset("id:nonexistent@sanfelipe.gov.ph");
    authRateLimiter.reset("id:valid.staff@sanfelipe.gov.ph");
    authRateLimiter.reset("id:disabled.staff@sanfelipe.gov.ph");
    authRateLimiter.reset("id:suspended.staff@sanfelipe.gov.ph");
    authRateLimiter.reset("id:inactive.office.user@sanfelipe.gov.ph");

    // Case 1: Nonexistent email
    const resNonexistent = await authenticateStaff({
      email: "nonexistent@sanfelipe.gov.ph",
      password: "somePassword123!",
    });
    assert(resNonexistent.success === false, "Nonexistent email login fails");
    assert(resNonexistent.message === "Invalid email or password.", "Nonexistent email returns generic error message");

    // Case 2: Valid email with wrong password
    const resWrongPwd = await authenticateStaff({
      email: "valid.staff@sanfelipe.gov.ph",
      password: "WrongPassword123!",
    });
    assert(resWrongPwd.success === false, "Wrong password login fails");
    assert(resWrongPwd.message === "Invalid email or password.", "Wrong password returns generic error message");

    // Case 3: Inactive / Disabled user
    const resDisabled = await authenticateStaff({
      email: "disabled.staff@sanfelipe.gov.ph",
      password: testRawPassword,
    });
    assert(resDisabled.success === false, "Disabled user login fails");
    assert(resDisabled.message === "Invalid email or password.", "Disabled user returns generic error message (no account status leak)");

    // Case 4: Suspended user
    const resSuspended = await authenticateStaff({
      email: "suspended.staff@sanfelipe.gov.ph",
      password: testRawPassword,
    });
    assert(resSuspended.success === false, "Suspended user login fails");
    assert(resSuspended.message === "Invalid email or password.", "Suspended user returns generic error message (no account status leak)");

    // Case 5: User with inactive municipal office
    const resInactiveOffice = await authenticateStaff({
      email: "inactive.office.user@sanfelipe.gov.ph",
      password: testRawPassword,
    });
    assert(resInactiveOffice.success === false, "User with inactive office login fails");
    assert(resInactiveOffice.message === "Invalid email or password.", "User with inactive office returns generic error message (no office status leak)");

    // Case 6: Full equality check across all failure modes
    const allMessagesIdentical =
      resNonexistent.message === resWrongPwd.message &&
      resWrongPwd.message === resDisabled.message &&
      resDisabled.message === resSuspended.message &&
      resSuspended.message === resInactiveOffice.message;
    assert(allMessagesIdentical, "All 5 failure modes return completely identical, non-enumerable public response");

    // Case 7: Valid user successful direct login (no 2FA step)
    authRateLimiter.reset("ip:127.0.0.1");
    authRateLimiter.reset("id:valid.staff@sanfelipe.gov.ph");
    const resSuccess = await authenticateStaff({
      email: "valid.staff@sanfelipe.gov.ph",
      password: testRawPassword,
    });
    assert(resSuccess.success === true, "Valid user authenticates successfully");
    assert(resSuccess.redirectTo === "/admin", "Valid user redirects directly to /admin (zero 2FA prompt)");

    // -------------------------------------------------------------
    // 8. Rate Limiting Throttling & Anti-Lockout Defense
    // -------------------------------------------------------------
    console.log("\n8. Rate Limiting & Anti-Lockout Defense");

    const rateTestEmail = "rate.test@sanfelipe.gov.ph";
    const rateTestId = `id:${rateTestEmail}`;
    authRateLimiter.reset(rateTestId);

    // Fail 5 times
    for (let i = 0; i < 5; i++) {
      authRateLimiter.recordFailure(rateTestId);
    }
    const checkThrottled = authRateLimiter.check(rateTestId);
    assert(!checkThrottled.allowed, "Rate limiter throttles after threshold of failed attempts");
    assert(checkThrottled.retryAfterSeconds > 0, "Rate limiter provides positive retryAfter cooldown");

    // Check that database account status is NOT permanently locked
    const dbUserCheck = await prisma.user.findUniqueOrThrow({ where: { id: validUser.id } });
    assert(dbUserCheck.status === "ACTIVE", "Throttled attempts do NOT modify database user status to permanently lock account (DoS defense)");

    // Case-insensitive email normalization
    const upperEmail = "VALID.STAFF@SANFELIPE.GOV.PH";
    authRateLimiter.reset("ip:127.0.0.1");
    authRateLimiter.reset("id:valid.staff@sanfelipe.gov.ph");
    const resUpper = await authenticateStaff({
      email: upperEmail,
      password: testRawPassword,
    });
    assert(resUpper.success === true, "Uppercase email is normalized and authenticates successfully");
  } finally {
    // -------------------------------------------------------------
    // Cleanup temporary test users, offices, and sessions
    // -------------------------------------------------------------
    if (createdUserIds.length > 0) {
      await prisma.session.deleteMany({
        where: { userId: { in: createdUserIds } },
      });
      await prisma.auditLog.deleteMany({
        where: { userId: { in: createdUserIds } },
      });
      await prisma.user.deleteMany({
        where: { id: { in: createdUserIds } },
      });
    }
    if (createdOfficeIds.length > 0) {
      await prisma.office.deleteMany({
        where: { id: { in: createdOfficeIds } },
      });
    }
    await prisma.$disconnect();
  }

  console.log("\n=======================================================");
  console.log(`SECURITY HARDENING TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runSecurityHardeningTestSuite().catch((err) => {
  console.error("Security hardening test suite execution failed:", err);
  process.exit(1);
});
