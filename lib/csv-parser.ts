import Papa from "papaparse";
import { z } from "zod";

const rowSchema = z.object({
  Const: z.string().min(1),
  "Your Rating": z.string().optional(),
  "Date Rated": z.string().optional(),
  Title: z.string().min(1),
  "Original Title": z.string().optional(),
  URL: z.string().optional(),
  "Title Type": z.string().optional(),
  "IMDb Rating": z.string().optional(),
  "Runtime (mins)": z.string().optional(),
  Year: z.string().optional(),
  Genres: z.string().optional(),
  "Num Votes": z.string().optional(),
  "Release Date": z.string().optional(),
  Directors: z.string().optional(),
});

export interface ParsedRating {
  imdbId: string;
  title: string;
  originalTitle: string | null;
  yourRating: number | null;
  imdbRating: number | null;
  imdbVotes: number | null;
  genres: string | null;
  directors: string | null;
  year: number | null;
  runtime: number | null;
  titleType: string | null;
  dateRated: string | null;
  url: string | null;
}

function parseNumber(value?: string): number | null {
  if (!value || value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function parseImdbCsv(csvText: string): ParsedRating[] {
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  if (parsed.errors.length > 0) {
    throw new Error(parsed.errors[0]?.message ?? "Failed to parse CSV");
  }

  const results: ParsedRating[] = [];
  const seen = new Set<string>();

  for (const row of parsed.data) {
    const validated = rowSchema.safeParse(row);
    if (!validated.success) continue;

    const imdbId = validated.data.Const.trim();
    if (seen.has(imdbId)) continue;
    seen.add(imdbId);

    results.push({
      imdbId,
      title: validated.data.Title.trim(),
      originalTitle: validated.data["Original Title"]?.trim() || null,
      yourRating: parseNumber(validated.data["Your Rating"]),
      imdbRating: parseNumber(validated.data["IMDb Rating"]),
      imdbVotes: parseNumber(validated.data["Num Votes"]),
      genres: validated.data.Genres?.trim() || null,
      directors: validated.data.Directors?.trim() || null,
      year: parseNumber(validated.data.Year),
      runtime: parseNumber(validated.data["Runtime (mins)"]),
      titleType: validated.data["Title Type"]?.trim() || null,
      dateRated: validated.data["Date Rated"]?.trim() || null,
      url: validated.data.URL?.trim() || null,
    });
  }

  if (results.length === 0) {
    throw new Error("No valid ratings found. Check that this is an IMDb export CSV.");
  }

  return results;
}
