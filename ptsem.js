/**
 * Course materials on a PTSEM course page.
 *
 * A course page names its course in <body data-course="...">. Its materials
 * are a list the owner keeps: a title, a link, and notes. They are private.
 * They show on an unlocked device only, save to localStorage first, and stay
 * level with the other devices through sync.js. Every course shares one
 * list, and each page shows the part that belongs to its course.
 */
(function () {
  'use strict';

  var course = document.body.getAttribute('data-course');
  var root = document.getElementById('materials');
  if (!course || !root) return;

  var $ = function (id) { return document.getElementById(id); };
  var now = function () { return Date.now(); };

  // ---- state -------------------------------------------------------------
  var KEY = 'christianity.ptsem.v1';
  var TOMBSTONE_DAYS = 90;

  var data = { version: 1, materials: [] };
  var link = null;
  var stale = false;         // newer materials arrived while a field had focus

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.materials)) data = parsed;
      }
    } catch (e) { /* start empty */ }
  }

  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* full or blocked */ }
  }

  var saveTimer = null;

  function save() {
    if (link) link.changed();
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(saved, 250);
  }

  function saved() {
    if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
    persist();
    if (link) link.changed();
  }

  function uid() {
    return 'm' + now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  // This course's materials, in the owner's order. Synced data is not
  // trusted to have the right shape.
  function live() {
    return data.materials.filter(function (m) {
      return m && !m.deleted && m.course === course;
    }).map(function (m) {
      m.title = typeof m.title === 'string' ? m.title : '';
      m.link = typeof m.link === 'string' ? m.link : '';
      m.notes = typeof m.notes === 'string' ? m.notes : '';
      m.createdAt = Number(m.createdAt) || Number(m.updatedAt) || 0;
      m.order = Number(m.order) || 0;
      return m;
    }).sort(function (a, b) { return a.order - b.order || a.createdAt - b.createdAt; });
  }

  function touch(item) {
    // A newer copy from another device may have replaced this item in the
    // list while it was being typed in. What is on screen wins.
    if (data.materials.indexOf(item) === -1) {
      var at = -1;
      data.materials.forEach(function (m, i) { if (m && m.id === item.id) at = i; });
      if (at === -1) data.materials.push(item); else data.materials[at] = item;
    }
    item.updatedAt = now();
    save();
  }

  // ---- merge -------------------------------------------------------------
  // Last write wins per material. A removed one leaves a tombstone, otherwise
  // another device would bring it back on the next pull.
  function merge(mine, theirs) {
    var out = {};
    var cutoff = now() - TOMBSTONE_DAYS * 86400000;

    function take(item) {
      if (!item || typeof item.id !== 'string' || !item.id) return;
      if (item.deleted && (item.updatedAt || 0) < cutoff) return;  // aged out
      var seen = out[item.id];
      if (!seen || (item.updatedAt || 0) > (seen.updatedAt || 0)) out[item.id] = item;
    }

    mine.forEach(take);
    theirs.forEach(take);

    return Object.keys(out).sort().map(function (k) { return out[k]; });
  }

  // ---- sync --------------------------------------------------------------
  function typing() {
    var el = document.activeElement;
    return !!el && (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT' || el.isContentEditable);
  }

  function arrived(materials, changed) {
    data.materials = materials;
    persist();
    if (!changed) return;
    if (typing()) stale = true; else render();
  }

  // ---- the page ----------------------------------------------------------
  var unmounts = [];

  function showLink(row, item) {
    var open = row.querySelector('.m-open');
    var href = NotesEditor.address(item.link);
    open.hidden = !href;
    if (href) open.href = href; else open.removeAttribute('href');
  }

  function build(item, index, items) {
    var row = $('tpl-material').content.firstElementChild.cloneNode(true);
    var title = row.querySelector('.m-title');
    var address = row.querySelector('.m-link');
    row.dataset.id = item.id;

    title.value = item.title;
    address.value = item.link;
    showLink(row, item);

    title.addEventListener('input', function () { item.title = this.value; touch(item); });
    address.addEventListener('input', function () {
      item.link = this.value;
      touch(item);
      showLink(row, item);
    });

    var editor = NotesEditor.build('Notes');
    row.querySelector('.editor-here').replaceWith(editor);
    unmounts.push(NotesEditor.mount(editor, {
      get: function () { return item.notes; },
      set: function (html) { item.notes = html; touch(item); }
    }));

    row.querySelector('.m-up').disabled = index === 0;
    row.querySelector('.m-down').disabled = index === items.length - 1;
    row.querySelector('.m-up').addEventListener('click', function () { move(item, -1); });
    row.querySelector('.m-down').addEventListener('click', function () { move(item, 1); });

    row.querySelector('.m-del').addEventListener('click', function () {
      var named = item.title.trim();
      var holds = named || item.link.trim() || item.notes;
      if (holds && !window.confirm(named ? 'Remove ' + named + ' and its notes?'
                                         : 'Remove this material and its notes?')) return;
      // Replace with a tombstone so the removal reaches other devices.
      var at = data.materials.indexOf(item);
      if (at !== -1) data.materials[at] = { id: item.id, deleted: true, updatedAt: now() };
      saved();
      render();
    });

    return row;
  }

  function render() {
    stale = false;
    unmounts.forEach(function (off) { off(); });
    unmounts = [];

    var items = live();
    var list = $('list');
    list.textContent = '';
    items.forEach(function (item, index) { list.appendChild(build(item, index, items)); });
    $('empty').hidden = items.length > 0;
  }

  // Order is a number on each material. Moving one renumbers the course's
  // list and marks only the materials whose number changed.
  function move(item, delta) {
    var items = live();
    var from = items.indexOf(item);
    var to = from + delta;
    if (from === -1 || to < 0 || to >= items.length) return;
    items.splice(from, 1);
    items.splice(to, 0, item);
    var stamp = now();
    items.forEach(function (m, i) {
      if (m.order !== i + 1) { m.order = i + 1; m.updatedAt = stamp; }
    });
    saved();
    render();
    var row = document.querySelector('.material[data-id="' + item.id + '"]');
    var button = row && row.querySelector(delta < 0 ? '.m-up' : '.m-down');
    if (button && button.disabled) button = row.querySelector(delta < 0 ? '.m-down' : '.m-up');
    if (button) button.focus();
  }

  $('add').addEventListener('click', function () {
    var items = live();
    var stamp = now();
    var item = {
      id: uid(), course: course, title: '', link: '', notes: '',
      order: items.length ? items[items.length - 1].order + 1 : 1,
      createdAt: stamp, updatedAt: stamp
    };
    data.materials.push(item);
    saved();
    render();
    var field = document.querySelector('.material[data-id="' + item.id + '"] .m-title');
    if (field) field.focus();
  });

  // ---- start -------------------------------------------------------------
  // A device that has not been unlocked gets none of this: the page stays a
  // plain record of the course, with no form on it.
  Notes.unlocked().then(function (device) {
    if (!device) return;

    load();
    render();
    root.hidden = false;

    link = Notes.sync({
      device: device,
      path: '/api/ptsem',
      field: 'materials',
      read: function () { return data.materials; },
      write: arrived,
      merge: merge,
      note: $('sync-state')
    });

    setInterval(function () { if (stale && !typing()) render(); }, 5000);
    window.addEventListener('focus', function () { if (stale && !typing()) render(); });
    // Leaving the page: do not wait out the save delay.
    window.addEventListener('pagehide', function () { if (saveTimer) saved(); });
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden' && saveTimer) saved();
    });
  });
}());
