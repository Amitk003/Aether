import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AetherDB } from './db';
import type { Node, Message, Handshake } from '../types/db';

describe('AetherDB', () => {
  let db: AetherDB;

  beforeEach(() => {
    db = new AetherDB();
  });

  afterEach(async () => {
    await db.delete();
  });

  describe('nodes', () => {
    it('should save and retrieve a node', async () => {
      const node: Node = {
        id: 'node-1',
        publicKey: {} as JsonWebKey,
        trustStatus: 'trusted',
        deliveryPredictability: {},
        lastSeen: Date.now(),
      };

      await db.upsertNode(node);
      const result = await db.getNode('node-1');
      expect(result).toBeDefined();
      expect(result!.id).toBe('node-1');
      expect(result!.trustStatus).toBe('trusted');
    });

    it('should update an existing node', async () => {
      const node: Node = {
        id: 'node-1',
        publicKey: {} as JsonWebKey,
        trustStatus: 'untrusted',
        deliveryPredictability: {},
        lastSeen: Date.now(),
      };

      await db.upsertNode(node);
      node.trustStatus = 'trusted';
      await db.upsertNode(node);

      const result = await db.getNode('node-1');
      expect(result!.trustStatus).toBe('trusted');
    });

    it('should return all nodes', async () => {
      const node1: Node = { id: 'n1', publicKey: {} as JsonWebKey, trustStatus: 'trusted', deliveryPredictability: {}, lastSeen: 1 };
      const node2: Node = { id: 'n2', publicKey: {} as JsonWebKey, trustStatus: 'untrusted', deliveryPredictability: {}, lastSeen: 2 };

      await db.upsertNode(node1);
      await db.upsertNode(node2);

      const all = await db.getAllNodes();
      expect(all).toHaveLength(2);
    });
  });

  describe('messages', () => {
    it('should save and retrieve a message', async () => {
      const msg: Message = {
        id: 'msg-1',
        senderId: 'alice',
        recipientId: 'bob',
        payload: new ArrayBuffer(10),
        ttl: Date.now() + 3600000,
        status: 'pending',
        createdAt: Date.now(),
        iv: new Uint8Array(12),
      };

      await db.saveMessage(msg);
      const result = await db.getMessage('msg-1');
      expect(result).toBeDefined();
      expect(result!.senderId).toBe('alice');
      expect(result!.recipientId).toBe('bob');
    });

    it('should return only pending messages that have not expired', async () => {
      const valid: Message = {
        id: 'valid',
        senderId: 'alice', recipientId: 'bob',
        payload: new ArrayBuffer(10),
        ttl: Date.now() + 3600000,
        status: 'pending',
        createdAt: Date.now(),
        iv: new Uint8Array(12),
      };
      const expired: Message = {
        id: 'expired',
        senderId: 'alice', recipientId: 'bob',
        payload: new ArrayBuffer(10),
        ttl: Date.now() - 1000,
        status: 'pending',
        createdAt: Date.now(),
        iv: new Uint8Array(12),
      };
      const delivered: Message = {
        id: 'delivered',
        senderId: 'alice', recipientId: 'bob',
        payload: new ArrayBuffer(10),
        ttl: Date.now() + 3600000,
        status: 'delivered',
        createdAt: Date.now(),
        iv: new Uint8Array(12),
      };

      await db.saveMessage(valid);
      await db.saveMessage(expired);
      await db.saveMessage(delivered);

      const pending = await db.getPendingMessages();
      expect(pending).toHaveLength(1);
      expect(pending[0].id).toBe('valid');
    });

    it('should mark a message as delivered', async () => {
      const msg: Message = {
        id: 'msg-1',
        senderId: 'alice', recipientId: 'bob',
        payload: new ArrayBuffer(10),
        ttl: Date.now() + 3600000,
        status: 'pending',
        createdAt: Date.now(),
        iv: new Uint8Array(12),
      };

      await db.saveMessage(msg);
      await db.markDelivered('msg-1');

      const result = await db.getMessage('msg-1');
      expect(result!.status).toBe('delivered');
    });

    it('should delete expired messages', async () => {
      const expired: Message = {
        id: 'expired',
        senderId: 'alice', recipientId: 'bob',
        payload: new ArrayBuffer(10),
        ttl: Date.now() - 1000,
        status: 'pending',
        createdAt: Date.now(),
        iv: new Uint8Array(12),
      };

      await db.saveMessage(expired);
      const deleted = await db.deleteExpiredMessages();
      expect(deleted).toBe(1);

      const result = await db.getMessage('expired');
      expect(result).toBeUndefined();
    });
  });

  describe('handshakes', () => {
    it('should record and retrieve handshakes', async () => {
      const hs: Handshake = {
        id: 'hs-1',
        nodeId: 'node-1',
        timestamp: Date.now(),
        messagesExchanged: 3,
      };

      await db.recordHandshake(hs);
      const result = await db.getRecentHandshakes(10);
      expect(result).toHaveLength(1);
      expect(result[0].nodeId).toBe('node-1');
    });

    it('should return handshakes for a specific node ordered by recency', async () => {
      const hs1: Handshake = { id: 'hs-1', nodeId: 'node-1', timestamp: 100, messagesExchanged: 1 };
      const hs2: Handshake = { id: 'hs-2', nodeId: 'node-1', timestamp: 200, messagesExchanged: 2 };
      const hs3: Handshake = { id: 'hs-3', nodeId: 'node-2', timestamp: 300, messagesExchanged: 3 };

      await db.recordHandshake(hs1);
      await db.recordHandshake(hs2);
      await db.recordHandshake(hs3);

      const results = await db.getHandshakesWithNode('node-1');
      expect(results).toHaveLength(2);
      expect(results[0].id).toBe('hs-2');
    });
  });
});
