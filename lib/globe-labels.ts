export interface MapNameMarker {
  lat: number;
  lng: number;
  text: string;
  kind: "country-name" | "ocean-name";
  fontSize: number;
}

export interface GeoJsonFeature {
  properties?: {
    ISO_A2?: string;
    ADMIN?: string;
    NAME?: string;
    LABELRANK?: number;
  };
  geometry?: {
    type: "Polygon" | "MultiPolygon";
    coordinates: number[][][] | number[][][][];
  };
}

type Coord = [number, number];

export const OCEAN_NAME_MARKERS: MapNameMarker[] = [
  { lat: 28, lng: -158, text: "North Pacific Ocean", kind: "ocean-name", fontSize: 10 },
  { lat: 42, lng: -43, text: "North Atlantic Ocean", kind: "ocean-name", fontSize: 10 },
  { lat: -18, lng: -138, text: "South Pacific Ocean", kind: "ocean-name", fontSize: 10 },
  { lat: -22, lng: -8, text: "South Atlantic Ocean", kind: "ocean-name", fontSize: 10 },
  { lat: -22, lng: 78, text: "Indian Ocean", kind: "ocean-name", fontSize: 10 },
  { lat: 72, lng: -10, text: "Arctic Ocean", kind: "ocean-name", fontSize: 10 },
  { lat: -58, lng: 0, text: "Southern Ocean", kind: "ocean-name", fontSize: 10 },
  { lat: 4, lng: 4, text: "Gulf of Guinea", kind: "ocean-name", fontSize: 9 },
  { lat: 18, lng: -85, text: "Caribbean Sea", kind: "ocean-name", fontSize: 9 },
  { lat: 15, lng: 45, text: "Arabian Sea", kind: "ocean-name", fontSize: 9 },
  { lat: 35, lng: 130, text: "Sea of Japan", kind: "ocean-name", fontSize: 9 },
];

function ringAreaAndCentroid(ring: Coord[]): {
  area: number;
  lat: number;
  lng: number;
} | null {
  if (ring.length < 3) return null;

  let area = 0;
  let cx = 0;
  let cy = 0;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [x1, y1] = ring[j];
    const [x2, y2] = ring[i];
    const cross = x1 * y2 - x2 * y1;
    area += cross;
    cx += (x1 + x2) * cross;
    cy += (y1 + y2) * cross;
  }

  area /= 2;
  if (area === 0) return null;

  const factor = 1 / (6 * area);
  return {
    area: Math.abs(area),
    lng: cx * factor,
    lat: cy * factor,
  };
}

function featureAreaAndCentroid(feature: GeoJsonFeature): {
  area: number;
  lat: number;
  lng: number;
} | null {
  const geom = feature.geometry;
  if (!geom) return null;

  if (geom.type === "Polygon") {
    return ringAreaAndCentroid(geom.coordinates[0] as Coord[]);
  }

  if (geom.type === "MultiPolygon") {
    const polys = geom.coordinates as Coord[][][];
    let best: { area: number; lat: number; lng: number } | null = null;

    for (const poly of polys) {
      const result = ringAreaAndCentroid(poly[0]);
      if (result && (!best || result.area > best.area)) best = result;
    }

    return best;
  }

  return null;
}

/** Smaller countries get smaller fixed labels (independent of camera zoom). */
export function fontSizeFromLabelRank(
  labelRank: number | undefined,
  kind: MapNameMarker["kind"],
): number {
  if (kind === "ocean-name") return 9;

  switch (labelRank) {
    case 2:
      return 11;
    case 3:
      return 10;
    case 4:
      return 9;
    case 5:
      return 8;
    case 6:
    case 7:
      return 7;
    default:
      return 9;
  }
}

/** One static label per country, centered in its polygon. */
export function buildCountryNameMarkersFromGeoJson(
  features: GeoJsonFeature[],
): MapNameMarker[] {
  const markers: MapNameMarker[] = [];

  for (const feature of features) {
    const iso = feature.properties?.ISO_A2;
    const name = feature.properties?.NAME ?? feature.properties?.ADMIN;
    if (!name || !iso || iso === "-99") continue;

    const placement = featureAreaAndCentroid(feature);
    if (!placement) continue;

    markers.push({
      lat: placement.lat,
      lng: placement.lng,
      text: name,
      kind: "country-name",
      fontSize: fontSizeFromLabelRank(feature.properties?.LABELRANK, "country-name"),
    });
  }

  return markers;
}

export function buildAllMapNameMarkersFromGeoJson(
  features: GeoJsonFeature[],
): MapNameMarker[] {
  return [...buildCountryNameMarkersFromGeoJson(features), ...OCEAN_NAME_MARKERS];
}

export function createMapNameElement(marker: MapNameMarker): HTMLDivElement {
  const el = document.createElement("div");
  el.textContent = marker.text;

  const base =
    "pointer-events:none;user-select:none;position:absolute;transform:translate(-50%,-50%);text-align:center;font-family:system-ui,-apple-system,sans-serif;white-space:nowrap;";

  if (marker.kind === "ocean-name") {
    el.style.cssText = `${base}font-size:${marker.fontSize}px;font-weight:500;font-style:italic;color:rgba(51,85,120,0.78);text-shadow:0 0 8px rgba(255,255,255,0.95),0 1px 3px rgba(255,255,255,0.7);letter-spacing:0.02em;`;
  } else {
    el.style.cssText = `${base}font-size:${marker.fontSize}px;font-weight:600;color:rgba(30,41,59,0.92);text-shadow:0 0 8px rgba(255,255,255,0.98),0 1px 3px rgba(255,255,255,0.75);letter-spacing:0.01em;`;
  }

  return el;
}
