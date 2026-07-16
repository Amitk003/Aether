import type { AcousticState } from './acoustic';

export type AppPhase = 'idle' | 'discovering' | 'transferring' | 'resolving';

export interface AppState {
  phase: AppPhase;
  acousticState: AcousticState;
  pendingMessages: number;
  knownPeers: string[];
  lastSync: number | null;
  diagnostics: DiagnosticsData;
}

export interface DiagnosticsData {
  dbReady: boolean;
  cryptoReady: boolean;
  micPermission: boolean;
  cameraPermission: boolean;
  totalMessagesSent: number;
  totalMessagesReceived: number;
  peersEncountered: number;
  chunksSent: number;
  chunksReceived: number;
  transfersCompleted: number;
}
