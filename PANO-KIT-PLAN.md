# The Paño kit: Paño on anyone's site

This file is the handoff for the kit build. Every phase is done in a fresh chat that knows nothing else, so everything it needs is here. **Read the whole file and the Rules in `PANO-PLAN.md`, do the next phase in the Status log, then update the Status log before you finish.**

Phill's one-line prompt for each phase: *"Read PANO-KIT-PLAN.md in the Pano repo and do the next phase."*

---

## The goal

A kit that lets anyone put Paño, Phill's red cartoon cat, on their own website as a scripted guide. Someone hands their AI one prompt. Their AI asks them a few questions, then builds their Paño and adds him to their site. This repo hosts the engine. The site owner only writes their own files: a brain (JSON) and a short adapter.

## Where things stand (as of 2026-11-26, commit `01978af`)

- **Live sites load `v2/`, not `v1/`.** Staging, production and the real dashboard moved to `v2/` on 2026-11-26 (see `PANO-PLAN.md`'s Status log). The kickoff prompt for this build said `v1/`; both are released and frozen. **The kit's first release will be `v3/`**, not `v2/`.
- **DEV sites** `Portfolio-DEV` and `Dashboard-DEV` still exist, are public, and load `latest/`. Every engine change here reaches them, so each change must keep both working, along with their brains (`latest/brain/core.json`, `portfolio.json`, `dashboard.json`).
- **Already product-ready** (found by Phill at `c2e69b8`; line numbers may drift):
  - `brain` in `Pano.init` can be a full address, and `extends` is resolved relative to the brain file.
  - The engine finds its skills from its own script address (`HOME`, near the top of `pano.js`), so full addresses and other domains work.
  - Skills turn on only when the adapter provides what they need, and `Pano.here.skills()` explains why any skill is off.
  - Tour steps that only use `css`, `css_visible`, `when_visible`, `click`, `focus` and `submit` need no adapter code. `layout.scrolls: true` handles pages that scroll.
- **Gaps:**
  - ~~No neutral default lines.~~ Fixed in K1: `latest/base.json`.
  - ~~`extends` only goes one level.~~ Fixed in K1: it chains.
  - ~~`phill_note`.~~ Fixed in K1: now `background.note`, and Phill's `core.json` updated.
  - ~~The cat's colors are written into his drawing.~~ Fixed in K1: `--pano-*` variables.
  - ~~Brain mistakes fail silently.~~ Fixed in K2: `Pano.check()` names each one.
  - ~~The background skill expects the page to style its own backgrounds.~~ Fixed in K3: the kit's `templates/colors.css` has a ready set (light and dark), on a `#pano-backdrop` layer that `templates/setup.js` adds.
  - Not needed for this version, but noted: the skill list is fixed (`EARLY`/`LATE` in `pano.js`), and the early skills load with `document.write`.

## Target design

What a site owner ends up with:

```
their-site/
  index.html          + a <link> to pano.css, a <script> for pano.js, and the adapter (Pano.init)
  pano/brain.json     their Paño: name, tone, menu, 3 tours, switches. Extends the hosted base.
  pano/colors.css     (optional) his colors as --pano-* variables
```

```html
<link rel="stylesheet" href="https://marquisphill.github.io/Pano/v3/pano.css">
<script src="https://marquisphill.github.io/Pano/v3/pano.js"></script>
<script>Pano.init({ brain: 'pano/brain.json', layout: { scrolls: true } /* + switches */ })</script>
```

- **The engine** (`pano.js`, `pano.css`, `skills/`, `base.json`) is hosted here and never copied into their site.
- **Their brain** starts from `base.json`, the neutral lines every Paño needs, and adds their name, lines and tours.
- **Their "3 skills" are 3 tours.** Each thing Paño should help visitors do becomes a guided tour, made of steps the engine reads itself (`css`, `click`, `focus`, `submit`...). Their AI writes JSON and a short adapter, never new skill code.
- **Switches** are adapter entries: `background` on any site; `windows` and `bin` only on sites that have a window system.

## Rules

`PANO-PLAN.md`'s Rules apply. On top of them, for this build:

1. **Never touch a released folder** (`v1/`, `v2/`, and `v3/` once it exists), Phill's live sites (`Professional-Portfolio2`, `Professional-Portfolio2-STAGING`, `Personal-Dashboard`) or staging. They load `v2/`, so they are safe as long as no numbered folder is edited.
2. **`latest/` is loaded by the DEV sites.** Every engine change must keep `Portfolio-DEV` and `Dashboard-DEV` working, and their brains (`core.json`, `portfolio.json`, `dashboard.json`) too. Prove it with the before/after method in `tests/README.md`.
3. **Ask Phill before merging into `main`.** The merge is what makes the kit reachable and updates the DEV sites.
4. **Public files.** Brain files and the kit are public: no personal details, no keys. Example and practice sites are fictional, never a real business.
5. **One phase per chat** unless Phill says keep going. At the end of each phase: update the Status log, push the branch, and tell Phill what is next.
6. **Short, plain updates.** Phill is often on his phone.

## Phases

**K0. Setup** (small)
- Push access to `Pano`; a branch, never `main`.
- This file and `CLAUDE.md`.
- A baseline run of the existing tests on `latest/`, to compare against later.

**K1. Neutral engine** (medium)
- `latest/base.json`: neutral default wording for every line the engine and the four early skills (`tours`, `background`, `windows`, `bin`) use.
- `extends` that chains (site → base, and Phill's site → `core.json` → base). `"extends": "base"` resolves to the file beside `pano.js`, so a site owner's brain never names a version. Full and relative addresses keep working.
- Rename `phill_note` (to something neutral like `note`, skipped when empty). Keep the old key working or update Phill's brains.
- The cat's colors as `--pano-*` CSS variables, with today's red as the default.
- His name comes from the brain everywhere (bubble, screen-reader labels, any line that says it).
- Done when: both DEV sites behave exactly as before (prove it with the before/after test method in `tests/README.md`), and a brain with only `extends` to base plus a name and one CSS tour works.

**K2. Checker** (small)
- `Pano.check()` in the browser console lists missing lines, unknown fields, tours with steps this page can't read (and which step), and targets it can't find right now.
- `kit/brain.schema.json` for the brain format.
- A test for both.

**K3. The kit** (medium), in `kit/`
- **First, the engine change for multi-page sites (Phill chose this, 2026-11-26):** a tour may say which pages it is offered on, e.g. `"pages": ["contact.html"]`. Left out, it is offered on every page. On other pages it stays out of his menu, and `Pano.check()` skips its targets there (a note says it is for another page). Suggested matching: each entry is a page address relative to the brain file (like `extends`), compared with the current page's path, with `/` and `/index.html` the same and query and hash ignored. Add it to `skills/tours.js`, `kit/brain.schema.json`, `tests/kitcheck.py` (a second kite-shop page) and the brain README. It is an engine change, so run the before/after suites on both DEV sites.
- `README.md` for people: what Paño is, plus the one-line prompt. The prompt says to read `kit/SETUP.md` from `github.com/marquisphill/pano`, and to clone the repo if web pages can't be opened (Claude cloud sessions often can't reach `github.io`).
- `SETUP.md` for their AI:
  - Ask: what the site is and who visits; the 3 things Paño should help visitors do; his name and colors; his tone; whether to offer the background changer; anything he must never say.
  - Read their site to find tour targets, adding stable `id`s where needed.
  - Write `pano/brain.json` and the adapter from the templates, and add the two script lines.
  - Run `Pano.check()` until it is clean, and confirm all 3 tours finish at phone and desktop sizes.
  - Never copy the engine into their site.
- `BRAIN.md`: every brain field, with examples.
- `templates/`: `brain.json`, `adapter.html`, `colors.css`.
- `example/`: a small fictional site with Paño fully installed.

**K4. Field tests** (medium)
- 2 to 3 practice sites with different layouts: a long scrolling landing page, a multi-page site, and something with a form. Prefer free templates built by others under a permissive license (MIT or CC0), with credit; otherwise write them.
- Practice sites are throwaway folders, not repos.
- For each one, start a fresh agent that gets only the kit and the practice site, with no access to this conversation or Pano's internals, and a prepared list of answers to the setup questions.
- Then run `Pano.check()` and a new general smoke test (`tests/kit_smoke.py`: Paño appears, his menu lists the 3 tours, and each tour finishes at phone and desktop sizes, with no page errors).
- Fix the kit or the engine, and repeat until a cold run works with no help.

**K5. Hand-off and release** (small)
- With Phill's go, merge into `main`.
- Give Phill the steps for his own test: create a repo, turn on GitHub Pages, paste the prompt into a fresh chat, answer the questions.
- Fix what he reports.
- With his go, copy `latest/` to `v3/` (`v2/` is taken) and point the kit's addresses at `v3`.
- His live sites stay on `v2/` until he decides.

## Testing in the cloud environment

- Chromium is preinstalled. `pip install playwright==1.63.0 pillow` for the Python tests.
- Get the DEV sites as throwaway local copies, never committed: `git clone --depth 5 https://github.com/marquisphill/Portfolio-DEV` and the same for `Dashboard-DEV`, into the scratchpad. Both are public.
- Serve a site with `python3 tests/serve.py <site folder> <port> [pano folder]`. It mounts this repo at `/Pano/`, or the third argument's folder if given.
- **Before/after:** make a frozen "before" copy of this repo with `git archive <commit> | tar -x -C <dir>`. Serve the same DEV site twice: on one port with the frozen copy, on another with the working copy. Run the suite against both at the same time, then `diff -r <before> <after> --exclude=shots --exclude=.scripts`.
- Suites: `tests/run_all.sh <out> <port> latest` (portfolio, about 20 minutes) and `tests/run_dash.sh <out> <port> latest` (dashboard, about 12 minutes). Run them in the background. Known harmless quirks are listed in `tests/README.md`.
- This environment can't reach `marquisphill.github.io`, so test local copies.
- If `Portfolio-DEV` or `Dashboard-DEV` has been deleted, test against a scratch copy of the live site with `/Pano/v2/` swapped for `/Pano/latest/`, and never commit that copy.

## Decisions already made

From Phill's kickoff prompt (2026-11-26):

- **Scripted only.** No AI chat, no API keys. He works the way he does on the portfolio: a menu, guided tours, and his own lines.
- **The user's "3 skills" are 3 tours.** The setup asks for the 3 things Paño should help visitors do, and each one becomes a guided tour. Everything their AI writes is JSON plus a short adapter. It never writes new skill code.
- **Built-in extras are switches:** the background and colorblind changer on any site; window tidying and the Recycle Bin only on sites that have a window system.
- **Character:** the cat only, with a custom name and colors.
- **Hosting:** sites load him from `https://marquisphill.github.io/Pano/vN/`. A CDN like jsDelivr can come later.
- **Not in the first version:** chat (`chat.js`), talks, topics, custom code skills, React/Next-style sites, other characters.
- **One phase per chat** unless Phill says keep going.

Added during the build:

- **The kit's first release is `v3/`.** `v2/` already exists and is live (2026-11-26).
- **`"extends": "base"`** (or `"base.json"`) always means `base.json` beside `pano.js`, so a site's brain never names a version. Any other `extends` is an address relative to the file that names it. (K1)
- **Only `lines` pass down an `extends` chain.** Tours, menu and everything else are each file's own. (K1)
- **Phill's `core.json` extends base**, so his sites run `portfolio.json`/`dashboard.json` → `core.json` → `base.json`. All his own lines win, so nothing he says changed. (K1)
- **`{cat_name}`** in any line or tour step is his name (`lines.name`). Not `{name}`: tour lines already use that for the tour's name. (K1)
- **`phill_note` is now `background.note`.** Phill's `core.json` was updated; the old key is not read any more (`v1/` and `v2/` keep their own copies). With no note, he just says `background.done`. (K1)
- **His colors** are `--pano-fur`, `--pano-leg`, `--pano-paw`, `--pano-eyes`, `--pano-mouth`, `--pano-tongue`, plus `--pano-close` for the bubble's close button. The defaults are today's colors. (K1)
- **A brain with no `menu.show` offers all its tours**, in the order written. A background with no words in `options` is shown by its name. (K1)
- **`Pano.check()` sorts what it finds into problems and notes.** Problems break something, and the kit's setup must clear them all: a missing, blank or misspelt line; a misspelt step or tour field; a tour left out of his menu (with the step and why); a step with no way to move on; `menu.show` naming a missing tour; a selector that matches nothing; a background with no page style; an unknown colorblind mode; a brain that won't load. Notes may be fine: a target hidden right now, a target missing after an earlier step that does something (it may add it), a field nothing reads, a background with no words. (K2)
- **Multi-page sites: each tour can name its pages** (`"pages"`), and is offered only there; left out, every page. Phill chose this over one brain per page (2026-11-26). Built in K3.
- **`pages` matching (K3):** each entry is a page address relative to the brain file. `/` and `/index.html` are the same page, `.html` may be left off (GitHub Pages serves `contact.html` at `/contact`), and the query and hash are ignored. `Pano.check()` fetches each address that is not the current page and reports a 404 as a problem, with a hint (`"../contact.html"`), since a brain in `pano/` makes the `../` easy to forget. A `pages` that is not a non-empty list of addresses is a problem, and the tour is left out. On other pages a tour's structure is still checked (fields, `say`, a way to move on), but not what this page can read or its targets.
- **A tour that crosses pages is two tours with the same label** (K3): one points at the link on the other pages, one shows the thing on its own page. No engine support needed.
- **Room below the page on phones (K3, engine):** when a step's target can't be scrolled above his bubble because the page ends (a footer), he adds blank room at the end of the page, and when he goes to rest (or tucks into head mode) he scrolls back up out of it and removes it. Only with `layout.scrolls` at phone sizes; a target the page can already reach adds nothing.
- **A kit site's files (K3):** `pano/brain.json`, `pano/setup.js` (the adapter, shared by every page; it finds `brain.json` from its own address, so pages in folders work too, and it adds the `#pano-backdrop` layer) and `pano/colors.css` (his colors, his bubble's colors and the backgrounds, in one file). Each page gets 2 lines in `<head>` and 2 before `</body>` (`templates/adapter.html`). The target design above had the adapter inline in each page; a shared file suits multi-page sites better.
- **The kit's addresses say `latest/` until K5** (`kit/templates/adapter.html` and the example's two pages; `grep -rn "Pano/latest/" kit/` finds them). K5 switches them to `v3/`.
- **`kit/check_site.py` (K3)** is the kit's checker for the site owner's AI: every page that loads Paño, at 390×844 and 1280×800. He appears, `Pano.check()`, his menu, every tour he offers there walked to the end (each step shows, its target is on screen and ringed, the tour finishes), every background visible, no page errors, no `TODO` left in `pano/`, and the engine loaded from the hosted address. `--engine <clone>` answers for `marquisphill.github.io/Pano/` from a clone; run from inside a clone, it does that by itself when the address can't be reached. K4's `tests/kit_smoke.py` can wrap it.
- **The setup asks 6 questions** (K3): the plan's five, with language folded into tone. It shows the person the tour plan before writing anything.
- **A skill's `check()` may be async** (K3): `Pano.check()` waits for each.
- **The schema is for kit brains only.** `kit/brain.schema.json` allows only steps the engine reads by itself (`css`, `css_visible`, `click`, `focus`, `submit`, `need.filled`), and lists exactly `base.json`'s lines. Phill's own brains use more and don't fit it, on purpose. (K2)

## Status log

Update this at the end of every phase: date, what was done, decisions, anything left open.

- **2026-11-26. K0 done.**
  - **Branch** `claude/pano-kit-builder-othul3`, from `main` at `01978af`. Push access to `Pano` works. Nothing merged into `main`.
  - **Written:** this file, `CLAUDE.md` (what every session must do), and a link to this file in `README.md`.
  - **Found:** the live sites are on `v2/`, not `v1/` as the kickoff prompt said. Both folders stay frozen, and the kit's release becomes `v3/` (added under Decisions). Both DEV repos still exist and load `latest/`.
  - **Baseline**, saved in `tests/baseline/k0/` (its README explains each line). Local copies of `Portfolio-DEV` (`06df063`) and `Dashboard-DEV` (`7fb4c14`) served with a frozen copy of `01978af`. Dashboard: `dash.py` 205 of 205, `devdash.py` all True, no page errors. Portfolio: `lifted` 20 of 20, `skills` 29 of 29, and the rest matches the known quirks in `tests/README.md` (the `clean-fold` timeout, `sweep`'s blocked outside addresses). One expected miss: `brain.py`'s `later hackathon-photos` stops at step 3 of 4, because `v2` moved that tour to the portfolio's new layout and `Portfolio-DEV`'s page still has the old one. It is not offered in his menu.
  - **For K1, from a first look at the code:** the engine and the four early skills read about 40 lines (`menu.*`, `tour.*`, `background.*`, `cleanup.*`, `bin.refuse`, `labels.*`, `touch.swaps`, `name`, `hello`); `base.json` needs each of them. His colors are 6 values in `MARKUP` (fur `#ff4d4f`, darker fur `#c93436` and `#b92c2e`, mouth `#3a0608`, tongue `#ff8a8c`, eyes `#07100b`) plus the wavy whiskers in `pano.css`. Lines that say his name today are typed out ("Phill’s cat", "Ask Paño the cat for help"); `base.json` can use a `{name}` gap instead, while Phill's brains keep their own words. Phill's `core.json` currently extends nothing, so the chain would be `portfolio.json` → `core.json` → `base.json`, with today's lines still winning.
  - **Next: K1** (neutral engine). Make the "before" copy from `01978af` (or the latest `main` if it has moved), and run it side by side with the working copy on both DEV sites.
- **2026-11-26. K1 done** (same chat as K0; Phill said start it here). Branch only; nothing merged, so the DEV sites still run `main`'s `latest/` until Phill approves the merge.
  - **`latest/base.json`**: neutral wording for every line the engine and the four everyday skills say (menu, tour, touch swaps, background and colorblind, window clean-up, Recycle Bin, labels, hello), plus the tour lines used only with a memory. Lines that say his name use `{cat_name}`. No facts, no tours, nothing about Phill.
  - **Engine** (`latest/pano.js`): `extends` chains, with a loop guard (a brain that extends itself keeps him hidden and says why in the console). `"base"`/`"base.json"` means the base beside `pano.js`. `{cat_name}` is filled in across lines and tours. His drawing takes its colors from `--pano-*` variables (see Decisions); the defaults are the exact old colors. The init comment and header explain all of it.
  - **Skills:** `background.js` reads `background.note` (was `phill_note`) and skips it when empty; a background or mode with no words shows its name. `tours.js` offers every tour when a brain has no `menu.show`.
  - **Styles** (`latest/pano.css`): the wavy whiskers follow `--pano-fur`; the name and quiet-text colors, which fell back on the portfolio's own `--red-ink` and `--ink-soft`, now have the same values built in, for sites that have neither.
  - **Phill's brains:** `core.json` now says `"extends": "base"` and its `phill_note` is `note`. `portfolio.json` and `dashboard.json` are unchanged. DEV sites fetch one more small file (`base.json`, 4 KB) before he appears.
  - **Tests.** New `tests/kitbase.py` with a fictional plain site, `tests/sites/kite-shop/` (a scrolling page with a form, no window system). Its brain is only `"extends": "base"`, a name and one two-step css tour. 34 of 34 True, no page errors: he greets in base's words with his own name, labels and menu are right, the tour scrolls, rings and finishes at phone and desktop sizes, nothing he says is blank, the page recolors him, the background works with no option words and no note, a three-file chain works, `"base.json"` works, a loop keeps him hidden, `menu.show` is optional. `brain.py` now merges base under core. `dash.py` reads `note` instead of `phill_note` (same check, same label).
  - **Before/after**, both DEV sites, old (`01978af`, its own tests) and new served side by side and run at the same time. Dashboard: outputs identical, 205 of 205 both. Portfolio: identical apart from known quirks: one `idle.py` timing (4.8s vs 5.0s), two `wall.py` mid-wipe readings, and the `clean-fold` timeout on both. `brain.py`'s two `later hackathon-photos` False lines are on both, as in K0. `same.py` (styles, bubble, whole-page screenshots, saved settings, nine poses, three sizes): 107 of 108, then 108 of 108 on a re-run. The one miss was a 19 by 13 pixel spot in the phone taskbar after Phill's note, with every computed style the same.
  - **Not checked:** the live DEV addresses (this environment can't reach `github.io`, and nothing is merged yet). Windows and bin with a base-only brain (base has their lines, but the kite shop has no window system).
  - **Found, for later phases:**
    - The background skill still needs the page to style each background (`[data-wall="..."]` on its desk element and on `.wallnext`). The kite shop does this in a few lines of CSS. K3 should give the kit a ready set, or K1's engine could carry one; either way their AI should not have to invent it.
    - A plain site needs `layout: { bar: { wide: 0, narrow: 0 }, scrolls: true }` and its own `keys` (per-tab names), or he keeps clear of a taskbar that is not there and shares `catGreeted` with other sites on the same domain. The kit's adapter template should set both.
    - `--pano-bubble` and the other bubble colors default to the portfolio's dark green. Fine for now; K3's `colors.css` template should list them.
  - **Next: K2** (checker): `Pano.check()`, `kit/brain.schema.json`, and a test for both. `tests/sites/kite-shop/` is a ready page to check against.
- **2026-11-26. K2 done** (same chat; Phill said start it here). Branch only; nothing merged.
  - **`Pano.check()`** (in `latest/pano.js`; also `Pano.here.check()`). Run it in the browser console. It waits for his brain and skills, prints a report and returns `{ ok, brain, problems, notes, skills }`. `ok` means no problems. Each item has `kind`, `where` (like `lines.menu.ask` or `tours.contact step 2`) and `say`. It checks:
    - **Loading:** no brain named, a file that won't load (with the reason: 404, not valid JSON with the position, a loop).
    - **Lines**, against `base.json`: missing, blank, the wrong shape, or a key he never says (likely misspelt). A skill's own group (`lines.talks`) is left to that skill. Lines starting with `_` are notes for people.
    - **Top-level fields** of the site's brain: a field nothing reads is a note; one only an off skill reads is a note saying so.
    - **Tours** (from `skills/tours.js`): every tour and step. A tour left out of his menu names the step and the reason ("its target has no "css", and this page has no reader for "icon""). Also: no label, no steps, no `say`, no way to move on, a misspelt field, `menu.show` naming a missing tour, a tour not offered. For the tours he offers, what each step points at, clicks, focuses or waits on must match something on the page now. Missing is a problem unless an earlier step does something (it may add it) or the step depends on the page; hidden is a note.
    - **Background** (from `skills/background.js`): the desk element exists; each background has a style on the page (`[data-wall="..."]` in a readable stylesheet), else choosing it would change nothing; each colorblind mode is one he has filters for; words for each name, and none for names the page lacks.
  - **Engine changes along the way:** a brain missing its `labels` now loads (he used to crash on it, so the check could only say "could not load"); a JSON error names the file; `tours.js` explains why it can't read a step (`whyNot()`), with the same rule as before for what it offers.
  - **`kit/brain.schema.json`** (JSON Schema 2020-12): the kit's brain format. `extends`, `lines` (exactly `base.json`'s lines, each described; only `name` required), `tours` (at least one; steps use only `css`, `when_visible`, `css_visible`, `click`/`focus`/`submit`, `need.filled`, with `next` or `done` required), `menu`. A key starting with `_` is allowed anywhere. Phill's own brains don't fit it, by design.
  - **On Phill's DEV sites** `Pano.check()` finds no problems, only notes: `greetings`, `returning_greetings` and `idle_nudges` (nothing reads them), fields only the talking skills read (on the portfolio), and steps whose targets appear part-way through a tour.
  - **Tests.** New `tests/kitcheck.py` (needs `pip install jsonschema`): 35 of 35 True, no page errors. The kite shop is clean (3 notes: no words for its backgrounds), then 21 broken versions of its brain or adapter are each caught at the right place, notes stay notes, and the schema accepts the kite shop's brain and every base line, lists exactly base's lines, and turns away 7 kinds of broken brain. `kitbase.py` still 34 of 34. Before/after against K1's final commit (`5980a1e`), both DEV sites side by side: dashboard identical, 205 of 205 both. Portfolio identical apart from known flickers listed in `tests/README.md` (`clean.py desk` "bubble after", `wins.py desk 4` menu), one `idle.py` timing (4.5s vs 4.8s), two `wall.py` mid-wipe readings, and the `clean-fold` timeout on both. `same.py` (old against new): 107 of 108 on each of two runs, every computed style the same each time. The one screenshot miss was at the "after the note" pose both times, desktop on the first run (lower right, not inspected) and phone on the second: the portfolio's own mail icon in the taskbar, drawn a few pixels to one side. K1's first run missed at the same phone spot. It is the page's notification timing, not Paño; now listed in `tests/README.md`.
  - **Not checked:** the live DEV sites (nothing merged; this environment can't reach `github.io`). A stylesheet from another domain can't be read, so a background styled only there is a note ("couldn't confirm"), not a problem.
  - **Found, for K3 and K4:**
    - **Multi-page sites.** A tour runs on one page. If every page loads the same brain, tours whose targets live on other pages will show as problems there, and would fail if run. K3's setup needs an answer: one brain per page (each extending a shared one), or tours that only point at what every page has (like the nav). The engine has no per-page tour list yet.
    - The kit's brain template should give words for each background (`lines.background.options`), or the check leaves notes.
  - **Phill's answer on multi-page sites (after K2):** each tour can name the pages it is offered on. Recorded under Decisions and as K3's first step.
  - **Next: K3, in a fresh chat** (Phill asked for one). The kit work is on branch `claude/pano-kit-builder-othul3`, not merged, so start from that branch, not `main`. First the `pages` engine change, then `kit/`: `README.md`, `SETUP.md`, `BRAIN.md`, `templates/` and a fictional `example/` site.
