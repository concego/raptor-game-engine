import test from 'node:test';
import assert from 'node:assert/strict';
import { EventBus, Grid, createGameState, TurnManager } from '../src/index.js';

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

