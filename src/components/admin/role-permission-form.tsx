"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { updateRolePermissionsAction, updateRoleAction } from "@/app/(cms)/admin/roles/actions";
import {
  Save,
  ArrowLeft,
  Shield,
  AlertTriangle,
  Lock,
  Layers,
} from "lucide-react";
import Link from "next/link";
import { ConcurrencyConflictBanner } from "@/components/admin/concurrency-conflict-banner";
import { toast } from "@/components/ui/toast";

interface PermissionCatalogItem {
  id: string;
  code: string;
  name: string;
  module: string;
  description: string | null;
}

interface RolePermissionFormProps {
  role: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    isSystemScope: boolean;
    tier: string;
    isBuiltIn: boolean;
    updatedAt: string;
    permissions: Array<{ code: string }>;
  };
  catalog: PermissionCatalogItem[];
}

const CRITICAL_SYSTEM_PERMISSIONS = new Set([
  "users.view",
  "users.create",
  "users.update",
  "users.disable",
  "settings.manage",
]);

export function RolePermissionForm({ role, catalog }: RolePermissionFormProps) {
  const router = useRouter();
  const [selectedCodes, setSelectedCodes] = React.useState<Set<string>>(
    new Set(role.permissions.map((p) => p.code))
  );
  const [roleName, setRoleName] = React.useState(role.name);
  const [roleDescription, setRoleDescription] = React.useState(role.description || "");
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Group catalog by module
  const modules = React.useMemo(() => {
    const grouped = new Map<string, PermissionCatalogItem[]>();
    for (const item of catalog) {
      const list = grouped.get(item.module) || [];
      list.push(item);
      grouped.set(item.module, list);
    }
    return grouped;
  }, [catalog]);

  const isSystemAdminRole = role.isSystemScope && role.tier === "SYSTEM_ADMIN";

  const togglePermission = (code: string) => {
    if (isSystemAdminRole && CRITICAL_SYSTEM_PERMISSIONS.has(code)) {
      // Cannot uncheck critical permissions on the system admin role
      return;
    }

    setSelectedCodes((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  };

  const handleSelectAllModule = (moduleItems: PermissionCatalogItem[]) => {
    setSelectedCodes((prev) => {
      const next = new Set(prev);
      const allSelected = moduleItems.every((item) => next.has(item.code));
      if (allSelected) {
        for (const item of moduleItems) {
          if (!isSystemAdminRole || !CRITICAL_SYSTEM_PERMISSIONS.has(item.code)) {
            next.delete(item.code);
          }
        }
      } else {
        for (const item of moduleItems) {
          next.add(item.code);
        }
      }
      return next;
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setIsSubmitting(true);

    try {
      // 1. Update role metadata if changed
      if (roleName !== role.name || roleDescription !== (role.description || "")) {
        const metaResult = await updateRoleAction(role.id, {
          name: roleName,
          description: roleDescription || null,
          expectedUpdatedAt: role.updatedAt,
        });
        if (!metaResult.success) {
          setServerError(metaResult.error || "Failed to update role label.");
          toast.error(metaResult.error || "Failed to update role label.");
          setIsSubmitting(false);
          return;
        }
      }

      // 2. Update role permissions
      const permResult = await updateRolePermissionsAction(
        role.id,
        Array.from(selectedCodes),
        role.updatedAt
      );

      if (!permResult.success) {
        setServerError(permResult.error || "Failed to update role permissions.");
        toast.error(permResult.error || "Failed to update role permissions.");
        setIsSubmitting(false);
        return;
      }

      toast.success("Role permissions updated.");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setServerError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {serverError && (
        serverError.includes("409") ||
        serverError.toLowerCase().includes("modified by another user") ||
        serverError.toLowerCase().includes("another session") ? (
          <ConcurrencyConflictBanner message="This role record was modified in another session. Please reload the latest version before saving your changes." />
        ) : (
          <div role="alert" className="p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold">Update Failed</p>
              <p className="mt-0.5">{serverError}</p>
            </div>
          </div>
        )
      )}

      {isSystemAdminRole && (
        <div className="p-4 rounded-xl border border-sky-200 bg-sky-50 text-sky-900 flex items-start gap-3">
          <Lock className="h-5 w-5 text-sky-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-semibold text-sm">Protected System Administrator Role</p>
            <p>
              Critical administrative permissions (<strong>users.*</strong>, <strong>settings.manage</strong>) are locked and cannot be stripped to prevent governance lockout.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Role Information Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-burgundy-700" />
              <h3 className="font-semibold text-slate-800 text-sm">
                Role Identity & Classification
              </h3>
              {role.isBuiltIn && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300">
                  Built-in System Role
                </span>
              )}
            </div>
            <Link
              href="/admin/roles"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Roles
            </Link>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Role Display Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-burgundy-600/20 focus:border-burgundy-600 font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Permanent Identifier (Slug)
                </label>
                <input
                  type="text"
                  value={role.slug}
                  disabled
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 bg-slate-100 text-slate-500 font-mono cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Description / Purpose
              </label>
              <input
                type="text"
                value={roleDescription}
                onChange={(e) => setRoleDescription(e.target.value)}
                placeholder="Operational purpose of this role..."
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-burgundy-600/20 focus:border-burgundy-600"
              />
            </div>

            <div className="pt-2 flex flex-wrap gap-4 text-xs text-slate-600">
              <div>
                <span className="text-slate-400">Operational Scope: </span>
                <span className="font-semibold text-slate-800">
                  {role.isSystemScope ? "System-Wide (All Offices)" : "Office Scoped"}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Privilege Tier: </span>
                <span className="font-semibold text-slate-800">{role.tier}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Granular Permission Checklist Grouped by Module */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-burgundy-700" />
              <h3 className="font-semibold text-slate-800 text-sm">
                Granular Permission Matrix ({selectedCodes.size} assigned)
              </h3>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {Array.from(modules.entries()).map(([moduleName, items]) => {
              const allChecked = items.every((i) => selectedCodes.has(i.code));
              return (
                <div key={moduleName} className="border border-slate-200 rounded-lg overflow-hidden">
                  <div className="bg-slate-50/80 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                      Module: {moduleName}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSelectAllModule(items)}
                      className="text-[11px] font-medium text-burgundy-700 hover:text-burgundy-900 cursor-pointer"
                    >
                      {allChecked ? "Deselect All" : "Select All"}
                    </button>
                  </div>

                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {items.map((perm) => {
                      const isChecked = selectedCodes.has(perm.code);
                      const isLocked = isSystemAdminRole && CRITICAL_SYSTEM_PERMISSIONS.has(perm.code);

                      return (
                        <label
                          key={perm.code}
                          className={`flex items-start gap-2.5 p-2 rounded-lg border transition-colors cursor-pointer ${
                            isChecked
                              ? "bg-slate-50/50 border-slate-300"
                              : "border-transparent hover:bg-slate-50"
                          } ${isLocked ? "cursor-not-allowed opacity-80" : ""}`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={isLocked}
                            onChange={() => togglePermission(perm.code)}
                            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-burgundy-700 focus:ring-burgundy-600"
                          />
                          <div className="text-xs">
                            <div className="font-medium text-slate-800 flex items-center gap-1.5">
                              <span>{perm.name}</span>
                              <code className="text-[10px] text-slate-400 font-mono bg-slate-100 px-1 py-0.2 rounded">
                                {perm.code}
                              </code>
                              {isLocked && (
                                <span title="Locked by system security rule">
                                  <Lock className="h-2.5 w-2.5 text-slate-400" />
                                </span>
                              )}
                            </div>
                            {perm.description && (
                              <p className="text-[11px] text-slate-500 mt-0.5">{perm.description}</p>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <Link
              href="/admin/roles"
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
              <span>{isSubmitting ? "Saving..." : "Save Role Configuration"}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
