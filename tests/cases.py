from playwright.sync_api import sync_playwright
U='http://localhost:8773/index.html'
with sync_playwright() as p:
    b=p.chromium.launch()
    for tag,(W,H) in {'desk':(1280,800),'fold':(880,900),'phone':(390,800)}.items():
        c=b.new_context(viewport={'width':W,'height':H}); c.add_init_script("try{sessionStorage.setItem('catGreeted','1')}catch(e){}")
        pg=c.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
        for key in ['brdskill','reports']:
            pg.goto('about:blank'); pg.goto(U+'#ailab'); pg.wait_for_timeout(1500)
            # open from the AI Lab folder like a visitor would
            name='BRD Digest' if key=='brdskill' else 'Report Consolidator'
            f=pg.query_selector(f'#layer .window .file:has-text("{name}")')
            f.dblclick() if W>640 else f.click(); pg.wait_for_timeout(1400)
            if W<=640 and not pg.query_selector('.window[aria-label*="Pipeline"]'):
                pg.click('#layer .window [data-x=open]'); pg.wait_for_timeout(1400)
            if W>640 and not pg.query_selector(f'.window[aria-label*="Pipeline"]'):
                f.click(); pg.wait_for_timeout(300); pg.click('#layer [data-x="open"]'); pg.wait_for_timeout(1400)
            win=pg.evaluate("(()=>{const ws=[...document.querySelectorAll('#layer .window')];const w=ws.sort((a,b)=>+b.style.zIndex-+a.style.zIndex)[0];const pgw=w.querySelector('.page');const d=w.querySelector('.diagram');const r=w.getBoundingClientRect();return {title:w.getAttribute('aria-label'),sheet:pgw&&pgw.classList.contains('sheet'),w:Math.round(r.width),flowDir:d?getComputedStyle(d.querySelector('.flow')).flexDirection:null,pageW:Math.round(pgw.getBoundingClientRect().width),hscroll:w.querySelector('.pagewrap').scrollWidth-w.querySelector('.pagewrap').clientWidth}})()")
            pg.screenshot(path=f'/tmp/pano-qa/case-{tag}-{key}.png')
            # click the 3rd step node and confirm its section scrolls into view
            node=pg.query_selector_all('#layer .window .diagram .node')[2]
            target=node.get_attribute('data-goto'); node.click(); pg.wait_for_timeout(900)
            vis=pg.evaluate(f"(()=>{{const t=document.querySelector('[data-step=\"{target}\"]');const w=t.closest('.pagewrap').getBoundingClientRect();const r=t.getBoundingClientRect();return r.top>=w.top-2&&r.top<w.bottom-40}})()")
            pg.screenshot(path=f'/tmp/pano-qa/case-{tag}-{key}-step.png')
            print(tag,key,win,'step',target,'in view',vis)
        print(tag,'errors',errs); c.close()
    b.close()
