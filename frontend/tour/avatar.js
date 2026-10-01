// =========================================================
// Avatar: a stylised 3D Bishal built from code — black blazer,
// white tee, swept black hair, beard and clear-frame sunglasses.
// Upload a real .glb in Django admin (Profile → Avatar model) to
// replace the look; Mixamo clips named Idle/Walk/Wave/Dance are used.
// =========================================================
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const SKIN = 0xC68A5E, HAIR = 0x111111, BLAZER = 0x16171B, TROUSER = 0x1B1C21;

const JOINTS = ['bodyY', 'tiltX', 'torsoX', 'torsoY', 'torsoZ', 'headX', 'headY', 'headZ',
  'aLx', 'aLz', 'eL', 'aRx', 'aRz', 'eR', 'lLx', 'kL', 'lRx', 'kR', 'lLz', 'lRz'];
export const neutral = () => Object.fromEntries(JOINTS.map(j => [j, 0]));

function mesh(geo, color, opts = {}) {
  const m = new THREE.Mesh(geo, opts.material || new THREE.MeshStandardMaterial({ color, roughness: opts.rough ?? 0.6, metalness: opts.metal ?? 0 }));
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

export class Avatar {
  constructor(scene) {
    this.root = new THREE.Group();
    this.tilt = new THREE.Group();      // pivot at the feet (for falling over)
    this.body = new THREE.Group();      // vertical bob
    this.root.add(this.tilt); this.tilt.add(this.body);
    scene.add(this.root);
    this.pose = neutral();
    this.target = neutral();
    this.speed = 5.2;
    this.dest = null;
    this.phase = 0;
    this.time = 0;
    this.mode = 'idle';          // idle | walk | talk | custom
    this.custom = null;          // function(t, pose) used by gags
    this.mixer = null;
    this._build();
  }

  _build() {
    const blazer = new THREE.MeshStandardMaterial({ color: BLAZER, roughness: 0.55, metalness: 0.05 });
    const trouser = new THREE.MeshStandardMaterial({ color: TROUSER, roughness: 0.7 });
    const skin = new THREE.MeshStandardMaterial({ color: SKIN, roughness: 0.55 });
    const hair = new THREE.MeshStandardMaterial({ color: HAIR, roughness: 0.45 });
    const look = new THREE.Group(); this.look = look; this.body.add(look);

    // Hips + legs
    this.hips = new THREE.Group(); this.hips.position.y = 0.98; look.add(this.hips);
    const leg = side => {
      const pivot = new THREE.Group(); pivot.position.set(side * 0.17, 0, 0);
      const thigh = mesh(new THREE.CapsuleGeometry(0.14, 0.32, 4, 12), 0, { material: trouser }); thigh.position.y = -0.24; pivot.add(thigh);
      const knee = new THREE.Group(); knee.position.y = -0.48; pivot.add(knee);
      const shin = mesh(new THREE.CapsuleGeometry(0.13, 0.28, 4, 12), 0, { material: trouser }); shin.position.y = -0.21; knee.add(shin);
      const shoe = mesh(new RoundedBoxGeometry(0.24, 0.13, 0.4, 2, 0.05), 0x2A1E17, { rough: 0.35 }); shoe.position.set(0, -0.44, 0.07); knee.add(shoe);
      this.hips.add(pivot);
      return [pivot, knee];
    };
    [this.legL, this.kneeL] = leg(-1);
    [this.legR, this.kneeR] = leg(1);

    // Torso
    this.torso = new THREE.Group(); this.hips.add(this.torso);
    const jacket = mesh(new RoundedBoxGeometry(0.78, 0.86, 0.44, 4, 0.16), 0, { material: blazer }); jacket.position.y = 0.43; this.torso.add(jacket);
    const tee = mesh(new THREE.ConeGeometry(0.17, 0.5, 3), 0xF7F7F5); tee.rotation.z = Math.PI; tee.rotation.y = Math.PI / 6; tee.scale.z = 0.25; tee.position.set(0, 0.6, 0.2); this.torso.add(tee);
    const lapel = s => { const l = mesh(new THREE.BoxGeometry(0.1, 0.42, 0.03), 0, { material: new THREE.MeshStandardMaterial({ color: 0x0E0F12, roughness: 0.3 }) }); l.position.set(s * 0.13, 0.55, 0.225); l.rotation.z = s * 0.35; this.torso.add(l); };
    lapel(-1); lapel(1);
    const btn = mesh(new THREE.SphereGeometry(0.03, 10, 8), 0, { material: new THREE.MeshStandardMaterial({ color: 0xD9AE45, metalness: 1, roughness: 0.3 }) }); btn.position.set(0.1, 0.25, 0.225); this.torso.add(btn);
    const neck = mesh(new THREE.CylinderGeometry(0.11, 0.12, 0.14, 12), 0, { material: skin }); neck.position.y = 0.9; this.torso.add(neck);

    // Head
    this.head = new THREE.Group(); this.head.position.y = 0.95; this.torso.add(this.head);
    const skull = mesh(new THREE.SphereGeometry(0.4, 32, 24), 0, { material: skin }); skull.scale.set(1, 1.08, 0.98); skull.position.y = 0.38; this.head.add(skull);
    const ear = s => { const e = mesh(new THREE.SphereGeometry(0.08, 12, 10), 0, { material: skin }); e.scale.set(0.6, 1, 0.8); e.position.set(s * 0.4, 0.38, 0); this.head.add(e); };
    ear(-1); ear(1);
    const nose = mesh(new THREE.SphereGeometry(0.055, 12, 10), 0xB97C52); nose.position.set(0, 0.34, 0.4); this.head.add(nose);
    // Beard + moustache
    const beardMat = new THREE.MeshStandardMaterial({ color: 0x15100D, roughness: 0.8 });
    const beard = mesh(new THREE.SphereGeometry(0.415, 32, 16, 0, Math.PI, Math.PI * 0.56, Math.PI * 0.36), 0, { material: beardMat });
    beard.scale.set(1, 1.08, 1.0); beard.position.y = 0.38; this.head.add(beard);
    const stache = mesh(new THREE.CapsuleGeometry(0.025, 0.14, 4, 8), 0, { material: beardMat }); stache.rotation.z = Math.PI / 2; stache.position.set(0, 0.255, 0.39); this.head.add(stache);
    const smile = mesh(new THREE.TorusGeometry(0.07, 0.014, 6, 16, Math.PI), 0x7A3B2E); smile.rotation.z = Math.PI; smile.position.set(0, 0.215, 0.385); this.head.add(smile);
    // Hair: swept up and to the side
    const cap = mesh(new THREE.SphereGeometry(0.43, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.42), 0, { material: hair }); cap.position.set(0, 0.42, -0.02); cap.scale.set(1.02, 1.1, 1.04); this.head.add(cap);
    const tuft = (x, y, z, rx, rz, s) => { const t = mesh(new THREE.CapsuleGeometry(0.1 * s, 0.22 * s, 4, 10), 0, { material: hair }); t.position.set(x, y, z); t.rotation.set(rx, 0, rz); this.head.add(t); };
    tuft(0.06, 0.86, 0.18, 0.9, -0.5, 1.2); tuft(-0.12, 0.84, 0.16, 0.8, 0.4, 1.0); tuft(0.2, 0.8, 0.06, 0.4, -1.0, 1.0); tuft(-0.24, 0.78, 0.0, 0.2, 0.9, 0.9);
    const back = mesh(new THREE.SphereGeometry(0.425, 32, 16, Math.PI, Math.PI, 0, Math.PI * 0.66), 0, { material: hair }); back.position.set(0, 0.4, -0.01); back.scale.set(1.02, 1.08, 1.04); this.head.add(back);
    const side = s => { const sb = mesh(new THREE.BoxGeometry(0.06, 0.22, 0.2), 0, { material: hair }); sb.position.set(s * 0.39, 0.5, 0.0); this.head.add(sb); };
    side(-1); side(1);
    // Sunglasses: clear frames, dark lenses
    const frameMat = new THREE.MeshPhysicalMaterial({ color: 0xFFFFFF, roughness: 0.1, transparent: true, opacity: 0.6, clearcoat: 1 });
    const lensMat = new THREE.MeshStandardMaterial({ color: 0x0A0A0C, metalness: 0.9, roughness: 0.08 });
    this.glasses = new THREE.Group(); this.glasses.position.set(0, 0.42, 0.37); this.head.add(this.glasses);
    for (const s of [-1, 1]) {
      const lens = mesh(new THREE.CircleGeometry(0.115, 24), 0, { material: lensMat }); lens.position.set(s * 0.15, 0, 0.012); this.glasses.add(lens);
      const rim = mesh(new THREE.TorusGeometry(0.12, 0.02, 8, 28), 0, { material: frameMat }); rim.position.set(s * 0.15, 0, 0.01); this.glasses.add(rim);
      const arm = mesh(new THREE.BoxGeometry(0.02, 0.025, 0.36), 0, { material: frameMat }); arm.position.set(s * 0.27, 0.03, -0.17); this.glasses.add(arm);
    }
    const bridge = mesh(new THREE.BoxGeometry(0.07, 0.02, 0.02), 0, { material: frameMat }); bridge.position.set(0, 0.04, 0.012); this.glasses.add(bridge);

    // Arms
    const arm = s => {
      const pivot = new THREE.Group(); pivot.position.set(s * 0.45, 0.76, 0); this.torso.add(pivot);
      const sh = mesh(new THREE.SphereGeometry(0.15, 16, 12), 0, { material: blazer }); pivot.add(sh);
      const upper = mesh(new THREE.CapsuleGeometry(0.12, 0.26, 4, 12), 0, { material: blazer }); upper.position.y = -0.2; pivot.add(upper);
      const elbow = new THREE.Group(); elbow.position.y = -0.4; pivot.add(elbow);
      const fore = mesh(new THREE.CapsuleGeometry(0.11, 0.22, 4, 12), 0, { material: blazer }); fore.position.y = -0.17; elbow.add(fore);
      const cuff = mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.05, 12), 0xF7F7F5); cuff.position.y = -0.33; elbow.add(cuff);
      const hand = mesh(new THREE.SphereGeometry(0.11, 16, 12), 0, { material: skin }); hand.scale.set(0.9, 1.1, 0.8); hand.position.y = -0.43; elbow.add(hand);
      const grip = new THREE.Group(); grip.position.y = -0.5; elbow.add(grip);
      return [pivot, elbow, grip];
    };
    [this.armL, this.elbowL, this.handL] = arm(-1);
    [this.armR, this.elbowR, this.handR] = arm(1);

    // Attachment slots
    this.slots = { chest: new THREE.Group(), overhead: new THREE.Group(), head: new THREE.Group() };
    this.slots.chest.position.set(0, 0.42, 0.55); this.torso.add(this.slots.chest);
    this.slots.overhead.position.set(0, 1.25, 0.05); this.head.add(this.slots.overhead);
    this.slots.head.position.set(0, 0.82, 0); this.head.add(this.slots.head);
    this.handR.add(this.slots.handR = new THREE.Group());
  }

  // Swap in an uploaded GLB model (optional)
  async loadModel(url) {
    const gltf = await new GLTFLoader().loadAsync(url);
    const model = gltf.scene;
    const box = new THREE.Box3().setFromObject(model);
    const h = box.max.y - box.min.y || 1;
    model.scale.setScalar(2.7 / h);
    model.position.y = -box.min.y * (2.7 / h);
    model.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    // Keep the joints (for attached props) but hide the code-built look
    this.look.traverse(o => { if (o.isMesh) o.visible = false; });
    this.body.add(model);
    if (gltf.animations.length) {
      this.mixer = new THREE.AnimationMixer(model);
      const find = re => gltf.animations.find(a => re.test(a.name));
      this.clips = { idle: find(/idle/i), walk: find(/walk|run/i), wave: find(/wave|greet/i), dance: find(/dance/i) };
      this._playClip('idle');
    }
  }
  _playClip(name) {
    if (!this.mixer || !this.clips[name] || this._clip === name) return;
    const next = this.mixer.clipAction(this.clips[name]);
    next.reset().fadeIn(0.3).play();
    if (this._action) this._action.fadeOut(0.3);
    this._action = next; this._clip = name;
  }

  attach(obj, slot) { this.slots[slot].add(obj); }
  detach(obj) { obj.parent && obj.parent.remove(obj); }

  moveTo(v, onArrive) { this.dest = v.clone(); this.onArrive = onArrive; this.mode = 'walk'; this.custom = null; this.turnTo = null; }
  stop() { this.dest = null; if (this.mode === 'walk') this.mode = 'idle'; }
  faceTowards(v, k = 1) {
    const dx = v.x - this.root.position.x, dz = v.z - this.root.position.z;
    const target = Math.atan2(dx, dz);
    let d = target - this.root.rotation.y;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    this.root.rotation.y += d * Math.min(1, k);
  }

  headWorld(out) { return this.head.getWorldPosition(out).add(new THREE.Vector3(0, 1.0, 0)); }

  update(dt, onStep) {
    this.time += dt;
    const t = this.time, P = neutral();

    if (this.dest) {
      const pos = this.root.position, d = this.dest.clone().sub(pos); d.y = 0;
      const dist = d.length();
      if (dist < 0.08) {
        pos.x = this.dest.x; pos.z = this.dest.z; this.dest = null; this.mode = 'idle';
        const cb = this.onArrive; this.onArrive = null; cb && cb();
      } else {
        const step = Math.min(dist, this.speed * dt);
        pos.addScaledVector(d.normalize(), step);
        this.faceTowards(this.dest, dt * 8);
        const prev = this.phase;
        this.phase += dt * 9.5;
        if (Math.floor(prev / Math.PI) !== Math.floor(this.phase / Math.PI)) onStep && onStep();
      }
    }

    if (this.turnTo != null && !this.dest && this.mode !== 'custom') {
      let d = this.turnTo - this.root.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d));
      this.root.rotation.y += d * (1 - Math.exp(-dt * 6));
      if (Math.abs(d) < 0.01) this.turnTo = null;
    }

    if (this.mode === 'walk') {
      const s = Math.sin(this.phase), c = Math.cos(this.phase);
      Object.assign(P, {
        lLx: -s * 0.65, lRx: s * 0.65, kL: Math.max(0, c) * 0.9, kR: Math.max(0, -c) * 0.9,
        aLx: s * 0.55, aRx: -s * 0.55, eL: 0.35, eR: 0.35, aLz: 0.08, aRz: 0.08,
        bodyY: Math.abs(c) * 0.08, torsoY: s * 0.08, torsoX: 0.06, headY: -s * 0.05,
      });
      this._playClip('walk');
    } else if (this.mode === 'custom' && this.custom) {
      this.custom(t, P);
    } else {
      // idle + talk gestures
      Object.assign(P, { torsoX: Math.sin(t * 2) * 0.015, aLz: 0.12, aRz: 0.12, eL: 0.15, eR: 0.15, headZ: Math.sin(t * 0.9) * 0.04, bodyY: Math.sin(t * 2) * 0.01 });
      if (this.mode === 'talk') {
        P.aRx = -0.7 + Math.sin(t * 3.2) * 0.25; P.eR = 1.1 + Math.sin(t * 4) * 0.2; P.aRz = 0.25;
        P.headX = Math.sin(t * 5) * 0.05; P.headY = Math.sin(t * 1.7) * 0.12;
      }
      this._playClip('idle');
    }

    // Smoothly blend toward the target pose
    const k = 1 - Math.exp(-dt * (this.mode === 'custom' ? 18 : 12));
    for (const j of JOINTS) this.pose[j] += (P[j] - this.pose[j]) * k;
    this._apply();
    if (this.mixer) this.mixer.update(dt);
  }

  _apply() {
    const p = this.pose;
    this.body.position.y = p.bodyY;
    this.tilt.rotation.x = p.tiltX;
    this.torso.rotation.set(p.torsoX, p.torsoY, p.torsoZ);
    this.head.rotation.set(p.headX, p.headY, p.headZ);
    this.armL.rotation.set(p.aLx, 0, -p.aLz); this.elbowL.rotation.x = -p.eL;
    this.armR.rotation.set(p.aRx, 0, p.aRz); this.elbowR.rotation.x = -p.eR;
    this.legL.rotation.set(p.lLx, 0, -p.lLz); this.kneeL.rotation.x = p.kL;
    this.legR.rotation.set(p.lRx, 0, p.lRz); this.kneeR.rotation.x = p.kR;
  }
}
