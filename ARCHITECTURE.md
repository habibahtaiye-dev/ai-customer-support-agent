# Architecture

## Design goals

1. **Instant demo** — visitors open the app and can interact immediately. No login, API key, or backend setup.
2. **Real pipeline** — the RAG flow (retrieve → generate → fallback → escalate) is a working implementation, not a mockup.
3. **Swappable layers** — retrieval and generation are isolated behind clean interfaces so they can be replaced with embeddings and a live LLM without touching the UI.
4. **Observable** — every pipeline step emits a structured activity log entry visible in the UI.
5. **Safe fallback** — when the knowledge base doesn't contain an answer, the agent says so and offers escalation instead of hallucinating.

## Pipeline

```
User input
    │
    ▼
┌──────────────┐     invalid
│  Validation  │──────────────► Validation error message
└──────┬───────┘
       │ valid
       ▼
┌──────────────────┐
│  Retrieval Index │  TF-cosine similarity + tag/title boost
│  search(query,   │  returns top-k documents with scores
│  k=3, minScore)  │
└──────┬───────────┘
       │ chunks
       ▼
┌──────────────────┐
│   RagEngine      │  Decision logic:
│   generate()     │  - greeting?     → answer (no citations)
│                  │  - escalation?   → escalate
│                  │  - score ≥ 0.18? → answer with citations
│                  │  - score < 0.07? → escalate (no relevant docs)
│                  │  - otherwise     → fallback
└──────┬───────────┘
       │ RagResponse (answer | fallback | escalate)
       ▼
┌──────────────────┐
│  SupportAgent    │  Builds ChatMessage, logs activity,
│  (orchestrator)  │  enqueues escalation if needed
└──────────────────┘
```

## Confidence thresholds

| Score range | Outcome |
|------------|---------|
| ≥ 0.18 | **Answer** with citations |
| 0.07 – 0.18 | **Fallback** — "I'm not confident…" |
| < 0.07 | **Escalate** — no relevant content found |
| Escalation intent detected | **Escalate** — regardless of score |
| Greeting detected | **Answer** — greeting response, no citations |

## Retrieval

`RetrievalIndex` builds a term-frequency vector per document from the blended text of `title + tags + content`. At query time it computes cosine similarity between the query vector and each document vector, then applies a boost for direct tag and title matches.

This is deliberately dependency-free so the demo runs anywhere. The interface is:

```typescript
search(query: string, k?: number, minScore?: number): RetrievedChunk[]
```

To upgrade to embeddings-based retrieval, implement the same `search()` signature backed by a vector store (pgvector, Pinecone, etc.) and inject it into `SupportAgent`.

## Generation

`RagEngine.generate()` composes answers by extracting the first 1-2 sentences from the top retrieved document. This is rule-based and clearly labeled "Simulated" in the UI. To use a real LLM:

1. Pass the retrieved chunks as context to an LLM call.
2. Instruct the model to answer only from the provided context.
3. Return the answer with citations derived from the chunks used.

The `RagResponse` shape (`answer | fallback | escalate`) stays the same.

## Escalation

Two triggers:

- **Explicit request** — the user asks for a human, manager, or files a complaint (keyword detection).
- **Low confidence** — retrieval returns no documents above the minimum threshold.

Each escalation creates an `EscalationRecord` with status `open`. The queue supports `claimed` and `resolved` states. In production these would persist to a database; here they live in memory for the demo.

## Activity logging

`ActivityLogger` is a pub/sub log. Every pipeline step publishes an entry (`info`, `warn`, or `error`). The UI subscribes and renders the log in real time. This makes the pipeline transparent to recruiters evaluating the demo.
