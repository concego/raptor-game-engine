import { COMMAND_TYPES } from '../core/Command.js';
import { EntityManager } from '../world/EntityManager.js';
import { position } from '../world/Position.js';

export class MovementSystem {
  constructor({ grid, entities = null, actorId = 'player' } = {}) {
    if (!grid) throw new TypeError('grid is required');
    this.grid = grid;
    this.entities = entities;
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
        attempted: target,
        reason: 'outside-grid'
      });
      return { consumesTurn: false };
    }

    const entities = this.entities ?? new EntityManager(state.entities);
    const obstacle = entities.at(target.x, target.y, { excludeId: this.actorId })[0];
    if (obstacle) {
      events.emit('movement.blocked', {
        actorId: this.actorId,
        from: actor.position,
        attempted: target,
        reason: 'occupied',
        obstacleId: obstacle.id
      });
      return { consumesTurn: false };
    }

    const from = actor.position;
    actor.position = target;
    events.emit('movement.completed', {
      actorId: this.actorId,
      from,
      to: target
    });
    return { consumesTurn: true };
  }
}
