# Claude Code Guidance

## Project overview
Pac-Man Neon Edition — a browser-based Pac-Man clone using Vite + TypeScript + HTML Canvas. No frameworks.

## Architecture
- `src/constants.ts` — Tile sizes, speeds, durations, color palette, game phase enum
- `src/types.ts` — Shared enums and interfaces (Direction, TileType, GhostMode, etc.)
- `src/main.ts` — Entry point: creates canvas, instantiates Game, runs fixed-timestep loop
- `src/engine/game.ts` — Core game class: state machine, scoring, collision, entity orchestration
- `src/input/input.ts` — Keyboard handler with direction buffering and action key consume pattern
- `src/world/tilemap.ts` — 28×31 tile map, collision queries, pellet state, gate toggle timer
- `src/entities/pacman.ts` — Pac-Man movement, wall sliding, tunnel wrap, mouth animation, death
- `src/entities/ghost.ts` — 4 ghosts with scatter/chase/frightened/eaten modes, classic AI targeting
- `src/render/renderer.ts` — Canvas drawing: neon maze, glow trails, entity rendering, overlays
- `src/audio/audio.ts` — WebAudio oscillator synth: waka, power pellet, ghost eat, death, bg pulse
- `src/ui/hud.ts` — Score, lives, dots, level, mute/gate indicators

## Commands
- `npm run dev` — Start Vite dev server
- `npm run build` — TypeScript check + Vite build
- `npm run preview` — Preview production build

## Code style
- Strict TypeScript, no `any`
- No external runtime dependencies — only Vite + TypeScript as dev deps
- All game state flows through the Game class state machine
- Positions in pixels; tile lookups via TileMap.toTile()
