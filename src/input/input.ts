import { Direction } from '../types';

export class InputHandler {
  currentDir: Direction = Direction.NONE;
  bufferedDir: Direction = Direction.NONE;
  pausePressed = false;
  restartPressed = false;
  mutePressed = false;
  gatePressed = false;
  enterPressed = false;
  levelSelectPressed = false;

  // Level select input
  levelSelectMode = false;
  levelSelectBuffer = '';
  levelSelectSubmitted = false;
  levelSelectCancelled = false;

  // Text input mode for name entry
  textMode = false;
  textBuffer = '';
  textSubmitted = false;
  constructor() {
    window.addEventListener('keydown', (e) => this.onKey(e));
  }

  private onKey(e: KeyboardEvent): void {
    // Level select input mode
    if (this.levelSelectMode) {
      if (e.key === 'Enter') {
        this.levelSelectSubmitted = true;
        e.preventDefault();
      } else if (e.key === 'Escape' || e.key === 'x' || e.key === 'X') {
        this.levelSelectCancelled = true;
        e.preventDefault();
      } else if (e.key === 'Backspace') {
        this.levelSelectBuffer = this.levelSelectBuffer.slice(0, -1);
        e.preventDefault();
      } else if (e.key >= '0' && e.key <= '9' && this.levelSelectBuffer.length < 3) {
        this.levelSelectBuffer += e.key;
        e.preventDefault();
      }
      return;
    }

    // Text input mode for high score name entry
    if (this.textMode) {
      if (e.key === 'Enter') {
        this.textSubmitted = true;
        e.preventDefault();
      } else if (e.key === 'Backspace') {
        this.textBuffer = this.textBuffer.slice(0, -1);
        e.preventDefault();
      } else if (e.key.length === 1 && this.textBuffer.length < 10) {
        this.textBuffer += e.key;
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        this.bufferedDir = Direction.UP;
        e.preventDefault();
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        this.bufferedDir = Direction.DOWN;
        e.preventDefault();
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        this.bufferedDir = Direction.LEFT;
        e.preventDefault();
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        this.bufferedDir = Direction.RIGHT;
        e.preventDefault();
        break;
      case 'p':
      case 'P':
        this.pausePressed = true;
        break;
      case 'r':
      case 'R':
        this.restartPressed = true;
        break;
      case 'm':
      case 'M':
        this.mutePressed = true;
        break;
      case 'g':
      case 'G':
        this.gatePressed = true;
        break;
      case 'x':
      case 'X':
        this.levelSelectPressed = true;
        break;
      case 'Enter':
      case ' ':
        this.enterPressed = true;
        e.preventDefault();
        break;
    }
  }

  startTextInput(): void {
    this.textMode = true;
    this.textBuffer = '';
    this.textSubmitted = false;
  }

  stopTextInput(): void {
    this.textMode = false;
    this.textSubmitted = false;
  }

  consumePause(): boolean {
    const v = this.pausePressed;
    this.pausePressed = false;
    return v;
  }

  consumeRestart(): boolean {
    const v = this.restartPressed;
    this.restartPressed = false;
    return v;
  }

  consumeMute(): boolean {
    const v = this.mutePressed;
    this.mutePressed = false;
    return v;
  }

  consumeGate(): boolean {
    const v = this.gatePressed;
    this.gatePressed = false;
    return v;
  }

  consumeEnter(): boolean {
    const v = this.enterPressed;
    this.enterPressed = false;
    return v;
  }

  consumeLevelSelect(): boolean {
    const v = this.levelSelectPressed;
    this.levelSelectPressed = false;
    return v;
  }

  startLevelSelect(): void {
    this.levelSelectMode = true;
    this.levelSelectBuffer = '';
    this.levelSelectSubmitted = false;
    this.levelSelectCancelled = false;
  }

  stopLevelSelect(): void {
    this.levelSelectMode = false;
    this.levelSelectSubmitted = false;
    this.levelSelectCancelled = false;
  }
}
