export class TurnManager {
  constructor({ state, events, systems = [] } = {}) {
    if (!state || !events) throw new TypeError('state and events are required');
    this.state = state;
    this.events = events;
    this.systems = [...systems];
  }

  addSystem(system) {
    if (!system || typeof system.process !== 'function') {
      throw new TypeError('system must expose process(command, context)');
    }
    this.systems.push(system);
    return this;
  }

  execute(command) {
    if (this.state.phase === 'ended') return { accepted: false, reason: 'game-ended' };

    this.state.phase = 'resolving';
    const context = { state: this.state, events: this.events };
    this.events.emit('turn.started', { turn: this.state.turn, command });

    for (const system of this.systems) {
      system.process(command, context);
    }

    this.state.turn += 1;
    this.state.phase = 'playing';
    this.events.emit('turn.completed', { turn: this.state.turn, command });
    return { accepted: true };
  }
}

