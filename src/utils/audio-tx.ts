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

      this.oscillator = this.ctx.createOscillator();
      this.oscillator.type = 'sine';
      this.oscillator.frequency.value = freq;
      this.oscillator.connect(this.gain);
      this.oscillator.start();
      this.oscillator.stop(this.ctx.currentTime + duration / 1000);

      this.oscillator.onended = () => {
        this.oscillator?.disconnect();
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

    tones.push({ freq: config.preambleFreq, duration: config.preambleDuration });

    for (const char of nodeId) {
      const hexVal = parseInt(char, 16);
      if (isNaN(hexVal)) continue;
      tones.push({
        freq: config.baseFreq + hexVal * config.stepFreq,
        duration: config.toneDuration,
      });
    }

    tones.push({ freq: config.endFreq, duration: config.endDuration });

    await this.playSequence(tones);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }
}
