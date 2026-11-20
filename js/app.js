// Rutas: #/ (ruta), #/l/p01/0 (lección y paso), #/repaso, #/simulacro
(function () {
  var app = document.getElementById('app');

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }

  // Lista plana en orden de la ruta
  function flat() {
    var out = [];
    TA.curriculum.forEach(function (m) {
      m.lessons.forEach(function (l, i) { out.push({ id: l.id, title: l.title, en: l.en, module: m, index: i }); });
    });
    return out;
  }
  function find(id) { return flat().filter(function (x) { return x.id === id; })[0]; }
  function available(id) { return !!TA.lessons[id]; }
  function unlocked(id) {
    if (Store.free()) return true;
    var list = flat();
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return i === 0 || Store.isDone(list[i - 1].id);
    }
    return false;
  }

  // ---------- Ruta ----------
  function viewRoute() {
    var list = flat();
    var built = list.filter(function (x) { return available(x.id); });
    var doneN = list.filter(function (x) { return Store.isDone(x.id); }).length;
    app.innerHTML = '';
    app.appendChild(el('h1', '', 'Tu ruta de estudio'));
    app.appendChild(el('p', 'muted', 'Preparación para la entrevista técnica de TA (Technical Artist): Python, Maya, matemáticas 3D y diseño de herramientas.'));
    var c = el('div', 'card');
    c.appendChild(el('div', '', '<b>' + doneN + '</b> de ' + list.length + ' lecciones terminadas'));
    c.insertAdjacentHTML('beforeend', '<div class="bar"><i style="width:' + Math.round(doneN / list.length * 100) + '%"></i></div>');
    var tg = el('div', 'toggle');
    tg.appendChild(el('div', '', '<b>Modo libre</b><div class="muted">Abre todas las lecciones, sin seguir el orden.</div>'));
    var sw = el('label', 'switch', '<input type="checkbox"' + (Store.free() ? ' checked' : '') + '><span></span>');
    sw.querySelector('input').addEventListener('change', function (e) { Store.setFree(e.target.checked); viewRoute(); });
    tg.appendChild(sw);
    c.appendChild(tg);
    app.appendChild(c);

    var next = list.filter(function (x) { return available(x.id) && !Store.isDone(x.id) && unlocked(x.id); })[0];
    if (next) {
      var go = el('a', 'btn primary', '▶ Continuar: ' + MD.esc(next.title));
      go.href = '#/l/' + next.id + '/' + Store.getStep(next.id);
      go.style.display = 'block'; go.style.textAlign = 'center'; go.style.textDecoration = 'none';
      app.appendChild(go);
    }

    TA.curriculum.forEach(function (m) {
      var mc = el('div', 'card module');
      var md = m.lessons.filter(function (l) { return Store.isDone(l.id); }).length;
      mc.appendChild(el('h2', '', m.icon + ' ' + MD.esc(m.title) + ' <span class="muted">' + md + '/' + m.lessons.length + '</span>'));
      m.lessons.forEach(function (l, i) {
        var st, cls, href = null;
        if (Store.isDone(l.id)) { st = '✓'; cls = 'done'; href = '#/l/' + l.id + '/0'; }
        else if (!available(l.id)) { st = '…'; cls = 'soon'; }
        else if (unlocked(l.id)) { st = i + 1; cls = 'open'; href = '#/l/' + l.id + '/' + Store.getStep(l.id); }
        else { st = '🔒'; cls = 'locked'; }
        var row = el(href ? 'a' : 'div', 'lesson-row ' + cls);
        if (href) row.href = href;
        var sub = cls === 'soon' ? 'Próximamente' : (cls === 'locked' ? 'Termina la lección anterior para abrirla' : l.en);
        row.innerHTML = '<span class="st">' + st + '</span><span class="tt">' + MD.esc(l.title) + '<small>' + MD.esc(sub) + '</small></span>';
        mc.appendChild(row);
      });
      app.appendChild(mc);
    });

    var reset = el('button', 'ghost', 'Borrar mi progreso'); reset.type = 'button';
    reset.addEventListener('click', function () { if (confirm('¿Borrar todo tu progreso? No se puede deshacer.')) { Store.reset(); viewRoute(); } });
    var rc = el('div', 'center'); rc.appendChild(reset); app.appendChild(rc);
  }

  // ---------- Lección ----------
  function viewLesson(id, step) {
    var lesson = TA.lessons[id], meta = find(id);
    if (!lesson || !meta) { app.innerHTML = '<div class="empty">Esta lección todavía no está lista.</div>'; return; }
    if (!unlocked(id)) { app.innerHTML = '<div class="empty">🔒 Termina la lección anterior para abrir esta.<br><br><a href="#/">Volver a la ruta</a></div>'; return; }
    step = Math.max(0, Math.min(Lesson.STEPS.length - 1, step || 0));
    Store.setStep(id, step);
    Lesson.render(app, lesson, meta, step, function (n) { location.hash = '#/l/' + id + '/' + n; });
  }

  // ---------- Repaso ----------
  function viewReview() {
    var ms = Store.mistakes(), keys = Object.keys(ms);
    app.innerHTML = '';
    app.appendChild(el('h1', '', 'Repaso de errores'));
    if (!keys.length) {
      app.appendChild(el('div', 'empty', '🎉 No tienes errores pendientes.<br>Las preguntas que falles aparecerán aquí.'));
      return;
    }
    app.appendChild(el('p', 'muted', 'Aquí están solo las preguntas y ejercicios que fallaste. Cuando los aciertes, desaparecen de la lista.'));
    keys.forEach(function (k) {
      var info = ms[k], lesson = TA.lessons[info.lesson];
      if (!lesson) return;
      if (info.type === 'mini') {
        var item = lesson.mini[info.index];
        if (!item) return;
        app.appendChild(el('div', 'muted', MD.esc(lesson.title)));
        app.appendChild(Lesson.renderMCQ(item, k, info, null));
      } else if (info.type === 'ex') {
        var ex = (lesson.exercises || []).filter(function (e) { return e.id === info.ex; })[0];
        if (!ex) return;
        var idx = lesson.exercises.indexOf(ex);
        app.appendChild(el('div', 'muted', MD.esc(lesson.title)));
        app.appendChild(Lesson.renderExercise(lesson, ex, idx, null));
      }
    });
  }

  // ---------- Simulacro ----------
  function viewExam() {
    var list = flat(), all = list.every(function (x) { return Store.isDone(x.id); });
    app.innerHTML = '';
    app.appendChild(el('h1', '', 'Simulacro de entrevista'));
    app.appendChild(el('div', 'card', all
      ? 'El simulacro estará listo pronto.'
      : '⏱️ El simulacro se abre cuando termines todas las lecciones. Mezclará preguntas de todos los temas, medirá el tiempo y te mostrará tus puntos débiles.'));
  }

  // ---------- Router ----------
  function route() {
    var h = location.hash || '#/';
    var tab = 'ruta';
    var m = h.match(/^#\/l\/([a-z0-9]+)(?:\/(\d+))?/);
    if (m) viewLesson(m[1], parseInt(m[2] || '0', 10));
    else if (h.indexOf('#/repaso') === 0) { tab = 'repaso'; viewReview(); }
    else if (h.indexOf('#/simulacro') === 0) { tab = 'simulacro'; viewExam(); }
    else viewRoute();
    document.querySelectorAll('.tabbar a').forEach(function (a) { a.classList.toggle('on', a.dataset.tab === tab); });
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);

  // ---------- Tema claro / oscuro ----------
  var tb = document.getElementById('theme'), modes = ['auto', 'light', 'dark'], names = { auto: 'Tema: auto', light: 'Tema: claro', dark: 'Tema: oscuro' };
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

  route();
})();
