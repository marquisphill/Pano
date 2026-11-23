import sys, json
from playwright.sync_api import sync_playwright
URL = 'http://localhost:8773/index.html'
SIZES = {'desk': (1280, 800), 'fold': (880, 900), 'phone': (390, 800)}
TOURS = ['View his résumé', 'Read his history', 'See what he built', 'Explore his skills', 'Get in touch']
CLUTTER = sys.argv[2].split(',') if len(sys.argv) > 2 and sys.argv[2] else []
CHECK = r"""() => {
  const g = document.getElementById('gring'); if (!g || g.hidden) return {ring: false};
  const R = g.getBoundingClientRect(); const T = {l: R.left + 6, t: R.top + 6, r: R.right - 6, b: R.bottom - 6};
  T.w = T.r - T.l; T.h = T.b - T.t;
  const pts = [[.5,.5],[.25,.3],[.75,.3],[.25,.7],[.75,.7]];
  const out = [];
  for (const [fx, fy] of pts) {
    const x = T.l + T.w * fx, y = T.t + T.h * fy;
    if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) { out.push('offscreen'); continue; }
    const e = document.elementFromPoint(x, y);
    if (!e) { out.push('none'); continue; }
    if (e.closest('#gcat')) { out.push('cat'); continue; }
    if (e.closest('#gbubble')) { out.push('bubble'); continue; }
    let n = e, ok = false;
    while (n && n !== document.body) { const r = n.getBoundingClientRect(); if (Math.abs(r.left - T.l) < 3 && Math.abs(r.top - T.t) < 3 && Math.abs(r.width - T.w) < 4 && Math.abs(r.height - T.h) < 4) { ok = true; break; } n = n.parentElement; }
    if (ok) { out.push('ok'); continue; }
    const w = e.closest('.window'); out.push(w ? 'win:' + (w.getAttribute('aria-label') || '?').slice(0, 18) : 'other:' + e.tagName.toLowerCase() + '.' + (e.className && e.className.baseVal === undefined ? String(e.className).split(' ')[0] : ''));
  }
  return {ring: true, size: [Math.round(T.w), Math.round(T.h)], pts: out, say: document.getElementById('gsay').innerText.slice(0, 60)};
}"""
def run(tag, W, H, clutter):
    res = []
    with sync_playwright() as p:
        b = p.chromium.launch(); ctx = b.new_context(viewport={'width': W, 'height': H}, has_touch=(W <= 640))
        ctx.add_init_script("try{sessionStorage.setItem('catGreeted','1')}catch(e){}")
        pg = ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto(URL); pg.wait_for_timeout(1600)
        for tour in TOURS:
            pg.goto(URL); pg.wait_for_timeout(1600)
            for k in clutter:
                pg.evaluate("k=>{const e=document.querySelector(`[data-open=\"${k}\"]`); if(e) e.click()}", k); pg.wait_for_timeout(700)
            pg.wait_for_timeout(1200)
            # dismiss a cleanup offer if it popped up
            if pg.is_visible('#gbubble') and 'clean them up' in pg.inner_text('#gsay'):
                pg.click('#gacts .gbtn.quiet'); pg.wait_for_timeout(1400)
            pg.evaluate("document.getElementById('gcat').click()"); pg.wait_for_timeout(1300)
            btn = pg.query_selector(f'#gacts .gbtn:has-text("{tour}")')
            if not btn: res.append((tour, 'no menu button', pg.inner_text('#gsay')[:60])); continue
            btn.click()
            for step in range(4):
                ok = False
                for _ in range(40):
                    pg.wait_for_timeout(150)
                    if pg.is_visible('#gbubble') and 'Step' in pg.inner_text('#gsay') and pg.evaluate("!document.getElementById('gring').hidden"):
                        ok = True; break
                    if pg.is_visible('#gbubble') and ('Done!' in pg.inner_text('#gsay') or 'lost track' in pg.inner_text('#gsay')): break
                if not ok:
                    res.append((tour, f'end@{step}', pg.inner_text('#gsay')[:70] if pg.is_visible('#gbubble') else 'bubble hidden')); break
                pg.wait_for_timeout(500)
                c = pg.evaluate(CHECK)
                res.append((tour, f'step{step+1}', c.get('size'), c.get('pts'), c.get('say')))
                pg.screenshot(path=f'/tmp/pano-qa/{tag}-{TOURS.index(tour)}-{step+1}.png')
                acts = pg.query_selector_all('#gacts .gbtn')
                labels = [a.inner_text() for a in acts]
                pick = next((a for a in acts if a.inner_text() == 'Do it for me'), None) or next((a for a in acts if 'pri' in (a.get_attribute('class') or '')), None)
                if not pick: res.append((tour, 'no action', labels)); break
                try: pick.click(timeout=3000)
                except Exception as e: res.append((tour, 'click-race', str(e)[:40]))
                pg.wait_for_timeout(900)
        res.append(('errors', errs))
        b.close()
    return res
tag = sys.argv[1]
for r in run(tag, *SIZES[tag], CLUTTER): print(tag, *r)
