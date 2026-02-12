import { TILE, COLS, ROWS, GATE_TOGGLE_INTERVAL, GATE_TELEGRAPH_DURATION } from '../constants';
import { TileType, TilePos, WarpPair, BoardData } from '../types';

export class TileMap {
  tiles: TileType[][] = [];
  dotsRemaining = 0;
  totalDots = 0;

  // Gate state
  gatesOpen = true;
  gateTimer = 0;
  gateTelegraphTimer = 0;
  gateFlashing = false;

  // Board data for reloading
  private board: BoardData | null = null;
  warpPairs: WarpPair[] = [];

  loadBoard(board: BoardData): void {
    this.board = board;
    this.warpPairs = board.warpPairs;
    this.rebuildFromBoard();
  }

  private rebuildFromBoard(): void {
    if (!this.board) return;
    this.dotsRemaining = 0;
    this.tiles = [];
    for (let r = 0; r < ROWS; r++) {
      this.tiles[r] = [];
      for (let c = 0; c < COLS; c++) {
        const t = this.board.tiles[r]?.[c] ?? TileType.EMPTY;
        this.tiles[r][c] = t;
        if (t === TileType.DOT || t === TileType.POWER) {
          this.dotsRemaining++;
        }
      }
    }
    this.totalDots = this.dotsRemaining;
    this.gatesOpen = true;
    this.gateTimer = 0;
    this.gateTelegraphTimer = 0;
    this.gateFlashing = false;
  }

  reset(): void {
    this.rebuildFromBoard();
  }

  getTile(col: number, row: number): TileType {
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return TileType.WALL;
    return this.tiles[row][col];
  }

  isWalkable(col: number, row: number, isGhost: boolean, _isEaten: boolean): boolean {
    const t = this.getTile(col, row);
    if (t === TileType.WALL) return false;
    if (t === TileType.GATE) {
      if (isGhost) return true;
      return false;
    }
    if (t === TileType.GHOST_HOUSE) return isGhost;
    return true;
  }

  isSpeedPad(col: number, row: number): boolean {
    return this.getTile(col, row) === TileType.SPEED_PAD;
  }

  getWarpDestination(col: number, row: number): TilePos | null {
    for (const wp of this.warpPairs) {
      if (wp.a.col === col && wp.a.row === row) return wp.b;
      if (wp.b.col === col && wp.b.row === row) return wp.a;
    }
    return null;
  }

  eatDot(col: number, row: number): TileType {
    const t = this.tiles[row]?.[col];
    if (t === TileType.DOT || t === TileType.POWER) {
      this.tiles[row][col] = TileType.EMPTY;
      this.dotsRemaining--;
      return t;
    }
    return TileType.EMPTY;
  }

  updateGate(dt: number): void {
    this.gateTimer += dt;

    // Telegraph upcoming toggle
    const timeUntilToggle = GATE_TOGGLE_INTERVAL - (this.gateTimer % GATE_TOGGLE_INTERVAL);
    this.gateFlashing = timeUntilToggle <= GATE_TELEGRAPH_DURATION;
    this.gateTelegraphTimer += dt;

    if (this.gateTimer >= GATE_TOGGLE_INTERVAL) {
      this.gateTimer -= GATE_TOGGLE_INTERVAL;
      this.gatesOpen = !this.gatesOpen;
    }
  }

  toPixel(col: number, row: number): { x: number; y: number } {
    return { x: col * TILE + TILE / 2, y: row * TILE + TILE / 2 };
  }

  toTile(x: number, y: number): TilePos {
    return {
      col: Math.floor(x / TILE),
      row: Math.floor(y / TILE),
    };
  }
}
