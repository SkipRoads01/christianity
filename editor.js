/**
 * The notes editor: bold, italic, highlight, lists, quotation, links, and a
 * note attached to a selection.
 *
 *   var el = NotesEditor.build('Notes');        // the editor's markup
 *   var off = NotesEditor.mount(el, { get, set });
 *
 * Bulletins and the PTSEM course pages use it. Research has an older editor
 * of its own.
 */
(function () {
  'use strict';

  // ---- notes markup ------------------------------------------------------
  // Notes are HTML. Everything written to the page or read from a file goes
  // through this first. Only these tags survive. A link keeps a web or mail
  // address, a note keeps its text, and nothing else keeps any attribute. The
  // markup is parsed in a separate inert document, so nothing in it can load
  // or run while it is being checked.
  var ALLOWED = ['P', 'BR', 'B', 'STRONG', 'I', 'EM', 'MARK', 'UL', 'OL', 'LI',
                 'BLOCKQUOTE', 'DIV', 'A', 'SPAN'];
  var ADDRESS = /^(https?:\/\/|mailto:)/i;

  function unwrap(el) {
    var parent = el.parentNode;
    while (el.firstChild) parent.insertBefore(el.firstChild, el);
    parent.removeChild(el);
  }

  function clean(html) {
    var body = new DOMParser().parseFromString(
      '<!DOCTYPE html><body>' + (html || ''), 'text/html').body;

    (function walk(node) {
      var child = node.firstChild;
      while (child) {
        var next = child.nextSibling;
        if (child.nodeType === 1) {
          var tag = child.tagName.toUpperCase();   // SVG and MathML names arrive in lower case
          var href = tag === 'A' ? (child.getAttribute('href') || '').trim() : '';
          var note = tag === 'SPAN' ? (child.getAttribute('data-note') || '').trim() : '';
          var keep = ALLOWED.indexOf(tag) !== -1 &&
                     (tag !== 'A' || ADDRESS.test(href)) &&
                     (tag !== 'SPAN' || note);

          if (!keep) {
            // Drop what cannot hold prose outright; unwrap the rest so the
            // words inside survive.
            if (/^(SCRIPT|STYLE|TEMPLATE|IFRAME|OBJECT|EMBED|NOSCRIPT)$/.test(tag)) {
              node.removeChild(child);
            } else {
              next = child.firstChild || next;
              unwrap(child);
            }
          } else {
            for (var i = child.attributes.length - 1; i >= 0; i--) {
              child.removeAttribute(child.attributes[i].name);
            }
            if (tag === 'A') {
              child.setAttribute('href', href);
              child.setAttribute('target', '_blank');
              child.setAttribute('rel', 'noopener noreferrer');
            }
            if (tag === 'SPAN') {
              child.setAttribute('data-note', note);
              child.setAttribute('title', note);
            }
            walk(child);
          }
        } else if (child.nodeType !== 3) {
          node.removeChild(child);
        }
        child = next;
      }
    }(body));

    return body;
  }

  function sanitize(html) {
    var body = clean(html);
    // An emptied editor leaves a stray line break behind; store nothing.
    return body.textContent.trim() ? body.innerHTML : '';
  }

  // Turn what was typed into a link address, or return '' if it is not one.
  function address(typed) {
    var value = (typed || '').trim();
    if (!value) return '';
    if (!/^[a-z][a-z0-9+.-]*:/i.test(value)) {
      value = (/^[^\s\/@]+@[^\s\/@]+\.[^\s\/@]+$/.test(value) ? 'mailto:' : 'https://') + value;
    }
    if (!ADDRESS.test(value) || /\s/.test(value)) return '';
    return value;
  }

  // ---- the editor's markup -----------------------------------------------
  var MARKUP =
    '<div class="toolbar" role="toolbar" aria-label="Formatting">' +
      '<button type="button" class="tb" data-cmd="bold" title="Bold"><b>B</b></button>' +
      '<button type="button" class="tb" data-cmd="italic" title="Italic"><i>I</i></button>' +
      '<button type="button" class="tb tb-mark" data-cmd="mark" title="Highlight">H</button>' +
      '<button type="button" class="tb" data-cmd="insertUnorderedList" title="Bulleted list">&bull;</button>' +
      '<button type="button" class="tb" data-cmd="insertOrderedList" title="Numbered list">1.</button>' +
      '<button type="button" class="tb" data-cmd="blockquote" title="Quotation">&ldquo;</button>' +
      '<button type="button" class="tb tb-word" data-cmd="link" title="Link">Link</button>' +
      '<button type="button" class="tb tb-word" data-cmd="note" title="Note on the selected text">Note</button>' +
      '<button type="button" class="tb" data-cmd="clear" title="Clear formatting">&#10005;</button>' +
      '<button type="button" class="tb" data-cmd="undo" title="Undo">&#8630;</button>' +
      '<button type="button" class="tb" data-cmd="redo" title="Redo">&#8631;</button>' +
    '</div>' +
    '<div class="ctx" hidden>' +
      '<a class="ctx-url" target="_blank" rel="noopener noreferrer" hidden></a>' +
      '<span class="ctx-text" hidden></span>' +
      '<input type="text" class="ctx-input" autocomplete="off" autocapitalize="off" spellcheck="false" hidden />' +
      '<button type="button" class="linkish ctx-save" hidden>Save</button>' +
      '<button type="button" class="linkish ctx-cancel" hidden>Cancel</button>' +
      '<button type="button" class="linkish ctx-edit" hidden>Edit</button>' +
      '<button type="button" class="linkish ctx-remove" hidden>Remove</button>' +
    '</div>' +
    '<div class="c-notes" contenteditable="true" role="textbox" aria-multiline="true"></div>';

  // A new editor, not yet on the page. The label names it for a screen
  // reader and shows in the empty field.
  function build(label) {
    var el = document.createElement('div');
    el.className = 'editor';
    el.innerHTML = MARKUP;
    var notes = el.querySelector('.c-notes');
    notes.setAttribute('aria-label', label);
    notes.setAttribute('data-placeholder', label);
    return el;
  }

  // ---- the editor at work -------------------------------------------------
  // store.get returns the notes as saved; store.set takes them after every
  // change. Returns a function that detaches the editor from the page.
  function mount(root, store) {
    var notes = root.querySelector('.c-notes');
    var ctx = root.querySelector('.ctx');
    var url = ctx.querySelector('.ctx-url');
    var text = ctx.querySelector('.ctx-text');
    var input = ctx.querySelector('.ctx-input');
    var bSave = ctx.querySelector('.ctx-save');
    var bCancel = ctx.querySelector('.ctx-cancel');
    var bEdit = ctx.querySelector('.ctx-edit');
    var bRemove = ctx.querySelector('.ctx-remove');

    var asking = null;     // 'link' or 'note' while the bar holds a field
    var target = null;     // the link or note the bar is about
    var held = null;       // the selection to act on once the field is saved

    notes.innerHTML = sanitize(store.get());

    // ---- undo ------------------------------------------------------------
    // The editor keeps its own history, because the browser's undo misses
    // the changes made here by hand, such as a highlight or a cleared quote.
    // Typing in one burst counts as one step. The history lasts as long as
    // the page is open.
    var history = [notes.innerHTML];
    var at = 0;
    var lastTyped = 0;

    function record(typed) {
      var html = notes.innerHTML;
      if (html === history[at]) return;
      var stamp = Date.now();
      if (typed && lastTyped && stamp - lastTyped < 1000 && at === history.length - 1 && at > 0) {
        history[at] = html;                  // still the same burst of typing
      } else {
        history = history.slice(0, at + 1);
        history.push(html);
        if (history.length > 200) history.shift();
        at = history.length - 1;
      }
      lastTyped = typed ? stamp : 0;
    }

    function step(by) {
      var to = at + by;
      if (to < 0 || to >= history.length) return;
      at = to;
      lastTyped = 0;
      notes.innerHTML = history[at];
      notes.focus();
      var r = document.createRange();
      r.selectNodeContents(notes);
      r.collapse(false);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(r);
      store.set(sanitize(notes.innerHTML));
    }

    function commit() {
      var html = sanitize(notes.innerHTML);
      if (!html && notes.innerHTML) notes.innerHTML = '';
      record(false);
      store.set(html);
    }

    function range() {
      var sel = window.getSelection();
      if (!sel.rangeCount) return null;
      var r = sel.getRangeAt(0);
      return notes.contains(r.commonAncestorContainer) ? r : null;
    }

    // The nearest link, note, or highlight around the selection.
    function around(test) {
      var r = range();
      var node = r ? r.commonAncestorContainer : null;
      while (node && node !== notes) {
        if (node.nodeType === 1 && test(node)) return node;
        node = node.parentNode;
      }
      return null;
    }

    function isLink(n) { return n.tagName === 'A'; }
    function isNote(n) { return n.tagName === 'SPAN' && n.hasAttribute('data-note'); }
    function isMark(n) { return n.tagName === 'MARK'; }

    function wrap(el) {
      var r = range();
      if (!r || r.collapsed) return false;
      try {
        r.surroundContents(el);
      } catch (e) {
        // The selection crosses element boundaries; fall back to replacing it.
        el.appendChild(r.extractContents());
        r.insertNode(el);
      }
      return true;
    }

    function caretAfter(el) {
      var r = document.createRange();
      r.setStartAfter(el);
      r.collapse(true);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(r);
    }

    function show(parts) {
      [url, text, input, bSave, bCancel, bEdit, bRemove].forEach(function (el) {
        el.hidden = parts.indexOf(el) === -1;
      });
      ctx.hidden = parts.length === 0;
    }

    function say(message) {
      text.textContent = message;
      show([text]);
    }

    // Show what the caret is in: a link's address, or a note's text.
    function reflect() {
      if (asking) return;
      target = around(isLink) || around(isNote);
      if (!target) { show([]); return; }
      if (isLink(target)) {
        url.href = target.getAttribute('href');
        url.textContent = target.getAttribute('href');
        show([url, bEdit, bRemove]);
      } else {
        text.textContent = target.getAttribute('data-note');
        show([text, bEdit, bRemove]);
      }
    }

    function ask(kind) {
      var r = range();
      if (kind === 'link') target = around(isLink);
      if (kind === 'note') target = around(isNote);
      if (kind === 'note' && !target && (!r || r.collapsed)) {
        say('Select the words the note is about, then choose Note.');
        return;
      }
      held = r ? r.cloneRange() : null;
      asking = kind;
      input.value = target
        ? (kind === 'link' ? target.getAttribute('href') : target.getAttribute('data-note'))
        : '';
      input.placeholder = kind === 'link' ? 'Web address' : 'Note';
      input.setAttribute('aria-label', input.placeholder);
      input.inputMode = kind === 'link' ? 'url' : 'text';
      show([input, bSave, bCancel]);
      input.focus();
    }

    function restore() {
      notes.focus();
      if (!held) return;
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(held);
    }

    function done() {
      asking = null;
      held = null;
      commit();
      reflect();
    }

    function saveAsked() {
      var kind = asking;
      var value = input.value.trim();

      if (kind === 'link') {
        var href = address(value);
        if (value && !href) {
          input.select();
          return;
        }
        asking = null;
        restore();
        if (!href) {
          if (target) unwrap(target);
        } else if (target) {
          target.setAttribute('href', href);
        } else {
          var r = range();
          if (r && !r.collapsed) {
            document.execCommand('createLink', false, href);
          } else {
            var a = document.createElement('a');
            a.setAttribute('href', href);
            a.textContent = value;
            if (r) r.insertNode(a); else notes.appendChild(a);
            caretAfter(a);
          }
        }
      } else {
        asking = null;
        restore();
        if (!value) {
          if (target) unwrap(target);
        } else if (target) {
          target.setAttribute('data-note', value);
          target.setAttribute('title', value);
        } else {
          var span = document.createElement('span');
          span.setAttribute('data-note', value);
          span.setAttribute('title', value);
          if (wrap(span)) caretAfter(span);
        }
      }
      done();
    }

    function cancelAsked() {
      asking = null;
      restore();
      held = null;
      reflect();
    }

    // Turning a line into a list or a quotation rebuilds the line, and the
    // caret can land back at its start. Count how many characters into the
    // notes it was, and put it back there.
    function caretAt() {
      var r = range();
      if (!r || !r.collapsed) return -1;
      var before = document.createRange();
      before.selectNodeContents(notes);
      before.setEnd(r.startContainer, r.startOffset);
      return before.toString().length;
    }

    function block(change) {
      var was = caretAt();
      change();
      if (was < 0 || caretAt() === was) return;
      var walker = document.createTreeWalker(notes, NodeFilter.SHOW_TEXT);
      var node, left = was;
      while ((node = walker.nextNode())) {
        if (left <= node.length) {
          window.getSelection().collapse(node, left);
          return;
        }
        left -= node.length;
      }
    }

    // ---- clearing ----------------------------------------------------------
    var INLINE = /^(B|STRONG|I|EM|MARK|A|SPAN|U|S|FONT)$/;

    // The paragraphs, list items, and quotations directly inside the notes
    // that the selection touches, or the one the caret is in.
    function blocksIn(r) {
      var out = [];
      Array.prototype.forEach.call(notes.childNodes, function (n) {
        if (r.intersectsNode(n)) out.push(n);
      });
      return out;
    }

    // A quotation or a list becomes plain paragraphs.
    function flatten(block) {
      if (block.nodeType !== 1 || !/^(BLOCKQUOTE|UL|OL)$/.test(block.tagName)) return;
      var parts = block.tagName === 'BLOCKQUOTE'
        ? Array.prototype.slice.call(block.childNodes)
        : Array.prototype.slice.call(block.querySelectorAll('li'));
      var loose = null;
      parts.forEach(function (part) {
        var inline = part.nodeType !== 1 || !/^(P|DIV|LI|UL|OL|BLOCKQUOTE)$/.test(part.tagName);
        if (inline) {
          if (!loose) { loose = document.createElement('p'); block.parentNode.insertBefore(loose, block); }
          loose.appendChild(part);
          return;
        }
        loose = null;
        var p = document.createElement('p');
        while (part.firstChild) p.appendChild(part.firstChild);
        block.parentNode.insertBefore(p, block);
      });
      block.parentNode.removeChild(block);
    }

    // Remove every kind of formatting from what is selected. With nothing
    // selected, clear the paragraph the caret is in.
    function clearAll() {
      var r = range();
      if (!r) return;
      if (r.collapsed) {
        var block = r.startContainer;
        while (block.parentNode && block.parentNode !== notes) block = block.parentNode;
        if (block === notes) return;
        r = document.createRange();
        r.selectNode(block);
      }
      var blocks = blocksIn(r);
      var inline = [];
      blocks.forEach(function (b) {
        if (b.nodeType !== 1) return;
        if (INLINE.test(b.tagName)) inline.push(b);
        Array.prototype.forEach.call(b.querySelectorAll('*'), function (el) {
          if (INLINE.test(el.tagName) && r.intersectsNode(el)) inline.push(el);
        });
      });
      inline.forEach(function (el) { if (el.parentNode) unwrap(el); });
      blocks.forEach(flatten);
      notes.normalize();
    }

    function exec(cmd) {
      if (cmd === 'undo') return step(-1);
      if (cmd === 'redo') return step(1);
      if (cmd === 'link' || cmd === 'note') return ask(cmd);
      if (cmd === 'mark') {
        var existing = around(isMark);
        if (existing) unwrap(existing);
        else if (wrap(document.createElement('mark'))) window.getSelection().collapseToEnd();
      } else if (cmd === 'blockquote') {
        var quote = around(function (n) { return n.tagName === 'BLOCKQUOTE'; });
        if (quote) flatten(quote);           // a second press takes the quotation off
        else block(function () { document.execCommand('formatBlock', false, 'blockquote'); });
      } else if (cmd === 'insertUnorderedList' || cmd === 'insertOrderedList') {
        block(function () { document.execCommand(cmd); });
      } else if (cmd === 'clear') {
        clearAll();
      } else {
        document.execCommand(cmd);
      }
      commit();
      reflect();
    }

    notes.addEventListener('input', function () {
      record(true);
      store.set(sanitize(notes.innerHTML));
    });

    // Undo and redo from the keyboard, or from a browser's Edit menu.
    notes.addEventListener('beforeinput', function (e) {
      if (e.inputType === 'historyUndo') { e.preventDefault(); step(-1); }
      if (e.inputType === 'historyRedo') { e.preventDefault(); step(1); }
    });

    // Paste as plain text, so copying from a web page does not drag its
    // styling in with it. A pasted address on its own becomes a link.
    notes.addEventListener('paste', function (e) {
      e.preventDefault();
      var pasted = (e.clipboardData || window.clipboardData).getData('text');
      var r = range();
      if (/^https?:\/\/\S+$/i.test(pasted.trim()) && address(pasted) && !around(isLink)) {
        if (r && !r.collapsed) {
          document.execCommand('createLink', false, address(pasted));
        } else {
          var a = document.createElement('a');
          a.setAttribute('href', address(pasted));
          a.textContent = pasted.trim();
          if (r) { r.insertNode(a); caretAfter(a); }
        }
        commit();
        return;
      }
      document.execCommand('insertText', false, pasted);
    });

    notes.addEventListener('keydown', function (e) {
      var key = e.key.toLowerCase();
      if ((e.metaKey || e.ctrlKey) && !e.altKey && key === 'k') {
        e.preventDefault();
        ask('link');
      }
      if ((e.metaKey || e.ctrlKey) && !e.altKey && (key === 'z' || key === 'y')) {
        e.preventDefault();
        step(key === 'y' || e.shiftKey ? 1 : -1);
      }
    });

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); saveAsked(); }
      if (e.key === 'Escape') { e.preventDefault(); cancelAsked(); }
    });

    bSave.addEventListener('click', saveAsked);
    bCancel.addEventListener('click', cancelAsked);
    bEdit.addEventListener('click', function () {
      if (!target) return;
      var r = document.createRange();
      r.selectNodeContents(target);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(r);
      ask(isLink(target) ? 'link' : 'note');
    });
    bRemove.addEventListener('click', function () {
      if (!target) return;
      unwrap(target);
      target = null;
      commit();
      show([]);
    });

    root.querySelectorAll('.tb').forEach(function (btn) {
      // mousedown would move focus out of the editor and lose the selection
      btn.addEventListener('mousedown', function (e) { e.preventDefault(); });
      btn.addEventListener('click', function () {
        if (asking) cancelAsked();
        if (!range()) notes.focus();
        exec(btn.dataset.cmd);
      });
    });

    // The bar follows the caret, and steps aside when it leaves the editor.
    function follow() {
      if (asking) return;
      if (range()) reflect();
      else if (!ctx.contains(document.activeElement)) show([]);
    }

    document.addEventListener('selectionchange', follow);
    return function unmount() { document.removeEventListener('selectionchange', follow); };
  }

  window.NotesEditor = {
    build: build,
    mount: mount,
    clean: clean,
    sanitize: sanitize,
    address: address
  };
}());
