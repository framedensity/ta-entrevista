// "Tools" tab: real Maya tools explained. Tap any line of code to see what it is, why, and how it connects.
// Data comes from content/tools/<id>.js (built by tools_build/build.py).
window.TOOLS = {
  data: {}, list: [], glossary: {}, syntax: [],
  add: function (t) { this.data[t.id] = t; }
};

window.ToolsView = (function () {
  var SECTIONS = [['overview', 'Overview'], ['connected', 'How it connects'], ['code', 'Code'], ['review', 'Review']];
  var KW = /^(and|as|assert|break|class|continue|def|del|elif|else|except|finally|for|from|global|if|import|in|is|lambda|nonlocal|not|or|pass|raise|return|try|while|with|yield|None|True|False|self|cls|print|exec)$/;
  var POS_KEY = 'ta-tools-pos';

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }
  function esc(s) { return MD.esc(s); }
  function md(blocks) { return (blocks || []).map(function (b) { return MD.render(b); }).join(''); }
  function savePos(id, hash) { try { var p = JSON.parse(localStorage.getItem(POS_KEY) || '{}'); p[id] = hash; localStorage.setItem(POS_KEY, JSON.stringify(p)); } catch (e) {} }
  function lastPos(id) { try { return (JSON.parse(localStorage.getItem(POS_KEY) || '{}'))[id]; } catch (e) { return null; } }

  // ---------- loading ----------
  function load(id, cb) {
    if (TOOLS.data[id]) { cb(TOOLS.data[id]); return; }
    var s = document.createElement('script');
    s.src = 'content/tools/' + id + '.js';
    s.onload = function () { cb(TOOLS.data[id] || null); };
    s.onerror = function () { cb(null); };
    document.body.appendChild(s);
  }

  // ---------- list ----------
  function viewList(app) {
    app.innerHTML = '';
    app.appendChild(el('h1', '', 'Tools'));
    app.appendChild(el('p', 'muted', 'Real Maya tools, explained. Read the overview, then open the code: tap any line to see what it does, why it is written that way, and what it connects to.'));
    TOOLS.list.forEach(function (t) {
      var a = el('a', 'card toolcard');
      a.href = lastPos(t.id) || ('#/tool/' + t.id);
      a.innerHTML = '<b>' + esc(t.title) + '</b><div class="muted">' + esc(t.tagline || '') + '</div>';
      app.appendChild(a);
    });
  }

  // ---------- tool page ----------
  function viewTool(app, id, section, fileIdx, line) {
    app.innerHTML = '<div class="empty">Loading…</div>';
    load(id, function (T) {
      if (!T) { app.innerHTML = '<div class="empty">This tool is not available.<br><br><a href="#/tools">Back to tools</a></div>'; return; }
      section = section || 'overview';
      savePos(id, location.hash);
      app.innerHTML = '';
      app.appendChild(el('p', 'crumb', '<a href="#/tools">Tools</a>'));
      app.appendChild(el('h1', '', esc(T.title) + '<small class="muted">' + esc(T.tagline || '') + '</small>'));
      var tabs = el('div', 'steps');
      SECTIONS.forEach(function (s) {
        var b = el('button', s[0] === section ? 'on' : '', s[1]); b.type = 'button';
        b.addEventListener('click', function () { location.hash = '#/tool/' + id + '/' + s[0]; });
        tabs.appendChild(b);
      });
      app.appendChild(tabs);
      var box = el('div');
      app.appendChild(box);
      if (section === 'overview') {
        box.innerHTML = md(T.overview) + (T.why && T.why.length ? '<h2>Why it is built this way</h2>' + md(T.why) : '');
        box.appendChild(nextBtn('#/tool/' + id + '/connected', 'How it connects'));
      } else if (section === 'connected') {
        box.innerHTML = md(T.flow);
        box.appendChild(fileMap(T, id));
        box.appendChild(nextBtn('#/tool/' + id + '/code/0', 'Open the code'));
      } else if (section === 'review') {
        box.innerHTML = '<p class="muted">Things worth knowing if someone asks “what would you improve?”.</p>' + md(T.review);
      } else {
        viewCode(box, T, id, parseInt(fileIdx || '0', 10) || 0, line ? parseInt(line, 10) : null);
      }
    });
  }

  function nextBtn(href, label) {
    var a = el('a', 'btn primary block', label + ' →'); a.href = href; return a;
  }

  // Which file calls into which, computed from the call graph.
  function fileMap(T, id) {
    var c = el('div', 'card');
    c.appendChild(el('h3', '', 'Files and what they use'));
    T.files.forEach(function (f, i) {
      var uses = {};
      (f.outline || []).forEach(function (d) { d.c.forEach(function (x) { if (x[0] !== i) uses[x[0]] = (uses[x[0]] || 0) + 1; }); });
      var row = el('div', 'filemap');
      var link = el('a', '', '<code>' + esc(f.path) + '</code>'); link.href = '#/tool/' + id + '/code/' + i;
      row.appendChild(link);
      if (f.note) row.appendChild(el('div', 'muted', MD.inline(f.note)));
      var u = Object.keys(uses);
      if (u.length) row.appendChild(el('div', 'uses', 'uses ' + u.map(function (k) { return '<a href="#/tool/' + id + '/code/' + k + '"><code>' + esc(T.files[k].path.split('/').pop()) + '</code></a>'; }).join(', ')));
      c.appendChild(row);
    });
    return c;
  }

  // ---------- code view ----------
  function viewCode(box, T, id, fi, line) {
    var F = T.files[fi] || T.files[0];
    var sel = el('select', 'filepick');
    T.files.forEach(function (f, i) { var o = el('option', '', esc(f.path)); o.value = i; if (i === fi) o.selected = true; sel.appendChild(o); });
    sel.addEventListener('change', function () { location.hash = '#/tool/' + id + '/code/' + sel.value; });
    box.appendChild(sel);
    if (F.note) box.appendChild(el('div', 'filenote', MD.inline(F.note)));

    if (F.lang === 'md') { box.appendChild(el('div', 'card', MD.render(F.code))); return; }

    if (F.outline.length) {
      var det = el('details', 'outline');
      det.appendChild(el('summary', '', 'Functions and classes in this file (' + F.outline.length + ')'));
      var ul = el('div');
      F.outline.forEach(function (d) {
        var depth = d.q.split('.').length - 1;
        var a = el('a', 'ol ' + d.k, '<span class="okind">' + d.k + '</span> ' + esc(d.q.split('.').pop()) + (depth ? '<span class="muted"> in ' + esc(d.q.split('.').slice(0, -1).join('.')) + '</span>' : ''));
        a.style.paddingLeft = (6 + depth * 14) + 'px';
        a.href = '#/tool/' + id + '/code/' + fi + '/' + d.s;
        ul.appendChild(a);
      });
      det.appendChild(ul);
      box.appendChild(det);
    }
    box.appendChild(el('p', 'muted small', 'Tap a line. Lines with a dot have an extra note.'));

    var code = el('div', 'codeview');
    var lines = F.code.split('\n');
    var html = highlight(lines);
    var starts = {};
    F.outline.forEach(function (d) { starts[d.s] = d; });
    var frag = [];
    for (var i = 0; i < lines.length; i++) {
      var n = i + 1;
      var mark = F.lines[n] ? ' note' : (starts[n] ? ' defl' : '');
      frag.push('<div class="cl' + mark + '" data-n="' + n + '"><span class="ln">' + n + '</span><span class="lc">' + (html[i] || ' ') + '</span></div>');
    }
    code.innerHTML = frag.join('');
    box.appendChild(code);

    var panel = document.getElementById('codepanel');
    if (!panel) { panel = el('div', 'codepanel'); panel.id = 'codepanel'; document.body.appendChild(panel); }
    panel.classList.remove('open');

    code.addEventListener('click', function (e) {
      var row = e.target.closest('.cl');
      if (!row) return;
      select(parseInt(row.dataset.n, 10), true);
    });

    function select(n, fromTap) {
      [].forEach.call(code.querySelectorAll('.cl.sel, .cl.blk'), function (r) { r.classList.remove('sel'); r.classList.remove('blk'); });
      var d = innermost(F, n);
      if (d) for (var k = d.s; k <= d.e; k++) { var r = code.children[k - 1]; if (r) r.classList.add('blk'); }
      var row = code.children[n - 1];
      if (row) {
        row.classList.add('sel');
        var top = row.getBoundingClientRect().top;
        if (!fromTap || top > window.innerHeight * 0.38) window.scrollTo(0, window.scrollY + top - window.innerHeight * 0.2);
      }
      history.replaceState(null, '', '#/tool/' + id + '/code/' + fi + '/' + n);
      savePos(id, location.hash);
      showPanel(panel, T, id, fi, F, n, lines[n - 1], d, select);
    }
    if (line) setTimeout(function () { select(line, false); }, 30);
  }

  function innermost(F, n) {
    var best = null;
    F.outline.forEach(function (d) { if (d.s <= n && n <= d.e && (!best || d.s >= best.s)) best = d; });
    return best;
  }
  function parents(F, d) {
    var out = [], parts = d.q.split('.');
    for (var i = 1; i < parts.length; i++) {
      var q = parts.slice(0, i).join('.');
      F.outline.forEach(function (x) { if (x.q === q) out.push(x); });
    }
    return out;
  }
  function defLink(T, id, ref) {
    var f = T.files[ref[0]], d = null;
    f.outline.forEach(function (x) { if (x.q === ref[1]) d = x; });
    var file = ref[0] === undefined ? '' : f.path.split('/').pop();
    return '<a href="#/tool/' + id + '/code/' + ref[0] + '/' + (d ? d.s : 1) + '"><code>' + esc(ref[1]) + '</code></a> <span class="muted">' + esc(file) + '</span>';
  }

  function showPanel(panel, T, id, fi, F, n, text, d, select) {
    var h = '<button type="button" class="pclose" aria-label="Close">×</button>';
    h += '<div class="ptitle">Line ' + n + '</div>';
    if (F.lines[n]) h += '<div class="pnote">' + MD.render(F.lines[n]) + '</div>';

    if (d) {
      var ps = parents(F, d);
      h += '<div class="psec"><div class="plabel">Inside ' + (d.k === 'class' ? 'class' : 'function') + '</div>';
      if (ps.length) h += '<div class="muted small">' + ps.map(function (p) { return '<a href="#" data-goto="' + p.s + '">' + esc(p.q) + '</a>'; }).join(' › ') + ' ›</div>';
      h += '<div class="pdef"><a href="#" data-goto="' + d.s + '"><code>' + esc(d.q) + '</code></a> <span class="muted small">lines ' + d.s + '–' + d.e + '</span></div>';
      if (d.n) h += MD.render(d.n);
      else if (d.doc) h += '<p>' + MD.inline(d.doc) + '</p>';
      if (d.n && d.doc) h += '<div class="pdoc"><span class="muted small">Docstring:</span> ' + MD.inline(d.doc) + '</div>';
      if (d.c.length) h += '<div class="plabel">Calls / uses</div><div class="plist">' + d.c.map(function (r) { return defLink(T, id, r); }).join('<br>') + '</div>';
      if (d.b.length) h += '<div class="plabel">Called / used by</div><div class="plist">' + d.b.map(function (r) { return defLink(T, id, r); }).join('<br>') + '</div>';
      h += '</div>';
    } else if (F.note) {
      h += '<div class="psec"><div class="plabel">Module level</div><p>' + MD.inline(F.note) + '</p><p class="muted small">Top-level code runs once, when the file is imported.</p></div>';
    }

    var gl = glossaryFor(text || '', F);
    if (gl.length) {
      h += '<div class="psec"><div class="plabel">On this line</div>';
      gl.forEach(function (g) { h += '<div class="gl"><code>' + esc(g[0]) + '</code> ' + MD.inline(g[1]) + '</div>'; });
      h += '</div>';
    }
    panel.innerHTML = h;
    panel.classList.add('open');
    panel.scrollTop = 0;
    panel.querySelector('.pclose').addEventListener('click', function () { panel.classList.remove('open'); });
    [].forEach.call(panel.querySelectorAll('[data-goto]'), function (a) {
      a.addEventListener('click', function (e) { e.preventDefault(); select(parseInt(a.dataset.goto, 10), false); });
    });
  }

  // Explanations for the API calls, methods, built-ins and syntax found on one line.
  function glossaryFor(text, F) {
    var out = [], seen = {};
    var code = stripStrings(text);
    function push(label, t) { if (t && !seen[label]) { seen[label] = 1; out.push([label, t]); } }
    var own = {};
    F.outline.forEach(function (d) { own[d.q.split('.').pop()] = 1; });
    var rx = /([A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*)(\s*\()?/g, m;
    while ((m = rx.exec(code))) {
      var tok = m[1], call = !!m[2];
      var parts = tok.split('.');
      if (m.index > 0 && code[m.index - 1] === '.') continue;
      var alias = F.aliases[parts[0]];
      if (alias) {
        var full = (alias + '.' + parts.slice(1).join('.')).replace(/\.$/, '');
        var segs = full.split('.'), hit = null;
        for (var k = segs.length; k >= 1 && !hit; k--) { var key = segs.slice(0, k).join('.'); if (TOOLS.glossary[key]) hit = key; }
        if (hit) push(tok.split('.').slice(0, parts.length - (segs.length - hit.split('.').length)).join('.') || tok, TOOLS.glossary[hit]);
        continue;
      }
      if (parts.length === 1) {
        if (call && !own[tok] && TOOLS.glossary['builtins.' + tok]) push(tok + '()', TOOLS.glossary['builtins.' + tok]);
        else if (!call && /^[A-Z]\w*Error$|^Exception$/.test(tok) && TOOLS.glossary['builtins.' + tok]) push(tok, TOOLS.glossary['builtins.' + tok]);
        continue;
      }
      for (var j = 1; j < parts.length; j++) {
        var meth = parts[j];
        var isCall = j === parts.length - 1 ? call : false;
        if (parts[0] === 'self' && own[meth]) continue;
        var sig = parts[j + 1] === 'connect' || parts[j + 1] === 'emit';
        if ((isCall || sig) && !own[meth] && TOOLS.glossary['method.' + meth]) push('.' + meth + (sig ? '' : '()'), TOOLS.glossary['method.' + meth]);
      }
    }
    TOOLS.syntax.forEach(function (s) { if (new RegExp(s[0]).test(code)) push(s[1], s[2]); });
    return out;
  }
  function stripStrings(t) {
    var hash = t.indexOf('#');
    var s = t.replace(/("""|''')[\s\S]*?\1|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g, function (m) { return m[0] + m[0]; });
    var h = s.search(/#/);
    return h >= 0 ? s.slice(0, h) : s;
  }

  // ---------- syntax highlighting (Python) ----------
  function highlight(lines) {
    var out = [], inStr = null;
    for (var i = 0; i < lines.length; i++) {
      var L = lines[i], res = '', p = 0;
      if (inStr) {
        var end = L.indexOf(inStr);
        if (end < 0) { out.push('<span class="hs">' + esc(L) + '</span>'); continue; }
        res += '<span class="hs">' + esc(L.slice(0, end + 3)) + '</span>'; p = end + 3; inStr = null;
      }
      while (p < L.length) {
        var rest = L.slice(p), m;
        if ((m = /^#.*/.exec(rest))) { res += '<span class="hc">' + esc(m[0]) + '</span>'; p += m[0].length; continue; }
        if ((m = /^[rbuRBUfF]{0,2}("""|''')/.exec(rest))) {
          var q = m[1], close = rest.indexOf(q, m[0].length);
          if (close < 0) { res += '<span class="hs">' + esc(rest) + '</span>'; inStr = q; p = L.length; continue; }
          res += '<span class="hs">' + esc(rest.slice(0, close + 3)) + '</span>'; p += close + 3; continue;
        }
        if ((m = /^[rbuRBUfF]{0,2}("(?:\\.|[^"\\])*"?|'(?:\\.|[^'\\])*'?)/.exec(rest))) { res += '<span class="hs">' + esc(m[0]) + '</span>'; p += m[0].length; continue; }
        if ((m = /^@[\w.]+/.exec(rest))) { res += '<span class="hd">' + esc(m[0]) + '</span>'; p += m[0].length; continue; }
        if ((m = /^\d+(\.\d+)?(e-?\d+)?/.exec(rest))) { res += '<span class="hn">' + m[0] + '</span>'; p += m[0].length; continue; }
        if ((m = /^[A-Za-z_]\w*/.exec(rest))) {
          var w = m[0], prev = res.replace(/<[^>]+>/g, '');
          if (/(def|class)\s+$/.test(prev)) res += '<span class="hf">' + w + '</span>';
          else if (KW.test(w)) res += '<span class="hk">' + w + '</span>';
          else res += esc(w);
          p += w.length; continue;
        }
        res += esc(rest[0]); p += 1;
      }
      out.push(res);
    }
    return out;
  }

  function closePanel() { var p = document.getElementById('codepanel'); if (p) p.classList.remove('open'); }

  return { list: viewList, tool: viewTool, closePanel: closePanel };
})();
