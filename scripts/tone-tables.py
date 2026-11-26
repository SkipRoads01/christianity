#!/usr/bin/env python3
"""Colour the matching answers in the Belief and Practice tables.

    python3 scripts/tone-tables.py

In each column, cells that open with the same statement get the same
background tint, so a reader sees at a glance which traditions give the same
answer. The opening statement is the cell's text up to its first comma,
semicolon, or colon: "Opposed" in "Opposed; some churches allow it to save the
mother's life". A cell whose opening no other cell in its column shares gets no
tint.

The tints are the --tone-1 to --tone-6 properties in styles.css. Within a
column they are handed out in the order the answers first appear. Run this
again after changing any cell in either table; it rewrites the classes in
denominations.html and changes nothing else.
"""
import html
import os
import re
import sys

PAGE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'denominations.html')
TABLES = ('Belief', 'Practice')
TONES = 6


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
        cells = [re.findall(r'<td(?: class="tone-\d")?>(.*?)</td>', row, re.S) for row in rows]
        width = len(cells[0])
        if any(len(c) != width for c in cells):
            sys.exit('%s: rows have different numbers of cells' % title)

        tone = {}                      # (column, opening) -> tone number
        for col in range(width):
            seen = {}
            for row in cells:
                seen.setdefault(opening(row[col]), 0)
                seen[opening(row[col])] += 1
            shared = [o for o, n in seen.items() if n > 1]
            if len(shared) > TONES:
                sys.exit('%s, column %d: more shared answers than tints' % (title, col + 1))
            for number, o in enumerate(shared, 1):
                tone[(col, o)] = number

        def retint(match, counter=[0]):
            col = counter[0] % width
            counter[0] += 1
            number = tone.get((col, opening(match.group(1))))
            mark = ' class="tone-%d"' % number if number else ''
            return '<td%s>%s</td>' % (mark, match.group(1))

        body = re.sub(r'<td(?: class="tone-\d")?>(.*?)</td>', retint, body, flags=re.S)
        page = page[:body_start] + body + page[body_end:]

    open(PAGE, 'w', encoding='utf-8').write(page)


if __name__ == '__main__':
    main()
