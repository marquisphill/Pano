from playwright.sync_api import sync_playwright
from PIL import Image
U='http://localhost:8773/index.html'
def sat(path, box=None):
    im=Image.open(path).convert('RGB'); im=im.crop(box) if box else im; im=im.resize((64,36))
    px=list(im.getdata()); return round(sum(max(p)-min(p) for p in px)/len(px),1)
with sync_playwright() as p:
    b=p.chromium.launch()
    for tag,(W,H) in {'desk':(1280,800),'phone':(390,800)}.items():
        c=b.new_context(viewport={'width':W,'height':H}, has_touch=W<=640); pg=c.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
        btn=lambda t: pg.click(f'#gacts .gbtn:has-text("{t}")')
        acts=lambda: [x.inner_text() for x in pg.query_selector_all('#gacts .gbtn')]
        state=lambda: pg.evaluate("({wall:document.getElementById('desktop').dataset.wall||'mountain',cb:document.documentElement.dataset.cb||null,filter:getComputedStyle(document.documentElement).filter,bg:getComputedStyle(document.getElementById('desktop')).backgroundColor,say:document.getElementById('gbubble').hidden?null:document.getElementById('gsay').innerText.replace(/\\n/g,' '),leftovers:document.querySelectorAll('.grayveil,.wipeline,.wallnext').length})")
        pg.goto(U); pg.wait_for_timeout(2600)
        print(tag,'menu',acts())
        btn('Change the background'); pg.wait_for_timeout(1200); print(tag,'Q1',state()['say'],acts())
        btn('All green'); pg.wait_for_timeout(500); print(tag,'Q2',state()['say'],acts())
        btn('Yes'); pg.wait_for_timeout(500); print(tag,'Q3',state()['say'],acts())
        pg.screenshot(path=f'/tmp/pano-qa/wall-{tag}-0before.png')
        btn('Green-weak'); pg.wait_for_timeout(300); print(tag,'says',state()['say'])
        pg.wait_for_timeout(2000); pg.screenshot(path=f'/tmp/pano-qa/wall-{tag}-1gray.png'); print(tag,'grey phase saturation',sat(f'/tmp/pano-qa/wall-{tag}-1gray.png'),'(before:',sat(f'/tmp/pano-qa/wall-{tag}-0before.png'),')', 'wall still',state()['wall'])
        pg.wait_for_timeout(2300); pg.screenshot(path=f'/tmp/pano-qa/wall-{tag}-2wipe.png')
        top=sat(f'/tmp/pano-qa/wall-{tag}-2wipe.png',(0,0,W,int(H*.25))); bot=sat(f'/tmp/pano-qa/wall-{tag}-2wipe.png',(0,int(H*.8),W,H-60)); print(tag,'mid-wipe saturation top',top,'bottom',bot)
        pg.wait_for_timeout(1800); pg.screenshot(path=f'/tmp/pano-qa/wall-{tag}-3done.png'); print(tag,'done',state(),acts())
        btn('Thanks, Paño'); pg.wait_for_timeout(800)
        pg.reload(); pg.wait_for_timeout(2500); s=state(); print(tag,'after reload',s['wall'],s['cb'])
        # No path: back to mountains, mode cleared
        pg.click('#gcat'); pg.wait_for_timeout(1500)
        if not pg.is_visible('#gbubble'): pg.click('#gcat'); pg.wait_for_timeout(1500)
        btn('Change the background'); pg.wait_for_timeout(1200); btn('Misty mountains'); pg.wait_for_timeout(400); btn('No'); pg.wait_for_timeout(1500); pg.screenshot(path=f'/tmp/pano-qa/wall-{tag}-4nowipe.png'); pg.wait_for_timeout(2200); s=state(); print(tag,'No path',s)
        # each remaining mode applies a real filter
        for m in ['Red-weak','Blue-yellow','No color']:
            pg.wait_for_timeout(3200); pg.click('#gcat'); pg.wait_for_timeout(1500)
            if not pg.is_visible('#gbubble') or 'Change the background' not in acts(): pg.click('#gcat'); pg.wait_for_timeout(1500)
            btn('Change the background'); pg.wait_for_timeout(1200); btn('All black'); pg.wait_for_timeout(300); btn('Yes'); pg.wait_for_timeout(300); btn(m); pg.wait_for_timeout(6200); s=state(); print(tag,m,'->',s['cb'],s['filter'],s['wall'],s['leftovers'])
            btn('Thanks, Paño'); 
        print(tag,'errors',errs); c.close()
    b.close()
