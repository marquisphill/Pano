# Setting up Paño on a site

**This page is for the AI doing the setup.** Someone has asked you to put Paño on their website. Paño is a red cartoon cat who walks onto the page, greets visitors and gives them short guided tours. He is scripted: he says only what his brain file says. There is no AI chat, no API key and no account.

Follow the steps in order. When you write the brain, keep [BRAIN.md](BRAIN.md) open: it lists every field.

## Where the kit is

Everything is in the repository `github.com/marquisphill/Pano`, in the `kit/` folder:

| File | What it is |
| --- | --- |
| `SETUP.md` | This page. |
| `BRAIN.md` | Every field of a brain, with examples. |
| `brain.schema.json` | The brain's format, as JSON Schema. |
| `check_site.py` | Tries Paño on the site: runs `Pano.check()` on every page and walks every tour at phone and desktop sizes. |
| `templates/` | The files you copy into the site and fill in: `brain.json`, `setup.js`, `colors.css`, and `adapter.html` (the lines each page gets). |
| `example/` | A small made-up site with Paño fully set up. When in doubt, copy what it does. |

**Clone the repository** into a scratch folder outside the site (`git clone https://github.com/marquisphill/Pano`), so you have the templates and `check_site.py` at hand. If you can't clone, read the files at `https://raw.githubusercontent.com/marquisphill/Pano/main/kit/...`. Never put the clone inside the site.

## What you will make

```
their-site/
  index.html          + 2 lines in <head> and 2 before </body> (from templates/adapter.html)
  other pages...      + the same 4 lines
  pano/brain.json     what he says and his tours
  pano/setup.js       the adapter: tells him what the site has
  pano/colors.css     his colors, his bubble's colors, and the backgrounds he offers
```

Plus an `id` on each element his tours point at, where it has none.

## Rules

1. **Never copy Paño's engine into the site.** `pano.js`, `pano.css`, `base.json` and `skills/` are always loaded from `https://marquisphill.github.io/Pano/...`. Use the addresses in `templates/adapter.html` exactly.
2. **Change only what Paño needs.** Add the `pano/` folder, the 4 lines on each page, and `id`s. Don't change how the site looks, reads or works.
3. **He writes nothing new.** Everything he says is in `pano/brain.json`. You never write JavaScript for him beyond `setup.js` from the template.
4. **His files are public.** No personal details, passwords, keys or private notes in the brain or `setup.js`.
5. **If his files fail to load, the site must still work.** The template already does this; keep it.

## Step 1. Check the site fits

Paño works on sites made of **HTML pages you can edit**, on any host (GitHub Pages, Netlify, a web server).

- A site generator that writes plain HTML files (Jekyll, Hugo, Eleventy, Astro without client-side routing) should work: put the 4 lines in the shared layout instead of each page, and the `pano/` folder where static files are copied as they are.
- **Not supported yet:** sites drawn by JavaScript in the browser (React, Next.js, Vue or Svelte apps that change pages without loading a new one), and site builders that don't let you edit the HTML (Wix, Squarespace and similar). Tell the person this version of Paño can't go on their site yet, and stop.

If you only have the site's web address, ask for its files or repository.

## Step 2. Ask the person

Ask these in one message, numbered, with the examples, so they can answer in one go:

1. **What is the site, and who visits it?**
2. **What are the 3 things Paño should help visitors do?** Each becomes a guided tour. For example: "book a class", "see the prices", "get in touch".
3. **His name and colors.** He is a cat. By default he is Paño, a boy cat with red fur. Give him another name if you like, and a fur color (or "match my site").
4. **His tone, and his language.** For example: warm and plain, playful, or formal. By default: friendly, plain English.
5. **Should he offer the background changer?** It lets visitors choose a background behind the page, and a colorblind mode for the whole site. By default: yes.
6. **Is there anything he must never say?**

Wait for the answers. For anything left unanswered, use the default and say so. He stays a boy cat ("he") unless the person says otherwise; in a language where words change with that (Spanish, French, German...), write his lines that way.

## Step 3. Read the site and plan the tours

1. **List the pages** and read each one, the HTML and how it looks at a phone size and a desktop size.
2. **For each of the 3 things,** find where a visitor does it, and plan 1 to 3 steps (up to 5 if the thing really has more parts). Each step points at one element and says one short thing about it. The last step is usually the thing itself: the form, the button, the price list.
3. **Pick targets that will last:**
   - an element with an `id`. If it has none, add one in the HTML: short and plain, like `id="signup-form"`. It changes nothing a visitor sees.
   - never a selector that depends on layout (`main > div:nth-child(3)`): it breaks when the site changes.
   - visible when the page loads, at **every** screen size. Watch for menus that fold behind a ☰ button on phones: a link inside one is hidden there, and the ☰ button is hidden on computers. A menu can also move instead (a top menu on computers, a bar at the bottom on phones), so neither shows at every size. Point at something that shows at every size instead: a button or heading on the page, or the menu bar: the box around its contents (often a `.container` inside the `<nav>`; a full-width `<nav>` at the very top of the screen shows only part of his ring), with an `act` that clicks the link inside it (`act` works on a link that is folded away).
   - something inside a closed panel (tabs, a popup, a dropdown) needs a step before it that opens it: point at the opener, give it an `act` that clicks it and a `done` with what becomes visible. `done.css_visible` waits until that element is really showing (not hidden by the page's styles), so a popup that is always in the page but shown by a class works: `"#project-popup"`. If the visitor may open any of several popups, use a selector that matches whichever is open (Bootstrap: `".modal.show"`), and point the next step at something inside it the same way (`".modal.show h2"`). Make a step inside a popup (a modal dialog that covers the page; not an accordion or tabs, which open in place) the tour's last, and have it close the popup as it ends, or the popup stays open over the page for his next tour: an `act` that clicks the popup's close button (`"actLabel": "Close it for me"`) and a `done` that waits for the page to show again (Bootstrap: `"body:not(.modal-open)"`). While a popup is open, a visitor using the keyboard can't reach his bubble (tapping and clicking work).
4. **On a site with several pages,** every page loads the same brain, so give each tour `pages`: the pages it can run on (see "Tours on a site with several pages" in BRAIN.md). A tour of something every page has (the menu bar, the footer) needs no `pages`. For a thing on another page, write two tours with the same label: one with `pages` that shows it on its own page, and one with no `pages` that points the way there from every other page (BRAIN.md has the details).
5. **Show the person the plan** in a few lines (each tour's menu button and its steps, one line each) and ask them to confirm or change it.

## Step 4. Write the files

Copy the templates into the site's `pano/` folder and fill them in.

**`pano/brain.json`** (from `templates/brain.json`):
- `lines.name`: his name. `lines.hello`: his first words, in their tone, saying what he can help with.
- Rewrite the `menu` lines in the template (`ask`, `after_tour`, `bye`) in their tone, and any other `menu` line (BRAIN.md lists them) whose base wording doesn't fit it. Leave other lines to `base.json` unless the tone is far from plain and friendly. For a language other than English, write every line BRAIN.md lists for kit sites, and set `touch.swaps` for that language.
- `lines.background.options`: words for each background (delete the group if there is no background changer).
- The 3 tours, from your plan. Labels as a visitor would ask ("How do I book a class?"). Steps short: one or two sentences, `<b>` for the button or link to press.
- Remove every `TODO`. Notes starting with `_` may stay.
- **"Never say":** check every line he will say against it, the ones from `base.json` too (BRAIN.md lists them), and write your own wording for any that break it. Lines BRAIN.md marks as never said on kit sites (window, Recycle Bin, talking and memory lines) don't count, nor do the `background` lines on a site without the background changer; leave them to base.
- **Spelling:** base's lines are in American English. For a site in British English or another spelling, rewrite the lines he says that differ: in base they are `background.ask_colorblind`, `background.ask_mode` and `background.modes.mono` ("color", "colorblind").

**`pano/setup.js`** (from `templates/setup.js`):
- Set `site` to a short name for the site (letters and dashes). It keeps what he remembers in visitors' browsers apart from other sites on the same domain.
- No background changer: delete the two `desk` lines and the `background` entry.
- A bar fixed to the bottom of the screen (a cookie notice that stays, a bottom menu on phones): set `layout.bar.narrow` (screens up to 640 pixels wide, where his bubble sits across the bottom) or `layout.bar.wide` (wider screens) to its height in pixels, so he and his bubble stay clear of it. If the bar shows on screens wider than 640 pixels too (a bottom menu up to 768, say), set both: on wide screens he then rests that much higher.

**`pano/colors.css`** (from `templates/colors.css`):
- His fur: `--pano-fur`, with `--pano-leg` and `--pano-paw` darker (about 20% and 25%, as in the template) and `--pano-name` in the same color, lighter on a dark bubble or darker on a light one (it is his name above each bubble, so it must read well on the bubble).
- His bubble: by default dark green. To match the site, take its colors. Keep the text readable: `--pano-ink` on `--pano-bubble`, `--pano-name` and `--pano-soft` on `--pano-bubble`, and `--pano-accent-ink` on `--pano-accent` each need a contrast of at least 4.5 to 1.
- The ring around what he points at (`--pano-ring`, and `--pano-glow` for its pulse) is drawn on the site's page, not on the bubble, so it must stand out against the page: at least 3 to 1 on the background behind each thing his tours point at (a white section, a grey one, a dark footer). If `--pano-accent` is too pale for that (yellow on white), give the ring a darker shade. `--pano-accent` also draws the outline around him when a keyboard user tabs to him, on the page itself, so it should show on the page too.
- Backgrounds: the light set suits a site with dark text; for light text on a dark site, use the dark set (and use the same names in `setup.js` and in `lines.background.options`). Set `--pano-page` to the site's own page color. A background shows only through the parts of the page that have no color of their own (sections, cards and photos keep theirs); that is expected, and worth telling the person.
- Delete any line left at its default if you like; every value in the template is his default.
- No background changer and his default colors: you can leave this file out, and its line on each page.

**Every page** he should appear on gets the lines from `templates/adapter.html`: 2 in `<head>`, after the site's own stylesheets, and 2 just before `</body>`, after the site's own scripts. For a page in a folder, `pano/...` becomes `../pano/...`.

## Step 5. Check it

Run `check_site.py` from the clone, on the site folder:

```bash
pip install playwright
python -m playwright install chromium        # skip if Chromium is already installed
python3 path/to/Pano/kit/check_site.py path/to/their-site
```

It serves the site on this computer and, for every page at a phone size and a desktop size: checks he appears, runs `Pano.check()`, lists his menu, walks every tour he offers there to the end, checks each step's target is on screen with the ring around it, and checks each background can be seen. If this computer can't reach `marquisphill.github.io` (many cloud sessions can't), or the files there are too old for the kit (they have no `Pano.check()`), it answers for that address from the clone it sits in; its second line says which. To choose a clone, add `--engine path/to/Pano`.

- **Fix every ✗ and run it again, until it ends with "All good".** Notes (·) may be fine; read them. A file from another site that did not load (a web font, icons) is only a note: test machines often can't reach those, and the site's own page is not yours to change.
- **Look at him.** Take screenshots at a phone size and a desktop size with his bubble open, and check his colors and bubble suit the site.
- **If you can't run it**, open each page in a browser, type `Pano.check()` in the console, fix every problem it lists, and walk each tour by hand at a phone size (about 390 pixels wide) and a desktop size.

## Step 6. Tell the person

- What you added: the files, the `id`s, and the lines on each page.
- His 3 tours, by their menu buttons.
- What you checked, and anything you couldn't.
- How to change him later: edit `pano/brain.json` (BRAIN.md lists every field), then run `Pano.check()` in the browser console on any page.
- How to remove him: delete the 4 lines from each page and the `pano/` folder.
- That he shows on the live site once the changes are published (on GitHub Pages: committed and pushed). Leave the changes for the person to look over: don't commit or publish them unless they asked you to.

## The adapter (`setup.js`), entry by entry

`Pano.init({ ... })` takes one object. The kit's template sets these:

| Entry | What it does |
| --- | --- |
| `brain` | The brain's address. The template finds `brain.json` beside `setup.js`, so it works from any page. |
| `layout.bar` | `{ wide, narrow }`: pixels to keep clear at the bottom of the screen, on wide screens and on phones. `0` on most sites. |
| `layout.safeArea` | `true`: also keep clear of a phone's gesture bar. |
| `layout.scrolls` | `true`: the page scrolls, so he scrolls what he points at into view. Kit sites always scroll. |
| `keys` | `{ greeted, head }`: the names he uses in the visitor's browser for "already said hello in this tab" and "tucked away in this tab". |
| `background` | The background changer: `desk` (the layer behind the page), `walls` (the background names; the first is the site as it is), `modes` (the colorblind modes: any of `protan`, `deutan`, `tritan`, `mono`), `keys` (`{ wall, cb }`: the names he saves the visitor's choices under). Left out, he doesn't offer it. |

Others it accepts, if the person asks:

| Entry | What it does |
| --- | --- |
| `idle` | `{ quiet, waiting }`: milliseconds before he tucks away to just his head at the top of the screen (4000 and 10000 by default). |
| `fidget` | `true`: he stretches and looks around now and then. |
| `canGreet` | A function: return `false` to keep him from saying hello when a visitor arrives (on a checkout page, say). |

What he keeps in a visitor's browser: whether he has said hello and whether he is tucked away (until the tab closes), and the background and colorblind mode they chose. Nothing is sent anywhere, and there are no cookies.

## When something is wrong

| What you see | What to do |
| --- | --- |
| He doesn't appear | Run `Pano.check()` in the console. "Pano.init() has not run" means `setup.js` isn't loaded, or is loaded before `pano.js`. A brain that "could not be loaded" names the reason (a wrong address, a JSON mistake and where it is). |
| A tour is missing from his menu | `Pano.check()` says which step and why. On another page? Check its `pages`. |
| He says "I lost track of that" | A step's target wasn't on the page. Check its selector, and that it is visible at that screen size. |
| A background changes nothing | Something paints over the layer behind the page: usually a background color on `<body>` when `<html>` has one too, or on a wrapper around the whole page. Move that color onto `<html>`, or leave the background changer out. |
| He or his bubble covers a bar at the bottom | Set `layout.bar` to its height (see Step 4). |
