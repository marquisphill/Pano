# Paño: one cat, two sites

This file is the handoff for the project. Every phase is done in a fresh chat that knows nothing else, so everything it needs is here. **Read the whole file, do the next phase in the Status log, then update the Status log before you finish.**

Phill's one-line prompt for each phase: *"Read PANO-PLAN.md in the Pano repo and do the next phase."*

---

## The goal

Paño is Phill's red cartoon cat guide. Today he exists as two separate copies of code, one inside each site. The goal is one Paño, kept in this repo, that both sites load. New abilities built here reach both sites, as long as the site can support them.

## Where things stand (as of 2026-11-22)

**Sites and repos** (GitHub user `marquisphill`, all served by GitHub Pages from `main`):

| Repo | Site | Notes |
|---|---|---|
| `Professional-Portfolio2` | https://marquisphill.github.io/Professional-Portfolio2/ | Production portfolio |
| `Professional-Portfolio2-STAGING` | https://marquisphill.github.io/Professional-Portfolio2-STAGING/ | Staging portfolio. All changes land here first. |
| `Personal-Dashboard` | https://marquisphill.github.io/Personal-Dashboard/ | Phill's personal dashboard. Private repo. No staging. |
| `Pano` | (this repo) | Paño's future home. Public. |
| `Portfolio-DEV` | https://marquisphill.github.io/Portfolio-DEV/ (once Pages is on) | DEV copy of the portfolio for this build. Temporary; deleted in phase 6. Public. |
| `Dashboard-DEV` | https://marquisphill.github.io/Dashboard-DEV/ (once Pages is on) | DEV copy of the dashboard. Created public; see the open question in the Status log. |

**Portfolio Paño** lives inside `index.html` of the portfolio (one big file: CSS, markup, then one script). Everything is scripted; there is no AI. His lines are typed into the code. What he can do:
- Guided tours (résumé, history, projects, skills, contact) with a highlight ring; windows covering a target are minimized first.
- Menu when tapped; speech bubble; can be dragged anywhere.
- Starts in the bottom-right corner. After the visitor first interacts, he tucks away to a big head at the top middle (4s idle normally, 10s when waiting on the visitor). Tap the head to bring him back.
- Windows: offers to tidy up at 4+ windows; "Organize windows" (diagonal stack) and "Close all windows" (he eats them) whenever 2+ are open.
- Recycle Bin: drag him onto it and he refuses, sits, licks a paw, complains.
- "Change the background": three backgrounds, then "Are you colorblind?", four working colorblind modes, grey-then-wipe reveal, and Phill's note. Choices are saved in the browser.

**Dashboard Paño** is an older copy of the same body code inside the dashboard's `index.html`. It has none of the abilities added on 2026-11-22. It has one thing the portfolio lacks: an optional Claude chat that calls the Claude API with a Console key the visitor pastes in (kept in that browser only).

**His brain** is JSON in the portfolio repos under `pano-brain/` (`core.json`, `portfolio.json`, `dashboard.json`, plus a README). The dashboard loads it from the production portfolio address. The portfolio homepage does **not** load it yet, even though `portfolio.json` exists.

## Target design

This repo is served by GitHub Pages and holds three things:
1. **Body and engine** (`pano.js`, `pano.css`): drawing, movement, bubble, dragging, head mode, idle timing, tour runner.
2. **Brain** (JSON): what he says and knows, per site.
3. **Skills**: one module per ability. Each declares what it needs from the page. A skill is offered only where the page supports it.

| Skill | Needs from the page | Portfolio | Dashboard |
|---|---|---|---|
| Tours | Things to point at | Yes | Yes |
| Head mode, dragging | Nothing | Yes | Yes |
| Organize / close windows | A window system | Yes | No |
| Recycle bin | A bin icon | Yes | No |
| Background + colorblind modes | A background | Yes | Yes |
| Claude chat | A Console key | Phill decides in phase 3 | Yes |

Each site keeps a small **adapter**: one line that loads Paño plus a short block telling him what the page has.

**Versions.** This repo keeps a `latest/` folder and numbered folders (`v1/`, `v2/`). DEV sites load `latest/`. Staging and production load a numbered version. Without this, a push here would change the live sites at once.

## Rules

1. **Never change production or the real dashboard unless Phill says so in that chat.** DEV first, then staging, then production.
2. **Promotion** of the portfolio means: make production's files identical to staging's in one normal commit, leaving out the `.claude` folder. No force-pushes, no history rewrites.
3. **Shared browser storage.** Every site under `marquisphill.github.io` shares one browser storage. DEV copies must use their own storage key names so they never read Phill's real Console key or GitHub token. Turn the Launch button off on the dashboard DEV copy.
4. **No behavior changes during a move.** Phases 1 to 3 must leave the portfolio looking and behaving the same. Prove it with the tests.
5. **Run the tests** in `tests/` before and after each phase (see `tests/README.md`). Add tests for anything new.
6. **No secrets in any repo.** Keys stay in the browser or in GitHub secrets.
7. **Tell Phill plainly** what changed, what was tested, and anything that could not be checked.
8. Phill is on a phone or a foldable much of the time. Check phone, unfolded-foldable and desktop sizes.

## Phases

Each phase fits in one chat and ends with every site still working.

**Phase 0. Set up the workshop** (small)
- The three repos exist: `Pano`, `Portfolio-DEV`, `Dashboard-DEV` (created 2026-11-22).
- **Before copying the dashboard:** `Personal-Dashboard` is private and `Dashboard-DEV` was created public. Ask Phill whether to make `Dashboard-DEV` private first. Do not copy the dashboard's files into a public repo without his answer.
- Copy the staging portfolio into the portfolio DEV repo and the dashboard into the dashboard DEV repo. Turn on GitHub Pages for both DEV repos and for `Pano` (Phill may need to do this in repo settings).
- Give DEV copies their own storage key names. Turn off Launch on the dashboard DEV copy.
- Done when: both DEV sites load and behave like the real ones, and the tests pass against the portfolio DEV site.

**Phase 1. Lift Paño out** (large)
- Move Paño's CSS, markup and script out of the portfolio DEV homepage into `latest/pano.css` and `latest/pano.js` here. The DEV portfolio loads them from this repo.
- Site-specific parts (window manager, icons, toast, analytics) stay in the page and are passed in.
- Done when: the DEV portfolio is visibly identical and all tests pass.

**Phase 2. Move his words into the brain** (small)
- Move `pano-brain/` into this repo. Move tours and spoken lines out of the code and into the brain JSON. The portfolio loads its brain file.
- Done when: nothing looks different, tests pass, and a line can be changed by editing JSON only.

**Phase 3. Split him into skills** (medium)
- One module per skill, each declaring what it needs. Add the "does this page support it" check. Write the portfolio adapter.
- Ask Phill: should the portfolio's Paño get the Claude chat skill, or stay scripted?
- Done when: the DEV portfolio is identical, tests pass, and removing an adapter entry hides that skill from his menu.

**Phase 4. Bring the dashboard on** (large)
- Write the dashboard adapter. Move the dashboard's Claude chat in as a skill. Delete the dashboard DEV copy's old Paño code.
- Done when: the DEV dashboard's Paño has head mode, dragging, background and colorblind modes, and chat still works; tests run against both DEV sites.

**Phase 5. Release version 1** (small)
- Copy `latest/` to `v1/`. Point staging at `v1/` for Phill's review. With his go-ahead, promote the portfolio to production and switch the real dashboard to `v1/`.
- Done when: both live sites run the same Paño from `v1/`.

**Phase 6. Clean up** (small)
- Delete the temporary portfolio DEV repo (Phill does this). Remove leftover Paño files and `pano-brain/` from the portfolio repos. Write `ADDING-A-SKILL.md` here. Update each README.
- Done when: one Paño repo, a small adapter per site, nothing duplicated.

## Decisions already made

- Separate `Pano` repo, with DEV copies of each site for the build. (2026-11-22)
- The dashboard has no staging; its DEV copy is enough.
- Paño stays scripted. He is not being turned into a Console-built AI agent.
- One phase per chat, to keep usage down.

## Status log

Update this at the end of every phase: date, what was done, decisions, anything left open.

- **2026-11-22.** Plan written. Phill created `Pano`, `Portfolio-DEV` and `Dashboard-DEV`. Test scripts saved to `tests/` (copied over, not yet re-run from here). **Next: Phase 0.** Open question for Phill: `Dashboard-DEV` is public but the real dashboard repo is private; should the DEV copy be made private before the dashboard is copied in?
- **2026-11-23. Phase 0 done, except turning on GitHub Pages (Phill).**
  - **Decision:** Phill chose to keep `Dashboard-DEV` public and copy the dashboard in. Both files were checked for keys and tokens first; none found.
  - **Portfolio-DEV** is a copy of staging at `a8fd203`, without `.claude`. Differences from staging: saved settings are named `dev-pf-wall`, `dev-pf-cb` and `dev-labs-view`; `index.html` and `hackathon.html` ask search engines not to list them. The three per-tab names (`catGreeted`, `panoHead`, `panoHeadPos`) were left alone: they hold no secrets and the tests set `catGreeted`.
  - **Dashboard-DEV** is `index.html` from `Personal-Dashboard` at `695da67`. The `.github` launcher workflow was not copied. Differences: every saved name starts with `dev-` (`dev-pd-gh-token`, `dev-pd-pano-key`, `dev-pd-pano-brain`, `dev-pd-pano-mem`, `dev-pd-pano-seen`, `dev-pd-preview`, `dev-pd-proto-requests-v2`, `dev-pd-clock-24h`, `dev-wx-last`); Launch is off (button greyed out, and the form refuses to send, via `LAUNCH_OFF` in the script); the page asks not to be listed. Paño's "Launch it for me" tutorial step therefore stops at the refusal on DEV.
  - **Tests:** every script in `tests/` was run against a local copy of staging and of Portfolio-DEV. Results matched, apart from timing differences of a few tenths of a second and one flickering line now listed in `tests/README.md`. New test `tests/devdash.py` passes against Dashboard-DEV at phone, fold and desktop sizes.
  - **Not checked:** the live DEV addresses. The cloud session cannot reach `marquisphill.github.io`, and it cannot change repo settings. Tests ran against local copies of the same files.
  - **Phill to do:** turn on GitHub Pages (Settings, Pages, Deploy from a branch, `main`, `/ (root)`) for `Pano`, `Portfolio-DEV` and `Dashboard-DEV`, then open both DEV addresses once to confirm they load.
  - **Found along the way, for later phases:**
    - The dashboard's Paño is newer than "Where things stand" says. He already has head mode and a remembered head position. Phase 4 should compare the two copies before assuming what is missing.
    - The dashboard loads the brain and the labs list from the **staging** portfolio address, not production. The DEV dashboard does the same.
    - Portfolio-DEV still sends visits to the real Google Analytics property (`G-5GF8YXENEH`), as staging does. The dashboard has no analytics. Left as is to keep DEV identical; say so if DEV visits should be kept out.
  - **Next: Phase 1** (lift Paño out of the Portfolio-DEV homepage into `latest/pano.css` and `latest/pano.js` here). It needs Pages on for `Pano` and `Portfolio-DEV` to be checked live.
- **2026-11-23. Phase 1 done.** Paño's body and engine now live here, and Portfolio-DEV loads them.
  - **Pages is on** for `Pano`, `Portfolio-DEV` and `Dashboard-DEV`. Phill added `marquisphill.github.io` to the cloud environment's allowed addresses, so later chats can check the live sites.
  - **What moved here:** `latest/pano.css` (his styles, bubble, ring, and the phone-size rules) and `latest/pano.js` (his markup, walking, bubble, ring, tour runner, menu, background and colorblind flow, window clean-up, head mode, idle timing, dragging, Recycle Bin sulk, hello). The code was moved by a script, line for line; only the points where it touched the page were changed.
  - **How the page loads him:** a `<link>` to `/Pano/latest/pano.css` in the head, a `<script src="/Pano/latest/pano.js">` where his markup used to be (the script puts his elements at that spot), and one `Pano.init({...})` call near the end of the page script. That call is the adapter. The top of `pano.js` lists everything it accepts.
  - **What stayed in Portfolio-DEV's page:** the tours and menu entries (they point at page things; phase 2 moves the words to the brain), the window manager, toast, analytics, the background and colorblind CSS and SVG filters, and the Recycle Bin icon's own styles. The page calls back into him in four places: after a window opens, after one closes, before showing the toast, and on Escape. If his files fail to load, the page works without him.
  - **Decision: addresses start with `/Pano/latest/`, not the full `https://marquisphill.github.io/...`.** Every site is under the same address on GitHub Pages, so this works there, and it lets the tests use the working copy of this repo. Because of this, use `tests/serve.py` (it mounts this repo at `/Pano/`), not `python3 -m http.server`.
  - **Tests:** new `tests/serve.py`, `tests/run_all.sh` (runs everything, keeps the output) and `tests/lifted.py` (the page loads him from here, carries none of his code, and survives his files being blocked). The full suite was run against the old Portfolio-DEV page and the new one, side by side. Outputs were identical for head (3 sizes), bin, cases, clean (phone, desk), sweep, tours (desk, phone). Differences: `idle.py` timings by 0.3s, one saturation reading by 0.1, the known `wins.py` flicker, and a click-race flake in `tours.py fold` on the old page only. A separate check compared every computed style on every Paño element in six poses at three sizes: no differences once animations were stilled.
  - **Checked live:** after both pushes, https://marquisphill.github.io/Portfolio-DEV/ was driven in a browser at phone, fold and desktop sizes. It fetched both Paño files from `/Pano/latest/`, he greeted, and the Contact tour ran both steps with no page errors. https://marquisphill.github.io/Dashboard-DEV/ loads with no errors and uses only `dev-` storage names (its Paño is still the old in-page copy).
  - **Test limit found:** `clean.py 880 900 fold` fails the same way on old and new. Its own double-click is blocked by an open window at that width. The test needs fixing, not the site.
  - **Found along the way, for later phases:**
    - `pano.js` still has portfolio assumptions that phase 3 or 4 must turn into adapter entries: the taskbar height (44, or 52 on phones) used when placing him and the bubble; the three background names and four colorblind modes; the `grayveil`, `wallnext` and `wipeline` styles and the `cb-*` filters, which are still in the page; and his name and lines ("Phill’s cat", the clean-up and bin lines).
    - The three per-tab names (`catGreeted`, `panoHead`, `panoHeadPos`) are now set inside `pano.js`. All sites share one browser storage per tab, so the dashboard will share them unless phase 4 gives each site its own.
    - GitHub Pages caches files for 10 minutes. After a push here, a DEV site can show the old Paño for that long.
  - **Next: Phase 2** (move `pano-brain/` here; move tours and spoken lines into the brain JSON; the portfolio loads its brain file).
