#!/usr/bin/env python3
"""Build bible/kjv/ from the King James Version in USFM.

The source is eBible.org's "King James Version + Apocrypha", the standardized
text of 1769, which is in the public domain:

    https://ebible.org/Scriptures/eng-kjv_usfm.zip

Unzip it and pass the folder:

    python3 scripts/build-kjv.py path/to/usfm

Each book becomes one JSON file named by its three-letter code:

    c      chapters, each a list of verses. A verse that opens a paragraph
           starts with a pilcrow. Words the translators supplied, which the
           King James prints in italics, are in [square brackets].
    start  the number of the first chapter, when it is not 1. The Rest of
           Esther begins at chapter 10.
    first  for the few chapters that do not start at verse 1, the number of
           the first verse, by chapter.
    title  psalm titles, by chapter. The King James prints them above the
           psalm and does not count them as a verse.
    head   headings that stand before a verse, by chapter and verse: the
           Hebrew letters of Psalm 119.

Footnotes, Strong's numbers, and the red-letter marking are dropped.
"""
import json
import os
import re
import sys

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'bible', 'kjv')


def inline(text):
    """Reduce a run of USFM to plain text with [supplied words]."""
    text = re.sub(r'\\f .*?\\f\*', '', text)
    text = re.sub(r'\\x .*?\\x\*', '', text)
    text = re.sub(r'\\\+?add\s+(.*?)\\\+?add\*', r'[\1]', text)
    # \w word|strong="H1234"\w*  ->  word
    text = re.sub(r'\|[^\\]*?(?=\\\+?w\*)', '', text)
    text = re.sub(r'\\\+?[a-z]+[0-9]*\*', '', text)      # closing markers
    text = re.sub(r'\\\+?[a-z]+[0-9]*\s?', '', text)     # opening markers
    if '\\' in text or '|' in text:
        raise ValueError('markup left over: ' + text[:120])
    text = re.sub(r'\s+', ' ', text).strip()
    text = re.sub(r'\[\s+', '[', text)
    text = re.sub(r'\s+\]', ']', text)
    return re.sub(r'\s+([,.;:!?])', r'\1', text)


def convert(path):
    code = None
    chapters, first, title, head = [], {}, {}, {}
    verses = None
    chapter = 0
    start = 1             # the number of the book's first chapter
    para = False          # the next verse opens a paragraph
    pending = None        # a heading waiting for its verse

    for raw in open(path, encoding='utf-8-sig'):
        line = raw.strip()
        if not line:
            continue
        m = re.match(r'\\(\S+)\s*(.*)$', line)
        if not m:
            # A line with no marker continues the verse above it.
            if verses:
                verses[-1] = (verses[-1] + ' ' + inline(line)).strip()
            continue
        tag, rest = m.group(1), m.group(2)

        if tag == 'id':
            code = rest.split()[0]
        elif tag == 'c':
            chapter = int(rest.split()[0])
            if not chapters:
                start = chapter
            if chapter != start + len(chapters):
                raise ValueError('%s: chapter %d out of order' % (code, chapter))
            verses = []
            chapters.append(verses)
            para = False
        elif tag == 'd':
            title[str(chapter)] = inline(rest)
        elif tag == 's1':
            if chapter:
                pending = inline(rest)
        elif tag in ('p', 'm', 'pi', 'nb'):
            para = True
            if rest and verses:
                verses[-1] = (verses[-1] + ' ' + inline(rest)).strip()
        elif tag in ('q1', 'q2', 'b'):
            if rest and verses:
                verses[-1] = (verses[-1] + ' ' + inline(rest)).strip()
        elif tag == 'v':
            number, _, text = rest.partition(' ')
            number = int(number)
            if not verses:
                if number != 1:
                    first[str(chapter)] = number
            elif number != int(first.get(str(chapter), 1)) + len(verses):
                raise ValueError('%s %d: verse %d out of order' % (code, chapter, number))
            if pending:
                head.setdefault(str(chapter), {})[str(number)] = pending
                pending = None
            # The source carries the King James's own pilcrows as well as
            # paragraph markers. Either one makes this verse open a paragraph.
            text = inline(text)
            if text.startswith('\u00b6'):
                para = True
                text = text[1:].strip()
            verses.append(('\u00b6 ' if para and verses else '') + text)
            para = False
        elif tag in ('h', 'toc1', 'toc2', 'toc3', 'mt1', 'mt2', 'ms1', 'ide',
                     'is1', 'imt1', 'ip'):
            pass
        else:
            raise ValueError('%s: unknown marker \\%s' % (code, tag))

    if not chapters:
        return None, None
    book = {'c': chapters}
    if start != 1:
        book['start'] = start
    if first:
        book['first'] = first
    if title:
        book['title'] = title
    if head:
        book['head'] = head
    return code, book


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    os.makedirs(OUT, exist_ok=True)
    total = 0
    for name in sorted(os.listdir(sys.argv[1])):
        if not name.endswith('.usfm'):
            continue
        code, book = convert(os.path.join(sys.argv[1], name))
        if not book:
            continue
        with open(os.path.join(OUT, code + '.json'), 'w', encoding='utf-8') as out:
            json.dump(book, out, ensure_ascii=False, separators=(',', ':'))
            out.write('\n')
        total += sum(len(c) for c in book['c'])
    print('wrote %d verses to %s' % (total, os.path.normpath(OUT)))


if __name__ == '__main__':
    main()
