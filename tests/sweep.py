from playwright.sync_api import sync_playwright
BASE='http://localhost:8773/'
out=[]
with sync_playwright() as p:
    b=p.chromium.launch()
    for tag,(W,H) in {'desk':(1280,800),'fold':(880,900),'phone':(390,800)}.items():
        ctx=b.new_context(viewport={'width':W,'height':H}, has_touch=W<=640)
        ctx.add_init_script("try{sessionStorage.setItem('catGreeted','1')}catch(e){}")
        pg=ctx.new_page(); errs=[]; bad=[]
        pg.on('pageerror',lambda e:errs.append(str(e)[:120]))
        pg.on('console',lambda m:errs.append('console:'+m.text[:120]) if m.type=='error' else None)
        pg.on('response',lambda r: bad.append(f'{r.status} {r.url}') if r.status>=400 and 'localhost' in r.url else None)
        pg.on('requestfailed',lambda r: bad.append(f'FAIL {r.url}') if 'localhost' in r.url else None)
        # pages
        for page in ['index.html','hackathon.html','labs.html','labs/impact-dashboard.html','labs/skills-radar.html']:
            pg.goto(BASE+page); pg.wait_for_timeout(1500)
            ov=pg.evaluate("Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)-innerWidth")
            imgs=pg.evaluate("[...document.images].filter(i=>i.complete&&i.naturalWidth===0).map(i=>i.getAttribute('src'))")
            links=pg.evaluate("[...document.querySelectorAll('a[href]')].map(a=>a.getAttribute('href')).filter(h=>h&&!/^(https?:|mailto:|tel:|#|javascript:)/.test(h))")
            out.append((tag,page,'h-overflow',ov,'broken-img',imgs,'local-links',sorted(set(links))[:12]))
        # hash links
        for h in ['resume','contact','skills','experience','projects','ailab','kind-words','readme']:
            pg.goto(BASE+'index.html#'+h); pg.wait_for_timeout(1500)
            wins=pg.evaluate("[...document.querySelectorAll('#layer .window')].filter(w=>!w.hidden).map(w=>w.getAttribute('aria-label'))")
            out.append((tag,'#'+h,wins))
        # resize with windows open: are windows reachable on screen afterward?
        pg.goto(BASE+'index.html'); pg.wait_for_timeout(1500)
        for k in ['app:contact','app:skills']:
            pg.evaluate("k=>document.querySelector(`[data-open=\"${k}\"]`).click()",k); pg.wait_for_timeout(700)
        pg.set_viewport_size({'width':390 if W>640 else 1280,'height':800}); pg.wait_for_timeout(900)
        offs=pg.evaluate("[...document.querySelectorAll('#layer .window')].map(w=>{const r=w.getBoundingClientRect();return [w.getAttribute('aria-label').slice(0,10),Math.round(r.left),Math.round(r.top),Math.round(r.right),Math.round(r.bottom),w.classList.contains('max')]})")
        cat=pg.evaluate("(()=>{const r=document.getElementById('gcat').getBoundingClientRect();return [Math.round(r.left),Math.round(r.top),innerWidth,innerHeight]})()")
        out.append((tag,'after-resize windows',offs,'cat',cat))
        out.append((tag,'errors',errs[:8],'bad-requests',sorted(set(bad))[:10]))
        ctx.close()
    b.close()
for o in out: print(*o)
