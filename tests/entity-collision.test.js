import test from 'node:test';
import assert from 'node:assert/strict';
import { Engine, EntityManager, MovementSystem, moveCommand } from '../src/index.js';

test('movement is blocked when the destination is occupied', () => {
  const engine = new Engine({ width: 4, height: 3 });
  const blocked = [];

  const player = engine.addEntity({ id: 'player', position: { x: 1, y: 1 } });
  engine.addEntity({ id: 'obstacle', position: { x: 2, y: 1 } });
  engine.addSystem(new MovementSystem({ grid: engine.grid, entities: engine.entities }));
  engine.on('movement.blocked', event => blocked.push(event));
  engine.start();

  const result = engine.dispatch(moveCommand(1, 0));

  assert.equal(result.accepted, true);
  assert.equal(result.consumedTurn, false);
  assert.deepEqual(player.position, { x: 1, y: 1 });
  assert.equal(engine.state.turn, 0);
  assert.equal(blocked.length, 1);
  assert.equal(blocked[0].reason, 'occupied');
  assert.equal(blocked[0].obstacleId, 'obstacle');
  assert.equal(engine.entities.at(2, 1)[0].id, 'obstacle');
});

test('EntityManager switches collections with validation', () => {
  const first = new Map([
    ['player', { id: 'player', position: { x: 0, y: 0 } }]
  ]);
  const second = new Map([
    ['exit', { id: 'exit', position: { x: 2, y: 1 } }]
  ]);
  const manager = new EntityManager(first);

  assert.equal(manager.get('player').id, 'player');
  assert.equal(manager.setCollection(second), manager);
  assert.equal(manager.entities, second);
  assert.equal(manager.get('player'), undefined);
  assert.equal(manager.get('exit').id, 'exit');
  assert.throws(
    () => manager.setCollection([]),
    /entities must be a Map/
  );
});
