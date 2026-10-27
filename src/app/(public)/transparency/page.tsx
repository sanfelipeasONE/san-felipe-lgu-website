import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FileText, Scale } from "lucide-react";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

export const instant = false;

export const metadata: Metadata = {
  title: "Transparency | Municipality of San Felipe",
  description:
    "Access municipal transparency resources and public disclosures published by the Municipal Government of San Felipe, Zambales.",
};

export default function TransparencyLandingPage() {
  return (
    <main>
      <PageHeader
        eyebrow="TRANSPARENCY & ACCOUNTABILITY"
        title="Transparency"
        description="Access municipal transparency resources and public disclosures."
        breadcrumbs={[{ label: "Transparency" }]}
      />

      <section className="py-12 sm:py-16 bg-slate-50/50 min-h-[460px]">
        <Container>
          <div className="max-w-4xl mx-auto">
            <ScrollReveal>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                {/* 1. Procurement */}
                <Link
                  href="/transparency/procurement"
                  className="group flex flex-col justify-between p-6 sm:p-8 rounded-xs bg-white border border-gray-200/80 hover:border-burgundy-700 hover:shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy-700"
                >
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-full bg-burgundy-50 border border-burgundy-100 flex items-center justify-center text-burgundy-800 group-hover:scale-105 transition-transform">
                      <FileText className="w-6 h-6" aria-hidden="true" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-xs bg-burgundy-50 text-burgundy-800 border border-burgundy-100 inline-block mb-2">
                        Public Disclosures
                      </span>
                      <h2 className="text-xl font-bold text-gov-charcoal group-hover:text-burgundy-800 transition-colors">
                        Procurement
                      </h2>
                      <p className="text-xs sm:text-sm text-gov-muted mt-2 leading-relaxed">
                        Official public procurement notices, bidding opportunities, and procurement publications issued by the Municipal Government of San Felipe, Zambales.
                      </p>
                    </div>
                  </div>
                  <div className="pt-6 mt-6 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-burgundy-800 group-hover:text-burgundy-900">
                    <span>View Procurement Notices</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                  </div>
                </Link>

                {/* 2. Bids and Awards Committee (BAC) */}
                <Link
                  href="/transparency/bac"
                  className="group flex flex-col justify-between p-6 sm:p-8 rounded-xs bg-white border border-gray-200/80 hover:border-burgundy-700 hover:shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy-700"
                >
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-full bg-burgundy-50 border border-burgundy-100 flex items-center justify-center text-burgundy-800 group-hover:scale-105 transition-transform">
                      <Scale className="w-6 h-6" aria-hidden="true" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-xs bg-burgundy-50 text-burgundy-800 border border-burgundy-100 inline-block mb-2">
                        Committee Notices
                      </span>
                      <h2 className="text-xl font-bold text-gov-charcoal group-hover:text-burgundy-800 transition-colors">
                        Bids and Awards Committee (BAC)
                      </h2>
                      <p className="text-xs sm:text-sm text-gov-muted mt-2 leading-relaxed">
                        Official procurement notices, resolutions, invitations to bid, and public disclosures issued by the Bids and Awards Committee.
                      </p>
                    </div>
                  </div>
                  <div className="pt-6 mt-6 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-burgundy-800 group-hover:text-burgundy-900">
                    <span>View BAC Disclosures</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                  </div>
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </Container>
      </section>
    </main>
  );
}
