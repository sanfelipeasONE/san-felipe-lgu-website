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
  contact: {
    address: "Municipal Hall Compound, National Highway, San Felipe, Zambales 2204",
    email: "lgu.sanfelipe@gmail.com",
    phone: "0969-540-9138",
    facebook: "https://www.facebook.com/sanfelipeasone",
    emergencyHotlines: {
      mdrrmo: "0929-183-8441",
      police: "0998-598-5509",
      bfp: "0946-451-2121",
      rhu: "0931-793-8035",
    },
  },
} as const;
