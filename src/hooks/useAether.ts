import { useState, useEffect, useRef } from 'react';
import { AetherEngine } from '../utils/engine';
import type { AppState } from '../types/engine';

let globalEngine: AetherEngine | null = null;

export function getEngine(): AetherEngine {
  if (!globalEngine) {
    globalEngine = new AetherEngine();
  }
  return globalEngine;
}

export function useAether(): {
  engine: AetherEngine;
  state: AppState;
} {
  const engine = useRef(getEngine());
  const [state, setState] = useState<AppState>(engine.current.getState());

  useEffect(() => {
    const unsub = engine.current.onStateChange(setState);
    return unsub;
  }, []);

  return { engine: engine.current, state };
}
