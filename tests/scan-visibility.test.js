import test from 'node:test';
import assert from 'node:assert/strict';
import { EntityManager, EventBus, ScanSystem, createGameState, scanCommand } from '../src/index.js';

test('scan supports consumer-supplied visibility for line-of-sight rules', () => {
  const state = createGameState({ width: 5, height: 5 });
  const entities = new EntityManager(state.entities);
  entities.add({ id: 'player', position: { x: 1, y: 2 } });
  entities.add({ id: 'visible', position: { x: 2, y: 2 } });
  entities.add({ id: 'behind-wall', position: { x: 3, y: 2 } });
  const events = new EventBus();
  let payload;
  events.on('scan.completed', event => { payload = event; });

  const system = new ScanSystem({
    actorId: 'player',
    range: 3,
    isVisible: (entity, { state: currentState, actor }) => {
      assert.equal(currentState, state);
      assert.equal(actor.id, 'player');
      return entity.id !== 'behind-wall';
    }
  });
  system.process(scanCommand(), { state, events });

  assert.deepEqual(payload.results.map(item => item.entityId), ['visible']);
});

