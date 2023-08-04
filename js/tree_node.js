import Vector2d from "./vector_2d.js";

export class TreeNode {
  constructor(node, parent = null) {
    let distance = 0;
    if (parent) {
      const a = node.position;
      const b = parent.node.position;
      distance = parent.distance + Vector2d.distance(a, b);
    }

    this.node     = node;
    this.parent   = parent;
    this.distance = distance;
    this.branches = [];
  }

  get is_root() { return !this.parent; }
  get is_leaf() { return !this.branches.length; }

  depth_first_search(callback) {
    if (this.is_leaf) {
      callback(this);
    } else {
      for (const b of this.branches) {
        b.depth_first_search(callback);
      }
    }
  }
}