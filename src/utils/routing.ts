import type { OutgoingMessage, ExchangeAction, ExchangeSummary } from '../types/routing';

const MAX_HOPS = 10;

const P_ENC_MAX = 0.75;
const P_ENC_INIT = 0.5;
const GAMMA = 0.98;
const BETA = 0.25;

function now(): number {
  return Date.now();
}

export class RoutingEngine {
  private seen = new Set<string>();
  private outbox = new Map<string, OutgoingMessage>();
  private predictability = new Map<string, number>();
  private lastAged = now();

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

  getPredictabilityFor(peerId: string): number {
    return this.predictability.get(peerId) ?? 0;
  }

  getAllPredictability(): Record<string, number> {
    const result: Record<string, number> = {};
    for (const [k, v] of this.predictability) {
      result[k] = v;
    }
    return result;
  }

  recordEncounter(peerId: string): void {
    this.ageAll();
    const old = this.predictability.get(peerId) ?? 0;
    const updated = old + (1 - old) * P_ENC_INIT;
    this.predictability.set(peerId, Math.min(updated, P_ENC_MAX));
  }

  applyTransitivity(
    peerId: string,
    peerPredictability: Record<string, number>
  ): void {
    this.ageAll();
    const pAB = this.predictability.get(peerId) ?? 0;
    if (pAB === 0) return;

    for (const [otherId, pBC] of Object.entries(peerPredictability)) {
      if (otherId === peerId) continue;
      const old = this.predictability.get(otherId) ?? 0;
      const updated = old + (1 - old) * pAB * pBC * BETA;
      if (updated > old) {
        this.predictability.set(otherId, Math.min(updated, P_ENC_MAX));
      }
    }
  }

  private ageAll(): void {
    const nowMs = now();
    const elapsed = nowMs - this.lastAged;
    if (elapsed <= 0) return;
    const k = elapsed / 60000;
    const decay = Math.pow(GAMMA, k);
    for (const [id, val] of this.predictability) {
      const aged = val * decay;
      if (aged < 0.01) {
        this.predictability.delete(id);
      } else {
        this.predictability.set(id, aged);
      }
    }
    this.lastAged = nowMs;
  }

  getOutgoingForPeer(
    peerSeen: Set<string>,
    peerId?: string,
    peerPredictability: Record<string, number> = {}
  ): ExchangeAction[] {
    const actions: ExchangeAction[] = [];

    const scored: { action: ExchangeAction; priority: number }[] = [];

    for (const [, msg] of this.outbox) {
      if (peerSeen.has(msg.id)) continue;

      const isRecipient = peerId ? msg.recipientId === peerId : false;
      const pUs = this.predictability.get(msg.recipientId) ?? 0;
      const pPeer = peerPredictability[msg.recipientId] ?? 0;

      // PRoPHET heuristic: Only forward if the peer is the recipient, or has higher predictability.
      // If peerId is not specified, default to epidemic flooding.
      if (!peerId || isRecipient || pPeer > pUs) {
        scored.push({
          action: {
            messageId: msg.id,
            payload: msg.payload,
            recipientId: msg.recipientId,
            hopCount: msg.hopCount,
          },
          priority: isRecipient ? 999 : (peerId ? pPeer : pUs),
        });
      }
    }

    scored.sort((a, b) => b.priority - a.priority);
    for (const s of scored) {
      actions.push(s.action);
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
      predictability: this.getAllPredictability(),
    };
  }

  clear(): void {
    this.seen.clear();
    this.outbox.clear();
    this.predictability.clear();
    this.lastAged = now();
  }
}
