/* Paño: body and engine.
   Lifted out of the portfolio homepage in Phase 1 (see PANO-PLAN.md).

   How a page uses him:
     1. <link rel="stylesheet" href="/Pano/latest/pano.css"> in the head.
     2. <script src="/Pano/latest/pano.js"></script> in the body, at the spot where his
        elements should sit. Loading this file puts his markup there, hidden, and loads his
        skills from skills/ next to this file.
     3. const pano = Pano.init({ ... }) once the page's own script has set itself up.
        The object passed in (the "adapter") tells him what this page has. See init() below.

   This file is his body and engine: drawing, walking, the speech bubble, the highlight ring,
   the tour runner, his menu, head mode, idle timing and dragging. Two things live elsewhere:

   What he says. His lines, his tours and his menu come from his brain: brain/<site>.json next
   to this file (see brain/README.md). The adapter names the brain to load. He stays hidden
   until it has arrived; if it never does, the page carries on without him.

   What he can do. Each ability is a skill: one file in skills/ (see skills/README.md). A skill
   declares what it needs from the page, as names of adapter entries. If the adapter has them,
   the skill is on and adds itself to his menu. If not, he simply does not offer it. */
(() => {
  const MARKUP = `<button class="gcat" id="gcat" hidden><span class="gbody"><svg viewBox="0 0 100 120" aria-hidden="true">
  <defs>
    <clipPath id="gEyeL" clipPathUnits="userSpaceOnUse"><ellipse cx="-6" cy="0" rx="3.1" ry="4.1"/></clipPath>
    <clipPath id="gEyeR" clipPathUnits="userSpaceOnUse"><ellipse cx="6" cy="0" rx="3.1" ry="4.1"/></clipPath>
  </defs>
  <g class="gtail"><path d="M46 111 C 16 113, 4 88, 12 64 C 17 50, 30 48, 28 60" fill="none" stroke="#ff4d4f" stroke-width="10" stroke-linecap="round"/></g>
  <path class="gtorso" d="M29 50 C 18 70, 16 96, 20 114 L60 114 C 64 96, 62 70, 51 50 Z" fill="#ff4d4f"/>
  <path class="gleg" d="M34 86 C 33 98, 33 106, 34 113" fill="none" stroke="#c93436" stroke-width="2" stroke-linecap="round"/>
  <g class="ghead"><g transform="translate(41 38) rotate(6)">
    <path d="M-16 -29 L-7 -15 Q 0 -17.5 7 -15 L16 -29 L17 -6 C 18 4, 12 13, 0 15 C -12 13, -18 4, -17 -6 Z" fill="#ff4d4f"/>
    <g class="geyes"><ellipse cx="-6" cy="0" rx="2.8" ry="3.8" fill="#07100b"/><ellipse cx="6" cy="0" rx="2.8" ry="3.8" fill="#07100b"/></g>
    <g clip-path="url(#gEyeL)"><g class="glid"><rect x="-10" y="-12" width="8" height="12" fill="#ff4d4f"/><path d="M-10 0 H-2" stroke="#07100b" stroke-width="1.3"/></g></g>
    <g clip-path="url(#gEyeR)"><g class="glid"><rect x="2" y="-12" width="8" height="12" fill="#ff4d4f"/><path d="M2 0 H10" stroke="#07100b" stroke-width="1.3"/></g></g>
    <path class="gwhisk" d="M-15 6 L-31 3 M-14.5 9.5 L-31 11.5 M15 6 L31 3 M14.5 9.5 L31 11.5" stroke="#ff4d4f" stroke-width="1.6" stroke-linecap="round"/>
    <g class="gwavy"><path class="wl" d="M-15 6 q-2.67 -2.4 -5.33 -1 t-5.33 -1 t-5.34 -1"/><path class="wl" d="M-14.5 9.5 q-2.75 -1.8 -5.5 .67 t-5.5 .67 t-5.5 .66"/><path class="wr" d="M15 6 q2.67 -2.4 5.33 -1 t5.33 -1 t5.34 -1"/><path class="wr" d="M14.5 9.5 q2.75 -1.8 5.5 .67 t5.5 .67 t5.5 .66"/></g>
    <g class="gmouth"><ellipse cx="0" cy="8.5" rx="6" ry="4.6" fill="#3a0608"/><ellipse cx="0" cy="10.6" rx="3.4" ry="1.8" fill="#ff8a8c"/></g>
    <path class="gflat" d="M-3 9.5 H3" stroke="#3a0608" stroke-width="1.4" stroke-linecap="round"/>
    <ellipse class="gtongue" cx="0" cy="10.5" rx="2.2" ry="3" fill="#ff8a8c"/>
  </g></g>
  <g class="gpaw"><g class="gpp">
    <path d="M31 80 C 27 70, 28 62, 32 56" fill="none" stroke="#b92c2e" stroke-width="10" stroke-linecap="round"/>
    <path d="M31 80 C 27 70, 28 62, 32 56" fill="none" stroke="#ff4d4f" stroke-width="7.4" stroke-linecap="round"/>
    <ellipse cx="32.5" cy="53.5" rx="5.2" ry="4.2" fill="#ff4d4f" stroke="#b92c2e" stroke-width="1.3"/>
    <path d="M30.6 50.6 v1.6 M32.6 50 v1.8 M34.6 50.6 v1.6" stroke="#b92c2e" stroke-width=".9" stroke-linecap="round"/>
  </g></g>
</svg></span></button>
<div class="gbubble" id="gbubble" hidden role="dialog">
  <button class="gx" id="gx"><svg viewBox="0 0 10 10" aria-hidden="true"><path d="M1.5 1.5l7 7M8.5 1.5l-7 7" stroke="#8fa898" stroke-width="1.8" stroke-linecap="round"/></svg></button>
  <p class="gsay" id="gsay" aria-live="polite"></p>
  <div class="gacts" id="gacts"></div>
</div>
<div class="gring" id="gring" hidden></div>`;

  // put his elements into the page where this script tag sits (or at the end of the body)
  const me = document.currentScript;
  const HOME = me && me.src ? new URL('.', me.src).href : '';   // the folder this file was loaded from
  let mounted = false;
  function mount() {
    if (mounted || document.getElementById('gcat')) { mounted = true; return; }
    if (me && me.parentNode && document.body && document.body.contains(me)) me.insertAdjacentHTML('beforebegin', MARKUP);
    else if (document.body) document.body.insertAdjacentHTML('beforeend', MARKUP);
    else return;
    mounted = true;
  }
  mount();

  /* ---------- skills ---------- */
  // His skills, in the order they appear in his menu. Each is skills/<name>.js and calls Pano.skill().
  const SKILLS = ['tours', 'background', 'windows', 'bin'];
  const REG = {}, loading = [];
  // skill(name, { needs: [adapter entries], start(p, host) }): start() returns what the skill offers. See skills/README.md.
  function skill(name, def) { REG[name] = def; }
  // Load them. While the page is still being read they are written in right after this file, so they
  // are ready before the page's own script calls init() (a saved background shows with no flash).
  // If this file was added to a finished page, they are fetched and he waits for them.
  if (HOME && me && !me.async && !me.defer && document.readyState === 'loading') {
    document.write(SKILLS.map(n => `<script src="${HOME}skills/${n}.js"><\/script>`).join(''));
  } else if (HOME) {
    for (const n of SKILLS) loading.push(new Promise(done => {
      const sc = document.createElement('script');
      sc.src = HOME + 'skills/' + n + '.js'; sc.onload = sc.onerror = done;
      document.head.appendChild(sc);
    }));
  }

  /* init(host): start Paño on this page. host is the adapter. Everything is optional unless marked.
     About the page in general:
       brain                   (needed) which brain to load: a site name ('portfolio' loads
                               brain/portfolio.json from beside this file) or the address of a brain file
       ga(name, params)        report an analytics event
       canGreet()              false when he should not say hello on arrival
       toast, hideToast()      a page notification he must never cover
       closeOverlayAt(el)      close a page menu or popup that el belongs to; resolves true if it did
       windowOf(el), paneOf(el), scrollInPane(el, toStart, smooth)
     What the page has for his skills. Leave an entry out and he does not offer that skill:
       tours                   readers for tour steps about this page (skills/tours.js)
       background              { desk, walls, modes, keys } (skills/background.js)
       windows                 { WINS, topWin, focusW, keepOnScreen, rectDelta, closeW, minimizeW } (skills/windows.js)
       bin                     { icon() } (skills/bin.js)
     Returns what the page may call: notice(what), busy(), rest(), menu(text), skills(). */
  function init(host) {
    host = host || {};
    mount();
    const $ = (s, r = document) => r.querySelector(s);
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const narrow = () => innerWidth <= 640;
    const ga = host.ga || (() => {});

    /* ---------- spring easing via CSS linear() ---------- */
    const linearOK = CSS.supports('animation-timing-function', 'linear(0, 1)');
    function spring(stiffness, damping, mass = 1) {
      if (!linearOK) return { easing: 'cubic-bezier(.2,1.25,.35,1)', duration: 520 };
      let x = 0, v = 0, t = 0, next = 1 / 60;
      const dt = 1 / 600, pts = [0];
      while (t < 3) {
        const a = (-stiffness * (x - 1) - damping * v) / mass;
        v += a * dt; x += v * dt; t += dt;
        if (t >= next) { pts.push(x); next += 1 / 60; if (Math.abs(x - 1) < 0.001 && Math.abs(v) < 0.01) break; }
      }
      pts[pts.length - 1] = 1;
      return { easing: `linear(${pts.map(p => +p.toFixed(4)).join(',')})`, duration: Math.round(pts.length * 1000 / 60) };
    }
    const SPRING_WIN = spring(210, 19), SPRING_MENU = spring(260, 24);
    const EASE_OUT = 'cubic-bezier(.16,1,.3,1)';
    const anim = (el, k, o) => reduce ? { finished: Promise.resolve() } : el.animate(k, o);

    /* ---------- what the page handed over ---------- */
    const canGreet = host.canGreet || (() => true);
    const toast = host.toast || null, hideToast = host.hideToast || (() => {});
    const closeOverlayAt = host.closeOverlayAt || (async () => false);
    const windowOf = host.windowOf || (() => null);
    const paneOf = host.paneOf || (() => null);
    const scrollInPane = host.scrollInPane || ((el, toStart) => el.scrollIntoView({ block: toStart ? 'start' : 'nearest' }));
    const WM = host.windows || {};
    const WINS = WM.WINS || new Map();
    const minimizeW = WM.minimizeW || (async () => {});   // on a tour, windows covering what he points at are minimized

    const gcat = $('#gcat'), gbodyEl = $('.gbody', gcat), gsvg = $('svg', gcat), gbub = $('#gbubble'), gsay = $('#gsay'), gacts = $('#gacts'), gring = $('#gring');
    const CAT_W = () => narrow() ? 54 : 76, CAT_H = () => narrow() ? 65 : 92;
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    let catPos = { x: 0, y: 0 }, tour = null, stepToken = 0, ringTarget = null, ringRAF = 0, msgSeq = 0, idleT = 0;

    const dockSpot = () => ({ x: innerWidth - CAT_W() - 16, y: innerHeight - 52 - CAT_H() - 12 });
    // first visit: tucked into the bottom-right corner, just above the taskbar
    const cornerSpot = () => ({ x: innerWidth - CAT_W() - (narrow() ? 8 : 14), y: innerHeight - (narrow() ? 52 : 44) - CAT_H() - 6 });
    const clampSpot = (p, w, h) => ({ x: Math.min(innerWidth - w, Math.max(0, p.x)), y: Math.min(innerHeight - h, Math.max(0, p.y)) });
    // head mode: just his head, parked at the top middle (or wherever the user dragged it)
    const HEAD_W = () => narrow() ? 120 : 144, HEAD_H = () => narrow() ? 90 : 108;
    const FULL_VB = '0 0 100 120', HEAD_VB = '5 3 72 54';
    let headMode = false, headHome = false, headMoved = false;
    try { sessionStorage.removeItem('panoHeadPos'); } catch (e) {}
    // his head's home is always the top middle of the screen
    const headSpot = () => clampSpot({ x: innerWidth / 2 - HEAD_W() / 2, y: 6 }, HEAD_W(), HEAD_H());
    // where he stands to talk: on phones inside the docked bubble; once he's lived at the top, just under his head spot
    function homeSpot() {
      if (narrow()) return dockSpot();
      if (headHome) { const h = headSpot(); return clampSpot({ x: h.x + HEAD_W() / 2 - CAT_W() / 2, y: Math.max(8, h.y) }, CAT_W(), CAT_H() + 48); }
      return cornerSpot();
    }
    function setCat(p, flip) {
      catPos = p; gcat.style.transform = `translate(${Math.round(p.x)}px, ${Math.round(p.y)}px)`;
      if (flip != null) gsvg.classList.toggle('flip', flip);
    }
    async function moveCat(p, flipAtEnd) {
      catTopDocked = false;
      clearTimeout(idleT);   // he's on the move; whatever he does next restarts the countdown
      if (headMode) exitHead();
      gcat.getAnimations().forEach(a => a.cancel());
      const from = catPos, dx = p.x - from.x, dy = p.y - from.y, dist = Math.hypot(dx, dy);
      if (reduce || dist < 6) { setCat(p, flipAtEnd); return; }
      if (Math.abs(dx) > 4) gsvg.classList.toggle('flip', dx < 0);
      const hops = Math.max(1, Math.round(dist / 160)), dur = Math.min(1100, 340 + dist * .7), lift = Math.min(36, 14 + dist / hops / 8);
      const frames = [];
      for (let i = 0; i <= hops * 2; i++) {
        const t = i / (hops * 2);
        frames.push({ transform: `translate(${from.x + dx * t}px, ${from.y + dy * t - (i % 2 ? lift : 0)}px)` });
      }
      gcat.classList.add('walking');
      try { await gcat.animate(frames, { duration: dur, easing: 'ease-in-out' }).finished; } catch (e) { return; }
      gcat.classList.remove('walking');
      setCat(p, flipAtEnd);
      gbodyEl.animate([{ transform: 'scale(1.1,.86)' }, { transform: 'none' }], { duration: 300, easing: EASE_OUT });
    }
    function cheer() {
      if (reduce) return;
      gbodyEl.animate([{ transform: 'none' }, { transform: 'translateY(-22px) rotate(-6deg)', offset: .4 }, { transform: 'scale(1.08,.9)', offset: .8 }, { transform: 'none' }], { duration: 520, easing: 'ease-out' });
    }
    function talk() { gcat.classList.remove('talk'); void gcat.offsetWidth; gcat.classList.add('talk'); }

    function visibleRect(el) {
      const r = el.getBoundingClientRect();
      let L = r.left, T = r.top, R = r.right, B = r.bottom;
      for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
        const cs = getComputedStyle(p);
        if (/(auto|scroll|hidden|clip)/.test(cs.overflowX + cs.overflowY)) {
          const q = p.getBoundingClientRect();
          L = Math.max(L, q.left); T = Math.max(T, q.top); R = Math.min(R, q.right); B = Math.min(B, q.bottom);
        }
      }
      const bar = narrow() ? 52 : 44;
      L = Math.max(L, 0); T = Math.max(T, 0); R = Math.min(R, innerWidth); B = Math.min(B, innerHeight - bar);
      return R - L > 2 && B - T > 2 ? { left: L, top: T, right: R, bottom: B, width: R - L, height: B - T } : null;
    }
    const overlapArea = (a, b) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
    // on phones the bubble docks at the bottom; if that would hide what the cat is pointing at, dock it at the top
    let catTopDocked = false;
    function placeBubbleNarrow() {
      const t = ringTarget && ringTarget.isConnected ? visibleRect(ringTarget) : null;
      gbub.classList.remove('gtop');
      let top = false;
      if (t) {
        const atBottom = overlapArea(t, gbub.getBoundingClientRect());
        if (atBottom > 0) {
          gbub.classList.add('gtop');
          top = overlapArea(t, gbub.getBoundingClientRect()) < atBottom;
          if (!top) gbub.classList.remove('gtop');
        }
      }
      if (top) {
        const b = gbub.getBoundingClientRect();
        setCat({ x: innerWidth - CAT_W() - 16, y: b.bottom - CAT_H() - 10 }); catTopDocked = true;
      } else if (catTopDocked) { setCat(dockSpot()); catTopDocked = false; }
    }
    function placeBubble() {
      if (gbub.hidden) return;
      if (narrow()) return placeBubbleNarrow();
      const bw = gbub.offsetWidth, bh = gbub.offsetHeight, cx = catPos.x + CAT_W() / 2;
      const left = Math.min(innerWidth - bw - 8, Math.max(8, cx - bw / 2));
      let top = catPos.y - bh - 14, below = false;
      if (top < 8) { top = catPos.y + CAT_H() + 14; below = true; }
      top = Math.min(top, innerHeight - 52 - bh);
      // if that would cover what the cat is pointing at, sit the bubble beside the cat instead
      const t = ringTarget && ringTarget.isConnected ? ringTarget.getBoundingClientRect() : null;
      const hits = (l, tp) => t && l < t.right && l + bw > t.left && tp < t.bottom && tp + bh > t.top;
      if (hits(left, top)) {
        const sideTop = Math.min(innerHeight - 52 - bh, Math.max(8, catPos.y + CAT_H() / 2 - bh / 2));
        const right = catPos.x + CAT_W() + 10, leftSide = catPos.x - bw - 10;
        const spots = [[right, sideTop], [leftSide, sideTop], [t.right + 12, top], [t.left - bw - 12, top]];
        const pick = spots.find(([l, tp]) => l >= 8 && l + bw <= innerWidth - 8 && !hits(l, tp));
        if (pick) {
          gbub.style.left = pick[0] + 'px'; gbub.style.top = pick[1] + 'px';
          gbub.classList.remove('below'); gbub.classList.add('beside');
          return;
        }
      }
      gbub.classList.remove('beside');
      gbub.style.left = left + 'px'; gbub.style.top = top + 'px';
      gbub.classList.toggle('below', below);
      gbub.style.setProperty('--tx', Math.min(bw - 22, Math.max(22, cx - left)) + 'px');
    }
    function say(html, actions = []) {
      if (headMode) exitHead();
      msgSeq++;
      gsay.innerHTML = html; gacts.innerHTML = '';
      actions.forEach(a => {
        const b = document.createElement('button');
        b.className = 'gbtn' + (a.pri ? ' pri' : '') + (a.quiet ? ' quiet' : '');
        b.textContent = a.label; b.addEventListener('click', a.fn);
        gacts.appendChild(b);
      });
      const was = gbub.hidden;
      gbub.hidden = false;
      placeBubble();
      // the new-message toast never sits on top of him or what he's saying (the message stays in the tray)
      if (toast && !toast.hidden && (narrow() || overlapArea(toast.getBoundingClientRect(), gcat.getBoundingClientRect()) > 0 || overlapArea(toast.getBoundingClientRect(), gbub.getBoundingClientRect()) > 0)) hideToast();
      if (was) anim(gbub, [{ opacity: 0, transform: 'translateY(8px) scale(.96)' }, { opacity: 1, transform: 'none' }], { duration: SPRING_MENU.duration, easing: SPRING_MENU.easing });
      else anim(gsay, [{ opacity: .3 }, { opacity: 1 }], { duration: 220, easing: EASE_OUT });
      talk();
      armIdle();
    }
    const hideBubble = () => { gbub.hidden = true; };

    function ringOn(el) {
      ringTarget = el; gring.hidden = false; cancelAnimationFrame(ringRAF);
      const loop = () => {
        if (!ringTarget || !ringTarget.isConnected) { gring.hidden = true; return; }
        const r = visibleRect(ringTarget) || { left: 0, top: 0, width: 0, height: 0 };
        gring.style.opacity = r.width ? 1 : 0;
        gring.style.left = (r.left - 6) + 'px'; gring.style.top = (r.top - 6) + 'px';
        gring.style.width = (r.width + 12) + 'px'; gring.style.height = (r.height + 12) + 'px';
        ringRAF = requestAnimationFrame(loop);
      };
      loop();
    }
    function ringOff() { ringTarget = null; gring.hidden = true; cancelAnimationFrame(ringRAF); }
    function waitFor(fn, ms = 5000) {
      return new Promise(res => {
        const t0 = performance.now();
        const tick = () => {
          let v = null; try { v = fn(); } catch (e) {}
          if (v) return res(v);
          if (performance.now() - t0 > ms) return res(null);
          requestAnimationFrame(tick);
        };
        tick();
      });
    }
    function bringFront(el) {
      const w = windowOf(el);
      if (w) w.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse' }));
    }
    async function clearView(el) {
      const own = windowOf(el);
      const pane = paneOf(el);
      scrollInPane(el, !!(pane && el.offsetHeight > pane.clientHeight * .8), false);
      for (let round = 0; round < 5; round++) {
        const r = visibleRect(el);
        if (!r) return;
        const covers = new Set();
        for (const [fx, fy] of [[.5, .5], [.15, .2], [.85, .2], [.15, .8], [.85, .8]]) {
          const hit = document.elementFromPoint(r.left + r.width * fx, r.top + r.height * fy);
          if (!hit || el.contains(hit) || hit.closest('#gcat, #gbubble, #gring')) continue;
          if (await closeOverlayAt(hit)) continue;   // a page menu or popup is in the way
          const w = windowOf(hit);
          if (w && w !== own) { const W = [...WINS.values()].find(o => o.el === w); if (W && W.state === 'open') covers.add(W); }
        }
        if (!covers.size) return;
        await Promise.all([...covers].map(W => minimizeW(W)));
        if (own) bringFront(el);
      }
    }
    async function goNear(el) {
      if (headMode) exitHead();
      if (narrow()) { setCat(dockSpot()); return; }
      const r = el.getBoundingClientRect(), W = CAT_W(), H = CAT_H();
      let x = r.right + 12, flip = true;
      if (x + W > innerWidth - 8) { x = r.left - W - 12; flip = false; }
      if (x < 8) { x = innerWidth - W - 16; flip = true; }
      const y = Math.min(innerHeight - 48 - H, Math.max(8, r.top + r.height / 2 - H / 2));
      await moveCat({ x, y }, flip);
    }

    /* ---------- his brain: every line, tour and menu entry comes from JSON ---------- */
    let L = {}, BRAIN = null;
    const fill = (t, vals) => String(t).replace(/\{(\w+)\}/g, (m, k) => k in vals ? vals[k] : m);
    const named = () => `<span class="gname">${L.name}</span>`;
    function useBrain(B) {
      BRAIN = B;
      L = B.lines || {};
      each('brain', B);
      gcat.setAttribute('aria-label', L.labels.cat_button);
      gbub.setAttribute('aria-label', L.name);
      $('#gx').setAttribute('aria-label', L.labels.close);
    }
    const brainURL = !host.brain ? '' : /[\/.]/.test(host.brain) ? new URL(host.brain, location.href).href : HOME + 'brain/' + host.brain + '.json';
    const brainReady = !brainURL ? Promise.resolve(false) : fetch(brainURL)
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(B => { useBrain(B); return true; })
      .catch(e => { console.warn('Paño could not load his brain from ' + brainURL + ', so he is staying hidden.', e); return false; });

    /* ---------- his skills: each one is a file in skills/, used only if this page has what it needs ---------- */
    const live = [], report = [];
    const each = (hook, ...a) => live.forEach(s => s[hook] && s[hook](...a));
    const any = hook => live.some(s => s[hook] && s[hook]());
    const calmCat = () => each('calm');
    function startSkills() {
      for (const name of SKILLS) {
        const def = REG[name];
        if (!def) { report.push({ name, on: false, why: 'its file did not load' }); console.warn('Paño could not load his "' + name + '" skill, so he is going without it.'); continue; }
        const missing = (def.needs || []).filter(k => host[k] == null);
        if (missing.length) { report.push({ name, on: false, why: 'this page has no ' + missing.join(', ') }); continue; }
        const s = def.start(api, host) || {};
        s.name = name; live.push(s); report.push({ name, on: true });
        if (BRAIN && s.brain) s.brain(BRAIN);
      }
    }
    // touch screens get "tap" instead of "click"
    const forTouch = t => (narrow() || matchMedia('(pointer: coarse)').matches)
      ? L.touch.swaps.reduce((out, w) => w.whole_word ? out.replace(new RegExp('\\b' + w.find + '\\b', 'g'), w.say) : out.replace(w.find, w.say), t)
      : t;

    function guideBusy() { return !!tour || !gbub.hidden; }

    async function runTour(key, steps) {
      const token = ++stepToken;
      tour = key; ga('guide_choice', { goal: key });
      for (let i = 0; i < steps.length; i++) {
        const st = steps[i];
        const el = await waitFor(st.target);
        if (token !== stepToken) return;
        if (!el) return guideMenu(L.menu.lost, true);
        bringFront(el);
        ringOff();
        gbub.hidden = true;
        await clearView(el);
        if (token !== stepToken) return;
        await goNear(el);
        if (token !== stepToken) return;
        ringOn(el);
        let iv;
        const outcome = await new Promise(resolve => {
          const acts = [];
          if (st.act) acts.push({ label: st.actLabel || L.tour.do_it, pri: !st.next, fn: () => st.act(el) });
          if (st.next) acts.push({ label: st.next, pri: true, fn: () => resolve('next') });
          acts.push({ label: L.tour.stop, quiet: true, fn: () => resolve('stop') });
          say(`<span class="gstep">${fill(L.tour.step, { n: i + 1, total: steps.length })}</span>${forTouch(st.say)}`, acts);
          iv = setInterval(() => {
            if (token !== stepToken) return resolve('cancel');
            let ok = false; try { ok = st.done && st.done(); } catch (e) {}
            if (ok) resolve('done');
          }, 200);
        });
        clearInterval(iv);
        if (outcome === 'cancel' || token !== stepToken) return;
        if (outcome === 'stop') return guideRest(L.menu.bye);
        ringOff(); cheer();
        await sleep(outcome === 'done' ? 450 : 250);
        if (token !== stepToken) return;
      }
      ga('guide_complete', { goal: key });
      guideMenu(L.menu.after_tour, true);
    }
    async function guideMenu(text, again) {
      const token = ++stepToken;
      calmCat();
      tour = null; ringOff();
      gbub.hidden = true;
      await moveCat(homeSpot(), false);
      if (token !== stepToken) return;
      say(named() + text, [
        ...live.flatMap(s => s.menu ? s.menu() : []),
        { label: again ? L.menu.leave_again : L.menu.leave_first, quiet: true, fn: () => guideRest(L.menu.bye) }
      ]);
    }
    async function guideRest(msg) {
      const token = ++stepToken;
      calmCat();
      tour = null; ringOff();
      gbub.hidden = true;
      await moveCat(homeSpot(), false);
      if (token !== stepToken) return;
      if (!msg) { armIdle(); return; }
      say(msg);
      const mine = msgSeq;
      setTimeout(() => { if (mine === msgSeq) hideBubble(); }, 2600);
    }

    /* ---------- head mode ---------- */
    function enterHead(pop) {
      if (headMode) return;
      headMode = true; headHome = true; headMoved = false;
      calmCat();
      try { sessionStorage.setItem('panoHead', '1'); } catch (e) {}
      ringOff(); gbub.hidden = true;
      gcat.classList.add('head'); gsvg.setAttribute('viewBox', HEAD_VB); gsvg.classList.remove('flip');
      setCat(headSpot());
      if (pop && !reduce) gbodyEl.animate([{ transform: 'scale(.3)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: SPRING_WIN.duration, easing: SPRING_WIN.easing });
    }
    function exitHead() {
      if (!headMode) return;
      const h = catPos; headMode = false;
      gcat.classList.remove('head'); gsvg.setAttribute('viewBox', FULL_VB);
      setCat(clampSpot({ x: h.x + HEAD_W() / 2 - CAT_W() / 2, y: h.y }, CAT_W(), CAT_H()));
    }
    async function goHead() {
      if (headMode) return;
      const token = ++stepToken;
      tour = null; ringOff(); gbub.hidden = true;
      const h = headSpot();
      await moveCat(clampSpot({ x: h.x + HEAD_W() / 2 - CAT_W() / 2, y: Math.max(8, h.y) }, CAT_W(), CAT_H()), false);
      if (token !== stepToken) return;
      enterHead(true);
    }

    /* ---------- after the user has played with him, 10 quiet seconds sends him to his head spot ---------- */
    // How long he waits before tucking away:
    //   4s  when he has nothing to say (chat closed, a short note shown, or he was just dragged)
    //   10s when he's waiting on the user: a tour step, his menu, or a yes/no question
    // He never tucks away while the pointer is on him or his bubble, while he's being dragged, while a skill
    // is keeping him busy (eating windows, changing the background, sulking by the bin),
    // or during a tour while the user is still working in the window he's pointing at.
    const IDLE_QUIET = 4000, IDLE_WAITING = 10000;
    let hasInteracted = false;
    const waitingOnUser = () => !!tour || (!gbub.hidden && gacts.children.length > 0);
    function touchPano() { hasInteracted = true; armIdle(); }
    // is a mouse pointer resting on him or his bubble? (touch has no hover, so it never counts)
    let mouseAt = null;
    document.addEventListener('pointermove', e => { mouseAt = e.pointerType === 'mouse' ? { x: e.clientX, y: e.clientY } : null; }, { capture: true, passive: true });
    document.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') mouseAt = null; }, { capture: true, passive: true });
    function mouseOnPano() {
      if (!mouseAt) return false;
      const inside = el => { const r = el.getBoundingClientRect(); return mouseAt.x >= r.left && mouseAt.x <= r.right && mouseAt.y >= r.top && mouseAt.y <= r.bottom; };
      return inside(gcat) || (!gbub.hidden && inside(gbub));
    }
    function armIdle() {
      clearTimeout(idleT);
      if (!hasInteracted || headMode) return;
      idleT = setTimeout(() => {
        if (headMode) return;
        if (dragging || any('keepsHimHere') || mouseOnPano()) return armIdle();
        goHead();
      }, waitingOnUser() ? IDLE_WAITING : IDLE_QUIET);
    }
    // following a tour counts as activity: clicking, scrolling or typing in the thing he's pointing at
    let lastTourPing = 0;
    function tourActivity(e) {
      if (!tour || headMode || !ringTarget || !(e.target instanceof Node)) return;
      const now = performance.now();
      if (now - lastTourPing < 400) return;
      const win = windowOf(ringTarget);
      if (ringTarget.contains(e.target) || (win && win.contains(e.target)) || gbub.contains(e.target)) { lastTourPing = now; armIdle(); }
    }
    ['pointerdown', 'pointermove', 'wheel', 'keydown', 'scroll'].forEach(t => document.addEventListener(t, tourActivity, { capture: true, passive: true }));
    gbub.addEventListener('pointerleave', () => armIdle());
    gcat.addEventListener('pointerleave', () => armIdle());
    gbub.addEventListener('pointerdown', touchPano);

    /* ---------- drag him anywhere; a tap still opens his menu ---------- */
    let drag = null, dragging = false, suppressClick = false;
    gcat.addEventListener('pointerdown', e => {
      if (any('ignoresDrag') || e.button > 0) return;
      touchPano();
      const r = gcat.getBoundingClientRect();
      drag = { id: e.pointerId, sx: e.clientX, sy: e.clientY, ox: r.left, oy: r.top, moved: false };
      try { gcat.setPointerCapture(e.pointerId); } catch (err) {}
    });
    gcat.addEventListener('pointermove', e => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
      if (!drag.moved && Math.hypot(dx, dy) < 6) return;
      if (!drag.moved) {
        drag.moved = true; dragging = true; catTopDocked = false;
        gcat.getAnimations().forEach(a => a.cancel());
        gcat.classList.add('dragging');
        calmCat();
      }
      const w = headMode ? HEAD_W() : CAT_W(), h = headMode ? HEAD_H() : CAT_H();
      setCat(clampSpot({ x: drag.ox + dx, y: drag.oy + dy }, w, h));
      if (!narrow()) placeBubble();
      each('dragMove');
    });
    function endDrag(e) {
      if (!drag || e.pointerId !== drag.id) return;
      if (drag.moved) {
        suppressClick = true;
        gcat.classList.remove('dragging');
        if (headMode) headMoved = true;   // stays where it's dropped, until the next time he tucks away
        setTimeout(() => { suppressClick = false; }, 0);
        // a skill may take over from here (the Recycle Bin does)
        let after = null;
        for (const sk of live) if (sk.drop && (after = sk.drop())) break;
        if (after) { dragging = false; drag = null; after(); return; }
      }
      dragging = false; drag = null; armIdle();
    }

    gcat.addEventListener('pointerup', endDrag);
    gcat.addEventListener('pointercancel', endDrag);

    gcat.addEventListener('click', () => {
      if (suppressClick || any('ignoresTaps')) return;
      if (headMode) { guideMenu(L.menu.ask); return; }
      if (!gbub.hidden && !tour) guideRest();
      else guideMenu(L.menu.ask);
    });
    $('#gx').addEventListener('click', () => guideRest());
    addEventListener('resize', () => {
      if (gcat.hidden) return;
      if (headMode) setCat(headMoved ? clampSpot(catPos, HEAD_W(), HEAD_H()) : headSpot());
      else if (!tour && !dragging) setCat(gbub.hidden && !hasInteracted ? cornerSpot() : homeSpot());
      placeBubble();
    });

    /* ---------- what a skill is handed (the "p" in skills/*.js) ---------- */
    const api = {
      $, ga, reduce, narrow, sleep, anim, fill, named, forTouch, SPRING_WIN, SPRING_MENU, EASE_OUT,
      get L() { return L; },                                   // his lines, once his brain has arrived
      cat: gcat, body: gbodyEl, bubble: gbub,
      catW: CAT_W, catH: CAT_H, homeSpot, dockSpot, clampSpot,
      say, hideBubble, moveCat, setCat, cheer, ringOff,
      // one thing at a time: take() starts something new, and mine(token) says whether it is still the latest
      take: () => ++stepToken, token: () => stepToken, mine: t => t === stepToken,
      runTour, stopTour() { tour = null; }, onTour: () => !!tour,
      rest: guideRest, menu: guideMenu, calm: calmCat,
      armIdle, stopIdle() { clearTimeout(idleT); },
      dragging: () => dragging,
      ignoringTaps: () => any('ignoresTaps')
    };
    // skills written into the page start now; ones still on their way start when they land
    const skillsReady = loading.length ? Promise.all(loading).then(startSkills) : (startSkills(), Promise.resolve());

    // say hello once per visit; returning in the same session, the cat just sits there
    // (he waits for his brain first: without it he has nothing to say, so he stays hidden)
    setTimeout(async () => {
      await skillsReady;
      if (!(await brainReady)) return;
      gcat.hidden = false;
      let wasHead = false;
      try { wasHead = sessionStorage.getItem('panoHead') === '1'; } catch (e) {}
      if (wasHead) { hasInteracted = true; enterHead(true); return; }
      setCat(cornerSpot(), false);
      anim(gbodyEl, [{ transform: 'translateY(40px) scale(.5)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: SPRING_WIN.duration, easing: SPRING_WIN.easing });
      let seen = false;
      try { seen = sessionStorage.getItem('catGreeted') === '1'; sessionStorage.setItem('catGreeted', '1'); } catch (e) {}
      if (!seen && canGreet()) setTimeout(() => guideMenu(L.hello), 700);
    }, 900);

    return Pano.here = {
      notice: (what, ...more) => each('notice', what, ...more),             // tell him something happened: 'window-opened', 'window-closed'
      skills: () => report.map(r => ({ ...r })),                            // which skills are on here, and why not
      busy: guideBusy,                                                      // on a tour, or his bubble is showing
      rest: guideRest,                                                      // close the bubble and go home
      menu: guideMenu
    };
  }

  // Pano.here is what the latest init() returned, for the page's console and the tests
  window.Pano = { init, skill, skills: SKILLS, here: null, version: 'latest' };
})();
