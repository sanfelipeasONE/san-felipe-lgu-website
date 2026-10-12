import { ASSETS, type AssetProvenance } from "@/config/assets";

export interface Official {
  id: string;
  slug: string;
  name: string;
  position: string;
  branch: "executive" | "legislative";
  office: string;
  eyebrow?: string;
  seat?: string;
  roleDescription?: string;
  committeeAssignments?: string[];
  secondaryInfo?: string;
  portrait: {
    src: string;
    alt: string;
    provenance: AssetProvenance;
  };
  administration: string;
  isNameVerified: boolean;
  isPositionVerified: boolean;
  isPortraitVerified: boolean;
  isCommitteeVerified?: boolean;
  isExOfficio?: boolean;
  term?: string;
  order: number;
}

export interface AdministrationPeriod {
  id: string;
  label: string;
  termRange: string;
  isCurrent: boolean;
}

export const ADMINISTRATION_PERIODS: AdministrationPeriod[] = [
  {
    id: "2025-2028",
    label: "2025–2028",
    termRange: "July 1, 2025 – June 30, 2028",
    isCurrent: true,
  },
];

export const MUNICIPAL_OFFICIALS_DATA: {
  administration: string;
  executive: {
    mayor: Official;
  };
  legislative: {
    viceMayor: Official;
    regularMembers: Official[];
    exOfficioMembers: Official[];
  };
} = {
  administration: "2025–2028",
  executive: {
    mayor: {
      id: "mayor",
      slug: "reinhard-jeresano",
      name: 'HON. ENGR. REINHARD "HART" E. JERESANO',
      eyebrow: "REPUBLIC OF THE PHILIPPINES",
      position: "Municipal Mayor",
      branch: "executive",
      office: "Office of the Municipal Mayor",
      roleDescription: "Local Chief Executive • Municipality of San Felipe",
      portrait: ASSETS.officials.mayor,
      administration: "2025–2028",
      isNameVerified: true,
      isPositionVerified: true,
      isPortraitVerified: true,
      term: "2025–2028",
      order: 1,
    },
  },
  legislative: {
    viceMayor: {
      id: "vice-mayor",
      slug: "mary-ann-quiba",
      name: "HON. MARY ANN R. QUIBA",
      eyebrow: "OFFICE OF THE SANGGUNIANG BAYAN",
      position: "Municipal Vice Mayor & SB Presiding Officer",
      branch: "legislative",
      office: "Office of the Sangguniang Bayan",
      roleDescription: "Presiding Officer, Sangguniang Bayan",
      committeeAssignments: ["Committee on Legislative and Executive Affairs"],
      portrait: ASSETS.officials.viceMayor,
      administration: "2025–2028",
      isNameVerified: true,
      isPositionVerified: true,
      isPortraitVerified: true,
      isCommitteeVerified: true,
      term: "2025–2028",
      order: 2,
    },
    regularMembers: [
      {
        id: "sb-member-1",
        slug: "robert-torres",
        name: "HON. ROBERT TORRES",
        position: "Sangguniang Bayan Member",
        seat: "SB Councilor",
        branch: "legislative",
        office: "Office of the Sangguniang Bayan",
        portrait: ASSETS.officials.placeholder,
        administration: "2025–2028",
        isNameVerified: true,
        isPositionVerified: true,
        isPortraitVerified: false,
        isCommitteeVerified: false,
        term: "2025–2028",
        order: 3,
      },
      {
        id: "sb-member-2",
        slug: "jetro-de-jesus",
        name: "HON. JETRO DE JESUS",
        position: "Sangguniang Bayan Member",
        seat: "SB Councilor",
        branch: "legislative",
        office: "Office of the Sangguniang Bayan",
        portrait: ASSETS.officials.placeholder,
        administration: "2025–2028",
        isNameVerified: true,
        isPositionVerified: true,
        isPortraitVerified: false,
        isCommitteeVerified: false,
        term: "2025–2028",
        order: 4,
      },
      {
        id: "sb-member-3",
        slug: "gala-abille",
        name: "HON. GALA ABILLE",
        position: "Sangguniang Bayan Member",
        seat: "SB Councilor",
        branch: "legislative",
        office: "Office of the Sangguniang Bayan",
        portrait: ASSETS.officials.placeholder,
        administration: "2025–2028",
        isNameVerified: true,
        isPositionVerified: true,
        isPortraitVerified: false,
        isCommitteeVerified: false,
        term: "2025–2028",
        order: 5,
      },
      {
        id: "sb-member-4",
        slug: "roselyn-manglicmot",
        name: "HON. ROSELYN MANGLICMOT",
        position: "Sangguniang Bayan Member",
        seat: "SB Councilor",
        branch: "legislative",
        office: "Office of the Sangguniang Bayan",
        portrait: ASSETS.officials.placeholder,
        administration: "2025–2028",
        isNameVerified: true,
        isPositionVerified: true,
        isPortraitVerified: false,
        isCommitteeVerified: false,
        term: "2025–2028",
        order: 6,
      },
      {
        id: "sb-member-5",
        slug: "rex-asutilla",
        name: "HON. REX ASUTILLA",
        position: "Sangguniang Bayan Member",
        seat: "SB Councilor",
        branch: "legislative",
        office: "Office of the Sangguniang Bayan",
        portrait: ASSETS.officials.placeholder,
        administration: "2025–2028",
        isNameVerified: true,
        isPositionVerified: true,
        isPortraitVerified: false,
        isCommitteeVerified: false,
        term: "2025–2028",
        order: 7,
      },
      {
        id: "sb-member-6",
        slug: "ramil-ablian",
        name: "HON. RAMIL ABLIAN",
        position: "Sangguniang Bayan Member",
        seat: "SB Councilor",
        branch: "legislative",
        office: "Office of the Sangguniang Bayan",
        portrait: ASSETS.officials.placeholder,
        administration: "2025–2028",
        isNameVerified: true,
        isPositionVerified: true,
        isPortraitVerified: false,
        isCommitteeVerified: false,
        term: "2025–2028",
        order: 8,
      },
      {
        id: "sb-member-7",
        slug: "ray-frondarina",
        name: "HON. RAY FRONDARINA",
        position: "Sangguniang Bayan Member",
        seat: "SB Councilor",
        branch: "legislative",
        office: "Office of the Sangguniang Bayan",
        portrait: ASSETS.officials.placeholder,
        administration: "2025–2028",
        isNameVerified: true,
        isPositionVerified: true,
        isPortraitVerified: false,
        isCommitteeVerified: false,
        term: "2025–2028",
        order: 9,
      },
      {
        id: "sb-member-8",
        slug: "gary-farinas",
        name: "HON. GARY FARINAS",
        position: "Sangguniang Bayan Member",
        seat: "SB Councilor",
        branch: "legislative",
        office: "Office of the Sangguniang Bayan",
        portrait: ASSETS.officials.placeholder,
        administration: "2025–2028",
        isNameVerified: true,
        isPositionVerified: true,
        isPortraitVerified: false,
        isCommitteeVerified: false,
        term: "2025–2028",
        order: 10,
      },
    ],
    exOfficioMembers: [
      {
        id: "ex-officio-lbp",
        slug: "dana-damaso",
        name: "HON. DANA F. DAMASO",
        eyebrow: "LIGA NG MGA BARANGAY (LNB)",
        position: "ABC / Liga President",
        seat: "Liga ng mga Barangay President",
        branch: "legislative",
        office: "Liga ng mga Barangay / Sangguniang Bayan",
        secondaryInfo: "Ex-Officio Member, Sangguniang Bayan",
        portrait: ASSETS.officials.placeholder,
        administration: "2025–2028",
        isNameVerified: true,
        isPositionVerified: true,
        isPortraitVerified: false,
        isCommitteeVerified: false,
        isExOfficio: true,
        term: "2025–2028",
        order: 11,
      },
      {
        id: "ex-officio-skf",
        slug: "iverson-alcantara",
        name: "HON. IVERSON G. ALCANTARA",
        eyebrow: "SANGGUNIANG KABATAAN FEDERATION",
        position: "SK Federation President",
        seat: "Sangguniang Kabataan Federation President",
        branch: "legislative",
        office: "Pederasyon ng Sangguniang Kabataan / Sangguniang Bayan",
        secondaryInfo: "Ex-Officio Member, Sangguniang Bayan",
        portrait: ASSETS.officials.placeholder,
        administration: "2025–2028",
        isNameVerified: true,
        isPositionVerified: true,
        isPortraitVerified: false,
        isCommitteeVerified: false,
        isExOfficio: true,
        term: "2025–2028",
        order: 12,
      },
    ],
  },
};
