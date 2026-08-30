export class Grid {
  constructor(width, height, fill = null) {
    if (!Number.isInteger(width) || width < 1) throw new TypeError('width must be a positive integer');
    if (!Number.isInteger(height) || height < 1) throw new TypeError('height must be a positive integer');
    this.width = width;
    this.height = height;
    this.#cells = Array.from({ length: height }, () => Array(width).fill(fill));
  }

  #cells;

  contains(x, y) {
    return Number.isInteger(x) && Number.isInteger(y)
      && x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  get(x, y) {
    if (!this.contains(x, y)) return undefined;
    return this.#cells[y][x];
  }

  set(x, y, value) {
    if (!this.contains(x, y)) throw new RangeError('position is outside the grid');
    this.#cells[y][x] = value;
    return value;
  }

  forEach(callback) {
    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) callback(this.get(x, y), x, y);
    }
  }
}

