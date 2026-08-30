import { EventBus } from './EventBus.js';
import { createGameState } from './GameState.js';
import { TurnManager } from './TurnManager.js';
import { Grid } from '../world/Grid.js';

export class Engine {
  constructor({ width, height, seed = null, systems = [] } = {}) {
    this.events = new EventBus();
    this.state = createGameState({ width, height, seed });
    this.grid = new Grid(width, height);
    this.turns = new TurnManager({
      state: this.state,
      events: this.events,
      systems
    });
  }

  on(type, listener) {
    return this.events.on(type, listener);
  }

  addSystem(system) {
    this.turns.addSystem(system);
    return this;
  }

  addEntity(entity) {
    if (!entity?.id) throw new TypeError('entity.id is required');
    if (!entity.position) throw new TypeError('entity.position is required');
    this.state.entities.set(entity.id, entity);
    return entity;
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

