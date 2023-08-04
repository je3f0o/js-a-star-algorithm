import {Node} from './node.js';
import AStar from './a_star.js';
import Vector2d from './vector_2d.js';

const canvas = document.querySelector('canvas');
const ctx    = canvas.getContext('2d');
const a_star = new AStar();
const TAU    = Math.PI*2;
const offset = 20;
const scaler = 35;
const radius = 10;
const brush_radius = 30;

let mouse_pos;

const node_to_pixel_position = node => {
  const {x, y} = node.position;
  return new Vector2d(x*scaler+offset, y*scaler+offset);
};

const get_node = (x, y) => {
  const ix  = Math.round(Math.max(0, x - offset) / scaler);
  const iy  = Math.round(Math.max(0, y - offset) / scaler);
  const key = a_star.get_key(ix, iy);
  return a_star.nodes.get(key);
};

const get_nodes_from_mouse = () => {
  const nodes = [];
  const mouse_node = get_node(mouse_pos.x, mouse_pos.y);
  if (!mouse_node) return nodes;

  for (let x = -1; x <= 1; ++x) {
    for (let y = -1; y <= 1; ++y) {
      if (x == 0 && y == 0) continue;
      const edge_x = mouse_node.position.x + x;
      const edge_y = mouse_node.position.y + y;
      const key  = a_star.get_key(edge_x, edge_y);
      const neighbour = a_star.nodes.get(key);
      if (!neighbour) continue;
      
      let p = node_to_pixel_position(neighbour);
      p = Vector2d.sub(mouse_pos, p);
      if (p.length() - brush_radius <= 0) {
        nodes.push(neighbour);
      }
    }
  }

  return nodes;
};

let frame_counter = 0;
const update = () => {
  frame_counter += 1;
  if (frame_counter % 1 === 0) {
    a_star.step();
  }
};

const render = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // rendering paths
  if (a_star.path) {
    let shortest_path;
    ctx.beginPath();
    ctx.strokeStyle = "skyblue";
    ctx.lineWidth = 1;
    a_star.path.depth_first_search(leaf => {
      if (leaf.is_shortest_path) {
        shortest_path = leaf;
        return;
      }
      const from = node_to_pixel_position(leaf.node);
      ctx.moveTo(from.x, from.y);
  
      let parent = leaf.parent;
      while (parent) {
        const to = node_to_pixel_position(parent.node);
        ctx.lineTo(to.x, to.y);
        parent = parent.parent;
      }
    });
    ctx.stroke();

    if (shortest_path) {
      ctx.beginPath();
      ctx.strokeStyle = "yellow";
      ctx.lineWidth = 5;
      const from = node_to_pixel_position(shortest_path.node);
      ctx.moveTo(from.x, from.y);
  
      let parent = shortest_path.parent;
      while (parent) {
        const to = node_to_pixel_position(parent.node);
        ctx.lineTo(to.x, to.y);
        parent = parent.parent;
      }
      ctx.stroke();
    }
  }

  // rendering nodes
  for (const [, node] of a_star.nodes) {
    ctx.beginPath();
    const p = node_to_pixel_position(node);
    ctx.arc(p.x, p.y, radius, 0, TAU);

    switch (node.type) {
      case Node.TYPE_EMPTY:
        if (a_star.visited_nodes.has(node)) {
          ctx.fillStyle = "green";
        } else if (a_star.next_nodes.has(node)) {
          ctx.fillStyle = "#009688";
        } else {
          ctx.fillStyle = "white";
        }
        break;
      case Node.TYPE_OBSTACLE:
        ctx.fillStyle = "brown";
        break;
      case Node.TYPE_START:
        ctx.fillStyle = "red";
        break;
      case Node.TYPE_TARGET:
        ctx.fillStyle = "blue";
        break;
      case Node.TYPE_CURRENT:
        ctx.fillStyle = "purple";
        break;
      default:
        const msg = `invalid node type: ${node.type}`;
        console.assert(false, msg);
    }

    ctx.fill();
  }

  // mouse brush
  if (mouse_pos) {
    ctx.beginPath();
    ctx.arc(mouse_pos.x, mouse_pos.y, brush_radius, 0, TAU);
    ctx.fillStyle = "rgba(255,255, 0, 0.5)";
    ctx.fill();
  }
};

const game_loop = () => {
  update();
  render();
  requestAnimationFrame(game_loop);
};

const on_resize = () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
};
addEventListener("resize", on_resize);
on_resize();

window.get_node = get_node;

const update_mouse = e => {
  if (e.ctrlKey) {
    const node = get_node(e.pageX, e.pageY);
    if (node) {
      node.type = Node.TYPE_START;
      a_star.update_key("start_node_key", node);
    }
  } else if (e.altKey) {
    const node = get_node(e.pageX, e.pageY);
    if (node) {
      node.type = Node.TYPE_TARGET;
      a_star.update_key("target_node_key", node);
    }
  } else {
    mouse_pos = new Vector2d(e.pageX, e.pageY);
    const nodes = get_nodes_from_mouse();
    for (const node of nodes) {
      node.type = Node[e.shiftKey ? "TYPE_EMPTY" : "TYPE_OBSTACLE"];
    }
  }

  localStorage.setItem("map", a_star.serialize());
}

// TODO: fix bugs
addEventListener("mousedown", e => {
  update_mouse(e);

  const on_mousemove = e => update_mouse(e);
  const on_mouseup = e => {
    mouse_pos = null;
    removeEventListener("mousemove", on_mousemove);
    removeEventListener("mouseup", on_mouseup);
  };
  addEventListener("mousemove", on_mousemove);
  addEventListener("mouseup", on_mouseup);
});

const value = localStorage.getItem("map");
if (value) {
  a_star.init_from_json(JSON.parse(value));
} else {
  a_star.init(20, 20);
}

console.log(a_star);
requestAnimationFrame(game_loop);