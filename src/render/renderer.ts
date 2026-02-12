import {
  TILE, COLS, ROWS, CANVAS_W, CANVAS_H,
  COLOR, FRUIT_TYPES, SCORE_FLOAT_DURATION,
} from '../constants';
import { TileType, GhostMode, Direction, FloatingScore, BonusFruit, HighScoreEntry } from '../types';
import { TileMap } from '../world/tilemap';
import { PacMan } from '../entities/pacman';
import { Ghost } from '../entities/ghost';

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private time = 0;

  constructor(canvas: HTMLCanvasElement) {
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;
    this.ctx = canvas.getContext('2d')!;
  }

  getCtx(): CanvasRenderingContext2D {
    return this.ctx;
  }

  clear(): void {
    this.ctx.fillStyle = COLOR.BG;
    this.ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }

  drawMaze(map: TileMap): void {
    const ctx = this.ctx;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const t = map.tiles[r][c];
        const x = c * TILE;
        const y = r * TILE;

        if (t === TileType.WALL) {
          ctx.fillStyle = COLOR.WALL;
          ctx.fillRect(x, y, TILE, TILE);
          ctx.strokeStyle = COLOR.WALL_STROKE;
          ctx.lineWidth = 0.5;
          if (r > 0 && map.tiles[r - 1][c] !== TileType.WALL) {
            ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + TILE, y); ctx.stroke();
          }
          if (r < ROWS - 1 && map.tiles[r + 1][c] !== TileType.WALL) {
            ctx.beginPath(); ctx.moveTo(x, y + TILE); ctx.lineTo(x + TILE, y + TILE); ctx.stroke();
          }
          if (c > 0 && map.tiles[r][c - 1] !== TileType.WALL) {
            ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + TILE); ctx.stroke();
          }
          if (c < COLS - 1 && map.tiles[r][c + 1] !== TileType.WALL) {
            ctx.beginPath(); ctx.moveTo(x + TILE, y); ctx.lineTo(x + TILE, y + TILE); ctx.stroke();
          }
        } else if (t === TileType.DOT) {
          ctx.fillStyle = COLOR.DOT;
          ctx.beginPath();
          ctx.arc(x + TILE / 2, y + TILE / 2, 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (t === TileType.POWER) {
          const pulse = 0.5 + 0.5 * Math.sin(this.time * 6);
          ctx.fillStyle = COLOR.POWER_PELLET;
          ctx.globalAlpha = 0.5 + 0.5 * pulse;
          ctx.beginPath();
          ctx.arc(x + TILE / 2, y + TILE / 2, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowColor = COLOR.GLOW_MAGENTA;
          ctx.shadowBlur = 8 * pulse;
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.globalAlpha = 1;
        } else if (t === TileType.GATE) {
          if (map.gateFlashing) {
            const flash = Math.sin(this.time * 12) > 0;
            ctx.fillStyle = flash ? COLOR.GATE : COLOR.GATE_CLOSED;
          } else {
            ctx.fillStyle = map.gatesOpen ? COLOR.GATE : COLOR.GATE_CLOSED;
          }
          ctx.fillRect(x, y + TILE / 2 - 2, TILE, 4);
        } else if (t === TileType.SPEED_PAD) {
          // Animated neon-green chevrons
          const pulse = 0.5 + 0.5 * Math.sin(this.time * 4);
          ctx.strokeStyle = '#44ff44';
          ctx.globalAlpha = 0.4 + 0.3 * pulse;
          ctx.lineWidth = 1.5;
          const cx = x + TILE / 2;
          const cy = y + TILE / 2;
          // Draw two chevrons pointing right (direction of speed)
          const offset = Math.sin(this.time * 6) * 2;
          for (let i = -1; i <= 1; i += 2) {
            const ox = cx + i * 3 + offset;
            ctx.beginPath();
            ctx.moveTo(ox - 2, cy - 4);
            ctx.lineTo(ox + 2, cy);
            ctx.lineTo(ox - 2, cy + 4);
            ctx.stroke();
          }
          ctx.shadowColor = '#44ff44';
          ctx.shadowBlur = 4 * pulse;
          ctx.stroke();
          ctx.shadowBlur = 0;
          ctx.globalAlpha = 1;
        } else if (t === TileType.WARP_TUNNEL) {
          // Pulsing purple portal swirl
          const pulse = 0.5 + 0.5 * Math.sin(this.time * 5);
          const cx = x + TILE / 2;
          const cy = y + TILE / 2;
          ctx.globalAlpha = 0.4 + 0.4 * pulse;
          ctx.strokeStyle = '#aa44ff';
          ctx.lineWidth = 1.5;
          ctx.shadowColor = '#aa44ff';
          ctx.shadowBlur = 6 * pulse;
          // Draw spiral arcs
          for (let a = 0; a < 3; a++) {
            const angle = this.time * 3 + (a * Math.PI * 2) / 3;
            const r = 3 + pulse * 2;
            ctx.beginPath();
            ctx.arc(cx, cy, r, angle, angle + Math.PI * 0.8);
            ctx.stroke();
          }
          // Center dot
          ctx.fillStyle = '#dd88ff';
          ctx.beginPath();
          ctx.arc(cx, cy, 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.globalAlpha = 1;
        }
      }
    }
  }

  drawPacMan(pac: PacMan): void {
    const ctx = this.ctx;

    // Draw trail
    for (let i = 0; i < pac.trail.length; i++) {
      const alpha = (i / pac.trail.length) * 0.3;
      ctx.fillStyle = `rgba(255,225,53,${alpha})`;
      ctx.beginPath();
      ctx.arc(pac.trail[i].x, pac.trail[i].y, TILE / 2 - 2, 0, Math.PI * 2);
      ctx.fill();
    }

    if (!pac.alive) {
      const progress = Math.min(pac.deathTimer / 1.0, 1);
      const radius = (TILE / 2 - 1) * (1 - progress);
      if (radius > 0) {
        ctx.fillStyle = COLOR.PACMAN;
        ctx.beginPath();
        ctx.arc(pac.x, pac.y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
      return;
    }

    let angle = 0;
    switch (pac.dir) {
      case Direction.RIGHT: angle = 0; break;
      case Direction.DOWN: angle = Math.PI / 2; break;
      case Direction.LEFT: angle = Math.PI; break;
      case Direction.UP: angle = -Math.PI / 2; break;
    }

    const mouth = pac.mouthAngle * 0.5;
    const r = TILE / 2 - 1;

    ctx.shadowColor = COLOR.PACMAN;
    ctx.shadowBlur = 10;
    ctx.fillStyle = COLOR.PACMAN;
    ctx.beginPath();
    ctx.arc(pac.x, pac.y, r, angle + mouth, angle + Math.PI * 2 - mouth);
    ctx.lineTo(pac.x, pac.y);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  drawGhost(ghost: Ghost): void {
    const ctx = this.ctx;
    const r = TILE / 2 - 1;
    const isFrightened = ghost.mode === GhostMode.FRIGHTENED;
    const isEaten = ghost.mode === GhostMode.EATEN;

    // Trail
    for (let i = 0; i < ghost.trail.length; i++) {
      const alpha = (i / ghost.trail.length) * 0.15;
      ctx.fillStyle = isFrightened
        ? `rgba(45,45,255,${alpha})`
        : isEaten
          ? `rgba(150,150,255,${alpha * 0.3})`
          : `rgba(150,150,255,${alpha})`;
      ctx.beginPath();
      ctx.arc(ghost.trail[i].x, ghost.trail[i].y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Eaten ghosts: just draw eyes retreating to ghost house
    if (isEaten) {
      this.drawGhostEyes(ghost, r);
      return;
    }

    // Body color
    let bodyColor = ghost.color;
    if (isFrightened) {
      bodyColor = ghost.isFlashing && Math.sin(this.time * 16) > 0
        ? COLOR.FRIGHTENED_FLASH
        : COLOR.FRIGHTENED;
    }

    // Ghost body (rounded top + wavy bottom)
    ctx.fillStyle = bodyColor;
    ctx.shadowColor = bodyColor;
    ctx.shadowBlur = 6;

    ctx.beginPath();
    ctx.arc(ghost.x, ghost.y - 2, r, Math.PI, 0);
    const wavePhase = this.time * 8;
    ctx.lineTo(ghost.x + r, ghost.y + r - 2);
    for (let i = r; i >= -r; i -= 3) {
      const wave = Math.sin(wavePhase + i * 0.5) * 2;
      ctx.lineTo(ghost.x + i, ghost.y + r - 2 + wave);
    }
    ctx.lineTo(ghost.x - r, ghost.y - 2);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    if (isFrightened) {
      // Vulnerable face: small squinty eyes + wavy frown
      const flashWhite = ghost.isFlashing && Math.sin(this.time * 16) > 0;
      const faceColor = flashWhite ? '#ff0000' : '#ffcccc';

      // Small dot eyes
      ctx.fillStyle = faceColor;
      ctx.beginPath();
      ctx.arc(ghost.x - 3, ghost.y - 3, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(ghost.x + 3, ghost.y - 3, 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Wavy frown mouth
      ctx.strokeStyle = faceColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(ghost.x - 4, ghost.y + 2);
      for (let i = 0; i <= 8; i++) {
        const mx = ghost.x - 4 + i;
        const my = ghost.y + 2 + (i % 2 === 0 ? 0 : 2);
        ctx.lineTo(mx, my);
      }
      ctx.stroke();
    } else {
      // Normal eyes
      this.drawGhostEyes(ghost, r);
    }
  }

  private drawGhostEyes(ghost: Ghost, _r: number): void {
    const ctx = this.ctx;
    const eyeOffX = ghost.dir === Direction.LEFT ? -2 : ghost.dir === Direction.RIGHT ? 2 : 0;
    const eyeOffY = ghost.dir === Direction.UP ? -2 : ghost.dir === Direction.DOWN ? 2 : 0;

    // White of eye
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(ghost.x - 3, ghost.y - 3, 3, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(ghost.x + 3, ghost.y - 3, 3, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Blue pupils looking in direction of movement
    ctx.fillStyle = '#22f';
    ctx.beginPath();
    ctx.arc(ghost.x - 3 + eyeOffX, ghost.y - 3 + eyeOffY, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(ghost.x + 3 + eyeOffX, ghost.y - 3 + eyeOffY, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  drawGhosts(ghosts: Ghost[]): void {
    for (const g of ghosts) {
      this.drawGhost(g);
    }
  }

  drawFruit(fruit: BonusFruit): void {
    const ctx = this.ctx;
    const ft = FRUIT_TYPES[fruit.typeIndex];
    const x = fruit.col * TILE + TILE / 2;
    const y = fruit.row * TILE + TILE / 2;

    // Pulsing glow
    const pulse = 0.7 + 0.3 * Math.sin(this.time * 5);

    ctx.shadowColor = ft.color;
    ctx.shadowBlur = 8 * pulse;

    switch (ft.shape) {
      case 'cherry':
        // Two red circles with green stem
        ctx.fillStyle = ft.color;
        ctx.beginPath();
        ctx.arc(x - 2, y + 2, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + 3, y + 2, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#44ff44';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x - 2, y - 1);
        ctx.quadraticCurveTo(x, y - 5, x + 1, y - 6);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + 3, y - 1);
        ctx.quadraticCurveTo(x + 1, y - 4, x + 1, y - 6);
        ctx.stroke();
        break;
      case 'strawberry':
        ctx.fillStyle = ft.color;
        ctx.beginPath();
        ctx.moveTo(x, y - 5);
        ctx.lineTo(x + 4, y + 1);
        ctx.lineTo(x, y + 5);
        ctx.lineTo(x - 4, y + 1);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#44ff44';
        ctx.fillRect(x - 2, y - 6, 4, 2);
        break;
      case 'orange':
        ctx.fillStyle = ft.color;
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#44ff44';
        ctx.fillRect(x - 1, y - 6, 2, 2);
        break;
      case 'apple':
        ctx.fillStyle = ft.color;
        ctx.beginPath();
        ctx.arc(x, y + 1, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#44ff44';
        ctx.fillRect(x - 1, y - 5, 2, 3);
        break;
      case 'melon':
        ctx.fillStyle = ft.color;
        ctx.beginPath();
        ctx.ellipse(x, y, 6, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#228822';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(x - 4, y - 3);
        ctx.quadraticCurveTo(x, y + 5, x + 4, y - 3);
        ctx.stroke();
        break;
      case 'galaxian':
        ctx.fillStyle = ft.color;
        ctx.beginPath();
        ctx.moveTo(x, y - 5);
        ctx.lineTo(x + 5, y + 3);
        ctx.lineTo(x, y + 1);
        ctx.lineTo(x - 5, y + 3);
        ctx.closePath();
        ctx.fill();
        break;
      case 'bell':
        ctx.fillStyle = ft.color;
        ctx.beginPath();
        ctx.arc(x, y - 1, 5, Math.PI, 0);
        ctx.lineTo(x + 6, y + 4);
        ctx.lineTo(x - 6, y + 4);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, y + 5, 1.5, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'key':
        ctx.fillStyle = ft.color;
        ctx.beginPath();
        ctx.arc(x, y - 3, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(x - 1, y, 2, 6);
        ctx.fillRect(x, y + 3, 3, 1.5);
        ctx.fillRect(x, y + 5, 2, 1.5);
        break;
    }

    ctx.shadowBlur = 0;
  }

  drawFloatingScores(scores: FloatingScore[]): void {
    const ctx = this.ctx;
    for (const s of scores) {
      const progress = s.timer / SCORE_FLOAT_DURATION;
      const alpha = 1 - progress;
      const yOff = -20 * progress; // float upward

      ctx.globalAlpha = alpha;
      ctx.fillStyle = s.color;
      ctx.shadowColor = s.color;
      ctx.shadowBlur = 8;
      ctx.font = 'bold 10px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(s.text, s.x, s.y + yOff);
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
      ctx.textAlign = 'left';
    }
  }

  tick(dt: number): void {
    this.time += dt;
  }

  drawOverlay(text: string, sub?: string): void {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    ctx.fillStyle = COLOR.GLOW_CYAN;
    ctx.shadowColor = COLOR.GLOW_CYAN;
    ctx.shadowBlur = 20;
    ctx.font = 'bold 24px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(text, CANVAS_W / 2, CANVAS_H / 2 - 20);

    if (sub) {
      ctx.font = '14px "Courier New", monospace';
      ctx.fillStyle = COLOR.TEXT;
      ctx.shadowBlur = 0;
      ctx.fillText(sub, CANVAS_W / 2, CANVAS_H / 2 + 20);
    }

    ctx.shadowBlur = 0;
    ctx.textAlign = 'left';
  }

  drawMenu(highScores: HighScoreEntry[] = []): void {
    const ctx = this.ctx;
    ctx.fillStyle = COLOR.BG;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    ctx.fillStyle = COLOR.PACMAN;
    ctx.shadowColor = COLOR.PACMAN;
    ctx.shadowBlur = 20;
    ctx.font = 'bold 32px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('PAC-MAN', CANVAS_W / 2, 80);
    ctx.shadowBlur = 0;

    ctx.fillStyle = COLOR.GLOW_MAGENTA;
    ctx.font = '14px "Courier New", monospace';
    ctx.fillText('NEON EDITION', CANVAS_W / 2, 110);

    ctx.fillStyle = COLOR.TEXT;
    ctx.font = '12px "Courier New", monospace';
    const lines = [
      'Arrow Keys / WASD - Move',
      'P - Pause    R - Restart',
      'M - Mute     G - Toggle Gates',
    ];
    lines.forEach((line, i) => {
      ctx.fillText(line, CANVAS_W / 2, 145 + i * 18);
    });

    // High scores
    if (highScores.length > 0) {
      ctx.fillStyle = COLOR.GLOW_CYAN;
      ctx.shadowColor = COLOR.GLOW_CYAN;
      ctx.shadowBlur = 10;
      ctx.font = 'bold 14px "Courier New", monospace';
      ctx.fillText('HIGH SCORES', CANVAS_W / 2, 220);
      ctx.shadowBlur = 0;

      ctx.font = '12px "Courier New", monospace';
      highScores.forEach((entry, i) => {
        ctx.fillStyle = i === 0 ? COLOR.PACMAN : COLOR.TEXT;
        const rank = `${i + 1}.`;
        const name = entry.name.padEnd(10, ' ');
        ctx.fillText(`${rank} ${name} ${entry.score}`, CANVAS_W / 2, 245 + i * 18);
      });
    }

    ctx.fillStyle = COLOR.GLOW_MAGENTA;
    ctx.font = '14px "Courier New", monospace';
    const startY = highScores.length > 0 ? 245 + highScores.length * 18 + 20 : 220;
    ctx.fillText('Press ENTER or SPACE to start', CANVAS_W / 2, startY);

    ctx.textAlign = 'left';
  }

  drawEnterName(score: number, textBuffer: string, isTop: boolean): void {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    ctx.textAlign = 'center';

    const heading = isTop ? 'NEW HIGH SCORE!' : 'TOP 5 SCORE!';
    ctx.fillStyle = COLOR.PACMAN;
    ctx.shadowColor = COLOR.PACMAN;
    ctx.shadowBlur = 20;
    ctx.font = 'bold 20px "Courier New", monospace';
    ctx.fillText(heading, CANVAS_W / 2, CANVAS_H / 2 - 60);
    ctx.shadowBlur = 0;

    ctx.fillStyle = COLOR.GLOW_CYAN;
    ctx.font = 'bold 24px "Courier New", monospace';
    ctx.fillText(String(score), CANVAS_W / 2, CANVAS_H / 2 - 30);

    ctx.fillStyle = COLOR.TEXT;
    ctx.font = '14px "Courier New", monospace';
    ctx.fillText('Enter your name:', CANVAS_W / 2, CANVAS_H / 2 + 10);

    // Name input with blinking cursor
    const cursor = Math.sin(this.time * 6) > 0 ? '_' : ' ';
    const displayText = textBuffer + cursor;
    ctx.fillStyle = COLOR.GLOW_MAGENTA;
    ctx.shadowColor = COLOR.GLOW_MAGENTA;
    ctx.shadowBlur = 10;
    ctx.font = 'bold 20px "Courier New", monospace';
    ctx.fillText(displayText, CANVAS_W / 2, CANVAS_H / 2 + 40);
    ctx.shadowBlur = 0;

    ctx.fillStyle = COLOR.TEXT;
    ctx.font = '11px "Courier New", monospace';
    ctx.fillText('Press ENTER to confirm', CANVAS_W / 2, CANVAS_H / 2 + 70);

    ctx.textAlign = 'left';
  }

  drawHighScoreBanner(): void {
    const ctx = this.ctx;
    const pulse = 0.7 + 0.3 * Math.sin(this.time * 8);

    ctx.textAlign = 'center';
    ctx.fillStyle = COLOR.PACMAN;
    ctx.shadowColor = COLOR.PACMAN;
    ctx.shadowBlur = 20 * pulse;
    ctx.font = 'bold 16px "Courier New", monospace';
    ctx.fillText('★ NEW HIGH SCORE! ★', CANVAS_W / 2, CANVAS_H / 2 + 50);
    ctx.shadowBlur = 0;
    ctx.textAlign = 'left';
  }

  drawLevelSelect(buffer: string, maxLevel: number): void {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(CANVAS_W / 2 - 100, CANVAS_H / 2 - 50, 200, 100);

    ctx.strokeStyle = COLOR.GLOW_MAGENTA;
    ctx.shadowColor = COLOR.GLOW_MAGENTA;
    ctx.shadowBlur = 8;
    ctx.lineWidth = 1;
    ctx.strokeRect(CANVAS_W / 2 - 100, CANVAS_H / 2 - 50, 200, 100);
    ctx.shadowBlur = 0;

    ctx.textAlign = 'center';

    ctx.fillStyle = COLOR.GLOW_CYAN;
    ctx.font = 'bold 12px "Courier New", monospace';
    ctx.fillText(`Level (1-${maxLevel}):`, CANVAS_W / 2, CANVAS_H / 2 - 18);

    // Input with blinking cursor
    const cursor = Math.sin(this.time * 6) > 0 ? '_' : ' ';
    ctx.fillStyle = COLOR.GLOW_MAGENTA;
    ctx.shadowColor = COLOR.GLOW_MAGENTA;
    ctx.shadowBlur = 10;
    ctx.font = 'bold 24px "Courier New", monospace';
    ctx.fillText(buffer + cursor, CANVAS_W / 2, CANVAS_H / 2 + 14);
    ctx.shadowBlur = 0;

    ctx.fillStyle = COLOR.TEXT;
    ctx.font = '10px "Courier New", monospace';
    ctx.fillText('ENTER to go / X or ESC to cancel', CANVAS_W / 2, CANVAS_H / 2 + 38);

    ctx.textAlign = 'left';
  }
}
