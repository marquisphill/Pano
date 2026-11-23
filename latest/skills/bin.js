/* Skill: drop him on the Recycle Bin and he is not having it. He refuses, sits beside it,
   licks a paw and complains.
   Needs from the page: a bin icon.
     bin: { icon() }     returns the bin icon's element
   The page supplies the icon's own .binhot and .binreject styles. His moods (wary, meh, lick)
   are in pano.css and his complaint is in his brain under lines.bin. */
Pano.skill('bin', {
  needs: ['bin'],
  start(p, host) {
    const binIcon = host.bin.icon || (() => null);
    const gcat = p.cat, gbodyEl = p.body, reduce = p.reduce, narrow = p.narrow, sleep = p.sleep;
    let sulking = false;
    function calm() {
      gcat.classList.remove('wary', 'meh', 'lick');
      const bin = binIcon(); if (bin) bin.classList.remove('binhot', 'binreject');
      sulking = false;
    }
    // his middle is over the bin icon, and the icon isn't hidden behind a window
    function overBin() {
      const bin = binIcon(); if (!bin) return false;
      const b = bin.getBoundingClientRect(), c = gcat.getBoundingClientRect(), pad = 14;
      const cx = c.left + c.width / 2, cy = c.top + c.height / 2;
      if (!(cx > b.left - pad && cx < b.right + pad && cy > b.top - pad && cy < b.bottom + pad)) return false;
      const under = document.elementsFromPoint(b.left + b.width / 2, b.top + b.height / 2).find(n => !n.closest('#gcat, #gbubble, #gring'));
      return !!under && bin.contains(under);
    }
    async function refuseRecycle() {
      const token = p.take();
      p.stopTour(); p.ringOff(); p.hideBubble();
      p.stopIdle(); sulking = true;
      p.ga('pano_recycle_attempt', {});
      const bin = binIcon(), b = bin.getBoundingClientRect();
      bin.classList.remove('binhot', 'binreject'); void bin.offsetWidth; bin.classList.add('binreject');
      gcat.classList.remove('wary'); gcat.classList.add('meh');
      // the bin spits him out into open wallpaper beside it (on phones, to his usual talking spot)
      const spot = narrow() ? p.dockSpot() : p.clampSpot({ x: b.right + 34, y: b.top + b.height / 2 - p.catH() / 2 + 14 }, p.catW(), p.catH() + 48);
      await p.moveCat(spot, false);
      if (!p.mine(token)) return p.calm();
      if (!reduce) gbodyEl.animate([{ transform: 'scale(1.08,.84)' }, { transform: 'scale(.97,1.04)', offset: .55 }, { transform: 'none' }], { duration: 500, easing: 'cubic-bezier(.3,1.4,.5,1)' });
      await sleep(reduce ? 0 : 620);
      if (!p.mine(token)) return p.calm();
      gcat.classList.add('lick');
      await sleep(reduce ? 0 : 750);
      if (!p.mine(token)) return p.calm();
      p.say(p.named() + p.L.bin.refuse);
      gcat.classList.remove('talk');   // he says it without looking up from his paw
      await sleep(4600);
      if (!p.mine(token)) { if (!p.dragging()) p.calm(); return; }
      gcat.classList.remove('lick');
      await sleep(reduce ? 0 : 900);
      if (!p.mine(token)) return;
      sulking = false; gcat.classList.remove('meh'); bin.classList.remove('binreject');
      p.armIdle();
    }

    return {
      calm,
      // while he is being dragged: the bin lights up and he looks wary when he is over it
      dragMove() {
        const hot = overBin();
        const bin = binIcon(); if (bin) bin.classList.toggle('binhot', hot);
        gcat.classList.toggle('wary', hot);
      },
      // when he is let go: over the bin, this skill takes it from there
      drop() {
        if (overBin()) return refuseRecycle;
        gcat.classList.remove('wary');
        return null;
      },
      keepsHimHere: () => sulking        // he does not tuck away mid-sulk
    };
  }
});
