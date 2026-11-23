# Dashboard DEV copy: own storage names and Launch turned off.
# Serve the Dashboard-DEV repo on port 8773, then: python3 tests/devdash.py
# It plants fake secrets under the REAL dashboard's key names and checks the DEV copy ignores them.
import json
from playwright.sync_api import sync_playwright
U = 'http://localhost:8773/index.html'
with sync_playwright() as p:
    b = p.chromium.launch()
    for tag, W, H in [('phone', 390, 800), ('fold', 880, 900), ('desk', 1280, 800)]:
        ctx = b.new_context(viewport={'width': W, 'height': H}, has_touch=W <= 640)
        ctx.add_init_script("try{localStorage.setItem('pd-gh-token', JSON.stringify('FAKE_REAL_TOKEN'));localStorage.setItem('pd-pano-key', JSON.stringify('FAKE_REAL_KEY'))}catch(e){}")
        pg = ctx.new_page(); errs = []; calls = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.on('request', lambda r: calls.append(r.url) if ('api.github.com' in r.url or 'anthropic.com' in r.url) else None)
        pg.goto(U); pg.wait_for_timeout(3500)
        info = pg.evaluate("""() => ({
          cards: [...document.querySelectorAll('section.card')].map(c => c.id),
          launchOff: document.getElementById('lpGo').disabled,
          tokenFieldEmpty: document.getElementById('lpToken').value === '',
          noSideScroll: document.documentElement.scrollWidth <= innerWidth + 1
        })""")
        pg.evaluate("() => { document.getElementById('lpIdea').value = 'test'; document.getElementById('lpForm').requestSubmit(); }")
        pg.wait_for_timeout(800)
        info['launchRefused'] = 'turned off' in pg.inner_text('#lpStatus')
        keys = pg.evaluate("Object.keys(localStorage)")
        info['onlyDevKeysWritten'] = all(k.startswith('dev-') or k in ('pd-gh-token', 'pd-pano-key') for k in keys)
        info['noGithubOrClaudeCalls'] = calls == []
        print(tag, json.dumps(info)); print(tag, 'errors', errs)
        pg.screenshot(path=f'/tmp/pano-qa/devdash-{tag}.png'); ctx.close()
    b.close()
