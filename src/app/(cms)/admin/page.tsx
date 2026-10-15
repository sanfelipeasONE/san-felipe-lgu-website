import * as React from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { AdminContent } from "@/components/admin/admin-content";
import {
  getDashboardSummaryMetrics,
  getContentPublishingActivity,
  getPublishedContentDistribution,
  getRecentContent,
  getPublishedContentByOffice,
  getRecentAdministrativeActivity,
} from "@/server/dashboard/service";
import { DashboardHeader } from "@/components/admin/dashboard/dashboard-header";
import { SummaryMetrics } from "@/components/admin/dashboard/summary-metrics";
import { PublishingActivityChart } from "@/components/admin/dashboard/publishing-activity-chart";
import { PublishedContentDonut } from "@/components/admin/dashboard/published-content-donut";
import { RecentContentTable } from "@/components/admin/dashboard/recent-content-table";
import { QuickActionsPanel } from "@/components/admin/dashboard/quick-actions-panel";
import { OfficeDistributionPanel } from "@/components/admin/dashboard/office-distribution-panel";
import { RecentActivityPanel } from "@/components/admin/dashboard/recent-activity-panel";

export const instant = false;

export const metadata: Metadata = {
  title: "Admin Dashboard | San Felipe LGU CMS",
  description: "San Felipe LGU Administrative Console",
};

interface AdminDashboardPageProps {
  searchParams?: Promise<{
    type?: string;
    status?: string;
  }>;
}

export default async function AdminDashboardPage({ searchParams }: AdminDashboardPageProps) {
  const user = await getCurrentUser();

  if (!user || user.status !== "ACTIVE") {
    redirect("/staff/login");
  }

  const params = searchParams ? await searchParams : {};

  // Fetch all real database analytics in parallel
  const [
    metrics,
    activity,
    distribution,
    recentContent,
    officeDistribution,
    recentActivity,
  ] = await Promise.all([
    getDashboardSummaryMetrics(user),
    getContentPublishingActivity(user),
    getPublishedContentDistribution(user),
    getRecentContent(user, { type: params.type, status: params.status }),
    getPublishedContentByOffice(user),
    getRecentAdministrativeActivity(user),
  ]);

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
      <AdminContent maxWidth="full" className="space-y-6">
        {/* 1. Dashboard Header */}
        <DashboardHeader user={user} />

        {/* 2. Four Summary Metrics Cards */}
        <SummaryMetrics metrics={metrics} />

        {/* 3. Publishing Analytics Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-8">
            <PublishingActivityChart data={activity} />
          </div>
          <div className="lg:col-span-4">
            <PublishedContentDonut distribution={distribution} />
          </div>
        </div>

        {/* 4. Recent Content Table */}
        <RecentContentTable items={recentContent} />

        {/* 5. Quick Actions & Published Content by Office */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-4">
            <QuickActionsPanel user={user} />
          </div>
          <div className="lg:col-span-8">
            <OfficeDistributionPanel distribution={officeDistribution} />
          </div>
        </div>

        {/* 6. Recent Administrative Activity (Permission-aware) */}
        {recentActivity !== null && (
          <RecentActivityPanel activities={recentActivity} />
        )}
      </AdminContent>
    </div>
  );
}
