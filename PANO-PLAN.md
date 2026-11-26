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
| Talks (scripted lessons, the prompt builder) | Somewhere to put a built prompt | No | Yes |
| Topics (his stories, "Ask about Phill") | A way to show portfolio things | No | Yes |
| Claude chat | A Console key | No (stays scripted; decided 2026-11-23) | Yes |

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
- The portfolio's Paño stays scripted. No Claude chat skill on the portfolio. (2026-11-23)
- The dashboard's Paño takes the shared body as it is. Where the two copies behaved differently, the dashboard now does what the portfolio does, except where a site's adapter says otherwise (how long he waits, where he may stand, his colors). (2026-11-23)
- Skills only some pages want (talks, topics, chat) are fetched only by pages whose adapter asks for them. The portfolio never downloads the chat code. (2026-11-23)

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
- **2026-11-23. Phase 2 done.** What Paño says now lives in his brain here, and Portfolio-DEV loads it.
  - **The brain moved in:** `pano-brain/` was copied to `latest/brain/` (inside `latest/` so it gets a version number along with the code in phase 5). The copies in the portfolio repos were left alone, as Phill asked; phase 6 removes them. The dashboard still reads the staging copy.
  - **What moved out of the code:** every line in `pano.js` (his name, hello, menu buttons, tour buttons, background and colorblind questions, Phill's note, clean-up lines, the Recycle Bin complaint, screen-reader labels, and the "Tap" for "Click" wording on touch screens) is now in `latest/brain/portfolio.json` under `lines`. The five tours and the menu left Portfolio-DEV's page and are read from `tours` and `menu.show` in the same file. All 68 strings were checked against the old code, word for word.
  - **How the page loads it:** the adapter now says `brain: 'portfolio'`, which loads `brain/portfolio.json` from beside `pano.js`. Tour steps are plain data. `pano.js` reads the general ones (`css`, `css_visible`, `when_visible`, `click`, `focus`); the page passes `tourHelpers` for the ones about its own page (desktop icons, files, windows, the Skills cards). `latest/brain/README.md` has the table.
  - **Changes made to the brain copy so it matches what he does today:** two tour lines were corrected to the page's wording (projects step 3, skills step 2); the skills tour's one-off code call became `skill_card: 0`; `menu.show` now lists only the five tours he offers, and the six written-but-unoffered tours moved to `menu.show_later`. The `existing` flags on portfolio tours were dropped, since `show` and `show_later` say the same thing.
  - **Decision: only `portfolio.json` is loaded, not `core.json`.** Nothing he does on the portfolio uses the core file yet (persona, facts, talk topics), so it is not fetched. Lines both sites will share (background, head mode) sit in `portfolio.json` for now; phase 4 should move the shared ones to `core.json` when the dashboard comes on, and load both.
  - **Decision: no brain, no cat.** He stays hidden until the brain arrives (it normally lands well inside the 0.9s he already waited). If it cannot be fetched he never appears and the page works without him. No spare copy of his lines is kept in the code.
  - **Tests:** new `tests/brain.py`, added to `run_all.sh` with `lifted.py`. It checks that no line is left in `pano.js` or the page, that every line the engine asks for is in the brain, that his greeting, menu and labels match the JSON, that editing the JSON alone changes a greeting, a tour step, a button and the menu, and that the page works with the brain blocked. The full suite was run against the phase 1 pair and the phase 2 pair, side by side. Outputs were identical for head (3 sizes), wins, clean (3 sizes), bin, cases, sweep and tours (desk, fold, phone). Differences: two `idle.py` timings by 0.2 to 0.3s, and two `wall.py` mid-wipe saturation readings (111.0 vs 105.9, 7.1 vs 9.0), which are screenshots taken mid-animation; every other `wall.py` line matched.
  - **Checked live:** after both pushes, https://marquisphill.github.io/Portfolio-DEV/ was driven at phone, fold and desktop sizes. It fetched `pano.js`, `pano.css` and `brain/portfolio.json` from `/Pano/latest/`, he greeted with the same menu, and the Contact tour ran both steps ("Tap" on the phone, "Click" elsewhere) with no page errors. https://marquisphill.github.io/Dashboard-DEV/ loads with no errors and only `dev-` storage names.
  - **Found along the way, for later phases:**
    - The six tours in `menu.show_later` (availability, announcement, hackathon photos, kind words, AI Lab, Recycle Bin) all run start to finish on phone and desktop when added to the menu; `tests/brain.py` walks them. Offering them is a one-line JSON edit, but it changes what visitors see, so it is Phill's call. Eleven menu buttons will also need a look on a phone.
    - The background names and colorblind mode names are still listed in `pano.js` (the words for them are in the brain). Phase 3 should make them adapter entries, as already noted.
    - `portfolio.json` still holds `greetings`, `idle_nudges`, `sign_offs`, `fallbacks` and talk topics that nothing reads. They differ from what he says today (`lines`). They were left for the talking skill, if Phill wants one in phase 3.
    - A brain edit reaches the DEV site only after GitHub Pages' 10-minute cache runs out.
  - **Next: Phase 3** (split him into skills; each declares what it needs; the adapter says what the page has). It starts with a question for Phill: should the portfolio's Paño get the Claude chat skill, or stay scripted?
- **2026-11-23. Phase 3 done.** Paño's abilities are now separate skills, and a page gets only the ones it supports.
  - **Decision (Phill): the portfolio's Paño stays scripted.** No Claude chat skill on the portfolio. The chat skill is still to be written, in phase 4, for the dashboard only.
  - **The skills:** `latest/skills/tours.js`, `background.js`, `windows.js` and `bin.js`. Each starts with a note saying what it needs from the page. The code was moved, not rewritten. `latest/skills/README.md` explains how a skill is written and how to add one. `pano.js` is now only his body and engine: walking, bubble, ring, tour runner, menu, head mode, idle timing, dragging. Head mode and dragging need nothing from a page, so they stayed in the engine.
  - **The "does this page support it" check:** each skill names the adapter entries it needs (`background`, `windows`, `bin`). If the page's adapter has them, the skill is on and adds its buttons to his menu. If not, he does not offer it and nothing breaks. Tours are checked one by one: a tour is offered only if the page can read every step, so a tour made only of plain `css` steps works on any page, and the portfolio's icon-and-window tours need the page's `tours` entry. Running `Pano.here.skills()` in a page's console lists which skills are on and why any are off.
  - **The portfolio adapter** in Portfolio-DEV's page now ends with one line per skill: `tours`, `background`, `windows`, `bin`. The background names, colorblind mode names and saved-setting names moved out of `pano.js` into the `background` line. The page now tells him about windows with `pano.notice('window-opened')` and `pano.notice('window-closed')`.
  - **How skills load:** the page still has one line for him. `pano.js` writes the four skill files in right after itself while the page is being read, so they are ready before the page starts him and a saved background shows with no flash. If he is added to a page that has already loaded, the files are fetched and he waits. If one cannot be fetched he goes without that skill.
  - **Tests:** new `tests/skills.py`, added to `run_all.sh`. It checks the four files load, all four are on, and his menu is unchanged; then it takes each adapter line out in turn and checks that skill goes while the rest work (no tour buttons; no background button; no clean-up offer or window buttons; he can be dropped on the bin with no reaction). It also covers the saved background, a blocked skill file, and late loading. All 29 checks pass at the sizes it runs. `tests/brain.py` now reads the skill files too. The full suite was run against the phase 2 pair and the phase 3 pair, side by side. Outputs were identical for head (3 sizes), bin, cases, sweep, lifted, clean (phone, fold), and tours (desk, fold, phone). Differences: one `idle.py` timing by 0.2s; two `wall.py` mid-wipe readings by 0.1; the known `wins.py` flicker; and `clean.py desk` "bubble after", which re-runs showed flickering between the two answers on old and new alike (the test reads the bubble just as his 2.6s note closes; now listed in `tests/README.md`).
  - **Checked live:** after both pushes, https://marquisphill.github.io/Portfolio-DEV/ was driven at phone, fold and desktop sizes. It fetched `pano.js`, `pano.css`, the four skill files and `brain/portfolio.json` from `/Pano/latest/`, all four skills were on, he greeted with the same menu, and the Contact tour ran both steps with no page errors. https://marquisphill.github.io/Dashboard-DEV/ loads with no errors and only `dev-` storage names (its Paño is still the old in-page copy). The background change, window clean-up and Recycle Bin were tested on the local copy of the same files, not clicked through on the live address.
  - **Found along the way, for phase 4:**
    - Still portfolio-shaped inside the code: the taskbar height (44, 48 and 52 appear in the engine and in `windows.js`), and his styles are one file (`pano.css`) including the moods only skills use.
    - The background skill expects the page to supply the styles for its own backgrounds, the `cb-*` filters, and the `wallnext`, `grayveil` and `wipeline` layers. The dashboard has none of these yet. The last three are the same on any page and could move into `pano.css`.
    - If a page lists no colorblind modes, he skips that question and just changes the background.
    - Unchanged from phase 2: the per-tab names (`catGreeted`, `panoHead`) are shared by all sites; shared lines should move to `core.json` when the dashboard loads its brain.
  - **Next: Phase 4** (dashboard adapter; move the dashboard's Claude chat in as a skill; delete the dashboard DEV copy's old Paño code). It needs push access to `Dashboard-DEV`. Start by comparing the dashboard's Paño with this one, as noted under Phase 0.
- **2026-11-23. Phase 4 done.** The DEV dashboard now runs the shared Paño. Its own copy of him is gone from the page.
  - **What the dashboard's Paño was.** The comparison asked for under Phase 0 found he was much more than an older copy. He had three tours whose steps depend on the page, ten scripted talks (five lessons, one of which builds a prompt with the visitor, and five little chats he starts himself), about sixty stories from the brain ("Ask about Phill"), an ask box, a memory of what the visitor has seen, and the Claude chat. All of it moved; none was dropped.
  - **Three new skills here:** `latest/skills/talks.js`, `topics.js` and `chat.js`. Each needs an adapter entry of the same name. They are fetched only by a page that has that entry, so **the portfolio never downloads the chat code**. `tours.js` learned steps that depend on the page (`when`, `unless`, gaps like `{place}`, `need`, `skip`, `jump`); `latest/brain/README.md` has the table.
  - **His dashboard words moved into the brain.** `latest/brain/dashboard.json` now holds his lines, the three tours, the ten talks, the quick replies he gives without Claude, and what Claude is told. They were lifted from the old code by a script, word for word. The old `claude_chat.system_prompt` in that file was a different, unused prompt; it was replaced with the one he actually uses.
  - **Shared lines are in `core.json`** (the background and colorblind questions, the tick for things already seen). A site's file says `"extends": "core.json"` and the engine loads both; the site's lines win. **Portfolio-DEV did not need changing**: its adapter still says `brain: 'portfolio'`. It now fetches `core.json` too (41 KB), which is the only difference in what it downloads.
  - **The engine takes more from the adapter**, all optional, all defaulting to what the portfolio does: `layout` (space to keep clear at the bottom, the phone's gesture bar, a page that scrolls), `keys` (per-tab names), `idle` (how long he waits), `memory` (what he remembers between visits), `fidget`. His colors and button sizes are now CSS variables on the page (`--pano-bubble` and so on), with the portfolio's look as the default.
  - **The dashboard page** went from 2,240 lines to 992. What is left for him: one line that loads him, his colors, three backgrounds (Plain, Sunrise, Ocean, which are new and are Phill's to change), and the adapter in the last script. Per-tab names are now `dev-pd-pano-greeted` and `dev-pd-pano-head`, so the two sites no longer share them. The background skill brings its own colorblind filters and reveal layers to a page that has none; the portfolio keeps its own.
  - **The Claude chat** is the same request as before (model `claude-opus-5-5`, low effort, a JSON reply, the visitor's own Console key from that browser, sent only to `api.anthropic.com`). It was tested with a faked reply. **Phill then tried it with his real key on the live DEV dashboard and it works (2026-11-23).**
  - **What changed for the dashboard's Paño** (also listed in Dashboard-DEV's README). Gained: Change the background and the colorblind modes; he does not tuck away while the pointer rests on him. Different, from sharing one body: on a phone he sits at the right of his bubble with the close button on the left; a short goodbye closes after 2.6s, not 4; the step label is plain, not small capitals; a dragged head returns to the top middle after a reload; with no brain he stays hidden (the old one used the last copy saved on the device); a tour does not re-place him when the window is resized. His waiting times stayed at 10s and 20s, set in the adapter.
  - **Tests.** New `tests/dash.py` (197 checks, all true, at phone, fold and desktop sizes) and `tests/run_dash.sh`. It covers his files, head mode, dragging, background and colorblind modes, all three tours and their page-dependent steps, talks, stories, the chat (wrong keys, a rejected key, a saved key, exactly what is sent to Claude, a refusal, errors), each adapter entry taken out in turn, and the four dashboard tours written but not offered. `devdash.py` still passes. For the portfolio, the full suite was run against the phase 3 files and the phase 4 files, side by side: outputs were identical for head (3 sizes), clean (3 sizes), bin, cases, sweep, lifted, brain, skills and tours (desk, fold, phone). Differences: two `idle.py` timings by 0.2 to 0.3s, two `wall.py` mid-wipe readings, and the `wins.py` menu flicker (re-runs showed both answers on old and new alike; `tests/README.md` now says so). A separate check compared every computed style on every Paño element in six poses at three sizes, old files against new: 981,252 values, none different.
  - **Checked live:** after both pushes the live files matched the pushed ones, and both DEV sites were driven in a browser at phone, fold and desktop sizes with no page errors. https://marquisphill.github.io/Portfolio-DEV/ fetched the same Paño files as before plus `core.json`, had its four skills on, greeted with the same menu, ran the Contact tour's two steps, and changed the background to All green. https://marquisphill.github.io/Dashboard-DEV/ fetched his engine, seven skill files and three brain files from `/Pano/latest/`, had tours, background, talks, topics and chat on, greeted with his menu, started the weather tour, changed to Sunrise with the green-weak colorblind mode, listed his talks and stories, took a key-shaped stand-in and showed a faked Claude reply with its button, forgot the key again, and tucked away to a head when left alone. Launch was off and nothing went to GitHub.
  - **Not checked:** The five-step weather tour on the live site: the cloud session cannot reach the weather service, so the card never loaded there; that version was tested on the local copy with a stand-in card. The labs tour, the launch tour, the talks all the way through and the rejected-key cases were tested on the local copy of the same files, not clicked through on the live address.
  - **Noticed on the live dashboard:** the tab also holds the portfolio's `catGreeted`. It is set by the staging portfolio inside the Staging site preview card, which is its own Paño greeting in there. The real dashboard does the same today. The DEV dashboard's own names all start with `dev-`.
  - **Found along the way, for later phases:**
    - Phase 5 must write the real dashboard's adapter with the real names (`pd-pano-key`, `pd-gh-token`, `pd-pano-mem`, `pd-pano-seen`, and no `dev-`), take Launch off "off", and decide the per-tab names. Dashboard-DEV's adapter is the model. The real dashboard's visitors have a saved brain copy under `pd-pano-brain` that can be removed, as DEV does for its own.
    - Staging's adapter can stay as Portfolio-DEV's. The taskbar numbers (44, 52) are still the engine's defaults; they could move into the portfolio adapter as `layout` when staging's is written.
    - A push here reaches a DEV site file by file as GitHub's 10-minute cache runs out, so for a few minutes a site can have a new brain with an old engine. `v1/` folders in phase 5 end that for the real sites: never edit a numbered folder after release.
    - The portfolio still carries its own colorblind filters and reveal layers in its page. They could be deleted there now that the skill brings them; left alone to keep the portfolio untouched.
    - `core.json` is 41 KB, mostly stories the portfolio does not use. If that matters, the shared lines could move to a small file of their own.
    - The four dashboard tours not offered yet (quick tour, clock, prototypes, staging preview) all run. Offering them is a one-line JSON edit and Phill's call.
    - The six portfolio questions from phase 2 are unchanged (tours in `show_later`, unused greetings).
  - **Next: Phase 5** (copy `latest/` to `v1/`; point staging at `v1/` for Phill's review; with his go-ahead, promote the portfolio and switch the real dashboard). It touches staging, so it needs Phill's say-so in that chat.
- **2026-11-23. Phase 5, first half done: `v1/` released, and staging runs it.** Production and the real dashboard are untouched.
  - **`v1/`** is a copy of `latest/` with two edits: `Pano.version` says `'v1'`, and the two example paths at the top of `pano.js` say `/Pano/v1/`. Never edit `v1/` again; a change goes in `latest/` and is released as `v2/`.
  - **Staging** (`Professional-Portfolio2-STAGING`, commit `05231d3`): `index.html` is now Portfolio-DEV's page with three differences put back to staging's own: it loads `/Pano/v1/`, not `/Pano/latest/`; the background is saved as `pf-wall` and `pf-cb` (the names staging already used, so visitors keep their choice), not `dev-`; and there is no `noindex`. `hackathon.html`, `labs.html` and everything else are unchanged. Its `pano-brain/` folder stays, because the real dashboard still reads it from staging (phase 6 removes it once the dashboard is on `v1/`). Its README says where Paño now lives and how to run the site locally with him.
  - **Tests.** `run_all.sh` and `run_dash.sh` take the version as a third argument (`tests/run_all.sh out 8773 v1`). New `tests/same.py` compares two copies of a site in nine poses at three sizes: every computed style on Paño plus the desktop and body, his bubble, a whole-page screenshot pixel by pixel, and the saved settings. `skills.py` now sets both `dev-pf-wall` and `pf-wall` for its saved-background check (it only set DEV's name, so it failed on staging; the site was fine).
  - **Old against new.** Staging as it was (its own in-page Paño) and staging on `v1/` were served side by side and run through the full suite. Outputs were identical for head (3 sizes), wins, clean (phone, desk; fold has its known timeout on both), bin, wall, cases, sweep and tours (desk, fold, phone). Differences: four `idle.py` timings by 0.2 to 0.3s. `lifted`, `brain` and `skills` fail on the old page by design (it does not load from this repo) and pass on the new one (`skills` 29 of 29 after the fix above). `same.py`: 108 of 108 checks the same: styles (26,000 to 30,000 values per pose), bubble, screenshot and saved settings, in every pose and size, including the colorblind change mid-way and Phill's note.
  - **Checked live,** after waiting for each push to be served (the `v1/` files and staging's page matched the pushed files byte for byte; `v1/` was confirmed live before staging was pushed, so staging never pointed at missing files). https://marquisphill.github.io/Professional-Portfolio2-STAGING/ was driven at phone, fold and desktop sizes: it fetched only `/Pano/v1/` (engine, styles, four skills, `portfolio.json` and `core.json`), nothing from `latest/`; tours, background, windows and bin on, talks, topics and chat off; same greeting and menu; the Contact tour ran both steps ("Tap" on the phone); All black with Blue-yellow saved as `pf-wall` and `pf-cb` and kept after a reload; four windows brought the clean-up offer; head mode came back after a reload; no page errors.
  - **Not checked live:** dragging him onto the Recycle Bin and eating windows (covered by `bin.py` and `wins.py` on the local copy, identical old and new).
  - **For Phill to review on staging** before the second half: that Paño looks and acts as before on his phone, foldable and desktop, and that a background he had chosen on staging is still there.
  - **Next: Phase 5, second half,** only when Phill says go in that chat and approves attaching `Professional-Portfolio2` and `Personal-Dashboard`: promote staging to production (one normal commit, without `.claude`), then write the real dashboard's adapter from Dashboard-DEV's with the real storage names (see the phase 4 notes), pointed at `/Pano/v1/`, Launch on, and test it with `tests/run_dash.sh out 8773 v1`.
- **2026-11-23. Phase 5 done. Both live sites run the same Paño from `v1/`.** Phill said go in this chat and approved attaching `Professional-Portfolio2` and `Personal-Dashboard`.
  - **Production portfolio** (`Professional-Portfolio2`, commit `f1135b6`, "Promote staging to production"): production was identical to staging before phase 5 (without `.claude`), so the promotion carried only `index.html` (Paño from `/Pano/v1/`) and the README note. After the commit its files are identical to staging's at `05231d3`, without `.claude`. No force-push.
  - **Real dashboard** (`Personal-Dashboard`, commit `a8a7203`): `index.html` is Dashboard-DEV's page with every DEV change from phase 0 reversed. It loads `/Pano/v1/`. Its saved names are the real ones (`pd-gh-token`, `pd-pano-key`, `pd-pano-mem`, `pd-pano-seen`, `pd-proto-requests-v2`, `pd-clock-24h`, `pd-preview`, `wx-last`, and the new `pd-wall`, `pd-cb`). Launch is on (`LAUNCH_OFF` and the disabled button are gone), and the `noindex` line is gone. Nothing else differs from Dashboard-DEV. The `.github` launcher workflow is untouched. It runs only when Launch is pressed, so the push started nothing. The README now says where Paño lives, how his brain is released, and about Change the background.
  - **Decision: the dashboard's per-tab names are `pd-pano-greeted` and `pd-pano-head`.** Before, the real dashboard used `panoGreeted` and `panoHead`, and `panoHead` was shared with the portfolio. A visitor mid-visit when this went out may see one extra hello. The old saved brain copy `pd-pano-brain` is removed by the page, as DEV does.
  - **Tests.** `dash.py` now runs against either dashboard. It tells them apart by the page (Launch off and `dev-` names mean DEV). On the real one it checks the real names, and "Launch it for me" sends one launch to a stand-in for GitHub inside the test; nothing reached GitHub. Against Dashboard-DEV it passes all 205 checks, as before. Against the real dashboard on `v1/` it passes all 205, with no page errors, at phone, fold and desktop sizes. On the way, one clause in `chat 6` turned out to be DEV-only ("the real key name stays empty"). It now checks the other copy's name. `devdash.py` reports False on the real dashboard by design, since it checks DEV's guards. New `tests/carry.py`: the same saved data (key-shaped Console key, fake token, a sent launch, a watched tour, a heard talk, 24-hour clock, preview setting) was planted in the old real dashboard and the new one. Both recognised all of it the same way, at three sizes, with no errors. The only menu difference is the new "Change the background" button.
  - **Checked live,** after each push was served byte for byte. https://marquisphill.github.io/Professional-Portfolio2/ was driven at phone, fold and desktop sizes with the same checks as staging, and all passed with no page errors. https://marquisphill.github.io/Personal-Dashboard/ was driven at the same three sizes. It fetched his engine, skills and brain only from `/Pano/v1/`, nothing from `latest/` or the old `pano-brain/`. Tours, background, talks, topics and chat were on; windows and bin were off. He greeted by time of day with his menu. Launch was on and there was no `noindex`. The weather tour started. Sunrise with green-weak was saved as `pd-wall` and `pd-cb`. The five talks and the stories were listed. "Give Paño a brain" showed the key box. He tucked away to a head after about 10s of quiet and stayed a head after a reload. Requests to Claude and GitHub were blocked by the check itself, and none were attempted. The page also fetches `portfolio.json` and `catGreeted` appears in its tab: both come from the staging site inside the preview card, which now runs `v1/` too.
  - **Not checked live:** a real Claude reply on the real dashboard (no real key is used by tests; Phill confirmed the same chat code with his key on DEV), a real Launch (it would start a real build), and the full five-step weather tour (the cloud session cannot reach the weather service; covered by `dash.py` with a stand-in card).
  - **For Phill:** open the real dashboard once on the phone and confirm Paño still shows "Paño’s brain" (your saved key) and that a question gets a Claude reply.
  - **Next: Phase 6** (Phill deletes `Portfolio-DEV`; remove `pano-brain/` and leftover Paño files from the portfolio repos, now that nothing reads them (the real dashboard no longer loads the staging brain); write `ADDING-A-SKILL.md`; update each README). Open from earlier: the six portfolio tours in `show_later`, the four dashboard tours not offered, and whether `core.json` (41 KB) should be split for the portfolio. `Dashboard-DEV` is not in the phase 6 list; decide whether it stays as the dashboard's place to try `latest/`.
- **2026-11-26. `v2/` released: his portfolio brain follows the portfolio's new layout.** Staging and production load `v2/`. The real dashboard stays on `v1/`.
  - **Why.** The portfolio changed the same day (staging `a23abd9`, then production): one résumé shown as a readable preview with Download and "Feed to Phill's cat" (in place of five versions), the hackathon moved from Projects to AI Lab with "See the photos" as a button inside it, and Projects and AI Lab were trimmed. Three things in `portfolio.json` no longer matched the page.
  - **What changed, in `latest/brain/portfolio.json` only.** The résumé tour's second step now says "Here it is. Scroll to read it. <b>Download</b> saves a copy, or you can feed it to me." (it still points at `#layer .rlist`, which the page keeps on the preview). The story `resume-versions` (id kept, so follow-ups still find it) is now "The résumé": one résumé, read it on the desktop, download it, or feed it to him. The tour `hackathon-photos` (still in `show_later`, so not offered) now goes AI Lab → Hackathon app → See the photos → the photo viewer.
  - **`v2/`** is a copy of `latest/` with the same two edits `v1/` had: `Pano.version` says `'v2'`, and the two example paths at the top of `pano.js` say `/Pano/v2/`. Apart from those and `brain/portfolio.json`, `v2/` is identical to `v1/`.
  - **Feeding the résumé to him** lives in the portfolio page, not in a skill. It uses his body (`#gcat`, `.gbody`, `.gmouth`, the `chomp` mood), `pano.busy()` and `pano.rest(line)`, and copies the moves of `eatWindows()` in `skills/windows.js`. If his markup or the chomp mood changes in a later version, check the page's `feedToCat()` too. Moving it into `windows.js` as an "eat this window" ability is an option for a later release.
  - **Note for DEV.** `Portfolio-DEV` loads `latest/`, so it gets the new lines now, while its page still has the five-version résumé picker and the hackathon in Projects.
