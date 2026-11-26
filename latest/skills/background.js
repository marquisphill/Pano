/* Skill: change the background (and, if asked, apply a colorblind mode).
   Needs from the page: a background.
     background: {
       desk,              the element whose data-wall attribute sets the background
       walls: [...],      the page's names for its backgrounds; the first is the default
       modes: [...],      the page's names for its colorblind modes (leave out to skip that question)
       keys: { wall, cb } names used to save the two choices in the browser
     }
   The page also supplies the look of each background: [data-wall="..."] on desk and on .wallnext
   (the new background is drawn on a .wallnext layer placed inside desk, then wiped in).
   The reveal layers (.wallnext, .grayveil, .wipeline) and the four colorblind filters
   (html[data-cb="protan|deutan|tritan|mono"]) are the same on any page, so he brings them himself,
   unless the page already carries its own (it has an element with id "cb-protan").
   His words for each name are in his brain under lines.background (options for the backgrounds, modes for the
   colorblind modes; a background with no words there is shown by its name). lines.background.note is an extra
   line he says after a colorblind mode is applied; with none, he just says lines.background.done. */
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
    if (!document.getElementById('cb-protan')) {
      document.head.insertAdjacentHTML('beforeend', `<style id="pano-background">
.wallnext{position:absolute;inset:0;z-index:0;pointer-events:none;clip-path:inset(0 0 100% 0)}
.grayveil{position:fixed;inset:0;z-index:2147483646;pointer-events:none;opacity:0;-webkit-backdrop-filter:grayscale(1);backdrop-filter:grayscale(1)}
.wipeline{position:fixed;left:0;right:0;top:0;height:3px;z-index:2147483647;pointer-events:none;background:#fff;box-shadow:0 0 18px 6px rgba(255,255,255,.75),0 0 60px 18px rgba(255,255,255,.35);opacity:0}
html[data-cb="protan"]{filter:url(#cb-protan)}
html[data-cb="deutan"]{filter:url(#cb-deutan)}
html[data-cb="tritan"]{filter:url(#cb-tritan)}
html[data-cb="mono"]{filter:grayscale(1) contrast(1.2)}
</style>`);
      document.body.insertAdjacentHTML('beforeend', `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">
  <filter id="cb-protan" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="1 0 0 0 0  -0.2549 1.2549 0 0 0  0.3031 -0.5451 1.242 0 0  0 0 0 1 0"/></filter>
  <filter id="cb-deutan" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="1 0 0 0 0  -0.4375 1.4375 0 0 0  0.2625 -0.5625 1.3 0 0  0 0 0 1 0"/></filter>
  <filter id="cb-tritan" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="1.05 -0.3825 0.3325 0 0  0 1.2345 -0.2345 0 0  0 0 1 0 0  0 0 0 1 0"/></filter>
</svg>`);
    }
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
        ...WALLS.map(k => ({ label: ((B.options || {})[k] || k) + (k === PLAIN ? B.default_mark : ''), fn: () => CB_MODES.length ? askColorblind(k) : applyLook(k, null) })),
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
      p.say(named() + p.L.background.ask_mode, CB_MODES.map(m => ({ label: (p.L.background.modes || {})[m] || m, fn: () => applyLook(wall, m) })));
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
      if (mode && p.L.background.note) {   // an extra line after a colorblind mode, if his brain has one
        p.cheer();
        p.say(named() + p.L.background.note, [
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
