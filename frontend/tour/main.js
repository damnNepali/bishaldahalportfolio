// =========================================================
// Bishal Dahal — 3D portfolio tour
// Source for static/js/bd-tour.min.js (rebuild with `npm run build`)
// =========================================================
import * as THREE from 'three';
import { createWorld, makePiece, makeMarker, makeTable, makeChair, makeCharger, makeStars, Sparks, MAT } from './world.js';
import { Avatar, neutral } from './avatar.js';
import { Sound } from './audio.js';
import { pawnGag, queenGag, rookGag, knightGag, bishopGag, kingGag, evGag, contactGag, welcomeGag, sitPose } from './gags.js';

const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const DATA = JSON.parse($('#tour-data').textContent);
const P = DATA.profile;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobileQ = matchMedia('(max-width: 820px)');
const isMobile = () => mobileQ.matches;
const V = (x, z) => new THREE.Vector3(x, 0, z);
const first = (P.name || 'Bishal').split(' ')[0];

// ---------------------------------------------------------
// Stops on the board
// ---------------------------------------------------------
const ring = (deg, r) => V(Math.sin(deg * Math.PI / 180) * r, Math.cos(deg * Math.PI / 180) * r);
// Monuments stand on an outer ring; Bishal stops in front of each, and the camera looks outward at him.
const STOPS = [
  { id: 'welcome', label: 'Welcome', piece: 'k', theme: 'welcome', stand: V(0, 10),
    lines: [`Namaste! Welcome to my portfolio.`, `I'm ${P.name} — ${P.headline || 'developer, founder and strategist'}`, `Life is like chess: every move matters. Let me show you my game!`] },
  { id: 'education', label: 'Education', piece: 'p', theme: 'gentle', stand: ring(-60, 8.5), monument: ['p', MAT.ivory, ring(-60, 12.6), 2.6],
    lines: [`Every big move starts small. Careful… this little pawn is my education!`] },
  { id: 'tech', label: 'Technology', piece: 'q', theme: 'tech', stand: ring(-105, 8.5), monument: ['q', MAT.gold, ring(-105, 12.2), 2.4],
    lines: [`Code is my most powerful piece… and the heaviest! Hnnngh!`] },
  { id: 'business', label: 'Businesses', piece: 'r', theme: 'party', stand: ring(-150, 8.5), monument: ['r', MAT.onyx, ring(-150, 12.6), 2.4],
    lines: [`Special delivery! Here are the businesses I've built.`] },
  { id: 'strategy', label: 'Strategy', piece: 'n', theme: 'party', stand: ring(165, 7.5), monument: ['n', MAT.gold, ring(165, 12.6), 2.4],
    lines: [`Strategy rarely moves in a straight line. Ask my horse!`] },
  { id: 'service', label: 'Service', piece: 'b', theme: 'gentle', stand: ring(120, 8.5), monument: ['b', MAT.ivory, ring(120, 12.6), 2.6],
    lines: [`Leadership beyond business — with the Lions, the Leos and my foundation.`] },
  { id: 'journey', label: 'Journey', piece: 'k', theme: 'royal', stand: ring(70, 8.5), monument: ['k', MAT.gold, ring(70, 12.8), 2.5],
    lines: [`Every king needs a crown… ow. Here's my journey so far.`] },
  { id: 'mission', label: 'EV mission', piece: 'p', theme: 'tech', stand: V(7, 10.8),
    lines: [`My next move: an EV charging spot. Watch the pawn charge up!`] },
  { id: 'contact', label: 'Contact', piece: 'n', theme: 'welcome', stand: V(0, 10),
    lines: [`That's my game so far. Your move — let's talk!`] },
];
// Camera looks from the board centre outward at each monument
STOPS.forEach(s => { s.camDir = s.monument ? s.stand.clone().sub(s.monument[2]).normalize() : V(0, 1); s.camYaw = Math.atan2(s.camDir.x, s.camDir.z); });

// ---------------------------------------------------------
// Panels (content from Django)
// ---------------------------------------------------------
const chips = arr => arr && arr.length ? `<ul class="t-chips">${arr.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : '';
const btn = (href, label, solid, ext) => href ? `<a class="t-btn${solid ? ' solid' : ''}" href="${esc(href)}"${ext ? ' target="_blank" rel="noopener"' : ''}>${esc(label)}</a>` : '';
const expItem = e => `<li class="t-item"><div class="t-row"><span class="t-kind k-${esc(e.kind)}">${esc(e.kind_label)}</span>${e.period ? `<span class="t-when">${esc(e.period)}</span>` : ''}</div>
  <h4>${esc(e.title)}</h4><span class="t-org">${esc(e.org)}${e.location ? ' · ' + esc(e.location) : ''}</span>
  ${e.description ? `<p>${esc(e.description)}</p>` : ''}${e.highlights.length ? `<ul class="t-hl">${e.highlights.map(h => `<li>${esc(h)}</li>`).join('')}</ul>` : ''}</li>`;

const PANELS = {
  welcome: () => `
    <img class="t-photo" src="${esc(P.photo)}" alt="Portrait of ${esc(P.name)}">
    <p class="t-kicker">${esc(P.location)}</p>
    <h2>${esc(P.name)}</h2>
    <p class="t-lead">${esc(P.headline)} <span>${esc(P.tagline)}</span></p>
    ${P.intro ? `<p>${esc(P.intro)}</p>` : ''}
    ${DATA.stats.length ? `<div class="t-stats">${DATA.stats.map(s => `<div><b>${esc(s.value)}${esc(s.suffix)}</b><span>${esc(s.label)}</span></div>`).join('')}</div>` : ''}
    <div class="t-actions"><button class="t-btn solid" data-next>Start the tour</button>${btn(DATA.urls.classic, 'Classic portfolio')}${btn(DATA.urls.blog, 'Blog')}</div>`,
  education: () => {
    const ed = DATA.experiences.filter(e => e.kind === 'education');
    return `<p class="t-kicker">♟ The pawn · Education</p><h2>Every big move starts small.</h2>
      ${ed.length ? `<ol class="t-list">${ed.map(expItem).join('')}</ol>` : `<p>${esc(P.education || 'Studying BCA.')}</p>`}`;
  },
  tech: () => `<p class="t-kicker">♕ The queen · Technology</p><h2>Code is my most versatile piece.</h2>
    ${DATA.skills.map(g => `<h3>${esc(g.group)}</h3>${chips(g.items)}`).join('')}
    ${DATA.projects.length ? `<h3>Projects</h3><div class="t-cards">${DATA.projects.map(p => `<article class="t-card">
      ${p.image ? `<img src="${esc(p.image)}" alt="" loading="lazy">` : ''}<h4>${esc(p.title)}</h4><p>${esc(p.summary)}</p>${chips(p.tech)}
      <div class="t-actions">${btn(p.live, 'Live demo', true, 1)}${btn(p.github, 'GitHub', false, 1)}</div></article>`).join('')}</div>` : ''}`,
  business: () => `<p class="t-kicker">♜ The rook · Businesses</p><h2>Built on solid, open lines.</h2>
    <div class="t-cards">${DATA.businesses.map(b => `<article class="t-card">
      <div class="t-row">${b.logo ? `<img class="t-logo" src="${esc(b.logo)}" alt="">` : `<span class="t-mono">${esc(b.initials)}</span>`}${b.category ? `<span class="t-kind">${esc(b.category)}</span>` : ''}</div>
      <h4>${esc(b.name)}</h4><span class="t-org">${esc(b.role)}</span>${b.description ? `<p>${esc(b.description)}</p>` : ''}
      <div class="t-actions">${btn(b.website, 'Visit', false, 1)}</div></article>`).join('')}</div>
    ${P.pkr_intro ? `<div class="t-note"><h4>Paisa ko Rahasya</h4><p>${esc(P.pkr_intro)}</p>${btn(P.pkr_url, 'Follow', true, 1)}</div>` : ''}`,
  strategy: () => `<p class="t-kicker">♞ The knight · Strategy</p><h2>Strategy rarely moves in a straight line.</h2>
    <p>The knight is the only piece that jumps. That's how I approach business: sharp decisions and moves other people don't see coming.</p>
    ${DATA.achievements.length ? `<h3>Achievements</h3><ol class="t-list">${DATA.achievements.map(a => `<li class="t-item"><div class="t-row"><span class="t-kind k-achievement">${esc(a.category)}</span>${a.year ? `<span class="t-when">${esc(a.year)}</span>` : ''}</div><h4>${esc(a.title)}</h4>${a.event ? `<span class="t-org">${esc(a.event)}</span>` : ''}${a.description ? `<p>${esc(a.description)}</p>` : ''}</li>`).join('')}</ol>` : ''}`,
  service: () => `<p class="t-kicker">♝ The bishop · Service</p><h2>Leadership beyond business.</h2>
    <ol class="t-list">${DATA.leadership.map(l => `<li class="t-item"><h4>${esc(l.org)}</h4><span class="t-org">${esc(l.role)}${l.period ? ' · ' + esc(l.period) : ''}</span>${l.description ? `<p>${esc(l.description)}</p>` : ''}</li>`).join('')}</ol>`,
  journey: () => {
    const ex = DATA.experiences.filter(e => e.kind !== 'education');
    return `<p class="t-kicker">♔ The king · Journey</p><h2>Every move so far.</h2><ol class="t-list">${ex.map(expItem).join('')}</ol>`;
  },
  mission: () => {
    const m = DATA.mission;
    if (!m) return `<p class="t-kicker">⚡ Next mission</p><h2>An EV charging spot.</h2>`;
    return `<p class="t-kicker">⚡ Next mission · ${esc(m.status)}</p><h2>${esc(m.title)}</h2>${m.description ? `<p>${esc(m.description)}</p>` : ''}
      <div class="t-meter"><i style="width:${Number(m.progress) || 0}%"></i></div><p class="t-small">${Number(m.progress) || 0}% charged</p>
      ${m.milestones.length ? `<ol class="t-steps">${m.milestones.map(s => `<li class="${s.done ? 'done' : ''}">${esc(s.text)}</li>`).join('')}</ol>` : ''}`;
  },
  contact: () => `<p class="t-kicker">✉️ Your move</p><h2>Let's talk.</h2>
    <form class="t-form" id="tForm" novalidate>
      <label>Name<input name="name" autocomplete="name" required></label>
      <label>Email<input name="email" type="email" autocomplete="email" required></label>
      <label>Topic<select name="topic">${DATA.topics.map(([k, v]) => `<option value="${esc(k)}">${esc(v)}</option>`).join('')}</select></label>
      <label>Message<textarea name="message" rows="4" required></textarea></label>
      <input name="website" class="t-hp" tabindex="-1" autocomplete="off" aria-hidden="true">
      <button class="t-btn solid" type="submit">Send message</button><p class="t-small" id="tNote" role="status"></p>
    </form>
    ${P.email ? `<p><a class="t-link" href="mailto:${esc(P.email)}">${esc(P.email)}</a></p>` : ''}${P.phone ? `<p class="t-small">${esc(P.phone)}</p>` : ''}
    <div class="t-actions">${Object.entries(P.links).filter(([, u]) => u).map(([k, u]) => btn(u, k[0].toUpperCase() + k.slice(1), false, 1)).join('')}</div>
    ${DATA.posts.length ? `<h3>Latest writing</h3><ul class="t-posts">${DATA.posts.map(p => `<li><a href="${esc(p.url)}"><b>${esc(p.title)}</b><span>${esc(p.date)}</span></a></li>`).join('')}</ul>` : ''}
    <div class="t-actions">${btn(DATA.urls.classic, 'Classic portfolio')}${btn(DATA.urls.blog, 'Blog')}</div>`,
};

// ---------------------------------------------------------
// Boot
// ---------------------------------------------------------
const gate = $('#gate'), canvas = $('#scene');
function webglOK() { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } }
if (!webglOK()) {
  gate.classList.add('nogl');
  $('#gateStatus').textContent = "Your browser can't show 3D here — the classic portfolio has everything.";
  throw new Error('WebGL unavailable');
}

const { renderer, scene, camera, sun } = createWorld(canvas, { mobile: isMobile() });
const sound = new Sound();
const avatar = new Avatar(scene);
const sparks = new Sparks(scene);
const stars = makeStars();

// Build zones
const table = makeTable(), chair = makeChair();
table.position.copy(STOPS[0].stand).add(V(0, 1.65)); chair.position.copy(STOPS[0].stand);
scene.add(table, chair);
const charger = makeCharger(); charger.position.set(5.6, 0, 6.6); scene.add(charger);
const markers = [];
STOPS.forEach(s => {
  if (s.monument) {
    const [type, mat, pos, scale] = s.monument;
    const m = makePiece(type, mat, scale); m.position.copy(pos);
    if (type === 'n') m.rotation.y = Math.PI / 2 + 0.4;
    scene.add(m); s.mesh = m;
  }
  const mk = makeMarker(); mk.position.copy(s.stand); scene.add(mk); markers.push(mk);
});

avatar.root.position.copy(STOPS[0].stand);
avatar.mode = 'custom'; avatar.custom = (t, P) => sitPose(P, t);

if (DATA.urls.avatar) avatar.loadModel(DATA.urls.avatar).catch(err => console.warn('Avatar model failed to load, using the built-in one.', err));

// ---------------------------------------------------------
// UI elements
// ---------------------------------------------------------
const panel = $('#panel'), panelBody = $('#panelBody'), bubble = $('#bubble'), skipBtn = $('#skipBtn'), replayBtn = $('#replayBtn');
const dock = $('#stops'), soundBtn = $('#soundBtn'), stopLabel = $('#stopLabel');
STOPS.forEach((s, i) => {
  const b = document.createElement('button');
  b.className = 't-stop'; b.type = 'button'; b.dataset.i = i; b.title = s.label;
  b.innerHTML = `<svg viewBox="0 0 100 100" aria-hidden="true"><use href="#pc-${s.piece}"/></svg><span>${esc(s.label)}</span>`;
  b.addEventListener('click', () => go(i));
  dock.appendChild(b);
});

let seen = new Set();
try { seen = new Set(JSON.parse(localStorage.getItem('bd-tour-seen') || '[]')); } catch (e) {}
const markSeen = id => { seen.add(id); try { localStorage.setItem('bd-tour-seen', JSON.stringify([...seen])); } catch (e) {} };

// ---------------------------------------------------------
// Speech bubble
// ---------------------------------------------------------
let speech = null;
function say(lines) {
  speech = { lines: [...lines], i: 0, chars: 0, hold: 0, t: 0 };
  bubble.classList.add('show');
}
function updateSpeech(dt) {
  if (!speech) return;
  const line = speech.lines[speech.i];
  if (!line) { speech = null; bubble.classList.remove('show'); if (avatar.mode === 'talk') avatar.mode = 'idle'; return; }
  speech.t += dt;
  const target = Math.min(line.length, Math.floor(speech.t * 38));
  if (target > speech.chars) {
    if (Math.floor(target / 3) > Math.floor(speech.chars / 3)) sound.play('blip');
    speech.chars = target;
    bubble.textContent = line.slice(0, speech.chars);
  }
  if (speech.chars >= line.length) {
    speech.hold += dt;
    if (speech.hold > 1.2 + line.length * 0.025) { speech.i++; speech.chars = 0; speech.t = 0; speech.hold = 0; }
  }
  if (!gag && !avatar.dest && avatar.mode !== 'custom') avatar.mode = 'talk';
}
const headPos = new THREE.Vector3();
function placeBubble() {
  if (!bubble.classList.contains('show')) return;
  avatar.headWorld(headPos).project(camera);
  const r = canvas.getBoundingClientRect();
  const x = (headPos.x * 0.5 + 0.5) * r.width, y = (-headPos.y * 0.5 + 0.5) * r.height;
  bubble.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px) translate(-50%, -100%)`;
}

// ---------------------------------------------------------
// Tour director
// ---------------------------------------------------------
let current = 0, gag = null, started = false, path = [];

let panelFor = null;
function setPanel(stop) {
  if (panelFor === stop.id && panelBody.innerHTML) { if (!isMobile() || panel.dataset.userOpened === '1') panel.classList.add('open'); return; }
  panelFor = stop.id;
  panelBody.innerHTML = PANELS[stop.id]();
  panelBody.scrollTop = 0;
  if (!isMobile() || panel.dataset.userOpened === '1') panel.classList.add('open');
  $('#panelToggleLabel').textContent = stop.label;
  panelBody.querySelectorAll('[data-next]').forEach(b => b.addEventListener('click', () => go(current + 1)));
  const f = $('#tForm', panelBody); if (f) bindForm(f);
}

function updateUI() {
  const s = STOPS[current];
  stopLabel.textContent = s.label;
  dock.querySelectorAll('.t-stop').forEach((b, i) => { b.classList.toggle('on', i === current); b.setAttribute('aria-current', i === current ? 'step' : 'false'); });
  $('#prevBtn').disabled = current === 0;
  $('#nextBtn').disabled = current === STOPS.length - 1;
  const on = dock.querySelector('.t-stop.on'); on && on.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  sound.setTheme(s.theme);
}

function makeGag(stop) {
  const ctx = { avatar, sound, scene, sparks, stars, table, charger, monument: stop.mesh, camYaw: stop.camYaw };
  return ({ welcome: welcomeGag, education: pawnGag, tech: queenGag, business: rookGag, strategy: knightGag, service: bishopGag, journey: kingGag, mission: evGag, contact: contactGag })[stop.id](ctx);
}

function endGag() {
  if (!gag) return;
  const g = gag; gag = null;
  g.finish();
  skipBtn.hidden = true;
}

function playGag(stop) {
  endGag();
  // remove props left from an earlier play of the same gag
  (stop.props || []).forEach(p => scene.remove(p));
  avatar.turnTo = null;
  const g = gag = makeGag(stop);
  stop.props = g.props || [];
  skipBtn.hidden = false; replayBtn.hidden = true;
  g.onDone = () => {
    skipBtn.hidden = true; replayBtn.hidden = false;
    markSeen(stop.id);
    if (g.keepPose) { const kp = g.keepPose; avatar.mode = 'custom'; avatar.custom = (t, P) => kp(t, P); }
    else if (avatar.mode === 'custom') { avatar.mode = 'idle'; avatar.custom = null; }
    if (!g.keepPose && stop.id !== 'mission') avatar.turnTo = stop.camYaw;
    gag = null;
    if (!panelBody.innerHTML) setPanel(stop);
  };
}

function arrive() {
  const s = STOPS[current];
  avatar.root.rotation.y = s.camYaw; // face the camera
  if (s.id === 'mission') avatar.faceTowards(charger.position.clone().add(V(2.2, 0.6)), 1);
  say(s.lines);
  const autoplay = !reduce && !seen.has(s.id);
  if (autoplay) { playGag(s); setPanel(s); }
  else {
    setPanel(s);
    replayBtn.hidden = false;
    if (s.id === 'contact') { avatar.mode = 'custom'; avatar.custom = (t, P) => sitPose(P, t); }
  }
}

// Avoid walking through monuments: add a detour point if needed
function planPath(from, to) {
  const pts = [to.clone()];
  const obstacles = [...STOPS.filter(s => s.mesh).map(s => s.mesh.position), charger.position, charger.position.clone().add(V(2.2, 0.6)), table.position];
  for (const m of obstacles) {
    const ab = to.clone().sub(from), am = m.clone().sub(from);
    const u = Math.max(0, Math.min(1, am.dot(ab) / ab.lengthSq()));
    const closest = from.clone().addScaledVector(ab, u);
    if (u > 0.05 && u < 0.95 && closest.distanceTo(m) < 2.6) {
      const away = closest.clone().sub(m).setY(0);
      if (away.lengthSq() < 1e-4) away.set(-ab.z, 0, ab.x);
      pts.unshift(m.clone().add(away.normalize().multiplyScalar(3.4)));
      break;
    }
  }
  return pts;
}

function walkPath() {
  const next = path.shift();
  if (!next) return arrive();
  avatar.moveTo(next, walkPath);
}

function go(i) {
  i = Math.max(0, Math.min(STOPS.length - 1, i));
  if (!started) return;
  if (i === current && !avatar.dest) { if (!gag) arrive(); return; }
  endGag();
  speech = null; bubble.classList.remove('show');
  replayBtn.hidden = true;
  current = i; updateUI();
  setPanel(STOPS[i]); // show the destination's content while walking
  avatar.custom = null; avatar.mode = 'walk';
  path = planPath(avatar.root.position.clone().setY(0), STOPS[i].stand);
  sound.play('whoosh');
  walkPath();
}

// ---------------------------------------------------------
// Contact form (posts to Django)
// ---------------------------------------------------------
function bindForm(form) {
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const note = $('#tNote', form); note.textContent = 'Sending…';
    const fd = new FormData(form);
    try {
      const res = await fetch(DATA.urls.contact, { method: 'POST', body: fd, headers: { 'X-Requested-With': 'XMLHttpRequest', 'X-CSRFToken': DATA.csrf } });
      const data = await res.json();
      if (data.ok) { form.reset(); note.textContent = data.message; sound.play('jingle'); avatar.mode = 'custom'; const t0 = avatar.time; avatar.custom = (t, P) => { Object.assign(P, { aLz: 2.6, aRz: 2.6, eL: 0.3, eR: 0.3, bodyY: Math.abs(Math.sin((t - t0) * 9)) * 0.2 }); }; say(['Got it! I\'ll reply soon. 🎉']); }
      else note.textContent = Object.values(data.errors || {}).flat().join(' ') || 'Check the form and try again.';
    } catch (err) { note.textContent = "The message didn't send. Check your connection and try again."; }
  });
}

// ---------------------------------------------------------
// Controls
// ---------------------------------------------------------
$('#nextBtn').addEventListener('click', () => go(current + 1));
$('#prevBtn').addEventListener('click', () => go(current - 1));
skipBtn.addEventListener('click', () => { endGag(); });
replayBtn.addEventListener('click', () => { const s = STOPS[current]; if (!avatar.dest) { arriveReplay(s); } });
function arriveReplay(s) {
  // reset scene state for gags that change the world
  if (s.id === 'mission') { const u = charger.userData; u.pawn.visible = true; u.queen.visible = false; }
  if (s.mesh) s.mesh.position.copy(s.monument[2]);
  avatar.root.position.copy(s.stand); avatar.root.rotation.y = s.camYaw;
  if (s.id === 'mission') avatar.faceTowards(charger.position.clone().add(V(2.2, 0.6)), 1);
  playGag(s); say(s.lines);
}
$('#panelToggle').addEventListener('click', () => { const o = panel.classList.toggle('open'); panel.dataset.userOpened = o ? '1' : '0'; });
soundBtn.addEventListener('click', () => {
  const on = !sound.enabled;
  sound.setEnabled(on, DATA.urls.music);
  soundBtn.setAttribute('aria-pressed', String(on));
  soundBtn.innerHTML = on ? '🔊<span class="sr">Sound on</span>' : '🔇<span class="sr">Sound off</span>';
});

addEventListener('keydown', e => {
  if (!started || /input|textarea|select/i.test(e.target.tagName)) return;
  if (['ArrowRight', 'ArrowDown', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); go(current + 1); }
  if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key)) { e.preventDefault(); go(current - 1); }
  if (e.key === 'Escape') endGag();
});
let wheelLock = 0;
canvas.addEventListener('wheel', e => {
  if (!started) return;
  e.preventDefault();
  const now = performance.now();
  if (now < wheelLock || Math.abs(e.deltaY) < 12) return;
  wheelLock = now + 1100;
  go(current + (e.deltaY > 0 ? 1 : -1));
}, { passive: false });
let touch = null;
canvas.addEventListener('touchstart', e => { touch = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }, { passive: true });
canvas.addEventListener('touchend', e => {
  if (!touch || !started) return;
  const dx = e.changedTouches[0].clientX - touch.x, dy = e.changedTouches[0].clientY - touch.y;
  if (Math.max(Math.abs(dx), Math.abs(dy)) > 50) go(current + ((Math.abs(dx) > Math.abs(dy) ? -dx : -dy) > 0 ? 1 : -1));
  touch = null;
});
const mouse = { x: 0, y: 0 };
addEventListener('pointermove', e => { mouse.x = e.clientX / innerWidth - 0.5; mouse.y = e.clientY / innerHeight - 0.5; });

// ---------------------------------------------------------
// Gate (welcome screen)
// ---------------------------------------------------------
function enter(withSound) {
  if (started) return;
  started = true;
  if (withSound) { sound.start(DATA.urls.music); soundBtn.setAttribute('aria-pressed', 'true'); soundBtn.innerHTML = '🔊<span class="sr">Sound on</span>'; }
  gate.classList.add('gone');
  document.body.classList.add('touring');
  updateUI();
  setTimeout(() => {
    say(STOPS[0].lines);
    if (!reduce) playGag(STOPS[0]); else { avatar.mode = 'idle'; avatar.custom = null; }
    setPanel(STOPS[0]);
  }, 700);
}
$('#enterSound').addEventListener('click', () => enter(true));
$('#enterQuiet').addEventListener('click', () => enter(false));

// ---------------------------------------------------------
// Render loop
// ---------------------------------------------------------
const MAX_DT = 0.05;
const clock = { last: performance.now(), elapsedTime: 0, getDelta() { const n = performance.now(), d = (n - this.last) / 1000; this.last = n; this.elapsedTime += d; return d; } };
const camPos = new THREE.Vector3(0, 6, 22), camLook = new THREE.Vector3(0, 1.5, 10), camDir = V(0, 1);
let viewShift = 0;

function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.fov = isMobile() ? 52 : 38;
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize); resize();

function frame() {
  const dt = Math.min(clock.getDelta(), MAX_DT);
  avatar.update(dt, () => sound.play('step'));
  if (gag) gag.tick(dt);
  sparks.update(dt);
  updateSpeech(dt);

  // Markers pulse at the current stop
  markers.forEach((m, i) => { m.userData.ring.material.opacity = i === current && started ? 0.45 + Math.sin(clock.elapsedTime * 4) * 0.2 : 0; });

  // Camera follows the avatar
  const a = avatar.root.position;
  const mob = isMobile();
  camDir.lerp(STOPS[current].camDir, 1 - Math.exp(-dt * 1.6)).normalize();
  const side = new THREE.Vector3(camDir.z, 0, -camDir.x);
  const off = started
    ? (mob ? camDir.clone().multiplyScalar(10).setY(4.6) : camDir.clone().multiplyScalar(12.5).addScaledVector(side, mouse.x * 2.4).setY(5.6 - mouse.y * 1.2))
    : new THREE.Vector3(0, 3.2, 8.5);
  const wantPos = a.clone().add(off), wantLook = a.clone().add(new THREE.Vector3(0, started ? 1.5 : 1.6, 0));
  const k = 1 - Math.exp(-dt * (reduce ? 10 : 2.6));
  camPos.lerp(wantPos, k); camLook.lerp(wantLook, k);
  camera.position.copy(camPos); camera.lookAt(camLook);

  // Shift the picture so the avatar isn't hidden behind the panel
  const open = panel.classList.contains('open') && started;
  const want = open ? 1 : 0;
  viewShift += (want - viewShift) * (1 - Math.exp(-dt * 5));
  const w = innerWidth, h = innerHeight;
  if (mob) camera.setViewOffset(w, h, 0, h * 0.2 * viewShift, w, h);
  else camera.setViewOffset(w, h, w * 0.19 * viewShift, 0, w, h);

  sun.position.set(a.x + 10, 22, a.z + 12); sun.target.position.copy(a);

  renderer.render(scene, camera);
  placeBubble();
  requestAnimationFrame(frame);
}

// Ready: reveal the gate buttons
requestAnimationFrame(() => {
  frame();
  gate.classList.add('ready');
  $('#gateStatus').textContent = reduce ? 'Motion is reduced on your device — the tour will be calm.' : 'Best with sound on. Use arrows, scroll or swipe to move.';
});
