import { DEFAULT_ACOUSTIC_CONFIG, type AcousticConfig, type BeaconMessage } from '../types/acoustic';
import { detectFrequency, detectFrequencies } from './goertzel';

export type BeaconCallback = (msg: BeaconMessage) => void;

export class AudioReceiver {
  private ctx: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private isActive = false;
  private animFrameId: number | null = null;
  private onBeacon: BeaconCallback | null = null;

  // Zero-allocation buffer pooling
  private staticBuffer: Float32Array | null = null;
  private bufferSize = 0;
  private readonly BUFFER_TARGET = 4;

  private lastDecodeTime = 0;
  private readonly DECODE_COOLDOWN = 2000;

  private preamblePower = 0;
  private receivedTones: number[] = [];
  private readingData = false;
  private consecutiveSilence = 0;
  private lastRegisteredSymbol: number | null = null;

  setOnBeacon(callback: BeaconCallback): void {
    this.onBeacon = callback;
  }

  async start(config: AcousticConfig = DEFAULT_ACOUSTIC_CONFIG): Promise<void> {
    if (this.isActive) return;

    this.ctx = new AudioContext();
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        sampleRate: config.sampleRate,
        autoGainControl: false,
        echoCancellation: false,
        noiseSuppression: false,
      },
    });

    this.source = this.ctx.createMediaStreamSource(this.stream);
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = config.fftSize;
    this.source.connect(this.analyser);

    // Pre-allocate buffer once to ensure zero heap allocations inside the 60fps render loop
    this.staticBuffer = new Float32Array(this.analyser.frequencyBinCount * this.BUFFER_TARGET);

    this.isActive = true;
    this.resetState();
    this.poll(config);
  }

  stop(): void {
    this.isActive = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.source?.disconnect();
    this.source = null;
    this.analyser = null;
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.ctx?.close();
    this.ctx = null;
    this.staticBuffer = null;
  }

  private resetState(): void {
    this.bufferSize = 0;
    this.preamblePower = 0;
    this.receivedTones = [];
    this.readingData = false;
    this.consecutiveSilence = 0;
    this.lastRegisteredSymbol = null;
  }

  private poll(config: AcousticConfig): void {
    if (!this.isActive || !this.analyser || !this.staticBuffer) return;

    const bufferLength = this.analyser.frequencyBinCount;
    const offset = this.bufferSize * bufferLength;
    
    // Write directly into the pre-allocated slice of our static buffer
    this.analyser.getFloatTimeDomainData(this.staticBuffer.subarray(offset, offset + bufferLength) as any);
    this.bufferSize++;

    if (this.bufferSize >= this.BUFFER_TARGET) {
      this.processFrame(this.staticBuffer as any, config);
      this.bufferSize = 0;
    }

    this.animFrameId = requestAnimationFrame(() => this.poll(config));
  }

  private processFrame(samples: Float32Array, config: AcousticConfig): void {
    const preamblePower = detectFrequency(samples, config.preambleFreq, config.sampleRate);
    const threshold = 0.5;

    // Detect Preamble (Discovery Start)
    if (!this.readingData && preamblePower > threshold) {
      this.preamblePower = preamblePower;
      this.readingData = true;
      this.receivedTones = [];
      this.consecutiveSilence = 0;
      this.lastRegisteredSymbol = null;
      return;
    }

    if (this.readingData) {
      const dataFrequencies: number[] = [];
      for (let i = 0; i < 16; i++) {
        dataFrequencies.push(config.baseFreq + i * config.stepFreq);
      }

      // Check spacer frequency (symbol transition index 16)
      const spacerFreq = config.baseFreq + 16 * config.stepFreq;
      const spacerPower = detectFrequency(samples, spacerFreq, config.sampleRate);

      if (spacerPower > threshold) {
        this.lastRegisteredSymbol = null; // Reset for next symbol
        this.consecutiveSilence = 0;
        return;
      }

      const powers = detectFrequencies(samples, dataFrequencies, config.sampleRate);
      let maxFreq: number | null = null;
      let maxPower = 0;
      for (const [freq, power] of powers) {
        if (power > maxPower) {
          maxPower = power;
          maxFreq = freq;
        }
      }

      const endPower = detectFrequency(samples, config.endFreq, config.sampleRate);
      if (endPower > threshold) {
        this.finalizeBeacon();
        return;
      }

      if (maxFreq !== null && maxPower > threshold) {
        const idx = Math.round((maxFreq - config.baseFreq) / config.stepFreq);
        if (idx !== this.lastRegisteredSymbol) {
          this.receivedTones.push(idx);
          this.lastRegisteredSymbol = idx; // Lock current symbol
        }
        this.consecutiveSilence = 0;
      } else {
        this.consecutiveSilence++;
        if (this.consecutiveSilence > 5) {
          this.readingData = false;
        }
      }
    }
  }

  private finalizeBeacon(): void {
    const now = Date.now();
    if (now - this.lastDecodeTime < this.DECODE_COOLDOWN) {
      this.resetState();
      return;
    }
    this.lastDecodeTime = now;

    if (this.receivedTones.length === 0) {
      this.resetState();
      return;
    }

    const nodeId = this.receivedTones.map((val) => val.toString(16)).join('');
    this.onBeacon?.({
      nodeId,
      rssi: this.preamblePower,
      timestamp: now,
    });

    this.resetState();
  }
}
