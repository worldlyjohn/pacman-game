import { COLS, ROWS } from '../constants';
import { TileType, Direction, GhostName, TilePos, WarpPair, GhostSpawnConfig, BoardData } from '../types';

export interface BoardDefinition {
  name: string;
  description: string;
  ascii: string;
}

function charToTile(ch: string): TileType {
  switch (ch) {
    case '#': return TileType.WALL;
    case '.': return TileType.DOT;
    case 'o': return TileType.POWER;
    case ' ': return TileType.EMPTY;
    case 'P': return TileType.EMPTY;
    case 'H': return TileType.GHOST_HOUSE;
    case '-': return TileType.GATE;
    case 'T': return TileType.TUNNEL;
    case 'S': return TileType.SPEED_PAD;
    default:
      // Digits 1-9 are warp tunnel endpoints
      if (ch >= '1' && ch <= '9') return TileType.WARP_TUNNEL;
      return TileType.EMPTY;
  }
}

export function parseBoard(def: BoardDefinition): BoardData {
  const lines = def.ascii.split('\n').filter(l => l.length > 0);
  if (lines.length !== ROWS) {
    throw new Error(`Board "${def.name}" has ${lines.length} rows, expected ${ROWS}`);
  }

  const tiles: TileType[][] = [];
  let pacmanSpawn: TilePos | null = null;
  const warpEndpoints = new Map<string, TilePos[]>();
  let hasSpeedPads = false;
  let dotCount = 0;

  // Ghost house bounding box
  let ghMinCol = COLS, ghMaxCol = 0, ghMinRow = ROWS, ghMaxRow = 0;
  let hasGhostHouse = false;
  let gateRow = -1;
  let gateCenterCol = -1;

  for (let r = 0; r < ROWS; r++) {
    tiles[r] = [];
    const line = lines[r];
    if (line.length !== COLS) {
      throw new Error(`Board "${def.name}" row ${r} has ${line.length} cols, expected ${COLS}`);
    }
    for (let c = 0; c < COLS; c++) {
      const ch = line[c];
      const tile = charToTile(ch);
      tiles[r][c] = tile;

      if (ch === 'P') {
        pacmanSpawn = { col: c, row: r };
      }

      if (ch >= '1' && ch <= '9') {
        const endpoints = warpEndpoints.get(ch) ?? [];
        endpoints.push({ col: c, row: r });
        warpEndpoints.set(ch, endpoints);
      }

      if (ch === 'S') hasSpeedPads = true;
      if (tile === TileType.DOT || tile === TileType.POWER) dotCount++;

      if (ch === 'H') {
        hasGhostHouse = true;
        if (c < ghMinCol) ghMinCol = c;
        if (c > ghMaxCol) ghMaxCol = c;
        if (r < ghMinRow) ghMinRow = r;
        if (r > ghMaxRow) ghMaxRow = r;
      }

      if (ch === '-') {
        gateRow = r;
        gateCenterCol = c; // will be overwritten to last gate col, we average below
      }
    }
  }

  if (!pacmanSpawn) {
    throw new Error(`Board "${def.name}" has no Pac-Man spawn (P)`);
  }

  // Compute gate center col from all gate tiles in gateRow
  if (gateRow >= 0) {
    let gateSum = 0;
    let gateCount = 0;
    for (let c = 0; c < COLS; c++) {
      if (tiles[gateRow][c] === TileType.GATE) {
        gateSum += c;
        gateCount++;
      }
    }
    gateCenterCol = Math.round(gateSum / gateCount);
  }

  // Ghost house entrance: row above gate, center col
  const ghostHouseEntrance: TilePos = gateRow >= 0
    ? { col: gateCenterCol, row: gateRow - 1 }
    : { col: 14, row: 11 }; // fallback

  // Derive ghost spawns from ghost house geometry
  const ghostSpawns: GhostSpawnConfig[] = [];
  if (hasGhostHouse && gateRow >= 0) {
    const ghCenterCol = Math.round((ghMinCol + ghMaxCol) / 2);
    const ghCenterRow = Math.round((ghMinRow + ghMaxRow) / 2);

    // Blinky: at entrance, released immediately
    ghostSpawns.push({
      name: GhostName.BLINKY,
      startCol: gateCenterCol,
      startRow: gateRow - 1,
      startDir: Direction.LEFT,
      releaseDelay: 0,
      releaseDir: Direction.LEFT,
    });

    // Pinky: center of ghost house
    ghostSpawns.push({
      name: GhostName.PINKY,
      startCol: ghCenterCol,
      startRow: ghCenterRow,
      startDir: Direction.DOWN,
      releaseDelay: 1500,
      releaseDir: Direction.RIGHT,
    });

    // Inky: left-center of ghost house
    const inkyCol = Math.round((ghMinCol + ghCenterCol) / 2);
    ghostSpawns.push({
      name: GhostName.INKY,
      startCol: inkyCol,
      startRow: ghCenterRow,
      startDir: Direction.UP,
      releaseDelay: 4000,
      releaseDir: Direction.LEFT,
    });

    // Clyde: right-center of ghost house
    const clydeCol = Math.round((ghCenterCol + ghMaxCol) / 2);
    ghostSpawns.push({
      name: GhostName.CLYDE,
      startCol: clydeCol,
      startRow: ghCenterRow,
      startDir: Direction.UP,
      releaseDelay: 6500,
      releaseDir: Direction.RIGHT,
    });
  }

  // Fruit spawn: corridor below ghost house (skip the bottom wall row)
  const fruitSpawn: TilePos = hasGhostHouse
    ? { col: Math.round((ghMinCol + ghMaxCol) / 2), row: ghMaxRow + 2 }
    : { col: 14, row: 17 }; // fallback

  // Scatter targets from 4 map corners
  const scatterTargets: TilePos[] = [
    { col: COLS - 3, row: 0 },    // Blinky: top-right
    { col: 2, row: 0 },            // Pinky: top-left
    { col: COLS - 1, row: ROWS - 2 }, // Inky: bottom-right
    { col: 0, row: ROWS - 2 },     // Clyde: bottom-left
  ];

  // Build warp pairs
  const warpPairs: WarpPair[] = [];
  for (const [id, endpoints] of warpEndpoints) {
    if (endpoints.length === 2) {
      warpPairs.push({ id, a: endpoints[0], b: endpoints[1] });
    }
  }

  return {
    tiles,
    pacmanSpawn,
    ghostHouseEntrance,
    ghostSpawns,
    fruitSpawn,
    scatterTargets,
    warpPairs,
    hasSpeedPads,
    dotCount,
  };
}
