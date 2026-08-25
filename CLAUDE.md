# Christianity: History, Theology, and Civilization

## Overview
A static website holding personal research and reading notes on Christian
history, theology, and civilization. Private repository, not published.

## Stack
Plain HTML and one stylesheet. No build step, no package manager, no
dependencies. Serve locally with `python3 -m http.server 8000`.

## Architecture
- `index.html` — home page, links to each section.
- `timeline.html` — the history walked forward in 20 steps. Sticky inline-SVG
  chart, one `.step` article per era, and the page's own inline script. No
  dependencies anywhere.
- `denominations.html` — section one. Two inline-SVG timeline charts, entry
  lists for the families and the Protestant branches, a comparison table, and a
  dated list.
- `terminology.html` — section two. Twelve dispute entries, each with terms,
  pronunciation, body, figures, and resolution.
- `reading.html` — the Research section: an editor, not a document. Books, each
  with publication fields that collapse to a heading once saved, and an ordered
  list of chapters holding notes. Notes are rich text, stored as HTML and run
  through a tag allowlist on every read and write, so an imported file cannot
  carry anything executable. Pasting inserts plain text. State lives in
  `localStorage` under `christianity.reading.v1` and syncs through the Worker's
  `/api/notes` when it is reachable; export and import move a JSON file in and
  out, merging on book id.
- `lightbox.js` — click a picture to see it larger. It builds its own trigger
  around every `figure img` on load, so a picture added later needs no markup:
  put the script on the page and it works. Include it on any page that grows a
  figure. With JavaScript off the pictures still show at their inline size.
- `styles.css` — every rule for every page.
- `site.webmanifest`, `assets/icon-*.png` — home-screen name and icon. The icons
  are square crops of `assets/pantocrator.jpg`; regenerate all four sizes
  together if the crop changes.
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
- Never add copy unasked. When the owner asks for copy, write it, and hold it to
  this standard: state the fact, name the people, say where and when. No
  flourishes, no summarising sentences that add nothing, no chained relative
  clauses, no caveats about what the page has just said. If a detail is worth
  including, it is because a reader cannot follow the point without it.
  Everything else a reader sees is a plain functional label: a heading, a nav
  item, a field name, a count, a button.
  Interface strings are the one exception: a button, a field name, an empty
  state, or a line explaining where data is stored has to say something. Keep
  those to the shortest plain statement that does the job.
- Honor `prefers-reduced-motion` in anything animated.
- Reading notes are private. Never add anything that uploads, syncs, or commits
  them, and never seed the editor with example books.
- Prose follows the Google developer documentation style guide: second person,
  active voice, present tense, sentence case headings.

## Current priorities
Set by the repository owner. Do not add sections or content unasked.
