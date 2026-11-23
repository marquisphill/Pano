# Phase 3 check: each of Paño's abilities is a skill in latest/skills/, and a skill is offered
# only when the page's adapter has what it needs.
# Serve the site with tests/serve.py, then: python3 tests/skills.py
# Every numbered line should end in True, and "errors" should be [].
import json, re, urllib.request
from playwright.sync_api import sync_playwright
U = 'http://localhost:8773/index.html'
get = lambda path: urllib.request.build_opener(urllib.request.ProxyHandler({})).open(U.rsplit('/', 1)[0] + path).read().decode('utf-8')
NAMES = ['tours', 'background', 'windows', 'bin']
engine = get('/Pano/latest/pano.js')
files = {n: get(f'/Pano/latest/skills/{n}.js') for n in NAMES}
brain = json.loads(get('/Pano/latest/brain/portfolio.json'))
page = get('/index.html')
M = brain['lines']['menu']
TOURS = [brain['tours'][k]['label'] for k in brain['menu']['show']]
OPEN = "k=>document.querySelector(`[data-open=\"${k}\"]`).click()"
MENU = "()=>[...document.querySelectorAll('#gacts button')].map(b=>b.textContent)"
ON = "()=>Pano.here.skills().filter(s=>s.on).map(s=>s.name)"

print('files 1 each skill is its own file and says what it needs', all(re.search(r"Pano\.skill\('%s',\s*\{\s*needs: \[" % n, files[n]) for n in NAMES))
print('files 2 the engine carries none of the skills', not [w for w in ['askWall', 'applyLook', 'eatWindows', 'organizeWindows', 'refuseRecycle', 'overBin', 'readTarget', 'grayveil', 'eatlayer'] if w in engine])
# (since phase 4 the engine also knows skills a page must ask for; these four are the ones loaded on every page)
print('files 3 the engine lists the same skills', re.search(r"const EARLY = \[([^\]]*)\]", engine).group(1).replace("'", '').split(', ') == NAMES)
ADAPTER = {n: re.search(r'^    %s: .*\n' % n, page, re.M) for n in NAMES}
print('files 4 the page adapter has one line for each skill', all(ADAPTER.values()))


def fresh(b, W=1280, H=800, greeted=False, html=None, block=None, init=None):
    c = b.new_context(viewport={'width': W, 'height': H}, has_touch=W <= 640)
    if greeted: c.add_init_script("try{sessionStorage.setItem('catGreeted','1')}catch(e){}")
    if init: c.add_init_script(init)
    pg = c.new_page(); errs = []; got = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.on('response', lambda r: got.append((r.url.split('localhost:8773')[-1], r.status)))
    if html is not None: pg.route('**/index.html', lambda r: r.fulfill(status=200, content_type='text/html; charset=utf-8', body=html))
    if block: pg.route(block, lambda r: r.abort())
    pg.goto(U); pg.wait_for_timeout(3000)
    return c, pg, errs, got


def open_wins(pg, keys):
    for k in keys:
        pg.evaluate(OPEN, k); pg.wait_for_timeout(800)


def drag_to_bin(pg):
    pg.evaluate("()=>document.getElementById('gx').click()"); pg.wait_for_timeout(1500)
    c = pg.evaluate("()=>{const r=gcat.getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2]}")
    t = pg.evaluate("()=>{const r=document.querySelector('.dicon[data-open=\"folder:recycle\"]').getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2]}")
    pg.mouse.move(*c); pg.mouse.down(); pg.mouse.move(c[0] - 30, c[1] - 30, steps=4); pg.mouse.move(*t, steps=12); pg.wait_for_timeout(200)
    wary = pg.evaluate("()=>gcat.classList.contains('wary')")
    pg.mouse.up(); pg.wait_for_timeout(3200)
    return wary, pg.evaluate("()=>gcat.classList.contains('meh')||gcat.classList.contains('lick')"), (pg.inner_text('#gsay') if pg.is_visible('#gbubble') else '')


with sync_playwright() as p:
    b = p.chromium.launch()

    # the page as it is: every skill on
    for tag, W, H in [('phone', 390, 800), ('fold', 880, 900), ('desk', 1280, 800)]:
        c, pg, errs, got = fresh(b, W, H)
        print(tag, '1 the four skill files came from /Pano/latest/skills/', all((f'/Pano/latest/skills/{n}.js', 200) in got for n in NAMES))
        print(tag, '2 all four skills are on', pg.evaluate(ON) == NAMES)
        print(tag, '3 his menu is tours, then background, then leave', pg.evaluate(MENU) == TOURS + [M['change_background'], M['leave_first']])
        open_wins(pg, ['app:contact', 'app:skills'])
        pg.evaluate("()=>document.getElementById('gx').click()"); pg.wait_for_timeout(1200)
        pg.click('#gcat'); pg.wait_for_timeout(1800)
        extra = ([] if W <= 640 else [M['organize']]) + [M['close_all']]
        print(tag, '4 with two windows open the windows skill adds its buttons', pg.evaluate(MENU) == TOURS + [M['change_background']] + extra + [M['leave_first']])
        print(tag, 'errors', errs); c.close()

    # a saved background is on the page before it is first shown (the skills are ready when the page starts him)
    # (DEV saves it as dev-pf-wall, staging and production as pf-wall; both are set so it works on either)
    c, pg, errs, got = fresh(b, init="""try{localStorage.setItem('dev-pf-wall','black');localStorage.setItem('pf-wall','black')}catch(e){}
        document.addEventListener('DOMContentLoaded',()=>{window.__wallAtStart=document.getElementById('desktop').dataset.wall||''})""")
    print('saved 1 the saved background is set as the page finishes loading', pg.evaluate("()=>window.__wallAtStart") == 'black')
    print('saved errors', errs); c.close()

    # take one adapter entry out of the page: that skill goes, the others stay, nothing breaks
    def without(name):
        return page.replace(ADAPTER[name].group(0), '')

    c, pg, errs, got = fresh(b, html=without('tours'))
    print('no tours 1 skill is on but offers no tour (this page cannot read the steps)', pg.evaluate("()=>Pano.here.skills().find(s=>s.name==='tours').on") and pg.evaluate(MENU) == [M['change_background'], M['leave_first']])
    print('no tours errors', errs); c.close()

    c, pg, errs, got = fresh(b, html=without('background'))
    print('no background 1 skill is off and says why', pg.evaluate("()=>Pano.here.skills().find(s=>s.name==='background')") == {'name': 'background', 'on': False, 'why': 'this page has no background'})
    print('no background 2 his menu has no background button', pg.evaluate(MENU) == TOURS + [M['leave_first']])
    pg.click(f'#gacts button:has-text("{brain["tours"]["contact"]["label"]}")'); pg.wait_for_timeout(2500)
    print('no background 3 a tour still runs', bool(re.match(r'Step 1 of', pg.inner_text('#gsay'))))
    print('no background errors', errs); c.close()

    c, pg, errs, got = fresh(b, html=without('windows'), greeted=True)
    open_wins(pg, ['app:contact', 'app:skills', 'app:resume', 'folder:projects'])
    pg.wait_for_timeout(1500)
    print('no windows 1 four windows open and he makes no clean-up offer', pg.evaluate("()=>document.querySelectorAll('#layer .window').length===4 && gbubble.hidden"))
    pg.click('#gcat'); pg.wait_for_timeout(1800)
    print('no windows 2 his menu has no window buttons', pg.evaluate(MENU) == TOURS + [M['change_background'], M['leave_first']])
    pg.keyboard.press('Escape'); pg.wait_for_timeout(600); pg.keyboard.press('Escape'); pg.wait_for_timeout(900)
    print('no windows 3 closing a window still works', pg.evaluate("()=>document.querySelectorAll('#layer .window').length===3"))
    print('no windows errors', errs); c.close()

    c, pg, errs, got = fresh(b)
    wary, sulk, said = drag_to_bin(pg)
    print('bin 1 with the bin entry he refuses to be recycled', wary and sulk and brain['lines']['bin']['refuse'] in said)
    print('bin errors', errs); c.close()
    c, pg, errs, got = fresh(b, html=without('bin'))
    wary, sulk, said = drag_to_bin(pg)
    print('no bin 1 without it he can be dropped there and nothing happens', not wary and not sulk and said == '')
    print('no bin 2 the other three skills are on', pg.evaluate(ON) == ['tours', 'background', 'windows'])
    print('no bin errors', errs); c.close()

    # a skill file that cannot be fetched: he goes without that one skill
    c, pg, errs, got = fresh(b, block='**/Pano/latest/skills/background.js')
    print('blocked 1 he still appears, without the background skill', pg.evaluate(MENU) == TOURS + [M['leave_first']] and pg.evaluate(ON) == ['tours', 'windows', 'bin'])
    print('blocked errors', errs); c.close()

    # his file added to a page that has already loaded: the skills are fetched and he waits for them
    late = page.replace('<script src="/Pano/latest/pano.js"></script>', '')
    late = late.replace('const pano = window.Pano ? Pano.init({', 'let pano = null; const __adapter = () => ({', 1).replace('  }) : null;\n})();', '  });\n  window.__startPano = () => { pano = Pano.init(__adapter()); };\n})();', 1)
    c, pg, errs, got = fresh(b, html=late)
    pg.evaluate("()=>new Promise(done=>{const s=document.createElement('script');s.src='/Pano/latest/pano.js';s.onload=()=>{__startPano();done()};document.body.appendChild(s)})")
    pg.wait_for_timeout(3000)
    print('late 1 added after the page loaded, he still gets all four skills and his menu', pg.evaluate(ON) == NAMES and pg.evaluate(MENU) == TOURS + [M['change_background'], M['leave_first']])
    print('late errors', errs); c.close()
    b.close()
