/**
 * main.js
 * Game state machine and event wiring.
 * Imports: graph.js, renderer.js
 */

import { NODES, EDGES, buildAdjacency } from './graph.js';
import { allPairs } from './ai.js';
import { render, hitTest } from './renderer.js';

// ── Graph setup ──────────────────────────────────────────────────────────────

const adj = buildAdjacency(NODES, EDGES);
const ap = allPairs(adj);

// ── Game state ───────────────────────────────────────────────────────────────

/** @type {'place_cat'|'place_mouse'|'play'|'done'} */
let phase = 'place_cat';
let catNode = -1;
let mouseNode = -1;
/** @type {'cat'|'mouse'} */
let turn = 'cat';
let winner = null;

// ── DOM refs ─────────────────────────────────────────────────────────────────

const canvas = /** @type {HTMLCanvasElement} */ (document.getElementById('c'));
const logEl = document.getElementById('log');
const statusEl = document.getElementById('status');

// ── Helpers ──────────────────────────────────────────────────────────────────

function setLog(html) { logEl.innerHTML = html; }
function setStatus(html) { statusEl.innerHTML = html; }

function getMovable() {
  if (winner) return [];
  if (phase === 'place_cat') return NODES.map(n => n.id);
  if (phase === 'place_mouse') return NODES.map(n => n.id).filter(i => i !== catNode);
  if (phase === 'play') {
    return turn === 'cat'
      ? [catNode, ...adj[catNode]]
      : [mouseNode, ...adj[mouseNode]];
  }
  return [];
}

function draw() {
  render(canvas, {
    nodes: NODES, edges: EDGES, adj, ap,
    copNode: catNode, robberNode: mouseNode,
    phase, turn, winner,
    movable: getMovable(),
  });
}

function updateUI() {
  draw();
}

// ── State transitions ─────────────────────────────────────────────────────────

function placeCat(n) {
  catNode = n;
  phase = 'place_mouse';
  setLog(`Cat placed on node <strong>${n}</strong>. Click any other node to place the mouse.`);
  setStatus('Place <strong>Mouse</strong>');
}

function placeMouse(n) {
  if (n === catNode) { setLog('Choose a different node for the mouse.'); return; }
  mouseNode = n;
  phase = 'play';
  turn = 'cat';
  setLog(`Mouse placed on node <strong>${n}</strong>. Cat moves first — click a green node.`);
  setStatus("Cat's turn");
}

function moveCat(n) {
  catNode = n;
  if (catNode === mouseNode) { endGame(); return; }
  turn = 'mouse';
  setLog(`Cat → <strong>${n}</strong>. Mouse's turn — click a green node.`);
  setStatus("Mouse's turn");
}

function moveMouse(n) {
  mouseNode = n;
  if (catNode === mouseNode) { endGame(); return; }
  turn = 'cat';
  setLog(`Mouse → <strong>${n}</strong>. Cat's turn.`);
  setStatus("Cat's turn");
}

function endGame() {
  winner = 'cat';
  phase = 'done';
  setLog('🎉 <strong>Cat catches the mouse!</strong> Cat wins — this chordal graph always has a 1-cat winning strategy.');
  setStatus('<strong>Cat wins!</strong>');
  updateUI();
}

// ── Click handler ─────────────────────────────────────────────────────────────

function handleNodeClick(n) {
  if (phase === 'place_cat') { placeCat(n); updateUI(); return; }
  if (phase === 'place_mouse') { placeMouse(n); updateUI(); return; }
  if (phase !== 'play' || winner) return;

  const movable = getMovable();
  if (!movable.includes(n)) { setLog('Not a valid move. Click a highlighted (green) node.'); return; }

  if (turn === 'cat') moveCat(n);
  else moveMouse(n);
  updateUI();
}

canvas.addEventListener('click', e => {
  if (winner) return;
  const rect = canvas.getBoundingClientRect();
  const sx = canvas.width / rect.width;
  const sy = canvas.height / rect.height;
  const mx = (e.clientX - rect.left) * sx;
  const my = (e.clientY - rect.top) * sy;
  const n = hitTest(mx, my, NODES, canvas);
  if (n < 0) return;
  handleNodeClick(n);
});

// ── Reset ─────────────────────────────────────────────────────────────────────

function resetGame() {
  phase = 'place_cat'; catNode = -1; mouseNode = -1; turn = 'cat'; winner = null;
  setLog('Click a node to place the Cat.');
  setStatus('Place <strong>Cat</strong> on a node to begin');
  updateUI();
}

document.getElementById('resetBtn').addEventListener('click', resetGame);

// ── Canvas resize ─────────────────────────────────────────────────────────────

function resizeCanvas() {
  const w = canvas.parentElement.clientWidth;
  canvas.width = Math.min(w, 700);
  canvas.height = Math.round(canvas.width * 480 / 700);
  draw();
}

window.addEventListener('resize', resizeCanvas);

// ── Init ──────────────────────────────────────────────────────────────────────

resizeCanvas();
updateUI();