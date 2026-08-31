import { EventBus } from './EventBus.js';
import { createGameState } from './GameState.js';
import { TurnManager } from './TurnManager.js';
import { EntityManager } from '../world/EntityManager.js';
import { Grid } from '../world/Grid.js';
import { MapManager } from '../world/MapManager.js';

export class Engine {
  constructor({
    width,
    height,
    seed = null,
    mapId = 'main',
    maps = null,
    systems = []
  } = {}) {
    this.events = new EventBus();
    this.state = createGameState({ width, height, seed, mapId, maps });
    this.grid = new Grid(this.state.grid.width, this.state.grid.height);
    this.entities = new EntityManager(this.state.entities);
    this.maps = new MapManager({ state: this.state, entityManager: this.entities });
    this.turns = new TurnManager({ state: this.state, events: this.events, systems });
  }

  on(type, listener) {
    return this.events.on(type, listener);
  }

  addSystem(system) {
    this.turns.addSystem(system);
    return this;
  }

  addEntity(entity, { mapId = this.state.mapId } = {}) {
    if (mapId === this.state.mapId) return this.entities.add(entity);
    return this.maps.addEntity(entity, mapId);
  }

  start() {
    this.state.phase = 'playing';
    this.events.emit('game.started', { state: this.state });
    return this;
  }

  dispatch(command) {
    return this.turns.execute(command);
  }
}
