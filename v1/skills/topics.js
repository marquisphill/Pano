/* Skill: topics. The stories he knows about Phill, the portfolio, this site and the cats.
   He tells one a bubble at a time, offers what to hear next, and can match a typed question to one.
   Needs from the page: somewhere to show things that live on the other site.
     topics: {
       open(target)   show a portfolio thing from here. target is '' for the home page, or the
                      topic's portfolio "show" value ('doc:reports', 'tour:skills', ...).
     }
   The stories are "talk_topics" in his brain: the shared file (core.json), this site's file, and any
   file this site lists under "topics_from". A topic: { id, title, triggers, script, follow_ups, show }.
   A topic's "show" for this site may be "tour:<id>" (one of this site's tours) or "preview:home".
   His other words for this are under lines.topics. */
Pano.skill('topics', {
  needs: ['topics'],
  start(p, host) {
    const cfg = host.topics || {};
    const TOPICS = {};
    let B = null, site = '';
    const S = () => p.L.topics;
    const told = id => p.seen.topics.includes(id);
    const count = () => Object.keys(TOPICS).length;

    function index() {
      for (const k in TOPICS) delete TOPICS[k];
      // ids never collide, but if they ever do: this site beats the shared file, which beats the others
      const files = [...Object.entries(B.more || {}), ['core', B.core], [site, B]];
      for (const [from, f] of files) ((f && f.talk_topics) || []).forEach(t => {
        if (t && t.id && t.status !== 'draft' && Array.isArray(t.script) && t.script.length) TOPICS[t.id] = Object.assign({ from }, t);
      });
    }

    // match what was typed against each topic's trigger phrases; the longest phrase wins
    const norm = t => ' ' + String(t).toLowerCase().replace(/[’‘]/g, "'").replace(/ñ/g, 'n').replace(/[^a-z0-9',.&+-]+/g, ' ').replace(/[,.]+(\s|$)/g, ' ') + ' ';
    function matchTopic(text) {
      const said = norm(text);
      let best = null, len = 0;
      for (const id in TOPICS) for (const tr of TOPICS[id].triggers || []) {
        const t = norm(tr).trim();
        if (t.length > len && said.includes(' ' + t + ' ')) { best = id; len = t.length; }
      }
      return best;
    }

    // scripts may only use <b>
    const safeHtml = s => p.esc(s).replace(/&lt;(\/?)b&gt;/g, '<$1b>');

    // the button that shows what a topic is about: one of this site's tours, or the thing on the other site
    function showFor(T) {
      let s = T.show;
      if (s && typeof s === 'object') s = s[site] || (s.portfolio && site !== 'portfolio' ? 'portfolio:' + s.portfolio : null);
      else if (s && T.from !== site && T.from !== 'core') s = T.from + ':' + s;
      if (!s) return null;
      if (/^tour:/.test(s)) { const g = p.goFor(s); return g ? { label: g.label, fn: g.fn } : null; }
      if (!cfg.open) return null;
      const there = t => () => { cfg.open(t); p.rest((B.show_fallback && B.show_fallback.say) || S().shown_there); };
      if (s === 'preview:home') return { label: S().show_portfolio, fn: there('') };
      if (s.startsWith('portfolio:')) return { label: S().see_on_portfolio, fn: there(s.slice(10)) };
      return null;
    }

    function endButtons(T) {
      const acts = [], sh = showFor(T);
      if (sh) acts.push(Object.assign({ pri: true }, sh));
      const ups = (T.follow_ups || []).filter(id => TOPICS[id]);
      ups.sort((a, b) => told(a) - told(b));
      ups.slice(0, 3).forEach((id, i) => acts.push({ label: (told(id) ? p.L.tour.seen_mark : '') + TOPICS[id].title, pri: !sh && !i, fn: () => run(id) }));
      // he loves a cat break
      const pref = B.cat_preference || {}, cats = pref.favorite_topics || [], fav = cats[0];
      if (fav && TOPICS[fav] && !cats.includes(T.id) && !ups.includes(fav) && Math.random() < (pref.offer_cat_topic_after_other_topics || 0))
        acts.push({ label: S().cat_break, fn: () => run(fav) });
      acts.push({ label: S().menu_button, fn: menu });
      acts.push({ label: S().im_good, quiet: true, fn: () => p.rest(B.sign_offs || S().bye) });
      return acts;
    }

    function run(id) {
      const T = TOPICS[id];
      if (!T) return p.menu(p.L.menu.ask);
      const token = p.take();
      p.stopTour(); p.ringOff();
      p.markSeen('topics', id);
      const n = T.script.length;
      const show = async (i, first) => {
        if (!p.mine(token)) return;
        if (first) { p.hideBubble(); await p.moveCat(p.homeSpot(), false); if (!p.mine(token)) return; }
        const head = `<span class="gstep">${p.esc(T.title)}${n > 1 ? p.fill(S().part, { n: i + 1, total: n }) : ''}</span>`;
        const acts = i < n - 1
          ? [{ label: S().next, pri: true, fn: () => show(i + 1) }, { label: S().stop, quiet: true, fn: () => p.rest(S().bye) }]
          : endButtons(T);
        p.say(head + safeHtml(p.forTouch(T.script[i])), acts);
        if (i === n - 1) p.cheer();
      };
      show(0, true);
    }

    async function menu() {
      if (!(await p.comeHome())) return;
      const M = B.menu || {};
      const ids = (M.talk_starters || []).filter(id => TOPICS[id]);
      const extra = (M.more_topics || []).filter(id => TOPICS[id] && !ids.includes(id));
      p.say(p.named() + p.pick(S().menu_ask), [
        ...ids.concat(extra).slice(0, 8).map(id => ({ label: (told(id) ? p.L.tour.seen_mark : '') + TOPICS[id].title, fn: () => run(id) })),
        { label: S().surprise, fn: () => { const left = Object.keys(TOPICS).filter(id => !told(id) && TOPICS[id].from !== site); run(p.pick(left.length ? left : Object.keys(TOPICS))); } },
        { label: S().back, quiet: true, fn: () => p.menu(p.L.menu.ask) }
      ]);
    }

    return {
      brain(b) { B = b; site = b.site || ''; index(); },
      menu: () => count() ? [{ label: S().menu_button, fn: menu }] : [],
      go(key) {
        if (key === 'topics') return count() ? { label: S().menu_button, fn: menu } : null;
        const m = /^topic:(.+)$/.exec(key);
        return m && TOPICS[m[1]] ? { label: p.fill(S().tell_me, { title: TOPICS[m[1]].title }), fn: () => run(m[1]) } : null;
      },
      // a typed question that matches one of his stories: free, and it never leaves the page
      answer(text) { const id = matchTopic(text); return id ? () => run(id) : null; },
      all: () => Object.values(TOPICS),
      match: matchTopic
    };
  }
});
