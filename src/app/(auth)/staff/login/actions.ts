"use server";

import { loginSchema, type LoginInput } from "@/lib/validation/auth";

export interface LoginActionResult {
  success: boolean;
  message?: string;
  fieldErrors?: Partial<Record<keyof LoginInput, string[]>>;
}

/**
 * Server action processing municipal staff login submissions.
 * In Phase 1, authentication verification is strictly denied/unconfigured
 * to prevent insecure mock logins before Phase 2 session tokens are introduced.
 */
export async function authenticateStaff(
  data: unknown
): Promise<LoginActionResult> {
  const result = loginSchema.safeParse(data);

  if (!result.success) {
    const flattened = result.error.flatten().fieldErrors;
    return {
      success: false,
      message: "Please correct the errors in the form.",
      fieldErrors: flattened,
    };
  }

  // Phase 1: Security rule - do NOT fake authentication.
  // Return standard generic error to prevent email enumeration.
  return {
    success: false,
    message: "Unable to sign in with those credentials. Authentication service is scheduled for Phase 2 implementation.",
  };
}
