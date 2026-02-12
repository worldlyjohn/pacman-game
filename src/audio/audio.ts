export class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  muted = false;
  private bgOsc: OscillatorNode | null = null;
  private bgGain: GainNode | null = null;
  private bgRunning = false;
  private tempo = 1.0;

  private ensure(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.3;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  toggleMute(): void {
    this.muted = !this.muted;
    if (this.masterGain) {
      this.masterGain.gain.value = this.muted ? 0 : 0.3;
    }
  }

  playWaka(): void {
    const ctx = this.ensure();
    if (!this.masterGain) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  }

  playPowerPellet(): void {
    const ctx = this.ensure();
    if (!this.masterGain) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  }

  playGhostEat(): void {
    const ctx = this.ensure();
    if (!this.masterGain) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  }

  playFruitEat(): void {
    const ctx = this.ensure();
    if (!this.masterGain) return;

    // Cheerful ascending arpeggio
    const notes = [523, 659, 784]; // C5, E5, G5
    for (let i = 0; i < notes.length; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = notes[i];
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.06);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + i * 0.06 + 0.02);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + i * 0.06 + 0.12);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(ctx.currentTime + i * 0.06);
      osc.stop(ctx.currentTime + i * 0.06 + 0.15);
    }
  }

  playDeath(): void {
    const ctx = this.ensure();
    if (!this.masterGain) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(500, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.8);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.0);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(ctx.currentTime + 1.0);
  }

  startBgPulse(): void {
    if (this.bgRunning) return;
    const ctx = this.ensure();
    if (!this.masterGain) return;

    this.bgOsc = ctx.createOscillator();
    this.bgGain = ctx.createGain();
    this.bgOsc.type = 'sine';
    this.bgOsc.frequency.value = 40;
    this.bgGain.gain.value = 0.08;
    this.bgOsc.connect(this.bgGain);
    this.bgGain.connect(this.masterGain);
    this.bgOsc.start();
    this.bgRunning = true;
  }

  stopBgPulse(): void {
    if (this.bgOsc) {
      this.bgOsc.stop();
      this.bgOsc.disconnect();
      this.bgOsc = null;
    }
    if (this.bgGain) {
      this.bgGain.disconnect();
      this.bgGain = null;
    }
    this.bgRunning = false;
  }

  setTempo(ratio: number): void {
    this.tempo = ratio;
    if (this.bgOsc) {
      this.bgOsc.frequency.value = 40 * ratio;
    }
  }

  startFrightenedSound(): void {
    if (this.bgOsc) {
      this.bgOsc.frequency.value = 25;
    }
  }

  stopFrightenedSound(): void {
    if (this.bgOsc) {
      this.bgOsc.frequency.value = 40 * this.tempo;
    }
  }

  playLevelClear(): void {
    const ctx = this.ensure();
    if (!this.masterGain) return;

    for (let i = 0; i < 5; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = 200 + i * 150;
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.15);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + i * 0.15 + 0.05);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + i * 0.15 + 0.15);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(ctx.currentTime + i * 0.15);
      osc.stop(ctx.currentTime + i * 0.15 + 0.2);
    }
  }
}
