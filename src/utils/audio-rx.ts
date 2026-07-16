import { DEFAULT_ACOUSTIC_CONFIG, type AcousticConfig, type BeaconMessage } from '../types/acoustic';
import { detectFrequency, detectFrequencies } from './goertzel';

export type BeaconCallback = (msg: BeaconMessage) => void;

export class AudioReceiver {
  private ctx: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private scriptNode: ScriptProcessorNode | null = null;
  private isActive = false;
  private onBeacon: BeaconCallback | null = null;

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
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

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
    this.analyser.smoothingTimeConstant = 0.8;
    this.source.connect(this.analyser);

    // Create ScriptProcessorNode for stable, continuous time-domain processing
    this.scriptNode = this.ctx.createScriptProcessor(4096, 1, 1);
    this.scriptNode.onaudioprocess = (event: AudioProcessingEvent) => {
      if (!this.isActive) return;
      const samples = event.inputBuffer.getChannelData(0);
      this.processFrame(samples, config);
    };

    this.source.connect(this.scriptNode);
    this.scriptNode.connect(this.ctx.destination);

    this.isActive = true;
    this.resetState();
  }

  stop(): void {
    this.isActive = false;
    
    this.scriptNode?.disconnect();
    this.scriptNode = null;
    
    this.source?.disconnect();
    this.source = null;
    
    this.analyser?.disconnect();
    this.analyser = null;
    
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    
    this.ctx?.close();
    this.ctx = null;
  }

  private resetState(): void {
    this.preamblePower = 0;
    this.receivedTones = [];
    this.readingData = false;
    this.consecutiveSilence = 0;
    this.lastRegisteredSymbol = null;
  }

  private processFrame(samples: Float32Array, config: AcousticConfig): void {
    const preamblePower = detectFrequency(samples, config.preambleFreq, config.sampleRate);
    const threshold = 0.1;

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
      // Use lower threshold since spacer signal may only partially fill the processing frame
      const spacerFreq = config.baseFreq + 16 * config.stepFreq;
      const spacerPower = detectFrequency(samples, spacerFreq, config.sampleRate);

      if (spacerPower > 0.05) {
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

  getFrequencyData(): Float32Array | null {
    if (!this.analyser) return null;
    const data = new Float32Array(this.analyser.frequencyBinCount);
    this.analyser.getFloatFrequencyData(data);
    return data;
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
