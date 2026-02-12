import {
  TILE, COLS,
  GHOST_SPEED, GHOST_FRIGHTENED_SPEED, GHOST_EATEN_SPEED,
  FRIGHTENED_DURATION, FRIGHTENED_FLASH_AT,
  SCATTER_DURATIONS, CHASE_DURATIONS,
  SPEED_PAD_MULTIPLIER,
} from '../constants';
import { Direction, GhostMode, GhostName, Position, TilePos, GhostSpawnConfig } from '../types';
import { TileMap } from '../world/tilemap';
import { PacMan } from './pacman';

interface GhostConfig {
  name: GhostName;
  color: string;
  scatterTarget: { col: number; row: number };
  startCol: number;
  startRow: number;
  startDir: Direction;
  releaseDelay: number;
  releaseDir: Direction;
}

const GHOST_CONFIGS: GhostConfig[] = [
  {
    name: GhostName.BLINKY,
    color: '#ff2d2d',
    scatterTarget: { col: 25, row: 0 },
    startCol: 14, startRow: 11,
    startDir: Direction.LEFT,
    releaseDelay: 0,
    releaseDir: Direction.LEFT,
  },
  {
    name: GhostName.PINKY,
    color: '#ff7dff',
    scatterTarget: { col: 2, row: 0 },
    startCol: 14, startRow: 14,
    startDir: Direction.DOWN,
    releaseDelay: 1500,
    releaseDir: Direction.RIGHT,
  },
  {
    name: GhostName.INKY,
    color: '#2dffff',
    scatterTarget: { col: 27, row: 30 },
    startCol: 12, startRow: 14,
    startDir: Direction.UP,
    releaseDelay: 4000,
    releaseDir: Direction.LEFT,
  },
  {
    name: GhostName.CLYDE,
    color: '#ffb347',
    scatterTarget: { col: 0, row: 30 },
    startCol: 16, startRow: 14,
    startDir: Direction.UP,
    releaseDelay: 6500,
    releaseDir: Direction.RIGHT,
  },
];

export class Ghost {
  name: GhostName;
  color: string;
  x: number;
  y: number;
  dir: Direction;
  mode: GhostMode = GhostMode.SCATTER;
  previousMode: GhostMode = GhostMode.SCATTER;
  scatterTarget: { col: number; row: number };
  speed = GHOST_SPEED;
  frightTimer = 0;
  isFlashing = false;
  released = false;
  releaseTimer = 0;
  releaseDelay: number;

  // Track the last tile where a direction decision was made
  private lastDecisionCol = -1;
  private lastDecisionRow = -1;

  // Mode cycling
  private modeIndex = 0;
  private modeTimer = 0;
  private inScatter = true;

  private startCol: number;
  private startRow: number;
  private startDir: Direction;
  private releaseDir: Direction;

  // Dynamic ghost house entrance (per-level)
  private ghostHouseEntrance: TilePos = { col: 14, row: 11 };

  // Warp anti-bounce
  private lastWarpCol = -1;
  private lastWarpRow = -1;

  trail: Position[] = [];
  private readonly MAX_TRAIL = 6;

  constructor(index: number) {
    const cfg = GHOST_CONFIGS[index];
    this.name = cfg.name;
    this.color = cfg.color;
    this.scatterTarget = cfg.scatterTarget;
    this.startCol = cfg.startCol;
    this.startRow = cfg.startRow;
    this.startDir = cfg.startDir;
    this.releaseDir = cfg.releaseDir;
    this.releaseDelay = cfg.releaseDelay;
    this.dir = cfg.startDir;

    const pos = this.spawnPixel();
    this.x = pos.x;
    this.y = pos.y;
    this.released = cfg.releaseDelay === 0;
  }

  configure(spawnConfig: GhostSpawnConfig, entrance: TilePos, scatterTarget: TilePos): void {
    this.startCol = spawnConfig.startCol;
    this.startRow = spawnConfig.startRow;
    this.startDir = spawnConfig.startDir;
    this.releaseDir = spawnConfig.releaseDir;
    this.releaseDelay = spawnConfig.releaseDelay;
    this.ghostHouseEntrance = entrance;
    this.scatterTarget = scatterTarget;
  }

  private spawnPixel() {
    return {
      x: this.startCol * TILE + TILE / 2,
      y: this.startRow * TILE + TILE / 2,
    };
  }

  reset(): void {
    const pos = this.spawnPixel();
    this.x = pos.x;
    this.y = pos.y;
    this.dir = this.startDir;
    this.mode = GhostMode.SCATTER;
    this.previousMode = GhostMode.SCATTER;
    this.frightTimer = 0;
    this.isFlashing = false;
    this.modeIndex = 0;
    this.modeTimer = 0;
    this.inScatter = true;
    this.released = this.releaseDelay === 0;
    this.releaseTimer = 0;
    this.trail = [];
    this.lastDecisionCol = -1;
    this.lastDecisionRow = -1;
    this.lastWarpCol = -1;
    this.lastWarpRow = -1;
  }

  frighten(): void {
    if (this.mode === GhostMode.EATEN) return;
    this.previousMode = this.mode;
    this.mode = GhostMode.FRIGHTENED;
    this.frightTimer = 0;
    this.isFlashing = false;
    this.dir = this.oppositeDir(this.dir);
    // Allow re-decision at current tile after reversal
    this.lastDecisionCol = -1;
    this.lastDecisionRow = -1;
  }

  private oppositeDir(d: Direction): Direction {
    switch (d) {
      case Direction.UP: return Direction.DOWN;
      case Direction.DOWN: return Direction.UP;
      case Direction.LEFT: return Direction.RIGHT;
      case Direction.RIGHT: return Direction.LEFT;
      default: return d;
    }
  }

  reverseDirection(): void {
    this.dir = this.oppositeDir(this.dir);
    this.lastDecisionCol = -1;
    this.lastDecisionRow = -1;
  }

  eat(): void {
    this.mode = GhostMode.EATEN;
    this.frightTimer = 0;
    this.lastDecisionCol = -1;
    this.lastDecisionRow = -1;
  }

  update(dt: number, map: TileMap, pacman: PacMan, blinky: Ghost | null): void {
    // Release timer
    if (!this.released) {
      this.releaseTimer += dt * 1000;
      if (this.releaseTimer >= this.releaseDelay) {
        this.released = true;
        // Move to ghost house entrance
        this.x = this.ghostHouseEntrance.col * TILE + TILE / 2;
        this.y = this.ghostHouseEntrance.row * TILE + TILE / 2;
        this.dir = this.releaseDir;
        this.lastDecisionCol = -1;
        this.lastDecisionRow = -1;
      } else {
        // Bob up and down in ghost house
        const spawnY = this.startRow * TILE + TILE / 2;
        this.y = spawnY + Math.sin(this.releaseTimer * 0.005) * 3;
        return;
      }
    }

    // Update mode timers
    this.updateMode(dt);

    // Set speed
    let baseSpeed: number;
    switch (this.mode) {
      case GhostMode.FRIGHTENED:
        baseSpeed = GHOST_FRIGHTENED_SPEED;
        break;
      case GhostMode.EATEN:
        baseSpeed = GHOST_EATEN_SPEED;
        break;
      default:
        baseSpeed = GHOST_SPEED;
    }

    // Speed pad multiplier
    const curTile = map.toTile(this.x, this.y);
    const speedMult = map.isSpeedPad(curTile.col, curTile.row) ? SPEED_PAD_MULTIPLIER : 1;
    this.speed = baseSpeed * speedMult;

    const isEaten = this.mode === GhostMode.EATEN;

    // Current tile and its center
    const tileCol = Math.floor(this.x / TILE);
    const tileRow = Math.floor(this.y / TILE);
    const cx = tileCol * TILE + TILE / 2;
    const cy = tileRow * TILE + TILE / 2;

    // Check if we're near center of a NEW tile (not the one we last decided at)
    const nearCenter = Math.abs(this.x - cx) < 2 && Math.abs(this.y - cy) < 2;
    const newTile = tileCol !== this.lastDecisionCol || tileRow !== this.lastDecisionRow;

    if (nearCenter && newTile) {
      // Snap to center and make a direction decision
      this.x = cx;
      this.y = cy;
      this.lastDecisionCol = tileCol;
      this.lastDecisionRow = tileRow;
      this.chooseDirection(map, pacman, blinky);
    }

    // Move only if the leading edge won't hit a wall
    if (this.canMoveDir(this.dir, map, isEaten)) {
      const dist = this.speed * dt;
      switch (this.dir) {
        case Direction.UP: this.y -= dist; break;
        case Direction.DOWN: this.y += dist; break;
        case Direction.LEFT: this.x -= dist; break;
        case Direction.RIGHT: this.x += dist; break;
      }
    } else {
      // Blocked — snap to center and force a new decision
      this.x = cx;
      this.y = cy;
      this.lastDecisionCol = -1; // allow re-decision
    }

    // Tunnel wrap
    if (this.x < 0) this.x += COLS * TILE;
    if (this.x >= COLS * TILE) this.x -= COLS * TILE;

    // Warp tunnel teleport
    const afterTile = map.toTile(this.x, this.y);
    if (afterTile.col !== this.lastWarpCol || afterTile.row !== this.lastWarpRow) {
      const dest = map.getWarpDestination(afterTile.col, afterTile.row);
      if (dest) {
        this.x = dest.col * TILE + TILE / 2;
        this.y = dest.row * TILE + TILE / 2;
        this.lastWarpCol = dest.col;
        this.lastWarpRow = dest.row;
        this.lastDecisionCol = -1;
        this.lastDecisionRow = -1;
      } else {
        this.lastWarpCol = -1;
        this.lastWarpRow = -1;
      }
    }

    // If eaten and reached ghost house entrance, respawn
    if (this.mode === GhostMode.EATEN) {
      const tile = map.toTile(this.x, this.y);
      if (tile.row === this.ghostHouseEntrance.row &&
          Math.abs(tile.col - this.ghostHouseEntrance.col) <= 1) {
        this.mode = this.inScatter ? GhostMode.SCATTER : GhostMode.CHASE;
        this.previousMode = this.mode;
        this.lastDecisionCol = -1;
        this.lastDecisionRow = -1;
      }
    }

    // Trail
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > this.MAX_TRAIL) this.trail.shift();
  }

  private updateMode(dt: number): void {
    if (this.mode === GhostMode.FRIGHTENED) {
      this.frightTimer += dt * 1000;
      this.isFlashing = this.frightTimer >= FRIGHTENED_FLASH_AT;
      if (this.frightTimer >= FRIGHTENED_DURATION) {
        this.mode = this.previousMode;
        this.frightTimer = 0;
        this.isFlashing = false;
      }
      return;
    }

    if (this.mode === GhostMode.EATEN) return;

    this.modeTimer += dt * 1000;
    const durations = this.inScatter ? SCATTER_DURATIONS : CHASE_DURATIONS;
    const limit = durations[Math.min(this.modeIndex, durations.length - 1)];

    if (this.modeTimer >= limit) {
      this.modeTimer = 0;
      this.inScatter = !this.inScatter;
      if (!this.inScatter) this.modeIndex++;
      this.mode = this.inScatter ? GhostMode.SCATTER : GhostMode.CHASE;
      this.previousMode = this.mode;
      this.dir = this.oppositeDir(this.dir);
      this.lastDecisionCol = -1;
      this.lastDecisionRow = -1;
    }
  }

  private canMoveDir(dir: Direction, map: TileMap, isEaten: boolean): boolean {
    const check = 2;
    let px = this.x;
    let py = this.y;
    const half = TILE / 2 - 1;

    switch (dir) {
      case Direction.UP: py -= half + check; break;
      case Direction.DOWN: py += half + check; break;
      case Direction.LEFT: px -= half + check; break;
      case Direction.RIGHT: px += half + check; break;
    }

    if (px < 0) px += COLS * TILE;
    if (px >= COLS * TILE) px -= COLS * TILE;

    const tile = map.toTile(px, py);
    return map.isWalkable(tile.col, tile.row, true, isEaten);
  }

  private chooseDirection(map: TileMap, pacman: PacMan, blinky: Ghost | null): void {
    const tile = map.toTile(this.x, this.y);
    const target = this.getTarget(pacman, blinky);
    const isEaten = this.mode === GhostMode.EATEN;

    const dirs = [Direction.UP, Direction.LEFT, Direction.DOWN, Direction.RIGHT];
    const opposite = this.oppositeDir(this.dir);

    let bestDir: Direction | null = null;
    let bestDist = Infinity;

    for (const d of dirs) {
      if (d === opposite) continue;

      const nc = tile.col + (d === Direction.LEFT ? -1 : d === Direction.RIGHT ? 1 : 0);
      const nr = tile.row + (d === Direction.UP ? -1 : d === Direction.DOWN ? 1 : 0);

      if (!map.isWalkable(nc, nr, true, isEaten)) continue;

      if (this.mode === GhostMode.FRIGHTENED) {
        // Flee from Pac-Man: maximize distance
        const pacTile = { col: Math.floor(pacman.x / TILE), row: Math.floor(pacman.y / TILE) };
        const dx = nc - pacTile.col;
        const dy = nr - pacTile.row;
        const dist = dx * dx + dy * dy;
        if (dist > bestDist || bestDist === Infinity) {
          bestDist = dist;
          bestDir = d;
        }
      } else {
        const dx = nc - target.col;
        const dy = nr - target.row;
        const dist = dx * dx + dy * dy;
        if (dist < bestDist) {
          bestDist = dist;
          bestDir = d;
        }
      }
    }

    if (bestDir === null) {
      bestDir = opposite;
    }

    this.dir = bestDir;
  }

  private getTarget(pacman: PacMan, blinky: Ghost | null): { col: number; row: number } {
    if (this.mode === GhostMode.SCATTER) {
      return this.scatterTarget;
    }

    if (this.mode === GhostMode.EATEN) {
      return this.ghostHouseEntrance;
    }

    const pt = {
      col: Math.floor(pacman.x / TILE),
      row: Math.floor(pacman.y / TILE),
    };

    switch (this.name) {
      case GhostName.BLINKY:
        return pt;

      case GhostName.PINKY: {
        let col = pt.col;
        let row = pt.row;
        switch (pacman.dir) {
          case Direction.UP: row -= 4; col -= 4; break;
          case Direction.DOWN: row += 4; break;
          case Direction.LEFT: col -= 4; break;
          case Direction.RIGHT: col += 4; break;
        }
        return { col, row };
      }

      case GhostName.INKY: {
        let col = pt.col;
        let row = pt.row;
        switch (pacman.dir) {
          case Direction.UP: row -= 2; break;
          case Direction.DOWN: row += 2; break;
          case Direction.LEFT: col -= 2; break;
          case Direction.RIGHT: col += 2; break;
        }
        if (blinky) {
          const bt = blinky.getTile();
          col = 2 * col - bt.col;
          row = 2 * row - bt.row;
        }
        return { col, row };
      }

      case GhostName.CLYDE: {
        const dx = pt.col - Math.floor(this.x / TILE);
        const dy = pt.row - Math.floor(this.y / TILE);
        if (dx * dx + dy * dy > 64) return pt;
        return this.scatterTarget;
      }
    }
  }

  getTile() {
    return {
      col: Math.floor(this.x / TILE),
      row: Math.floor(this.y / TILE),
    };
  }
}

export function createGhosts(): Ghost[] {
  return [0, 1, 2, 3].map(i => new Ghost(i));
}
