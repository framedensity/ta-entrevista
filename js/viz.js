// Interactive figures for 3D Math (Canvas). Drag them with your finger.
// Use in a lesson: { type: 'viz', name: 'dot' }
window.Viz = (function () {
  function css(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#888'; }
  function fmt(v, d) { d = d === undefined ? 2 : d; var s = (Math.round(v * Math.pow(10, d)) / Math.pow(10, d)).toFixed(d); return s === '-0.00' ? '0.00' : s; }
  function len(v) { return Math.sqrt(v[0] * v[0] + v[1] * v[1]); }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1]; }
  function deg(r) { return r * 180 / Math.PI; }
  function rad(d) { return d * Math.PI / 180; }

  // ---------- 2D plane with dragging ----------
  function Plane(box, opt) {
    opt = opt || {};
    var self = this;
    this.range = opt.range || 5;
    this.canvas = document.createElement('canvas');
    this.canvas.style.width = '100%';
    this.canvas.style.maxWidth = '380px';
    this.canvas.style.aspectRatio = '1 / 1';
    this.canvas.style.touchAction = 'none';
    this.canvas.style.borderRadius = '12px';
    this.canvas.style.background = 'var(--card)';
    this.canvas.style.border = '1px solid var(--line)';
    box.appendChild(this.canvas);
    this.handles = [];
    this.drag = null;
    this.onchange = function () {};
    this.draw = function () {};
    function size() {
      var w = self.canvas.clientWidth || 320, dpr = window.devicePixelRatio || 1;
      self.canvas.width = w * dpr; self.canvas.height = w * dpr;
      self.w = w; self.ctx = self.canvas.getContext('2d'); self.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      self.render();
    }
    function pos(ev) {
      var r = self.canvas.getBoundingClientRect();
      return self.toWorld(ev.clientX - r.left, ev.clientY - r.top);
    }
    this.canvas.addEventListener('pointerdown', function (ev) {
      var p = pos(ev), best = null, bd = 0.9;
      self.handles.forEach(function (h) {
        var d = Math.hypot(h.get()[0] - p[0], h.get()[1] - p[1]);
        if (d < bd) { bd = d; best = h; }
      });
      if (best) { self.drag = best; self.canvas.setPointerCapture(ev.pointerId); ev.preventDefault(); }
    });
    this.canvas.addEventListener('pointermove', function (ev) {
      if (!self.drag) return;
      var p = pos(ev), R = self.range - 0.2;
      p = [Math.max(-R, Math.min(R, p[0])), Math.max(-R, Math.min(R, p[1]))];
      self.drag.set([Math.round(p[0] * 10) / 10, Math.round(p[1] * 10) / 10]);
      self.render(); self.onchange();
    });
    function end() { self.drag = null; }
    this.canvas.addEventListener('pointerup', end);
    this.canvas.addEventListener('pointercancel', end);
    window.addEventListener('resize', size);
    setTimeout(size, 0);
  }
  Plane.prototype.toScreen = function (p) {
    var s = this.w / (2 * this.range);
    return [this.w / 2 + p[0] * s, this.w / 2 - p[1] * s];
  };
  Plane.prototype.toWorld = function (x, y) {
    var s = this.w / (2 * this.range);
    return [(x - this.w / 2) / s, (this.w / 2 - y) / s];
  };
  Plane.prototype.render = function () {
    if (!this.ctx) return;
    var c = this.ctx, w = this.w;
    c.clearRect(0, 0, w, w);
    c.lineWidth = 1;
    c.strokeStyle = css('--line');
    for (var i = -this.range; i <= this.range; i++) {
      var a = this.toScreen([i, -this.range]), b = this.toScreen([i, this.range]);
      c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
      a = this.toScreen([-this.range, i]); b = this.toScreen([this.range, i]);
      c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
    }
    c.strokeStyle = css('--mute'); c.lineWidth = 1.5;
    var o1 = this.toScreen([-this.range, 0]), o2 = this.toScreen([this.range, 0]);
    c.beginPath(); c.moveTo(o1[0], o1[1]); c.lineTo(o2[0], o2[1]); c.stroke();
    o1 = this.toScreen([0, -this.range]); o2 = this.toScreen([0, this.range]);
    c.beginPath(); c.moveTo(o1[0], o1[1]); c.lineTo(o2[0], o2[1]); c.stroke();
    this.draw(c);
    var self = this;
    this.handles.forEach(function (h) { self.dot(h.get(), h.color || css('--acc'), 7); });
  };
  Plane.prototype.arrow = function (from, to, color, width, label) {
    var c = this.ctx, a = this.toScreen(from), b = this.toScreen(to);
    var ang = Math.atan2(b[1] - a[1], b[0] - a[0]), L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    c.strokeStyle = color; c.fillStyle = color; c.lineWidth = width || 3;
    c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
    if (L > 6) {
      c.beginPath(); c.moveTo(b[0], b[1]);
      c.lineTo(b[0] - 11 * Math.cos(ang - 0.4), b[1] - 11 * Math.sin(ang - 0.4));
      c.lineTo(b[0] - 11 * Math.cos(ang + 0.4), b[1] - 11 * Math.sin(ang + 0.4));
      c.closePath(); c.fill();
    }
    if (label) { c.font = 'bold 14px ui-monospace,Menlo,monospace'; c.fillText(label, b[0] + 8, b[1] - 8); }
  };
  Plane.prototype.line = function (from, to, color, dash) {
    var c = this.ctx, a = this.toScreen(from), b = this.toScreen(to);
    c.strokeStyle = color; c.lineWidth = 1.5; c.setLineDash(dash || [5, 4]);
    c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); c.setLineDash([]);
  };
  Plane.prototype.dot = function (p, color, r) {
    var c = this.ctx, s = this.toScreen(p);
    c.fillStyle = color; c.beginPath(); c.arc(s[0], s[1], r || 5, 0, Math.PI * 2); c.fill();
  };
  Plane.prototype.circle = function (center, radius, color) {
    var c = this.ctx, s = this.toScreen(center), r = radius * this.w / (2 * this.range);
    c.strokeStyle = color; c.lineWidth = 1.5; c.setLineDash([4, 4]);
    c.beginPath(); c.arc(s[0], s[1], r, 0, Math.PI * 2); c.stroke(); c.setLineDash([]);
  };
  Plane.prototype.text = function (p, txt, color) {
    var c = this.ctx, s = this.toScreen(p);
    c.fillStyle = color; c.font = '13px ui-monospace,Menlo,monospace'; c.fillText(txt, s[0] + 6, s[1] - 6);
  };

  function handle(arr, color) { return { get: function () { return arr; }, set: function (v) { arr[0] = v[0]; arr[1] = v[1]; }, color: color }; }
  function readout(box) { var d = document.createElement('div'); d.className = 'readout'; box.appendChild(d); return d; }
  function slider(box, label, min, max, step, value, onInput) {
    var w = document.createElement('label'); w.className = 'slider';
    w.innerHTML = '<span>' + label + ': <b>' + value + '</b></span>';
    var i = document.createElement('input'); i.type = 'range'; i.min = min; i.max = max; i.step = step; i.value = value;
    i.addEventListener('input', function () { w.querySelector('b').textContent = i.value; onInput(parseFloat(i.value)); });
    w.appendChild(i); box.appendChild(w); return i;
  }
  function hint(box, txt) { var p = document.createElement('p'); p.className = 'muted center'; p.textContent = txt; box.appendChild(p); }

  // ---------- Widgets ----------
  var W = {};

  W.vector = function (box) {
    var a = [3, 2], pl = new Plane(box), r = readout(box);
    pl.handles = [handle(a)];
    pl.draw = function () {
      pl.line([a[0], 0], a, css('--mute')); pl.line([0, a[1]], a, css('--mute'));
      pl.arrow([0, 0], a, css('--acc'), 3, 'v');
    };
    pl.onchange = function () { r.innerHTML = 'v = (<b>' + fmt(a[0], 1) + '</b>, <b>' + fmt(a[1], 1) + '</b>) · x = how far right · y = how far up'; };
    hint(box, 'Drag the tip of the arrow.'); pl.onchange();
  };

  W.normalize = function (box) {
    var a = [3, 2], pl = new Plane(box), r = readout(box);
    pl.handles = [handle(a)];
    pl.draw = function () {
      pl.circle([0, 0], 1, css('--mute'));
      pl.arrow([0, 0], a, css('--mute'), 3, 'v');
      var L = len(a); if (L > 0.001) pl.arrow([0, 0], [a[0] / L, a[1] / L], css('--acc'), 4, 'n');
    };
    pl.onchange = function () {
      var L = len(a);
      r.innerHTML = 'length of v = <b>' + fmt(L) + '</b><br>n = v / length = (<b>' + fmt(a[0] / (L || 1)) + '</b>, <b>' + fmt(a[1] / (L || 1)) + '</b>) · length of n = <b>1.00</b>';
    };
    hint(box, 'Drag v. Arrow n always has length 1 (it touches the circle).'); pl.onchange();
  };

  W.dot = function (box) {
    var a = [3, 1], b = [1, 3], pl = new Plane(box), r = readout(box);
    pl.handles = [handle(a), handle(b, '#e0803a')];
    pl.draw = function () {
      var La = len(a);
      if (La > 0.01) {
        var k = dot(a, b) / (La * La);
        pl.line(b, [a[0] * k, a[1] * k], css('--mute'));
        pl.dot([a[0] * k, a[1] * k], css('--mute'), 4);
      }
      pl.arrow([0, 0], a, css('--acc'), 3, 'a');
      pl.arrow([0, 0], b, '#e0803a', 3, 'b');
    };
    pl.onchange = function () {
      var d = dot(a, b), La = len(a), Lb = len(b);
      var cos = (La && Lb) ? d / (La * Lb) : 0;
      var ang = deg(Math.acos(Math.max(-1, Math.min(1, cos))));
      var txt = cos > 0.05 ? 'they point the <b>same way</b> (positive)' : (cos < -0.05 ? 'they point <b>opposite ways</b> (negative)' : 'they are <b>perpendicular</b> (≈ 0)');
      r.innerHTML = 'a · b = ' + fmt(a[0], 1) + '×' + fmt(b[0], 1) + ' + ' + fmt(a[1], 1) + '×' + fmt(b[1], 1) + ' = <b>' + fmt(d) + '</b><br>angle = <b>' + fmt(ang, 0) + '°</b> · ' + txt;
    };
    hint(box, 'Drag the tips of a (green) and b (orange).'); pl.onchange();
  };

  W.cross = function (box) {
    var a = [3, 0], b = [1, 3], pl = new Plane(box), r = readout(box);
    pl.handles = [handle(a), handle(b, '#e0803a')];
    pl.draw = function (c) {
      c.fillStyle = css('--accbg');
      var p0 = pl.toScreen([0, 0]), p1 = pl.toScreen(a), p2 = pl.toScreen([a[0] + b[0], a[1] + b[1]]), p3 = pl.toScreen(b);
      c.beginPath(); c.moveTo(p0[0], p0[1]); c.lineTo(p1[0], p1[1]); c.lineTo(p2[0], p2[1]); c.lineTo(p3[0], p3[1]); c.closePath(); c.fill();
      pl.arrow([0, 0], a, css('--acc'), 3, 'a');
      pl.arrow([0, 0], b, '#e0803a', 3, 'b');
    };
    pl.onchange = function () {
      var z = a[0] * b[1] - a[1] * b[0];
      r.innerHTML = 'a × b = (0, 0, <b>' + fmt(z) + '</b>)<br>' +
        (Math.abs(z) < 0.05 ? 'a and b are <b>parallel</b>: the result is 0.' :
          (z > 0 ? 'Positive: the result points <b>out of the screen</b>, toward you.' : 'Negative: the result points <b>into the screen</b>.')) +
        '<br>Its length = area of the shaded shape = <b>' + fmt(Math.abs(z)) + '</b>';
    };
    hint(box, 'In 2D, the cross product points out of the screen. Drag a and b.'); pl.onchange();
  };

  W.matrix = function (box) {
    var st = { ang: 30, sx: 1, sy: 1 }, pl = new Plane(box, { range: 3 }), r = readout(box);
    function M() { var c = Math.cos(rad(st.ang)), s = Math.sin(rad(st.ang)); return [[c * st.sx, -s * st.sy], [s * st.sx, c * st.sy]]; }
    function apply(m, p) { return [m[0][0] * p[0] + m[0][1] * p[1], m[1][0] * p[0] + m[1][1] * p[1]]; }
    pl.draw = function (c) {
      var m = M(), sq = [[0, 0], [1, 0], [1, 1], [0, 1]];
      c.strokeStyle = css('--mute'); c.setLineDash([4, 4]); c.beginPath();
      sq.forEach(function (p, i) { var s = pl.toScreen(p); if (i) c.lineTo(s[0], s[1]); else c.moveTo(s[0], s[1]); });
      c.closePath(); c.stroke(); c.setLineDash([]);
      c.fillStyle = css('--accbg'); c.beginPath();
      sq.forEach(function (p, i) { var s = pl.toScreen(apply(m, p)); if (i) c.lineTo(s[0], s[1]); else c.moveTo(s[0], s[1]); });
      c.closePath(); c.fill();
      pl.arrow([0, 0], apply(m, [1, 0]), '#d64545', 3, 'X');
      pl.arrow([0, 0], apply(m, [0, 1]), '#2f9e57', 3, 'Y');
    };
    function upd() {
      var m = M(); pl.render();
      r.innerHTML = 'Matrix:<br><code>[ ' + fmt(m[0][0]) + '  ' + fmt(m[0][1]) + ' ]</code><br><code>[ ' + fmt(m[1][0]) + '  ' + fmt(m[1][1]) + ' ]</code><br>Column 1 = where the X axis goes (red). Column 2 = the Y axis (green).';
    }
    slider(box, 'Rotation (°)', -180, 180, 1, st.ang, function (v) { st.ang = v; upd(); });
    slider(box, 'Scale X', 0.2, 2, 0.1, st.sx, function (v) { st.sx = v; upd(); });
    slider(box, 'Scale Y', 0.2, 2, 0.1, st.sy, function (v) { st.sy = v; upd(); });
    upd();
  };

  W.space = function (box) {
    var st = { px: -2, py: 1, ang: 45, lx: 2, ly: 0 }, pl = new Plane(box), r = readout(box);
    function world() {
      var c = Math.cos(rad(st.ang)), s = Math.sin(rad(st.ang));
      return [st.px + c * st.lx - s * st.ly, st.py + s * st.lx + c * st.ly];
    }
    pl.draw = function () {
      var c = Math.cos(rad(st.ang)), s = Math.sin(rad(st.ang)), p = [st.px, st.py];
      pl.arrow(p, [p[0] + c * 1.5, p[1] + s * 1.5], '#d64545', 2, 'x');
      pl.arrow(p, [p[0] - s * 1.5, p[1] + c * 1.5], '#2f9e57', 2, 'y');
      pl.dot(p, css('--mute'), 6); pl.text(p, 'parent', css('--mute'));
      var w = world(); pl.line(p, w, css('--acc')); pl.dot(w, css('--acc'), 7); pl.text(w, 'child', css('--acc'));
    };
    function upd() {
      var w = world(); pl.render();
      r.innerHTML = 'Local (relative to the parent): (<b>' + fmt(st.lx, 1) + '</b>, <b>' + fmt(st.ly, 1) + '</b>)<br>World (relative to the origin): (<b>' + fmt(w[0]) + '</b>, <b>' + fmt(w[1]) + '</b>)';
    }
    slider(box, 'Parent: position X', -3, 3, 0.5, st.px, function (v) { st.px = v; upd(); });
    slider(box, 'Parent: rotation (°)', -180, 180, 5, st.ang, function (v) { st.ang = v; upd(); });
    slider(box, 'Child: local X', -3, 3, 0.5, st.lx, function (v) { st.lx = v; upd(); });
    upd();
  };

  W.gimbal = function (box) {
    var st = { x: 0, y: 30, z: 0 };
    var cv = document.createElement('canvas'); cv.style.width = '100%'; cv.style.maxWidth = '380px'; cv.style.aspectRatio = '1/1';
    cv.style.borderRadius = '12px'; cv.style.background = 'var(--card)'; cv.style.border = '1px solid var(--line)';
    box.appendChild(cv);
    var r = readout(box);
    function rotX(v, a) { var c = Math.cos(a), s = Math.sin(a); return [v[0], c * v[1] - s * v[2], s * v[1] + c * v[2]]; }
    function rotY(v, a) { var c = Math.cos(a), s = Math.sin(a); return [c * v[0] + s * v[2], v[1], -s * v[0] + c * v[2]]; }
    function rotZ(v, a) { var c = Math.cos(a), s = Math.sin(a); return [c * v[0] - s * v[1], s * v[0] + c * v[1], v[2]]; }
    function proj(v, w) { // simple isometric projection
      var x = (v[0] - v[1]) * Math.cos(rad(30)), y = v[2] + (v[0] + v[1]) * Math.sin(rad(30));
      return [w / 2 + x * w * 0.3, w / 2 - y * w * 0.3];
    }
    function draw() {
      var dpr = window.devicePixelRatio || 1, w = cv.clientWidth || 320;
      cv.width = w * dpr; cv.height = w * dpr; var c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
      // XYZ order (as in Maya): Z is the outer ring, Y the middle one, X the inner one.
      var zAxis = [0, 0, 1];
      var yAxis = rotZ([0, 1, 0], rad(st.z));
      var xAxis = rotZ(rotY([1, 0, 0], rad(st.y)), rad(st.z));
      var o = proj([0, 0, 0], w);
      [[xAxis, '#d64545', 'X'], [yAxis, '#2f9e57', 'Y'], [zAxis, '#3b6fd6', 'Z']].forEach(function (e) {
        var p = proj(e[0], w);
        c.strokeStyle = e[1]; c.fillStyle = e[1]; c.lineWidth = 4;
        c.beginPath(); c.moveTo(o[0], o[1]); c.lineTo(p[0], p[1]); c.stroke();
        c.beginPath(); c.arc(p[0], p[1], 6, 0, 7); c.fill();
        c.font = 'bold 15px ui-monospace,Menlo,monospace'; c.fillText(e[2], p[0] + 8, p[1] - 6);
      });
      var cosXZ = Math.abs(xAxis[0] * zAxis[0] + xAxis[1] * zAxis[1] + xAxis[2] * zAxis[2]);
      var locked = cosXZ > 0.985;
      r.innerHTML = 'Rotation axes of the rings (XYZ order).<br>Angle between the X axis and the Z axis: <b>' + fmt(deg(Math.acos(Math.min(1, cosXZ))), 0) + '°</b><br>' +
        (locked ? '<b>Gimbal lock:</b> X and Z rotate around the same axis. You have lost one direction of rotation.' : 'The three axes are different: you can rotate in all three directions.');
    }
    slider(box, 'Rotate X (°)', -180, 180, 5, st.x, function (v) { st.x = v; draw(); });
    slider(box, 'Rotate Y (°)', -90, 90, 5, st.y, function (v) { st.y = v; draw(); });
    slider(box, 'Rotate Z (°)', -180, 180, 5, st.z, function (v) { st.z = v; draw(); });
    hint(box, 'Set “Rotate Y” to 90 and watch what happens to X and Z.');
    setTimeout(draw, 0); window.addEventListener('resize', draw);
  };

  W.quat = function (box) {
    var st = { ang: 90, axis: 'Z' }, r = readout(box), pl = new Plane(box, { range: 2 });
    pl.draw = function () {
      pl.circle([0, 0], 1.5, css('--mute'));
      pl.arrow([0, 0], [1.5, 0], css('--mute'), 2, '');
      var a = rad(st.ang);
      if (st.axis === 'Z') pl.arrow([0, 0], [1.5 * Math.cos(a), 1.5 * Math.sin(a)], css('--acc'), 4, '');
    };
    function upd() {
      var h = rad(st.ang) / 2, s = Math.sin(h), w = Math.cos(h);
      var x = st.axis === 'X' ? s : 0, y = st.axis === 'Y' ? s : 0, z = st.axis === 'Z' ? s : 0;
      pl.render();
      r.innerHTML = 'q = (w, x, y, z) = (<b>' + fmt(w) + '</b>, <b>' + fmt(x) + '</b>, <b>' + fmt(y) + '</b>, <b>' + fmt(z) + '</b>)<br>' +
        'w = cos(' + st.ang + '° / 2) · the (x, y, z) part = axis × sin(' + st.ang + '° / 2)<br>length of q = <b>' + fmt(Math.sqrt(w * w + x * x + y * y + z * z)) + '</b> (always 1)';
    }
    slider(box, 'Angle (°)', -360, 360, 5, st.ang, function (v) { st.ang = v; upd(); });
    var sel = document.createElement('div'); sel.className = 'keys';
    ['X', 'Y', 'Z'].forEach(function (k) {
      var b = document.createElement('button'); b.type = 'button'; b.textContent = 'Axis ' + k;
      b.addEventListener('click', function () { st.axis = k; upd(); });
      sel.appendChild(b);
    });
    box.appendChild(sel);
    hint(box, 'The drawing shows the rotation around Z. Try 360°: q is (-1, 0, 0, 0) but the rotation is the same as 0°.');
    upd();
  };

  W.lerp = function (box) {
    var a = [-3, -1], b = [3, 2], st = { t: 0.5 }, pl = new Plane(box), r = readout(box);
    pl.handles = [handle(a), handle(b, '#e0803a')];
    pl.draw = function () {
      pl.line(a, b, css('--mute'));
      var p = [a[0] + (b[0] - a[0]) * st.t, a[1] + (b[1] - a[1]) * st.t];
      pl.dot(p, '#3b6fd6', 8); pl.text(p, 'P', '#3b6fd6'); pl.text(a, 'A', css('--acc')); pl.text(b, 'B', '#e0803a');
    };
    pl.onchange = function () {
      var p = [a[0] + (b[0] - a[0]) * st.t, a[1] + (b[1] - a[1]) * st.t];
      r.innerHTML = 'P = A + (B − A) × t = (<b>' + fmt(p[0]) + '</b>, <b>' + fmt(p[1]) + '</b>) · t = <b>' + st.t + '</b>';
    };
    slider(box, 't', 0, 1, 0.05, st.t, function (v) { st.t = v; pl.render(); pl.onchange(); });
    hint(box, 't = 0 is A, t = 1 is B. Drag A and B.'); pl.onchange();
  };

  W.slerp = function (box) {
    var st = { a0: 10, a1: 160, t: 0.5 }, pl = new Plane(box, { range: 1.6 }), r = readout(box);
    function u(d) { return [Math.cos(rad(d)), Math.sin(rad(d))]; }
    pl.draw = function () {
      pl.circle([0, 0], 1, css('--mute'));
      var A = u(st.a0), B = u(st.a1), t = st.t;
      var L = [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t];
      var S = u(st.a0 + (st.a1 - st.a0) * t);
      pl.line(A, B, css('--mute'));
      pl.arrow([0, 0], A, css('--acc'), 2, 'A'); pl.arrow([0, 0], B, '#e0803a', 2, 'B');
      pl.arrow([0, 0], L, '#d64545', 3, 'lerp'); pl.arrow([0, 0], S, '#3b6fd6', 3, 'slerp');
    };
    function upd() {
      var A = u(st.a0), B = u(st.a1), t = st.t, L = [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t];
      pl.render();
      r.innerHTML = '<span style="color:#d64545">lerp</span>: length <b>' + fmt(len(L)) + '</b> (shrinks in the middle)<br><span style="color:#3b6fd6">slerp</span>: length <b>1.00</b>, turns at constant speed';
    }
    slider(box, 't', 0, 1, 0.05, st.t, function (v) { st.t = v; upd(); });
    slider(box, 'Angle of B (°)', 20, 180, 5, st.a1, function (v) { st.a1 = v; upd(); });
    upd();
  };

  function mount(name, box) {
    if (W[name]) W[name](box);
    else box.textContent = '(figure not found: ' + name + ')';
  }
  return { mount: mount };
})();
