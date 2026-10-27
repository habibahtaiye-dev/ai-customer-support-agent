import type { EscalationRecord, EscalationStatus } from './types';

type Listener = (records: EscalationRecord[]) => void;

/**
 * Tracks human-escalation handoffs in memory. A real deployment would persist
 * these to a queue or database; the shape here keeps that swap straightforward.
 */
export class EscalationQueue {
  private records: EscalationRecord[] = [];
  private listeners = new Set<Listener>();

  enqueue(record: EscalationRecord): void {
    this.records = [record, ...this.records];
    this.emit();
  }

  updateStatus(id: string, status: EscalationStatus): void {
    this.records = this.records.map((r) =>
      r.id === id
        ? { ...r, status, resolvedAt: status === 'resolved' ? Date.now() : r.resolvedAt }
        : r,
    );
    this.emit();
  }

  all(): EscalationRecord[] {
    return [...this.records];
  }

  open(): EscalationRecord[] {
    return this.records.filter((r) => r.status !== 'resolved');
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(): void {
    const snapshot = this.all();
    this.listeners.forEach((l) => l(snapshot));
  }
}
