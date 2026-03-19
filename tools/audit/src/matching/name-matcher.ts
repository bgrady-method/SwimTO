import {
  tokenizeWithoutStopWords,
  jaccardSimilarity,
  normalizeText,
} from "../utils/text.js";

export interface NameMatchResult {
  score: number;
  method: "exact" | "fuzzy" | "substring" | "none";
}

export function matchNames(seedName: string, torontoName: string): NameMatchResult {
  const normalizedSeed = normalizeText(seedName);
  const normalizedToronto = normalizeText(torontoName);

  // Exact match after normalization
  if (normalizedSeed === normalizedToronto) {
    return { score: 1.0, method: "exact" };
  }

  // Substring containment (one contains the other)
  if (
    normalizedSeed.includes(normalizedToronto) ||
    normalizedToronto.includes(normalizedSeed)
  ) {
    return { score: 0.85, method: "substring" };
  }

  // Jaccard similarity on meaningful tokens
  const seedTokens = tokenizeWithoutStopWords(seedName);
  const torontoTokens = tokenizeWithoutStopWords(torontoName);
  const jaccard = jaccardSimilarity(seedTokens, torontoTokens);

  if (jaccard >= 0.5) {
    return { score: jaccard, method: "fuzzy" };
  }

  return { score: jaccard, method: "none" };
}
