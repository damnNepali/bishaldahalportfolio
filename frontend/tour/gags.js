// =========================================================
// Gags: the funny 3–5 second scene at each zone.
// Each gag animates the avatar's pose (P) and props over time,
// fires sound cues once, and can be skipped at any moment.
// =========================================================
import * as THREE from 'three';
import { makePiece, makeTrolley, makeCrown, makeCap, MAT } from './world.js';

const clamp01 = x => Math.max(0, Math.min(1, x));
const ease = x => { x = clamp01(x); return x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; };
const seg = (t, a, b) => clamp01((t - a) / (b - a));
const arc = u => Math.sin(Math.PI * clamp01(u));

function forward(avatar) { const y = avatar.root.rotation.y; return new THREE.Vector3(Math.sin(y), 0, Math.cos(y)); }
function right(avatar) { const y = avatar.root.rotation.y; return new THREE.Vector3(Math.cos(y), 0, -Math.sin(y)); }

class Gag {
  constructor(ctx, duration) { this.ctx = ctx; this.duration = duration; this.t = 0; this.cues = []; this.done = false; this.cleanups = []; }
  cue(at, fn) { this.cues.push({ at, fn, fired: false }); return this; }
  start() {}
  pose() {}
  tick(dt) {
    this.t += dt;
    for (const c of this.cues) if (!c.fired && this.t >= c.at) { c.fired = true; c.fn(); }
    this.step && this.step(this.t, dt);
    if (this.t >= this.duration && !this.done) this.finish();
  }
  finish() {
    if (this.done) return;
    this.done = true;
    for (const c of this.cues) if (!c.fired) { c.fired = true; if (c.final) c.fn(); }
    this.final && this.final();
    this.cleanups.forEach(f => f());
    this.onDone && this.onDone();
  }
  // Puts the avatar under this gag's control
  drive(avatar, fn) { avatar.mode = 'custom'; avatar.custom = (t, P) => fn(this.t, P); }
}

// ♟ Education — cradles a tiny pawn like a baby, trips, saves it, wipes forehead
export function pawnGag(ctx) {
  const { avatar, sound } = ctx, g = new Gag(ctx, 4.4);
  const pawn = makePiece('p', MAT.ivory, 0.3);
  pawn.rotation.z = Math.PI / 2.3;
  avatar.attach(pawn, 'chest');
  g.cue(0.3, () => sound.play('squeak')).cue(1.6, () => { sound.play('trip'); sound.play('whoosh'); })
   .cue(2.45, () => sound.play('squeak')).cue(3.1, () => sound.play('ding'));
  g.drive(avatar, (t, P) => {
    const flail = seg(t, 1.6, 2.4) > 0 && t < 2.4;
    Object.assign(P, { aLx: -0.9, aRx: -0.9, aLz: -0.35, aRz: -0.35, eL: 1.5, eR: 1.5, torsoZ: t < 1.6 ? Math.sin(t * 4) * 0.12 : 0, headX: 0.25 });
    if (flail) Object.assign(P, { aLz: 1.6 + Math.sin(t * 30) * 0.4, aRz: 1.6 + Math.cos(t * 30) * 0.4, aLx: -0.3, aRx: -0.3, eL: 0.3, eR: 0.3, tiltX: 0.3 * arc(seg(t, 1.6, 2.2)), headX: -0.3 });
    if (t > 2.9) Object.assign(P, { aRx: -2.4, aRz: -0.55, eR: 2.0 + Math.sin(t * 10) * 0.2, headX: 0.05, headZ: Math.sin(t * 10) * 0.05 });
  });
  g.step = t => {
    const u = seg(t, 1.6, 2.45);
    pawn.position.set(0, u > 0 && u < 1 ? arc(u) * 1.3 : 0, 0);
    pawn.rotation.x = u > 0 && u < 1 ? u * Math.PI * 4 : 0;
  };
  g.cleanups.push(() => avatar.detach(pawn));
  return g;
}

// ♕ Technology — strains to push the giant queen, she zooms off, he face-plants
export function queenGag(ctx) {
  const { avatar, sound, monument } = ctx, g = new Gag(ctx, 4.8);
  const start = avatar.root.position.clone(), mStart = monument.position.clone();
  const dir = monument.position.clone().sub(start).setY(0).normalize();
  avatar.faceTowards(monument.position);
  g.cue(0.3, () => sound.play('strain')).cue(0.5, () => sound.play('scrape')).cue(1.4, () => sound.play('strain'))
   .cue(2.6, () => sound.play('zoom')).cue(3.0, () => sound.play('bonk'));
  g.drive(avatar, (t, P) => {
    if (t < 2.6) {
      const ph = t * 16;
      Object.assign(P, { tiltX: 0.32, aLx: -1.45, aRx: -1.45, eL: 0.25, eR: 0.25, aLz: -0.1, aRz: -0.1,
        lLx: -Math.sin(ph) * 0.8 + 0.4, lRx: Math.sin(ph) * 0.8 + 0.4, kL: Math.max(0, Math.cos(ph)) * 1.1, kR: Math.max(0, -Math.cos(ph)) * 1.1, headX: -0.2 });
    } else if (t < 3.7) {
      Object.assign(P, { tiltX: 0.32 + 1.2 * ease(seg(t, 2.6, 3.0)), aLx: -2.6, aRx: -2.6, eL: 0.1, eR: 0.1, lLx: 0.3, lRx: 0.2, headX: -0.4 });
    } else {
      Object.assign(P, { tiltX: 1.52 * (1 - ease(seg(t, 3.7, 4.4))), aLx: -0.4, aRx: -0.4, headZ: Math.sin(t * 9) * 0.15 });
    }
  });
  g.step = t => {
    const push = ease(seg(t, 0.5, 2.5)) * 0.8, zoom = ease(seg(t, 2.6, 3.0)) * 1.6;
    monument.position.copy(mStart).addScaledVector(dir, push + zoom);
    avatar.root.position.copy(start).addScaledVector(dir, push + zoom * 0.25);
  };
  g.final = () => { monument.position.copy(mStart).addScaledVector(dir, 2.4); avatar.root.position.copy(start).addScaledVector(dir, 1.2); };
  return g;
}

// ♜ Businesses — Courier Spot delivery: cap on, rolls the rook on a trolley, rings the bell
export function rookGag(ctx) {
  const { avatar, sound, scene } = ctx, g = new Gag(ctx, 4.2);
  const cap = makeCap(); cap.position.y = -0.05; avatar.attach(cap, 'head');
  avatar.root.rotation.y = (ctx.camYaw || 0) + Math.PI / 2; // roll across the screen
  const start = avatar.root.position.clone(), fwd = forward(avatar);
  const trolley = makeTrolley(); trolley.rotation.y = avatar.root.rotation.y - Math.PI / 2; scene.add(trolley);
  g.cue(0.2, () => sound.play('pop')).cue(0.4, () => sound.play('rattle')).cue(1.4, () => sound.play('rattle')).cue(2.8, () => sound.play('bell'));
  g.drive(avatar, (t, P) => {
    if (t < 2.6) {
      const ph = t * 10, s = Math.sin(ph), c = Math.cos(ph);
      Object.assign(P, { aLx: -1.25, aRx: -1.25, eL: 0.45, eR: 0.45, lLx: -s * 0.6, lRx: s * 0.6, kL: Math.max(0, c) * .8, kR: Math.max(0, -c) * .8, bodyY: Math.abs(c) * 0.06, tiltX: 0.12 });
    } else {
      Object.assign(P, { aRz: 2.3, eR: 0.4 + Math.sin(t * 16) * 0.3, aLz: 0.15, headY: -0.4, headX: -0.1 });
    }
  });
  g.step = t => {
    const d = ease(seg(t, 0.4, 2.6)) * 3.2;
    avatar.root.position.copy(start).addScaledVector(fwd, d);
    trolley.position.copy(avatar.root.position).addScaledVector(fwd, 1.6);
    trolley.position.y = Math.abs(Math.sin(t * 25)) * 0.03 * (t < 2.6 ? 1 : 0);
  };
  g.final = () => { avatar.root.position.copy(start).addScaledVector(fwd, 3.2); trolley.position.copy(avatar.root.position).addScaledVector(fwd, 1.6); trolley.position.y = 0; };
  g.cleanups.push(() => avatar.detach(cap));
  g.props = [trolley];
  return g;
}

// ♞ Strategy — rides a knight like a pony in an L: two hops forward, one sideways
export function knightGag(ctx) {
  const { avatar, sound, scene } = ctx, g = new Gag(ctx, 5.0);
  const camYaw = ctx.camYaw || 0;
  avatar.root.rotation.y = camYaw + Math.PI / 2; // ride across the screen
  const start = avatar.root.position.clone(), fwd = forward(avatar), side = right(avatar);
  const toCam = new THREE.Vector3(Math.sin(camYaw), 0, Math.cos(camYaw));
  const horse = (() => { const k = makePiece('n', MAT.ivory, 1.45); k.rotation.y = avatar.root.rotation.y + Math.PI / 2; return k; })();
  horse.position.copy(start).addScaledVector(side, -1.3); scene.add(horse);
  const hops = [[0, 0], [2, 0], [4, 0], [4, 2]]; // L-shape: two hops across, one toward you
  g.cue(0.15, () => sound.play('boing')).cue(0.8, () => sound.play('neigh'))
   .cue(1.2, () => sound.play('clipclop')).cue(1.8, () => sound.play('clipclop')).cue(2.4, () => sound.play('clipclop'))
   .cue(3.9, () => sound.play('pop'));
  const at = (t) => {
    // hop k from 1.2 + (k-1)*0.6
    let f = 0, s = 0, h = 0;
    for (let k = 1; k < hops.length; k++) {
      const u = seg(t, 1.2 + (k - 1) * 0.6, 1.2 + k * 0.6);
      if (u > 0) { f = hops[k - 1][0] + (hops[k][0] - hops[k - 1][0]) * ease(u); s = hops[k - 1][1] + (hops[k][1] - hops[k - 1][1]) * ease(u); h = u < 1 ? arc(u) * 0.9 : 0; }
    }
    return { f, s, h };
  };
  g.drive(avatar, (t, P) => {
    if (t < 0.6 || t > 3.9) { Object.assign(P, { lLx: -0.6, kL: 0.8, aLz: 0.6, aRz: 0.6, bodyY: 0.1 }); return; }
    const { h } = at(t);
    Object.assign(P, { lLx: -0.5, lRx: -0.5, lLz: 0.7, lRz: 0.7, kL: 1.1, kR: 1.1, aLx: -0.9, aRx: -0.9, eL: 0.9, eR: 0.9,
      tiltX: -0.15 + h * 0.2, headX: -0.1, aRz: t > 0.8 && t < 1.2 ? 2.4 : 0 });
  });
  g.step = t => {
    const { f, s, h } = at(t);
    horse.position.copy(start).addScaledVector(side, -1.3 + (t < 0.6 ? 0 : 1.3 * ease(seg(t, 0.15, 0.6)))).addScaledVector(fwd, f).addScaledVector(toCam, s);
    horse.position.y = h;
    const mounted = t >= 0.15 && t <= 4.3;
    const upU = ease(seg(t, 0.15, 0.6)), downU = ease(seg(t, 3.9, 4.4));
    if (mounted) {
      avatar.root.position.copy(horse.position).addScaledVector(fwd, -0.15);
      avatar.root.position.y = h + 0.62 * upU * (1 - downU) + arc(seg(t, 0.15, 0.6)) * 0.6;
      if (downU > 0) avatar.root.position.addScaledVector(side, -1.4 * downU);
    }
  };
  g.final = () => {
    const end = start.clone().addScaledVector(fwd, 4).addScaledVector(toCam, 2);
    horse.position.copy(end); horse.position.y = 0;
    avatar.root.position.copy(end).addScaledVector(side, -1.4); avatar.root.position.y = 0;
  };
  g.props = [horse];
  return g;
}

// ♝ Service — lifts a bishop overhead like a trophy, the crowd cheers
export function bishopGag(ctx) {
  const { avatar, sound } = ctx, g = new Gag(ctx, 3.6);
  const bishop = makePiece('b', MAT.gold, 0.55); avatar.attach(bishop, 'overhead');
  g.cue(0.2, () => sound.play('fanfare')).cue(0.6, () => sound.play('cheer')).cue(2.0, () => sound.play('cheer'));
  g.drive(avatar, (t, P) => {
    const b = Math.abs(Math.sin(t * 6));
    Object.assign(P, { aLz: 2.75, aRz: 2.75, eL: 0.35, eR: 0.35, aLx: -0.15, aRx: -0.15, bodyY: b * 0.12, torsoY: Math.sin(t * 3) * 0.35, headX: -0.25, lLx: -b * 0.2, kL: b * 0.4 });
  });
  g.step = t => { bishop.rotation.z = Math.sin(t * 6) * 0.15; bishop.position.y = Math.abs(Math.sin(t * 6)) * 0.1; };
  g.cleanups.push(() => avatar.detach(bishop));
  return g;
}

// ♔ Leadership — proud crown moment, crown slips over his eyes, walks into the king: bonk
export function kingGag(ctx) {
  const { avatar, sound, monument, stars } = ctx, g = new Gag(ctx, 5.0);
  const crown = makeCrown(); avatar.attach(crown, 'head');
  avatar.faceTowards(monument.position);
  const start = avatar.root.position.clone(), dir = monument.position.clone().sub(start).setY(0).normalize();
  const walkTo = Math.max(0, start.distanceTo(monument.position) - 2.6);
  avatar.attach(stars, 'head');
  g.cue(0.1, () => sound.play('fanfare')).cue(1.25, () => sound.play('whoosh')).cue(2.8, () => sound.play('bonk'))
   .cue(3.4, () => sound.play('pop'));
  g.drive(avatar, (t, P) => {
    if (t < 1.2) Object.assign(P, { torsoX: -0.12, aLz: 0.7, aRz: 0.7, aLx: 0.35, aRx: 0.35, eL: 1.7, eR: 1.7, headX: -0.2 });
    else if (t < 2.8) {
      const ph = t * 8, s = Math.sin(ph);
      Object.assign(P, { aLx: -1.55, aRx: -1.55, eL: 0.1, eR: 0.1, lLx: -s * .5, lRx: s * .5, kL: Math.max(0, Math.cos(ph)) * .7, kR: Math.max(0, -Math.cos(ph)) * .7, headY: Math.sin(t * 3) * 0.4 });
    } else if (t < 3.6) Object.assign(P, { tiltX: -0.45 * arc(seg(t, 2.8, 3.6)), aLz: 1.2, aRz: 1.2, headX: 0.3 });
    else Object.assign(P, { headY: Math.sin(t * 14) * 0.25 * (1 - seg(t, 3.6, 4.8)), aRx: -2.2, eR: 1.9, aRz: -0.3 });
  });
  g.step = t => {
    crown.position.y = -0.47 * ease(seg(t, 1.2, 1.45)) * (1 - ease(seg(t, 3.4, 3.6)));
    avatar.root.position.copy(start).addScaledVector(dir, walkTo * ease(seg(t, 1.6, 2.8)) - 0.5 * ease(seg(t, 2.8, 3.2)));
    stars.visible = t > 2.8 && t < 4.6;
    stars.children.forEach((s, i) => { const a = t * 6 + i * 2.09; s.position.set(Math.cos(a) * 0.5, 0.35, Math.sin(a) * 0.5); s.rotation.y = t * 8; });
  };
  g.final = () => { avatar.root.position.copy(start).addScaledVector(dir, walkTo - 0.5); stars.visible = false; };
  g.cleanups.push(() => { avatar.detach(crown); stars.visible = false; });
  return g;
}

// ⚡ EV mission — charges the pawn, sparks fly, it becomes a queen, victory dance
export function evGag(ctx) {
  const { avatar, sound, charger, sparks } = ctx, g = new Gag(ctx, 5.4);
  const { pawn, queen, glow } = charger.userData;
  const pawnWorld = new THREE.Vector3(); pawn.getWorldPosition(pawnWorld);
  avatar.faceTowards(pawnWorld);
  pawn.visible = true; queen.visible = false; pawn.rotation.set(0, 0, 0);
  g.cue(0.5, () => sound.play('charge')).cue(2.1, () => { sound.play('zap'); sparks.burst(pawnWorld.clone().setY(1.6)); })
   .cue(2.35, () => { sound.play('boing'); pawn.visible = false; queen.visible = true; })
   .cue(2.7, () => sound.play('jingle')).cue(3.4, () => sparks.burst(pawnWorld.clone().setY(2.6), 0xFFD54A));
  g.drive(avatar, (t, P) => {
    if (t < 2.4) Object.assign(P, { aRx: -1.4, eR: 0.1, aRz: 0.3, headX: 0.1, torsoX: 0.08 });
    else {
      const b = Math.sin(t * 9), up = b > 0;
      Object.assign(P, { aLz: up ? 2.6 : 0.5, aRz: up ? 0.5 : 2.6, eL: 0.4, eR: 0.4, bodyY: Math.abs(b) * 0.18, torsoY: Math.sin(t * 4.5) * 0.4,
        lLx: up ? -0.5 : 0, lRx: up ? 0 : -0.5, kL: up ? 0.6 : 0, kR: up ? 0 : 0.6, headZ: b * 0.15 });
    }
  });
  g.step = t => {
    const w = seg(t, 0.5, 2.3);
    pawn.rotation.z = Math.sin(t * (20 + w * 40)) * 0.12 * w;
    glow.material.opacity = 0.25 + w * 0.6 * (0.6 + 0.4 * Math.sin(t * 30));
    const q = seg(t, 2.35, 2.9); queen.scale.setScalar(1.1 * (q < 1 ? 0.3 + 0.9 * ease(q) + 0.15 * arc(q) : 1));
  };
  g.final = () => { pawn.visible = false; queen.visible = true; queen.scale.setScalar(1.1); glow.material.opacity = 0.5; };
  return g;
}

// ✉️ Contact — sits back at the table and slides a knight toward you: "Your move."
export function contactGag(ctx) {
  const { avatar, sound, table } = ctx, g = new Gag(ctx, 3.0);
  const slide = table.userData.slide, s0 = slide.position.clone();
  g.cue(1.6, () => sound.play('clack'));
  g.drive(avatar, (t, P) => {
    sitPose(P, t);
    if (t > 0.8 && t < 2.2) Object.assign(P, { aRx: -1.35, eR: 0.15, aRz: 0.1, torsoX: 0.2 });
  });
  g.step = t => { slide.position.z = s0.z + 0.45 * ease(seg(t, 1.0, 1.6)); };
  g.final = () => { slide.position.z = s0.z + 0.45; };
  g.keepPose = (t, P) => sitPose(P, t);
  return g;
}

// ♚ Welcome — stands up from the table and waves
export function welcomeGag(ctx) {
  const { avatar, sound } = ctx, g = new Gag(ctx, 3.0);
  g.cue(0.5, () => sound.play('pop')).cue(0.9, () => sound.play('ding'));
  g.drive(avatar, (t, P) => {
    const u = ease(seg(t, 0, 0.6));
    sitPose(P, t, 1 - u);
    if (t > 0.6) Object.assign(P, { aRz: 2.5, aRx: -0.2, eR: 0.5 + Math.sin(t * 14) * 0.45, headZ: 0.1, aLz: 0.15 });
  });
  return g;
}

// Seated at the table with hands clasped (like the photo)
export function sitPose(P, t, w = 1) {
  const S = { lLx: -1.45, lRx: -1.45, kL: 1.45, kR: 1.45, bodyY: -0.38, aLx: -1.1, aRx: -1.1, aLz: -0.38, aRz: -0.38, eL: 1.25, eR: 1.25, torsoX: 0.12, headX: Math.sin(t * 0.8) * 0.03 };
  for (const k in S) P[k] = S[k] * w + (P[k] || 0) * (1 - w);
}
