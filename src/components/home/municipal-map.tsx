"use client";

import * as React from "react";
import { AlertCircle } from "lucide-react";
import {
  MUNICIPAL_HALL_LOCATION,
  getDirectionsUrl,
  type Coordinates,
} from "@/config/location";
import "leaflet/dist/leaflet.css";

interface MunicipalMapProps {
  overrideCoordinates?: Coordinates | null;
  className?: string;
  zoom?: number;
}

const emptySubscribe = () => () => {};

export function MunicipalMap({
  overrideCoordinates,
  className = "",
  zoom = 16,
}: MunicipalMapProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = React.useRef<any>(null);
  const mounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const [tileError, setTileError] = React.useState(false);

  // Active coordinates: prioritize prop override, otherwise config baseline
  const activeCoordinates =
    overrideCoordinates !== undefined
      ? overrideCoordinates
      : MUNICIPAL_HALL_LOCATION.coordinates;

  const directionsUrl = getDirectionsUrl({
    ...MUNICIPAL_HALL_LOCATION,
    coordinates: activeCoordinates || MUNICIPAL_HALL_LOCATION.coordinates,
  });

  React.useEffect(() => {
    if (!mounted || !containerRef.current || !activeCoordinates) {
      return;
    }

    let isCancelled = false;

    // Dynamically import Leaflet only in the browser
    import("leaflet").then((L) => {
      if (isCancelled || !containerRef.current) return;

      // Ensure prior instance is cleaned up to avoid "Map container is already initialized"
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      try {
        const map = L.map(containerRef.current, {
          center: [activeCoordinates.lat, activeCoordinates.lng],
          zoom,
          scrollWheelZoom: false, // Prevent page scrolling trap
        });

        // OpenStreetMap raster tile layer with required attribution
        const tileLayer = L.tileLayer(MUNICIPAL_HALL_LOCATION.tileLayerUrl, {
          attribution: MUNICIPAL_HALL_LOCATION.osmAttribution,
          maxZoom: 19,
        });

        tileLayer.on("tileerror", () => {
          setTileError(true);
        });

        tileLayer.addTo(map);

        // Official municipal burgundy marker icon (restrained, non-animated)
        const customIcon = L.divIcon({
          className: "sfz-custom-map-marker",
          html: `
            <div style="
              display: flex;
              flex-direction: column;
              align-items: center;
              transform: translate(-50%, -100%);
            ">
              <div style="
                background: #8B1E2D;
                color: #FFFFFF;
                border: 2px solid #FFFFFF;
                border-radius: 4px;
                padding: 4px 8px;
                box-shadow: 0 4px 6px -1px rgba(0,0,0,0.25);
                font-family: inherit;
                font-size: 11px;
                font-weight: 700;
                white-space: nowrap;
                display: flex;
                align-items: center;
                gap: 5px;
              ">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                San Felipe Municipal Hall
              </div>
              <div style="
                width: 0;
                height: 0;
                border-left: 6px solid transparent;
                border-right: 6px solid transparent;
                border-top: 6px solid #8B1E2D;
                margin-top: -1px;
              "></div>
            </div>
          `,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        });

        const marker = L.marker([activeCoordinates.lat, activeCoordinates.lng], {
          icon: customIcon,
          title: "San Felipe Municipal Hall",
        }).addTo(map);

        // Concise accessible marker popup with official wording
        const popupContent = `
          <div style="font-family: system-ui, sans-serif; font-size: 12px; line-height: 1.4; color: #1a1e24; min-width: 200px;">
            <strong style="font-size: 13px; color: #8B1E2D; display: block; margin-bottom: 2px;">
              San Felipe Municipal Hall
            </strong>
            <span style="font-size: 11px; font-weight: 600; color: #334155; display: block;">
              Municipal Government Center Compound
            </span>
            <span style="font-size: 11px; color: #64748b; display: block; margin-top: 2px; margin-bottom: 8px;">
              Municipal Hall Compound, National Highway, San Felipe, Zambales 2204
            </span>
            <a
              href="${directionsUrl}"
              target="_blank"
              rel="noopener noreferrer"
              style="
                display: inline-flex;
                align-items: center;
                gap: 4px;
                font-size: 11px;
                font-weight: 700;
                color: #8B1E2D;
                text-decoration: underline;
              "
            >
              Get Directions &rarr;
            </a>
          </div>
        `;

        marker.bindPopup(popupContent);
        mapInstanceRef.current = map;
      } catch (err) {
        console.error("Leaflet initialization error:", err);
        setTileError(true);
      }
    });

    return () => {
      isCancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [mounted, activeCoordinates, directionsUrl, zoom]);

  // Loading state placeholder before client hydration
  if (!mounted) {
    return (
      <div
        role="region"
        aria-label="San Felipe Municipal Hall location map"
        className={`bg-slate-100 border border-gray-200 rounded-xs h-84 sm:h-96 flex flex-col items-center justify-center p-6 text-center ${className}`}
      >
        <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
          <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
          <span>Loading location map…</span>
        </div>
      </div>
    );
  }

  // Active Interactive Map View
  return (
    <div
      role="region"
      aria-label="San Felipe Municipal Hall location map"
      className={`bg-slate-100 border border-gray-200 rounded-xs h-84 sm:h-96 relative overflow-hidden shadow-2xs ${className}`}
    >
      <div ref={containerRef} className="w-full h-full z-0" />

      {tileError && (
        <div className="absolute top-2 left-2 right-2 z-10 bg-amber-50/95 border border-amber-200 text-amber-900 text-xs p-2 rounded-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5 text-amber-700 shrink-0" />
            <span>Map tiles temporarily unavailable. Physical address remains accurate.</span>
          </div>
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold underline text-burgundy-800 shrink-0 ml-2"
          >
            Get Directions
          </a>
        </div>
      )}
    </div>
  );
}
