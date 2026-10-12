export interface NavItem {
  title: string;
  href: string;
  description?: string;
}

export const MAIN_NAV_ITEMS: NavItem[] = [
  { title: "Home", href: "/" },
  { title: "About", href: "/about" },
  { title: "Government", href: "/government" },
  { title: "Offices", href: "/offices" },
  { title: "Services", href: "/services" },
  { title: "News", href: "/news" },
];

export const SITE_CONFIG = {
  municipality: "San Felipe",
  province: "Zambales",
  country: "Republic of the Philippines",
  fullTitle: "Municipality of San Felipe, Zambales",
  portalName: "San Felipe LGU Digital Portal",
  // Clearly marked placeholders per Project Rule 22
  contactPlaceholder: {
    address: "Municipal Hall, San Felipe, Zambales, Philippines (Placeholder)",
    email: "info@sanfelipe.gov.ph (Placeholder)",
    phone: "(047) 000-0000 (Placeholder)",
    emergencyHotline: "911 / 117 (National) / (047) 000-0000 (MDRRMO Placeholder)",
  },
} as const;
