/** ISO 3166-1 alpha-2 country centroids for globe placement. */
export const COUNTRY_CENTROIDS: Record<
  string,
  { lat: number; lng: number; name: string }
> = {
  AD: { lat: 42.5, lng: 1.5, name: "Andorra" },
  AE: { lat: 24.0, lng: 54.0, name: "United Arab Emirates" },
  AF: { lat: 33.0, lng: 65.0, name: "Afghanistan" },
  AL: { lat: 41.0, lng: 20.0, name: "Albania" },
  AM: { lat: 40.0, lng: 45.0, name: "Armenia" },
  AR: { lat: -34.0, lng: -64.0, name: "Argentina" },
  AT: { lat: 47.5, lng: 14.5, name: "Austria" },
  AU: { lat: -25.0, lng: 135.0, name: "Australia" },
  AZ: { lat: 40.5, lng: 47.5, name: "Azerbaijan" },
  BA: { lat: 44.0, lng: 18.0, name: "Bosnia and Herzegovina" },
  BD: { lat: 24.0, lng: 90.0, name: "Bangladesh" },
  BE: { lat: 50.5, lng: 4.5, name: "Belgium" },
  BF: { lat: 12.0, lng: -2.0, name: "Burkina Faso" },
  BG: { lat: 43.0, lng: 25.0, name: "Bulgaria" },
  BH: { lat: 26.0, lng: 50.5, name: "Bahrain" },
  BJ: { lat: 9.5, lng: 2.3, name: "Benin" },
  BO: { lat: -17.0, lng: -65.0, name: "Bolivia" },
  BR: { lat: -10.0, lng: -55.0, name: "Brazil" },
  BY: { lat: 53.0, lng: 28.0, name: "Belarus" },
  CA: { lat: 56.0, lng: -96.0, name: "Canada" },
  CD: { lat: -2.0, lng: 24.0, name: "Democratic Republic of the Congo" },
  CF: { lat: 7.0, lng: 21.0, name: "Central African Republic" },
  CG: { lat: -1.0, lng: 15.0, name: "Republic of the Congo" },
  CH: { lat: 47.0, lng: 8.0, name: "Switzerland" },
  CI: { lat: 8.0, lng: -5.5, name: "Ivory Coast" },
  CL: { lat: -35.0, lng: -71.0, name: "Chile" },
  CN: { lat: 35.0, lng: 105.0, name: "China" },
  CO: { lat: 4.0, lng: -72.0, name: "Colombia" },
  CR: { lat: 10.0, lng: -84.0, name: "Costa Rica" },
  CU: { lat: 22.0, lng: -79.5, name: "Cuba" },
  CY: { lat: 35.0, lng: 33.0, name: "Cyprus" },
  CZ: { lat: 49.8, lng: 15.5, name: "Czech Republic" },
  DE: { lat: 51.0, lng: 10.0, name: "Germany" },
  DK: { lat: 56.0, lng: 10.0, name: "Denmark" },
  DO: { lat: 19.0, lng: -70.5, name: "Dominican Republic" },
  DZ: { lat: 28.0, lng: 3.0, name: "Algeria" },
  EC: { lat: -2.0, lng: -78.0, name: "Ecuador" },
  EE: { lat: 59.0, lng: 26.0, name: "Estonia" },
  EG: { lat: 27.0, lng: 30.0, name: "Egypt" },
  ES: { lat: 40.0, lng: -4.0, name: "Spain" },
  ET: { lat: 9.0, lng: 40.0, name: "Ethiopia" },
  FI: { lat: 64.0, lng: 26.0, name: "Finland" },
  FR: { lat: 46.0, lng: 2.0, name: "France" },
  GA: { lat: -1.0, lng: 12.0, name: "Gabon" },
  GB: { lat: 54.0, lng: -2.0, name: "United Kingdom" },
  GE: { lat: 42.0, lng: 43.5, name: "Georgia" },
  GH: { lat: 8.0, lng: -2.0, name: "Ghana" },
  GM: { lat: 13.5, lng: -15.5, name: "Gambia" },
  GN: { lat: 10.0, lng: -10.0, name: "Guinea" },
  GR: { lat: 39.0, lng: 22.0, name: "Greece" },
  GT: { lat: 15.5, lng: -90.5, name: "Guatemala" },
  HK: { lat: 22.3, lng: 114.2, name: "Hong Kong" },
  HR: { lat: 45.0, lng: 16.0, name: "Croatia" },
  HU: { lat: 47.0, lng: 20.0, name: "Hungary" },
  ID: { lat: -2.0, lng: 118.0, name: "Indonesia" },
  IE: { lat: 53.0, lng: -8.0, name: "Ireland" },
  IL: { lat: 31.5, lng: 34.8, name: "Israel" },
  IN: { lat: 22.0, lng: 79.0, name: "India" },
  IQ: { lat: 33.0, lng: 44.0, name: "Iraq" },
  IR: { lat: 32.0, lng: 53.0, name: "Iran" },
  IS: { lat: 65.0, lng: -18.0, name: "Iceland" },
  IT: { lat: 42.8, lng: 12.5, name: "Italy" },
  JM: { lat: 18.2, lng: -77.3, name: "Jamaica" },
  JO: { lat: 31.0, lng: 36.0, name: "Jordan" },
  JP: { lat: 36.0, lng: 138.0, name: "Japan" },
  KE: { lat: 0.0, lng: 38.0, name: "Kenya" },
  KG: { lat: 41.5, lng: 75.0, name: "Kyrgyzstan" },
  KH: { lat: 13.0, lng: 105.0, name: "Cambodia" },
  KR: { lat: 36.0, lng: 128.0, name: "South Korea" },
  KW: { lat: 29.5, lng: 47.5, name: "Kuwait" },
  KZ: { lat: 48.0, lng: 68.0, name: "Kazakhstan" },
  LA: { lat: 18.0, lng: 105.0, name: "Laos" },
  LB: { lat: 33.8, lng: 35.8, name: "Lebanon" },
  LK: { lat: 7.0, lng: 81.0, name: "Sri Lanka" },
  LT: { lat: 56.0, lng: 24.0, name: "Lithuania" },
  LU: { lat: 49.8, lng: 6.1, name: "Luxembourg" },
  LV: { lat: 57.0, lng: 25.0, name: "Latvia" },
  MA: { lat: 32.0, lng: -6.0, name: "Morocco" },
  MC: { lat: 43.7, lng: 7.4, name: "Monaco" },
  MD: { lat: 47.0, lng: 29.0, name: "Moldova" },
  ME: { lat: 42.5, lng: 19.3, name: "Montenegro" },
  MK: { lat: 41.6, lng: 21.7, name: "North Macedonia" },
  ML: { lat: 17.0, lng: -4.0, name: "Mali" },
  MM: { lat: 22.0, lng: 98.0, name: "Myanmar" },
  MN: { lat: 46.0, lng: 105.0, name: "Mongolia" },
  MO: { lat: 22.2, lng: 113.5, name: "Macau" },
  MR: { lat: 20.0, lng: -10.0, name: "Mauritania" },
  MT: { lat: 35.9, lng: 14.4, name: "Malta" },
  MX: { lat: 23.0, lng: -102.0, name: "Mexico" },
  MY: { lat: 4.0, lng: 102.0, name: "Malaysia" },
  MZ: { lat: -18.0, lng: 35.0, name: "Mozambique" },
  NE: { lat: 17.0, lng: 8.0, name: "Niger" },
  NG: { lat: 10.0, lng: 8.0, name: "Nigeria" },
  NL: { lat: 52.5, lng: 5.5, name: "Netherlands" },
  NO: { lat: 62.0, lng: 10.0, name: "Norway" },
  NP: { lat: 28.0, lng: 84.0, name: "Nepal" },
  NZ: { lat: -41.0, lng: 174.0, name: "New Zealand" },
  OM: { lat: 21.0, lng: 57.0, name: "Oman" },
  PA: { lat: 9.0, lng: -80.0, name: "Panama" },
  PE: { lat: -10.0, lng: -76.0, name: "Peru" },
  PH: { lat: 13.0, lng: 122.0, name: "Philippines" },
  PK: { lat: 30.0, lng: 70.0, name: "Pakistan" },
  PL: { lat: 52.0, lng: 20.0, name: "Poland" },
  PR: { lat: 18.2, lng: -66.5, name: "Puerto Rico" },
  PS: { lat: 31.9, lng: 35.2, name: "Palestine" },
  PT: { lat: 39.5, lng: -8.0, name: "Portugal" },
  PY: { lat: -23.0, lng: -58.0, name: "Paraguay" },
  QA: { lat: 25.3, lng: 51.2, name: "Qatar" },
  RO: { lat: 46.0, lng: 25.0, name: "Romania" },
  RS: { lat: 44.0, lng: 21.0, name: "Serbia" },
  RU: { lat: 60.0, lng: 100.0, name: "Russia" },
  SA: { lat: 25.0, lng: 45.0, name: "Saudi Arabia" },
  SE: { lat: 62.0, lng: 15.0, name: "Sweden" },
  SG: { lat: 1.3, lng: 103.8, name: "Singapore" },
  SI: { lat: 46.0, lng: 15.0, name: "Slovenia" },
  SK: { lat: 48.7, lng: 19.5, name: "Slovakia" },
  SN: { lat: 14.0, lng: -14.0, name: "Senegal" },
  SY: { lat: 35.0, lng: 38.0, name: "Syria" },
  TD: { lat: 15.0, lng: 19.0, name: "Chad" },
  TG: { lat: 8.5, lng: 1.0, name: "Togo" },
  TH: { lat: 15.0, lng: 101.0, name: "Thailand" },
  TN: { lat: 34.0, lng: 9.0, name: "Tunisia" },
  TR: { lat: 39.0, lng: 35.0, name: "Turkey" },
  TW: { lat: 23.7, lng: 121.0, name: "Taiwan" },
  TZ: { lat: -6.0, lng: 35.0, name: "Tanzania" },
  UA: { lat: 49.0, lng: 32.0, name: "Ukraine" },
  UG: { lat: 1.0, lng: 32.0, name: "Uganda" },
  US: { lat: 38.0, lng: -97.0, name: "United States of America" },
  UY: { lat: -33.0, lng: -56.0, name: "Uruguay" },
  UZ: { lat: 41.0, lng: 64.0, name: "Uzbekistan" },
  VE: { lat: 8.0, lng: -66.0, name: "Venezuela" },
  VN: { lat: 16.0, lng: 108.0, name: "Vietnam" },
  XK: { lat: 42.6, lng: 21.0, name: "Kosovo" },
  YE: { lat: 15.5, lng: 48.0, name: "Yemen" },
  ZA: { lat: -29.0, lng: 24.0, name: "South Africa" },
  ZW: { lat: -19.0, lng: 29.0, name: "Zimbabwe" },
};

export function countryName(iso: string, fallback?: string): string {
  return COUNTRY_CENTROIDS[iso]?.name ?? fallback ?? iso;
}

export function getCentroid(iso: string): { lat: number; lng: number; name: string } | null {
  return COUNTRY_CENTROIDS[iso] ?? null;
}

/** Default lat/lng spread (degrees) when no regional anchors exist. */
const COUNTRY_SPREAD: Record<string, { lat: number; lng: number }> = {
  US: { lat: 5, lng: 8 },
  IN: { lat: 4, lng: 5 },
  CN: { lat: 5, lng: 6 },
  RU: { lat: 7, lng: 10 },
  BR: { lat: 5, lng: 6 },
  AU: { lat: 4, lng: 5 },
  CA: { lat: 5, lng: 8 },
  MX: { lat: 3, lng: 4 },
  AR: { lat: 4, lng: 3 },
  FR: { lat: 2, lng: 2.5 },
  DE: { lat: 2, lng: 2.5 },
  GB: { lat: 2, lng: 2 },
  IT: { lat: 2.5, lng: 2 },
  ES: { lat: 2.5, lng: 2.5 },
  JP: { lat: 3, lng: 3.5 },
  KR: { lat: 2, lng: 2 },
};

/** Regional anchors for large countries — movies spread within a picked region. */
const COUNTRY_REGIONS: Record<
  string,
  Array<{ lat: number; lng: number; spread: { lat: number; lng: number } }>
> = {
  US: [
    { lat: 34.1, lng: -118.2, spread: { lat: 5, lng: 6 } },
    { lat: 40.7, lng: -74.0, spread: { lat: 4, lng: 5 } },
    { lat: 41.9, lng: -87.6, spread: { lat: 5, lng: 7 } },
    { lat: 29.8, lng: -95.4, spread: { lat: 5, lng: 7 } },
    { lat: 33.4, lng: -84.4, spread: { lat: 4, lng: 5 } },
    { lat: 39.7, lng: -104.9, spread: { lat: 5, lng: 6 } },
  ],
  IN: [
    { lat: 28.6, lng: 77.2, spread: { lat: 4, lng: 5 } },
    { lat: 19.1, lng: 72.9, spread: { lat: 4, lng: 4 } },
    { lat: 13.1, lng: 80.3, spread: { lat: 3, lng: 4 } },
    { lat: 22.6, lng: 88.4, spread: { lat: 4, lng: 4 } },
    { lat: 23.3, lng: 77.4, spread: { lat: 3, lng: 5 } },
  ],
  CN: [
    { lat: 39.9, lng: 116.4, spread: { lat: 4, lng: 5 } },
    { lat: 31.2, lng: 121.5, spread: { lat: 3, lng: 4 } },
    { lat: 23.1, lng: 113.3, spread: { lat: 3, lng: 4 } },
    { lat: 30.6, lng: 104.1, spread: { lat: 4, lng: 5 } },
  ],
  GB: [
    { lat: 51.5, lng: -0.1, spread: { lat: 2, lng: 2 } },
    { lat: 53.5, lng: -2.2, spread: { lat: 2, lng: 2 } },
    { lat: 55.9, lng: -3.2, spread: { lat: 2, lng: 2 } },
  ],
  FR: [
    { lat: 48.9, lng: 2.3, spread: { lat: 3, lng: 3 } },
    { lat: 43.3, lng: 5.4, spread: { lat: 2, lng: 2 } },
    { lat: 47.2, lng: -1.6, spread: { lat: 2, lng: 2 } },
  ],
  DE: [
    { lat: 52.5, lng: 13.4, spread: { lat: 3, lng: 4 } },
    { lat: 48.1, lng: 11.6, spread: { lat: 2, lng: 3 } },
    { lat: 50.9, lng: 6.9, spread: { lat: 2, lng: 3 } },
  ],
  AU: [
    { lat: -33.9, lng: 151.2, spread: { lat: 3, lng: 4 } },
    { lat: -37.8, lng: 145.0, spread: { lat: 3, lng: 3 } },
    { lat: -27.5, lng: 153.0, spread: { lat: 3, lng: 4 } },
  ],
  CA: [
    { lat: 43.7, lng: -79.4, spread: { lat: 4, lng: 6 } },
    { lat: 49.3, lng: -123.1, spread: { lat: 3, lng: 5 } },
    { lat: 45.5, lng: -73.6, spread: { lat: 3, lng: 4 } },
  ],
};

function hashSeed(tmdbId: number, salt = 0): number {
  return ((tmdbId * 2654435761 + salt * 1597334677) >>> 0) / 4294967296;
}

/**
 * Spread movie points across a country using regional anchors when available.
 * Deterministic from tmdbId; uses index/total for even distribution in large libraries.
 */
export function spreadMovieInCountry(
  iso: string,
  tmdbId: number,
  index: number,
  total: number,
  spreadScale = 1,
): { lat: number; lng: number } | null {
  const regions = COUNTRY_REGIONS[iso];
  const seed2 = hashSeed(tmdbId, 1);

  let anchor: { lat: number; lng: number };
  let spread: { lat: number; lng: number };

  if (regions && regions.length > 0) {
    const regionIndex = index % regions.length;
    const localIndex = Math.floor(index / regions.length);
    const localTotal = Math.max(1, Math.ceil(total / regions.length));
    const region = regions[regionIndex];
    anchor = { lat: region.lat, lng: region.lng };
    spread = region.spread;

    const goldenAngle = 2.399963229728653;
    const angle = localIndex * goldenAngle + seed2 * Math.PI * 2;
    const radiusNorm = Math.sqrt((localIndex + 0.5) / localTotal);

    spread = {
      lat: spread.lat * spreadScale,
      lng: spread.lng * spreadScale,
    };

    if (spreadScale === 0) return anchor;

    return {
      lat: anchor.lat + radiusNorm * spread.lat * Math.cos(angle),
      lng: anchor.lng + radiusNorm * spread.lng * Math.sin(angle),
    };
  } else {
    const base = getCentroid(iso);
    if (!base) return null;
    anchor = { lat: base.lat, lng: base.lng };
    spread = COUNTRY_SPREAD[iso] ?? { lat: 1.5, lng: 2 };
  }

  spread = {
    lat: spread.lat * spreadScale,
    lng: spread.lng * spreadScale,
  };

  if (total <= 1 || spreadScale === 0) {
    return anchor;
  }

  const goldenAngle = 2.399963229728653;
  const angle = index * goldenAngle + seed2 * Math.PI * 2;
  const radiusNorm = Math.sqrt((index + 0.5) / total);

  return {
    lat: anchor.lat + radiusNorm * spread.lat * Math.cos(angle),
    lng: anchor.lng + radiusNorm * spread.lng * Math.sin(angle),
  };
}

/** @deprecated use spreadMovieInCountry */
export function jitterAroundCentroid(
  iso: string,
  tmdbId: number,
  _spreadDeg = 6,
): { lat: number; lng: number } | null {
  return spreadMovieInCountry(iso, tmdbId, tmdbId % 97, 97);
}
