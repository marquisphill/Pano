/* Paño's adapter for this site: it tells him what the site has. Every page loads it right after pano.js.
   Made from kit/templates/setup.js (github.com/marquisphill/Pano). kit/SETUP.md explains each entry. */
(function () {
  if (!window.Pano) return;                  // his files did not load: the site carries on without him
  var here = document.currentScript.src;     // this file's address, so the brain is found from any page
  var site = 'TODO-site-name';               // short and unique to this site (letters and dashes): it keeps what
                                             // he remembers in the browser apart from other sites on the same domain

  // The background changer: a layer behind the page whose look he changes. Its looks are in colors.css.
  // No background changer? Delete these two lines and the "background" entry below.
  var desk = document.getElementById('pano-backdrop');
  if (!desk) { desk = document.createElement('div'); desk.id = 'pano-backdrop'; document.body.prepend(desk); }

  Pano.init({
    brain: new URL('brain.json', here).href,           // pano/brain.json, beside this file
    layout: {
      bar: { wide: 0, narrow: 0 },                     // space to keep clear at the bottom of the screen (a fixed bottom bar's height)
      safeArea: true,                                  // and keep clear of a phone's gesture bar
      scrolls: true                                    // the page scrolls: he scrolls what he points at into view
    },
    keys: { greeted: site + '-pano-greeted', head: site + '-pano-head' },
    background: {
      desk: desk,
      walls: ['plain', 'sky', 'peach', 'mint', 'paper'],   // the first is the site as it is; the rest are styled in colors.css
      modes: ['protan', 'deutan', 'tritan', 'mono'],       // colorblind modes he offers (he brings these himself)
      keys: { wall: site + '-pano-wall', cb: site + '-pano-cb' }
    }
  });
})();
