import test from 'node:test';
import assert from 'node:assert/strict';
import { DomRenderer, Renderer, SvgRenderer } from '../src/index.js';

test('Renderer exposes the adapter lifecycle contract', () => {
  const renderer = new Renderer();

  assert.throws(() => renderer.mount(null), /mount\(target\) must be implemented/);
  assert.throws(() => renderer.render({}), /render\(state\) must be implemented/);
  assert.throws(() => renderer.destroy(), /destroy\(\) must be implemented/);
});

test('DOM and SVG renderers implement the shared contract', () => {
  assert.ok(new DomRenderer() instanceof Renderer);
  assert.ok(new SvgRenderer() instanceof Renderer);
  assert.throws(() => new SvgRenderer({ cellSize: 0 }), /cellSize must be a positive integer/);
});

