/* =========================================================
   Portfolio interactions & animations
   GSAP + ScrollTrigger + Lenis (self-hosted in /static/vendor)
   Everything degrades gracefully without JS or with reduced motion.
   ========================================================= */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGsap = !!(window.gsap && window.ScrollTrigger);
  const animate = hasGsap && !reduce;
  if (!animate) root.classList.add('no-anim');

  /* ---------- Toast ---------- */
  const toast = $('#toast'); let toastT;
  const say = m => { if (!toast) return; toast.textContent = m; toast.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => toast.classList.remove('show'), 2600); };

  /* ---------- Smooth scroll (Lenis) ---------- */
  let lenis = null;
  if (animate && window.Lenis) {
    lenis = new Lenis({ duration: 1.15, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  const scrollToTarget = target => {
    if (lenis) lenis.scrollTo(target, { offset: -70, duration: 1.4 });
    else (typeof target === 'number' ? scrollTo({ top: target, behavior: reduce ? 'auto' : 'smooth' }) : target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }));
  };
  $$('a[href*="#"]').forEach(a => a.addEventListener('click', e => {
    const url = new URL(a.href, location.href);
    if (url.pathname !== location.pathname || !url.hash) return;
    const id = url.hash;
    if (id.length < 2) return;
    const t = id === '#top' ? 0 : $(id);
    if (t === null) return;
    e.preventDefault(); setMenu(false); scrollToTarget(t);
    history.replaceState(null, '', id);
  }));

  /* ---------- Menu ---------- */
  const menuBtn = $('#menuBtn');
  function setMenu(open) {
    root.classList.toggle('menu-open', open);
    menuBtn && menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn && menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if (lenis) open ? lenis.stop() : lenis.start();
    else document.body.style.overflow = open ? 'hidden' : '';
  }
  menuBtn && menuBtn.addEventListener('click', () => setMenu(!root.classList.contains('menu-open')));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  /* ---------- Nav: glass on scroll, hide on scroll down ---------- */
  const nav = $('#nav'); let lastY = scrollY;
  const onScroll = () => {
    const y = scrollY;
    nav.classList.toggle('scrolled', y > 10);
    if (!root.classList.contains('menu-open')) nav.classList.toggle('hide', y > 500 && y > lastY + 2);
    if (y < lastY - 2) nav.classList.remove('hide');
    lastY = y;
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- Nav: sliding pill + active section ---------- */
  const links = $$('#links a'), pill = $('#linksPill');
  let activeLink = null;
  const movePill = a => {
    if (!pill) return;
    if (!a) { pill.style.opacity = 0; return; }
    pill.style.opacity = 1; pill.style.width = a.offsetWidth + 'px'; pill.style.transform = `translateX(${a.offsetLeft}px)`;
  };
  links.forEach(a => { a.addEventListener('mouseenter', () => movePill(a)); });
  $('#links') && $('#links').addEventListener('mouseleave', () => movePill(activeLink));
  if ('IntersectionObserver' in window) {
    const so = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      activeLink = links.find(a => a.getAttribute('href') === '#' + e.target.id) || null;
      links.forEach(a => a.classList.toggle('on', a === activeLink));
      movePill(activeLink);
    }), { rootMargin: '-45% 0px -50% 0px' });
    $$('main section[id]').forEach(s => so.observe(s));
  }

  /* ---------- Easter egg ---------- */
  let clicks = 0, clickT;
  $('#brand') && $('#brand').addEventListener('click', () => { clicks++; clearTimeout(clickT); clickT = setTimeout(() => clicks = 0, 600); if (clicks >= 3) { clicks = 0; say('Secret move unlocked: en passant ♟'); } });

  /* ---------- Count up ---------- */
  const countUp = (el, dur = 1600) => {
    const v = Number(el.dataset.count) || 0;
    if (!animate) { el.textContent = v; return; }
    const t0 = performance.now();
    const step = t => { const k = Math.min((t - t0) / dur, 1); el.textContent = Math.round(v * (1 - Math.pow(1 - k, 4))); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  };

  /* ---------- Contact form (AJAX, falls back to normal POST) ---------- */
  const form = $('#contactForm');
  if (form && window.fetch) {
    const note = $('#formNote');
    form.addEventListener('submit', async e => {
      e.preventDefault();
      $$('.err', form).forEach(x => x.textContent = '');
      $$('.invalid', form).forEach(x => x.classList.remove('invalid'));
      note.textContent = 'Sending…';
      const submit = $('[type=submit]', form); submit.disabled = true;
      try {
        const res = await fetch(form.action, {
          method: 'POST', body: new FormData(form),
          headers: { 'X-Requested-With': 'XMLHttpRequest', 'X-CSRFToken': $('[name=csrfmiddlewaretoken]', form).value }
        });
        const data = await res.json();
        if (data.ok) {
          note.textContent = '';
          form.classList.add('done'); form.reset();
          setTimeout(() => form.classList.remove('done'), 4500);
        } else {
          note.textContent = 'Check the highlighted fields and send again.';
          Object.entries(data.errors || {}).forEach(([f, errs]) => {
            const input = $(`[name="${f}"]`, form), slot = $(`.err[data-for="${f}"]`, form);
            input && input.classList.add('invalid'); if (slot) slot.textContent = errs.join(' ');
          });
        }
      } catch (err) {
        note.textContent = "The message didn't send. Check your connection and try again.";
      } finally { submit.disabled = false; }
    });
  }

  /* ---------- Manifesto words (split always, so the fallback can light them) ---------- */
  const mf = $('#mf');
  let words = [];
  if (mf) {
    const text = mf.textContent.trim();
    mf.setAttribute('aria-label', text);
    mf.innerHTML = text.split(/\s+/).map(w => `<span class="w" aria-hidden="true">${w}</span>`).join(' ');
    words = $$('.w', mf);
  }

  /* ---------- Mobile project gallery progress (native swipe) ---------- */
  const track = $('#projTrack'), projBar = $('#projBar');
  const nativeProgress = () => {
    if (!track || !projBar) return;
    const max = track.scrollWidth - track.clientWidth;
    projBar.style.transform = `scaleX(${max > 0 ? track.scrollLeft / max : 1})`;
  };
  track && track.addEventListener('scroll', nativeProgress, { passive: true });

  /* ---------- Copy link ---------- */
  $$('[data-copy]').forEach(b => b.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(b.dataset.copy); say('Link copied'); } catch (e) { say('Copy failed — copy the address bar instead'); }
  }));

  /* ---------- Reading progress (blog posts) ---------- */
  const readBar = $('#readBar'), prose = $('#prose');
  if (readBar && prose) {
    const upd = () => {
      const r = prose.getBoundingClientRect();
      const k = Math.min(1, Math.max(0, (innerHeight * .3 - r.top) / (r.height - innerHeight * .4)));
      readBar.style.transform = `scaleX(${k})`;
    };
    addEventListener('scroll', upd, { passive: true }); upd();
  }

  /* ---------- Journey filters ---------- */
  const tlItems = $$('.tl-item');
  $$('.filters [data-filter]').forEach(btn => btn.addEventListener('click', () => {
    const f = btn.dataset.filter;
    $$('.filters [data-filter]').forEach(b => { b.classList.toggle('on', b === btn); b.setAttribute('aria-selected', String(b === btn)); });
    tlItems.forEach(li => li.classList.toggle('hidden', f !== 'all' && li.dataset.kind !== f));
    if (window.gsap && !reduce) {
      const shown = tlItems.filter(li => !li.classList.contains('hidden')).map(li => $('.tl-card', li));
      gsap.fromTo(shown, { opacity: 0, y: 24 }, { opacity: 1, y: 0, stagger: .06, duration: .7, ease: 'expo.out', overwrite: 'auto' });
    }
    window.ScrollTrigger && ScrollTrigger.refresh();
  }));

  /* ---------- No-animation fallback ---------- */
  const ringBar = $('.ring-bar'), ring = $('.ring');
  const C = 2 * Math.PI * 128;
  if (!animate) {
    words.forEach(w => w.classList.add('lit'));
    $$('[data-count]').forEach(el => el.textContent = el.dataset.count);
    if (ring && ringBar) ringBar.style.strokeDashoffset = C * (1 - (Number(ring.dataset.progress) || 0) / 100);
    nativeProgress();
    return;
  }

  /* =========================================================
     GSAP animations
     ========================================================= */
  gsap.registerPlugin(ScrollTrigger);
  gsap.defaults({ ease: 'expo.out', duration: 1.1 });

  /* --- helpers --- */
  function splitChars(el) {
    const text = el.textContent.trim();
    el.setAttribute('aria-label', text);
    el.innerHTML = text.split(' ').map(w =>
      `<span class="wd" aria-hidden="true">${[...w].map(c => `<span class="ch">${c}</span>`).join('')}</span>`
    ).join(' ');
    return $$('.ch', el);
  }
  function splitWords(el) {
    const text = el.textContent.trim();
    el.setAttribute('aria-label', text);
    el.innerHTML = text.split(/\s+/).map(w => `<span class="ln" aria-hidden="true"><span>${w}</span></span>`).join(' ');
    return $$('.ln > span', el);
  }

  /* --- Hero intro (home page only) --- */
  const heroName = $('#heroName');
  if (heroName) {
  const chars = heroName ? splitChars(heroName) : [];
  const floats = $$('.float-pc');
  const boardCard = $('#boardCard');
  gsap.set('[data-hero]', { opacity: 0, y: 30, filter: 'blur(10px)' });
  gsap.set(chars, { yPercent: 110, rotateX: -70, opacity: 0, transformPerspective: 600, transformOrigin: '50% 100%' });
  gsap.set(boardCard, { y: 120, rotateX: 28, scale: .88, opacity: 0, transformPerspective: 1400 });
  gsap.set(floats, { scale: 0, rotate: -40, opacity: 0 });

  const intro = gsap.timeline({ delay: .15 });
  intro.to('.status', { opacity: 1, y: 0, filter: 'blur(0px)', duration: .9 })
       .to(chars, { yPercent: 0, rotateX: 0, opacity: 1, stagger: .035, duration: 1.3 }, .1)
       .to('[data-hero]:not(.status)', { opacity: 1, y: 0, filter: 'blur(0px)', stagger: .09 }, .55)
       .to(boardCard, { y: 0, rotateX: 0, scale: 1, opacity: 1, duration: 1.8 }, .35)
       .to(floats, { scale: 1, rotate: 0, opacity: 1, stagger: .12, duration: 1.2, ease: 'back.out(1.7)' }, 1);

  floats.forEach((f, i) => {
    gsap.to(f.querySelector('.pc'), { y: -14 - i * 4, rotate: i % 2 ? 5 : -5, duration: 2.8 + i * .6, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  });

  // Hero scroll-out
  gsap.to('#heroCopy', { y: -140, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('#heroBoard', { y: -70, scale: .9, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.aurora', { yPercent: 30, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  // Hero mouse: board tilts, pieces drift
  if (finePointer) {
    const hero = $('.hero');
    const tiltX = gsap.quickTo(boardCard, 'rotateY', { duration: 1, ease: 'power3.out' });
    const tiltY = gsap.quickTo(boardCard, 'rotateX', { duration: 1, ease: 'power3.out' });
    const fx = floats.map(f => [gsap.quickTo(f, 'x', { duration: 1.4, ease: 'power3.out' }), gsap.quickTo(f, 'y', { duration: 1.4, ease: 'power3.out' }), Number(f.dataset.depth) || 1]);
    hero.addEventListener('mousemove', e => {
      const dx = e.clientX / innerWidth - .5, dy = e.clientY / innerHeight - .5;
      tiltX(dx * 12); tiltY(-dy * 10);
      fx.forEach(([x, y, d]) => { x(dx * 50 * d); y(dy * 40 * d); });
    });
    hero.addEventListener('mouseleave', () => { tiltX(0); tiltY(0); fx.forEach(([x, y]) => { x(0); y(0); }); });
  }
  } // end hero

  /* --- Section titles: words rise from a mask --- */
  $$('.title-anim').forEach(el => {
    const w = splitWords(el);
    gsap.from(w, { yPercent: 115, rotate: 4, duration: 1.2, stagger: .07, scrollTrigger: { trigger: el, start: 'top 88%' } });
  });

  /* --- Generic reveal --- */
  gsap.set('.rv', { opacity: 0, y: 60, scale: .97 });
  ScrollTrigger.batch('.rv', {
    start: 'top 90%', once: true,
    onEnter: batch => gsap.to(batch, { opacity: 1, y: 0, scale: 1, stagger: .08, duration: 1.2, overwrite: 'auto' })
  });

  /* --- Manifesto: words light up with scroll --- */
  if (words.length) {
    ScrollTrigger.create({
      trigger: '.manifesto', start: 'top top', end: 'bottom bottom', scrub: true,
      onUpdate: self => {
        const lit = Math.round(self.progress * words.length * 1.1);
        words.forEach((w, i) => w.classList.toggle('lit', i < lit));
      }
    });
    gsap.from('.mf-text', { scale: .92, opacity: .4, ease: 'none', scrollTrigger: { trigger: '.manifesto', start: 'top bottom', end: 'top top', scrub: true } });
  }

  /* --- Stats --- */
  $$('.stat [data-count]').forEach(el => ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: () => countUp(el) }));

  /* --- Parallax images --- */
  $$('[data-parallax]').forEach(img => {
    gsap.fromTo(img, { yPercent: -10 }, { yPercent: 2, ease: 'none', scrollTrigger: { trigger: img.closest('.tile') || img, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  /* --- Journey: line draws as you scroll, dots pop in --- */
  if ($('#tlFill')) {
    gsap.to('#tlFill', { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '.timeline-wrap', start: 'top 70%', end: 'bottom 70%', scrub: true } });
    $$('.tl-dot').forEach(d => gsap.from(d, { scale: 0, rotate: -90, duration: 1, ease: 'back.out(2)', scrollTrigger: { trigger: d, start: 'top 85%' } }));
  }

  /* --- Business cards: stack and recede --- */
  const cards = $$('.scard');
  cards.forEach((card, i) => {
    const pc = $('.scard-pc', card);
    const amp = innerWidth <= 900 ? .3 : 1;
    if (pc) gsap.fromTo(pc, { y: 60 * amp, rotate: -12, scale: .9 }, { y: -20 * amp, rotate: 6, scale: 1, ease: 'none', scrollTrigger: { trigger: card, start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.from(card, { y: 120, opacity: 0, duration: 1.3, scrollTrigger: { trigger: card, start: 'top 95%' } });
    const next = cards[i + 1];
    if (!next) return;
    gsap.to(card, {
      scale: .92, ease: 'none',
      scrollTrigger: { trigger: next, start: 'top bottom', end: 'top 25%', scrub: true }
    });
  });

  /* --- Projects: horizontal scroll on large screens --- */
  const mm = gsap.matchMedia();
  const projects = $('#projects');
  if (projects && track) {
    mm.add('(min-width: 901px)', () => {
      projects.classList.add('hscroll');
      const dist = () => Math.max(0, track.scrollWidth - innerWidth);
      const tween = gsap.to(track, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: {
          trigger: projects, start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1,
          onUpdate: self => { if (projBar) projBar.style.transform = `scaleX(${self.progress})`; }
        }
      });
      $$('.proj', track).forEach(card => {
        const media = $('.proj-media img, .proj-ph .pc', card);
        if (media) gsap.fromTo(media, { xPercent: 6 }, { xPercent: -6, ease: 'none', scrollTrigger: { trigger: card, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } });
      });
      return () => { projects.classList.remove('hscroll'); gsap.set(track, { clearProps: 'transform' }); };
    });
    mm.add('(max-width: 900px)', () => {
      nativeProgress();
      gsap.from($$('.proj', track), { x: 80, opacity: 0, stagger: .1, duration: 1.2, scrollTrigger: { trigger: track, start: 'top 85%' } });
    });
  }

  /* --- Impact: photo expands to full screen --- */
  const frame = $('#impactFrame');
  if (frame) {
    const small = innerWidth <= 900;
    const tl = gsap.timeline({ scrollTrigger: { trigger: '.impact', start: 'top top', end: 'bottom bottom', scrub: true } });
    tl.fromTo(frame, { clipPath: small ? 'inset(10% 6% 10% 6% round 28px)' : 'inset(14% 18% 14% 18% round 40px)' },
                     { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none', duration: 1 }, 0)
      .to('#impactFrame img', { scale: 1, ease: 'none', duration: 1 }, 0)
      .to('#impactShade', { opacity: 1, ease: 'none', duration: .35 }, .75)
      .fromTo('#impactTitle', { opacity: 0, y: 60 }, { opacity: 1, y: 0, ease: 'power2.out', duration: .45 }, .95)
      .to({}, { duration: .5 });
  }

  /* --- EV ring charges up --- */
  if (ring && ringBar) {
    const p = Math.min(100, Number(ring.dataset.progress) || 0);
    gsap.set(ringBar, { strokeDasharray: C, strokeDashoffset: C });
    ScrollTrigger.create({
      trigger: ring, start: 'top 80%', once: true,
      onEnter: () => {
        gsap.to(ringBar, { strokeDashoffset: C * (1 - p / 100), duration: 2.2, ease: 'power3.out' });
        const num = $('[data-count]', ring); num && countUp(num, 2200);
        gsap.fromTo('.ring-pc', { y: 20, scale: .7 }, { y: 0, scale: 1, duration: 1.4, ease: 'back.out(2)' });
      }
    });
    gsap.to('.ring-pc', { y: -8, duration: 2.4, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 2 });
  }

  /* --- Pointer effects: 3D tilt, spotlight, magnetic buttons --- */
  if (finePointer) {
    $$('.tilt').forEach(el => {
      const rx = gsap.quickTo(el, 'rotateX', { duration: .6, ease: 'power3.out' });
      const ry = gsap.quickTo(el, 'rotateY', { duration: .6, ease: 'power3.out' });
      gsap.set(el, { transformPerspective: 1000 });
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
        rx(-py * 7); ry(px * 7);
        el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
      el.addEventListener('pointerleave', () => { rx(0); ry(0); });
    });
    $$('.magnetic').forEach(btn => {
      const mx = gsap.quickTo(btn, 'x', { duration: .5, ease: 'power3.out' });
      const my = gsap.quickTo(btn, 'y', { duration: .5, ease: 'power3.out' });
      btn.addEventListener('pointermove', e => {
        const r = btn.getBoundingClientRect();
        mx((e.clientX - r.left - r.width / 2) * .3); my((e.clientY - r.top - r.height / 2) * .4);
      });
      btn.addEventListener('pointerleave', () => { gsap.to(btn, { x: 0, y: 0, duration: .9, ease: 'elastic.out(1, .35)' }); });
    });
  }

  /* --- Footer pieces wave in --- */
  gsap.from('.foot-pieces .pc', { y: 60, opacity: 0, rotate: -20, stagger: .06, duration: 1.2, ease: 'back.out(1.6)', scrollTrigger: { trigger: '.footer', start: 'top 85%' } });

  /* --- Keep measurements right --- */
  const refresh = () => ScrollTrigger.refresh();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
  addEventListener('load', refresh);
  $$('img').forEach(img => { if (!img.complete) img.addEventListener('load', () => ScrollTrigger.refresh(), { once: true }); });
})();
