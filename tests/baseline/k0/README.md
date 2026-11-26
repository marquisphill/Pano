# Baseline: K0 of the kit build (2026-11-26)

What the test suites printed before any kit work, so later phases can tell old quirks from new breakage.

- **Pano:** `main` at `01978af` (engine and brains in `latest/` unchanged since `v2/`).
- **Sites:** local copies of `Portfolio-DEV` at `06df063` and `Dashboard-DEV` at `7fb4c14`, both loading `/Pano/latest/`.
- **How:** `tests/run_all.sh <out> 8773 latest` and `tests/run_dash.sh <out> 8775 latest`, run at the same time on one cloud machine. Screenshots not kept.

## Results

- **Dashboard** (`dashboard/`): `dash.py` 205 of 205 True, nothing False. `devdash.py` all True at three sizes. No page errors.
- **Portfolio** (`portfolio/`): `lifted.py` 20 of 20, `skills.py` 29 of 29. Everything else matches the known quirks in `tests/README.md`:
  - `clean-fold`: the known timeout at 880 wide.
  - `sweep`: `ERR_TUNNEL_CONNECTION_FAILED` errors, because the cloud machine can't reach outside addresses.
  - `brain.py`: 34 True, 2 False. Both False lines are `later hackathon-photos` (3 of 4 steps, not finished). Expected: `v2` changed that tour to the portfolio's new layout, but `Portfolio-DEV`'s page still has the old one (see `PANO-PLAN.md`, 2026-11-26). The tour is not offered in his menu.
  - Lines reading `False` in `head-*` (`menu opened by drag? False`; `9 tour ... False`, meaning he is not a head mid-tour; `at dragged spot False`) and `clean-desk` (`asks again: False`, meaning he does not ask to clean up twice) are the expected answers, not failures.
