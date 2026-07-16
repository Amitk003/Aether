import { AetherDB } from './db';
import { AcousticService } from './acoustic';
import { OpticalService } from './optical';
import { RoutingEngine } from './routing';
import { generateKeyPair, exportPublicKey, importPublicKey, deriveSharedSecret, encryptMessage, decryptMessage } from './crypto';
import type { AppState, AppPhase, DiagnosticsData } from '../types/engine';

export type StateListener = (state: AppState) => void;
export type PeerListener = (peerId: string) => void;
export type MessageListener = (msg: { from: string; text: string; timestamp: number }) => void;

export class AetherEngine {
  readonly db: AetherDB;
  readonly acoustic: AcousticService;
  readonly optical: OpticalService;
  readonly routing: RoutingEngine;

  private nodeId = '';
  private keyPair: CryptoKeyPair | null = null;
  private phase: AppPhase = 'idle';
  private listeners: StateListener[] = [];
  private peerListeners: PeerListener[] = [];
  private messageListeners: MessageListener[] = [];

  private stats = {
    totalMessagesSent: 0,
    totalMessagesReceived: 0,
    peersEncountered: 0,
  };

  constructor() {
    this.db = new AetherDB();
    this.acoustic = new AcousticService();
    this.optical = new OpticalService();
    this.routing = new RoutingEngine();
  }

  onStateChange(listener: StateListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  onPeerDiscovered(listener: PeerListener): () => void {
    this.peerListeners.push(listener);
    return () => {
      this.peerListeners = this.peerListeners.filter((l) => l !== listener);
    };
  }

  onMessageReceived(listener: MessageListener): () => void {
    this.messageListeners.push(listener);
    return () => {
      this.messageListeners = this.messageListeners.filter((l) => l !== listener);
    };
  }

  async initialize(nodeId?: string): Promise<void> {
    this.nodeId = nodeId ?? `node-${Date.now().toString(36)}`;
    this.keyPair = await generateKeyPair();

    this.acoustic.setNodeId(this.nodeId);

    this.acoustic.setOnBeacon((msg) => {
      this.handlePeerDiscovered(msg.nodeId);
    });

    this.db.upsertNode({
      id: this.nodeId,
      publicKey: await exportPublicKey(this.keyPair.publicKey),
      trustStatus: 'trusted',
      deliveryPredictability: {},
      lastSeen: Date.now(),
    });

    this.notifyState();
  }

  async startDiscovery(): Promise<void> {
    this.setPhase('discovering');

    await this.acoustic.startListening();

    const hasMic = await this.checkMicPermission();
    if (hasMic) {
      await this.acoustic.startBeaconing();
    }
  }

  stopDiscovery(): void {
    this.acoustic.stopAll();
    this.optical.stopAll();
    this.setPhase('idle');
  }

  async sendMessage(peerId: string, text: string): Promise<string> {
    const msgId = `msg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const payload = new TextEncoder().encode(text);

    const plaintext = payload.buffer;

    const peerNode = await this.db.getNode(peerId);
    if (!peerNode) throw new Error(`Unknown peer: ${peerId}`);

    const peerKey = await importPublicKey(peerNode.publicKey);
    const sharedSecret = await deriveSharedSecret(this.keyPair!.privateKey, peerKey);

    const encrypted = await encryptMessage(sharedSecret, plaintext);

    const combined = new Uint8Array(encrypted.iv.length + encrypted.ciphertext.byteLength);
    combined.set(encrypted.iv);
    combined.set(new Uint8Array(encrypted.ciphertext), encrypted.iv.length);

    this.routing.enqueue({
      id: msgId,
      recipientId: peerId,
      payload: combined,
      createdAt: Date.now(),
      hopCount: 0,
    });

    this.stats.totalMessagesSent++;

    await this.db.saveMessage({
      id: msgId,
      senderId: this.nodeId,
      recipientId: peerId,
      payload: combined.buffer,
      ttl: Date.now() + 86400000,
      status: 'pending',
      createdAt: Date.now(),
      iv: encrypted.iv,
    });

    this.notifyState();
    return msgId;
  }

  async receiveMessage(
    senderId: string,
    encryptedPayload: Uint8Array,
    iv: Uint8Array
  ): Promise<string | null> {
    try {
      const senderNode = await this.db.getNode(senderId);
      if (!senderNode) return null;

      const senderKey = await importPublicKey(senderNode.publicKey);
      const sharedSecret = await deriveSharedSecret(this.keyPair!.privateKey, senderKey);

      const ciphertext = encryptedPayload.slice().buffer;

      const decrypted = await decryptMessage(sharedSecret, {
        iv,
        ciphertext,
      });

      const text = new TextDecoder().decode(decrypted);

      const msgId = `msg-${Date.now().toString(36)}`;

      await this.db.saveMessage({
        id: msgId,
        senderId,
        recipientId: this.nodeId,
        payload: decrypted,
        ttl: Date.now() + 86400000,
        status: 'delivered',
        createdAt: Date.now(),
        iv,
      });

      this.stats.totalMessagesReceived++;

      this.messageListeners.forEach((l) =>
        l({ from: senderId, text, timestamp: Date.now() })
      );

      this.notifyState();
      return text;
    } catch {
      return null;
    }
  }

  async syncWithPeer(peerId: string): Promise<void> {
    this.setPhase('transferring');

    this.setPhase('resolving');

    this.routing.markSeen(peerId);
    this.stats.peersEncountered++;

    await this.db.upsertNode({
      id: peerId,
      publicKey: {} as JsonWebKey,
      trustStatus: 'untrusted',
      deliveryPredictability: {},
      lastSeen: Date.now(),
    });

    this.setPhase('idle');
    this.notifyState();
  }

  getState(): AppState {
    return {
      phase: this.phase,
      acousticState: this.acoustic.getState(),
      pendingMessages: this.routing.pendingCount,
      knownPeers: [],
      lastSync: null,
      diagnostics: this.getDiagnostics(),
    };
  }

  getNodeId(): string {
    return this.nodeId;
  }

  getPublicKey(): JsonWebKey | null {
    if (!this.keyPair) return null;
    return this.keyPair.publicKey as unknown as JsonWebKey;
  }

  destroy(): void {
    this.acoustic.destroy();
    this.optical.destroy();
    this.listeners = [];
    this.peerListeners = [];
    this.messageListeners = [];
  }

  private setPhase(phase: AppPhase): void {
    this.phase = phase;
    this.notifyState();
  }

  private notifyState(): void {
    const state = this.getState();
    this.listeners.forEach((l) => l(state));
  }

  private async handlePeerDiscovered(peerId: string): Promise<void> {
    this.stats.peersEncountered++;
    this.peerListeners.forEach((l) => l(peerId));
    this.notifyState();
  }

  private async checkMicPermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      return true;
    } catch {
      return false;
    }
  }

  private getDiagnostics(): DiagnosticsData {
    return {
      dbReady: true,
      cryptoReady: this.keyPair !== null,
      micPermission: false,
      cameraPermission: false,
      totalMessagesSent: this.stats.totalMessagesSent,
      totalMessagesReceived: this.stats.totalMessagesReceived,
      peersEncountered: this.stats.peersEncountered,
    };
  }
}
