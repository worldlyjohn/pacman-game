import { Game } from './engine/game';

const canvas = document.getElementById('game') as HTMLCanvasElement;
const game = new Game(canvas);

const FIXED_DT = 1 / 60;
let accumulator = 0;
let lastTime = 0;

function loop(time: number): void {
  const dt = Math.min((time - lastTime) / 1000, 0.1); // cap to avoid spiral of death
  lastTime = time;
  accumulator += dt;

  while (accumulator >= FIXED_DT) {
    game.update(FIXED_DT);
    game.tick(FIXED_DT);
    accumulator -= FIXED_DT;
  }

  game.draw();
  requestAnimationFrame(loop);
}

requestAnimationFrame((time) => {
  lastTime = time;
  requestAnimationFrame(loop);
});
