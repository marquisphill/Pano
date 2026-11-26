# Working on Paño

Paño is Phill's red cartoon cat guide. This repo is his single home: engine, skills and brain. Two builds are tracked here:

- `PANO-PLAN.md`: moving Paño into this repo for Phill's portfolio and dashboard. **Read its Rules** before any change.
- `PANO-KIT-PLAN.md`: the kit that lets anyone put Paño on their own site. **Read the whole file** and do the next phase in its Status log.

## Every session

1. **Work in `latest/`.** Never edit a released folder (`v1/`, `v2/`, and any later `vN/`). A release is a new copy of `latest/` under the next number.
2. **Run the tests in `tests/` before and after any change, and compare the results.** `tests/README.md` has the method: serve a frozen copy of the repo as "before" and the working copy as "after", run both, diff. Known harmless quirks are listed there.
3. **Keep the live sites on their released version** (`Professional-Portfolio2`, `Professional-Portfolio2-STAGING` and `Personal-Dashboard` load `v2/`) until Phill says otherwise. `Portfolio-DEV` and `Dashboard-DEV` load `latest/`, so every change here must keep both working.
4. **Work on a branch, never directly on `main`.** Ask Phill before merging into `main`.
5. **Tell Phill plainly** what changed, what was tested, and what couldn't be checked. Keep it short: he is often on his phone.

## Good to know

- Everything here is public, served by GitHub Pages. No personal details, no keys or tokens.
- Cloud sessions can't reach `marquisphill.github.io`. Test local copies: clone the public DEV repos into a scratch folder (never commit them) and serve them with `python3 tests/serve.py <site> <port> [pano folder]`.
- Python tests: `pip install playwright==1.63.0 pillow` (Chromium is preinstalled in cloud sessions).
