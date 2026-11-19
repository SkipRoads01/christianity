/**
 * Unlocking a device, and keeping notes the same on every unlocked device.
 *
 * One passcode does both jobs. Stretched, it is the key a device keeps once it
 * has been unlocked. That key opens the Bulletins page, decrypts the address
 * of the notes store, and is the credential the store asks for. This file
 * holds a salt, the hash of the key, and the encrypted address. It never holds
 * the passcode, the key, or the address in the clear, because every file in
 * this repository is served publicly.
 *
 * Notes are saved in localStorage first, so a page works offline. The store
 * is a reconciler on top: each device sends what it has, the store merges it
 * with what the other devices sent, and the device takes the result.
 */
(function () {
  'use strict';

  var KEY_NAME = 'christianity.bulletins.key';
  var SALT = '008e53c663e24e8b39fefec0ff59e176';
  var VERIFIER = '9d016c417b18e772570f78a1eceb3d5707662fb712ad80d2b2e2b92b00d6df79';
  var ROUNDS = 310000;
  var WHERE_IV = 'd0767a3f40012dadc027bfeb';
  var WHERE = '3f87ec2d055edbb3d40409f1af73ba3a0ad16a8ddaf0f3d81795e3d09d5f4f2ed31d61bf34b682b995c68b1e4ec6d1fb66274e3537d6f14170497c7c';

  var PUSH_MS = 3000;
  var PULL_MS = 30000;
  var BEACON_MAX = 60000;   // a request that outlives the page may carry about 64 KB

  var SYNCED = 'Synced';
  var SYNCING = 'Syncing';
  var WAITING = 'Not synced yet. Trying again.';
  var DENIED = 'Not synced. The passcode on this device is out of date.';
  var LOCAL = 'Saved on this device only.';

  function toHex(buffer) {
    return Array.prototype.map.call(new Uint8Array(buffer), function (b) {
      return ('0' + b.toString(16)).slice(-2);
    }).join('');
  }

  function fromHex(hex) {
    var out = new Uint8Array(hex.length / 2);
    for (var i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
    return out;
  }

  function subtle() {
    return window.crypto && window.crypto.subtle;
  }

  // Phones capitalise and add spaces; neither should fail a correct passcode.
  function tidy(passcode) {
    return passcode.trim().toLowerCase().replace(/[\s_-]+/g, '-');
  }

  function stretch(passcode) {
    return subtle().importKey('raw', new TextEncoder().encode(tidy(passcode)), 'PBKDF2', false, ['deriveBits'])
      .then(function (key) {
        return subtle().deriveBits(
          { name: 'PBKDF2', hash: 'SHA-256', salt: fromHex(SALT), iterations: ROUNDS }, key, 256);
      })
      .then(toHex);
  }

  function matches(key) {
    if (!/^[0-9a-f]{64}$/.test(key || '')) return Promise.resolve(false);
    return subtle().digest('SHA-256', fromHex(key)).then(function (hash) {
      return toHex(hash) === VERIFIER;
    });
  }

  // The address of the notes store, or null if it cannot be read.
  function where(key) {
    return subtle().importKey('raw', fromHex(key), 'AES-GCM', false, ['decrypt'])
      .then(function (aes) {
        return subtle().decrypt({ name: 'AES-GCM', iv: fromHex(WHERE_IV) }, aes, fromHex(WHERE));
      })
      .then(function (plain) { return new TextDecoder().decode(plain); })
      .catch(function () { return null; });
  }

  function remembered() {
    try { return localStorage.getItem(KEY_NAME); } catch (e) { return null; }
  }

  function device(key) {
    return matches(key).then(function (ok) {
      if (!ok) return null;
      return where(key).then(function (base) { return { key: key, base: base }; });
    });
  }

  // Resolves to { key, base } on an unlocked device, otherwise to null.
  function unlocked() {
    if (!subtle()) return Promise.resolve(null);
    return device(remembered()).catch(function () { return null; });
  }

  // Resolves to { key, base } if the passcode is right, otherwise to null.
  // Rejects if this browser cannot do the arithmetic.
  function unlock(passcode) {
    if (!subtle()) return Promise.reject(new Error('no crypto'));
    return stretch(passcode).then(device).then(function (found) {
      if (found) {
        try { localStorage.setItem(KEY_NAME, found.key); } catch (e) { /* this visit only */ }
      }
      return found;
    });
  }

  function lock() {
    try { localStorage.removeItem(KEY_NAME); } catch (e) { /* nothing stored */ }
  }

  function usable(item) {
    return !!item && typeof item.id === 'string' && item.id !== '';
  }

  // The same list whatever order it is in.
  function canon(list) {
    return JSON.stringify(list.slice().sort(function (a, b) {
      return String(a && a.id) < String(b && b.id) ? -1 : 1;
    }));
  }

  /**
   * Keep one list level with the store.
   *
   *   device  what unlocked() resolved to, or null for a device that is locked
   *   path    the store's route, such as /api/notes
   *   field   the name the list goes under, such as books
   *   read    returns the list as this device has it
   *   write   takes the merged list; the second argument says whether its
   *           content differs from what read returned
   *   merge   combines two lists, newest version of each item winning
   *   note    an element that shows whether the notes are level
   *
   * Returns { changed, now, stop }. Call changed after every local save.
   */
  function sync(opts) {
    var note = opts.note;
    var on = !!(opts.device && opts.device.base && window.fetch);
    var busy = false, queued = false, dirty = false, edits = 0;
    var timer = null, poll = null;

    function say(text) { if (note) note.textContent = text; }

    if (!on) {
      say(LOCAL);
      return { changed: function () {}, now: function () {}, stop: function () { say(''); } };
    }

    function body() {
      var out = { version: 1 };
      out[opts.field] = opts.read();
      return JSON.stringify(out);
    }

    function send(method, payload, outlive) {
      var init = {
        method: method,
        cache: 'no-store',
        headers: { 'authorization': 'Bearer ' + opts.device.key }
      };
      if (payload) {
        init.body = payload;
        init.headers['content-type'] = 'application/json';
        if (outlive && payload.length < BEACON_MAX) init.keepalive = true;
      }
      return fetch(opts.device.base + opts.path, init).then(function (r) {
        if (r.status === 401 || r.status === 403) {
          stop();
          say(DENIED);
          throw new Error('denied');
        }
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      });
    }

    // Take the store's list in. Returns true if this device still holds
    // something the store does not have, or has an older version of.
    function adopt(remote) {
      var theirs = remote && Array.isArray(remote[opts.field]) ? remote[opts.field] : [];
      var mine = opts.read();
      var merged = opts.merge(mine, theirs);
      if (JSON.stringify(merged) !== JSON.stringify(mine)) {
        opts.write(merged, canon(merged) !== canon(mine));
      }
      var seen = {};
      theirs.forEach(function (x) { if (usable(x)) seen[x.id] = x.updatedAt || 0; });
      return merged.some(function (x) {
        return usable(x) && (!(x.id in seen) || (x.updatedAt || 0) > seen[x.id]);
      });
    }

    function round(push, outlive) {
      return send(push ? 'PUT' : 'GET', push ? body() : null, outlive).then(function (remote) {
        var ahead = adopt(remote);
        // The store answers a PUT with the merged list, so one PUT settles it.
        if (ahead && !push) return round(true, outlive);
      });
    }

    function exchange(outlive) {
      if (!on) return;
      if (busy) { queued = true; return; }
      if (timer) { clearTimeout(timer); timer = null; }
      busy = true;
      var push = dirty;
      var at = edits;
      dirty = false;
      if (push) say(SYNCING);
      round(push, outlive).then(function () {
        if (edits !== at) dirty = true;      // edited while the request was out
        if (on) say(dirty ? SYNCING : SYNCED);
      }, function () {
        if (push || edits !== at) dirty = true;
        if (on) say(WAITING);
      }).then(function () {
        busy = false;
        if (!on) return;
        if (queued) { queued = false; exchange(); }
        else if (dirty && !timer) timer = setTimeout(exchange, PUSH_MS);
      });
    }

    function changed() {
      if (!on) return;
      edits++;
      dirty = true;
      say(SYNCING);
      if (timer) clearTimeout(timer);
      timer = setTimeout(exchange, PUSH_MS);
    }

    function seen() {
      if (document.visibilityState === 'visible') exchange();
      else if (dirty) exchange(true);        // leaving: send now, not in three seconds
    }

    function online() { exchange(); }

    function stop() {
      on = false;
      if (timer) clearTimeout(timer);
      if (poll) clearInterval(poll);
      document.removeEventListener('visibilitychange', seen);
      window.removeEventListener('pagehide', seen);
      window.removeEventListener('focus', online);
      window.removeEventListener('online', online);
      say('');
    }

    poll = setInterval(function () {
      if (document.visibilityState === 'visible') exchange();
    }, PULL_MS);
    document.addEventListener('visibilitychange', seen);
    window.addEventListener('pagehide', seen);
    window.addEventListener('focus', online);
    window.addEventListener('online', online);

    exchange();
    return { changed: changed, now: function () { exchange(); }, stop: stop };
  }

  window.Notes = { unlocked: unlocked, unlock: unlock, lock: lock, sync: sync };
}());
