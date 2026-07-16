import { OpticalTransmitter, type QrFrameCallback, type TransferCompleteCallback } from './optical-tx';
import { OpticalReceiver, type ChunkReceivedCallback, type TransferFinishedCallback } from './optical-rx';
import { DEFAULT_OPTICAL_CONFIG, type OpticalConfig, type TransferRole } from '../types/optical';

export { OpticalTransmitter, OpticalReceiver };
export type { QrFrameCallback, TransferCompleteCallback, ChunkReceivedCallback, TransferFinishedCallback };

export class OpticalService {
  private tx: OpticalTransmitter;
  private rx: OpticalReceiver;
  private role: TransferRole = 'idle';

  constructor() {
    this.tx = new OpticalTransmitter();
    this.rx = new OpticalReceiver();
  }

  getRole(): TransferRole {
    return this.role;
  }

  setOnFrame(callback: QrFrameCallback): void {
    this.tx.setOnFrame(callback);
  }

  setOnTransferComplete(callback: TransferCompleteCallback): void {
    this.tx.setOnComplete(callback);
  }

  setOnChunk(callback: ChunkReceivedCallback): void {
    this.rx.setOnChunk(callback);
  }

  setOnReceiveComplete(callback: TransferFinishedCallback): void {
    this.rx.setOnComplete(callback);
  }

  startSending(
    payload: Uint8Array,
    config: OpticalConfig = DEFAULT_OPTICAL_CONFIG
  ): void {
    this.tx.start(payload, config);
    this.role = 'sending';
  }

  startReceiving(): void {
    this.rx.start();
    this.role = 'receiving';
  }

  submitFrame(encoded: string): void {
    this.rx.submitFrame(encoded);
  }

  stopAll(): void {
    this.tx.stop();
    this.rx.stop();
    this.role = 'idle';
  }

  destroy(): void {
    this.stopAll();
  }
}
