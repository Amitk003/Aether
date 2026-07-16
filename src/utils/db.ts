import Dexie, { type Table } from 'dexie';
import type { Node, Message, Handshake } from '../types/db';

export class AetherDB extends Dexie {
  nodes!: Table<Node, string>;
  messages!: Table<Message, string>;
  handshakes!: Table<Handshake, string>;

  constructor() {
    super('AetherDB');

    this.version(1).stores({
      nodes: 'id, trustStatus, lastSeen',
      messages: 'id, senderId, recipientId, status, ttl, createdAt',
      handshakes: 'id, nodeId, timestamp',
    });
  }

  async upsertNode(node: Node): Promise<string> {
    return this.nodes.put(node);
  }

  async getNode(id: string): Promise<Node | undefined> {
    return this.nodes.get(id);
  }

  async getAllNodes(): Promise<Node[]> {
    return this.nodes.toArray();
  }

  async saveMessage(message: Message): Promise<string> {
    return this.messages.put(message);
  }

  async getMessage(id: string): Promise<Message | undefined> {
    return this.messages.get(id);
  }

  async getPendingMessages(): Promise<Message[]> {
    const now = Date.now();
    return this.messages
      .where('status')
      .equals('pending')
      .and((m) => m.ttl > now)
      .toArray();
  }

  async getExpiredMessages(): Promise<Message[]> {
    const now = Date.now();
    return this.messages
      .where('ttl')
      .belowOrEqual(now)
      .and((m) => m.status === 'pending')
      .toArray();
  }

  async markDelivered(messageId: string): Promise<void> {
    await this.messages.update(messageId, { status: 'delivered' });
  }

  async deleteExpiredMessages(): Promise<number> {
    const expired = await this.getExpiredMessages();
    const ids = expired.map((m) => m.id);
    await this.messages.bulkDelete(ids);
    return ids.length;
  }

  async recordHandshake(handshake: Handshake): Promise<string> {
    return this.handshakes.put(handshake);
  }

  async getRecentHandshakes(limit = 50): Promise<Handshake[]> {
    return this.handshakes
      .orderBy('timestamp')
      .reverse()
      .limit(limit)
      .toArray();
  }

  async getHandshakesWithNode(nodeId: string): Promise<Handshake[]> {
    return this.handshakes
      .where('nodeId')
      .equals(nodeId)
      .reverse()
      .toArray();
  }
}

export const db = new AetherDB();
