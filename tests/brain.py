# Phase 2 check: what Paño says comes from his brain (latest/brain/portfolio.json), not from code.
# Serve the site with tests/serve.py, then: python3 tests/brain.py
# Every numbered line should end in True, and "errors" should be [].
# The "later" lines at the end walk the tours that are written but not in his menu yet.
import json, re, urllib.request
from playwright.sync_api import sync_playwright
U = 'http://localhost:8773/index.html'
BRAIN = '/Pano/latest/brain/portfolio.json'
# read his files from the served copy, the same ones the page gets
get = lambda path: urllib.request.build_opener(urllib.request.ProxyHandler({})).open(U.rsplit('/', 1)[0] + path).read().decode('utf-8')
brain = json.loads(get(BRAIN))
engine = get('/Pano/latest/pano.js')
PAGE_OWN = ['Tap a file to open it.']   # the portfolio's file explorer says this itself, in its own hint
OPEN = "k=>document.querySelector(`[data-open=\"${k}\"]`).click()"


def strings(v):
    if isinstance(v, str): yield v
    elif isinstance(v, dict):
        for k, x in v.items():
            if not k.startswith('_'): yield from strings(x)
    elif isinstance(v, list):
        for x in v: yield from strings(x)


def has(path):
    v = brain['lines']
    for k in path.split('.'):
        if not isinstance(v, dict): return True   # reached a line or a list; what follows is code (.length, .reduce)
        if k not in v: return False
        v = v[k]
    return True


spoken = [s for s in strings(brain['lines']) if len(s) > 12] + [st['say'] for t in brain['tours'].values() if isinstance(t, dict) for st in t['steps']]
used = sorted(set(re.findall(r'\bL\.([a-z_]+(?:\.[a-z_]+)*)', engine)))
print('files 1 every line the engine asks for is in the brain', all(has(u) for u in used), [u for u in used if not has(u)])
print('files 2 the engine carries none of his lines', not [s for s in spoken if s in engine])
print('files 3 every tour in the menu exists', all(k in brain['tours'] for k in brain['menu']['show'] + brain['menu'].get('show_later', [])))


def fresh(b, W=1280, H=800, greeted=False):
    c = b.new_context(viewport={'width': W, 'height': H}, has_touch=W <= 640)
    if greeted: c.add_init_script("try{sessionStorage.setItem('catGreeted','1')}catch(e){}")
    pg = c.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    return c, pg, errs


with sync_playwright() as p:
    b = p.chromium.launch()

    # the page as it is
    for tag, W, H in [('phone', 390, 800), ('fold', 880, 900), ('desk', 1280, 800)]:
        c, pg, errs = fresh(b, W, H); got = []
        pg.on('response', lambda r: got.append((r.url.split('localhost:8773')[-1], r.status)))
        pg.goto(U); pg.wait_for_timeout(3000)
        html = pg.evaluate("fetch(location.href).then(r=>r.text())")
        print(tag, '1 his brain came from', BRAIN, (BRAIN, 200) in got)
        print(tag, '2 the page file carries none of his lines', not [s for s in spoken if s in html and s not in PAGE_OWN])
        print(tag, '3 he greets with the line in the brain', brain['lines']['hello'] in pg.inner_text('#gsay'))
        labels = pg.evaluate("()=>[...document.querySelectorAll('#gacts button')].map(b=>b.textContent)")
        want = [brain['tours'][k]['label'] for k in brain['menu']['show']] + [brain['lines']['menu']['change_background'], brain['lines']['menu']['leave_first']]
        print(tag, '4 his menu is the one in the brain', labels == want)
        print(tag, '5 his labels for screen readers are set', pg.evaluate("()=>[gcat,gbubble,gx].map(e=>e.getAttribute('aria-label'))") == [brain['lines']['labels']['cat_button'], brain['lines']['name'], brain['lines']['labels']['close']])
        print(tag, 'errors', errs); c.close()

    # a line, a tour step, a label and the menu order can be changed by editing JSON only
    edited = json.loads(json.dumps(brain))
    edited['lines']['hello'] = 'Edited hello from the brain.'
    edited['lines']['tour']['stop'] = 'Edited stop'
    edited['tours']['contact']['steps'][0]['say'] = 'Edited first step. Click <b>Contact</b>.'
    edited['tours']['contact']['label'] = 'Edited contact label'
    edited['menu']['show'] = ['contact', 'resume']
    c, pg, errs = fresh(b)
    pg.route('**' + BRAIN, lambda r: r.fulfill(status=200, content_type='application/json', body=json.dumps(edited)))
    pg.goto(U); pg.wait_for_timeout(3000)
    print('edit 1 the greeting changed', 'Edited hello from the brain.' in pg.inner_text('#gsay'))
    labels = pg.evaluate("()=>[...document.querySelectorAll('#gacts button')].map(b=>b.textContent)")
    print('edit 2 the menu changed', labels[:3] == ['Edited contact label', brain['tours']['resume']['label'], brain['lines']['menu']['change_background']])
    pg.click('#gacts button:has-text("Edited contact label")'); pg.wait_for_timeout(2500)
    print('edit 3 the tour step changed', 'Edited first step. Click Contact.' in pg.inner_text('#gsay'))
    print('edit 4 a button changed', 'Edited stop' in pg.evaluate("()=>[...document.querySelectorAll('#gacts button')].map(b=>b.textContent)"))
    print('edit errors', errs); c.close()

    # if his brain cannot be fetched he stays hidden and the page still works
    c, pg, errs = fresh(b)
    pg.route('**/Pano/latest/brain/**', lambda r: r.abort())
    pg.goto(U); pg.wait_for_timeout(3000)
    for k in ['app:contact', 'app:skills', 'app:resume', 'folder:projects']:
        pg.evaluate(OPEN, k); pg.wait_for_timeout(800)
    print('nobrain 1 he stays hidden, bubble too, and four windows open', pg.evaluate("()=>gcat.hidden && gbubble.hidden && document.querySelectorAll('#layer .window').length===4"))
    pg.keyboard.press('Escape'); pg.wait_for_timeout(900)
    print('nobrain 2 Escape still closes the top window', pg.evaluate("()=>document.querySelectorAll('#layer .window').length===3"))
    print('nobrain errors', errs); c.close()

    # the tours that are written but not offered yet: add each to the menu and walk it with his buttons
    for key in brain['menu'].get('show_later', []):
        later = json.loads(json.dumps(brain)); later['menu']['show'] = [key]
        for tag, W, H in [('phone', 390, 800), ('desk', 1280, 800)]:
            c, pg, errs = fresh(b, W, H, greeted=True)
            pg.route('**' + BRAIN, lambda r: r.fulfill(status=200, content_type='application/json', body=json.dumps(later)))
            pg.goto(U); pg.wait_for_timeout(2200)
            pg.click('#gcat'); pg.wait_for_timeout(1500)
            pg.click(f'#gacts button:has-text("{brain["tours"][key]["label"]}")')
            steps = len(brain['tours'][key]['steps']); seen = 0; end = ''
            for _ in range(steps + 2):
                pg.wait_for_timeout(3000)
                end = pg.inner_text('#gsay') if pg.is_visible('#gbubble') else ''
                if not re.match(r'Step \d+ of', end): break
                seen += 1
                btn = pg.query_selector('#gacts button.pri')
                if not btn: break
                btn.click()
            print('later', key, tag, 'steps shown', seen, 'of', steps, '| finished', brain['lines']['menu']['after_tour'] in end, '| errors', errs)
            c.close()
    b.close()
