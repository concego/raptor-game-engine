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
    const grid = state.grid ?? this.grid;
    const contains = typeof grid.contains === 'function'
      ? grid.contains(target.x, target.y)
      : target.x >= 0
        && target.y >= 0
        && target.x < grid.width
        && target.y < grid.height;

    if (!contains) {
      events.emit('movement.blocked', {
        actorId: this.actorId,
        from: actor.position,
        attempted: target,
        reason: 'outside-grid'
      });
      return { consumesTurn: false };
    }

    const entities = this.entities ?? new EntityManager(state.entities);
    if (entities.entities !== state.entities) entities.setCollection(state.entities);
    const obstacle = entities
      .at(target.x, target.y, { excludeId: this.actorId })
      .find(entity => entity.blocksMovement !== false);
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
    if (typeof entities.updatePosition === 'function') {
      entities.updatePosition(this.actorId, target);
    } else {
      actor.position = target;
    }
    events.emit('movement.completed', {
      actorId: this.actorId,
      from,
      to: target
    });
    return { consumesTurn: true };
  }
}
