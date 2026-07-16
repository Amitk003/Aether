import { describe, it, expect } from 'vitest';
import { RoutingEngine } from './routing';
import type { OutgoingMessage } from '../types/routing';

function makeMsg(overrides: Partial<OutgoingMessage> = {}): OutgoingMessage {
  return {
    id: overrides.id ?? 'msg-1',
    recipientId: overrides.recipientId ?? 'node-b',
    payload: overrides.payload ?? new Uint8Array([1, 2, 3]),
    createdAt: overrides.createdAt ?? Date.now(),
    hopCount: overrides.hopCount ?? 0,
  };
}

describe('routing', () => {
  it('enqueues a message and marks it as seen', () => {
    const r = new RoutingEngine();
    r.enqueue(makeMsg({ id: 'msg-1' }));
    expect(r.pendingCount).toBe(1);
    expect(r.seenCount).toBe(1);
    expect(r.hasSeen('msg-1')).toBe(true);
  });

  it('ignores duplicate enqueue', () => {
    const r = new RoutingEngine();
    r.enqueue(makeMsg({ id: 'msg-1' }));
    r.enqueue(makeMsg({ id: 'msg-1' }));
    expect(r.pendingCount).toBe(1);
  });

  it('returns all pending messages for a peer with no seen set', () => {
    const r = new RoutingEngine();
    r.enqueue(makeMsg({ id: 'msg-1' }));
    r.enqueue(makeMsg({ id: 'msg-2' }));
    const msgs = r.getOutgoingForPeer(new Set());
    expect(msgs).toHaveLength(2);
  });

  it('excludes messages the peer has already seen', () => {
    const r = new RoutingEngine();
    r.enqueue(makeMsg({ id: 'msg-1' }));
    r.enqueue(makeMsg({ id: 'msg-2' }));
    const msgs = r.getOutgoingForPeer(new Set(['msg-1']));
    expect(msgs).toHaveLength(1);
    expect(msgs[0].messageId).toBe('msg-2');
  });

  it('receives a message for self and does not forward', () => {
    const r = new RoutingEngine();
    const actions = [
      { messageId: 'msg-1', payload: new Uint8Array([1]), recipientId: 'node-a', hopCount: 0 },
    ];
    const forwarded = r.receiveFromPeer(actions, 'node-a');
    expect(forwarded).toHaveLength(0);
    expect(r.pendingCount).toBe(0);
    expect(r.hasSeen('msg-1')).toBe(true);
  });

  it('forwards a message for another node with incremented hop', () => {
    const r = new RoutingEngine();
    const actions = [
      { messageId: 'msg-1', payload: new Uint8Array([1]), recipientId: 'node-c', hopCount: 1 },
    ];
    const forwarded = r.receiveFromPeer(actions, 'node-a');
    expect(forwarded).toHaveLength(1);
    expect(forwarded[0].hopCount).toBe(2);
    expect(r.pendingCount).toBe(1);
  });

  it('stops forwarding at max hop limit', () => {
    const r = new RoutingEngine();
    const actions = [
      { messageId: 'msg-1', payload: new Uint8Array([1]), recipientId: 'node-c', hopCount: 10 },
    ];
    const forwarded = r.receiveFromPeer(actions, 'node-a');
    expect(forwarded).toHaveLength(0);
    expect(r.pendingCount).toBe(0);
  });

  it('rejects duplicate messages from peers', () => {
    const r = new RoutingEngine();
    const actions = [
      { messageId: 'msg-1', payload: new Uint8Array([1]), recipientId: 'node-c', hopCount: 0 },
    ];
    r.receiveFromPeer(actions, 'node-a');
    r.receiveFromPeer(actions, 'node-a');
    expect(r.pendingCount).toBe(1);
  });

  it('removes message from outbox on delivery confirmation', () => {
    const r = new RoutingEngine();
    r.enqueue(makeMsg({ id: 'msg-1' }));
    expect(r.pendingCount).toBe(1);
    r.confirmDelivered('msg-1');
    expect(r.pendingCount).toBe(0);
    expect(r.hasSeen('msg-1')).toBe(true);
  });

  it('exports and applies summary for anti-entropy sync', () => {
    const r = new RoutingEngine();
    r.enqueue(makeMsg({ id: 'msg-1' }));
    r.enqueue(makeMsg({ id: 'msg-2' }));

    const summary = r.getSummary('node-a');
    expect(summary.nodeId).toBe('node-a');
    expect(summary.seenMessageIds).toContain('msg-1');
    expect(summary.seenMessageIds).toContain('msg-2');

    const r2 = new RoutingEngine();
    r2.applySummary(summary);
    expect(r2.hasSeen('msg-1')).toBe(true);
    expect(r2.hasSeen('msg-2')).toBe(true);
    expect(r2.pendingCount).toBe(0); // summary only syncs seen, not outbox
  });

  it('clears all state', () => {
    const r = new RoutingEngine();
    r.enqueue(makeMsg({ id: 'msg-1' }));
    r.clear();
    expect(r.pendingCount).toBe(0);
    expect(r.seenCount).toBe(0);
  });
});
