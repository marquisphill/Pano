# Paño's skills

Each thing Paño can do beyond walking and talking is a skill: one file in this folder. His engine (`../pano.js`) loads them all. A skill says what it needs from the page, and he offers it only on pages that have it.

| Skill | File | Needs from the page (adapter entry) | Portfolio | Dashboard |
| --- | --- | --- | --- | --- |
| Guided tours | `tours.js` | Things to point at. `tours`: readers for steps about this page. Steps that only use `css`, `css_visible`, `when_visible`, `click`, `focus` and `submit` need no entry. | Yes | Yes |
| Change the background, colorblind modes | `background.js` | `background`: `{ desk, walls, modes, keys }` | Yes | Yes |
| Organize and close windows, the clean-up offer | `windows.js` | `windows`: the page's window system | Yes | No |
| Recycle Bin sulk | `bin.js` | `bin`: `{ icon() }` | Yes | No |
| Talks: scripted lessons, the prompt builder, little chats he starts | `talks.js` | `talks`: `{ fillPrompt(prompt) }` | No | Yes |
| Topics: his stories about Phill, the sites and the cats ("Ask about Phill") | `topics.js` | `topics`: `{ open(target) }` | No | Yes |
| Claude chat: the ask box, and a Console key the visitor pastes in | `chat.js` | `chat`: `{ keys: { key } }` | No. Phill decided on 2026-11-23 that the portfolio's Paño stays scripted. | Yes |

Head mode, dragging, idle timing and the tour runner need nothing from the page, so they are part of the engine, not skills.

The first four are loaded on every page. The last three are only fetched when the page's adapter has their entry, so the portfolio never downloads the chat code.

## How a page turns a skill on

The page's adapter is the object it passes to `Pano.init({...})`. A skill is on when every entry it needs is there. On the DEV portfolio:

```js
tours: tourHelpers,
background: { desk: $('#desktop'), walls: ['mountain', 'green', 'black'], modes: ['protan', 'deutan', 'tritan', 'mono'], keys: { wall: 'dev-pf-wall', cb: 'dev-pf-cb' } },
windows: { WINS, topWin, focusW, keepOnScreen, rectDelta, closeW, minimizeW },
bin: { icon: () => document.querySelector('.dicon[data-open="folder:recycle"]') }
```

Take a line out and he stops offering that skill. Nothing else changes and nothing breaks. `tests/skills.py` proves this for all four.

On the DEV dashboard:

```js
tours,
background: { desk: $('#wall'), walls: ['plain', 'sunrise', 'ocean'], modes: ['protan', 'deutan', 'tritan', 'mono'], keys: { wall: 'dev-pd-wall', cb: 'dev-pd-cb' } },
talks: { fillPrompt },
topics: { open: openPortfolio },
chat: { keys: { key: 'dev-pd-pano-key' } }
```

`tests/dash.py` takes each of these out in turn.

Tours work a little differently, because a tour can be made of steps any page can read. The tours skill is always on, and it checks each tour: if this page cannot read every step of a tour, that tour is left out of his menu. On the portfolio every tour points at an icon or a window, so without the `tours` entry he offers none.

To see what is on, open the page's console and run `Pano.here.skills()`. It lists each skill, whether it is on, and if not, why.

## What a skill file looks like

```js
Pano.skill('bin', {
  needs: ['bin'],                 // adapter entries this skill cannot work without
  start(p, host) {                // runs once if they are all there. host is the adapter.
    // ... the skill's own code and state ...
    return { /* what it offers; see below */ };
  }
});
```

`p` is what the engine lends a skill: `p.say(html, buttons)`, `p.moveCat(spot)`, `p.rest(text)`, `p.L` (his lines from the brain), `p.cat` (his element), and so on. The full list is the `api` object near the end of `init()` in `pano.js`.

What `start()` may return. All are optional:

| Entry | What it is for |
| --- | --- |
| `menu()` | Buttons to add to his menu, as `[{ label, fn }]`. Called each time the menu opens. |
| `menuNote()` | A line to add under his menu text. |
| `brain(B)` | Called with his brain when it arrives. |
| `hello()` | His greeting, if this skill has a better one than the plain line. |
| `go(key)` | Somewhere a button or an answer can send the visitor: return `{ label, fn }` for keys this skill knows (`tour:launch`, `talk:builder`, `topic:meet-the-cats`), or nothing. Skills reach each other's places with `p.goFor(key)`. |
| `answer(text)` | A typed question this skill can answer itself: return a function that does, or nothing. |
| `afterTour(key)` | Return true to give a tour its own ending in place of "Done! What next?". |
| `saying()` | Called each time he speaks, before the bubble is placed. For showing or hiding what the skill keeps in the bubble. |
| `notice(what)` | Called when the page tells him something: `pano.notice('window-opened')`. |
| `ignoresTaps()` | True while he should not answer taps (mid-animation). |
| `ignoresDrag()` | True while he cannot be picked up. |
| `keepsHimHere()` | True while he should not tuck away to his head spot. |
| `dragMove()`, `drop()` | Called while he is dragged and when he is let go. `drop()` returns a function to take over from there, or nothing. |
| `calm()` | Called when he goes back to normal. Clear any mood the skill put him in. |

## Adding a skill

1. Write `skills/<name>.js` in the shape above.
2. Add its name near the top of `pano.js`: to `EARLY` if every page should load it, or to `LATE` if it should be fetched only where a page's adapter has an entry with the same name. The order there is the order in his menu.
3. Put his words in the brain under `lines`, not in the code. Add neutral wording for each new line to `../base.json` too, so every brain has it (every brain ends its `extends` chain in base).
4. Add the adapter entry to each site that should have it.
5. Add a test to `tests/skills.py` (portfolio) or `tests/dash.py` (dashboard).

His styles are still one file (`../pano.css`), including the moods the skills use (`chomp`, `wary`, `meh`, `lick`) and what the talking skills add to the bubble (the ask box, "thinking…", a quoted prompt).

## The Claude chat skill and the visitor's key

- The key is a Claude Console key the visitor pastes into his bubble. It is saved in that browser only, under the name the page's adapter gives (`chat.keys.key`). It is never in this repo or in any page.
- It is sent to `api.anthropic.com` and nowhere else: once to check it works, then with each question he cannot answer himself.
- He answers from his own script first: the quick replies in his brain (`claude_chat.quick_replies`), then any story the topics skill can match. Those never leave the page.
- What Claude is told (the prompt, the model, where a reply may send you) is in `brain/dashboard.json` under `claude_chat`.
- `tests/dash.py` tests all of it with a faked reply. No test uses a real key.

## How they load

While a page is still being read, `pano.js` writes the four everywhere skills in right after itself, so they are ready before the page starts him. That is why a saved background shows straight away with no flash. The other three are fetched when the page starts him, if its adapter asks for them, and he waits for them before appearing. If `pano.js` is added to a page that has already finished loading, all the skills are fetched that way. If a skill file cannot be fetched, he goes without that one skill.
