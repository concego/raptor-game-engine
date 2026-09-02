import { samePosition } from './Position.js';

const positionKey = (x, y) => `${x},${y}`;

export class EntityManager {
  #occupancy = new Map();

  constructor(entities = new Map()) {
    this.setCollection(entities);
  }

  setCollection(entities) {
    if (!(entities instanceof Map)) throw new TypeError('entities must be a Map');
    this.entities = entities;
    this.#occupancy = new Map();
    for (const entity of entities.values()) {
      if (entity?.position
        && Number.isInteger(entity.position.x)
        && Number.isInteger(entity.position.y)) {
        this.#indexEntity(entity);
      }
    }
    return this;
  }

  #indexEntity(entity) {
    const key = positionKey(entity.position.x, entity.position.y);
    let bucket = this.#occupancy.get(key);
    if (!bucket) {
      bucket = new Set();
      this.#occupancy.set(key, bucket);
    }
    bucket.add(entity.id);
  }

  #unindexEntity(entity) {
    const key = positionKey(entity.position.x, entity.position.y);
    const bucket = this.#occupancy.get(key);
    if (!bucket) return;
    bucket.delete(entity.id);
    if (bucket.size === 0) this.#occupancy.delete(key);
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
    this.#indexEntity(entity);
    return entity;
  }

  get(id) {
    return this.entities.get(id);
  }

  remove(id) {
    const entity = this.entities.get(id);
    if (!entity) return false;
    this.#unindexEntity(entity);
    return this.entities.delete(id);
  }

  updatePosition(id, nextPosition) {
    if (!nextPosition
      || !Number.isInteger(nextPosition.x)
      || !Number.isInteger(nextPosition.y)) {
      throw new TypeError('entity position coordinates must be integers');
    }
    const entity = this.entities.get(id);
    if (!entity) throw new Error(`entity not found: ${id}`);
    this.#unindexEntity(entity);
    entity.position = { x: nextPosition.x, y: nextPosition.y };
    this.#indexEntity(entity);
    return entity;
  }

  at(x, y, { excludeId = null } = {}) {
    const bucket = this.#occupancy.get(positionKey(x, y));
    if (!bucket) return [];
    return [...bucket]
      .filter(id => id !== excludeId)
      .map(id => this.entities.get(id))
      .filter(entity => entity && samePosition(entity.position, { x, y }));
  }

  isOccupied(x, y, options = {}) {
    return this.at(x, y, options).length > 0;
  }
}
