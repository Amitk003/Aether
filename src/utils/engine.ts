import { AetherDB } from './db';
import { AcousticService } from './acoustic';
import { OpticalService } from './optical';
import { RoutingEngine } from './routing';
import { generateKeyPair, exportPublicKey, importPublicKey, deriveSharedSecret, encryptMessage, decryptMessage, computeFingerprint } from './crypto';
import type { AppState, AppPhase, DiagnosticsData } from '../types/engine';
import type { ExchangeAction } from '../types/routing';
import type { Node } from '../types/db';

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

  private knownPeers = new Set<string>();
  private micPermission = false;
  private cameraPermission = false;

  private stats = {
    totalMessagesSent: 0,
    totalMessagesReceived: 0,
    peersEncountered: 0,
    chunksSent: 0,
    chunksReceived: 0,
    transfersCompleted: 0,
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
    this.nodeId = nodeId ?? 'node-' + Date.now().toString(36);
    this.keyPair = await generateKeyPair();

    this.acoustic.setNodeId(this.nodeId);

    this.acoustic.setOnBeacon((msg) => {
      this.handlePeerDiscovered(msg.nodeId);
    });

    await this.db.upsertNode({
      id: this.nodeId,
      publicKey: await exportPublicKey(this.keyPair.publicKey),
      trustStatus: 'trusted',
      deliveryPredictability: this.routing.getAllPredictability(),
      lastSeen: Date.now(),
    });

    this.notifyState();
  }

  async startDiscovery(): Promise<void> {
    this.setPhase('discovering');

    try {
      await this.acoustic.startListening();
      this.micPermission = true;
      await this.acoustic.startBeaconing();
    } catch (err) {
      console.warn('Microphone permission denied or device not supported:', err);
      this.micPermission = false;
    }
  }

  stopDiscovery(): void {
    this.acoustic.stopAll();
    this.optical.stopAll();
    this.setPhase('idle');
  }

  setCameraPermission(granted: boolean): void {
    this.cameraPermission = granted;
    this.notifyState();
  }

  async sendMessage(peerId: string, text: string): Promise<string> {
    const msgId = 'msg-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
    const payload = new TextEncoder().encode(text);

    const plaintext = payload.buffer;

    const peerNode = await this.db.getNode(peerId);
    if (!peerNode) throw new Error('Unknown peer: ' + peerId);

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

      const msgId = 'msg-' + Date.now().toString(36);

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

  async getHandshakePayload(): Promise<string> {
    const pubJwk = await exportPublicKey(this.keyPair!.publicKey);
    const summary = this.routing.getSummary(this.nodeId);
    return JSON.stringify({
      nodeId: this.nodeId,
      publicKey: pubJwk,
      seenMessageIds: summary.seenMessageIds,
      predictability: summary.predictability,
    });
  }

  async registerPeerHandshake(
    scannedText: string
  ): Promise<{ nodeId: string; seenMessageIds: string[]; predictability?: Record<string, number> }> {
    const data = JSON.parse(scannedText);
    if (!data.nodeId || !data.publicKey || !data.seenMessageIds) {
      throw new Error('Invalid handshake QR payload');
    }

    this.stats.peersEncountered++;

    this.routing.recordEncounter(data.nodeId);
    if (data.predictability) {
      this.routing.applyTransitivity(data.nodeId, data.predictability);
    }

    await this.db.upsertNode({
      id: data.nodeId,
      publicKey: data.publicKey,
      trustStatus: 'trusted',
      deliveryPredictability: data.predictability ?? {},
      lastSeen: Date.now(),
    });

    this.peerListeners.forEach((l) => l(data.nodeId));
    this.notifyState();

    return {
      nodeId: data.nodeId,
      seenMessageIds: data.seenMessageIds,
      predictability: data.predictability,
    };
  }

  async processIncomingPayload(peerId: string, payloadBytes: Uint8Array): Promise<void> {
    const payloadText = new TextDecoder().decode(payloadBytes);
    let rawActions: any[];
    try {
      rawActions = JSON.parse(payloadText);
      if (!Array.isArray(rawActions)) {
        throw new Error('Payload is not an array');
      }
    } catch (err: any) {
      throw new Error('Failed to parse incoming payload: ' + err.message);
    }

    // Convert deserialized number[] payloads back to Uint8Array
    const actions: ExchangeAction[] = rawActions.map((a) => ({
      messageId: a.messageId,
      recipientId: a.recipientId,
      hopCount: a.hopCount,
      payload: new Uint8Array(a.payload),
    }));

    const { received, forward } = this.routing.receiveFromPeer(actions, this.nodeId);

    for (const action of received) {
      const rawPayload = new Uint8Array(action.payload);
      const iv = rawPayload.subarray(0, 12);
      const encryptedPayload = rawPayload.subarray(12);
      await this.receiveMessage(peerId, encryptedPayload, iv);
    }

    for (const action of forward) {
      const rawPayload = new Uint8Array(action.payload);
      const iv = rawPayload.subarray(0, 12);
      await this.db.saveMessage({
        id: action.messageId,
        senderId: peerId,
        recipientId: action.recipientId,
        payload: rawPayload.buffer,
        ttl: Date.now() + 86400000,
        status: 'pending',
        createdAt: Date.now(),
        iv,
      });
    }

    this.notifyState();
  }

  generateOutgoingPayload(
    peerSeenIds: string[],
    peerId?: string,
    peerPredictability: Record<string, number> = {}
  ): Uint8Array {
    const peerSeen = new Set(peerSeenIds);
    const actions = this.routing.getOutgoingForPeer(peerSeen, peerId, peerPredictability);

    const payloadText = JSON.stringify(actions);
    return new TextEncoder().encode(payloadText);
  }

  setPhase(phase: AppPhase): void {
    this.phase = phase;
    this.notifyState();
  }

  getState(): AppState {
    return {
      phase: this.phase,
      acousticState: this.acoustic.getState(),
      pendingMessages: this.routing.pendingCount,
      knownPeers: Array.from(this.knownPeers),
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

  getSpectrumData(): Float32Array | null {
    return this.acoustic.getFrequencyData();
  }

  trackChunkSent(): void {
    this.stats.chunksSent++;
  }

  trackChunkReceived(): void {
    this.stats.chunksReceived++;
  }

  trackTransferComplete(): void {
    this.stats.transfersCompleted++;
  }

  async getFingerprint(): Promise<string> {
    const pubJwk = await exportPublicKey(this.keyPair!.publicKey);
    return computeFingerprint(pubJwk);
  }

  async getAllPeers(): Promise<Node[]> {
    return this.db.getAllNodes();
  }

  async setTrustStatus(peerId: string, status: 'trusted' | 'untrusted' | 'blocked'): Promise<void> {
    const node = await this.db.getNode(peerId);
    if (!node) throw new Error('Unknown peer: ' + peerId);
    node.trustStatus = status;
    await this.db.upsertNode(node);
    this.notifyState();
  }

  destroy(): void {
    this.acoustic.destroy();
    this.optical.destroy();
    this.listeners = [];
    this.peerListeners = [];
    this.messageListeners = [];
  }

  private notifyState(): void {
    const state = this.getState();
    this.listeners.forEach((l) => l(state));
  }

  private async handlePeerDiscovered(peerId: string): Promise<void> {
    this.stats.peersEncountered++;
    this.knownPeers.add(peerId);
    this.routing.recordEncounter(peerId);
    await this.db.upsertNode({
      id: peerId,
      publicKey: {} as JsonWebKey,
      trustStatus: 'trusted',
      deliveryPredictability: this.routing.getAllPredictability(),
      lastSeen: Date.now(),
    });
    this.peerListeners.forEach((l) => l(peerId));
    this.notifyState();
  }

  private getDiagnostics(): DiagnosticsData {
    return {
      dbReady: true,
      cryptoReady: this.keyPair !== null,
      micPermission: this.micPermission,
      cameraPermission: this.cameraPermission,
      totalMessagesSent: this.stats.totalMessagesSent,
      totalMessagesReceived: this.stats.totalMessagesReceived,
      peersEncountered: this.stats.peersEncountered,
      chunksSent: this.stats.chunksSent,
      chunksReceived: this.stats.chunksReceived,
      transfersCompleted: this.stats.transfersCompleted,
    };
  }
}
