import { COMMAND_TYPES } from '../core/Command.js';
import { position } from '../world/Position.js';

export class MovementSystem {
  constructor({ grid, actorId = 'player' } = {}) {
    if (!grid) throw new TypeError('grid is required');
    this.grid = grid;
    this.actorId = actorId;
  }

  process(command, { state, events }) {
    if (command?.type !== COMMAND_TYPES.MOVE) return;

    const actor = state.entities.get(this.actorId);
    if (!actor) throw new Error(`actor not found: ${this.actorId}`);

    const target = position(
      actor.position.x + command.dx,
      actor.position.y + command.dy
    );

    if (!this.grid.contains(target.x, target.y)) {
      events.emit('movement.blocked', {
        actorId: this.actorId,
        from: actor.position,
        attempted: target
      });
      return;
    }

    const from = actor.position;
    actor.position = target;
    events.emit('movement.completed', {
      actorId: this.actorId,
      from,
      to: target
    });
  }
}

