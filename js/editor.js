// Code area built for phones: no autocorrect, auto-indent, Tab key and a row of symbols.
window.Editor = (function () {
  var IND = '    ';
  var KEYS = ['⇥', '⇤', '(', ')', '[', ']', '{', '}', '"', ':', '=', '_', '.', ',', '#'];
  var DEDENT_AFTER = /^\s*(return|pass|break|continue|raise)\b/;

  // Insert text at the cursor. execCommand keeps the browser's undo (Ctrl+Z).
  function insert(ta, text) {
    ta.focus();
    var ok = false;
    try {
      if (text) ok = document.execCommand('insertText', false, text);
      else ok = ta.selectionStart === ta.selectionEnd || document.execCommand('delete');
    } catch (e) {}
    if (!ok) {
      var s = ta.selectionStart, e2 = ta.selectionEnd;
      ta.setRangeText(text, s, e2, 'end');
      ta.dispatchEvent(new Event('input'));
    }
  }

  function lineStart(ta) { return ta.value.lastIndexOf('\n', ta.selectionStart - 1) + 1; }

  // Strip a trailing comment (ignoring # inside quotes).
  function code(line) {
    var q = null;
    for (var i = 0; i < line.length; i++) {
      var c = line[i];
      if (q) { if (c === '\\') i++; else if (c === q) q = null; }
      else if (c === '"' || c === "'") q = c;
      else if (c === '#') return line.slice(0, i);
    }
    return line;
  }

  // Enter: same indent as the current line; +4 after «:»; −4 after return/pass/break…
  function newline(ta) {
    var s = ta.selectionStart;
    var before = ta.value.slice(lineStart(ta), s);
    var ind = before.match(/^[ \t]*/)[0];
    var c = code(before).replace(/\s+$/, '');
    if (/:$/.test(c)) ind += IND;
    else if (DEDENT_AFTER.test(c)) ind = ind.slice(0, Math.max(0, ind.length - IND.length));
    insert(ta, '\n' + ind);
  }

  // Backspace inside indentation: delete back to the previous level (4 spaces).
  function backspace(ta) {
    var s = ta.selectionStart;
    if (s !== ta.selectionEnd) return false;
    var ls = lineStart(ta);
    var before = ta.value.slice(ls, s);
    if (!before.length || /[^ ]/.test(before)) return false;
    var n = before.length % IND.length || IND.length;
    ta.setSelectionRange(s - n, s);
    insert(ta, '');
    return true;
  }

  // ⇤: remove one indent level from the start of the current line.
  function dedent(ta) {
    var ls = lineStart(ta);
    var lead = ta.value.slice(ls).match(/^ */)[0].length;
    var n = Math.min(lead, IND.length);
    if (!n) return;
    var s = ta.selectionStart, e = ta.selectionEnd;
    ta.setSelectionRange(ls, ls + n);
    insert(ta, '');
    ta.setSelectionRange(Math.max(ls, s - n), Math.max(ls, e - n));
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
    ta.setAttribute('aria-label', 'Your code');
    ta.rows = Math.max(6, (initial || '').split('\n').length + 3);

    ta.addEventListener('keydown', function (ev) {
      if (ev.isComposing || ev.keyCode === 229) return; // Japanese IME or Android: handled in beforeinput
      if (ev.key === 'Tab') { ev.preventDefault(); if (ev.shiftKey) dedent(ta); else insert(ta, IND); }
      else if (ev.key === 'Enter' && !ev.shiftKey && !ev.ctrlKey && !ev.metaKey && !ev.altKey) { ev.preventDefault(); newline(ta); }
      else if (ev.key === 'Backspace' && !ev.ctrlKey && !ev.metaKey && !ev.altKey) { if (backspace(ta)) ev.preventDefault(); }
    });
    // Phone keyboards that do not send the real key in keydown.
    ta.addEventListener('beforeinput', function (ev) {
      if (ev.isComposing || !ev.cancelable) return;
      if (ev.inputType === 'insertLineBreak' || ev.inputType === 'insertParagraph' ||
          (ev.inputType === 'insertText' && ev.data === '\n')) { ev.preventDefault(); newline(ta); }
      else if (ev.inputType === 'deleteContentBackward') { if (backspace(ta)) ev.preventDefault(); }
    });

    var keys = document.createElement('div');
    keys.className = 'keys';
    KEYS.forEach(function (k) {
      var b = document.createElement('button');
      b.type = 'button'; b.textContent = k;
      if (k === '⇥') b.title = 'Indent';
      if (k === '⇤') b.title = 'Dedent';
      b.addEventListener('mousedown', function (ev) { ev.preventDefault(); });
      b.addEventListener('click', function () {
        if (k === '⇥') insert(ta, IND);
        else if (k === '⇤') { ta.focus(); dedent(ta); }
        else insert(ta, k);
      });
      keys.appendChild(b);
    });
    box.appendChild(ta);
    box.appendChild(keys);
    return { el: box, textarea: ta, get: function () { return ta.value; }, set: function (v) { ta.value = v; } };
  }

  return { create: create };
})();
