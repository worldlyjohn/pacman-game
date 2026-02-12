import {
  TILE,
  GamePhase,
  SCORE_DOT, SCORE_POWER, SCORE_GHOST_BASE, EXTRA_LIFE_AT,
  READY_DURATION, DEAD_DURATION, LEVEL_CLEAR_DURATION,
  FRUIT_DOT_THRESHOLDS, FRUIT_DURATION,
  FRUIT_TYPES, GHOST_EAT_FREEZE, SCORE_FLOAT_DURATION,
  HIGH_SCORE_MAX, HIGH_SCORE_KEY,
} from '../constants';
import { TileType, GhostMode, FloatingScore, BonusFruit, HighScoreEntry } from '../types';
import { InputHandler } from '../input/input';
import { TileMap } from '../world/tilemap';
import { PacMan } from '../entities/pacman';
import { Ghost, createGhosts } from '../entities/ghost';
import { Renderer } from '../render/renderer';
import { AudioManager } from '../audio/audio';
import { HUD } from '../ui/hud';
import { LevelManager } from '../world/level-manager';

export class Game {
  phase: GamePhase = GamePhase.MENU;
  private map: TileMap;
  private pacman: PacMan;
  private ghosts: Ghost[];
  private input: InputHandler;
  private renderer: Renderer;
  private audio: AudioManager;
  private hud: HUD;
  private levelManager: LevelManager;

  private score = 0;
  private lives = 3;
  private level = 1;
  private ghostCombo = 0;
  private extraLifeAwarded = false;

  private phaseTimer = 0;
  private wakaTimer = 0;
  private readonly WAKA_INTERVAL = 0.18;

  // Dots eaten this level (for fruit spawning)
  private dotsEatenThisLevel = 0;
  private fruitSpawnCount = 0;

  // Dynamic fruit spawn position (from BoardData)
  private fruitSpawnCol = 14;
  private fruitSpawnRow = 17;

  // Active bonus fruit on the field
  private fruit: BonusFruit | null = null;

  // Floating score popups
  private floatingScores: FloatingScore[] = [];

  // Freeze frame when eating a ghost
  private freezeTimer = 0;

  // High scores
  private highScores: HighScoreEntry[] = [];
  private newHighScoreBanner = 0; // timer for "NEW HIGH SCORE!" banner

  // Level select
  private preLevelSelectPhase: GamePhase = GamePhase.MENU;

  constructor(canvas: HTMLCanvasElement) {
    this.map = new TileMap();
    this.pacman = new PacMan();
    this.ghosts = createGhosts();
    this.input = new InputHandler();
    this.renderer = new Renderer(canvas);
    this.audio = new AudioManager();
    this.hud = new HUD();
    this.levelManager = new LevelManager();
    this.highScores = this.loadHighScores();
  }

  private loadHighScores(): HighScoreEntry[] {
    try {
      const raw = localStorage.getItem(HIGH_SCORE_KEY);
      if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return [];
  }

  private saveHighScores(): void {
    try {
      localStorage.setItem(HIGH_SCORE_KEY, JSON.stringify(this.highScores));
    } catch { /* ignore */ }
  }

  private isTopScore(score: number): boolean {
    if (score <= 0) return false;
    if (this.highScores.length === 0) return true;
    return score > this.highScores[0].score;
  }

  private isHighScore(score: number): boolean {
    if (score <= 0) return false;
    if (this.highScores.length < HIGH_SCORE_MAX) return true;
    return score > this.highScores[this.highScores.length - 1].score;
  }

  private loadLevel(level: number): void {
    const board = this.levelManager.getBoardForLevel(level);

    // Load the board into the tile map
    this.map.loadBoard(board);

    // Configure Pac-Man spawn
    this.pacman.setSpawn(board.pacmanSpawn.col, board.pacmanSpawn.row);

    // Configure fruit spawn position
    this.fruitSpawnCol = board.fruitSpawn.col;
    this.fruitSpawnRow = board.fruitSpawn.row;

    // Configure each ghost with board-derived data
    for (let i = 0; i < this.ghosts.length; i++) {
      if (i < board.ghostSpawns.length) {
        const scatter = board.scatterTargets[i] ?? board.scatterTargets[0];
        this.ghosts[i].configure(board.ghostSpawns[i], board.ghostHouseEntrance, scatter);
      }
    }

    // Reset all entities for new level
    this.pacman.reset();
    this.ghosts.forEach(g => g.reset());
  }

  update(dt: number): void {
    // Global keys
    if (this.input.consumeMute()) {
      this.audio.toggleMute();
    }

    // Secret level select (X key) — available from most phases
    if (this.phase !== GamePhase.LEVEL_SELECT && this.phase !== GamePhase.ENTER_NAME) {
      if (this.input.consumeLevelSelect()) {
        this.preLevelSelectPhase = this.phase;
        this.phase = GamePhase.LEVEL_SELECT;
        this.input.startLevelSelect();
      }
    }

    // Always tick floating scores (even during freeze/pause)
    this.updateFloatingScores(dt);

    switch (this.phase) {
      case GamePhase.MENU:
        this.updateMenu();
        break;
      case GamePhase.READY:
        this.updateReady(dt);
        break;
      case GamePhase.PLAYING:
        this.updatePlaying(dt);
        break;
      case GamePhase.PAUSED:
        this.updatePaused();
        break;
      case GamePhase.DEAD:
        this.updateDead(dt);
        break;
      case GamePhase.LEVEL_CLEAR:
        this.updateLevelClear(dt);
        break;
      case GamePhase.GAME_OVER:
        this.updateGameOver(dt);
        break;
      case GamePhase.ENTER_NAME:
        this.updateEnterName();
        break;
      case GamePhase.LEVEL_SELECT:
        this.updateLevelSelect();
        break;
    }
  }

  private updateMenu(): void {
    if (this.input.consumeEnter()) {
      this.startGame();
    }
  }

  private startGame(): void {
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.extraLifeAwarded = false;
    this.dotsEatenThisLevel = 0;
    this.fruitSpawnCount = 0;
    this.fruit = null;
    this.floatingScores = [];
    this.freezeTimer = 0;
    this.loadLevel(1);
    this.phase = GamePhase.READY;
    this.phaseTimer = 0;
    this.audio.startBgPulse();
  }

  private updateReady(dt: number): void {
    this.phaseTimer += dt * 1000;
    if (this.phaseTimer >= READY_DURATION) {
      this.phase = GamePhase.PLAYING;
    }
  }

  private updatePlaying(dt: number): void {
    // Freeze frame after eating a ghost
    if (this.freezeTimer > 0) {
      this.freezeTimer -= dt * 1000;
      return;
    }

    // Pause
    if (this.input.consumePause()) {
      this.phase = GamePhase.PAUSED;
      return;
    }
    // Restart
    if (this.input.consumeRestart()) {
      this.startGame();
      return;
    }
    // Manual gate toggle
    if (this.input.consumeGate()) {
      this.map.gatesOpen = !this.map.gatesOpen;
    }

    // Apply buffered direction
    this.pacman.nextDir = this.input.bufferedDir;

    // Update entities
    this.pacman.update(dt, this.map);
    const blinky = this.ghosts[0];
    for (const ghost of this.ghosts) {
      ghost.update(dt, this.map, this.pacman, ghost === blinky ? null : blinky);
    }

    // Gate timer
    this.map.updateGate(dt * 1000);

    // Waka sound
    this.wakaTimer += dt;

    // Dot eating
    const pt = this.pacman.getTile(this.map);
    const eaten = this.map.eatDot(pt.col, pt.row);
    if (eaten === TileType.DOT) {
      this.score += SCORE_DOT;
      this.dotsEatenThisLevel++;
      if (this.wakaTimer >= this.WAKA_INTERVAL) {
        this.audio.playWaka();
        this.wakaTimer = 0;
      }
      this.checkFruitSpawn();
    } else if (eaten === TileType.POWER) {
      this.score += SCORE_POWER;
      this.dotsEatenThisLevel++;
      this.ghostCombo = 0;
      this.audio.playPowerPellet();
      this.audio.startFrightenedSound();
      for (const g of this.ghosts) {
        g.frighten();
      }
      this.checkFruitSpawn();
    }

    // Fruit timer & collision
    this.updateFruit(dt);

    // Check ghost collisions — eat frightened ghosts first, then check for death
    let killedByGhost = false;
    for (const ghost of this.ghosts) {
      if (!ghost.released) continue;
      const dx = this.pacman.x - ghost.x;
      const dy = this.pacman.y - ghost.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < TILE * 0.7) {
        if (ghost.mode === GhostMode.FRIGHTENED) {
          // Eat the ghost
          const points = SCORE_GHOST_BASE * Math.pow(2, this.ghostCombo);
          ghost.eat();
          this.ghostCombo++;
          this.score += points;
          this.audio.playGhostEat();

          // Floating score text at ghost position
          this.floatingScores.push({
            x: ghost.x,
            y: ghost.y,
            text: String(points),
            color: '#00ffff',
            timer: 0,
          });

          // Freeze frame
          this.freezeTimer = GHOST_EAT_FREEZE;
        } else if (ghost.mode !== GhostMode.EATEN) {
          killedByGhost = true;
        }
      }
    }
    if (killedByGhost) {
      this.pacmanDie();
      return;
    }

    // Check if any ghost is still frightened
    const anyFrightened = this.ghosts.some(g => g.mode === GhostMode.FRIGHTENED);
    if (!anyFrightened) {
      this.audio.stopFrightenedSound();
    }

    // Tempo ramp based on dots eaten
    const ratio = 1 + (1 - this.map.dotsRemaining / this.map.totalDots) * 0.5;
    this.audio.setTempo(ratio);

    // Extra life
    if (!this.extraLifeAwarded && this.score >= EXTRA_LIFE_AT) {
      this.lives++;
      this.extraLifeAwarded = true;
    }

    // Level clear
    if (this.map.dotsRemaining <= 0) {
      this.phase = GamePhase.LEVEL_CLEAR;
      this.phaseTimer = 0;
      this.fruit = null;
      this.audio.playLevelClear();
    }
  }

  private checkFruitSpawn(): void {
    if (this.fruitSpawnCount >= FRUIT_DOT_THRESHOLDS.length) return;
    if (this.dotsEatenThisLevel >= FRUIT_DOT_THRESHOLDS[this.fruitSpawnCount]) {
      const typeIndex = Math.min(this.level - 1, FRUIT_TYPES.length - 1);
      this.fruit = {
        col: this.fruitSpawnCol,
        row: this.fruitSpawnRow,
        typeIndex,
        timer: 0,
        eaten: false,
      };
      this.fruitSpawnCount++;
    }
  }

  private updateFruit(dt: number): void {
    if (!this.fruit || this.fruit.eaten) return;

    this.fruit.timer += dt * 1000;

    // Despawn after timeout
    if (this.fruit.timer >= FRUIT_DURATION) {
      this.fruit = null;
      return;
    }

    // Check Pac-Man collision
    const fx = this.fruit.col * TILE + TILE / 2;
    const fy = this.fruit.row * TILE + TILE / 2;
    const dx = this.pacman.x - fx;
    const dy = this.pacman.y - fy;
    if (Math.abs(dx) < TILE && Math.abs(dy) < TILE) {
      const fruitType = FRUIT_TYPES[this.fruit.typeIndex];
      this.score += fruitType.points;
      this.audio.playFruitEat();

      // Floating score
      this.floatingScores.push({
        x: fx,
        y: fy,
        text: String(fruitType.points),
        color: fruitType.color,
        timer: 0,
      });

      this.fruit.eaten = true;
      this.fruit = null;
    }
  }

  private updateFloatingScores(dt: number): void {
    for (let i = this.floatingScores.length - 1; i >= 0; i--) {
      this.floatingScores[i].timer += dt * 1000;
      if (this.floatingScores[i].timer >= SCORE_FLOAT_DURATION) {
        this.floatingScores.splice(i, 1);
      }
    }
  }

  private pacmanDie(): void {
    this.pacman.alive = false;
    this.phase = GamePhase.DEAD;
    this.phaseTimer = 0;
    this.audio.playDeath();
    this.audio.stopFrightenedSound();
  }

  private updatePaused(): void {
    if (this.input.consumePause() || this.input.consumeEnter()) {
      this.phase = GamePhase.PLAYING;
    }
    if (this.input.consumeRestart()) {
      this.startGame();
    }
  }

  private updateDead(dt: number): void {
    this.phaseTimer += dt * 1000;
    this.pacman.update(dt, this.map); // for death animation
    if (this.phaseTimer >= DEAD_DURATION) {
      this.lives--;
      if (this.lives <= 0) {
        this.audio.stopBgPulse();
        if (this.isHighScore(this.score)) {
          this.phase = GamePhase.ENTER_NAME;
          this.input.startTextInput();
        } else {
          this.phase = GamePhase.GAME_OVER;
        }
      } else {
        this.pacman.reset();
        this.ghosts.forEach(g => g.reset());
        this.phase = GamePhase.READY;
        this.phaseTimer = 0;
      }
    }
  }

  private updateLevelClear(dt: number): void {
    this.phaseTimer += dt * 1000;
    if (this.phaseTimer >= LEVEL_CLEAR_DURATION) {
      this.level++;
      this.dotsEatenThisLevel = 0;
      this.fruitSpawnCount = 0;
      this.fruit = null;
      this.loadLevel(this.level);
      this.phase = GamePhase.READY;
      this.phaseTimer = 0;
    }
  }

  private updateEnterName(): void {
    if (this.input.textSubmitted) {
      const name = this.input.textBuffer.trim() || 'AAA';
      const isTop = this.isTopScore(this.score);
      this.input.stopTextInput();
      this.highScores.push({ name, score: this.score });
      this.highScores.sort((a, b) => b.score - a.score);
      if (this.highScores.length > HIGH_SCORE_MAX) {
        this.highScores.length = HIGH_SCORE_MAX;
      }
      this.saveHighScores();
      if (isTop) {
        this.newHighScoreBanner = 3000;
      }
      this.phase = GamePhase.GAME_OVER;
    }
  }

  private updateLevelSelect(): void {
    if (this.input.levelSelectCancelled) {
      this.input.stopLevelSelect();
      this.phase = this.preLevelSelectPhase;
      return;
    }
    if (this.input.levelSelectSubmitted) {
      const num = parseInt(this.input.levelSelectBuffer, 10);
      this.input.stopLevelSelect();
      if (num >= 1 && num <= this.levelManager.boardCount) {
        // Jump to that level, starting a fresh game at that level
        this.score = 0;
        this.lives = 3;
        this.level = num;
        this.extraLifeAwarded = false;
        this.dotsEatenThisLevel = 0;
        this.fruitSpawnCount = 0;
        this.fruit = null;
        this.floatingScores = [];
        this.freezeTimer = 0;
        this.loadLevel(num);
        this.phase = GamePhase.READY;
        this.phaseTimer = 0;
        this.audio.startBgPulse();
      } else {
        // Invalid level — return to previous screen
        this.phase = this.preLevelSelectPhase;
      }
      return;
    }
  }

  private updateGameOver(dt: number): void {
    if (this.newHighScoreBanner > 0) {
      this.newHighScoreBanner -= dt * 1000;
    }
    if (this.input.consumeEnter() || this.input.consumeRestart()) {
      this.newHighScoreBanner = 0;
      this.phase = GamePhase.MENU;
    }
  }

  draw(): void {
    this.renderer.clear();

    if (this.phase === GamePhase.MENU) {
      this.renderer.drawMenu(this.highScores);
      return;
    }

    if (this.phase === GamePhase.LEVEL_SELECT && this.preLevelSelectPhase === GamePhase.MENU) {
      this.renderer.drawMenu(this.highScores);
      this.renderer.drawLevelSelect(this.input.levelSelectBuffer, this.levelManager.boardCount);
      return;
    }

    // Draw game world
    this.renderer.drawMaze(this.map);

    // Draw fruit
    if (this.fruit && !this.fruit.eaten) {
      this.renderer.drawFruit(this.fruit);
    }

    this.renderer.drawGhosts(this.ghosts);
    this.renderer.drawPacMan(this.pacman);

    // Floating score popups
    this.renderer.drawFloatingScores(this.floatingScores);

    // HUD
    const ctx = this.renderer.getCtx();
    const activeGhostMode = this.ghosts[0].mode;
    this.hud.draw(
      ctx,
      this.score,
      this.lives,
      this.map.dotsRemaining,
      this.map.totalDots,
      this.level,
      this.audio.muted,
      this.map.gatesOpen,
      activeGhostMode,
    );

    // Phase overlays
    const boardName = this.levelManager.getBoardName(this.level);
    switch (this.phase) {
      case GamePhase.READY:
        this.renderer.drawOverlay('READY!', `Level ${this.level} \u2014 ${boardName}`);
        break;
      case GamePhase.PAUSED:
        this.renderer.drawOverlay('PAUSED', 'Press P or ENTER to resume');
        break;
      case GamePhase.DEAD:
        break;
      case GamePhase.LEVEL_CLEAR:
        this.renderer.drawOverlay('LEVEL CLEAR!', `Score: ${this.score}`);
        break;
      case GamePhase.GAME_OVER:
        this.renderer.drawOverlay('GAME OVER', `Final Score: ${this.score} | Press ENTER`);
        if (this.newHighScoreBanner > 0) {
          this.renderer.drawHighScoreBanner();
        }
        break;
      case GamePhase.ENTER_NAME:
        this.renderer.drawEnterName(this.score, this.input.textBuffer, this.isTopScore(this.score));
        break;
      case GamePhase.LEVEL_SELECT:
        this.renderer.drawLevelSelect(this.input.levelSelectBuffer, this.levelManager.boardCount);
        break;
    }
  }

  tick(dt: number): void {
    this.renderer.tick(dt);
  }
}
