# API Documentation

## `SupportAgent`

The orchestrator. Wires together retrieval, generation, validation, logging, and escalation.

### Constructor

```typescript
new SupportAgent(conversationId?: string)
```

Creates a new agent with a fresh retrieval index, logger, and escalation queue.

### Methods

#### `validate(raw: unknown): ValidationResult`

Validates raw user input before it enters the pipeline.

```typescript
const result = agent.validate(userInput);
// { valid: true } | { valid: false, error: string }
```

#### `async ask(rawInput: unknown): Promise<AgentResult>`

Processes a user message end-to-end: validate → retrieve → generate → log/escalate.

Returns:

```typescript
interface AgentResult {
  message: ChatMessage;       // The assistant reply to display
  response: RagResponse;      // The raw RAG decision
  escalation?: EscalationRecord; // Present if the query was escalated
}
```

#### `retrieve(query: string): RetrievedChunk[]`

Searches the knowledge base directly. Returns up to 5 chunks with similarity scores.

#### `activityLog(): ActivityLogEntry[]`

Returns all logged pipeline events (newest first).

#### `getConversationId(): string`

Returns the conversation identifier.

### Properties

- `logger: ActivityLogger` — the activity logger instance.
- `escalations: EscalationQueue` — the escalation queue instance.

---

## `RagResponse`

A discriminated union with three kinds:

### `answer`

```typescript
{
  kind: 'answer';
  answer: string;       // The grounded answer
  citations: Citation[];// Source documents
  confidence: number;   // 0..1 retrieval score
}
```

### `fallback`

```typescript
{
  kind: 'fallback';
  answer: string;       // "I'm not confident..."
  confidence: number;
}
```

### `escalate`

```typescript
{
  kind: 'escalate';
  answer: string;       // Handoff message
  reason: string;       // Why escalation was triggered
  confidence: number;
}
```

---

## `ChatMessage`

```typescript
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  simulated: boolean;     // true for demo-mode responses
  source: 'knowledge-base' | 'fallback' | 'escalation' | 'validation';
  citations?: Citation[];
  escalated?: boolean;
}
```

---

## `Citation`

```typescript
interface Citation {
  documentId: string;
  title: string;
  category: string;
}
```

---

## `RetrievalIndex`

### Constructor

```typescript
new RetrievalIndex(documents: KnowledgeDocument[])
```

### Methods

#### `search(query: string, k?: number, minScore?: number): RetrievedChunk[]`

- `k` (default 3) — maximum number of results.
- `minScore` (default 0.04) — minimum similarity score to include a result.

Returns `RetrievedChunk[]` sorted by score descending:

```typescript
interface RetrievedChunk {
  document: KnowledgeDocument;
  score: number; // 0..1
}
```

---

## `RagEngine`

Static methods — no instantiation needed.

#### `RagEngine.generate(query: string, chunks: RetrievedChunk[]): RagResponse`

Produces an answer, fallback, or escalation decision from retrieved chunks.

#### `RagEngine.isEscalationRequest(query: string): boolean`

Detects explicit human-escalation intent.

#### `RagEngine.isGreeting(query: string): boolean`

Detects greetings/thanks.

---

## `validateInput(raw: unknown): ValidationResult`

Standalone validation function.

```typescript
import { validateInput } from '@/rag';

const result = validateInput(rawInput);
// { valid: true } | { valid: false, error: string }
```

Rules:

- Must be a string
- Must be at least 2 characters (after trim)
- Must be at most 1000 characters

---

## `ActivityLogger`

### Methods

- `info(event, detail?)`, `warn(event, detail?)`, `error(event, detail?)` — log events.
- `all(): ActivityLogEntry[]` — all entries, newest first.
- `subscribe(listener): () => void` — subscribe to new entries.
- `clear()` — clear all entries.

---

## `EscalationQueue`

### Methods

- `enqueue(record: EscalationRecord)` — add a new escalation.
- `updateStatus(id, status)` — update to `open | claimed | resolved`.
- `all(): EscalationRecord[]` — all records.
- `open(): EscalationRecord[]` — non-resolved records.
- `subscribe(listener): () => void` — subscribe to changes.
