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
  - No neutral default lines. Shared lines (menu, tour, background) only exist in Phill's `core.json`, so a brain that does not extend it shows blanks.
  - `extends` only goes one level (`loadBrain` in `pano.js`). It needs to chain (site → base).
  - `skills/background.js` uses `p.L.background.phill_note`. Rename it, and keep the old key working or update Phill's brains.
  - The cat's colors are written into his drawing (`MARKUP` at the top of `pano.js`). Make them CSS variables, with the current red as the default.
  - Brain mistakes fail silently. A missing line shows blank, and a tour with a step the page can't read just drops out of the menu.
  - The background skill expects the page to style its own backgrounds (`[data-wall="..."]` on the desk element and on `.wallnext`). A plain site has none, so the kit needs a default set the site owner's AI does not have to write.
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
- `extends` that chains (site → base, and Phill's site → `core.json` → base if that is how it lands). Proposed: a bare name like `"extends": "base"` resolves to the file beside `pano.js`, the way `brain: 'portfolio'` already does, so a site owner's brain never names a version. Full and relative addresses keep working.
- Rename `phill_note` (to something neutral like `note`, skipped when empty). Keep the old key working or update Phill's brains.
- The cat's colors as `--pano-*` CSS variables, with today's red as the default.
- His name comes from the brain everywhere (bubble, screen-reader labels, any line that says it).
- Done when: both DEV sites behave exactly as before (prove it with the before/after test method in `tests/README.md`), and a brain with only `extends` to base plus a name and one CSS tour works.

**K2. Checker** (small)
- `Pano.check()` in the browser console lists missing lines, unknown fields, tours with steps this page can't read (and which step), and targets it can't find right now.
- `kit/brain.schema.json` for the brain format.
- A test for both.

**K3. The kit** (medium), in `kit/`
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

## Status log

Update this at the end of every phase: date, what was done, decisions, anything left open.

- **2026-11-26. K0 done.**
  - **Branch** `claude/pano-kit-builder-othul3`, from `main` at `01978af`. Push access to `Pano` works. Nothing merged into `main`.
  - **Written:** this file, `CLAUDE.md` (what every session must do), and a link to this file in `README.md`.
  - **Found:** the live sites are on `v2/`, not `v1/` as the kickoff prompt said. Both folders stay frozen, and the kit's release becomes `v3/` (added under Decisions). Both DEV repos still exist and load `latest/`.
  - **Baseline**, saved in `tests/baseline/k0/` (its README explains each line). Local copies of `Portfolio-DEV` (`06df063`) and `Dashboard-DEV` (`7fb4c14`) served with a frozen copy of `01978af`. Dashboard: `dash.py` 205 of 205, `devdash.py` all True, no page errors. Portfolio: `lifted` 20 of 20, `skills` 29 of 29, and the rest matches the known quirks in `tests/README.md` (the `clean-fold` timeout, `sweep`'s blocked outside addresses). One expected miss: `brain.py`'s `later hackathon-photos` stops at step 3 of 4, because `v2` moved that tour to the portfolio's new layout and `Portfolio-DEV`'s page still has the old one. It is not offered in his menu.
  - **For K1, from a first look at the code:** the engine and the four early skills read about 40 lines (`menu.*`, `tour.*`, `background.*`, `cleanup.*`, `bin.refuse`, `labels.*`, `touch.swaps`, `name`, `hello`); `base.json` needs each of them. His colors are 6 values in `MARKUP` (fur `#ff4d4f`, darker fur `#c93436` and `#b92c2e`, mouth `#3a0608`, tongue `#ff8a8c`, eyes `#07100b`) plus the wavy whiskers in `pano.css`. Lines that say his name today are typed out ("Phill’s cat", "Ask Paño the cat for help"); `base.json` can use a `{name}` gap instead, while Phill's brains keep their own words. Phill's `core.json` currently extends nothing, so the chain would be `portfolio.json` → `core.json` → `base.json`, with today's lines still winning.
  - **Next: K1** (neutral engine). Make the "before" copy from `01978af` (or the latest `main` if it has moved), and run it side by side with the working copy on both DEV sites.
