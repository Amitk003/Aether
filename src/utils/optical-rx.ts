import { decodeChunk, reconstructPayload } from './chunker';
import type { DataChunk } from '../types/optical';

export type ChunkReceivedCallback = (
  received: number,
  total: number,
  progress: number
) => void;
export type TransferFinishedCallback = (payload: Uint8Array) => void;

export class OpticalReceiver {
  private isActive = false;
  private totalChunks = 0;
  private received: (Uint8Array | null)[] = [];
  private receivedSet = new Set<number>();
  private dedupCache = new Set<string>();

  private onChunk: ChunkReceivedCallback | null = null;
  private onComplete: TransferFinishedCallback | null = null;

  setOnChunk(callback: ChunkReceivedCallback): void {
    this.onChunk = callback;
  }

  setOnComplete(callback: TransferFinishedCallback): void {
    this.onComplete = callback;
  }

  start(): void {
    if (this.isActive) return;
    this.isActive = true;
    this.reset();
  }

  stop(): void {
    this.isActive = false;
    this.reset();
  }

  private reset(): void {
    this.totalChunks = 0;
    this.received = [];
    this.receivedSet.clear();
    this.dedupCache.clear();
  }

  submitFrame(encoded: string): void {
    if (!this.isActive) return;

    if (this.dedupCache.has(encoded)) return;
    this.dedupCache.add(encoded);

    const chunk = decodeChunk(encoded);
    if (!chunk) return;

    if (this.totalChunks === 0) {
      this.totalChunks = chunk.total;
      this.received = new Array(chunk.total).fill(null);
    }

    if (chunk.total !== this.totalChunks) return;

    if (this.receivedSet.has(chunk.index)) return;

    const chunkData = new Uint8Array(chunk.data.length);
    chunkData.set(chunk.data);

    this.received[chunk.index] = chunkData;
    this.receivedSet.add(chunk.index);

    const receivedCount = this.receivedSet.size;
    this.onChunk?.(receivedCount, this.totalChunks, receivedCount / this.totalChunks);

    if (receivedCount === this.totalChunks) {
      this.finalize();
    }
  }

  private finalize(): void {
    const chunks: DataChunk[] = [];
    for (let i = 0; i < this.totalChunks; i++) {
      const data = this.received[i];
      if (!data) return;
      chunks.push({ total: this.totalChunks, index: i, data, checksum: 0 });
    }

    const payload = reconstructPayload(chunks);
    if (payload) {
      this.onComplete?.(payload);
    }

    this.reset();
  }
}
