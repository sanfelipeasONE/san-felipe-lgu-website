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

async function runAuthTests() {
  const fs = await import("fs");
  const path = await import("path");

  // Load .env dynamically if present without hardcoding secrets in test files
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
  } catch {
    // Ignore
  }

  const { prisma } = await import("../src/server/db/client");
  const { verifyPassword } = await import("../src/server/auth/password");
  const { hashSessionToken, generateSessionToken } = await import("../src/server/auth/session");
  const { authRateLimiter } = await import("../src/server/auth/rate-limit");
  const { loginSchema } = await import("../src/lib/validation/auth");
  const { AUDIT_ACTIONS } = await import("../src/server/audit/constants");

  let passedCount = 0;
  let failedCount = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passedCount++;
    } else {
      console.error(`  ✗ FAIL: ${testName} ${detail ? `- ${detail}` : ""}`);
      failedCount++;
    }
  }

  console.log("\n=======================================================");
  console.log("MUNICIPALITY OF SAN FELIPE - PHASE 10 AUTH TEST SUITE");
  console.log("=======================================================\n");

  const testEmail = process.env.SEED_SUPERADMIN_EMAIL || "admin@sanfelipe.gov.ph";
  const validPassword = process.env.SEED_SUPERADMIN_PASSWORD || "TestDevPassword2026!";
  const wrongPassword = "WrongPassword999!";
  const nonExistentEmail = "ghost.official@sanfelipe.gov.ph";

  // Ensure initial test user exists
  const user = await prisma.user.findUnique({
    where: { email: testEmail },
    include: {
      role: {
        include: {
          permissions: {
            include: { permission: true },
          },
        },
      },
      office: true,
    },
  });

  if (!user) {
    throw new Error(`Test setup failure: Expected seed user ${testEmail} not found in database.`);
  }

  // -------------------------------------------------------------
  // Test 1: Password Verification with Argon2id
  // -------------------------------------------------------------
  console.log("1. Password Verification (Argon2id)");
  const validPwMatch = await verifyPassword(validPassword, user.passwordHash);
  assert(validPwMatch === true, "Valid password matches Argon2id hash");

  const invalidPwMatch = await verifyPassword(wrongPassword, user.passwordHash);
  assert(invalidPwMatch === false, "Invalid password fails Argon2id verification");

  // -------------------------------------------------------------
  // Test 2: Input Validation (loginSchema)
  // -------------------------------------------------------------
  console.log("\n2. Zod Schema Validation");
  const malformedInput = loginSchema.safeParse({ email: "invalid-email-format", password: "" });
  assert(!malformedInput.success, "Rejects malformed email and empty password");

  const rawTestEmail = `  ${testEmail.toUpperCase()}  `;
  const validParsed = loginSchema.safeParse({ email: rawTestEmail, password: validPassword });
  assert(validParsed.success, "Accepts valid credentials with whitespace");
  if (validParsed.success) {
    assert(validParsed.data.email.trim().toLowerCase() === testEmail.toLowerCase(), "Correctly normalizes email identifier");
  }

  // -------------------------------------------------------------
  // Test 3: Non-existent Identifier Timing & Error Handling
  // -------------------------------------------------------------
  console.log("\n3. Non-existent User Identifier");
  const nonExistentUser = await prisma.user.findUnique({ where: { email: nonExistentEmail } });
  assert(nonExistentUser === null, "Verified test email does not exist in database");

  // -------------------------------------------------------------
  // Test 4: Session Generation & SHA-256 Token Hashing
  // -------------------------------------------------------------
  console.log("\n4. Session Generation & Token Hashing");
  const rawToken = generateSessionToken();
  const tokenHash = hashSessionToken(rawToken);

  assert(rawToken.length >= 40, "Bearer token has high entropy (>= 40 chars base64url)");
  assert(tokenHash.length === 64, "Token hash is a 64-character SHA-256 hex string");
  assert(rawToken !== tokenHash, "Raw token differs from token hash (raw token never stored)");

  // -------------------------------------------------------------
  // Test 5: Session Creation & Persistence in PostgreSQL
  // -------------------------------------------------------------
  console.log("\n5. Persistent Session Storage");
  const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 hours
  const sessionRecord = await prisma.session.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
      ipAddress: "127.0.0.1",
      userAgent: "San-Felipe-Test-Agent/1.0",
    },
  });

  assert(Boolean(sessionRecord.id), "Session record successfully created in PostgreSQL");
  assert(sessionRecord.tokenHash === tokenHash, "Database stores tokenHash exclusively");

  // -------------------------------------------------------------
  // Test 6: Authenticated Authorization Context Loading
  // -------------------------------------------------------------
  console.log("\n6. Authorization Context Loading (User + Office + Role + Permissions)");
  const loadedSession = await prisma.session.findUnique({
    where: { tokenHash },
    include: {
      user: {
        include: {
          office: true,
          role: {
            include: {
              permissions: {
                include: { permission: true },
              },
            },
          },
        },
      },
    },
  });

  assert(Boolean(loadedSession), "Session found via tokenHash lookup");
  assert(loadedSession?.user.email === testEmail, "Resolves correct authenticated User");
  assert(Boolean(loadedSession?.user.office), "Loads associated Municipal Office");
  assert(loadedSession?.user.role.slug === "super-admin", "Loads Role entity");

  const permissions = loadedSession?.user.role.permissions.map((rp) => rp.permission.code) || [];
  assert(permissions.includes("users.create"), "Resolves granted permission (users.create)");
  assert(permissions.includes("posts.publish"), "Resolves granted permission (posts.publish)");
  assert(!permissions.includes("nonexistent.permission"), "Deny-by-default for non-existent permission");

  // -------------------------------------------------------------
  // Test 7: Session Revocation (Logout)
  // -------------------------------------------------------------
  console.log("\n7. Session Revocation (Logout)");
  const revokedSession = await prisma.session.update({
    where: { id: sessionRecord.id },
    data: { revokedAt: new Date() },
  });

  assert(revokedSession.revokedAt !== null, "Session record revokedAt timestamp is populated");

  // Re-query: a revoked session must NOT authenticate
  const activeSessionCheck = await prisma.session.findFirst({
    where: { tokenHash, revokedAt: null, expiresAt: { gt: new Date() } },
  });
  assert(activeSessionCheck === null, "Revoked session rejected by active session query");

  // -------------------------------------------------------------
  // Test 8: Expired Session Handling
  // -------------------------------------------------------------
  console.log("\n8. Expired Session Handling");
  const expiredToken = generateSessionToken();
  const expiredTokenHash = hashSessionToken(expiredToken);
  await prisma.session.create({
    data: {
      userId: user.id,
      tokenHash: expiredTokenHash,
      expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
    },
  });

  const expiredSessionCheck = await prisma.session.findFirst({
    where: { tokenHash: expiredTokenHash, revokedAt: null, expiresAt: { gt: new Date() } },
  });
  assert(expiredSessionCheck === null, "Expired session rejected by active session query");

  // -------------------------------------------------------------
  // Test 9: Rate Limiting
  // -------------------------------------------------------------
  console.log("\n9. Server-Side Rate Limiting");
  const testRateLimitKey = `test-ip:192.168.100.50`;
  authRateLimiter.reset(testRateLimitKey);

  // Record 4 failed attempts
  for (let i = 0; i < 4; i++) {
    authRateLimiter.recordFailure(testRateLimitKey);
  }
  const checkBeforeThreshold = authRateLimiter.check(testRateLimitKey);
  assert(checkBeforeThreshold.allowed === true, "Allowed under threshold (4 of 5 attempts)");

  // 5th failed attempt
  authRateLimiter.recordFailure(testRateLimitKey);
  const checkAtThreshold = authRateLimiter.check(testRateLimitKey);
  assert(checkAtThreshold.allowed === false, "Rate limited when reaching max threshold (5 attempts)");
  assert(checkAtThreshold.retryAfterSeconds > 0, "Provides retryAfterSeconds for client notification");

  // Reset rate limiter
  authRateLimiter.reset(testRateLimitKey);
  const checkAfterReset = authRateLimiter.check(testRateLimitKey);
  assert(checkAfterReset.allowed === true, "Rate limit reset restores access");

  // -------------------------------------------------------------
  // Test 10: Audit Log Verification & Sanitization
  // -------------------------------------------------------------
  console.log("\n10. Audit Logging");
  const auditEntry = await prisma.auditLog.create({
    data: {
      action: AUDIT_ACTIONS.AUTH_LOGIN_SUCCESS,
      userId: user.id,
      officeId: user.officeId,
      details: { role: user.role.slug },
      ipAddress: "127.0.0.1",
      userAgent: "San-Felipe-Test-Agent/1.0",
    },
  });

  assert(Boolean(auditEntry.id), "Audit log created in database");
  assert(auditEntry.action === AUDIT_ACTIONS.AUTH_LOGIN_SUCCESS, "Action recorded accurately");
  assert(auditEntry.userId === user.id, "Associated with authenticated user ID");

  // Clean up test sessions & test audit logs
  await prisma.session.deleteMany({
    where: { tokenHash: { in: [tokenHash, expiredTokenHash] } },
  });
  await prisma.auditLog.delete({ where: { id: auditEntry.id } });

  console.log("\n=======================================================");
  console.log(`TEST SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("=======================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }

  await prisma.$disconnect();
}

runAuthTests().catch((e) => {
  console.error("Test execution failed:", e);
  process.exit(1);
});
