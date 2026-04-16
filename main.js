/**
 * main.js
 * Game state machine and event wiring.
 * Imports: graph.js, ai.js, renderer.js
 */

import { NODES, EDGES, buildAdjacency } from './graph.js';
import { allPairs, robberAI }           from './ai.js';
import { render, hitTest }              from './renderer.js';

// ── Graph setup ──────────────────────────────────────────────────────────────

const adj = buildAdjacency(NODES, EDGES);
const ap  = allPairs(adj);          // all-pairs shortest paths (precomputed)

// ── Game state ───────────────────────────────────────────────────────────────

/** @type {'place_cop'|'place_robber'|'play'|'done'} */
let phase     = 'place_cop';
let copNode   = -1;
let robberNode = -1;
/** @type {'cop'|'robber'} */
let turn      = 'cop';
let winner    = null;
let autoTimer = null;

// ── DOM refs ─────────────────────────────────────────────────────────────────

const canvas   = /** @type {HTMLCanvasElement} */ (document.getElementById('c'));
const logEl    = document.getElementById('log');
const statusEl = document.getElementById('status');
const hintBtn  = document.getElementById('hintBtn');
const aiBtn    = document.getElementById('aiBtn');
const autoBtn  = document.getElementById('autoBtn');
const diffSel  = document.getElementById('diffSel');

// ── Helpers ──────────────────────────────────────────────────────────────────

function setLog(html)    { logEl.innerHTML = html; }
function setStatus(html) { statusEl.innerHTML = html; }

function getMovable() {
  if (winner) return [];
  if (phase === 'place_cop')    return NODES.map(n => n.id);
  if (phase === 'place_robber') return NODES.map(n => n.id).filter(i => i !== copNode);
  if (phase === 'play') {
    return turn === 'cop'
      ? [copNode,    ...adj[copNode]]
      : [robberNode, ...adj[robberNode]];
  }
  return [];
}

function draw() {
  render(canvas, {
    nodes: NODES, edges: EDGES, adj, ap,
    copNode, robberNode, phase, turn, winner,
    movable: getMovable(),
  });
}

function updateUI() {
  draw();
  hintBtn.disabled = !(phase === 'play' && !winner && turn === 'cop');
  aiBtn.disabled   = !(phase === 'play' && !winner && turn === 'robber');
}

// ── State transitions ─────────────────────────────────────────────────────────

function placeCop(n) {
  copNode = n;
  phase   = 'place_robber';
  setLog(`Cop placed on node <strong>${n}</strong>. Click any other node to place the robber.`);
  setStatus('Place <strong>Robber</strong>');
}

function placeRobber(n) {
  if (n === copNode) { setLog('Choose a different node for the robber.'); return; }
  robberNode = n;
  phase      = 'play';
  turn       = 'cop';
  setLog(`Robber placed on node <strong>${n}</strong>. Cop moves first — click a green node.`);
  setStatus("Cop's turn");
}

function moveCop(n) {
  copNode = n;
  if (copNode === robberNode) { endGame(); return; }
  turn = 'robber';
  setLog(`Cop → <strong>${n}</strong>. Robber's turn — click "AI robber move" or move manually.`);
  setStatus("Robber's turn");
}

function moveRobber(n) {
  robberNode = n;
  if (copNode === robberNode) { endGame(); return; }
  turn = 'cop';
  setLog(`Robber → <strong>${n}</strong>. Cop's turn.`);
  setStatus("Cop's turn");
}

function endGame() {
  winner = 'cop';
  phase  = 'done';
  stopAuto();
  setLog('🎉 <strong>Cop catches the robber!</strong> Cop wins — this chordal graph always has a 1-cop winning strategy.');
  setStatus('<strong>Cop wins!</strong>');
}

// ── Click handler ─────────────────────────────────────────────────────────────

function handleNodeClick(n) {
  if (phase === 'place_cop')    { placeCop(n);    updateUI(); return; }
  if (phase === 'place_robber') { placeRobber(n); updateUI(); return; }
  if (phase !== 'play' || winner) return;

  const movable = getMovable();
  if (!movable.includes(n)) { setLog('Not a valid move. Click a highlighted (green) node.'); return; }

  if (turn === 'cop')    moveCop(n);
  else                   moveRobber(n);
  updateUI();
}

canvas.addEventListener('click', e => {
  // Don't accept manual robber clicks during auto-play or when it's robber's manual turn
  if (winner) return;
  const rect = canvas.getBoundingClientRect();
  const sx = canvas.width  / rect.width;
  const sy = canvas.height / rect.height;
  const mx = (e.clientX - rect.left) * sx;
  const my = (e.clientY - rect.top)  * sy;
  const n  = hitTest(mx, my, NODES, canvas);
  if (n < 0) return;
  handleNodeClick(n);
});

// ── AI robber move ────────────────────────────────────────────────────────────

export function doAiMove() {
  if (phase !== 'play' || winner || turn !== 'robber') return;
  const mode = /** @type {string} */ (diffSel.value);
  const next = robberAI(mode, robberNode, copNode, adj, ap);
  const labels = { greedy: 'Greedy', lookahead: 'Lookahead', astar: 'A* escape' };
  const stayed = next === robberNode ? ' (stays)' : '';
  setLog(`[${labels[mode]}] Robber → <strong>${next}</strong>${stayed}. Cop's turn.`);
  moveRobber(next);
  updateUI();
}

// ── Auto-play ─────────────────────────────────────────────────────────────────

function stopAuto() {
  if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
  autoBtn.textContent = 'Auto-play robber';
}

function toggleAuto() {
  if (autoTimer) { stopAuto(); return; }
  if (phase !== 'play' || winner) { setLog('Start a game first.'); return; }
  autoBtn.textContent = 'Stop auto-play';
  autoTimer = setInterval(() => {
    if (!winner && phase === 'play' && turn === 'robber') doAiMove();
    else if (winner || phase !== 'play') stopAuto();
  }, 900);
}

// ── Hint ──────────────────────────────────────────────────────────────────────

function showHint() {
  if (turn !== 'cop' || phase !== 'play') return;
  const moves = [copNode, ...adj[copNode]];
  let best = copNode, bestDist = Infinity;
  for (const m of moves) {
    const d = ap[m][robberNode];
    if (d < bestDist) { bestDist = d; best = m; }
  }
  setLog(`Hint: move to node <strong>${best}</strong> — closest to robber (distance <strong>${bestDist}</strong>).`);
}

// ── Reset ─────────────────────────────────────────────────────────────────────

function resetGame() {
  stopAuto();
  phase = 'place_cop'; copNode = -1; robberNode = -1; turn = 'cop'; winner = null;
  setLog('Click a node to place the cop.');
  setStatus('Place <strong>Cop</strong> on a node to begin');
  updateUI();
}

// ── Button wiring ─────────────────────────────────────────────────────────────

document.getElementById('resetBtn').addEventListener('click', resetGame);
hintBtn.addEventListener('click', showHint);
aiBtn.addEventListener('click', doAiMove);
autoBtn.addEventListener('click', toggleAuto);
diffSel.addEventListener('change', resetGame);

// ── Canvas resize ─────────────────────────────────────────────────────────────

function resizeCanvas() {
  const w = canvas.parentElement.clientWidth;
  canvas.width  = Math.min(w, 700);
  canvas.height = Math.round(canvas.width * 400 / 700);
  draw();
}

window.addEventListener('resize', resizeCanvas);

// ── Init ──────────────────────────────────────────────────────────────────────

resizeCanvas();
updateUI();
