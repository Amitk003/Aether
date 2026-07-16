export interface DataChunk {
  total: number;
  index: number;
  data: Uint8Array;
  checksum: number;
}

export interface TransferSession {
  id: string;
  totalChunks: number;
  received: (Uint8Array | null)[];
  completed: boolean;
  startedAt: number;
}

export interface OpticalConfig {
  chunkSize: number;
  frameInterval: number;
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
}

export const DEFAULT_OPTICAL_CONFIG: OpticalConfig = {
  chunkSize: 200,
  frameInterval: 1200,
  errorCorrectionLevel: 'M',
};

export type TransferRole = 'idle' | 'sending' | 'receiving';
