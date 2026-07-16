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

  it('receives a message for self and returns it as received without forwarding', () => {
    const r = new RoutingEngine();
    const actions = [
      { messageId: 'msg-1', payload: new Uint8Array([1]), recipientId: 'node-a', hopCount: 0 },
    ];
    const { received, forward } = r.receiveFromPeer(actions, 'node-a');
    expect(received).toHaveLength(1);
    expect(received[0].messageId).toBe('msg-1');
    expect(forward).toHaveLength(0);
    expect(r.pendingCount).toBe(0);
    expect(r.hasSeen('msg-1')).toBe(true);
  });

  it('forwards a message for another node with incremented hop', () => {
    const r = new RoutingEngine();
    const actions = [
      { messageId: 'msg-1', payload: new Uint8Array([1]), recipientId: 'node-c', hopCount: 1 },
    ];
    const { received, forward } = r.receiveFromPeer(actions, 'node-a');
    expect(received).toHaveLength(0);
    expect(forward).toHaveLength(1);
    expect(forward[0].hopCount).toBe(2);
    expect(r.pendingCount).toBe(1);
  });

  it('stops forwarding at max hop limit', () => {
    const r = new RoutingEngine();
    const actions = [
      { messageId: 'msg-1', payload: new Uint8Array([1]), recipientId: 'node-c', hopCount: 10 },
    ];
    const { received, forward } = r.receiveFromPeer(actions, 'node-a');
    expect(received).toHaveLength(0);
    expect(forward).toHaveLength(0);
    expect(r.pendingCount).toBe(0);
  });

  it('rejects duplicate messages from peers', () => {
    const r = new RoutingEngine();
    const actions = [
      { messageId: 'msg-1', payload: new Uint8Array([1]), recipientId: 'node-c', hopCount: 0 },
    ];
    const res1 = r.receiveFromPeer(actions, 'node-a');
    const res2 = r.receiveFromPeer(actions, 'node-a');
    expect(res1.forward).toHaveLength(1);
    expect(res2.forward).toHaveLength(0);
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

  it('performs anti-entropy sync flow correctly without locking out payload delivery', () => {
    const nodeA = new RoutingEngine();
    const nodeB = new RoutingEngine();

    // Node A has pending outgoing messages
    nodeA.enqueue(makeMsg({ id: 'msg-1', recipientId: 'node-b' }));
    nodeA.enqueue(makeMsg({ id: 'msg-2', recipientId: 'node-c' }));

    // Node B exports its summary of seen messages (initially empty)
    const bSummary = nodeB.getSummary('node-b');

    // Node A receives B's summary and filters out what to transmit to B
    const peerSeen = new Set(bSummary.seenMessageIds);
    const actions = nodeA.getOutgoingForPeer(peerSeen);
    expect(actions).toHaveLength(2);

    // Node B receives the actions payload and processes them
    const { received, forward } = nodeB.receiveFromPeer(actions, 'node-b');
    
    // msg-1 is received for node-b (inbox), msg-2 is forwarded (added to outbox)
    expect(received).toHaveLength(1);
    expect(received[0].messageId).toBe('msg-1');
    expect(forward).toHaveLength(1);
    expect(forward[0].messageId).toBe('msg-2');
    
    expect(nodeB.hasSeen('msg-1')).toBe(true);
    expect(nodeB.hasSeen('msg-2')).toBe(true);
    expect(nodeB.pendingCount).toBe(1); // msg-2 is pending in outbox
  });

  it('clears all state', () => {
    const r = new RoutingEngine();
    r.enqueue(makeMsg({ id: 'msg-1' }));
    r.clear();
    expect(r.pendingCount).toBe(0);
    expect(r.seenCount).toBe(0);
  });
});
