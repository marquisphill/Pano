from playwright.sync_api import sync_playwright
U='http://localhost:8773/index.html'
OPEN="k=>document.querySelector(`[data-open=\"${k}\"]`).click()"
CTRLS="""()=>[...document.querySelectorAll('#layer .window')].filter(w=>w.style.visibility!=='hidden').map(w=>{const out=[w.getAttribute('aria-label').slice(0,14)];for(const a of ['min','max','close']){const b=w.querySelector(`[data-act="${a}"]`).getBoundingClientRect();const e=document.elementFromPoint(b.left+b.width/2,b.top+b.height/2);out.push(!!(e&&e.closest(`[data-act="${a}"]`)&&e.closest('.window')===w))}const r=w.getBoundingClientRect();out.push([Math.round(r.left),Math.round(r.top),Math.round(r.width),Math.round(r.height)]);return out})"""
SCROLL="()=>[document.scrollingElement.scrollTop,document.getElementById('desktop').scrollTop,document.getElementById('layer').scrollTop]"
with sync_playwright() as p:
    b=p.chromium.launch()
    for tag,(W,H) in {'desk':(1280,800),'short':(1280,520)}.items():
        c=b.new_context(viewport={'width':W,'height':H}); c.add_init_script("try{sessionStorage.setItem('catGreeted','1')}catch(e){}")
        pg=c.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
        pg.goto(U); pg.wait_for_timeout(1600)
        # 1. the cut-off bug: skills tour used to scroll the whole desktop
        pg.click('#gcat'); pg.wait_for_timeout(1300); pg.click('#gacts .gbtn:has-text("Explore his skills")'); pg.wait_for_timeout(2500)
        pg.click('#gacts .gbtn:has-text("Do it for me")'); pg.wait_for_timeout(3000)
        print(tag,'1 after skills tour step: stage scroll',pg.evaluate(SCROLL), pg.evaluate(CTRLS))
        pg.click('#gacts .gbtn:has-text("Stop the tour")'); pg.wait_for_timeout(1200)
        # step link in a case study
        pg.evaluate(OPEN,'doc:reports') if pg.query_selector('[data-open="doc:reports"]') else pg.evaluate("location.hash='#ailab'")
        pg.goto('about:blank'); pg.goto(U+'#ailab'); pg.wait_for_timeout(1500)
        pg.query_selector('#layer .window .file:has-text("Report Consolidator")').dblclick(); pg.wait_for_timeout(1500)
        pg.query_selector_all('#layer .window .diagram .node')[5].click(); pg.wait_for_timeout(900)
        print(tag,'1b after step link: stage scroll',pg.evaluate(SCROLL))
        # 2. resize from the bottom-right corner and the left edge
        w=pg.query_selector('#layer .window.active'); r=w.bounding_box()
        pg.mouse.move(r['x']+r['width']+1,r['y']+r['height']+1); pg.mouse.down(); pg.mouse.move(r['x']+r['width']-200,r['y']+r['height']-150,steps=6); pg.mouse.up()
        r2=w.bounding_box(); print(tag,'2 corner resize',[round(r['width']),round(r['height'])],'->',[round(r2['width']),round(r2['height'])])
        pg.mouse.move(r2['x']-1,r2['y']+r2['height']/2); pg.mouse.down(); pg.mouse.move(r2['x']+90,r2['y']+r2['height']/2,steps=5); pg.mouse.up()
        r3=w.bounding_box(); print(tag,'2 left-edge resize width',round(r2['width']),'->',round(r3['width']),'right edge fixed',abs((r2['x']+r2['width'])-(r3['x']+r3['width']))<2)
        pg.mouse.move(r3['x']+r3['width']/2,r3['y']+r3['height']+1); pg.mouse.down(); pg.mouse.move(r3['x'],2000,steps=4); pg.mouse.up()
        r4=w.bounding_box(); print(tag,'2 cannot grow under taskbar',round(r4['y']+r4['height'])<=H-44)
        # drag the title bar far right / up: buttons must stay reachable
        pg.mouse.move(r4['x']+120,r4['y']+12); pg.mouse.down(); pg.mouse.move(5000,-500,steps=6); pg.mouse.up(); pg.wait_for_timeout(200)
        print(tag,'2 after wild drag',[x for x in pg.evaluate(CTRLS) if 'Report' in x[0]])
        # 3. organize: open more windows, use the menu
        for k in ['app:contact','app:skills','app:resume']: pg.evaluate(OPEN,k); pg.wait_for_timeout(800)
        pg.wait_for_timeout(1800)
        print(tag,'3 offer',[x.inner_text() for x in pg.query_selector_all('#gacts .gbtn')] if pg.is_visible('#gbubble') else 'none')
        pg.click('#gacts .gbtn:has-text("No thanks")'); pg.wait_for_timeout(4200)
        pg.click('#gcat'); pg.wait_for_timeout(1400)
        print(tag,'3 menu',[x.inner_text() for x in pg.query_selector_all('#gacts .gbtn')])
        pg.click('#gacts .gbtn:has-text("Organize windows")'); pg.wait_for_timeout(2600)
        res=pg.evaluate(CTRLS); print(tag,'3 organized', 'all buttons reachable:',all(x[1] and x[2] and x[3] for x in res)); [print('    ',x) for x in res]
        pg.screenshot(path=f'/tmp/pano-qa/org-{tag}.png')
        # click a back window's title bar -> comes forward; minimize one from the stack
        back=pg.evaluate("(()=>{const ws=[...document.querySelectorAll('#layer .window')].sort((a,b)=>+a.style.zIndex-+b.style.zIndex);const r=ws[0].querySelector('.ttl').getBoundingClientRect();return [r.left+20,r.top+8,ws[0].getAttribute('aria-label')]})()")
        pg.mouse.click(back[0],back[1]); pg.wait_for_timeout(300)
        print(tag,'3 clicked back window ->active', pg.evaluate("document.querySelector('#layer .window.active').getAttribute('aria-label')")==back[2])
        # 4. close all from the menu
        pg.wait_for_timeout(3000); pg.click('#gcat'); pg.wait_for_timeout(1400)
        pg.click('#gacts .gbtn:has-text("Close all windows")'); pg.wait_for_timeout(6000)
        print(tag,'4 after close all',pg.evaluate("[...document.querySelectorAll('#layer .window')].map(w=>w.getAttribute('aria-label'))"), 'kept was front:', back[2][:14])
        # menu with 1 window: no extras
        pg.click('#gcat'); pg.wait_for_timeout(1500); print(tag,'4 menu with one window',[x.inner_text() for x in pg.query_selector_all('#gacts .gbtn')][-3:])
        # shrink the browser: windows stay reachable
        pg.evaluate(OPEN,'app:skills'); pg.wait_for_timeout(900); pg.set_viewport_size({'width':700,'height':420}); pg.wait_for_timeout(500)
        print(tag,'5 after browser shrink',pg.evaluate(CTRLS))
        print(tag,'errors',errs); c.close()
    b.close()
