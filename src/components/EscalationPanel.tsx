import type { EscalationRecord, EscalationStatus } from '@/rag';

interface EscalationPanelProps {
  records: EscalationRecord[];
  onUpdateStatus: (id: string, status: EscalationStatus) => void;
}

const STATUS_LABEL: Record<EscalationStatus, string> = {
  open: 'Open',
  claimed: 'Claimed',
  resolved: 'Resolved',
};

const STATUS_COLOR: Record<EscalationStatus, string> = {
  open: 'bg-rose-50 text-rose-700 border-rose-200',
  claimed: 'bg-amber-50 text-amber-700 border-amber-200',
  resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export function EscalationPanel({ records, onUpdateStatus }: EscalationPanelProps) {
  return (
    <div className="flex flex-col h-full bg-white">
      <header className="px-5 py-4 border-b border-slate-200">
        <h3 className="font-semibold text-slate-900 text-sm">Human Escalation Queue</h3>
        <p className="text-xs text-slate-500 mt-0.5">{records.length} tickets · {records.filter((r) => r.status === 'open').length} open</p>
      </header>
      <div className="flex-1 overflow-y-auto">
        {records.length === 0 && (
          <p className="px-5 py-8 text-center text-xs text-slate-400">No escalations yet.</p>
        )}
        <ul className="divide-y divide-slate-100">
          {records.map((r) => (
            <li key={r.id} className="px-5 py-3">
              <div className="flex items-center justify-between gap-2">
                <span className={`text-[10px] px-1.5 py-0.5 rounded border ${STATUS_COLOR[r.status]}`}>
                  {STATUS_LABEL[r.status]}
                </span>
                <span className="text-[10px] text-slate-400">{new Date(r.createdAt).toLocaleTimeString()}</span>
              </div>
              <p className="text-xs text-slate-700 mt-2 line-clamp-2">{r.question}</p>
              <p className="text-[11px] text-slate-500 mt-1">{r.reason}</p>
              <div className="flex gap-2 mt-2">
                {r.status === 'open' && (
                  <button
                    onClick={() => onUpdateStatus(r.id, 'claimed')}
                    className="text-[11px] px-2 py-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-50"
                  >
                    Claim
                  </button>
                )}
                {r.status !== 'resolved' && (
                  <button
                    onClick={() => onUpdateStatus(r.id, 'resolved')}
                    className="text-[11px] px-2 py-1 rounded border border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                  >
                    Resolve
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
