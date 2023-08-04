
export default class Vector2d {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  dot() {
    return this.x*this.x + this.y*this.y;
  }

  length() {
    return Math.sqrt(this.dot());
  }

  static sub(a, b) {
    return new Vector2d(a.x - b.x, a.y - b.y);
  }

  static distance(a, b) {
    return Vector2d.sub(a, b).length();
  }
}