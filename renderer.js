/**
 * renderer.js
 * All canvas drawing logic.
 */

const W = 700, H = 400, R = 22;

/** Read CSS variable from root (works in both light and dark mode) */
function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function px(node, canvasWidth)  { return node.x * canvasWidth  / W; }
function py(node, canvasHeight) { return node.y * canvasHeight / H; }

/**
 * Draw the full game state onto the canvas.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {object} state  - { nodes, edges, adj, ap, copNode, robberNode, phase, turn, winner, movable }
 */
export function render(canvas, state) {
  const ctx = canvas.getContext('2d');
  const cw = canvas.width, ch = canvas.height;
  ctx.clearRect(0, 0, cw, ch);

  const { nodes, edges, adj, ap, copNode, robberNode, phase, movable } = state;

  // ── Heat overlay (cop distance threat) ────────────────────────────────────
  if (phase === 'play' && copNode >= 0) {
    for (const node of nodes) {
      const d = ap[copNode][node.id];
      if (d === 0 || d === Infinity) continue;
      const alpha = Math.max(0, 0.35 - d * 0.08);
      if (alpha <= 0) continue;
      ctx.beginPath();
      ctx.arc(px(node, cw), py(node, ch), R + 8, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(186,117,23,${alpha})`;
      ctx.fill();
    }
  }

  // ── Edges ─────────────────────────────────────────────────────────────────
  ctx.strokeStyle = cssVar('--edge');
  ctx.lineWidth = 1.5;
  for (const [a, b] of edges) {
    ctx.beginPath();
    ctx.moveTo(px(nodes[a], cw), py(nodes[a], ch));
    ctx.lineTo(px(nodes[b], cw), py(nodes[b], ch));
    ctx.stroke();
  }

  // ── Nodes ─────────────────────────────────────────────────────────────────
  for (const node of nodes) {
    const x = px(node, cw), y = py(node, ch);
    const isCop    = node.id === copNode;
    const isRobber = node.id === robberNode;
    const isMove   = movable.includes(node.id) && !isCop && !isRobber;
    const isBoth   = isCop && isRobber;

    let fill, stroke, textColor;

    if (isBoth) {
      fill = '#9B3892'; stroke = '#6B2465'; textColor = '#fff';
    } else if (isCop) {
      fill = cssVar('--cop'); stroke = cssVar('--cop-dark'); textColor = cssVar('--cop-text');
    } else if (isRobber) {
      fill = cssVar('--rob'); stroke = cssVar('--rob-dark'); textColor = cssVar('--rob-text');
    } else if (isMove) {
      fill = cssVar('--move'); stroke = cssVar('--move-dark'); textColor = cssVar('--move-text');
    } else {
      fill = cssVar('--node-bg'); stroke = cssVar('--node-stroke'); textColor = cssVar('--text');
    }

    ctx.beginPath();
    ctx.arc(x, y, R, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = (isCop || isRobber || isMove) ? 2.5 : 1.5;
    ctx.stroke();

    // Distance label (small, top-right corner) during play
    if (phase === 'play' && !isCop && !isRobber && copNode >= 0) {
      const d = ap[copNode][node.id];
      ctx.fillStyle = cssVar('--text-muted');
      ctx.font = '10px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(d === Infinity ? '∞' : d, x + R * 0.6, y - R * 0.6);
    }

    // Node label
    ctx.fillStyle = textColor;
    ctx.font = '500 12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const label = isBoth ? '!' : isCop ? 'C' : isRobber ? 'R' : String(node.id);
    ctx.fillText(label, x, y);
  }
}

/**
 * Hit-test: returns node id under (mx, my) in canvas pixel coords, or -1.
 */
export function hitTest(mx, my, nodes, canvas) {
  const cw = canvas.width, ch = canvas.height;
  for (const node of nodes) {
    const dx = px(node, cw) - mx;
    const dy = py(node, ch) - my;
    if (Math.sqrt(dx * dx + dy * dy) < R + 5) return node.id;
  }
  return -1;
}
