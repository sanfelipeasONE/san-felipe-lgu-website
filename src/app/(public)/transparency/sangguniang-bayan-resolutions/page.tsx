import type { Metadata } from "next";
import Link from "next/link";
import {
  FileText,
  Download,
  Eye,
  MapPin,
  Info,
  Calendar,
  Search,
} from "lucide-react";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { getPublishedResolutions } from "@/server/resolutions/service";

export const instant = false;

export const metadata: Metadata = {
  title: "Sangguniang Bayan Resolutions | Municipality of San Felipe",
  description:
    "Official Sangguniang Bayan Resolutions enacted and published by the Municipal Government of San Felipe, Zambales.",
};

interface PublicSbResolutionsPageProps {
  searchParams: Promise<{
    year?: string;
    search?: string;
  }>;
}

export default async function PublicSangguniangBayanResolutionsPage({
  searchParams,
}: PublicSbResolutionsPageProps) {
  const params = await searchParams;
  const parsedYear = params.year ? Number(params.year) : undefined;
  const activeYear =
    parsedYear && Number.isInteger(parsedYear) ? parsedYear : undefined;
  const search = params.search?.trim() || undefined;

  const { resolutions, availableYears } = await getPublishedResolutions({
    year: activeYear,
    search,
  });

  const buildFilterHref = (yr?: number) => {
    const q = new URLSearchParams();
    if (yr) q.set("year", String(yr));
    if (search) q.set("search", search);
    const qs = q.toString();
    return `/transparency/sangguniang-bayan-resolutions${qs ? `?${qs}` : ""}`;
  };

  return (
    <div>
      <PageHeader
        eyebrow="TRANSPARENCY & ACCOUNTABILITY"
        title="Sangguniang Bayan Resolutions"
        description="Official legislative resolutions enacted by the Sangguniang Bayan of the Municipality of San Felipe, Zambales."
        breadcrumbs={[
          { label: "Transparency", href: "/transparency" },
          { label: "Sangguniang Bayan Resolutions" },
        ]}
      />

      <section className="py-10 sm:py-14 bg-slate-50/50 min-h-[460px]">
        <Container>
          <ScrollReveal>
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Year & Search Filter Bar */}
              {(availableYears.length > 0 || search) && (
                <div className="bg-white border border-gray-200 rounded-xs p-4 shadow-2xs space-y-3">
                  <form
                    action="/transparency/sangguniang-bayan-resolutions"
                    method="GET"
                    className="flex flex-col sm:flex-row gap-2"
                  >
                    {activeYear && (
                      <input type="hidden" name="year" value={activeYear} />
                    )}
                    <div className="relative flex-1">
                      <Search
                        className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
                        aria-hidden="true"
                      />
                      <input
                        type="text"
                        name="search"
                        defaultValue={search ?? ""}
                        placeholder="Search by resolution number, title, or keyword..."
                        aria-label="Search Sangguniang Bayan Resolutions"
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xs focus:outline-hidden focus:ring-2 focus:ring-burgundy-700/20 focus:border-burgundy-700"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-4 py-2 text-xs font-semibold rounded-xs bg-burgundy-800 hover:bg-burgundy-900 text-white transition-colors cursor-pointer"
                    >
                      Search
                    </button>
                    {(search || activeYear) && (
                      <Link
                        href="/transparency/sangguniang-bayan-resolutions"
                        className="px-3 py-2 text-xs font-semibold rounded-xs border border-gray-200 text-slate-700 hover:bg-slate-50 transition-colors inline-flex items-center justify-center"
                      >
                        Reset
                      </Link>
                    )}
                  </form>

                  {availableYears.length > 0 && (
                    <div
                      className="flex flex-wrap items-center gap-2 pt-1"
                      role="navigation"
                      aria-label="Filter resolutions by year"
                    >
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mr-1">
                        Year:
                      </span>
                      <Link
                        href={buildFilterHref(undefined)}
                        className={`px-3 py-1 rounded-xs text-xs font-semibold transition-colors ${
                          !activeYear
                            ? "bg-burgundy-800 text-white"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        All Years
                      </Link>
                      {availableYears.map((yr) => (
                        <Link
                          key={yr}
                          href={buildFilterHref(yr)}
                          className={`px-3 py-1 rounded-xs text-xs font-semibold transition-colors ${
                            activeYear === yr
                              ? "bg-burgundy-800 text-white"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          }`}
                        >
                          {yr}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Resolutions List or Empty State */}
              {resolutions.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-xs p-8 sm:p-10 shadow-2xs text-center space-y-4">
                  <div className="w-12 h-12 bg-burgundy-50 border border-burgundy-100 rounded-full flex items-center justify-center mx-auto text-burgundy-800">
                    <FileText className="w-6 h-6" aria-hidden="true" />
                  </div>

                  <div>
                    <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-xs bg-burgundy-50 text-burgundy-800 border border-burgundy-100 inline-block">
                      Legislative Issuances
                    </span>
                    <h2 className="text-xl sm:text-2xl font-bold text-gov-charcoal mt-3">
                      {activeYear || search
                        ? "No published resolutions match your selected filter."
                        : "No Sangguniang Bayan Resolutions are currently published."}
                    </h2>
                    <div
                      className="w-10 h-0.5 bg-gold-500 mx-auto mt-3 mb-3"
                      aria-hidden="true"
                    />
                  </div>

                  <p className="text-sm text-gov-muted max-w-xl mx-auto leading-relaxed">
                    Official Sangguniang Bayan Resolutions adopted by the Municipality of San Felipe will appear here upon publication.
                  </p>

                  <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-center gap-4 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin
                        className="w-3.5 h-3.5 text-burgundy-700 shrink-0"
                        aria-hidden="true"
                      />
                      2nd Floor, Municipal Hall Complex, San Felipe, Zambales
                    </span>
                    <span className="hidden sm:inline text-slate-300">•</span>
                    <span className="inline-flex items-center gap-1.5">
                      <Info
                        className="w-3.5 h-3.5 text-burgundy-700 shrink-0"
                        aria-hidden="true"
                      />
                      Office of the Sangguniang Bayan
                    </span>
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-xs shadow-2xs divide-y divide-gray-100">
                  {resolutions.map((res) => (
                    <article
                      key={res.id}
                      className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
                    >
                      <div className="space-y-1.5 max-w-2xl">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-xs bg-burgundy-50 text-burgundy-800 border border-burgundy-100">
                            {res.resolutionNumber}
                          </span>
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-xs bg-slate-100 text-slate-700">
                            {res.year}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] text-gov-muted">
                            <Calendar className="w-3 h-3" aria-hidden="true" />
                            Adopted{" "}
                            {new Date(res.adoptedAt).toLocaleDateString("en-PH", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-slate-600 uppercase px-1.5 py-0.5 bg-slate-100 rounded-xs">
                            PDF • {res.fileSizeFormatted}
                          </span>
                        </div>

                        <h2 className="text-base sm:text-lg font-bold text-gov-charcoal">
                          {res.title}
                        </h2>

                        {res.summary && (
                          <p className="text-xs sm:text-sm text-gov-muted leading-relaxed">
                            {res.summary}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          href={`/resolutions/${res.id}/view`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xs border border-gray-200 bg-white hover:bg-slate-50 text-xs font-semibold text-gov-charcoal transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5 text-burgundy-700" aria-hidden="true" />
                          <span>View PDF</span>
                        </a>
                        <a
                          href={`/resolutions/${res.id}/download`}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xs bg-burgundy-800 hover:bg-burgundy-900 text-white text-xs font-semibold transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Download</span>
                        </a>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </ScrollReveal>
        </Container>
      </section>
    </div>
  );
}
