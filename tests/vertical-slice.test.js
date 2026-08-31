import test from 'node:test';
import assert from 'node:assert/strict';
import { Engine, MovementSystem, moveCommand } from '../src/index.js';

test('minimal vertical slice moves an actor and emits events', () => {
  const engine = new Engine({ width: 3, height: 3 });
  const completed = [];
  const blocked = [];

  engine.addEntity({ id: 'player', position: { x: 1, y: 1 } });
  engine.addSystem(new MovementSystem({ grid: engine.grid }));
  engine.on('movement.completed', event => completed.push(event));
  engine.on('movement.blocked', event => blocked.push(event));
  engine.start();

  const moved = engine.dispatch(moveCommand(1, 0));
  const firstBlocked = engine.dispatch(moveCommand(1, 0));
  const secondBlocked = engine.dispatch(moveCommand(1, 0));

  assert.deepEqual(engine.state.entities.get('player').position, { x: 2, y: 1 });
  assert.equal(engine.state.turn, 1);
  assert.equal(moved.consumedTurn, true);
  assert.equal(firstBlocked.consumedTurn, false);
  assert.equal(secondBlocked.consumedTurn, false);
  assert.equal(completed.length, 1);
  assert.equal(blocked.length, 2);
  assert.deepEqual(blocked[0].attempted, { x: 3, y: 1 });
});
