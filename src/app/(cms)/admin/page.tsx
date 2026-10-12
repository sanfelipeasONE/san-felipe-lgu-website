import * as React from "react";
import { Container } from "@/components/layout/container";
import { SectionHeading } from "@/components/layout/section-heading";

export default function AdminDashboardPage() {
  return (
    <Container>
      <SectionHeading
        badge="Staff Portal"
        title="Municipal CMS Overview"
        subtitle="Multi-office content management and administrative workflows are scheduled for Phase 2."
      />
    </Container>
  );
}
