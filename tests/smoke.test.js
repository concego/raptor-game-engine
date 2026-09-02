import test from 'node:test';
import assert from 'node:assert/strict';
import { EventBus, Grid, cloneGameState, createGameState, TurnManager } from '../src/index.js';

test('Grid stores values and validates bounds', () => {
  const grid = new Grid(2, 2, '.');
  grid.set(1, 0, '#');
  assert.equal(grid.get(1, 0), '#');
  assert.equal(grid.get(9, 9), undefined);
});

test('EventBus subscribes, emits and unsubscribes', () => {
  const events = new EventBus();
  const received = [];
  const unsubscribe = events.on('test', value => received.push(value));
  events.emit('test', { value: 1 });
  unsubscribe();
  events.emit('test', { value: 2 });
  assert.deepEqual(received, [{ value: 1 }]);
});

test('TurnManager processes systems and advances the turn', () => {
  const state = createGameState({ width: 3, height: 3 });
  const events = new EventBus();
  const seen = [];
  events.on('turn.completed', event => seen.push(event.turn));
  const manager = new TurnManager({
    state,
    events,
    systems: [{ process: command => { state.game.lastCommand = command; } }]
  });
  manager.execute({ type: 'wait' });
  assert.equal(state.turn, 1);
  assert.equal(state.game.lastCommand.type, 'wait');
  assert.deepEqual(seen, [1]);
});

test('cloneGameState isolates nested entity state', () => {
  const state = createGameState({
    mapId: 'meadow',
    maps: [
      { id: 'meadow', width: 4, height: 3 },
      { id: 'cave', width: 5, height: 4 }
    ]
  });
  const player = {
    id: 'player',
    position: { x: 1, y: 1 },
    inventory: { items: ['torch'] }
  };
  state.entities.set(player.id, player);
  state.maps.get('cave').entities.set('chest', {
    id: 'chest',
    position: { x: 2, y: 2 },
    contents: ['gem']
  });

  const clone = cloneGameState(state);
  clone.entities.get('player').position.x = 3;
  clone.entities.get('player').inventory.items.push('key');
  clone.maps.get('cave').entities.get('chest').contents[0] = 'coin';

  assert.deepEqual(state.entities.get('player'), {
    id: 'player',
    position: { x: 1, y: 1 },
    inventory: { items: ['torch'] }
  });
  assert.deepEqual(state.maps.get('cave').entities.get('chest'), {
    id: 'chest',
    position: { x: 2, y: 2 },
    contents: ['gem']
  });
  assert.notEqual(clone.entities.get('player'), state.entities.get('player'));
  assert.notEqual(clone.maps.get('cave').entities.get('chest'), state.maps.get('cave').entities.get('chest'));
});
