import { COMMAND_TYPES } from './Command.js';

const VALID_COMMAND_TYPES = new Set(Object.values(COMMAND_TYPES));

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
    if (this.state.phase !== 'playing') {
      return { accepted: false, reason: 'invalid-phase', phase: this.state.phase };
    }
    if (!command || typeof command !== 'object' || typeof command.type !== 'string') {
      return { accepted: false, reason: 'invalid-command' };
    }
    if (!VALID_COMMAND_TYPES.has(command.type)) {
      return { accepted: false, reason: 'unknown-command', type: command.type };
    }

    this.state.phase = 'resolving';
    const context = { state: this.state, events: this.events };
    const results = [];

    try {
      this.events.emit('turn.started', { turn: this.state.turn, command });

      for (const system of this.systems) {
        results.push(system.process(command, context));
      }

      const consumedTurn = results.every(result => result?.consumesTurn !== false);
      if (consumedTurn) {
        this.state.turn += 1;
        this.events.emit('turn.completed', { turn: this.state.turn, command });
      } else {
        this.events.emit('turn.skipped', { turn: this.state.turn, command });
      }

      return { accepted: true, consumedTurn };
    } catch (error) {
      this.events.emit('turn.failed', { turn: this.state.turn, command, error });
      return { accepted: false, reason: 'turn-failed', error };
    } finally {
      if (this.state.phase === 'resolving') this.state.phase = 'playing';
    }
  }
}
