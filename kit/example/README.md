# The kit's example site

Pebblewick Pottery is a made-up studio: the place, the address and the email (`example.com`) are fictional. It is here to show a finished Paño setup, made from `kit/templates/`.

- **Paño** is called Pip here, with clay-orange fur and a cream bubble (`pano/colors.css`).
- **Two pages,** `index.html` and `classes.html`, both loading the same brain.
- **Three things he helps with,** in `pano/brain.json`, each showing one way to write a tour:
  - *What do you make?* is only on the home page, where the gallery is (`"pages": ["../index.html"]`).
  - *How do I join a class?* crosses pages: on the home page it points at the Classes link (`join-here`), and on the classes page the tour with the same label shows the sign-up form (`join`).
  - *When can I visit?* points at the footer, which every page has, so it has no `pages`.
- **The background changer** with the kit's light set of backgrounds, and the colorblind modes.

Each page has the 4 lines from `kit/templates/adapter.html`, and `pano/setup.js` is the template with the site's name filled in.

To try it: `python3 kit/check_site.py kit/example` from the repo's folder (add `--engine .` to use this copy of Paño's files instead of the ones online). It should end with "All good".
