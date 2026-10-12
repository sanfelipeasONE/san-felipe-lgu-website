/**
 * Centralized Asset Registry for the San Felipe LGU Digital Portal.
 *
 * PROVENANCE CLASSIFICATION:
 * - VERIFIED_CLIENT_ASSET: Official files supplied directly by the Municipal Government of San Felipe.
 * - DESIGN_PLACEHOLDER: Temporary layout placeholders awaiting verified client photography or documents.
 * - GENERATED_PLACEHOLDER: Temporary decorative vector graphics; never represented as official documentary media.
 */

export const ASSET_PROVENANCE = {
  VERIFIED_CLIENT_ASSET: "VERIFIED_CLIENT_ASSET",
  DESIGN_PLACEHOLDER: "DESIGN_PLACEHOLDER",
  GENERATED_PLACEHOLDER: "GENERATED_PLACEHOLDER",
} as const;

export type AssetProvenance = (typeof ASSET_PROVENANCE)[keyof typeof ASSET_PROVENANCE];

export const ASSETS = {
  branding: {
    seal: {
      src: "/images/seal-san-felipe.jpg",
      alt: "Official Seal of the Municipality of San Felipe, Zambales",
      provenance: ASSET_PROVENANCE.VERIFIED_CLIENT_ASSET,
    },
  },
  officials: {
    mayor: {
      src: "/images/portrait-mayor.jpg",
      alt: "Hon. Engr. Reinhard E. Jeresano, Municipal Mayor",
      provenance: ASSET_PROVENANCE.VERIFIED_CLIENT_ASSET,
    },
    viceMayor: {
      src: "/images/portrait-vice-mayor.jpg",
      alt: "Hon. Vice-Mayor Mary Ann R. Quiba, Municipal Vice Mayor",
      provenance: ASSET_PROVENANCE.VERIFIED_CLIENT_ASSET,
    },
    placeholder: {
      src: "/images/portrait-placeholder.svg",
      alt: "Official portrait pending verified client photograph",
      provenance: ASSET_PROVENANCE.DESIGN_PLACEHOLDER,
    },
  },
  hero: {
    aerialBackdrop: {
      src: "/images/hero-aerial-san-felipe.jpg",
      alt: "Aerial view of San Felipe, Zambales showing the town center, National Highway, and coastline",
      provenance: ASSET_PROVENANCE.VERIFIED_CLIENT_ASSET,
    },
  },
  news: {
    undasBanner: {
      src: "/images/news-undas-featured.svg",
      alt: "Undas 2024 advisory graphic (Design placeholder awaiting official municipal press graphics)",
      provenance: ASSET_PROVENANCE.DESIGN_PLACEHOLDER,
    },
    placeholder: {
      src: "/images/news-placeholder.svg",
      alt: "Municipal News & Announcements graphic (Design placeholder awaiting official photography)",
      provenance: ASSET_PROVENANCE.DESIGN_PLACEHOLDER,
    },
  },
} as const;
