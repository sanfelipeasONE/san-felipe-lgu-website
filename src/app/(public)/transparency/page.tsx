import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FileText, ScrollText } from "lucide-react";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

export const instant = false;

export const metadata: Metadata = {
  title: "Transparency | Municipality of San Felipe",
  description:
    "Access municipal transparency resources, procurement notices, and State of the Municipal Address (SOMA) disclosures published by the Municipal Government of San Felipe, Zambales.",
};

export default function TransparencyLandingPage() {
  return (
    <main>
      <PageHeader
        eyebrow="TRANSPARENCY & ACCOUNTABILITY"
        title="Transparency"
        description="Access municipal transparency resources, procurement notices, and official executive disclosures."
        breadcrumbs={[{ label: "Transparency" }]}
      />

      <section className="py-12 sm:py-16 bg-slate-50/50 min-h-[460px]">
        <Container>
          <div className="max-w-4xl mx-auto">
            <ScrollReveal>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                {/* Procurement */}
                <Link
                  href="/transparency/procurement"
                  className="group flex flex-col justify-between p-6 sm:p-8 rounded-xs bg-white border border-gray-200/80 hover:border-burgundy-700 hover:shadow-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy-700"
                >
                  <div className="space-y-4">
                    <div className="w-14 h-14 rounded-full bg-burgundy-50 border border-burgundy-100 flex items-center justify-center text-burgundy-800 group-hover:scale-105 transition-transform">
                      <FileText className="w-7 h-7" aria-hidden="true" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-xs bg-burgundy-50 text-burgundy-800 border border-burgundy-100 inline-block mb-2">
                        Public Disclosures
                      </span>
                      <h2 className="text-xl sm:text-2xl font-bold text-gov-charcoal group-hover:text-burgundy-800 transition-colors">
                        Procurement
                      </h2>
                      <p className="text-xs sm:text-sm text-gov-muted mt-2 leading-relaxed">
                        Official public procurement notices, bidding opportunities, invitations to bid, and transparency disclosures issued by the Municipal Government of San Felipe and the Bids and Awards Committee (BAC).
                      </p>
                    </div>
                  </div>
                  <div className="pt-6 mt-6 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-burgundy-800 group-hover:text-burgundy-900">
                    <span>View Procurement Notices & Disclosures</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                  </div>
                </Link>

                {/* State of the Municipal Address (SOMA) */}
                <Link
                  href="/transparency/soma"
                  className="group flex flex-col justify-between p-6 sm:p-8 rounded-xs bg-white border border-gray-200/80 hover:border-burgundy-700 hover:shadow-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy-700"
                >
                  <div className="space-y-4">
                    <div className="w-14 h-14 rounded-full bg-burgundy-50 border border-burgundy-100 flex items-center justify-center text-burgundy-800 group-hover:scale-105 transition-transform">
                      <ScrollText className="w-7 h-7" aria-hidden="true" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-xs bg-burgundy-50 text-burgundy-800 border border-burgundy-100 inline-block mb-2">
                        Executive Disclosures
                      </span>
                      <h2 className="text-xl sm:text-2xl font-bold text-gov-charcoal group-hover:text-burgundy-800 transition-colors">
                        State of the Municipal Address (SOMA)
                      </h2>
                      <p className="text-xs sm:text-sm text-gov-muted mt-2 leading-relaxed">
                        Official State of the Municipal Address (SOMA) reports, annual executive summaries, and transparency disclosures delivered by the Municipal Mayor of San Felipe, Zambales.
                      </p>
                    </div>
                  </div>
                  <div className="pt-6 mt-6 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-burgundy-800 group-hover:text-burgundy-900">
                    <span>View State of the Municipal Address (SOMA) Publications</span>
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
