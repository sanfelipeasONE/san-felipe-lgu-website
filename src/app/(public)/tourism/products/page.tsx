import type { Metadata } from "next";
import { ShoppingBag, Info, MapPin } from "lucide-react";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { TourismCard } from "@/components/tourism/tourism-card";
import { getPublicPublishedTourismByCategory } from "@/server/tourism/service";
import { mapDbTourismToPublic } from "@/server/tourism/mapper";

export const instant = false;

export const metadata: Metadata = {
  title: "Local Products | Municipality of San Felipe",
  description:
    "Local products, agricultural produce, native crafts, and municipal enterprise initiatives in the Municipality of San Felipe, Zambales.",
};

export default async function ProductsPage() {
  const result = await getPublicPublishedTourismByCategory("PRODUCTS");
  const entries = result.entries.map(mapDbTourismToPublic);

  return (
    <main>
      <PageHeader
        eyebrow="MUNICIPAL TOURISM"
        title="Products"
        description="Local produce, native handicrafts, and specialty delicacies of the Municipality of San Felipe, Zambales."
        breadcrumbs={[
          { label: "Tourism" },
          { label: "Products" },
        ]}
      />

      <section className="py-12 sm:py-16 bg-slate-50/50 min-h-[420px]">
        <Container>
          {entries.length === 0 ? (
            <ScrollReveal>
              <div className="max-w-3xl mx-auto bg-white border border-gray-200 rounded-xs p-8 sm:p-10 shadow-2xs text-center space-y-4">
                <div className="w-12 h-12 bg-burgundy-50 border border-burgundy-100 rounded-full flex items-center justify-center mx-auto text-burgundy-800">
                  <ShoppingBag className="w-6 h-6" aria-hidden="true" />
                </div>

                <div>
                  <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-xs bg-burgundy-50 text-burgundy-800 border border-burgundy-100 inline-block">
                    Local Enterprise
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-gov-charcoal mt-3">
                    Local Products &amp; Enterprise
                  </h2>
                  <div className="w-10 h-0.5 bg-gold-500 mx-auto mt-3 mb-3" aria-hidden="true" />
                </div>

                <p className="text-sm text-gov-muted max-w-xl mx-auto leading-relaxed">
                  Official information on local products, agricultural harvest, native crafts, and municipal enterprise initiatives will be published by the Municipality of San Felipe.
                </p>

                <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-center gap-4 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-burgundy-700 shrink-0" aria-hidden="true" />
                    San Felipe, Zambales 2204
                  </span>
                  <span className="hidden sm:inline text-slate-300">•</span>
                  <span className="inline-flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-burgundy-700 shrink-0" aria-hidden="true" />
                    Municipal Tourism and Investments Promotions Office
                  </span>
                </div>
              </div>
            </ScrollReveal>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {entries.map((entry) => (
                <ScrollReveal key={entry.id}>
                  <TourismCard entry={entry} />
                </ScrollReveal>
              ))}
            </div>
          )}
        </Container>
      </section>
    </main>
  );
}
