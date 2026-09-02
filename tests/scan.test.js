import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EntityManager,
  EventBus,
  KeyboardInput,
  ScanSystem,
  createGameState,
  scanCommand
} from '../src/index.js';

test('scan reports nearby entities in deterministic order', () => {
  const state = createGameState({ width: 8, height: 8 });
  const entities = new EntityManager(state.entities);
  entities.add({ id: 'player', position: { x: 2, y: 2 } });
  entities.add({ id: 'near', position: { x: 3, y: 2 }, kind: 'portal' });
  entities.add({ id: 'same-distance', position: { x: 2, y: 3 } });
  entities.add({ id: 'far', position: { x: 6, y: 2 } });
  entities.add({ id: 'hidden', position: { x: 2, y: 1 }, scanable: false });

  const events = new EventBus();
  let payload;
  events.on('scan.completed', event => { payload = event; });
  const system = new ScanSystem({ actorId: 'player', range: 2 });

  const result = system.process(scanCommand(), { state, events });

  assert.deepEqual(result, { consumesTurn: false });
  assert.equal(payload.actorId, 'player');
  assert.deepEqual(payload.origin, { x: 2, y: 2 });
  assert.deepEqual(payload.results.map(item => item.entityId), ['near', 'same-distance']);
  assert.deepEqual(payload.results[0], {
    entityId: 'near',
    position: { x: 3, y: 2 },
    offset: { x: 1, y: 0 },
    distance: 1
  });
});

test('scan cost can block an action without consuming a turn', () => {
  const state = createGameState({ width: 3, height: 3 });
  const entities = new EntityManager(state.entities);
  entities.add({ id: 'player', position: { x: 1, y: 1 }, charges: 0 });
  const events = new EventBus();
  let blocked;
  events.on('scan.blocked', event => { blocked = event; });

  const system = new ScanSystem({
    cost: ({ actor }) => actor.charges > 0
      ? { allowed: true }
      : { allowed: false, reason: 'no-charges' }
  });
  const result = system.process(scanCommand(), { state, events });

  assert.deepEqual(result, { consumesTurn: false });
  assert.deepEqual(blocked, {
    actorId: 'player',
    origin: { x: 1, y: 1 },
    reason: 'no-charges'
  });
});

test('scan turn consumption is configurable', () => {
  const state = createGameState({ width: 3, height: 3 });
  new EntityManager(state.entities).add({ id: 'player', position: { x: 1, y: 1 } });
  const events = new EventBus();
  let completed = false;
  events.on('scan.empty', () => { completed = true; });

  const system = new ScanSystem({ range: 0, consumesTurn: true });
  const result = system.process(scanCommand(), { state, events });

  assert.deepEqual(result, { consumesTurn: true });
  assert.equal(completed, true);
});

test('keyboard bindings are supplied by the consuming project', () => {
  const target = {
    listeners: new Map(),
    addEventListener(type, listener) { this.listeners.set(type, listener); },
    removeEventListener(type) { this.listeners.delete(type); }
  };
  const dispatched = [];
  let prevented = false;
  const input = new KeyboardInput({
    bindings: { KeyQ: () => scanCommand() },
    dispatch: command => dispatched.push(command)
  });

  input.attach(target);
  const command = target.listeners.get('keydown')({
    key: 'q',
    code: 'KeyQ',
    preventDefault() { prevented = true; }
  });

  assert.deepEqual(command, scanCommand());
  assert.deepEqual(dispatched, [scanCommand()]);
  assert.equal(prevented, true);
  input.detach();
  assert.equal(target.listeners.has('keydown'), false);
});

