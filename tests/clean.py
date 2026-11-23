import sys
from playwright.sync_api import sync_playwright
W,H,tag=int(sys.argv[1]),int(sys.argv[2]),sys.argv[3]
with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(viewport={'width':W,'height':H})
    ctx.add_init_script("try{sessionStorage.setItem('catGreeted','1')}catch(e){}")
    pg=ctx.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('http://localhost:8773/index.html'); pg.wait_for_timeout(1800)
    lock=pg.query_selector('#lock')
    if lock and lock.is_visible(): lock.click(); pg.wait_for_timeout(800)
    for k in ['folder:experience','app:resume','app:contact','app:skills']:
        ic=pg.query_selector(f'.dicon[data-open="{k}"]')
        if not ic: print('no icon',k); continue
        (ic.dblclick() if W>640 else pg.evaluate("k=>document.querySelector(`.dicon[data-open=\"${k}\"]`).click()",k)); pg.wait_for_timeout(900)
    n=lambda: pg.evaluate("document.querySelectorAll('#layer .window').length")
    print(tag,'windows open:',n())
    pg.wait_for_timeout(1500)
    print(tag,'bubble:',pg.inner_text('#gsay') if pg.is_visible('#gbubble') else 'HIDDEN')
    pg.screenshot(path=f'/tmp/pano-qa/clean-{tag}-1ask.png')
    top=pg.evaluate("(()=>{let b=null;document.querySelectorAll('#layer .window').forEach(w=>{if(!b||+w.style.zIndex>+b.style.zIndex)b=w});return b&&b.getAttribute('aria-label')})()")
    print(tag,'focused:',top)
    pg.click('#gacts .gbtn.pri'); pg.wait_for_timeout(430)
    pg.screenshot(path=f'/tmp/pano-qa/clean-{tag}-2eat.png')
    pg.wait_for_timeout(3500)
    left=pg.evaluate("[...document.querySelectorAll('#layer .window')].map(w=>w.getAttribute('aria-label'))")
    print(tag,'left:',left, '| tasks:',pg.evaluate("document.querySelectorAll('#tasks > *').length"))
    pg.screenshot(path=f'/tmp/pano-qa/clean-{tag}-3done.png')
    print(tag,'bubble after:',pg.inner_text('#gsay') if pg.is_visible('#gbubble') else 'HIDDEN')
    # reopen 4 more: should ask again since it re-armed
    for k in ['folder:experience','app:resume','app:contact']:
        pg.evaluate("k=>document.querySelector(`.dicon[data-open=\"${k}\"]`).click()",k); pg.wait_for_timeout(900)
    pg.wait_for_timeout(1500)
    print(tag,'asks again:',pg.is_visible('#gbubble') and 'clean them up' in pg.inner_text('#gsay'))
    print(tag,'errors:',errs); b.close()
