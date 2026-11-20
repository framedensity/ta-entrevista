TOOLS.add({
"id": "walk_in_place",
"order": 1,
"title": "Walk In Place",
"tagline": "Preview a travelling walk cycle in place, without ever saving the preview into the scene.",
"overview": [
"A walk cycle with root motion travels forward, so it walks off screen. To judge the cycle (or playblast it for a reel) you want to see it **in place**, like on a treadmill.",
"The tool measures how the hips (or the feet) travel, and keys the **opposite** of that travel on the world controller, on an **additive animation layer**. The character still walks, but the travel is cancelled.",
"### What you can compare",
"- **Keep in place**: the hips, the point between the feet, or a blend of both.\n- **Cancel**: *average speed* removes only the constant forward speed, so speed changes inside the step, bob and sway stay visible (a treadmill). *Exact* pins that point completely; everything else moves around it.\n- **Axes**: forward only, or forward and sideways.",
"The six combinations can be stepped through with `<` and `>` while the preview is on.",
"### The key promise",
"The preview can never end up in a saved file. It is removed just before every save or export and put back right after. **Bake** keeps the current version on a normal layer when you do want it saved."
],
"why": [
"### Math separate from Maya",
"The functions that do the actual math (`track_points`, `detect_forward`, `fit_slope`, `counter_motion`) take plain tuples and lists and never call Maya. That is why the file can be imported outside Maya (`cmds = None` when the import fails) and why `tests/test_walk_in_place.py` can test them with plain Python.",
"### Measure once, preview many times",
"`Samples` reads every world position once, with the preview off. Switching versions only redoes the math on those stored positions, so it is instant. You press **Re-measure** only after changing the animation.",
"### An additive layer instead of editing keys",
"The counter-motion lives on its own additive layer. The original animation is never touched, muting the layer shows the original, and deleting the layer removes the preview completely.",
"### The preview is outside undo",
"Turning the preview on and off is wrapped in `_NoUndo`, so it does not fill the undo queue and Ctrl+Z never brings back a half-removed preview. Bake, which is a real change, *is* undoable.",
"### Scene callbacks as a safety net",
"`MSceneMessage` callbacks run before and after save and export. Before: delete the preview. After: put it back and mark the scene as unmodified, because what is on disk is the clean version.",
"### World space, then back to local",
"Positions are measured in world space, so the tool works whatever the rig hierarchy is. The offsets are converted into the world controller's parent space with its `parentInverseMatrix`, because translate values are local."
],
"flow": [
"### What happens when you press Preview",
"1. `_toggle(True)` saves the settings and calls `_apply` through `_run` (which turns errors into a status message).\n2. `_apply` reads the UI into a config dict (`get_cfg`). If nothing was measured yet, `_measure` builds a `Samples`.\n3. `Samples.__init__` checks the world controller, then reads world positions of hips and feet on every frame (`_positions`) and the world controller's `parentInverseMatrix` on every frame.\n4. `Samples.offsets` runs the math: `track_points` → `detect_forward` → `counter_motion`, then converts each world offset into local translate values.\n5. `PREVIEW.apply` installs the save/export callbacks, deletes any old preview and writes the new layer with `_write_layer`.",
"### What happens when you save",
"`_Preview._before` deletes the preview layer → Maya writes the file → `_Preview._after` writes the layer again and clears the \"modified\" flag.",
"### Switching versions",
"`_step` or a combo box change → `_version_changed` → `_apply` again with the stored samples: only the math runs."
],
"review": [
"**Callbacks are never removed.** `uninstall()` exists but nothing calls it, so after the window closes the save/export callbacks stay registered for the session. They do nothing when no preview is active, but calling `PREVIEW.uninstall()` in `closeEvent` would be cleaner.",
"**\"Exact\" past the range.** The curves use linear pre/post infinity. That is right for \"average speed\", but for \"exact\" the extrapolation follows only the last segment's slope, so outside the measured range the point can drift.",
"**Travel readout.** The status line adds the absolute x, y and z offsets of the last frame. It is a quick indicator, not a true distance (a diagonal walk is over-reported).",
"**Direction sign.** For a cycle that barely travels, the main axis from `detect_forward` can point either way. It does not change the result, because the cancellation works along the axis in both directions."
],
"files": [
{
"path": "walk_in_place.py",
"lang": "py",
"note": "The whole tool in one file: math, Maya sampling, the preview layer and its save guard, the bake, and the UI.",
"code": "# -*- coding: utf-8 -*-\n\"\"\"\nWalk In Place  -  Maya 2020.x (Python 2.7 / PySide2)\n\nPreviews a travelling walk cycle in place: the travel of the hips (or the\nfeet) is measured and the opposite is keyed on the world controller, on a\ntemporary additive animation layer.\n\nThe preview can't end up in a saved file: it is removed right before every\nsave / autosave / export and put back right after, and removed when a scene\nis opened or created. \"Bake\" keeps the current version on a normal layer.\n\nVersions to compare (switch them live while previewing):\n  Track   hips | between the feet | hips + feet blend\n  Cancel  average speed (treadmill: bob, sway and speed changes stay)\n          exact (that point never moves forward)\n\nInstall : copy this file to your scripts folder (e.g. ~/maya/2020/scripts)\nRun     : import walk_in_place; walk_in_place.show()\n\"\"\"\nfrom __future__ import division, print_function\n\nimport json\nimport math\nimport traceback\n\ntry:\n    import maya.cmds as cmds\n    import maya.OpenMayaUI as omui\n    import maya.api.OpenMaya as om\nexcept ImportError:  # the maths can be tested outside of Maya\n    cmds = omui = om = None\n\ntry:\n    from PySide2 import QtCore, QtWidgets\n    from shiboken2 import wrapInstance\nexcept ImportError:\n    try:\n        from PySide6 import QtCore, QtWidgets\n        from shiboken6 import wrapInstance\n    except ImportError:\n        QtCore = QtWidgets = wrapInstance = None\n\ntry:\n    long\nexcept NameError:\n    long = int\n\nPREVIEW_LAYER = 'walkInPlace_PREVIEW'\nBAKE_LAYER = 'walkInPlace'\nTAG = 'walkInPlacePreview'\nOPTION_VAR = 'walkInPlaceSettings'\n\nTRACK_HIPS = 'hips'\nTRACK_FEET = 'feet'\nTRACK_BLEND = 'blend'\nSTYLE_AVERAGE = 'average'\nSTYLE_EXACT = 'exact'\nAXES_FORWARD = 'forward'\nAXES_GROUND = 'ground'\n\nVERSIONS = [(TRACK_HIPS, STYLE_AVERAGE), (TRACK_HIPS, STYLE_EXACT),\n            (TRACK_FEET, STYLE_AVERAGE), (TRACK_FEET, STYLE_EXACT),\n            (TRACK_BLEND, STYLE_AVERAGE), (TRACK_BLEND, STYLE_EXACT)]\nTRACK_LABELS = {TRACK_HIPS: 'Hips', TRACK_FEET: 'Between the feet',\n                TRACK_BLEND: 'Hips + feet'}\nSTYLE_LABELS = {STYLE_AVERAGE: 'average speed', STYLE_EXACT: 'exact'}\n\nDEFAULTS = {\n    'world': '', 'hips': '', 'foot_l': '', 'foot_r': '',\n    'track': TRACK_HIPS, 'style': STYLE_AVERAGE,\n    'axes': AXES_FORWARD, 'direction': 'auto',     # auto | x | z\n    'use_timeline': True, 'start': 1, 'end': 30,\n}\n\n\nclass WalkInPlaceError(Exception):\n    pass\n\n\n# --------------------------------------------------------------------------\n# maths (no Maya: see tests/test_walk_in_place.py)\n# Positions are (x, y, z) in world space; the ground plane is XZ.\n# --------------------------------------------------------------------------\ndef midpoint(a, b):\n    return tuple((x + y) * 0.5 for x, y in zip(a, b))\n\n\ndef track_points(track, hips, foot_l, foot_r):\n    \"\"\"The point that should stay in place, per frame.\"\"\"\n    if track == TRACK_HIPS:\n        return list(hips)\n    feet = [midpoint(a, b) for a, b in zip(foot_l, foot_r)]\n    if track == TRACK_FEET:\n        return feet\n    return [midpoint(h, f) for h, f in zip(hips, feet)]\n\n\ndef detect_forward(points, direction='auto'):\n    \"\"\"\n    Unit travel direction on the ground plane, as (x, z). 'auto' uses the\n    net travel; for a cycle that barely travels, the main axis of motion.\n    \"\"\"\n    if direction == 'x':\n        return (1.0, 0.0)\n    if direction == 'z':\n        return (0.0, 1.0)\n    dx = points[-1][0] - points[0][0]\n    dz = points[-1][2] - points[0][2]\n    n = math.hypot(dx, dz)\n    spread = max(max(p[0] for p in points) - min(p[0] for p in points),\n                 max(p[2] for p in points) - min(p[2] for p in points), 1e-9)\n    if n > 0.05 * spread:\n        return (dx / n, dz / n)\n    # principal axis of the XZ motion\n    mx = sum(p[0] for p in points) / len(points)\n    mz = sum(p[2] for p in points) / len(points)\n    sxx = sum((p[0] - mx) ** 2 for p in points)\n    szz = sum((p[2] - mz) ** 2 for p in points)\n    sxz = sum((p[0] - mx) * (p[2] - mz) for p in points)\n    angle = 0.5 * math.atan2(2.0 * sxz, sxx - szz)\n    return (math.cos(angle), math.sin(angle))\n\n\ndef fit_slope(times, values):\n    \"\"\"Least squares slope: the average speed.\"\"\"\n    n = len(times)\n    if n < 2:\n        return 0.0\n    mt = sum(times) / n\n    mv = sum(values) / n\n    den = sum((t - mt) ** 2 for t in times)\n    if den < 1e-12:\n        return 0.0\n    return sum((t - mt) * (v - mv) for t, v in zip(times, values)) / den\n\n\ndef counter_motion(times, points, style, axes=AXES_FORWARD, forward=(1.0, 0.0)):\n    \"\"\"\n    World offsets {t: (x, y, z)} that cancel the travel of `points`,\n    0 on the first frame. Forward only, or the whole ground plane.\n    \"\"\"\n    t0, p0 = times[0], points[0]\n    comps = []\n    if axes == AXES_FORWARD:\n        comps.append(((forward[0], 0.0, forward[1]),\n                      [(p[0] - p0[0]) * forward[0] + (p[2] - p0[2]) * forward[1]\n                       for p in points]))\n    else:\n        comps.append(((1.0, 0.0, 0.0), [p[0] - p0[0] for p in points]))\n        comps.append(((0.0, 0.0, 1.0), [p[2] - p0[2] for p in points]))\n    out = dict((t, [0.0, 0.0, 0.0]) for t in times)\n    for axis, travel in comps:\n        if style == STYLE_AVERAGE:\n            speed = fit_slope(times, travel)\n            travel = [speed * (t - t0) for t in times]\n        for t, d in zip(times, travel):\n            for i in range(3):\n                out[t][i] -= d * axis[i]\n    return dict((t, tuple(v)) for t, v in out.items())\n\n\ndef version_index(track, style):\n    try:\n        return VERSIONS.index((track, style))\n    except ValueError:\n        return 0\n\n\ndef version_label(track, style):\n    return '%d/%d  %s, %s' % (version_index(track, style) + 1, len(VERSIONS),\n                              TRACK_LABELS[track], STYLE_LABELS[style])\n\n\n# --------------------------------------------------------------------------\n# Maya: sampling\n# --------------------------------------------------------------------------\ndef _frames(cfg):\n    if cfg['use_timeline']:\n        a = int(cmds.playbackOptions(q=True, min=True))\n        b = int(cmds.playbackOptions(q=True, max=True))\n    else:\n        a, b = int(cfg['start']), int(cfg['end'])\n    if b < a:\n        a, b = b, a\n    if b - a < 1:\n        raise WalkInPlaceError('The range needs at least two frames.')\n    return [float(t) for t in range(a, b + 1)]\n\n\ndef _positions(node, frames):\n    \"\"\"World pivot positions (internal units) over frames.\"\"\"\n    rp = cmds.getAttr(node + '.rotatePivot')[0]\n    rp = om.MPoint(*[om.MDistance(v, om.MDistance.uiUnit()).asCentimeters() for v in rp])\n    out = []\n    for t in frames:\n        p = rp * om.MMatrix(cmds.getAttr(node + '.worldMatrix', time=t))\n        out.append((p.x, p.y, p.z))\n    return out\n\n\ndef _needed(cfg, track):\n    keys = ['hips'] if track == TRACK_HIPS else (\n        ['foot_l', 'foot_r'] if track == TRACK_FEET else ['hips', 'foot_l', 'foot_r'])\n    names = {'hips': 'hips', 'foot_l': 'left foot', 'foot_r': 'right foot'}\n    for k in keys:\n        if not cfg[k] or not cmds.objExists(cfg[k]):\n            raise WalkInPlaceError('Pick the %s control for \"%s\".' % (names[k],\n                                                                       TRACK_LABELS[track]))\n    return keys\n\n\nclass Samples(object):\n    \"\"\"Positions measured with the preview off, reused by every version.\"\"\"\n\n    def __init__(self, cfg):\n        self.frames = _frames(cfg)\n        self.points = {}\n        self.parent_inv = []\n        world = cfg['world']\n        if not world or not cmds.objExists(world):\n            raise WalkInPlaceError('Pick the world controller.')\n        for a in ('translateX', 'translateY', 'translateZ'):\n            plug = '%s.%s' % (world, a)\n            if cmds.getAttr(plug, lock=True):\n                raise WalkInPlaceError('%s is locked on the world controller.' % a)\n        for k in ('hips', 'foot_l', 'foot_r'):\n            node = cfg[k]\n            if node and cmds.objExists(node):\n                self.points[k] = _positions(node, self.frames)\n        for t in self.frames:\n            self.parent_inv.append(om.MMatrix(cmds.getAttr(world + '.parentInverseMatrix',\n                                                           time=t)))\n\n    def offsets(self, cfg):\n        \"\"\"{t: local translate offset (UI units)} for the chosen version.\"\"\"\n        _needed(cfg, cfg['track'])\n        empty = [None] * len(self.frames)\n        pts = track_points(cfg['track'], self.points.get('hips', empty),\n                           self.points.get('foot_l', empty), self.points.get('foot_r', empty))\n        forward = detect_forward(pts, cfg['direction'])\n        world = counter_motion(self.frames, pts, cfg['style'], cfg['axes'], forward)\n        unit = om.MDistance(1.0, om.MDistance.kCentimeters).asUnits(om.MDistance.uiUnit())\n        out = {}\n        for t, pim in zip(self.frames, self.parent_inv):\n            v = om.MVector(*world[t]) * pim\n            out[t] = (v.x * unit, v.y * unit, v.z * unit)\n        travel = sum(abs(a) for a in world[self.frames[-1]])\n        return out, forward, travel * unit\n\n\n# --------------------------------------------------------------------------\n# Maya: preview layer that never gets saved\n# --------------------------------------------------------------------------\nclass _NoUndo(object):\n    def __enter__(self):\n        self.state = cmds.undoInfo(q=True, stateWithoutFlush=True)\n        cmds.undoInfo(stateWithoutFlush=False)\n\n    def __exit__(self, *args):\n        cmds.undoInfo(stateWithoutFlush=self.state)\n\n\ndef _write_layer(layer, world, offsets, tag):\n    if not cmds.objExists(layer):\n        layer = cmds.animLayer(layer, override=False)\n        if tag:\n            cmds.addAttr(layer, longName=TAG, attributeType='bool', defaultValue=True)\n    plugs = ['%s.%s' % (world, a) for a in ('translateX', 'translateY', 'translateZ')]\n    cmds.animLayer(layer, e=True, attribute=plugs)\n    times = sorted(offsets)\n    for i, plug in enumerate(plugs):\n        curve = None\n        for t in times:\n            v = offsets[t][i]\n            if curve is None:\n                cmds.setKeyframe(plug, time=t, value=v, animLayer=layer)\n                found = cmds.animLayer(layer, q=True, findCurveForPlug=plug) or []\n                curve = found[0] if found else None\n                if curve:   # setKeyframe can store another value on layered plugs\n                    cmds.keyframe(curve, e=True, time=(t, t), absolute=True, valueChange=v)\n            else:\n                cmds.setKeyframe(curve, time=t, value=v)\n        if curve:\n            cmds.keyTangent(curve, inTangentType='linear', outTangentType='linear')\n            # keep walking in place if the timeline is longer than the range\n            cmds.setAttr(curve + '.preInfinity', 1)\n            cmds.setAttr(curve + '.postInfinity', 1)\n    return layer\n\n\ndef _delete_previews():\n    found = [l for l in (cmds.ls(type='animLayer') or [])\n             if cmds.attributeQuery(TAG, node=l, exists=True)]\n    if found:\n        cmds.delete(found)\n    return len(found)\n\n\nclass _Preview(object):\n    \"\"\"The live preview: what's applied, and the save/export guard.\"\"\"\n\n    def __init__(self):\n        self.world = None\n        self.offsets = None\n        self.callbacks = []\n        self.suspended = False\n\n    @property\n    def active(self):\n        return self.offsets is not None\n\n    def apply(self, world, offsets):\n        self._install()\n        with _NoUndo():\n            _delete_previews()\n            _write_layer(PREVIEW_LAYER, world, offsets, tag=True)\n        # no viewport message: the preview is used for demoreel playblasts\n        self.world, self.offsets = world, offsets\n\n    def remove(self):\n        with _NoUndo():\n            _delete_previews()\n        self.world, self.offsets = None, None\n\n    # save / export guard ---------------------------------------------\n    def _install(self):\n        if self.callbacks:\n            return\n        msg = om.MSceneMessage\n        for kind, fn in ((msg.kBeforeSave, self._before), (msg.kAfterSave, self._after),\n                         (msg.kBeforeExport, self._before), (msg.kAfterExport, self._after),\n                         (msg.kBeforeNew, self._forget), (msg.kBeforeOpen, self._forget)):\n            self.callbacks.append(msg.addCallback(kind, fn))\n\n    def uninstall(self):\n        if self.callbacks:\n            om.MMessage.removeCallbacks(self.callbacks)\n        self.callbacks = []\n\n    def _before(self, *args):\n        try:\n            if self.active:\n                with _NoUndo():\n                    _delete_previews()\n                self.suspended = True\n        except Exception:\n            traceback.print_exc()\n\n    def _after(self, *args):\n        try:\n            if self.suspended and self.active and cmds.objExists(self.world):\n                with _NoUndo():\n                    _write_layer(PREVIEW_LAYER, self.world, self.offsets, tag=True)\n                cmds.file(modified=False)       # the saved file is what's on disk\n        except Exception:\n            traceback.print_exc()\n        self.suspended = False\n\n    def _forget(self, *args):\n        self.world, self.offsets, self.suspended = None, None, False\n\n\nPREVIEW = _Preview()\n\n\ndef bake(world, offsets):\n    \"\"\"Keeps the current version on a normal (saved) layer. Undoable.\"\"\"\n    name = BAKE_LAYER\n    i = 1\n    while cmds.objExists(name):\n        i += 1\n        name = '%s%d' % (BAKE_LAYER, i)\n    cmds.undoInfo(openChunk=True, chunkName='Walk In Place bake')\n    try:\n        return _write_layer(name, world, offsets, tag=False)\n    finally:\n        cmds.undoInfo(closeChunk=True)\n\n\n# --------------------------------------------------------------------------\n# UI\n# --------------------------------------------------------------------------\ndef _maya_main_window():\n    ptr = omui.MQtUtil.mainWindow()\n    return wrapInstance(long(ptr), QtWidgets.QWidget)\n\n\n_DialogBase = QtWidgets.QDialog if QtWidgets else object\n\n\nclass WalkInPlaceUI(_DialogBase):\n    OBJECT_NAME = 'walkInPlaceWindow'\n\n    def __init__(self, parent=None):\n        super(WalkInPlaceUI, self).__init__(parent)\n        self.setObjectName(self.OBJECT_NAME)\n        self.setWindowTitle('Walk In Place')\n        self.setMinimumWidth(400)\n        self.samples = None\n        self._build()\n        self._connect()\n        self.set_cfg(self._load())\n        left = _delete_previews_safely()\n        self._say('Removed a leftover preview layer.' if left else\n                  'Pick the controls, then press Preview.')\n        self._update_version_label()\n\n    def _build(self):\n        W = QtWidgets\n        main = W.QVBoxLayout(self)\n\n        box = W.QGroupBox('Controls')\n        grid = W.QGridLayout(box)\n        self.fields = {}\n        for r, (key, label, tip) in enumerate((\n                ('world', 'World controller', 'Gets the opposite of the travel'),\n                ('hips', 'Hips', ''),\n                ('foot_l', 'Left foot', 'Only for the feet versions'),\n                ('foot_r', 'Right foot', 'Only for the feet versions'))):\n            grid.addWidget(W.QLabel(label), r, 0)\n            field = W.QLineEdit()\n            field.setToolTip(tip)\n            grid.addWidget(field, r, 1)\n            b = W.QPushButton('<<')\n            b.setToolTip('Use the selected control')\n            b.clicked.connect(lambda checked=False, f=field: self._pick(f))\n            grid.addWidget(b, r, 2)\n            self.fields[key] = field\n        main.addWidget(box)\n\n        box = W.QGroupBox('Version')\n        grid = W.QGridLayout(box)\n        grid.addWidget(W.QLabel('Keep in place'), 0, 0)\n        self.track = W.QComboBox()\n        for k in (TRACK_HIPS, TRACK_FEET, TRACK_BLEND):\n            self.track.addItem(TRACK_LABELS[k], k)\n        grid.addWidget(self.track, 0, 1, 1, 2)\n        grid.addWidget(W.QLabel('Cancel'), 1, 0)\n        self.style = W.QComboBox()\n        self.style.addItem('Average speed (treadmill)', STYLE_AVERAGE)\n        self.style.addItem('Exactly (point never moves)', STYLE_EXACT)\n        self.style.setToolTip('Average: the speed changes within the cycle stay visible.\\n'\n                              'Exact: that point is pinned, everything else moves around it.')\n        grid.addWidget(self.style, 1, 1, 1, 2)\n        self.b_prev = W.QPushButton('<')\n        self.b_next = W.QPushButton('>')\n        self.version_label = W.QLabel('')\n        grid.addWidget(self.b_prev, 2, 0)\n        grid.addWidget(self.version_label, 2, 1)\n        grid.addWidget(self.b_next, 2, 2)\n        main.addWidget(box)\n\n        box = W.QGroupBox('Direction && Range')\n        grid = W.QGridLayout(box)\n        grid.addWidget(W.QLabel('Cancel'), 0, 0)\n        self.axes = W.QComboBox()\n        self.axes.addItem('Forward only', AXES_FORWARD)\n        self.axes.addItem('Forward and sideways', AXES_GROUND)\n        grid.addWidget(self.axes, 0, 1, 1, 3)\n        grid.addWidget(W.QLabel('Forward is'), 1, 0)\n        self.direction = W.QComboBox()\n        self.direction.addItem('Detected from the travel', 'auto')\n        self.direction.addItem('World X', 'x')\n        self.direction.addItem('World Z', 'z')\n        grid.addWidget(self.direction, 1, 1, 1, 3)\n        self.use_timeline = W.QCheckBox('Timeline range')\n        grid.addWidget(self.use_timeline, 2, 0, 1, 2)\n        self.start = W.QSpinBox()\n        self.end = W.QSpinBox()\n        for s in (self.start, self.end):\n            s.setRange(-100000, 100000)\n        grid.addWidget(self.start, 2, 2)\n        grid.addWidget(self.end, 2, 3)\n        main.addWidget(box)\n\n        self.b_preview = W.QPushButton('Preview In Place')\n        self.b_preview.setCheckable(True)\n        self.b_preview.setStyleSheet(\n            'QPushButton {font-weight: bold; padding: 8px;}'\n            'QPushButton:checked {background: #f5a623; color: #241500;}')\n        main.addWidget(self.b_preview)\n        row = W.QHBoxLayout()\n        self.b_refresh = W.QPushButton('Re-measure')\n        self.b_refresh.setToolTip('Use after changing the animation')\n        self.b_bake = W.QPushButton('Bake This Version')\n        self.b_bake.setToolTip('Keep it on a normal \"%s\" layer (saved, undoable)' % BAKE_LAYER)\n        row.addWidget(self.b_refresh)\n        row.addWidget(self.b_bake)\n        main.addLayout(row)\n        self.status = W.QLabel('')\n        self.status.setWordWrap(True)\n        main.addWidget(self.status)\n\n    def _connect(self):\n        self.b_preview.toggled.connect(self._toggle)\n        self.b_refresh.clicked.connect(self._remeasure)\n        self.b_bake.clicked.connect(self._bake)\n        self.b_prev.clicked.connect(lambda: self._step(-1))\n        self.b_next.clicked.connect(lambda: self._step(1))\n        for combo in (self.track, self.style, self.axes, self.direction):\n            combo.currentIndexChanged.connect(self._version_changed)\n        self.use_timeline.toggled.connect(self._range_changed)\n        self.start.valueChanged.connect(self._range_changed)\n        self.end.valueChanged.connect(self._range_changed)\n        for f in self.fields.values():\n            f.editingFinished.connect(self._controls_changed)\n\n    def _say(self, text):\n        self.status.setText(text)\n\n    def _pick(self, field):\n        sel = cmds.ls(sl=True, type='transform')\n        if sel:\n            field.setText(sel[0])\n            self._controls_changed()\n\n    # -- config -----------------------------------------------------------\n    def get_cfg(self):\n        cfg = dict((k, f.text().strip()) for k, f in self.fields.items())\n        cfg.update({'track': self.track.currentData(), 'style': self.style.currentData(),\n                    'axes': self.axes.currentData(), 'direction': self.direction.currentData(),\n                    'use_timeline': self.use_timeline.isChecked(),\n                    'start': self.start.value(), 'end': self.end.value()})\n        return cfg\n\n    def set_cfg(self, cfg):\n        c = dict(DEFAULTS)\n        c.update(cfg or {})\n        for k, f in self.fields.items():\n            f.setText(c[k])\n        for combo, k in ((self.track, 'track'), (self.style, 'style'), (self.axes, 'axes'),\n                         (self.direction, 'direction')):\n            combo.blockSignals(True)\n            combo.setCurrentIndex(max(0, combo.findData(c[k])))\n            combo.blockSignals(False)\n        self.use_timeline.setChecked(c['use_timeline'])\n        self.start.setValue(int(c['start']))\n        self.end.setValue(int(c['end']))\n        self.start.setEnabled(not c['use_timeline'])\n        self.end.setEnabled(not c['use_timeline'])\n\n    def _load(self):\n        try:\n            if cmds.optionVar(exists=OPTION_VAR):\n                return json.loads(cmds.optionVar(q=OPTION_VAR))\n        except Exception:\n            pass\n        return {}\n\n    def _save(self):\n        cmds.optionVar(sv=(OPTION_VAR, json.dumps(self.get_cfg())))\n\n    # -- preview ----------------------------------------------------------\n    def _update_version_label(self):\n        self.version_label.setText(version_label(self.track.currentData(),\n                                                 self.style.currentData()))\n\n    def _step(self, direction):\n        i = (version_index(self.track.currentData(), self.style.currentData()) + direction) \\\n            % len(VERSIONS)\n        track, style = VERSIONS[i]\n        for combo, v in ((self.track, track), (self.style, style)):\n            combo.blockSignals(True)\n            combo.setCurrentIndex(combo.findData(v))\n            combo.blockSignals(False)\n        self._version_changed()\n\n    def _measure(self):\n        \"\"\"Samples with the preview off: it moves the whole rig.\"\"\"\n        was = PREVIEW.active\n        if was:\n            PREVIEW.remove()\n        self.samples = Samples(self.get_cfg())\n\n    def _apply(self):\n        cfg = self.get_cfg()\n        if self.samples is None:\n            self._measure()\n        offsets, forward, travel = self.samples.offsets(cfg)\n        PREVIEW.apply(cfg['world'], offsets)\n        self._say('Previewing %s. Forward (x, z) = (%.2f, %.2f), %.3g units cancelled.\\n'\n                  'Not saved with the scene.' % (version_label(cfg['track'], cfg['style']),\n                                                 forward[0], forward[1], travel))\n        return offsets\n\n    def _run(self, fn):\n        try:\n            return fn()\n        except WalkInPlaceError as e:\n            self._say(str(e))\n        except Exception as e:\n            traceback.print_exc()\n            self._say('Error: %s (see Script Editor)' % e)\n        return None\n\n    def _toggle(self, on):\n        self._save()\n        if on:\n            if self._run(self._apply) is None:\n                self.b_preview.blockSignals(True)\n                self.b_preview.setChecked(False)\n                self.b_preview.blockSignals(False)\n                PREVIEW.remove()\n        else:\n            PREVIEW.remove()\n            self._say('Preview off.')\n        self.b_preview.setText('Preview In Place: ON' if self.b_preview.isChecked()\n                               else 'Preview In Place')\n\n    def _version_changed(self, *_):\n        self._update_version_label()\n        if PREVIEW.active:\n            self._run(self._apply)\n\n    def _range_changed(self, *_):\n        self.start.setEnabled(not self.use_timeline.isChecked())\n        self.end.setEnabled(not self.use_timeline.isChecked())\n        self.samples = None\n        if PREVIEW.active:\n            self._run(self._apply)\n\n    def _controls_changed(self):\n        self.samples = None\n        if PREVIEW.active:\n            self._run(self._apply)\n\n    def _remeasure(self):\n        def go():\n            self._measure()\n            if self.b_preview.isChecked():\n                self._apply()\n            else:\n                self._say('Measured %d frames.' % len(self.samples.frames))\n            return True\n        self._run(go)\n\n    def _bake(self):\n        def go():\n            cfg = self.get_cfg()\n            if self.samples is None:\n                self._measure()\n            offsets, _, _ = self.samples.offsets(cfg)\n            if self.b_preview.isChecked():\n                self.b_preview.setChecked(False)\n            layer = bake(cfg['world'], offsets)\n            self._say('Baked %s on layer %s (saved with the scene, undoable).'\n                      % (version_label(cfg['track'], cfg['style']), layer))\n            return True\n        self._run(go)\n\n    def closeEvent(self, event):\n        try:\n            self._save()\n            if PREVIEW.active:\n                PREVIEW.remove()\n        except Exception:\n            pass\n        super(WalkInPlaceUI, self).closeEvent(event)\n\n\ndef _delete_previews_safely():\n    try:\n        with _NoUndo():\n            return _delete_previews()\n    except Exception:\n        return 0\n\n\n_window = None\n\n\ndef show():\n    global _window\n    if _window is not None:\n        try:\n            _window.close()\n            _window.deleteLater()\n        except Exception:\n            pass\n    _window = WalkInPlaceUI(_maya_main_window())\n    _window.show()\n    return _window\n\n\nif __name__ == '__main__':\n    show()",
"aliases": {
"division": "__future__.division",
"print_function": "__future__.print_function",
"json": "json",
"math": "math",
"traceback": "traceback",
"cmds": "maya.cmds",
"omui": "maya.OpenMayaUI",
"om": "maya.api.OpenMaya",
"QtCore": "QtCore",
"QtWidgets": "QtWidgets",
"wrapInstance": "shiboken.wrapInstance",
"W": "QtWidgets"
},
"outline": [
{
"q": "WalkInPlaceError",
"k": "class",
"s": 77,
"e": 78,
"doc": "",
"n": "A custom error type for problems the user can fix (missing control, locked channel, range too short). `_run` catches this type and shows its message in the window; any other error is treated as a bug and prints a traceback.",
"c": [],
"b": [
[
0,
"_frames"
],
[
0,
"_needed"
],
[
0,
"Samples.__init__"
],
[
0,
"WalkInPlaceUI._run"
]
]
},
{
"q": "midpoint",
"k": "def",
"s": 85,
"e": 86,
"doc": "",
"n": "The point halfway between two 3D points, component by component.",
"c": [],
"b": [
[
0,
"track_points"
]
]
},
{
"q": "track_points",
"k": "def",
"s": 89,
"e": 96,
"doc": "The point that should stay in place, per frame.",
"n": "Builds the list of points (one per frame) that should stay in place: the hips, the midpoint between the feet, or the midpoint between those two.",
"c": [
[
0,
"midpoint"
]
],
"b": [
[
0,
"Samples.offsets"
],
[
1,
"Tracks.test_feet_and_blend"
]
]
},
{
"q": "detect_forward",
"k": "def",
"s": 99,
"e": 122,
"doc": "Unit travel direction on the ground plane, as (x, z). 'auto' uses the\nnet travel; for a cycle that barely travels, the main axis of motion.",
"n": "Works out which way the character walks on the ground (XZ). Normally that is simply the direction from the first to the last point. If the cycle barely travels (net travel under 5% of the motion size), that direction would be noise, so it uses the **main axis** of the motion instead (the direction in which the points spread the most).",
"c": [],
"b": [
[
0,
"Samples.offsets"
],
[
1,
"Direction.test_detects_diagonal_travel"
],
[
1,
"Direction.test_forced_axis"
],
[
1,
"Direction.test_cycle_that_barely_travels_uses_the_main_axis"
]
]
},
{
"q": "fit_slope",
"k": "def",
"s": 125,
"e": 135,
"doc": "Least squares slope: the average speed.",
"n": "Least-squares line fit: the slope of the best straight line through `(time, value)` pairs. For travel over time, that slope is the **average speed**. It ignores the small speed changes inside each step.",
"c": [],
"b": [
[
0,
"counter_motion"
],
[
1,
"Cancel.test_average_speed_value"
]
]
},
{
"q": "counter_motion",
"k": "def",
"s": 138,
"e": 160,
"doc": "World offsets {t: (x, y, z)} that cancel the travel of `points`,\n0 on the first frame. Forward only, or the whole ground plane.",
"n": "The heart of the tool. For each frame it returns the world offset that cancels the travel, starting at 0 on the first frame. With *average*, it cancels `speed * time` (a straight line), so the in-step speed changes stay. With *exact*, it cancels the real travel, so the point does not move at all. With *forward only* it works along the detected direction; otherwise along X and Z separately.",
"c": [
[
0,
"fit_slope"
]
],
"b": [
[
0,
"Samples.offsets"
],
[
1,
"Cancel.test_average_speed_keeps_the_walk_but_removes_the_travel"
],
[
1,
"Cancel.test_exact_pins_the_point_forward"
],
[
1,
"Cancel.test_ground_plane_also_cancels_sideways"
]
]
},
{
"q": "version_index",
"k": "def",
"s": 163,
"e": 167,
"doc": "",
"n": "Position of a (track, style) pair in `VERSIONS`, or 0 if not found.",
"c": [],
"b": [
[
0,
"version_label"
],
[
0,
"WalkInPlaceUI._step"
]
]
},
{
"q": "version_label",
"k": "def",
"s": 170,
"e": 172,
"doc": "",
"n": "The \"3/6  Between the feet, average speed\" text shown in the window.",
"c": [
[
0,
"version_index"
]
],
"b": [
[
0,
"WalkInPlaceUI._update_version_label"
],
[
0,
"WalkInPlaceUI._apply"
],
[
0,
"WalkInPlaceUI._bake.go"
],
[
1,
"Tracks.test_versions_cycle"
]
]
},
{
"q": "_frames",
"k": "def",
"s": 178,
"e": 188,
"doc": "",
"n": "The list of frames to sample: the timeline range or the custom start/end. Swaps them if reversed and refuses ranges shorter than two frames.",
"c": [
[
0,
"WalkInPlaceError"
]
],
"b": [
[
0,
"Samples.__init__"
]
]
},
{
"q": "_positions",
"k": "def",
"s": 191,
"e": 199,
"doc": "World pivot positions (internal units) over frames.",
"n": "World position of a control's pivot on every frame. It reads the `worldMatrix` at each time (without moving the timeline) and transforms the rotate pivot by it. The pivot is converted to centimeters first because matrices are in Maya's internal unit (cm) while `getAttr` of the pivot returns UI units.",
"c": [],
"b": [
[
0,
"Samples.__init__"
]
]
},
{
"q": "_needed",
"k": "def",
"s": 202,
"e": 210,
"doc": "",
"n": "Checks that the controls needed by the chosen version are filled in and exist, and raises a friendly error otherwise.",
"c": [
[
0,
"WalkInPlaceError"
]
],
"b": [
[
0,
"Samples.offsets"
]
]
},
{
"q": "Samples",
"k": "class",
"s": 213,
"e": 249,
"doc": "Positions measured with the preview off, reused by every version.",
"n": "Everything measured from the scene, kept so that switching versions does not re-read the scene.",
"c": [],
"b": [
[
0,
"WalkInPlaceUI._measure"
]
]
},
{
"q": "Samples.__init__",
"k": "def",
"s": 216,
"e": 233,
"doc": "",
"n": "Validates the world controller (must exist, translate not locked), then samples the hips and both feet if set, and the world controller's `parentInverseMatrix` on every frame.",
"c": [
[
0,
"_frames"
],
[
0,
"WalkInPlaceError"
],
[
0,
"_positions"
]
],
"b": []
},
{
"q": "Samples.offsets",
"k": "def",
"s": 235,
"e": 249,
"doc": "{t: local translate offset (UI units)} for the chosen version.",
"n": "Runs the math for the current settings and converts the result to what will be keyed: world offset → parent space (vector times `parentInverseMatrix`) → UI units. Also returns the forward direction and the travel cancelled, for the status line.",
"c": [
[
0,
"_needed"
],
[
0,
"track_points"
],
[
0,
"detect_forward"
],
[
0,
"counter_motion"
]
],
"b": []
},
{
"q": "_NoUndo",
"k": "class",
"s": 255,
"e": 261,
"doc": "",
"n": "A context manager that pauses undo recording and restores the previous state afterwards.",
"c": [],
"b": [
[
0,
"_Preview.apply"
],
[
0,
"_Preview.remove"
],
[
0,
"_Preview._before"
],
[
0,
"_Preview._after"
],
[
0,
"_delete_previews_safely"
]
]
},
{
"q": "_NoUndo.__enter__",
"k": "def",
"s": 256,
"e": 258,
"doc": "",
"n": "Remembers whether undo was on, then turns recording off without flushing the queue (`stateWithoutFlush=False`), so the user's existing undo history survives.",
"c": [],
"b": []
},
{
"q": "_NoUndo.__exit__",
"k": "def",
"s": 260,
"e": 261,
"doc": "",
"n": "Puts undo recording back as it was.",
"c": [],
"b": []
},
{
"q": "_write_layer",
"k": "def",
"s": 264,
"e": 289,
"doc": "",
"n": "Creates the animation layer if needed (additive: `override=False`), optionally tags it with a custom attribute, adds the world controller's translate channels and keys one value per frame. The first key is set through `setKeyframe(animLayer=...)` so Maya creates the layer curve; after that the tool keys the curve node directly. Tangents are linear and pre/post infinity is linear so the in-place effect continues past the range.",
"c": [],
"b": [
[
0,
"_Preview.apply"
],
[
0,
"_Preview._after"
],
[
0,
"bake"
]
]
},
{
"q": "_delete_previews",
"k": "def",
"s": 292,
"e": 297,
"doc": "",
"n": "Deletes every animation layer that carries the preview tag attribute. Finding layers by the tag, not by name, means a renamed or duplicated preview layer is still found.",
"c": [],
"b": [
[
0,
"_Preview.apply"
],
[
0,
"_Preview.remove"
],
[
0,
"_Preview._before"
],
[
0,
"_delete_previews_safely"
]
]
},
{
"q": "_Preview",
"k": "class",
"s": 300,
"e": 361,
"doc": "The live preview: what's applied, and the save/export guard.",
"n": "One object (`PREVIEW`) that knows what preview is currently applied and owns the save/export callbacks.",
"c": [],
"b": []
},
{
"q": "_Preview.__init__",
"k": "def",
"s": 303,
"e": 307,
"doc": "",
"n": "Starts empty: no world controller, no offsets, no callbacks.",
"c": [],
"b": []
},
{
"q": "_Preview.active",
"k": "def",
"s": 309,
"e": 311,
"doc": "",
"n": "A **property**: `PREVIEW.active` reads like a value but is computed: a preview is active when offsets are stored.",
"c": [],
"b": [
[
0,
"_Preview._before"
],
[
0,
"_Preview._after"
]
]
},
{
"q": "_Preview.apply",
"k": "def",
"s": 313,
"e": 319,
"doc": "",
"n": "Makes sure the callbacks are installed, then (outside undo) deletes old previews and writes the new layer. It remembers the world controller and offsets so the layer can be rebuilt after a save.",
"c": [
[
0,
"_Preview._install"
],
[
0,
"_write_layer"
],
[
0,
"_delete_previews"
],
[
0,
"_NoUndo"
]
],
"b": []
},
{
"q": "_Preview.remove",
"k": "def",
"s": 321,
"e": 324,
"doc": "",
"n": "Deletes the preview layer (outside undo) and forgets the stored data.",
"c": [
[
0,
"_delete_previews"
],
[
0,
"_NoUndo"
]
],
"b": []
},
{
"q": "_Preview._install",
"k": "def",
"s": 327,
"e": 334,
"doc": "",
"n": "Registers six scene callbacks once: before/after save, before/after export, and before new/open scene. The ids are kept so they could be removed.",
"c": [
[
0,
"_Preview._forget"
],
[
0,
"_Preview._after"
],
[
0,
"_Preview._before"
]
],
"b": [
[
0,
"_Preview.apply"
]
]
},
{
"q": "_Preview.uninstall",
"k": "def",
"s": 336,
"e": 339,
"doc": "",
"n": "Removes the callbacks. (Not called anywhere yet; see Review.)",
"c": [],
"b": []
},
{
"q": "_Preview._before",
"k": "def",
"s": 341,
"e": 348,
"doc": "",
"n": "Runs just before a save or export: if a preview is active, delete it and remember that it was suspended. Wrapped in `try/except` because an error inside a save callback must never block the user's save.",
"c": [
[
0,
"_delete_previews"
],
[
0,
"_NoUndo"
],
[
0,
"_Preview.active"
]
],
"b": [
[
0,
"_Preview._install"
]
]
},
{
"q": "_Preview._after",
"k": "def",
"s": 350,
"e": 358,
"doc": "",
"n": "Runs just after the save or export: rebuild the preview, then tell Maya the scene is unmodified (`file(modified=False)`), because the file on disk is the clean version and rebuilding the preview is not a real change.",
"c": [
[
0,
"_write_layer"
],
[
0,
"_NoUndo"
],
[
0,
"_Preview.active"
]
],
"b": [
[
0,
"_Preview._install"
]
]
},
{
"q": "_Preview._forget",
"k": "def",
"s": 360,
"e": 361,
"doc": "",
"n": "Before a new or opened scene: the old preview belongs to the old scene, so just forget it.",
"c": [],
"b": [
[
0,
"_Preview._install"
]
]
},
{
"q": "bake",
"k": "def",
"s": 367,
"e": 378,
"doc": "Keeps the current version on a normal (saved) layer. Undoable.",
"n": "Writes the current version on a normal, untagged layer with a unique name (`walkInPlace`, `walkInPlace2`, ...). Unlike the preview, it is a real change: it is undoable, in one named undo chunk, and it is saved with the scene.",
"c": [
[
0,
"_write_layer"
]
],
"b": [
[
0,
"WalkInPlaceUI._bake.go"
]
]
},
{
"q": "_maya_main_window",
"k": "def",
"s": 384,
"e": 386,
"doc": "",
"n": "Gets Maya's main window as a Qt widget so the tool window can be its child (it stays on top of Maya and closes with it).",
"c": [],
"b": [
[
0,
"show"
]
]
},
{
"q": "WalkInPlaceUI",
"k": "class",
"s": 392,
"e": 659,
"doc": "",
"n": "The tool window. It inherits from `_DialogBase`, which is `QDialog` in Maya and plain `object` when Qt is missing, so the file can still be imported for tests.",
"c": [],
"b": [
[
0,
"WalkInPlaceUI.__init__"
],
[
0,
"WalkInPlaceUI.closeEvent"
],
[
0,
"show"
]
]
},
{
"q": "WalkInPlaceUI.__init__",
"k": "def",
"s": 395,
"e": 407,
"doc": "",
"n": "Builds the UI, connects the signals, loads the saved settings, cleans up any preview layer left from a crash, and shows a first status message.",
"c": [
[
0,
"WalkInPlaceUI"
],
[
0,
"WalkInPlaceUI._build"
],
[
0,
"WalkInPlaceUI._connect"
],
[
0,
"WalkInPlaceUI._load"
],
[
0,
"WalkInPlaceUI.set_cfg"
],
[
0,
"_delete_previews_safely"
],
[
0,
"WalkInPlaceUI._say"
],
[
0,
"WalkInPlaceUI._update_version_label"
]
],
"b": []
},
{
"q": "WalkInPlaceUI._build",
"k": "def",
"s": 409,
"e": 493,
"doc": "",
"n": "Creates the widgets in three group boxes (Controls, Version, Direction & Range) plus the preview, re-measure and bake buttons. Combo box entries carry data (`addItem(label, key)`) so the code reads `currentData()` (`\"hips\"`) instead of the visible label.",
"c": [
[
0,
"WalkInPlaceUI._pick"
]
],
"b": [
[
0,
"WalkInPlaceUI.__init__"
]
]
},
{
"q": "WalkInPlaceUI._connect",
"k": "def",
"s": 495,
"e": 507,
"doc": "",
"n": "All signal connections in one place: buttons, combo boxes, range fields and control fields.",
"c": [
[
0,
"WalkInPlaceUI._toggle"
],
[
0,
"WalkInPlaceUI._remeasure"
],
[
0,
"WalkInPlaceUI._bake"
],
[
0,
"WalkInPlaceUI._step"
],
[
0,
"WalkInPlaceUI._version_changed"
],
[
0,
"WalkInPlaceUI._range_changed"
],
[
0,
"WalkInPlaceUI._controls_changed"
]
],
"b": [
[
0,
"WalkInPlaceUI.__init__"
]
]
},
{
"q": "WalkInPlaceUI._say",
"k": "def",
"s": 509,
"e": 510,
"doc": "",
"n": "Writes the status line.",
"c": [],
"b": [
[
0,
"WalkInPlaceUI.__init__"
],
[
0,
"WalkInPlaceUI._apply"
],
[
0,
"WalkInPlaceUI._run"
],
[
0,
"WalkInPlaceUI._toggle"
],
[
0,
"WalkInPlaceUI._remeasure.go"
],
[
0,
"WalkInPlaceUI._bake.go"
]
]
},
{
"q": "WalkInPlaceUI._pick",
"k": "def",
"s": 512,
"e": 516,
"doc": "",
"n": "Fills a control field with the first selected transform and re-measures.",
"c": [
[
0,
"WalkInPlaceUI._controls_changed"
]
],
"b": [
[
0,
"WalkInPlaceUI._build"
]
]
},
{
"q": "WalkInPlaceUI.get_cfg",
"k": "def",
"s": 519,
"e": 525,
"doc": "",
"n": "Reads every widget into one plain dict. Everything else works from this dict, never from the widgets directly.",
"c": [],
"b": [
[
0,
"WalkInPlaceUI._save"
],
[
0,
"WalkInPlaceUI._measure"
],
[
0,
"WalkInPlaceUI._apply"
],
[
0,
"WalkInPlaceUI._bake.go"
]
]
},
{
"q": "WalkInPlaceUI.set_cfg",
"k": "def",
"s": 527,
"e": 541,
"doc": "",
"n": "The reverse: fills the widgets from a dict (merged over `DEFAULTS`). Signals are blocked while setting the combos so loading settings does not trigger a preview.",
"c": [],
"b": [
[
0,
"WalkInPlaceUI.__init__"
]
]
},
{
"q": "WalkInPlaceUI._load",
"k": "def",
"s": 543,
"e": 549,
"doc": "",
"n": "Reads the saved settings (JSON in an optionVar). Any problem returns an empty dict, which means \"use defaults\".",
"c": [],
"b": [
[
0,
"WalkInPlaceUI.__init__"
]
]
},
{
"q": "WalkInPlaceUI._save",
"k": "def",
"s": 551,
"e": 552,
"doc": "",
"n": "Saves the current settings as JSON in an optionVar.",
"c": [
[
0,
"WalkInPlaceUI.get_cfg"
]
],
"b": [
[
0,
"WalkInPlaceUI._toggle"
],
[
0,
"WalkInPlaceUI.closeEvent"
]
]
},
{
"q": "WalkInPlaceUI._update_version_label",
"k": "def",
"s": 555,
"e": 557,
"doc": "",
"n": "Refreshes the \"n/6\" label.",
"c": [
[
0,
"version_label"
]
],
"b": [
[
0,
"WalkInPlaceUI.__init__"
],
[
0,
"WalkInPlaceUI._version_changed"
]
]
},
{
"q": "WalkInPlaceUI._step",
"k": "def",
"s": 559,
"e": 567,
"doc": "",
"n": "Moves to the previous or next of the six versions (wrapping around with `%`), sets both combos with signals blocked, then applies once.",
"c": [
[
0,
"version_index"
],
[
0,
"WalkInPlaceUI._version_changed"
]
],
"b": [
[
0,
"WalkInPlaceUI._connect"
]
]
},
{
"q": "WalkInPlaceUI._measure",
"k": "def",
"s": 569,
"e": 574,
"doc": "Samples with the preview off: it moves the whole rig.",
"n": "Removes the preview before measuring, because the preview moves the whole rig and would make the measured positions wrong, then builds a new `Samples`.",
"c": [
[
0,
"WalkInPlaceUI.get_cfg"
],
[
0,
"Samples"
]
],
"b": [
[
0,
"WalkInPlaceUI._apply"
],
[
0,
"WalkInPlaceUI._remeasure.go"
],
[
0,
"WalkInPlaceUI._bake.go"
]
]
},
{
"q": "WalkInPlaceUI._apply",
"k": "def",
"s": 576,
"e": 585,
"doc": "",
"n": "Measures if needed, computes the offsets and applies the preview, then writes a status line with the version, the forward direction and how much travel was cancelled.",
"c": [
[
0,
"WalkInPlaceUI.get_cfg"
],
[
0,
"WalkInPlaceUI._measure"
],
[
0,
"version_label"
],
[
0,
"WalkInPlaceUI._say"
]
],
"b": [
[
0,
"WalkInPlaceUI._toggle"
],
[
0,
"WalkInPlaceUI._version_changed"
],
[
0,
"WalkInPlaceUI._range_changed"
],
[
0,
"WalkInPlaceUI._controls_changed"
],
[
0,
"WalkInPlaceUI._remeasure.go"
]
]
},
{
"q": "WalkInPlaceUI._run",
"k": "def",
"s": 587,
"e": 595,
"doc": "",
"n": "Runs an action and handles errors in one place: expected `WalkInPlaceError` → message in the window; anything else → traceback in the Script Editor and a short message. Returns `None` on failure.",
"c": [
[
0,
"WalkInPlaceUI._say"
],
[
0,
"WalkInPlaceError"
]
],
"b": [
[
0,
"WalkInPlaceUI._toggle"
],
[
0,
"WalkInPlaceUI._version_changed"
],
[
0,
"WalkInPlaceUI._range_changed"
],
[
0,
"WalkInPlaceUI._controls_changed"
],
[
0,
"WalkInPlaceUI._remeasure"
],
[
0,
"WalkInPlaceUI._bake"
]
]
},
{
"q": "WalkInPlaceUI._toggle",
"k": "def",
"s": 597,
"e": 609,
"doc": "",
"n": "The preview button. On: apply; if that fails, un-check the button without firing the signal again. Off: remove the preview.",
"c": [
[
0,
"WalkInPlaceUI._save"
],
[
0,
"WalkInPlaceUI._say"
],
[
0,
"WalkInPlaceUI._apply"
],
[
0,
"WalkInPlaceUI._run"
]
],
"b": [
[
0,
"WalkInPlaceUI._connect"
]
]
},
{
"q": "WalkInPlaceUI._version_changed",
"k": "def",
"s": 611,
"e": 614,
"doc": "",
"n": "Any version setting changed: update the label and, if previewing, re-apply.",
"c": [
[
0,
"WalkInPlaceUI._update_version_label"
],
[
0,
"WalkInPlaceUI._apply"
],
[
0,
"WalkInPlaceUI._run"
]
],
"b": [
[
0,
"WalkInPlaceUI._connect"
],
[
0,
"WalkInPlaceUI._step"
]
]
},
{
"q": "WalkInPlaceUI._range_changed",
"k": "def",
"s": 616,
"e": 621,
"doc": "",
"n": "The range changed: enable or disable the start/end fields, drop the samples (the frames are different now) and re-apply if previewing.",
"c": [
[
0,
"WalkInPlaceUI._apply"
],
[
0,
"WalkInPlaceUI._run"
]
],
"b": [
[
0,
"WalkInPlaceUI._connect"
]
]
},
{
"q": "WalkInPlaceUI._controls_changed",
"k": "def",
"s": 623,
"e": 626,
"doc": "",
"n": "A control changed: drop the samples and re-apply if previewing.",
"c": [
[
0,
"WalkInPlaceUI._apply"
],
[
0,
"WalkInPlaceUI._run"
]
],
"b": [
[
0,
"WalkInPlaceUI._connect"
],
[
0,
"WalkInPlaceUI._pick"
]
]
},
{
"q": "WalkInPlaceUI._remeasure",
"k": "def",
"s": 628,
"e": 636,
"doc": "",
"n": "The Re-measure button, for after editing the animation.",
"c": [
[
0,
"WalkInPlaceUI._remeasure.go"
],
[
0,
"WalkInPlaceUI._run"
]
],
"b": [
[
0,
"WalkInPlaceUI._connect"
]
]
},
{
"q": "WalkInPlaceUI._remeasure.go",
"k": "def",
"s": 629,
"e": 635,
"doc": "",
"n": "Measures again and re-applies the preview if it is on. Wrapped in `go` so `_run` can handle its errors.",
"c": [
[
0,
"WalkInPlaceUI._measure"
],
[
0,
"WalkInPlaceUI._say"
],
[
0,
"WalkInPlaceUI._apply"
]
],
"b": [
[
0,
"WalkInPlaceUI._remeasure"
]
]
},
{
"q": "WalkInPlaceUI._bake",
"k": "def",
"s": 638,
"e": 650,
"doc": "",
"n": "The Bake button.",
"c": [
[
0,
"WalkInPlaceUI._bake.go"
],
[
0,
"WalkInPlaceUI._run"
]
],
"b": [
[
0,
"WalkInPlaceUI._connect"
]
]
},
{
"q": "WalkInPlaceUI._bake.go",
"k": "def",
"s": 639,
"e": 649,
"doc": "",
"n": "Computes the current version, turns the preview off, and bakes the offsets on a saved layer.",
"c": [
[
0,
"WalkInPlaceUI.get_cfg"
],
[
0,
"WalkInPlaceUI._measure"
],
[
0,
"bake"
],
[
0,
"version_label"
],
[
0,
"WalkInPlaceUI._say"
]
],
"b": [
[
0,
"WalkInPlaceUI._bake"
]
]
},
{
"q": "WalkInPlaceUI.closeEvent",
"k": "def",
"s": 652,
"e": 659,
"doc": "",
"n": "Qt calls this when the window closes: save the settings and remove the preview so nothing is left in the scene.",
"c": [
[
0,
"WalkInPlaceUI._save"
],
[
0,
"WalkInPlaceUI"
]
],
"b": []
},
{
"q": "_delete_previews_safely",
"k": "def",
"s": 662,
"e": 667,
"doc": "",
"n": "Deletes leftover previews outside undo and never raises; used when the window opens.",
"c": [
[
0,
"_delete_previews"
],
[
0,
"_NoUndo"
]
],
"b": [
[
0,
"WalkInPlaceUI.__init__"
]
]
},
{
"q": "show",
"k": "def",
"s": 673,
"e": 683,
"doc": "",
"n": "Entry point. Closes any previous window, creates a new one parented to Maya and keeps it in the global `_window` so it is not garbage-collected.",
"c": [
[
0,
"_maya_main_window"
],
[
0,
"WalkInPlaceUI"
]
],
"b": []
}
],
"lines": {
"31": "If Maya is not available (plain Python, tests), the names are set to `None` instead of crashing, so the pure math functions can still be imported.",
"39": "Fallback for newer Maya versions that ship PySide6 instead of PySide2.",
"47": "Python 3 has no `long` type. Defining it as `int` lets the same code (`long(ptr)`) run on Python 2 and 3.",
"113": "Net travel is meaningful only if it is bigger than 5% of the motion's size; otherwise use the main axis.",
"121": "The angle of the main axis of a 2D point cloud (principal component), from the spread in X (`sxx`), in Z (`szz`) and together (`sxz`).",
"135": "Least-squares slope: covariance of time and value divided by the variance of time.",
"147": "Distance travelled along the forward direction: the dot product of (point - first point) with the forward vector.",
"156": "Average mode: replace the real travel with a straight line at the average speed. Only this straight line is cancelled.",
"159": "Minus: the offset is the **opposite** of the travel.",
"194": "Converts the pivot from the scene's UI unit to centimeters, Maya's internal unit, so it matches the matrix.",
"197": "Point times world matrix = the pivot's world position at time `t`, read without moving the timeline.",
"243": "How many UI units are in one centimeter, to convert back for keying.",
"246": "A vector (not a point) times the parent inverse matrix: rotates and scales the offset into the parent's space but ignores translation, which is what an offset needs.",
"258": "Turns undo recording off **without** clearing the existing undo history.",
"266": "`override=False` makes an **additive** layer: its values are added on top of the animation below.",
"268": "Tags the layer with a custom attribute so `_delete_previews` can always find it, even if renamed.",
"280": "On layered plugs, `setKeyframe(value=)` can store a value adjusted for the other layers. Setting the key value directly on the curve makes it exact.",
"283": "After the first key, keys go straight onto the curve node: faster, and no layer adjustment.",
"287": "Infinity mode 1 = linear: the curve keeps going in a straight line before the first key and after the last.",
"310": "Read as `PREVIEW.active` (no parentheses) because of `@property`.",
"331": "Pairs of (event, function): the same two functions handle save and export.",
"348": "Prints the error but does not re-raise: a failing callback must never stop Maya from saving.",
"355": "Rebuilding the preview after saving would mark the scene as changed; this clears that flag so Maya does not ask to save again.",
"374": "A named chunk: the Edit menu shows \"Undo Walk In Place bake\".",
"389": "Choose the base class at import time: `QDialog` with Qt, `object` without, so tests can import the file.",
"427": "`f=field` freezes the current field; without it every `<<` button would fill the last field created in the loop.",
"437": "Second argument = item data: the code later reads `currentData()` (\"hips\") rather than the visible label.",
"454": "`&&` shows a single `&` (one `&` would mark a keyboard shortcut letter in Qt).",
"534": "Change the combo without firing `currentIndexChanged`, so setting it in code does not trigger an extra preview.",
"560": "`% len(VERSIONS)` on the next line wraps around: after version 6 comes version 1.",
"601": "Un-check the button without calling `_toggle` again (which would loop)."
}
},
{
"path": "tests/test_walk_in_place.py",
"lang": "py",
"note": "Automated tests of the math, runnable with plain Python 3 outside Maya: `python3 tests/test_walk_in_place.py`.",
"code": "# -*- coding: utf-8 -*-\n\"\"\"Maths of walk_in_place.py, outside of Maya:  python3 tests/test_walk_in_place.py\"\"\"\nfrom __future__ import division, print_function\n\nimport math\nimport os\nimport sys\nimport unittest\n\nsys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))\nimport walk_in_place as wp  # noqa: E402\n\nHEADING = math.radians(30.0)       # walks diagonally on the ground\n\n\ndef walk(frames=49, speed=4.0, surge=1.5, sway=2.0, bob=3.0, period=24.0):\n    \"\"\"Hips of a walk: forward with a speed surge per step, sideways sway, up/down bob.\"\"\"\n    fwd = (math.cos(HEADING), math.sin(HEADING))\n    side = (-fwd[1], fwd[0])\n    times, pts = [], []\n    for i in range(frames):\n        t = float(10 + i)\n        phase = 2.0 * math.pi * i / period\n        f = speed * i + surge * math.sin(2.0 * phase)\n        s = sway * math.sin(phase)\n        pts.append((f * fwd[0] + s * side[0], 100.0 + bob * math.sin(2.0 * phase),\n                    f * fwd[1] + s * side[1]))\n        times.append(t)\n    return times, pts, fwd, side\n\n\ndef apply(points, times, offsets):\n    return [tuple(p[i] + offsets[t][i] for i in range(3)) for p, t in zip(points, times)]\n\n\ndef along(p, axis):\n    return p[0] * axis[0] + p[2] * axis[1]\n\n\nclass Direction(unittest.TestCase):\n\n    def test_detects_diagonal_travel(self):\n        _, pts, fwd, _ = walk()\n        d = wp.detect_forward(pts)\n        self.assertAlmostEqual(d[0], fwd[0], places=2)\n        self.assertAlmostEqual(d[1], fwd[1], places=2)\n\n    def test_forced_axis(self):\n        _, pts, _, _ = walk()\n        self.assertEqual(wp.detect_forward(pts, 'x'), (1.0, 0.0))\n        self.assertEqual(wp.detect_forward(pts, 'z'), (0.0, 1.0))\n\n    def test_cycle_that_barely_travels_uses_the_main_axis(self):\n        pts = [(5.0 * math.sin(i * 0.3), 0.0, 0.2 * math.cos(i * 0.3)) for i in range(40)]\n        pts[-1] = pts[0]\n        d = wp.detect_forward(pts)\n        self.assertGreater(abs(d[0]), 0.99)\n\n\nclass Cancel(unittest.TestCase):\n\n    def test_average_speed_keeps_the_walk_but_removes_the_travel(self):\n        times, pts, fwd, side = walk()\n        off = wp.counter_motion(times, pts, wp.STYLE_AVERAGE, wp.AXES_FORWARD, fwd)\n        out = apply(pts, times, off)\n        self.assertEqual(off[times[0]], (0.0, 0.0, 0.0))\n        start, end = along(out[0], fwd), along(out[-1], fwd)\n        self.assertLess(abs(end - start), 1.0)                  # 192 units of travel gone\n        surge = [along(p, fwd) - start for p in out]\n        self.assertGreater(max(surge) - min(surge), 1.0)        # speed changes still visible\n        for p, q in zip(pts, out):\n            self.assertAlmostEqual(p[1], q[1])                  # bob untouched\n            self.assertAlmostEqual(along(p, side), along(q, side))     # sway untouched\n\n    def test_exact_pins_the_point_forward(self):\n        times, pts, fwd, side = walk()\n        out = apply(pts, times, wp.counter_motion(times, pts, wp.STYLE_EXACT,\n                                                  wp.AXES_FORWARD, fwd))\n        for p, q in zip(pts, out):\n            self.assertAlmostEqual(along(q, fwd), along(out[0], fwd))\n            self.assertAlmostEqual(along(p, side), along(q, side))\n\n    def test_ground_plane_also_cancels_sideways(self):\n        times, pts, fwd, side = walk()\n        out = apply(pts, times, wp.counter_motion(times, pts, wp.STYLE_EXACT, wp.AXES_GROUND))\n        for q in out:\n            self.assertAlmostEqual(q[0], out[0][0])\n            self.assertAlmostEqual(q[2], out[0][2])\n\n    def test_average_speed_value(self):\n        times = [0.0, 1.0, 2.0, 3.0]\n        self.assertAlmostEqual(wp.fit_slope(times, [0.0, 2.0, 4.0, 6.0]), 2.0)\n        self.assertEqual(wp.fit_slope([1.0], [5.0]), 0.0)\n\n\nclass Tracks(unittest.TestCase):\n\n    def test_feet_and_blend(self):\n        hips = [(0.0, 10.0, 0.0)]\n        l, r = [(2.0, 0.0, 4.0)], [(4.0, 0.0, 0.0)]\n        self.assertEqual(wp.track_points(wp.TRACK_FEET, hips, l, r), [(3.0, 0.0, 2.0)])\n        self.assertEqual(wp.track_points(wp.TRACK_BLEND, hips, l, r), [(1.5, 5.0, 1.0)])\n        self.assertEqual(wp.track_points(wp.TRACK_HIPS, hips, l, r), hips)\n\n    def test_versions_cycle(self):\n        self.assertEqual(len(wp.VERSIONS), 6)\n        self.assertEqual(wp.version_label(wp.TRACK_FEET, wp.STYLE_EXACT),\n                         '4/6  Between the feet, exact')\n\n\nif __name__ == '__main__':\n    unittest.main()",
"aliases": {
"division": "__future__.division",
"print_function": "__future__.print_function",
"math": "math",
"os": "os",
"sys": "sys",
"unittest": "unittest"
},
"outline": [
{
"q": "walk",
"k": "def",
"s": 16,
"e": 29,
"doc": "Hips of a walk: forward with a speed surge per step, sideways sway, up/down bob.",
"n": "Builds a fake walk to test with: hips moving diagonally (30 degrees) with a speed surge each step, side-to-side sway and an up-and-down bob. Because the inputs are known, the tests can check that exactly the right parts are removed.",
"c": [],
"b": [
[
1,
"Direction.test_detects_diagonal_travel"
],
[
1,
"Direction.test_forced_axis"
],
[
1,
"Cancel.test_average_speed_keeps_the_walk_but_removes_the_travel"
],
[
1,
"Cancel.test_exact_pins_the_point_forward"
],
[
1,
"Cancel.test_ground_plane_also_cancels_sideways"
]
]
},
{
"q": "apply",
"k": "def",
"s": 32,
"e": 33,
"doc": "",
"n": "Adds the computed offsets to the points, like the layer would in Maya.",
"c": [],
"b": [
[
1,
"Cancel.test_average_speed_keeps_the_walk_but_removes_the_travel"
],
[
1,
"Cancel.test_exact_pins_the_point_forward"
],
[
1,
"Cancel.test_ground_plane_also_cancels_sideways"
]
]
},
{
"q": "along",
"k": "def",
"s": 36,
"e": 37,
"doc": "",
"n": "How far a point is along an axis on the ground (dot product in XZ).",
"c": [],
"b": [
[
1,
"Cancel.test_average_speed_keeps_the_walk_but_removes_the_travel"
],
[
1,
"Cancel.test_exact_pins_the_point_forward"
]
]
},
{
"q": "Direction",
"k": "class",
"s": 40,
"e": 57,
"doc": "",
"n": "Tests for `detect_forward`.",
"c": [],
"b": []
},
{
"q": "Direction.test_detects_diagonal_travel",
"k": "def",
"s": 42,
"e": 46,
"doc": "",
"n": "The detected direction must match the 30 degree heading of the fake walk.",
"c": [
[
1,
"walk"
],
[
0,
"detect_forward"
]
],
"b": []
},
{
"q": "Direction.test_forced_axis",
"k": "def",
"s": 48,
"e": 51,
"doc": "",
"n": "Forcing X or Z must return exactly that axis.",
"c": [
[
1,
"walk"
],
[
0,
"detect_forward"
]
],
"b": []
},
{
"q": "Direction.test_cycle_that_barely_travels_uses_the_main_axis",
"k": "def",
"s": 53,
"e": 57,
"doc": "",
"n": "A cycle that ends where it started has no net travel; the main axis (X here) must be used instead.",
"c": [
[
0,
"detect_forward"
]
],
"b": []
},
{
"q": "Cancel",
"k": "class",
"s": 60,
"e": 93,
"doc": "",
"n": "Tests for `counter_motion` and `fit_slope`.",
"c": [],
"b": []
},
{
"q": "Cancel.test_average_speed_keeps_the_walk_but_removes_the_travel",
"k": "def",
"s": 62,
"e": 73,
"doc": "",
"n": "With average speed: offset is zero on the first frame, the overall travel is gone, the speed surge is still there, and bob and sway are untouched.",
"c": [
[
1,
"walk"
],
[
0,
"counter_motion"
],
[
1,
"apply"
],
[
1,
"along"
]
],
"b": []
},
{
"q": "Cancel.test_exact_pins_the_point_forward",
"k": "def",
"s": 75,
"e": 81,
"doc": "",
"n": "With exact: the point never moves forward, and the sideways motion is untouched.",
"c": [
[
1,
"walk"
],
[
0,
"counter_motion"
],
[
1,
"apply"
],
[
1,
"along"
]
],
"b": []
},
{
"q": "Cancel.test_ground_plane_also_cancels_sideways",
"k": "def",
"s": 83,
"e": 88,
"doc": "",
"n": "With forward and sideways: the point stays fixed in both X and Z.",
"c": [
[
1,
"walk"
],
[
0,
"counter_motion"
],
[
1,
"apply"
]
],
"b": []
},
{
"q": "Cancel.test_average_speed_value",
"k": "def",
"s": 90,
"e": 93,
"doc": "",
"n": "The slope of a perfect line is its speed, and a single sample gives 0 instead of crashing.",
"c": [
[
0,
"fit_slope"
]
],
"b": []
},
{
"q": "Tracks",
"k": "class",
"s": 96,
"e": 108,
"doc": "",
"n": "Tests for `track_points` and the version list.",
"c": [],
"b": []
},
{
"q": "Tracks.test_feet_and_blend",
"k": "def",
"s": 98,
"e": 103,
"doc": "",
"n": "Checks the feet midpoint and the hips/feet blend with simple numbers.",
"c": [
[
0,
"track_points"
]
],
"b": []
},
{
"q": "Tracks.test_versions_cycle",
"k": "def",
"s": 105,
"e": 108,
"doc": "",
"n": "Six versions, and the label text format.",
"c": [
[
0,
"version_label"
]
],
"b": []
}
],
"lines": {}
}
]
});
