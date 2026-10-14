import {
  LayoutDashboard,
  Newspaper,
  BookOpen,
  Briefcase,
  FileText,
  Users2,
  PhoneCall,
  Building2,
  Users,
  ShieldCheck,
  History,
  type LucideIcon,
} from "lucide-react";
import { hasPermission, isSystemScoped } from "@/lib/authz/scope";

export type NavSectionKey = "main" | "content" | "administration" | "system";

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
        isImplemented: false,
        phaseLabel: "Phase 12",
      },
      {
        id: "citizens-charter",
        label: "Citizen's Charter",
        href: "/admin/services/citizens-charter",
        icon: BookOpen,
        section: "content",
        description: "Frontline government service procedures and standards",
        requiredPermission: "documents.view",
        isImplemented: false,
        phaseLabel: "Upcoming",
      },
      {
        id: "business-permits",
        label: "Business Permits",
        href: "/admin/services/business-permits",
        icon: Briefcase,
        section: "content",
        description: "Business licensing requirements and application steps",
        requiredPermission: "documents.view",
        isImplemented: false,
        phaseLabel: "Upcoming",
      },
      {
        id: "downloadable-forms",
        label: "Downloadable Forms",
        href: "/admin/services/downloadable-forms",
        icon: FileText,
        section: "content",
        description: "Official municipal application forms and templates",
        requiredPermission: "documents.view",
        isImplemented: false,
        phaseLabel: "Upcoming",
      },
      {
        id: "job-opportunities",
        label: "Job Opportunities",
        href: "/admin/services/job-opportunities",
        icon: Users2,
        section: "content",
        description: "LGU career vacancies and application guidelines",
        requiredPermission: "documents.view",
        isImplemented: false,
        phaseLabel: "Upcoming",
      },
      {
        id: "emergency-hotlines",
        label: "Emergency Hotlines",
        href: "/admin/services/emergency-hotlines",
        icon: PhoneCall,
        section: "content",
        description: "Emergency responders, disaster, and health contact directory",
        requiredPermission: "settings.manage",
        requiredScope: "system",
        isImplemented: false,
        phaseLabel: "Upcoming",
      },
    ],
  },
  {
    key: "administration",
    title: "Administration",
    items: [
      {
        id: "offices",
        label: "Municipal Offices",
        href: "/admin/offices",
        icon: Building2,
        section: "administration",
        description: "Department profiles, office heads, and operational directory",
        requiredPermission: "offices.view",
        requiredScope: "system",
        isImplemented: false,
        phaseLabel: "Upcoming",
      },
      {
        id: "users",
        label: "Staff Accounts",
        href: "/admin/users",
        icon: Users,
        section: "administration",
        description: "Municipal staff accounts and office assignments",
        requiredPermission: "users.view",
        // Notice: Available to Super Admin (all offices) AND Office Admin (own office)
        isImplemented: false,
        phaseLabel: "Phase 17",
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
        isImplemented: false,
        phaseLabel: "Upcoming",
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
        isImplemented: false,
        phaseLabel: "Upcoming",
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
    const visibleItems = section.items.filter((item) => {
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
    });

    return {
      ...section,
      items: visibleItems,
    };
  }).filter((section) => section.items.length > 0);
}
