function validateDimensions(width, height) {
  if (!Number.isInteger(width) || width < 1) {
    throw new TypeError('width must be a positive integer');
  }
  if (!Number.isInteger(height) || height < 1) {
    throw new TypeError('height must be a positive integer');
  }
}

function cloneTile(tile) {
  return structuredClone(tile);
}

/**
 * Creates the serializable tile layer owned by a map.
 * Tile data is intentionally independent from the entity collection.
 */
export function createTileLayer(width, height, cells = null, fill = null) {
  validateDimensions(width, height);
  const source = cells ?? Array.from(
    { length: height },
    () => Array.from({ length: width }, () => fill)
  );

  if (!Array.isArray(source) || source.length !== height) {
    throw new TypeError('tiles must contain one row per map cell');
  }

  const normalized = source.map((row) => {
    if (!Array.isArray(row) || row.length !== width) {
      throw new TypeError('each tile row must match the map width');
    }
    return row.map(cloneTile);
  });

  return { width, height, cells: normalized };
}

export function isTileLayer(layer) {
  return Boolean(
    layer
    && Number.isInteger(layer.width)
    && Number.isInteger(layer.height)
    && Array.isArray(layer.cells)
  );
}

export function getTile(layer, x, y) {
  if (!isTileLayer(layer) || !Number.isInteger(x) || !Number.isInteger(y)) {
    return undefined;
  }
  if (x < 0 || y < 0 || x >= layer.width || y >= layer.height) {
    return undefined;
  }
  return layer.cells[y]?.[x];
}

export function setTile(layer, x, y, tile) {
  if (!isTileLayer(layer) || !Number.isInteger(x) || !Number.isInteger(y)) {
    throw new TypeError('a valid tile layer and integer coordinates are required');
  }
  if (x < 0 || y < 0 || x >= layer.width || y >= layer.height) {
    throw new RangeError('position is outside the tile layer');
  }
  layer.cells[y][x] = cloneTile(tile);
  return layer.cells[y][x];
}

/**
 * Shared semantic hint for future line-of-sight systems.
 * Renderers must not interpret this flag; systems may use it when resolving LOS.
 */
export function tileBlocksVision(tile) {
  return tile?.blocksVision === true || tile?.opaque === true;
}

