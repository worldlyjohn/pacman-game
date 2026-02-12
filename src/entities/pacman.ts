import { TILE, COLS, PACMAN_SPEED, SPEED_PAD_MULTIPLIER } from '../constants';
import { Direction, Position } from '../types';
import { TileMap } from '../world/tilemap';

export class PacMan {
  x: number;
  y: number;
  dir: Direction = Direction.LEFT;
  nextDir: Direction = Direction.LEFT;
  speed = PACMAN_SPEED;
  mouthAngle = 0;
  mouthOpening = true;
  alive = true;
  deathTimer = 0;

  // Trail positions for glow effect
  trail: Position[] = [];
  private readonly MAX_TRAIL = 8;

  // Spawn position
  private spawnX: number;
  private spawnY: number;

  // Warp anti-bounce
  private lastWarpCol = -1;
  private lastWarpRow = -1;

  constructor() {
    // Default spawn at row 22, col 14 (will be overridden by setSpawn)
    this.spawnX = 14 * TILE + TILE / 2;
    this.spawnY = 22 * TILE + TILE / 2;
    this.x = this.spawnX;
    this.y = this.spawnY;
  }

  setSpawn(col: number, row: number): void {
    this.spawnX = col * TILE + TILE / 2;
    this.spawnY = row * TILE + TILE / 2;
  }

  reset(): void {
    this.x = this.spawnX;
    this.y = this.spawnY;
    this.dir = Direction.LEFT;
    this.nextDir = Direction.LEFT;
    this.alive = true;
    this.deathTimer = 0;
    this.trail = [];
    this.mouthAngle = 0;
    this.lastWarpCol = -1;
    this.lastWarpRow = -1;
  }

  update(dt: number, map: TileMap): void {
    if (!this.alive) {
      this.deathTimer += dt;
      return;
    }

    // Animate mouth
    const mouthSpeed = 8;
    if (this.mouthOpening) {
      this.mouthAngle += mouthSpeed * dt;
      if (this.mouthAngle >= 0.8) this.mouthOpening = false;
    } else {
      this.mouthAngle -= mouthSpeed * dt;
      if (this.mouthAngle <= 0.05) this.mouthOpening = true;
    }

    // Try to turn to buffered direction
    if (this.nextDir !== this.dir) {
      if (this.canMove(this.nextDir, map)) {
        this.dir = this.nextDir;
        this.snapToGrid();
      }
    }

    // Move in current direction
    if (!this.canMove(this.dir, map)) return;

    // Speed pad multiplier
    const tile = map.toTile(this.x, this.y);
    const speedMult = map.isSpeedPad(tile.col, tile.row) ? SPEED_PAD_MULTIPLIER : 1;
    const dist = this.speed * speedMult * dt;

    switch (this.dir) {
      case Direction.UP: this.y -= dist; break;
      case Direction.DOWN: this.y += dist; break;
      case Direction.LEFT: this.x -= dist; break;
      case Direction.RIGHT: this.x += dist; break;
    }

    // Tunnel wrap
    if (this.x < 0) this.x += COLS * TILE;
    if (this.x >= COLS * TILE) this.x -= COLS * TILE;

    // Warp tunnel teleport
    const curTile = map.toTile(this.x, this.y);
    if (curTile.col !== this.lastWarpCol || curTile.row !== this.lastWarpRow) {
      const dest = map.getWarpDestination(curTile.col, curTile.row);
      if (dest) {
        this.x = dest.col * TILE + TILE / 2;
        this.y = dest.row * TILE + TILE / 2;
        this.lastWarpCol = dest.col;
        this.lastWarpRow = dest.row;
      } else {
        this.lastWarpCol = -1;
        this.lastWarpRow = -1;
      }
    }

    // Record trail
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > this.MAX_TRAIL) this.trail.shift();
  }

  private canMove(dir: Direction, map: TileMap): boolean {
    const check = 2; // lookahead pixels
    let cx = this.x;
    let cy = this.y;
    const half = TILE / 2 - 1;

    switch (dir) {
      case Direction.UP: cy -= half + check; break;
      case Direction.DOWN: cy += half + check; break;
      case Direction.LEFT: cx -= half + check; break;
      case Direction.RIGHT: cx += half + check; break;
    }

    // Handle tunnel wrap for collision check
    if (cx < 0) cx += COLS * TILE;
    if (cx >= COLS * TILE) cx -= COLS * TILE;

    const tile = map.toTile(cx, cy);
    return map.isWalkable(tile.col, tile.row, false, false);
  }

  private snapToGrid(): void {
    // Snap to center of tile along the axis perpendicular to movement
    if (this.dir === Direction.UP || this.dir === Direction.DOWN) {
      this.x = Math.floor(this.x / TILE) * TILE + TILE / 2;
    } else {
      this.y = Math.floor(this.y / TILE) * TILE + TILE / 2;
    }
  }

  getTile(map: TileMap) {
    return map.toTile(this.x, this.y);
  }
}
