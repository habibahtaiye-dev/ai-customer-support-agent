import type { Citation, RagResponse, RetrievedChunk } from './types';

const ANSWER_CONFIDENCE_THRESHOLD = 0.18;
const ESCALATION_CONFIDENCE_THRESHOLD = 0.07;

const FALLBACK_ANSWER =
  "I'm not confident I have the right information to answer that. I can connect you with a human support agent who can help further.";

const ESCALATION_INTENTS = [
  'human',
  'agent',
  'representative',
  'person',
  'speak to someone',
  'real person',
  'manager',
  'supervisor',
  'escalat',
  'complaint',
  'frustrated',
  'angry',
  'unhappy',
  'not happy',
  'lawsuit',
  'legal',
  'attorney',
  'lawyer',
  'threat',
  'sue',
];

const GREETING_INTENTS = ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'thanks', 'thank you', 'bye', 'goodbye'];

/**
 * Core RAG engine. Given a user query and retrieved chunks, it decides whether
 * to answer, fall back, or escalate, and composes the answer with citations.
 *
 * The answer composition is intentionally rule-based and clearly labeled as
 * "simulated" by the caller so the demo never masquerades as a live LLM.
 */
export class RagEngine {
  /** Decide whether the query is an explicit request for human help. */
  static isEscalationRequest(query: string): boolean {
    const lower = query.toLowerCase();
    return ESCALATION_INTENTS.some((intent) => lower.includes(intent));
  }

  static isGreeting(query: string): boolean {
    const lower = query.toLowerCase().trim();
    return GREETING_INTENTS.some((intent) => lower === intent || lower.startsWith(intent + ' ') || lower === intent);
  }

  /** Compose a grounded answer from retrieved chunks, with citations. */
  static generate(
    query: string,
    chunks: RetrievedChunk[],
  ): RagResponse {
    if (this.isGreeting(query)) {
      return {
        kind: 'answer',
        answer:
          "Hi! I'm Northwind Home's virtual assistant. Ask me about orders, returns, payments, warranties, shipping, or account help.",
        citations: [],
        confidence: 1,
      };
    }

    if (this.isEscalationRequest(query)) {
      return {
        kind: 'escalate',
        answer:
          "I'll connect you with a human support agent now. A support specialist will follow up by email shortly.",
        reason: 'Customer explicitly requested human assistance.',
        confidence: 1,
      };
    }

    if (chunks.length === 0) {
      return this.fallbackWithEscalation(query, 0);
    }

    const top = chunks[0];
    const confidence = top.score;

    if (confidence < ESCALATION_CONFIDENCE_THRESHOLD) {
      return this.fallbackWithEscalation(query, confidence);
    }

    if (confidence < ANSWER_CONFIDENCE_THRESHOLD) {
      return {
        kind: 'fallback',
        answer: FALLBACK_ANSWER,
        confidence,
      };
    }

    const citations: Citation[] = chunks.slice(0, 3).map((chunk) => ({
      documentId: chunk.document.id,
      title: chunk.document.title,
      category: chunk.document.category,
    }));

    const answer = this.composeAnswer(query, chunks);
    return {
      kind: 'answer',
      answer,
      citations,
      confidence,
    };
  }

  private static fallbackWithEscalation(_query: string, confidence: number): RagResponse {
    return {
      kind: 'escalate',
      answer: FALLBACK_ANSWER,
      reason: 'No relevant knowledge-base content was found for the query.',
      confidence,
    };
  }

  private static composeAnswer(query: string, chunks: RetrievedChunk[]): string {
    const top = chunks[0];
    const summary = this.summarize(top.document.content);
    const qualifier = top.score > 0.4 ? '' : 'Based on what I found in our help content, ';
    return `${qualifier}here's what I can tell you: ${summary} Would you like more detail, or should I connect you with a human agent?`;
  }

  /** Produce a one-to-two sentence summary from the source content. */
  private static summarize(content: string): string {
    const sentences = content
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (sentences.length === 0) return content.trim();
    if (sentences.length === 1) return sentences[0];
    return `${sentences[0]} ${sentences[1] ?? ''}`.trim();
  }
}
