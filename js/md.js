// Minimal Markdown: paragraphs, **bold**, *italic*, `code`, ``` blocks, "- " and "1. " lists, # headings, | tables.
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
    var out = [], para = [], list = [], ltype = 'ul', code = null, table = [];
    function flushP() { if (para.length) { out.push('<p>' + inline(para.join(' ')) + '</p>'); para = []; } }
    function flushL() { if (list.length) { out.push('<' + ltype + '>' + list.map(function (l) { return '<li>' + inline(l) + '</li>'; }).join('') + '</' + ltype + '>'); list = []; } }
    function flushT() {
      if (!table.length) return;
      var rows = table.filter(function (r) { return !/^\|?\s*:?-{2,}/.test(r); }).map(function (r) {
        return r.replace(/^\||\|$/g, '').split('|').map(function (c) { return c.trim(); });
      });
      out.push('<div class="tablewrap"><table>' + rows.map(function (r, i) {
        var t = i === 0 ? 'th' : 'td';
        return '<tr>' + r.map(function (c) { return '<' + t + '>' + inline(c) + '</' + t + '>'; }).join('') + '</tr>';
      }).join('') + '</table></div>');
      table = [];
    }
    function flushAll() { flushP(); flushL(); flushT(); }
    for (var i = 0; i < lines.length; i++) {
      var ln = lines[i];
      if (code !== null) {
        if (/^\s*```/.test(ln)) { out.push('<pre><code>' + esc(code.join('\n')) + '</code></pre>'); code = null; }
        else code.push(ln);
        continue;
      }
      if (/^\s*```/.test(ln)) { flushAll(); code = []; continue; }
      var h = /^(#{1,4})\s+(.*)$/.exec(ln);
      if (h) { flushAll(); var lv = [0, 2, 3, 3, 4][h[1].length]; out.push('<h' + lv + '>' + inline(h[2]) + '</h' + lv + '>'); continue; }
      if (/^\s*\|/.test(ln)) { flushP(); flushL(); table.push(ln.trim()); continue; }
      flushT();
      if (/^[-*]\s+/.test(ln)) { flushP(); if (ltype !== 'ul') flushL(); ltype = 'ul'; list.push(ln.replace(/^[-*]\s+/, '')); continue; }
      if (/^\d+[.)]\s+/.test(ln)) { flushP(); if (ltype !== 'ol') flushL(); ltype = 'ol'; list.push(ln.replace(/^\d+[.)]\s+/, '')); continue; }
      if (list.length && /^\s{2,}\S/.test(ln)) { list[list.length - 1] += ' ' + ln.trim(); continue; }
      if (/^\s*$/.test(ln)) { flushAll(); continue; }
      flushL(); para.push(ln.trim());
    }
    flushAll();
    if (code !== null) out.push('<pre><code>' + esc(code.join('\n')) + '</code></pre>');
    return out.join('');
  }
  return { render: render, inline: inline, esc: esc };
})();
