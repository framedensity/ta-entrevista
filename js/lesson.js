// Lesson screen: 5 steps (Explanation, Example, Quick check, Exercises, Summary).
window.Lesson = (function () {
  var STEPS = ['Explanation', 'Example', 'Quick check', 'Exercises', 'Summary'];

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

  // ---------- Step 1: Explanation ----------
  function renderBlocks(blocks, box) {
    (blocks || []).forEach(function (b) {
      if (typeof b === 'string') { box.insertAdjacentHTML('beforeend', MD.render(b)); return; }
      if (b.type === 'analogy') box.appendChild(el('div', 'analogy', '<b>Think of it like this:</b> ' + MD.inline(b.text)));
      else if (b.type === 'cg') box.appendChild(el('div', 'cg', '<b>In CG:</b> ' + MD.inline(b.text)));
      else if (b.type === 'tip') box.appendChild(el('div', 'tipbox', '<b>In the interview:</b> ' + MD.inline(b.text)));
      else if (b.type === 'warn') box.appendChild(el('div', 'warnbox', '<b>Watch out:</b> ' + MD.inline(b.text)));
      else if (b.type === 'figure') box.appendChild(el('div', 'figure', b.html));
      else if (b.type === 'viz') { var v = el('div', 'figure viz'); box.appendChild(v); Viz.mount(b.name, v); }
      else if (b.type === 'compare') {
        var g = el('div', 'compare');
        var bad = el('div', 'cmp bad'); bad.appendChild(el('div', 'cmp-t', '✗ ' + MD.inline(b.badTitle || 'Slow / fragile')));
        bad.insertAdjacentHTML('beforeend', MD.render('```python\n' + b.bad + '\n```'));
        var good = el('div', 'cmp good'); good.appendChild(el('div', 'cmp-t', '✓ ' + MD.inline(b.goodTitle || 'Better')));
        good.insertAdjacentHTML('beforeend', MD.render('```python\n' + b.good + '\n```'));
        g.appendChild(bad); g.appendChild(good);
        if (b.note) g.appendChild(el('div', 'muted', MD.inline(b.note)));
        box.appendChild(g);
      }
    });
  }

  // ---------- Step 2: Example ----------
  function renderExample(lesson, box) {
    var ex = lesson.example || {};
    if (ex.intro) box.insertAdjacentHTML('beforeend', MD.render(ex.intro));
    (ex.lines || []).forEach(function (ln, i) {
      var d = el('div', 'line');
      d.appendChild(el('pre', '', '<code>' + MD.esc(ln.code) + '</code>'));
      d.appendChild(el('div', 'note', '<b>' + (ln.label || ('Line ' + (i + 1))) + ':</b> ' + MD.inline(ln.note)));
      box.appendChild(d);
    });
    if (ex.output !== undefined) {
      var o = el('div', 'out');
      o.appendChild(el('div', 'muted', 'Output:'));
      o.appendChild(el('pre', '', '<code>' + MD.esc(ex.output) + '</code>'));
      box.appendChild(o);
    }
    if (ex.outro) box.insertAdjacentHTML('beforeend', MD.render(ex.outro));
  }

  // ---------- Multiple choice question (also used by Review and Mock exam) ----------
  function renderMCQ(item, key, info, onAnswer) {
    var c = el('div', 'card');
    c.appendChild(el('div', 'q', MD.inline(item.q)));
    if (item.code) c.insertAdjacentHTML('beforeend', MD.render('```python\n' + item.code + '\n```'));
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
        c.appendChild(el('div', 'why ' + (ok ? 'ok' : 'ng'), (ok ? 'Correct. ' : 'Not that one. ') + MD.inline(item.why || '')));
        if (key) { if (ok) Store.clearMistake(key); else Store.addMistake(key, info); }
        if (onAnswer) onAnswer(ok);
      });
      opts.appendChild(b);
    });
    c.appendChild(opts);
    return c;
  }

  function renderMini(lesson, box) {
    box.appendChild(el('p', 'muted', 'Quick questions to check you got it.'));
    (lesson.mini || []).forEach(function (m, i) {
      box.appendChild(renderMCQ(m, miniKey(lesson, i), { type: 'mini', lesson: lesson.id, index: i }));
    });
  }

  // ---------- Code exercise ----------
  function renderCodeExercise(lesson, ex, idx, onSolved) {
    var key = exKey(lesson, ex);
    var c = el('div', 'card ex');
    var h = el('h3', '', 'Exercise ' + (idx + 1) + ': ' + MD.inline(ex.title));
    if (Store.isSolved(key)) h.appendChild(el('span', 'solved', 'Solved'));
    c.appendChild(h);
    c.insertAdjacentHTML('beforeend', MD.render(ex.prompt));
    if (ex.files) {
      var f = el('details', 'files');
      f.appendChild(el('summary', '', 'Files in the working folder'));
      f.appendChild(el('pre', '', '<code>' + MD.esc(ex.files) + '</code>'));
      c.appendChild(f);
    }
    var ed = Editor.create(ex.starter || '');
    c.appendChild(ed.el);

    var actions = el('div', 'actions');
    var run = el('button', 'primary', 'Run and check'); run.type = 'button';
    var hintB = el('button', '', 'Hint'); hintB.type = 'button';
    var solB = el('button', '', 'Show solution'); solB.type = 'button';
    var resetB = el('button', 'ghost', 'Reset code'); resetB.type = 'button';
    solB.disabled = !Store.isSolved(key);
    actions.appendChild(run); actions.appendChild(hintB); actions.appendChild(solB); actions.appendChild(resetB);
    c.appendChild(actions);

    var status = el('div', 'status');
    var resBox = el('div');
    var hintBox = el('div');
    var solBox = el('div');
    c.appendChild(status); c.appendChild(resBox); c.appendChild(hintBox); c.appendChild(solBox);

    var hintN = 0, tries = 0;
    if (!(ex.hints || []).length) hintB.disabled = true;
    hintB.addEventListener('click', function () {
      var hs = ex.hints || [];
      if (hintN >= hs.length) return;
      hintBox.appendChild(el('div', 'hint', '<b>Hint:</b> ' + MD.inline(hs[hintN])));
      hintN++;
      if (hintN >= hs.length) hintB.disabled = true;
    });
    solB.addEventListener('click', function () {
      if (!Store.isSolved(key) && !confirm('Show the solution? Try a little longer first if you can.')) return;
      solBox.innerHTML = '';
      solBox.appendChild(el('div', 'muted', 'Reference solution:'));
      solBox.insertAdjacentHTML('beforeend', MD.render('```python\n' + ex.solution.replace(/\n$/, '') + '\n```'));
      if (ex.explain) solBox.insertAdjacentHTML('beforeend', '<div class="tipbox">' + MD.render(ex.explain) + '</div>');
    });
    resetB.addEventListener('click', function () { if (confirm('Go back to the starting code?')) ed.set(ex.starter || ''); });

    run.addEventListener('click', function () {
      run.disabled = true;
      status.textContent = 'Loading Python… (only slow the first time)';
      resBox.innerHTML = '';
      PyRunner.run(ed.get(), ex.tests, ex.setup).then(function (r) {
        status.textContent = '';
        tries++;
        if (r.out) {
          resBox.appendChild(el('div', 'muted', 'Output:'));
          resBox.appendChild(el('pre', '', '<code>' + MD.esc(r.out) + '</code>'));
        }
        if (r.err) {
          resBox.appendChild(el('div', 'err', 'Python error:\n' + MD.esc(r.err)));
          resBox.appendChild(el('div', 'muted', 'The error tells you what happened and on which line. Fix it and run again.'));
        }
        var ul = el('ul', 'results');
        var all = !r.err && r.results.length > 0;
        r.results.forEach(function (t) {
          ul.appendChild(el('li', t.ok ? 'ok' : 'ng', (t.ok ? '✓ ' : '✗ ') + MD.inline(t.msg)));
          if (!t.ok) all = false;
        });
        if (r.results.length) resBox.appendChild(ul);
        if (all) {
          resBox.appendChild(el('div', 'why ok', 'Nice! Exercise solved.' + (ex.explain ? ' Tap “Show solution” to compare with the reference version.' : '')));
          if (!Store.isSolved(key)) {
            Store.setSolved(key);
            if (!h.querySelector('.solved')) h.appendChild(el('span', 'solved', 'Solved'));
          }
          Store.clearMistake(key);
          solB.disabled = false;
          if (onSolved) onSolved();
        } else {
          Store.addMistake(key, { type: 'ex', lesson: lesson.id, ex: ex.id, title: ex.title });
          if (tries >= 1) solB.disabled = false;
        }
      }).catch(function (e) {
        status.textContent = e.message;
      }).then(function () { run.disabled = false; });
    });
    return c;
  }

  // ---------- Free-answer exercise (design, OpenMaya, PySide) ----------
  function renderFreeExercise(lesson, ex, idx, onSolved) {
    var key = exKey(lesson, ex);
    var c = el('div', 'card ex');
    var h = el('h3', '', 'Exercise ' + (idx + 1) + ': ' + MD.inline(ex.title));
    if (Store.isSolved(key)) h.appendChild(el('span', 'solved', 'Reviewed'));
    c.appendChild(h);
    c.insertAdjacentHTML('beforeend', MD.render(ex.prompt));
    var ta = el('textarea', 'answer');
    ta.rows = 8;
    ta.placeholder = ex.placeholder || 'Write your answer here. Bullet points are fine. It saves automatically.';
    ta.value = Store.getText(key);
    ta.addEventListener('input', function () { Store.setText(key, ta.value); });
    c.appendChild(ta);
    var reveal = el('button', 'primary', 'Show key points'); reveal.type = 'button'; reveal.style.width = '100%'; reveal.style.marginTop = '8px';
    c.appendChild(reveal);
    var box = el('div');
    c.appendChild(box);
    reveal.addEventListener('click', function () {
      if (ta.value.trim().length < 30 && !confirm('Your answer is very short. Writing first really helps you remember. Show the key points anyway?')) return;
      reveal.style.display = 'none';
      box.appendChild(el('h3', '', 'Does your answer mention…?'));
      var checks = [];
      (ex.checklist || []).forEach(function (t) {
        var lab = el('label', 'check');
        var cb = document.createElement('input'); cb.type = 'checkbox';
        lab.appendChild(cb); lab.appendChild(el('span', '', MD.inline(t)));
        box.appendChild(lab); checks.push(cb);
      });
      if (ex.model) {
        var d = el('details', 'model');
        d.appendChild(el('summary', '', 'Show a model answer'));
        d.insertAdjacentHTML('beforeend', MD.render(ex.model));
        box.appendChild(d);
      }
      if ((ex.followups || []).length) {
        box.appendChild(el('h3', '', 'Follow-up questions they may ask'));
        var ul = el('ul');
        ex.followups.forEach(function (q) { ul.appendChild(el('li', '', MD.inline(q))); });
        box.appendChild(ul);
      }
      var done = el('button', 'primary', 'I have checked my answer'); done.type = 'button'; done.style.width = '100%';
      done.addEventListener('click', function () {
        var n = checks.filter(function (x) { return x.checked; }).length;
        Store.setSolved(key);
        if (checks.length && n < Math.ceil(checks.length / 2)) {
          Store.addMistake(key, { type: 'ex', lesson: lesson.id, ex: ex.id, title: ex.title });
          box.appendChild(el('div', 'why ng', 'You ticked ' + n + ' of ' + checks.length + '. It goes to “Review” so you can try again.'));
        } else {
          Store.clearMistake(key);
          box.appendChild(el('div', 'why ok', 'You ticked ' + n + ' of ' + checks.length + '. Good job!'));
        }
        if (!h.querySelector('.solved')) h.appendChild(el('span', 'solved', 'Reviewed'));
        done.disabled = true;
        if (onSolved) onSolved();
      });
      box.appendChild(done);
    });
    return c;
  }

  function renderExercise(lesson, ex, idx, onSolved) {
    return ex.kind === 'free' ? renderFreeExercise(lesson, ex, idx, onSolved) : renderCodeExercise(lesson, ex, idx, onSolved);
  }

  function renderExercises(lesson, box) {
    var code = (lesson.exercises || []).some(function (e) { return e.kind !== 'free'; });
    box.appendChild(el('p', 'muted', code
      ? 'Write the code and tap “Run and check”. The tests tell you what works and what is missing.'
      : 'Write your answer as if you were speaking in the interview. Then compare it with the key points.'));
    (lesson.exercises || []).forEach(function (ex, i) { box.appendChild(renderExercise(lesson, ex, i, null)); });
  }

  // ---------- Step 5: Summary ----------
  function renderSummary(lesson, box, onFinish) {
    var ul = el('ul', 'summary');
    (lesson.summary || []).forEach(function (s) { ul.appendChild(el('li', '', MD.inline(s))); });
    var c = el('div', 'card'); c.appendChild(el('h3', '', 'In 3 lines')); c.appendChild(ul);
    box.appendChild(c);
    var ok = allExercisesSolved(lesson);
    var done = Store.isDone(lesson.id);
    var b = el('button', 'primary', done ? '✓ Lesson done · back to the path' : 'Finish lesson');
    b.type = 'button'; b.style.width = '100%';
    if (!ok && !done) {
      b.disabled = true;
      box.appendChild(el('p', 'muted center', 'Solve every exercise to finish the lesson.'));
    }
    b.addEventListener('click', function () { if (!Store.isDone(lesson.id)) Store.setDone(lesson.id); onFinish(); });
    box.appendChild(b);
  }

  // ---------- Full screen ----------
  function render(root, lesson, meta, step, go) {
    root.innerHTML = '';
    root.appendChild(el('p', 'crumb', MD.esc(meta.module.title) + ' · Lesson ' + (meta.index + 1)));
    root.appendChild(el('h1', '', MD.esc(lesson.title) + (meta.en ? ' <small class="muted">' + MD.esc(meta.en) + '</small>' : '')));

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
    if (step === 0) renderBlocks(lesson.explain, box);
    else if (step === 1) renderExample(lesson, box);
    else if (step === 2) renderMini(lesson, box);
    else if (step === 3) renderExercises(lesson, box);
    else renderSummary(lesson, box, function () { location.hash = '#/'; });

    var nav = el('div', 'navrow');
    var prev = el('button', '', '← Back'); prev.type = 'button';
    prev.disabled = step === 0;
    prev.addEventListener('click', function () { go(step - 1); });
    nav.appendChild(prev);
    if (step < STEPS.length - 1) {
      var next = el('button', 'primary', 'Next →'); next.type = 'button';
      next.addEventListener('click', function () { go(step + 1); });
      nav.appendChild(next);
    }
    root.appendChild(nav);
  }

  return { render: render, renderMCQ: renderMCQ, renderExercise: renderExercise, exKey: exKey, STEPS: STEPS };
})();
