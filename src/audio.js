// Web Audio API Synthesizer - 100% Free, Zero External Audio Files Needed
class SoundController {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  playTone(freq, type = 'sine', duration = 0.15, gainVal = 0.2) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn('Audio play error', e);
    }
  }

  playThrow() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(250, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch (e) {
      console.warn(e);
    }
  }

  playHit() {
    this.playTone(320, 'square', 0.1, 0.2);
  }

  playWobble(shakeIndex = 1) {
    const freqs = [350, 440, 520];
    const freq = freqs[shakeIndex - 1] || 440;
    this.playTone(freq, 'triangle', 0.18, 0.25);
  }

  playCatch() {
    // 5-note victory fanfare
    const notes = [440, 554, 659, 880, 1108];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 'triangle', 0.22, 0.3);
      }, idx * 110);
    });
  }

  playMoveSound(pokemonName) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    if (pokemonName === 'pikachu') {
      // Electric sparkle zaps!
      [700, 1100, 950, 1400].forEach((f, i) => {
        setTimeout(() => this.playTone(f, 'sawtooth', 0.08, 0.18), i * 60);
      });
    } else if (pokemonName === 'bulbasaur') {
      // Grass vine whip woosh!
      [220, 330, 440, 550].forEach((f, i) => {
        setTimeout(() => this.playTone(f, 'sine', 0.12, 0.25), i * 70);
      });
    } else if (pokemonName === 'charmander') {
      // Fire flame whoosh!
      [180, 240, 320, 220].forEach((f, i) => {
        setTimeout(() => this.playTone(f, 'square', 0.12, 0.15), i * 75);
      });
    } else if (pokemonName === 'squirtle') {
      // Water bubble pops!
      [600, 850, 750, 1000].forEach((f, i) => {
        setTimeout(() => this.playTone(f, 'sine', 0.09, 0.22), i * 65);
      });
    }
  }
}

export const sound = new SoundController();
