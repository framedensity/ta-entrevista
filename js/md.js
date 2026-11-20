// Markdown mínimo: párrafos, **negrita**, *cursiva*, `código`, bloques ```, listas "- ", ### títulos.
window.MD = (function () {
  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function inline(s) {
    var parts = s.split(/(`[^`]+`)/g);
    return parts.map(function (p) {
      if (/^`[^`]+`$/.test(p)) return '<code>' + esc(p.slice(1, -1)) + '</code>';
      return esc(p)
        .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
        .replace(/\*([^*]+)\*/g, '<i>$1</i>');
    }).join('');
  }
  function render(src) {
    if (!src) return '';
    var lines = String(src).split('\n');
    var out = [], para = [], list = [], code = null;
    function flushP() { if (para.length) { out.push('<p>' + inline(para.join(' ')) + '</p>'); para = []; } }
    function flushL() { if (list.length) { out.push('<ul>' + list.map(function (l) { return '<li>' + inline(l) + '</li>'; }).join('') + '</ul>'); list = []; } }
    for (var i = 0; i < lines.length; i++) {
      var ln = lines[i];
      if (code !== null) {
        if (/^```/.test(ln)) { out.push('<pre><code>' + esc(code.join('\n')) + '</code></pre>'); code = null; }
        else code.push(ln);
        continue;
      }
      if (/^```/.test(ln)) { flushP(); flushL(); code = []; continue; }
      if (/^###\s+/.test(ln)) { flushP(); flushL(); out.push('<h3>' + inline(ln.replace(/^###\s+/, '')) + '</h3>'); continue; }
      if (/^-\s+/.test(ln)) { flushP(); list.push(ln.replace(/^-\s+/, '')); continue; }
      if (/^\s*$/.test(ln)) { flushP(); flushL(); continue; }
      flushL(); para.push(ln.trim());
    }
    flushP(); flushL();
    if (code !== null) out.push('<pre><code>' + esc(code.join('\n')) + '</code></pre>');
    return out.join('');
  }
  return { render: render, inline: inline, esc: esc };
})();
