export function createPortal({
  id,
  position,
  toMapId,
  toPosition,
  label = 'portal'
} = {}) {
  if (!id) throw new TypeError('portal.id is required');
  if (!position || !Number.isInteger(position.x) || !Number.isInteger(position.y)) {
    throw new TypeError('portal.position coordinates must be integers');
  }
  if (typeof toMapId !== 'string' || toMapId.length === 0) {
    throw new TypeError('portal.toMapId must be a non-empty string');
  }
  if (!toPosition || !Number.isInteger(toPosition.x) || !Number.isInteger(toPosition.y)) {
    throw new TypeError('portal.toPosition coordinates must be integers');
  }

  return {
    id,
    kind: 'portal',
    label,
    position: { ...position },
    blocksMovement: false,
    portal: {
      toMapId,
      toPosition: { ...toPosition }
    }
  };
}

