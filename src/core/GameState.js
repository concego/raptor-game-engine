function validateMapDefinition(definition) {
  if (!definition || typeof definition.id !== 'string' || definition.id.length === 0) {
    throw new TypeError('map.id must be a non-empty string');
  }
  if (!Number.isInteger(definition.width) || definition.width < 1) {
    throw new TypeError('map.width must be a positive integer');
  }
  if (!Number.isInteger(definition.height) || definition.height < 1) {
    throw new TypeError('map.height must be a positive integer');
  }
  return {
    id: definition.id,
    grid: { width: definition.width, height: definition.height },
    entities: new Map()
  };
}

/**
 * Creates the serializable state shared by the engine systems.
 * Game-specific state can live under `game`.
 */
export function createGameState({
  width,
  height,
  seed = null,
  mapId = 'main',
  maps = null
} = {}) {
  const definitions = maps ?? [{ id: mapId, width, height }];
  if (!Array.isArray(definitions) || definitions.length === 0) {
    throw new TypeError('maps must be a non-empty array');
  }

  const mapRecords = new Map();
  for (const definition of definitions) {
    const map = validateMapDefinition(definition);
    if (mapRecords.has(map.id)) throw new Error(`map already exists: ${map.id}`);
    mapRecords.set(map.id, map);
  }

  if (!mapRecords.has(mapId)) {
    throw new Error(`initial map not found: ${mapId}`);
  }

  const activeMap = mapRecords.get(mapId);
  return {
    version: 1,
    seed,
    turn: 0,
    phase: 'ready',
    mapId,
    maps: mapRecords,
    grid: activeMap.grid,
    entities: activeMap.entities,
    game: {}
  };
}

export function cloneGameState(state) {
  const maps = new Map(
    [...state.maps].map(([id, map]) => [id, {
      ...map,
      grid: { ...map.grid },
      entities: structuredClone(map.entities)
    }])
  );
  const activeMap = maps.get(state.mapId);
  return {
    ...state,
    maps,
    grid: activeMap?.grid ?? { ...state.grid },
    entities: activeMap?.entities ?? structuredClone(state.entities),
    game: structuredClone(state.game)
  };
}
