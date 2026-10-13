import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { ABOUT_DATA } from "@/config/about-data";

export const metadata: Metadata = {
  title: "History of San Felipe | Municipality of San Felipe",
  description:
    "Learn about the history, vision, and mission of the Municipality of San Felipe, Zambales.",
};

export default function AboutSanFelipePage() {
  const { header, history, direction } = ABOUT_DATA;

  return (
    <main>
      {/* 1. Compact About Page Header */}
      <PageHeader
        eyebrow={`• ${header.eyebrow}`}
        title={header.title}
        description={header.description}
        breadcrumbs={header.breadcrumb}
      />

      {/* 2. History Section */}
      <section
        id="history"
        className="py-14 sm:py-18 lg:py-20 bg-white"
        aria-labelledby="history-heading"
      >
        <Container>
          <ScrollReveal>
            {/* Centered Editorial Section Header */}
            <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
              <span className="text-xs font-bold uppercase tracking-widest text-gold-700 block mb-1.5">
                {history.eyebrow}
              </span>
              <h2
                id="history-heading"
                className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-burgundy-900 tracking-tight"
              >
                {history.title}
              </h2>
              <div
                className="w-12 h-0.5 bg-gold-600 mx-auto mt-3"
                aria-hidden="true"
              />
            </div>

            {/* Editorial Reading Container */}
            <article className="max-w-3xl mx-auto space-y-6 text-gov-charcoal text-sm sm:text-[15px] lg:text-base leading-relaxed sm:leading-loose">
              {/* Paragraph 1 with Drop Cap */}
              <p>
                <span
                  className="float-left text-4xl sm:text-5xl font-black leading-none pr-2.5 pt-1 text-gov-charcoal select-none"
                  aria-hidden="true"
                >
                  {history.paragraphs[0].charAt(0)}
                </span>
                {history.paragraphs[0].slice(1)}
              </p>

              {/* Remaining Verified History Paragraphs */}
              {history.paragraphs.slice(1).map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </article>
          </ScrollReveal>
        </Container>
      </section>

      {/* 3. Vision & Mission Section */}
      <section
        id="vision-mission"
        className="py-14 sm:py-18 lg:py-20 bg-burgundy-900 text-white"
        aria-labelledby="direction-heading"
      >
        <Container>
          <ScrollReveal>
            {/* Centered Direction Header */}
            <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-14">
              <span className="text-xs font-bold uppercase tracking-widest text-gold-400 block mb-1.5">
                {direction.eyebrow}
              </span>
              <h2
                id="direction-heading"
                className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight"
              >
                {direction.title}
              </h2>
              <div
                className="w-12 h-0.5 bg-gold-500 mx-auto mt-3"
                aria-hidden="true"
              />
            </div>

            {/* 2-Column Desktop Grid / Stacked Mobile Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 max-w-5xl mx-auto items-start">
              {/* Vision Column */}
              <div className="space-y-3">
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-gold-400">
                  {direction.vision.label}
                </h3>
                <p className="text-white/95 text-xs sm:text-sm leading-relaxed sm:leading-loose">
                  {direction.vision.text}
                </p>
              </div>

              {/* Mission Column */}
              <div className="space-y-3">
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-gold-400">
                  {direction.mission.label}
                </h3>
                <p className="text-white/95 text-xs sm:text-sm leading-relaxed sm:leading-loose">
                  {direction.mission.text}
                </p>
              </div>
            </div>
          </ScrollReveal>
        </Container>
      </section>
    </main>
  );
}
