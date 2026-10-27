const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be', 'been',
  'being', 'to', 'of', 'in', 'on', 'for', 'with', 'as', 'at', 'by', 'from', 'this',
  'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'my', 'your',
  'his', 'her', 'its', 'our', 'their', 'me', 'him', 'us', 'them', 'do', 'does', 'did',
  'can', 'could', 'would', 'should', 'will', 'shall', 'may', 'might', 'must', 'have',
  'has', 'had', 'having', 'what', 'when', 'where', 'why', 'how', 'which', 'who', 'whom',
  'about', 'into', 'over', 'after', 'before', 'between', 'under', 'above', 'below',
  'please', 'want', 'need', 'get', 'got', 'tell', 'know', 'like', 'just', 'really',
]);

/** Apply a very small stemmer so "internationally" ~ "international", "refunds" ~ "refund". */
function stem(token: string): string {
  for (const suffix of ['ly', 'ing', 'ed', 'es', 's']) {
    if (token.length > suffix.length + 2 && token.endsWith(suffix)) {
      return token.slice(0, -suffix.length);
    }
  }
  return token;
}

/** Normalize a string into a list of meaningful lowercase tokens. */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token))
    .map(stem);
}

/** Build a term-frequency map from a token list. */
export function termFrequencies(tokens: string[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const token of tokens) {
    map.set(token, (map.get(token) ?? 0) + 1);
  }
  return map;
}

/** Cosine similarity between two term-frequency vectors (0..1). */
export function cosineSimilarity(
  a: Map<string, number>,
  b: Map<string, number>,
): number {
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (const [term, count] of a) {
    magA += count * count;
    const other = b.get(term);
    if (other !== undefined) dot += count * other;
  }
  for (const count of b.values()) {
    magB += count * count;
  }
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}
