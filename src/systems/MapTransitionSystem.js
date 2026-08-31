import { COMMAND_TYPES } from '../core/Command.js';
import { samePosition } from '../world/Position.js';

export class MapTransitionSystem {
  constructor({ mapManager, actorId = 'player' } = {}) {
    if (!mapManager) throw new TypeError('mapManager is required');
    this.mapManager = mapManager;
    this.actorId = actorId;
  }

  process(command, { state, events }) {
    if (command?.type !== COMMAND_TYPES.MOVE) return;

    const actor = state.entities.get(this.actorId);
    if (!actor) throw new Error(`actor not found: ${this.actorId}`);

    const portal = [...state.entities.values()].find(entity =>
      entity.id !== this.actorId
      && entity.portal
      && samePosition(entity.position, actor.position)
    );
    if (!portal) return;

    const { toMapId, toPosition } = portal.portal;
    const fromMapId = state.mapId;
    const fromPosition = { ...actor.position };

    try {
      this.mapManager.transferEntity({
        entityId: this.actorId,
        toMapId,
        toPosition
      });
    } catch (error) {
      events.emit('map.transition.blocked', {
        actorId: this.actorId,
        portalId: portal.id,
        fromMapId,
        toMapId,
        reason: error.message
      });
      return { consumesTurn: true };
    }

    events.emit('map.transitioned', {
      actorId: this.actorId,
      portalId: portal.id,
      fromMapId,
      toMapId,
      from: fromPosition,
      to: { ...toPosition }
    });
    return { consumesTurn: true };
  }
}

