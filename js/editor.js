// Área de código pensada para el móvil: sin autocorrección, con tecla Tab y una fila de símbolos.
window.Editor = (function () {
  var KEYS = ['⇥', '(', ')', '[', ']', '{', '}', '"', ':', '=', '_', '.', ',', '#'];

  function insert(ta, text) {
    var s = ta.selectionStart, e = ta.selectionEnd;
    ta.value = ta.value.slice(0, s) + text + ta.value.slice(e);
    ta.selectionStart = ta.selectionEnd = s + text.length;
    ta.dispatchEvent(new Event('input'));
  }

  function create(initial) {
    var box = document.createElement('div');
    var ta = document.createElement('textarea');
    ta.className = 'editor';
    ta.value = initial || '';
    ta.setAttribute('autocapitalize', 'off');
    ta.setAttribute('autocomplete', 'off');
    ta.setAttribute('autocorrect', 'off');
    ta.setAttribute('spellcheck', 'false');
    ta.setAttribute('aria-label', 'Tu código');
    ta.rows = Math.max(6, (initial || '').split('\n').length + 3);
    ta.addEventListener('keydown', function (ev) {
      if (ev.key === 'Tab') { ev.preventDefault(); insert(ta, '    '); }
    });
    var keys = document.createElement('div');
    keys.className = 'keys';
    KEYS.forEach(function (k) {
      var b = document.createElement('button');
      b.type = 'button'; b.textContent = k;
      b.addEventListener('mousedown', function (ev) { ev.preventDefault(); });
      b.addEventListener('click', function () { insert(ta, k === '⇥' ? '    ' : k); ta.focus(); });
      keys.appendChild(b);
    });
    box.appendChild(ta);
    box.appendChild(keys);
    return { el: box, textarea: ta, get: function () { return ta.value; }, set: function (v) { ta.value = v; } };
  }

  return { create: create };
})();
