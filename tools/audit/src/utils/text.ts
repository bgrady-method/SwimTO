const ABBREVIATIONS: Record<string, string> = {
  street: "st",
  avenue: "ave",
  boulevard: "blvd",
  drive: "dr",
  road: "rd",
  crescent: "cres",
  court: "ct",
  place: "pl",
  lane: "ln",
  terrace: "terr",
  circle: "cir",
  east: "e",
  west: "w",
  north: "n",
  south: "s",
};

const STOP_WORDS = new Set([
  "community",
  "recreation",
  "centre",
  "center",
  "pool",
  "pools",
  "memorial",
  "park",
  "building",
  "arena",
  "complex",
  "facility",
  "the",
  "and",
  "&",
  "of",
]);

export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/['']/g, "'")
    .replace(/[^\w\s'-]/g, "")
    .trim();
}

export function normalizeAddress(address: string): string {
  let normalized = address.toLowerCase().replace(/,?\s*toronto.*$/i, "").trim();

  // Expand or contract abbreviations to short form
  for (const [long, short] of Object.entries(ABBREVIATIONS)) {
    normalized = normalized.replace(new RegExp(`\\b${long}\\b`, "gi"), short);
  }

  return normalized.replace(/\s+/g, " ").trim();
}

export function tokenize(text: string): string[] {
  return normalizeText(text)
    .split(/[\s\-]+/)
    .filter((t) => t.length > 0);
}

export function tokenizeWithoutStopWords(text: string): string[] {
  return tokenize(text).filter((t) => !STOP_WORDS.has(t));
}

export function jaccardSimilarity(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 1;
  const setA = new Set(a);
  const setB = new Set(b);
  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection++;
  }
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

export function containsSubstring(haystack: string, needle: string): boolean {
  const h = normalizeText(haystack);
  const n = normalizeText(needle);
  return h.includes(n) || n.includes(h);
}

export function extractStreetNumber(address: string): string | null {
  const match = address.match(/^(\d+)/);
  return match ? match[1] : null;
}

export function extractStreetName(address: string): string {
  return normalizeAddress(address).replace(/^\d+\s*/, "").trim();
}

export function buildAddress(
  streetNo: string | null,
  streetName: string | null,
  streetType: string | null,
  streetDir: string | null
): string {
  const parts: string[] = [];
  if (streetNo) parts.push(streetNo);
  if (streetName) parts.push(streetName);
  if (streetType) parts.push(streetType);
  if (streetDir) parts.push(streetDir);
  return parts.join(" ");
}
