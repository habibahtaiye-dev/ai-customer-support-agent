import type { KnowledgeDocument, RetrievedChunk } from './types';
import { tokenize, termFrequencies, cosineSimilarity } from './textUtils';

interface IndexedDocument {
  doc: KnowledgeDocument;
  /** TF vector built from title + tags + content. */
  vector: Map<string, number>;
}

/**
 * A lightweight in-memory retrieval index using term-frequency cosine
 * similarity. This is deliberately dependency-free so the demo works with no
 * external services while still demonstrating real retrieval behavior.
 *
 * The shape of this class mirrors how a vector store retriever would be used
 * (index documents once, then query), so swapping in embeddings + a real
 * vector store later is a drop-in change.
 */
export class RetrievalIndex {
  private indexed: IndexedDocument[] = [];

  constructor(documents: KnowledgeDocument[]) {
    this.indexed = documents.map((doc) => {
      const blended = `${doc.title} ${doc.tags.join(' ')} ${doc.content}`;
      const vector = termFrequencies(tokenize(blended));
      return { doc, vector };
    });
  }

  /**
   * Return the top-k documents matching the query, with similarity scores.
   * Tags and title terms are weighted so a query that names a topic directly
   * ranks that document higher.
   */
  search(query: string, k = 3, minScore = 0.04): RetrievedChunk[] {
    const queryVector = termFrequencies(tokenize(query));
    const scored: RetrievedChunk[] = this.indexed.map(({ doc, vector }) => {
      const baseScore = cosineSimilarity(queryVector, vector);
      // Boost when query tokens directly match a tag or title word.
      const queryTokens = tokenize(query);
      const titleTokens = new Set(tokenize(doc.title));
      const tagTokens = new Set(doc.tags.flatMap((t) => tokenize(t)));
      let boost = 0;
      for (const token of queryTokens) {
        if (titleTokens.has(token)) boost += 0.08;
        if (tagTokens.has(token)) boost += 0.12;
      }
      const score = Math.min(1, baseScore + boost);
      return { document: doc, score };
    });

    return scored
      .filter((r) => r.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, k);
  }
}
