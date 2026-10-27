import type { ActivityLogEntry } from '@/rag';

export function ActivityLogPanel({ entries }: { entries: ActivityLogEntry[] }) {
  return (
    <div className="flex flex-col h-full bg-white">
      <header className="px-5 py-4 border-b border-slate-200">
        <h3 className="font-semibold text-slate-900 text-sm">Activity Log</h3>
        <p className="text-xs text-slate-500 mt-0.5">Pipeline events · {entries.length} entries</p>
      </header>
      <div className="flex-1 overflow-y-auto">
        {entries.length === 0 && (
          <p className="px-5 py-8 text-center text-xs text-slate-400">No activity yet.</p>
        )}
        <ul className="divide-y divide-slate-100">
          {entries.map((e) => (
            <li key={e.id} className="px-5 py-2.5">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${dotColor(e.level)}`} />
                <span className="text-xs font-medium text-slate-700">{e.event}</span>
                <span className="text-[10px] text-slate-400 ml-auto">{formatTime(e.timestamp)}</span>
              </div>
              {e.detail && <p className="text-[11px] text-slate-500 mt-1 ml-4 truncate">{e.detail}</p>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function dotColor(level: ActivityLogEntry['level']): string {
  if (level === 'error') return 'bg-rose-500';
  if (level === 'warn') return 'bg-amber-500';
  return 'bg-emerald-500';
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
