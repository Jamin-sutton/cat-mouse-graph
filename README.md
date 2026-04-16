# Cops and Robbers — Graph Theory Game

A browser-based implementation of the Cops and Robbers game played on a graph.
The graph used is **chordal** (cop number = 1), so one cop always has a winning strategy.

## File structure

```
cops-and-robbers/
├── index.html    — entry point
├── style.css     — all styling, light/dark mode via CSS variables
├── graph.js      — node/edge data and adjacency list builder
├── ai.js         — BFS, all-pairs shortest paths, and 3 robber AI strategies
├── renderer.js   — canvas drawing (nodes, edges, heat overlay, hit-test)
└── main.js       — game state machine, event wiring, UI updates
```

## How to run

Because the project uses ES modules (`type="module"`), you need a local HTTP server — just opening `index.html` as a `file://` URL won't work.

**Option 1 — VS Code Live Server extension**
1. Install the "Live Server" extension by Ritwick Dey.
2. Right-click `index.html` → "Open with Live Server".

**Option 2 — Node http-server**
```bash
npx http-server .
```
Then open `http://localhost:8080`.

**Option 3 — Python**
```bash
python3 -m http.server 8080
```

## How to play

1. Click a node to place the **Cop** (blue).
2. Click another node to place the **Robber** (orange).
3. Take turns moving along edges. The cop wins by landing on the robber's node.
4. Green nodes show valid moves on each turn.
5. Small numbers on nodes show the cop's BFS distance to each node.
6. The warm amber glow fades with distance from the cop — a threat heat map.

## Robber AI modes

| Mode | Strategy |
|------|----------|
| Greedy | Maximises immediate distance from cop |
| Lookahead | Depth-2 minimax — simulates cop's best reply before moving |
| A* escape | Weighted heuristic: distance + node degree + escape flexibility − threat penalty |

## Buttons

- **New game** — reset everything
- **Hint (cop)** — highlights the best cop move (greedy BFS)
- **AI robber move** — run one AI move for the robber
- **Auto-play robber** — AI plays robber every 0.9 s automatically
