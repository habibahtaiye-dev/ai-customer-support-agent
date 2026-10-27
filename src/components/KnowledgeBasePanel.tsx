import { useState, useMemo } from 'react';
import { getKnowledgeBase } from '@/rag/knowledgeBase';
import { RetrievalIndex } from '@/rag/retrieval';

const DOCS = getKnowledgeBase();
const index = new RetrievalIndex(DOCS);

export function KnowledgeBasePanel() {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(DOCS[0]?.id ?? null);

  const results = useMemo(() => {
    if (!query.trim()) return DOCS.map((d) => ({ document: d, score: 1 }));
    return index.search(query, 8, 0.01);
  }, [query]);

  const selected = DOCS.find((d) => d.id === selectedId) ?? DOCS[0] ?? null;

  return (
    <div className="flex flex-col h-full bg-white">
      <header className="px-5 py-4 border-b border-slate-200">
        <h3 className="font-semibold text-slate-900 text-sm">Knowledge Base</h3>
        <p className="text-xs text-slate-500 mt-0.5">{DOCS.length} documents · searchable</p>
      </header>

      <div className="px-5 py-3 border-b border-slate-200">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search documents…"
          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400"
        />
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col md:flex-row min-h-0">
        <ul className="md:w-1/2 border-b md:border-b-0 md:border-r border-slate-200 divide-y divide-slate-100">
          {results.length === 0 && (
            <li className="px-4 py-6 text-center text-xs text-slate-400">No documents found.</li>
          )}
          {results.map((r) => (
            <li key={r.document.id}>
              <button
                onClick={() => setSelectedId(r.document.id)}
                className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition ${
                  selected?.id === r.document.id ? 'bg-sky-50' : ''
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-slate-800 truncate">{r.document.title}</span>
                  {query.trim() && (
                    <span className="text-[10px] text-slate-400 shrink-0">{r.score.toFixed(2)}</span>
                  )}
                </div>
                <span className="text-[11px] text-sky-600">{r.document.category}</span>
              </button>
            </li>
          ))}
        </ul>

        {selected && (
          <div className="md:w-1/2 p-4 overflow-y-auto">
            <h4 className="text-sm font-semibold text-slate-900">{selected.title}</h4>
            <div className="flex flex-wrap gap-1 mt-1.5">
              {selected.tags.map((t) => (
                <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                  {t}
                </span>
              ))}
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mt-3 whitespace-pre-line">{selected.content}</p>
          </div>
        )}
      </div>
    </div>
  );
}
