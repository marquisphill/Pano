from playwright.sync_api import sync_playwright
U='http://localhost:8773/index.html'
with sync_playwright() as p:
    b=p.chromium.launch()
    for tag,W in (('desk',1280),('phone',390)):
        c=b.new_context(viewport={'width':W,'height':800}, has_touch=W<=640); pg=c.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
        st=lambda: pg.evaluate("(()=>{const g=document.getElementById('gcat');const r=g.getBoundingClientRect();return {cls:[...g.classList].filter(x=>x!=='gcat').join(' '),x:Math.round(r.left),y:Math.round(r.top),say:document.getElementById('gbubble').hidden?null:document.getElementById('gsay').innerText.replace(/\\n/g,' ')}})()")
        binc=lambda: pg.evaluate("(()=>{const r=document.querySelector('.dicon[data-open=\"folder:recycle\"]').getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2,document.querySelector('.dicon[data-open=\"folder:recycle\"]').className]})()")
        def drag_to(x,y,hold=0):
            r=pg.query_selector('#gcat').bounding_box(); pg.mouse.move(r['x']+r['width']/2,r['y']+r['height']/2); pg.mouse.down(); pg.mouse.move(x,y,steps=10)
            if hold: pg.wait_for_timeout(hold)
        pg.goto(U); pg.wait_for_timeout(2600); pg.click('#gx'); pg.wait_for_timeout(500)
        bx,by,_=binc()
        drag_to(bx,by,600); print(tag,'1 held over bin',st()['cls'],'| bin:',binc()[2]); pg.screenshot(path=f'/tmp/pano-qa/bin-{tag}-1wary.png')
        pg.mouse.up(); pg.wait_for_timeout(900); print(tag,'2 spat out',st())
        pg.wait_for_timeout(1500); s=st(); print(tag,'3 licking + line',s); pg.screenshot(path=f'/tmp/pano-qa/bin-{tag}-3lick.png')
        pg.mouse.move(5,400); pg.wait_for_timeout(5200); print(tag,'4 after lick',st())
        pg.wait_for_timeout(6500); print(tag,'5 later',st())
        # head mode: drag the head onto the bin
        if 'head' in st()['cls']:
            drag_to(bx,by,300); pg.mouse.up(); pg.wait_for_timeout(2600); print(tag,'6 head dropped on bin',st())
        # interrupt mid-sulk by tapping him -> menu, calm
        pg.wait_for_timeout(300); pg.click('#gcat'); pg.wait_for_timeout(1600); print(tag,'7 tapped mid-sulk',st()['cls'], (st()['say'] or '')[:30])
        pg.is_visible('#gx') and pg.click('#gx'); pg.wait_for_timeout(600)
        # drop beside the bin (not on it): nothing
        drag_to(bx+ (300 if W>640 else 0), by+ (0 if W>640 else 330)); pg.mouse.up(); pg.wait_for_timeout(700); print(tag,'8 dropped elsewhere',st()['cls'] or 'calm', st()['say'])
        # bin hidden behind a window: no reaction (desktop)
        if W>640:
            pg.evaluate("document.querySelector('[data-open=\"app:skills\"]').click()"); pg.wait_for_timeout(1000)
            pg.evaluate("(()=>{const w=document.querySelector('#layer .window.active');w.style.left='0px';w.style.top='0px'})()")
            drag_to(bx,by,300); print(tag,'9 over covered bin',st()['cls']); pg.mouse.up(); pg.wait_for_timeout(800); print(tag,'9 dropped',st()['say'])
        print(tag,'errors',errs); c.close()
    b.close()
