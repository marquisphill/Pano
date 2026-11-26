/* Skill: guided tours.
   Needs from the page: things to point at. The tours themselves are in his brain (tours and
   menu.show). A tour step is plain data. css, css_visible, when_visible, click, focus and submit
   can be read on any page. Anything else (an icon, a window, a file) is about one page, so that
   page's adapter supplies a reader for it:
     tours: {
       target: { icon(value, step), ... },   what he points at
       done:   { window(value), ... },       what counts as the visitor having done it
       act:    { open(value, el, step, p), ... }, what the "Do it for me" button does
       when:   { no_token(p), ... },         facts about the page right now, for steps marked "when" or "unless"
       values: { feature(p), ... },          words to drop into a line where it says {feature}
       begin(key)                            called as a tour starts
     }
   A tour is offered only when this page can read every step of it.

   Extras a step may carry: "when"/"unless" (leave the step out unless the page says so), "id" and
   "jump": { "when": ..., "to": id } (skip ahead once something is true), "need": { "filled": css }
   with "need_say" (Next waits until that box has something in it), "skip" (a second button that moves on).
   A tour may carry "wait_for" (a "when" fact to wait for before it starts), "name" (shown in the
   step label where the brain's tour.step line uses {name}) and "then" (somewhere to offer afterwards).

   Where the page gave him a memory (adapter entry "memory"), he ticks off tours already watched,
   points out the next one, and ends each tour with what to watch next. */
Pano.skill('tours', {
  needs: [],
  start(p, host) {
    const $ = p.$;
    const HELP = host.tours || {};
    const visible = sel => { const e = $(sel); return e && !e.hidden ? e : null; };
    const kindOf = (d, part) => Object.keys(d).find(k => HELP[part] && HELP[part][k]);
    const fact = name => !!(HELP.when && HELP.when[name] && HELP.when[name](p));
    const knows = name => !!(HELP.when && HELP.when[name]);
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
        else if (d.submit) { const e = $(d.submit); if (e) e.requestSubmit(); }
        else if (kind) HELP.act[kind](d[kind], el, d, p);
      };
    }
    // a line may have gaps for the page to fill: "Right now it's {now}."
    // After a bar comes what to say if the page has nothing for it: "Claude builds {feature|your feature}".
    const GAP = /\{(\w+)(?:\|([^}]*))?\}/g;
    function readSay(t) {
      const known = [...String(t).matchAll(GAP)].some(m => HELP.values && HELP.values[m[1]]);
      if (!known) return t;
      return () => t.replace(GAP, (all, k, or) => HELP.values[k] ? p.esc(HELP.values[k](p) || or || '') : all);
    }
    // does this page support it? Every part of the step must be readable here.
    function canRun(st) {
      const t = st.target || {};
      if (!t.css && !kindOf(t, 'target')) return false;
      if (t.when_window && !(HELP.done && HELP.done.window)) return false;
      if (st.done && !st.done.css_visible && !kindOf(st.done, 'done')) return false;
      if (st.act && !st.act.click && !st.act.focus && !st.act.submit && !kindOf(st.act, 'act')) return false;
      if (st.when && !knows(st.when)) return false;
      if (st.unless && !knows(st.unless)) return false;
      if (st.jump && !knows(st.jump.when)) return false;
      if (st.need && !st.need.filled) return false;
      return true;
    }
    const build = st => ({
      id: st.id, say: readSay(st.say), next: st.next, skip: st.skip, actLabel: st.actLabel,
      target: readTarget(st.target || {}),
      done: st.done ? readDone(st.done) : null,
      act: st.act ? readAct(st.act) : null,
      need: st.need ? () => { const e = $(st.need.filled); return !!(e && e.value.trim()); } : null,
      needSay: st.need_say,
      jump: st.jump ? () => fact(st.jump.when) && st.jump.to : null
    });

    let RAW = {}, TOURS = {}, GOALS = [];
    // a tour whose steps depend on the page is put together when it starts, not when his brain arrives
    const depends = t => !!t.wait_for || t.steps.some(st => st.when || st.unless);
    function begin(k) {
      const t = RAW[k];
      if (HELP.begin) HELP.begin(k);
      p.runTour(k, !depends(t) ? TOURS[k] : async () => {
        if (t.wait_for) await p.waitFor(() => fact(t.wait_for), t.wait_ms || 4000);
        return t.steps.filter(st => (!st.when || fact(st.when)) && (!st.unless || !fact(st.unless))).map(build);
      }, { name: t.name || t.label });
    }

    // with a memory: which tours has the visitor watched, and which comes next
    const watched = k => p.remembers && p.seen.tours.includes(k);
    const nextKey = () => (p.remembers && GOALS.map(g => g[1]).find(k => !watched(k))) || null;
    const offer = k => ({ key: k, label: RAW[k].label, name: RAW[k].name || RAW[k].label, fn: () => begin(k) });
    // after a tour: celebrate, then tempt them into the next one
    const lines = () => p.L.tour;      // the lines below are only needed where he has a memory
    function wrapUp(key) {
      const T = lines();
      if (!p.remembers || !T.wrap) return false;
      p.markSeen('tours', key);
      const keys = GOALS.map(g => g[1]), n = keys.filter(watched).length, s = nextKey();
      const talks = p.skill('talks'), t = talks && talks.next ? talks.next() : null;
      const then = RAW[key].then ? p.goFor(RAW[key].then) : null;
      const lead = p.pick(T.wrap) + p.fill(T.watched, { n, total: keys.length });
      const tease = s ? p.fill(T.next_up, { name: offer(s).name.toLowerCase() }) : t ? p.fill(T.next_talk, { title: t.title.toLowerCase() }) : T.seen_all;
      p.comeHome().then(ok => {
        if (!ok) return;
        p.say(p.named() + lead + tease, [
          ...(s ? [{ label: offer(s).label, pri: true, fn: offer(s).fn }] : []),
          ...(then && !then.seen ? [{ label: then.label, fn: then.fn }] : t ? [{ label: t.label, pri: !s, fn: t.fn }] : []),
          { label: T.back_to_menu, fn: () => p.menu(p.L.menu.ask) },
          { label: T.im_good, quiet: true, fn: () => p.rest(T.im_good_bye) }
        ]);
      });
      return true;
    }

    return {
      brain(B) {
        RAW = {}; TOURS = {};
        for (const [key, t] of Object.entries(B.tours || {})) {
          if (!t || !Array.isArray(t.steps) || !t.steps.every(canRun)) continue;
          if (t.wait_for && !knows(t.wait_for)) continue;
          RAW[key] = t;
          TOURS[key] = t.steps.map(build);
        }
        // his menu offers the tours in menu.show, in that order; a brain with no menu.show offers all its tours
        const show = B.menu && Array.isArray(B.menu.show) ? B.menu.show : Object.keys(B.tours || {});
        GOALS = show.filter(k => TOURS[k]).map(k => [B.tours[k].label, k]);
      },
      menu: () => GOALS.map(([label, k]) => p.remembers
        ? { label: (watched(k) ? p.L.tour.seen_mark : '') + label, pri: k === nextKey(), fn: () => begin(k) }
        : { label, fn: () => begin(k) }),
      // said once, under his menu, until the first tour has been watched
      menuNote: () => p.remembers && lines().intro && GOALS.length && !GOALS.some(g => watched(g[1])) ? ` <span class="gre">${lines().intro}</span>` : '',
      afterTour: wrapUp,
      go(key) { const m = /^tour:(.+)$/.exec(key); return m && GOALS.some(g => g[1] === m[1]) ? offer(m[1]) : null; },   // only tours his menu offers
      next() { const k = nextKey(); return k ? offer(k) : null; },
      offers: () => GOALS.map(g => g[1])
    };
  }
});
