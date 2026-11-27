# Kit check (K1 in PANO-KIT-PLAN.md): Paño on a plain site, with a brain built on base.json.
# The site is tests/sites/kite-shop/, a fictional scrolling page with a form and no window system. Its brain
# has only "extends": "base", a name and one tour made of css steps. This script serves it itself:
#   python3 tests/kitbase.py            (port 8790)
#   python3 tests/kitbase.py 8791
# Every numbered line should end in True, and "errors" should be [].
import json, os, subprocess, sys, time, urllib.request
from playwright.sync_api import sync_playwright

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8790
HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.join(HERE, 'sites', 'kite-shop')
U = f'http://localhost:{PORT}/index.html'
server = subprocess.Popen([sys.executable, os.path.join(HERE, 'serve.py'), SITE, str(PORT)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
get = lambda path: urllib.request.build_opener(urllib.request.ProxyHandler({})).open(f'http://localhost:{PORT}' + path).read().decode('utf-8')
for _ in range(50):
    try: get('/index.html'); break
    except Exception: time.sleep(.1)

base = json.loads(get('/Pano/latest/base.json'))
brain = json.loads(get('/pano/brain.json'))
B = base['lines']
NAME = brain['lines']['name']
TOUR = brain['tours']['contact']
MENU = "()=>[...document.querySelectorAll('#gacts button')].map(b=>b.textContent)"
SAY = "()=>{const b=document.getElementById('gbubble');return b.hidden?'':document.getElementById('gsay').innerText}"
PRESS = "t=>{const b=[...document.querySelectorAll('#gacts button')].find(b=>b.textContent===t);if(b)b.click();return !!b}"
FILL = "s=>getComputedStyle(document.querySelector(s)).fill"
STROKE = "s=>getComputedStyle(document.querySelector(s)).stroke"


def fresh(b, W, H, routes=None, mobile=False):
    c = b.new_context(viewport={'width': W, 'height': H}, has_touch=W <= 640, is_mobile=mobile)
    pg = c.new_page(); errs, got, warns, said = [], [], [], []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.on('console', lambda m: warns.append(m.text) if m.type == 'warning' else None)
    pg.on('response', lambda r: got.append((r.url.split(f'localhost:{PORT}')[-1], r.status)))
    def answer(body):
        return lambda r: r.fulfill(status=200, content_type='application/json', body=json.dumps(body))
    for pat, body in (routes or {}).items():
        pg.route(pat, answer(body))
    pg.goto(U); pg.wait_for_timeout(3000)
    return c, pg, errs, got, warns


def heard(pg, said):
    t = pg.evaluate(SAY); said.append(t); return t


with sync_playwright() as p:
    b = p.chromium.launch()
    for tag, W, H in [('phone', 390, 800), ('desk', 1280, 800)]:
        c, pg, errs, got, warns = fresh(b, W, H)
        said = []
        print(tag, 'base 1 his brain and base.json came from where they should, and none of Phill\'s brains',
              ('/pano/brain.json', 200) in got and ('/Pano/latest/base.json', 200) in got and not [u for u, s in got if '/Pano/latest/brain/' in u])
        hello = heard(pg, said)
        print(tag, 'base 2 he appears and greets with the base hello and his own name',
              pg.is_visible('#gcat') and hello.startswith(NAME) and B['hello'].replace('{cat_name}', NAME) in hello, repr(hello))
        labels = pg.evaluate("()=>[gcat.getAttribute('aria-label'),document.getElementById('gx').getAttribute('aria-label'),document.getElementById('gbubble').getAttribute('aria-label')]")
        print(tag, 'base 3 his labels say his name', labels == [B['labels']['cat_button'].replace('{cat_name}', NAME), B['labels']['close'].replace('{cat_name}', NAME), NAME], labels)
        menu = pg.evaluate(MENU)
        print(tag, 'base 4 his menu: the tour, the background, and the base wording', menu == [TOUR['label'], B['menu']['change_background'], B['menu']['leave_first']], menu)
        sk = {s['name']: s for s in pg.evaluate("()=>Pano.here.skills()")}
        print(tag, 'base 5 tours and background on; windows and bin off for want of a window system',
              sk['tours']['on'] and sk['background']['on'] and sk['windows'].get('why') == 'this page has no windows' and sk['bin'].get('why') == 'this page has no bin')

        # the tour: two css steps on a page that scrolls
        pg.evaluate(PRESS, TOUR['label']); pg.wait_for_timeout(2500)
        s1 = heard(pg, said)
        box = pg.evaluate("()=>{const r=document.querySelector('#contact-form').getBoundingClientRect(),b=document.getElementById('gbubble').getBoundingClientRect(),g=document.getElementById('gring');return {top:r.top,bottom:r.bottom,vh:innerHeight,bubbleTop:b.top,ring:!g.hidden&&getComputedStyle(g).opacity==='1'}}")
        inview = box['top'] >= 0 and box['top'] < (box['bubbleTop'] if W <= 640 else box['vh'])
        print(tag, 'tour 1 step 1 of 2, scrolled into view with the ring on it', 'Step 1 of 2' in s1 and 'This is the form' in s1 and inview and box['ring'], box)
        print(tag, 'tour 2 buttons', pg.evaluate(MENU) == ['Next', B['tour']['stop']], pg.evaluate(MENU))
        pg.evaluate(PRESS, 'Next'); pg.wait_for_timeout(2500)
        s2 = heard(pg, said)
        print(tag, 'tour 3 step 2 of 2 with its own button labels', 'Step 2 of 2' in s2 and pg.evaluate(MENU) == ['Take me there', 'Got it', B['tour']['stop']], pg.evaluate(MENU))
        pg.evaluate(PRESS, 'Take me there'); pg.wait_for_timeout(300)
        print(tag, 'tour 4 "Take me there" focuses the box', pg.evaluate("()=>document.activeElement.id") == 'contact-email')
        pg.evaluate(PRESS, 'Got it'); pg.wait_for_timeout(2500)
        end = heard(pg, said)
        print(tag, 'tour 5 finished: the base "done" line and his menu again', B['menu']['after_tour'] in end and B['menu']['leave_again'] in pg.evaluate(MENU), repr(end))
        print(tag, 'lines 1 nothing he said was blank or had a gap left in it', all(said) and not [t for t in said if 'undefined' in t or '{' in t or 'null' in t], said)

        # his colors: today's red by default, and whatever the page sets
        red = [pg.evaluate(FILL, '.gtorso'), pg.evaluate(STROKE, '.gtail path'), pg.evaluate(FILL, '.geyes ellipse')]
        pg.add_style_tag(content=':root{--pano-fur:#3b82f6;--pano-eyes:#ffffff}')
        blue = [pg.evaluate(FILL, '.gtorso'), pg.evaluate(STROKE, '.gtail path'), pg.evaluate(FILL, '.geyes ellipse'), pg.evaluate(STROKE, '.gwavy path')]
        print(tag, 'color 1 red by default', red == ['rgb(255, 77, 79)', 'rgb(255, 77, 79)', 'rgb(7, 16, 11)'], red)
        print(tag, 'color 2 the page recolors him with --pano-fur and --pano-eyes', blue == ['rgb(59, 130, 246)'] * 2 + ['rgb(255, 255, 255)', 'rgb(59, 130, 246)'], blue)
        print(tag, 'errors', errs)
        c.close()

    # the background on a plain page: names stand in for missing words, and with no note he just says done
    c, pg, errs, got, warns = fresh(b, 1280, 800)
    pg.evaluate("()=>document.getElementById('gx').click()"); pg.wait_for_timeout(1500)
    pg.evaluate("()=>gcat.click()"); pg.wait_for_timeout(1500)
    pg.evaluate(PRESS, B['menu']['change_background']); pg.wait_for_timeout(1500)
    walls = pg.evaluate(MENU)
    print('back 1 a background with no words is shown by its name', walls == ['plain' + B['background']['default_mark'], 'dusk', 'meadow', B['background']['never_mind']], walls)
    pg.evaluate(PRESS, 'dusk'); pg.wait_for_timeout(600)
    pg.evaluate(PRESS, B['background']['yes']); pg.wait_for_timeout(600)
    modes = pg.evaluate(MENU)
    print('back 2 the colorblind modes in base wording', modes == list(B['background']['modes'].values()), modes)
    pg.evaluate(PRESS, B['background']['modes']['protan']); pg.wait_for_timeout(8000)
    end = pg.evaluate(SAY)
    state = pg.evaluate("()=>[document.getElementById('backdrop').dataset.wall,document.documentElement.dataset.cb,localStorage.getItem('kite-wall'),localStorage.getItem('kite-cb')]")
    print('back 3 no note in his brain, so he just says done', end.endswith(B['background']['done']) and state == ['dusk', 'protan', 'dusk', 'protan'], repr(end), state)
    print('back errors', errs)
    c.close()

    # a chain three files deep: his name from the top, a hello from the middle, the rest from base
    tours = brain['tours']
    c, pg, errs, got, warns = fresh(b, 1280, 800, {
        '**/pano/brain.json': {'extends': 'mid.json', 'lines': {'name': 'Mochi'}, 'tours': tours},
        '**/pano/mid.json': {'extends': 'base', 'lines': {'hello': 'Welcome to the shop! I’m {cat_name}.'}}})
    hello = pg.evaluate(SAY)
    print('chain 1 brain → mid.json → base', hello == 'Mochi\nWelcome to the shop! I’m Mochi.' and pg.evaluate(MENU)[-1] == B['menu']['leave_first'] and ('/Pano/latest/base.json', 200) in got, repr(hello))
    print('chain errors', errs)
    c.close()

    # "base.json" means the same base file, beside pano.js, not a file beside the site's brain
    c, pg, errs, got, warns = fresh(b, 1280, 800, {'**/pano/brain.json': {'extends': 'base.json', 'lines': {'name': 'Biscuit'}, 'tours': tours}})
    print('chain 3 "extends": "base.json" is the same base', pg.evaluate(SAY).startswith('Biscuit\nHi, I’m Biscuit!') and ('/Pano/latest/base.json', 200) in got and not [u for u, s in got if u.startswith('/pano/base')])
    print('chain 3 errors', errs)
    c.close()

    # a brain that extends itself: he stays hidden and says why in the console, and the page carries on
    c, pg, errs, got, warns = fresh(b, 1280, 800, {'**/pano/brain.json': {'extends': 'brain.json', 'lines': {'name': 'Loop'}, 'tours': tours}})
    print('chain 2 a loop keeps him hidden, with a warning', pg.evaluate("()=>gcat.hidden") and any('loop' in w for w in warns), [w[:120] for w in warns])
    print('chain 2 errors', errs)
    c.close()

    # menu.show picks and orders the tours; with none, every tour is offered in the order written
    two = {'contact': TOUR, 'kites': {'label': 'Show me the kites', 'steps': [{'say': 'Here they are.', 'target': {'css': '#kites'}, 'next': 'Next'}]}}
    c, pg, errs, got, warns = fresh(b, 1280, 800, {'**/pano/brain.json': {'extends': 'base', 'lines': {'name': 'Biscuit'}, 'tours': two}})
    all_ = pg.evaluate(MENU)
    c.close()
    c, pg, errs2, got, warns = fresh(b, 1280, 800, {'**/pano/brain.json': {'extends': 'base', 'lines': {'name': 'Biscuit'}, 'tours': two, 'menu': {'show': ['kites']}}})
    one = pg.evaluate(MENU)
    print('menu 1 no menu.show: every tour, in order', all_[:2] == [TOUR['label'], 'Show me the kites'], all_)
    print('menu 2 menu.show: only those', one[0] == 'Show me the kites' and TOUR['label'] not in one, one)
    print('menu errors', errs + errs2)
    c.close()

    # on a phone his bubble covers the bottom of the screen: a target at the very end of the page (the footer)
    # still comes above it, because he adds blank room below the page, and he takes it away when he rests
    foot = {'contact': TOUR, 'foot': {'label': 'What is at the bottom?', 'steps': [{'say': 'The small print.', 'target': {'css': 'footer'}, 'next': 'OK'}]}}
    c, pg, errs, got, warns = fresh(b, 390, 800, {'**/pano/brain.json': {'extends': 'base', 'lines': {'name': 'Biscuit'}, 'tours': foot}})
    tall = pg.evaluate("()=>document.documentElement.scrollHeight")
    pg.evaluate(PRESS, 'What is at the bottom?'); pg.wait_for_timeout(3000)
    spot = pg.evaluate("()=>{const r=document.querySelector('footer').getBoundingClientRect(),b=document.getElementById('gbubble').getBoundingClientRect();return {top:r.top,bottom:r.bottom,bubbleTop:b.top,room:!!document.querySelector('.groom')}}")
    print('room 1 phone: the footer comes up above his bubble', spot['top'] >= 0 and spot['bottom'] <= spot['bubbleTop'] and spot['room'], spot)
    pg.evaluate(PRESS, 'OK'); pg.wait_for_timeout(2000)
    pg.evaluate("()=>document.getElementById('gx').click()"); pg.wait_for_timeout(2500)
    after = pg.evaluate("()=>[!!document.querySelector('.groom'),document.documentElement.scrollHeight]")
    print('room 2 when he rests, the room is gone and the page is its own height again', after == [False, tall], after, tall)
    print('room errors', errs)
    c.close()
    c, pg, errs, got, warns = fresh(b, 390, 800)
    pg.evaluate(PRESS, TOUR['label']); pg.wait_for_timeout(2500)
    print('room 3 a target the page can scroll to needs no room', not pg.evaluate("()=>!!document.querySelector('.groom')"))
    c.close()

    # (K4) a header fixed to the top of the screen: what he points at comes in below it, even when it is already
    # partly on screen (here B sits just above A, so after the step on A it is under the header)
    hdr = {'two': {'label': 'Two', 'steps': [{'say': 'A.', 'target': {'css': '#ha'}, 'next': 'Next'}, {'say': 'B.', 'target': {'css': '#hb'}, 'next': 'OK'}]}}
    for tag, W in (('phone', 390), ('desk', 1280)):
        c, pg, errs, got, warns = fresh(b, W, 800, {'**/pano/brain.json': {'extends': 'base', 'lines': {'name': 'Biscuit'}, 'tours': hdr}})
        pg.evaluate("()=>{document.body.style.paddingTop='80px';document.body.insertAdjacentHTML('afterbegin','<header id=\"fixhead\" style=\"position:fixed;top:0;left:0;right:0;height:80px;background:#333;z-index:10\"></header>"
                    "<div id=\"hb\" style=\"height:60px;margin-top:900px;background:#fc0\">B</div><div id=\"ha\" style=\"height:60px;margin-top:140px;background:#fc0\">A</div>')}")
        pg.evaluate(PRESS, 'Two'); pg.wait_for_timeout(2500)
        pg.evaluate(PRESS, 'Next'); pg.wait_for_timeout(2500)
        top = pg.evaluate("()=>[document.getElementById('hb').getBoundingClientRect().top,document.getElementById('fixhead').getBoundingClientRect().bottom]")
        print(tag, 'header 1 a target is brought in below a header fixed to the top of the screen', top[0] >= top[1], top)
        print(tag, 'header errors', errs)
        c.close()

    # (K4) the room below the page also works where the page is a flex column of fixed height (a footer pushed to the
    # bottom with flex, as many Bootstrap sites do), which used to squeeze it to nothing
    c, pg, errs, got, warns = fresh(b, 390, 800, {'**/pano/brain.json': {'extends': 'base', 'lines': {'name': 'Biscuit'}, 'tours': foot}})
    pg.evaluate("()=>{document.head.insertAdjacentHTML('beforeend','<style>html,body{height:100%}body{display:flex;flex-direction:column}footer{margin-top:auto}</style>')}")
    pg.evaluate(PRESS, 'What is at the bottom?'); pg.wait_for_timeout(3000)
    spot = pg.evaluate("()=>{const r=document.querySelector('footer').getBoundingClientRect(),b=document.getElementById('gbubble').getBoundingClientRect();return {top:r.top,bottom:r.bottom,bubbleTop:b.top}}")
    print('room 4 phone, flex page: the footer still comes up above his bubble', spot['top'] >= 0 and spot['bottom'] <= spot['bubbleTop'], spot)
    print('room 4 errors', errs)
    c.close()

    # (K4) a phone page wider than the screen (a long word that doesn't wrap): his bubble and his spot stay on the
    # part of the page that is shown, not the bigger area the browser lays fixed things out on
    c, pg, errs, got, warns = fresh(b, 390, 800, mobile=True)
    pg.evaluate("()=>document.body.insertAdjacentHTML('afterbegin','<div style=\"width:450px;height:4px\"></div>')")
    pg.wait_for_timeout(500)
    pg.evaluate("()=>{document.getElementById('gx').click()}"); pg.wait_for_timeout(1500)
    pg.evaluate("()=>document.getElementById('gcat').click()"); pg.wait_for_timeout(2000)
    box = pg.evaluate("()=>{const b=document.getElementById('gbubble').getBoundingClientRect(),c=document.getElementById('gcat').getBoundingClientRect(),v=visualViewport;return {wide:innerWidth,shown:v.width,shownH:v.height,bub:[b.left,b.right,b.bottom].map(Math.round),cat:[c.right,c.bottom].map(Math.round),open:!document.getElementById('gbubble').hidden}}")
    inside = box['open'] and box['wide'] > box['shown'] and box['bub'][0] >= 0 and box['bub'][1] <= box['shown'] and box['bub'][2] <= box['shownH'] + 2 and box['cat'][0] <= box['shown'] and box['cat'][1] <= box['shownH']
    print('wide 1 phone page wider than the screen: his bubble and he stay on the part that is shown', inside, box)
    print('wide errors', errs)
    c.close()

    # done.css_visible (K4): an element that is always in the page but hidden by its styles (a popup opened by a
    # class) is not showing, so the step waits for it, and moves on once it really shows
    pop = {'pop': {'label': 'Open the popup', 'steps': [
        {'say': 'Open it.', 'target': {'css': '#contact-form'}, 'done': {'css_visible': '#pop.open'}},
        {'say': 'There it is.', 'target': {'css': '#pop'}, 'next': 'OK'}]}}
    c, pg, errs, got, warns = fresh(b, 1280, 800, {'**/pano/brain.json': {'extends': 'base', 'lines': {'name': 'Biscuit'}, 'tours': pop}})
    pg.evaluate("()=>{const d=document.createElement('div');d.id='pop';d.textContent='A popup';d.style.cssText='display:none;padding:20px';"
                "document.head.insertAdjacentHTML('beforeend','<style>#pop.open{display:block!important}</style>');document.body.prepend(d)}")
    pg.evaluate("()=>{const d=document.getElementById('pop');d.className='closed'}")
    pg.evaluate(PRESS, 'Open the popup'); pg.wait_for_timeout(2500)
    waiting = 'Open it.' in pg.evaluate(SAY)
    pg.evaluate("()=>{document.getElementById('pop').className='open'}"); pg.wait_for_timeout(2500)
    moved = 'There it is.' in pg.evaluate(SAY)
    print('visible 1 done.css_visible waits while the element is hidden by the page\'s styles, and moves on when it shows', waiting and moved, waiting, moved)
    print('visible errors', errs)
    c.close()

    # touch.swaps (K4): whole words in any alphabet, phrases, and words with brackets, on phones only
    swaps = {'swaps': [{'find': 'Haz clic en', 'say': 'Toca', 'whole_word': True}, {'find': 'aquí', 'say': 'acá', 'whole_word': True},
                       {'find': '(clic)', 'say': '(toque)', 'whole_word': True}, {'find': 'clic', 'say': 'toque', 'whole_word': True}]}
    es = {'contact': {'label': 'Contacto', 'steps': [{'say': 'Haz clic en <b>Enviar</b> aquí, no allí (clic). Un clicador no.', 'target': {'css': '#contact-form'}, 'next': 'Vale'}]}}
    for tag, W in (('phone', 390), ('desk', 1280)):
        c, pg, errs, got, warns = fresh(b, W, 800, {'**/pano/brain.json': {'extends': 'base', 'lines': {'name': 'Chispa', 'touch': swaps}, 'tours': es}})
        pg.evaluate(PRESS, 'Contacto'); pg.wait_for_timeout(2500)
        said = pg.evaluate(SAY).split('\n')[-1]
        want = 'Toca Enviar acá, no allí (toque). Un clicador no.' if tag == 'phone' else 'Haz clic en Enviar aquí, no allí (clic). Un clicador no.'
        print(tag, 'swaps 1 touch swaps: accented words, phrases and brackets swap on phones, and only there', said == want, repr(said))
        print(tag, 'swaps errors', errs)
        c.close()
    b.close()
server.terminate()
