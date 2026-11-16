import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Palmtree,
  MapPin,
  Building,
  Sparkles,
  ShoppingBag,
  Plus,
  ArrowRight,
  ExternalLink,
  Clock,
  CheckCircle2,
  Archive,
  Compass,
  Edit,
} from "lucide-react";
import type { SessionUser } from "@/server/auth/session";
import type { TourismDashboardData } from "@/server/dashboard/tourism";
import { TOURISM_CATEGORY_LABELS } from "@/lib/validation/tourism";
import { StatusBadge } from "@/components/admin/status-badge";
import { hasPermission } from "@/lib/authz/scope";
import { PERMISSIONS } from "@/server/authz/permissions";

interface TourismDashboardProps {
  data: TourismDashboardData;
  user: SessionUser;
}

export function TourismDashboard({ data, user }: TourismDashboardProps) {
  const canCreate = hasPermission(user, PERMISSIONS.TOURISM_CREATE);
  const canUpdate = hasPermission(user, PERMISSIONS.TOURISM_UPDATE);

  const { metrics, categories, recentEntries } = data;

  const categoryCards = [
    {
      title: "Attractions & Ecotourism",
      count: categories.attractions,
      category: "ATTRACTIONS",
      href: "/admin/tourism?category=ATTRACTIONS",
      icon: Compass,
      color: "text-emerald-700 bg-emerald-50 border-emerald-200",
      description: "Beaches, coastal surfing spots, waterfalls, mountain trails, and natural landmarks.",
    },
    {
      title: "Resorts & Accommodations",
      count: categories.resorts,
      category: "RESORTS",
      href: "/admin/tourism?category=RESORTS",
      icon: Building,
      color: "text-blue-700 bg-blue-50 border-blue-200",
      description: "DOT-accredited resorts, surf camps, boutique hotels, homestays, and beachfront villas.",
    },
    {
      title: "Culture, Heritage & Arts",
      count: categories.cultureAndArts,
      category: "CULTURE_AND_ARTS",
      href: "/admin/tourism?category=CULTURE_AND_ARTS",
      icon: Sparkles,
      color: "text-amber-700 bg-amber-50 border-amber-200",
      description: "Historical ancestral sites, heritage markers, cultural festivals, and artistic communities.",
    },
    {
      title: "Local Products & Gastronomy",
      count: categories.products,
      category: "PRODUCTS",
      href: "/admin/tourism?category=PRODUCTS",
      icon: ShoppingBag,
      color: "text-rose-700 bg-rose-50 border-rose-200",
      description: "San Felipe sweet mangoes, artisanal native crafts, local seafood delicacies, and OTOP merchandise.",
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-burgundy-50 border border-burgundy-100 text-burgundy-800 text-[11px] font-semibold tracking-wide uppercase mb-2">
            <Palmtree className="h-3.5 w-3.5 text-burgundy-700" />
            <span>Municipal Tourism Content Console</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Welcome, {user.name}
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Manage official tourism entries, certified resorts, cultural heritage destinations, and local trade products for the Municipality of San Felipe, Zambales.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link
            href="/tourism"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center font-medium transition-colors rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs h-9 px-3.5 shadow-2xs gap-1.5"
          >
            <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
            <span>Public Tourism Page</span>
          </Link>

          {canCreate && (
            <Link
              href="/admin/tourism/new"
              className="inline-flex items-center justify-center font-medium transition-colors rounded-lg bg-burgundy-700 hover:bg-burgundy-800 text-white text-xs h-9 px-4 shadow-2xs tracking-wide cursor-pointer gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Tourism Entry</span>
            </Link>
          )}
        </div>
      </div>

      {/* 2. Key Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Entries */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-slate-100 text-slate-700 shrink-0">
            <Compass className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{metrics.total}</div>
            <div className="text-xs text-slate-500 font-medium">Total Entries</div>
          </div>
        </div>

        {/* Published */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700 shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{metrics.published}</div>
            <div className="text-xs text-slate-500 font-medium">Published Live</div>
          </div>
        </div>

        {/* Drafts */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-50 text-amber-700 shrink-0">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{metrics.draft}</div>
            <div className="text-xs text-slate-500 font-medium">In Draft</div>
          </div>
        </div>

        {/* Archived */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-slate-100 text-slate-500 shrink-0">
            <Archive className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{metrics.archived}</div>
            <div className="text-xs text-slate-500 font-medium">Archived</div>
          </div>
        </div>
      </div>

      {/* 3. Category Breakdown Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">
            Tourism Categories
          </h2>
          <Link
            href="/admin/tourism"
            className="text-xs font-medium text-burgundy-700 hover:text-burgundy-800 flex items-center gap-1 hover:underline"
          >
            <span>View All in Directory</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {categoryCards.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.category}
                href={cat.href}
                className="group bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className={`p-2 rounded-lg border ${cat.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-xl font-bold text-slate-900">
                      {cat.count}
                    </span>
                  </div>
                  <h3 className="font-semibold text-sm text-slate-900 group-hover:text-burgundy-700 transition-colors">
                    {cat.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {cat.description}
                  </p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-medium text-burgundy-700 group-hover:translate-x-0.5 transition-transform">
                  <span>Manage {cat.title}</span>
                  <ArrowRight className="h-3 w-3" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 4. Recent Entries Table & Quick Help */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Recent Entries */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">
                Recently Updated Tourism Entries
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Latest drafts and publications across municipal attractions, resorts, culture, and products.
              </p>
            </div>
            <Link
              href="/admin/tourism"
              className="text-xs font-semibold text-burgundy-700 hover:text-burgundy-900 hover:underline"
            >
              View directory
            </Link>
          </div>

          {recentEntries.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              <Palmtree className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="font-medium text-slate-700">No tourism entries found</p>
              <p className="mt-1">Create your first municipal tourism attraction or resort entry.</p>
              {canCreate && (
                <Link
                  href="/admin/tourism/new"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-burgundy-700 hover:underline"
                >
                  <Plus className="h-3 w-3" />
                  <span>Create Entry</span>
                </Link>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentEntries.map((item) => (
                <div
                  key={item.id}
                  className="px-5 py-3.5 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 shrink-0 overflow-hidden">
                      {item.featuredImageUrl ? (
                        <Image
                          src={item.featuredImageUrl}
                          alt={item.title}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <Palmtree className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-xs text-slate-900 truncate">
                        {item.title}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <span className="font-medium text-slate-700">
                          {TOURISM_CATEGORY_LABELS[item.category]}
                        </span>
                        {item.location && (
                          <>
                            <span>&bull;</span>
                            <span className="truncate flex items-center gap-1">
                              <MapPin className="h-2.5 w-2.5 text-slate-400" />
                              {item.location}
                            </span>
                          </>
                        )}
                        <span>&bull;</span>
                        <span>{new Date(item.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <StatusBadge status={item.status} size="sm" />
                    {canUpdate && (
                      <Link
                        href={`/admin/tourism/${item.id}/edit`}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-burgundy-700 hover:bg-burgundy-50 transition-colors"
                        title="Edit tourism entry"
                        aria-label={`Edit ${item.title}`}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions & Guidelines */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5">
            <h3 className="font-semibold text-slate-900 text-sm mb-3">
              Tourism Publishing Standards
            </h3>
            <ul className="space-y-2.5 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Featured Imagery:</strong> High-resolution photos (min. 1200x800) with descriptive alt text for accessibility.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Accreditation:</strong> Prioritize DOT-accredited hospitality resorts and official community partner establishments.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Verified Contacts:</strong> Ensure accurate Barangay location, active contact numbers, and operating hours.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Publishing Lifecycle:</strong> Draft entries are private until reviewed and published to the public portal.
                </span>
              </li>
            </ul>

            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-2">
              <Link
                href="/admin/tourism"
                className="w-full inline-flex items-center justify-center font-medium rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs h-8 px-3 transition-colors"
              >
                <span>Browse Tourism Directory</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
