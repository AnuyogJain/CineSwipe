import type { MovieCandidate } from "./types";

const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with",
  "by", "from", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had",
  "do", "does", "did", "will", "would", "could", "should", "may", "might", "must",
  "that", "this", "these", "those", "it", "its", "he", "she", "they", "them", "his",
  "her", "their", "who", "which", "when", "where", "what", "as", "into", "through",
  "after", "before", "about", "over", "under", "between", "during", "without", "within",
]);

export interface ScoredCandidate extends MovieCandidate {
  seedTitles: string[];
  seedCount: number;
  semanticScore: number;
  profileScore: number;
}

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

export function movieDocument(movie: {
  title: string;
  overview: string;
  genres: string[];
  director?: string;
  cast?: string[];
}): string {
  const cast = movie.cast?.slice(0, 5).join(" ") ?? "";
  const genres = movie.genres.join(" ");
  const director = movie.director ?? "";
  return `${movie.title} ${genres} ${director} ${cast} ${movie.overview}`.trim();
}

export function buildIdf(documents: string[][]): Map<string, number> {
  const df = new Map<string, number>();
  for (const doc of documents) {
    const unique = new Set(doc);
    for (const term of unique) {
      df.set(term, (df.get(term) ?? 0) + 1);
    }
  }
  const n = documents.length;
  const idf = new Map<string, number>();
  for (const [term, count] of df) {
    idf.set(term, Math.log((n + 1) / (count + 1)) + 1);
  }
  return idf;
}

export function tfIdfVector(
  tokens: string[],
  idf: Map<string, number>,
): Map<string, number> {
  const tf = new Map<string, number>();
  for (const token of tokens) {
    tf.set(token, (tf.get(token) ?? 0) + 1);
  }
  const vec = new Map<string, number>();
  for (const [term, count] of tf) {
    vec.set(term, (count / tokens.length) * (idf.get(term) ?? 1));
  }
  return vec;
}

export function cosineSimilarity(
  a: Map<string, number>,
  b: Map<string, number>,
): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (const [key, val] of a) {
    normA += val * val;
    if (b.has(key)) dot += val * b.get(key)!;
  }
  for (const val of b.values()) {
    normB += val * val;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/** Weighted blend of cosine similarity against multiple loved-movie vectors. */
export function semanticTasteScore(
  candidateVec: Map<string, number>,
  corpus: Array<{ vector: Map<string, number>; weight: number }>,
): number {
  if (corpus.length === 0) return 0;
  let weighted = 0;
  let totalWeight = 0;
  for (const doc of corpus) {
    weighted += cosineSimilarity(candidateVec, doc.vector) * doc.weight;
    totalWeight += doc.weight;
  }
  return totalWeight > 0 ? weighted / totalWeight : 0;
}

/** Feature similarity for MMR diversity (genres + decade + director). */
export function featureSimilarity(
  a: { genres: string[]; year: number; director?: string },
  b: { genres: string[]; year: number; director?: string },
): number {
  const setA = new Set(a.genres);
  const setB = new Set(b.genres);
  let genreOverlap = 0;
  for (const g of setA) {
    if (setB.has(g)) genreOverlap += 1;
  }
  const genreSim =
    setA.size + setB.size > 0
      ? (2 * genreOverlap) / (setA.size + setB.size)
      : 0;

  const decadeA = Math.floor(a.year / 10);
  const decadeB = Math.floor(b.year / 10);
  const decadeSim = decadeA === decadeB && a.year > 0 ? 1 : 0;

  const directorSim =
    a.director && b.director && a.director === b.director ? 1 : 0;

  return 0.55 * genreSim + 0.3 * decadeSim + 0.15 * directorSim;
}

/**
 * Maximal Marginal Relevance — balances relevance vs diversity so the deck
 * doesn't feel like clones of one seed movie.
 */
export function mmrRank<T extends ScoredCandidate>(
  candidates: T[],
  limit: number,
  lambda = 0.72,
): T[] {
  if (candidates.length === 0) return [];
  const selected: T[] = [];
  const pool = [...candidates].sort((a, b) => b.matchScore - a.matchScore);

  selected.push(pool.shift()!);

  while (selected.length < limit && pool.length > 0) {
    let bestIdx = 0;
    let bestMmr = -Infinity;

    for (let i = 0; i < pool.length; i++) {
      const candidate = pool[i]!;
      let maxSim = 0;
      for (const picked of selected) {
        maxSim = Math.max(maxSim, featureSimilarity(candidate, picked));
      }
      const mmr = lambda * candidate.matchScore - (1 - lambda) * maxSim;
      if (mmr > bestMmr) {
        bestMmr = mmr;
        bestIdx = i;
      }
    }

    selected.push(pool.splice(bestIdx, 1)[0]!);
  }

  return selected;
}

/** Round-robin interleave by primary genre so consecutive cards feel different. */
export function interleaveByGenre<T extends ScoredCandidate>(ranked: T[]): T[] {
  const buckets = new Map<string, T[]>();
  for (const item of ranked) {
    const key = item.genres[0] ?? "Other";
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(item);
  }

  const keys = [...buckets.keys()].sort(
    (a, b) => (buckets.get(b)?.length ?? 0) - (buckets.get(a)?.length ?? 0),
  );

  const result: T[] = [];
  let added = true;
  while (added && result.length < ranked.length) {
    added = false;
    for (const key of keys) {
      const bucket = buckets.get(key)!;
      if (bucket.length > 0) {
        result.push(bucket.shift()!);
        added = true;
      }
    }
  }

  return result;
}

export function parseVoteCount(votes: string | null | undefined): number {
  if (!votes) return 0;
  const cleaned = votes.replace(/,/g, "").trim();
  if (!cleaned || cleaned === "N/A") return 0;
  if (/m$/i.test(cleaned)) return Math.round(parseFloat(cleaned) * 1_000_000);
  if (/k$/i.test(cleaned)) return Math.round(parseFloat(cleaned) * 1_000);
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

export function popularityBoost(voteCount: number): number {
  if (voteCount >= 100_000) return 0.08;
  if (voteCount >= 25_000) return 0.05;
  if (voteCount >= 10_000) return 0.03;
  if (voteCount >= 5_000) return 0.01;
  if (voteCount >= 2_000) return 0;
  if (voteCount >= 500) return -0.06;
  return -0.12;
}

export interface TasteDimensions {
  genre: number;
  director: number;
  cast: number;
  era: number;
  runtime: number;
}

export function countActiveDimensions(dims: TasteDimensions, min = 0.1): number {
  return Object.values(dims).filter((v) => v >= min).length;
}

/** Soft gate — prefer multi-signal fits, but don't starve the deck. */
export function passesHolisticGate(
  dims: TasteDimensions,
  profileScore: number,
  semanticScore: number,
): boolean {
  if (profileScore >= 0.12) return true;
  if (semanticScore >= 0.2) return true;
  if (countActiveDimensions(dims, 0.08) >= 2) return true;
  return false;
}

export function buildReason(
  movie: ScoredCandidate,
  topGenres: string[],
): string {
  const genreOverlap = movie.genres.filter((g) =>
    topGenres.some((t) => t.toLowerCase() === g.toLowerCase()),
  );
  const genrePart =
    genreOverlap.length > 0
      ? genreOverlap.slice(0, 2).join(" & ")
      : movie.genres.slice(0, 2).join(" & ");

  if (movie.profileScore >= 0.3 && movie.semanticScore >= 0.25) {
    return `Strong fit across your whole library — ${genrePart}, themes & style`;
  }

  if (movie.seedCount >= 3 && movie.seedTitles.length > 0) {
    const seeds = movie.seedTitles.slice(0, 2).join(", ");
    return `Matches many of your highly rated picks (${seeds}…) · ${genrePart}`;
  }

  if (movie.semanticScore >= 0.28) {
    return `Themes & tone align with your rated movies · ${genrePart}`;
  }

  if (movie.profileScore >= 0.25) {
    return `Lines up with your overall taste profile · ${genrePart}`;
  }

  return `Balanced against your full rating history · ${genrePart}`;
}

export function combineScores(
  profileScore: number,
  semanticScore: number,
  seedCount: number,
  imdbRating: number | null = null,
  voteCount = 0,
): number {
  const consensusBoost =
    seedCount >= 3
      ? Math.min(0.1, (seedCount - 2) * 0.03)
      : seedCount === 2
        ? 0.04
        : 0;

  let imdbBoost = 0;
  if (imdbRating != null) {
    if (imdbRating >= 8) imdbBoost = 0.08;
    else if (imdbRating >= 7.5) imdbBoost = 0.05;
    else if (imdbRating >= 7) imdbBoost = 0.02;
    else if (imdbRating >= 6.5) imdbBoost = 0;
    else if (imdbRating >= 6) imdbBoost = -0.06;
    else imdbBoost = -0.15;
  }

  const voteBoost = popularityBoost(voteCount);

  return (
    0.52 * profileScore +
    0.33 * semanticScore +
    consensusBoost +
    imdbBoost +
    voteBoost
  );
}

export function toMatchPercent(score: number): number {
  // Calibrated so typical good fits land ~55–85%, not everything at 99%
  const normalized = Math.max(0, Math.min(1, score / 0.85));
  return Math.round(normalized * 92);
}
