# Phase 1 check: the page loads Paño from the Pano repo instead of carrying his code.
# Serve the site with tests/serve.py (it mounts this repo at /Pano/), then: python3 tests/lifted.py
# Every line should end in True, and "errors" should be [].
from playwright.sync_api import sync_playwright
U = 'http://localhost:8773/index.html'
OPEN = "k=>document.querySelector(`[data-open=\"${k}\"]`).click()"
with sync_playwright() as p:
    b = p.chromium.launch()
    for tag, W, H in [('phone', 390, 800), ('fold', 880, 900), ('desk', 1280, 800)]:
        c = b.new_context(viewport={'width': W, 'height': H}, has_touch=W <= 640)
        pg = c.new_page(); errs = []; got = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.on('response', lambda r: got.append((r.url.split('localhost:8773')[-1], r.status)))
        pg.goto(U); pg.wait_for_timeout(3000)
        src = pg.content()
        html = pg.evaluate("fetch(location.href).then(r=>r.text())")
        print(tag, '1 pano.js and pano.css came from /Pano/latest/', ('/Pano/latest/pano.js', 200) in got and ('/Pano/latest/pano.css', 200) in got)
        print(tag, '2 the page file no longer carries his body or engine', 'id="gcat"' not in html and 'function moveCat' not in html and '.gcat{' not in html)
        print(tag, '3 his elements are in the page, in order, before the taskbar', pg.evaluate("""()=>{const ids=['gcat','gbubble','gring'].map(i=>document.getElementById(i));
            return ids.every(Boolean) && ids[0].nextElementSibling===ids[1] && ids[1].nextElementSibling===ids[2] && !!(ids[2].compareDocumentPosition(document.querySelector('footer.taskbar')) & 4)}"""))
        print(tag, '4 he is on screen and styled', pg.evaluate("""()=>{const g=document.getElementById('gcat'),r=g.getBoundingClientRect();
            return !g.hidden && getComputedStyle(g).position==='fixed' && r.width>40 && r.right<=innerWidth && r.bottom<=innerHeight}"""))
        print(tag, '5 he greets with his menu', pg.evaluate("()=>document.querySelectorAll('#gacts button').length>=6 && /show you around/.test(document.getElementById('gsay').innerText)"))
        print(tag, '6 Pano.init is the only thing he adds to the page', pg.evaluate("()=>typeof Pano.init==='function' && typeof window.moveCat==='undefined' && typeof window.guideMenu==='undefined'"))
        print(tag, 'errors', errs); c.close()

    # if his files cannot be fetched, the rest of the page must still work
    c = b.new_context(viewport={'width': 1280, 'height': 800}); pg = c.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.route('**/Pano/latest/**', lambda r: r.abort())
    pg.goto(U); pg.wait_for_timeout(2500)
    pg.evaluate(OPEN, 'app:contact'); pg.wait_for_timeout(900); pg.evaluate(OPEN, 'app:skills'); pg.wait_for_timeout(900)
    print('nopano 1 no cat, and windows still open', pg.evaluate("()=>!document.getElementById('gcat') && document.querySelectorAll('#layer .window').length===2"))
    pg.keyboard.press('Escape'); pg.wait_for_timeout(900)
    print('nopano 2 Escape still closes the top window', pg.evaluate("()=>document.querySelectorAll('#layer .window').length===1"))
    print('nopano errors', errs); c.close()
    b.close()
