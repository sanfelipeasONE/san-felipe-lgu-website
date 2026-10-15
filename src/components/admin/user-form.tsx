"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createUserSchema,
  updateUserSchema,
  resetPasswordSchema,
  type CreateUserInput,
  type UpdateUserInput,
} from "@/lib/validation/users";
import {
  createUserAction,
  updateUserAction,
  setUserStatusAction,
  resetUserPasswordAction,
} from "@/app/(cms)/admin/users/actions";
import {
  Save,
  ArrowLeft,
  KeyRound,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Lock,
} from "lucide-react";
import Link from "next/link";
import { StatusBadge } from "@/components/admin/status-badge";
import type { UserStatus } from "@prisma/client";
import { z } from "zod";

export interface RoleOption {
  id: string;
  name: string;
  slug: string;
  isSystemScope: boolean;
  tier: string;
}

export interface OfficeOption {
  id: string;
  name: string;
  shortName: string | null;
}

interface UserFormProps {
  mode: "create" | "edit";
  isSystemScoped: boolean;
  userOfficeName?: string;
  roles?: RoleOption[];
  offices?: OfficeOption[];
  initialData?: {
    id: string;
    name: string;
    email: string;
    status: UserStatus;
    officeId: string | null;
    roleId: string;
    updatedAt: string;
  };
}

interface UserFormData {
  name: string;
  email: string;
  password?: string;
  roleId?: string;
  officeId?: string | null;
  status?: UserStatus;
  expectedUpdatedAt?: string;
}

export function UserForm({
  mode,
  isSystemScoped,
  userOfficeName,
  roles = [],
  offices = [],
  initialData,
}: UserFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Password reset section state
  const [resetPasswordOpen, setResetPasswordOpen] = React.useState(false);
  const [resetPasswordValue, setResetPasswordValue] = React.useState("");
  const [resetPasswordError, setResetPasswordError] = React.useState<string | null>(null);
  const [resetPasswordSuccess, setResetPasswordSuccess] = React.useState(false);
  const [isResetting, setIsResetting] = React.useState(false);

  // Status toggle state
  const [currentStatus, setCurrentStatus] = React.useState<UserStatus>(
    initialData?.status ?? "ACTIVE"
  );
  const [isUpdatingStatus, setIsUpdatingStatus] = React.useState(false);

  // Setup form based on mode
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(
      (mode === "create" ? createUserSchema : updateUserSchema) as unknown as z.ZodType<UserFormData>
    ),
    defaultValues: {
      name: initialData?.name ?? "",
      email: initialData?.email ?? "",
      roleId: initialData?.roleId ?? roles[0]?.id ?? "",
      officeId: initialData?.officeId ?? "",
      status: initialData?.status ?? "ACTIVE",
      ...(mode === "create" ? { password: "" } : {}),
      expectedUpdatedAt: initialData?.updatedAt,
    },
  });

  const [selectedRoleId, setSelectedRoleId] = React.useState<string>(
    initialData?.roleId ?? roles[0]?.id ?? ""
  );
  const selectedRole = roles.find((r) => r.id === selectedRoleId);
  const isSelectedRoleSystem = selectedRole?.isSystemScope;

  const onSubmit = async (data: UserFormData) => {
    setServerError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      if (mode === "create") {
        const payload: CreateUserInput = {
          name: data.name,
          email: data.email,
          password: data.password ?? "",
          roleId: isSystemScoped ? data.roleId : undefined,
          officeId: isSystemScoped ? (data.officeId || null) : undefined,
          status: isSystemScoped ? data.status : "ACTIVE",
        };

        const result = await createUserAction(payload);
        if (!result.success) {
          setServerError(result.error || "Failed to create user account.");
          return;
        }

        router.push("/admin/users");
        router.refresh();
      } else {
        if (!initialData) return;

        const payload: UpdateUserInput = {
          name: data.name,
          email: data.email,
          roleId: isSystemScoped ? data.roleId : undefined,
          officeId: isSystemScoped ? (data.officeId || null) : undefined,
          status: data.status,
          expectedUpdatedAt: initialData.updatedAt,
        };

        const result = await updateUserAction(initialData.id, payload);
        if (!result.success) {
          setServerError(result.error || "Failed to update user account.");
          return;
        }

        setSuccessMessage("User account updated successfully.");
        router.refresh();
      }
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (newStatus: UserStatus) => {
    if (!initialData) return;
    setServerError(null);
    setSuccessMessage(null);
    setIsUpdatingStatus(true);

    try {
      const result = await setUserStatusAction(
        initialData.id,
        newStatus,
        initialData.updatedAt
      );

      if (!result.success) {
        setServerError(result.error || "Failed to update account status.");
        return;
      }

      setCurrentStatus(result.data!.status);
      setSuccessMessage(`Account status changed to ${result.data!.status}.`);
      router.refresh();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Failed to change account status.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!initialData) return;
    setResetPasswordError(null);
    setResetPasswordSuccess(false);

    const parse = resetPasswordSchema.safeParse({ password: resetPasswordValue });
    if (!parse.success) {
      setResetPasswordError(parse.error.issues[0]?.message || "Invalid password format.");
      return;
    }

    setIsResetting(true);
    try {
      const result = await resetUserPasswordAction(
        initialData.id,
        resetPasswordValue,
        initialData.updatedAt
      );

      if (!result.success) {
        setResetPasswordError(result.error || "Failed to reset password.");
        return;
      }

      setResetPasswordSuccess(true);
      setResetPasswordValue("");
      router.refresh();
    } catch (err) {
      setResetPasswordError(err instanceof Error ? err.message : "Failed to reset password.");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Banner Notifications */}
      {serverError && (
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold">Operation Failed</p>
            <p className="mt-0.5">{serverError}</p>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold">Success</p>
            <p className="mt-0.5">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Main Account Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-800 text-sm">
                {mode === "create" ? "New User Account Credentials & Affiliation" : "Account Identity & Access"}
              </h3>
              {initialData && (
                <StatusBadge status={currentStatus} size="sm" />
              )}
            </div>
            <Link
              href="/admin/users"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Staff Accounts
            </Link>
          </div>

          <div className="p-6 space-y-5">
            {/* Full Name */}
            <div>
              <label htmlFor="name" className="block text-xs font-medium text-slate-700 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                {...register("name")}
                placeholder="e.g. Maria Santos"
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-burgundy-600/20 focus:border-burgundy-600 transition-colors"
              />
              {"name" in errors && errors.name && (
                <p className="text-xs text-rose-600 mt-1">{errors.name.message as string}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-slate-700 mb-1">
                Official Municipal Email <span className="text-rose-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                {...register("email")}
                placeholder="maria.santos@sanfelipe.gov.ph"
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-burgundy-600/20 focus:border-burgundy-600 transition-colors"
              />
              {"email" in errors && errors.email && (
                <p className="text-xs text-rose-600 mt-1">{errors.email.message as string}</p>
              )}
              <p className="text-[11px] text-slate-500 mt-1">
                Must be an active, verified municipal address. Letters are normalized to lowercase.
              </p>
            </div>

            {/* Initial Password (Create Mode Only) */}
            {mode === "create" && (
              <div>
                <label htmlFor="password" className="block text-xs font-medium text-slate-700 mb-1">
                  Initial Temporary Password <span className="text-rose-500">*</span>
                </label>
                <input
                  id="password"
                  type="password"
                  {...register("password")}
                  placeholder="Min. 12 characters, uppercase, lowercase, number, symbol"
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-burgundy-600/20 focus:border-burgundy-600 transition-colors font-mono"
                />
                {errors.password && (
                  <p className="text-xs text-rose-600 mt-1">{errors.password.message}</p>
                )}
                <p className="text-[11px] text-slate-500 mt-1">
                  Must meet OWASP security rules: at least 12 characters, uppercase, lowercase, number, and special character. Hashed with Argon2id. Plaintext is never stored.
                </p>
              </div>
            )}

            {/* Role & Office Assignment Section */}
            {isSystemScoped ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                {/* Role Selector (System Admin) */}
                <div>
                  <label htmlFor="roleId" className="block text-xs font-medium text-slate-700 mb-1">
                    System Role <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="roleId"
                    {...register("roleId", {
                      onChange: (e) => setSelectedRoleId(e.target.value),
                    })}
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-burgundy-600/20 focus:border-burgundy-600 transition-colors bg-white"
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} {r.isSystemScope ? "(System-Wide)" : "(Office Scoped)"}
                      </option>
                    ))}
                  </select>
                  {"roleId" in errors && errors.roleId && (
                    <p className="text-xs text-rose-600 mt-1">{errors.roleId.message as string}</p>
                  )}
                </div>

                {/* Office Selector (System Admin) */}
                <div>
                  <label htmlFor="officeId" className="block text-xs font-medium text-slate-700 mb-1">
                    Municipal Office {isSelectedRoleSystem ? "(Optional)" : <span className="text-rose-500">*</span>}
                  </label>
                  <select
                    id="officeId"
                    {...register("officeId")}
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-burgundy-600/20 focus:border-burgundy-600 transition-colors bg-white"
                  >
                    <option value="">
                      {isSelectedRoleSystem ? "None (Municipal-Wide / Unassigned)" : "-- Select Office --"}
                    </option>
                    {offices.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name} {o.shortName ? `(${o.shortName})` : ""}
                      </option>
                    ))}
                  </select>
                  {"officeId" in errors && errors.officeId && (
                    <p className="text-xs text-rose-600 mt-1">{errors.officeId.message as string}</p>
                  )}
                </div>

                {mode === "edit" && (
                  <div className="sm:col-span-2">
                    <label htmlFor="admin-status" className="block text-xs font-medium text-slate-700 mb-1">
                      Account Status
                    </label>
                    <select
                      id="admin-status"
                      {...register("status")}
                      className="w-full sm:w-64 px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-burgundy-600/20 focus:border-burgundy-600 transition-colors bg-white font-medium"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                      <option value="SUSPENDED">SUSPENDED</option>
                    </select>
                  </div>
                )}
              </div>
            ) : (
              /* Office Admin View: Read-only scope enforcement with permitted Status management */
              <div className="pt-2 border-t border-slate-100 bg-slate-50/50 p-4 rounded-lg space-y-3 border border-slate-200/60">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <Shield className="h-4 w-4 text-burgundy-700" />
                  <span>Office Administrator Authority Boundary</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500">Assigned Office (Fixed):</span>
                    <p className="font-medium text-slate-800 mt-0.5">{userOfficeName || "Your Assigned Office"}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Account Classification (Fixed):</span>
                    <p className="font-medium text-slate-800 mt-0.5">Staff (Content Personnel)</p>
                  </div>
                </div>
                {mode === "edit" && (
                  <div className="pt-2 border-t border-slate-200/60">
                    <label htmlFor="staff-status" className="block text-xs font-medium text-slate-700 mb-1">
                      Account Status
                    </label>
                    <select
                      id="staff-status"
                      {...register("status")}
                      className="w-full sm:w-64 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-burgundy-600/20 focus:border-burgundy-600 transition-colors bg-white font-medium"
                    >
                      <option value="ACTIVE">ACTIVE (Operational)</option>
                      <option value="INACTIVE">INACTIVE (Deactivated)</option>
                      <option value="SUSPENDED">SUSPENDED (Access Revoked)</option>
                    </select>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Changing status to INACTIVE or SUSPENDED immediately invalidates all active staff sessions.
                    </p>
                  </div>
                )}
                <p className="text-[11px] text-slate-500 italic">
                  Office Administrators create and manage ordinary Staff accounts within their assigned office only. Role and office are fixed by security policy.
                </p>
              </div>
            )}
          </div>

          {/* Form Actions Footer */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <Link
              href="/admin/users"
              className="text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center font-medium transition-colors rounded-lg bg-burgundy-700 hover:bg-burgundy-800 text-white text-xs h-9 px-4 shadow-2xs tracking-wide cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed gap-1.5"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{isSubmitting ? "Saving..." : mode === "create" ? "Create Account" : "Save Changes"}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Account Status & Credential Management Panels (Edit Mode Only) */}
      {mode === "edit" && initialData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Status Administration */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h4 className="font-semibold text-slate-800 text-sm">Account State Administration</h4>
              <StatusBadge status={currentStatus} size="sm" />
            </div>
            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-600">
                Disabling or suspending an account immediately revokes all active sessions in the database, preventing continued access across the portal.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                {currentStatus === "ACTIVE" ? (
                  <>
                    <button
                      type="button"
                      disabled={isUpdatingStatus}
                      onClick={() => handleStatusChange("SUSPENDED")}
                      className="px-3 py-1.5 rounded-lg border border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isUpdatingStatus ? "Updating..." : "Suspend Account"}
                    </button>
                    <button
                      type="button"
                      disabled={isUpdatingStatus}
                      onClick={() => handleStatusChange("INACTIVE")}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isUpdatingStatus ? "Updating..." : "Deactivate Account"}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    disabled={isUpdatingStatus}
                    onClick={() => handleStatusChange("ACTIVE")}
                    className="px-3 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isUpdatingStatus ? "Updating..." : "Re-activate Account"}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Credential Reset */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-burgundy-700" />
                <h4 className="font-semibold text-slate-800 text-sm">Reset Staff Credential</h4>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-600">
                Issue a new temporary password for this user. Doing so will immediately invalidate all currently active sessions for this account.
              </p>

              {resetPasswordSuccess && (
                <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs">
                  Password has been successfully updated and all existing sessions revoked.
                </div>
              )}

              {resetPasswordError && (
                <div className="p-3 rounded-lg border border-rose-200 bg-rose-50 text-rose-800 text-xs">
                  {resetPasswordError}
                </div>
              )}

              {resetPasswordOpen ? (
                <form onSubmit={handlePasswordReset} className="space-y-3">
                  <div>
                    <input
                      type="password"
                      value={resetPasswordValue}
                      onChange={(e) => setResetPasswordValue(e.target.value)}
                      placeholder="Enter new 12+ char temporary password"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-burgundy-600/20 focus:border-burgundy-600 font-mono"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      disabled={isResetting || !resetPasswordValue}
                      className="px-3 py-1.5 rounded-lg bg-burgundy-700 hover:bg-burgundy-800 text-white text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isResetting ? "Updating..." : "Confirm Password Reset"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setResetPasswordOpen(false);
                        setResetPasswordValue("");
                        setResetPasswordError(null);
                      }}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setResetPasswordOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
                >
                  <Lock className="h-3.5 w-3.5" />
                  <span>Issue Temporary Password</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
