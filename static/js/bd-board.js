/* Hero chessboard: replays Paul Morphy's "Opera Game" (Paris, 1858) on a loop. */
(function () {
  const el = document.getElementById('board');
  if (!el) return;
  const movesEl = document.getElementById('moves');
  const toggle = document.getElementById('boardToggle');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const F = 'abcdefgh';
  const xy = s => [F.indexOf(s[0]), 8 - Number(s[1])];

  // [UCI move, notation]
  const GAME = [
    ['e2e4', 'e4'], ['e7e5', 'e5'], ['g1f3', 'Nf3'], ['d7d6', 'd6'], ['d2d4', 'd4'], ['c8g4', 'Bg4'],
    ['d4e5', 'dxe5'], ['g4f3', 'Bxf3'], ['d1f3', 'Qxf3'], ['d6e5', 'dxe5'], ['f1c4', 'Bc4'], ['g8f6', 'Nf6'],
    ['f3b3', 'Qb3'], ['d8e7', 'Qe7'], ['b1c3', 'Nc3'], ['c7c6', 'c6'], ['c1g5', 'Bg5'], ['b7b5', 'b5'],
    ['c3b5', 'Nxb5'], ['c6b5', 'cxb5'], ['c4b5', 'Bxb5+'], ['b8d7', 'Nbd7'], ['e1c1', 'O-O-O'], ['a8d8', 'Rd8'],
    ['d1d7', 'Rxd7'], ['d8d7', 'Rxd7'], ['h1d1', 'Rd1'], ['e7e6', 'Qe6'], ['b5d7', 'Bxd7+'], ['f6d7', 'Nxd7'],
    ['b3b8', 'Qb8+'], ['d7b8', 'Nxb8'], ['d1d8', 'Rd8#']
  ];
  const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';

  // Squares + coordinates
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const d = document.createElement('div');
    d.className = 'sq ' + ((r + c) % 2 ? 'd' : 'l');
    if (r === 7) d.insertAdjacentHTML('beforeend', `<span class="c f">${F[c]}</span>`);
    if (c === 0) d.insertAdjacentHTML('beforeend', `<span class="c r">${8 - r}</span>`);
    el.appendChild(d);
  }
  const hlA = document.createElement('div'), hlB = document.createElement('div');
  hlA.className = hlB.className = 'hl';
  el.append(hlA, hlB);

  // Move list
  const items = GAME.map(([, san], i) => {
    const li = document.createElement('li');
    li.textContent = (i % 2 === 0 ? (i / 2 + 1) + '. ' : '') + san;
    movesEl && movesEl.appendChild(li);
    return li;
  });

  let pos = {};
  const place = (p, sq) => { const [x, y] = xy(sq); p.style.transform = `translate(${x * 100}%, ${y * 100}%)`; };
  const mark = (h, sq) => { const [x, y] = xy(sq); h.style.transform = `translate(${x * 100}%, ${y * 100}%)`; h.style.opacity = 1; };

  function reset() {
    el.querySelectorAll('.pz').forEach(p => p.remove());
    el.classList.remove('ended');
    hlA.style.opacity = hlB.style.opacity = 0;
    items.forEach(li => li.classList.remove('on'));
    if (movesEl) movesEl.scrollLeft = 0;
    pos = {};
    START.split('/').forEach((row, r) => {
      let c = 0;
      for (const ch of row) {
        if (/\d/.test(ch)) { c += Number(ch); continue; }
        const white = ch === ch.toUpperCase();
        const p = document.createElement('div');
        p.className = 'pz';
        p.dataset.t = ch.toLowerCase();
        p.dataset.c = white ? 'w' : 'b';
        p.innerHTML = `<svg class="pc ${white ? 'ivory' : 'onyx'}" width="40" height="40" viewBox="0 0 100 100" aria-hidden="true"><use href="#pc-${ch.toLowerCase()}"/></svg>`;
        const sq = F[c] + (8 - r);
        place(p, sq); el.appendChild(p); pos[sq] = p; c++;
      }
    });
  }

  function move(from, to) {
    const p = pos[from];
    const victim = pos[to];
    if (victim) { victim.classList.add('gone'); setTimeout(() => victim.remove(), 450); }
    delete pos[from]; pos[to] = p;
    p.classList.add('moving'); place(p, to);
    setTimeout(() => p.classList.remove('moving'), 620);
    return p;
  }

  function play(i) {
    const [uci, san] = GAME[i];
    const from = uci.slice(0, 2), to = uci.slice(2, 4);
    const p = move(from, to);
    // Castling: move the rook too
    if (p.dataset.t === 'k' && Math.abs(F.indexOf(from[0]) - F.indexOf(to[0])) === 2) {
      const rank = from[1];
      if (to[0] === 'g') move('h' + rank, 'f' + rank); else move('a' + rank, 'd' + rank);
    }
    mark(hlA, from); mark(hlB, to);
    el.querySelectorAll('.pz.check').forEach(k => k.classList.remove('check'));
    if (/[+#]/.test(san)) {
      const king = Object.values(pos).find(q => q.dataset.t === 'k' && q.dataset.c !== p.dataset.c);
      king && king.classList.add('check');
    }
    items.forEach((li, j) => li.classList.toggle('on', j === i));
    const li = items[i];
    if (movesEl && li) movesEl.scrollTo({ left: li.offsetLeft - movesEl.clientWidth / 2 + li.clientWidth / 2, behavior: reduce ? 'auto' : 'smooth' });
    if (san.endsWith('#')) el.classList.add('ended');
  }

  let i = 0, timer = null, playing = !reduce, visible = true;
  const STEP = 1250;

  function tick() {
    timer = null;
    if (!playing || !visible || document.hidden) return;
    if (i < GAME.length) {
      play(i++);
      timer = setTimeout(tick, i === GAME.length ? 3800 : STEP);
    } else {
      reset(); i = 0;
      timer = setTimeout(tick, 900);
    }
  }
  const resume = () => { if (!timer && playing && visible && !document.hidden) timer = setTimeout(tick, 400); };
  const stop = () => { clearTimeout(timer); timer = null; };

  reset();
  if (reduce) {
    // Show the final checkmate position without animation
    for (; i < GAME.length; i++) play(i);
  }

  toggle && toggle.addEventListener('click', () => {
    playing = !playing;
    toggle.textContent = playing ? 'Pause' : 'Play';
    toggle.setAttribute('aria-pressed', String(!playing));
    if (playing) { if (i >= GAME.length) { reset(); i = 0; } resume(); } else stop();
  });
  if (reduce && toggle) { toggle.textContent = 'Play'; toggle.setAttribute('aria-pressed', 'true'); }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? resume() : stop(); }, { threshold: .15 }).observe(el);
  }
  document.addEventListener('visibilitychange', () => document.hidden ? stop() : resume());
  resume();
})();
