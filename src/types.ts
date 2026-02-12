export enum Direction {
  UP = 'UP',
  DOWN = 'DOWN',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
  NONE = 'NONE',
}

export enum TileType {
  EMPTY = 0,
  WALL = 1,
  DOT = 2,
  POWER = 3,
  GATE = 4,
  TUNNEL = 5,
  GHOST_HOUSE = 6,
  SPEED_PAD = 7,
  WARP_TUNNEL = 8,
}

export enum GhostMode {
  SCATTER = 'SCATTER',
  CHASE = 'CHASE',
  FRIGHTENED = 'FRIGHTENED',
  EATEN = 'EATEN',
}

export enum GhostName {
  BLINKY = 'BLINKY',
  PINKY = 'PINKY',
  INKY = 'INKY',
  CLYDE = 'CLYDE',
}

export interface Position {
  x: number;
  y: number;
}

export interface TilePos {
  col: number;
  row: number;
}

export interface FloatingScore {
  x: number;
  y: number;
  text: string;
  color: string;
  timer: number;   // counts up from 0
}

export interface HighScoreEntry {
  name: string;
  score: number;
}

export interface WarpPair {
  id: string;
  a: TilePos;
  b: TilePos;
}

export interface GhostSpawnConfig {
  name: GhostName;
  startCol: number;
  startRow: number;
  startDir: Direction;
  releaseDelay: number;
  releaseDir: Direction;
}

export interface BoardData {
  tiles: TileType[][];
  pacmanSpawn: TilePos;
  ghostHouseEntrance: TilePos;
  ghostSpawns: GhostSpawnConfig[];
  fruitSpawn: TilePos;
  scatterTargets: TilePos[];
  warpPairs: WarpPair[];
  hasSpeedPads: boolean;
  dotCount: number;
}

export interface BonusFruit {
  col: number;
  row: number;
  typeIndex: number;
  timer: number;    // counts up, despawns at FRUIT_DURATION
  eaten: boolean;
}
