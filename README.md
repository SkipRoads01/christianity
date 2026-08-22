# christianity

A static website. No build step, no dependencies.

## Files

| Path | Purpose |
| --- | --- |
| `index.html` | The home page and the only page so far. |
| `styles.css` | All styling. Colors live in the `:root` block at the top. |
| `assets/` | Images and other media. |

## View the site locally

Open `index.html` in a browser, or serve the folder:

```
python3 -m http.server 8000
```

Then go to http://localhost:8000.

## Publish it

The repository is private, so the site isn't online yet. To publish with GitHub
Pages, go to **Settings > Pages**, set the source to the `main` branch and the
root folder, and save. Publishing a page from a private repository requires a
paid GitHub plan; on the free plan, make the repository public first.

## Status

The page is a scaffold. The copy, the section names, and the structure are all
placeholders waiting on direction.
