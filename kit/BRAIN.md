# Paño's brain: every field

A site's brain is one JSON file, `pano/brain.json`. It holds everything Paño says on that site and the tours he gives. This page lists every field. `brain.schema.json` (beside this file) is the same thing in machine form, and `example/pano/brain.json` is a complete brain for a made-up site.

```json
{
  "extends": "base",
  "lines": { "name": "Pip", "hello": "Hi, I’m {cat_name}, the studio cat! What would you like to see?" },
  "tours": {
    "visit": {
      "label": "When can I visit?",
      "steps": [
        { "say": "We’re open Thursday to Sunday.", "target": { "css": "#visit-hours" }, "next": "Got it" }
      ]
    }
  }
}
```

That is a whole, working brain. Everything he says that it does not write comes from `base.json`.

## The top level

| Field | Needed | What it is |
| --- | --- | --- |
| `extends` | yes | Always `"base"`. His neutral wording for every line sits under yours, so you only write the lines you want to change. (`"base"` means the `base.json` beside Paño's engine, whichever version the site loads. Another brain file's address also works, relative to this file, and that file can extend `"base"` in turn.) |
| `lines` | yes | What he says outside the tours. At least `name`. See [Lines](#lines). |
| `tours` | yes | His guided tours, by id. See [Tours](#tours). |
| `menu` | no | `show`: which tours his menu offers, in order. See [Menu](#menu). |
| `site` | no | A short name for the site. Nothing reads it; it is there for people. |
| `_anything` | no | Any key that starts with `_`, at any level, is a note for people. He ignores it. |

Any other field is a mistake (often a misspelling): `Pano.check()` notes it, and `brain.schema.json` turns it away.

## Lines

Only `lines` pass down from `base.json`: your `lines` are merged over base's, key by key, and yours win. So `"menu": { "ask": "What now?" }` changes that one line and keeps every other `menu` line from base.

Rules for every line:

- **`{cat_name}`** is replaced with his name (`lines.name`), in lines and in tour steps.
- **A list of lines** (`["That’s it!", "All done!"]`) means he picks one at random each time.
- **HTML:** lines are shown as HTML. Use `<b>` for bold and nothing fancier.
- **Touch screens:** `touch.swaps` changes words in tour lines on phones and tablets ("Click" becomes "Tap").
- Keep the keys exactly as they are. A key he does not say is a mistake, and `Pano.check()` names it.
- A line set to `""` is blank, and `Pano.check()` treats it as a problem (he would say nothing). The one exception is `background.note`, which is blank on purpose in base.

Every line, with base's wording:

| Line | Base wording | When he says it |
| --- | --- | --- |
| `name` | Paño | His name, shown above everything he says. |
| `hello` | Hi, I’m {cat_name}! I can show you around. What would you like to do? | When a visitor arrives (once per visit), above his menu. |
| `labels.cat_button` | Ask {cat_name} the cat for help | Read aloud by screen readers for the cat himself. |
| `labels.close` | Close {cat_name} | Screen readers, for the bubble's close button. |
| `menu.ask` | What would you like to do? | Above his menu when a visitor taps him. |
| `menu.after_tour` | Done! What would you like to do next? | Above his menu when a tour ends. |
| `menu.lost` | Hmm, I lost track of that. What would you like to do? | When a tour step's target can't be found on the page. |
| `menu.change_background` | Change the background | His menu button for the background changer. |
| `menu.leave_first` | Just looking around | The quiet button that closes his first menu. |
| `menu.leave_again` | I’m good, thanks | The same button, later on. |
| `menu.bye` | Okay! I’m right here if you need a hand. | As he steps back after a visitor closes the menu or stops a tour. |
| `menu.organize`, `menu.close_all` | Organize windows / Close all windows | Only on sites with a window system (not kit sites). |
| `menu.show_menu` | Show me the menu | Only with his talking skills (not kit sites). |
| `tour.step` | Step {n} of {total} | The small label above each tour step. `{n}`, `{total}` and `{name}` (the tour's `name`) are filled in. |
| `tour.do_it` | Do it for me | The button a step's `act` adds, unless the step has its own `actLabel`. |
| `tour.stop` | Stop the tour | The quiet button on every step. |
| `tour.seen_mark`, `tour.intro`, `tour.wrap`, `tour.watched`, `tour.next_up`, `tour.next_talk`, `tour.seen_all`, `tour.back_to_menu`, `tour.im_good`, `tour.im_good_bye` | (see `base.json`) | Only where the site gives him a memory between visits. Kit sites don't, so these are never said; leave them to base. |
| `touch.swaps` | Click → Tap, click → tap | A list of `{ "find": "Click", "say": "Tap", "whole_word": true }`, applied in order to tour lines on touch screens. For a site in another language, swap that language's words, or make it `[]`. |
| `background.ask` | Which background would you like? | When a visitor picks "Change the background". |
| `background.options` | (none) | His words for each background, by the names in the site's `setup.js` (`"sky": "Sky blue"`). A background with no words is shown by its name. |
| `background.default_mark` | " (default)" | Added after the first background's words. |
| `background.never_mind` | Never mind | The quiet button that closes the background question. |
| `background.ask_colorblind` | Are you colorblind? | After a background is chosen, if the site offers colorblind modes. |
| `background.yes`, `background.no` | Yes / No | The answers to that. |
| `background.ask_mode` | Which colorblind mode should I apply to the site? | After "Yes". |
| `background.modes` | Red-weak (protanopia), Green-weak (deuteranopia), Blue-yellow (tritanopia), No color (monochrome) | His words for each mode, by name: `protan`, `deutan`, `tritan`, `mono`. |
| `background.changing` | Okay, I am changing the background now for you. | While the new background sweeps in. |
| `background.done` | Done! Enjoy the new view. | When it is done. |
| `background.note` | (blank) | An extra line after a colorblind mode is applied. Blank means he skips it and just says `background.done`. |
| `background.thanks` | Thanks, {cat_name} | The button under `background.note`. |
| `cleanup.*` | (see `base.json`) | Only on sites with a window system (not kit sites). |
| `bin.refuse` | Excuse me. I am not recyclable. | Only on sites with a Recycle Bin (not kit sites). |

For a site in another language, write every line he says on a kit site (all of the above except the ones marked "not kit sites" and the memory lines), and set `touch.swaps` for that language.

## Tours

`tours` is a group of tours by id. The id is any short name (`"contact"`, `"book-a-class"`); visitors never see it. His menu shows them in the order written, unless `menu.show` says otherwise.

```json
"book": {
  "label": "How do I book a class?",
  "name": "Booking",
  "pages": ["../classes.html"],
  "steps": [ ... ]
}
```

| Field | Needed | What it is |
| --- | --- | --- |
| `label` | yes | His menu button for this tour. Word it the way a visitor would ask: "How do I book a class?" |
| `steps` | yes | The stops on the tour, in order. At least one. See [Steps](#steps). |
| `name` | no | A short name, used where `tour.step` says `{name}`. |
| `pages` | no | The pages this tour is offered on. Left out, every page that loads the brain. See [Tours on a site with several pages](#tours-on-a-site-with-several-pages). |

### Steps

At each step he walks over to something on the page, puts a ring around it, and says one thing. The visitor moves on with a button, or by doing what the step asks.

```json
{ "say": "Type your email here, then press <b>Send</b>.",
  "target": { "css": "#contact-email" },
  "act": { "focus": "#contact-email" }, "actLabel": "Take me there",
  "next": "Got it" }
```

| Field | Needed | What it is |
| --- | --- | --- |
| `say` | yes | What he says at this step. Short: one or two sentences. `<b>` for bold. On touch screens, `touch.swaps` turns "Click" into "Tap". |
| `target.css` | yes | What he points at: a CSS selector for one element. Prefer an id (`"#contact-form"`). It must be on the page when the step starts. On a page that scrolls, he scrolls it into view. |
| `target.when_visible` | no | A selector: he waits until that element is showing before he points. |
| `next` | one of `next` or `done` | A button that moves on: "Next", "Got it". |
| `done.css_visible` | one of `next` or `done` | A selector: the step moves on by itself once that element is showing (the visitor opened something, say). |
| `act` | no | Adds a button that does it for the visitor: `{ "click": "#menu-button" }`, `{ "focus": "#email" }` or `{ "submit": "#search-form" }`. One of the three. |
| `actLabel` | no | That button's words, in place of `tour.do_it`. |
| `skip` | no | A second button that moves on, for a step the visitor may not need. |
| `need.filled` | no | A selector for a text box: "next" waits until something is typed in it. |
| `need_say` | no | What he says if "next" is pressed before the box is filled. |

Good steps:

- **Point at something specific and visible**: a button, a form, a heading, a card. Not the whole page.
- **Three steps or fewer** for most tours. The last step is usually the thing itself: the form, the button, the price.
- **One page per tour.** A tour runs on the page it starts on. An `act` that clicks a link to another page ends the tour, so give that step a `next` as well, and make it the last step.
- **Ids are best.** If the element has no id, add one to the site's HTML (`id="booking-form"`). It changes nothing a visitor sees.

## Tours on a site with several pages

Every page loads the same brain. A tour whose targets are on one page should say so with `pages`, or it shows up in his menu on every page and fails on the others.

```json
"pages": ["../contact.html"]
```

- Each entry is a page address **relative to the brain file**, the same way `extends` is. With the brain at `pano/brain.json`, a page beside `index.html` is `"../contact.html"`, the home page is `"../index.html"` (or `"../"`), and a page in a folder is `"../blog/index.html"`.
- `/` and `/index.html` are the same page. `.html` may be left off (GitHub Pages serves `contact.html` at `/contact` too). The part after `?` or `#` is ignored.
- Left out, the tour is offered on every page. That suits a tour of something every page has: the menu bar, the footer.
- On other pages the tour is not in his menu, and `Pano.check()` leaves its targets alone (a note says it is for another page). It does check that each address in `pages` is there.

**A tour that crosses pages** is two tours with the same `label`. On the pages where the thing is not, the first tour points at the link to it and ends ("Click <b>Classes</b> up here, then ask me again there"). On the page where it is, the second tour shows it. The example site does this with `join-here` and `join`.

## Menu

```json
"menu": { "show": ["book", "visit", "contact"] }
```

| Field | What it is |
| --- | --- |
| `menu.show` | The tours his menu offers, in this order. Left out, every tour, in the order written. |
| `menu.show_later` | Tours that are written but not offered yet. |

His menu also has a button for each built-in extra the site turned on (the background changer), and a quiet button to close it.

## Checking a brain

- **`Pano.check()`**: open any page with Paño on it, open the browser console and type `Pano.check()`. It lists problems (✗: a missing, blank or misspelt line, a misspelt field, a tour step with no way to move on, a target that is not on the page, a page address that is not there) and notes (·: things that may be fine, like a tour for another page). Fix every problem.
- **`check_site.py`** (beside this file) runs `Pano.check()` on every page and walks every tour at phone and desktop sizes.
- **`brain.schema.json`** checks the file's shape without a browser, with any JSON Schema tool.

## What a kit brain can't do

Paño on Phill's own sites does more: window tidying, the Recycle Bin, scripted talks, stories, and a Claude chat. Those need code written for one site and are not part of the kit. A kit brain uses only the fields on this page.
