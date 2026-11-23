# Paño tests

Browser tests written while Paño was built into the portfolio (2026-11-22). They drive the real page in a headless browser and print what happened. Run them before and after every change to prove nothing broke.

## Setup

```bash
pip install playwright pillow
python -m playwright install chromium
mkdir -p /tmp/pano-qa          # screenshots are written here
```

## Running

Serve the site you want to test on port 8773, then run a script:

```bash
cd path/to/portfolio-site && python3 -m http.server 8773 &
python3 tests/tours.py desk "app:contact,app:skills"
python3 tests/wins.py
```

Every script expects the site at `http://localhost:8773/index.html`.

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

## Reading the output

Each line starts with the screen size it ran at. Look for `errors []` at the end of each size, and for any line reporting `False` where the label describes something that should be true.

Some known quirks:
- `tours.py` on phones reports `win:...` for steps whose target is a whole window. That is expected.
- `clean.py` on desktop clicks the first highlighted button, which is now "Organize them", so four windows remain. Use `wins.py` for the close-all check.
- Timings in `idle.py` include about a second for Paño's walk to the top.

These scripts were written for the portfolio. In phase 4 they need a way to point at the dashboard too.
