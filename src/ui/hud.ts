import { CANVAS_W, ROWS, TILE, COLOR } from '../constants';
import { GhostMode } from '../types';

export class HUD {
  draw(
    ctx: CanvasRenderingContext2D,
    score: number,
    lives: number,
    dotsRemaining: number,
    totalDots: number,
    level: number,
    muted: boolean,
    gatesOpen: boolean,
    ghostMode: GhostMode | null,
  ): void {
    const hudY = ROWS * TILE;
    const hudH = 48;

    // Background
    ctx.fillStyle = COLOR.HUD_BG;
    ctx.fillRect(0, hudY, CANVAS_W, hudH);

    // Divider line
    ctx.strokeStyle = COLOR.WALL_STROKE;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, hudY);
    ctx.lineTo(CANVAS_W, hudY);
    ctx.stroke();

    ctx.font = '11px "Courier New", monospace';
    ctx.textAlign = 'left';

    // Score
    ctx.fillStyle = COLOR.GLOW_CYAN;
    ctx.fillText(`SCORE: ${score}`, 8, hudY + 16);

    // Level
    ctx.fillStyle = COLOR.TEXT;
    ctx.fillText(`LVL: ${level}`, 140, hudY + 16);

    // Lives (pac-man icons)
    ctx.fillStyle = COLOR.PACMAN;
    for (let i = 0; i < lives; i++) {
      ctx.beginPath();
      ctx.arc(220 + i * 18, hudY + 13, 6, 0.25 * Math.PI, 1.75 * Math.PI);
      ctx.lineTo(220 + i * 18, hudY + 13);
      ctx.closePath();
      ctx.fill();
    }

    // Bottom row
    // Dots remaining
    ctx.fillStyle = COLOR.DOT;
    ctx.fillText(`DOTS: ${dotsRemaining}/${totalDots}`, 8, hudY + 36);

    // Indicators
    ctx.fillStyle = muted ? '#ff4444' : '#44ff44';
    ctx.fillText(muted ? 'MUTED' : 'SND', 140, hudY + 36);

    ctx.fillStyle = gatesOpen ? COLOR.GATE : COLOR.GATE_CLOSED;
    ctx.fillText(gatesOpen ? 'GATE:OPEN' : 'GATE:SHUT', 200, hudY + 36);

    // Ghost mode indicator
    if (ghostMode) {
      ctx.fillStyle = ghostMode === GhostMode.FRIGHTENED
        ? COLOR.FRIGHTENED
        : ghostMode === GhostMode.CHASE
          ? COLOR.BLINKY
          : COLOR.TEXT;
      ctx.fillText(ghostMode, 320, hudY + 36);
    }

    ctx.textAlign = 'left';
  }
}
