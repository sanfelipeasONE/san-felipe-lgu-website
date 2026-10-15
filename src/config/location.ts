/**
 * Authoritative Municipal Location Configuration
 *
 * SOURCED COORDINATES (DICT Region III Official Dataset):
 * - Entity: San Felipe Municipal Hall (LGU-HALL)
 * - Source: Department of Information and Communications Technology (DICT)
 *   2025 Public Internet Connectivity Site Dataset (Region III)
 * - Latitude: 15.060148
 * - Longitude: 120.070978
 * - Corroborated: OpenStreetMap Cartographic Data (San Felipe Town Center)
 *
 * ADDRESS GOVERNANCE:
 * Preserves the approved official website address wording:
 * "Municipal Hall Compound, National Highway, San Felipe, Zambales 2204"
 */

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface MunicipalLocationConfig {
  name: string;
  subtitle: string;
  address: string;
  advisory: string;
  coordinates: Coordinates;
  googleMapsSearchUrl: string;
  tileLayerUrl: string;
  osmAttribution: string;
}

export const MUNICIPAL_HALL_LOCATION: MunicipalLocationConfig = {
  name: "San Felipe Municipal Hall",
  subtitle: "Municipal Government Center Compound",
  address: "Municipal Hall Compound, National Highway, San Felipe, Zambales 2204",
  advisory:
    "Public Advisory: The Municipal Hall is conveniently situated along the National Highway, accessible via public bus and provincial transit routes.",
  coordinates: {
    lat: 15.060148,
    lng: 120.070978,
  },
  googleMapsSearchUrl:
    "https://www.google.com/maps/search/?api=1&query=San+Felipe+Municipal+Hall+Zambales",
  tileLayerUrl: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  osmAttribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
};

/**
 * Returns the authoritative external Google Maps directions URL.
 * Generates coordinate-based navigation directly to the verified DICT pin:
 * https://www.google.com/maps/dir/?api=1&destination=15.060148,120.070978
 */
export function getDirectionsUrl(location: MunicipalLocationConfig = MUNICIPAL_HALL_LOCATION): string {
  if (location.coordinates) {
    return `https://www.google.com/maps/dir/?api=1&destination=${location.coordinates.lat},${location.coordinates.lng}`;
  }
  return location.googleMapsSearchUrl;
}
