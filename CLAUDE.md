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
  lists for the families and the Protestant branches, three comparison tables
  (followers, belief, practice) with the same eleven traditions as rows, and a
  dated list. On a phone the tables keep the tradition's name fixed and snap
  one question into view at a time. In the belief and practice tables,
  cells in a column that open with the same statement share a soft tint. Each
  column has its own hue (`--tint-1a` to `--tint-5c`) and no two columns share
  one; within a column the answers differ by depth. `scripts/tone-tables.py`
  writes those classes; run it after changing any cell.
- `terminology.html` — section two. Twelve dispute entries, each with terms,
  pronunciation, body, figures, and resolution.
- `reading.html` — the Research section: an editor, not a document. Books, each
  with publication fields that collapse to a heading once saved, and an ordered
  list of chapters holding notes. Notes are rich text, stored as HTML and run
  through a tag allowlist on every read and write, so an imported file cannot
  carry anything executable. Pasting inserts plain text. State lives in
  `localStorage` under `christianity.reading.v1` and, on an unlocked device,
  syncs through `sync.js`; export and import move a JSON file in and out,
  merging on book id.
- `bulletins.html` — weekly notes on the parish bulletin, behind a passcode.
  The page shows this week and next week, each named by its Sunday and, from
  Trinity Sunday to the Sunday before Advent, its number after Pentecost, with a
  list of readings (first lesson, psalm, second lesson, gospel) and notes. Each reading prints its King James
  text under the row as soon as the passage is entered; the text is looked up
  from the reference every time, not stored. The notes editor is `editor.js`.
  Earlier weeks
  are listed below the two. State lives in `localStorage` under
  `christianity.bulletins.v1` and syncs through `sync.js`. The other pages show
  the Bulletins nav link only on an unlocked device.
- `passages.html` — favorite passages. Each entry is a reference and a short
  note, and prints its King James text the way a Bulletins reading does.
  The list sorts newest first or in the order of the books of the Bible; the
  choice is kept per device and does not sync. State lives in `localStorage` under `christianity.passages.v1`
  and, on an unlocked device, syncs through `sync.js`.
- `ptsem.html` — the PTSEM section: Princeton Theological Seminary's
  Certificate in Theology and Ministry. The seminary's logo, and the program
  schedule as a dated list, one row per course. A course the owner has enrolled
  in links to its own page. Dates and titles come from the seminary's page for
  the certificate; check them there before changing a row.
- `ptsem-history.html` — one course page: the course's facts, and its course
  materials. A course page names its course in `<body data-course>`. To add a
  course, copy this page, change the facts and the attribute, and link it from
  the schedule.
- `ptsem.js` — course materials on a course page: a list the owner keeps, each
  item a title, a link, and notes. The list shows on an unlocked device only,
  so a visitor sees the course and no form. State lives in `localStorage`
  under `christianity.ptsem.v1`, one list for every course, and syncs through
  `sync.js`.
- `editor.js` — the notes editor Bulletins and the course pages share: bold,
  italic, highlight, lists, quotation, links, and a note attached to a
  selection. It also holds the tag allowlist every note passes through on
  read and write. Research has an older editor of its own.
- `passages.js` — reads a reference such as `Luke 21:5-19` or
  `1 Cor 15:20-26, 28` and prints the verses. It knows the short forms of the
  book names, ignores the letter on a half verse, and returns nothing when the
  King James Version has no such verses, so a reference numbered for another
  translation shows a plain message instead of the wrong text.
- `bible/kjv/` — the King James Version with Apocrypha, one JSON file per
  book, public domain. `scripts/build-kjv.py` builds it from eBible.org's USFM
  files and documents the format. Do not edit the files by hand.
- `sync.js` — the passcode, and keeping notes the same on every unlocked
  device. The passcode, stretched, is the key an unlocked device keeps under
  `christianity.bulletins.key`. That key opens the Bulletins page, decrypts the
  address of the notes store, and is the credential the store asks for.
  Research, Passages, and Bulletins each hand it a list; it sends the list to the store,
  takes back the merged result, retries when the store is out of reach, and
  shows the state in the page's `#sync-state`. A device that has not been
  unlocked keeps its notes to itself and sends nothing.
- `worker.js` — a Cloudflare Worker: a copy of the site, and the notes store at
  `/api/notes`, `/api/passages`, and `/api/bulletins`. The store checks the key on every request
  and merges what a device sends with what it holds, newest version of each
  book or week winning, so a device with an old copy cannot remove another
  device's work. `build.sh` assembles what the Worker serves.
- `scripts/passcode.mjs` — changes the passcode in `sync.js` and `worker.js`
  together.
- `lightbox.js` — click a picture to see it larger. It builds its own trigger
  around every `figure img` on load, so a picture added later needs no markup:
  put the script on the page and it works. Include it on any page that grows a
  figure. With JavaScript off the pictures still show at their inline size.
- `styles.css` — every rule for every page.
- `site.webmanifest`, `assets/icon-*.png` — home-screen name and icon. The icons
  are square crops of `assets/pantocrator.jpg`; regenerate all four sizes
  together if the crop changes.
- `assets/ptsem-logo.svg`, `assets/ptsem-logo-white.svg` — the seminary's logo,
  copied from ptsem.edu, in navy for the light palette and white for the dark.
- `sources/` — the reference PDFs each section was built from.

Each page repeats the masthead and nav inline. There is no templating; when the
nav changes, update all eight pages.

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
- Reading notes, passages, and bulletin notes are private. They leave a device one way:
  through `sync.js` to the store, with the key. Never add another path that
  uploads, syncs, or commits them, and never seed any of them with examples.
- Pages serves every file in this repository to the public, including
  `worker.js` and this file. Never commit the passcode, the key, or the address
  of the notes store. `sync.js` holds the address encrypted for that reason.
- Prose follows the Google developer documentation style guide: second person,
  active voice, present tense, sentence case headings.

## Current priorities
Set by the repository owner. Do not add sections or content unasked.
