# Paño tests

Browser tests written while Paño was built into the portfolio (2026-11-22). They drive the real page in a headless browser and print what happened. Run them before and after every change to prove nothing broke.

## Setup

```bash
pip install playwright pillow jsonschema      # jsonschema is only for kitcheck.py
python -m playwright install chromium
# In a Claude cloud session Chromium is already installed. Skip the install line and
# use the matching package instead: pip install playwright==1.63.0 pillow
mkdir -p /tmp/pano-qa          # screenshots are written here
```

## Running

Serve the site you want to test on port 8773, then run a script:

```bash
python3 tests/serve.py path/to/portfolio-site &
python3 tests/tours.py desk "app:contact,app:skills"
python3 tests/wins.py
```

Every script expects the site at `http://localhost:8773/index.html`.

Use `tests/serve.py`, not `python3 -m http.server`. Since phase 1 the sites load Paño from `/Pano/latest/`, the same address GitHub Pages gives this repo. `serve.py` serves the site at `/` and this repo at `/Pano/`, so the page under test gets the Paño files from your working copy, pushed or not.

To run everything and keep the output:

```bash
tests/run_all.sh /tmp/pano-after            # site on port 8773
tests/run_all.sh /tmp/pano-before 8774      # a second site on another port
diff -r /tmp/pano-before /tmp/pano-after --exclude=shots --exclude=.scripts
```

That is how to prove a change did nothing visible: serve the old site on one port and the new one on another, run both, and compare.

Sites that load a numbered version (staging and production load `/Pano/v2/` since 2026-11-26) need the version as a third argument, so the checks that look at his files read that folder:

```bash
tests/run_all.sh /tmp/pano-after 8773 v2
```

`serve.py` takes a third argument: the Pano folder to mount at `/Pano/` (this repo if left out). To get a "before" copy of the engine, unpack an older commit and serve the same site from it on another port:

```bash
git archive <commit> | tar -x -C /tmp/pano-before-repo
python3 tests/serve.py path/to/site 8774 /tmp/pano-before-repo &
/tmp/pano-before-repo/tests/run_all.sh /tmp/pano-before 8774      # the old copy's own tests
```

`baseline/` keeps what the suites printed at the start of the kit build, for telling old quirks from new breakage.

`run_dash.sh` takes the same third argument.

To compare two copies of a site directly (every computed style on Paño, his bubble, a screenshot of the whole page, and the saved settings, in nine poses at three sizes):

```bash
python3 tests/same.py 8774 8773       # old site on 8774, new site on 8773
```

The dashboard has its own two tests. Serve the dashboard instead of the portfolio, then:

```bash
python3 tests/serve.py path/to/Dashboard-DEV &
tests/run_dash.sh /tmp/pano-dash               # runs devdash.py and dash.py, and lists anything False
```

`run_all.sh` is for the portfolio and `run_dash.sh` is for the dashboard. Each expects its own site on the port.

## What each one covers

| Script | Covers | How to run |
|---|---|---|
| `tours.py` | Every guided tour, with windows already open. Checks that what Paño points at is visible. | `tours.py <desk\|fold\|phone> "<windows to open first>"` |
| `head.py` | Corner start, tucking away to the head, dragging, tapping, reload. | `head.py <width> <height> <label>` |
| `idle.py` | How long he waits before tucking away in each situation. | `idle.py` |
| `wins.py` | Title bars staying on screen, window resizing, Organize, Close all. Desktop sizes. | `wins.py` |
| `clean.py` | The 4+ windows clean-up offer and eating windows. | `clean.py <width> <height> <label>` |
| `bin.py` | Dragging Paño onto the Recycle Bin. | `bin.py` |
| `wall.py` | Change the background, colorblind modes, the grey-then-wipe reveal. | `wall.py` |
| `cases.py` | The two case-study windows and their clickable diagrams. | `cases.py` |
| `sweep.py` | Broken images, dead links, direct links, resizing the browser. | `sweep.py` |
| `lifted.py` | The page loads Paño from `/Pano/latest/` and no longer carries his code; the page still works if his files fail to load. | `lifted.py` |
| `brain.py` | What he says comes from `latest/brain/portfolio.json` and the shared `core.json`: no lines left in the code or the page, his menu and greeting match the brain, editing the JSON alone changes them, the page still works if the brain cannot be fetched. It also walks the tours that are written but not in his menu yet. | `brain.py` |
| `skills.py` | Each ability is its own file in `latest/skills/`. A skill is offered only when the page's adapter has what it needs: the test takes each adapter entry out in turn and checks that skill goes and the rest still work. Also: a saved background shows with no flash, a skill file that cannot be fetched, and Paño added to a page that has already loaded. | `skills.py` |
| `same.py` | Two copies of a site show Paño the same: computed styles, bubble, whole-page screenshot and saved settings, in nine poses (greeting, a tour step, the background and colorblind questions, mid-change, Phill's note, after it, head mode) at three sizes. Written for phase 5 (staging before and after moving to `/Pano/v1/`). | `same.py <old port> <new port>` |
| `carry.py` | Real dashboard only (phase 5): what a visitor already has saved still works. The same saved data (a key-shaped Console key, a fake GitHub token, a sent launch, a watched tour, a heard talk, 24-hour clock) is planted in the old page and the new one, and each is asked whether it recognises it. | Old dashboard on one port, new on another: `carry.py <old port> <new port>` |
| `kitbase.py` | The kit (K1 in `PANO-KIT-PLAN.md`): Paño on a plain, fictional scrolling site (`sites/kite-shop/`) whose brain is only `"extends": "base"`, a name and one tour of css steps. He greets with base's wording and his own name, his menu and labels are right, the tour scrolls, rings and finishes at phone and desktop sizes, nothing he says is blank, the page can recolor him with `--pano-*` variables, the background works with no words for its options and no note, a three-file chain works, a chain that loops keeps him hidden, and `menu.show` is optional. Since K3: on a phone, a target at the very end of the page (the footer) still comes up above his bubble (he adds room below the page, and takes it away when he rests). | Serves the site itself: `kitbase.py [port]` (8790 by default). About a minute. |
| `kitcheck.py` | The kit (K2): `Pano.check()` and `kit/brain.schema.json`. The kite shop as it is has no problems; then its brain or adapter is broken one way at a time (a misspelt or blank line, no `extends`, a step the page can't read, a misspelt selector, a step with no way on, `menu.show` naming a missing tour, a misspelt step field, bad JSON, a loop, a background with no style, an unknown colorblind mode, no brain) and the check must name each mistake and where it is. Hidden targets and unused fields are notes, not problems. The schema must accept the kite shop's brain and every line in `base.json`, list exactly base's lines, and turn away broken brains. Since K3, tours that name their pages (`pages`) on the shop's two pages (`index.html`, `visit.html`): each page offers only its own tours, `/`, a query and a hash, and `/visit` for `visit.html` match, a tour with no `pages` is offered everywhere, a wrong address (404), a `pages` that isn't a list and an empty list are problems, a misspelt target is left alone on other pages and caught on its own, and the visit tour runs to the end at phone and desktop sizes. | Serves the site itself: `kitcheck.py [port]` (8791 by default). Needs `pip install jsonschema`. About two minutes. |
| (kit) `kit/check_site.py` | Not a test of this repo but the kit's own checker (K3): for any site folder, every page that loads Paño at phone and desktop sizes. He appears, `Pano.check()`, his menu, every tour he offers walked to the end with its targets on screen, every background visible, no page errors. `kit/example/` should end in "All good". | `python3 kit/check_site.py kit/example --engine .` (`--engine .` answers for `marquisphill.github.io/Pano/` from this working copy). About two minutes. |
| `devdash.py` | Dashboard DEV copy only: it uses its own storage names, ignores the real token and key, and Launch is off. | Serve `Dashboard-DEV` on 8773, then `devdash.py`. |
| `dash.py` | The dashboard on the shared Paño (phase 4). His files come from `/Pano/latest/` and the page carries none of his code or lines. Head mode and dragging. Background and colorblind modes. The three tours, including the steps that depend on the page (token saved or not, weather loaded or not). Talks and the prompt builder. His stories. The Claude chat, with a faked reply: wrong keys, a rejected key, a saved key, what is sent to Claude, errors. Each adapter entry taken out in turn. The four tours written but not offered. | Serve `Dashboard-DEV` on 8773, then `dash.py`. About 12 minutes. |

## Reading the output

Each line starts with the screen size it ran at. Look for `errors []` at the end of each size, and for any line reporting `False` where the label describes something that should be true.

Some known quirks:
- `tours.py` on phones reports `win:...` for steps whose target is a whole window. That is expected.
- `clean.py` on desktop clicks the first highlighted button, which is now "Organize them", so four windows remain. Use `wins.py` for the close-all check.
- Timings in `idle.py` include about a second for Paño's walk to the top, and vary by a few tenths of a second between runs.
- `wins.py` lines `desk 4 menu with one window` and `short 4 menu with one window` sometimes print an empty list `[]` and sometimes the menu items, on the same site. It is a timing flicker in the test: it taps him just as his "All clean!" note closes. (Phase 4 saw both answers on both lines, old files and new.)
- `sweep.py` lists `Failed to load resource` errors and ends in `bad` when the machine running the tests cannot reach outside addresses such as Google Analytics. That is the test machine, not the site.
- `clean.py` on desktop, line `bubble after`, sometimes prints `HIDDEN` and sometimes the "All organized!" note, on the same site. The test reads the bubble just as that note closes.
- `clean.py 880 900 fold` stops with a timeout: at that width an open window covers the icon the test tries to double-click. It did this before phase 1 too.
- `tours.py` sometimes prints a `click-race` line and an extra step. That is the test clicking a button as it is replaced.
- `same.py` "after the note" sometimes prints `screenshot same False` on one size, with every computed style the same. On the phone it is the portfolio's own mail icon in the taskbar, drawn a few pixels to one side (seen in the kit's K1 and K2 runs; a re-run passed, or moved the miss to another size). Re-run to confirm.
- A full run takes 20 minutes or more. `tours.py` is the slow one.
- `wall.py` prints a Pillow deprecation warning. It is harmless.
- `brain.py` lines starting `later` are for tours not yet in his menu. They should read `steps shown N of N | finished True | errors []`.

- `dash.py` runs against Dashboard-DEV and the real dashboard. It tells them apart by the page: DEV has Launch off and `dev-` names. On the real one it checks the real names instead, and "Launch it for me" sends one launch to a stand-in for GitHub inside the test (nothing reaches GitHub). Its first line says which site it found. `devdash.py` is for DEV only and reports False on the real dashboard by design, so for the real one run `dash.py` on its own (with `/Pano/latest/` changed to `/Pano/v1/`, as `run_dash.sh out 8773 v1` does).
- `dash.py` answers everything outside the page itself: the labs list, the staging preview and the Claude API are faked, and the weather is kept offline. It never uses a real key. The key it types is the right shape and nothing more.
- `dash.py` lines starting `later` are for dashboard tours not yet in his menu. They should read `steps shown N of N | finished True | errors []`.
- In `dash.py`, some lines print a little extra after `True` (a time, the step numbers). `idle 1` should be between 19 and 23.5 seconds.

The portfolio scripts were written for the portfolio and do not run against the dashboard: its page has no windows, icons or Recycle Bin. The dashboard is covered by `devdash.py` and `dash.py`.
