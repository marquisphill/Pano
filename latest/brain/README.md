# Paño's brain: knowledge

Everything Paño, the red cat guide, knows and says. One shared core, plus a profile for each site he lives on.

**This folder is his brain's home since phase 2 (2026-11-23).** It was copied from `pano-brain/` in the portfolio repos. Those older copies are still there, and the real dashboard still reads the staging one, until phases 5 and 6 switch everything over. Edit this copy, not those.

## What is live today

Both DEV sites read this folder. Each names its own file (`portfolio.json` or `dashboard.json`). That file says `"extends": "core.json"`, so the shared file is loaded with it. On the portfolio the engine (`../pano.js`) uses three parts:

| Part | What it is |
| --- | --- |
| `lines` | Every line he says outside the tours: his name, hello, menu buttons, the background and colorblind questions, the window clean-up, the Recycle Bin complaint, and the touch-screen wording. |
| `tours` | The guided tours, step by step. |
| `menu.show` | Which tours his menu offers, in order. `menu.show_later` holds tours that are written and tested but not offered yet; move an id into `show` to offer it. A brain with no `menu.show` offers all its tours, in the order written. |

To change something he says, edit the JSON and push. No code changes. `tests/brain.py` proves it.

**Shared lines.** `core.json` has its own `lines`: the ones both sites say (the background and colorblind questions, the tick for things already seen). The two are merged key by key, and the site's own file wins where both have a key.

**Base lines (since the kit's K1, 2026-11-26).** `../base.json` has neutral wording for every line the engine and the four everyday skills say. `core.json` says `"extends": "base"`, so the chain is `portfolio.json` (or `dashboard.json`) → `core.json` → `base.json`, merged key by key, the nearer file winning. A line none of Phill's files has falls back to base; every line they do have wins, so nothing he says changed. Any brain can extend base directly: that is how a site using the kit starts (`PANO-KIT-PLAN.md`). `"base"` (or `"base.json"`) always means the base file beside `pano.js`; any other `extends` is an address relative to the file that names it. Only `lines` are passed down a chain; `tours`, `menu` and the rest are each file's own.

On the dashboard he also uses: `talks` (his scripted lessons and little chats), `talk_topics` from `core.json`, `dashboard.json` and `portfolio.json` (his stories; `"topics_from": ["portfolio.json"]` is what brings the portfolio's in), `claude_chat` (everything about the Claude chat), `facts`, `cat_preference`, `sign_offs`, `fallbacks` and `show_fallback`. `tests/dash.py` checks that none of his dashboard lines are left in code.

On the portfolio, the greetings, nudges, sign-offs, fallbacks and talk topics are still unused: they are for the talking skills, which the portfolio does not have.

| File | Loaded by | What's in it |
| --- | --- | --- |
| `../base.json` | every page (both sites, through `core.json`) | Neutral wording for every line the engine and the four everyday skills use. No facts, no tours. |
| `core.json` | both sites | Persona, guardrails, facts (Phill's background, contact, Corner and Panela), 41 shared talk topics, the lines both sites share |
| `portfolio.json` | portfolio | Recruiter audience, his live lines, greetings, 6 portfolio-only topics, 11 tours (5 offered), menu. Scripts only, no Claude chat |
| `dashboard.json` | dashboard | "The user" audience, his live lines, dashboard facts, 13 dashboard topics, 7 tours (3 offered), 10 talks, menu, cat preference, the Claude chat settings |

The engine loads the site's file, then `core.json`, then `base.json`. Topics from both are merged by `id`, and ids never collide. The site's values (lines, greetings, fallbacks, menu) win over core where both exist.

A page names its brain in its adapter: `Pano.init({ brain: 'portfolio', ... })` loads `brain/portfolio.json` from beside `pano.js`, so the DEV portfolio gets `https://marquisphill.github.io/Pano/latest/brain/portfolio.json`. Paño stays hidden until his brain has arrived. If either file cannot be fetched he does not appear and the rest of the page works as normal.

The DEV dashboard uses this copy since phase 4. (It still reads `labs.json` from the staging portfolio; that is the dashboard's own list, not part of his brain.) The real dashboard still fetches the staging portfolio's `pano-brain/` folder until phase 5.

## Who Paño is talking to

- **Portfolio:** hiring managers and recruiters. He sells Phill's work, quickly and honestly.
- **Dashboard:** "the user", whoever holds the phone. Usually Phill, sometimes family. Paño says "you", never guesses a name, and talks about Phill in the third person. He's the expert on how the dashboard works and he loves talking about Corner and Panela (`cat_preference`).

Both sites know Phill's full professional background. Neither knows anything personal. That's a guardrail in `core.json`.

## Corner and Panela

`core.json → facts.cats` holds the only facts Paño has about them, and `known_limits` says so. The topic `cat-knowledge-limits` is Paño admitting it.

On the dashboard, when the scripts run out:
- **With a Claude Console key saved on the device**, a typed question he cannot place goes to Claude. What Claude is told is `dashboard.json → claude_chat.system`, then the places a reply may point to (`claude_chat.go`), then `claude_chat.system_knowledge` and a KNOWLEDGE block the chat skill builds from `core.json → facts`, `dashboard.json → facts`, the guardrails and every story. Claude may chat about cats in general and say when it's guessing. It never states a new fact about Corner or Panela as true.
- **Without a key**, Paño says he doesn't know that one (`fallbacks.unknown`) and offers his stories.

`claude_chat` also holds the model, the effort, the reply length and `quick_replies`: the things he answers himself without asking Claude. Each has `match` (a pattern, tried in order, upper or lower case), `reply` (a line, or a list to pick from) and `go` (where the button under the reply leads).

The portfolio has `claude_chat.enabled: false`, so scripts only. Phill confirmed this on 2026-11-23: the portfolio's Paño stays scripted.

## A talk topic

```json
{
  "id": "case-reports",
  "category": "case-studies",
  "title": "1,000+ reports down to about 20",
  "triggers": ["reports", "1000 reports", "data models"],
  "script": ["bubble 1", "bubble 2", "bubble 3"],
  "follow_ups": ["checking-ai-work", "how-he-uses-ai"],
  "show": { "portfolio": "tour:projects" },
  "source": "index.html DOCS.reports"
}
```

- `triggers`: phrases a visitor might type or say. Use them for matching, or as hints for an LLM.
- `script`: one string per speech bubble, shown in order. Only `<b>` tags are allowed.
- `follow_ups`: topic ids to offer as buttons afterward. All of them exist on both sites.
- `show`: keyed by site (core topics). In profile topics it's either a plain string or keyed by site.
  - `tour:<id>` runs a tour from the current profile.
  - On the portfolio, any `openTarget` key: `doc:reports`, `folder:ailab`, `app:resume`, `pdf:process`, `photo:0`, `mail:open`.
  - On the dashboard, `preview:home` loads the staging site in the Staging site card.
  - If the current site has no entry, follow the profile's `show_fallback`. On the dashboard, that pulls up the portfolio in the preview card.
- `status: "draft"`: skip it. There are none right now.

## A tour

Each step has `say`, `target` (what he points at), `done` (what counts as the visitor doing it), `act` (what the "Do it for me" button does) and `next` (a button that moves on). They are plain descriptors. The engine reads `css`, `css_visible`, `when_visible`, `click`, `focus` and `submit` itself. The rest are about one site's page, so that page's adapter supplies them as `tours` (see `../skills/README.md`). A tour is offered only on a page that can read every one of its steps.

A step can also depend on the page as it is right now. The dashboard's tours use these:

| In the JSON | What it does |
| --- | --- |
| `"when": "no_token"` / `"unless": "weather_loaded"` | The step is left out unless the page says so. The page answers by name. |
| `{place}`, `{feature\|your feature}` in `say` | A gap the page fills from what is on screen. After the bar is what to say if there is nothing. |
| `"need": { "filled": "#lpIdea" }`, `"need_say"` | Next waits until that box has something in it, and says `need_say` if it does not. |
| `"skip": "Skip"` | A second button that moves on. |
| `"id"`, `"jump": { "when": "launched", "to": "track" }` | Skip ahead to the step with that id once something is true. |
| on the tour: `"wait_for": "labs_loaded"` | Wait for the page before starting. |
| on the tour: `"name"` | The short name in the step label and the wrap-up. `label` is the menu button. |
| on the tour: `"then": "talk:feedback"` | Something to offer when it ends. |
| on the tour: `"pages": ["../contact.html"]` | Offer it only on these pages (since the kit's K3). Each is a page address relative to the brain file, like `extends`; `/` and `/index.html` are the same page, `.html` may be left off, and the query and hash are ignored. Left out, every page. On other pages it stays out of his menu, and `Pano.check()` leaves its targets alone but checks each address is there. Phill's tours don't use it: each of his sites is one page with its own brain. |

| Descriptor | Portfolio helper | Dashboard |
| --- | --- | --- |
| `target.icon: "folder:projects"` | `iconFor_('folder:projects')` | n/a |
| `target.file: "Name", in: "projects"` | `explorerAt('projects') && fileNamed('Name')` | n/a |
| `target.css: "#clock"` | `$('#clock')` (+ `when_window` → `winOpen()` first; `when_visible` → that element must be showing first) | `$('#clkTime')` etc. |
| `target.top_page: true` | `topPage()` | n/a |
| `target.window_el: "mail"` | `WINS.get('mail').el` | n/a |
| `done.window` / `done.any_window` | `winOpen(id)` | n/a |
| `done.explorer: "projects"` | `explorerAt('projects')` | n/a |
| `done.css_visible: "#cal"` | element exists and isn't `hidden` | same |
| `act.open: "app:resume"` | `openTarget('app:resume', el)` | n/a |
| `act.click: "#wxRefresh"` | `$(sel).click()` | same |
| `act.focus: "#pvPage"` | n/a | `$(sel).focus()` |
| `act.skill_card: 0` | opens that card in the Skills window | n/a |
| `actLabel` | button text for the act shortcut, in place of "Do it for me" | same |

Portfolio tours:
- Offered in his menu (`menu.show`): résumé, history, projects, skills, contact.
- Written, not offered yet (`menu.show_later`): availability, announcement, hackathon photos, kind words, AI Lab, Recycle Bin. `tests/brain.py` walks each one.

Dashboard tours:
- Offered in his menu (`menu.show`): launch, labs, weather. These are the three the dashboard always had; in phase 4 their steps moved out of the dashboard's code and into `dashboard.json`, word for word.
- Written, not offered yet (`menu.show_later`): quick tour, clock, prototypes, staging preview. `tests/dash.py` walks each one.

## A talk (dashboard)

`dashboard.json → talks` holds his scripted conversations. `order` lists the lessons, `small` the short chats he may start himself, and `scripts` has each one as a list of `nodes`. A node is one bubble:

```json
{ "say": "Which feature name works better?", "abc": true, "opts": [
    { "label": "“Make my site better”", "reply": "Close! But Claude can’t guess what “better” means to you." },
    { "label": "“Interactive skills radar chart”", "reply": "Exactly! Claude knows what to build.", "good": true } ] }
```

- `opts`: answers to tap. `reply` opens the next bubble, `good` makes him cheer, `set` is remembered on that device.
- `next`: one button that moves on. `end`: the last bubble; a list of extra buttons, each `{ label, go }` (`"go": "talk:builder"`, `"tour:launch"`).
- `say_prompt`: the bubble where the prompt builder shows what it wrote, from the pieces under `talks.builder`.

## His lines

`portfolio.json → lines` is grouped by where he says them: `menu`, `tour`, `background`, `cleanup`, `bin`, plus `name`, `hello`, `labels` (for screen readers) and `touch`. `../base.json` has every one of these, so it is the full list. `dashboard.json → lines` has the same groups (without `cleanup` and `bin`) plus `talks`, `topics` and `chat`. Where a line is a list, he picks one at random. Keep the key names; change the words. In `tour.step`, `{n}` and `{total}` are filled in for you. `touch.swaps` lists the wording he swaps on touch screens ("Click" becomes "Tap"). Under `background`, the keys in `options` and `modes` are the page's own names for the backgrounds and colorblind modes; only the words after them are his. A background with no words in `options` is shown by its name. `background.note` (called `phill_note` until the kit's K1) is the extra line after a colorblind mode is applied; Phill's is in `core.json`, and a brain without one just says `background.done`. `{cat_name}` in any line or tour step is replaced with `lines.name`.

## Rules for editing

- Phill's work: the portfolio homepage (`index.html`) is the source of truth. Older PDFs and pages are out of date.
- These files are public, served by GitHub Pages. Never add addresses, phone numbers, family details, tokens, or anything from legal or personal documents.
- Keep `id`s stable and unique across `core.json` and both profiles.
- A line that the engine asks for must stay in `lines`. `tests/brain.py` checks none is missing.
- Validate after editing: `for f in latest/brain/*.json; do python3 -m json.tool "$f" > /dev/null || echo "bad: $f"; done`
- Then open the site and run `Pano.check()` in the browser console. It lists problems (a missing, blank or misspelt line; a tour left out of his menu, with the step and the reason; something a tour points at that is not on the page) and notes (a target hidden right now; a field nothing reads). On the DEV sites today it finds no problems, only notes: Phill's unused `greetings`, `returning_greetings` and `idle_nudges`, fields only the talking skills read, and tour steps whose targets only appear part-way through a tour (once a window opens, a panel shows or the weather loads).
