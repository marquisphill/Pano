# Phase 4 check: the dashboard runs the shared Paño, with its own adapter and the Claude chat as a skill.
# Serve the Dashboard-DEV repo with tests/serve.py on port 8773, then: python3 tests/dash.py
# Every numbered line should end in True, and each "errors" line should be [].
# Nothing here reaches the outside world: the labs list, the weather, the staging preview and the
# Claude API are all answered by the test itself. No real key is used or needed.
# It also runs against the real dashboard (phase 5). It tells the two apart by the page itself:
# Dashboard-DEV has Launch turned off (LAUNCH_OFF) and saves under dev- names; the real one does
# neither. On the real one, GitHub is answered by the test too, so Launch never reaches GitHub.
import json, re, urllib.request
from playwright.sync_api import sync_playwright
U = 'http://localhost:8773/index.html'
get = lambda path: urllib.request.build_opener(urllib.request.ProxyHandler({})).open(U.rsplit('/', 1)[0] + path).read().decode('utf-8')
EARLY, LATE = ['tours', 'background', 'windows', 'bin'], ['talks', 'topics', 'chat']
ON_HERE = ['tours', 'background', 'talks', 'topics', 'chat']
core, brain = json.loads(get('/Pano/latest/brain/core.json')), json.loads(get('/Pano/latest/brain/dashboard.json'))
engine = get('/Pano/latest/pano.js')
skills = {n: get(f'/Pano/latest/skills/{n}.js') for n in EARLY + LATE}
code = engine + ''.join(skills.values())
page = get('/index.html')
P = 'dev-' if 'LAUNCH_OFF' in page else ''   # the prefix this copy's saved names carry
REAL = not P
N = lambda js: js.replace('dev-pd-', P + 'pd-')   # DEV names in a check, as this copy spells them
print('site', 'the real dashboard' if REAL else 'Dashboard-DEV')


def merge(a, b):
    if not isinstance(a, dict) or not isinstance(b, dict): return a if b is None else b
    return {k: merge(a.get(k), b.get(k)) if k in a and k in b else (b[k] if k in b else a[k]) for k in {**a, **b}}


L = merge(core['lines'], brain['lines'])
M, T, TK, TP, CH = L['menu'], L['tour'], L['talks'], L['topics'], L['chat']
TOURS = [brain['tours'][k]['label'] for k in brain['menu']['show']]
MENU0 = TOURS + [M['change_background'], TK['menu_button'], TP['menu_button'], CH['menu_give'], M['leave_first']]
KEY = 'sk-ant-api03-' + 'x' * 40   # shaped like a key; it is not one
FAKE = {'reply': 'Faked reply from the test.', 'go': 'tour:weather'}
LABS = {'prototypes': [{'slug': 'one', 'title': 'Test prototype one', 'summary': 'Sample.', 'date': '2026-11-22', 'url': 'labs/one.html'},
                       {'slug': 'two', 'title': 'Test prototype two', 'summary': 'Sample.', 'date': '2026-11-21', 'url': 'labs/two.html'}]}
CORS = {'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*'}


def strings(v):
    if isinstance(v, str): yield v
    elif isinstance(v, dict):
        for k, x in v.items():
            if not k.startswith('_'): yield from strings(x)
    elif isinstance(v, list):
        for x in v: yield from strings(x)


def has(path):
    v = L
    for k in path.split('.'):
        if not isinstance(v, dict): return True
        if k not in v: return False
        v = v[k]
    return True


spoken = [s for s in strings(brain['lines']) if len(s) > 14]
spoken += [st['say'] for t in brain['tours'].values() if isinstance(t, dict) for st in t['steps']]
spoken += [n['say'] for t in brain['talks']['scripts'].values() for n in t['nodes'] if 'say' in n]
spoken += [s for s in strings(brain['claude_chat']['system']) if len(s) > 14] + [s for q in brain['claude_chat']['quick_replies'] for s in strings(q['reply']) if len(s) > 14]
used = sorted(set(re.findall(r'\bL\.([a-z_]+(?:\.[a-z_]+)*)', ''.join(engine + skills[n] for n in ON_HERE))))
print('files 1 the page no longer carries his body, engine or chat', not [w for w in ['id="gcat"', 'function moveCat', '.gcat{', 'askClaude', 'SYSTEM_BASE', 'runTalk', 'api.anthropic.com'] if w in page])
print('files 2 the page carries none of his lines', not [s for s in spoken if s in page], [s for s in spoken if s in page][:3])
print('files 3 his engine and skills carry none of his lines', not [s for s in spoken if s in code], [s for s in spoken if s in code][:3])
print('files 4 every line the engine and these skills ask for is in the brain', all(has(u) for u in used), [u for u in used if not has(u)])
print('files 5 the three new skills are their own files and say what they need', all(re.search(r"Pano\.skill\('%s',\s*\{\s*needs: \['%s'\]" % (n, n), skills[n]) for n in LATE))
print('files 6 every tour and talk the menu or a button names exists', all(k in brain['tours'] for k in brain['menu']['show'] + brain['menu']['show_later'])
      and all(k in brain['talks']['scripts'] for k in brain['talks']['order'] + brain['talks']['small']))
ADAPTER = {n: re.search(r'^    %s[:,].*\n' % n, page, re.M) for n in ['tours', 'background', 'talks', 'topics', 'chat']}
print('files 7 the page adapter has one line for each skill', all(ADAPTER.values()))
_names = re.findall(r"(?:wall|cb|key|mem|seen|greeted|head): '([^']+)'", page)
if REAL: print('files 8 every name the page saves under is the real dashboard\'s own (pd-, no dev-)', bool(_names) and all(k.startswith('pd-') for k in _names), _names)
else: print('files 8 every name the page saves under starts with dev-', all(k.startswith('dev-') for k in _names))

MENU = "()=>[...document.querySelectorAll('#gacts button')].map(b=>b.textContent)"
ON = "()=>Pano.here.skills().filter(s=>s.on).map(s=>s.name)"
SAY = "()=>document.getElementById('gbubble').hidden?'':document.getElementById('gsay').innerText"


class Site:
    """One browser tab on the dashboard, with everything outside it answered here."""
    def __init__(self, b, W=1280, H=800, greeted=True, store=None, html=None, block=None, api=None, session=None):
        self.c = b.new_context(viewport={'width': W, 'height': H}, has_touch=W <= 640)
        init = ''.join("try{if(!sessionStorage.getItem('__t'))localStorage.setItem(%s,%s)}catch(e){}" % (json.dumps(k), json.dumps(v)) for k, v in (store or {}).items())
        if greeted: init += N("try{sessionStorage.setItem('dev-pd-pano-greeted','1')}catch(e){}")
        init += ''.join("try{if(!sessionStorage.getItem('__t'))sessionStorage.setItem(%s,%s)}catch(e){}" % (json.dumps(k), json.dumps(v)) for k, v in (session or {}).items())
        self.c.add_init_script(init + "try{sessionStorage.setItem('__t','1')}catch(e){}")   # planted once, so a reload keeps what the page saved
        self.pg = pg = self.c.new_page(); self.errs = []; self.got = []; self.calls = []; self.asked = []; self.dispatched = []
        self.api = api or (lambda kind, body: (200, {'data': []}) if kind == 'models' else (200, {'content': [{'type': 'text', 'text': json.dumps(FAKE)}], 'stop_reason': 'end_turn'}))
        pg.on('pageerror', lambda e: self.errs.append(str(e)))
        pg.on('response', lambda r: self.got.append((r.url.split('localhost:8773')[-1], r.status)))
        pg.on('request', lambda r: self.calls.append(r.url) if 'api.github.com' in r.url else None)
        pg.route('**/*', self.outside)
        if html is not None: pg.route('**/index.html', lambda r: r.fulfill(status=200, content_type='text/html; charset=utf-8', body=html))
        if block: pg.route(block, lambda r: r.abort())
        pg.goto(U); pg.wait_for_timeout(2600)

    def outside(self, r):
        url = r.request.url
        if 'localhost:8773' in url: return r.fallback()
        if 'api.anthropic.com' in url:
            if r.request.method == 'OPTIONS': return r.fulfill(status=204, headers=CORS)
            kind = 'models' if '/v1/models' in url else 'messages'
            body = json.loads(r.request.post_data) if r.request.post_data else None
            self.asked.append({'kind': kind, 'headers': r.request.headers, 'body': body})
            status, out = self.api(kind, body)
            return r.fulfill(status=status, headers=CORS, content_type='application/json', body=json.dumps(out))
        if REAL and 'api.github.com' in url:   # the real page can Launch: answer GitHub here, never the real one
            if r.request.method == 'OPTIONS': return r.fulfill(status=204, headers=CORS)
            if '/dispatches' in url:
                self.dispatched.append(json.loads(r.request.post_data)); return r.fulfill(status=204, headers=CORS)
            return r.fulfill(status=200, headers=CORS, content_type='application/json', body=json.dumps({'workflow_runs': []}))
        if 'labs.json' in url: return r.fulfill(status=200, headers=CORS, content_type='application/json', body=json.dumps(LABS))
        if 'marquisphill.github.io' in url: return r.fulfill(status=200, content_type='text/html', body='<p>staging stand-in</p>')
        return r.abort()   # weather and anything else: offline

    def say(self): return self.pg.evaluate(SAY)
    def menu(self): return self.pg.evaluate(MENU)
    def wait(self, ms): self.pg.wait_for_timeout(ms)

    def until(self, text, ms=6000):
        t = 0
        while t < ms:
            if text in self.say(): return True
            self.wait(150); t += 150
        return False

    def tap(self, label, wait=1500):
        self.pg.evaluate("l=>[...document.querySelectorAll('#gacts button')].find(b=>b.textContent===l).click()", label); self.wait(wait)

    def open_menu(self):
        self.pg.evaluate("()=>Pano.here.menu('x')"); self.wait(1600)

    def type(self, text, wait=1500):
        self.pg.fill('#gaskIn', text); self.pg.press('#gaskIn', 'Enter'); self.wait(wait)

    def give_key(self, key, wait=1500):
        self.pg.fill('#gkeyIn', key); self.pg.press('#gkeyIn', 'Enter'); self.wait(wait)

    def cat(self):
        return self.pg.evaluate("()=>{const g=document.getElementById('gcat'),r=g.getBoundingClientRect();return {x:r.left,y:r.top,w:r.width,h:r.height,head:g.classList.contains('head'),hidden:g.hidden}}")

    def head_within(self, ms):
        t = 0
        while t < ms:
            if self.cat()['head']: return round(t / 1000, 1)
            self.wait(250); t += 250
        return None

    def done(self, tag):
        print(tag, 'errors', self.errs); self.c.close()


with sync_playwright() as p:
    b = p.chromium.launch()

    # ---------- the page as it is, at three sizes ----------
    for tag, W, H in [('phone', 390, 800), ('fold', 880, 900), ('desk', 1280, 800)]:
        s = Site(b, W, H, greeted=False, store=None if REAL else {'pd-gh-token': 'FAKE_REAL_TOKEN', 'pd-pano-key': 'FAKE_REAL_KEY'}); s.wait(900)
        files = ['/Pano/latest/pano.css', '/Pano/latest/pano.js', '/Pano/latest/brain/dashboard.json', '/Pano/latest/brain/core.json'] + [f'/Pano/latest/skills/{n}.js' for n in EARLY + LATE]
        print(tag, '1 his files came from /Pano/latest/', all((f, 200) in s.got for f in files), [f for f in files if (f, 200) not in s.got])
        print(tag, '2 tours, background, talks, topics and chat are on; windows and bin are off', s.pg.evaluate(ON) == ON_HERE)
        said = s.say()
        print(tag, '3 he says hello with the line in the brain', TK['hello']['tail'].strip() in said and T['intro'] in said)
        print(tag, '4 his menu is tours, background, talk, ask, brain, leave', s.menu() == MENU0, s.menu() if s.menu() != MENU0 else '')
        c = s.cat(); bub = s.pg.evaluate("()=>{const r=gbubble.getBoundingClientRect();return [r.left,r.top,r.right,r.bottom]}")
        print(tag, '5 he and his bubble are on screen', 0 <= c['x'] and c['x'] + c['w'] <= W and c['y'] + c['h'] <= H and bub[0] >= 0 and bub[1] >= 0 and bub[2] <= W and bub[3] <= H)
        print(tag, '6 the ask box is showing and the key box is not', s.pg.evaluate("()=>!gask.hidden && gkey.hidden && getComputedStyle(gask).display==='flex'"))
        print(tag, '7 his bubble wears the page colors', s.pg.evaluate("()=>getComputedStyle(gbubble).backgroundColor===getComputedStyle(document.documentElement).getPropertyValue('--bubble').trim().replace(/^#(..)(..)(..)$/,(m,r,g,b)=>`rgb(${parseInt(r,16)}, ${parseInt(g,16)}, ${parseInt(b,16)})`)"))
        print(tag, '8 no sideways scroll', s.pg.evaluate("()=>document.documentElement.scrollWidth<=innerWidth+1"))
        keys = s.pg.evaluate("()=>[Object.keys(localStorage),Object.keys(sessionStorage)]")
        if REAL:
            print(tag, '9 only the real dashboard\'s own names are saved (no dev-, none of the portfolio\'s)', all(k.startswith(('pd-', 'wx-')) for k in keys[0]) and all(k.startswith('pd-') or k == '__t' for k in keys[1]), keys)
            print(tag, '10 with no key or token saved, nothing was sent to GitHub or Claude', s.menu()[-2] == CH['menu_give'] and s.calls == [] and s.asked == [])
        else:
            print(tag, '9 only dev- names are saved', all(k.startswith('dev-') or k in ('pd-gh-token', 'pd-pano-key') for k in keys[0]) and all(k.startswith('dev-') or k == '__t' for k in keys[1]), keys)
            print(tag, '10 the real key and token are ignored, and nothing was sent to GitHub or Claude', s.menu()[-2] == CH['menu_give'] and s.calls == [] and s.asked == [])
        s.pg.screenshot(path=f'/tmp/pano-qa/dash-{tag}-hello.png')
        s.done(tag)

    # ---------- head mode and dragging ----------
    for tag, W, H in [('phone', 390, 800), ('desk', 1280, 800)]:
        s = Site(b, W, H, greeted=False); s.wait(900)
        s.pg.click('#gacts button:has-text("%s")' % M['leave_first']); s.pg.mouse.move(5, 300)   # a real tap: he only tucks away once he has been touched
        t = s.head_within(16000); c = s.cat()
        print(tag, 'head 1 left alone he tucks away to a head at the top middle', t is not None and abs(c['x'] + c['w'] / 2 - W / 2) < 3 and c['y'] < 20, t)
        sx, sy = c['x'] + c['w'] / 2, c['y'] + c['h'] / 2
        s.pg.mouse.move(sx, sy); s.pg.mouse.down(); s.pg.mouse.move(sx - 60, sy + 40, steps=6); s.pg.mouse.move(90, sy + 120, steps=8); s.pg.mouse.up(); s.wait(500)
        c1 = s.cat()
        print(tag, 'head 2 the head can be dragged, and dragging does not open his menu', c1['head'] and abs(c1['x'] - c['x']) > 40 and s.say() == '')
        s.pg.reload(); s.wait(2600)
        print(tag, 'head 3 after a reload he is still a head, under this site\'s own name', s.cat()['head'] and s.pg.evaluate(N("()=>sessionStorage.getItem('dev-pd-pano-head')==='1' && sessionStorage.getItem('panoHead')===null")))
        s.pg.click('#gcat'); s.wait(1800)
        print(tag, 'head 4 tapping the head brings him back with his menu', not s.cat()['head'] and s.menu()[:3] == TOURS)
        if W > 640:
            c = s.cat(); sx, sy = c['x'] + c['w'] / 2, c['y'] + c['h'] / 2
            s.pg.mouse.move(sx, sy); s.pg.mouse.down(); s.pg.mouse.move(sx - 200, sy + 200, steps=10); s.pg.mouse.up(); s.wait(400)
            c2 = s.cat(); bub = s.pg.evaluate("()=>{const r=gbubble.getBoundingClientRect();return [r.left,r.top,r.right,r.bottom]}")
            print(tag, 'head 5 the whole cat can be dragged and his bubble follows', abs(c2['x'] - c['x'] + 200) < 8 and abs(c2['y'] - c['y'] - 200) < 8 and bub[0] >= 0 and bub[3] <= H and s.say() != '')
        s.done(tag + ' head')

    # ---------- background and colorblind modes ----------
    B = L['background']
    for tag, W, H in [('phone', 390, 800), ('desk', 1280, 800)]:
        s = Site(b, W, H); s.open_menu()
        s.tap(M['change_background'])
        print(tag, 'wall 1 he offers this page\'s three backgrounds', s.menu() == [B['options']['plain'] + B['default_mark'], B['options']['sunrise'], B['options']['ocean'], B['never_mind']])
        s.tap(B['options']['sunrise'], 500); print(tag, 'wall 2 then asks about colorblindness', B['ask_colorblind'] in s.say())
        s.tap(B['no'], 4200)
        print(tag, 'wall 3 the new background is on and saved', s.pg.evaluate(N("()=>document.getElementById('wall').dataset.wall==='sunrise' && localStorage.getItem('dev-pd-wall')==='sunrise' && getComputedStyle(document.getElementById('wall')).backgroundImage.includes('gradient')")))
        s.open_menu(); s.tap(M['change_background']); s.tap(B['options']['ocean'], 500); s.tap(B['yes'], 500)
        print(tag, 'wall 4 he offers the four colorblind modes', s.menu() == [B['modes'][m] for m in ['protan', 'deutan', 'tritan', 'mono']])
        s.tap(B['modes']['protan'], 7000)
        print(tag, 'wall 5 the mode is applied to the whole page and saved', s.pg.evaluate(N("()=>document.documentElement.dataset.cb==='protan' && getComputedStyle(document.documentElement).filter.includes('cb-protan') && localStorage.getItem('dev-pd-cb')==='protan' && document.getElementById('wall').dataset.wall==='ocean'")))
        print(tag, 'wall 6 and he passes on Phill\'s note', B['phill_note'] in s.say() and not s.pg.evaluate("()=>!!document.querySelector('.grayveil,.wipeline,.wallnext')"))
        s.pg.screenshot(path=f'/tmp/pano-qa/dash-{tag}-wall.png')
        s.pg.reload(); s.wait(2000)
        print(tag, 'wall 7 both are still there after a reload', s.pg.evaluate("()=>document.documentElement.dataset.cb==='protan' && document.getElementById('wall').dataset.wall==='ocean'"))
        s.done(tag + ' wall')

    # ---------- tours ----------
    def walk(s, name, limit=10):
        """Press his main button until the tour ends. Returns the step labels seen."""
        seen = []
        for _ in range(limit):
            s.wait(2600)
            m = re.match(r'(.+) · (\d+) of (\d+)', s.say())
            if not m or m.group(1) != name: break
            seen.append((int(m.group(2)), int(m.group(3))))
            s.pg.evaluate("()=>document.querySelector('#gacts button.pri').click()")
        return seen

    for tag, W, H in [('phone', 390, 800), ('fold', 880, 900), ('desk', 1280, 800)]:
        # the weather card did not load (the test keeps it offline): the two-step version
        s = Site(b, W, H); s.open_menu()
        s.tap(TOURS[2], 100)
        seen = walk(s, brain['tours']['weather']['name'])
        print(tag, 'tour 1 weather, card not loaded: two steps', seen == [(1, 2), (2, 2)], seen)
        said = s.say()
        print(tag, 'tour 2 he wraps up and counts what was watched', any(w in said for w in T['wrap']) and '1 of 3' in said and brain['tours']['launch']['name'].lower() in said)
        s.tap(T['back_to_menu'])
        print(tag, 'tour 3 the watched tour is ticked in his menu', s.menu()[:3] == [TOURS[0], TOURS[1], T['seen_mark'] + TOURS[2]] and T['intro'] not in s.say())
        # with a forecast on the card: the five-step version, with the page's own words dropped in
        s.pg.evaluate("""()=>{document.getElementById('wxBody').innerHTML='<div class="wx-now"><span class="wx-temp">81°</span> <span class="wx-cond">Sunny</span></div><div class="wx-stats">Feels like 84</div><div class="wx-days">Mon Tue Wed</div>'}""")
        s.tap(T['seen_mark'] + TOURS[2], 2600)
        print(tag, 'tour 4 weather, card loaded: he reads the place and the temperature off the page', 'Fort Lauderdale' in s.say() and '81° and sunny' in s.say() and '· 1 of 5' in s.say(), s.say()[:90])
        tgt = s.pg.evaluate("()=>{const r=document.querySelector('#wxBody .wx-now').getBoundingClientRect(),g=gring.getBoundingClientRect(),bb=gbubble.getBoundingClientRect();return {in:r.top>=0&&r.bottom<=innerHeight,ring:Math.abs(g.left-(r.left-6))<3&&Math.abs(g.top-(r.top-6))<3,clear:r.bottom<=bb.top||r.top>=bb.bottom||r.right<=bb.left||r.left>=bb.right}}")
        print(tag, 'tour 5 what he points at is on screen, ringed, and not under his bubble', tgt['in'] and tgt['ring'] and tgt['clear'], tgt)
        print(tag, 'tour 6 the ask box is put away during a tour', s.pg.evaluate("()=>gask.hidden"))
        s.pg.screenshot(path=f'/tmp/pano-qa/dash-{tag}-tour.png')
        seen = walk(s, brain['tours']['weather']['name'])
        print(tag, 'tour 7 it runs all five steps', seen == [(i, 5) for i in range(1, 6)], seen)
        s.done(tag + ' weather')

        # the labs bank: he waits for the list, and opening a prototype moves him on by itself
        s = Site(b, W, H); s.open_menu()
        s.tap(TOURS[1], 2800)
        print(tag, 'tour 8 labs: six steps when the list has prototypes', '· 1 of 6' in s.say(), s.say()[:60])
        s.tap('Next', 2800)
        print(tag, 'tour 9 he names the newest prototype', 'Test prototype one' in s.say())
        s.tap('Open it for me', 3200)
        print(tag, 'tour 10 opening it in the preview counts as done, and he moves to step 3', '· 3 of 6' in s.say() and s.pg.evaluate("()=>document.getElementById('pvIframe').getAttribute('src').endsWith('labs/one.html')"))
        seen = walk(s, brain['tours']['labs']['name'])
        print(tag, 'tour 11 it runs to the end', seen == [(3, 6), (4, 6), (5, 6), (6, 6)] and '1 of 3' in s.say(), seen)
        s.done(tag + ' labs')

        # launching, with no token saved: the two token steps come first
        s = Site(b, W, H); s.open_menu()
        s.tap(TOURS[0], 2800)
        print(tag, 'tour 12 launch with no token starts at the gear, six steps', '· 1 of 6' in s.say() and 'gear' in s.say())
        s.tap('Open it for me', 2800)
        print(tag, 'tour 13 opening the settings moves him to the token box', '· 2 of 6' in s.say() and s.pg.evaluate("()=>!document.getElementById('lpSettings').hidden"))
        s.tap(T['stop'], 100)
        print(tag, 'tour 14 Stop ends it with his goodbye', s.until(M['bye']))
        s.done(tag + ' launch no token')

        # launching, with a (fake) token saved on this DEV copy: straight to Feature
        s = Site(b, W, H, store={N('dev-pd-gh-token'): json.dumps('FAKE_DEV_TOKEN')}); s.open_menu()
        s.tap(TOURS[0], 2800)
        print(tag, 'tour 15 launch with a token: four steps, starting at Feature', '· 1 of 4' in s.say() and 'Feature' in s.say())
        s.tap('Next', 600)
        print(tag, 'tour 16 Next waits until a feature is typed', 'Type a feature first' in s.say() and '· 1 of 4' in s.say())
        s.pg.fill('#lpIdea', 'Test <feature>'); s.tap('Next', 2800)
        print(tag, 'tour 17 then Details, which can be skipped', '· 2 of 4' in s.say() and 'Skip' in s.menu())
        s.tap('Skip', 2800)
        print(tag, 'tour 18 the Launch step repeats what was typed, safely', '· 3 of 4' in s.say() and 'Test <feature>' in s.say() and s.pg.evaluate("()=>!document.querySelector('#gsay feature')"))
        s.tap('Launch it for me', 900)
        if REAL:
            d = s.dispatched
            print(tag, 'tour 19 Launch is on: the form sends one launch, with what was typed, to the test\'s stand-in for GitHub', len(d) == 1 and d[0]['ref'] == 'main' and d[0]['inputs']['feature'] == 'Test <feature>' and 'failed' not in s.pg.evaluate("()=>localStorage.getItem('pd-proto-requests-v2')"), d)
        else:
            print(tag, 'tour 19 Launch is off on DEV: the form refuses and nothing is sent to GitHub', 'turned off' in s.pg.inner_text('#lpStatus') and s.calls == [])
        s.done(tag + ' launch')

    # ---------- talks ----------
    for tag, W, H in [('phone', 390, 800), ('desk', 1280, 800)]:
        s = Site(b, W, H); s.open_menu()
        s.tap(TK['menu_button'])
        titles = [brain['talks']['scripts'][k]['menu'] for k in brain['talks']['order']]
        print(tag, 'talk 1 "Talk to Paño" lists the five lessons', s.menu() == titles + [TK['surprise'], TK['back']])
        s.tap(titles[1])
        nodes = brain['talks']['scripts']['builder']['nodes']
        print(tag, 'talk 2 the prompt builder starts', TK['step'].replace('{n}', '1').replace('{total}', str(len(nodes))) in s.say() and nodes[0]['say'] in s.say())
        s.tap(nodes[0]['next'], 500)
        for n in nodes[1:7]:
            s.pg.evaluate("()=>document.querySelector('#gacts button').click()"); s.wait(500)   # the first answer each time
        said = s.say(); B_ = brain['talks']['builder']
        print(tag, 'talk 3 after six taps he has written a prompt from the answers', nodes[7]['say_prompt'] in said and B_['ideas']['skills']['chart'] in said and B_['audience']['recruiter'] in said and B_['cta'] in said)
        s.tap(nodes[7]['next'], 500)
        ends = [e['label'] for e in nodes[8]['end']]
        print(tag, 'talk 4 the last bubble offers to launch it, fill it in, or start over', s.menu()[:3] == ends and TK['other_topics'] in s.menu())
        s.tap(ends[1], 1500)
        print(tag, 'talk 5 "Just fill it in" puts the prompt in the launch card', s.pg.evaluate("()=>document.getElementById('lpIdea').value") == B_['ideas']['skills']['chart'] and B_['cta'] in s.pg.evaluate("()=>document.getElementById('lpNotes').value"))
        saved = s.pg.evaluate(N("()=>[JSON.parse(localStorage.getItem('dev-pd-pano-mem')),JSON.parse(localStorage.getItem('dev-pd-pano-seen'))]"))
        print(tag, 'talk 6 he remembers the prompt and that this talk was heard', saved[0]['prompt']['feature'] == B_['ideas']['skills']['chart'] and saved[1]['talks'] == ['builder'])
        # a lesson with a quiz: a right answer, then his reply leads the next bubble
        s.open_menu(); s.tap(TK['menu_button'])
        print(tag, 'talk 7 the heard talk is ticked', T['seen_mark'] + titles[1] in s.menu())
        s.tap(titles[0]); q = brain['talks']['scripts']['goodPrompt']['nodes']
        s.tap(q[0]['opts'][0]['label'], 500)
        print(tag, 'talk 8 answers are lettered and his reply comes first in the next bubble', s.menu()[:2] == ['A · ' + q[1]['opts'][0]['label'], 'B · ' + q[1]['opts'][1]['label']] and q[0]['opts'][0]['reply'] in s.say())
        s.tap(TK['stop'], 600)
        # a little chat he starts himself
        s.wait(3000); s.pg.evaluate("()=>Pano.here.notice('small-chat')"); s.wait(700)
        teasers = [brain['talks']['scripts'][k]['teaser'] for k in brain['talks']['small']]
        print(tag, 'talk 9 he can start a little chat of his own', any(t in s.say() for t in teasers) and s.menu() == [TK['menu_button'], TK['not_now']])
        s.done(tag + ' talks')

    # ---------- topics: his stories ----------
    for tag, W, H in [('phone', 390, 800), ('desk', 1280, 800)]:
        s = Site(b, W, H); s.open_menu()
        s.tap(TP['menu_button'])
        topics = {t['id']: t for t in core['talk_topics'] + brain['talk_topics']}
        want = [topics[i]['title'] for i in (brain['menu']['talk_starters'] + brain['menu']['more_topics'])[:8]]
        print(tag, 'topic 1 "Ask about Phill" lists his stories from the brain', s.menu() == want + [TP['surprise'], TP['back']])
        s.pg.evaluate("()=>Pano.here.go('topic:case-reports')"); s.wait(1600)
        t = topics['case-reports']
        print(tag, 'topic 2 a story is told a bubble at a time', t['title'] in s.say() and re.sub(r'<[^>]+>', '', t['script'][0])[:40] in s.say())
        for _ in t['script'][1:]: s.tap(TP['next'], 500)
        print(tag, 'topic 3 it ends with where to see it and what to hear next', TP['see_on_portfolio'] in s.menu() and TP['im_good'] in s.menu())
        s.tap(TP['see_on_portfolio'], 1500)
        print(tag, 'topic 4 "See it on the portfolio" opens that part of the staging site in the preview card', s.pg.evaluate("()=>document.getElementById('pvIframe').getAttribute('src')").endswith('#projects') and brain['show_fallback']['say'] in s.say())
        s.open_menu(); s.type('tell me about corner and panela')
        print(tag, 'topic 5 a typed question that matches a story is answered from the brain, with no call to Claude', topics['meet-the-cats']['title'] in s.say() and s.asked == [])
        s.done(tag + ' topics')

    # ---------- Claude chat, with a faked reply ----------
    for tag, W, H in [('phone', 390, 800), ('desk', 1280, 800)]:
        mode = {'models': (401, {'error': {'message': 'invalid x-api-key'}}), 'messages': (200, {'content': [{'type': 'text', 'text': json.dumps(FAKE)}], 'stop_reason': 'end_turn'})}
        s = Site(b, W, H, api=lambda kind, body: mode[kind]); s.open_menu()
        s.type('thanks')
        print(tag, 'chat 1 a quick reply comes from his script', any(r in s.say() for r in brain['claude_chat']['quick_replies'][1]['reply']) and s.menu()[0] == M['show_menu'] and s.asked == [])
        s.type('what is the airspeed of a swallow')
        print(tag, 'chat 2 with no key he says he does not know, and offers to be given a brain', brain['fallbacks']['unknown'] in s.say() and s.menu() == [TP['menu_button'], CH['menu_give'], CH['back_to_menu']] and s.asked == [])
        s.tap(CH['menu_give'], 600)
        print(tag, 'chat 3 he asks for a key: the key box shows and the ask box is put away', CH['paste_key'] in s.say() and s.pg.evaluate("()=>!gkey.hidden && gask.hidden && gkeyIn.type==='password'"))
        s.give_key('ghp_' + 'a' * 30, 500)
        print(tag, 'chat 4 a GitHub token is turned away before anything is sent', CH['wrong_key']['github'] in s.say() and s.asked == [] and s.pg.evaluate("()=>!gkey.hidden"))
        s.give_key(KEY)
        print(tag, 'chat 5 a key Anthropic rejects is not saved', CH['key_check']['invalid'] in s.say() and s.pg.evaluate(N("()=>localStorage.getItem('dev-pd-pano-key')===null")) and [a['kind'] for a in s.asked] == ['models'])
        mode['models'] = (200, {'data': []})
        s.give_key(KEY, 2200)
        print(tag, 'chat 6 a key that checks out is saved on this device under this copy\'s own name only', s.pg.evaluate(N("()=>JSON.parse(localStorage.getItem('dev-pd-pano-key'))")) == KEY and any(k in s.say() for k in CH['key_saved']) and s.menu()[-2] == CH['menu_has']
              and s.pg.evaluate("n=>localStorage.getItem(n)===null", 'dev-pd-pano-key' if REAL else 'pd-pano-key'))   # and not under the other copy's name
        s.type('why is the sky blue', 2200)
        ask = s.asked[-1]; body = ask['body'] or {}
        sysm = body.get('system'); systext = sysm[0]['text'] if isinstance(sysm, list) else (sysm or '')
        enum = (((body.get('output_config') or {}).get('format') or {}).get('schema') or {}).get('properties', {}).get('go', {}).get('enum', [])
        print(tag, 'chat 7 a question he cannot place goes to Claude with the visitor\'s key', ask['kind'] == 'messages' and ask['headers'].get('x-api-key') == KEY and ask['headers'].get('anthropic-version') == brain['claude_chat']['api_version'] and 'authorization' not in ask['headers'])
        print(tag, 'chat 8 the request is the one in the brain: model, effort, a JSON reply', body.get('model') == brain['claude_chat']['model'] and body['output_config']['effort'] == brain['claude_chat']['effort'] and body['output_config']['format']['type'] == 'json_schema' and body['max_tokens'] == brain['claude_chat']['max_tokens'])
        print(tag, 'chat 9 Claude is told who he is, what he knows, and where an answer may send you', brain['claude_chat']['system'][0] in systext and 'KNOWLEDGE:' in systext and 'Corner' in systext and 'tour:weather - ' in systext
              and set(brain['claude_chat']['go']) <= set(enum) and 'topic:meet-the-cats' in enum and body['messages'][-1] == {'role': 'user', 'content': 'why is the sky blue'})
        print(tag, 'chat 10 no key or token is written into what Claude is sent', KEY not in json.dumps(body) and 'FAKE' not in json.dumps(body))
        print(tag, 'chat 11 he says the reply and offers where it points', FAKE['reply'] in s.say() and s.menu() == [TOURS[2], CH['back_to_menu'], CH['im_good']])
        s.pg.screenshot(path=f'/tmp/pano-qa/dash-{tag}-chat.png')
        s.tap(TOURS[2], 2600)
        print(tag, 'chat 12 that button starts the tour', brain['tours']['weather']['name'] + ' · 1 of' in s.say())
        s.tap(T['stop'], 600); s.open_menu()
        s.type('and at night?', 2200)
        msgs = s.asked[-1]['body']['messages']
        print(tag, 'chat 13 the next question carries the last exchange', [m['role'] for m in msgs] == ['user', 'assistant', 'user'] and msgs[1]['content'] == FAKE['reply'])
        mode['messages'] = (200, {'content': [], 'stop_reason': 'refusal'})
        s.type('something refused', 2200)
        print(tag, 'chat 14 a refusal is handled in his own words', CH['errors']['refusal'] in s.say())
        mode['messages'] = (200, {'content': [{'type': 'text', 'text': 'Plain words, not JSON. Still fine.'}], 'stop_reason': 'end_turn'})
        s.type('plain please', 2200)
        print(tag, 'chat 15 a reply that is not JSON is still said', 'Plain words, not JSON.' in s.say())
        mode['messages'] = (429, {'error': {'message': 'rate limited'}})
        s.type('too fast', 2200)
        print(tag, 'chat 16 too many requests: he asks for a minute', CH['errors']['busy'] in s.say())
        mode['messages'] = (401, {'error': {'message': 'invalid x-api-key'}})
        s.type('qqq another question', 2200)
        print(tag, 'chat 17 a key that stops working is forgotten and he asks again', CH['errors']['rejected'] in s.say() and s.pg.evaluate(N("()=>localStorage.getItem('dev-pd-pano-key')===null && !gkey.hidden")))
        print(tag, 'chat 18 every request went to api.anthropic.com and nowhere else', s.calls == [] and all(a['kind'] in ('models', 'messages') for a in s.asked))
        s.done(tag + ' chat')

    # a key already saved: the menu shows his brain, and it can be taken back
    s = Site(b, store={N('dev-pd-pano-key'): json.dumps(KEY)}); s.open_menu()
    print('key 1 with a saved key his menu says so', s.menu()[-2] == CH['menu_has'])
    s.tap(CH['menu_has'], 600)
    print('key 2 the ask box stays while he explains', CH['has_brain'] in s.say() and s.pg.evaluate("()=>!gask.hidden && gkey.hidden"))
    s.tap(CH['forget'], 1800)
    print('key 3 "Forget my brain" removes the key', s.pg.evaluate(N("()=>localStorage.getItem('dev-pd-pano-key')===null")) and s.menu()[-2] == CH['menu_give'])
    s.done('key')

    # ---------- he waits before tucking away: 10s quiet, 20s when waiting on the visitor ----------
    s = Site(b); s.open_menu(); s.pg.mouse.move(5, 300)
    s.pg.evaluate("()=>gbubble.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}))")
    t = s.head_within(26000)
    print('idle 1 with his menu left open he waits about 20s', t is not None and 19 <= t <= 23.5, t)
    s.done('idle')
    s = Site(b); s.open_menu(); s.pg.click('#gaskIn'); s.pg.keyboard.type('still typing')
    s.wait(24000)
    print('idle 2 he never walks off while the visitor is typing to him', not s.cat()['head'] and s.pg.evaluate("()=>document.activeElement.id==='gaskIn'"))
    s.done('idle typing')

    # ---------- take one adapter entry out: that skill goes, the rest stay ----------
    def without(name): return page.replace(ADAPTER[name].group(0), '')

    s = Site(b, html=without('chat')); s.open_menu()
    print('no chat 1 without the chat entry there is no ask box, no key box and no brain button', s.pg.evaluate("()=>!document.getElementById('gask') && !document.getElementById('gkey')") and s.menu() == [m for m in MENU0 if m != CH['menu_give']])
    print('no chat 2 and the chat file is never fetched', ('/Pano/latest/skills/chat.js', 200) not in s.got and s.pg.evaluate("()=>Pano.here.skills().find(s=>s.name==='chat')") == {'name': 'chat', 'on': False, 'why': 'this page has no chat'})
    s.done('no chat')
    s = Site(b, html=without('talks')); s.open_menu()
    print('no talks 1 no "Talk to Paño", and his hello falls back to the plain line', s.menu() == [m for m in MENU0 if m != TK['menu_button']] and ('/Pano/latest/skills/talks.js', 200) not in s.got)
    s.tap(TOURS[2], 100); walk(s, brain['tours']['weather']['name'])
    print('no talks 2 a tour still wraps up', '1 of 3' in s.say())
    s.done('no talks')
    s = Site(b, html=without('topics')); s.open_menu()
    print('no topics 1 no "Ask about Phill"', s.menu() == [m for m in MENU0 if m != TP['menu_button']])
    s.type('tell me about corner and panela')
    print('no topics 2 and a typed question about the cats gets the honest "I don\'t know"', brain['fallbacks']['unknown'] in s.say() and s.menu() == [CH['menu_give'], CH['back_to_menu']])
    s.done('no topics')
    s = Site(b, html=without('background')); s.open_menu()
    print('no background 1 no background button', s.menu() == [m for m in MENU0 if m != M['change_background']])
    s.done('no background')
    s = Site(b, html=without('tours')); s.open_menu()
    print('no tours 1 without the page\'s readers he offers none of these tours', s.menu() == MENU0[3:])
    s.done('no tours')

    # ---------- if his files or his brain cannot be fetched, the dashboard still works ----------
    s = Site(b, block='**/Pano/latest/**')
    print('nopano 1 no cat, and the cards are all there', s.pg.evaluate("()=>!document.getElementById('gcat') && document.querySelectorAll('section.card').length===3 && document.getElementById('clkH').textContent!=='--'"))
    s.done('nopano')
    s = Site(b, block='**/Pano/latest/brain/core.json')
    print('nobrain 1 without his brain he stays hidden', s.pg.evaluate("()=>document.getElementById('gcat').hidden && document.getElementById('gbubble').hidden"))
    s.done('nobrain')

    # ---------- the tours that are written but not offered yet: add each to the menu and walk it ----------
    for key in brain['menu']['show_later']:
        later = json.loads(json.dumps(brain)); later['menu']['show'] = [key]
        for tag, W, H in [('phone', 390, 800), ('desk', 1280, 800)]:
            s = Site(b, W, H)
            s.pg.route('**/Pano/latest/brain/dashboard.json', lambda r: r.fulfill(status=200, content_type='application/json', body=json.dumps(later)))
            s.pg.reload(); s.wait(2600); s.open_menu()
            s.tap(brain['tours'][key]['label'], 100)
            n = len(brain['tours'][key]['steps']); seen = walk(s, brain['tours'][key]['label'])
            print('later', key, tag, 'steps shown', len(seen), 'of', n, '| finished', '1 of 1' in s.say(), '| errors', s.errs); s.c.close()
    b.close()
