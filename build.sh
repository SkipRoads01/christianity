#!/usr/bin/env sh
# Assemble dist/ — the exact set of files the site serves.
#
# Deliberately excluded: sources/ (the reference PDFs), scripts/, and the repo
# docs. Nothing on the site links to them, and anything copied here is served.
set -eu

rm -rf dist
mkdir -p dist

for f in index.html timeline.html denominations.html terminology.html \
         reading.html styles.css site.webmanifest; do
  cp "$f" dist/
done

cp -r assets dist/assets

echo "dist/ contains:"
find dist -type f | sort
