import type { OutgoingMessage, ExchangeAction, ExchangeSummary } from '../types/routing';

const MAX_HOPS = 10;

export class RoutingEngine {
  private seen = new Set<string>();
  private outbox = new Map<string, OutgoingMessage>();

  get seenCount(): number {
    return this.seen.size;
  }

  get pendingCount(): number {
    return this.outbox.size;
  }

  hasSeen(messageId: string): boolean {
    return this.seen.has(messageId);
  }

  markSeen(messageId: string): void {
    this.seen.add(messageId);
  }

  enqueue(message: OutgoingMessage): void {
    if (this.seen.has(message.id)) return;
    this.outbox.set(message.id, message);
    this.seen.add(message.id);
  }

  getOutgoingForPeer(peerSeen: Set<string>): ExchangeAction[] {
    const actions: ExchangeAction[] = [];

    for (const [, msg] of this.outbox) {
      if (peerSeen.has(msg.id)) continue;
      actions.push({
        messageId: msg.id,
        payload: msg.payload,
        recipientId: msg.recipientId,
        hopCount: msg.hopCount,
      });
    }

    return actions;
  }

  receiveFromPeer(
    actions: ExchangeAction[],
    ownNodeId: string
  ): { received: ExchangeAction[]; forward: ExchangeAction[] } {
    const received: ExchangeAction[] = [];
    const forward: ExchangeAction[] = [];

    for (const action of actions) {
      if (this.seen.has(action.messageId)) continue;
      this.seen.add(action.messageId);

      if (action.recipientId === ownNodeId) {
        received.push(action);
        continue;
      }

      if (action.hopCount >= MAX_HOPS) continue;

      this.outbox.set(action.messageId, {
        id: action.messageId,
        recipientId: action.recipientId,
        payload: action.payload,
        createdAt: Date.now(),
        hopCount: action.hopCount + 1,
      });

      forward.push({
        ...action,
        hopCount: action.hopCount + 1,
      });
    }

    return { received, forward };
  }

  confirmDelivered(messageId: string): void {
    this.outbox.delete(messageId);
  }

  getSummary(nodeId: string): ExchangeSummary {
    return {
      nodeId,
      seenMessageIds: Array.from(this.seen),
    };
  }

  clear(): void {
    this.seen.clear();
    this.outbox.clear();
  }
}
