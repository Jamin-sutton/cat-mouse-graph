/**
 * ai.js
 * Pathfinding utilities and robber AI strategies.
 *
 * Three AI modes:
 *   greedy    — maximise immediate distance from cop
 *   lookahead — depth-2 minimax (robber max, cop min)
 *   astar     — ranked heuristic scoring escape quality
 */

/**
 * BFS from `from`, optionally skipping node `avoid`.
 * Returns distance array indexed by node id.
 * @param {number}   from   - source node
 * @param {number[][]} adj  - adjacency list
 * @param {number}   [avoid=-1] - node to skip
 * @returns {number[]}
 */
export function bfs(from, adj, avoid = -1) {
  const n = adj.length;
  const dist = Array(n).fill(Infinity);
  if (from === avoid) return dist;
  dist[from] = 0;
  const queue = [from];
  while (queue.length) {
    const u = queue.shift();
    for (const v of adj[u]) {
      if (v !== avoid && dist[v] === Infinity) {
        dist[v] = dist[u] + 1;
        queue.push(v);
      }
    }
  }
  return dist;
}

/**
 * Precompute all-pairs shortest path distances.
 * @param {number[][]} adj
 * @returns {number[][]} ap[i][j] = shortest distance from i to j
 */
export function allPairs(adj) {
  return adj.map((_, i) => bfs(i, adj));
}

// ── Robber AI strategies ─────────────────────────────────────────────────────

/**
 * Greedy: pick the neighbour (or stay) that maximises distance from cop now.
 */
export function greedyMove(robberPos, copPos, adj, ap) {
  const candidates = [robberPos, ...adj[robberPos]];
  let best = robberPos, bestVal = -Infinity;
  for (const n of candidates) {
    const val = ap[copPos][n];
    if (val > bestVal) { bestVal = val; best = n; }
  }
  return best;
}

/**
 * Lookahead (depth-2 minimax):
 * Robber picks move that maximises the minimum distance the cop can achieve
 * in its following turn.
 */
export function lookaheadMove(robberPos, copPos, adj, ap) {
  const robberMoves = [robberPos, ...adj[robberPos]];
  let best = robberPos, bestVal = -Infinity;

  for (const r1 of robberMoves) {
    // Cop responds optimally: minimise distance to r1
    const copMoves = [copPos, ...adj[copPos]];
    let copBest = Infinity;
    for (const c1 of copMoves) {
      copBest = Math.min(copBest, ap[c1][r1]);
    }
    if (copBest > bestVal) { bestVal = copBest; best = r1; }
  }
  return best;
}

/**
 * A* escape heuristic:
 * Scores each candidate move with a weighted combination of:
 *   +3.0 × distance from cop after move
 *   +0.5 × node degree (prefer hubs — more future options)
 *   +0.8 × average neighbour distance from cop (escape flexibility)
 *   −2.0 × penalty if within cop's 2-step threat radius
 */
export function astarMove(robberPos, copPos, adj, ap) {
  // Pre-compute cop's reachable set in 1 and 2 steps
  const copReach1 = new Set([copPos, ...adj[copPos]]);
  const copReach2 = new Set(copReach1);
  for (const c of copReach1) adj[c].forEach(v => copReach2.add(v));

  const candidates = [robberPos, ...adj[robberPos]];
  let best = robberPos, bestScore = -Infinity;

  for (const r1 of candidates) {
    if (r1 === copPos) continue; // never step onto cop

    const distFromCop = ap[copPos][r1];
    const degree = adj[r1].length;

    // Closest the cop can get to r1 in up to 2 steps
    let minFutureDist = Infinity;
    for (const c of copReach2) {
      minFutureDist = Math.min(minFutureDist, ap[c][r1]);
    }

    // Average distance of r1's neighbours from cop (escape flexibility)
    let escapeFlex = 0;
    for (const nb of adj[r1]) escapeFlex += ap[copPos][nb];
    escapeFlex = adj[r1].length ? escapeFlex / adj[r1].length : 0;

    const danger = 2 - Math.min(minFutureDist, 2); // 0, 1, or 2
    const score = 3.0 * distFromCop
                + 0.5 * degree
                + 0.8 * escapeFlex
                - 2.0 * danger;

    if (score > bestScore) { bestScore = score; best = r1; }
  }
  return best;
}

/**
 * Dispatch to the chosen AI strategy.
 * @param {'greedy'|'lookahead'|'astar'} mode
 */
export function robberAI(mode, robberPos, copPos, adj, ap) {
  switch (mode) {
    case 'greedy':    return greedyMove(robberPos, copPos, adj, ap);
    case 'lookahead': return lookaheadMove(robberPos, copPos, adj, ap);
    case 'astar':     return astarMove(robberPos, copPos, adj, ap);
    default:          return lookaheadMove(robberPos, copPos, adj, ap);
  }
}
