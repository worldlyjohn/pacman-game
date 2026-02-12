# Pac-Man Neon Edition

A browser-based Pac-Man clone with a neon/synthwave aesthetic, built with Vite + TypeScript + HTML Canvas. No frameworks or runtime dependencies.

## Features

- 6 unique level layouts with progressive difficulty
- Warp tunnels that teleport entities between paired endpoints
- Speed pads that boost entity speed by 1.5x
- Auto-toggling gates that block Pac-Man but not ghosts
- Classic ghost AI (Blinky, Pinky, Inky, Clyde) with scatter/chase/frightened/eaten modes
- WebAudio oscillator synth sound effects
- High score system with local storage persistence
- Neon glow trail effects and animated maze rendering

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Controls

| Key | Action |
|-----|--------|
| Arrow Keys / WASD | Move |
| P | Pause |
| R | Restart |
| M | Mute |
| G | Toggle gates |
| Enter / Space | Start game |

## Commands

- `npm run dev` — Start Vite dev server
- `npm run build` — TypeScript check + Vite build
- `npm run preview` — Preview production build

## Tech Stack

- **Vite** — Build tool and dev server
- **TypeScript** — Strict mode, no `any`
- **HTML Canvas** — All rendering
- **WebAudio API** — Synthesized sound effects
- Zero runtime dependencies

## License

MIT
