/* Skill: tidy up the page's windows. With more than 3 open he offers to clean up; with 2 or more
   his menu offers to organize them (a diagonal stack) or close them all (he eats them).
   Needs from the page: a window system.
     windows: { WINS, topWin, focusW, keepOnScreen, rectDelta, closeW, minimizeW }
   WINS is a Map of the page's windows, each with el, inner, task, state ('open', 'min', 'closed') and busy.
   The page tells him when a window opens or closes: pano.notice('window-opened') and
   pano.notice('window-closed'). */
Pano.skill('windows', {
  needs: ['windows'],
  start(p, host) {
    const WM = host.windows;
    const WINS = WM.WINS || new Map();
    const topWin = WM.topWin || (() => null), focusW = WM.focusW || (() => {}), keepOnScreen = WM.keepOnScreen || (() => {});
    const rectDelta = WM.rectDelta || (() => 'none'), closeW = WM.closeW || (async () => {});
    const $ = p.$, reduce = p.reduce, narrow = p.narrow, sleep = p.sleep, named = p.named;
    const gcat = p.cat, gbodyEl = p.body, SPRING_WIN = p.SPRING_WIN, EASE_OUT = p.EASE_OUT;

    /* ---------- tidy up: with more than 3 windows open, the cat offers to eat the extras ---------- */
    const CLUTTER = 3;
    let cleanupArmed = true, cleaning = false;
    function eatLayer() {
      let layer = document.getElementById('eatlayer');
      if (!layer) { layer = document.createElement('div'); layer.id = 'eatlayer'; layer.style.cssText = 'position:fixed;inset:0;z-index:9055;pointer-events:none'; document.body.appendChild(layer); }
      return layer;
    }
    function openCount() { let n = 0; WINS.forEach(W => { if (W.state === 'open' || W.state === 'min') n++; }); return n; }
    function checkClutter() {
      if (!cleanupArmed || p.ignoringTaps() || p.onTour() || gcat.hidden || openCount() <= CLUTTER) return;
      cleanupArmed = false;
      offerCleanup();
    }
    async function offerCleanup() {
      const token = p.take();
      p.ringOff(); p.hideBubble();
      await p.moveCat({ x: innerWidth / 2 - p.catW() / 2, y: (innerHeight - 44) / 2 - p.catH() / 2 }, false);
      if (!p.mine(token)) return;
      const C = p.L.cleanup;
      p.say(named() + C.offer, [
        ...(narrow() ? [] : [{ label: C.organize, pri: true, fn: () => organizeWindows() }]),
        { label: narrow() ? C.yes : C.close, pri: narrow(), fn: () => eatWindows(token) },
        { label: C.no, quiet: true, fn: () => p.rest(p.L.cleanup.declined) }
      ]);
      p.ga('cleanup_offer', { windows: openCount() });
    }
    // menu extras, offered whenever two or more windows are open
    function windowActions() {
      if (openCount() < 2) return [];
      return [
        ...(narrow() ? [] : [{ label: p.L.menu.organize, fn: () => organizeWindows() }]),
        { label: p.L.menu.close_all, fn: () => eatWindows(p.token()) }
      ];
    }
    // stack every window like a fanned deck of cards: same size, stepped diagonally, every title bar and its buttons showing
    async function organizeWindows() {
      const token = p.take();
      p.stopTour(); p.ringOff(); p.hideBubble();
      const list = [...WINS.values()].filter(W => (W.state === 'open' || W.state === 'min') && !W.busy)
        .sort((a, b) => (a.state === 'min') - (b.state === 'min') ? (b.state === 'min') - (a.state === 'min') : (+a.el.style.zIndex || 0) - (+b.el.style.zIndex || 0));
      const n = list.length;
      if (n < 2) return p.rest(p.L.cleanup.nothing);
      p.ga('organize_windows', { windows: n });
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
      if (!p.mine(token)) return;
      p.cheer();
      p.rest(p.L.cleanup.organized);
      p.armIdle();
    }
    async function eatWindows(token) {
      if (!p.mine(token) || cleaning) return;
      cleaning = true; p.hideBubble();
      const keep = topWin();
      const victims = [...WINS.values()].filter(W => W !== keep && W.state !== 'closed' && !W.busy);
      p.ga('cleanup_accept', { closed: victims.length });
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
      if (!p.mine(token)) return;
      p.cheer();
      await sleep(reduce ? 0 : 450);
      if (!p.mine(token)) return;
      p.rest(p.L.cleanup.cleaned);
      p.armIdle();
    }

    return {
      menu: windowActions,
      notice(what) {
        if (what === 'window-opened') checkClutter();
        else if (what === 'window-closed' && openCount() <= CLUTTER) cleanupArmed = true;
      },
      ignoresTaps: () => cleaning,       // while eating he does not answer taps,
      ignoresDrag: () => cleaning,       // cannot be picked up,
      keepsHimHere: () => cleaning       // and does not tuck away
    };
  }
});
