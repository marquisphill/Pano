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
   points out the next one, and ends each tour with what to watch next.

   Pano.check() asks this skill about every tour: a tour left out of his menu says which step and why,
   and for the tours he offers, it looks for what each step points at on the page as it is now. */
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
    // does this page support it? Every part of the step must be readable here. whyNot() says what is not (for Pano.check()).
    const keys = d => Object.keys(d).filter(k => !k.startsWith('_')).map(k => '"' + k + '"').join(', ') || 'nothing';
    function whyNot(st) {
      const t = st.target || {};
      if (!t.css && !kindOf(t, 'target')) return st.target ? `its target has no "css", and this page has no reader for ${keys(t)}` : 'it has no "target" (what he points at)';
      if (t.when_window && !(HELP.done && HELP.done.window)) return 'its target has "when_window", and this page has no window reader';
      if (st.done && !st.done.css_visible && !kindOf(st.done, 'done')) return `its "done" has no "css_visible", and this page has no reader for ${keys(st.done)}`;
      if (st.act && !st.act.click && !st.act.focus && !st.act.submit && !kindOf(st.act, 'act')) return `its "act" has no "click", "focus" or "submit", and this page has no reader for ${keys(st.act)}`;
      if (st.when && !knows(st.when)) return `it has "when": "${st.when}", which this page does not answer`;
      if (st.unless && !knows(st.unless)) return `it has "unless": "${st.unless}", which this page does not answer`;
      if (st.jump && !knows(st.jump.when)) return `its "jump" waits for "${st.jump.when}", which this page does not answer`;
      if (st.need && !st.need.filled) return 'its "need" has no "filled"';
      return '';
    }
    const canRun = st => !whyNot(st);
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

    // Pano.check(): every tour, every step. A tour left out of his menu says which step and why; for the tours he
    // offers, what each step points at must be on the page now (or hidden, as a note: an earlier step may show it).
    const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
    const TOUR_FIELDS = ['label', 'name', 'steps', 'wait_for', 'wait_ms', 'then'];
    const STEP_FIELDS = ['say', 'target', 'done', 'act', 'actLabel', 'next', 'skip', 'id', 'jump', 'need', 'need_say', 'when', 'unless'];
    const shown = el => el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
    function check({ bad, note }) {
      const B = p.brain || {}, T = B.tours === undefined ? {} : B.tours;
      if (!isObj(T)) return bad('tour', 'tours', 'should be a group of tours: { "id": { "label": "...", "steps": [ ... ] } }');
      const ids = Object.keys(T).filter(k => !k.startsWith('_'));
      if (!ids.length) note('tour', 'tours', 'this brain has no tours, so his menu offers none');
      const M = isObj(B.menu) ? B.menu : {};
      if (M.show !== undefined && !Array.isArray(M.show)) bad('menu', 'menu.show', 'should be a list of tour ids: [ "...", ... ]');
      const show = Array.isArray(M.show) ? M.show : null, later = Array.isArray(M.show_later) ? M.show_later : [];
      (show || []).forEach(k => { if (!isObj(T[k])) bad('menu', 'menu.show', `lists "${k}", but there is no tour "${k}"`); });
      const sel = (css, where, what) => { try { return { el: $(css) }; } catch (e) { bad('tour', where, `${what} "${css}" is not a valid CSS selector`); return null; } };
      for (const key of ids) {
        const t = T[key], w = 'tours.' + key;
        if (!isObj(t) || !Array.isArray(t.steps) || !t.steps.length) { bad('tour', w, 'needs "steps": a list of at least one step'); continue; }
        if (typeof t.label !== 'string' || !t.label.trim()) bad('tour', w, 'needs a "label": the button for it in his menu');
        Object.keys(t).forEach(f => { if (!f.startsWith('_') && !TOUR_FIELDS.includes(f)) bad('unknown field', w + '.' + f, 'is not something a tour has; is it misspelt?'); });
        if (t.wait_for && !knows(t.wait_for)) bad('tour left out', w, `it waits for "${t.wait_for}", which this page does not answer, so it is left out of his menu`);
        if (show && !show.includes(key) && !later.includes(key)) note('tour', w, 'is not in menu.show, so he does not offer it');
        const offered = GOALS.some(g => g[1] === key), varies = !!t.wait_for;
        t.steps.forEach((st, i) => {
          const ws = `${w} step ${i + 1}`;
          if (!isObj(st)) return bad('tour left out', ws, 'should be a step: { "say": "...", "target": { "css": "..." }, "next": "..." }');
          const why = whyNot(st);
          if (why) bad('tour left out', ws, why + ', so this tour is left out of his menu');
          Object.keys(st).forEach(f => { if (!f.startsWith('_') && !STEP_FIELDS.includes(f)) bad('unknown field', ws + '.' + f, 'is not something a step has; is it misspelt?'); });
          if (typeof st.say !== 'string' || !st.say.trim()) bad('tour', ws, 'needs "say": what he says at this step');
          if (!st.next && !st.done && !st.jump) bad('tour', ws, 'has no way to move on: give it "next" (a button) or "done" (what counts as doing it)');
          if (why || !offered) return;
          // what it points at, on the page as it is right now. Missing is a problem unless the page may have changed
          // by then: an earlier step had something to do ("act" or "done"), or the step depends on the page.
          const tg = st.target, later = varies || st.when || st.unless || t.steps.slice(0, i).some(x => isObj(x) && (x.act || x.done));
          const missing = (what, css) => (later ? note : bad)('target not found', ws, `${what}nothing on this page matches "${css}"` + (later ? ' yet (fine if an earlier step adds it)' : ''));
          if (tg.css) {
            const r = sel(tg.css, ws, 'target.css');
            if (r && !r.el) missing('', tg.css);
            else if (r && !shown(r.el)) note('target hidden', ws, `"${tg.css}" is on the page but hidden right now (fine if an earlier step shows it)`);
          } else {
            let el = null; try { el = readTarget(tg)(); } catch (e) {}
            if (!el) note('target not found', ws, 'this page cannot find what it points at right now (fine if an earlier step opens it)');
          }
          if (tg.when_visible) sel(tg.when_visible, ws, 'target.when_visible');
          if (st.done && st.done.css_visible) sel(st.done.css_visible, ws, 'done.css_visible');
          const a = isObj(st.act) ? st.act : {};
          for (const k of ['click', 'focus', 'submit']) if (a[k]) { const r = sel(a[k], ws, 'act.' + k); if (r && !r.el) missing(`act.${k}: `, a[k]); }
          if (st.need && st.need.filled) { const r = sel(st.need.filled, ws, 'need.filled'); if (r && !r.el) missing('need.filled: ', st.need.filled); }
        });
      }
    }

    return {
      check,
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
