export function detectFrequency(
  samples: Float32Array,
  freq: number,
  sampleRate: number
): number {
  const n = samples.length;
  let s1 = 0;
  let s2 = 0;
  const w = (2 * Math.PI * freq) / sampleRate;
  const coeff = 2 * Math.cos(w);

  for (let i = 0; i < n; i++) {
    const s0 = samples[i] + coeff * s1 - s2;
    s2 = s1;
    s1 = s0;
  }

  const power = s2 * s2 + s1 * s1 - coeff * s1 * s2;
  return power / n;
}

export function detectFrequencies(
  samples: Float32Array,
  frequencies: number[],
  sampleRate: number
): Map<number, number> {
  const results = new Map<number, number>();
  for (const freq of frequencies) {
    results.set(freq, detectFrequency(samples, freq, sampleRate));
  }
  return results;
}

export function findPeakFrequency(
  samples: Float32Array,
  frequencies: number[],
  sampleRate: number
): { frequency: number; power: number } | null {
  const results = detectFrequencies(samples, frequencies, sampleRate);
  let maxFreq: number | null = null;
  let maxPower = 0;

  for (const [freq, power] of results) {
    if (power > maxPower) {
      maxPower = power;
      maxFreq = freq;
    }
  }

  if (maxFreq === null) return null;
  return { frequency: maxFreq, power: maxPower };
}
