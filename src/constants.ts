export const TILE = 16;
export const COLS = 28;
export const ROWS = 31;
export const CANVAS_W = COLS * TILE;
export const CANVAS_H = ROWS * TILE + 48; // extra space for HUD

// Speeds in pixels per second
export const PACMAN_SPEED = 80;
export const GHOST_SPEED = 75;
export const GHOST_FRIGHTENED_SPEED = 40;
export const GHOST_EATEN_SPEED = 160;

// Durations in ms
export const FRIGHTENED_DURATION = 8000;
export const FRIGHTENED_FLASH_AT = 6000;
export const SCATTER_DURATIONS = [7000, 7000, 5000, 5000];
export const CHASE_DURATIONS = [20000, 20000, 20000, Infinity];
export const READY_DURATION = 2000;
export const DEAD_DURATION = 1500;
export const LEVEL_CLEAR_DURATION = 2000;

// Gate modifier
export const GATE_TOGGLE_INTERVAL = 15000;
export const GATE_TELEGRAPH_DURATION = 3000;

// Speed pad
export const SPEED_PAD_MULTIPLIER = 1.5;

// Scoring
export const SCORE_DOT = 10;
export const SCORE_POWER = 50;
export const SCORE_GHOST_BASE = 200;
export const EXTRA_LIFE_AT = 10000;

// Fruit — appears at 70 and 170 dots eaten, centered below ghost house
export const FRUIT_DOT_THRESHOLDS = [70, 170];
export const FRUIT_DURATION = 10000; // ms before fruit disappears
export const FRUIT_TYPES: { name: string; points: number; color: string; shape: string }[] = [
  { name: 'Cherry',     points: 100,  color: '#ff2d2d', shape: 'cherry' },
  { name: 'Strawberry', points: 300,  color: '#ff4466', shape: 'strawberry' },
  { name: 'Orange',     points: 500,  color: '#ffb347', shape: 'orange' },
  { name: 'Apple',      points: 700,  color: '#ff2d2d', shape: 'apple' },
  { name: 'Melon',      points: 1000, color: '#44ff44', shape: 'melon' },
  { name: 'Galaxian',   points: 2000, color: '#2dffff', shape: 'galaxian' },
  { name: 'Bell',       points: 3000, color: '#ffff44', shape: 'bell' },
  { name: 'Key',        points: 5000, color: '#2dffff', shape: 'key' },
];

// Ghost eat freeze frame
export const GHOST_EAT_FREEZE = 500; // ms pause when eating a ghost
export const SCORE_FLOAT_DURATION = 1200; // ms for floating score text

// Neon / synthwave palette
export const COLOR = {
  BG: '#0a0a1a',
  WALL: '#1a0a3e',
  WALL_STROKE: '#6f2dff',
  DOT: '#ffb3ff',
  POWER_PELLET: '#ff6fff',
  PACMAN: '#ffe135',
  PACMAN_TRAIL: 'rgba(255,225,53,0.15)',
  BLINKY: '#ff2d2d',
  PINKY: '#ff7dff',
  INKY: '#2dffff',
  CLYDE: '#ffb347',
  FRIGHTENED: '#2d2dff',
  FRIGHTENED_FLASH: '#ffffff',
  EATEN: 'rgba(150,150,255,0.5)',
  GATE: '#ff6fff',
  GATE_CLOSED: '#6f2dff',
  TEXT: '#e0e0ff',
  HUD_BG: 'rgba(10,10,26,0.9)',
  GLOW_CYAN: '#00ffff',
  GLOW_MAGENTA: '#ff00ff',
} as const;

export const HIGH_SCORE_MAX = 5;
export const HIGH_SCORE_KEY = 'pacman-neon-highscores';

export enum GamePhase {
  MENU = 'MENU',
  READY = 'READY',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  DEAD = 'DEAD',
  LEVEL_CLEAR = 'LEVEL_CLEAR',
  GAME_OVER = 'GAME_OVER',
  ENTER_NAME = 'ENTER_NAME',
  LEVEL_SELECT = 'LEVEL_SELECT',
}
