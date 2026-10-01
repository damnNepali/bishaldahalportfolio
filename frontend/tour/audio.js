// =========================================================
// Sound: synthesised effects + a generative, playful music loop.
// Everything is made in the browser with the Web Audio API,
// so there are no audio files to license. If you upload your own
// music in Django admin (Profile → Tour music), that plays instead.
// =========================================================

const NOTE = n => 440 * Math.pow(2, (n - 69) / 12); // MIDI → Hz

export class Sound {
  constructor() {
    this.ctx = null;
    this.enabled = false;
    this.musicOn = true;
    this.theme = 'welcome';
    this.fileMusic = null;
    this._timer = null;
  }

  // Must be called from a click/tap (browsers block audio before a gesture)
  start(musicUrl) {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain(); this.master.gain.value = 0.9; this.master.connect(this.ctx.destination);
      this.sfxBus = this.ctx.createGain(); this.sfxBus.gain.value = 0.7; this.sfxBus.connect(this.master);
      this.musicBus = this.ctx.createGain(); this.musicBus.gain.value = 0.0; this.musicBus.connect(this.master);
      this.noiseBuf = this._makeNoise();
      if (musicUrl) {
        this.fileMusic = new Audio(musicUrl);
        this.fileMusic.loop = true; this.fileMusic.volume = 0.35; this.fileMusic.preload = 'auto';
      }
    }
    this.ctx.resume();
    this.enabled = true;
    this._startMusic();
    if (!this._visBound) {
      this._visBound = true;
      document.addEventListener('visibilitychange', () => {
        if (!this.enabled) return;
        if (document.hidden) this._pauseMusic(); else this._startMusic();
      });
    }
  }

  setEnabled(on, musicUrl) {
    if (on) this.start(musicUrl);
    else { this.enabled = false; this._pauseMusic(); }
  }

  setTheme(t) { this.theme = t; }

  // ---------- music ----------
  _startMusic() {
    if (!this.enabled || !this.musicOn) return;
    if (this.fileMusic) { this.fileMusic.play().catch(() => {}); return; }
    this.musicBus.gain.cancelScheduledValues(this.ctx.currentTime);
    this.musicBus.gain.setTargetAtTime(0.32, this.ctx.currentTime, 0.6);
    if (this._timer) return;
    this.bpm = 108;
    this.step = 0;
    this.nextTime = this.ctx.currentTime + 0.1;
    this._timer = setInterval(() => this._schedule(), 30);
  }
  _pauseMusic() {
    if (this.fileMusic) this.fileMusic.pause();
    if (this.ctx && this._timer) {
      this.musicBus.gain.setTargetAtTime(0, this.ctx.currentTime, 0.2);
      clearInterval(this._timer); this._timer = null;
    }
  }

  _schedule() {
    const spb = 60 / this.bpm / 2; // eighth notes
    while (this.nextTime < this.ctx.currentTime + 0.15) {
      this._playStep(this.step, this.nextTime, spb);
      this.nextTime += spb;
      this.step = (this.step + 1) % 64; // 8 bars of 8 eighths
    }
  }

  _playStep(step, t, spb) {
    // I – vi – IV – V in C, two bars each pass of 4 → 8 bars
    const chords = [[48, 52, 55], [45, 48, 52], [41, 45, 48], [43, 47, 50]];
    const bar = Math.floor(step / 8) % 4, beat = step % 8;
    const ch = chords[bar];
    const th = this.theme;

    // Pizzicato bass on 1 and 5, walking note on 7
    if (beat === 0 || beat === 4) this._pluck(NOTE(ch[0] - 12), t, 0.35, 'triangle', 0.5);
    if (beat === 6) this._pluck(NOTE(ch[0] - 12 + 7), t, 0.2, 'triangle', 0.3);

    // Ukulele-style off-beat strum
    if (beat % 2 === 1) ch.forEach((n, i) => this._pluck(NOTE(n + 12), t + i * 0.012, 0.18, 'sawtooth', 0.07, 2400));

    // Shaker
    if (beat % 2 === 1) this._noiseHit(t, 0.04, 7000, 0.05);

    // Madal-style "dhum" for the welcome scene (a Kathmandu touch)
    if (th === 'welcome' && (beat === 0 || beat === 3)) this._drum(t, beat === 0 ? 95 : 140, 0.35);

    // Sneaky staccato melody (C major pentatonic)
    const mel = [
      72, null, 74, 76, null, 79, 76, null,   69, null, 72, 74, null, 76, 74, null,
      72, null, 69, 67, null, 69, 72, null,   74, null, 76, 74, 71, null, 67, null,
    ];
    const n = mel[step % 32];
    if (n && step >= 16) {
      const voice = { royal: 'square', tech: 'square', gentle: 'sine', party: 'sawtooth' }[th] || 'triangle';
      const lp = { royal: 1800, tech: 3200, gentle: 1400, party: 2600 }[th] || 2200;
      const up = th === 'royal' || th === 'party' ? 12 : 0;
      this._pluck(NOTE(n + up - (th === 'gentle' ? 12 : 0)), t, 0.16, voice, 0.11, lp);
    }
  }

  // ---------- building blocks ----------
  _makeNoise() {
    const len = this.ctx.sampleRate * 1.5;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }
  _env(g, t, a, peak, dur) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  }
  _pluck(freq, t, dur, type, vol, lp = 3000, bus) {
    const o = this.ctx.createOscillator(), g = this.ctx.createGain(), f = this.ctx.createBiquadFilter();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    f.type = 'lowpass'; f.frequency.setValueAtTime(lp, t); f.frequency.exponentialRampToValueAtTime(Math.max(200, lp / 4), t + dur);
    this._env(g, t, 0.005, vol, dur);
    o.connect(f).connect(g).connect(bus || this.musicBus);
    o.start(t); o.stop(t + dur + 0.05);
  }
  _noiseHit(t, dur, freq, vol, bus, type = 'highpass') {
    const s = this.ctx.createBufferSource(), f = this.ctx.createBiquadFilter(), g = this.ctx.createGain();
    s.buffer = this.noiseBuf; f.type = type; f.frequency.value = freq;
    this._env(g, t, 0.002, vol, dur);
    s.connect(f).connect(g).connect(bus || this.musicBus);
    s.start(t, Math.random()); s.stop(t + dur + 0.05);
  }
  _drum(t, f0, vol) {
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(f0 * 1.6, t); o.frequency.exponentialRampToValueAtTime(f0 * 0.6, t + 0.25);
    this._env(g, t, 0.005, vol, 0.3);
    o.connect(g).connect(this.musicBus); o.start(t); o.stop(t + 0.35);
  }
  _sweep(type, f1, f2, dur, vol, t = this.ctx.currentTime, curve = 'exp') {
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f1, t);
    if (curve === 'exp') o.frequency.exponentialRampToValueAtTime(f2, t + dur); else o.frequency.linearRampToValueAtTime(f2, t + dur);
    this._env(g, t, 0.01, vol, dur);
    o.connect(g).connect(this.sfxBus); o.start(t); o.stop(t + dur + 0.05);
    return o;
  }

  // ---------- sound effects ----------
  play(name) {
    if (!this.enabled || !this.ctx) return;
    const t = this.ctx.currentTime, fx = this.sfxBus;
    switch (name) {
      case 'clack': this._noiseHit(t, 0.06, 2600, 0.5, fx, 'bandpass'); this._sweep('sine', 900, 500, 0.06, 0.25); break;
      case 'step': this._noiseHit(t, 0.05, 700, 0.12, fx, 'lowpass'); break;
      case 'boing': {
        const o = this._sweep('sine', 140, 520, 0.45, 0.45);
        const lfo = this.ctx.createOscillator(), lg = this.ctx.createGain();
        lfo.frequency.value = 14; lg.gain.value = 40; lfo.connect(lg).connect(o.frequency); lfo.start(t); lfo.stop(t + 0.5);
        break;
      }
      case 'whoosh': {
        const s = this.ctx.createBufferSource(), f = this.ctx.createBiquadFilter(), g = this.ctx.createGain();
        s.buffer = this.noiseBuf; f.type = 'bandpass'; f.Q.value = 1.2;
        f.frequency.setValueAtTime(400, t); f.frequency.exponentialRampToValueAtTime(3200, t + 0.35);
        this._env(g, t, 0.12, 0.5, 0.45); s.connect(f).connect(g).connect(fx); s.start(t); s.stop(t + 0.5);
        break;
      }
      case 'squeak': this._sweep('sine', 1300, 2100, 0.12, 0.25); this._sweep('sine', 2000, 1500, 0.1, 0.18, t + 0.12); break;
      case 'bonk': this._sweep('sine', 260, 70, 0.28, 0.6); this._noiseHit(t, 0.04, 1500, 0.4, fx, 'lowpass'); break;
      case 'ding': [1320, 2640].forEach((f, i) => this._pluck(f, t, 1.1, 'sine', i ? 0.08 : 0.25, 8000, fx)); break;
      case 'bell': [0, 0.28].forEach(d => [1568, 3136].forEach((f, i) => this._pluck(f, t + d, 0.6, 'sine', i ? 0.07 : 0.22, 9000, fx))); break;
      case 'fanfare': [60, 64, 67, 72, 67, 72].forEach((n, i) => this._pluck(NOTE(n + 12), t + i * 0.13, i === 5 ? 0.6 : 0.16, 'sawtooth', 0.14, 2600, fx)); break;
      case 'jingle': [72, 76, 79, 84, 79, 84, 88].forEach((n, i) => this._pluck(NOTE(n), t + i * 0.09, 0.3, 'square', 0.1, 4000, fx)); break;
      case 'strain': {
        const o = this.ctx.createOscillator(), f = this.ctx.createBiquadFilter(), g = this.ctx.createGain();
        o.type = 'sawtooth'; o.frequency.setValueAtTime(130, t); o.frequency.linearRampToValueAtTime(175, t + 0.9);
        const lfo = this.ctx.createOscillator(), lg = this.ctx.createGain(); lfo.frequency.value = 9; lg.gain.value = 9;
        lfo.connect(lg).connect(o.frequency); f.type = 'bandpass'; f.frequency.value = 650; f.Q.value = 3;
        this._env(g, t, 0.08, 0.35, 1.0); o.connect(f).connect(g).connect(fx);
        o.start(t); lfo.start(t); o.stop(t + 1.05); lfo.stop(t + 1.05);
        break;
      }
      case 'scrape': this._noiseHit(t, 0.8, 500, 0.18, fx, 'bandpass'); break;
      case 'zoom': this._sweep('sawtooth', 180, 1800, 0.35, 0.15); break;
      case 'rattle': for (let i = 0; i < 14; i++) this._noiseHit(t + i * 0.07, 0.03, 3500, 0.12, fx, 'bandpass'); break;
      case 'neigh': {
        const o = this.ctx.createOscillator(), f = this.ctx.createBiquadFilter(), g = this.ctx.createGain();
        o.type = 'sawtooth'; o.frequency.setValueAtTime(600, t); o.frequency.linearRampToValueAtTime(1150, t + 0.25); o.frequency.linearRampToValueAtTime(450, t + 0.9);
        const lfo = this.ctx.createOscillator(), lg = this.ctx.createGain(); lfo.frequency.value = 22; lg.gain.value = 90;
        lfo.connect(lg).connect(o.frequency); f.type = 'bandpass'; f.frequency.value = 1200; f.Q.value = 2;
        this._env(g, t, 0.03, 0.3, 0.95); o.connect(f).connect(g).connect(fx);
        o.start(t); lfo.start(t); o.stop(t + 1); lfo.stop(t + 1);
        break;
      }
      case 'clipclop': for (let i = 0; i < 6; i++) this._sweep('sine', i % 2 ? 620 : 820, 300, 0.07, 0.3, t + i * 0.16); break;
      case 'cheer': {
        const s = this.ctx.createBufferSource(), f = this.ctx.createBiquadFilter(), g = this.ctx.createGain();
        s.buffer = this.noiseBuf; f.type = 'bandpass'; f.frequency.value = 1100; f.Q.value = 0.7;
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.35, t + 0.4); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.5);
        s.connect(f).connect(g).connect(fx); s.start(t); s.stop(t + 1.5);
        for (let i = 0; i < 5; i++) this._sweep('triangle', 500 + Math.random() * 300, 900 + Math.random() * 400, 0.3, 0.05, t + 0.2 + i * 0.18);
        break;
      }
      case 'charge': {
        const o = this.ctx.createOscillator(), f = this.ctx.createBiquadFilter(), g = this.ctx.createGain();
        o.type = 'sawtooth'; o.frequency.setValueAtTime(70, t); o.frequency.exponentialRampToValueAtTime(900, t + 1.6);
        f.type = 'lowpass'; f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(4000, t + 1.6);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.18, t + 0.3); g.gain.setValueAtTime(0.18, t + 1.5); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.7);
        o.connect(f).connect(g).connect(fx); o.start(t); o.stop(t + 1.75);
        break;
      }
      case 'zap': for (let i = 0; i < 4; i++) this._noiseHit(t + i * 0.05, 0.04, 5000, 0.25, fx); break;
      case 'pop': this._sweep('sine', 400, 1200, 0.08, 0.3); break;
      case 'blip': this._pluck(320 + Math.random() * 220, t, 0.05, 'square', 0.06, 2500, fx); break;
      case 'trip': this._sweep('sine', 900, 250, 0.25, 0.25); break;
      default: break;
    }
  }
}
