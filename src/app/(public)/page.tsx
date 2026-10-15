import * as React from "react";
import { HeroSection } from "@/components/home/hero-section";
import { GovernmentServices } from "@/components/home/government-services";
import { MunicipalOfficialsPreview } from "@/components/home/municipal-officials-preview";
import { MunicipalOfficesPreview } from "@/components/home/municipal-offices-preview";
import { LatestNews } from "@/components/home/latest-news";
import { EmergencyHotlines } from "@/components/home/emergency-hotlines";
import { MunicipalContactSection } from "@/components/home/municipal-contact-section";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* 1. Hero Section */}
      <HeroSection />

      {/* 2. Government Services */}
      <GovernmentServices />

      {/* 3. Municipal Officials Leadership Preview */}
      <MunicipalOfficialsPreview />

      {/* 4. Municipal Offices Preview */}
      <MunicipalOfficesPreview />

      {/* 5. Latest News & Announcements */}
      <React.Suspense fallback={<div className="py-14 bg-slate-50/60" />}>
        <LatestNews />
      </React.Suspense>

      {/* 6. Emergency Hotlines (Prominent Burgundy Section) */}
      <EmergencyHotlines />

      {/* 7. Visit the Municipal Government (Contact & Map) */}
      <MunicipalContactSection />
    </div>
  );
}
