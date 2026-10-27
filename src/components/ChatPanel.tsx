import { useState } from 'react';

interface ChatPanelProps {
  messages: import('@/rag').ChatMessage[];
  onSend: (text: string) => void;
  busy: boolean;
  onEscalate: () => void;
  escalated: boolean;
}

const SUGGESTED = [
  'How do I track my order?',
  'What is your return policy?',
  'Which payment methods do you accept?',
  'How do I reset my password?',
  'Do you ship internationally?',
  'I want to speak to a human',
];

export function ChatPanel({ messages, onSend, busy, onEscalate, escalated }: ChatPanelProps) {
  const [input, setInput] = useState('');

  const handleSend = (text?: string) => {
    const value = (text ?? input).trim();
    if (!value || busy) return;
    onSend(value);
    setInput('');
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <header className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-cyan-600 flex items-center justify-center text-white font-semibold">
            NW
          </div>
          <div>
            <h2 className="font-semibold text-slate-900 text-sm">Northwind Support Assistant</h2>
            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Online · Demo mode
            </p>
          </div>
        </div>
        <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
          Simulated responses
        </span>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 bg-slate-50">
        {messages.length === 0 && (
          <div className="text-center text-slate-400 text-sm py-8">
            Ask a question to start the demo.
          </div>
        )}
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
        {busy && <TypingIndicator />}
      </div>

      {messages.length <= 1 && (
        <div className="px-4 pb-2 flex flex-wrap gap-2">
          {SUGGESTED.map((q) => (
            <button
              key={q}
              onClick={() => handleSend(q)}
              disabled={busy}
              className="text-xs px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-600 hover:border-sky-400 hover:text-sky-700 transition disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {escalated && (
        <div className="mx-4 mb-2 p-3 rounded-lg bg-violet-50 border border-violet-200 flex items-center justify-between">
          <p className="text-xs text-violet-800">
            Your conversation has been escalated to a human agent.
          </p>
          <button
            onClick={onEscalate}
            className="text-xs font-medium text-violet-700 hover:text-violet-900"
          >
            View ticket
          </button>
        </div>
      )}

      <div className="px-4 py-3 border-t border-slate-200 bg-white">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            rows={1}
            placeholder="Type your question…"
            className="flex-1 resize-none px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent max-h-32"
          />
          <button
            onClick={() => handleSend()}
            disabled={busy || !input.trim()}
            className="px-4 py-2.5 rounded-xl bg-sky-600 text-white text-sm font-medium hover:bg-sky-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            Send
          </button>
        </div>
        <p className="text-[11px] text-slate-400 mt-2">
          Press Enter to send. This is a demo — no real account or API key required.
        </p>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: import('@/rag').ChatMessage }) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-br-md bg-sky-600 text-white px-4 py-2.5 text-sm">
          {message.content}
        </div>
      </div>
    );
  }

  const sourceLabel: Record<string, string> = {
    'knowledge-base': 'Knowledge base',
    fallback: 'Fallback',
    escalation: 'Escalated',
    validation: 'Validation',
  };
  const sourceColor: Record<string, string> = {
    'knowledge-base': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    fallback: 'bg-amber-50 text-amber-700 border-amber-200',
    escalation: 'bg-violet-50 text-violet-700 border-violet-200',
    validation: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  return (
    <div className="flex justify-start">
      <div className="max-w-[85%]">
        <div className="rounded-2xl rounded-bl-md bg-white border border-slate-200 px-4 py-2.5 text-sm text-slate-700 leading-relaxed">
          {message.content}
        </div>
        <div className="flex items-center gap-2 mt-1.5 ml-1">
          {message.simulated && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
              Simulated
            </span>
          )}
          {message.source !== 'validation' && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${sourceColor[message.source] ?? ''}`}>
              {sourceLabel[message.source] ?? message.source}
            </span>
          )}
          {message.citations && message.citations.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {message.citations.map((c) => (
                <span
                  key={c.documentId}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200"
                >
                  [{c.title}]
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="rounded-2xl rounded-bl-md bg-white border border-slate-200 px-4 py-3 flex gap-1">
        <span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}
