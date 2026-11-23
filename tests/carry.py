# Release check for the real dashboard (phase 5): what a visitor already has saved still works.
# The same saved data is planted in the old page (its own in-page Paño) and the new one (Paño from
# /Pano/v1/), and each is asked whether it recognises it.
#
#   python3 tests/carry.py 8777 8776      # old real dashboard on 8777, new one on 8776
#
# Planted: a Console key (key-shaped, not real), a GitHub token (fake), a launch already sent,
# a tour already watched, a talk already heard, a story already read, an answer he remembers,
# 24-hour clock, the preview card's setting. Nothing reaches the outside world.
import json, sys
from playwright.sync_api import sync_playwright
OLD, NEW = sys.argv[1], sys.argv[2]
KEY = 'sk-ant-api03-' + 'x' * 40
SAVED = {
    'pd-pano-key': json.dumps(KEY),
    'pd-gh-token': json.dumps('FAKE_TOKEN_FOR_TEST'),
    'pd-proto-requests-v2': json.dumps([{'id': 'abc123', 'title': 'Saved launch', 'at': '2026-11-20T10:00:00.000Z', 'state': 'received'}]),
    'pd-pano-seen': json.dumps({'tours': ['weather'], 'talks': ['goodPrompt'], 'topics': []}),
    'pd-pano-mem': json.dumps({'name': 'Tester'}),
    'pd-clock-24h': '1',
    'pd-preview': json.dumps({'mode': 'desk'}),
}
BLOCK = ('api.anthropic.com', 'api.github.com', 'open-meteo', 'googletagmanager')


def look(b, port, W, H):
    c = b.new_context(viewport={'width': W, 'height': H}, has_touch=W <= 640)
    c.add_init_script(''.join("try{if(!sessionStorage.getItem('__t'))localStorage.setItem(%s,%s)}catch(e){}" % (json.dumps(k), json.dumps(v)) for k, v in SAVED.items())
                      + "try{sessionStorage.setItem('__t','1')}catch(e){}")
    pg = c.new_page(); errs = []; sent = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.route('**/*', lambda r: (sent.append(r.request.url.split('?')[0]), r.abort()) if any(h in r.request.url for h in BLOCK) else r.fallback())
    pg.goto(f'http://localhost:{port}/index.html'); pg.wait_for_timeout(3500)
    out = {}
    out['clock is 24-hour'] = pg.evaluate("()=>{const h=document.getElementById('clkH').textContent;return h.length===2 && (new Date().getHours()<10 ? h.startsWith('0') : true)}")
    out['token is in settings'] = pg.evaluate("()=>{const t=document.getElementById('lpToken');return !!t && (t.value==='FAKE_TOKEN_FOR_TEST' || /saved|remove|forget/i.test(document.getElementById('lpSettings')?.innerText||'') )}")
    out['saved launch is listed'] = 'Saved launch' in pg.inner_text('body')
    # open his menu
    pg.evaluate("()=>document.getElementById('gcat').click()"); pg.wait_for_timeout(1800)
    menu = pg.evaluate("()=>[...document.querySelectorAll('#gacts button')].map(b=>b.innerText.trim())")
    out['he knows he has a key (menu says Paño’s brain, not Give Paño a brain)'] = any('Paño’s brain' in m for m in menu) and not any('Give Paño a brain' in m for m in menu)
    out['only the weather tour has its tick'] = [m for m in menu if m.startswith('✓')] == ['✓ Show me the weather']
    talk = [m for m in menu if 'Talk to' in m]
    if talk:
        pg.evaluate("t=>[...document.querySelectorAll('#gacts button')].find(b=>b.innerText.trim()===t).click()", talk[0]); pg.wait_for_timeout(1800)
        tm = pg.evaluate("()=>[...document.querySelectorAll('#gacts button')].map(b=>b.innerText.trim())")
        out['only the heard talk has its tick'] = [m for m in tm if m.startswith('✓')]
    else:
        out['only the heard talk has its tick'] = 'no Talk button'
    out['saved data still there'] = pg.evaluate("names=>names.every(n=>localStorage.getItem(n)!==null)", [k for k in SAVED])
    out['errors'] = errs
    out['blocked requests'] = sorted(set(sent))
    c.close()
    return menu, out


with sync_playwright() as p:
    b = p.chromium.launch()
    for tag, W, H in [('phone', 390, 800), ('fold', 880, 900), ('desk', 1280, 800)]:
        mo, o = look(b, OLD, W, H)
        mn, n = look(b, NEW, W, H)
        print(tag, 'old menu', mo)
        print(tag, 'new menu', mn)
        for k in o:
            if k in ('errors', 'blocked requests'): print(tag, k, 'old', o[k], 'new', n[k])
            else: print(tag, k, '| old', o[k], '| new', n[k], '| same', o[k] == n[k])
    b.close()
