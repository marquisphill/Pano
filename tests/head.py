import sys
from playwright.sync_api import sync_playwright
W,H,tag=int(sys.argv[1]),int(sys.argv[2]),sys.argv[3]
U='http://localhost:8773/index.html'
with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(viewport={'width':W,'height':H}, has_touch=W<=640)
    pg=ctx.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
    cat=lambda: pg.evaluate("(()=>{const g=document.getElementById('gcat');const r=g.getBoundingClientRect();return {x:Math.round(r.left),y:Math.round(r.top),w:Math.round(r.width),h:Math.round(r.height),head:g.classList.contains('head'),z:getComputedStyle(g).zIndex}})()")
    pg.goto(U); pg.wait_for_timeout(2600)
    c=cat(); print(tag,'1 start', c, 'gap right', W-(c['x']+c['w']), 'gap bottom', H-(c['y']+c['h']), 'greeting', pg.is_visible('#gbubble'))
    pg.screenshot(path=f'/tmp/pano-qa/h-{tag}-1start.png')
    pg.click('#gx'); pg.wait_for_timeout(1500)
    print(tag,'2 after close', cat())
    pg.wait_for_timeout(10000)
    c=cat(); print(tag,'3 after 10s idle', c, 'centered?', abs((c['x']+c['w']/2)-W/2)<3)
    pg.screenshot(path=f'/tmp/pano-qa/h-{tag}-3head.png')
    # open a window and make sure the head stays on top of it
    pg.evaluate("document.querySelector('[data-open=\"app:skills\"]').click()"); pg.wait_for_timeout(1200)
    top=pg.evaluate("(()=>{const r=document.getElementById('gcat').getBoundingClientRect();const e=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return !!(e&&e.closest('#gcat'))})()")
    print(tag,'4 head on top of window', top)
    pg.screenshot(path=f'/tmp/pano-qa/h-{tag}-4overwin.png')
    # drag the head to the left side
    c=cat(); sx,sy=c['x']+c['w']/2,c['y']+c['h']/2
    pg.mouse.move(sx,sy); pg.mouse.down(); pg.mouse.move(sx-120,sy+40,steps=8); pg.mouse.move(80,sy+60,steps=8); pg.mouse.up(); pg.wait_for_timeout(500)
    c1=cat(); print(tag,'5 dragged head', c1, 'menu opened by drag?', pg.is_visible('#gbubble'))
    pg.wait_for_timeout(11000); print(tag,'6 stays after idle', cat()==c1)
    # tap the head -> menu
    pg.click('#gcat'); pg.wait_for_timeout(1500)
    print(tag,'7 tap head', cat(), 'menu:', pg.inner_text('#gsay')[:40] if pg.is_visible('#gbubble') else 'none')
    pg.screenshot(path=f'/tmp/pano-qa/h-{tag}-7menu.png')
    # drag the full cat while the menu is up
    c=cat(); sx,sy=c['x']+c['w']/2,c['y']+c['h']/2
    pg.mouse.move(sx,sy); pg.mouse.down(); pg.mouse.move(sx+150,sy+120,steps=10); pg.mouse.up(); pg.wait_for_timeout(400)
    print(tag,'8 dragged full cat', cat(), 'menu still', pg.is_visible('#gbubble'))
    # start a tour, then stop it and let him go idle
    btn=pg.query_selector('#gacts .gbtn:has-text("Get in touch")')
    if btn: btn.click()
    pg.wait_for_timeout(3000); print(tag,'9 tour', pg.inner_text('#gsay')[:40] if pg.is_visible('#gbubble') else 'none', cat()['head'])
    st=pg.query_selector('#gacts .gbtn:has-text("Stop the tour")')
    if st: st.click()
    pg.wait_for_timeout(12500); c=cat(); print(tag,'10 back to head after tour', c['head'], 'at dragged spot', abs(c['x']-c1['x'])<3 and abs(c['y']-c1['y'])<3)
    pg.reload(); pg.wait_for_timeout(2500); print(tag,'11 reload keeps head', cat()['head'])
    print(tag,'errors',errs); b.close()
