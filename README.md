# Christianity: History, Theology, and Civilization

Research and reading notes, as a static website. No build step and no
dependencies.

## Sections

| Page | Contents |
| --- | --- |
| `index.html` | Contents. |
| `timeline.html` | Fourteen steps from AD 30 to today. The chart draws as you advance and each branch appears at the date it splits. |
| `denominations.html` | Two charts, five families, ten Protestant traditions, a ten-by-five comparison table, twenty dates. |
| `terminology.html` | Twelve disputes, 325 to 1980. |

## Layout

| Path | Purpose |
| --- | --- |
| `styles.css` | All styling. Colors are custom properties in the `:root` block at the top, with a dark palette in the `prefers-color-scheme` block below it. |
| `sources/` | The original reference PDFs each section was built from. |
| `assets/` | The home-screen icon at four sizes, and `pantocrator.jpg`, the photograph it is cropped from. |
| `site.webmanifest` | Names the site **Christianity** on a phone home screen and points at the icons. |

All three timeline charts are inline SVG. They use the same CSS custom
properties as the rest of the page, so they follow the light and dark palettes
without a second copy.

`timeline.html` carries the only JavaScript on the site, inline at the foot of
the page and dependency-free. Each line is revealed by animating its
`stroke-dashoffset` to the x position of the current year, which is why the
year-to-x scale appears twice: once in the markup and once in the script. Change
one and change the other. The page respects `prefers-reduced-motion`, and every
step is in the HTML rather than generated, so the content is there with
JavaScript off — it is only the pacing that needs the script.

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
