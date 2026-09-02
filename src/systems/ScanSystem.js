import { COMMAND_TYPES } from '../core/Command.js';
import { FACING } from '../world/Position.js';

const FACING_ANGLES = Object.freeze({
  [FACING.NORTH]: 0,
  [FACING.EAST]: 90,
  [FACING.SOUTH]: 180,
  [FACING.WEST]: 270
});

function manhattanDistance(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function normalizeFacing(facing) {
  const value = typeof facing === 'string' ? facing.toUpperCase() : null;
  return value in FACING_ANGLES ? value : null;
}

function isInVisionCone(origin, target, direction, angle) {
  const dc = target.x - origin.x;
  const dr = target.y - origin.y;
  if (dc === 0 && dr === 0) return false;
  if (angle >= 360) return true;

  const targetAngle = ((Math.atan2(dc, -dr) * 180 / Math.PI) + 360) % 360;
  const faceAngle = FACING_ANGLES[direction];
  let difference = Math.abs(targetAngle - faceAngle);
  if (difference > 180) difference = 360 - difference;
  return difference <= angle / 2;
}

function validateRange(range) {
  if (range !== Infinity && (!Number.isInteger(range) || range < 0)) {
    throw new RangeError('scan range must be a non-negative integer or Infinity');
  }
}

function validateVisionCone(visionCone) {
  if (visionCone === null) return null;
  if (!visionCone || typeof visionCone !== 'object') {
    throw new TypeError('visionCone must be an object or null');
  }
  const angle = visionCone.angle ?? 90;
  if (typeof angle !== 'number' || !Number.isFinite(angle) || angle < 0 || angle > 360) {
    throw new RangeError('visionCone angle must be between 0 and 360 degrees');
  }
  return { angle };
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
    isVisible = () => true,
    describe = null,
    cost = null,
    consumesTurn = false,
    visionCone = null,
    getDirection = ({ actor }) => actor.direction ?? actor.facing
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
    if (typeof isVisible !== 'function') throw new TypeError('isVisible must be a function');
    if (describe !== null && typeof describe !== 'function') {
      throw new TypeError('describe must be a function or null');
    }
    if (cost != null && typeof cost !== 'function' && typeof cost !== 'boolean') {
      throw new TypeError('cost must be a function, boolean or null');
    }
    if (typeof consumesTurn !== 'boolean') throw new TypeError('consumesTurn must be a boolean');
    if (typeof getDirection !== 'function') throw new TypeError('getDirection must be a function');

    this.actorId = actorId;
    this.range = range;
    this.distance = distance === 'manhattan' ? manhattanDistance : distance;
    this.getTargets = getTargets;
    this.filter = filter;
    this.isVisible = isVisible;
    this.describe = describe;
    this.cost = cost;
    this.consumesTurn = consumesTurn;
    this.visionCone = validateVisionCone(visionCone);
    this.getDirection = getDirection;
  }

  process(command, { state, events }) {
    if (command?.type !== COMMAND_TYPES.SCAN) return;

    const actor = state.entities.get(this.actorId);
    if (!actor) throw new Error(`actor not found: ${this.actorId}`);
    const origin = { ...actor.position };
    const direction = this.visionCone
      ? normalizeFacing(this.getDirection({ state, actor, origin, events }))
      : null;

    if (this.visionCone && !direction) {
      events.emit('scan.blocked', {
        actorId: this.actorId,
        origin,
        reason: 'no-facing'
      });
      return { consumesTurn: false };
    }

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
      if (this.visionCone && !isInVisionCone(origin, entity.position, direction, this.visionCone.angle)) continue;
      if (!this.isVisible(entity, { state, actor, origin, distance, events })) continue;

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

    results.sort((a, b) => a.distance - b.distance || String(a.entityId).localeCompare(String(b.entityId)));
    const payload = {
      actorId: this.actorId,
      origin,
      range: this.range,
      results,
      ...(this.visionCone ? { visionCone: { angle: this.visionCone.angle, direction } } : {})
    };

    events.emit(results.length > 0 ? 'scan.completed' : 'scan.empty', payload);
    return { consumesTurn: this.consumesTurn };
  }
}
