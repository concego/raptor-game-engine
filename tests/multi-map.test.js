import test from 'node:test';
import assert from 'node:assert/strict';
import {
  Engine,
  MapTransitionSystem,
  MovementSystem,
  createPortal,
  moveCommand
} from '../src/index.js';

test('a portal transfers the actor and preserves map state', () => {
  const engine = new Engine({
    mapId: 'meadow',
    maps: [
      { id: 'meadow', width: 4, height: 3 },
      { id: 'cave', width: 6, height: 4 }
    ]
  });
  const transitions = [];
  engine.addEntity({ id: 'player', position: { x: 0, y: 1 } });
  engine.addEntity(createPortal({
    id: 'entrance', position: { x: 1, y: 1 },
    toMapId: 'cave', toPosition: { x: 4, y: 2 }
  }));
  engine.addEntity(createPortal({
    id: 'exit', position: { x: 4, y: 2 },
    toMapId: 'meadow', toPosition: { x: 1, y: 1 }
  }), { mapId: 'cave' });
  engine.addSystem(new MovementSystem({ grid: engine.grid, entities: engine.entities }));
  engine.addSystem(new MapTransitionSystem({ mapManager: engine.maps }));
  engine.on('map.transitioned', event => transitions.push(event));
  engine.start();

  const result = engine.dispatch(moveCommand(1, 0));

  assert.equal(result.consumedTurn, true);
  assert.equal(engine.state.turn, 1);
  assert.equal(engine.state.mapId, 'cave');
  assert.deepEqual(engine.state.grid, { width: 6, height: 4 });
  assert.deepEqual(engine.state.entities.get('player').position, { x: 4, y: 2 });
  assert.equal(engine.state.entities.has('exit'), true);
  assert.equal(engine.state.maps.get('meadow').entities.has('player'), false);
  assert.equal(engine.state.maps.get('meadow').entities.has('entrance'), true);
  assert.equal(transitions[0].portalId, 'entrance');
  assert.equal(transitions[0].fromMapId, 'meadow');
  assert.equal(transitions[0].toMapId, 'cave');
});

test('a portal is passable before the transition system resolves it', () => {
  const engine = new Engine({
    mapId: 'start',
    maps: [{ id: 'start', width: 3, height: 1 }, { id: 'end', width: 3, height: 1 }]
  });
  engine.addEntity({ id: 'player', position: { x: 0, y: 0 } });
  engine.addEntity(createPortal({
    id: 'door', position: { x: 1, y: 0 },
    toMapId: 'end', toPosition: { x: 0, y: 0 }
  }));
  engine.addSystem(new MovementSystem({ grid: engine.grid, entities: engine.entities }));
  engine.addSystem(new MapTransitionSystem({ mapManager: engine.maps }));
  engine.start();

  const result = engine.dispatch(moveCommand(1, 0));

  assert.equal(result.accepted, true);
  assert.equal(engine.state.mapId, 'end');
  assert.deepEqual(engine.state.entities.get('player').position, { x: 0, y: 0 });
});

