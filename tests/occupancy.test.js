import test from 'node:test';
import assert from 'node:assert/strict';
import {
  Engine,
  EntityManager,
  MovementSystem,
  moveCommand
} from '../src/index.js';

test('EntityManager keeps coordinate queries current', () => {
  const manager = new EntityManager();
  const player = manager.add({ id: 'player', position: { x: 1, y: 1 } });
  const obstacle = manager.add({ id: 'obstacle', position: { x: 2, y: 1 } });

  assert.deepEqual(manager.at(1, 1), [player]);
  assert.deepEqual(manager.at(2, 1), [obstacle]);

  manager.updatePosition('obstacle', { x: 3, y: 1 });
  assert.deepEqual(manager.at(2, 1), []);
  assert.deepEqual(manager.at(3, 1), [obstacle]);

  assert.equal(manager.remove('obstacle'), true);
  assert.deepEqual(manager.at(3, 1), []);
});

test('MovementSystem updates the occupancy index after movement', () => {
  const engine = new Engine({ width: 4, height: 3 });
  const player = engine.addEntity({ id: 'player', position: { x: 1, y: 1 } });
  engine.addSystem(new MovementSystem({ grid: engine.grid, entities: engine.entities }));
  engine.start();

  engine.dispatch(moveCommand(1, 0));

  assert.deepEqual(player.position, { x: 2, y: 1 });
  assert.deepEqual(engine.entities.at(1, 1), []);
  assert.deepEqual(engine.entities.at(2, 1), [player]);
});

