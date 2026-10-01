// =========================================================
// World: renderer, lights, the giant chessboard, monuments and props
// =========================================================
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const TILE = 4;           // one chess square = 4 units
export const HALF = TILE * 4;    // board spans -16..16

export const MAT = {
  gold: new THREE.MeshStandardMaterial({ color: 0xD9AE45, metalness: 1, roughness: 0.26 }),
  ivory: new THREE.MeshStandardMaterial({ color: 0xF5F1E8, metalness: 0, roughness: 0.32 }),
  onyx: new THREE.MeshStandardMaterial({ color: 0x23262D, metalness: 0.25, roughness: 0.3 }),
  blue: new THREE.MeshStandardMaterial({ color: 0x2F8CFF, emissive: 0x0A5FD8, emissiveIntensity: 0.6, roughness: 0.4 }),
  white: new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.6 }),
  wood: new THREE.MeshStandardMaterial({ color: 0xB98A57, roughness: 0.6 }),
  grey: new THREE.MeshStandardMaterial({ color: 0x9AA3B2, roughness: 0.5, metalness: 0.3 }),
};

// ---------- Chess piece geometry (lathe profiles) ----------
const lathe = (pts, seg = 48) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg);
const BASE = [[0, 0], [0.62, 0], [0.62, 0.1], [0.55, 0.16], [0.5, 0.2]];

export function makePiece(type, material, scale = 1) {
  const g = new THREE.Group();
  const add = (geo, y = 0, m = material) => { const mesh = new THREE.Mesh(geo, m); mesh.position.y = y; mesh.castShadow = true; mesh.receiveShadow = true; g.add(mesh); return mesh; };
  switch (type) {
    case 'p':
      add(lathe([...BASE, [0.38, 0.28], [0.26, 0.5], [0.2, 0.78], [0.32, 0.84], [0.32, 0.9], [0.18, 0.95], [0, 0.95]]));
      add(new THREE.SphereGeometry(0.27, 32, 24), 1.15);
      break;
    case 'r': {
      add(lathe([...BASE, [0.42, 0.3], [0.36, 0.5], [0.36, 1.1], [0.46, 1.16], [0.46, 1.45], [0, 1.45]]));
      for (let i = 0; i < 5; i++) {
        const b = add(new THREE.BoxGeometry(0.16, 0.2, 0.16), 1.55);
        const a = (i / 5) * Math.PI * 2; b.position.x = Math.cos(a) * 0.36; b.position.z = Math.sin(a) * 0.36; b.rotation.y = -a;
      }
      break;
    }
    case 'b':
      add(lathe([...BASE, [0.36, 0.3], [0.22, 0.7], [0.2, 1.0], [0.36, 1.06], [0.36, 1.12], [0.22, 1.16], [0, 1.16]]));
      add(lathe([[0, 1.14], [0.26, 1.24], [0.3, 1.45], [0.22, 1.7], [0.08, 1.86], [0, 1.9]]));
      add(new THREE.SphereGeometry(0.08, 16, 12), 1.98);
      break;
    case 'q':
      add(lathe([...BASE, [0.4, 0.3], [0.24, 0.8], [0.22, 1.2], [0.42, 1.26], [0.42, 1.32], [0.26, 1.38], [0.36, 1.75], [0, 1.68]]));
      for (let i = 0; i < 8; i++) {
        const s = add(new THREE.SphereGeometry(0.07, 12, 10), 1.78);
        const a = (i / 8) * Math.PI * 2; s.position.x = Math.cos(a) * 0.34; s.position.z = Math.sin(a) * 0.34;
      }
      add(new THREE.SphereGeometry(0.11, 16, 12), 1.82);
      break;
    case 'k':
      add(lathe([...BASE, [0.42, 0.3], [0.25, 0.85], [0.23, 1.25], [0.44, 1.31], [0.44, 1.37], [0.28, 1.43], [0.4, 1.8], [0, 1.84]]));
      add(new THREE.BoxGeometry(0.12, 0.42, 0.12), 2.04);
      add(new THREE.BoxGeometry(0.34, 0.12, 0.12), 2.08);
      break;
    case 'n': {
      add(lathe([...BASE, [0.45, 0.28], [0.42, 0.36], [0, 0.36]]));
      // Horse head: extruded silhouette
      const s = new THREE.Shape();
      const P = [[-0.32, 0], [-0.3, 0.4], [-0.1, 0.72], [-0.36, 0.66], [-0.52, 0.72], [-0.6, 0.6], [-0.52, 0.5], [-0.2, 1.05],
        [-0.08, 1.3], [0.02, 1.16], [0.22, 1.08], [0.36, 0.8], [0.38, 0.4], [0.36, 0]];
      s.moveTo(P[0][0], P[0][1]); P.slice(1).forEach(([x, y]) => s.lineTo(x, y));
      const geo = new THREE.ExtrudeGeometry(s, { depth: 0.36, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.06, bevelSegments: 3 });
      geo.translate(0, 0, -0.18);
      add(geo, 0.34);
      break;
    }
  }
  g.scale.setScalar(scale);
  return g;
}

// ---------- Scene ----------
export function createWorld(canvas, { mobile }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = !mobile;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  const bg = new THREE.Color(0xEEF1F7);
  scene.background = bg;
  scene.fog = new THREE.Fog(bg, 38, 90);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 200);
  camera.position.set(0, 9, 26);

  scene.add(new THREE.HemisphereLight(0xffffff, 0xC9D3E6, 1.1));
  const sun = new THREE.DirectionalLight(0xffffff, 2.2);
  sun.position.set(10, 22, 12);
  sun.castShadow = !mobile;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -14; sun.shadow.camera.right = 14; sun.shadow.camera.top = 14; sun.shadow.camera.bottom = -14;
  sun.shadow.camera.near = 1; sun.shadow.camera.far = 60;
  sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.02;
  scene.add(sun, sun.target);

  // Board: checker texture on a thick rounded slab
  const cv = document.createElement('canvas'); cv.width = cv.height = 512;
  const cx = cv.getContext('2d');
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    cx.fillStyle = (r + c) % 2 ? '#C9D1DE' : '#F7F8FB';
    cx.fillRect(c * 64, r * 64, 64, 64);
  }
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const top = new THREE.Mesh(new THREE.PlaneGeometry(HALF * 2, HALF * 2), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.35, metalness: 0.05 }));
  top.rotation.x = -Math.PI / 2; top.receiveShadow = true; scene.add(top);
  const slab = new THREE.Mesh(new RoundedBoxGeometry(HALF * 2 + 2, 1.2, HALF * 2 + 2, 4, 0.4), MAT.white);
  slab.position.y = -0.61; slab.receiveShadow = true; scene.add(slab);
  const trim = new THREE.Mesh(new THREE.BoxGeometry(HALF * 2 + 0.6, 0.12, HALF * 2 + 0.6), MAT.gold);
  trim.position.y = -0.07; scene.add(trim);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(120, 64), new THREE.MeshStandardMaterial({ color: 0xE4E8F0, roughness: 0.9 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -1.2; floor.receiveShadow = true; scene.add(floor);

  // Decorative giant pieces around the board for depth
  const deco = [['r', MAT.ivory, -24, -20, 3.2], ['n', MAT.onyx, 24, -22, 3.4], ['b', MAT.ivory, 28, 6, 2.6], ['p', MAT.onyx, -27, 8, 2.4], ['q', MAT.onyx, -10, -30, 4], ['k', MAT.ivory, 14, -32, 4.4]];
  deco.forEach(([t, m, x, z, s]) => { const p = makePiece(t, m, s); p.position.set(x, -1.2, z); p.rotation.y = Math.random() * 6; scene.add(p); });

  return { renderer, scene, camera, sun };
}

// ---------- Zone markers ----------
export function makeMarker() {
  const g = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.RingGeometry(1.5, 1.75, 64), new THREE.MeshBasicMaterial({ color: 0x2F8CFF, transparent: true, opacity: 0.0, depthWrite: false }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.03;
  g.add(ring); g.userData.ring = ring;
  return g;
}

// ---------- Props ----------
export function makeTable() {
  const g = new THREE.Group();
  const top = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.14, 48), new THREE.MeshStandardMaterial({ color: 0xE8642C, roughness: 0.8 }));
  top.position.y = 1.15; top.castShadow = true; top.receiveShadow = true; g.add(top);
  const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.1, 16), MAT.gold); leg.position.y = 0.58; g.add(leg);
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.8, 0.08, 32), MAT.gold); foot.position.y = 0.04; g.add(foot);
  // Mini board on the table
  const cv = document.createElement('canvas'); cv.width = cv.height = 128;
  const c = cv.getContext('2d');
  for (let r = 0; r < 8; r++) for (let k = 0; k < 8; k++) { c.fillStyle = (r + k) % 2 ? '#3a3f4a' : '#f3efe6'; c.fillRect(k * 16, r * 16, 16, 16); }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
  const mini = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.06, 1.4), [MAT.wood, MAT.wood, new THREE.MeshStandardMaterial({ map: t, roughness: 0.4 }), MAT.wood, MAT.wood, MAT.wood]);
  mini.position.y = 1.25; mini.castShadow = true; g.add(mini);
  const k = makePiece('k', MAT.gold, 0.22); k.position.set(0.3, 1.28, 0.2); g.add(k);
  const q = makePiece('q', MAT.onyx, 0.2); q.position.set(-0.35, 1.28, -0.3); g.add(q);
  const slide = makePiece('n', MAT.gold, 0.22); slide.position.set(-0.1, 1.28, 0.45); g.add(slide);
  g.userData.slide = slide;
  return g;
}

export function makeChair() {
  const g = new THREE.Group();
  const red = new THREE.MeshStandardMaterial({ color: 0xE0572A, roughness: 0.9 });
  const seat = new THREE.Mesh(new RoundedBoxGeometry(1.1, 0.16, 1.0, 2, 0.06), red); seat.position.y = 0.5; seat.castShadow = true; g.add(seat);
  const back = new THREE.Mesh(new RoundedBoxGeometry(1.1, 1.2, 0.14, 2, 0.06), red); back.position.set(0, 1.15, -0.48); back.castShadow = true; g.add(back);
  for (const [x, z] of [[-0.45, -0.4], [0.45, -0.4], [-0.45, 0.4], [0.45, 0.4]]) {
    const l = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 8), MAT.gold); l.position.set(x, 0.25, z); g.add(l);
  }
  return g;
}

export function makeCharger() {
  const g = new THREE.Group();
  const post = new THREE.Mesh(new RoundedBoxGeometry(0.9, 2.6, 0.6, 3, 0.15), MAT.white); post.position.y = 1.3; post.castShadow = true; g.add(post);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.5), MAT.blue); screen.position.set(0, 1.9, 0.31); g.add(screen);
  const bolt = new THREE.Mesh(new THREE.CircleGeometry(0.12, 3), new THREE.MeshBasicMaterial({ color: 0xffffff })); bolt.position.set(0, 1.9, 0.32); g.add(bolt);
  const pad = new THREE.Mesh(new THREE.CylinderGeometry(1, 1.1, 0.12, 48), MAT.grey); pad.position.set(2.2, 0.06, 0.6); pad.receiveShadow = true; g.add(pad);
  const glow = new THREE.Mesh(new THREE.RingGeometry(0.8, 1.0, 48), new THREE.MeshBasicMaterial({ color: 0x2F8CFF, transparent: true, opacity: 0.25 }));
  glow.rotation.x = -Math.PI / 2; glow.position.set(2.2, 0.13, 0.6); g.add(glow);
  const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0.3, 1.4, 0.3), new THREE.Vector3(0.9, 0.2, 0.9), new THREE.Vector3(1.7, 0.15, 0.8), new THREE.Vector3(2.0, 0.6, 0.6)]);
  const cable = new THREE.Mesh(new THREE.TubeGeometry(curve, 32, 0.06, 8), new THREE.MeshStandardMaterial({ color: 0x1D1D1F, roughness: 0.5 }));
  cable.castShadow = true; g.add(cable);
  const pawn = makePiece('p', MAT.gold, 1.1); pawn.position.set(2.2, 0.12, 0.6); g.add(pawn);
  const queen = makePiece('q', MAT.gold, 1.1); queen.position.set(2.2, 0.12, 0.6); queen.visible = false; g.add(queen);
  Object.assign(g.userData, { pawn, queen, glow, cable });
  return g;
}

export function makeTrolley() {
  const g = new THREE.Group();
  const deck = new THREE.Mesh(new RoundedBoxGeometry(1.6, 0.14, 1.1, 2, 0.05), MAT.grey); deck.position.y = 0.4; deck.castShadow = true; g.add(deck);
  for (const [x, z] of [[-0.6, -0.45], [0.6, -0.45], [-0.6, 0.45], [0.6, 0.45]]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.1, 16), MAT.onyx); w.rotation.x = Math.PI / 2; w.position.set(x, 0.17, z); g.add(w);
  }
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.05, 8, 24, Math.PI), MAT.grey); handle.position.set(-0.8, 1.0, 0); handle.rotation.y = Math.PI / 2; g.add(handle);
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.6, 8), MAT.grey); bar.position.set(-0.8, 0.7, 0.5); g.add(bar);
  const bar2 = bar.clone(); bar2.position.z = -0.5; g.add(bar2);
  const rook = makePiece('r', MAT.gold, 0.9); rook.position.y = 0.47; g.add(rook);
  return g;
}

export function makeCrown() {
  const g = new THREE.Group();
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.27, 0.16, 24, 1, true), MAT.gold); band.material.side = THREE.DoubleSide; g.add(band);
  for (let i = 0; i < 6; i++) {
    const c = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.18, 8), MAT.gold); const a = i / 6 * Math.PI * 2;
    c.position.set(Math.cos(a) * 0.29, 0.16, Math.sin(a) * 0.29); g.add(c);
    const gem = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), new THREE.MeshStandardMaterial({ color: i % 2 ? 0xE0245E : 0x2F8CFF, roughness: 0.2 }));
    gem.position.set(Math.cos(a) * 0.3, 0.0, Math.sin(a) * 0.3); g.add(gem);
  }
  return g;
}

export function makeCap() {
  const g = new THREE.Group();
  const m = new THREE.MeshStandardMaterial({ color: 0x0071E3, roughness: 0.6 });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.47, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), m); g.add(dome);
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.04, 24, 1, false, 0, Math.PI), m); brim.position.set(0, 0.02, 0.35); brim.rotation.y = Math.PI / 2; g.add(brim);
  return g;
}

export function makeStars() {
  const g = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.09), new THREE.MeshBasicMaterial({ color: 0xFFC930 }));
    g.add(s);
  }
  g.visible = false;
  return g;
}

export class Sparks {
  constructor(scene) {
    this.n = 60;
    const geo = new THREE.BufferGeometry();
    this.pos = new Float32Array(this.n * 3); this.vel = new Float32Array(this.n * 3);
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    this.points = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0x7CC4FF, size: 0.14, transparent: true, depthWrite: false }));
    this.points.visible = false; this.t = 0; scene.add(this.points);
  }
  burst(at, color = 0x7CC4FF) {
    this.points.material.color.set(color);
    for (let i = 0; i < this.n; i++) {
      this.pos[i * 3] = at.x; this.pos[i * 3 + 1] = at.y; this.pos[i * 3 + 2] = at.z;
      this.vel[i * 3] = (Math.random() - 0.5) * 6; this.vel[i * 3 + 1] = Math.random() * 6 + 1; this.vel[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    this.t = 1.2; this.points.visible = true;
  }
  update(dt) {
    if (this.t <= 0) return;
    this.t -= dt;
    for (let i = 0; i < this.n; i++) {
      this.vel[i * 3 + 1] -= 12 * dt;
      this.pos[i * 3] += this.vel[i * 3] * dt; this.pos[i * 3 + 1] += this.vel[i * 3 + 1] * dt; this.pos[i * 3 + 2] += this.vel[i * 3 + 2] * dt;
    }
    this.points.geometry.attributes.position.needsUpdate = true;
    this.points.material.opacity = Math.max(0, this.t / 1.2);
    if (this.t <= 0) this.points.visible = false;
  }
}
