/**
 * graph.js
 * Defines the game graph (a chordal graph with cop number 1 — always cop-win).
 * Nodes have { id, x, y } where x/y are in a 700×400 logical coordinate space.
 * Edges are pairs [a, b].
 */

export const NODES = [
  { id: 0, x: 350, y: 60 },
  { id: 1, x: 180, y: 150 },
  { id: 2, x: 520, y: 150 },
  { id: 3, x: 100, y: 280 },
  { id: 4, x: 280, y: 280 },
  { id: 5, x: 440, y: 280 },
  { id: 6, x: 600, y: 280 },
  { id: 7, x: 200, y: 380 },
  { id: 8, x: 500, y: 380 },
];

export const EDGES = [
  [0, 1], [0, 2], [1, 2],
  [1, 3], [1, 4], [1, 5], [2, 5], [2, 6],
  [3, 4], [4, 5], [5, 6], [5, 7],
  [3, 7], [4, 7], [5, 8], [6, 8], [7, 8],
];

/** Build adjacency list from EDGES */
export function buildAdjacency(nodes, edges) {
  const adj = Array.from({ length: nodes.length }, () => []);
  edges.forEach(([a, b]) => {
    adj[a].push(b);
    adj[b].push(a);
  });
  return adj;
}
