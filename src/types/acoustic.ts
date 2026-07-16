export interface BeaconMessage {
  nodeId: string;
  rssi: number;
  timestamp: number;
}

export interface AcousticConfig {
  preambleFreq: number;
  preambleDuration: number;
  toneDuration: number;
  endFreq: number;
  endDuration: number;
  baseFreq: number;
  stepFreq: number;
  sampleRate: number;
  fftSize: number;
}

export const DEFAULT_ACOUSTIC_CONFIG: AcousticConfig = {
  preambleFreq: 1500,
  preambleDuration: 200,
  toneDuration: 80,
  endFreq: 2500,
  endDuration: 150,
  baseFreq: 1600,
  stepFreq: 50,
  sampleRate: 44100,
  fftSize: 2048,
};

export type AcousticState = 'idle' | 'transmitting' | 'listening' | 'receiving';
