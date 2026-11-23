/* Paño: body and engine.
   Lifted out of the portfolio homepage in Phase 1 (see PANO-PLAN.md).

   How a page uses him:
     1. <link rel="stylesheet" href="/Pano/latest/pano.css"> in the head.
     2. <script src="/Pano/latest/pano.js"></script> in the body, at the spot where his
        elements should sit. Loading this file puts his markup there, hidden.
     3. const pano = Pano.init({ ... }) once the page's own script has set itself up.
        The object passed in (the "adapter") tells him what this page has. See init() below.

   Phase 1 moved the code without changing what it does. His tours and lines still arrive
   from the page (Phase 2 moves them to the brain) and his abilities are still one block
   (Phase 3 splits them into skills). */
(() => {
  const MARKUP = `<button class="gcat" id="gcat" hidden aria-label="Ask Phill’s cat for a guided tour"><span class="gbody"><svg viewBox="0 0 100 120" aria-hidden="true">
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
<div class="gbubble" id="gbubble" hidden role="dialog" aria-label="Phill’s cat">
  <button class="gx" id="gx" aria-label="Close the guide"><svg viewBox="0 0 10 10" aria-hidden="true"><path d="M1.5 1.5l7 7M8.5 1.5l-7 7" stroke="#8fa898" stroke-width="1.8" stroke-linecap="round"/></svg></button>
  <p class="gsay" id="gsay" aria-live="polite"></p>
  <div class="gacts" id="gacts"></div>
</div>
<div class="gring" id="gring" hidden></div>`;

  // put his elements into the page where this script tag sits (or at the end of the body)
  const me = document.currentScript;
  let mounted = false;
  function mount() {
    if (mounted || document.getElementById('gcat')) { mounted = true; return; }
    if (me && me.parentNode && document.body && document.body.contains(me)) me.insertAdjacentHTML('beforebegin', MARKUP);
    else if (document.body) document.body.insertAdjacentHTML('beforeend', MARKUP);
    else return;
    mounted = true;
  }
  mount();

  /* init(host): start Paño on this page. Everything in host is optional unless marked.
       ga(name, params)        report an analytics event
       tours, goals            (needed) the guided tours and the menu entries that start them
       desk                    (needed) the element whose data-wall attribute sets the background
       keys: { wall, cb }      (needed) names used to save the background and colorblind choice
       canGreet()              false when he should not say hello on arrival
       toast, hideToast()      a page notification he must never cover
       binIcon()               the Recycle Bin icon, if the page has one
       closeOverlayAt(el)      close a page menu or popup that el belongs to; resolves true if it did
       windowOf(el), paneOf(el), scrollInPane(el, toStart, smooth)
       windows: { WINS, topWin, focusW, keepOnScreen, rectDelta, closeW, minimizeW }
     Returns what the page may call: checkClutter(), windowClosed(), busy(), rest(), menu(text). */
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
    const TOURS = host.tours || {}, GOALS = host.goals || [];
    const KEYS = host.keys || { wall: 'pano-wall', cb: 'pano-cb' };
    const canGreet = host.canGreet || (() => true);
    const toast = host.toast || null, hideToast = host.hideToast || (() => {});
    const closeOverlayAt = host.closeOverlayAt || (async () => false);
    const windowOf = host.windowOf || (() => null);
    const paneOf = host.paneOf || (() => null);
    const scrollInPane = host.scrollInPane || ((el, toStart) => el.scrollIntoView({ block: toStart ? 'start' : 'nearest' }));
    const WM = host.windows || {};
    const WINS = WM.WINS || new Map();
    const topWin = WM.topWin || (() => null), focusW = WM.focusW || (() => {}), keepOnScreen = WM.keepOnScreen || (() => {});
    const rectDelta = WM.rectDelta || (() => 'none'), closeW = WM.closeW || (async () => {}), minimizeW = WM.minimizeW || (async () => {});

    const gcat = $('#gcat'), gbodyEl = $('.gbody', gcat), gsvg = $('svg', gcat), gbub = $('#gbubble'), gsay = $('#gsay'), gacts = $('#gacts'), gring = $('#gring');
    const CAT_W = () => narrow() ? 54 : 76, CAT_H = () => narrow() ? 65 : 92;
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    let catPos = { x: 0, y: 0 }, tour = null, stepToken = 0, ringTarget = null, ringRAF = 0, msgSeq = 0;

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

    // touch screens get "tap" instead of "click"
    const forTouch = t => (narrow() || matchMedia('(pointer: coarse)').matches)
      ? t.replace('Double-click a file, or select it and press <b>Open</b>.', 'Tap a file to open it.').replace('Double-click to open it.', 'Tap to open it.').replace(/\bClick\b/g, 'Tap')
      : t;

    function guideBusy() { return !!tour || !gbub.hidden; }

    async function runTour(key) {
      const steps = TOURS[key], token = ++stepToken;
      tour = key; ga('guide_choice', { goal: key });
      for (let i = 0; i < steps.length; i++) {
        const st = steps[i];
        const el = await waitFor(st.target);
        if (token !== stepToken) return;
        if (!el) return guideMenu('Hmm, I lost track of that. What would you like to do?', true);
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
          if (st.act) acts.push({ label: 'Do it for me', pri: !st.next, fn: () => st.act(el) });
          if (st.next) acts.push({ label: st.next, pri: true, fn: () => resolve('next') });
          acts.push({ label: 'Stop the tour', quiet: true, fn: () => resolve('stop') });
          say(`<span class="gstep">Step ${i + 1} of ${steps.length}</span>${forTouch(st.say)}`, acts);
          iv = setInterval(() => {
            if (token !== stepToken) return resolve('cancel');
            let ok = false; try { ok = st.done && st.done(); } catch (e) {}
            if (ok) resolve('done');
          }, 200);
        });
        clearInterval(iv);
        if (outcome === 'cancel' || token !== stepToken) return;
        if (outcome === 'stop') return guideRest('Okay! Click me any time you want a hand.');
        ringOff(); cheer();
        await sleep(outcome === 'done' ? 450 : 250);
        if (token !== stepToken) return;
      }
      ga('guide_complete', { goal: key });
      guideMenu('Done! What would you like to do next?', true);
    }
    async function guideMenu(text, again) {
      const token = ++stepToken;
      calmCat();
      tour = null; ringOff();
      gbub.hidden = true;
      await moveCat(homeSpot(), false);
      if (token !== stepToken) return;
      say(`<span class="gname">Phill’s cat</span>${text}`, [
        ...GOALS.map(([label, k]) => ({ label, fn: () => runTour(k) })),
        { label: 'Change the background', fn: () => askWall() },
        ...windowActions(),
        { label: again ? 'I’m good, thanks' : 'Just looking around', quiet: true, fn: () => guideRest('Okay! Click me any time you want a hand.') }
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

    /* ---------- change the background (and, if asked, apply a colorblind mode) ---------- */
    const WALLS = [['Misty mountains', 'mountain'], ['All green', 'green'], ['All black', 'black']];
    const CB_MODES = [['Red-weak (protanopia)', 'protan'], ['Green-weak (deuteranopia)', 'deutan'], ['Blue-yellow (tritanopia)', 'tritan'], ['No color (monochrome)', 'mono']];
    const CAT_NAME = '<span class="gname">Phill’s cat</span>';
    const deskEl = host.desk;
    let recoloring = false;
    const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} } };
    function setWall(k) { if (k && k !== 'mountain') deskEl.dataset.wall = k; else delete deskEl.dataset.wall; }
    function setCB(m) { if (m) document.documentElement.dataset.cb = m; else delete document.documentElement.dataset.cb; }
    // remember the visitor's choice between visits
    if (WALLS.some(w => w[1] === store.get(KEYS.wall))) setWall(store.get(KEYS.wall));
    if (CB_MODES.some(m => m[1] === store.get(KEYS.cb))) setCB(store.get(KEYS.cb));

    async function askWall() {
      const token = ++stepToken;
      tour = null; ringOff(); gbub.hidden = true;
      await moveCat(homeSpot(), false);
      if (token !== stepToken) return;
      say(CAT_NAME + 'Which background would you like?', [
        ...WALLS.map(([label, k]) => ({ label: label + (k === 'mountain' ? ' (default)' : ''), fn: () => askColorblind(k) })),
        { label: 'Never mind', quiet: true, fn: () => guideRest() }
      ]);
    }
    function askColorblind(wall) {
      say(CAT_NAME + 'Are you colorblind?', [
        { label: 'Yes', fn: () => askMode(wall) },
        { label: 'No', fn: () => applyLook(wall, null) }
      ]);
    }
    function askMode(wall) {
      say(CAT_NAME + 'Which colorblind mode should I apply to the site?', CB_MODES.map(([label, m]) => ({ label, fn: () => applyLook(wall, m) })));
    }
    async function applyLook(wall, mode) {
      if (recoloring) return;
      const token = ++stepToken;
      recoloring = true;
      say(CAT_NAME + 'Okay, I am changing the background now for you.');
      ga('change_background', { wall, colorblind_mode: mode || 'none' });
      store.set(KEYS.wall, wall === 'mountain' ? null : wall); store.set(KEYS.cb, mode);
      const canVeil = !reduce && window.CSS && (CSS.supports('backdrop-filter', 'grayscale(1)') || CSS.supports('-webkit-backdrop-filter', 'grayscale(1)'));
      if (reduce) { setWall(wall); setCB(mode); }
      else {
        let veil = null;
        if (mode && canVeil) {
          // everything, Paño included, drains to black and white...
          veil = document.createElement('div'); veil.className = 'grayveil'; document.body.appendChild(veil);
          await veil.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 700, easing: 'ease-in-out', fill: 'forwards' }).finished;
          setCB(mode);               // the color correction goes on underneath, unseen
          await sleep(3000);         // ...and stays that way for three seconds
        } else { await sleep(900); setCB(mode); }
        // then a line of light sweeps top to bottom, bringing the color and the new background with it
        const next = document.createElement('div'); next.className = 'wallnext'; next.dataset.wall = wall;
        deskEl.insertBefore(next, deskEl.firstChild);
        const line = document.createElement('div'); line.className = 'wipeline'; document.body.appendChild(line);
        const T = { duration: 1700, easing: 'cubic-bezier(.45,0,.3,1)', fill: 'forwards' };
        await Promise.all([
          next.animate([{ clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0 0)' }], T).finished,
          veil ? veil.animate([{ clipPath: 'inset(0 0 0 0)' }, { clipPath: 'inset(100% 0 0 0)' }], T).finished : null,
          line.animate([{ transform: 'translateY(0)', opacity: 1 }, { transform: `translateY(${innerHeight}px)`, opacity: 1, offset: .97 }, { transform: `translateY(${innerHeight}px)`, opacity: 0 }], T).finished
        ]);
        setWall(wall);
        next.remove(); line.remove(); if (veil) veil.remove();
      }
      recoloring = false;
      if (token !== stepToken) return;
      if (mode) {
        cheer();
        say(CAT_NAME + 'Phill is color blind and thought that was neat and funny. He wants you to know that the world is beautiful, even if you can’t see all the greens and reds.', [
          { label: 'Thanks, Paño', quiet: true, fn: () => guideRest() }
        ]);
      } else guideRest('Done! Enjoy the new view.');
    }

    /* ---------- tidy up: with more than 3 windows open, the cat offers to eat the extras ---------- */
    const CLUTTER = 3;
    let cleanupArmed = true, cleaning = false;
    function eatLayer() {
      let L = document.getElementById('eatlayer');
      if (!L) { L = document.createElement('div'); L.id = 'eatlayer'; L.style.cssText = 'position:fixed;inset:0;z-index:9055;pointer-events:none'; document.body.appendChild(L); }
      return L;
    }
    function openCount() { let n = 0; WINS.forEach(W => { if (W.state === 'open' || W.state === 'min') n++; }); return n; }
    function checkClutter() {
      if (!cleanupArmed || cleaning || recoloring || tour || gcat.hidden || openCount() <= CLUTTER) return;
      cleanupArmed = false;
      offerCleanup();
    }
    async function offerCleanup() {
      const token = ++stepToken;
      ringOff(); gbub.hidden = true;
      await moveCat({ x: innerWidth / 2 - CAT_W() / 2, y: (innerHeight - 44) / 2 - CAT_H() / 2 }, false);
      if (token !== stepToken) return;
      say('<span class="gname">Phill’s cat</span>You have a lot of windows open. Can I clean them up?', [
        ...(narrow() ? [] : [{ label: 'Organize them', pri: true, fn: () => organizeWindows() }]),
        { label: narrow() ? 'Yes' : 'Close them', pri: narrow(), fn: () => eatWindows(token) },
        { label: 'No thanks', quiet: true, fn: () => guideRest('Okay! They’re all yours.') }
      ]);
      ga('cleanup_offer', { windows: openCount() });
    }
    // menu extras, offered whenever two or more windows are open
    function windowActions() {
      if (openCount() < 2) return [];
      return [
        ...(narrow() ? [] : [{ label: 'Organize windows', fn: () => organizeWindows() }]),
        { label: 'Close all windows', fn: () => eatWindows(stepToken) }
      ];
    }
    // stack every window like a fanned deck of cards: same size, stepped diagonally, every title bar and its buttons showing
    async function organizeWindows() {
      const token = ++stepToken;
      tour = null; ringOff(); gbub.hidden = true;
      const list = [...WINS.values()].filter(W => (W.state === 'open' || W.state === 'min') && !W.busy)
        .sort((a, b) => (a.state === 'min') - (b.state === 'min') ? (b.state === 'min') - (a.state === 'min') : (+a.el.style.zIndex || 0) - (+b.el.style.zIndex || 0));
      const n = list.length;
      if (n < 2) return guideRest('Nothing to organize yet.');
      ga('organize_windows', { windows: n });
      const A = { w: innerWidth, h: innerHeight - 44 }, pad = 12;
      const stepY = Math.max(32, Math.min(38, (A.h - 2 * pad - 260) / (n - 1)));
      const stepX = Math.max(22, Math.min(38, (A.w - 2 * pad - 380) / (n - 1)));
      const w = Math.max(360, Math.min(860, A.w - 2 * pad - stepX * (n - 1)));
      const h = Math.max(240, Math.min(620, A.h - 2 * pad - stepY * (n - 1)));
      const x0 = Math.max(pad, (A.w - (w + stepX * (n - 1))) / 2), y0 = Math.max(pad, (A.h - (h + stepY * (n - 1))) / 2);
      await Promise.all(list.map(async (W, i) => {
        W.busy = true;
        const wasMin = W.state === 'min';
        const first = wasMin ? W.task.getBoundingClientRect() : W.el.getBoundingClientRect();
        if (wasMin) { W.el.style.visibility = ''; W.state = 'open'; }
        W.el.classList.remove('max');
        Object.assign(W.el.style, { left: Math.round(x0 + i * stepX) + 'px', top: Math.round(y0 + i * stepY) + 'px', width: Math.round(w) + 'px', height: Math.round(h) + 'px' });
        keepOnScreen(W.el);
        focusW(W);
        const last = W.el.getBoundingClientRect();
        if (!reduce) await W.el.animate([{ transform: rectDelta(first, last), opacity: wasMin ? 0 : 1 }, { transform: 'none', opacity: 1 }], { duration: SPRING_WIN.duration, easing: SPRING_WIN.easing, delay: i * 60, fill: 'backwards' }).finished;
        W.busy = false;
      }));
      const top = list[n - 1]; focusW(top); top.el.focus({ preventScroll: true });
      cleanupArmed = false;
      if (token !== stepToken) return;
      cheer();
      guideRest('All organized! Click any title bar to bring that window forward.');
      armIdle();
    }
    async function eatWindows(token) {
      if (token !== stepToken || cleaning) return;
      cleaning = true; gbub.hidden = true;
      const keep = topWin();
      const victims = [...WINS.values()].filter(W => W !== keep && W.state !== 'closed' && !W.busy);
      ga('cleanup_accept', { closed: victims.length });
      gcat.classList.add('chomp');
      // he grows and opens wide before eating
      const grow = reduce ? null : gbodyEl.animate([{ scale: '1' }, { scale: narrow() ? '2.1' : '1.9' }], { duration: 420, easing: SPRING_WIN.easing, fill: 'forwards' });
      await sleep(reduce ? 0 : 480);
      const m = $('.gmouth', gcat).getBoundingClientRect(), mx = m.left + m.width / 2, my = m.top + m.height / 2;
      await Promise.all(victims.map(async (W, i) => {
        W.busy = true;
        if (!reduce && W.state === 'open') {
          await sleep(i * 220);
          const r = W.el.getBoundingClientRect();
          const dx = mx - (r.left + r.width / 2), dy = my - (r.top + r.height / 2);
          // 1) shrink toward the cat while still behind the window you're reading
          // 2) pop over it and fly up to his mouth, about mouth-sized
          // 3) slide into the mouth and disappear
          const tilt = i % 2 ? 1 : -1;
          const sMouth = Math.max(.05, (m.width * 1.5) / r.width);
          const mid = `translate(${dx * .4}px, ${dy * .4}px) scale(.45) rotate(${tilt * 6}deg)`;
          const lip = `translate(${dx}px, ${dy - m.height * 1.5}px) scale(${sMouth}) rotate(${tilt * 8}deg)`;
          W.el.style.transformOrigin = '50% 50%';
          W.inner.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: 'forwards' });
          const a1 = W.el.animate([
            { transform: 'none', borderRadius: '8px' },
            { transform: mid, borderRadius: '14px' }
          ], { duration: 380, easing: 'cubic-bezier(.3,0,.5,1)', fill: 'forwards' });
          await a1.finished;
          // the desktop is its own layer under the cat, so lift the window above everything for the last stretch
          W.el.style.transform = mid; W.el.style.borderRadius = '14px'; a1.cancel();
          W.el.style.boxShadow = '0 0 0 2px #3ddc84, 0 0 24px rgba(61,220,132,.55)';
          eatLayer().appendChild(W.el);
          await W.el.animate([
            { transform: mid, opacity: 1, borderRadius: '14px', easing: 'cubic-bezier(.4,0,.4,1)' },
            { transform: lip, opacity: 1, borderRadius: '24%', offset: .52, easing: 'cubic-bezier(.75,0,1,.7)' },
            { transform: `translate(${dx}px, ${dy}px) scale(${sMouth * .08}, ${sMouth * .3}) rotate(0deg)`, opacity: 1, borderRadius: '50%', offset: .96 },
            { transform: `translate(${dx}px, ${dy}px) scale(.001)`, opacity: 0, borderRadius: '50%' }
          ], { duration: 780, fill: 'forwards' }).finished;
          gbodyEl.animate([{ transform: 'none' }, { transform: 'scale(1.18,.84)' }, { transform: 'scale(.96,1.05)' }, { transform: 'none' }], { duration: 320, easing: 'ease-out' });
        }
        await closeW(W, true);
      }));
      await sleep(reduce ? 0 : 150);
      gcat.classList.remove('chomp');
      if (grow) { await gbodyEl.animate([{ scale: getComputedStyle(gbodyEl).scale }, { scale: '1' }], { duration: 320, easing: EASE_OUT }).finished; grow.cancel(); }
      cleaning = false;
      if (keep && keep.state === 'open') { focusW(keep); keep.el.focus({ preventScroll: true }); }
      if (token !== stepToken) return;
      cheer();
      await sleep(reduce ? 0 : 450);
      if (token !== stepToken) return;
      guideRest('All clean! I kept the one you were looking at.');
      armIdle();
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
    // He never tucks away while the pointer is on him or his bubble, while he's being dragged or eating,
    // or during a tour while the user is still working in the window he's pointing at.
    const IDLE_QUIET = 4000, IDLE_WAITING = 10000;
    let hasInteracted = false, idleT = 0;
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
        if (cleaning || dragging || sulking || recoloring || mouseOnPano()) return armIdle();
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
      if (cleaning || e.button > 0) return;
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
      const hot = overBin();
      const bin = binIcon(); if (bin) bin.classList.toggle('binhot', hot);
      gcat.classList.toggle('wary', hot);
    });
    function endDrag(e) {
      if (!drag || e.pointerId !== drag.id) return;
      if (drag.moved) {
        suppressClick = true;
        gcat.classList.remove('dragging');
        if (headMode) headMoved = true;   // stays where it's dropped, until the next time he tucks away
        setTimeout(() => { suppressClick = false; }, 0);
        if (overBin()) { dragging = false; drag = null; refuseRecycle(); return; }
        gcat.classList.remove('wary');
      }
      dragging = false; drag = null; armIdle();
    }

    /* ---------- drop him on the Recycle Bin and he is not having it ---------- */
    let sulking = false;
    const binIcon = host.binIcon || (() => null);
    function calmCat() {
      gcat.classList.remove('wary', 'meh', 'lick');
      const bin = binIcon(); if (bin) bin.classList.remove('binhot', 'binreject');
      sulking = false;
    }
    // his middle is over the bin icon, and the icon isn't hidden behind a window
    function overBin() {
      const bin = binIcon(); if (!bin) return false;
      const b = bin.getBoundingClientRect(), c = gcat.getBoundingClientRect(), pad = 14;
      const cx = c.left + c.width / 2, cy = c.top + c.height / 2;
      if (!(cx > b.left - pad && cx < b.right + pad && cy > b.top - pad && cy < b.bottom + pad)) return false;
      const under = document.elementsFromPoint(b.left + b.width / 2, b.top + b.height / 2).find(n => !n.closest('#gcat, #gbubble, #gring'));
      return !!under && bin.contains(under);
    }
    async function refuseRecycle() {
      const token = ++stepToken;
      tour = null; ringOff(); gbub.hidden = true;
      clearTimeout(idleT); sulking = true;
      ga('pano_recycle_attempt', {});
      const bin = binIcon(), b = bin.getBoundingClientRect();
      bin.classList.remove('binhot', 'binreject'); void bin.offsetWidth; bin.classList.add('binreject');
      gcat.classList.remove('wary'); gcat.classList.add('meh');
      // the bin spits him out into open wallpaper beside it (on phones, to his usual talking spot)
      const spot = narrow() ? dockSpot() : clampSpot({ x: b.right + 34, y: b.top + b.height / 2 - CAT_H() / 2 + 14 }, CAT_W(), CAT_H() + 48);
      await moveCat(spot, false);
      if (token !== stepToken) return calmCat();
      if (!reduce) gbodyEl.animate([{ transform: 'scale(1.08,.84)' }, { transform: 'scale(.97,1.04)', offset: .55 }, { transform: 'none' }], { duration: 500, easing: 'cubic-bezier(.3,1.4,.5,1)' });
      await sleep(reduce ? 0 : 620);
      if (token !== stepToken) return calmCat();
      gcat.classList.add('lick');
      await sleep(reduce ? 0 : 750);
      if (token !== stepToken) return calmCat();
      say('<span class="gname">Phill’s cat</span>How dare you try to recycle me, human.');
      gcat.classList.remove('talk');   // he says it without looking up from his paw
      await sleep(4600);
      if (token !== stepToken) { if (!dragging) calmCat(); return; }
      gcat.classList.remove('lick');
      await sleep(reduce ? 0 : 900);
      if (token !== stepToken) return;
      sulking = false; gcat.classList.remove('meh'); bin.classList.remove('binreject');
      armIdle();
    }
    gcat.addEventListener('pointerup', endDrag);
    gcat.addEventListener('pointercancel', endDrag);

    gcat.addEventListener('click', () => {
      if (suppressClick || cleaning || recoloring) return;
      if (headMode) { guideMenu('What would you like to do?'); return; }
      if (!gbub.hidden && !tour) guideRest();
      else guideMenu('What would you like to do?');
    });
    $('#gx').addEventListener('click', () => guideRest());
    addEventListener('resize', () => {
      if (gcat.hidden) return;
      if (headMode) setCat(headMoved ? clampSpot(catPos, HEAD_W(), HEAD_H()) : headSpot());
      else if (!tour && !dragging) setCat(gbub.hidden && !hasInteracted ? cornerSpot() : homeSpot());
      placeBubble();
    });

    // say hello once per visit; returning in the same session, the cat just sits there
    setTimeout(() => {
      gcat.hidden = false;
      let wasHead = false;
      try { wasHead = sessionStorage.getItem('panoHead') === '1'; } catch (e) {}
      if (wasHead) { hasInteracted = true; enterHead(true); return; }
      setCat(cornerSpot(), false);
      anim(gbodyEl, [{ transform: 'translateY(40px) scale(.5)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: SPRING_WIN.duration, easing: SPRING_WIN.easing });
      let seen = false;
      try { seen = sessionStorage.getItem('catGreeted') === '1'; sessionStorage.setItem('catGreeted', '1'); } catch (e) {}
      if (!seen && canGreet()) setTimeout(() => guideMenu('Hi! I can show you around. What would you like to do?'), 700);
    }, 900);

    return {
      checkClutter,                                                         // call after a window opens
      windowClosed() { if (openCount() <= CLUTTER) cleanupArmed = true; },   // call after a window closes
      busy: guideBusy,                                                      // on a tour, or his bubble is showing
      rest: guideRest,                                                      // close the bubble and go home
      menu: guideMenu
    };
  }

  window.Pano = { init, version: 'latest' };
})();
