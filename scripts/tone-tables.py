#!/usr/bin/env python3
"""Colour the matching answers in the Belief and Practice tables.

    python3 scripts/tone-tables.py

In each column, cells that open with the same statement get the same
background tint, so a reader sees at a glance which traditions give the same
answer. The opening statement is the cell's text up to its first comma,
semicolon, or colon: "Opposed" in "Opposed; some churches allow it to save the
mother's life". A cell whose opening no other cell in its column shares gets no
tint.

Each column has its own hue, taken in order from the five in styles.css
(--tint-1 to --tint-5), so no hue appears in two columns of a table. Within a
column the answers differ by depth: the commonest answer gets the lightest
shade, a, the next b, and a third c.

Run this again after changing any cell in either table; it rewrites the
classes in denominations.html and changes nothing else.
"""
import html
import os
import re
import sys

PAGE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'denominations.html')
TABLES = ('Belief', 'Practice')
HUES = 5
DEPTHS = 'abc'
CELL = r'<td(?: class="tint-\d[a-c]")?>(.*?)</td>'


def opening(cell):
    text = html.unescape(re.sub(r'<[^>]+>', '', cell))
    return re.split(r'[,;:]', text, maxsplit=1)[0].strip().lower()


def main():
    page = open(PAGE, encoding='utf-8').read()
    for title in TABLES:
        start = page.index('<h3 class="compare-title">%s</h3>' % title)
        body_start = page.index('<tbody>', start)
        body_end = page.index('</tbody>', body_start)
        body = page[body_start:body_end]

        rows = re.findall(r'<tr>.*?</tr>', body, re.S)
        cells = [re.findall(CELL, row, re.S) for row in rows]
        width = len(cells[0])
        if any(len(c) != width for c in cells):
            sys.exit('%s: rows have different numbers of cells' % title)
        if width > HUES:
            sys.exit('%s: more columns than hues' % title)

        tint = {}                      # (column, opening) -> class
        for col in range(width):
            seen = {}
            for row in cells:
                seen[opening(row[col])] = seen.get(opening(row[col]), 0) + 1
            # Commonest first; Python's sort keeps first-seen order among ties.
            shared = sorted((o for o, n in seen.items() if n > 1), key=lambda o: -seen[o])
            if len(shared) > len(DEPTHS):
                sys.exit('%s, column %d: more shared answers than shades' % (title, col + 1))
            for depth, o in zip(DEPTHS, shared):
                tint[(col, o)] = 'tint-%d%s' % (col + 1, depth)

        count = [0]

        def retint(match):
            col = count[0] % width
            count[0] += 1
            name = tint.get((col, opening(match.group(1))))
            mark = ' class="%s"' % name if name else ''
            return '<td%s>%s</td>' % (mark, match.group(1))

        body = re.sub(CELL, retint, body, flags=re.S)
        page = page[:body_start] + body + page[body_end:]

    open(PAGE, 'w', encoding='utf-8').write(page)


if __name__ == '__main__':
    main()
