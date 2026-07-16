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
  preambleFreq: 18000,
  preambleDuration: 300,
  toneDuration: 120,
  endFreq: 19500,
  endDuration: 200,
  baseFreq: 18000,
  stepFreq: 100,
  sampleRate: 44100,
  fftSize: 2048,
};

export type AcousticState = 'idle' | 'transmitting' | 'listening' | 'receiving';
