// ==========================================================================
// AudioEngine.js - Procedural Web Audio Music & SFX Engine
// Synthesizes traditional Japanese instruments (Koto, Shakuhachi, Taiko)
// and arcade 16-bit sound effects without any external audio files.
// ==========================================================================

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.ambientGain = null;

    // Music playback state
    this.isPlayingMusic = false;
    this.musicTimer = null;
    this.currentScaleNote = 0;
    this.tempo = 110; // BPM

    // Japanese Insen & Yo Pentatonic Scales (Hz)
    // D3, Eb3, G3, A3, C4, D4, Eb4, G4, A4, C5, D5
    this.scale = [
      146.83, 155.56, 196.00, 220.00, 261.63,
      293.66, 311.13, 392.00, 440.00, 523.25, 587.33
    ];
  }

  // Initialize Web Audio on user gesture
  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master output
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Sub-busses
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.65, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      this.ambientGain.connect(this.masterGain);

      // Start atmospheric wind & night ambience
      this.startAmbience();
      this.startMusic();
    } catch (e) {
      console.warn('Web Audio API not supported:', e);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(
        this.isMuted ? 0 : 0.7,
        this.ctx.currentTime
      );
    }
    return !this.isMuted;
  }

  // ========================================================================
  // ATMOSPHERIC AMBIENCE (Wind & Twilight Whispers)
  // ========================================================================
  startAmbience() {
    if (!this.ctx) return;

    // Pink noise buffer generator for wind
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
      b6 = white * 0.115926;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Filter to simulate howling twilight wind
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(320, this.ctx.currentTime);
    filter.Q.setValueAtTime(2.5, this.ctx.currentTime);

    // LFO to slowly sweep wind frequency
    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.12, this.ctx.currentTime);
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(140, this.ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    whiteNoise.connect(filter);
    filter.connect(this.ambientGain);

    whiteNoise.start();
    lfo.start();
  }

  // ========================================================================
  // JAPANESE CHIPTUNE & AMBIENT MUSIC COMPOSER
  // Uses procedural Koto plucks, Shakuhachi melodies, and Taiko beats
  // ========================================================================
  startMusic() {
    if (!this.ctx || this.isPlayingMusic) return;
    this.isPlayingMusic = true;

    let step = 0;
    const interval = (60 / this.tempo) * 1000 * 0.5; // Eighth notes

    // Melody pattern indices from pentatonic scale
    const melodyPattern = [
      0, 2, 4, 3, 2, 0, 5, 4,
      2, 4, 7, 5, 4, 2, 0, 2,
      7, 6, 4, 2, 3, 2, 0, -1,
      5, 7, 9, 7, 5, 4, 2, 0
    ];

    const bassPattern = [
      0, -1, 0, -1, 2, -1, 0, -1,
      -1, -1, 0, -1, 3, -1, 2, -1
    ];

    this.musicTimer = setInterval(() => {
      if (this.isMuted || !this.ctx || this.ctx.state !== 'running') return;

      const t = this.ctx.currentTime;

      // 1. Taiko Drum rhythm (Beats 0, 4, 6, 10, 12)
      if (step % 8 === 0 || step % 8 === 6) {
        this.playTaikoDrum(step % 16 === 0);
      }

      // 2. Koto Pluck Melody
      const melIdx = melodyPattern[step % melodyPattern.length];
      if (melIdx >= 0 && Math.random() > 0.15) {
        const freq = this.scale[melIdx];
        this.playKotoPluck(freq, t, 0.4);
      }

      // 3. Shakuhachi Flute Long Breath (Every 16 steps)
      if (step % 16 === 0 && Math.random() > 0.3) {
        const fluteIdx = melodyPattern[(step + 4) % melodyPattern.length];
        if (fluteIdx >= 0) {
          this.playShakuhachi(this.scale[fluteIdx] * 1.5, t);
        }
      }

      // 4. Bass Drone / Koto Bass
      const bassIdx = bassPattern[step % bassPattern.length];
      if (bassIdx >= 0) {
        this.playKotoPluck(this.scale[bassIdx] * 0.5, t, 0.6);
      }

      step++;
    }, interval);
  }

  // Synthesize a Traditional Koto Pluck
  playKotoPluck(freq, startTime, gainVal = 0.5) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, startTime);
    // Slight pitch bend down simulating finger release on silk string
    osc.frequency.exponentialRampToValueAtTime(freq * 0.98, startTime + 0.3);

    gain.gain.setValueAtTime(gainVal * 0.3, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.8);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start(startTime);
    osc.stop(startTime + 0.85);
  }

  // Synthesize Shakuhachi Breathy Flute
  playShakuhachi(freq, startTime) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);
    // Subtle vibrato
    const vibrato = this.ctx.createOscillator();
    vibrato.frequency.setValueAtTime(5.5, startTime);
    const vibGain = this.ctx.createGain();
    vibGain.gain.setValueAtTime(6, startTime);
    vibrato.connect(vibGain);
    vibGain.connect(osc.frequency);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, startTime);

    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(0.12, startTime + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.6);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.start(startTime);
    vibrato.start(startTime);
    osc.stop(startTime + 1.7);
    vibrato.stop(startTime + 1.7);
  }

  // Synthesize a Deep Resonant Taiko Drum Hit
  playTaikoDrum(isHeavy = false) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const startFreq = isHeavy ? 130 : 95;
    const endFreq = isHeavy ? 35 : 28;

    osc.frequency.setValueAtTime(startFreq, t);
    osc.frequency.exponentialRampToValueAtTime(endFreq, t + 0.25);

    gain.gain.setValueAtTime(isHeavy ? 0.6 : 0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start(t);
    osc.stop(t + 0.45);
  }

  // ========================================================================
  // COMBAT & ACTION SOUND EFFECTS
  // ========================================================================

  // 1. Katana Slash
  playSlash(combo = 1) {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    const t = this.ctx.currentTime;

    // Filtered noise swoosh
    const bufferSize = this.ctx.sampleRate * 0.15;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    const baseFreq = 1200 + combo * 300;
    filter.frequency.setValueAtTime(baseFreq, t);
    filter.frequency.exponentialRampToValueAtTime(400, t + 0.12);
    filter.Q.setValueAtTime(3.0, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.14);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(t);
    noise.stop(t + 0.15);
  }

  // 2. Parry / Blade Clash (High-pitched metallic ring)
  playParry() {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    const t = this.ctx.currentTime;

    const freqs = [1850, 2400, 3100];
    freqs.forEach(f => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(f, t);
      osc.frequency.exponentialRampToValueAtTime(f * 0.7, t + 0.4);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.4);
    });
  }

  // 3. Blood Slash / Impact Hit
  playHit() {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    const t = this.ctx.currentTime;

    // Low crunch impact
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.15);

    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.2);
  }

  // 4. Charged Iaijutsu Lightning Dash Slash
  playIaiStrike() {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    const t = this.ctx.currentTime;

    // 1. High frequency lightning slice
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(3500, t);
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.3);

    gain.gain.setValueAtTime(0.7, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.36);

    // 2. Delayed thunder crack
    setTimeout(() => {
      if (!this.ctx) return;
      this.playTaikoDrum(true);
    }, 180);
  }

  // 5. Jump / Dash
  playJump() {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(420, t + 0.12);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.13);
  }

  // 6. Kunai / Shuriken Throw
  playKunai() {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(2200, t + 0.08);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.09);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.1);
  }

  // 7. Healing Sip / Spirit Orb Collection
  playHeal() {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    const t = this.ctx.currentTime;
    const chords = [392, 523.25, 659.25, 783.99]; // G C E G chime
    chords.forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t + i * 0.06);

      gain.gain.setValueAtTime(0.2, t + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.3);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t + i * 0.06);
      osc.stop(t + i * 0.06 + 0.35);
    });
  }

  // 8. Player Death
  playDeath() {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 1.2);

    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 1.25);
  }
}
