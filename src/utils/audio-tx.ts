import { DEFAULT_ACOUSTIC_CONFIG, type AcousticConfig } from '../types/acoustic';

export class AudioTransmitter {
  private ctx: AudioContext | null = null;
  private oscillator: OscillatorNode | null = null;
  private gain: GainNode | null = null;
  private isActive = false;

  async start(): Promise<void> {
    this.ctx = new AudioContext();
    this.gain = this.ctx.createGain();
    this.gain.gain.value = 0.3;
    this.gain.connect(this.ctx.destination);
    this.isActive = true;
  }

  stop(): void {
    this.isActive = false;
    this.oscillator?.stop();
    this.oscillator?.disconnect();
    this.oscillator = null;
    this.ctx?.close();
    this.ctx = null;
  }

  playTone(freq: number, duration: number): Promise<void> {
    return new Promise((resolve) => {
      if (!this.ctx || !this.gain || !this.isActive) {
        resolve();
        return;
      }

      // Create a dedicated gain node for this tone to implement a smooth attack/decay envelope
      const toneGain = this.ctx.createGain();
      const now = this.ctx.currentTime;
      const rampTime = 0.01; // 10ms envelope ramp to prevent audible clicking/popping noises

      toneGain.gain.setValueAtTime(0, now);
      toneGain.gain.linearRampToValueAtTime(1.0, now + rampTime);
      toneGain.gain.setValueAtTime(1.0, now + (duration / 1000) - rampTime);
      toneGain.gain.linearRampToValueAtTime(0, now + duration / 1000);

      this.oscillator = this.ctx.createOscillator();
      this.oscillator.type = 'sine';
      this.oscillator.frequency.value = freq;
      
      this.oscillator.connect(toneGain);
      toneGain.connect(this.gain);
      
      this.oscillator.start(now);
      this.oscillator.stop(now + duration / 1000);

      this.oscillator.onended = () => {
        this.oscillator?.disconnect();
        toneGain.disconnect();
        this.oscillator = null;
        resolve();
      };
    });
  }

  async playSequence(tones: Array<{ freq: number; duration: number }>): Promise<void> {
    for (const tone of tones) {
      if (!this.isActive) break;
      await this.playTone(tone.freq, tone.duration);
      await this.sleep(10);
    }
  }

  async transmitId(
    nodeId: string,
    config: AcousticConfig = DEFAULT_ACOUSTIC_CONFIG
  ): Promise<void> {
    if (!this.isActive || !nodeId) return;

    const tones: Array<{ freq: number; duration: number }> = [];

    // Preamble tone for synchronization
    tones.push({ freq: config.preambleFreq, duration: config.preambleDuration });

    const spacerFreq = config.baseFreq + 16 * config.stepFreq;
    const spacerDuration = 80; // 80ms ensures at least ~86% of the processing frame has spacer signal

    for (const char of nodeId) {
      const hexVal = parseInt(char, 16);
      if (isNaN(hexVal)) continue;
      
      // Symbol tone
      tones.push({
        freq: config.baseFreq + hexVal * config.stepFreq,
        duration: config.toneDuration,
      });

      // Self-clocking spacer tone to separate characters
      tones.push({
        freq: spacerFreq,
        duration: spacerDuration,
      });
    }

    // End tone
    tones.push({ freq: config.endFreq, duration: config.endDuration });

    await this.playSequence(tones);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }
}
