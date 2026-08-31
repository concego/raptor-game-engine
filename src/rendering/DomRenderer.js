import { Renderer } from './Renderer.js';

function defaultSymbol(entity) {
  return entity?.symbol ?? entity?.glyph ?? String(entity?.id ?? '?').charAt(0);
}

export class DomRenderer extends Renderer {
  constructor({ symbolFor = defaultSymbol, ariaHidden = true } = {}) {
    super();
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
    const pre = document.createElement('pre');
    pre.dataset.raptorRenderer = 'dom';
    if (this.ariaHidden) pre.setAttribute('aria-hidden', 'true');

    const lines = [];
    for (let y = 0; y < height; y += 1) {
      let line = '';
      for (let x = 0; x < width; x += 1) {
        const entity = entities.find(item => item.position?.x === x && item.position?.y === y);
        line += entity ? this.symbolFor(entity) : '·';
      }
      lines.push(line);
    }
    pre.textContent = lines.join('\n');
    this.target.replaceChildren(pre);
    return pre;
  }

  destroy() {
    this.target?.replaceChildren();
    this.target = null;
  }
}
