export interface KnowledgeDocument {
  id: string;
  title: string;
  category: string;
  tags: string[];
  content: string;
}

export interface RetrievedChunk {
  document: KnowledgeDocument;
  /** Cosine-like similarity score in the range 0..1. */
  score: number;
}

export type Citation = {
  documentId: string;
  title: string;
  category: string;
};

export type AgentMessageRole = 'user' | 'assistant' | 'system';

export type AgentSource =
  | 'knowledge-base'
  | 'fallback'
  | 'escalation'
  | 'validation';

export interface ChatMessage {
  id: string;
  role: AgentMessageRole;
  content: string;
  timestamp: number;
  /** Whether the reply was simulated by demo mode rather than a live model. */
  simulated: boolean;
  source: AgentSource;
  citations?: Citation[];
  /** Set when the message represents an escalation handoff to a human. */
  escalated?: boolean;
}

export type EscalationStatus = 'open' | 'claimed' | 'resolved';

export interface EscalationRecord {
  id: string;
  conversationId: string;
  reason: string;
  summary: string;
  question: string;
  status: EscalationStatus;
  createdAt: number;
  resolvedAt?: number;
}

export interface ActivityLogEntry {
  id: string;
  timestamp: number;
  level: 'info' | 'warn' | 'error';
  event: string;
  detail?: string;
}

export type RagResponse =
  | {
      kind: 'answer';
      answer: string;
      citations: Citation[];
      confidence: number;
    }
  | {
      kind: 'fallback';
      answer: string;
      confidence: number;
    }
  | {
      kind: 'escalate';
      answer: string;
      reason: string;
      confidence: number;
    };
