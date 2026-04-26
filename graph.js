/**
 * graph.js
 * Defines the game graph (a chordal graph with cop number 1 — always cop-win).
 * Nodes have { id, x, y } where x/y are in a 700×480 logical coordinate space.
 * Edges are pairs [a, b].
 */

export const NODES = [
  { id: 0, x: 350, y: 60 },
  { id: 1, x: 160, y: 170 },
  { id: 2, x: 540, y: 170 },
  { id: 3, x: 80, y: 320 },
  { id: 4, x: 270, y: 320 },
  { id: 5, x: 430, y: 320 },
  { id: 6, x: 620, y: 320 },
  { id: 7, x: 190, y: 430 },
  { id: 8, x: 510, y: 430 },
];

export const EDGES = [
  [0, 1], [0, 2], [1, 2],
  [1, 3], [1, 4], [2, 5], [2, 6],
  [3, 4], [4, 5], [5, 6],
  [3, 7], [4, 7], [4, 8], [5, 8], [6, 8], [7, 8],
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