import { encodeChunk, splitPayload } from './chunker';
import { DEFAULT_OPTICAL_CONFIG, type DataChunk, type OpticalConfig } from '../types/optical';

export type QrFrameCallback = (qrData: string, chunk: DataChunk) => void;
export type TransferCompleteCallback = () => void;

export class OpticalTransmitter {
  private isActive = false;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private currentIndex = 0;
  private chunks: DataChunk[] = [];
  private onFrame: QrFrameCallback | null = null;
  private onComplete: TransferCompleteCallback | null = null;

  setOnFrame(callback: QrFrameCallback): void {
    this.onFrame = callback;
  }

  setOnComplete(callback: TransferCompleteCallback): void {
    this.onComplete = callback;
  }

  start(
    payload: Uint8Array,
    config: OpticalConfig = DEFAULT_OPTICAL_CONFIG
  ): void {
    if (this.isActive) return;
    this.isActive = true;
    this.currentIndex = 0;
    this.chunks = splitPayload(payload, config.chunkSize);

    this.emitFrame();

    this.intervalId = setInterval(() => {
      this.currentIndex = (this.currentIndex + 1) % this.chunks.length;
      this.emitFrame();
    }, config.frameInterval);
  }

  stop(): void {
    this.isActive = false;
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.chunks = [];
    this.currentIndex = 0;
  }

  private emitFrame(): void {
    if (this.chunks.length === 0) return;
    const chunk = this.chunks[this.currentIndex];
    const encoded = encodeChunk(chunk);
    this.onFrame?.(encoded, chunk);
  }

  complete(): void {
    this.stop();
    this.onComplete?.();
  }
}
