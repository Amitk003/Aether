export interface Node {
  id: string;
  publicKey: JsonWebKey;
  trustStatus: 'trusted' | 'untrusted' | 'blocked';
  deliveryPredictability: Record<string, number>;
  lastSeen: number;
}

export interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  payload: ArrayBuffer;
  ttl: number;
  status: 'pending' | 'delivered' | 'expired';
  createdAt: number;
  iv: Uint8Array;
}

export interface Handshake {
  id: string;
  nodeId: string;
  timestamp: number;
  messagesExchanged: number;
}
