

test('vision cone can be enabled without coupling Scan to a key or renderer', () => {
  const state = createGameState({ width: 7, height: 7 });
  const entities = new EntityManager(state.entities);
  entities.add({ id: 'player', position: { x: 3, y: 3 }, direction: 'N' });
  entities.add({ id: 'ahead', position: { x: 3, y: 1 } });
  entities.add({ id: 'side', position: { x: 5, y: 3 } });
  entities.add({ id: 'behind', position: { x: 3, y: 5 } });
  const events = new EventBus();
  let payload;
  events.on('scan.completed', event => { payload = event; });

  const system = new ScanSystem({
    actorId: 'player',
    range: 3,
    visionCone: { angle: 90 }
  });
  system.process(scanCommand(), { state, events });

  assert.deepEqual(payload.results.map(item => item.entityId), ['ahead']);
  assert.deepEqual(payload.visionCone, { angle: 90, direction: 'N' });
});

test('vision cone reports a blocked scan when the actor has no facing', () => {
  const state = createGameState({ width: 3, height: 3 });
  new EntityManager(state.entities).add({ id: 'player', position: { x: 1, y: 1 } });
  const events = new EventBus();
  let blocked;
  events.on('scan.blocked', event => { blocked = event; });

  const system = new ScanSystem({ visionCone: { angle: 90 } });
  const result = system.process(scanCommand(), { state, events });

  assert.deepEqual(result, { consumesTurn: false });
  assert.equal(blocked.reason, 'no-facing');
});
