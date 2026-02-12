import { BoardData } from '../types';
import { BOARDS } from './boards';
import { parseBoard } from './board-parser';
import { validateBoard } from './board-validator';

export class LevelManager {
  private boards: (BoardData | null)[] = [];

  constructor() {
    for (const def of BOARDS) {
      try {
        const board = parseBoard(def);
        const result = validateBoard(board, def.name);
        if (result.valid) {
          this.boards.push(board);
        } else {
          console.error(`Board "${def.name}" failed validation, using fallback`);
          this.boards.push(null);
        }
      } catch (e) {
        console.error(`Board "${def.name}" parse error:`, e);
        this.boards.push(null);
      }
    }
  }

  getBoardForLevel(level: number): BoardData {
    // Levels are 1-indexed, cycle after all boards
    const index = (level - 1) % this.boards.length;
    const board = this.boards[index];
    if (board) return board;

    // Fallback to first valid board
    for (const b of this.boards) {
      if (b) return b;
    }

    // Should never happen if at least board 1 is valid
    throw new Error('No valid boards available');
  }

  getBoardName(level: number): string {
    const index = (level - 1) % BOARDS.length;
    return BOARDS[index].name;
  }

  get boardCount(): number {
    return this.boards.length;
  }
}
