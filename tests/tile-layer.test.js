import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cloneGameState,
  createGameState,
  createTileLayer,
  getTile,
  setTile,
  tileBlocksVision
} from '../src/index.js';

test('game state keeps map tiles separate from entities', () => {
  const state = createGameState({
    mapId: 'meadow',
    maps: [{
      id: 'meadow',
      width: 3,
      height: 2,
      tiles: [
        [
          { id: 'grass' },
          { id: 'wall', blocksVision: true },
          { id: 'water' }
        ],
        [null, { id: 'grass' }, { id: 'grass' }]
      ]
    }]
  });

  assert.deepEqual(state.grid, { width: 3, height: 2 });
  assert.deepEqual(getTile(state.tiles, 1, 0), {
    id: 'wall',
    blocksVision: true
  });
  assert.equal(tileBlocksVision(getTile(state.tiles, 1, 0)), true);
  assert.ok(state.entities instanceof Map);
  assert.notEqual(state.tiles, state.entities);
});

test('tile layer validates dimensions and clones tile data', () => {
  const source = [[{ id: 'grass' }, { id: 'wall', opaque: true }]];
  const layer = createTileLayer(2, 1, source);

  assert.notEqual(layer.cells, source);
  source[0][0].id = 'water';
  assert.equal(getTile(layer, 0, 0).id, 'grass');
  assert.equal(tileBlocksVision(getTile(layer, 1, 0)), true);

  setTile(layer, 0, 0, { id: 'bridge' });
  assert.deepEqual(getTile(layer, 0, 0), { id: 'bridge' });
  assert.equal(getTile(layer, -1, 0), undefined);
  assert.throws(
    () => createTileLayer(2, 1, [[{ id: 'grass' }]]),
    /each tile row must match the map width/
  );
});

test('cloneGameState isolates tile data across maps', () => {
  const state = createGameState({
    maps: [{
      id: 'meadow',
      width: 2,
      height: 1,
      tiles: [[{ id: 'grass' }, { id: 'wall', blocksVision: true }]]
    }]
  });
  const clone = cloneGameState(state);

  clone.tiles.cells[0][0].id = 'lava';
  assert.equal(state.tiles.cells[0][0].id, 'grass');
  assert.notEqual(clone.maps.get('main').tiles, state.maps.get('main').tiles);
});

