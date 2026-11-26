/* Skill: Claude chat. A box under his bubble where the visitor can type to him.
   He answers from his own script whenever he can: first the quick replies in his brain, then any
   story the topics skill can match. Only a question he cannot place goes to Claude, which must
   reply in his voice in a few words and pick one of the things he already does.
   Needs from the page: a name to keep the visitor's key under.
     chat: {
       keys: { key }   the browser storage name for the Claude Console key the visitor pastes in
     }
   The key stays in that browser. It is sent only to api.anthropic.com, as the visitor's own key.
   Without a key he still answers from his script and says when he does not know.
   What he is told to be (the system prompt), the model, the quick replies and the places an answer
   may send you are in his brain under "claude_chat". His other words for this are under lines.chat. */
Pano.skill('chat', {
  needs: ['chat'],
  start(p, host) {
    const cfg = host.chat || {};
    const KEY_KEY = (cfg.keys && cfg.keys.key) || 'pano-key';
    const API = 'https://api.anthropic.com/v1/';
    const S = () => p.L.chat;
    const C = () => (p.brain && p.brain.claude_chat) || {};
    const esc = p.esc, named = p.named;
    const store = {
      get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
      set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
      del(k) { try { localStorage.removeItem(k); } catch (e) {} }
    };
    let memKey = '';                                   // survives even if this browser won't save
    const panoKey = () => memKey || store.get(KEY_KEY, '');
    let asks = 0, chatLog = [], thinking = false, keyToken = -1;

    /* ---------- the two boxes he keeps in his bubble ---------- */
    p.bubble.insertAdjacentHTML('beforeend', `<form class="gask" id="gask" hidden autocomplete="off">
    <input id="gaskIn" type="text" maxlength="200" enterkeyhint="send">
    <button type="submit"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h13M12 5l7 7-7 7"/></svg></button>
  </form>
  <form class="gask" id="gkey" hidden autocomplete="off">
    <input id="gkeyIn" type="password" spellcheck="false">
    <button type="submit"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12.5l5.5 5.5L20 7"/></svg></button>
  </form>`);
    const gask = p.$('#gask'), gaskIn = p.$('#gaskIn'), gkey = p.$('#gkey'), gkeyIn = p.$('#gkeyIn');
    const askingForKey = () => p.mine(keyToken);
    // the bubble grows when a box or a longer answer appears: re-place it so it stays beside him
    if (window.ResizeObserver) new ResizeObserver(() => { if (!p.bubble.hidden && !p.dragging()) p.placeBubble(); }).observe(p.bubble);
    p.bubble.addEventListener('input', p.touch);
    p.watchKeyboard();

    /* ---------- his own quick replies. These never reach Claude. ---------- */
    let QUICK = [];
    function scripted(text) {
      for (const q of QUICK) if (q.re.test(text)) return { reply: p.pick(q.reply || ''), go: q.go };
      return null;
    }

    // everything he knows, for Claude. Only the facts and his own scripts: nothing else counts.
    function knowledge() {
      const B = p.brain, core = B.core || {};
      const plain = s => String(s).replace(/<[^>]+>/g, '');
      const topics = p.skill('topics') ? p.skill('topics').all() : [];
      if (!core.facts && !B.facts && !topics.length) return '';
      return [
        'FACTS ABOUT PHILL (core.json):', JSON.stringify(core.facts || {}),
        '', 'FACTS ABOUT THIS SITE (' + (B.site || 'site') + '.json):', JSON.stringify(B.facts || {}),
        '', 'GUARDRAILS:', (core.guardrails || []).join('\n'),
        '', 'EVERYTHING YOU CAN SAY, BY TOPIC (topic id, title, what you say):', topics.map(t => `${t.id} (${t.title}): ${t.script.map(plain).join(' ')}`).join('\n')
      ].join('\n');
    }

    /* ---------- asking Claude, for everything else ---------- */
    // where a reply can send you: the places listed in his brain that this page can reach, or one of his stories
    const places = () => Object.keys(C().go || {}).filter(k => p.goFor(k));
    const topicIds = () => (p.skill('topics') ? p.skill('topics').all() : []).map(t => 'topic:' + t.id);
    function systemPrompt() {
      const cc = C(), go = cc.go || {};
      const base = [...(cc.system || []), '', cc.go_intro || '', ...places().map(k => k + ' - ' + go[k]), ...(topicIds().length && cc.go_topic ? [cc.go_topic] : [])].join('\n');
      const k = knowledge();
      return k ? [{ type: 'text', text: base + '\n' + ['', ...(cc.system_knowledge || []), '', 'KNOWLEDGE:'].join('\n') + '\n' + k, cache_control: { type: 'ephemeral' } }] : base;
    }
    const schema = () => ({
      type: 'object',
      properties: {
        reply: { type: 'string', description: C().reply_hint || 'The answer.' },
        go: { type: 'string', enum: places().concat(topicIds()) }
      },
      required: ['reply', 'go'],
      additionalProperties: false
    });
    // An API key and an OAuth token are sent differently. Try whichever we were given.
    const isOauth = k => /^sk-ant-oat/i.test(k);
    function authHeaders(k) {
      const h = { 'anthropic-version': C().api_version || '2026-10-21', 'anthropic-dangerous-direct-browser-access': 'true' };
      if (isOauth(k)) { h['authorization'] = 'Bearer ' + k; h['anthropic-beta'] = 'oauth-2025-04-20'; }
      else h['x-api-key'] = k;
      return h;
    }

    async function askClaude(text) {
      const cc = C();
      const res = await fetch(API + 'messages', {
        method: 'POST',
        headers: Object.assign({ 'content-type': 'application/json' }, authHeaders(panoKey())),
        body: JSON.stringify({
          model: cc.model || 'claude-opus-5-5',
          max_tokens: cc.max_tokens || 1200,
          system: systemPrompt(),
          output_config: { effort: cc.effort || 'low', format: { type: 'json_schema', schema: schema() } },
          messages: [...chatLog.slice(-6), { role: 'user', content: text }]
        })
      });
      if (!res.ok) {
        let detail = '';
        try { detail = (await res.json()).error.message || ''; } catch (e) {}
        const err = new Error(detail); err.status = res.status; throw err;
      }
      const data = await res.json();
      if (data.stop_reason === 'refusal') return { reply: S().errors.refusal, go: 'menu' };
      const raw = ((data.content || []).find(b => b.type === 'text' && b.text) || {}).text || '';
      // normally structured JSON; if it ever comes back as plain prose, still say it
      let out = null;
      try { out = JSON.parse(raw); } catch (e) {}
      if (!out || typeof out.reply !== 'string' || !out.reply.trim()) {
        const plain = raw.trim().replace(/^[{\[].*/s, '').trim();
        if (!plain) throw new Error('empty reply');
        out = { reply: plain.split(/(?<=[.!?])\s/).slice(0, 2).join(' ').slice(0, 220), go: 'menu' };
      }
      if (!p.goFor(out.go)) out.go = 'menu';
      chatLog.push({ role: 'user', content: text }, { role: 'assistant', content: out.reply });
      chatLog = chatLog.slice(-6);
      return out;
    }

    function askError(e) {
      const E = S().errors;
      try { console.warn('[Paño] Claude call failed:', e.status || 'no status', e.message || e); } catch (_) {}
      if (e.status === 401 && /cors/i.test(e.message || '')) return { reply: E.cors, go: 'menu' };
      if (e.status === 401 || e.status === 403) {
        memKey = ''; store.del(KEY_KEY);
        return { reply: E.rejected, go: 'key' };
      }
      if (e.status === 429) return { reply: E.busy, go: 'menu' };
      if (e.status === 400 && /credit|balance/i.test(e.message || '')) return { reply: E.no_credit, go: 'menu' };
      return { reply: E.hiccup, go: 'menu' };
    }

    /* ---------- showing an answer ---------- */
    const backToMenu = () => p.menu(p.L.menu.ask);
    function showAnswer(out) {
      if (out.go === 'rest') return p.rest(out.reply || S().bye);
      if (out.go === 'key') return askForKey(out.reply);
      const target = p.goFor(out.go) || p.goFor('menu');
      const acts = [{ label: target.label, pri: true, fn: target.fn }];
      if (out.go !== 'menu') acts.push({ label: S().back_to_menu, fn: backToMenu });
      acts.push({ label: S().im_good, quiet: true, fn: () => p.rest(S().bye) });
      p.say(named() + esc(out.reply), acts);
      p.cheer();
    }

    async function ask(text) {
      if (thinking) return;
      const token = p.take();
      p.stopTour(); p.ringOff();
      const you = `<span class="gyou">${p.fill(S().you, { text: esc(text) })}</span>`;
      p.say(named() + you, []);
      const hit = scripted(text);
      if (hit) { await p.sleep(260); if (p.mine(token)) showAnswer(hit); return; }
      // one of his stories, or anything else another skill can answer
      const known = p.answer(text);
      if (known) { await p.sleep(260); if (p.mine(token)) known(); return; }
      if (!panoKey()) {
        const B = p.brain, fb = (B.fallbacks || (B.core && B.core.persona && B.core.persona.fallbacks) || {});
        const topics = p.goFor('topics');
        return p.say(named() + esc(fb.unknown || S().unknown) + S().with_a_brain, [
          ...(topics ? [{ label: topics.label, pri: true, fn: topics.fn }] : []),
          { label: S().menu_give, fn: () => askForKey('') },
          { label: S().back_to_menu, quiet: true, fn: backToMenu }
        ]);
      }
      if (asks >= (C().asks_per_visit || 20)) return showAnswer({ reply: S().enough, go: 'menu' });
      asks++;
      thinking = true;
      p.say(named() + you + `<span class="gthink">${S().thinking}<i>.</i><i>.</i><i>.</i></span>`,
        [{ label: S().never_mind, quiet: true, fn: () => p.rest() }]);
      let out;
      try { out = await askClaude(text); }
      catch (e) { out = askError(e); }   // the real reason goes to the browser console
      finally { thinking = false; }
      if (p.mine(token)) showAnswer(out);
    }

    gask.addEventListener('submit', ev => {
      ev.preventDefault();
      const v = gaskIn.value.trim();
      if (!v) return;
      gaskIn.value = ''; gaskIn.blur();
      ask(v);
    });

    /* ---------- giving him a brain: the visitor's own Claude key ---------- */
    const keyButtons = () => [
      { label: S().get_key, fn: () => window.open(C().key_page || 'https://platform.claude.com/settings/keys', '_blank', 'noopener') },
      { label: S().not_now, quiet: true, fn: () => p.rest(S().not_now_bye) }
    ];
    function askForKey(lead) {
      const token = keyToken = p.take();
      p.stopTour(); p.ringOff();
      p.say(named() + (lead ? esc(lead) + ' ' : '') + S().paste_key, keyButtons());
      setTimeout(() => { if (p.mine(token)) gkeyIn.focus(); }, 60);
    }
    // the look-alikes that cannot work, caught before any request
    function wrongKind(v) {
      const W = S().wrong_key;
      if (/^sk-ant-admin/i.test(v)) return W.admin;
      if (/^(github_pat_|ghp_)/.test(v)) return W.github;
      if (/^sk-/.test(v) && !/^sk-ant-/.test(v)) return W.other_provider;
      if (!/^sk-ant-\S{20,}$/.test(v)) return W.not_a_key;
      return null;
    }
    // a free GET that proves the credential works, so you find out now instead of later
    async function testKey(k) {
      const K = S().key_check;
      let res;
      try { res = await fetch(API + 'models?limit=1', { headers: authHeaders(k) }); }
      catch (e) { return K.unreachable; }
      if (res.ok) return null;
      let msg = '';
      try { msg = (await res.json()).error.message || ''; } catch (e) {}
      try { console.warn('[Paño] key check failed:', res.status, msg); } catch (e) {}
      if (/cors/i.test(msg)) return K.cors;
      if (/credit|balance|quota/i.test(msg)) return K.no_credit;
      if (isOauth(k)) return K.oauth;
      if (res.status === 401) return K.invalid;
      if (res.status === 403) return K.forbidden;
      return p.fill(K.other, { status: res.status, message: msg });
    }
    gkey.addEventListener('submit', async ev => {
      ev.preventDefault();
      const v = gkeyIn.value.trim();
      const bad = wrongKind(v);
      if (bad) { p.say(named() + esc(bad), []); gkeyIn.focus(); return; }
      const token = keyToken = p.take();
      p.say(named() + `<span class="gthink">${S().checking_key}<i>.</i><i>.</i><i>.</i></span>`, []);
      const problem = await testKey(v);
      if (!p.mine(token)) return;
      if (problem) { p.say(named() + esc(problem), keyButtons()); gkeyIn.focus(); return; }
      memKey = v; store.set(KEY_KEY, v); gkeyIn.value = ''; chatLog = [];
      const kept = store.get(KEY_KEY, '') === v;
      p.cheer();
      p.menu(kept ? S().key_saved : S().key_not_kept);
    });
    function brainMenu() {
      p.take(); p.stopTour(); p.ringOff();
      p.say(named() + S().has_brain, [
        { label: S().forget, fn: () => { memKey = ''; store.del(KEY_KEY); chatLog = []; asks = 0; p.menu(S().forgotten); } },
        { label: S().back, quiet: true, fn: backToMenu }
      ]);
    }

    return {
      brain(B) {
        const cc = B.claude_chat || {};
        QUICK = (cc.quick_replies || []).map(q => { try { return Object.assign({ re: new RegExp(q.match, 'i') }, q); } catch (e) { return null; } }).filter(Boolean);
        gaskIn.placeholder = S().ask_placeholder; gaskIn.setAttribute('aria-label', S().ask_placeholder);
        gask.querySelector('button').setAttribute('aria-label', S().send);
        gkeyIn.placeholder = S().key_placeholder; gkeyIn.setAttribute('aria-label', S().key_label);
        gkey.querySelector('button').setAttribute('aria-label', S().save_key);
      },
      // each time he speaks: the key box shows only while he is asking for a key, the ask box whenever he is not on a tour
      saying() { gkey.hidden = !askingForKey(); gask.hidden = p.onTour() || askingForKey(); },
      menu: () => [{ label: panoKey() ? S().menu_has : S().menu_give, quiet: true, fn: () => panoKey() ? brainMenu() : askForKey('') }],
      go: key => key === 'key' ? { label: S().menu_give, fn: () => askForKey('') } : null,
      // never walk off mid-thought, or while the visitor is typing to him
      keepsHimHere: () => thinking || (p.bubble.contains(document.activeElement) && document.activeElement.tagName === 'INPUT'),
      ask, hasKey: () => !!panoKey()
    };
  }
});
