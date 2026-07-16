import type { DataChunk } from '../types/optical';

const HEADER_SIZE = 3;

function computeChecksum(data: Uint8Array): number {
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum ^= data[i];
  }
  return sum;
}

export function splitPayload(payload: Uint8Array, chunkSize: number): DataChunk[] {
  const total = Math.ceil(payload.length / chunkSize);
  const chunks: DataChunk[] = [];

  for (let i = 0; i < total; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, payload.length);
    const data = payload.slice(start, end);
    chunks.push({
      total,
      index: i,
      data,
      checksum: computeChecksum(data),
    });
  }

  return chunks;
}

export function encodeChunk(chunk: DataChunk): string {
  const header = new Uint8Array(HEADER_SIZE);
  header[0] = chunk.total;
  header[1] = chunk.index;
  header[2] = chunk.checksum;

  const combined = new Uint8Array(header.length + chunk.data.length);
  combined.set(header);
  combined.set(chunk.data, header.length);

  return btoa(String.fromCharCode(...combined));
}

export function decodeChunk(encoded: string): DataChunk | null {
  try {
    const binary = atob(encoded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const total = bytes[0];
    const index = bytes[1];
    const checksum = bytes[2];
    const data = bytes.slice(HEADER_SIZE);

    if (computeChecksum(data) !== checksum) {
      return null;
    }

    return { total, index, data, checksum };
  } catch {
    return null;
  }
}

export function reconstructPayload(chunks: DataChunk[]): Uint8Array | null {
  const sorted = [...chunks].sort((a, b) => a.index - b.index);

  let totalLength = 0;
  for (const chunk of sorted) {
    totalLength += chunk.data.length;
  }

  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of sorted) {
    result.set(chunk.data, offset);
    offset += chunk.data.length;
  }

  return result;
}
