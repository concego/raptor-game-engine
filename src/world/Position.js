export const DIRECTIONS = Object.freeze({
  NORTH: Object.freeze({ dx: 0, dy: -1 }),
  EAST: Object.freeze({ dx: 1, dy: 0 }),
  SOUTH: Object.freeze({ dx: 0, dy: 1 }),
  WEST: Object.freeze({ dx: -1, dy: 0 })
});

export function position(x, y) {
  if (!Number.isInteger(x) || !Number.isInteger(y)) {
    throw new TypeError('position coordinates must be integers');
  }
  return { x, y };
}

export function addPosition(origin, delta) {
  return position(origin.x + delta.dx, origin.y + delta.dy);
}

export function samePosition(first, second) {
  return first?.x === second?.x && first?.y === second?.y;
}

