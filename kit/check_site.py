#!/usr/bin/env python3
"""Try Paño on a site before it goes live. Part of the Paño kit (github.com/marquisphill/Pano, kit/SETUP.md).

For every page that loads Paño, at a phone size and a desktop size, it:
  - checks that he appears and greets,
  - runs Pano.check() and prints its problems (✗) and notes (·),
  - lists his menu,
  - walks every tour he offers on that page, step by step: each step must show, point at something that is
    on screen, and move on, and the tour must finish,
  - lists page errors and files that failed to load,
  - and, on desktop, checks that each background the page styles can be seen.
It ends with "All good" or the number of things to fix. Nothing in the site is changed.

  pip install playwright             (then, unless Chromium is already installed: python -m playwright install chromium)
  python3 check_site.py path/to/site
  python3 check_site.py path/to/site --pages index.html contact.html
  python3 check_site.py path/to/site --engine path/to/Pano

Paño's own files come from https://marquisphill.github.io/Pano/. If this computer can't reach that address
(many AI cloud sessions can't), give --engine the folder of a clone of the Pano repo, and the browser is
answered from it instead. Run from inside a clone, the clone is used by itself when the address can't be reached.
"""
import argparse, json, mimetypes, os, re, sys, threading, urllib.request
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import unquote, urljoin, urlsplit

HOSTED = 'https://marquisphill.github.io/Pano/'
SIZES = [('phone', 390, 844), ('desktop', 1280, 800)]
CLONE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))   # the Pano clone this file sits in, if it is one

SAY = "()=>{const b=document.getElementById('gbubble');return b&&!b.hidden?document.getElementById('gsay').innerText:''}"
MENU = "()=>[...document.querySelectorAll('#gacts button')].map(b=>b.textContent)"
PRESS = "t=>{const b=[...document.querySelectorAll('#gacts button')].find(b=>b.textContent===t);if(b)b.click();return !!b}"
STEP_SHOWN = "prev=>{const b=document.getElementById('gbubble'),s=document.getElementById('gsay');return !b.hidden&&!!s.querySelector('.gstep')&&s.innerText!==prev}"
MENU_BACK = "prev=>{const b=document.getElementById('gbubble'),s=document.getElementById('gsay');return !b.hidden&&!s.querySelector('.gstep')&&s.innerText!==prev&&document.querySelectorAll('#gacts button').length>0}"
GREETED = "()=>{const c=document.getElementById('gcat'),b=document.getElementById('gbubble');return c&&!c.hidden&&b&&!b.hidden&&document.querySelectorAll('#gacts button').length>0}"
# is the target on screen (above his bubble on a phone), and is the ring around it?
SEEN = """([css, narrow]) => {
  let el = null; try { el = document.querySelector(css); } catch (e) { return { found: false, bad: true }; }
  if (!el) return { found: false };
  const r = el.getBoundingClientRect(), b = document.getElementById('gbubble').getBoundingClientRect(), g = document.getElementById('gring');
  const limit = narrow ? b.top : innerHeight;
  const seen = r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < limit && r.right > 0 && r.left < innerWidth;
  const q = g.getBoundingClientRect();
  const ring = !g.hidden && q.width > 0 && q.left < r.right + 20 && q.right > r.left - 20 && q.top < r.bottom + 20 && q.bottom > r.top - 20;
  return { found: true, seen, ring };
}"""
WALLS = """() => {
  const names = new Set();
  const scan = rules => { for (const r of rules) { if (r.selectorText && r.selectorText.includes('pano-backdrop')) for (const m of r.selectorText.matchAll(/data-wall\\s*=\\s*["']?([\\w-]+)/g)) names.add(m[1]); if (r.cssRules) scan(r.cssRules); } };
  for (const s of document.styleSheets) { try { scan(s.cssRules); } catch (e) {} }
  names.delete('plain'); return [...names];
}"""


class Quiet(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def log_message(self, *a):
        pass


def page_key(url):
    """The same page, the way Paño compares them: / and /index.html alike, .html optional, no query or hash."""
    u = urlsplit(url)
    path = re.sub(r'(^|/)index\.html?$', r'\1', u.path, flags=re.I)
    return (u.scheme, u.netloc, re.sub(r'\.html?$', '', path, flags=re.I))


def for_page(tour, brain_url, page_url):
    pages = tour.get('pages')
    if pages is None:
        return True
    return isinstance(pages, list) and any(isinstance(x, str) and x.strip() and page_key(urljoin(brain_url, x)) == page_key(page_url) for x in pages)


def find_pages(site):
    out = []
    for root, dirs, files in os.walk(site):
        dirs[:] = [d for d in dirs if not d.startswith('.') and d != 'node_modules']
        for f in files:
            if f.lower().endswith(('.html', '.htm')):
                path = os.path.join(root, f)
                try:
                    text = open(path, encoding='utf-8', errors='replace').read()
                except OSError:
                    continue
                if 'pano.js' in text:
                    out.append(os.path.relpath(path, site).replace(os.sep, '/'))
    return sorted(out, key=lambda p: (p.count('/'), p.lower() != 'index.html', p))


def reachable(url):
    try:
        urllib.request.urlopen(url, timeout=6).read(64)
        return True
    except Exception:
        return False


def engine_route(root):
    root = os.path.abspath(root)

    def handle(route):
        rel = unquote(urlsplit(route.request.url).path)[len('/Pano/'):]
        path = os.path.normpath(os.path.join(root, rel))
        if not path.startswith(root + os.sep) or not os.path.isfile(path):
            return route.fulfill(status=404, body='not found')
        with open(path, 'rb') as fh:
            body = fh.read()
        route.fulfill(status=200, body=body, headers={'Content-Type': mimetypes.guess_type(path)[0] or 'application/octet-stream',
                                                      'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store'})
    return handle


class Report:
    def __init__(self):
        self.problems = 0

    def line(self, text=''):
        print(text, flush=True)

    def bad(self, text):
        self.problems += 1
        print('  ✗ ' + text, flush=True)

    def note(self, text):
        print('  · ' + text, flush=True)


def main():
    ap = argparse.ArgumentParser(description='Try Paño on a site: Pano.check() and every tour, at phone and desktop sizes.')
    ap.add_argument('site', help='the site folder (the one with index.html in it)')
    ap.add_argument('--pages', nargs='*', help='pages to check, relative to the site folder (default: every page that loads pano.js)')
    ap.add_argument('--engine', help='a clone of the Pano repo, to answer for https://marquisphill.github.io/Pano/')
    a = ap.parse_args()

    site = os.path.abspath(a.site)
    if not os.path.isdir(site):
        sys.exit(f'No folder at {site}')
    pages = a.pages or find_pages(site)
    if not pages:
        sys.exit('No page in that folder loads pano.js. Add the lines from kit/templates/adapter.html first.')
    engine = a.engine
    if engine and not os.path.isfile(os.path.join(engine, 'latest', 'pano.js')):
        sys.exit(f'--engine should be the Pano repo\'s folder (the one with latest/ inside); {engine} is not.')
    auto = False
    if not engine and not reachable(HOSTED + 'latest/pano.js'):
        if os.path.isfile(os.path.join(CLONE, 'latest', 'pano.js')):
            engine, auto = CLONE, True
        else:
            sys.exit('This computer can\'t reach ' + HOSTED + ', where Paño\'s files live. Clone https://github.com/marquisphill/Pano '
                     'and run again with --engine <the clone>.')

    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        sys.exit('This needs Playwright: pip install playwright, then python -m playwright install chromium')

    srv = ThreadingHTTPServer(('127.0.0.1', 0), partial(Quiet, directory=site))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    base = f'http://127.0.0.1:{srv.server_address[1]}/'
    R = Report()
    R.line(f'Paño site check: {site}')
    R.line(f'Paño\'s files: {HOSTED}' + (f' (answered from {engine}{", since that address could not be reached" if auto else ""})' if engine else ''))
    tours_walked = set()

    with sync_playwright() as p:
        browser = p.chromium.launch()

        def context(W, H):
            phone = W <= 640
            c = browser.new_context(viewport={'width': W, 'height': H}, has_touch=phone, is_mobile=phone)
            if engine:
                c.route(HOSTED + '**', engine_route(engine))
            return c

        def open_page(c, url):
            pg = c.new_page()
            errs, failed = [], []
            pg.on('pageerror', lambda e: errs.append(str(e)))
            pg.on('console', lambda m: errs.append('console: ' + m.text) if m.type == 'error' else None)
            pg.on('response', lambda r: failed.append(f'{r.status} {r.url}') if r.status >= 400 else None)
            pg.on('requestfailed', lambda r: failed.append(f'{r.failure} {r.url}'))
            pg.goto(url, wait_until='load')
            return pg, errs, failed

        def wait(pg, fn, arg=None, ms=8000):
            try:
                pg.wait_for_function(fn, arg=arg, timeout=ms)
                return True
            except Exception:
                return False

        def walk(c, url, key, tour, narrow):
            """Run one tour from his menu to the end. Returns (finished, what went wrong)."""
            pg, errs, failed = open_page(c, url)
            try:
                if not wait(pg, GREETED):
                    return False, 'he did not greet, so the tour could not be started', errs
                start = url.split('#')[0]
                if not pg.evaluate(PRESS, tour['label']):
                    return False, 'its button is not in his menu', errs
                prev, steps = '', tour['steps']
                for i, st in enumerate(steps):
                    n = f'step {i + 1} of {len(steps)}'
                    if not wait(pg, STEP_SHOWN, prev, 10000):
                        said = pg.evaluate(SAY).replace('\n', ' ')
                        return False, f'{n} never showed' + (f' (he said: "{said[:90]}")' if said else ''), errs
                    pg.wait_for_timeout(700)    # he walks over and the page scrolls
                    text = pg.evaluate(SAY)
                    css = (st.get('target') or {}).get('css', '')
                    s = pg.evaluate(SEEN, [css, narrow]) if css else {'found': False}
                    if not s['found']:
                        return False, f'{n}: nothing on the page matches "{css}"', errs
                    if not s['seen']:
                        R.bad(f'tour "{key}" {n}: "{css}" is not on screen when he points at it' + (' (it is behind his bubble or below it)' if narrow else ''))
                    elif not s['ring']:
                        R.bad(f'tour "{key}" {n}: the ring is not around "{css}"')
                    need = (st.get('need') or {}).get('filled')
                    if need:
                        pg.evaluate("s=>{const e=document.querySelector(s);if(e){e.value='Test';e.dispatchEvent(new Event('input',{bubbles:true}))}}", need)
                    if st.get('next'):
                        if not pg.evaluate(PRESS, st['next']):
                            return False, f'{n}: no "{st["next"]}" button', errs
                    elif st.get('act'):
                        pg.evaluate("()=>{const b=document.querySelector('#gacts .gbtn.pri');if(b)b.click()}")
                    else:
                        pg.evaluate("s=>{const e=document.querySelector(s);if(e)e.click()}", css)
                    prev = text
                    pg.wait_for_timeout(300)
                    if pg.url.split('#')[0] != start:
                        return False, f'{n} took the visitor to another page ({pg.url}). A tour runs on one page: give a step that leaves the page "next" as well', errs
                if not wait(pg, MENU_BACK, prev, 10000):
                    st = steps[-1]
                    if not st.get('next') and not st.get('act'):
                        return False, f'the last step waits for the visitor ("done"), and clicking what he points at did not move it on. Try it by hand', errs
                    return False, 'it did not finish: his menu did not come back after the last step', errs
                return True, '', errs
            except Exception as e:
                msg = str(e).split('\n')[0]
                if 'navigat' in msg.lower() or 'destroyed' in msg.lower():
                    return False, 'the page changed in the middle of the tour. A tour runs on one page: give a step that leaves the page "next" as well', errs
                return False, 'stopped: ' + msg[:160], errs
            finally:
                pg.close()

        for rel in pages:
            url = urljoin(base, rel)
            for tag, W, H in SIZES:
                narrow = W <= 640
                R.line()
                R.line(f'{rel}, {tag} ({W}×{H})')
                c = context(W, H)
                pg, errs, failed = open_page(c, url)
                if not wait(pg, "()=>window.Pano&&Pano.here", ms=10000):
                    if not pg.evaluate("()=>!!window.Pano"):
                        R.bad('Paño\'s files did not load (pano.js). Is the <script> for pano.js on this page, with the right address?')
                    else:
                        R.bad('Pano.init() did not run. Is pano/setup.js loaded right after pano.js, with the right path from this page?')
                    for f in failed:
                        R.bad('did not load: ' + f)
                    c.close()
                    continue
                greeted = wait(pg, GREETED)
                if not pg.evaluate("()=>typeof Pano.check==='function'"):
                    src = pg.evaluate("()=>(document.querySelector('script[src*=\"pano.js\"]')||{}).src||''")
                    R.bad(f'the Paño files this page loads ({src}) are older than the kit: they have no Pano.check(). Use the address in kit/templates/adapter.html, or run with --engine <a clone of the Pano repo>.')
                    c.close()
                    continue
                r = pg.evaluate("()=>Pano.check()")
                if not greeted:
                    R.bad('he did not appear and greet visitors')
                R.line(f'  Pano.check(): {len(r["problems"]) or "no"} problem{"" if len(r["problems"]) == 1 else "s"}, {len(r["notes"])} note{"" if len(r["notes"]) == 1 else "s"}. Brain: {" → ".join(r["brain"])}')
                for x in r['problems']:
                    R.bad(f'{x["where"]}: {x["say"]}')
                for x in r['notes']:
                    R.note(f'{x["where"]}: {x["say"]}')
                off = [f'{s["name"]} ({s["why"]})' for s in r['skills'] if not s['on'] and s['name'] in ('tours', 'background')]
                if off:
                    R.note('off on this page: ' + '; '.join(off))
                menu = pg.evaluate(MENU) if greeted else []
                R.line('  Menu: ' + ' | '.join(menu))
                brain = {}
                if r['brain']:
                    try:
                        brain = pg.evaluate("u=>fetch(u,{cache:'no-store'}).then(r=>r.json())", r['brain'][0])
                    except Exception:
                        brain = {}
                tours = {k: t for k, t in (brain.get('tours') or {}).items() if not k.startswith('_') and isinstance(t, dict) and isinstance(t.get('steps'), list)}
                here = {k: t for k, t in tours.items() if for_page(t, r['brain'][0], pg.url) and t.get('label') in menu}
                if tours and not here:
                    R.note('he offers no tours on this page')

                # the backgrounds: each one the page styles must show (desktop only)
                if not narrow and any(s['name'] == 'background' and s['on'] for s in r['skills']):
                    names = pg.evaluate(WALLS)
                    if not pg.evaluate("()=>!!document.getElementById('pano-backdrop')"):
                        R.note('backgrounds not checked: no #pano-backdrop on this page (the kit\'s setup.js adds it)')
                    elif names:
                        pg.add_style_tag(content='#gcat,#gbubble,#gring{visibility:hidden!important}')
                        hidden = []
                        for name in names:
                            shows = False
                            for spot in ('0', 'document.documentElement.scrollHeight/2'):
                                pg.evaluate(f"()=>{{scrollTo(0,{spot});delete document.getElementById('pano-backdrop').dataset.wall}}")
                                pg.wait_for_timeout(150)
                                before = pg.screenshot(animations='disabled')
                                pg.evaluate("n=>{document.getElementById('pano-backdrop').dataset.wall=n}", name)
                                pg.wait_for_timeout(150)
                                if pg.screenshot(animations='disabled') != before:
                                    shows = True
                                    break
                            if not shows:
                                hidden.append(name)
                        pg.evaluate("()=>{delete document.getElementById('pano-backdrop').dataset.wall;scrollTo(0,0)}")
                        if hidden:
                            R.bad('background' + ('s ' if len(hidden) > 1 else ' ') + ', '.join(hidden) + ' cannot be seen: something on the page paints over #pano-backdrop (a background on <body>, or on a wrapper around the whole page)')
                        else:
                            R.line('  Backgrounds: ' + ', '.join(names) + (' all show' if len(names) > 1 else ' shows'))
                pg.close()

                for key, t in here.items():
                    ok, why, terr = walk(c, url, key, t, narrow)
                    tours_walked.add(key)
                    if ok:
                        R.line(f'  Tour "{key}" ({t["label"]}): finished, {len(t["steps"])} step{"" if len(t["steps"]) == 1 else "s"}')
                    else:
                        R.bad(f'tour "{key}" ({t["label"]}): {why}')
                    errs += terr
                for e in dict.fromkeys(errs):
                    R.bad('page error: ' + e[:200])
                for f in dict.fromkeys(failed):
                    if not f.endswith('/favicon.ico'):
                        R.bad('did not load: ' + f)
                c.close()
        browser.close()
    srv.shutdown()
    R.line()
    if R.problems:
        R.line(f'{R.problems} thing{"" if R.problems == 1 else "s"} to fix (marked ✗ above).')
        sys.exit(1)
    R.line(f'All good: {len(pages)} page{"" if len(pages) == 1 else "s"}, {len(tours_walked)} tour{"" if len(tours_walked) == 1 else "s"}, at phone and desktop sizes.')


if __name__ == '__main__':
    main()
