import * as React from "react";
import { HeroSection } from "@/components/home/hero-section";
import { LatestAdvisory } from "@/components/home/latest-advisory";
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

      {/* 2. Latest Advisory Strip */}
      <LatestAdvisory />

      {/* 3. Government Services */}
      <GovernmentServices />

      {/* 4. Municipal Officials Leadership Preview */}
      <MunicipalOfficialsPreview />

      {/* 5. Municipal Offices Preview */}
      <MunicipalOfficesPreview />

      {/* 6. Latest News & Announcements */}
      <LatestNews />

      {/* 7. Emergency Hotlines (Prominent Burgundy Section) */}
      <EmergencyHotlines />

      {/* 9. Visit the Municipal Government (Contact & Map) */}
      <MunicipalContactSection />
    </div>
  );
}
