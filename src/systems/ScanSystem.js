import { COMMAND_TYPES } from '../core/Command.js';

function manhattanDistance(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function validateRange(range) {
  if (range !== Infinity && (!Number.isInteger(range) || range < 0)) {
    throw new RangeError('scan range must be a non-negative integer or Infinity');
  }
}

function resolveCost(cost, context) {
  if (cost == null) return { allowed: true };
  const result = typeof cost === 'function' ? cost(context) : cost;
  if (result === false) return { allowed: false, reason: 'cost-unavailable' };
  if (result === true || result == null) return { allowed: true };
  if (typeof result !== 'object') {
    throw new TypeError('scan cost must return a boolean or result object');
  }
  return {
    allowed: result.allowed !== false,
    reason: result.reason ?? 'cost-unavailable'
  };
}

export class ScanSystem {
  constructor({
    actorId = 'player',
    range = 5,
    distance = 'manhattan',
    getTargets = ({ state }) => state.entities.values(),
    filter = entity => entity.scanable !== false,
    describe = null,
    cost = null,
    consumesTurn = false
  } = {}) {
    if (typeof actorId !== 'string' || actorId.length === 0) {
      throw new TypeError('actorId must be a non-empty string');
    }
    validateRange(range);
    if (distance !== 'manhattan' && typeof distance !== 'function') {
      throw new TypeError("distance must be 'manhattan' or a function");
    }
    if (typeof getTargets !== 'function') throw new TypeError('getTargets must be a function');
    if (typeof filter !== 'function') throw new TypeError('filter must be a function');
    if (describe !== null && typeof describe !== 'function') {
      throw new TypeError('describe must be a function or null');
    }
    if (cost !== null && typeof cost !== 'function' && typeof cost !== 'boolean') {
      throw new TypeError('cost must be a function, boolean or null');
    }
    if (typeof consumesTurn !== 'boolean') throw new TypeError('consumesTurn must be a boolean');

    this.actorId = actorId;
    this.range = range;
    this.distance = distance === 'manhattan' ? manhattanDistance : distance;
    this.getTargets = getTargets;
    this.filter = filter;
    this.describe = describe;
    this.cost = cost;
    this.consumesTurn = consumesTurn;
  }

  process(command, { state, events }) {
    if (command?.type !== COMMAND_TYPES.SCAN) return;

    const actor = state.entities.get(this.actorId);
    if (!actor) throw new Error(`actor not found: ${this.actorId}`);
    const origin = { ...actor.position };
    const cost = resolveCost(this.cost, { state, actor, origin, events });

    if (!cost.allowed) {
      events.emit('scan.blocked', {
        actorId: this.actorId,
        origin,
        reason: cost.reason
      });
      return { consumesTurn: false };
    }

    const targets = this.getTargets({ state, actor, origin, events });
    if (!targets || typeof targets[Symbol.iterator] !== 'function') {
      throw new TypeError('getTargets must return an iterable');
    }

    const results = [];
    for (const entity of targets) {
      if (!entity?.position || entity.id === this.actorId) continue;
      if (!this.filter(entity, { state, actor, origin, events })) continue;

      const distance = this.distance(origin, entity.position, { state, actor, entity });
      if (!Number.isFinite(distance) || distance < 0 || distance > this.range) continue;

      const result = {
        entityId: entity.id,
        position: { ...entity.position },
        offset: {
          x: entity.position.x - origin.x,
          y: entity.position.y - origin.y
        },
        distance
      };
      const description = this.describe?.(entity, { state, actor, origin, distance, events });
      results.push(description && typeof description === 'object'
        ? { ...result, ...description }
        : result);
    }

    results.sort((a, b) => a.distance - b.distance || a.entityId.localeCompare(b.entityId));
    const payload = {
      actorId: this.actorId,
      origin,
      range: this.range,
      results
    };

    events.emit(results.length > 0 ? 'scan.completed' : 'scan.empty', payload);
    return { consumesTurn: this.consumesTurn };
  }
}

