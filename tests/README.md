# Paño tests

Browser tests written while Paño was built into the portfolio (2026-11-22). They drive the real page in a headless browser and print what happened. Run them before and after every change to prove nothing broke.

## Setup

```bash
pip install playwright pillow
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
| `brain.py` | What he says comes from `latest/brain/portfolio.json`: no lines left in the code or the page, his menu and greeting match the brain, editing the JSON alone changes them, the page still works if the brain cannot be fetched. It also walks the tours that are written but not in his menu yet. | `brain.py` |
| `skills.py` | Each ability is its own file in `latest/skills/`. A skill is offered only when the page's adapter has what it needs: the test takes each adapter entry out in turn and checks that skill goes and the rest still work. Also: a saved background shows with no flash, a skill file that cannot be fetched, and Paño added to a page that has already loaded. | `skills.py` |
| `devdash.py` | Dashboard DEV copy only: it uses its own storage names, ignores the real token and key, and Launch is off. | Serve `Dashboard-DEV` on 8773, then `devdash.py`. It still has its own Paño inside the page until phase 4. |

## Reading the output

Each line starts with the screen size it ran at. Look for `errors []` at the end of each size, and for any line reporting `False` where the label describes something that should be true.

Some known quirks:
- `tours.py` on phones reports `win:...` for steps whose target is a whole window. That is expected.
- `clean.py` on desktop clicks the first highlighted button, which is now "Organize them", so four windows remain. Use `wins.py` for the close-all check.
- Timings in `idle.py` include about a second for Paño's walk to the top, and vary by a few tenths of a second between runs.
- `wins.py` line `desk 4 menu with one window` sometimes prints an empty list `[]` and sometimes the menu items, on the same site. It is a timing flicker in the test. The `short` line is steady.
- `sweep.py` lists `Failed to load resource` errors and ends in `bad` when the machine running the tests cannot reach outside addresses such as Google Analytics. That is the test machine, not the site.
- `clean.py` on desktop, line `bubble after`, sometimes prints `HIDDEN` and sometimes the "All organized!" note, on the same site. The test reads the bubble just as that note closes.
- `clean.py 880 900 fold` stops with a timeout: at that width an open window covers the icon the test tries to double-click. It did this before phase 1 too.
- `tours.py` sometimes prints a `click-race` line and an extra step. That is the test clicking a button as it is replaced.
- A full run takes 20 minutes or more. `tours.py` is the slow one.
- `wall.py` prints a Pillow deprecation warning. It is harmless.
- `brain.py` lines starting `later` are for tours not yet in his menu. They should read `steps shown N of N | finished True | errors []`.

The portfolio scripts were written for the portfolio. In phase 4 they need a way to point at the dashboard too. `devdash.py` is the only dashboard test so far.
