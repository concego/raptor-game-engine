export const COMMAND_TYPES = Object.freeze({
  MOVE: 'move',
  WAIT: 'wait',
  SCAN: 'scan'
});

export function moveCommand(dx, dy) {
  if (!Number.isInteger(dx) || !Number.isInteger(dy)) {
    throw new TypeError('movement deltas must be integers');
  }
  if (Math.abs(dx) + Math.abs(dy) !== 1) {
    throw new RangeError('movement must be one orthogonal step');
  }
  return { type: COMMAND_TYPES.MOVE, dx, dy };
}

export function waitCommand() {
  return { type: COMMAND_TYPES.WAIT };
}

export function scanCommand() {
  return { type: COMMAND_TYPES.SCAN };
}
