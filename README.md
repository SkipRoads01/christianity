# Christianity: History, Theology, and Civilization

Research and reading notes, as a static website. No build step and no
dependencies.

## Sections

| Page | Contents |
| --- | --- |
| `index.html` | Contents. |
| `timeline.html` | Twenty steps from AD 30 to today. The chart draws as you advance and each branch appears at the date it splits. |
| `denominations.html` | Two charts, five families, ten Protestant traditions, an eleven-by-eight comparison table, twenty dates. |
| `terminology.html` | Twelve disputes, 325 to 1980. |
| `reading.html` | Research notes by book and chapter. An editor, not a document: add a book, record its publication details, then add chapters and write notes under them. Notes take bold, italic, highlight, lists and quotations. |
| `passages.html` | Favorite passages. Each entry is a reference and a note, and prints its King James text when you enter the reference. |
| `ptsem.html` | Princeton Theological Seminary's Certificate in Theology and Ministry: the program schedule, with a link to each course the owner has enrolled in. |
| `ptsem-history.html` | Introduction to Christian History: the course's facts and its course materials. The materials are private and show only on an unlocked device. |
| `bulletins.html` | Notes on the weekly parish bulletin, behind a passcode. This week and next week, each with a topic, readings, and notes; earlier weeks listed below. Each reading prints its King James text when you enter the passage. The nav link appears only on a device that has unlocked the page. |

## Layout

| Path | Purpose |
| --- | --- |
| `passages.js` | Reads a Bible reference and prints the passage on the Passages and Bulletins pages. |
| `bible/kjv/` | The King James Version with Apocrypha, one JSON file per book. Public domain, built from eBible.org's USFM files by `scripts/build-kjv.py`. |
| `editor.js` | The notes editor that Bulletins and the course pages share. |
| `ptsem.js` | The course materials list on a PTSEM course page. |
| `sync.js` | The passcode check, and syncing notes between unlocked devices. |
| `worker.js` | The Cloudflare Worker: a copy of the site and the notes store. |
| `styles.css` | All styling. Colors are custom properties in the `:root` block at the top, with a dark palette in the `prefers-color-scheme` block below it. |
| `sources/` | The original reference PDFs each section was built from. |
| `assets/` | The home-screen icon at four sizes, `pantocrator.jpg`, the photograph it is cropped from, and Princeton Theological Seminary's logo in navy and white. |
| `site.webmanifest` | Names the site **Christianity** on a phone home screen and points at the icons. |

All three timeline charts are inline SVG. They use the same CSS custom
properties as the rest of the page, so they follow the light and dark palettes
without a second copy.

`timeline.html` carries its own script, inline at the foot of the page and
dependency-free. `lightbox.js` is the one shared script: it opens any figure
picture at a larger size, building its own trigger on load so a new figure needs
no markup. Each line is revealed by animating its
`stroke-dashoffset` to the x position of the current year, which is why the
year-to-x scale appears twice: once in the markup and once in the script. Change
one and change the other. The page respects `prefers-reduced-motion`, and every
step is in the HTML rather than generated, so the content is there with
JavaScript off — it is only the pacing that needs the script.

## Where notes are kept

Research, Passages, Bulletins, and the PTSEM course materials save to the
browser first, under the `localStorage` keys `christianity.reading.v1`,
`christianity.passages.v1`, `christianity.bulletins.v1`, and
`christianity.ptsem.v1`, so all four work offline. Nothing is committed.

A device that has been unlocked with the passcode also keeps its notes level
with every other unlocked device. `sync.js` sends them to a small store, the
Cloudflare Worker in `worker.js`, which checks the device's key, merges what it
receives with what it holds, and sends back the result. The label beside the
buttons says **Synced**, **Syncing**, or **Not synced yet. Trying again.** A
device that has not been unlocked shows **Saved on this device only.** and sends
nothing.

To unlock a device, open `bulletins.html` and enter the passcode. The Bulletins
link appears in the nav after that.

**Export** writes a JSON file and **Import** merges one back in, matching on
book, passage, or week, so re-importing a file updates entries rather than duplicating
them. Use them for a backup.

## The passcode

The passcode is never stored. `sync.js` holds a salt, the hash of the stretched
passcode, and the store's address encrypted with it; `worker.js` holds the same
hash. Every file in this repository is public through Pages, so the passcode
is the only thing between a visitor and the notes. Choose four or more
unrelated words.

To change it:

```
node scripts/passcode.mjs "the old passcode" "the new passcode"
```

Commit and push `sync.js` and `worker.js` together. Every device then has to
unlock again. The notes are untouched.

## View the site locally

Open `index.html` in a browser, or serve the folder:

```
python3 -m http.server 8000
```

Then go to http://localhost:8000.

## Publish it

The site is live at https://skiproads01.github.io/christianity/, served by
GitHub Pages from the `gh-pages` branch. The `Publish to gh-pages` workflow
keeps that branch level with `main`, so pushing to `main` publishes.
`.nojekyll` stops Pages from running the files through Jekyll.

A Pages site is publicly viewable on every plan, including from a private
repository.
