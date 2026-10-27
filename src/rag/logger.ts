import type { ActivityLogEntry } from './types';

type Listener = (entry: ActivityLogEntry) => void;

/**
 * In-memory activity logger. The pipeline publishes structured events here so
 * the UI's "Activity Log" panel reflects what the agent is doing in real time.
 */
export class ActivityLogger {
  private entries: ActivityLogEntry[] = [];
  private listeners = new Set<Listener>();
  private maxEntries = 200;

  log(level: ActivityLogEntry['level'], event: string, detail?: string): void {
    const entry: ActivityLogEntry = {
      id: this.id(),
      timestamp: Date.now(),
      level,
      event,
      detail,
    };
    this.entries = [entry, ...this.entries].slice(0, this.maxEntries);
    this.listeners.forEach((l) => l(entry));
  }

  info(event: string, detail?: string) {
    this.log('info', event, detail);
  }
  warn(event: string, detail?: string) {
    this.log('warn', event, detail);
  }
  error(event: string, detail?: string) {
    this.log('error', event, detail);
  }

  all(): ActivityLogEntry[] {
    return [...this.entries];
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  clear(): void {
    this.entries = [];
  }

  private id(): string {
    return `log-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }
}
