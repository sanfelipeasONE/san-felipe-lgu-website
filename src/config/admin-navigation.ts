import {
  LayoutDashboard,
  Newspaper,
  FileText,
  Users2,
  Users,
  ShieldCheck,
  History,
  Layers,
  type LucideIcon,
} from "lucide-react";
import { hasPermission, isSystemScoped } from "@/lib/authz/scope";

export type NavSectionKey = "main" | "content" | "administration" | "system";

export interface AdminNavChildItem {
  id: string;
  label: string;
  href: string;
  description?: string;
  requiredPermission?: string;
  requiredScope?: "system" | "office";
}

export interface AdminNavItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  section: NavSectionKey;
  description: string;
  requiredPermission?: string;
  requiredScope?: "system" | "office";
  isImplemented: boolean;
  phaseLabel?: string;
  children?: AdminNavChildItem[];
}

export interface AdminNavSection {
  key: NavSectionKey;
  title: string;
  items: AdminNavItem[];
}

export const ADMIN_NAV_CONFIG: AdminNavSection[] = [
  {
    key: "main",
    title: "Main",
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        href: "/admin",
        icon: LayoutDashboard,
        section: "main",
        description: "Municipal workspace overview and system status",
        isImplemented: true,
      },
    ],
  },
  {
    key: "content",
    title: "Content Management",
    items: [
      {
        id: "news",
        label: "News & Advisories",
        href: "/admin/news",
        icon: Newspaper,
        section: "content",
        description: "Press releases, public advisories, and municipal news",
        requiredPermission: "posts.view",
        isImplemented: true,
      },
      {
        id: "services",
        label: "Municipal Services",
        href: "/admin/services",
        icon: Layers,
        section: "content",
        description: "Official municipal frontline service guidelines and content",
        requiredPermission: "services.view",
        isImplemented: true,
        children: [
          {
            id: "services-citizens-charter",
            label: "Citizen's Charter",
            href: "/admin/services/citizens-charter/edit",
            requiredPermission: "services.view",
          },
          {
            id: "services-business-permits",
            label: "Business Permits",
            href: "/admin/services/business-permits/edit",
            requiredPermission: "services.view",
          },
        ],
      },
      {
        id: "documents",
        label: "Documents",
        href: "/admin/documents",
        icon: FileText,
        section: "content",
        description: "Official municipal forms, guidelines, and public documents",
        requiredPermission: "documents.view",
        isImplemented: true,
      },
      {
        id: "job-opportunities",
        label: "Job Opportunities",
        href: "/admin/jobs",
        icon: Users2,
        section: "content",
        description: "LGU career vacancies and application guidelines",
        requiredPermission: "jobs.view",
        isImplemented: true,
      },
    ],
  },
  {
    key: "administration",
    title: "Administration",
    items: [
      {
        id: "users",
        label: "Accounts",
        href: "/admin/users",
        icon: Users,
        section: "administration",
        description: "Municipal administrator accounts and operational identity",
        requiredPermission: "users.view",
        // Available to Super Admin (all offices) AND Office Admin (own office)
        isImplemented: true,
      },
      {
        id: "roles",
        label: "Roles & Permissions",
        href: "/admin/roles",
        icon: ShieldCheck,
        section: "administration",
        description: "System role definitions and granular authority assignments",
        requiredPermission: "settings.manage",
        requiredScope: "system",
        isImplemented: true,
      },
    ],
  },
  {
    key: "system",
    title: "System",
    items: [
      {
        id: "audit-logs",
        label: "Audit Logs",
        href: "/admin/audit-logs",
        icon: History,
        section: "system",
        description: "Immutable security, authentication, and content audit trail",
        requiredPermission: "audit.view",
        requiredScope: "system",
        isImplemented: true,
      },
    ],
  },
];

/**
 * Filters the master navigation tree against the user's server-resolved
 * permissions and operational scope.
 *
 * Rules:
 * - If requiredPermission is present, user MUST hold that permission code.
 * - If requiredScope is "system", user MUST have isSystemScope === true.
 * - If requiredScope is "office", user MUST have isSystemScope === false.
 * - Empty sections are stripped.
 */
export function getVisibleNavSections(user: {
  permissions: string[];
  isSystemScope: boolean;
}): AdminNavSection[] {
  return ADMIN_NAV_CONFIG.map((section) => {
    const visibleItems = section.items
      .filter((item) => {
        // 1. Check required permission
        if (item.requiredPermission && !hasPermission(user, item.requiredPermission)) {
          return false;
        }

        // 2. Check required scope
        if (item.requiredScope === "system" && !isSystemScoped(user)) {
          return false;
        }
        if (item.requiredScope === "office" && isSystemScoped(user)) {
          return false;
        }

        return true;
      })
      .map((item) => {
        if (!item.children || item.children.length === 0) {
          return item;
        }
        const visibleChildren = item.children.filter((child) => {
          if (child.requiredPermission && !hasPermission(user, child.requiredPermission)) {
            return false;
          }
          if (child.requiredScope === "system" && !isSystemScoped(user)) {
            return false;
          }
          if (child.requiredScope === "office" && isSystemScoped(user)) {
            return false;
          }
          return true;
        });
        return {
          ...item,
          children: visibleChildren,
        };
      });

    return {
      ...section,
      items: visibleItems,
    };
  }).filter((section) => section.items.length > 0);
}
