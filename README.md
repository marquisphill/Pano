# Paño

Paño is the red cartoon cat who guides visitors around Phill's portfolio and personal dashboard. This repo is becoming his single home: his body, his brain and his skills, loaded by both sites.

- **The plan and current status:** [PANO-PLAN.md](PANO-PLAN.md)
- **Tests:** [tests/](tests/)

- **His body and engine:** [latest/pano.js](latest/pano.js) and [latest/pano.css](latest/pano.css). The top of `pano.js` explains how a page loads him.

- **His brain:** [latest/brain/](latest/brain/). What he says, his tours and his menu, as JSON. To change a line, edit `latest/brain/portfolio.json`; no code changes. [latest/brain/README.md](latest/brain/README.md) explains the files.

Only the DEV copy of the portfolio loads these files so far. Staging, production and the dashboard still carry their own copies. The build happens in phases, described in the plan.
