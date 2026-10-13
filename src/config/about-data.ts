/**
 * Verified Client Information for About San Felipe: History, Vision & Mission (Phase 6)
 *
 * PROVENANCE: VERIFIED_CLIENT_INFORMATION
 * All textual content in this file is strictly preserved from official LGU records.
 * Do NOT rewrite, shorten, summarize, or alter capitalization or terminology.
 */

export interface AboutData {
  provenance: "VERIFIED_CLIENT_INFORMATION";
  header: {
    breadcrumb: Array<{ label: string; href?: string }>;
    eyebrow: string;
    title: string;
    description: string;
  };
  history: {
    eyebrow: string;
    title: string;
    paragraphs: string[];
  };
  direction: {
    eyebrow: string;
    title: string;
    vision: {
      label: string;
      text: string;
    };
    mission: {
      label: string;
      text: string;
    };
  };
}

export const ABOUT_DATA: AboutData = {
  provenance: "VERIFIED_CLIENT_INFORMATION",
  header: {
    breadcrumb: [
      { label: "About", href: "/about" },
      { label: "History of San Felipe" },
    ],
    eyebrow: "ABOUT OUR MUNICIPALITY",
    title: "History of San Felipe",
    description:
      "Learn about the history and institutional direction of the Municipality of San Felipe, Zambales.",
  },
  history: {
    eyebrow: "OUR HISTORY",
    title: "The History of San Felipe",
    paragraphs: [
      "The Municipality of San Felipe was one among the little villages along the coastal Region of Zambales during the Pre-Spanish period. The first inhabitants were our brother Malays, who preferred to live in the lowlands. The natives Negritoes and Aetas occupied the upland areas and most of them lived in hinterlands. Some Ilocanos found their way to Hindol; the first village that was later called Sindol. Further south was a small village called Bobulon where other Ilocano families resided.",
      "Hindol was a Zambal aeta name of a tree then abundant in the place, and Bobulon was also a kind of a tree. Other version why the place was called Bobulon was that the first voyage of Ilocano settlers had all the favorable winds (Bolun) from Paoay, Ilocos Norte to this village. The name Bobulon was changed to San Felipe when it was founded in 1853.",
      "As to San Felipe, it got its name from one of the “Saintly” brothers, who came from the Ilocos region namely; Marcelino, Antonio, Narciso and Felipe, who settled in the pueblos on the southern part of Bobulon. Marcelino allegedly settled in the locality presently called San Marcelino, Antonio settled in the locality presently called San Antonio, Narciso settled in the locality presently called San Narciso and Felipe settled in the locality called San Felipe. In fact most of the native inhabitants of these four towns are Ilocanos from Ilocandia.",
      "For early several years, San Felipe has been recognized as the “Greenest and Cleanest” town in the entire province and lately in the whole region 3 and entire country, because of the clean and green program and the solid waste management program. Today, the proud San Felipeneans continue to work to be able to maintain its recognition as the clean and green capital/solid waste management capital in the Province of Zambales and in the entire Region 3 in full inspiration and direction from the local government headed by the Municipal Mayor supported by the barangay units and participated by every member of the San Felipe community.",
    ],
  },
  direction: {
    eyebrow: "OUR DIRECTION",
    title: "Vision & Mission",
    vision: {
      label: "VISION",
      text: "We envision San Felipe as the business hub, environment model and premiere center of Zambales for agriculture, meat processing and tourism, towards a community of God loving, caring, healthy, united, disciplined, well-informed, hospitable, prosperous and proud citizenry living in an ecologically balance environment, disaster-resilient and diversified-friendly and competitive economy under a consultative, accountable and developmental leadership.",
    },
    mission: {
      label: "MISSION",
      text: "To have a transparent, dedicated, concerned and consultative leadership that will efficiently implement plans and programs for SAN FELIPENEANS as well as to maintain a just, prosperous, healthy, peaceful and environment-friendly community.",
    },
  },
};
