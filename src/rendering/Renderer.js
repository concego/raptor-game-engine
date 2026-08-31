/**
 * Base contract for visual renderers.
 *
 * Renderers are adapters: they present GameState but do not own game rules.
 */
export class Renderer {
  mount(_target) {
    throw new Error('Renderer.mount(target) must be implemented');
  }

  render(_state) {
    throw new Error('Renderer.render(state) must be implemented');
  }

  destroy() {
    throw new Error('Renderer.destroy() must be implemented');
  }
}

