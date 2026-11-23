from playwright.sync_api import sync_playwright
U='http://localhost:8773/index.html'
with sync_playwright() as p:
    b=p.chromium.launch()
    for W in (1280,390):
        def fresh():
            c=b.new_context(viewport={'width':W,'height':800}, has_touch=W<=640); pg=c.new_page(); pg.goto(U); pg.wait_for_timeout(2600); return c,pg
        head=lambda pg: pg.evaluate("document.getElementById('gcat').classList.contains('head')")
        def timeit(pg, limit=14000):
            t=0
            while t<limit:
                if head(pg): return round(t/1000,1)
                pg.wait_for_timeout(250); t+=250
            return None
        park=lambda pg: pg.mouse.move(5,300)
        # A: close the chat with X
        c,pg=fresh(); pg.click('#gx'); park(pg); print(W,'A close chat ->',timeit(pg),'s'); 
        # B: tap the head, then ignore the open menu
        pg.click('#gcat'); pg.wait_for_timeout(1300); park(pg); print(W,'B menu left unanswered ->',round(timeit(pg)+1.3,1),'s after tap')
        # C: tour step ignored
        pg.click('#gcat'); pg.wait_for_timeout(1300); pg.click('#gacts .gbtn:has-text("Read his history")'); pg.wait_for_timeout(2200); park(pg)
        print(W,'C tour step ignored ->',timeit(pg),'s after choosing'); c.close()
        # D: tour, user keeps working inside the target window for 16s
        c,pg=fresh(); pg.click('#gacts .gbtn:has-text("Read his history")'); pg.wait_for_timeout(2500); pg.click('#gacts .gbtn:has-text("Do it for me")'); pg.wait_for_timeout(2500)
        box=pg.query_selector('#layer .window.active .files').bounding_box()
        for i in range(16):
            pg.mouse.move(box['x']+20+i*6, box['y']+box['height']-20-(i%3)*5); pg.mouse.wheel(0,40); pg.wait_for_timeout(1000)
        print(W,'D active in tour window for 16s, still guiding:',not head(pg)); park(pg); print(W,'D then idle ->',timeit(pg),'s')
        c.close()
        # E: drag him (no chat) -> 4s after drop;  F: "Just looking around" note
        c,pg=fresh(); pg.click('#gacts .gbtn:has-text("Just looking around")'); park(pg); print(W,'F after "Just looking around" ->',timeit(pg),'s')
        pg.click('#gcat'); pg.wait_for_timeout(1300); pg.click('#gx'); pg.wait_for_timeout(300)
        r=pg.query_selector('#gcat').bounding_box(); pg.mouse.move(r['x']+20,r['y']+20); pg.mouse.down(); pg.mouse.move(300,300,steps=6); pg.mouse.up(); park(pg)
        print(W,'E after dragging him ->',timeit(pg),'s')
        # G: pointer resting on his bubble keeps him there (desktop)
        if W>640:
            pg.click('#gcat'); pg.wait_for_timeout(1400); bb=pg.query_selector('#gbubble').bounding_box(); pg.mouse.move(bb['x']+40,bb['y']+20); pg.wait_for_timeout(13000)
            print(W,'G pointer on bubble 13s, still there:',not head(pg)); park(pg); print(W,'G after leaving ->',timeit(pg),'s')
        c.close()
        # H: cleanup question waits 10s
        c,pg=fresh(); pg.click('#gx'); pg.wait_for_timeout(300)
        for k in ['folder:experience','app:resume','app:contact','app:skills']:
            pg.evaluate("k=>document.querySelector(`.dicon[data-open=\"${k}\"]`).click()",k); pg.wait_for_timeout(700)
        pg.wait_for_timeout(1500); q=pg.is_visible('#gbubble') and 'clean them up' in pg.inner_text('#gsay'); park(pg)
        print(W,'H cleanup question shown',q,'-> tucks away after',timeit(pg),'s more'); c.close()
    b.close()
