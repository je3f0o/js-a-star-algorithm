import Vector2d from './vector_2d.js';

export class Edge {
  constructor(node, distance) {
    // const ab = Vector2d.sub(a.position, b.position);
    this.node     = node;
    this.distance = distance;
  }
}

export class Node {
  constructor(type, position) {
    console.assert(type >= 0 && type < Node.TYPE_MAX, "Node: invalid type");
    console.assert(position instanceof Vector2d, "Node: position is not instance of a Vector2d");
    this.type     = type;
    this.position = position;
    this.edges    = [];
  }

  get_key() {
    return `x:${this.position.x}, y:${this.position.y}`;
  }

  static get TYPE_EMPTY() { return 0; }
  static get TYPE_OBSTACLE() { return 1; }
  static get TYPE_START() { return 2; }
  static get TYPE_TARGET() { return 3; }
  static get TYPE_CURRENT() {return 4; }
  static get TYPE_MAX() { return 5; }
}