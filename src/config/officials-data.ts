import { ASSET_PROVENANCE, type AssetProvenance } from "@/config/assets";

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
      name: "HON. REINHARD E. JERESANO",
      eyebrow: "REPUBLIC OF THE PHILIPPINES",
      position: "Municipal Mayor",
      branch: "executive",
      office: "Office of the Municipal Mayor",
      roleDescription: "Local Chief Executive • Municipality of San Felipe",
      portrait: {
        src: "/images/Hon. Reinhard E. Jeresano.jpg",
        alt: "Hon. Reinhard E. Jeresano, Municipal Mayor",
        provenance: ASSET_PROVENANCE.VERIFIED_CLIENT_ASSET,
      },
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
      portrait: {
        src: "/images/Hon. Mary Ann R. Quiba.jpg",
        alt: "Hon. Mary Ann R. Quiba, Municipal Vice Mayor & SB Presiding Officer",
        provenance: ASSET_PROVENANCE.VERIFIED_CLIENT_ASSET,
      },
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
        slug: "robert-r-torres",
        name: "HON. ROBERT R. TORRES",
        position: "Sangguniang Bayan Member",
        seat: "SB Councilor",
        branch: "legislative",
        office: "Office of the Sangguniang Bayan",
        portrait: {
          src: "/images/Hon. Robert R. Torres-1.jpg",
          alt: "Hon. Robert R. Torres, Sangguniang Bayan Member",
          provenance: ASSET_PROVENANCE.VERIFIED_CLIENT_ASSET,
        },
        administration: "2025–2028",
        isNameVerified: true,
        isPositionVerified: true,
        isPortraitVerified: true,
        isCommitteeVerified: false,
        term: "2025–2028",
        order: 3,
      },
      {
        id: "sb-member-2",
        slug: "ronald-jetro-de-jesus",
        name: "HON. RONALD JETRO L. DE JESUS",
        position: "Sangguniang Bayan Member",
        seat: "SB Councilor",
        branch: "legislative",
        office: "Office of the Sangguniang Bayan",
        portrait: {
          src: "/images/Hon. Ronald Jetro L. De Jesus-2.jpg",
          alt: "Hon. Ronald Jetro L. De Jesus, Sangguniang Bayan Member",
          provenance: ASSET_PROVENANCE.VERIFIED_CLIENT_ASSET,
        },
        administration: "2025–2028",
        isNameVerified: true,
        isPositionVerified: true,
        isPortraitVerified: true,
        isCommitteeVerified: false,
        term: "2025–2028",
        order: 4,
      },
      {
        id: "sb-member-3",
        slug: "alfred-abille",
        name: "HON. SIR ALFRED A. ABILLE",
        position: "Sangguniang Bayan Member",
        seat: "SB Councilor",
        branch: "legislative",
        office: "Office of the Sangguniang Bayan",
        portrait: {
          src: "/images/Hon. Sir Alfred A. Abille-3.jpg",
          alt: "Hon. Sir Alfred A. Abille, Sangguniang Bayan Member",
          provenance: ASSET_PROVENANCE.VERIFIED_CLIENT_ASSET,
        },
        administration: "2025–2028",
        isNameVerified: true,
        isPositionVerified: true,
        isPortraitVerified: true,
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
        portrait: {
          src: "/images/Hon. Roselyn Manglicmot-4.jpg",
          alt: "Hon. Roselyn Manglicmot, Sangguniang Bayan Member",
          provenance: ASSET_PROVENANCE.VERIFIED_CLIENT_ASSET,
        },
        administration: "2025–2028",
        isNameVerified: true,
        isPositionVerified: true,
        isPortraitVerified: true,
        isCommitteeVerified: false,
        term: "2025–2028",
        order: 6,
      },
      {
        id: "sb-member-5",
        slug: "rex-daniel-asutilla",
        name: "HON. REX DANIEL A. ASUTILLA",
        position: "Sangguniang Bayan Member",
        seat: "SB Councilor",
        branch: "legislative",
        office: "Office of the Sangguniang Bayan",
        portrait: {
          src: "/images/Hon. Rex Daniel A. Asutilla-5.jpg",
          alt: "Hon. Rex Daniel A. Asutilla, Sangguniang Bayan Member",
          provenance: ASSET_PROVENANCE.VERIFIED_CLIENT_ASSET,
        },
        administration: "2025–2028",
        isNameVerified: true,
        isPositionVerified: true,
        isPortraitVerified: true,
        isCommitteeVerified: false,
        term: "2025–2028",
        order: 7,
      },
      {
        id: "sb-member-6",
        slug: "ramil-ablian",
        name: "HON. RAMIL T. ABLIAN",
        position: "Sangguniang Bayan Member",
        seat: "SB Councilor",
        branch: "legislative",
        office: "Office of the Sangguniang Bayan",
        portrait: {
          src: "/images/Hon. Ramil T. Ablian-6.jpg",
          alt: "Hon. Ramil T. Ablian, Sangguniang Bayan Member",
          provenance: ASSET_PROVENANCE.VERIFIED_CLIENT_ASSET,
        },
        administration: "2025–2028",
        isNameVerified: true,
        isPositionVerified: true,
        isPortraitVerified: true,
        isCommitteeVerified: false,
        term: "2025–2028",
        order: 8,
      },
      {
        id: "sb-member-7",
        slug: "ray-a-frondarina",
        name: "HON. RAY A. FRONDARINA",
        position: "Sangguniang Bayan Member",
        seat: "SB Councilor",
        branch: "legislative",
        office: "Office of the Sangguniang Bayan",
        portrait: {
          src: "/images/Hon. Ray A. Frondarina-7.jpg",
          alt: "Hon. Ray A. Frondarina, Sangguniang Bayan Member",
          provenance: ASSET_PROVENANCE.VERIFIED_CLIENT_ASSET,
        },
        administration: "2025–2028",
        isNameVerified: true,
        isPositionVerified: true,
        isPortraitVerified: true,
        isCommitteeVerified: false,
        term: "2025–2028",
        order: 9,
      },
      {
        id: "sb-member-8",
        slug: "gary-michael-farinas",
        name: "HON. GARY MICHAEL P. FARIÑAS",
        position: "Sangguniang Bayan Member",
        seat: "SB Councilor",
        branch: "legislative",
        office: "Office of the Sangguniang Bayan",
        portrait: {
          src: "/images/Hon. Gary Michael P. Fariñas-8.jpg",
          alt: "Hon. Gary Michael P. Fariñas, Sangguniang Bayan Member",
          provenance: ASSET_PROVENANCE.VERIFIED_CLIENT_ASSET,
        },
        administration: "2025–2028",
        isNameVerified: true,
        isPositionVerified: true,
        isPortraitVerified: true,
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
        portrait: {
          src: "/images/Hon. Dana F. Damaso-LNB.jpg",
          alt: "Hon. Dana F. Damaso, Liga ng mga Barangay President",
          provenance: ASSET_PROVENANCE.VERIFIED_CLIENT_ASSET,
        },
        administration: "2025–2028",
        isNameVerified: true,
        isPositionVerified: true,
        isPortraitVerified: true,
        isCommitteeVerified: false,
        isExOfficio: true,
        term: "2025–2028",
        order: 11,
      },
      {
        id: "ex-officio-skf",
        slug: "iver-son-alcantara",
        name: "HON. IVER-SON G. ALCANTARA",
        eyebrow: "SANGGUNIANG KABATAAN FEDERATION",
        position: "SK Federation President",
        seat: "Sangguniang Kabataan Federation President",
        branch: "legislative",
        office: "Pederasyon ng Sangguniang Kabataan / Sangguniang Bayan",
        secondaryInfo: "Ex-Officio Member, Sangguniang Bayan",
        portrait: {
          src: "/images/Hon. Iver-son G. Alcantara-SK FED..jpg",
          alt: "Hon. Iver-son G. Alcantara, SK Federation President",
          provenance: ASSET_PROVENANCE.VERIFIED_CLIENT_ASSET,
        },
        administration: "2025–2028",
        isNameVerified: true,
        isPositionVerified: true,
        isPortraitVerified: true,
        isCommitteeVerified: false,
        isExOfficio: true,
        term: "2025–2028",
        order: 12,
      },
      {
        id: "ex-officio-ipmr",
        slug: "napoleon-domingo",
        name: "HON. NAPOLEON DOMINGO",
        position: "Indigenous Peoples Mandatory Representative (IPMR)",
        seat: "Indigenous Peoples Mandatory Representative",
        branch: "legislative",
        office: "Office of the Sangguniang Bayan",
        portrait: {
          src: "/images/Hon. Napoleon Domingo-IPMR.JPG",
          alt: "Hon. Napoleon Domingo, Indigenous Peoples Mandatory Representative (IPMR)",
          provenance: ASSET_PROVENANCE.VERIFIED_CLIENT_ASSET,
        },
        administration: "2025–2028",
        isNameVerified: true,
        isPositionVerified: true,
        isPortraitVerified: true,
        isCommitteeVerified: false,
        isExOfficio: true,
        term: "2025–2028",
        order: 13,
      },
    ],
  },
};
