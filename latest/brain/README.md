# Paño's brain: knowledge

Everything Paño, the red cat guide, knows and says. One shared core, plus a profile for each site he lives on.

**This folder is his brain's home since phase 2 (2026-11-23).** It was copied from `pano-brain/` in the portfolio repos. Those older copies are still there, and the dashboard still reads the staging one, until phases 4 to 6 switch everything over. Edit this copy, not those.

## What is live today

Only the DEV portfolio reads this folder so far, and it reads one file: `portfolio.json`. From that file the engine (`../pano.js`) uses three parts:

| Part | What it is |
| --- | --- |
| `lines` | Every line he says outside the tours: his name, hello, menu buttons, the background and colorblind questions, the window clean-up, the Recycle Bin complaint, and the touch-screen wording. |
| `tours` | The guided tours, step by step. |
| `menu.show` | Which tours his menu offers, in order. `menu.show_later` holds tours that are written and tested but not offered yet; move an id into `show` to offer it. |

To change something he says, edit the JSON and push. No code changes. `tests/brain.py` proves it.

Everything else in these files (`core.json`, `dashboard.json`, and the greetings, nudges, sign-offs, fallbacks and talk topics in `portfolio.json`) is written for abilities he does not have on the portfolio yet. Nothing reads it from here today.

| File | Loaded by | What's in it |
| --- | --- | --- |
| `core.json` | both sites | Persona, guardrails, facts (Phill's background, contact, Corner and Panela), 41 shared talk topics |
| `portfolio.json` | portfolio | Recruiter audience, his live lines, greetings, 6 portfolio-only topics, 11 tours (5 offered), menu. Scripts only, no Claude chat |
| `dashboard.json` | Personal-Dashboard | "The user" audience, dashboard facts, 13 dashboard topics, 6 tours, menu, cat preference, Claude chat mode |

Load `core.json`, then the site's profile. Topics from both are merged by `id`, and ids never collide. Profile values (greetings, fallbacks, menu) win over core where both exist.

A page names its brain in its adapter: `Pano.init({ brain: 'portfolio', ... })` loads `brain/portfolio.json` from beside `pano.js`, so the DEV portfolio gets `https://marquisphill.github.io/Pano/latest/brain/portfolio.json`. Paño stays hidden until the file arrives. If it cannot be fetched he does not appear and the rest of the page works as normal.

The dashboard does not use this copy yet. It still fetches `core.json` and `dashboard.json` from the staging portfolio's `pano-brain/` folder, and `labs.json` from the same place.

## Who Paño is talking to

- **Portfolio:** hiring managers and recruiters. He sells Phill's work, quickly and honestly.
- **Dashboard:** "the user", whoever holds the phone. Usually Phill, sometimes family. Paño says "you", never guesses a name, and talks about Phill in the third person. He's the expert on how the dashboard works and he loves talking about Corner and Panela (`cat_preference`).

Both sites know Phill's full professional background. Neither knows anything personal. That's a guardrail in `core.json`.

## Corner and Panela

`core.json → facts.cats` holds the only facts Paño has about them, and `known_limits` says so. The topic `cat-knowledge-limits` is Paño admitting it.

On the dashboard, when the scripts run out:
- **With a Claude token on the device**, Paño keeps chatting through Claude using `dashboard.json → claude_chat.system_prompt`. The brain fills `{{core.facts}}` and `{{dashboard.facts}}` with those JSON blocks. Claude may chat about cats in general and say when it's guessing. It never states a new fact about Corner or Panela as true.
- **Without a token**, Paño says that's all he knows for sure (`claude_chat.when_scripts_run_out.without_token`).

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

Each step has `say`, `target` (what he points at), `done` (what counts as the visitor doing it), `act` (what the "Do it for me" button does) and `next` (a button that moves on). They are plain descriptors. The engine reads `css`, `css_visible`, `when_visible`, `click` and `focus` itself. The rest are about one site's page, so that page's adapter supplies them as `tours` (see `../skills/README.md`). A tour is offered only on a page that can read every one of its steps.

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

Dashboard tours (in `dashboard.json`, not read from here yet): `existing: true` marks launch, which already runs in the dashboard's code as `launchSteps()`. It's listed by summary, not steps, because its steps depend on whether a token is saved. The new ones are quick tour, clock, weather, prototypes and staging preview.

## His lines

`portfolio.json → lines` is grouped by where he says them: `menu`, `tour`, `background`, `cleanup`, `bin`, plus `name`, `hello`, `labels` (for screen readers) and `touch`. Keep the key names; change the words. In `tour.step`, `{n}` and `{total}` are filled in for you. `touch.swaps` lists the wording he swaps on touch screens ("Click" becomes "Tap"). Under `background`, the keys in `options` and `modes` are the page's own names for the backgrounds and colorblind modes; only the words after them are his.

## Rules for editing

- Phill's work: the portfolio homepage (`index.html`) is the source of truth. Older PDFs and pages are out of date.
- These files are public, served by GitHub Pages. Never add addresses, phone numbers, family details, tokens, or anything from legal or personal documents.
- Keep `id`s stable and unique across `core.json` and both profiles.
- A line that the engine asks for must stay in `lines`. `tests/brain.py` checks none is missing.
- Validate after editing: `for f in latest/brain/*.json; do python3 -m json.tool "$f" > /dev/null || echo "bad: $f"; done`
