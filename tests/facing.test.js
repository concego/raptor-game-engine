import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EntityManager,
  EventBus,
  FACING,
  ScanSystem,
  createGameState,
  scanCommand
} from '../src/index.js';

test('ScanSystem uses the canonical FACING token for vision cones', () => {
  const state = createGameState({ width: 7, height: 7 });
  const entities = new EntityManager(state.entities);
  entities.add({ id: 'player', position: { x: 3, y: 3 }, direction: FACING.NORTH });
  entities.add({ id: 'ahead', position: { x: 3, y: 1 } });
  entities.add({ id: 'side', position: { x: 5, y: 3 } });

  const events = new EventBus();
  let payload;
  events.on('scan.completed', event => { payload = event; });
  const system = new ScanSystem({
    actorId: 'player',
    range: 3,
    visionCone: { angle: 90 }
  });

  const result = system.process(scanCommand(), { state, events });

  assert.deepEqual(result, { consumesTurn: false });
  assert.deepEqual(payload.visionCone, { angle: 90, direction: FACING.NORTH });
  assert.deepEqual(payload.results.map(item => item.entityId), ['ahead']);
});

