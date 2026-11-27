# Kit check (K2 in PANO-KIT-PLAN.md): Pano.check() and kit/brain.schema.json.
# Uses the fictional kite shop (tests/sites/kite-shop/) and breaks its brain or adapter one way at a time,
# checking that Pano.check() names each mistake and where it is, and that the schema agrees.
# Also (K3): tours that name their pages ("pages"), on the shop's two pages (index.html and visit.html).
# Serves the site itself:
#   python3 tests/kitcheck.py            (port 8791)
#   python3 tests/kitcheck.py 8792
# Needs: pip install playwright==1.63.0 jsonschema
# Every numbered line should end in True, and "errors" should be [].
import copy, json, os, subprocess, sys, time, urllib.request
from jsonschema import Draft202012Validator
from playwright.sync_api import sync_playwright

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8791
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SITE = os.path.join(HERE, 'sites', 'kite-shop')
U = f'http://localhost:{PORT}/index.html'
server = subprocess.Popen([sys.executable, os.path.join(HERE, 'serve.py'), SITE, str(PORT)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
get = lambda path: urllib.request.build_opener(urllib.request.ProxyHandler({})).open(f'http://localhost:{PORT}' + path).read().decode('utf-8')
for _ in range(50):
    try: get('/index.html'); break
    except Exception: time.sleep(.1)

BRAIN = json.loads(get('/pano/brain.json'))
BASE = json.loads(get('/Pano/latest/base.json'))
PAGE = get('/index.html')
SCHEMA = json.load(open(os.path.join(ROOT, 'kit', 'brain.schema.json'), encoding='utf-8'))


def brain(change):
    B = copy.deepcopy(BRAIN); change(B); return B


def has(found, kind, where, bit=''):
    return any(x['kind'] == kind and x['where'] == where and bit in x['say'] for x in found)


# ---------- Pano.check() in the browser ----------
with sync_playwright() as p:
    b = p.chromium.launch()

    def run(brain_body=None, page=None, url=U, menu=False):
        c = b.new_context(viewport={'width': 1280, 'height': 800})
        pg = c.new_page(); errs, logs = [], []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.on('console', lambda m: logs.append(m.text) if m.type == 'log' else None)
        if brain_body is not None:
            body = brain_body if isinstance(brain_body, str) else json.dumps(brain_body)
            pg.route('**/pano/brain.json', lambda r: r.fulfill(status=200, content_type='application/json', body=body))
        if page is not None:
            pg.route('**/index.html', lambda r: r.fulfill(status=200, content_type='text/html; charset=utf-8', body=page))
        pg.goto(url); pg.wait_for_timeout(2500 if menu else 1500)
        r = pg.evaluate("()=>Pano.check()")
        if menu: r['menu'] = pg.evaluate("()=>Pano.here ? [...document.querySelectorAll('#gacts button')].map(b=>b.textContent) : []")
        c.close()
        return r, errs, logs

    errors = []
    r, e, logs = run(); errors += e
    report = next((t for t in logs if t.startswith('Paño check:')), '')
    print('check 1 the kite shop as it is: no problems', r['ok'] and r['problems'] == [], r['problems'])
    print('check 2 its notes: no words for its three backgrounds, and its visit tour is for another page', sorted(x['where'] for x in r['notes']) == ['lines.background.options.dusk', 'lines.background.options.meadow', 'lines.background.options.plain', 'tours.visit'], [x['where'] for x in r['notes']])
    print('check 3 it says which brain files it read', r['brain'] == [f'http://localhost:{PORT}/pano/brain.json', 'base'], r['brain'])
    print('check 4 and prints a report in the console', report.startswith('Paño check: no problems, 4 notes. Brain: ') and 'Skills: tours on; background on; windows off' in report, report.split('\n')[0])

    cases = [
        ('lines 1 a misspelt line', brain(lambda B: B['lines'].update(menu={'aks': 'What now?'})), 'unknown line', 'lines.menu.aks', 'misspelt'),
        ('lines 2 a blank line', brain(lambda B: B['lines'].update(hello='')), 'blank line', 'lines.hello', 'blank'),
        ('lines 3 a line that should be a group', brain(lambda B: B['lines'].update(menu='Hi')), 'missing line', 'lines.menu', 'group'),
        ('lines 4 no extends: whole groups of lines missing', brain(lambda B: B.pop('extends')), 'missing line', 'lines.menu', 'missing'),
        ('tour 1 a step this page cannot read', brain(lambda B: B['tours']['contact']['steps'][0].update(target={'icon': 'mail'})), 'tour left out', 'tours.contact step 1', '"icon"'),
        ('tour 2 a misspelt selector', brain(lambda B: B['tours']['contact']['steps'][1].update(target={'css': '#contact-emial'})), 'target not found', 'tours.contact step 2', '#contact-emial'),
        ('tour 3 a step with no way to move on', brain(lambda B: B['tours']['contact']['steps'][0].pop('next')), 'tour', 'tours.contact step 1', 'no way to move on'),
        ('tour 4 menu.show names a tour that is not there', brain(lambda B: B.update(menu={'show': ['contact', 'kitez']})), 'menu', 'menu.show', '"kitez"'),
        ('tour 5 a misspelt step field', brain(lambda B: B['tours']['contact']['steps'][0].update(sya=B['tours']['contact']['steps'][0].pop('say'))), 'unknown field', 'tours.contact step 1.sya', 'misspelt'),
        ('tour 6 ...and so no "say"', brain(lambda B: B['tours']['contact']['steps'][0].pop('say')), 'tour', 'tours.contact step 1', 'needs "say"'),
        ('tour 7 a selector that is not CSS', brain(lambda B: B['tours']['contact']['steps'][0].update(target={'css': '#contact-form['})), 'tour', 'tours.contact step 1', 'not a valid CSS selector'),
        ('tour 8 "Do it for me" clicks nothing', brain(lambda B: B['tours']['contact']['steps'][0].update(act={'click': '#nope'})), 'target not found', 'tours.contact step 1', 'act.click'),
        ('tour 9 a tour with no label', brain(lambda B: B['tours']['contact'].pop('label')), 'tour', 'tours.contact', 'label'),
        ('brain 1 not valid JSON', '{"extends": "base", oops', 'brain', f'http://localhost:{PORT}/pano/brain.json', 'not valid JSON'),
        ('brain 2 extends itself', brain(lambda B: B.update(extends='brain.json')), 'brain', f'http://localhost:{PORT}/pano/brain.json', 'loop'),
        ('brain 3 extends a file that is not there', brain(lambda B: B.update(extends='bsae.json')), 'brain', f'http://localhost:{PORT}/pano/brain.json', '404'),
    ]
    for label, body, kind, where, bit in cases:
        r, e, _ = run(body); errors += e
        print(label, not r['ok'] and has(r['problems'], kind, where, bit), [(x['where'], x['say'][:70]) for x in r['problems']][:3])

    r, e, _ = run(brain(lambda B: B.pop('extends'))); errors += e
    print('lines 5 ...and a note to build on base', has(r['notes'], 'brain', 'extends', '"extends": "base"'))

    # notes, not problems: a target hidden right now, a field nothing reads, words for a background the page lacks
    r, e, _ = run(brain(lambda B: B['tours']['contact']['steps'][1].update(target={'css': '#sent'}))); errors += e
    print('note 1 a target hidden right now', r['ok'] and has(r['notes'], 'target hidden', 'tours.contact step 2', '#sent'))
    r, e, _ = run(brain(lambda B: B.update(description='Kite shop'))); errors += e
    print('note 2 a field nothing reads', r['ok'] and has(r['notes'], 'unknown field', 'description'))
    r, e, _ = run(brain(lambda B: B['lines'].update(background={'options': {'plain': 'Plain', 'dusk': 'Dusk', 'meadow': 'Meadow', 'sunsett': 'Sunset'}}))); errors += e
    print('note 3 words for a background the page does not have', r['ok'] and has(r['notes'], 'background', 'lines.background.options.sunsett') and [x['where'] for x in r['notes'] if x['kind'] != 'other page'] == ['lines.background.options.sunsett'], [x['where'] for x in r['notes']])
    r, e, _ = run(brain(lambda B: B['tours']['contact']['steps'][1].update(target={'css': '#later-thing'}, act={'click': '#contact-send'}) or B['tours']['contact']['steps'].append({'say': 'And this.', 'target': {'css': '#added-later'}, 'next': 'OK'}))); errors += e
    print('note 4 after a step that does something, a missing target may come later', r['ok'] is False and has(r['problems'], 'target not found', 'tours.contact step 2', '#later-thing') and has(r['notes'], 'target not found', 'tours.contact step 3', '#added-later'))

    # the adapter: a background the page has no style for, a colorblind mode he does not know, no brain at all
    r, e, _ = run(page=PAGE.replace("walls: ['plain', 'dusk', 'meadow']", "walls: ['plain', 'dusk', 'meadow', 'storm']")); errors += e
    print('adapter 1 a background with no style on the page', has(r['problems'], 'background', 'adapter: background.walls', 'data-wall="storm"'))
    r, e, _ = run(page=PAGE.replace("modes: ['protan', 'deutan', 'tritan', 'mono']", "modes: ['protan', 'sepia']")); errors += e
    print('adapter 2 a colorblind mode he does not know', has(r['problems'], 'background', 'adapter: background.modes', '"sepia"'))
    r, e, _ = run(page=PAGE.replace("brain: 'pano/brain.json',", '')); errors += e
    print('adapter 3 no brain named', has(r['problems'], 'brain', 'adapter', 'names no brain'))
    r, e, _ = run(page=PAGE.replace('Pano.init({', 'false && Pano.init({')); errors += e
    print('adapter 4 Pano.init() never ran', not r['ok'] and r['problems'][0]['say'] == 'Pano.init() has not run on this page')
    # ---------- tours that name their pages ("pages"), on the shop's two pages ----------
    V2 = f'http://localhost:{PORT}/visit.html'
    CONTACT, VISIT = BRAIN['tours']['contact']['label'], BRAIN['tours']['visit']['label']
    NAV = {'label': 'Where is everything?', 'steps': [{'say': 'Everything is up here.', 'target': {'css': 'header nav'}, 'next': 'OK'}]}
    r, e, _ = run(menu=True); errors += e
    print('pages 1 index.html: he offers the contact tour, not the visit tour, and says why in a note', r['ok'] and CONTACT in r['menu'] and VISIT not in r['menu'] and has(r['notes'], 'other page', 'tours.visit', '"../visit.html"'), r['menu'])
    r, e, _ = run(url=V2, menu=True); errors += e
    print('pages 2 visit.html: the visit tour, not the contact tour, and no problems', r['ok'] and VISIT in r['menu'] and CONTACT not in r['menu'] and has(r['notes'], 'other page', 'tours.contact', '"../index.html"'), r['menu'], r['problems'])
    for label, url in [('pages 3 "/" is the same page as index.html', f'http://localhost:{PORT}/'), ('pages 4 a query and a hash are ignored', U + '?from=mail#contact')]:
        r, e, _ = run(url=url, menu=True); errors += e
        print(label, r['ok'] and CONTACT in r['menu'] and VISIT not in r['menu'], r['menu'])
    # GitHub Pages serves visit.html at /visit too
    c = b.new_context(viewport={'width': 1280, 'height': 800}); pg = c.new_page(); pg.on('pageerror', lambda e: errors.append(str(e)))
    pg.route('**/visit', lambda r: r.fulfill(status=200, content_type='text/html; charset=utf-8', body=get('/visit.html')))
    pg.goto(f'http://localhost:{PORT}/visit'); pg.wait_for_timeout(2500)
    m = pg.evaluate("()=>[...document.querySelectorAll('#gacts button')].map(b=>b.textContent)")
    print('pages 5 "visit.html" also matches the address /visit', VISIT in m and CONTACT not in m, m)
    c.close()
    both = brain(lambda B: B['tours'].update(nav=NAV, both=dict(NAV, label='Both pages', pages=['../index.html', '../visit.html'])))
    r1, e1, _ = run(both, menu=True); r2, e2, _ = run(both, url=V2, menu=True); errors += e1 + e2
    print('pages 6 a tour with no "pages" is offered on every page, and one naming both pages on both', all(x['ok'] and NAV['label'] in x['menu'] and 'Both pages' in x['menu'] for x in (r1, r2)), r1['menu'], r2['menu'])
    r, e, _ = run(brain(lambda B: B['tours']['visit'].update(pages=['visit.html']))); errors += e
    print('pages 7 an address that is not there (relative to the brain, so pano/visit.html) is a problem, with a hint', has(r['problems'], 'tour', 'tours.visit.pages', '404') and has(r['problems'], 'tour', 'tours.visit.pages', '"../visit.html"'), [x['say'][:110] for x in r['problems']])
    r, e, _ = run(brain(lambda B: B['tours']['visit'].update(pages='../visit.html')), url=V2, menu=True); errors += e
    print('pages 8 "pages" that is not a list is a problem, and the tour is not offered', has(r['problems'], 'tour', 'tours.visit.pages', 'list of page addresses') and VISIT not in r['menu'], r['menu'])
    r, e, _ = run(brain(lambda B: B['tours']['visit'].update(pages=[]))); errors += e
    print('pages 9 an empty list is a problem', has(r['problems'], 'tour', 'tours.visit.pages', 'list of page addresses'))
    broken_visit = brain(lambda B: B['tours']['visit']['steps'][0].update(target={'css': '#hours-crad'}))
    r1, e1, _ = run(broken_visit); r2, e2, _ = run(broken_visit, url=V2); errors += e1 + e2
    print('pages 10 a misspelt target is left alone on other pages, and caught on its own page', r1['ok'] and not r2['ok'] and has(r2['problems'], 'target not found', 'tours.visit step 1', '#hours-crad'))
    r, e, _ = run(brain(lambda B: B['tours'].pop('contact')), menu=True); errors += e
    print('pages 11 no tour for this page: a note, and his menu offers none', r['ok'] and has(r['notes'], 'tour', 'tours', 'none of its tours') and VISIT not in r['menu'], r['menu'])
    # (K4) a tour with no "pages" and the same label as one with "pages" is the way there from every other page:
    # on the page the other one names, he offers that one instead, in the same place in his menu
    WAY = {'label': VISIT, 'steps': [{'say': 'Visits have their own page. Click <b>Visit</b> up here.', 'target': {'css': 'body'}, 'next': 'Got it'}]}
    way = brain(lambda B: B['tours'].update({'visit-here': WAY}))
    way_first = {**{k: v for k, v in BRAIN.items() if k != 'tours'}, 'tours': {'visit-here': WAY, 'contact': BRAIN['tours']['contact'], 'visit': BRAIN['tours']['visit']}}
    r1, e1, _ = run(way, menu=True); r2, e2, _ = run(way, url=V2, menu=True); r3, e3, _ = run(way_first, url=V2, menu=True); errors += e1 + e2 + e3
    print('pages 13 same label: the way there on other pages, the page\'s own tour on its page, once, in the same place',
          r1['ok'] and r1['menu'].count(VISIT) == 1 and r2['ok'] and r2['menu'].count(VISIT) == 1 and r3['menu'].index(VISIT) == 0
          and has(r2['notes'], 'other page', 'tours.visit-here', 'tours.visit'), r1['menu'], r2['menu'], r3['menu'])
    c = b.new_context(viewport={'width': 1280, 'height': 800}); pg = c.new_page()
    pg.route('**/pano/brain.json', lambda r: r.fulfill(status=200, content_type='application/json', body=json.dumps(way)))
    pg.goto(V2); pg.wait_for_timeout(2500)
    pg.evaluate("t=>{const b=[...document.querySelectorAll('#gacts button')].find(b=>b.textContent===t);if(b)b.click()}", VISIT); pg.wait_for_timeout(2500)
    said = pg.evaluate("()=>document.getElementById('gsay').innerText")
    print('pages 14 on its own page, that button starts the page\'s own tour', 'Step 1 of 2' in said and 'opening hours' in said, repr(said[:80]))
    c.close()

    # the visit tour, start to finish on its own page, at phone and desktop sizes
    PRESS = "t=>{const b=[...document.querySelectorAll('#gacts button')].find(b=>b.textContent===t);if(b)b.click();return !!b}"
    SAY = "()=>{const b=document.getElementById('gbubble');return b.hidden?'':document.getElementById('gsay').innerText}"
    for tag, W, H in [('phone', 390, 800), ('desk', 1280, 800)]:
        c = b.new_context(viewport={'width': W, 'height': H}, has_touch=W <= 640); pg = c.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto(V2); pg.wait_for_timeout(3000)
        said = []
        pg.evaluate(PRESS, VISIT); pg.wait_for_timeout(2500); said.append(pg.evaluate(SAY))
        ring = pg.evaluate("()=>{const r=document.querySelector('#hours-card').getBoundingClientRect(),g=document.getElementById('gring');return !g.hidden&&r.top>=0&&r.top<innerHeight}")
        pg.evaluate(PRESS, 'Next'); pg.wait_for_timeout(2500); said.append(pg.evaluate(SAY))
        pg.evaluate(PRESS, 'Take me there'); pg.wait_for_timeout(300)
        focus = pg.evaluate("()=>document.activeElement.id")
        pg.evaluate(PRESS, 'Got it'); pg.wait_for_timeout(2500); said.append(pg.evaluate(SAY))
        print(tag, 'pages 12 the visit tour runs to the end on visit.html', 'Step 1 of 2' in said[0] and ring and 'Step 2 of 2' in said[1] and focus == 'visit-name' and BASE['lines']['menu']['after_tour'] in said[2], said, focus)
        errors += errs
        c.close()
    print('errors', errors)
    b.close()
server.terminate()

# ---------- kit/brain.schema.json ----------
V = Draft202012Validator(SCHEMA)
ok = lambda B: not list(V.iter_errors(B))
Draft202012Validator.check_schema(SCHEMA)
print('schema 1 is a valid JSON Schema', True)
print('schema 2 the kite shop brain fits it', ok(BRAIN), [e.message for e in V.iter_errors(BRAIN)][:3])
every = {'extends': 'base', 'lines': {k: v for k, v in BASE['lines'].items()}, 'tours': BRAIN['tours']}
print('schema 3 a brain that writes out every line in base.json fits it', ok(every), [e.message for e in V.iter_errors(every)][:3])


def paths(d, pre=''):
    for k, v in d.items():
        if k.startswith('_'): continue
        yield pre + k
        if isinstance(v, dict) and k not in ('options', 'modes'): yield from paths(v, pre + k + '.')


def schema_paths(node, pre=''):
    for k, v in node.get('properties', {}).items():
        yield pre + k
        if 'properties' in v and k not in ('options', 'modes'): yield from schema_paths(v, pre + k + '.')


base_lines, schema_lines = set(paths(BASE['lines'])), set(schema_paths(SCHEMA['properties']['lines']))
print('schema 4 it lists exactly the lines base.json has', base_lines == schema_lines, sorted(base_lines ^ schema_lines))
broken = [
    ('a misspelt line', brain(lambda B: B['lines'].update(menu={'aks': 'x'}))),
    ('no name', brain(lambda B: B['lines'].pop('name'))),
    ('a step that points at an icon', brain(lambda B: B['tours']['contact']['steps'][0].update(target={'icon': 'mail'}))),
    ('a step with no next or done', brain(lambda B: B['tours']['contact']['steps'][0].pop('next'))),
    ('a tour with no label', brain(lambda B: B['tours']['contact'].pop('label'))),
    ('an unknown field', brain(lambda B: B.update(description='x'))),
    ('no tours', brain(lambda B: B.update(tours={}))),
]
print('schema 5 it turns away each broken brain', all(not ok(B) for _, B in broken), [n for n, B in broken if ok(B)])
pages_ok = brain(lambda B: B['tours']['contact'].update(pages=['../index.html', '/kites/', 'https://example.com/a.html']))
pages_bad = [brain(lambda B: B['tours']['contact'].update(pages='../index.html')), brain(lambda B: B['tours']['contact'].update(pages=[])), brain(lambda B: B['tours']['contact'].update(pages=['']))]
print('schema 7 "pages" is a list of page addresses: a list fits, a plain string, an empty list or a blank address does not', ok(pages_ok) and not any(ok(B) for B in pages_bad))
print('schema 6 a note for people (a key starting with _) is fine anywhere', ok(brain(lambda B: B.update(_note='hi') or B['lines'].update(_why='x') or B['tours']['contact']['steps'][0].update(_todo='x'))))
