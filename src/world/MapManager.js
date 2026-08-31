import { EntityManager } from './EntityManager.js';
import { samePosition } from './Position.js';

function isInside(map, target) {
  return target
    && Number.isInteger(target.x)
    && Number.isInteger(target.y)
    && target.x >= 0
    && target.y >= 0
    && target.x < map.grid.width
    && target.y < map.grid.height;
}

export class MapManager {
  constructor({ state, entityManager = null } = {}) {
    if (!state?.maps || !(state.maps instanceof Map)) {
      throw new TypeError('state with maps is required');
    }
    this.state = state;
    this.entityManager = entityManager;
  }

  get(mapId) {
    const map = this.state.maps.get(mapId);
    if (!map) throw new Error(`map not found: ${mapId}`);
    return map;
  }

  addEntity(entity, mapId = this.state.mapId) {
    const map = this.get(mapId);
    return new EntityManager(map.entities).add(entity);
  }

  transferEntity({ entityId, toMapId, toPosition } = {}) {
    const sourceMap = this.get(this.state.mapId);
    const destinationMap = this.get(toMapId);
    const entity = sourceMap.entities.get(entityId);

    if (!entity) throw new Error(`entity not found: ${entityId}`);
    if (!isInside(destinationMap, toPosition)) {
      throw new RangeError(`destination is outside map: ${toMapId}`);
    }

    const blocker = [...destinationMap.entities.values()].find(candidate =>
      candidate.id !== entityId
      && candidate.blocksMovement !== false
      && samePosition(candidate.position, toPosition)
    );
    if (blocker) {
      throw new Error(`destination is occupied: ${blocker.id}`);
    }

    sourceMap.entities.delete(entityId);
    entity.position = { ...toPosition };
    destinationMap.entities.set(entityId, entity);
    this.state.mapId = toMapId;
    this.state.grid = destinationMap.grid;
    this.state.entities = destinationMap.entities;
    if (typeof this.entityManager?.setCollection === 'function') {
      this.entityManager.setCollection(destinationMap.entities);
    } else if (this.entityManager) {
      this.entityManager.entities = destinationMap.entities;
    }

    return entity;
  }
}
