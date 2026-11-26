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
   to this file for Phill's sites, or any site's own brain file built on base.json, the neutral
   lines beside this file (see brain/README.md). The adapter names the brain to load. He stays
   hidden until it has arrived; if it never does, the page carries on without him.

   How he looks. pano.css draws his bubble and ring; a page can restyle both, and recolor him,
   with --pano-* variables (listed at the top of pano.css).

   What he can do. Each ability is a skill: one file in skills/ (see skills/README.md). A skill
   declares what it needs from the page, as names of adapter entries. If the adapter has them,
   the skill is on and adds itself to his menu. If not, he simply does not offer it. */
(() => {
  const MARKUP = `<button class="gcat" id="gcat" hidden><span class="gbody"><svg viewBox="0 0 100 120" aria-hidden="true">
  <defs>
    <clipPath id="gEyeL" clipPathUnits="userSpaceOnUse"><ellipse cx="-6" cy="0" rx="3.1" ry="4.1"/></clipPath>
    <clipPath id="gEyeR" clipPathUnits="userSpaceOnUse"><ellipse cx="6" cy="0" rx="3.1" ry="4.1"/></clipPath>
  </defs>
  <g class="gtail"><path d="M46 111 C 16 113, 4 88, 12 64 C 17 50, 30 48, 28 60" fill="none" stroke-width="10" stroke-linecap="round" style="stroke:var(--pano-fur,#ff4d4f)"/></g>
  <path class="gtorso" d="M29 50 C 18 70, 16 96, 20 114 L60 114 C 64 96, 62 70, 51 50 Z" style="fill:var(--pano-fur,#ff4d4f)"/>
  <path class="gleg" d="M34 86 C 33 98, 33 106, 34 113" fill="none" stroke-width="2" stroke-linecap="round" style="stroke:var(--pano-leg,#c93436)"/>
  <g class="ghead"><g transform="translate(41 38) rotate(6)">
    <path d="M-16 -29 L-7 -15 Q 0 -17.5 7 -15 L16 -29 L17 -6 C 18 4, 12 13, 0 15 C -12 13, -18 4, -17 -6 Z" style="fill:var(--pano-fur,#ff4d4f)"/>
    <g class="geyes"><ellipse cx="-6" cy="0" rx="2.8" ry="3.8" style="fill:var(--pano-eyes,#07100b)"/><ellipse cx="6" cy="0" rx="2.8" ry="3.8" style="fill:var(--pano-eyes,#07100b)"/></g>
    <g clip-path="url(#gEyeL)"><g class="glid"><rect x="-10" y="-12" width="8" height="12" style="fill:var(--pano-fur,#ff4d4f)"/><path d="M-10 0 H-2" stroke-width="1.3" style="stroke:var(--pano-eyes,#07100b)"/></g></g>
    <g clip-path="url(#gEyeR)"><g class="glid"><rect x="2" y="-12" width="8" height="12" style="fill:var(--pano-fur,#ff4d4f)"/><path d="M2 0 H10" stroke-width="1.3" style="stroke:var(--pano-eyes,#07100b)"/></g></g>
    <path class="gwhisk" d="M-15 6 L-31 3 M-14.5 9.5 L-31 11.5 M15 6 L31 3 M14.5 9.5 L31 11.5" stroke-width="1.6" stroke-linecap="round" style="stroke:var(--pano-fur,#ff4d4f)"/>
    <g class="gwavy"><path class="wl" d="M-15 6 q-2.67 -2.4 -5.33 -1 t-5.33 -1 t-5.34 -1"/><path class="wl" d="M-14.5 9.5 q-2.75 -1.8 -5.5 .67 t-5.5 .67 t-5.5 .66"/><path class="wr" d="M15 6 q2.67 -2.4 5.33 -1 t5.33 -1 t5.34 -1"/><path class="wr" d="M14.5 9.5 q2.75 -1.8 5.5 .67 t5.5 .67 t5.5 .66"/></g>
    <g class="gmouth"><ellipse cx="0" cy="8.5" rx="6" ry="4.6" style="fill:var(--pano-mouth,#3a0608)"/><ellipse cx="0" cy="10.6" rx="3.4" ry="1.8" style="fill:var(--pano-tongue,#ff8a8c)"/></g>
    <path class="gflat" d="M-3 9.5 H3" stroke-width="1.4" stroke-linecap="round" style="stroke:var(--pano-mouth,#3a0608)"/>
    <ellipse class="gtongue" cx="0" cy="10.5" rx="2.2" ry="3" style="fill:var(--pano-tongue,#ff8a8c)"/>
  </g></g>
  <g class="gpaw"><g class="gpp">
    <path d="M31 80 C 27 70, 28 62, 32 56" fill="none" stroke-width="10" stroke-linecap="round" style="stroke:var(--pano-paw,#b92c2e)"/>
    <path d="M31 80 C 27 70, 28 62, 32 56" fill="none" stroke-width="7.4" stroke-linecap="round" style="stroke:var(--pano-fur,#ff4d4f)"/>
    <ellipse cx="32.5" cy="53.5" rx="5.2" ry="4.2" stroke-width="1.3" style="fill:var(--pano-fur,#ff4d4f);stroke:var(--pano-paw,#b92c2e)"/>
    <path d="M30.6 50.6 v1.6 M32.6 50 v1.8 M34.6 50.6 v1.6" stroke-width=".9" stroke-linecap="round" style="stroke:var(--pano-paw,#b92c2e)"/>
  </g></g>
</svg></span></button>
<div class="gbubble" id="gbubble" hidden role="dialog">
  <button class="gx" id="gx"><svg viewBox="0 0 10 10" aria-hidden="true"><path d="M1.5 1.5l7 7M8.5 1.5l-7 7" stroke-width="1.8" stroke-linecap="round" style="stroke:var(--pano-close,#8fa898)"/></svg></button>
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
  // EARLY skills are loaded on every page. LATE skills are bigger and only some pages want them, so
  // each is fetched only when the page's adapter has an entry of the same name (chat: {...}).
  const EARLY = ['tours', 'background', 'windows', 'bin'];
  const LATE = ['talks', 'topics', 'chat'];
  const SKILLS = [...EARLY, ...LATE];
  const REG = {}, loading = [];
  const fetchSkill = n => new Promise(done => {
    const sc = document.createElement('script');
    sc.src = HOME + 'skills/' + n + '.js'; sc.onload = sc.onerror = done;
    document.head.appendChild(sc);
  });
  // skill(name, { needs: [adapter entries], start(p, host) }): start() returns what the skill offers. See skills/README.md.
  function skill(name, def) { REG[name] = def; }
  // Load them. While the page is still being read they are written in right after this file, so they
  // are ready before the page's own script calls init() (a saved background shows with no flash).
  // If this file was added to a finished page, they are fetched and he waits for them.
  if (HOME && me && !me.async && !me.defer && document.readyState === 'loading') {
    document.write(EARLY.map(n => `<script src="${HOME}skills/${n}.js"><\/script>`).join(''));
  } else if (HOME) {
    for (const n of EARLY) loading.push(fetchSkill(n));
  }

  /* init(host): start Paño on this page. host is the adapter. Everything is optional unless marked.
     About the page in general:
       brain                   (needed) which brain to load: a site name ('portfolio' loads
                               brain/portfolio.json from beside this file) or the address of a brain file.
                               A brain file may say "extends": another brain file, whose lines sit under its
                               own; that one may extend another. "base" is base.json beside this file: neutral
                               wording for every line he needs, so a brain need only write what it changes.
                               {cat_name} in a line or a tour is his name (lines.name).
       ga(name, params)        report an analytics event
       canGreet()              false when he should not say hello on arrival
       toast, hideToast()      a page notification he must never cover
       closeOverlayAt(el)      close a page menu or popup that el belongs to; resolves true if it did
       windowOf(el), paneOf(el), scrollInPane(el, toStart, smooth)
       layout                  where he may stand. Left out, he assumes a desktop with a taskbar (44px, 52px on phones).
                               { bar: { wide, narrow }   space to keep clear at the bottom of the screen
                                 safeArea: true          also keep clear of the phone's gesture bar
                                 scrolls: true }         the page itself scrolls: he scrolls what he points at into view
       keys                    { greeted, head } names for what he remembers in this tab (each site should use its own)
       idle                    { quiet, waiting } milliseconds before he tucks away (4000 and 10000 if left out)
       memory                  { mem, seen } names for what he remembers between visits: what the visitor told
                               him and what they have watched. Left out, he remembers nothing and marks nothing as seen.
       fidget: true            he stretches and looks around now and then
     What the page has for his skills. Leave an entry out and he does not offer that skill:
       tours                   readers for tour steps about this page (skills/tours.js)
       background              { desk, walls, modes, keys } (skills/background.js)
       windows                 { WINS, topWin, focusW, keepOnScreen, rectDelta, closeW, minimizeW } (skills/windows.js)
       bin                     { icon() } (skills/bin.js)
       talks                   { fillPrompt(prompt) } (skills/talks.js)
       topics                  { open(target) } (skills/topics.js)
       chat                    { keys: { key } } (skills/chat.js)
     Returns what the page may call: notice(what), busy(), rest(), menu(text), skills(), go(key), check().
     Pano.check() in the browser console lists what is wrong with the brain and adapter (see check() below). */
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
    // where he may stand: the space to keep clear at the bottom (a taskbar unless the page says otherwise)
    const LAY = host.layout || {};
    const BAR = Object.assign({ wide: 44, narrow: 52 }, LAY.bar);
    const KEYS = Object.assign({ greeted: 'catGreeted', head: 'panoHead' }, host.keys);
    const IDLE = Object.assign({ quiet: 4000, waiting: 10000 }, host.idle);
    let kb = 0, safeEl = null;                             // on-screen keyboard height; the phone's gesture bar
    if (LAY.safeArea) {
      safeEl = document.createElement('div');
      safeEl.style.cssText = 'position:fixed;left:0;bottom:0;width:0;height:env(safe-area-inset-bottom,0px);pointer-events:none;visibility:hidden';
      document.body.appendChild(safeEl);
    }
    const safe = () => safeEl ? safeEl.offsetHeight : 0;
    if (host.layout) document.documentElement.style.setProperty('--pano-bar', BAR.narrow + 'px');
    const one = t => Array.isArray(t) ? t[Math.floor(Math.random() * t.length)] : t;   // a line may be a list to pick from
    const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    // what he remembers between visits, if the page gave him somewhere to keep it
    const MEMK = host.memory || null;
    const jget = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
    const jset = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
    const mem = Object.assign({}, MEMK ? jget(MEMK.mem, {}) : {});
    const seen = Object.assign({ tours: [], talks: [], topics: [] }, MEMK ? jget(MEMK.seen, {}) : {});
    const saveMem = () => { if (MEMK) jset(MEMK.mem, mem); };
    function markSeen(kind, key) { if (!seen[kind].includes(key)) { seen[kind].push(key); if (MEMK) jset(MEMK.seen, seen); } }

    const gcat = $('#gcat'), gbodyEl = $('.gbody', gcat), gsvg = $('svg', gcat), gbub = $('#gbubble'), gsay = $('#gsay'), gacts = $('#gacts'), gring = $('#gring');
    const CAT_W = () => narrow() ? 54 : 76, CAT_H = () => narrow() ? 65 : 92;
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    let catPos = { x: 0, y: 0 }, tour = null, stepToken = 0, ringTarget = null, ringRAF = 0, msgSeq = 0, idleT = 0;

    const bar = () => narrow() ? BAR.narrow : BAR.wide;
    const dockSpot = () => ({ x: innerWidth - CAT_W() - 16, y: innerHeight - BAR.narrow - kb - safe() - CAT_H() - 12 });
    // first visit: tucked into the bottom-right corner, just above the taskbar
    const cornerSpot = () => ({ x: innerWidth - CAT_W() - (narrow() ? 8 : 14), y: innerHeight - bar() - safe() - CAT_H() - 6 });
    const clampSpot = (p, w, h) => ({ x: Math.min(innerWidth - w, Math.max(0, p.x)), y: Math.min(innerHeight - h, Math.max(0, p.y)) });
    // head mode: just his head, parked at the top middle (or wherever the user dragged it)
    const HEAD_W = () => narrow() ? 120 : 144, HEAD_H = () => narrow() ? 90 : 108;
    const FULL_VB = '0 0 100 120', HEAD_VB = '5 3 72 54';
    let headMode = false, headHome = false, headMoved = false;
    try { sessionStorage.removeItem('panoHeadPos'); } catch (e) {}   // an older version kept this
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
      L = Math.max(L, 0); T = Math.max(T, 0); R = Math.min(R, innerWidth); B = Math.min(B, innerHeight - bar());
      return R - L > 2 && B - T > 2 ? { left: L, top: T, right: R, bottom: B, width: R - L, height: B - T } : null;
    }
    const overlapArea = (a, b) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
    // on phones the bubble docks at the bottom; if that would hide what the cat is pointing at, dock it at the top
    let catTopDocked = false;
    function placeBubbleNarrow() {
      const t = ringTarget && ringTarget.isConnected ? visibleRect(ringTarget) : null;
      gbub.classList.remove('gtop');
      let top = false;
      if (t && !LAY.scrolls) {   // (a page that scrolls brings the target above the bubble instead)
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
      top = Math.min(top, innerHeight - (BAR.wide + 8) - safe() - bh);
      // if that would cover what the cat is pointing at, sit the bubble beside the cat instead
      const t = ringTarget && ringTarget.isConnected ? ringTarget.getBoundingClientRect() : null;
      const hits = (l, tp) => t && l < t.right && l + bw > t.left && tp < t.bottom && tp + bh > t.top;
      if (hits(left, top)) {
        const sideTop = Math.min(innerHeight - (BAR.wide + 8) - safe() - bh, Math.max(8, catPos.y + CAT_H() / 2 - bh / 2));
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
      each('saying');   // a skill may show or hide what it keeps in the bubble (the chat box)
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
    /* ---------- a page that scrolls (layout.scrolls): bring what he points at into view ---------- */
    let autoScroll = false;
    function scrollPage(y) {
      y = Math.max(0, Math.min(y, document.documentElement.scrollHeight - innerHeight));
      if (Math.abs(y - scrollY) < 4) return Promise.resolve();
      autoScroll = true;
      window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
      return new Promise(res => {
        let last = -1, still = 0; const t0 = performance.now();
        const tick = () => {
          if (Math.abs(scrollY - last) < .5) still++; else still = 0;
          last = scrollY;
          if (still > 4 || performance.now() - t0 > 1200) { setTimeout(() => { autoScroll = false; }, 60); return res(); }
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    }
    // wide: put the target about a third of the way down the screen
    function scrollWide(el) {
      const r = el.getBoundingClientRect();
      if (r.top >= 16 && r.bottom <= innerHeight - BAR.wide - 6 - safe()) return Promise.resolve();
      return scrollPage(scrollY + r.top - Math.max(16, Math.min(innerHeight * .3, (innerHeight - r.height) / 2)));
    }
    // narrow: the bubble is a bottom sheet, so fit the target in the space above it
    function scrollNarrow(el) {
      const r = el.getBoundingClientRect(), avail = gbub.getBoundingClientRect().top - 12;
      if (r.top >= 12 && r.bottom <= avail) return Promise.resolve();
      const y = scrollY + r.top - Math.max(12, (avail - r.height) / 2);
      makeRoom(y);
      return scrollPage(y);
    }
    // Near the end of a page there may be nothing left to scroll, and the bubble would cover what he points at
    // (a footer, say). Then he adds blank room below the page, and takes it away again when he goes to rest.
    let room = null;
    function makeRoom(y) {
      const short = Math.ceil(y - (document.documentElement.scrollHeight - innerHeight));
      if (short <= 0) return;
      if (!room) {
        room = document.createElement('div'); room.className = 'groom'; room.setAttribute('aria-hidden', 'true');
        room.style.cssText = 'display:block;height:0;margin:0;padding:0;pointer-events:none';
        document.body.appendChild(room);
      }
      room.style.height = (room.offsetHeight + short) + 'px';
    }
    async function dropRoom() {
      if (!room) return;
      const r = room; room = null;
      const end = document.documentElement.scrollHeight - r.offsetHeight - innerHeight;
      if (scrollY > end) await scrollPage(end);      // scroll back up out of it first, so nothing jumps
      r.remove();
    }
    if (LAY.scrolls) {
      // the page scrolls under him: during a step, hop back next to the thing being pointed at
      let scrollT = 0;
      addEventListener('scroll', () => {
        if (!tour || !ringTarget || autoScroll || narrow() || headMode) return;
        clearTimeout(scrollT);
        scrollT = setTimeout(() => { if (tour && ringTarget && !dragging) goNear(ringTarget).then(placeBubble); }, 160);
      }, { passive: true });
    }
    function bringFront(el) {
      const w = windowOf(el);
      if (w) w.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse' }));
    }
    async function clearView(el) {
      const own = windowOf(el);
      const pane = paneOf(el);
      if (LAY.scrolls) { if (!narrow()) await scrollWide(el); }
      else scrollInPane(el, !!(pane && el.offsetHeight > pane.clientHeight * .8), false);
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
      const y = Math.min(innerHeight - (BAR.wide + 4) - safe() - H, Math.max(8, r.top + r.height / 2 - H / 2));
      await moveCat({ x, y }, flip);
    }

    /* ---------- his brain: every line, tour and menu entry comes from JSON ---------- */
    let L = {}, BRAIN = null;
    const fill = (t, vals) => String(t).replace(/\{(\w+)\}/g, (m, k) => k in vals ? vals[k] : m);
    const named = () => `<span class="gname">${L.name}</span>`;
    // {cat_name} anywhere in his lines or tours is his name (lines.name)
    const withName = (v, name) => typeof v === 'string' ? v.split('{cat_name}').join(name)
      : Array.isArray(v) ? v.map(x => withName(x, name))
      : isObj(v) ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, withName(x, name)]))
      : v;
    function useBrain(B) {
      const name = B.lines && B.lines.name;
      if (typeof name === 'string' && JSON.stringify([B.lines, B.tours]).includes('{cat_name}')) {
        B.lines = withName(B.lines, name);
        if (B.tours) B.tours = withName(B.tours, name);
      }
      BRAIN = B;
      L = B.lines || {};
      each('brain', B);
      const lab = L.labels || {};      // (a brain missing these still loads; Pano.check() says what is missing)
      gcat.setAttribute('aria-label', lab.cat_button || L.name || '');
      gbub.setAttribute('aria-label', L.name || '');
      $('#gx').setAttribute('aria-label', lab.close || '');
    }
    const brainURL = !host.brain ? '' : /[\/.]/.test(host.brain) ? new URL(host.brain, location.href).href : HOME + 'brain/' + host.brain + '.json';
    // A brain file may say "extends": another brain file. Its lines sit under this file's own (this file's win, key
    // by key), and that file may extend another in turn: Phill's portfolio.json → core.json → base. "base" (or
    // "base.json") is base.json beside this file: neutral wording for every line he needs. Any other name is an
    // address, relative to the file that names it. Only lines are passed down; tours, menu and the rest are each
    // file's own. The file a site's brain extends is kept whole as B.core, for what Phill's two sites share.
    // "topics_from": [...] names other brain files whose stories he also knows here (kept as B.more).
    const getJSON = u => fetch(u).then(r => { if (!r.ok) throw new Error(r.status + ' for ' + u); return r.text(); })
      .then(t => { try { return JSON.parse(t); } catch (e) { throw new Error(u + ' is not valid JSON: ' + e.message); } });
    const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
    const merge = (a, b) => {
      if (!isObj(a) || !isObj(b)) return b === undefined ? a : b;
      const o = { ...a }; for (const k in b) o[k] = merge(a[k], b[k]); return o;
    };
    const brainAt = (f, from) => f === 'base' || f === 'base.json' ? HOME + 'base.json' : new URL(f, from).href;
    // a file and everything under it: { file, lines } with the lines of the whole chain merged
    const chain = [];                // the brain files he loaded, the site's own first (for Pano.check())
    let siteFile = null, brainError = null;
    async function loadChain(url, below) {
      if (below.includes(url) || below.length > 6) throw new Error('brain files extend each other in a loop: ' + [...below, url].join(' → '));
      const file = await getJSON(url);
      chain.push(url);
      if (!file.extends) return { file, lines: file.lines || {} };
      const up = await loadChain(brainAt(file.extends, url), [...below, url]);
      return { file, lines: merge(up.lines, file.lines || {}) };
    }
    async function loadBrain() {
      const site = await getJSON(brainURL);
      siteFile = site; chain.push(brainURL);
      const more = {};
      const [up] = await Promise.all([
        site.extends ? loadChain(brainAt(site.extends, brainURL), [brainURL]) : null,
        ...(site.topics_from || []).map(f => getJSON(new URL(f, brainURL).href).then(j => { more[j.site || f] = j; }).catch(() => {}))
      ]);
      return { ...site, lines: up ? merge(up.lines, site.lines || {}) : site.lines, core: up ? up.file : null, more };
    }
    const brainReady = !brainURL ? Promise.resolve(false) : loadBrain()
      .then(B => { useBrain(B); return true; })
      .catch(e => { brainError = e; console.warn('Paño could not load his brain from ' + brainURL + ', so he is staying hidden.', e); return false; });

    /* ---------- his skills: each one is a file in skills/, used only if this page has what it needs ---------- */
    const live = [], report = [];
    const each = (hook, ...a) => live.forEach(s => s[hook] && s[hook](...a));
    const any = hook => live.some(s => s[hook] && s[hook]());
    const calmCat = () => each('calm');
    function startSkills() {
      for (const name of SKILLS) {
        const def = REG[name];
        if (!def && LATE.includes(name) && host[name] == null) { report.push({ name, on: false, why: 'this page has no ' + name }); continue; }
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

    // steps: a list, or a function that returns one (for tours whose steps depend on the page right now).
    // A step: say (text, or a function giving it), target(), done(), act(el), actLabel, next (button text),
    // skip (button text), need() with needSay (Next waits until need() is true), id, jump() (the id of a later step to skip to).
    async function runTour(key, steps, opts = {}) {
      const token = ++stepToken;
      tour = key; ga('guide_choice', { goal: key });
      if (typeof steps === 'function') {
        ringOff(); gbub.hidden = true;
        steps = await steps();
        if (token !== stepToken) return;
        if (!steps || !steps.length) return guideMenu(L.menu.lost, true);
      }
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
        const head = `<span class="gstep">${fill(L.tour.step, { n: i + 1, total: steps.length, name: opts.name || '' })}</span>`;
        const outcome = await new Promise(resolve => {
          const acts = [];
          if (st.act) acts.push({ label: st.actLabel || L.tour.do_it, pri: !st.next, fn: () => st.act(el) });
          if (st.next) acts.push({ label: st.next, pri: true, fn: () => {
            if (st.need && !st.need()) { say(head + forTouch(st.needSay), acts); return; }
            resolve('next');
          } });
          if (st.skip) acts.push({ label: st.skip, fn: () => resolve('next') });
          acts.push({ label: L.tour.stop, quiet: true, fn: () => resolve('stop') });
          say(head + forTouch(typeof st.say === 'function' ? st.say() : st.say), acts);
          if (LAY.scrolls && narrow()) scrollNarrow(el);
          iv = setInterval(() => {
            if (token !== stepToken) return resolve('cancel');
            let j = null; try { j = st.jump && st.jump(); } catch (e) {}
            if (j) return resolve('jump:' + j);
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
        if (outcome.startsWith('jump:')) {
          const to = steps.findIndex(x => x.id === outcome.slice(5));
          if (to > i) i = to - 1;
        }
      }
      ga('guide_complete', { goal: key });
      if (live.some(sk => sk.afterTour && sk.afterTour(key))) return;   // a skill may have its own ending
      guideMenu(L.menu.after_tour, true);
    }
    async function guideMenu(text, again) {
      const token = ++stepToken;
      calmCat();
      tour = null; ringOff();
      gbub.hidden = true;
      await moveCat(homeSpot(), false);
      if (token !== stepToken) return;
      say(named() + one(text) + live.map(s => s.menuNote ? s.menuNote() : '').join(''), [
        ...live.flatMap(s => s.menu ? s.menu() : []),
        { label: again ? L.menu.leave_again : L.menu.leave_first, quiet: true, fn: () => guideRest(L.menu.bye) }
      ]);
    }
    // the start of most things a skill does: drop what he was doing and walk home. True if nothing else took over meanwhile.
    async function comeHome() {
      const token = ++stepToken;
      calmCat();
      tour = null; ringOff();
      gbub.hidden = true;
      await moveCat(homeSpot(), false);
      return token === stepToken;
    }
    // somewhere a button or an answer can send the visitor: 'menu', or a place one of his skills knows
    // ('tour:launch', 'talk:builder', 'topic:meet-the-cats'). Gives { label, fn } or null.
    function goFor(key) {
      if (key === 'menu') return { label: L.menu.show_menu, fn: () => guideMenu(L.menu.ask) };
      for (const sk of live) { const g = sk.go && sk.go(key); if (g) return g; }
      return null;
    }
    async function guideRest(msg) {
      const token = ++stepToken;
      calmCat();
      tour = null; ringOff();
      gbub.hidden = true; dropRoom();
      await moveCat(homeSpot(), false);
      if (token !== stepToken) return;
      if (!msg) { armIdle(); return; }
      say(one(msg));
      const mine = msgSeq;
      setTimeout(() => { if (mine === msgSeq) hideBubble(); }, 2600);
    }

    /* ---------- head mode ---------- */
    function enterHead(pop) {
      if (headMode) return;
      headMode = true; headHome = true; headMoved = false;
      calmCat();
      try { sessionStorage.setItem(KEYS.head, '1'); } catch (e) {}
      ringOff(); gbub.hidden = true; dropRoom();
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
    const IDLE_QUIET = IDLE.quiet, IDLE_WAITING = IDLE.waiting;
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
      pick: one, esc, waitFor,
      get brain() { return BRAIN; },                           // his whole brain (B.core is the shared file)
      brainURL,                                                // the full address of the site's own brain file
      mem, saveMem, seen, markSeen, remembers: !!MEMK,         // what he remembers between visits (see memory above)
      skill: name => live.find(sk => sk.name === name) || null,
      goFor, comeHome, placeBubble, touch: touchPano,
      answer: text => { for (const sk of live) { const a = sk.answer && sk.answer(text); if (a) return a; } return null; },
      // keep him and his bubble above the on-screen keyboard (for a skill with a text box)
      watchKeyboard() {
        const vv = window.visualViewport;
        if (!vv || watchKeyboard.on) return; watchKeyboard.on = true;
        const onVV = () => {
          const k = Math.max(0, Math.round(innerHeight - vv.height - vv.offsetTop));
          if (Math.abs(k - kb) < 2) return;
          kb = k; document.documentElement.style.setProperty('--pano-kb', kb + 'px');
          if (!gcat.hidden && narrow() && !headMode && !dragging && !(gbub.hidden && !hasInteracted)) setCat(dockSpot());
        };
        vv.addEventListener('resize', onVV); vv.addEventListener('scroll', onVV);
      },
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
    const watchKeyboard = api.watchKeyboard;
    // skills this page asked for by having an adapter entry are fetched now
    const wanted = HOME ? LATE.filter(n => host[n] != null && !REG[n]).map(fetchSkill) : [];
    loading.push(...wanted);
    // skills written into the page start now; ones still on their way start when they land
    const skillsReady = loading.length ? Promise.all(loading).then(startSkills) : (startSkills(), Promise.resolve());

    // when idle he fidgets: a stretch, a look around (only where the page asked for it)
    function fidget() {
      setTimeout(fidget, 14000 + Math.random() * 16000);
      if (reduce || gcat.hidden || tour || dragging || gcat.classList.contains('walking') || any('keepsHimHere')) return;
      const moves = [
        [{ transform: 'none' }, { transform: 'scale(1.06,.9)', offset: .3 }, { transform: 'scale(.96,1.08)', offset: .6 }, { transform: 'none' }],
        [{ transform: 'none' }, { transform: 'rotate(-5deg)', offset: .3 }, { transform: 'rotate(5deg)', offset: .7 }, { transform: 'none' }],
        [{ transform: 'none' }, { transform: 'translateY(-10px)', offset: .4 }, { transform: 'none' }]
      ];
      gbodyEl.animate(one(moves), { duration: 900, easing: 'ease-in-out' });
    }
    if (host.fidget) setTimeout(fidget, 12900);

    // say hello once per visit; returning in the same session, the cat just sits there
    // (he waits for his brain first: without it he has nothing to say, so he stays hidden)
    setTimeout(async () => {
      await skillsReady;
      if (!(await brainReady)) return;
      gcat.hidden = false;
      let wasHead = false;
      try { wasHead = sessionStorage.getItem(KEYS.head) === '1'; } catch (e) {}
      if (wasHead) { hasInteracted = true; enterHead(true); return; }
      setCat(cornerSpot(), false);
      anim(gbodyEl, [{ transform: 'translateY(40px) scale(.5)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: SPRING_WIN.duration, easing: SPRING_WIN.easing });
      let greeted = false;
      try { greeted = sessionStorage.getItem(KEYS.greeted) === '1'; sessionStorage.setItem(KEYS.greeted, '1'); } catch (e) {}
      // a skill may have its own hello (one that knows the time of day, say)
      if (!greeted && canGreet()) setTimeout(() => guideMenu(live.map(sk => sk.hello && sk.hello()).find(Boolean) || L.hello), 700);
    }, 900);

    /* ---------- Pano.check(): what is wrong with this page's brain and adapter, for whoever is setting him up ---------- */
    // Problems are things that break: a missing or blank line, a misspelt key, a tour left out of his menu (and which
    // step), something a tour points at that is not on the page. Notes are worth a look but may be fine: a target
    // hidden right now, a field nothing reads. It prints a report in the console and returns it.
    // Brain fields read by the skills only some pages have (anything else at the top of a brain is a note).
    const FIELDS = { talks: ['talks'], topics: ['talk_topics', 'topics_from', 'show_fallback', 'cat_preference', 'sign_offs'], chat: ['claude_chat', 'facts', 'fallbacks'] };
    const KNOWN_TOP = ['extends', 'lines', 'tours', 'menu', 'site', 'schema_version', 'updated', 'about', 'load_order', 'audience', 'persona', 'guardrails'];
    const MAPS = ['lines.background.options', 'lines.background.modes'];   // keyed by the page's own names
    async function check() {
      await skillsReady;
      const loaded = await brainReady;
      const problems = [], notes = [];
      const bad = (kind, where, say) => problems.push({ kind, where, say });
      const note = (kind, where, say) => notes.push({ kind, where, say });
      const BASE = HOME + 'base.json';
      if (!brainURL) bad('brain', 'adapter', 'the adapter names no brain: Pano.init({ brain: "..." })');
      else if (!loaded) bad('brain', brainURL, 'could not be loaded, so he stays hidden: ' + (brainError ? brainError.message : 'it never arrived'));
      else {
        // his lines: every one base.json has must be here, filled in, and every key here must be one he says
        let base = null;
        try { base = (await getJSON(BASE)).lines || {}; } catch (e) { note('base', BASE, 'could not be fetched, so his lines were not compared with it'); }
        if (base) {
          const isLine = v => typeof v === 'string' || (Array.isArray(v) && v.length > 0 && v.every(x => typeof x === 'string'));
          const blank = v => typeof v === 'string' ? !v.trim() : v.some(x => !x.trim());
          const need = (b, v, path) => {
            for (const k of Object.keys(b)) {
              if (k.startsWith('_')) continue;
              const w = path + '.' + k, bv = b[k], vv = isObj(v) ? v[k] : undefined;
              if (vv === undefined) bad('missing line', w, 'is missing, so he would say nothing there');
              else if (isObj(bv)) { if (!isObj(vv)) bad('missing line', w, 'should be a group: { ... }'); else if (!MAPS.includes(w)) need(bv, vv, w); }
              else if (Array.isArray(bv) && !bv.every(x => typeof x === 'string')) { if (!Array.isArray(vv)) bad('missing line', w, 'should be a list: [ ... ]'); }
              else if (!isLine(vv)) bad('missing line', w, 'should be a line ("...") or a list of lines to pick from');
              else if (blank(vv) && !(typeof bv === 'string' && !bv)) bad('blank line', w, 'is blank, so he would say nothing there');
            }
          };
          const extra = (b, v, path) => {
            for (const k of Object.keys(v)) {
              const w = path + '.' + k;
              if (k.startsWith('_') || (path === 'lines' && SKILLS.includes(k))) continue;   // a note; or a skill's own lines (lines.talks)
              if (!(k in b)) bad('unknown line', w, 'is not a line he says; is the key misspelt? (Start it with _ to keep it as a note.)');
              else if (isObj(b[k]) && isObj(v[k]) && !MAPS.includes(w)) extra(b[k], v[k], w);
            }
          };
          need(base, L, 'lines'); extra(base, L, 'lines');
          if (!chain.includes(BASE) && problems.some(x => x.kind === 'missing line')) note('brain', 'extends', 'this brain does not build on base.json; "extends": "base" gives every line its neutral wording');
        }
        // the top of the site's own brain file
        for (const k of Object.keys(siteFile || {})) {
          if (k.startsWith('_') || KNOWN_TOP.includes(k)) continue;
          const owner = Object.keys(FIELDS).find(n => FIELDS[n].includes(k));
          if (owner && !live.some(s => s.name === owner)) note('unused field', k, `only his ${owner} skill reads it, and that is off on this page`);
          else if (!owner) note('unknown field', k, 'nothing in Paño reads it; is it misspelt? (Start it with _ to keep it as a note.)');
        }
        // each skill checks its own part: tours check their steps, the background its names and styles
        for (const s of live) if (s.check) { try { await s.check({ bad, note }); } catch (e) { note('check', s.name, 'could not be checked: ' + e.message); } }
      }
      const plural = (n, w) => n + ' ' + w + (n === 1 ? '' : 's');
      const short = u => u === BASE ? 'base' : u;
      const text = [`Paño check: ${problems.length ? plural(problems.length, 'problem') : 'no problems'}${notes.length ? ', ' + plural(notes.length, 'note') : ''}.${chain.length ? ' Brain: ' + chain.map(short).join(' → ') : ''}`,
        ...problems.map(x => `  ✗ ${x.where}: ${x.say}`), ...notes.map(x => `  · ${x.where}: ${x.say}`),
        '  Skills: ' + report.map(r => r.on ? r.name + ' on' : `${r.name} off (${r.why})`).join('; ')];
      console.log(text.join('\n'));
      return { ok: !problems.length, brain: chain.map(short), problems, notes, skills: report.map(r => ({ ...r })) };
    }

    return Pano.here = {
      check,                                                                // what is wrong with this page's brain and adapter
      notice: (what, ...more) => each('notice', what, ...more),             // tell him something happened: 'window-opened', 'window-closed'
      skills: () => report.map(r => ({ ...r })),                            // which skills are on here, and why not
      busy: guideBusy,                                                      // on a tour, or his bubble is showing
      rest: guideRest,                                                      // close the bubble and go home
      menu: guideMenu,
      go: key => { const g = goFor(key); if (g) g.fn(); return !!g; }       // 'tour:launch', 'talk:builder', 'menu'
    };
  }

  // Pano.here is what the latest init() returned, for the page's console and the tests
  // Pano.check() in the console: what is wrong with this page's brain and adapter (see check() above)
  const check = () => Pano.here ? Pano.here.check()
    : (console.log('Paño check: Pano.init() has not run on this page.'), Promise.resolve({ ok: false, brain: [], problems: [{ kind: 'adapter', where: 'page', say: 'Pano.init() has not run on this page' }], notes: [], skills: [] }));
  window.Pano = { init, skill, check, skills: SKILLS, early: EARLY, late: LATE, here: null, version: 'latest' };
})();
