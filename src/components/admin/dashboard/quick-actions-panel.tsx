import * as React from "react";
import Link from "next/link";
import {
  Newspaper,
  Upload,
  Briefcase,
  Users,
  UserPlus,
  ChevronRight,
} from "lucide-react";
import type { SessionUser } from "@/server/auth/session";
import { hasPermission } from "@/lib/authz/scope";

interface QuickActionsPanelProps {
  user: SessionUser;
}

export function QuickActionsPanel({ user }: QuickActionsPanelProps) {
  const actions = [
    {
      label: "Create News Article",
      href: "/admin/news/new",
      icon: Newspaper,
      allowed: hasPermission(user, "posts.create"),
    },
    {
      label: "Upload Document",
      href: "/admin/documents/new",
      icon: Upload,
      allowed: hasPermission(user, "documents.create"),
    },
    {
      label: "Post Job Opportunity",
      href: "/admin/jobs/new",
      icon: Briefcase,
      allowed: hasPermission(user, "jobs.create"),
    },
    {
      label: "Create Account",
      href: "/admin/users/new",
      icon: UserPlus,
      allowed: hasPermission(user, "users.create"),
    },
    {
      label: "Manage Accounts",
      href: "/admin/users",
      icon: Users,
      allowed: hasPermission(user, "users.view"),
    },
  ];

  const permittedActions = actions.filter((a) => a.allowed);

  return (
    <div className="bg-white border border-gray-200/90 rounded-xs p-5 shadow-2xs flex flex-col justify-between h-full">
      <div>
        <div className="pb-3 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gov-charcoal tracking-tight">
            Quick Actions
          </h2>
          <p className="text-xs text-gov-muted mt-0.5">
            Common municipal publishing and administration tasks.
          </p>
        </div>

        <div className="mt-4 space-y-2.5">
          {permittedActions.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xs border border-dashed border-gray-200">
              No administrative quick actions available for your current permission scope.
            </div>
          ) : (
            permittedActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.label}
                  href={action.href}
                  className="flex items-center justify-between p-3 rounded-xs border border-gray-200/90 bg-white hover:bg-slate-50/80 hover:border-burgundy-300 text-xs font-semibold text-gov-charcoal group transition-all duration-150 shadow-2xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-xs bg-slate-50 border border-gray-200 flex items-center justify-center text-slate-600 group-hover:text-burgundy-700 group-hover:bg-burgundy-50 group-hover:border-burgundy-200 transition-colors">
                      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                    </div>
                    <span>{action.label}</span>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-burgundy-700 group-hover:translate-x-0.5 transition-all" />
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
