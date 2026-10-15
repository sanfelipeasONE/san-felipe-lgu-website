/**
 * Phase 20.5 Staff Login Verification Test Suite
 *
 * Verifies all 25 Authoritative Invariants specified in Section 15:
 * 1. Official municipal seal is used
 * 2. Republic of the Philippines is present
 * 3. Municipality of San Felipe is present
 * 4. Province of Zambales is present
 * 5. Staff Portal is present
 * 6. Authorized Personnel Access is present
 * 7. Email field exists
 * 8. Password field exists
 * 9. Show/Hide password control exists
 * 10. Sign In exists
 * 11. Pending state prevents duplicate submission
 * 12. Generic authentication error behavior remains
 * 13. Back to Municipal Website exists
 * 14. Authorized personnel notice uses approved wording
 * 15. Unapproved legal assertion is absent
 * 16. "Local Government Unit Electronic Portal System" is absent
 * 17. No role selector
 * 18. No office selector
 * 19. No social login
 * 20. No CAPTCHA
 * 21. No Turnstile
 * 22. No MFA/OTP
 * 23. No theme selector
 * 24. No sfz_theme storage
 * 25. Existing authentication endpoint/flow remains unchanged
 */

import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { ASSETS } from "../src/config/assets";

async function runStaffLoginTests() {
  console.log("=====================================================================");
  console.log("RUNNING PHASE 20.5 STAFF LOGIN VERIFICATION TEST SUITE");
  console.log("=====================================================================\n");

  const projectRoot = process.cwd();

  const loginPagePath = path.resolve(projectRoot, "src/app/(auth)/staff/login/page.tsx");
  const loginFormPath = path.resolve(projectRoot, "src/components/auth/login-form.tsx");
  const loginActionsPath = path.resolve(projectRoot, "src/app/(auth)/staff/login/actions.ts");
  const layoutPath = path.resolve(projectRoot, "src/app/layout.tsx");

  assert(fs.existsSync(loginPagePath), "Login page must exist");
  assert(fs.existsSync(loginFormPath), "Login form must exist");
  assert(fs.existsSync(loginActionsPath), "Login actions must exist");

  const loginPageContent = fs.readFileSync(loginPagePath, "utf-8");
  const loginFormContent = fs.readFileSync(loginFormPath, "utf-8");
  const loginActionsContent = fs.readFileSync(loginActionsPath, "utf-8");
  const layoutContent = fs.readFileSync(layoutPath, "utf-8");

  // TEST 1: Official municipal seal is used
  console.log("TEST 1: Official municipal seal is used");
  assert(
    loginPageContent.includes("ASSETS.branding.seal.src"),
    "Login page must reference ASSETS.branding.seal.src"
  );
  assert(
    loginPageContent.includes("ASSETS.branding.seal.alt"),
    "Login page must reference ASSETS.branding.seal.alt"
  );
  assert(
    ASSETS.branding.seal.src === "/images/seal-san-felipe.jpg",
    "Municipal seal must point to official asset path"
  );
  console.log("  ✓ PASS: Official municipal seal correctly rendered\n");

  // TEST 2: Republic of the Philippines is present
  console.log("TEST 2: Republic of the Philippines is present");
  assert(
    loginPageContent.includes("REPUBLIC OF THE PHILIPPINES"),
    "Login page must include 'REPUBLIC OF THE PHILIPPINES'"
  );
  console.log("  ✓ PASS: 'REPUBLIC OF THE PHILIPPINES' verified\n");

  // TEST 3: Municipality of San Felipe is present
  console.log("TEST 3: Municipality of San Felipe is present");
  assert(
    loginPageContent.includes("MUNICIPALITY OF SAN FELIPE"),
    "Login page must include 'MUNICIPALITY OF SAN FELIPE'"
  );
  console.log("  ✓ PASS: 'MUNICIPALITY OF SAN FELIPE' verified\n");

  // TEST 4: Province of Zambales is present
  console.log("TEST 4: Province of Zambales is present");
  assert(
    loginPageContent.includes("Province of Zambales"),
    "Login page must include 'Province of Zambales'"
  );
  console.log("  ✓ PASS: 'Province of Zambales' verified\n");

  // TEST 5: Staff Portal is present
  console.log("TEST 5: Staff Portal is present");
  assert(
    loginPageContent.includes("Staff Portal"),
    "Login page must include 'Staff Portal'"
  );
  console.log("  ✓ PASS: 'Staff Portal' verified\n");

  // TEST 6: Authorized Personnel Access is present
  console.log("TEST 6: Authorized Personnel Access is present");
  assert(
    loginPageContent.includes("Authorized Personnel Access"),
    "Login page must include 'Authorized Personnel Access'"
  );
  console.log("  ✓ PASS: 'Authorized Personnel Access' verified\n");

  // TEST 7: Email field exists
  console.log("TEST 7: Email field exists");
  assert(
    loginFormContent.includes('type="email"') && loginFormContent.includes('id="email"'),
    "Login form must have an email input"
  );
  assert(
    loginFormContent.includes('name@municipality.gov.ph'),
    "Email placeholder must match Stitch reference: name@municipality.gov.ph"
  );
  assert(
    loginFormContent.includes('Email address'),
    "Email input must have visible label 'Email address'"
  );
  console.log("  ✓ PASS: Email field with visible label and correct placeholder verified\n");

  // TEST 8: Password field exists
  console.log("TEST 8: Password field exists");
  assert(
    loginFormContent.includes('id="password"') && loginFormContent.includes('Password'),
    "Login form must have password field with visible label"
  );
  console.log("  ✓ PASS: Password field exists with visible label\n");

  // TEST 9: Show/Hide password control exists
  console.log("TEST 9: Show/Hide password control exists");
  assert(
    loginFormContent.includes("showPassword"),
    "Login form must manage showPassword state"
  );
  assert(
    loginFormContent.includes('showPassword ? "text" : "password"'),
    "Password input type must toggle between text and password"
  );
  assert(
    loginFormContent.includes('showPassword ? "Hide" : "Show"'),
    "Toggle button must render text 'Show' or 'Hide'"
  );
  assert(
    loginFormContent.includes('aria-label={showPassword ? "Hide password" : "Show password"}'),
    "Show/Hide toggle button must have accessible aria-label"
  );
  console.log("  ✓ PASS: Accessible Show/Hide password text control verified\n");

  // TEST 10: Sign In exists
  console.log("TEST 10: Sign In exists");
  assert(
    loginFormContent.includes('type="submit"'),
    "Form must have a submit button"
  );
  assert(
    loginFormContent.includes('Sign In'),
    "Submit button must display 'Sign In'"
  );
  assert(
    loginFormContent.includes('#6b0f1a'),
    "Submit button must use municipal deep burgundy color (#6b0f1a)"
  );
  console.log("  ✓ PASS: Burgundy Sign In button verified\n");

  // TEST 11: Pending state prevents duplicate submission
  console.log("TEST 11: Pending state prevents duplicate submission");
  assert(
    loginFormContent.includes("isPending") && loginFormContent.includes("disabled={isPending}"),
    "Form controls and button must be disabled when isPending is true"
  );
  assert(
    loginFormContent.includes("Signing in…"),
    "Submit button must display 'Signing in…' while pending"
  );
  console.log("  ✓ PASS: Pending state prevents double submission and displays 'Signing in…'\n");

  // TEST 12: Generic authentication error behavior remains
  console.log("TEST 12: Generic authentication error behavior remains");
  assert(
    loginActionsContent.includes('message: "Invalid email or password."'),
    "Server actions must return generic authentication error message"
  );
  assert(
    loginFormContent.includes("Unable to sign in. Please check your email and password."),
    "Client form must provide generic error fallback"
  );
  assert(
    loginFormContent.includes('role="alert"'),
    "Error banner must have role='alert' for accessibility"
  );
  console.log("  ✓ PASS: Generic authentication error messaging verified\n");

  // TEST 13: Back to Municipal Website exists
  console.log("TEST 13: Back to Municipal Website exists");
  assert(
    loginPageContent.includes("Back to Municipal Website"),
    "Login page must include 'Back to Municipal Website' link"
  );
  assert(
    loginPageContent.includes('href="/"'),
    "Back link must navigate to public root '/'"
  );
  console.log("  ✓ PASS: Secondary navigation to municipal website verified\n");

  // TEST 14: Authorized personnel notice uses approved wording
  console.log("TEST 14: Authorized personnel notice uses approved wording");
  assert(
    loginFormContent.includes("Authorized personnel only."),
    "Notice must include 'Authorized personnel only.'"
  );
  assert(
    loginFormContent.includes("Access to this system is restricted to authorized Municipality of San Felipe personnel."),
    "Notice must use exact approved restriction sentence"
  );
  console.log("  ✓ PASS: Authorized personnel notice uses approved wording\n");

  // TEST 15: Unapproved legal assertion is absent
  console.log("TEST 15: Unapproved legal assertion is absent");
  assert(
    !loginFormContent.includes("Unauthorized access is subject to Philippine administrative and cybersecurity laws"),
    "Unapproved legal claim must be completely absent from login form"
  );
  assert(
    !loginPageContent.includes("Unauthorized access is subject to Philippine administrative and cybersecurity laws"),
    "Unapproved legal claim must be completely absent from login page"
  );
  console.log("  ✓ PASS: Unapproved legal assertion completely removed\n");

  // TEST 16: 'Local Government Unit Electronic Portal System' is absent
  console.log("TEST 16: 'Local Government Unit Electronic Portal System' is absent");
  assert(
    !loginPageContent.includes("Local Government Unit Electronic Portal System"),
    "Unapproved electronic portal system title must be completely absent"
  );
  assert(
    !loginFormContent.includes("Local Government Unit Electronic Portal System"),
    "Unapproved electronic portal system title must be completely absent from form"
  );
  assert(
    loginPageContent.includes("Official Staff Portal"),
    "Footer must retain simple 'Official Staff Portal' subtext"
  );
  console.log("  ✓ PASS: Clean, restrained footer verified without invented system title\n");

  // TEST 17: No role selector
  console.log("TEST 17: No role selector");
  assert(
    !loginFormContent.includes("<select") && !loginFormContent.includes("role-select"),
    "Login form must NOT contain a role selector"
  );
  assert(
    !loginPageContent.includes("select a role"),
    "Login page must NOT contain role selection UI"
  );
  console.log("  ✓ PASS: Zero role selector\n");

  // TEST 18: No office selector
  console.log("TEST 18: No office selector");
  assert(
    !loginFormContent.includes("office-select") && !loginFormContent.includes("Select Office"),
    "Login form must NOT contain an office selector"
  );
  assert(
    !loginPageContent.includes("select an office"),
    "Login page must NOT contain office selection UI"
  );
  console.log("  ✓ PASS: Zero office selector\n");

  // TEST 19: No social login
  console.log("TEST 19: No social login");
  const socialKeywords = ["google", "facebook", "github", "microsoft", "oauth", "sso"];
  for (const kw of socialKeywords) {
    assert(
      !loginFormContent.toLowerCase().includes(`sign in with ${kw}`),
      `Login form must not have social login with ${kw}`
    );
  }
  console.log("  ✓ PASS: Zero social login buttons\n");

  // TEST 20: No CAPTCHA
  console.log("TEST 20: No CAPTCHA");
  assert(
    !loginFormContent.toLowerCase().includes("captcha"),
    "Login form must NOT contain CAPTCHA"
  );
  assert(
    !loginPageContent.toLowerCase().includes("captcha"),
    "Login page must NOT contain CAPTCHA"
  );
  console.log("  ✓ PASS: Zero CAPTCHA UI\n");

  // TEST 21: No Turnstile
  console.log("TEST 21: No Turnstile");
  assert(
    !loginFormContent.toLowerCase().includes("turnstile"),
    "Login form must NOT contain Turnstile"
  );
  assert(
    !loginPageContent.toLowerCase().includes("turnstile"),
    "Login page must NOT contain Turnstile"
  );
  console.log("  ✓ PASS: Zero Turnstile UI\n");

  // TEST 22: No MFA/OTP
  console.log("TEST 22: No MFA/OTP");
  const mfaKeywords = ["mfa", "2fa", "otp", "one-time", "authenticator", "sms code"];
  for (const kw of mfaKeywords) {
    assert(
      !loginFormContent.toLowerCase().includes(kw),
      `Login form must NOT contain ${kw}`
    );
  }
  console.log("  ✓ PASS: Zero MFA/OTP prompts\n");

  // TEST 23: No theme selector
  console.log("TEST 23: No theme selector");
  assert(
    !loginPageContent.includes("ThemeToggle") && !loginPageContent.includes("theme"),
    "Login page must NOT reference ThemeToggle or theme selector"
  );
  assert(
    !loginFormContent.includes("ThemeToggle") && !loginFormContent.includes("theme"),
    "Login form must NOT reference ThemeToggle or theme selector"
  );
  assert(
    !layoutContent.includes("ThemeProvider") && !layoutContent.includes("theme"),
    "Root layout must NOT reference ThemeProvider or theme"
  );
  console.log("  ✓ PASS: Zero theme selector UI across portal\n");

  // TEST 24: No sfz_theme storage
  console.log("TEST 24: No sfz_theme storage");
  assert(
    !layoutContent.includes("sfz_theme"),
    "Root layout must NOT reference 'sfz_theme'"
  );
  assert(
    !loginFormContent.includes("sfz_theme"),
    "Login form must NOT reference 'sfz_theme'"
  );
  assert(
    !loginPageContent.includes("sfz_theme"),
    "Login page must NOT reference 'sfz_theme'"
  );
  console.log("  ✓ PASS: Zero 'sfz_theme' references anywhere in login or layout\n");

  // TEST 25: Existing authentication endpoint/flow remains unchanged
  console.log("TEST 25: Existing authentication endpoint/flow remains unchanged");
  assert(
    loginFormContent.includes("authenticateStaff(values)"),
    "Login form must submit to authenticateStaff server action"
  );
  assert(
    loginActionsContent.includes("verifyPassword") && loginActionsContent.includes("createSession"),
    "Server action must execute verifyPassword (Argon2id) and createSession"
  );
  console.log("  ✓ PASS: Authentication endpoint and security flow completely preserved\n");

  console.log("=====================================================================");
  console.log("ALL 25 STAFF LOGIN VERIFICATION TESTS PASSED SUCCESSFULLY");
  console.log("=====================================================================");
}

runStaffLoginTests().catch((err) => {
  console.error("Test failure:", err);
  process.exit(1);
});
