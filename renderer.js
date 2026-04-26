/**
 * renderer.js
 * All canvas drawing logic.
 */

const W = 700, H = 480, R = 30;

/** Read CSS variable from root (works in both light and dark mode) */
function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function px(node, canvasWidth) { return node.x * canvasWidth / W; }
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

  // ── Heat overlay (cat distance threat) ────────────────────────────────────
  if (phase === 'play' && copNode >= 0) {
    for (const node of nodes) {
      const d = ap[copNode][node.id];
      if (d === 0 || d === Infinity) continue;
      const alpha = Math.max(0, 0.35 - d * 0.08);
      if (alpha <= 0) continue;
      ctx.beginPath();
      ctx.arc(px(node, cw), py(node, ch), R + 10, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(186,117,23,${alpha})`;
      ctx.fill();
    }
  }

  // ── Edges ─────────────────────────────────────────────────────────────────
  ctx.strokeStyle = cssVar('--edge');
  ctx.lineWidth = 3;
  for (const [a, b] of edges) {
    ctx.beginPath();
    ctx.moveTo(px(nodes[a], cw), py(nodes[a], ch));
    ctx.lineTo(px(nodes[b], cw), py(nodes[b], ch));
    ctx.stroke();
  }

  // ── Nodes ─────────────────────────────────────────────────────────────────
  for (const node of nodes) {
    const x = px(node, cw), y = py(node, ch);
    const isCat = node.id === copNode;
    const isMouse = node.id === robberNode;
    const isMove = movable.includes(node.id) && !isCat && !isMouse;
    const isBoth = isCat && isMouse;

    let fill, stroke;

    if (isBoth) {
      fill = '#9B3892'; stroke = '#6B2465';
    } else if (isCat) {
      fill = cssVar('--cop'); stroke = cssVar('--cop-dark');
    } else if (isMouse) {
      fill = cssVar('--rob'); stroke = cssVar('--rob-dark');
    } else if (isMove) {
      fill = cssVar('--move'); stroke = cssVar('--move-dark');
    } else {
      fill = cssVar('--node-bg'); stroke = cssVar('--node-stroke');
    }

    // Draw circle
    ctx.beginPath();
    ctx.arc(x, y, R, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = (isCat || isMouse || isMove) ? 3.5 : 2;
    ctx.stroke();

    // Distance label (small, top-right corner) during play
    if (phase === 'play' && !isCat && !isMouse && copNode >= 0) {
      const d = ap[copNode][node.id];
      ctx.fillStyle = cssVar('--text-muted');
      ctx.font = '11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(d === Infinity ? '∞' : d, x + R * 0.65, y - R * 0.65);
    }

    // Node label — emoji for cat/mouse, number otherwise
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (isBoth) {
      ctx.font = `${R * 1.1}px system-ui, sans-serif`;
      ctx.fillText('💥', x, y);
    } else if (isCat) {
      ctx.font = `${R * 1.1}px system-ui, sans-serif`;
      ctx.fillText('🐱', x, y);
    } else if (isMouse) {
      ctx.font = `${R * 1.1}px system-ui, sans-serif`;
      ctx.fillText('🐭', x, y);
    } else {
      const textColor = cssVar('--text');
      ctx.fillStyle = textColor;
      ctx.font = '500 13px system-ui, sans-serif';
      ctx.fillText(String(node.id), x, y);
    }
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
    if (Math.sqrt(dx * dx + dy * dy) < R + 6) return node.id;
  }
  return -1;
}