import { samePosition } from './Position.js';

export class EntityManager {
  constructor(entities = new Map()) {
    this.setCollection(entities);
  }

  setCollection(entities) {
    if (!(entities instanceof Map)) throw new TypeError('entities must be a Map');
    this.entities = entities;
    return this;
  }

  add(entity) {
    if (!entity?.id) throw new TypeError('entity.id is required');
    if (!entity.position) throw new TypeError('entity.position is required');
    if (!Number.isInteger(entity.position.x) || !Number.isInteger(entity.position.y)) {
      throw new TypeError('entity position coordinates must be integers');
    }
    if (this.entities.has(entity.id)) {
      throw new Error(`entity already exists: ${entity.id}`);
    }
    this.entities.set(entity.id, entity);
    return entity;
  }

  get(id) {
    return this.entities.get(id);
  }

  remove(id) {
    return this.entities.delete(id);
  }

  at(x, y, { excludeId = null } = {}) {
    const target = { x, y };
    return [...this.entities.values()].filter(entity =>
      entity.id !== excludeId && samePosition(entity.position, target)
    );
  }

  isOccupied(x, y, options = {}) {
    return this.at(x, y, options).length > 0;
  }
}
