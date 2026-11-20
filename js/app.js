// Routes: #/ (path), #/l/p03/0 (lesson and step), #/review, #/mock
(function () {
  var app = document.getElementById('app');

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }

  // Flat list in path order
  function flat() {
    var out = [];
    TA.curriculum.forEach(function (m) {
      m.lessons.forEach(function (l, i) { out.push({ id: l.id, title: l.title, en: l.en, optional: !!l.optional, module: m, index: i }); });
    });
    return out;
  }
  function find(id) { return flat().filter(function (x) { return x.id === id; })[0]; }
  function available(id) { return !!TA.lessons[id]; }
  function unlocked(id) {
    if (Store.free()) return true;
    var list = flat();
    for (var i = 0; i < list.length; i++) {
      if (list[i].id !== id) continue;
      if (list[i].optional) return true;
      for (var j = i - 1; j >= 0; j--) {
        if (list[j].optional || !available(list[j].id)) continue;
        return Store.isDone(list[j].id);
      }
      return true;
    }
    return false;
  }

  // ---------- Path ----------
  function viewRoute() {
    var list = flat();
    var req = list.filter(function (x) { return !x.optional; });
    var doneN = req.filter(function (x) { return Store.isDone(x.id); }).length;
    app.innerHTML = '';
    app.appendChild(el('h1', '', 'Your study path'));
    app.appendChild(el('p', 'muted', 'Technical Artist interview prep for cinematics: Python, Maya, 3D math and tool design.'));
    var c = el('div', 'card');
    c.appendChild(el('div', '', '<b>' + doneN + '</b> of ' + req.length + ' lessons done'));
    c.insertAdjacentHTML('beforeend', '<div class="bar"><i style="width:' + Math.round(doneN / req.length * 100) + '%"></i></div>');
    var tg = el('div', 'toggle');
    tg.appendChild(el('div', '', '<b>Free mode</b><div class="muted">Unlock every lesson and study in any order.</div>'));
    var sw = el('label', 'switch', '<input type="checkbox"' + (Store.free() ? ' checked' : '') + '><span></span>');
    sw.querySelector('input').addEventListener('change', function (e) { Store.setFree(e.target.checked); viewRoute(); });
    tg.appendChild(sw);
    c.appendChild(tg);
    app.appendChild(c);

    var next = list.filter(function (x) { return !x.optional && available(x.id) && !Store.isDone(x.id) && unlocked(x.id); })[0];
    if (next) {
      var go = el('a', 'btn primary block', 'Continue: ' + MD.esc(next.title));
      go.href = '#/l/' + next.id + '/' + Store.getStep(next.id);
      app.appendChild(go);
    }

    TA.curriculum.forEach(function (m) {
      var mc = el('div', 'card module');
      var mreq = m.lessons.filter(function (l) { return !l.optional; });
      var md = mreq.filter(function (l) { return Store.isDone(l.id); }).length;
      mc.appendChild(el('h2', '', MD.esc(m.title) + ' <span class="muted">' + md + '/' + mreq.length + '</span>'));
      if (m.note) mc.appendChild(el('p', 'muted', MD.inline(m.note)));
      m.lessons.forEach(function (l, i) {
        var st, cls, href = null;
        if (Store.isDone(l.id)) { st = '✓'; cls = 'done'; href = '#/l/' + l.id + '/0'; }
        else if (!available(l.id)) { st = '…'; cls = 'soon'; }
        else if (unlocked(l.id)) { st = i + 1; cls = 'open'; href = '#/l/' + l.id + '/' + Store.getStep(l.id); }
        else { st = '<svg class="lock" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-label="locked"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>'; cls = 'locked'; }
        var row = el(href ? 'a' : 'div', 'lesson-row ' + cls);
        if (href) row.href = href;
        var sub = cls === 'soon' ? 'Coming soon' : (cls === 'locked' ? 'Finish the previous lesson to unlock it' : l.en);
        if (l.optional && cls !== 'done') sub = 'Optional · quick refresher';
        row.innerHTML = '<span class="st">' + st + '</span><span class="tt">' + MD.esc(l.title) + '<small>' + MD.esc(sub) + '</small></span>';
        mc.appendChild(row);
      });
      app.appendChild(mc);
    });

    var off = el('p', 'muted center small', '');
    app.appendChild(off);
    offlineStatus(off);

    var reset = el('button', 'ghost', 'Reset my progress'); reset.type = 'button';
    reset.addEventListener('click', function () { if (confirm('Delete all your progress? This cannot be undone.')) { Store.reset(); viewRoute(); } });
    var rc = el('div', 'center'); rc.appendChild(reset); app.appendChild(rc);
  }

  // ---------- Lesson ----------
  function viewLesson(id, step) {
    var lesson = TA.lessons[id], meta = find(id);
    if (!lesson || !meta) { app.innerHTML = '<div class="empty">This lesson is not ready yet.<br><br><a href="#/">Back to the path</a></div>'; return; }
    if (!unlocked(id)) { app.innerHTML = '<div class="empty">Finish the previous lesson to unlock this one.<br>(Or turn on “Free mode” on the path.)<br><br><a href="#/">Back to the path</a></div>'; return; }
    step = Math.max(0, Math.min(Lesson.STEPS.length - 1, step || 0));
    Store.setStep(id, step);
    Lesson.render(app, lesson, meta, step, function (n) { location.hash = '#/l/' + id + '/' + n; });
  }

  // ---------- Review ----------
  function viewReview() {
    var ms = Store.mistakes(), keys = Object.keys(ms);
    app.innerHTML = '';
    app.appendChild(el('h1', '', 'Review your mistakes'));
    if (!keys.length) {
      app.appendChild(el('div', 'empty', 'Nothing to review.<br>Questions and exercises you get wrong will show up here.'));
      return;
    }
    app.appendChild(el('p', 'muted', 'Only what you got wrong. Once you get it right, it leaves the list.'));
    keys.forEach(function (k) {
      var info = ms[k], lesson = TA.lessons[info.lesson];
      if (!lesson) return;
      if (info.type === 'mini' || info.type === 'extra') {
        var arr = info.type === 'mini' ? lesson.mini : lesson.extra;
        var item = arr && arr[info.index];
        if (!item) return;
        app.appendChild(el('div', 'muted', MD.esc(lesson.title)));
        app.appendChild(Lesson.renderMCQ(item, k, info, null));
      } else if (info.type === 'ex') {
        var ex = (lesson.exercises || []).filter(function (e) { return e.id === info.ex; })[0];
        if (!ex) return;
        app.appendChild(el('div', 'muted', MD.esc(lesson.title)));
        app.appendChild(Lesson.renderExercise(lesson, ex, lesson.exercises.indexOf(ex), null));
      }
    });
  }

  // ---------- Mock exam ----------
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function pool() {
    var out = [];
    flat().forEach(function (m) {
      var L = TA.lessons[m.id];
      if (!L) return;
      (L.mini || []).forEach(function (q, i) { out.push({ q: q, key: 'mini:' + L.id + ':' + i, info: { type: 'mini', lesson: L.id, index: i }, module: m.module }); });
      (L.extra || []).forEach(function (q, i) { out.push({ q: q, key: 'extra:' + L.id + ':' + i, info: { type: 'extra', lesson: L.id, index: i }, module: m.module }); });
    });
    return out;
  }
  function designCases() {
    var out = [];
    flat().forEach(function (m) {
      var L = TA.lessons[m.id];
      if (!L || m.module.id !== 'design') return;
      (L.exercises || []).forEach(function (ex) { if (ex.kind === 'free') out.push({ lesson: L, ex: ex }); });
    });
    return out;
  }
  function mmss(ms) { var s = Math.round(ms / 1000); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }

  function viewExam() {
    var list = flat().filter(function (x) { return !x.optional && available(x.id); });
    var all = list.length && list.every(function (x) { return Store.isDone(x.id); });
    app.innerHTML = '';
    app.appendChild(el('h1', '', 'Mock interview'));
    var c = el('div', 'card');
    c.innerHTML = MD.render('Random questions from **every module**, with a timer. At the end you see your score per module and your weak spots.\n\nQuestions you miss go to **Review**.');
    if (!all) c.appendChild(el('div', 'warnbox', '<b>You have not finished every lesson yet.</b> You can still take the mock exam, but it will include topics you have not seen.'));
    var n = 15;
    var sel = el('div', 'keys');
    [10, 15, 25].forEach(function (k) {
      var b = el('button', k === n ? 'primary' : '', k + ' questions'); b.type = 'button';
      b.addEventListener('click', function () { n = k; [].forEach.call(sel.children, function (x) { x.className = ''; }); b.className = 'primary'; });
      sel.appendChild(b);
    });
    c.appendChild(sel);
    var lab = el('label', 'check', '<input type="checkbox" checked><span>Finish with a tool design case (free answer)</span>');
    c.appendChild(lab);
    var start = el('button', 'primary', 'Start'); start.type = 'button'; start.style.width = '100%'; start.style.marginTop = '10px';
    start.addEventListener('click', function () { runExam(n, lab.querySelector('input').checked); });
    c.appendChild(start);
    app.appendChild(c);

    var hist = Store.exams();
    if (hist.length) {
      var hc = el('div', 'card'); hc.appendChild(el('h3', '', 'Your recent mock exams'));
      var ul = el('ul');
      hist.slice().reverse().slice(0, 6).forEach(function (h) {
        ul.appendChild(el('li', '', new Date(h.at).toLocaleDateString() + ' · <b>' + h.ok + '/' + h.total + '</b> · ' + mmss(h.ms) + (h.weak ? ' · weak spot: ' + MD.esc(h.weak) : '')));
      });
      hc.appendChild(ul); app.appendChild(hc);
    }
  }

  function runExam(n, withDesign) {
    var qs = shuffle(pool()).slice(0, n);
    if (!qs.length) { app.innerHTML = '<div class="empty">No questions yet.</div>'; return; }
    var i = 0, t0 = Date.now(), res = [], timer = null;
    function header() {
      var h = el('div', 'examhead');
      var tm = el('span', 'timer', '0:00');
      h.appendChild(el('span', '', 'Question <b>' + (i + 1) + '</b> of ' + qs.length));
      h.appendChild(tm);
      clearInterval(timer);
      timer = setInterval(function () { tm.textContent = mmss(Date.now() - t0); }, 1000);
      tm.textContent = mmss(Date.now() - t0);
      return h;
    }
    function show() {
      app.innerHTML = '';
      app.appendChild(header());
      app.appendChild(el('div', 'bar', '<i style="width:' + Math.round(i / qs.length * 100) + '%"></i>'));
      var item = qs[i];
      app.appendChild(el('div', 'muted', MD.esc(item.module.title)));
      var nextB = el('button', 'primary', i < qs.length - 1 ? 'Next →' : 'See results'); nextB.type = 'button';
      nextB.style.width = '100%'; nextB.disabled = true;
      app.appendChild(Lesson.renderMCQ(item.q, item.key, item.info, function (ok) { res.push({ ok: ok, item: item }); nextB.disabled = false; }));
      nextB.addEventListener('click', function () { i++; if (i < qs.length) show(); else if (withDesign) design(); else finish(); });
      app.appendChild(nextB);
      window.scrollTo(0, 0);
    }
    function design() {
      var cs = designCases();
      if (!cs.length) { finish(); return; }
      var pick = cs[Math.floor(Math.random() * cs.length)];
      app.innerHTML = '';
      app.appendChild(header());
      app.appendChild(el('h2', '', 'Design case'));
      app.appendChild(el('p', 'muted', 'Answer as you would in the interview. Aim for about 3 minutes.'));
      app.appendChild(Lesson.renderExercise(pick.lesson, pick.ex, 0, null));
      var fin = el('button', 'primary', 'See results'); fin.type = 'button'; fin.style.width = '100%';
      fin.addEventListener('click', finish);
      app.appendChild(fin);
      window.scrollTo(0, 0);
    }
    function finish() {
      clearInterval(timer);
      var ms = Date.now() - t0, ok = res.filter(function (r) { return r.ok; }).length;
      var by = {};
      res.forEach(function (r) {
        var k = r.item.module.title;
        by[k] = by[k] || { ok: 0, total: 0 };
        by[k].total++; if (r.ok) by[k].ok++;
      });
      var weak = null, worst = 2;
      Object.keys(by).forEach(function (k) { var p = by[k].ok / by[k].total; if (p < worst) { worst = p; weak = k; } });
      if (worst >= 0.8) weak = null;
      Store.addExam({ at: Date.now(), ok: ok, total: res.length, ms: ms, weak: weak });
      app.innerHTML = '';
      app.appendChild(el('h1', '', 'Results'));
      var c = el('div', 'card center');
      c.appendChild(el('div', 'big', ok + ' / ' + res.length));
      c.appendChild(el('div', 'muted', 'Time: ' + mmss(ms) + ' · ' + Math.round(ms / 1000 / Math.max(1, res.length)) + ' s per question'));
      app.appendChild(c);
      var bc = el('div', 'card'); bc.appendChild(el('h3', '', 'Score per module'));
      Object.keys(by).forEach(function (k) {
        var p = Math.round(by[k].ok / by[k].total * 100);
        bc.appendChild(el('div', '', MD.esc(k) + ' · <b>' + by[k].ok + '/' + by[k].total + '</b> (' + p + '%)'));
        bc.appendChild(el('div', 'bar', '<i style="width:' + p + '%;' + (p < 60 ? 'background:var(--ng)' : '') + '"></i>'));
      });
      app.appendChild(bc);
      if (weak) app.appendChild(el('div', 'warnbox', '<b>Weak spot:</b> ' + MD.esc(weak) + '. Go over its lessons and the “Review” tab.'));
      else app.appendChild(el('div', 'why ok', 'Well balanced! No module is below 80%.'));
      var wrong = res.filter(function (r) { return !r.ok; });
      if (wrong.length) {
        var wc = el('div', 'card'); wc.appendChild(el('h3', '', 'To review'));
        var ul = el('ul');
        wrong.forEach(function (r) { ul.appendChild(el('li', '', MD.inline(r.item.q.q) + ' <span class="muted">(' + MD.esc(TA.lessons[r.item.info.lesson].title) + ')</span>')); });
        wc.appendChild(ul); app.appendChild(wc);
      }
      var again = el('a', 'btn primary block', 'Another mock exam'); again.href = '#/mock';
      app.appendChild(again);
      window.scrollTo(0, 0);
    }
    show();
  }

  // ---------- Offline (service worker) ----------
  function offlineStatus(box) {
    if (!('serviceWorker' in navigator) || !window.caches) return;
    caches.has('ta-pyodide-v0.26.4').then(function (has) {
      if (!has) { box.textContent = 'Offline: preparing…'; return null; }
      return caches.open('ta-pyodide-v0.26.4').then(function (c) {
        return c.match('https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.asm.wasm');
      }).then(function (hit) {
        box.textContent = hit ? 'Ready to use offline (lessons and Python).' : 'Offline: lessons ready; Python still downloading.';
      });
    }).catch(function () {});
  }
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    var hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.register('sw.js').catch(function () {});
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (hadController) location.reload();     // a new version was installed
      hadController = true;
    });
  }

  // ---------- Router ----------
  function route() {
    var h = location.hash || '#/';
    var tab = 'path';
    var m = h.match(/^#\/l\/([a-z0-9]+)(?:\/(\d+))?/);
    var t = h.match(/^#\/tool\/([a-z0-9_]+)(?:\/(\w+))?(?:\/(\d+))?(?:\/(\d+))?/);
    ToolsView.closePanel();
    if (t) { tab = 'tools'; ToolsView.tool(app, t[1], t[2], t[3], t[4]); }
    else if (h.indexOf('#/tools') === 0) { tab = 'tools'; ToolsView.list(app); }
    else if (m) viewLesson(m[1], parseInt(m[2] || '0', 10));
    else if (h.indexOf('#/review') === 0) { tab = 'review'; viewReview(); }
    else if (h.indexOf('#/mock') === 0) { tab = 'mock'; viewExam(); }
    else viewRoute();
    document.querySelectorAll('.tabbar a').forEach(function (a) { a.classList.toggle('on', a.dataset.tab === tab); });
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);

  // ---------- Light / dark theme ----------
  var tb = document.getElementById('theme'), modes = ['auto', 'light', 'dark'], names = { auto: 'Theme: auto', light: 'Theme: light', dark: 'Theme: dark' };
  function applyTheme(mo) {
    if (mo === 'auto') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', mo);
    tb.textContent = names[mo];
    try { localStorage.setItem('ta-theme', mo); } catch (e) {}
  }
  var t0 = 'auto'; try { t0 = localStorage.getItem('ta-theme') || 'auto'; } catch (e) {}
  applyTheme(t0);
  tb.addEventListener('click', function () {
    var cur = document.documentElement.getAttribute('data-theme') || 'auto';
    applyTheme(modes[(modes.indexOf(cur) + 1) % 3]);
  });

  // ---------- Load the lessons (one file per lesson, from curriculum.js) ----------
  // Files that do not exist yet show up as “Coming soon”.
  var files = [];
  TA.curriculum.forEach(function (m) { m.lessons.forEach(function (l) { files.push('content/' + m.id + '/' + l.id + '.js'); }); });
  var pending = files.length;
  app.innerHTML = '<div class="empty">Loading…</div>';
  files.forEach(function (src) {
    var s = document.createElement('script');
    s.src = src;
    s.onload = s.onerror = function () { pending--; if (!pending) route(); };
    document.body.appendChild(s);
  });
  if (!pending) route();
})();
