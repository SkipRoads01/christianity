#!/usr/bin/env python3
"""Assemble the site into one self-contained HTML file for previewing.

The site itself is four separate pages and stays that way. This script exists
only so the whole thing can be viewed at a single URL — on a host that serves
one file, or on a phone — without publishing the repository. It reads the real
pages, so whatever it produces matches what is committed.

    python3 scripts/build-single-page.py out.html
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

VIEWS = [
    ("home", "index.html", "Home"),
    ("timeline", "timeline.html", "Timeline"),
    ("denominations", "denominations.html", "Denominations"),
    ("terminology", "terminology.html", "Terminology"),
]

PAGE_TO_HASH = {
    "index.html": "#home",
    "timeline.html": "#timeline",
    "denominations.html": "#denominations",
    "terminology.html": "#terminology",
}


def read(name):
    with open(os.path.join(ROOT, name), encoding="utf-8") as fh:
        return fh.read()


def between(html, tag_open_pattern, tag_close):
    """Return the inner HTML between an opening tag matching a pattern and its close."""
    m = re.search(tag_open_pattern, html)
    if not m:
        raise SystemExit("could not find " + tag_open_pattern)
    end = html.index(tag_close, m.end())
    return html[m.end():end]


def rewrite_links(html):
    # A page link becomes a view hash; a deep link keeps its anchor and the
    # router works out which view holds it.
    def sub(m):
        page, anchor = m.group(1), m.group(2) or ""
        return (anchor if anchor else PAGE_TO_HASH[page])
    html = re.sub(r'href="(index\.html|timeline\.html|denominations\.html|terminology\.html)'
                  r'(#[A-Za-z0-9\-]+)?"',
                  lambda m: 'href="' + sub(m) + '"', html)
    # The source PDFs are not bundled; name them instead of linking nowhere.
    html = re.sub(r'<a href="sources/[^"]+">(.*?)</a>', r'\1', html, flags=re.S)
    return html


def build():
    styles = read("styles.css")
    body = []

    for key, page, _label in VIEWS:
        html = read(page)
        parts = []
        if key == "timeline":
            parts.append('<div class="timeline-bar" id="timeline-bar">'
                         + between(html, r'<div class="timeline-bar" id="timeline-bar">',
                                   "\n</div>\n\n<main")
                         + "</div>")
        parts.append('<main class="wrap">'
                     + between(html, r'<main class="wrap">', "</main>")
                     + "</main>")
        body.append('<div class="view" id="view-{}"{}>\n{}\n</div>'.format(
            key, "" if key == "home" else " hidden", rewrite_links("\n".join(parts))))

    script = between(read("timeline.html"), r"<script>", "</script>")

    nav = "\n".join(
        '      <a href="#{}"{}>{}</a>'.format(key, ' aria-current="page"' if key == "home" else "", label)
        for key, _page, label in VIEWS)

    return TEMPLATE.format(styles=styles, nav=nav, body="\n\n".join(body), script=script)


TEMPLATE = """<title>Christianity: History, Theology, and Civilization</title>
<style>
{styles}

/* ------------------------------------------------------------
   Single-page assembly only. The site proper has no views.
   ------------------------------------------------------------ */
[hidden] {{ display: none !important; }}
.view > main {{ padding-top: 2.5rem; }}
</style>

<header class="masthead">
  <div class="wrap">
    <h1><a href="#home">Christianity: History, Theology, and Civilization</a></h1>
    <p class="tagline">Research and reading notes.</p>
    <nav id="site-nav">
{nav}
    </nav>
  </div>
</header>

{body}


<script>
{script}
</script>

<script>
(function () {{
  var views = ['home', 'timeline', 'denominations', 'terminology'];
  var nav = document.getElementById('site-nav');

  function viewHolding(id) {{
    var el = document.getElementById(id);
    if (!el) return null;
    var v = el.closest('.view');
    return v ? v.id.replace('view-', '') : null;
  }}

  function route() {{
    var hash = (location.hash || '#home').slice(1);
    var target = views.indexOf(hash) !== -1 ? hash : viewHolding(hash);
    if (!target) target = 'home';

    views.forEach(function (v) {{
      document.getElementById('view-' + v).hidden = v !== target;
    }});
    Array.prototype.forEach.call(nav.querySelectorAll('a'), function (a) {{
      if (a.getAttribute('href') === '#' + target) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    }});

    // The timeline measures its own sticky bar, which reads zero while hidden.
    window.dispatchEvent(new Event('resize'));

    if (views.indexOf(hash) === -1) {{
      var el = document.getElementById(hash);
      if (el) {{
        // Wait for the newly shown view to lay out, then jump rather than
        // gliding: the page has just changed under the reader.
        requestAnimationFrame(function () {{
          el.scrollIntoView({{ behavior: 'instant', block: 'start' }});
        }});
        return;
      }}
    }}
    window.scrollTo(0, 0);
  }}

  window.addEventListener('hashchange', route);
  route();
}}());
</script>
"""

if __name__ == "__main__":
    out = sys.argv[1] if len(sys.argv) > 1 else "single-page.html"
    with open(out, "w", encoding="utf-8") as fh:
        fh.write(build())
    print("wrote", out, os.path.getsize(out), "bytes")
