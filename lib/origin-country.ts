/** ISO 3166-1 alpha-2 → primary spoken languages (ISO 639-1). */
const COUNTRY_LANGUAGES: Record<string, readonly string[]> = {
  AD: ["ca"],
  AE: ["ar"],
  AF: ["fa", "ps"],
  AL: ["sq"],
  AM: ["hy"],
  AR: ["es"],
  AT: ["de"],
  AU: ["en"],
  AZ: ["az"],
  BA: ["bs", "hr", "sr"],
  BD: ["bn"],
  BE: ["nl", "fr", "de"],
  BF: ["fr"],
  BG: ["bg"],
  BH: ["ar"],
  BJ: ["fr"],
  BO: ["es"],
  BR: ["pt"],
  BY: ["be", "ru"],
  CA: ["en", "fr"],
  CD: ["fr"],
  CF: ["fr"],
  CG: ["fr"],
  CH: ["de", "fr", "it"],
  CI: ["fr"],
  CL: ["es"],
  CN: ["zh"],
  CO: ["es"],
  CR: ["es"],
  CU: ["es"],
  CY: ["el", "tr"],
  CZ: ["cs"],
  DE: ["de"],
  DK: ["da"],
  DO: ["es"],
  DZ: ["ar"],
  EC: ["es"],
  EE: ["et"],
  EG: ["ar"],
  ES: ["es"],
  ET: ["am"],
  FI: ["fi", "sv"],
  FR: ["fr"],
  GA: ["fr"],
  GB: ["en"],
  GE: ["ka"],
  GH: ["en"],
  GM: ["en"],
  GN: ["fr"],
  GR: ["el"],
  GT: ["es"],
  HK: ["zh", "en"],
  HR: ["hr"],
  HU: ["hu"],
  ID: ["id"],
  IE: ["en", "ga"],
  IL: ["he"],
  IN: ["hi", "en"],
  IQ: ["ar"],
  IR: ["fa"],
  IS: ["is"],
  IT: ["it"],
  JM: ["en"],
  JO: ["ar"],
  JP: ["ja"],
  KE: ["en", "sw"],
  KG: ["ky", "ru"],
  KH: ["km"],
  KR: ["ko"],
  KW: ["ar"],
  KZ: ["kk", "ru"],
  LA: ["lo"],
  LB: ["ar"],
  LK: ["si", "ta"],
  LT: ["lt"],
  LU: ["lb", "fr", "de"],
  LV: ["lv"],
  MA: ["ar", "fr"],
  MC: ["fr"],
  MD: ["ro"],
  ME: ["sr"],
  MK: ["mk"],
  ML: ["fr"],
  MM: ["my"],
  MN: ["mn"],
  MO: ["zh", "pt"],
  MR: ["ar"],
  MT: ["mt", "en"],
  MX: ["es"],
  MY: ["ms"],
  MZ: ["pt"],
  NE: ["fr"],
  NG: ["en"],
  NL: ["nl"],
  NO: ["no"],
  NP: ["ne"],
  NZ: ["en"],
  OM: ["ar"],
  PA: ["es"],
  PE: ["es"],
  PH: ["tl", "en"],
  PK: ["ur", "en"],
  PL: ["pl"],
  PR: ["es", "en"],
  PS: ["ar"],
  PT: ["pt"],
  PY: ["es"],
  QA: ["ar"],
  RO: ["ro"],
  RS: ["sr"],
  RU: ["ru"],
  SA: ["ar"],
  SE: ["sv"],
  SG: ["en", "zh", "ms"],
  SI: ["sl"],
  SK: ["sk"],
  SN: ["fr"],
  SY: ["ar"],
  TD: ["fr", "ar"],
  TG: ["fr"],
  TH: ["th"],
  TN: ["ar"],
  TR: ["tr"],
  TW: ["zh"],
  TZ: ["sw", "en"],
  UA: ["uk"],
  UG: ["en", "sw"],
  US: ["en"],
  UY: ["es"],
  UZ: ["uz"],
  VE: ["es"],
  VN: ["vi"],
  XK: ["sq", "sr"],
  YE: ["ar"],
  ZA: ["en", "af", "zu"],
  ZW: ["en"],
};

function normalizeLanguage(code: string): string {
  return code.trim().toLowerCase().split("-")[0] ?? "";
}

function countrySpeaksLanguage(iso: string, language: string): boolean {
  const langs = COUNTRY_LANGUAGES[iso];
  if (!langs) return false;
  return langs.includes(language);
}

/**
 * Pick the production country that best matches the movie's original language.
 * e.g. DE+US with German → DE; DE+US with English → US.
 * Falls back to the first TMDB production country when no language match exists.
 */
export function resolvePrimaryCountryCode(
  countryCodes: string[],
  originalLanguage: string,
): string | null {
  if (countryCodes.length === 0) return null;
  if (countryCodes.length === 1) return countryCodes[0];

  const lang = normalizeLanguage(originalLanguage);
  if (!lang) return countryCodes[0];

  const matching = countryCodes.filter((iso) => countrySpeaksLanguage(iso, lang));
  if (matching.length === 0) return countryCodes[0];

  // Prefer TMDB production order when several countries share the language.
  return countryCodes.find((iso) => matching.includes(iso)) ?? matching[0];
}

export function resolvePrimaryCountryName(
  countryCodes: string[],
  countryNames: string[],
  originalLanguage: string,
): { iso: string; name: string } | null {
  const iso = resolvePrimaryCountryCode(countryCodes, originalLanguage);
  if (!iso) return null;

  const index = countryCodes.indexOf(iso);
  const name = index >= 0 ? countryNames[index] : undefined;

  return { iso, name: name ?? iso };
}
