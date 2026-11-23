# Paño's skills

Each thing Paño can do beyond walking and talking is a skill: one file in this folder. His engine (`../pano.js`) loads them all. A skill says what it needs from the page, and he offers it only on pages that have it.

| Skill | File | Needs from the page (adapter entry) | Portfolio | Dashboard |
| --- | --- | --- | --- | --- |
| Guided tours | `tours.js` | Things to point at. `tours`: readers for steps about this page. Steps that only use `css`, `css_visible`, `when_visible`, `click` and `focus` need no entry. | Yes | Phase 4 |
| Change the background, colorblind modes | `background.js` | `background`: `{ desk, walls, modes, keys }` | Yes | Phase 4 |
| Organize and close windows, the clean-up offer | `windows.js` | `windows`: the page's window system | Yes | No |
| Recycle Bin sulk | `bin.js` | `bin`: `{ icon() }` | Yes | No |
| Claude chat | not written yet | A Console key the visitor pastes in | No. Phill decided on 2026-11-23 that the portfolio's Paño stays scripted. | Phase 4 |

Head mode, dragging, idle timing and the tour runner need nothing from the page, so they are part of the engine, not skills.

## How a page turns a skill on

The page's adapter is the object it passes to `Pano.init({...})`. A skill is on when every entry it needs is there. On the DEV portfolio:

```js
tours: tourHelpers,
background: { desk: $('#desktop'), walls: ['mountain', 'green', 'black'], modes: ['protan', 'deutan', 'tritan', 'mono'], keys: { wall: 'dev-pf-wall', cb: 'dev-pf-cb' } },
windows: { WINS, topWin, focusW, keepOnScreen, rectDelta, closeW, minimizeW },
bin: { icon: () => document.querySelector('.dicon[data-open="folder:recycle"]') }
```

Take a line out and he stops offering that skill. Nothing else changes and nothing breaks. `tests/skills.py` proves this for all four.

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
| `brain(B)` | Called with his brain when it arrives. |
| `notice(what)` | Called when the page tells him something: `pano.notice('window-opened')`. |
| `ignoresTaps()` | True while he should not answer taps (mid-animation). |
| `ignoresDrag()` | True while he cannot be picked up. |
| `keepsHimHere()` | True while he should not tuck away to his head spot. |
| `dragMove()`, `drop()` | Called while he is dragged and when he is let go. `drop()` returns a function to take over from there, or nothing. |
| `calm()` | Called when he goes back to normal. Clear any mood the skill put him in. |

## Adding a skill

1. Write `skills/<name>.js` in the shape above.
2. Add its name to the `SKILLS` list near the top of `pano.js`. The order there is the order in his menu.
3. Put his words in the brain under `lines`, not in the code.
4. Add the adapter entry to each site that should have it.
5. Add a test to `tests/skills.py`.

His styles are still one file (`../pano.css`), including the moods the skills use (`chomp`, `wary`, `meh`, `lick`).

## How they load

While a page is still being read, `pano.js` writes the skill files in right after itself, so they are ready before the page starts him. That is why a saved background shows straight away with no flash. If `pano.js` is added to a page that has already finished loading, the skills are fetched and he waits for them before appearing. If a skill file cannot be fetched, he goes without that one skill.
