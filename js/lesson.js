// Pantalla de una lección: 5 pasos (Explicación, Ejemplo, Mini práctica, Ejercicios, Resumen).
window.Lesson = (function () {
  var STEPS = ['Explicación', 'Ejemplo', 'Mini práctica', 'Ejercicios', 'Resumen'];

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }

  function exKey(lesson, ex) { return 'ex:' + lesson.id + ':' + ex.id; }
  function miniKey(lesson, i) { return 'mini:' + lesson.id + ':' + i; }

  function allExercisesSolved(lesson) {
    return (lesson.exercises || []).every(function (ex) { return Store.isSolved(exKey(lesson, ex)); });
  }

  // ---------- Paso 1: Explicación ----------
  function renderExplain(lesson, box) {
    (lesson.explain || []).forEach(function (b) {
      if (typeof b === 'string') { box.insertAdjacentHTML('beforeend', MD.render(b)); return; }
      if (b.type === 'analogy') box.appendChild(el('div', 'analogy', '<b>💡 Imagina:</b> ' + MD.inline(b.text)));
      else if (b.type === 'cg') box.appendChild(el('div', 'cg', '<b>🎬 En CG:</b> ' + MD.inline(b.text)));
      else if (b.type === 'figure') box.appendChild(el('div', 'figure', b.html));
    });
  }

  // ---------- Paso 2: Ejemplo ----------
  function renderExample(lesson, box) {
    var ex = lesson.example || {};
    if (ex.intro) box.insertAdjacentHTML('beforeend', MD.render(ex.intro));
    (ex.lines || []).forEach(function (ln, i) {
      var d = el('div', 'line');
      d.appendChild(el('pre', '', '<code>' + MD.esc(ln.code) + '</code>'));
      d.appendChild(el('div', 'note', '<b>Línea ' + (i + 1) + ':</b> ' + MD.inline(ln.note)));
      box.appendChild(d);
    });
    if (ex.output !== undefined) {
      var o = el('div', 'out');
      o.appendChild(el('div', 'muted', 'Lo que se ve en pantalla:'));
      o.appendChild(el('pre', '', '<code>' + MD.esc(ex.output) + '</code>'));
      box.appendChild(o);
    }
    if (ex.outro) box.insertAdjacentHTML('beforeend', MD.render(ex.outro));
  }

  // ---------- Pregunta de opción múltiple (también la usa Repaso) ----------
  function renderMCQ(item, key, info, onRight) {
    var c = el('div', 'card');
    c.appendChild(el('div', 'q', MD.inline(item.q)));
    var opts = el('div', 'opts');
    var answered = false;
    item.options.forEach(function (op, i) {
      var b = el('button', '', MD.inline(op));
      b.type = 'button';
      b.addEventListener('click', function () {
        if (answered) return;
        answered = true;
        var ok = i === item.answer;
        b.classList.add(ok ? 'right' : 'wrong');
        if (!ok) opts.children[item.answer].classList.add('right');
        var w = el('div', 'why ' + (ok ? 'ok' : 'ng'), (ok ? '✅ ¡Correcto! ' : '❌ No es esa. ') + MD.inline(item.why || ''));
        c.appendChild(w);
        if (ok) { Store.clearMistake(key); if (onRight) onRight(); }
        else Store.addMistake(key, info);
      });
      opts.appendChild(b);
    });
    c.appendChild(opts);
    return c;
  }

  function renderMini(lesson, box) {
    box.appendChild(el('p', 'muted', 'Preguntas rápidas para comprobar que lo has entendido.'));
    (lesson.mini || []).forEach(function (m, i) {
      box.appendChild(renderMCQ(m, miniKey(lesson, i), { type: 'mini', lesson: lesson.id, index: i }));
    });
  }

  // ---------- Paso 4: Ejercicios ----------
  function renderExercise(lesson, ex, idx, onSolved) {
    var key = exKey(lesson, ex);
    var c = el('div', 'card ex');
    var h = el('h3', '', 'Ejercicio ' + (idx + 1) + ': ' + MD.inline(ex.title));
    if (Store.isSolved(key)) h.appendChild(el('span', 'solved', 'Resuelto'));
    c.appendChild(h);
    c.insertAdjacentHTML('beforeend', MD.render(ex.prompt));
    var ed = Editor.create(ex.starter || '');
    c.appendChild(ed.el);

    var actions = el('div', 'actions');
    var run = el('button', 'primary', '▶ Ejecutar y comprobar'); run.type = 'button';
    var hintB = el('button', '', 'Pista'); hintB.type = 'button';
    var solB = el('button', '', 'Ver solución'); solB.type = 'button';
    solB.disabled = !Store.isSolved(key);
    actions.appendChild(run); actions.appendChild(hintB); actions.appendChild(solB);
    c.appendChild(actions);

    var status = el('div', 'status');
    var resBox = el('div');
    var hintBox = el('div');
    c.appendChild(status); c.appendChild(resBox); c.appendChild(hintBox);

    var hintN = 0, tries = 0;
    hintB.addEventListener('click', function () {
      var hs = ex.hints || [];
      if (hintN >= hs.length) { hintB.disabled = true; return; }
      hintBox.appendChild(el('div', 'hint', '💡 ' + MD.inline(hs[hintN])));
      hintN++;
      if (hintN >= hs.length) hintB.disabled = true;
    });
    solB.addEventListener('click', function () {
      if (!confirm('¿Ver la solución? Intenta primero un poco más si puedes.')) return;
      ed.set(ex.solution);
    });

    run.addEventListener('click', function () {
      run.disabled = true;
      status.textContent = 'Cargando Python… (solo tarda la primera vez)';
      resBox.innerHTML = '';
      PyRunner.run(ed.get(), ex.tests).then(function (r) {
        status.textContent = '';
        tries++;
        if (r.out) {
          resBox.appendChild(el('div', 'muted', 'Lo que se ve en pantalla:'));
          resBox.appendChild(el('pre', '', '<code>' + MD.esc(r.out) + '</code>'));
        }
        if (r.err) {
          resBox.appendChild(el('div', 'err', '⚠️ Error de Python:\n' + MD.esc(r.err)));
          resBox.appendChild(el('div', 'muted', 'Lee la última línea del error: dice qué pasó. Corrige y vuelve a ejecutar.'));
        }
        var ul = el('ul', 'results');
        var all = !r.err && r.results.length > 0;
        r.results.forEach(function (t) {
          ul.appendChild(el('li', t.ok ? 'ok' : 'ng', (t.ok ? '✔ ' : '✘ ') + MD.inline(t.msg)));
          if (!t.ok) all = false;
        });
        if (r.results.length) resBox.appendChild(ul);
        if (all) {
          resBox.appendChild(el('div', 'why ok', '🎉 ¡Muy bien! Ejercicio resuelto.'));
          if (!Store.isSolved(key)) {
            Store.setSolved(key);
            if (!h.querySelector('.solved')) h.appendChild(el('span', 'solved', 'Resuelto'));
          }
          Store.clearMistake(key);
          solB.disabled = false;
          if (onSolved) onSolved();
        } else {
          Store.addMistake(key, { type: 'ex', lesson: lesson.id, ex: ex.id, title: ex.title });
          if (tries >= 1) solB.disabled = false;
        }
      }).catch(function (e) {
        status.textContent = '⚠️ ' + e.message;
      }).then(function () { run.disabled = false; });
    });
    return c;
  }

  function renderExercises(lesson, box, onChange) {
    box.appendChild(el('p', 'muted', 'Escribe el código y pulsa «Ejecutar y comprobar». Las pruebas te dicen qué está bien y qué falta.'));
    (lesson.exercises || []).forEach(function (ex, i) {
      box.appendChild(renderExercise(lesson, ex, i, onChange));
    });
  }

  // ---------- Paso 5: Resumen ----------
  function renderSummary(lesson, box, onFinish) {
    var ul = el('ul', 'summary');
    (lesson.summary || []).forEach(function (s) { ul.appendChild(el('li', '', MD.inline(s))); });
    var c = el('div', 'card'); c.appendChild(el('h3', '', 'En 3 líneas')); c.appendChild(ul);
    box.appendChild(c);
    var ok = allExercisesSolved(lesson);
    var done = Store.isDone(lesson.id);
    var b = el('button', 'primary', done ? '✔ Lección terminada' : 'Terminar lección');
    b.type = 'button'; b.style.width = '100%';
    if (!ok && !done) {
      b.disabled = true;
      box.appendChild(el('p', 'muted center', 'Resuelve todos los ejercicios para terminar la lección.'));
    }
    b.addEventListener('click', function () { if (!Store.isDone(lesson.id)) Store.setDone(lesson.id); onFinish(); });
    box.appendChild(b);
  }

  // ---------- Pantalla completa ----------
  function render(root, lesson, meta, step, go) {
    root.innerHTML = '';
    root.appendChild(el('p', 'crumb', meta.module.icon + ' ' + MD.esc(meta.module.title) + ' · Lección ' + (meta.index + 1)));
    root.appendChild(el('h1', '', MD.esc(lesson.title) + ' <span class="muted">(' + MD.esc(lesson.en) + ')</span>'));

    var tabs = el('div', 'steps');
    STEPS.forEach(function (name, i) {
      var b = el('button', i === step ? 'on' : '', (i + 1) + '. ' + name);
      b.type = 'button';
      if (i === 3 && allExercisesSolved(lesson)) b.classList.add('done');
      b.addEventListener('click', function () { go(i); });
      tabs.appendChild(b);
    });
    root.appendChild(tabs);

    var box = el('div');
    root.appendChild(box);
    if (step === 0) renderExplain(lesson, box);
    else if (step === 1) renderExample(lesson, box);
    else if (step === 2) renderMini(lesson, box);
    else if (step === 3) renderExercises(lesson, box, function () {});
    else renderSummary(lesson, box, function () { location.hash = '#/'; });

    var nav = el('div', 'navrow');
    var prev = el('button', '', '← Anterior'); prev.type = 'button';
    prev.disabled = step === 0;
    prev.addEventListener('click', function () { go(step - 1); });
    nav.appendChild(prev);
    if (step < STEPS.length - 1) {
      var next = el('button', 'primary', 'Siguiente →'); next.type = 'button';
      next.addEventListener('click', function () { go(step + 1); });
      nav.appendChild(next);
    }
    root.appendChild(nav);
  }

  return { render: render, renderMCQ: renderMCQ, renderExercise: renderExercise, STEPS: STEPS };
})();
