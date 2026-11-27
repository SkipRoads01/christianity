/**
 * Print a Bible passage from its reference.
 *
 * Passages.find('Luke 21:5-19') resolves to the verses, or to null when the
 * words are not a reference this file can read or the King James Version has
 * no such verses. Passages.show puts the result on the page.
 *
 * The text is the King James Version with Apocrypha, one file per book under
 * bible/kjv/, built by scripts/build-kjv.py. Chapter and verse numbers are
 * the King James's own. Nothing is fetched from outside the site.
 */
(function () {
  'use strict';

  // Code, name as printed, and the short forms a bulletin might use. A short
  // form is matched without its spaces and full stops.
  var BOOKS = [
    ['GEN', 'Genesis', 'gen gn'],
    ['EXO', 'Exodus', 'exod ex'],
    ['LEV', 'Leviticus', 'lev lv'],
    ['NUM', 'Numbers', 'num nm nb'],
    ['DEU', 'Deuteronomy', 'deut dt'],
    ['JOS', 'Joshua', 'josh jos'],
    ['JDG', 'Judges', 'judg jdg jgs'],
    ['RUT', 'Ruth', 'ru rth'],
    ['1SA', '1 Samuel', '1sam 1sm 1sa'],
    ['2SA', '2 Samuel', '2sam 2sm 2sa'],
    ['1KI', '1 Kings', '1kgs 1ki 1kg'],
    ['2KI', '2 Kings', '2kgs 2ki 2kg'],
    ['1CH', '1 Chronicles', '1chron 1chr 1ch'],
    ['2CH', '2 Chronicles', '2chron 2chr 2ch'],
    ['EZR', 'Ezra', 'ezr'],
    ['NEH', 'Nehemiah', 'neh'],
    ['EST', 'Esther', 'esth est'],
    ['JOB', 'Job', 'jb'],
    ['PSA', 'Psalms', 'psalm ps pss psa'],
    ['PRO', 'Proverbs', 'prov prv pr'],
    ['ECC', 'Ecclesiastes', 'eccles eccl ecc qoheleth qoh'],
    ['SNG', 'Song of Solomon', 'songofsongs song sg cant canticles canticleofcanticles sos'],
    ['ISA', 'Isaiah', 'isa is'],
    ['JER', 'Jeremiah', 'jer'],
    ['LAM', 'Lamentations', 'lam'],
    ['EZK', 'Ezekiel', 'ezek ez ezk'],
    ['DAN', 'Daniel', 'dan dn'],
    ['HOS', 'Hosea', 'hos'],
    ['JOL', 'Joel', 'jl'],
    ['AMO', 'Amos', 'am'],
    ['OBA', 'Obadiah', 'obad ob'],
    ['JON', 'Jonah', 'jon'],
    ['MIC', 'Micah', 'mic mi'],
    ['NAM', 'Nahum', 'nah na'],
    ['HAB', 'Habakkuk', 'hab hb'],
    ['ZEP', 'Zephaniah', 'zeph zep'],
    ['HAG', 'Haggai', 'hag hg'],
    ['ZEC', 'Zechariah', 'zech zec'],
    ['MAL', 'Malachi', 'mal'],
    ['TOB', 'Tobit', 'tob tb'],
    ['JDT', 'Judith', 'jdt jth'],
    ['ESG', 'Rest of Esther', 'additionstoesther greekesther esthergreek addesth'],
    ['WIS', 'Wisdom of Solomon', 'wisdom wis ws'],
    ['SIR', 'Sirach', 'sir ecclesiasticus ecclus'],
    ['BAR', 'Baruch', 'bar'],
    ['S3Y', 'Song of the Three Holy Children', 'songofthethree songofthreeyoungmen prayerofazariah azariah'],
    ['SUS', 'Susanna', 'sus'],
    ['BEL', 'Bel and the Dragon', 'bel'],
    ['1MA', '1 Maccabees', '1macc 1mac 1mc'],
    ['2MA', '2 Maccabees', '2macc 2mac 2mc'],
    ['1ES', '1 Esdras', '1esd'],
    ['MAN', 'Prayer of Manasses', 'prayerofmanasseh manasseh manasses'],
    ['2ES', '2 Esdras', '2esd'],
    ['MAT', 'Matthew', 'matt mt'],
    ['MRK', 'Mark', 'mk mrk'],
    ['LUK', 'Luke', 'lk luk'],
    ['JHN', 'John', 'jn jhn'],
    ['ACT', 'Acts', 'actsoftheapostles act'],
    ['ROM', 'Romans', 'rom rm'],
    ['1CO', '1 Corinthians', '1cor 1co'],
    ['2CO', '2 Corinthians', '2cor 2co'],
    ['GAL', 'Galatians', 'gal'],
    ['EPH', 'Ephesians', 'eph'],
    ['PHP', 'Philippians', 'phil php'],
    ['COL', 'Colossians', 'col'],
    ['1TH', '1 Thessalonians', '1thess 1thes 1th'],
    ['2TH', '2 Thessalonians', '2thess 2thes 2th'],
    ['1TI', '1 Timothy', '1tim 1tm 1ti'],
    ['2TI', '2 Timothy', '2tim 2tm 2ti'],
    ['TIT', 'Titus', 'tit ti'],
    ['PHM', 'Philemon', 'phlm phm philem'],
    ['HEB', 'Hebrews', 'heb'],
    ['JAS', 'James', 'jas jm'],
    ['1PE', '1 Peter', '1pet 1pt 1pe'],
    ['2PE', '2 Peter', '2pet 2pt 2pe'],
    ['1JN', '1 John', '1jn 1jo'],
    ['2JN', '2 John', '2jn 2jo'],
    ['3JN', '3 John', '3jn 3jo'],
    ['JUD', 'Jude', 'jud'],
    ['REV', 'Revelation', 'revelations rev rv apocalypse apoc']
  ];

  var ORDINALS = { '1': '1', '2': '2', '3': '3', 'i': '1', 'ii': '2', 'iii': '3',
                   '1st': '1', '2nd': '2', '3rd': '3', 'first': '1', 'second': '2', 'third': '3' };

  var NAMES = {};      // code -> printed name
  var SHORT = {};      // short form -> code
  var FULL = [];       // [squeezed full name, code], for a name typed part-way

  function squeeze(name) { return name.toLowerCase().replace(/[^a-z0-9]/g, ''); }

  BOOKS.forEach(function (b) {
    NAMES[b[0]] = b[1];
    SHORT[squeeze(b[1])] = b[0];
    FULL.push([squeeze(b[1]), b[0]]);
    b[2].split(' ').forEach(function (s) { SHORT[s] = b[0]; });
  });

  function bookFor(ordinal, name) {
    var key = (ordinal ? ORDINALS[ordinal.toLowerCase()] : '') + squeeze(name);
    if (SHORT[key]) return SHORT[key];
    if (key.length < 3) return null;
    var hits = FULL.filter(function (f) { return f[0].indexOf(key) === 0; });
    return hits.length === 1 ? hits[0][1] : null;
  }

  // ---- reading the reference ---------------------------------------------
  // "1 Cor 15:20-26, 28; 16:1" becomes
  //   [{ code: '1CO', parts: [[15,20,15,26], [28], [16,1,16,1]] }]
  // A part of four numbers is chapter:verse to chapter:verse. A part of one
  // or two bare numbers is a verse or a chapter, which only the book can
  // settle, so that waits until the book has loaded.
  function parse(text) {
    var clean = String(text || '')
      .replace(/[‐-―−]/g, '-')
      .replace(/ /g, ' ')
      .replace(/([a-z])\./gi, '$1 ')              // Lk. 21 -> Lk 21
      .replace(/(\d)\s*\.\s*(\d)/g, '$1:$2')      // 21.5 -> 21:5
      .replace(/\s+/g, ' ')
      .trim();
    if (!clean) return null;

    var out = [];
    var code = null;
    var segments = clean.split(';');

    for (var i = 0; i < segments.length; i++) {
      var m = /^\s*(?:(1st|2nd|3rd|first|second|third|[123]|i{1,3})(?=\s*[a-z])\s*)?([a-z][a-z\s]*?)?\s*(\d.*)?$/i
        .exec(segments[i]);
      if (!m) return null;
      // "Is 2:1" is Isaiah, not a first book of S.
      if (m[1] && /^i+$/i.test(m[1]) && !/^\s*i+\s/i.test(segments[i])) {
        m = /^\s*()([a-z][a-z\s]*?)?\s*(\d.*)?$/i.exec(segments[i]);
        if (!m) return null;
      }
      if (m[2]) {
        code = bookFor(m[1], m[2]);
        if (!code) return null;
      } else if (m[1] || !code) {
        return null;
      }

      var parts = [];
      var rest = (m[3] || '').replace(/\s+/g, '');
      if (rest) {
        var pieces = rest.split(',');
        for (var j = 0; j < pieces.length; j++) {
          var p = pieces[j], q;
          if ((q = /^(\d+):(\d+)[a-z]{0,2}(?:-(?:(\d+):)?(\d+)[a-z]{0,2})?$/i.exec(p))) {
            var c1 = Number(q[1]), v1 = Number(q[2]);
            var c2 = q[3] ? Number(q[3]) : c1;
            var v2 = q[4] ? Number(q[4]) : v1;
            parts.push([c1, v1, c2, v2]);
          } else if ((q = /^(\d+)[a-z]{0,2}(?:-(\d+)[a-z]{0,2})?$/i.exec(p))) {
            parts.push(q[2] ? [Number(q[1]), Number(q[2])] : [Number(q[1])]);
          } else {
            return null;
          }
        }
      }
      out.push({ code: code, parts: parts });
    }
    return out;
  }

  // ---- the text -----------------------------------------------------------
  var loading = {};

  function load(code) {
    if (!loading[code]) {
      loading[code] = fetch('bible/kjv/' + code + '.json').then(function (r) {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      });
      loading[code].catch(function () { delete loading[code]; });
    }
    return loading[code];
  }

  function firstChapter(book) { return book.start || 1; }
  function lastChapter(book) { return firstChapter(book) + book.c.length - 1; }
  function firstVerse(book, c) { return Number((book.first || {})[c] || 1); }

  function lastVerse(book, c) {
    return firstVerse(book, c) + book.c[c - firstChapter(book)].length - 1;
  }

  function hasChapter(book, c) { return c >= firstChapter(book) && c <= lastChapter(book); }

  function hasVerse(book, c, v) {
    return hasChapter(book, c) && v >= firstVerse(book, c) && v <= lastVerse(book, c);
  }

  // Settle the bare numbers and check every verse exists. Returns a list of
  // [chapter, verse, chapter, verse] with a flag for whole chapters, or null.
  function settle(parts, book) {
    var single = book.c.length === 1;
    var only = firstChapter(book);
    var chapter = null;      // set once a part has named a verse
    var out = [];

    if (!parts.length) {
      if (!single) return null;
      return [{ r: [only, firstVerse(book, only), only, lastVerse(book, only)], whole: true }];
    }

    for (var i = 0; i < parts.length; i++) {
      var p = parts[i], r, whole = false;
      if (p.length === 4) {
        r = p;
      } else {
        var a = p[0], b = p.length === 2 ? p[1] : p[0];
        if (single && !(parts.length === 1 && p.length === 1 && a === only)) {
          r = [only, a, only, b];              // Jude 3-4
        } else if (chapter !== null) {
          r = [chapter, a, chapter, b];        // ..., 28
        } else {
          if (!hasChapter(book, a) || !hasChapter(book, b)) return null;
          r = [a, firstVerse(book, a), b, lastVerse(book, b)];   // Psalm 23
          whole = true;
        }
      }
      if (!hasVerse(book, r[0], r[1]) || !hasVerse(book, r[2], r[3])) return null;
      if (r[0] > r[2] || (r[0] === r[2] && r[1] > r[3])) return null;
      if (!whole) chapter = r[2];
      out.push({ r: r, whole: whole });
    }
    return out;
  }

  function label(code, ranges, book) {
    var single = book.c.length === 1;
    var name = NAMES[code];
    if (code === 'PSA') {
      var one = ranges.every(function (x) { return x.r[0] === ranges[0].r[0] && x.r[2] === ranges[0].r[0]; });
      name = one ? 'Psalm' : 'Psalms';
    }
    var chapter = null;
    var bits = ranges.map(function (x) {
      var r = x.r, text;
      if (x.whole) {
        if (single) return '';
        text = r[0] === r[2] ? String(r[0]) : r[0] + '–' + r[2];
        chapter = null;
        return text;
      }
      var from = single || r[0] === chapter ? String(r[1]) : r[0] + ':' + r[1];
      var to = '';
      if (r[0] !== r[2]) to = '–' + r[2] + ':' + r[3];
      else if (r[1] !== r[3]) to = '–' + r[3];
      chapter = r[2];
      return from + to;
    }).filter(function (b) { return b; });
    return name + (bits.length ? ' ' + bits.join(', ') : '');
  }

  /**
   * Resolves to { title, lines } or null. Each line is one of
   *   { kind: 'verse', number, text, para, gap }
   *   { kind: 'title' | 'head', text }
   * Rejects only when the text could not be loaded.
   */
  function find(text) {
    var segments = parse(text);
    if (!segments) return Promise.resolve(null);

    return Promise.all(segments.map(function (s) { return load(s.code); })).then(function (books) {
      var titles = [];
      var lines = [];
      var chapters = {};       // how many chapters the passage draws on
      var settled = [];

      for (var i = 0; i < segments.length; i++) {
        var ranges = settle(segments[i].parts, books[i]);
        if (!ranges) return null;
        settled.push(ranges);
        titles.push(label(segments[i].code, ranges, books[i]));
        ranges.forEach(function (x) {
          for (var c = x.r[0]; c <= x.r[2]; c++) chapters[segments[i].code + c] = true;
        });
      }
      var many = Object.keys(chapters).length > 1;

      settled.forEach(function (ranges, i) {
        var book = books[i];
        var code = segments[i].code;
        ranges.forEach(function (x, n) {
          var r = x.r;
          for (var c = r[0]; c <= r[2]; c++) {
            var list = book.c[c - firstChapter(book)];
            var first = firstVerse(book, c);
            var from = c === r[0] ? r[1] : first;
            var to = c === r[2] ? r[3] : lastVerse(book, c);
            for (var v = from; v <= to; v++) {
              var raw = list[v - first];
              var para = raw.charAt(0) === '¶';
              var opens = v === from;                 // first verse of a run
              if (v === first && book.title && book.title[c]) {
                lines.push({ kind: 'title', text: book.title[c], gap: lines.length > 0 });
                opens = false;
              }
              if (book.head && book.head[c] && book.head[c][v]) {
                lines.push({ kind: 'head', text: book.head[c][v], gap: lines.length > 0 && opens });
                opens = false;
              }
              lines.push({
                kind: 'verse',
                // Across chapters or books a bare verse number is not enough.
                number: many && (v === from || v === first) ? c + ':' + v : String(v),
                text: para ? raw.slice(1).trim() : raw,
                para: para,
                gap: opens && lines.length > 0
              });
            }
          }
        });
      });

      return { title: titles.join('; '), lines: lines };
    });
  }

  // ---- on the page ---------------------------------------------------------
  // Words the translators supplied are in [brackets] in the files and in
  // italics in print.
  function words(text, into) {
    text.split(/(\[[^\]]*\])/).forEach(function (bit) {
      if (!bit) return;
      if (bit.charAt(0) === '[') {
        var i = document.createElement('i');
        i.textContent = bit.slice(1, -1);
        into.appendChild(i);
      } else {
        into.appendChild(document.createTextNode(bit));
      }
    });
  }

  function show(found, into) {
    into.textContent = '';
    found.lines.forEach(function (line) {
      var p = document.createElement('p');
      p.className = 'passage-' + line.kind + (line.gap ? ' passage-gap' : '') +
                    (line.para ? ' passage-para' : '');
      if (line.kind === 'verse') {
        var n = document.createElement('span');
        n.className = 'passage-number';
        n.textContent = line.number;
        p.appendChild(n);
        p.appendChild(document.createTextNode(' '));
      }
      words(line.text, p);
      into.appendChild(p);
    });
  }

  // Where a reference falls in the Bible, as [book, chapter, verse], for
  // putting references in order. Books run as the King James prints them: Old
  // Testament, Apocrypha, New Testament. null when the words are not a
  // reference. Only the start of the reference counts.
  function place(text) {
    var segments = parse(text);
    if (!segments) return null;
    var first = segments[0];
    var book = 0;
    while (BOOKS[book][0] !== first.code) book++;
    var part = first.parts[0] || [];
    return [book, part[0] || 0, part.length === 4 ? part[1] : 0];
  }

  window.Passages = { find: find, show: show, parse: parse, place: place };
}());
