import Vector2d from './vector_2d.js';
import {Node, Edge} from './node.js';
import {TreeNode} from './tree_node.js';

let current_node;
let target_node;

const get_key = (x, y) => `x:${x}, y:${y}`;
const get_distance = (a, b) => {
  return Vector2d.distance(a.position, b.position);
}

let to_update = true;

export default class AStar {
  constructor() {
    this.nodes           = new Map();
    this.next_nodes      = new Set();
    this.visited_nodes   = new Set();
    this.start_node_key  = null;
    this.target_node_key = null;
    this.current_node    = null;
    this.target_node     = null;
    this.edge_index      = -1;
    this.path            = null;
    this.best            = {distance: Infinity};
    this.is_finished     = false;
  }

  init(width, height) {
    const nodes = new Map();
    for (let x = 0; x < width; ++x) {
      for (let y = 0; y < height; ++y) {
        const pos  = new Vector2d(x, y);
        const node = new Node(Node.TYPE_EMPTY, pos);
        nodes.set(get_key(x, y), node);
      }
    }

    for (const [, node] of nodes) {
      for (let i = -1; i <= 1; ++i) {
        for (let j = -1; j <= 1; ++j) {
          if (i == 0 && j == 0) continue;
          const x = node.position.x + i;
          const y = node.position.y + j;
          const neighbour = nodes.get(get_key(x, y));
          if (neighbour) node.edges.push(neighbour);
        }
      }
    }

    this.nodes = nodes;
  }

  init_from_json(data) {
    this.nodes = new Map();
    for (const [k, n] of Object.entries(data.nodes_map)) {
      const pos  = new Vector2d(n.position.x , n.position.y);
      const node = new Node(n.type, pos);
      this.nodes.set(k, node);
      switch (n.type) {
        case Node.TYPE_START:
          this.start_node_key = node.get_key();
          break;
        case Node.TYPE_TARGET:
          this.target_node_key = node.get_key();
          break;
        case Node.TYPE_NEXT:
        case Node.TYPE_VISITED:
        case Node.TYPE_CURRENT:
          node.type = Node.TYPE_EMPTY;
          break;
      }
    }

    for (const [key, n] of Object.entries(data.nodes_map)) {
      const node = this.nodes.get(key);
      for (const neighbour_key of n.edges) {
        node.edges.push(this.nodes.get(neighbour_key));
      }
    }
  }

  update_key(key, node) {
    const old_key  = this[key];
    const old_node = this.nodes.get(old_key);
    if (old_node && old_node !== node) {
      old_node.type = Node.TYPE_EMPTY;
    }
    this[key] = node.get_key();
  }

  step() {
    const is_solvable = (
      !this.is_finished &&
      !!this.start_node_key &&
      !!this.target_node_key
    )
    if (!is_solvable) return;

    if (!this.current_node) {
      this.current_node = this.nodes.get(this.start_node_key);
      this.path         = new TreeNode(this.current_node);
      this.tree_node    = this.path;
      this.visited_nodes.add(this.current_node);
    }
    if (this.edge_index < 0) {
      this.edge_index = 0;
    } else {
      this.edge_index += 1;
      if (this.edge_index === this.current_node.edges.length) {
        if (this.current_node.type !== Node.TYPE_START) {
          this.current_node.type = Node.TYPE_EMPTY;
          this.visited_nodes.add(this.current_node);
        }

        this.path.depth_first_search(leaf => {
          if (this.visited_nodes.has(leaf.node)) return;
          if (this.best.distance === Infinity &&
              leaf.node === this.current_node) return;
    
          const target = this.nodes.get(this.target_node_key);
          const d2 = get_distance(leaf.node, target);
          if (d2 === 0) {
            leaf.is_shortest_path  = true;
            this.current_node.type = Node.TYPE_EMPTY;
            this.is_finished = true;
            return;
          }
    
          const distance = leaf.distance + d2;
          if (distance <= this.best.distance) {
            this.best.branch   = leaf;
            this.best.distance = distance;
          }
        });
        if (this.is_finished) return;

        this.tree_node         = this.best.branch;
        this.current_node      = this.best.branch.node;
        this.current_node.type = Node.TYPE_CURRENT;
        this.edge_index        = -1;
        this.best              = {distance: Infinity};
        return;
      }
    }

    const neighbour = this.current_node.edges[this.edge_index];
    const is_moveable = !(
      neighbour.type === Node.TYPE_OBSTACLE ||
      this.visited_nodes.has(neighbour)
    );
    if (!is_moveable) return;

    const branch = new TreeNode(neighbour, this.tree_node);
    this.tree_node.branches.push(branch);
    this.next_nodes.add(neighbour);
  }
  
  solve() {
    // TODO: implement
  }

  get_key(x, y) { return `x:${x}, y:${y}`; }

  serialize() {
    const nodes_map = {};
    for (const [k, v] of this.nodes) {
      nodes_map[k] = {
        type     : v.type,
        position : v.position,
        edges    : v.edges.map(e => e.get_key()),
      };
    }
    return JSON.stringify({
      nodes_map,
      // TODO: other props
    });
  }
}