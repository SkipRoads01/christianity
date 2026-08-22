# Christianity: History, Theology, and Civilization

## Overview
A static website holding personal research and reading notes on Christian
history, theology, and civilization. Private repository, not published.

## Stack
Plain HTML and one stylesheet. No build step, no package manager, no
dependencies. Serve locally with `python3 -m http.server 8000`.

## Architecture
- `index.html` — home page, links to each section.
- `timeline.html` — the history walked forward in 14 steps. Sticky inline-SVG
  chart, one `.step` article per era, and the site's only JavaScript (inline, no
  dependencies).
- `denominations.html` — section one. Two inline-SVG timeline charts, entry
  lists for the families and the Protestant branches, a comparison table, and a
  dated list.
- `terminology.html` — section two. Twelve dispute entries, each with terms,
  pronunciation, body, figures, and resolution.
- `styles.css` — every rule for every page.
- `sources/` — the reference PDFs each section was built from.

Each page repeats the masthead and nav inline. There is no templating; when the
nav changes, update all four pages.

`timeline.html` animates by setting `stroke-dashoffset` on each line to the x
position of the current year. The year-to-x scale is written twice, in the SVG
coordinates and in the script — keep them in step. Content lives in the HTML,
not in the script, so it survives with JavaScript disabled.

## Conventions
- Colors are CSS custom properties on `:root`, overridden in a single
  `prefers-color-scheme: dark` block. Never hard-code a color in a rule.
- Prose sits in a 48rem reading column (`.wrap`). Charts and wide tables break
  out to 68rem with the `margin-left: 50%` / `transform` pattern.
- Reusable content blocks: `.entry` for a dated item, `.cards` for the home page,
  `.dates` for a dated list, `.table-scroll` for anything wider than the column.
- Do not write copy for this site. Every sentence a reader sees comes from the
  source documents in `sources/`, transcribed faithfully — no paraphrase, no
  adjusted figures, no added assertions. Anything that is not from a source is a
  plain functional label: a heading, a nav item, a field name, a count, a button.
  No taglines, no framing sentences, no summaries, no invented section titles.
- Honor `prefers-reduced-motion` in anything animated.
- Prose follows the Google developer documentation style guide: second person,
  active voice, present tense, sentence case headings.

## Current priorities
Set by the repository owner. Do not add sections or content unasked.
