export class KeyboardInput {
  constructor({ bindings = {}, dispatch } = {}) {
    if (typeof dispatch !== 'function') {
      throw new TypeError('dispatch must be a function');
    }
    this.dispatch = dispatch;
    this.bindings = new Map();
    this.target = null;
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.setBindings(bindings);
  }

  setBindings(bindings) {
    if (!bindings || typeof bindings !== 'object') {
      throw new TypeError('bindings must be an object');
    }
    this.bindings = new Map(Object.entries(bindings));
    return this;
  }

  bind(key, commandOrFactory) {
    if (typeof key !== 'string' || key.length === 0) {
      throw new TypeError('key must be a non-empty string');
    }
    if (typeof commandOrFactory !== 'function' && !commandOrFactory) {
      throw new TypeError('binding must be a command or factory function');
    }
    this.bindings.set(key, commandOrFactory);
    return this;
  }

  unbind(key) {
    this.bindings.delete(key);
    return this;
  }

  attach(target) {
    if (!target || typeof target.addEventListener !== 'function') {
      throw new TypeError('target must support addEventListener');
    }
    this.detach();
    this.target = target;
    this.target.addEventListener('keydown', this.handleKeyDown);
    return this;
  }

  detach() {
    if (this.target && typeof this.target.removeEventListener === 'function') {
      this.target.removeEventListener('keydown', this.handleKeyDown);
    }
    this.target = null;
    return this;
  }

  handleKeyDown(event) {
    const binding = this.bindings.get(event.key) ?? this.bindings.get(event.code);
    if (binding === undefined) return null;

    const command = typeof binding === 'function' ? binding(event) : binding;
    if (!command) return null;

    event.preventDefault?.();
    this.dispatch(command, event);
    return command;
  }
}

