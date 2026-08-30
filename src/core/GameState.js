/**
 * Creates the serializable state shared by the engine systems.
 * Game-specific state can live under `game`.
 */
export function createGameState({ width, height, seed = null } = {}) {
  if (!Number.isInteger(width) || width < 1) {
    throw new TypeError('width must be a positive integer');
  }
  if (!Number.isInteger(height) || height < 1) {
    throw new TypeError('height must be a positive integer');
  }

  return {
    version: 1,
    seed,
    turn: 0,
    phase: 'ready',
    grid: { width, height },
    entities: new Map(),
    game: {}
  };
}

export function cloneGameState(state) {
  return {
    ...state,
    grid: { ...state.grid },
    entities: new Map(state.entities),
    game: structuredClone(state.game)
  };
}

