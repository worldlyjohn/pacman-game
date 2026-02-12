import { COLS, ROWS } from '../constants';
import { TileType, BoardData } from '../types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateBoard(board: BoardData, name: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check dimensions
  if (board.tiles.length !== ROWS) {
    errors.push(`Expected ${ROWS} rows, got ${board.tiles.length}`);
  }
  for (let r = 0; r < board.tiles.length; r++) {
    if (board.tiles[r].length !== COLS) {
      errors.push(`Row ${r}: expected ${COLS} cols, got ${board.tiles[r].length}`);
    }
  }

  // Check Pac-Man spawn is on walkable tile
  const ps = board.pacmanSpawn;
  const spawnTile = board.tiles[ps.row]?.[ps.col];
  if (spawnTile === undefined || spawnTile === TileType.WALL) {
    errors.push(`Pac-Man spawn (${ps.col},${ps.row}) is on a wall or out of bounds`);
  }

  // Check ghost house exists (at least 6 GHOST_HOUSE tiles)
  let ghostHouseCount = 0;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board.tiles[r]?.[c] === TileType.GHOST_HOUSE) ghostHouseCount++;
    }
  }
  if (ghostHouseCount < 6) {
    errors.push(`Ghost house has ${ghostHouseCount} tiles, need at least 6`);
  }

  // Check at least 1 gate tile
  let gateCount = 0;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board.tiles[r]?.[c] === TileType.GATE) gateCount++;
    }
  }
  if (gateCount < 1) {
    errors.push('No gate tiles found');
  }

  // BFS reachability from Pac-Man spawn
  const reachable = bfsReachable(board.tiles, ps.col, ps.row);

  // Check all DOT and POWER tiles are reachable
  let unreachableDots = 0;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const t = board.tiles[r]?.[c];
      if (t === TileType.DOT || t === TileType.POWER) {
        if (!reachable.has(`${c},${r}`)) {
          unreachableDots++;
        }
      }
    }
  }
  if (unreachableDots > 0) {
    errors.push(`${unreachableDots} dot/power tiles unreachable from Pac-Man spawn`);
  }

  // Check warp pairs: exactly 2 endpoints each, both reachable
  for (const wp of board.warpPairs) {
    if (!reachable.has(`${wp.a.col},${wp.a.row}`)) {
      warnings.push(`Warp ${wp.id} endpoint A (${wp.a.col},${wp.a.row}) unreachable`);
    }
    if (!reachable.has(`${wp.b.col},${wp.b.row}`)) {
      warnings.push(`Warp ${wp.id} endpoint B (${wp.b.col},${wp.b.row}) unreachable`);
    }
  }

  // Check dot count
  if (board.dotCount === 0) {
    errors.push('Board has no dots');
  } else if (board.dotCount < 50) {
    warnings.push(`Board has only ${board.dotCount} dots (very few)`);
  }

  const valid = errors.length === 0;
  const prefix = `[${name}]`;
  if (!valid) {
    console.warn(`${prefix} INVALID:`, errors.join('; '));
  }
  if (warnings.length > 0) {
    console.warn(`${prefix} warnings:`, warnings.join('; '));
  }
  if (valid && warnings.length === 0) {
    console.log(`${prefix} OK (${board.dotCount} dots)`);
  }

  return { valid, errors, warnings };
}

function bfsReachable(tiles: TileType[][], startCol: number, startRow: number): Set<string> {
  const visited = new Set<string>();
  const queue: [number, number][] = [[startCol, startRow]];
  visited.add(`${startCol},${startRow}`);

  while (queue.length > 0) {
    const [c, r] = queue.shift()!;

    for (const [dc, dr] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
      let nc = c + dc;
      const nr = r + dr;

      // Tunnel wrap
      if (nc < 0) nc = COLS - 1;
      if (nc >= COLS) nc = 0;

      if (nr < 0 || nr >= ROWS) continue;

      const key = `${nc},${nr}`;
      if (visited.has(key)) continue;

      const t = tiles[nr]?.[nc];
      // Pac-Man can walk on anything except WALL, GATE, and GHOST_HOUSE
      if (t === TileType.WALL || t === TileType.GATE || t === TileType.GHOST_HOUSE) continue;

      visited.add(key);
      queue.push([nc, nr]);
    }
  }

  return visited;
}
