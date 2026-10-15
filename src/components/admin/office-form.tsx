"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  updateOfficeSchema,
  type UpdateOfficeInput,
} from "@/lib/validation/offices";
import { updateOfficeAction } from "@/app/(cms)/admin/offices/actions";
import {
  Save,
  ArrowLeft,
  Building2,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { StatusBadge } from "@/components/admin/status-badge";
import { ConcurrencyConflictBanner } from "@/components/admin/concurrency-conflict-banner";
import { toast } from "@/components/ui/toast";
import type { OfficeStatus } from "@prisma/client";

interface OfficeFormProps {
  initialData: {
    id: string;
    name: string;
    shortName: string | null;
    slug: string;
    location: string | null;
    officeHours: string | null;
    officeHead: string | null;
    email: string | null;
    phone: string | null;
    description: string | null;
    mandate: string | null;
    status: OfficeStatus;
    updatedAt: string;
  };
}

export function OfficeForm({ initialData }: OfficeFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateOfficeInput>({
    resolver: zodResolver(updateOfficeSchema),
    defaultValues: {
      name: initialData.name,
      shortName: initialData.shortName ?? "",
      location: initialData.location ?? "",
      officeHours: initialData.officeHours ?? "",
      officeHead: initialData.officeHead ?? "",
      email: initialData.email ?? "",
      phone: initialData.phone ?? "",
      description: initialData.description ?? "",
      mandate: initialData.mandate ?? "",
      status: initialData.status,
      expectedUpdatedAt: initialData.updatedAt,
    },
  });

  const [selectedStatus, setSelectedStatus] = React.useState<OfficeStatus>(initialData.status);

  const onSubmit = async (data: UpdateOfficeInput) => {
    setServerError(null);
    setIsSubmitting(true);

    try {
      const payload: UpdateOfficeInput = {
        name: data.name,
        shortName: data.shortName || null,
        location: data.location || null,
        officeHours: data.officeHours || null,
        officeHead: data.officeHead || null,
        email: data.email || null,
        phone: data.phone || null,
        description: data.description || null,
        mandate: data.mandate || null,
        status: data.status,
        expectedUpdatedAt: initialData.updatedAt,
      };

      const result = await updateOfficeAction(initialData.id, payload);
      if (!result.success) {
        setServerError(result.error || "Failed to update municipal office.");
        toast.error(result.error || "Failed to update municipal office.");
        return;
      }

      toast.success("Municipal office updated.");
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
          <ConcurrencyConflictBanner message="This municipal office record was modified in another session. Please reload the latest version before saving your changes." />
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

      {selectedStatus === "INACTIVE" && (
        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-semibold text-sm">Municipal Office Deactivation Warning</p>
            <p>
              Setting this office to <strong>INACTIVE</strong> triggers immediate governance protections:
            </p>
            <ul className="list-disc list-inside space-y-0.5 text-amber-800">
              <li>All active user sessions for staff assigned to this office will be invalidated.</li>
              <li>Downloadable forms and job opportunities belonging to this office will be hidden from public view.</li>
              <li>Staff assigned to this office will be blocked from creating or publishing new content.</li>
              <li>Previously published official news will remain publicly visible for historical records.</li>
            </ul>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-burgundy-700" />
              <h3 className="font-semibold text-slate-800 text-sm">
                Official Department Profile & Operational Details
              </h3>
              <StatusBadge status={initialData.status} size="sm" />
            </div>
            <Link
              href="/admin/offices"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Offices
            </Link>
          </div>

          <div className="p-6 space-y-5">
            {/* Office Name & Acronym */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label htmlFor="name" className="block text-xs font-medium text-slate-700 mb-1">
                  Official Department Name <span className="text-rose-500">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  {...register("name")}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-burgundy-600/20 focus:border-burgundy-600 transition-colors font-medium text-slate-900"
                />
                {errors.name && (
                  <p className="text-xs text-rose-600 mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="shortName" className="block text-xs font-medium text-slate-700 mb-1">
                  Official Acronym / Short Name
                </label>
                <input
                  id="shortName"
                  type="text"
                  {...register("shortName")}
                  placeholder="e.g. MHO"
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-burgundy-600/20 focus:border-burgundy-600 transition-colors font-mono"
                />
                {errors.shortName && (
                  <p className="text-xs text-rose-600 mt-1">{errors.shortName.message}</p>
                )}
              </div>
            </div>

            {/* Permanent Slug & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Permanent Canonical Slug (Read-only)
                </label>
                <input
                  type="text"
                  value={initialData.slug}
                  disabled
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 bg-slate-100 text-slate-500 font-mono cursor-not-allowed"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Immutable canonical identifier used in public routes and system records.
                </p>
              </div>

              <div>
                <label htmlFor="status" className="block text-xs font-medium text-slate-700 mb-1">
                  Department Status <span className="text-rose-500">*</span>
                </label>
                <select
                  id="status"
                  {...register("status", {
                    onChange: (e) => setSelectedStatus(e.target.value as OfficeStatus),
                  })}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-burgundy-600/20 focus:border-burgundy-600 transition-colors bg-white font-medium"
                >
                  <option value="ACTIVE">ACTIVE — Frontline / Operational</option>
                  <option value="INACTIVE">INACTIVE — Suspended / Reorganized</option>
                </select>
                {errors.status && (
                  <p className="text-xs text-rose-600 mt-1">{errors.status.message}</p>
                )}
              </div>
            </div>

            {/* Head of Office & Office Hours */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="officeHead" className="block text-xs font-medium text-slate-700 mb-1">
                  Office Head / Department OIC
                </label>
                <input
                  id="officeHead"
                  type="text"
                  {...register("officeHead")}
                  placeholder="e.g. Dr. Juan Dela Cruz, MHO"
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-burgundy-600/20 focus:border-burgundy-600 transition-colors"
                />
                {errors.officeHead && (
                  <p className="text-xs text-rose-600 mt-1">{errors.officeHead.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="officeHours" className="block text-xs font-medium text-slate-700 mb-1">
                  Public Office Hours
                </label>
                <input
                  id="officeHours"
                  type="text"
                  {...register("officeHours")}
                  placeholder="e.g. Monday - Friday: 8:00 AM - 5:00 PM"
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-burgundy-600/20 focus:border-burgundy-600 transition-colors"
                />
                {errors.officeHours && (
                  <p className="text-xs text-rose-600 mt-1">{errors.officeHours.message}</p>
                )}
              </div>
            </div>

            {/* Location */}
            <div>
              <label htmlFor="location" className="block text-xs font-medium text-slate-700 mb-1">
                Physical Location / Office Address
              </label>
              <input
                id="location"
                type="text"
                {...register("location")}
                placeholder="e.g. Ground Floor, Municipal Hall Complex, San Felipe, Zambales"
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-burgundy-600/20 focus:border-burgundy-600 transition-colors"
              />
              {errors.location && (
                <p className="text-xs text-rose-600 mt-1">{errors.location.message}</p>
              )}
            </div>

            {/* Contact Email & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="email" className="block text-xs font-medium text-slate-700 mb-1">
                  Department Public Email
                </label>
                <input
                  id="email"
                  type="email"
                  {...register("email")}
                  placeholder="mho@sanfelipe.gov.ph"
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-burgundy-600/20 focus:border-burgundy-600 transition-colors"
                />
                {errors.email && (
                  <p className="text-xs text-rose-600 mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="phone" className="block text-xs font-medium text-slate-700 mb-1">
                  Official Contact Number
                </label>
                <input
                  id="phone"
                  type="text"
                  {...register("phone")}
                  placeholder="e.g. (047) 913-2000"
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-burgundy-600/20 focus:border-burgundy-600 transition-colors"
                />
                {errors.phone && (
                  <p className="text-xs text-rose-600 mt-1">{errors.phone.message}</p>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-xs font-medium text-slate-700 mb-1">
                Department Overview
              </label>
              <textarea
                id="description"
                rows={3}
                {...register("description")}
                placeholder="Overview of the office's civic functions and responsibilities..."
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-burgundy-600/20 focus:border-burgundy-600 transition-colors"
              />
              {errors.description && (
                <p className="text-xs text-rose-600 mt-1">{errors.description.message}</p>
              )}
            </div>

            {/* Mandate */}
            <div>
              <label htmlFor="mandate" className="block text-xs font-medium text-slate-700 mb-1">
                Official Mandate
              </label>
              <textarea
                id="mandate"
                rows={3}
                {...register("mandate")}
                placeholder="Legal basis and operational charter..."
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-burgundy-600/20 focus:border-burgundy-600 transition-colors"
              />
              {errors.mandate && (
                <p className="text-xs text-rose-600 mt-1">{errors.mandate.message}</p>
              )}
            </div>
          </div>

          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <Link
              href="/admin/offices"
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
              <span>{isSubmitting ? "Saving..." : "Save Office Profile"}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
