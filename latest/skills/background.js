/* Skill: change the background (and, if asked, apply a colorblind mode).
   Needs from the page: a background.
     background: {
       desk,              the element whose data-wall attribute sets the background
       walls: [...],      the page's names for its backgrounds; the first is the default
       modes: [...],      the page's names for its colorblind modes (leave out to skip that question)
       keys: { wall, cb } names used to save the two choices in the browser
     }
   The page also supplies the styles: [data-wall="..."] on desk and on .wallnext, html[data-cb="..."],
   and the .wallnext, .grayveil and .wipeline layers used for the reveal. His words for each name
   are in his brain under lines.background. */
Pano.skill('background', {
  needs: ['background'],
  start(p, host) {
    const cfg = host.background;
    const WALLS = cfg.walls || [], CB_MODES = cfg.modes || [];
    const PLAIN = WALLS[0];
    const KEYS = cfg.keys || { wall: 'pano-wall', cb: 'pano-cb' };
    const deskEl = cfg.desk;
    const reduce = p.reduce, sleep = p.sleep, named = p.named;
    let recoloring = false;
    const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} } };
    function setWall(k) { if (k && k !== PLAIN) deskEl.dataset.wall = k; else delete deskEl.dataset.wall; }
    function setCB(m) { if (m) document.documentElement.dataset.cb = m; else delete document.documentElement.dataset.cb; }
    // remember the visitor's choice between visits
    if (WALLS.includes(store.get(KEYS.wall))) setWall(store.get(KEYS.wall));
    if (CB_MODES.includes(store.get(KEYS.cb))) setCB(store.get(KEYS.cb));

    async function askWall() {
      const token = p.take();
      p.stopTour(); p.ringOff(); p.hideBubble();
      await p.moveCat(p.homeSpot(), false);
      if (!p.mine(token)) return;
      const B = p.L.background;
      p.say(named() + B.ask, [
        ...WALLS.map(k => ({ label: B.options[k] + (k === PLAIN ? B.default_mark : ''), fn: () => CB_MODES.length ? askColorblind(k) : applyLook(k, null) })),
        { label: B.never_mind, quiet: true, fn: () => p.rest() }
      ]);
    }
    function askColorblind(wall) {
      p.say(named() + p.L.background.ask_colorblind, [
        { label: p.L.background.yes, fn: () => askMode(wall) },
        { label: p.L.background.no, fn: () => applyLook(wall, null) }
      ]);
    }
    function askMode(wall) {
      p.say(named() + p.L.background.ask_mode, CB_MODES.map(m => ({ label: p.L.background.modes[m], fn: () => applyLook(wall, m) })));
    }
    async function applyLook(wall, mode) {
      if (recoloring) return;
      const token = p.take();
      recoloring = true;
      p.say(named() + p.L.background.changing);
      p.ga('change_background', { wall, colorblind_mode: mode || 'none' });
      store.set(KEYS.wall, wall === PLAIN ? null : wall); store.set(KEYS.cb, mode);
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
      if (!p.mine(token)) return;
      if (mode) {
        p.cheer();
        p.say(named() + p.L.background.phill_note, [
          { label: p.L.background.thanks, quiet: true, fn: () => p.rest() }
        ]);
      } else p.rest(p.L.background.done);
    }

    return {
      menu: () => [{ label: p.L.menu.change_background, fn: () => askWall() }],
      ignoresTaps: () => recoloring,     // mid-reveal he does not answer taps
      keepsHimHere: () => recoloring     // and does not tuck away
    };
  }
});
