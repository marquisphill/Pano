# Paño

Paño is the red cartoon cat who guides visitors around Phill's portfolio and personal dashboard. This repo is becoming his single home: his body, his brain and his skills, loaded by both sites.

- **The plan and current status:** [PANO-PLAN.md](PANO-PLAN.md)
- **Tests:** [tests/](tests/)

- **His body and engine:** [latest/pano.js](latest/pano.js) and [latest/pano.css](latest/pano.css). The top of `pano.js` explains how a page loads him.

- **His skills:** [latest/skills/](latest/skills/). One file per ability: guided tours, changing the background, tidying windows, the Recycle Bin, scripted talks, his stories, and the Claude chat. Each says what it needs from the page, and he offers it only where the page has it. [latest/skills/README.md](latest/skills/README.md) explains how, and how to add one.

- **His brain:** [latest/brain/](latest/brain/). What he says, his tours and his menu, as JSON. To change a line, edit `latest/brain/portfolio.json` or `latest/brain/dashboard.json`; no code changes. Lines both sites share are in `latest/brain/core.json`. [latest/brain/README.md](latest/brain/README.md) explains the files.

**Versions.** `latest/` is where work happens; the two DEV sites ([Portfolio-DEV](https://marquisphill.github.io/Portfolio-DEV/) and [Dashboard-DEV](https://marquisphill.github.io/Dashboard-DEV/)) load it, so a push there reaches them. Numbered folders are releases: [v1/](v1/) is a copy of `latest/` made on 2026-11-23, and [staging](https://marquisphill.github.io/Professional-Portfolio2-STAGING/), [production](https://marquisphill.github.io/Professional-Portfolio2/) and the [dashboard](https://marquisphill.github.io/Personal-Dashboard/) load it. **Never edit a numbered folder after release.** To release a change, copy `latest/` to the next number (`v2/`) and point a site at it. Staging, production and the real dashboard all load `v1/` (since 2026-11-23). The build happens in phases, described in the plan.

No key or token is kept in this repo. The Claude chat uses a Console key the visitor pastes in; it stays in their browser.
