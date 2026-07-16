import { describe, it, expect } from 'vitest';
import { detectFrequency, detectFrequencies, findPeakFrequency } from './goertzel';

function generateSine(freq: number, sampleRate: number, duration: number): Float32Array {
  const n = Math.floor(sampleRate * duration);
  const samples = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    samples[i] = Math.sin((2 * Math.PI * freq * i) / sampleRate);
  }
  return samples;
}

describe('goertzel', () => {
  const SAMPLE_RATE = 44100;

  it('detects a known frequency in a sine wave', () => {
    const samples = generateSine(18000, SAMPLE_RATE, 0.1);
    const power = detectFrequency(samples, 18000, SAMPLE_RATE);
    expect(power).toBeGreaterThan(0.1);
  });

  it('returns low power for wrong frequency', () => {
    const samples = generateSine(18000, SAMPLE_RATE, 0.1);
    const power = detectFrequency(samples, 19000, SAMPLE_RATE);
    expect(power).toBeLessThan(0.1);
  });

  it('detects multiple frequencies correctly', () => {
    const samples = generateSine(18500, SAMPLE_RATE, 0.1);
    const results = detectFrequencies(samples, [18000, 18500, 19000], SAMPLE_RATE);
    expect(results.get(18500)!).toBeGreaterThan(0.1);
    expect(results.get(18000)!).toBeLessThan(0.1);
    expect(results.get(19000)!).toBeLessThan(0.1);
  });

  it('finds the peak frequency from a list', () => {
    const samples = generateSine(18300, SAMPLE_RATE, 0.1);
    const peak = findPeakFrequency(samples, [18000, 18100, 18200, 18300, 18400, 18500], SAMPLE_RATE);
    expect(peak).not.toBeNull();
    expect(peak!.frequency).toBe(18300);
  });

  it('returns null when all frequencies have low power (silence)', () => {
    const samples = new Float32Array(4410);
    const peak = findPeakFrequency(samples, [18000, 18500, 19000], SAMPLE_RATE);
    expect(peak).toBeNull();
  });

  it('encodes hex value as expected frequency', () => {
    const baseFreq = 18000;
    const stepFreq = 100;
    for (let i = 0; i < 16; i++) {
      const freq = baseFreq + i * stepFreq;
      const samples = generateSine(freq, SAMPLE_RATE, 0.05);
      const power = detectFrequency(samples, freq, SAMPLE_RATE);
      expect(power).toBeGreaterThan(0.05);
    }
  });
});
