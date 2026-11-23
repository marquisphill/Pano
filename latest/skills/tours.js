/* Skill: guided tours.
   Needs from the page: things to point at. The tours themselves are in his brain (tours and
   menu.show). A tour step is plain data. css, css_visible, when_visible, click and focus can be
   read on any page. Anything else (an icon, a window, a file) is about one page, so that page's
   adapter supplies a reader for it:
     tours: { target: { icon(value, step), ... }, done: { window(value), ... }, act: { open(value, el), ... } }
   A tour is offered only when this page can read every step of it. */
Pano.skill('tours', {
  needs: [],
  start(p, host) {
    const $ = p.$;
    const HELP = host.tours || {};
    const visible = sel => { const e = $(sel); return e && !e.hidden ? e : null; };
    const kindOf = (d, part) => Object.keys(d).find(k => HELP[part] && HELP[part][k]);
    // these turn a step in the brain into the checks and actions the tour runner uses
    function readTarget(d) {
      const kind = kindOf(d, 'target');
      return () => {
        if (d.when_visible && !visible(d.when_visible)) return null;
        if (d.when_window && !(HELP.done && HELP.done.window && HELP.done.window(d.when_window))) return null;
        if (d.css) return $(d.css);
        return kind ? HELP.target[kind](d[kind], d) : null;
      };
    }
    function readDone(d) {
      const kind = kindOf(d, 'done');
      return () => d.css_visible ? !!visible(d.css_visible) : !!(kind && HELP.done[kind](d[kind], d));
    }
    function readAct(d) {
      const kind = kindOf(d, 'act');
      return el => {
        if (d.click) { const e = $(d.click); if (e) e.click(); }
        else if (d.focus) { const e = $(d.focus); if (e) e.focus(); }
        else if (kind) HELP.act[kind](d[kind], el, d);
      };
    }
    // does this page support it? Every part of the step must be readable here.
    function canRun(st) {
      const t = st.target || {};
      if (!t.css && !kindOf(t, 'target')) return false;
      if (t.when_window && !(HELP.done && HELP.done.window)) return false;
      if (st.done && !st.done.css_visible && !kindOf(st.done, 'done')) return false;
      if (st.act && !st.act.click && !st.act.focus && !kindOf(st.act, 'act')) return false;
      return true;
    }

    let TOURS = {}, GOALS = [];
    return {
      brain(B) {
        TOURS = {};
        for (const [key, t] of Object.entries(B.tours || {})) {
          if (!t || !Array.isArray(t.steps) || !t.steps.every(canRun)) continue;
          TOURS[key] = t.steps.map(st => ({
            say: st.say, next: st.next, actLabel: st.actLabel,
            target: readTarget(st.target || {}),
            done: st.done ? readDone(st.done) : null,
            act: st.act ? readAct(st.act) : null
          }));
        }
        GOALS = ((B.menu && B.menu.show) || []).filter(k => TOURS[k]).map(k => [B.tours[k].label, k]);
      },
      menu: () => GOALS.map(([label, k]) => ({ label, fn: () => p.runTour(k, TOURS[k]) })),
      offers: () => GOALS.map(g => g[1])
    };
  }
});
