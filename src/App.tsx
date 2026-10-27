import { useState, useEffect, useCallback, useRef } from 'react';
import { SupportAgent, type ChatMessage, type ActivityLogEntry, type EscalationRecord, type EscalationStatus } from '@/rag';
import { ChatPanel } from '@/components/ChatPanel';
import { KnowledgeBasePanel } from '@/components/KnowledgeBasePanel';
import { ActivityLogPanel } from '@/components/ActivityLogPanel';
import { EscalationPanel } from '@/components/EscalationPanel';
import { Github, MessageSquare, BookOpen, Activity, Headphones, Sparkles } from 'lucide-react';

type Tab = 'knowledge' | 'activity' | 'escalation';

export default function App() {
  const agentRef = useRef<SupportAgent | null>(null);
  if (!agentRef.current) agentRef.current = new SupportAgent();
  const agent = agentRef.current;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<Tab>('knowledge');
  const [log, setLog] = useState<ActivityLogEntry[]>([]);
  const [escalations, setEscalations] = useState<EscalationRecord[]>([]);
  const [escalated, setEscalated] = useState(false);
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);

  useEffect(() => {
    const unsubLog = agent.logger.subscribe(() => setLog(agent.logger.all()));
    const unsubEsc = agent.escalations.subscribe(setEscalations);
    return () => {
      unsubLog();
      unsubEsc();
    };
  }, [agent]);

  const handleSend = useCallback(
    async (text: string) => {
      const validation = agent.validate(text);
      const userMessage: ChatMessage = {
        id: `u-${Date.now()}`,
        role: 'user',
        content: text,
        timestamp: Date.now(),
        simulated: false,
        source: 'knowledge-base',
      };
      setMessages((prev) => [...prev, userMessage]);

      if (!validation.valid) {
        const errMsg: ChatMessage = {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: validation.error ?? 'Invalid input.',
          timestamp: Date.now(),
          simulated: false,
          source: 'validation',
        };
        agent.logger.warn('Input rejected', validation.error);
        setMessages((prev) => [...prev, errMsg]);
        return;
      }

      setBusy(true);
      // Simulate retrieval + generation latency for a realistic feel.
      await new Promise((r) => setTimeout(r, 500));
      const result = await agent.ask(text);
      setMessages((prev) => [...prev, result.message]);
      if (result.escalation) {
        setEscalated(true);
        setTab('escalation');
      }
      setBusy(false);
    },
    [agent],
  );

  const handleEscalate = useCallback(() => {
    setTab('escalation');
    setMobilePanelOpen(true);
  }, []);

  const handleUpdateStatus = useCallback(
    (id: string, status: EscalationStatus) => {
      agent.escalations.updateStatus(id, status);
    },
    [agent],
  );

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <Header onTogglePanel={() => setMobilePanelOpen((v) => !v)} />

      <main className="flex-1 flex flex-col lg:flex-row gap-4 p-4 max-w-[1600px] mx-auto w-full">
        <section className="flex-1 flex flex-col rounded-2xl overflow-hidden shadow-sm border border-slate-200 bg-white min-h-[600px] lg:min-h-0">
          <ChatPanel
            messages={messages}
            onSend={handleSend}
            busy={busy}
            onEscalate={handleEscalate}
            escalated={escalated}
          />
        </section>

        <aside className="w-full lg:w-[420px] xl:w-[460px] flex flex-col rounded-2xl overflow-hidden shadow-sm border border-slate-200 bg-white min-h-[400px]">
          <TabBar tab={tab} setTab={setTab} escalationCount={escalations.filter((r) => r.status === 'open').length} />
          <div className="flex-1 min-h-0">
            {tab === 'knowledge' && <KnowledgeBasePanel />}
            {tab === 'activity' && <ActivityLogPanel entries={log} />}
            {tab === 'escalation' && <EscalationPanel records={escalations} onUpdateStatus={handleUpdateStatus} />}
          </div>
        </aside>
      </main>

      <Footer />
    </div>
  );
}

function Header({ onTogglePanel }: { onTogglePanel: () => void }) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
      <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-sky-500 to-cyan-600 flex items-center justify-center text-white">
            <Sparkles size={18} />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-slate-900 leading-tight">AI Customer Support Agent</h1>
            <p className="text-[11px] text-slate-500">RAG · Demo mode · by Habibah Lawal</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onTogglePanel}
            className="lg:hidden text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600"
          >
            Panels
          </button>
          <a
            href="https://github.com/habibahtaiye-dev/ai-customer-support-agent"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
          >
            <Github size={14} />
            <span className="hidden sm:inline">Source</span>
          </a>
        </div>
      </div>
    </header>
  );
}

function TabBar({
  tab,
  setTab,
  escalationCount,
}: {
  tab: Tab;
  setTab: (t: Tab) => void;
  escalationCount: number;
}) {
  const tabs: { id: Tab; label: string; icon: typeof BookOpen }[] = [
    { id: 'knowledge', label: 'Knowledge', icon: BookOpen },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'escalation', label: 'Escalation', icon: Headphones },
  ];
  return (
    <div className="flex border-b border-slate-200 bg-white">
      {tabs.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => setTab(id)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition relative ${
            tab === id ? 'text-sky-700' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Icon size={14} />
          {label}
          {id === 'escalation' && escalationCount > 0 && (
            <span className="ml-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 font-semibold">
              {escalationCount}
            </span>
          )}
          {tab === id && <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-sky-500 rounded-full" />}
        </button>
      ))}
    </div>
  );
}

function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 py-3">
      <div className="max-w-[1600px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className="text-[11px] text-slate-400">
          Demo mode · No login or API key required · Simulated responses are clearly labeled.
        </p>
        <p className="text-[11px] text-slate-400">
          Habibah Lawal · AI Automation Specialist
        </p>
      </div>
    </footer>
  );
}
