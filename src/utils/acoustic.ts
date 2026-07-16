import { AudioTransmitter } from './audio-tx';
import { AudioReceiver, type BeaconCallback } from './audio-rx';
import { DEFAULT_ACOUSTIC_CONFIG, type AcousticState } from '../types/acoustic';

export class AcousticService {
  private tx: AudioTransmitter;
  private rx: AudioReceiver;
  private state: AcousticState = 'idle';
  private beaconInterval: ReturnType<typeof setInterval> | null = null;
  private nodeId = '';

  constructor() {
    this.tx = new AudioTransmitter();
    this.rx = new AudioReceiver();
  }

  getState(): AcousticState {
    return this.state;
  }

  getFrequencyData(): Float32Array | null {
    return this.rx.getFrequencyData();
  }

  setNodeId(id: string): void {
    this.nodeId = id;
  }

  setOnBeacon(callback: BeaconCallback): void {
    // Filter out our own nodeId to prevent a self-discovery feedback loop
    this.rx.setOnBeacon((msg) => {
      if (msg.nodeId !== this.nodeId) {
        callback(msg);
      }
    });
  }

  async startListening(): Promise<void> {
    if (this.state !== 'idle') return;
    try {
      await this.rx.start(DEFAULT_ACOUSTIC_CONFIG);
      this.state = 'listening';
    } catch (err) {
      console.error('Failed to start audio receiver:', err);
      this.state = 'idle';
    }
  }

  async startBeaconing(): Promise<void> {
    if (this.state !== 'idle' && this.state !== 'listening') return;

    try {
      await this.tx.start();
      this.state = 'transmitting';

      const broadcast = async () => {
        if (this.state !== 'transmitting') return;
        await this.tx.transmitId(this.nodeId, DEFAULT_ACOUSTIC_CONFIG);
      };

      await broadcast();
      this.beaconInterval = setInterval(broadcast, 3000);
    } catch (err) {
      console.error('Failed to start audio transmitter:', err);
      this.state = 'listening';
    }
  }

  async startBoth(): Promise<void> {
    try {
      await this.rx.start(DEFAULT_ACOUSTIC_CONFIG);
      await this.tx.start();
      this.state = 'transmitting';

      const broadcast = async () => {
        if (this.state !== 'transmitting') return;
        await this.tx.transmitId(this.nodeId, DEFAULT_ACOUSTIC_CONFIG);
      };

      await broadcast();
      this.beaconInterval = setInterval(broadcast, 3000);
    } catch (err) {
      console.error('Failed to start acoustic service:', err);
      this.state = 'idle';
    }
  }

  stopAll(): void {
    this.state = 'idle';
    if (this.beaconInterval) {
      clearInterval(this.beaconInterval);
      this.beaconInterval = null;
    }
    this.tx.stop();
    this.rx.stop();
  }

  destroy(): void {
    this.stopAll();
  }
}
