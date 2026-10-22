export interface NavItem {
  title: string;
  href: string;
  description?: string;
}

export interface SubNavItem {
  title: string;
  href: string;
}

export const NAV_DROPDOWN_ITEMS: Record<string, SubNavItem[]> = {
  Government: [
    { title: "Municipal Officials", href: "/government/officials" },
    { title: "All Municipal Offices", href: "/offices" },
  ],
  Services: [
    { title: "Citizen's Charter", href: "/services/citizens-charter" },
    { title: "Business Permits", href: "/services/business-permits" },
    { title: "Downloadable Forms", href: "/services/downloadable-forms" },
    { title: "Job Opportunities", href: "/services/job-opportunities" },
    { title: "Emergency Hotlines", href: "/#emergency-hotlines" },
  ],
  Tourism: [
    { title: "Attractions", href: "/tourism/attractions" },
    { title: "Resorts", href: "/tourism/resorts" },
    { title: "Culture and Arts", href: "/tourism/culture-and-arts" },
    { title: "Products", href: "/tourism/products" },
  ],
  Transparency: [
    { title: "Procurement", href: "/transparency/procurement" },
    { title: "Contact Us", href: "/#contact-us" },
    { title: "Journal and News", href: "/news" },
  ],
};

export const MAIN_NAV_ITEMS: NavItem[] = [
  { title: "Home", href: "/" },
  { title: "About", href: "/about" },
  { title: "Government", href: "/government" },
  { title: "Services", href: "/services" },
  { title: "Tourism", href: "/tourism" },
  { title: "Transparency", href: "/transparency" },
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
