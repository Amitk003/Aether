import { describe, it, expect } from 'vitest';
import { splitPayload, encodeChunk, decodeChunk, reconstructPayload } from './chunker';

function strToBytes(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

function bytesToStr(b: Uint8Array): string {
  return new TextDecoder().decode(b);
}

describe('chunker', () => {
  it('splits a small payload into one chunk', () => {
    const payload = strToBytes('hello');
    const chunks = splitPayload(payload, 200);
    expect(chunks).toHaveLength(1);
    expect(chunks[0].total).toBe(1);
    expect(chunks[0].index).toBe(0);
    expect(bytesToStr(chunks[0].data)).toBe('hello');
  });

  it('splits a large payload into multiple chunks', () => {
    const payload = strToBytes('a'.repeat(500));
    const chunks = splitPayload(payload, 200);
    expect(chunks).toHaveLength(3);
    expect(chunks[0].total).toBe(3);
    expect(chunks[1].total).toBe(3);
    expect(chunks[2].total).toBe(3);
    expect(chunks[2].data).toHaveLength(100);
  });

  it('encodes and decodes a chunk correctly', () => {
    const payload = strToBytes('test message');
    const chunks = splitPayload(payload, 200);
    const encoded = encodeChunk(chunks[0]);
    const decoded = decodeChunk(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded!.index).toBe(0);
    expect(bytesToStr(decoded!.data)).toBe('test message');
  });

  it('rejects corrupted chunks via checksum', () => {
    const payload = strToBytes('hello');
    const chunks = splitPayload(payload, 200);
    const encoded = encodeChunk(chunks[0]);

    const corrupted = encoded.slice(0, -2) + 'XX';
    const decoded = decodeChunk(corrupted);
    expect(decoded).toBeNull();
  });

  it('reconstructs the original payload from chunks', () => {
    const original = 'Hello, this is a test message that spans multiple chunks!';
    const payload = strToBytes(original);
    const chunks = splitPayload(payload, 10);

    const reconstructed = reconstructPayload(chunks);
    expect(reconstructed).not.toBeNull();
    expect(bytesToStr(reconstructed!)).toBe(original);
  });

  it('handles out-of-order chunk reconstruction', () => {
    const original = '1234567890abcdef';
    const payload = strToBytes(original);
    const chunks = splitPayload(payload, 4);

    const reversed = chunks.reverse();
    const reconstructed = reconstructPayload(reversed);
    expect(bytesToStr(reconstructed!)).toBe(original);
  });

  it('encodes chunk header correctly (total, index, checksum)', () => {
    const data = new Uint8Array([0x01, 0x02, 0x03]);
    const chunk = { total: 5, index: 3, data, checksum: 0x01 ^ 0x02 ^ 0x03 };
    const encoded = encodeChunk(chunk);
    const decoded = decodeChunk(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded!.total).toBe(5);
    expect(decoded!.index).toBe(3);

    // The checksum in decoded should match since we recompute on encode
    // and the raw header byte is set to our computed value
    expect(decoded!.checksum).toBe(chunk.checksum);
  });

  it('handles empty payload', () => {
    const payload = new Uint8Array(0);
    const chunks = splitPayload(payload, 200);
    expect(chunks).toHaveLength(0);
    const reconstructed = reconstructPayload(chunks);
    expect(reconstructed).not.toBeNull();
    expect(reconstructed!.length).toBe(0);
  });

  it('handles single-byte payload', () => {
    const payload = new Uint8Array([0xFF]);
    const chunks = splitPayload(payload, 200);
    expect(chunks).toHaveLength(1);
    const encoded = encodeChunk(chunks[0]);
    const decoded = decodeChunk(encoded);
    expect(decoded!.data[0]).toBe(0xFF);
  });
});
