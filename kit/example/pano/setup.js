/* Paño's adapter for this site: it tells him what the site has. Every page loads it right after pano.js.
   Made from kit/templates/setup.js (github.com/marquisphill/Pano). kit/SETUP.md explains each entry. */
(function () {
  if (!window.Pano) return;                  // his files did not load: the site carries on without him
  var here = document.currentScript.src;     // this file's address, so the brain is found from any page
  var site = 'pebblewick';                   // short and unique to this site: keeps what he remembers apart from other sites

  // The background changer: a layer behind the page whose look he changes. Its looks are in colors.css.
  var desk = document.getElementById('pano-backdrop');
  if (!desk) { desk = document.createElement('div'); desk.id = 'pano-backdrop'; document.body.prepend(desk); }

  Pano.init({
    brain: new URL('brain.json', here).href,
    layout: { bar: { wide: 0, narrow: 0 }, safeArea: true, scrolls: true },
    keys: { greeted: site + '-pano-greeted', head: site + '-pano-head' },
    background: {
      desk: desk,
      walls: ['plain', 'sky', 'peach', 'mint', 'paper'],
      modes: ['protan', 'deutan', 'tritan', 'mono'],
      keys: { wall: site + '-pano-wall', cb: site + '-pano-cb' }
    }
  });
})();
