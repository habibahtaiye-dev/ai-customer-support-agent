# AI Customer Support Agent

A production-grade **Retrieval-Augmented Generation (RAG)** customer support agent with a live, no-setup demo. Built by **Habibah Lawal** — AI Automation Specialist & backend developer.

> The application opens directly into a fully usable demo. No login, no API key, no external service configuration required.

![Tech](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-6E9F18?logo=vitest&logoColor=white)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Live Demo](#live-demo)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Deployment](#deployment)
- [Roadmap](#roadmap)
- [Author](#author)
- [License](#license)

---

## Overview

This project demonstrates a complete RAG pipeline for customer support:

1. **Retrieval** — A user question is matched against a knowledge base using TF-cosine similarity with tag/title boosting.
2. **Generation** — Retrieved context is composed into a grounded answer with source citations.
3. **Fallback** — When no relevant documents are found, the agent clearly says it cannot answer.
4. **Escalation** — Unsupported questions or explicit human requests are routed to a human escalation queue.

The demo runs entirely in the browser with a self-contained knowledge base and a rule-based answer composer, so visitors can try it instantly. The architecture is designed so the retrieval and generation layers can be swapped for embeddings + a real LLM without changing the interface.

---

## Features

- **Responsive chat interface** — real message bubbles, typing indicators, suggested questions, source labels.
- **Searchable knowledge base** — 8 example support documents across Orders, Returns, Billing, Account, Warranty, Shipping, and Support categories.
- **RAG with source references** — every grounded answer cites the knowledge-base documents it drew from.
- **Clear fallback** — when the answer isn't in the knowledge base, the agent says so rather than hallucinating.
- **Human escalation workflow** — an escalation queue tracks open/claimed/resolved tickets, triggered by explicit requests or low-confidence queries.
- **Input validation & error handling** — input length, type, and content validation at the pipeline boundary.
- **Activity logs** — structured pipeline events (query received, retrieval complete, answer generated, fallback used, escalation triggered) displayed in real time.
- **Demo mode** — works immediately with no login or API key. Simulated responses are clearly labeled with a "Simulated" badge.
- **Automated tests** — 34 tests covering retrieval, supported questions, unsupported questions, escalation, validation, and end-to-end agent flow.

---

## Live Demo

The deployed demo runs in demo mode by default. Simulated responses are labeled with a "Simulated" badge and a "Simulated responses" indicator in the chat header.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser (React UI)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │  Chat Panel   │  │ Knowledge    │  │ Activity Log     │   │
│  │  (messages,   │  │ Base Panel   │  │ + Escalation     │   │
│  │  citations)   │  │ (searchable) │  │ Queue Panels     │   │
│  └──────┬───────┘  └──────┬───────┘  └──────────────────┘   │
│         │                 │                                  │
│         ▼                 ▼                                  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              SupportAgent (orchestrator)             │    │
│  │  validate → retrieve → generate → log / escalate     │    │
│  └─────────────────────────────────────────────────────┘    │
│         │                                                      │
│         ▼                                                      │
│  ┌─────────────┐  ┌───────────────┐  ┌────────────────┐     │
│  │ Retrieval   │  │ RagEngine     │  │ EscalationQueue│     │
│  │ Index       │  │ (answer /     │  │ + ActivityLog  │     │
│  │ (TF-cosine) │  │ fallback /    │  │                │     │
│  │             │  │ escalate)     │  │                │     │
│  └──────┬──────┘  └───────────────┘  └────────────────┘     │
│         │                                                      │
│         ▼                                                      │
│  ┌─────────────────────────────────────┐                      │
│  │   Knowledge Base (8 documents)       │                      │
│  │   Orders · Returns · Billing ·       │                      │
│  │   Account · Warranty · Shipping      │                      │
│  └─────────────────────────────────────┘                      │
└─────────────────────────────────────────────────────────────┘
```

A detailed architecture write-up is in [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Language | TypeScript (strict mode) |
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS |
| Icons | lucide-react |
| Testing | Vitest |
| Retrieval | Custom TF-cosine similarity index (dependency-free, swappable) |
| Backend (demo) | In-browser — no server required |
| Backend (production) | Designed to slot in Supabase + an LLM API (see [Deployment](#deployment)) |

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
git clone https://github.com/habibahtaiye-dev/ai-customer-support-agent.git
cd ai-customer-support-agent
npm install
```

### Run the dev server

```bash
npm run dev
```

The app opens at the URL Vite prints (typically `http://localhost:5173`). It works immediately in demo mode — no `.env` configuration needed.

### Build for production

```bash
npm run build
```

The built site is in `dist/`.

### Preview the production build

```bash
npm run preview
```

---

## Project Structure

```
ai-customer-support-agent/
├── src/
│   ├── rag/                      # Core RAG pipeline (framework-agnostic)
│   │   ├── types.ts              # Shared TypeScript types
│   │   ├── knowledgeBase.ts      # Example knowledge base documents
│   │   ├── textUtils.ts          # Tokenizer, TF vectors, cosine similarity
│   │   ├── retrieval.ts          # RetrievalIndex (search + ranking)
│   │   ├── ragEngine.ts          # Answer / fallback / escalation logic
│   │   ├── validation.ts         # Input validation
│   │   ├── logger.ts             # Activity logger (pub/sub)
│   │   ├── escalationQueue.ts    # Human escalation queue
│   │   ├── supportAgent.ts       # Orchestrator (ties it all together)
│   │   ├── index.ts              # Public exports
│   │   └── rag.test.ts           # 34 automated tests
│   ├── components/               # React UI
│   │   ├── ChatPanel.tsx
│   │   ├── KnowledgeBasePanel.tsx
│   │   ├── ActivityLogPanel.tsx
│   │   └── EscalationPanel.tsx
│   ├── App.tsx                   # Main app shell + layout
│   ├── main.tsx
│   └── index.css
├── ARCHITECTURE.md
├── API.md
├── .env.example
├── .gitignore
├── README.md
└── package.json
```

---

## API Documentation

The `SupportAgent` class is the single entry point. Full API details are in [API.md](./API.md).

### Quick reference

```typescript
import { SupportAgent } from '@/rag';

const agent = new SupportAgent();

// Validate input
const validation = agent.validate(userInput);
if (!validation.valid) console.log(validation.error);

// Ask a question (async)
const result = await agent.ask('How do I track my order?');
// result.message      — ChatMessage (role, content, citations, source)
// result.response     — RagResponse (answer | fallback | escalate)
// result.escalation   — EscalationRecord (if escalated)

// Search the knowledge base directly
const chunks = agent.retrieve('refund policy');

// Access logs and escalations
agent.activityLog();
agent.escalations.all();
```

---

## Testing

Tests use **Vitest** and cover:

| Suite | Tests | What it covers |
|-------|-------|---------------|
| Text utilities | 2 | Tokenization, cosine similarity |
| RetrievalIndex | 4 | Relevance ranking, top-k, no-match, limit |
| Supported questions | 8 | 7 real support questions + citation integrity |
| Unsupported questions | 5 | Off-topic queries fall back, not hallucinate |
| Escalation | 7 | Explicit human requests + low-confidence escalation + greetings |
| SupportAgent end-to-end | 4 | Full pipeline: answer, escalate, reject invalid, log |
| Input validation | 4 | Non-string, empty, too long, valid |

### Run tests

```bash
npm test              # run once
npm run test:watch    # watch mode
```

### Current results

```
Test Files  1 passed (1)
     Tests  34 passed (34)
```

---

## Deployment

### Static deployment (Vite build)

The demo builds to a static site in `dist/` and can be deployed to any static host:

- **Netlify**: connect the repo, build command `npm run build`, publish directory `dist`.
- **Vercel**: import the repo, framework preset "Vite", output directory `dist`.
- **GitHub Pages**: build with `npm run build` and publish `dist/` via a GitHub Actions workflow.

### Production backend (optional)

To move beyond demo mode with a live LLM:

1. Add an LLM API key to `.env` (see `.env.example`).
2. Replace the rule-based answer composer in `ragEngine.ts` with a call to your LLM, passing the retrieved chunks as context.
3. Optionally persist escalations and logs to Supabase (a project is provisioned and credentials are in `.env`).
4. Replace `RetrievalIndex` with an embeddings-based vector store — the `search(query, k, minScore)` interface stays the same.

---

## Roadmap

- Embeddings-based retrieval (OpenAI / local embeddings + pgvector)
- Live LLM answer generation (pluggable provider)
- Supabase persistence for escalations and activity logs
- Multi-turn conversation context window
- Feedback collection (thumbs up/down) on answers

---

## Author

**Habibah Lawal** — AI Automation Specialist & backend developer

- GitHub: [habibahtaiye-dev](https://github.com/habibahtaiye-dev)

---

## License

MIT
