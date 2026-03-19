import { extractStreetNumber, normalizeAddress } from "../utils/text.js";

export interface AddressMatchResult {
  matches: boolean;
  seedNormalized: string;
  torontoNormalized: string;
}

export function matchAddresses(
  seedAddress: string,
  torontoAddress: string
): AddressMatchResult {
  const seedNorm = normalizeAddress(seedAddress);
  const torontoNorm = normalizeAddress(torontoAddress);

  // Extract street numbers
  const seedNum = extractStreetNumber(seedNorm);
  const torontoNum = extractStreetNumber(torontoNorm);

  // If both have street numbers, they must match
  if (seedNum && torontoNum) {
    if (seedNum !== torontoNum) {
      return { matches: false, seedNormalized: seedNorm, torontoNormalized: torontoNorm };
    }

    // Street numbers match — check if street names overlap
    const seedRest = seedNorm.replace(/^\d+\s*/, "");
    const torontoRest = torontoNorm.replace(/^\d+\s*/, "");

    // Check if one contains the other or they share significant tokens
    if (seedRest === torontoRest || seedRest.includes(torontoRest) || torontoRest.includes(seedRest)) {
      return { matches: true, seedNormalized: seedNorm, torontoNormalized: torontoNorm };
    }

    // Token overlap — split and compare
    const seedTokens = new Set(seedRest.split(/\s+/));
    const torontoTokens = new Set(torontoRest.split(/\s+/));
    let overlap = 0;
    for (const t of seedTokens) {
      if (torontoTokens.has(t)) overlap++;
    }
    const matches = overlap >= Math.min(seedTokens.size, torontoTokens.size) * 0.5;
    return { matches, seedNormalized: seedNorm, torontoNormalized: torontoNorm };
  }

  // Fallback: simple string containment
  const matches = seedNorm.includes(torontoNorm) || torontoNorm.includes(seedNorm);
  return { matches, seedNormalized: seedNorm, torontoNormalized: torontoNorm };
}
