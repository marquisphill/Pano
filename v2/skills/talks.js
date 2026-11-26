/* Skill: talks. Little scripted conversations: he asks, the visitor taps an answer, he replies.
   Some are lessons with a quiz in them, one builds a prompt question by question, and the
   short ones are chats he starts himself now and then.
   Needs from the page: an adapter entry, which may be empty.
     talks: {
       fillPrompt(prompt)   put a prompt he built ({ feature, details }) where the page wants it
     }
   The talks themselves are in his brain under "talks":
     order    the lessons, in the order he suggests them
     small    the short chats he may start on his own
     builder  the pieces the prompt builder puts together
     scripts  each talk: { menu (its title), nodes: [...] }
   A node is one bubble: "say", then either "opts" (answers to tap: label, reply, set, good),
   "next" (one button that moves on), or "end" (the last bubble; a list of extra buttons, each
   { label, go } where go is somewhere he can take you, like "talk:builder" or "tour:launch").
   "abc": true letters the answers. "set" is remembered (see memory in pano.js).
   His other words for this are under lines.talks. */
Pano.skill('talks', {
  needs: ['talks'],
  start(p, host) {
    const cfg = host.talks || {};
    let T = null;                              // brain.talks, once his brain has arrived
    const S = () => p.L.talks;
    const mem = p.mem;
    const heard = k => p.seen.talks.includes(k);
    const title = k => T.scripts[k].menu;
    const nextKey = from => T.order.find(k => k !== from && !heard(k)) || null;
    const offer = k => ({ key: k, title: title(k), label: T.scripts[k].go_label || p.fill(S().talk_prefix, { title: title(k) }), seen: heard(k), fn: () => run(k) });

    /* ---------- the prompt builder ---------- */
    function composePrompt() {
      const B = T.builder, what = mem.what || 'skills', fmt = mem.format || 'chart';
      const feature = B.ideas[what][fmt];
      const details = [
        p.fill(B.for, { audience: B.audience[mem.audience || 'recruiter'] }),
        p.fill(B.look, { vibe: B.vibe[mem.vibe || 'clean'] }),
        mem.length === 'long' ? B.length.long : B.length.short,
        mem.cta === false ? '' : B.cta,
        B.always
      ].filter(Boolean).join(' ');
      return { feature, details };
    }
    const usePrompt = () => { if (mem.prompt && cfg.fillPrompt) cfg.fillPrompt(mem.prompt); };

    /* ---------- the end of a talk: he always has a next thing ready ---------- */
    const esc = t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    function endButtons(list) {
      return (list || []).filter(b => (!b.if_mem || mem[b.if_mem]) && (!b.unless_mem || !mem[b.unless_mem])).map(b => {
        const g = b.go ? p.goFor(b.go) : null;
        if (b.go && !g) return null;           // somewhere this page cannot take you
        return { label: b.label, pri: b.pri, isTour: /^tour:/.test(b.go || ''), fn: () => { if (b.use_prompt) usePrompt(); if (g) g.fn(); else p.rest(b.rest); } };
      }).filter(Boolean);
    }
    function bridge(from, extra) {
      // don't offer the same thing twice
      const has = re => extra.some(a => re.test(a.label));
      const tours = p.skill('tours');
      let t = nextKey(from), s = tours && tours.next ? tours.next() : null;
      if (t && has(new RegExp(esc(title(t).replace(/^\w+ /, '')), 'i'))) t = null;
      if (s && extra.some(a => a.isTour)) s = null;
      return [
        ...extra,
        ...(s ? [{ label: s.label, pri: !extra.length, fn: s.fn }] : []),
        ...(t ? [{ label: offer(t).label, fn: offer(t).fn }] : []),
        { label: S().other_topics, fn: talkMenu },
        { label: S().good_for_now, quiet: true, fn: () => p.rest(S().byes) }
      ];
    }

    /* ---------- running one ---------- */
    function run(key, prefix = '') {
      const K = T.scripts[key], token = p.take();
      p.stopTour(); p.ringOff();
      const total = K.nodes.length, small = T.small.includes(key);
      const show = async (i, pre, first) => {
        if (!p.mine(token)) return;
        const n = K.nodes[i];
        if (first) { p.hideBubble(); await p.moveCat(p.homeSpot(), false); if (!p.mine(token)) return; }
        let text = n.say;
        if (n.say_prompt) {
          const made = composePrompt(); mem.prompt = made; p.saveMem();
          text = `${n.say_prompt}<span class="gquote"><b>${T.builder.feature_label}</b> ${p.esc(made.feature)}<br><b>${T.builder.details_label}</b> ${p.esc(made.details)}</span>`;
        }
        const head = small ? p.named() : `<span class="gstep">${p.fill(S().step, { n: i + 1, total })}</span>`;
        const body = (pre ? `<span class="gre">${pre}</span>` : '') + text;
        let acts;
        if (n.end) {
          if (!small) p.markSeen('talks', key);
          acts = bridge(key, endButtons(n.end));
        } else if (n.opts) {
          acts = n.opts.map((o, j) => ({ label: (n.abc ? 'ABC'[j] + ' · ' : '') + o.label.replace(/<[^>]+>/g, ''), fn: () => {
            if (!p.mine(token)) return;
            if (o.set) { Object.assign(mem, o.set); p.saveMem(); }
            if (o.good) p.cheer();
            show(i + 1, o.reply || '');
          } }));
        } else acts = [{ label: n.next || S().next, pri: true, fn: () => show(i + 1, '') }];
        if (!n.end) acts.push({ label: S().stop, quiet: true, fn: () => p.rest(S().stop_bye) });
        p.say(head + body, acts);
      };
      show(0, prefix, true);
    }

    async function talkMenu() {
      if (!(await p.comeHome())) return;
      const left = T.order.filter(k => !heard(k));
      p.say(p.named() + p.pick(S().menu_ask), [
        ...T.order.map(k => ({ label: (heard(k) ? p.L.tour.seen_mark : '') + title(k), fn: () => run(k) })),
        { label: S().surprise, fn: () => run(p.pick(left.length ? left : T.order)) },
        { label: S().back, quiet: true, fn: () => p.menu(p.L.menu.ask) }
      ]);
    }

    /* ---------- he starts little chats at random times ---------- */
    let chats = 0, lastAct = Date.now(), chatT = 0;
    const asked = [], MAX_CHATS = 3;
    ['pointerdown', 'keydown', 'scroll', 'input'].forEach(ev => addEventListener(ev, () => { lastAct = Date.now(); }, { passive: true, capture: true }));
    const typing = () => { const a = document.activeElement; return a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName); };
    function scheduleChat(min = 45, max = 120) { clearTimeout(chatT); chatT = setTimeout(() => tryChat(), (min + Math.random() * (max - min)) * 1000); }
    function tryChat(now) {
      if (!T || chats >= MAX_CHATS || p.cat.hidden) return;
      if (!now && (p.onTour() || !p.bubble.hidden || document.hidden || typing() || p.dragging() || Date.now() - lastAct < 6000)) return scheduleChat(15, 30);
      const left = T.small.filter(k => !asked.includes(k) && !(T.scripts[k].skip_if_mem && T.scripts[k].skip_if_mem in mem));
      if (!left.length) return;
      const key = p.pick(left); asked.push(key); chats++;
      const token = p.take();
      p.stopTour(); p.ringOff();
      p.cheer();
      p.say(p.named() + T.scripts[key].teaser, [
        { label: S().menu_button, pri: true, fn: () => run(key) },
        { label: S().not_now, quiet: true, fn: () => p.rest() }
      ]);
      setTimeout(() => { if (p.mine(token)) p.hideBubble(); }, 15000);
      scheduleChat(90, 200);
    }

    return {
      brain(B) {
        T = B.talks && B.talks.scripts ? B.talks : null;
        if (T) scheduleChat(60, 150);
      },
      menu: () => T ? [{ label: S().menu_button, fn: talkMenu }] : [],
      // his hello knows the time of day, and remembers a rough day
      hello() {
        const H = S().hello;
        if (!H) return null;
        const h = new Date().getHours();
        const tod = h < 12 ? H.morning : h < 18 ? H.afternoon : H.evening;
        const open = mem.mood === 'rough' ? p.fill(H.after_rough, { tod }) : p.fill(p.pick(H.forms), { tod });
        return open + H.tail;
      },
      go(key) {
        if (!T) return null;
        if (key === 'talks') return { label: S().menu_button, fn: talkMenu };
        const m = /^talk:(.+)$/.exec(key);
        return m && T.scripts[m[1]] ? offer(m[1]) : null;
      },
      next(from) { const k = T && nextKey(from); return k ? offer(k) : null; },
      notice(what) { if (what === 'small-chat') tryChat(true); }     // the page (or a test) may nudge him to start one
    };
  }
});
