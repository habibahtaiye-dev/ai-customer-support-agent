import { describe, it, expect } from 'vitest';
import { RetrievalIndex } from './retrieval';
import { getKnowledgeBase } from './knowledgeBase';
import { RagEngine } from './ragEngine';
import { SupportAgent } from './supportAgent';
import { validateInput, INPUT_LIMITS } from './validation';
import { tokenize, termFrequencies, cosineSimilarity } from './textUtils';

describe('text utilities', () => {
  it('tokenizes and removes stop words', () => {
    const tokens = tokenize('How do I track my order?');
    expect(tokens).toContain('track');
    expect(tokens).toContain('order');
    expect(tokens).not.toContain('how');
    expect(tokens).not.toContain('my');
  });

  it('computes cosine similarity correctly', () => {
    const a = termFrequencies(['return', 'refund', 'policy']);
    const b = termFrequencies(['return', 'refund', 'policy']);
    expect(cosineSimilarity(a, b)).toBeCloseTo(1, 5);

    const c = termFrequencies(['shipping', 'delivery']);
    expect(cosineSimilarity(a, c)).toBe(0);
  });
});

describe('RetrievalIndex', () => {
  const index = new RetrievalIndex(getKnowledgeBase());

  it('retrieves the most relevant document for a shipping query', () => {
    const results = index.search('Where is my order? When will it arrive?');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].document.category).toBe('Orders');
    expect(results[0].score).toBeGreaterThan(0);
  });

  it('ranks returns-related docs for refund queries', () => {
    const results = index.search('I want a refund for my purchase');
    expect(results.length).toBeGreaterThan(0);
    const topTitles = results.slice(0, 2).map((r) => r.document.title);
    expect(topTitles).toContain('Return Policy');
  });

  it('returns no results for an unrelated query when minScore is high', () => {
    const results = index.search('xyzzy qqq zzzz', 3, 0.9);
    expect(results.length).toBe(0);
  });

  it('respects the top-k limit', () => {
    const results = index.search('order shipping return payment', 2);
    expect(results.length).toBeLessThanOrEqual(2);
  });
});

describe('RagEngine — supported questions', () => {
  const index = new RetrievalIndex(getKnowledgeBase());

  const supportedQuestions = [
    'How do I track my order?',
    'What is your return policy?',
    'Which payment methods do you accept?',
    'How do I reset my password?',
    'What does the warranty cover?',
    'How can I cancel my order?',
    'Do you ship internationally?',
  ];

  for (const question of supportedQuestions) {
    it(`answers: "${question}"`, () => {
      const chunks = index.search(question);
      const response = RagEngine.generate(question, chunks);
      expect(response.kind).toBe('answer');
      if (response.kind === 'answer') {
        expect(response.answer.length).toBeGreaterThan(10);
        expect(response.citations.length).toBeGreaterThan(0);
        expect(response.confidence).toBeGreaterThan(0.18);
      }
    });
  }

  it('returns citations referencing real knowledge-base documents', () => {
    const chunks = index.search('refund my order');
    const response = RagEngine.generate('refund my order', chunks);
    if (response.kind === 'answer') {
      const kbIds = new Set(getKnowledgeBase().map((d) => d.id));
      for (const c of response.citations) {
        expect(kbIds.has(c.documentId)).toBe(true);
      }
    }
  });
});

describe('RagEngine — unsupported questions', () => {
  const index = new RetrievalIndex(getKnowledgeBase());

  const unsupportedQuestions = [
    'What is the capital of France?',
    'Can you write me a poem about cats?',
    'How do I fix my car engine?',
    'Recommend a good sci-fi movie.',
  ];

  for (const question of unsupportedQuestions) {
    it(`falls back for: "${question}"`, () => {
      const chunks = index.search(question, 3, 0.04);
      const response = RagEngine.generate(question, chunks);
      expect(['fallback', 'escalate']).toContain(response.kind);
      if (response.kind === 'answer') {
        // If it somehow answers, it must NOT cite unrelated content confidently
        expect(response.confidence).toBeLessThan(0.5);
      }
    });
  }

  it('escalates when no relevant documents are found', () => {
    const response = RagEngine.generate('What is the capital of France?', []);
    expect(response.kind).toBe('escalate');
  });
});

describe('RagEngine — escalation', () => {
  const index = new RetrievalIndex(getKnowledgeBase());

  const escalationRequests = [
    'I want to speak to a human',
    'Let me talk to a real person',
    'Get me a manager',
    'I want to file a complaint',
    'Connect me with an agent',
  ];

  for (const request of escalationRequests) {
    it(`escalates for: "${request}"`, () => {
      const chunks = index.search(request);
      const response = RagEngine.generate(request, chunks);
      expect(response.kind).toBe('escalate');
      if (response.kind === 'escalate') {
        expect(response.reason.length).toBeGreaterThan(0);
      }
    });
  }

  it('escalates when confidence is below the escalation threshold', () => {
    const response = RagEngine.generate('xyzzy qqq', []);
    expect(response.kind).toBe('escalate');
  });

  it('handles greetings without escalation', () => {
    const response = RagEngine.generate('hello', []);
    expect(response.kind).toBe('answer');
  });
});

describe('SupportAgent end-to-end', () => {
  it('answers a supported question with citations', async () => {
    const agent = new SupportAgent();
    const result = await agent.ask('How do I reset my password?');
    expect(result.response.kind).toBe('answer');
    expect(result.message.role).toBe('assistant');
    if (result.response.kind === 'answer') {
      expect(result.response.citations.length).toBeGreaterThan(0);
    }
  });

  it('creates an escalation record for escalation requests', async () => {
    const agent = new SupportAgent();
    const result = await agent.ask('I need to speak to a human agent');
    expect(result.response.kind).toBe('escalate');
    expect(result.escalation).toBeDefined();
    expect(result.escalation?.status).toBe('open');
    expect(agent.escalations.open().length).toBe(1);
  });

  it('rejects invalid input without retrieving', async () => {
    const agent = new SupportAgent();
    const result = await agent.ask('');
    expect(result.message.source).toBe('validation');
    expect(result.response.kind).toBe('fallback');
  });

  it('logs activity for each step', async () => {
    const agent = new SupportAgent();
    await agent.ask('What is your return policy?');
    const events = agent.activityLog().map((e) => e.event);
    expect(events).toContain('User query received');
    expect(events).toContain('Retrieval complete');
  });
});

describe('input validation', () => {
  it('rejects non-strings', () => {
    expect(validateInput(42).valid).toBe(false);
    expect(validateInput(null).valid).toBe(false);
    expect(validateInput(undefined).valid).toBe(false);
  });

  it('rejects empty or whitespace input', () => {
    expect(validateInput('').valid).toBe(false);
    expect(validateInput('   ').valid).toBe(false);
  });

  it('rejects input that is too long', () => {
    const long = 'a'.repeat(INPUT_LIMITS.MAX_LENGTH + 1);
    expect(validateInput(long).valid).toBe(false);
  });

  it('accepts normal input', () => {
    expect(validateInput('How do I track my order?').valid).toBe(true);
  });
});
