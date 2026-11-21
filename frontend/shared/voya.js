/* voya.js — session + API helper shared by every page (plain JS, no build step).
 *
 * The session token is issued by the Flask backend and sent as
 * `Authorization: Bearer <token>` on every /api call. `voya_user_name` is kept
 * for display only; the server never trusts anything stored here.
 */
(function () {
  var TOKEN_KEY = 'voya_token';
  var NAME_KEY  = 'voya_user_name';
  var NEXT_KEY  = 'voya_next';
  var LEGACY    = ['voya_user_email', 'voya_access_token'];

  function store(fn) { try { return fn(); } catch (e) { return null; } }

  function decode(token) {
    try {
      var part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(atob(part));
    } catch (e) { return null; }
  }

  function clear() {
    store(function () {
      [TOKEN_KEY, NAME_KEY].concat(LEGACY).forEach(function (k) { localStorage.removeItem(k); });
    });
  }

  function getToken() {
    var token = store(function () { return localStorage.getItem(TOKEN_KEY); });
    if (!token) return null;
    var payload = decode(token);
    if (!payload || !payload.exp || payload.exp * 1000 <= Date.now()) { clear(); return null; }
    return token;
  }

  function setSession(token, user) {
    store(function () {
      localStorage.setItem(TOKEN_KEY, token);
      if (user && user.name) localStorage.setItem(NAME_KEY, user.name);
      LEGACY.forEach(function (k) { localStorage.removeItem(k); });
    });
  }

  function userName() {
    return store(function () { return localStorage.getItem(NAME_KEY); }) || '';
  }

  function setUserName(name) {
    store(function () { if (name) localStorage.setItem(NAME_KEY, name); });
  }

  // Only ever redirect inside the app — never to an arbitrary URL.
  function isSafeNext(n) { return typeof n === 'string' && /^\/app(\/|\?|#|$)/.test(n); }

  function nextFromQuery() {
    var n = new URLSearchParams(window.location.search).get('next');
    return isSafeNext(n) ? n : '/app';
  }

  function rememberNext() {
    store(function () { sessionStorage.setItem(NEXT_KEY, nextFromQuery()); });
  }

  function consumeNext() {
    var n = store(function () {
      var v = sessionStorage.getItem(NEXT_KEY);
      sessionStorage.removeItem(NEXT_KEY);
      return v;
    });
    return isSafeNext(n) ? n : '/app';
  }

  function loginUrl() {
    return '/login?next=' + encodeURIComponent(window.location.pathname + window.location.search);
  }

  function requireAuth() {
    if (getToken()) return true;
    clear();
    window.location.replace(loginUrl());
    return false;
  }

  function redirectIfAuthed() {
    if (getToken()) { window.location.replace(nextFromQuery()); return true; }
    return false;
  }

  function logout() {
    clear();
    window.location.replace('/login');
  }

  /* api(path, { method, body, form }) → { ok, status, data, error }
   * Never throws. On 401 with an active session it clears storage and
   * redirects to /login (session expired or tampered with). */
  function api(path, opts) {
    opts = opts || {};
    var headers = {};
    var token = getToken();
    if (token) headers.Authorization = 'Bearer ' + token;
    var payload;
    if (opts.form) {
      payload = opts.form;
    } else if (opts.body !== undefined) {
      headers['Content-Type'] = 'application/json';
      payload = JSON.stringify(opts.body);
    }
    return fetch(path, { method: opts.method || 'GET', headers: headers, body: payload })
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (data) {
          if (res.status === 401 && token) {
            clear();
            window.location.replace(loginUrl());
            return { ok: false, status: 401, data: data, error: data.error || 'Your session has expired. Please log in again.' };
          }
          if (!res.ok || data.success === false) {
            return { ok: false, status: res.status, data: data,
                     error: data.error || ('Something went wrong (' + res.status + '). Please try again.') };
          }
          return { ok: true, status: res.status, data: data };
        });
      })
      .catch(function () {
        return { ok: false, status: 0, data: {}, error: "Can't reach Voya right now. Check your connection and try again." };
      });
  }

  /* stream(path, body, onEvent) → Promise<{ ok, error, result }>
   * POSTs JSON and reads a Server-Sent Events response, calling onEvent for each
   * {type: …} event as it arrives. Falls back to fallbackPath (plain JSON) when
   * the browser can't stream. Never throws. */
  function stream(path, body, onEvent, fallbackPath) {
    var token = getToken();
    var headers = { 'Content-Type': 'application/json', Accept: 'text/event-stream' };
    if (token) headers.Authorization = 'Bearer ' + token;
    var canStream = typeof TextDecoder !== 'undefined' && window.ReadableStream;
    if (!canStream && fallbackPath) {
      return api(fallbackPath, { method: 'POST', body: body }).then(function (r) {
        if (r.ok) onEvent(Object.assign({ type: 'result' }, r.data));
        return { ok: r.ok, error: r.error, result: r.ok ? r.data : null };
      });
    }
    return fetch(path, { method: 'POST', headers: headers, body: JSON.stringify(body) })
      .then(function (res) {
        var type = res.headers.get('Content-Type') || '';
        if (!res.ok || type.indexOf('text/event-stream') === -1) {
          return res.json().catch(function () { return {}; }).then(function (data) {
            if (res.status === 401 && token) { clear(); window.location.replace(loginUrl()); }
            return { ok: false, error: data.error || ('Something went wrong (' + res.status + '). Please try again.') };
          });
        }
        var reader = res.body.getReader(), decoder = new TextDecoder(), buf = '', last = { ok: false, error: 'The connection closed early. Please try again.' };
        function pump() {
          return reader.read().then(function (chunk) {
            if (chunk.done) return last;
            buf += decoder.decode(chunk.value, { stream: true });
            var parts = buf.split('\n\n');
            buf = parts.pop();
            parts.forEach(function (part) {
              part.split('\n').forEach(function (line) {
                if (line.indexOf('data: ') !== 0) return;
                var ev;
                try { ev = JSON.parse(line.slice(6)); } catch (e) { return; }
                if (ev.type === 'result') last = { ok: true, result: ev };
                if (ev.type === 'error') last = { ok: false, error: ev.error };
                onEvent(ev);
              });
            });
            return pump();
          });
        }
        return pump();
      })
      .catch(function () {
        return { ok: false, error: "Can't reach Voya right now. Check your connection and try again." };
      });
  }

  /* Dates are stored as YYYY-MM-DD; older trips may hold pre-formatted text. */
  function formatDate(value, opts) {
    if (!value) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      var d = new Date(value + 'T00:00:00');
      return d.toLocaleDateString('en-US', opts || { month: 'short', day: 'numeric', year: 'numeric' });
    }
    return value;
  }

  function parseDate(value) {
    if (!value) return null;
    var d = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(value + 'T00:00:00') : new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }

  window.Voya = {
    getToken: getToken, setSession: setSession, clear: clear, logout: logout,
    requireAuth: requireAuth, redirectIfAuthed: redirectIfAuthed,
    rememberNext: rememberNext, consumeNext: consumeNext, nextFromQuery: nextFromQuery,
    userName: userName, setUserName: setUserName,
    api: api, stream: stream, formatDate: formatDate, parseDate: parseDate,
  };
})();
