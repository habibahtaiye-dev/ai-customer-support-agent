import type { ActivityLogEntry, ChatMessage, EscalationRecord, RagResponse } from './types';
import { RetrievalIndex } from './retrieval';
import { RagEngine } from './ragEngine';
import { validateInput, type ValidationResult } from './validation';
import { ActivityLogger } from './logger';
import { EscalationQueue } from './escalationQueue';
import { getKnowledgeBase } from './knowledgeBase';

export interface AgentResult {
  message: ChatMessage;
  response: RagResponse;
  escalation?: EscalationRecord;
}

/**
 * High-level orchestrator that wires retrieval, the RAG engine, validation,
 * logging, and escalation together. The UI talks to this single object.
 */
export class SupportAgent {
  private index: RetrievalIndex;
  readonly logger: ActivityLogger;
  readonly escalations: EscalationQueue;
  private conversationId: string;

  constructor(conversationId = `conv-${Date.now().toString(36)}`) {
    this.index = new RetrievalIndex(getKnowledgeBase());
    this.logger = new ActivityLogger();
    this.escalations = new EscalationQueue();
    this.conversationId = conversationId;
  }

  getConversationId(): string {
    return this.conversationId;
  }

  /** Search the knowledge base directly (used by the searchable docs panel). */
  retrieve(query: string) {
    return this.index.search(query, 5, 0.01);
  }

  validate(raw: unknown): ValidationResult {
    return validateInput(raw);
  }

  /** Process a user message end-to-end and return the assistant reply. */
  async ask(rawInput: unknown): Promise<AgentResult> {
    const validation = this.validate(rawInput);
    if (!validation.valid) {
      this.logger.warn('Input rejected', validation.error);
      const message: ChatMessage = {
        id: this.id(),
        role: 'assistant',
        content: validation.error ?? 'Invalid input.',
        timestamp: Date.now(),
        simulated: false,
        source: 'validation',
      };
      return { message, response: { kind: 'fallback', answer: message.content, confidence: 0 } };
    }

    const query = String(rawInput).trim();
    this.logger.info('User query received', query);

    try {
      const chunks = this.index.search(query, 3, 0.04);
      this.logger.info(
        'Retrieval complete',
        chunks.length > 0
          ? `Top match: ${chunks[0].document.title} (${chunks[0].score.toFixed(3)})`
          : 'No matches above threshold',
      );

      const response = RagEngine.generate(query, chunks);

      if (response.kind === 'answer') {
        this.logger.info('Answer generated', `confidence=${response.confidence.toFixed(3)}`);
      } else if (response.kind === 'fallback') {
        this.logger.warn('Fallback used', `confidence=${response.confidence.toFixed(3)}`);
      } else {
        this.logger.warn('Escalation triggered', response.reason);
      }

      const message: ChatMessage = {
        id: this.id(),
        role: 'assistant',
        content: response.answer,
        timestamp: Date.now(),
        simulated: true,
        source:
          response.kind === 'answer'
            ? 'knowledge-base'
            : response.kind === 'escalate'
              ? 'escalation'
              : 'fallback',
        citations: response.kind === 'answer' ? response.citations : undefined,
        escalated: response.kind === 'escalate',
      };

      let escalation: EscalationRecord | undefined;
      if (response.kind === 'escalate') {
        escalation = {
          id: this.id(),
          conversationId: this.conversationId,
          reason: response.reason,
          summary: this.summarizeForEscalation(query),
          question: query,
          status: 'open',
          createdAt: Date.now(),
        };
        this.escalations.enqueue(escalation);
      }

      return { message, response, escalation };
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      this.logger.error('Pipeline error', detail);
      const message: ChatMessage = {
        id: this.id(),
        role: 'assistant',
        content: 'Something went wrong while processing your request. A human agent has been notified.',
        timestamp: Date.now(),
        simulated: false,
        source: 'fallback',
      };
      return { message, response: { kind: 'fallback', answer: message.content, confidence: 0 } };
    }
  }

  activityLog(): ActivityLogEntry[] {
    return this.logger.all();
  }

  private summarizeForEscalation(query: string): string {
    if (query.length <= 160) return query;
    return `${query.slice(0, 157)}...`;
  }

  private id(): string {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }
}
