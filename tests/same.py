# Release check: two copies of a site show Paño exactly the same.
# Used in phase 5 to compare staging before (its own in-page Paño) and after (Paño from /Pano/v1/).
#
#   python3 tests/same.py 8774 8773        # old site on 8774, new site on 8773
#
# For each size (phone, fold, desktop) and each pose (his greeting, a tour step, the background
# question, the colorblind questions, the change itself, a new background with a colorblind mode on
# and Phill's note, head mode), it
# stills every animation, then compares:
#   - every computed style on every element of Paño (#gcat, #gbubble, #gring and all inside them),
#     plus the desktop and the page body,
#   - the text and buttons in his bubble,
#   - a screenshot of the whole page, pixel by pixel (the taskbar clock is hidden first),
#   - what the page saves in the browser (names and values).
# Every line should end in True. A False line lists what differed.
import sys
from playwright.sync_api import sync_playwright
from PIL import Image, ImageChops

A, B = sys.argv[1], sys.argv[2]
SHOTS = '/tmp/pano-qa'
SIZES = [('phone', 390, 800), ('fold', 880, 900), ('desk', 1280, 800)]

STILL = """()=>{document.getAnimations().forEach(a=>{try{a.finish()}catch(e){a.cancel()}});
  if(!document.getElementById('__still')){const s=document.createElement('style');s.id='__still';
  s.textContent='*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}.tclock,.clock,#clock,[class*=clock]{visibility:hidden!important}';
  document.head.appendChild(s)}}"""
STYLES = """()=>{const out={};const roots=['gcat','gbubble','gring'].map(i=>document.getElementById(i)).filter(Boolean);
  const els=[];roots.forEach(r=>{els.push(r);r.querySelectorAll('*').forEach(e=>els.push(e))});
  const d=document.getElementById('desktop');if(d)els.push(d);els.push(document.body);
  els.forEach((e,i)=>{const cs=getComputedStyle(e);const o={};for(const p of cs)o[p]=cs.getPropertyValue(p).split(location.origin).join('');
    out[i+':'+e.tagName+'#'+(e.id||'')+'.'+(typeof e.className==='string'?e.className:'')]=o});return out}"""
BUBBLE = """()=>{const b=document.getElementById('gbubble');return b?{hidden:b.hidden,say:document.getElementById('gsay').innerText,
  buttons:[...document.querySelectorAll('#gacts button')].map(x=>x.innerText)}:null}"""


def click_button(pg, text):
    pg.evaluate("t=>{const x=[...document.querySelectorAll('#gacts button')].find(b=>b.innerText.trim()===t||b.innerText.includes(t));x.click()}", text)


def poses(pg, W):
    """Walk through the poses, yielding a name for each once it is reached."""
    pg.wait_for_timeout(2600); yield 'greeting'
    click_button(pg, 'Get in touch'); pg.wait_for_timeout(2600); yield 'tour step 1'
    pg.goto(pg.url); pg.wait_for_timeout(2600)
    pg.evaluate("()=>document.getElementById('gcat').click()"); pg.wait_for_timeout(700)
    click_button(pg, 'Change the background'); pg.wait_for_timeout(1500); yield 'background question'
    click_button(pg, 'All green'); pg.wait_for_timeout(2500); yield 'colorblind question'
    click_button(pg, 'Yes'); pg.wait_for_timeout(1500); yield 'colorblind mode question'
    click_button(pg, 'Green-weak'); pg.wait_for_timeout(1200); yield 'mid-change'
    pg.wait_for_timeout(5000); yield 'green, green-weak mode, Phill\'s note'
    click_button(pg, 'Thanks'); pg.wait_for_timeout(2500); yield 'after the note'
    pg.evaluate("()=>{sessionStorage.setItem('panoHead','1')}"); pg.goto(pg.url); pg.wait_for_timeout(2600); yield 'head mode'


def capture(pg, tag, side, n, name):
    pg.evaluate(STILL); pg.wait_for_timeout(250)
    path = f'{SHOTS}/same-{tag}-{n}-{side}.png'
    pg.screenshot(path=path)
    store = pg.evaluate("()=>({local:Object.fromEntries(Object.keys(localStorage).sort().map(k=>[k,localStorage.getItem(k)])),session:Object.fromEntries(Object.keys(sessionStorage).sort().map(k=>[k,sessionStorage.getItem(k)]))})")
    return {'styles': pg.evaluate(STYLES), 'bubble': pg.evaluate(BUBBLE), 'shot': path, 'store': store}


with sync_playwright() as p:
    b = p.chromium.launch()
    for tag, W, H in SIZES:
        got = {}
        for side, port in (('old', A), ('new', B)):
            c = b.new_context(viewport={'width': W, 'height': H}, has_touch=W <= 640)
            pg = c.new_page(); errs = []
            pg.on('pageerror', lambda e: errs.append(str(e)))
            pg.goto(f'http://localhost:{port}/index.html')
            got[side] = [(name, capture(pg, tag, side, n, name)) for n, name in enumerate(poses(pg, W))]
            got[side + '-errors'] = errs; c.close()
        for (name, o), (_, n) in zip(got['old'], got['new']):
            diffs = []
            ko, kn = list(o['styles']), list(n['styles'])
            if ko != kn: diffs.append(('elements', [k for k in ko if k not in kn][:5], [k for k in kn if k not in ko][:5]))
            else:
                for k in ko:
                    for prop, v in o['styles'][k].items():
                        if n['styles'][k].get(prop) != v: diffs.append((k, prop, v, n['styles'][k].get(prop)))
            nstyles = sum(len(v) for v in o['styles'].values())
            print(tag, name, '| computed styles same', not diffs, f'({nstyles} values)', diffs[:6])
            print(tag, name, '| bubble same', o['bubble'] == n['bubble'], o['bubble'] if o['bubble'] != n['bubble'] else '', n['bubble'] if o['bubble'] != n['bubble'] else '')
            io, inew = Image.open(o['shot']).convert('RGB'), Image.open(n['shot']).convert('RGB')
            box = ImageChops.difference(io, inew).getbbox()
            print(tag, name, '| screenshot same', box is None, box or '')
            print(tag, name, '| saved settings same', o['store'] == n['store'], o['store']['local'] if o['store'] == n['store'] else (o['store'], n['store']))
        print(tag, 'errors old', got['old-errors'], 'new', got['new-errors'])
    b.close()
