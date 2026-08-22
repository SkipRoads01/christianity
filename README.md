# Christianity: History, Theology, and Civilization

Research and reading notes, published as a static website. No build step, no
dependencies — every page is hand-written HTML against one stylesheet.

## Sections

| Page | Contents |
| --- | --- |
| `index.html` | Home. Scope of the project and links to the sections. |
| `timeline.html` | The history walked forward, one era at a time. Fourteen steps from AD 30 to today; the chart draws itself as you advance and each branch appears at the moment it splits. |
| `denominations.html` | Two thousand years of branching: two timeline charts, the five main families, the ten Protestant subdivisions, a ten-by-five comparison table, and twenty key dates. |
| `terminology.html` | Twelve doctrinal disputes that turned on single words, from *homoousios* in 325 to *kerygma* in the twentieth century. |

## Layout

| Path | Purpose |
| --- | --- |
| `styles.css` | All styling. Colors are custom properties in the `:root` block at the top, with a dark palette in the `prefers-color-scheme` block below it. |
| `sources/` | The original reference PDFs each section was built from. |
| `assets/` | Images and other media. |

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

The repository is private, so the site isn't online. To publish with GitHub
Pages, go to **Settings > Pages**, set the source to the `main` branch and the
root folder, and save. Publishing from a private repository requires a paid
GitHub plan; on the free plan, make the repository public first.

## Still to write

The third line of the title. Nothing yet covers what Christian institutions did
to law, learning, art, and the shape of daily life.
