import "server-only";

import fs from "fs";
import path from "path";
import { spreadMovieInCountry } from "./countries";

type Coord = [number, number];

interface CountryGeometry {
  type: "Polygon" | "MultiPolygon";
  coordinates: number[][][] | number[][][][];
}

interface StoredCountryFeature {
  iso: string;
  geometry: CountryGeometry;
}

interface Bbox {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

let countryFeatures: Map<string, StoredCountryFeature> | null = null;

/** Sampling boxes tuned for nicer visual spread (e.g. continental US, not full AK/HI bbox). */
const SPREAD_BBOX_OVERRIDES: Record<string, Bbox> = {
  US: { minLat: 25, maxLat: 49, minLng: -124, maxLng: -66.5 },
  AU: { minLat: -39, maxLat: -12, minLng: 115, maxLng: 154 },
  GB: { minLat: 50, maxLat: 58.8, minLng: -7.8, maxLng: 1.9 },
  IE: { minLat: 51.4, maxLat: 55.4, minLng: -10.5, maxLng: -5.4 },
  NZ: { minLat: -47.5, maxLat: -34, minLng: 166, maxLng: 178.5 },
};

function loadCountryFeatures(): Map<string, StoredCountryFeature> {
  if (countryFeatures) return countryFeatures;

  const geojsonPath = path.join(process.cwd(), "public/globe/countries.geojson");
  const raw = fs.readFileSync(geojsonPath, "utf8");
  const geojson = JSON.parse(raw) as {
    features: Array<{
      properties?: { ISO_A2?: string };
      geometry?: CountryGeometry;
    }>;
  };

  countryFeatures = new Map();
  for (const feature of geojson.features) {
    const iso = feature.properties?.ISO_A2;
    const geometry = feature.geometry;
    if (!iso || iso === "-99" || !geometry) continue;
    if (geometry.type !== "Polygon" && geometry.type !== "MultiPolygon") continue;
    countryFeatures.set(iso, { iso, geometry });
  }

  return countryFeatures;
}

function hashSeed(tmdbId: number, salt = 0): number {
  return ((tmdbId * 2654435761 + salt * 1597334677) >>> 0) / 4294967296;
}

function pointInRing(lat: number, lng: number, ring: Coord[]): boolean {
  let inside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersects =
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }

  return inside;
}

function pointInPolygonRings(lat: number, lng: number, rings: Coord[][]): boolean {
  if (!rings[0]?.length || !pointInRing(lat, lng, rings[0])) return false;
  for (let i = 1; i < rings.length; i++) {
    if (pointInRing(lat, lng, rings[i])) return false;
  }
  return true;
}

function pointInCountryGeometry(
  geometry: CountryGeometry,
  lat: number,
  lng: number,
): boolean {
  if (geometry.type === "Polygon") {
    return pointInPolygonRings(lat, lng, geometry.coordinates as Coord[][]);
  }

  for (const polygon of geometry.coordinates as Coord[][][]) {
    if (pointInPolygonRings(lat, lng, polygon)) return true;
  }

  return false;
}

function isPointInCountry(iso: string, lat: number, lng: number): boolean {
  const feature = loadCountryFeatures().get(iso);
  if (!feature) return true;
  return pointInCountryGeometry(feature.geometry, lat, lng);
}

function ringAreaAndCentroid(ring: Coord[]): { lat: number; lng: number } | null {
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
  return { lng: cx * factor, lat: cy * factor };
}

function ringArea(ring: Coord[]): number {
  let area = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [x1, y1] = ring[j];
    const [x2, y2] = ring[i];
    area += x1 * y2 - x2 * y1;
  }
  return Math.abs(area / 2);
}

function featureCentroid(feature: StoredCountryFeature): { lat: number; lng: number } | null {
  const geom = feature.geometry;

  if (geom.type === "Polygon") {
    return ringAreaAndCentroid(geom.coordinates[0] as Coord[]);
  }

  const polys = geom.coordinates as Coord[][][];
  let best: { area: number; lat: number; lng: number } | null = null;

  for (const poly of polys) {
    const ring = poly[0];
    const centroid = ringAreaAndCentroid(ring);
    if (!centroid) continue;
    const area = ringArea(ring);
    if (!best || area > best.area) {
      best = { area, lat: centroid.lat, lng: centroid.lng };
    }
  }

  return best ? { lat: best.lat, lng: best.lng } : null;
}

function featureBbox(feature: StoredCountryFeature): Bbox {
  let minLat = 90;
  let maxLat = -90;
  let minLng = 180;
  let maxLng = -180;

  const visitRing = (ring: Coord[]) => {
    for (const [lng, lat] of ring) {
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
    }
  };

  const geom = feature.geometry;
  if (geom.type === "Polygon") {
    visitRing(geom.coordinates[0] as Coord[]);
  } else {
    for (const poly of geom.coordinates as Coord[][][]) {
      visitRing(poly[0]);
    }
  }

  return { minLat, maxLat, minLng, maxLng };
}

function getSpreadBbox(iso: string): Bbox | null {
  const override = SPREAD_BBOX_OVERRIDES[iso];
  if (override) return override;

  const feature = loadCountryFeatures().get(iso);
  if (!feature) return null;

  const bbox = featureBbox(feature);
  const padLat = (bbox.maxLat - bbox.minLat) * 0.08;
  const padLng = (bbox.maxLng - bbox.minLng) * 0.08;

  return {
    minLat: bbox.minLat + padLat,
    maxLat: bbox.maxLat - padLat,
    minLng: bbox.minLng + padLng,
    maxLng: bbox.maxLng - padLng,
  };
}

function countryInteriorPoint(iso: string): { lat: number; lng: number } | null {
  const feature = loadCountryFeatures().get(iso);
  if (!feature) return null;

  const centroid = featureCentroid(feature);
  if (centroid && isPointInCountry(iso, centroid.lat, centroid.lng)) {
    return centroid;
  }

  const bbox = getSpreadBbox(iso) ?? featureBbox(feature);
  for (let row = 1; row <= 8; row++) {
    for (let col = 1; col <= 8; col++) {
      const lat = bbox.minLat + ((bbox.maxLat - bbox.minLat) * row) / 9;
      const lng = bbox.minLng + ((bbox.maxLng - bbox.minLng) * col) / 9;
      if (isPointInCountry(iso, lat, lng)) {
        return { lat, lng };
      }
    }
  }

  return centroid;
}

/** Even sunflower spread across country bounds, validated on land. */
function spreadInCountryBbox(
  iso: string,
  tmdbId: number,
  index: number,
  total: number,
): { lat: number; lng: number } | null {
  const bbox = getSpreadBbox(iso);
  if (!bbox) return null;

  const seed = hashSeed(tmdbId);
  const seed2 = hashSeed(tmdbId, 1);
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  const cx = (bbox.minLat + bbox.maxLat) / 2;
  const cy = (bbox.minLng + bbox.maxLng) / 2;
  const halfLat = (bbox.maxLat - bbox.minLat) / 2;
  const halfLng = (bbox.maxLng - bbox.minLng) / 2;
  const span = halfLat * halfLng;
  const maxR = span < 30 ? 0.4 : span < 90 ? 0.62 : 0.92;

  const angle = index * goldenAngle + seed2 * Math.PI * 2;
  const radiusNorm = Math.sqrt((index + 0.5) / total);

  let lat = cx + radiusNorm * halfLat * maxR * Math.cos(angle);
  let lng = cy + radiusNorm * halfLng * maxR * Math.sin(angle);
  lat += (seed - 0.5) * halfLat * 0.04;
  lng += (seed2 - 0.5) * halfLng * 0.04;

  if (isPointInCountry(iso, lat, lng)) {
    return { lat, lng };
  }

  for (let attempt = 1; attempt <= 56; attempt++) {
    const a = angle + attempt * 0.38;
    const r = Math.min(maxR, radiusNorm + attempt * 0.01);
    const tryLat = cx + r * halfLat * Math.cos(a);
    const tryLng = cy + r * halfLng * Math.sin(a);
    if (isPointInCountry(iso, tryLat, tryLng)) {
      return { lat: tryLat, lng: tryLng };
    }
  }

  return null;
}

/** Grid placement for smaller countries — keeps dots on land, evenly spaced. */
function spreadOnLandGrid(
  iso: string,
  tmdbId: number,
  index: number,
  total: number,
): { lat: number; lng: number } | null {
  const bbox = getSpreadBbox(iso);
  if (!bbox) return null;

  const gridSize = Math.max(6, Math.ceil(Math.sqrt(total) * 2));
  const landCells: Array<{ lat: number; lng: number }> = [];

  for (let row = 1; row <= gridSize; row++) {
    for (let col = 1; col <= gridSize; col++) {
      const lat = bbox.minLat + ((bbox.maxLat - bbox.minLat) * row) / (gridSize + 1);
      const lng = bbox.minLng + ((bbox.maxLng - bbox.minLng) * col) / (gridSize + 1);
      if (isPointInCountry(iso, lat, lng)) {
        landCells.push({ lat, lng });
      }
    }
  }

  if (landCells.length === 0) return null;

  landCells.sort((a, b) => a.lat - b.lat || a.lng - b.lng);

  const seed = hashSeed(tmdbId);
  const seed2 = hashSeed(tmdbId, 1);
  const cellIndex = (index + Math.floor(seed * landCells.length)) % landCells.length;
  const layer = Math.floor(index / landCells.length);
  const cell = landCells[cellIndex];

  const angle = index * 1.15 + seed2 * Math.PI * 2;
  const radius = 0.05 + layer * 0.11 + seed * 0.06;

  const candidates: Array<{ lat: number; lng: number }> = [
    { lat: cell.lat, lng: cell.lng },
  ];

  for (let attempt = 1; attempt <= 16; attempt++) {
    const r = radius * (attempt / 4);
    const a = angle + attempt * 0.55;
    candidates.push({
      lat: cell.lat + r * Math.cos(a) * 0.75,
      lng: cell.lng + r * Math.sin(a),
    });
  }

  for (const candidate of candidates) {
    if (isPointInCountry(iso, candidate.lat, candidate.lng)) {
      return candidate;
    }
  }

  return cell;
}

function isCompactCountry(iso: string): boolean {
  const bbox = getSpreadBbox(iso);
  if (!bbox) return false;
  const span = (bbox.maxLat - bbox.minLat) * (bbox.maxLng - bbox.minLng);
  return span < 140;
}

/** Spread movies within a country, snapping back to land when jitter hits water. */
export function spreadMovieOnLand(
  iso: string,
  tmdbId: number,
  index: number,
  total: number,
): { lat: number; lng: number } | null {
  if (total <= 1) {
    return countryInteriorPoint(iso) ?? spreadMovieInCountry(iso, tmdbId, 0, 1);
  }

  if (isCompactCountry(iso)) {
    const gridPoint = spreadOnLandGrid(iso, tmdbId, index, total);
    if (gridPoint) return gridPoint;
  }

  const bboxPoint = spreadInCountryBbox(iso, tmdbId, index, total);
  if (bboxPoint) return bboxPoint;

  const scales = [1, 0.85, 0.65, 0.45];
  for (const scale of scales) {
    const candidate = spreadMovieInCountry(iso, tmdbId, index, total, scale);
    if (candidate && isPointInCountry(iso, candidate.lat, candidate.lng)) {
      return candidate;
    }
  }

  return countryInteriorPoint(iso) ?? spreadMovieInCountry(iso, tmdbId, index, total, 0);
}
