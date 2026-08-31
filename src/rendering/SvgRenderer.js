import { Renderer } from './Renderer.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

function defaultSymbol(entity) {
  return entity?.symbol ?? entity?.glyph ?? String(entity?.id ?? '?').charAt(0);
}

export class SvgRenderer extends Renderer {
  constructor({ cellSize = 32, symbolFor = defaultSymbol, ariaHidden = true } = {}) {
    super();
    if (!Number.isInteger(cellSize) || cellSize < 1) {
      throw new TypeError('cellSize must be a positive integer');
    }
    this.cellSize = cellSize;
    this.symbolFor = symbolFor;
    this.ariaHidden = ariaHidden;
    this.target = null;
  }

  mount(target) {
    if (!target || typeof target.replaceChildren !== 'function') {
      throw new TypeError('target must be a DOM element');
    }
    this.target = target;
    return this;
  }

  render(state) {
    if (!this.target) throw new Error('renderer is not mounted');
    const { width, height } = state?.grid ?? {};
    if (!Number.isInteger(width) || !Number.isInteger(height)) {
      throw new TypeError('state.grid must contain width and height');
    }

    const entities = state.entities instanceof Map
      ? [...state.entities.values()]
      : [];
    const svg = document.createElementNS(SVG_NS, 'svg');
    const totalWidth = width * this.cellSize;
    const totalHeight = height * this.cellSize;
    svg.setAttribute('viewBox', `0 0 ${totalWidth} ${totalHeight}`);
    svg.setAttribute('width', totalWidth);
    svg.setAttribute('height', totalHeight);
    svg.setAttribute('data-raptor-renderer', 'svg');
    if (this.ariaHidden) svg.setAttribute('aria-hidden', 'true');

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const cell = document.createElementNS(SVG_NS, 'rect');
        cell.setAttribute('x', x * this.cellSize);
        cell.setAttribute('y', y * this.cellSize);
        cell.setAttribute('width', this.cellSize);
        cell.setAttribute('height', this.cellSize);
        cell.setAttribute('fill', 'transparent');
        cell.setAttribute('stroke', 'currentColor');
        svg.append(cell);
      }
    }

    for (const entity of entities) {
      const { x, y } = entity.position ?? {};
      if (!Number.isInteger(x) || !Number.isInteger(y)) continue;
      const label = document.createElementNS(SVG_NS, 'text');
      label.setAttribute('x', (x + 0.5) * this.cellSize);
      label.setAttribute('y', (y + 0.5) * this.cellSize);
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('dominant-baseline', 'central');
      label.setAttribute('font-size', this.cellSize * 0.6);
      label.textContent = this.symbolFor(entity);
      svg.append(label);
    }

    this.target.replaceChildren(svg);
    return svg;
  }

  destroy() {
    this.target?.replaceChildren();
    this.target = null;
  }
}

