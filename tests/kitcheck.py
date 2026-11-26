# Kit check (K2 in PANO-KIT-PLAN.md): Pano.check() and kit/brain.schema.json.
# Uses the fictional kite shop (tests/sites/kite-shop/) and breaks its brain or adapter one way at a time,
# checking that Pano.check() names each mistake and where it is, and that the schema agrees.
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

    def run(brain_body=None, page=None):
        c = b.new_context(viewport={'width': 1280, 'height': 800})
        pg = c.new_page(); errs, logs = [], []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.on('console', lambda m: logs.append(m.text) if m.type == 'log' else None)
        if brain_body is not None:
            body = brain_body if isinstance(brain_body, str) else json.dumps(brain_body)
            pg.route('**/pano/brain.json', lambda r: r.fulfill(status=200, content_type='application/json', body=body))
        if page is not None:
            pg.route('**/index.html', lambda r: r.fulfill(status=200, content_type='text/html; charset=utf-8', body=page))
        pg.goto(U); pg.wait_for_timeout(1500)
        r = pg.evaluate("()=>Pano.check()")
        c.close()
        return r, errs, logs

    errors = []
    r, e, logs = run(); errors += e
    report = next((t for t in logs if t.startswith('Paño check:')), '')
    print('check 1 the kite shop as it is: no problems', r['ok'] and r['problems'] == [], r['problems'])
    print('check 2 its notes: no words for its three backgrounds', sorted(x['where'] for x in r['notes']) == ['lines.background.options.dusk', 'lines.background.options.meadow', 'lines.background.options.plain'], [x['where'] for x in r['notes']])
    print('check 3 it says which brain files it read', r['brain'] == [f'http://localhost:{PORT}/pano/brain.json', 'base'], r['brain'])
    print('check 4 and prints a report in the console', report.startswith('Paño check: no problems, 3 notes. Brain: ') and 'Skills: tours on; background on; windows off' in report, report.split('\n')[0])

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
    print('note 3 words for a background the page does not have', r['ok'] and has(r['notes'], 'background', 'lines.background.options.sunsett') and len(r['notes']) == 1, [x['where'] for x in r['notes']])
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
print('schema 6 a note for people (a key starting with _) is fine anywhere', ok(brain(lambda B: B.update(_note='hi') or B['lines'].update(_why='x') or B['tours']['contact']['steps'][0].update(_todo='x'))))
