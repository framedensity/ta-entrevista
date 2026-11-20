TOOLS.add({
"id": "smooth_noise",
"order": 2,
"title": "Smooth Noise",
"tagline": "Remove mocap or simulation jitter from the world path of controls, on a layer, without touching the base animation.",
"overview": [
"Mocap and simulations put a key on every frame, and they often **jitter**: tiny fast shakes on top of the real motion. Smoothing each curve separately in the Graph Editor causes problems: channels drift apart, rotations flip, and parents and children fight each other.",
"This tool smooths the control's **world path** instead: its world position and its world orientation. Then it solves the result back into the control's translate and rotate channels and keys it on an **animation layer**. The base animation is never changed.",
"### Two modes",
"- **Auto**: \"Analyze\" finds *where* it is noisy, *how strong* to smooth there, and *which signals* need it (position X/Y/Z, rotation). It fills the table; you check it and Apply. Only the noisy stretches are changed.\n- **Manual**: one strength for everything (a slider that applies on release), or edit the table per control and per signal. The whole range is smoothed.",
"### What keeps it safe",
"- The smoothing has **zero phase**: peaks stay on their frames, nothing lags.\n- Every fix **fades in and out** and is exactly 0 at the range ends, so nothing outside the range moves and there is no pop at the edges.\n- Results go on a layer: mute it to compare, delete it to undo everything."
],
"why": [
"### Smooth in world space, then solve back",
"Noise is something you see in the world: the hand shakes. Smoothing world position and orientation fixes what you see, whatever the rig hierarchy, rotate order, joint orient or pivots. `Control.solve` then finds the local channel values that reproduce the smoothed world matrix.",
"### A real low-pass filter",
"Instead of averaging neighbors (which flattens peaks and shifts timing), it uses a **Butterworth low-pass filter** run forward and then backward (`filtfilt`). Running it both ways cancels the delay, so peaks stay on their frames. Strength maps to the filter cutoff on a log scale so the slider feels even.",
"### Rotation as quaternions",
"Euler curves flip and have gimbal problems, so smoothing them directly breaks. Orientations are read as **quaternions**, aligned so neighbors are on the same side (`q_align`), filtered, and normalized again.",
"### Auto strength by search",
"For each noisy stretch, `_search_strength` finds the **lowest** strength that brings the jitter down to 25% of what it was (or under the threshold). Lighter noise gets gentler smoothing, so clean motion is not over-smoothed.",
"### Pure math, tested",
"Everything in the \"maths\" section uses plain lists and tuples, with no Maya. `tests/test_smooth_noise.py` checks the filter (no phase shift, keeps slow motion, removes jitter), the detection, the masks and the quaternion functions, outside Maya.",
"### Built for big rigs",
"Reading values at other frames uses a **DG context** (no timeline scrubbing), with an automatic fallback for rigs where that does not evaluate correctly. Keys are written in bulk through a temporary API curve and one `pasteKey`, then checked, with a slower per-key fallback."
],
"flow": [
"### Analyze (Auto)",
"1. `_analyze` → `analyze(cfg, rows)`.\n2. `_controls` builds a `Control` for each row (reads pivots, rotate order, joint orient, which channels are editable) and works out each control's depth among the selected ones.\n3. `read_original` mutes the tool's layer (`_Muted`) and reads every control's **world matrix** on every frame through `Reader` and `Evaluator`, storing world position and quaternion.\n4. For each position axis `analyze_values`, for rotation `analyze_quats`: measure jitter, find noisy runs, build a mask, search the strength.\n5. The table is filled; the result and a key of the settings are stored in `self.analysis`.",
"### Apply",
"1. `_apply` → `apply(cfg, rows, strengths, masks)`. In Auto it re-analyzes first if the settings changed since the last analysis (`_analysis_key`).\n2. Read the original again, then build the **target** world matrices: smoothed positions (`blend_positions`) and orientations (`blend_quats`), blended in by the masks.\n3. Open one undo chunk, prepare the layer (`_prepare_layer`), clear the previous fix if asked.\n4. Controls are solved **by depth** (parents first). For each depth level: read each control's current parent matrix and channels on every frame, `Control.solve` the channels that hit the target, and `LayerWriter.write` the difference onto the layer (`write_curve`). Children are read after their parents were written, so they see the corrected parents."
],
"review": [
"**Errors after the undo chunk opens.** Cancel undoes everything (`cmds.undo()`), but any other error in the middle of `apply` closes the chunk and leaves the partial fix on the layer. Undoing once removes it, but calling `cmds.undo()` on any error, like cancel does, would be more consistent.",
"**Repeated work.** `analyze_quats` computes `rot_jitter(qs)` twice (once for the level, once for the measured value). On long ranges this doubles one of the slower steps; storing it in a variable fixes it.",
"**Quaternion filtering is an approximation.** Filtering the four components and renormalizing is accurate for small changes between frames, which is the case for jitter, but not a true rotation average for fast spins.",
"**Scale is never written.** Only translate and rotate are solved; scale is read so the solve is correct, but jitter in scale is left as is."
],
"files": [
{
"path": "smooth_noise.py",
"lang": "py",
"note": "The whole tool: the filter and analysis math, Maya evaluation and layer writing, the world-to-local solve, and the UI.",
"code": "# -*- coding: utf-8 -*-\n\"\"\"\nSmooth Noise  -  Maya 2020.x (Python 2.7 / PySide2)\n\nSmooths jitter (mocap / simulation, a key on every frame) on a control's\nWORLD path - position and orientation - and solves the result back to its\nchannels, on an animation layer. The base animation is never touched.\n\n  Auto    finds where it's noisy, how strong to smooth, and which channels\n          need it (\"Analyze\" fills the Manual table, then Apply)\n  Manual  one strength for everything, or per control / per signal\n\nSmoothing is a zero-phase low-pass (Butterworth run forward and back), so\npeaks stay on their frames. Fixes fade in and out and are 0 at the range\nends, so nothing outside the range changes.\n\nInstall : copy this file to your scripts folder (e.g. ~/maya/2020/scripts)\nRun     : import smooth_noise; smooth_noise.show()\n\"\"\"\nfrom __future__ import division, print_function\n\nimport json\nimport math\nimport traceback\n\ntry:\n    import maya.cmds as cmds\n    import maya.mel as mel\n    import maya.OpenMayaUI as omui\n    import maya.api.OpenMaya as om\n    import maya.api.OpenMayaAnim as oma\nexcept ImportError:  # the maths can be tested outside of Maya\n    cmds = mel = omui = om = oma = None\n\ntry:\n    from PySide2 import QtCore, QtWidgets\n    from shiboken2 import wrapInstance\nexcept ImportError:\n    try:\n        from PySide6 import QtCore, QtWidgets\n        from shiboken6 import wrapInstance\n    except ImportError:\n        QtCore = QtWidgets = wrapInstance = None\n\ntry:\n    long\nexcept NameError:\n    long = int\n\nSIGNALS = ['px', 'py', 'pz', 'rot']\nSIGNAL_LABELS = {'px': 'Pos X', 'py': 'Pos Y', 'pz': 'Pos Z', 'rot': 'Rotation'}\nT_CH = ['tx', 'ty', 'tz']\nR_CH = ['rx', 'ry', 'rz']\nS_CH = ['sx', 'sy', 'sz']\nCHANNELS = T_CH + R_CH + S_CH\nLONG = {'tx': 'translateX', 'ty': 'translateY', 'tz': 'translateZ',\n        'rx': 'rotateX', 'ry': 'rotateY', 'rz': 'rotateZ',\n        'sx': 'scaleX', 'sy': 'scaleY', 'sz': 'scaleZ'}\n\nFC_MAX = 0.4        # cutoff (cycles per frame) at the lightest strength\nFC_MIN = 0.01       # ... at full strength (only waves over ~100 frames survive)\nFC_JITTER = 0.15    # what counts as jitter: waves shorter than ~7 frames\nRMS_WINDOW = 9\nJITTER_TARGET = 0.25    # auto: cut the jitter to this share, but not below the\n                        # threshold (lighter noise gets gentler smoothing)\n\nNEW_LAYER = '__new__'\nTAG = 'smoothNoiseLayer'\nOPTION_VAR = 'smoothNoiseSettings'\nEVAL_CONTEXT = 'context'\nEVAL_TIMELINE = 'timeline'\n\nDEFAULTS = {\n    'use_timeline': True, 'start': 1, 'end': 120,\n    'fade': 4,\n    'strength': 40,\n    'signals': list(SIGNALS),\n    'sensitivity': 50,\n    'pos_threshold': 0.05,      # scene units\n    'rot_threshold': 0.2,       # degrees\n    'layer': NEW_LAYER,\n    'layer_name': 'smoothNoise',\n    'layer_override': False,\n    'replace': True,\n    'eval': EVAL_CONTEXT,\n}\n\n\nclass SmoothNoiseError(Exception):\n    pass\n\n\n# --------------------------------------------------------------------------\n# maths (no Maya: see tests/test_smooth_noise.py)\n# --------------------------------------------------------------------------\ndef _butter(fc):\n    \"\"\"2nd order low-pass Butterworth (bilinear). fc in cycles per frame.\"\"\"\n    k = math.tan(math.pi * fc)\n    q = math.sqrt(2.0)\n    norm = 1.0 / (1.0 + q * k + k * k)\n    b0 = k * k * norm\n    return (b0, 2.0 * b0, b0), (2.0 * (k * k - 1.0) * norm, (1.0 - q * k + k * k) * norm)\n\n\ndef _run(b, a, x):\n    x1 = x2 = y1 = y2 = x[0]        # start at rest on the first value\n    out = []\n    for v in x:\n        y = b[0] * v + b[1] * x1 + b[2] * x2 - a[0] * y1 - a[1] * y2\n        x2, x1, y2, y1 = x1, v, y1, y\n        out.append(y)\n    return out\n\n\ndef filtfilt(x, fc):\n    \"\"\"Zero-phase low-pass: forward then backward, ends extended by odd reflection.\"\"\"\n    x = list(x)\n    n = len(x)\n    if n < 4 or fc is None or fc >= 0.49:\n        return x\n    pad = min(n - 1, max(6, int(round(2.0 / fc))))\n    ext = ([2.0 * x[0] - x[i] for i in range(pad, 0, -1)] + x +\n           [2.0 * x[-1] - x[n - 1 - i] for i in range(1, pad + 1)])\n    b, a = _butter(fc)\n    y = _run(b, a, ext)\n    y = _run(b, a, y[::-1])[::-1]\n    return y[pad:pad + n]\n\n\ndef strength_to_cutoff(strength):\n    \"\"\"0..1 (log scale) to a cutoff. 0 = no smoothing (None).\"\"\"\n    if strength <= 0.0:\n        return None\n    s = min(1.0, strength)\n    return FC_MAX * (FC_MIN / FC_MAX) ** s\n\n\ndef smooth_values(x, strength):\n    return filtfilt(x, strength_to_cutoff(strength))\n\n\ndef local_rms(values, window=RMS_WINDOW):\n    half = window // 2\n    n = len(values)\n    out = []\n    for i in range(n):\n        win = values[max(0, i - half):i + half + 1]\n        out.append(math.sqrt(sum(v * v for v in win) / len(win)))\n    return out\n\n\ndef jitter(x):\n    \"\"\"The fast part of a signal: what's left after a light smoothing.\"\"\"\n    s = filtfilt(x, FC_JITTER)\n    return [a - b for a, b in zip(x, s)]\n\n\n# quaternions: (x, y, z, w) ------------------------------------------------\ndef q_dot(a, b):\n    return sum(x * y for x, y in zip(a, b))\n\n\ndef q_normalize(q):\n    n = math.sqrt(q_dot(q, q)) or 1.0\n    return tuple(v / n for v in q)\n\n\ndef q_align(qs):\n    \"\"\"Same hemisphere as the previous frame: no sign flips to smooth over.\"\"\"\n    out = []\n    for q in qs:\n        q = tuple(q)\n        if out and q_dot(out[-1], q) < 0.0:\n            q = tuple(-v for v in q)\n        out.append(q)\n    return out\n\n\ndef q_slerp(a, b, t):\n    d = q_dot(a, b)\n    if d < 0.0:\n        b, d = tuple(-v for v in b), -d\n    if d > 0.9995:\n        return q_normalize(tuple(x + (y - x) * t for x, y in zip(a, b)))\n    theta = math.acos(max(-1.0, min(1.0, d)))\n    s = math.sin(theta)\n    wa, wb = math.sin((1.0 - t) * theta) / s, math.sin(t * theta) / s\n    return tuple(wa * x + wb * y for x, y in zip(a, b))\n\n\ndef q_angle(a, b):\n    \"\"\"Angle between two orientations, degrees.\"\"\"\n    return math.degrees(2.0 * math.acos(min(1.0, abs(q_dot(a, b)))))\n\n\ndef smooth_quats(qs, fc):\n    qs = q_align(qs)\n    if fc is None:\n        return qs\n    comps = [filtfilt([q[i] for q in qs], fc) for i in range(4)]\n    return [q_normalize(q) for q in zip(*comps)]\n\n\ndef rot_jitter(qs):\n    \"\"\"Per frame angular jitter (degrees).\"\"\"\n    qs = q_align(qs)\n    return [q_angle(a, b) for a, b in zip(qs, smooth_quats(qs, FC_JITTER))]\n\n\n# masks --------------------------------------------------------------------\ndef _smoothstep(u):\n    u = max(0.0, min(1.0, u))\n    return u * u * (3.0 - 2.0 * u)\n\n\ndef find_runs(flags, join=0, widen=0):\n    \"\"\"[(first, last)] of True runs, joining gaps <= join, widened by widen.\"\"\"\n    runs = []\n    for i, f in enumerate(flags):\n        if f:\n            if runs and i - runs[-1][1] - 1 <= join:\n                runs[-1][1] = i\n            else:\n                runs.append([i, i])\n    n = len(flags)\n    return [(max(0, a - widen), min(n - 1, b + widen)) for a, b in runs]\n\n\ndef end_fade(mask, fade):\n    \"\"\"0 on the first and last frame, easing in over `fade` frames.\"\"\"\n    n = len(mask)\n    out = list(mask)\n    for i in range(n):\n        d = min(i, n - 1 - i)\n        out[i] *= _smoothstep(d / float(fade)) if fade > 0 else (1.0 if d > 0 else 0.0)\n    return out\n\n\ndef runs_mask(n, runs, fade):\n    \"\"\"1 inside runs, easing to 0 over `fade` frames around them.\"\"\"\n    mask = [0.0] * n\n    for a, b in runs:\n        for i in range(max(0, a - fade), min(n, b + fade + 1)):\n            d = a - i if i < a else (i - b if i > b else 0)\n            w = 1.0 if d == 0 else (_smoothstep(1.0 - d / float(fade + 1)) if fade else 0.0)\n            mask[i] = max(mask[i], w)\n    return end_fade(mask, fade)\n\n\ndef full_mask(n, fade):\n    return end_fade([1.0] * n, fade)\n\n\ndef _search_strength(residual, goal, steps=14):\n    \"\"\"Lowest strength 0..1 with residual(strength) <= goal (bisection).\"\"\"\n    if residual(1.0) > goal:\n        return 1.0\n    lo, hi = 0.0, 1.0\n    for _ in range(steps):\n        mid = 0.5 * (lo + hi)\n        if residual(mid) <= goal:\n            hi = mid\n        else:\n            lo = mid\n    return hi\n\n\ndef _rms(values):\n    return math.sqrt(sum(v * v for v in values) / len(values)) if values else 0.0\n\n\ndef analyze_values(x, threshold, fade):\n    \"\"\"\n    Auto for one position axis: (strength 0..1, mask, noisy runs, jitter).\n    Strength 0 and an empty mask when it's clean.\n    \"\"\"\n    j = jitter(x)\n    level = local_rms(j)\n    runs = find_runs([v > threshold for v in level], join=max(fade, 2), widen=2)\n    if not runs:\n        return 0.0, [0.0] * len(x), [], max(level or [0.0])\n    inside = [i for a, b in runs for i in range(a, b + 1)]\n    measured = _rms([j[i] for i in inside])\n\n    def residual(s):\n        y = smooth_values(x, s)\n        r = jitter(y)\n        return _rms([r[i] for i in inside])\n\n    strength = _search_strength(residual, max(JITTER_TARGET * measured, threshold))\n    return strength, runs_mask(len(x), runs, fade), runs, max(level)\n\n\ndef analyze_quats(qs, threshold, fade):\n    \"\"\"Auto for the orientation (threshold in degrees).\"\"\"\n    qs = q_align(qs)\n    level = local_rms(rot_jitter(qs))\n    runs = find_runs([v > threshold for v in level], join=max(fade, 2), widen=2)\n    if not runs:\n        return 0.0, [0.0] * len(qs), [], max(level or [0.0])\n    inside = [i for a, b in runs for i in range(a, b + 1)]\n    measured = _rms([rot_jitter(qs)[i] for i in inside])\n\n    def residual(s):\n        r = rot_jitter(smooth_quats(qs, strength_to_cutoff(s)))\n        return _rms([r[i] for i in inside])\n\n    strength = _search_strength(residual, max(JITTER_TARGET * measured, threshold))\n    return strength, runs_mask(len(qs), runs, fade), runs, max(level)\n\n\ndef blend_positions(orig, strengths, masks):\n    \"\"\"orig: [(x, y, z)]; strengths / masks per axis. Returns new positions.\"\"\"\n    axes = []\n    for i in range(3):\n        x = [p[i] for p in orig]\n        s = smooth_values(x, strengths[i])\n        axes.append([a + (b - a) * w for a, b, w in zip(x, s, masks[i])])\n    return list(zip(*axes))\n\n\ndef blend_quats(orig, strength, mask):\n    qs = q_align(orig)\n    sm = smooth_quats(qs, strength_to_cutoff(strength))\n    return [q_slerp(a, b, w) for a, b, w in zip(qs, sm, mask)]\n\n\ndef threshold_scale(sensitivity):\n    \"\"\"Sensitivity 0..100: 50 = thresholds as typed, 100 = 10x more sensitive.\"\"\"\n    return 10.0 ** ((50.0 - sensitivity) / 50.0)\n\n\n# --------------------------------------------------------------------------\n# Maya: units, evaluation\n# --------------------------------------------------------------------------\ndef _lin_in(v):\n    return om.MDistance(v, om.MDistance.uiUnit()).asCentimeters()\n\n\ndef _ang_in(v):\n    return om.MAngle(v, om.MAngle.uiUnit()).asRadians()\n\n\ndef _to_ui(ch, v):\n    if ch[0] == 't':\n        return om.MDistance(v, om.MDistance.kCentimeters).asUnits(om.MDistance.uiUnit())\n    if ch[0] == 'r':\n        return om.MAngle(v, om.MAngle.kRadians).asUnits(om.MAngle.uiUnit())\n    return v\n\n\ndef _to_internal(ch, v):\n    return _lin_in(v) if ch[0] == 't' else (_ang_in(v) if ch[0] == 'r' else v)\n\n\n_GUARD = getattr(om, 'MDGContextGuard', None) if om else None\n\n\ndef _plug(node, attr):\n    sel = om.MSelectionList()\n    sel.add(node)\n    if attr in ('worldMatrix', 'parentMatrix'):\n        dag = sel.getDagPath(0)\n        p = om.MFnDependencyNode(dag.node()).findPlug(attr, False)\n        return p.elementByLogicalIndex(dag.instanceNumber())\n    return om.MFnDependencyNode(sel.getDependNode(0)).findPlug(attr, False)\n\n\ndef _ctx(t):\n    return om.MDGContext(om.MTime(t, om.MTime.uiUnit()))\n\n\ndef _value(plug, is_matrix, ctx=None):\n    if is_matrix:\n        obj = plug.asMObject() if ctx is None else plug.asMObject(ctx)\n        return om.MFnMatrixData(obj).matrix()\n    return plug.asDouble() if ctx is None else plug.asDouble(ctx)\n\n\ndef _cmds_value(plug, is_matrix, t):\n    v = cmds.getAttr(plug.name(), time=t)\n    if is_matrix:\n        return om.MMatrix(v)\n    attr = plug.attribute()\n    if attr.hasFn(om.MFn.kUnitAttribute):\n        unit = om.MFnUnitAttribute(attr).unitType()\n        if unit == om.MFnUnitAttribute.kAngle:\n            return _ang_in(v)\n        if unit == om.MFnUnitAttribute.kDistance:\n            return _lin_in(v)\n    return v\n\n\nclass Evaluator(object):\n    \"\"\"Reads plugs at any time without moving the timeline (DG context).\"\"\"\n\n    def __init__(self, mode):\n        self.mode = mode\n        self.strategy = None\n        self._saved = None\n\n    def __enter__(self):\n        if self.mode == EVAL_TIMELINE:\n            self._saved = cmds.currentTime(q=True)\n            cmds.refresh(suspend=True)\n        return self\n\n    def __exit__(self, *args):\n        if self.mode == EVAL_TIMELINE:\n            cmds.currentTime(self._saved, update=True)\n            cmds.refresh(suspend=False)\n\n    def _read(self, strategy, t, plugs):\n        if strategy == 'guard':\n            ctx = _ctx(t)\n            guard = _GUARD(ctx)\n            try:\n                return [_value(p, m) for p, m in plugs]\n            finally:\n                del guard\n        if strategy == 'arg':\n            ctx = _ctx(t)\n            return [_value(p, m, ctx) for p, m in plugs]\n        return [_cmds_value(p, m, t) for p, m in plugs]\n\n    def _detect(self, t, plugs):\n        plug, is_matrix = plugs[0]\n        ref = _cmds_value(plug, is_matrix, t)\n        for name in (['guard'] if _GUARD is not None else []) + ['arg']:\n            try:\n                got = self._read(name, t, [(plug, is_matrix)])[0]\n                same = got.isEquivalent(ref, 1e-4) if is_matrix else abs(got - ref) < 1e-5\n                if same:\n                    return name\n            except Exception:\n                pass\n        return 'cmds'\n\n    def read(self, t, plugs):\n        if not plugs:\n            return []\n        if self.mode == EVAL_TIMELINE:\n            cmds.currentTime(t, update=True)\n            return [_value(p, m) for p, m in plugs]\n        if self.strategy is None:\n            self.strategy = self._detect(t, plugs)\n        return self._read(self.strategy, t, plugs)\n\n\nclass Reader(object):\n    \"\"\"Collects what to read, then reads it all at once per frame.\"\"\"\n\n    def __init__(self, ev):\n        self.ev = ev\n        self.plugs = []\n        self.index = {}\n\n    def need(self, key, node, attr, is_matrix):\n        if key not in self.index:\n            self.index[key] = len(self.plugs)\n            self.plugs.append((_plug(node, attr), is_matrix))\n\n    def read(self, t):\n        vals = self.ev.read(t, self.plugs)\n        return dict((k, vals[i]) for k, i in self.index.items())\n\n\ndef _tmat(v):\n    return om.MMatrix([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, v[0], v[1], v[2], 1])\n\n\ndef _diag(s):\n    return om.MMatrix([s[0], 0, 0, 0, 0, s[1], 0, 0, 0, 0, s[2], 0, 0, 0, 0, 1])\n\n\ndef _no_translate(m):\n    vals = [m.getElement(r, c) for r in range(4) for c in range(4)]\n    vals[12] = vals[13] = vals[14] = 0.0\n    return om.MMatrix(vals)\n\n\ndef _euler(x, y, z, order):\n    return om.MEulerRotation(x, y, z, order)\n\n\ndef _vec_attr(node, attr, angular=False):\n    v = cmds.getAttr('%s.%s' % (node, attr))[0]\n    conv = _ang_in if angular else _lin_in\n    return om.MVector(conv(v[0]), conv(v[1]), conv(v[2]))\n\n\n# --------------------------------------------------------------------------\n# Maya: layers / keys\n# --------------------------------------------------------------------------\ndef root_layer():\n    try:\n        return cmds.animLayer(q=True, root=True)\n    except Exception:\n        return None\n\n\ndef plug_kind(plug):\n    src = cmds.listConnections(plug, s=True, d=False, skipConversionNodes=True) or []\n    if not src:\n        return 'none', None\n    nt = cmds.nodeType(src[0])\n    if nt.startswith('animCurve'):\n        return 'plain', src[0]\n    if nt.startswith('animBlendNode'):\n        return 'layered', src[0]\n    return 'driven', src[0]\n\n\ndef layer_curve(plug, layer):\n    try:\n        res = cmds.animLayer(layer, q=True, findCurveForPlug=plug) or []\n    except Exception:\n        res = []\n    return res[0] if res else None\n\n\ndef is_tool_layer(layer):\n    return bool(layer) and cmds.objExists(layer) and \\\n        cmds.attributeQuery(TAG, node=layer, exists=True)\n\n\ndef scene_layers():\n    root = root_layer()\n    return [l for l in (cmds.ls(type='animLayer') or []) if l != root]\n\n\nclass _NoUndo(object):\n    def __enter__(self):\n        self.state = cmds.undoInfo(q=True, stateWithoutFlush=True)\n        cmds.undoInfo(stateWithoutFlush=False)\n\n    def __exit__(self, *args):\n        cmds.undoInfo(stateWithoutFlush=self.state)\n\n\nclass _Muted(object):\n    \"\"\"Mutes a layer this tool made, so the original motion is read.\"\"\"\n\n    def __init__(self, layer):\n        self.layer = layer if is_tool_layer(layer) else None\n        self.prev = None\n\n    def __enter__(self):\n        if self.layer:\n            with _NoUndo():\n                self.prev = cmds.getAttr(self.layer + '.mute')\n                cmds.setAttr(self.layer + '.mute', True)\n        return self\n\n    def __exit__(self, *args):\n        if self.layer:\n            with _NoUndo():\n                cmds.setAttr(self.layer + '.mute', self.prev)\n\n\ndef _prepare_layer(cfg, plugs):\n    if cfg['layer'] == NEW_LAYER:\n        name = (cfg['layer_name'] or 'smoothNoise').strip()\n        if cmds.objExists(name) and cmds.nodeType(name) == 'animLayer':\n            layer = name                            # re-run: same layer\n        else:\n            layer = cmds.animLayer(name)\n            cmds.animLayer(layer, e=True, override=bool(cfg['layer_override']))\n            cmds.addAttr(layer, longName=TAG, attributeType='bool', defaultValue=True)\n    else:\n        layer = cfg['layer']\n        if not layer or not cmds.objExists(layer):\n            raise SmoothNoiseError('The layer \"%s\" does not exist any more. Reload.' % layer)\n    if cmds.animLayer(layer, q=True, lock=True):\n        raise SmoothNoiseError('Layer %s is locked.' % layer)\n    cmds.animLayer(layer, e=True, attribute=plugs)\n    return layer\n\n\ndef _tangent():\n    return getattr(oma.MFnAnimCurve, 'kTangentAuto', oma.MFnAnimCurve.kTangentLinear)\n\n\ndef write_curve(curve, ch, frames, values):\n    \"\"\"\n    Keys `values` (internal units) on every frame of `curve`. Fast path: build\n    a temporary curve with the API and paste it in one undoable command; it\n    is checked, and falls back to one key at a time if anything differs.\n    Returns 'bulk' or 'per-key'.\n    \"\"\"\n    ui = [_to_ui(ch, v) for v in values]\n    t0, t1 = frames[0], frames[-1]\n\n    def outside():\n        total = cmds.keyframe(curve, q=True, keyframeCount=True) or 0\n        return total - (cmds.keyframe(curve, q=True, time=(t0, t1), keyframeCount=True) or 0)\n\n    keys_outside = outside()\n    try:\n        kind = oma.MFnAnimCurve.kAnimCurveTL if ch[0] == 't' else oma.MFnAnimCurve.kAnimCurveTA\n        fn = oma.MFnAnimCurve()\n        temp = fn.create(kind)\n        try:\n            unit = om.MTime.uiUnit()\n            fn.addKeys([om.MTime(t, unit) for t in frames], list(values), _tangent(),\n                       _tangent())\n            name = om.MFnDependencyNode(temp).name()\n            cmds.copyKey(name, time=(t0, t1))\n            cmds.pasteKey(curve, time=(t0, t1), option='replace')\n        finally:\n            mod = om.MDGModifier()\n            mod.deleteNode(temp)\n            mod.doIt()\n        for i in (0, len(frames) // 2, len(frames) - 1):\n            got = cmds.keyframe(curve, q=True, time=(frames[i], frames[i]), valueChange=True)\n            if not got or abs(got[0] - ui[i]) > 1e-4 * max(1.0, abs(ui[i])):\n                raise ValueError('bulk write mismatch')\n        if (cmds.keyframe(curve, q=True, time=(t0, t1), keyframeCount=True) or 0) != len(frames):\n            raise ValueError('bulk write key count')\n        if outside() != keys_outside:\n            raise ValueError('bulk write touched keys outside the range')\n        return 'bulk'\n    except Exception:\n        for t, v in zip(frames, ui):\n            cmds.setKeyframe(curve, time=t, value=v)\n        cmds.keyTangent(curve, time=(t0, t1), inTangentType='auto', outTangentType='auto')\n        return 'per-key'\n\n\nclass LayerWriter(object):\n    \"\"\"Turns wanted final values into values of one channel on the layer.\"\"\"\n\n    def __init__(self, node, ch, layer):\n        self.node = node\n        self.ch = ch\n        self.plug = '%s.%s' % (node, LONG[ch])\n        self.layer = layer\n        self.override = bool(cmds.animLayer(layer, q=True, override=True))\n        w = cmds.getAttr(layer + '.weight')\n        self.weight = w if abs(w) > 1e-4 else 1.0\n\n    def _layer_values(self, curve, frames, finals):\n        if not curve:\n            return list(finals) if self.override else [0.0] * len(frames)\n        if not cmds.keyframe(curve, q=True, keyframeCount=True):\n            return list(finals) if self.override else [0.0] * len(frames)\n        return [_to_internal(self.ch, (cmds.keyframe(curve, q=True, eval=True, time=(t, t),\n                                                     valueChange=True) or [0.0])[0])\n                for t in frames]\n\n    def write(self, frames, targets, finals):\n        \"\"\"Returns the writer used, or None when nothing had to change.\"\"\"\n        # (an override layer must key every channel it holds, or it pins it)\n        if not self.override and not layer_curve(self.plug, self.layer) and \\\n                max(abs(a - b) for a, b in zip(targets, finals)) < 1e-7:\n            return None\n        curve = layer_curve(self.plug, self.layer)\n        current = self._layer_values(curve, frames, finals)\n        if self.override and abs(self.weight - 1.0) < 1e-4:\n            values = list(targets)\n        else:\n            values = [c + (t - f) / self.weight for c, t, f in zip(current, targets, finals)]\n        if not curve:\n            cmds.setKeyframe(self.plug, time=frames[0], value=_to_ui(self.ch, values[0]),\n                             animLayer=self.layer)\n            curve = layer_curve(self.plug, self.layer)\n            if not curve:\n                raise SmoothNoiseError('Could not key %s on %s.' % (self.plug, self.layer))\n        return write_curve(curve, self.ch, frames, values)\n\n\n# --------------------------------------------------------------------------\n# Maya: controls\n# --------------------------------------------------------------------------\ndef _ancestors(long_name):\n    parts = long_name.split('|')\n    return ['|'.join(parts[:i]) for i in range(len(parts) - 1, 1, -1)]\n\n\ndef editable(plug):\n    return not cmds.getAttr(plug, lock=True) and plug_kind(plug)[0] != 'driven'\n\n\nclass Control(object):\n\n    def __init__(self, node):\n        found = cmds.ls(node, long=True)\n        if not found:\n            raise SmoothNoiseError('Missing control: %s' % node)\n        n = self.node = found[0]\n        self.short = n.split('|')[-1]\n        self.is_joint = cmds.nodeType(n) == 'joint'\n        self.order = cmds.getAttr(n + '.rotateOrder')\n        ra = _vec_attr(n, 'rotateAxis', True)\n        self.ra = _euler(ra.x, ra.y, ra.z, 0).asMatrix()\n        self.jo = om.MMatrix()\n        self.ssc = False\n        if self.is_joint:\n            jo = _vec_attr(n, 'jointOrient', True)\n            self.jo = _euler(jo.x, jo.y, jo.z, 0).asMatrix()\n            self.ssc = bool(cmds.getAttr(n + '.segmentScaleCompensate'))\n        self.rp = _vec_attr(n, 'rotatePivot')\n        self.rpt = _vec_attr(n, 'rotatePivotTranslate')\n        self.sp = _vec_attr(n, 'scalePivot')\n        self.spt = _vec_attr(n, 'scalePivotTranslate')\n        self.ra_inv = self.ra.inverse()\n        self.jo_inv = self.jo.inverse()\n        self.channels = [c for c in T_CH + R_CH if editable('%s.%s' % (n, LONG[c]))]\n        self.level = 0\n        self.inv_scale = None\n\n    def local_point(self, q, scale, rot):\n        \"\"\"q * localMatrix with translate = 0 (from motion_copy.py).\"\"\"\n        if self.is_joint:\n            v = om.MVector(q.x * scale[0], q.y * scale[1], q.z * scale[2])\n            v = v * (self.ra * rot * self.jo)\n            if self.ssc and self.inv_scale is not None:\n                s = self.inv_scale\n                v = om.MVector(v.x / (s[0] or 1.0), v.y / (s[1] or 1.0), v.z / (s[2] or 1.0))\n            return v\n        v = om.MVector(q.x, q.y, q.z) - self.sp\n        v = om.MVector(v.x * scale[0], v.y * scale[1], v.z * scale[2])\n        v = v + self.sp + self.spt - self.rp\n        v = v * (self.ra * rot)\n        return v + self.rp + self.rpt\n\n    def solve(self, target_world, parent, cur, prev):\n        \"\"\"Local translate / rotate (internal units) that put the control on target.\"\"\"\n        local = target_world * parent.inverse()\n        upper = _no_translate(local)\n        if self.is_joint and self.ssc and self.inv_scale is not None:\n            upper = upper * _diag(self.inv_scale)\n        rot_total = om.MTransformationMatrix(upper).rotation(asQuaternion=True).asMatrix()\n        e = om.MEulerRotation.decompose(self.ra_inv * rot_total * self.jo_inv, self.order)\n        if prev is not None:\n            e = e.closestSolution(prev)\n        out = dict(cur)\n        for c, v in (('rx', e.x), ('ry', e.y), ('rz', e.z)):\n            if c in self.channels:\n                out[c] = v\n        rot = _euler(out['rx'], out['ry'], out['rz'], self.order).asMatrix()\n        q = om.MPoint(self.rp.x, self.rp.y, self.rp.z)\n        base = self.local_point(q, (out['sx'], out['sy'], out['sz']), rot)\n        goal = q * local\n        for c, g, b in (('tx', goal.x, base.x), ('ty', goal.y, base.y), ('tz', goal.z, base.z)):\n            if c in self.channels:\n                out[c] = g - b\n        return out, _euler(out['rx'], out['ry'], out['rz'], self.order)\n\n\ndef _controls(rows):\n    if not rows:\n        raise SmoothNoiseError('Add the noisy controls first.')\n    ctrls = [Control(n) for n in rows]\n    nodes = set(c.node for c in ctrls)\n    for c in ctrls:\n        c.level = sum(1 for a in _ancestors(c.node) if a in nodes)\n    return ctrls\n\n\ndef _frames(cfg):\n    if cfg['use_timeline']:\n        a = int(cmds.playbackOptions(q=True, min=True))\n        b = int(cmds.playbackOptions(q=True, max=True))\n    else:\n        a, b = int(cfg['start']), int(cfg['end'])\n    if b < a:\n        a, b = b, a\n    if b - a < 6:\n        raise SmoothNoiseError('The range needs at least 7 frames.')\n    return [float(t) for t in range(a, b + 1)]\n\n\nclass _Progress(object):\n    def __init__(self, total, title='Smooth Noise'):\n        self.total = max(1, total)\n        self.done = 0\n        self.ui = not cmds.about(batch=True)\n        if self.ui:\n            cmds.progressWindow(title=title, progress=0, maxValue=100, status='Reading...',\n                                isInterruptable=True)\n\n    def step(self, status=None):\n        self.done += 1\n        if self.ui and (self.done % 10 == 0 or status):\n            kw = {'edit': True, 'progress': min(100, int(100.0 * self.done / self.total))}\n            if status:\n                kw['status'] = status\n            cmds.progressWindow(**kw)\n            if cmds.progressWindow(q=True, isCancelled=True):\n                raise KeyboardInterrupt\n\n    def close(self):\n        if self.ui:\n            cmds.progressWindow(endProgress=True)\n\n\ndef read_original(cfg, ctrls, frames, progress):\n    \"\"\"World matrix, pivot position and orientation per frame, tool layer muted.\"\"\"\n    layer = None if cfg['layer'] == NEW_LAYER else cfg['layer']\n    if cfg['layer'] == NEW_LAYER and is_tool_layer(cfg['layer_name']):\n        layer = cfg['layer_name']\n    data = dict((c.node, {'world': [], 'pos': [], 'quat': []}) for c in ctrls)\n    with _Muted(layer):\n        with Evaluator(cfg['eval']) as ev:\n            reader = Reader(ev)\n            for c in ctrls:\n                reader.need(('W', c.node), c.node, 'worldMatrix', True)\n            for t in frames:\n                vals = reader.read(t)\n                for c in ctrls:\n                    w = vals[('W', c.node)]\n                    p = om.MPoint(c.rp.x, c.rp.y, c.rp.z) * w\n                    q = om.MTransformationMatrix(w).rotation(asQuaternion=True)\n                    d = data[c.node]\n                    d['world'].append(w)\n                    d['pos'].append((p.x, p.y, p.z))\n                    d['quat'].append((q.x, q.y, q.z, q.w))\n                progress.step()\n    return data\n\n\n# --------------------------------------------------------------------------\n# Maya: analyze / apply\n# --------------------------------------------------------------------------\ndef analyze(cfg, rows):\n    \"\"\"Auto: {node: {signal: (strength 0..100, mask, runs)}} and a report.\"\"\"\n    ctrls = _controls(rows)\n    frames = _frames(cfg)\n    scale = threshold_scale(cfg['sensitivity'])\n    pos_thr = _lin_in(cfg['pos_threshold']) * scale\n    rot_thr = cfg['rot_threshold'] * scale\n    fade = int(cfg['fade'])\n    progress = _Progress(len(frames) + len(ctrls) * 4, 'Smooth Noise: analyze')\n    result = {}\n    lines = []\n    try:\n        data = read_original(cfg, ctrls, frames, progress)\n        for c in ctrls:\n            d = data[c.node]\n            res = {}\n            parts = []\n            for i, sig in enumerate(('px', 'py', 'pz')):\n                if sig not in cfg['signals']:\n                    continue\n                s, mask, runs, peak = analyze_values([p[i] for p in d['pos']], pos_thr, fade)\n                res[sig] = (int(round(s * 100)), mask, runs)\n                parts.append(_describe(sig, s, runs, frames))\n                progress.step('Analyzing %s' % c.short)\n            if 'rot' in cfg['signals']:\n                s, mask, runs, peak = analyze_quats(d['quat'], rot_thr, fade)\n                res['rot'] = (int(round(s * 100)), mask, runs)\n                parts.append(_describe('rot', s, runs, frames))\n                progress.step()\n            result[c.node] = res\n            lines.append('%s: %s' % (c.short, '; '.join(parts)))\n    except KeyboardInterrupt:\n        return None, 'Cancelled.'\n    finally:\n        progress.close()\n    return result, '\\n'.join(lines)\n\n\ndef _describe(sig, strength, runs, frames):\n    if not runs:\n        return '%s clean' % SIGNAL_LABELS[sig]\n    count = sum(b - a + 1 for a, b in runs)\n    spans = ', '.join('%d-%d' % (frames[a], frames[b]) for a, b in runs[:3])\n    if len(runs) > 3:\n        spans += ', ...'\n    return '%s %d stretch(es), %d frames (%s), strength %d' % (\n        SIGNAL_LABELS[sig], len(runs), count, spans, int(round(strength * 100)))\n\n\ndef apply(cfg, rows, strengths, masks=None):\n    \"\"\"\n    strengths: {node: {signal: 0..100}}; masks: {node: {signal: [w]}} from\n    analyze, or None for the whole range (Manual). Returns a report.\n    \"\"\"\n    ctrls = _controls(rows)\n    frames = _frames(cfg)\n    n = len(frames)\n    fade = int(cfg['fade'])\n    levels = sorted(set(c.level for c in ctrls))\n    progress = _Progress(n * (1 + 2 * len(levels)) + len(ctrls) * 6)\n    chunk = False\n    writers_used = set()\n    report = []\n    try:\n        data = read_original(cfg, ctrls, frames, progress)\n\n        # wanted world matrices, from the original motion\n        targets = {}\n        for c in ctrls:\n            d = data[c.node]\n            st = strengths.get(c.node, {})\n            mk = (masks or {}).get(c.node, {})\n\n            def get(sig):\n                on = sig in cfg['signals']\n                s = st.get(sig, 0) / 100.0 if on else 0.0\n                m = mk.get(sig) if masks is not None else full_mask(n, fade)\n                if m is None or not on:\n                    m = [0.0] * n\n                return s, m\n\n            sx, mx = get('px')\n            sy, my = get('py')\n            sz, mz = get('pz')\n            sr, mr = get('rot')\n            pos = blend_positions(d['pos'], (sx, sy, sz), (mx, my, mz))\n            quats = blend_quats(d['quat'], sr, mr)\n            mats = []\n            for w, p, q in zip(d['world'], pos, quats):\n                tm = om.MTransformationMatrix(w)\n                tm.setRotation(om.MQuaternion(q[0], q[1], q[2], q[3]))\n                m = tm.asMatrix()\n                now = om.MPoint(c.rp.x, c.rp.y, c.rp.z) * m\n                fix = _tmat((p[0] - now.x, p[1] - now.y, p[2] - now.z))\n                mats.append(m * fix)\n            targets[c.node] = mats\n\n        cmds.undoInfo(openChunk=True, chunkName='Smooth Noise')\n        chunk = True\n        plugs = ['%s.%s' % (c.node, LONG[ch]) for c in ctrls for ch in c.channels]\n        layer = _prepare_layer(cfg, plugs)\n        if cfg['replace'] and is_tool_layer(layer):\n            for p in plugs:\n                crv = layer_curve(p, layer)\n                if crv:\n                    cmds.cutKey(crv, time=(frames[0], frames[-1]), clear=True)\n\n        with Evaluator(cfg['eval']) as ev:\n            for level in levels:\n                group = [c for c in ctrls if c.level == level]\n                reader = Reader(ev)\n                for c in group:\n                    reader.need(('PM', c.node), c.node, 'parentMatrix', True)\n                    for ch in CHANNELS:\n                        reader.need((ch, c.node), c.node, LONG[ch], False)\n                    if c.ssc:\n                        for a in 'XYZ':\n                            reader.need(('is' + a, c.node), c.node, 'inverseScale' + a, False)\n                values = []\n                for t in frames:\n                    values.append(reader.read(t))\n                    progress.step('Solving %s' % ', '.join(c.short for c in group))\n                for c in group:\n                    finals = dict((ch, []) for ch in c.channels)\n                    wanted = dict((ch, []) for ch in c.channels)\n                    prev = None\n                    for v, target in zip(values, targets[c.node]):\n                        cur = dict((ch, v[(ch, c.node)]) for ch in CHANNELS)\n                        c.inv_scale = ([v[('is' + a, c.node)] for a in 'XYZ']\n                                       if c.ssc else None)\n                        if prev is None:\n                            prev = _euler(cur['rx'], cur['ry'], cur['rz'], c.order)\n                        out, prev = c.solve(target, v[('PM', c.node)], cur, prev)\n                        for ch in c.channels:\n                            finals[ch].append(cur[ch])\n                            wanted[ch].append(out[ch])\n                    for ch in c.channels:\n                        used = LayerWriter(c.node, ch, layer).write(frames, wanted[ch],\n                                                                    finals[ch])\n                        if used:\n                            writers_used.add(used)\n                        progress.step()\n                    locked = [LONG[ch] for ch in T_CH + R_CH if ch not in c.channels]\n                    report.append('%s: smoothed%s' % (\n                        c.short, (' (skipped locked/driven %s)' % ', '.join(locked))\n                        if locked else ''))\n    except KeyboardInterrupt:\n        if chunk:\n            cmds.undoInfo(closeChunk=True)\n            chunk = False\n            cmds.undo()\n        return 'Cancelled (nothing changed).'\n    finally:\n        if chunk:\n            cmds.undoInfo(closeChunk=True)\n        progress.close()\n    report.insert(0, 'Layer: %s   (keys written: %s)' % (\n        layer, ' + '.join(sorted(writers_used)) or 'none needed'))\n    return '\\n'.join(report)\n\n\n# --------------------------------------------------------------------------\n# UI\n# --------------------------------------------------------------------------\ndef _maya_main_window():\n    ptr = omui.MQtUtil.mainWindow()\n    return wrapInstance(long(ptr), QtWidgets.QWidget)\n\n\n_DialogBase = QtWidgets.QDialog if QtWidgets else object\n\n\nclass SmoothNoiseUI(_DialogBase):\n    OBJECT_NAME = 'smoothNoiseWindow'\n\n    def __init__(self, parent=None):\n        super(SmoothNoiseUI, self).__init__(parent)\n        self.setObjectName(self.OBJECT_NAME)\n        self.setWindowTitle('Smooth Noise')\n        self.setMinimumWidth(480)\n        self.analysis = None        # (key, {node: {signal: (strength, mask, runs)}})\n        self._build()\n        self._connect()\n        self.refresh_layers()\n        self.set_cfg(self._load())\n        self._update_enabled()\n\n    # -- layout -----------------------------------------------------------\n    def _build(self):\n        W = QtWidgets\n        main = W.QVBoxLayout(self)\n\n        box = W.QGroupBox('Controls and strengths (0-100)')\n        lay = W.QVBoxLayout(box)\n        self.table = W.QTableWidget(0, 1 + len(SIGNALS))\n        self.table.setHorizontalHeaderLabels(['Control'] + [SIGNAL_LABELS[s] for s in SIGNALS])\n        self.table.horizontalHeader().setSectionResizeMode(0, W.QHeaderView.Stretch)\n        self.table.verticalHeader().setVisible(False)\n        self.table.setSelectionBehavior(W.QAbstractItemView.SelectRows)\n        self.table.setMaximumHeight(160)\n        self.table.setToolTip('Strength per control and signal. Auto fills it; edit any cell.')\n        lay.addWidget(self.table)\n        row = W.QHBoxLayout()\n        self.b_add = W.QPushButton('Add Selected')\n        self.b_remove = W.QPushButton('Remove')\n        self.b_select = W.QPushButton('Select')\n        for b in (self.b_add, self.b_remove, self.b_select):\n            row.addWidget(b)\n        lay.addLayout(row)\n        row = W.QHBoxLayout()\n        row.addWidget(W.QLabel('Smooth:'))\n        self.sig = {}\n        for s in SIGNALS:\n            cb = W.QCheckBox(SIGNAL_LABELS[s])\n            self.sig[s] = cb\n            row.addWidget(cb)\n        lay.addLayout(row)\n        main.addWidget(box)\n\n        box = W.QGroupBox('Range')\n        grid = W.QGridLayout(box)\n        self.use_timeline = W.QCheckBox('Timeline')\n        self.start = W.QSpinBox()\n        self.end = W.QSpinBox()\n        for s in (self.start, self.end):\n            s.setRange(-100000, 100000)\n        self.b_highlight = W.QPushButton('Highlighted')\n        grid.addWidget(self.use_timeline, 0, 0)\n        grid.addWidget(self.start, 0, 1)\n        grid.addWidget(self.end, 0, 2)\n        grid.addWidget(self.b_highlight, 0, 3)\n        grid.addWidget(W.QLabel('Fade frames'), 1, 0)\n        self.fade = W.QSpinBox()\n        self.fade.setRange(0, 100)\n        self.fade.setToolTip('The fix fades in/out over these frames (at the range ends, and '\n                             'around each noisy stretch in Auto)')\n        grid.addWidget(self.fade, 1, 1)\n        main.addWidget(box)\n\n        self.tabs = W.QTabWidget()\n        auto = W.QWidget()\n        grid = W.QGridLayout(auto)\n        grid.addWidget(W.QLabel('Sensitivity'), 0, 0)\n        self.sensitivity = W.QSlider(QtCore.Qt.Horizontal)\n        self.sensitivity.setRange(0, 100)\n        self.sensitivity.setToolTip('Higher finds finer jitter')\n        grid.addWidget(self.sensitivity, 0, 1, 1, 3)\n        grid.addWidget(W.QLabel('Ignore jitter under'), 1, 0)\n        self.pos_thr = W.QDoubleSpinBox()\n        self.pos_thr.setRange(0, 1e5)\n        self.pos_thr.setDecimals(3)\n        self.pos_thr.setSuffix(' units')\n        self.rot_thr = W.QDoubleSpinBox()\n        self.rot_thr.setRange(0, 360)\n        self.rot_thr.setDecimals(3)\n        self.rot_thr.setSuffix(' deg')\n        grid.addWidget(self.pos_thr, 1, 1)\n        grid.addWidget(self.rot_thr, 1, 2)\n        self.b_analyze = W.QPushButton('Analyze')\n        self.b_analyze.setToolTip('Find the noisy stretches and fill the strengths. '\n                                  'Changes nothing.')\n        grid.addWidget(self.b_analyze, 2, 0, 1, 4)\n        self.tabs.addTab(auto, 'Auto')\n        manual = W.QWidget()\n        grid = W.QGridLayout(manual)\n        grid.addWidget(W.QLabel('Strength'), 0, 0)\n        self.strength = W.QSlider(QtCore.Qt.Horizontal)\n        self.strength.setRange(0, 100)\n        self.strength.setToolTip('Sets every ticked signal of every control. Applies on '\n                                 'release.')\n        grid.addWidget(self.strength, 0, 1)\n        self.strength_label = W.QLabel('')\n        grid.addWidget(self.strength_label, 0, 2)\n        grid.addWidget(W.QLabel('Smooths the whole range (with the fade at its ends). Edit the '\n                                'table for per-signal strengths, then Apply.'), 1, 0, 1, 3)\n        self.tabs.addTab(manual, 'Manual')\n        main.addWidget(self.tabs)\n\n        box = W.QGroupBox('Animation layer')\n        grid = W.QGridLayout(box)\n        self.layer = W.QComboBox()\n        self.b_layers = W.QPushButton('Reload')\n        grid.addWidget(self.layer, 0, 0, 1, 2)\n        grid.addWidget(self.b_layers, 0, 2)\n        self.layer_name = W.QLineEdit()\n        self.layer_type = W.QComboBox()\n        self.layer_type.addItem('Additive (recommended)', False)\n        self.layer_type.addItem('Override', True)\n        grid.addWidget(W.QLabel('New layer'), 1, 0)\n        grid.addWidget(self.layer_name, 1, 1)\n        grid.addWidget(self.layer_type, 1, 2)\n        self.replace = W.QCheckBox('Replace the previous fix in the range')\n        self.replace.setToolTip(\"Only on layers made by this tool: your own layers' keys are \"\n                                \"never removed.\")\n        grid.addWidget(self.replace, 2, 0, 1, 3)\n        grid.addWidget(W.QLabel('Evaluation'), 3, 0)\n        self.eval = W.QComboBox()\n        self.eval.addItem('Fast (DG context)', EVAL_CONTEXT)\n        self.eval.addItem('Timeline (complex rigs)', EVAL_TIMELINE)\n        grid.addWidget(self.eval, 3, 1, 1, 2)\n        main.addWidget(box)\n\n        row = W.QHBoxLayout()\n        self.b_apply = W.QPushButton('Apply')\n        self.b_apply.setStyleSheet('QPushButton {font-weight: bold; padding: 6px;'\n                                   'background: #3fa9f5; color: #10202c;}')\n        self.b_mute = W.QPushButton('Mute Layer')\n        self.b_mute.setCheckable(True)\n        self.b_mute.setToolTip('Compare with / without the fix')\n        row.addWidget(self.b_apply, 1)\n        row.addWidget(self.b_mute)\n        main.addLayout(row)\n        self.status = W.QLabel('Add the noisy controls, then Analyze (Auto) or set a '\n                               'strength (Manual).')\n        self.status.setWordWrap(True)\n        self.status.setTextInteractionFlags(QtCore.Qt.TextSelectableByMouse)\n        main.addWidget(self.status)\n\n    def _connect(self):\n        self.b_add.clicked.connect(self.add_selected)\n        self.b_remove.clicked.connect(self.remove_rows)\n        self.b_select.clicked.connect(self.select_controls)\n        self.use_timeline.toggled.connect(self._update_enabled)\n        self.b_highlight.clicked.connect(self.from_highlight)\n        self.b_layers.clicked.connect(self.refresh_layers)\n        self.layer.currentIndexChanged.connect(self._update_enabled)\n        self.b_analyze.clicked.connect(self._analyze)\n        self.strength.valueChanged.connect(self._strength_moved)\n        self.strength.sliderReleased.connect(self._strength_released)\n        self.b_apply.clicked.connect(self._apply)\n        self.b_mute.toggled.connect(self._mute)\n\n    def _update_enabled(self, *_):\n        timeline = self.use_timeline.isChecked()\n        self.start.setEnabled(not timeline)\n        self.end.setEnabled(not timeline)\n        new = self.layer.currentData() == NEW_LAYER\n        self.layer_name.setEnabled(new)\n        self.layer_type.setEnabled(new)\n        target = self.layer_name.text().strip() if new else self.layer.currentData()\n        self.replace.setEnabled(new or is_tool_layer(target))\n\n    def _say(self, text):\n        self.status.setText(text)\n\n    # -- table ------------------------------------------------------------\n    def _rows(self):\n        return [self.table.item(r, 0).data(QtCore.Qt.UserRole)\n                for r in range(self.table.rowCount())]\n\n    def _strengths(self):\n        out = {}\n        for r in range(self.table.rowCount()):\n            node = self.table.item(r, 0).data(QtCore.Qt.UserRole)\n            vals = {}\n            for i, s in enumerate(SIGNALS):\n                try:\n                    vals[s] = max(0, min(100, int(float(self.table.item(r, i + 1).text()))))\n                except (ValueError, AttributeError):\n                    vals[s] = 0\n            out[node] = vals\n        return out\n\n    def _set_cell(self, r, i, value):\n        it = self.table.item(r, i + 1)\n        if it is None:\n            it = QtWidgets.QTableWidgetItem()\n            it.setTextAlignment(QtCore.Qt.AlignCenter)\n            self.table.setItem(r, i + 1, it)\n        it.setText(str(int(value)))\n\n    def add_selected(self):\n        have = set(self._rows())\n        added = 0\n        for node in cmds.ls(sl=True, type='transform', long=True) or []:\n            if node in have:\n                continue\n            r = self.table.rowCount()\n            self.table.insertRow(r)\n            it = QtWidgets.QTableWidgetItem(node.split('|')[-1])\n            it.setData(QtCore.Qt.UserRole, node)\n            it.setToolTip(node)\n            it.setFlags(it.flags() & ~QtCore.Qt.ItemIsEditable)\n            self.table.setItem(r, 0, it)\n            for i in range(len(SIGNALS)):\n                self._set_cell(r, i, self.strength.value())\n            added += 1\n        self.analysis = None\n        self._say('%d control(s) added.' % added if added else 'Select the noisy controls.')\n\n    def remove_rows(self):\n        for r in sorted(set(i.row() for i in self.table.selectedIndexes()), reverse=True):\n            self.table.removeRow(r)\n        self.analysis = None\n\n    def select_controls(self):\n        nodes = [n for n in self._rows() if cmds.objExists(n)]\n        if nodes:\n            cmds.select(nodes, replace=True)\n\n    def from_highlight(self):\n        slider = mel.eval('$tmp = $gPlayBackSlider;')\n        if cmds.timeControl(slider, q=True, rangeVisible=True):\n            r = cmds.timeControl(slider, q=True, rangeArray=True)\n            self.use_timeline.setChecked(False)\n            self.start.setValue(int(r[0]))\n            self.end.setValue(int(r[1]) - 1)\n        else:\n            self._say('No highlighted time range.')\n\n    def refresh_layers(self):\n        current = self.layer.currentData()\n        self.layer.blockSignals(True)\n        self.layer.clear()\n        self.layer.addItem('New layer...', NEW_LAYER)\n        for l in scene_layers():\n            self.layer.addItem(l + ('   (made by this tool)' if is_tool_layer(l) else ''), l)\n        i = self.layer.findData(current)\n        self.layer.setCurrentIndex(i if i >= 0 else 0)\n        self.layer.blockSignals(False)\n        self._update_enabled()\n\n    # -- config -----------------------------------------------------------\n    def get_cfg(self):\n        return {\n            'use_timeline': self.use_timeline.isChecked(),\n            'start': self.start.value(), 'end': self.end.value(),\n            'fade': self.fade.value(),\n            'strength': self.strength.value(),\n            'signals': [s for s in SIGNALS if self.sig[s].isChecked()],\n            'sensitivity': self.sensitivity.value(),\n            'pos_threshold': self.pos_thr.value(),\n            'rot_threshold': self.rot_thr.value(),\n            'layer': self.layer.currentData(),\n            'layer_name': self.layer_name.text().strip() or DEFAULTS['layer_name'],\n            'layer_override': bool(self.layer_type.currentData()),\n            'replace': self.replace.isChecked(),\n            'eval': self.eval.currentData(),\n        }\n\n    def set_cfg(self, cfg):\n        c = dict(DEFAULTS)\n        c.update(cfg or {})\n        self.use_timeline.setChecked(c['use_timeline'])\n        self.start.setValue(int(c['start']))\n        self.end.setValue(int(c['end']))\n        self.fade.setValue(int(c['fade']))\n        self.strength.blockSignals(True)\n        self.strength.setValue(int(c['strength']))\n        self.strength.blockSignals(False)\n        self.strength_label.setText(str(int(c['strength'])))\n        for s in SIGNALS:\n            self.sig[s].setChecked(s in c['signals'])\n        self.sensitivity.setValue(int(c['sensitivity']))\n        self.pos_thr.setValue(c['pos_threshold'])\n        self.rot_thr.setValue(c['rot_threshold'])\n        i = self.layer.findData(c['layer'])\n        self.layer.setCurrentIndex(i if i >= 0 else 0)\n        self.layer_name.setText(c['layer_name'])\n        self.layer_type.setCurrentIndex(1 if c['layer_override'] else 0)\n        self.replace.setChecked(c['replace'])\n        self.eval.setCurrentIndex(max(0, self.eval.findData(c['eval'])))\n\n    def _load(self):\n        try:\n            if cmds.optionVar(exists=OPTION_VAR):\n                return json.loads(cmds.optionVar(q=OPTION_VAR))\n        except Exception:\n            pass\n        return {}\n\n    def _save(self):\n        cmds.optionVar(sv=(OPTION_VAR, json.dumps(self.get_cfg())))\n\n    def _analysis_key(self, cfg):\n        \"\"\"What an analysis depends on: if any of it changes, it's stale.\"\"\"\n        keys = ('use_timeline', 'start', 'end', 'fade', 'signals', 'sensitivity',\n                'pos_threshold', 'rot_threshold', 'layer', 'layer_name')\n        rng = (cmds.playbackOptions(q=True, min=True), cmds.playbackOptions(q=True, max=True))\n        return json.dumps([cfg[k] for k in keys] + [list(rng), self._rows()])\n\n    # -- actions ----------------------------------------------------------\n    def _guard(self, fn):\n        try:\n            return fn()\n        except SmoothNoiseError as e:\n            self._say(str(e))\n            cmds.warning('Smooth Noise: %s' % e)\n        except Exception as e:\n            traceback.print_exc()\n            self._say('Error: %s (see Script Editor)' % e)\n        return None\n\n    def _analyze(self):\n        cfg = self.get_cfg()\n        self._save()\n\n        def go():\n            result, report = analyze(cfg, self._rows())\n            if result is None:\n                self._say(report)\n                return None\n            for r, node in enumerate(self._rows()):\n                for i, s in enumerate(SIGNALS):\n                    if s in result.get(node, {}):\n                        self._set_cell(r, i, result[node][s][0])\n            self.analysis = (self._analysis_key(cfg), result)\n            self._say(report + '\\nCheck the strengths, then Apply.')\n            return True\n        self._guard(go)\n\n    def _strength_moved(self, value):\n        self.strength_label.setText(str(value))\n        for r in range(self.table.rowCount()):\n            for i, s in enumerate(SIGNALS):\n                if self.sig[s].isChecked():\n                    self._set_cell(r, i, value)\n\n    def _strength_released(self):\n        if self.table.rowCount():\n            self._apply(manual=True)\n\n    def _apply(self, manual=None):\n        cfg = self.get_cfg()\n        self._save()\n        manual = self.tabs.currentIndex() == 1 if manual is None else manual\n        masks = None\n        if not manual:\n            key = self._analysis_key(cfg)\n            if self.analysis is None or self.analysis[0] != key:\n                self._analyze()\n                if self.analysis is None or self.analysis[0] != key:\n                    return\n            masks = dict((node, dict((s, v[1]) for s, v in sigs.items()))\n                         for node, sigs in self.analysis[1].items())\n\n        def go():\n            report = apply(cfg, self._rows(), self._strengths(), masks)\n            self._say(('Auto: ' if masks is not None else 'Manual: ') + report)\n            print('Smooth Noise:\\n' + report)\n            return True\n        self._guard(go)\n        self.refresh_layers()\n        self.b_mute.blockSignals(True)\n        self.b_mute.setChecked(False)\n        self.b_mute.setText('Mute Layer')\n        self.b_mute.blockSignals(False)\n\n    def _mute(self, state):\n        data = self.layer.currentData()\n        layer = self.layer_name.text().strip() if data == NEW_LAYER else data\n        if layer and cmds.objExists(layer):\n            cmds.animLayer(layer, e=True, mute=state)\n            self.b_mute.setText('Unmute Layer' if state else 'Mute Layer')\n        else:\n            self.b_mute.blockSignals(True)\n            self.b_mute.setChecked(False)\n            self.b_mute.blockSignals(False)\n            self._say('No layer to mute yet.')\n\n    def closeEvent(self, event):\n        try:\n            self._save()\n        except Exception:\n            pass\n        super(SmoothNoiseUI, self).closeEvent(event)\n\n\n_window = None\n\n\ndef show():\n    global _window\n    if _window is not None:\n        try:\n            _window.close()\n            _window.deleteLater()\n        except Exception:\n            pass\n    _window = SmoothNoiseUI(_maya_main_window())\n    _window.show()\n    return _window\n\n\nif __name__ == '__main__':\n    show()",
"aliases": {
"division": "__future__.division",
"print_function": "__future__.print_function",
"json": "json",
"math": "math",
"traceback": "traceback",
"cmds": "maya.cmds",
"mel": "maya.mel",
"omui": "maya.OpenMayaUI",
"om": "maya.api.OpenMaya",
"oma": "maya.api.OpenMayaAnim",
"QtCore": "QtCore",
"QtWidgets": "QtWidgets",
"wrapInstance": "shiboken.wrapInstance",
"W": "QtWidgets"
},
"outline": [
{
"q": "SmoothNoiseError",
"k": "class",
"s": 89,
"e": 90,
"doc": "",
"n": "Error type for problems the user can fix; the UI shows its message. Other errors print a traceback.",
"c": [],
"b": [
[
0,
"_prepare_layer"
],
[
0,
"LayerWriter.write"
],
[
0,
"Control.__init__"
],
[
0,
"_controls"
],
[
0,
"_frames"
],
[
0,
"SmoothNoiseUI._guard"
]
]
},
{
"q": "_butter",
"k": "def",
"s": 96,
"e": 102,
"doc": "2nd order low-pass Butterworth (bilinear). fc in cycles per frame.",
"n": "Computes the five coefficients of a 2nd order **Butterworth low-pass** filter for a cutoff in cycles per frame. It is the textbook bilinear-transform formula: `b` are the input weights, `a` the feedback weights. Butterworth is used because it is as flat as possible in the part it keeps, so real motion is not distorted.",
"c": [],
"b": [
[
0,
"filtfilt"
]
]
},
{
"q": "_run",
"k": "def",
"s": 105,
"e": 112,
"doc": "",
"n": "Runs the filter once over a list: each output mixes the current and two previous inputs with the two previous outputs. The history starts at the first value so the filter starts \"at rest\" instead of jumping from zero.",
"c": [],
"b": [
[
0,
"filtfilt"
]
]
},
{
"q": "filtfilt",
"k": "def",
"s": 115,
"e": 127,
"doc": "Zero-phase low-pass: forward then backward, ends extended by odd reflection.",
"n": "Zero-phase low-pass: filter forward, then filter the result backward. A one-way filter delays the signal; the backward pass delays it the other way, so the delays cancel and peaks stay on their frames. Before filtering, the ends are extended with an **odd reflection** (mirrored around the end value) so the filter does not drift at the start and end.",
"c": [
[
0,
"_butter"
],
[
0,
"_run"
]
],
"b": [
[
0,
"smooth_values"
],
[
0,
"jitter"
],
[
0,
"smooth_quats"
],
[
1,
"Filter.test_no_phase_shift"
],
[
1,
"Filter.test_keeps_slow_motion"
],
[
1,
"Filter.test_removes_jitter"
],
[
1,
"Filter.test_ends_do_not_drift"
],
[
1,
"Filter.test_constant_stays_constant"
],
[
1,
"Filter.test_short_or_off"
]
]
},
{
"q": "strength_to_cutoff",
"k": "def",
"s": 130,
"e": 135,
"doc": "0..1 (log scale) to a cutoff. 0 = no smoothing (None).",
"n": "Turns a 0 to 1 strength into a cutoff frequency on a **log scale**: 0.4 cycles per frame (barely anything removed) at the lightest, 0.01 (only waves longer than about 100 frames survive) at full. A log scale makes equal slider steps feel like equal changes. 0 means no smoothing (`None`).",
"c": [],
"b": [
[
0,
"smooth_values"
],
[
0,
"analyze_quats.residual"
],
[
0,
"blend_quats"
],
[
1,
"Filter.test_strength_scale"
],
[
1,
"Quaternions.test_smoothing_keeps_unit_length_and_reduces_jitter"
]
]
},
{
"q": "smooth_values",
"k": "def",
"s": 138,
"e": 139,
"doc": "",
"n": "Smooths a list with a strength: `filtfilt` with the matching cutoff.",
"c": [
[
0,
"strength_to_cutoff"
],
[
0,
"filtfilt"
]
],
"b": [
[
0,
"analyze_values.residual"
],
[
0,
"blend_positions"
],
[
1,
"Filter.test_short_or_off"
],
[
1,
"Detect.test_auto_strength_reaches_the_target_and_scales_with_noise"
]
]
},
{
"q": "local_rms",
"k": "def",
"s": 142,
"e": 149,
"doc": "",
"n": "For each frame, the RMS (root mean square, a kind of average size) of the values in a small window around it. Used to see *where* jitter is strong.",
"c": [],
"b": [
[
0,
"analyze_values"
],
[
0,
"analyze_quats"
]
]
},
{
"q": "jitter",
"k": "def",
"s": 152,
"e": 155,
"doc": "The fast part of a signal: what's left after a light smoothing.",
"n": "The fast part of a signal: the signal minus a light smoothing of it. What is left is only the frame-to-frame shake.",
"c": [
[
0,
"filtfilt"
]
],
"b": [
[
0,
"analyze_values"
],
[
0,
"analyze_values.residual"
],
[
1,
"Detect.test_auto_strength_reaches_the_target_and_scales_with_noise"
]
]
},
{
"q": "q_dot",
"k": "def",
"s": 159,
"e": 160,
"doc": "",
"n": "Dot product of two quaternions: close to 1 or -1 when they are almost the same rotation.",
"c": [],
"b": [
[
0,
"q_normalize"
],
[
0,
"q_align"
],
[
0,
"q_slerp"
],
[
0,
"q_angle"
],
[
1,
"Quaternions.test_alignment_removes_sign_flips"
],
[
1,
"Quaternions.test_smoothing_keeps_unit_length_and_reduces_jitter"
]
]
},
{
"q": "q_normalize",
"k": "def",
"s": 163,
"e": 165,
"doc": "",
"n": "Scales a quaternion to length 1 (a valid rotation). `or 1.0` avoids dividing by zero.",
"c": [
[
0,
"q_dot"
]
],
"b": [
[
0,
"q_slerp"
],
[
0,
"smooth_quats"
],
[
1,
"Quaternions.test_smoothing_keeps_unit_length_and_reduces_jitter"
],
[
1,
"Quaternions.test_auto_rotation"
]
]
},
{
"q": "q_align",
"k": "def",
"s": 168,
"e": 176,
"doc": "Same hemisphere as the previous frame: no sign flips to smooth over.",
"n": "A quaternion and its negative are the **same** rotation. Mocap data can switch sign between frames, which would look like a huge jump to a filter. This flips each quaternion onto the same side as the previous one.",
"c": [
[
0,
"q_dot"
]
],
"b": [
[
0,
"smooth_quats"
],
[
0,
"rot_jitter"
],
[
0,
"analyze_quats"
],
[
0,
"blend_quats"
],
[
1,
"Quaternions.test_alignment_removes_sign_flips"
]
]
},
{
"q": "q_slerp",
"k": "def",
"s": 179,
"e": 188,
"doc": "",
"n": "Spherical interpolation between two orientations: the shortest, constant-speed rotation from `a` to `b`. Falls back to a normalized straight blend when they are almost equal (to avoid dividing by `sin` of nearly 0).",
"c": [
[
0,
"q_dot"
],
[
0,
"q_normalize"
]
],
"b": [
[
0,
"blend_quats"
],
[
1,
"Quaternions.test_slerp_ends"
]
]
},
{
"q": "q_angle",
"k": "def",
"s": 191,
"e": 193,
"doc": "Angle between two orientations, degrees.",
"n": "The angle between two orientations in degrees. `abs` makes `q` and `-q` count as the same.",
"c": [
[
0,
"q_dot"
]
],
"b": [
[
0,
"rot_jitter"
],
[
1,
"Quaternions.test_slerp_ends"
]
]
},
{
"q": "smooth_quats",
"k": "def",
"s": 196,
"e": 201,
"doc": "",
"n": "Smooths a list of orientations: align signs, filter each of the four components, normalize again.",
"c": [
[
0,
"q_align"
],
[
0,
"filtfilt"
],
[
0,
"q_normalize"
]
],
"b": [
[
0,
"rot_jitter"
],
[
0,
"analyze_quats.residual"
],
[
0,
"blend_quats"
],
[
1,
"Quaternions.test_smoothing_keeps_unit_length_and_reduces_jitter"
]
]
},
{
"q": "rot_jitter",
"k": "def",
"s": 204,
"e": 207,
"doc": "Per frame angular jitter (degrees).",
"n": "Per frame, how many degrees the orientation differs from a lightly smoothed version: the rotation equivalent of `jitter`.",
"c": [
[
0,
"q_align"
],
[
0,
"smooth_quats"
],
[
0,
"q_angle"
]
],
"b": [
[
0,
"analyze_quats"
],
[
0,
"analyze_quats.residual"
],
[
1,
"Quaternions.test_smoothing_keeps_unit_length_and_reduces_jitter"
]
]
},
{
"q": "_smoothstep",
"k": "def",
"s": 211,
"e": 213,
"doc": "",
"n": "Ease curve `3u² - 2u³`, used for the fades.",
"c": [],
"b": [
[
0,
"end_fade"
],
[
0,
"runs_mask"
]
]
},
{
"q": "find_runs",
"k": "def",
"s": 216,
"e": 226,
"doc": "[(first, last)] of True runs, joining gaps <= join, widened by widen.",
"n": "Turns a list of True/False flags (noisy or not, per frame) into ranges `(first, last)`. Runs separated by short gaps are joined, and every run is widened a little so the fix does not start exactly where the noise starts.",
"c": [],
"b": [
[
0,
"analyze_values"
],
[
0,
"analyze_quats"
],
[
1,
"Masks.test_runs_join_and_widen"
]
]
},
{
"q": "end_fade",
"k": "def",
"s": 229,
"e": 236,
"doc": "0 on the first and last frame, easing in over `fade` frames.",
"n": "Multiplies a mask so it is 0 on the first and last frame and eases in over `fade` frames. This is what guarantees nothing changes at or outside the range ends.",
"c": [
[
0,
"_smoothstep"
]
],
"b": [
[
0,
"runs_mask"
],
[
0,
"full_mask"
]
]
},
{
"q": "runs_mask",
"k": "def",
"s": 239,
"e": 247,
"doc": "1 inside runs, easing to 0 over `fade` frames around them.",
"n": "Mask that is 1 inside the noisy runs and eases to 0 around them, then gets the end fade.",
"c": [
[
0,
"_smoothstep"
],
[
0,
"end_fade"
]
],
"b": [
[
0,
"analyze_values"
],
[
0,
"analyze_quats"
],
[
1,
"Masks.test_runs_mask_fades"
]
]
},
{
"q": "full_mask",
"k": "def",
"s": 250,
"e": 251,
"doc": "",
"n": "Mask for Manual mode: 1 everywhere except the eased range ends.",
"c": [
[
0,
"end_fade"
]
],
"b": [
[
0,
"apply.get"
],
[
1,
"Masks.test_full_mask_is_zero_at_range_ends_and_eases"
]
]
},
{
"q": "_search_strength",
"k": "def",
"s": 254,
"e": 265,
"doc": "Lowest strength 0..1 with residual(strength) <= goal (bisection).",
"n": "Finds the lowest strength whose remaining jitter is at or under the goal, by **bisection**: try the middle, keep the half that contains the answer, repeat 14 times. It works because more strength always means less jitter. If even full strength is not enough, it returns full strength.",
"c": [],
"b": [
[
0,
"analyze_values"
],
[
0,
"analyze_quats"
]
]
},
{
"q": "_rms",
"k": "def",
"s": 268,
"e": 269,
"doc": "",
"n": "Root mean square of a list (0 for an empty list).",
"c": [],
"b": [
[
0,
"analyze_values"
],
[
0,
"analyze_values.residual"
],
[
0,
"analyze_quats"
],
[
0,
"analyze_quats.residual"
]
]
},
{
"q": "analyze_values",
"k": "def",
"s": 272,
"e": 291,
"doc": "Auto for one position axis: (strength 0..1, mask, noisy runs, jitter).\nStrength 0 and an empty mask when it's clean.",
"n": "Auto for one position axis: measure jitter per frame, find the stretches above the threshold, measure how strong the jitter is inside them, and search the strength that cuts it to `JITTER_TARGET` (25%) of that, but not below the threshold. Returns strength, mask, runs and the peak level. A clean signal returns strength 0 and an empty mask.",
"c": [
[
0,
"jitter"
],
[
0,
"local_rms"
],
[
0,
"find_runs"
],
[
0,
"_rms"
],
[
0,
"analyze_values.residual"
],
[
0,
"_search_strength"
],
[
0,
"runs_mask"
]
],
"b": [
[
0,
"analyze"
],
[
1,
"Detect.test_finds_the_noisy_stretch"
],
[
1,
"Detect.test_clean_signal_is_left_alone"
],
[
1,
"Detect.test_range_cut_mid_stretch"
],
[
1,
"Detect.test_auto_strength_reaches_the_target_and_scales_with_noise"
],
[
1,
"EndToEnd.test_noisy_path_smoothed_where_masked_only"
]
]
},
{
"q": "analyze_values.residual",
"k": "def",
"s": 285,
"e": 288,
"doc": "",
"n": "How much jitter is left inside the noisy stretches after smoothing with strength `s`. Passed to `_search_strength`.",
"c": [
[
0,
"smooth_values"
],
[
0,
"jitter"
],
[
0,
"_rms"
]
],
"b": [
[
0,
"analyze_values"
]
]
},
{
"q": "analyze_quats",
"k": "def",
"s": 294,
"e": 309,
"doc": "Auto for the orientation (threshold in degrees).",
"n": "Same as `analyze_values` for orientation, with the threshold in degrees and `rot_jitter` as the measure.",
"c": [
[
0,
"q_align"
],
[
0,
"rot_jitter"
],
[
0,
"local_rms"
],
[
0,
"find_runs"
],
[
0,
"_rms"
],
[
0,
"analyze_quats.residual"
],
[
0,
"_search_strength"
],
[
0,
"runs_mask"
]
],
"b": [
[
0,
"analyze"
],
[
1,
"Quaternions.test_auto_rotation"
]
]
},
{
"q": "analyze_quats.residual",
"k": "def",
"s": 304,
"e": 306,
"doc": "",
"n": "Remaining angular jitter inside the noisy stretches after smoothing with strength `s`.",
"c": [
[
0,
"strength_to_cutoff"
],
[
0,
"smooth_quats"
],
[
0,
"rot_jitter"
],
[
0,
"_rms"
]
],
"b": [
[
0,
"analyze_quats"
]
]
},
{
"q": "blend_positions",
"k": "def",
"s": 312,
"e": 319,
"doc": "orig: [(x, y, z)]; strengths / masks per axis. Returns new positions.",
"n": "Smooths each position axis with its own strength, then blends from original to smoothed by the mask: mask 0 keeps the original exactly, 1 uses the smoothed value.",
"c": [
[
0,
"smooth_values"
]
],
"b": [
[
0,
"apply"
],
[
1,
"EndToEnd.test_noisy_path_smoothed_where_masked_only"
]
]
},
{
"q": "blend_quats",
"k": "def",
"s": 322,
"e": 325,
"doc": "",
"n": "Same for orientation, blending with `q_slerp` by the mask.",
"c": [
[
0,
"q_align"
],
[
0,
"strength_to_cutoff"
],
[
0,
"smooth_quats"
],
[
0,
"q_slerp"
]
],
"b": [
[
0,
"apply"
]
]
},
{
"q": "threshold_scale",
"k": "def",
"s": 328,
"e": 330,
"doc": "Sensitivity 0..100: 50 = thresholds as typed, 100 = 10x more sensitive.",
"n": "Turns the Sensitivity slider into a multiplier on the thresholds: 50 = as typed, 100 = thresholds 10 times smaller (finds finer jitter), 0 = 10 times bigger.",
"c": [],
"b": [
[
0,
"analyze"
],
[
1,
"Detect.test_sensitivity"
]
]
},
{
"q": "_lin_in",
"k": "def",
"s": 336,
"e": 337,
"doc": "",
"n": "Distance from the scene's UI unit to centimeters (Maya's internal unit). The math always works in internal units.",
"c": [],
"b": [
[
0,
"_to_internal"
],
[
0,
"_cmds_value"
],
[
0,
"_vec_attr"
],
[
0,
"analyze"
]
]
},
{
"q": "_ang_in",
"k": "def",
"s": 340,
"e": 341,
"doc": "",
"n": "Angle from the UI unit (usually degrees) to radians.",
"c": [],
"b": [
[
0,
"_to_internal"
],
[
0,
"_cmds_value"
],
[
0,
"_vec_attr"
]
]
},
{
"q": "_to_ui",
"k": "def",
"s": 344,
"e": 349,
"doc": "",
"n": "Converts a channel value from internal units back to UI units for keying: centimeters for translate, radians for rotate.",
"c": [],
"b": [
[
0,
"write_curve"
],
[
0,
"LayerWriter.write"
]
]
},
{
"q": "_to_internal",
"k": "def",
"s": 352,
"e": 353,
"doc": "",
"n": "The reverse of `_to_ui`.",
"c": [
[
0,
"_ang_in"
],
[
0,
"_lin_in"
]
],
"b": [
[
0,
"LayerWriter._layer_values"
]
]
},
{
"q": "_plug",
"k": "def",
"s": 359,
"e": 366,
"doc": "",
"n": "Gets an API plug (`MPlug`) for an attribute. For `worldMatrix` and `parentMatrix`, which are arrays (one per instance), it picks the element for this instance.",
"c": [],
"b": [
[
0,
"Reader.need"
]
]
},
{
"q": "_ctx",
"k": "def",
"s": 369,
"e": 370,
"doc": "",
"n": "A DG context for a frame: \"evaluate as if the time were `t`\".",
"c": [],
"b": [
[
0,
"Evaluator._read"
]
]
},
{
"q": "_value",
"k": "def",
"s": 373,
"e": 377,
"doc": "",
"n": "Reads a plug (matrix or number), optionally in a DG context.",
"c": [],
"b": [
[
0,
"Evaluator._read"
],
[
0,
"Evaluator.read"
]
]
},
{
"q": "_cmds_value",
"k": "def",
"s": 380,
"e": 391,
"doc": "",
"n": "Reads a plug at a time with `cmds.getAttr(time=)`, the slow but always-correct way, converting units so the result matches the API reads.",
"c": [
[
0,
"_lin_in"
],
[
0,
"_ang_in"
]
],
"b": [
[
0,
"Evaluator._read"
],
[
0,
"Evaluator._detect"
]
]
},
{
"q": "Evaluator",
"k": "class",
"s": 394,
"e": 447,
"doc": "Reads plugs at any time without moving the timeline (DG context).",
"n": "Reads plugs at any frame. Two modes: **context** (fast, no timeline change) and **timeline** (moves the time and reads, for rigs whose setup does not evaluate correctly in a context).",
"c": [],
"b": [
[
0,
"read_original"
],
[
0,
"apply"
]
]
},
{
"q": "Evaluator.__init__",
"k": "def",
"s": 397,
"e": 400,
"doc": "",
"n": "Stores the mode; the read strategy is detected on the first read.",
"c": [],
"b": []
},
{
"q": "Evaluator.__enter__",
"k": "def",
"s": 402,
"e": 406,
"doc": "",
"n": "Timeline mode only: remember the current frame and pause viewport redraws, which makes scrubbing many frames much faster.",
"c": [],
"b": []
},
{
"q": "Evaluator.__exit__",
"k": "def",
"s": 408,
"e": 411,
"doc": "",
"n": "Timeline mode only: go back to the original frame and resume redraws.",
"c": [],
"b": []
},
{
"q": "Evaluator._read",
"k": "def",
"s": 413,
"e": 424,
"doc": "",
"n": "Reads a list of plugs at `t` with one strategy: `guard` (an `MDGContextGuard` makes every read in its scope happen at that time), `arg` (pass the context to each read), or `cmds`.",
"c": [
[
0,
"_value"
],
[
0,
"_ctx"
],
[
0,
"_cmds_value"
]
],
"b": [
[
0,
"Evaluator._detect"
],
[
0,
"Evaluator.read"
]
]
},
{
"q": "Evaluator._detect",
"k": "def",
"s": 426,
"e": 437,
"doc": "",
"n": "Picks the fastest strategy that gives the **right** answer: reads one plug with `guard`, then `arg`, and compares with the slow `cmds` value. Some Maya versions or rigs return wrong values in a context, so it is verified rather than assumed.",
"c": [
[
0,
"_cmds_value"
],
[
0,
"Evaluator._read"
]
],
"b": [
[
0,
"Evaluator.read"
]
]
},
{
"q": "Evaluator.read",
"k": "def",
"s": 439,
"e": 447,
"doc": "",
"n": "Reads a list of plugs at `t` using the detected strategy (or by moving the time in timeline mode).",
"c": [
[
0,
"_value"
],
[
0,
"Evaluator._detect"
],
[
0,
"Evaluator._read"
]
],
"b": []
},
{
"q": "Reader",
"k": "class",
"s": 450,
"e": 465,
"doc": "Collects what to read, then reads it all at once per frame.",
"n": "Collects every plug that is needed first, then reads them all in one call per frame. Each value is found later by a key such as `(\"W\", node)`.",
"c": [],
"b": [
[
0,
"read_original"
],
[
0,
"apply"
]
]
},
{
"q": "Reader.__init__",
"k": "def",
"s": 453,
"e": 456,
"doc": "",
"n": "Empty list of plugs and a key-to-index map.",
"c": [],
"b": []
},
{
"q": "Reader.need",
"k": "def",
"s": 458,
"e": 461,
"doc": "",
"n": "Registers a plug once under a key.",
"c": [
[
0,
"_plug"
]
],
"b": []
},
{
"q": "Reader.read",
"k": "def",
"s": 463,
"e": 465,
"doc": "",
"n": "Reads every registered plug at `t` and returns `{key: value}`.",
"c": [],
"b": []
},
{
"q": "_tmat",
"k": "def",
"s": 468,
"e": 469,
"doc": "",
"n": "A translation matrix.",
"c": [],
"b": [
[
0,
"apply"
]
]
},
{
"q": "_diag",
"k": "def",
"s": 472,
"e": 473,
"doc": "",
"n": "A scale matrix (values on the diagonal).",
"c": [],
"b": [
[
0,
"Control.solve"
]
]
},
{
"q": "_no_translate",
"k": "def",
"s": 476,
"e": 479,
"doc": "",
"n": "A copy of a matrix with the translation removed (only rotation and scale left).",
"c": [],
"b": [
[
0,
"Control.solve"
]
]
},
{
"q": "_euler",
"k": "def",
"s": 482,
"e": 483,
"doc": "",
"n": "Builds an `MEulerRotation` from three angles and a rotate order.",
"c": [],
"b": [
[
0,
"Control.__init__"
],
[
0,
"Control.solve"
],
[
0,
"apply"
]
]
},
{
"q": "_vec_attr",
"k": "def",
"s": 486,
"e": 489,
"doc": "",
"n": "Reads a 3-value attribute (pivot, rotate axis, joint orient) as a vector in internal units.",
"c": [
[
0,
"_lin_in"
],
[
0,
"_ang_in"
]
],
"b": [
[
0,
"Control.__init__"
]
]
},
{
"q": "root_layer",
"k": "def",
"s": 495,
"e": 499,
"doc": "",
"n": "The BaseAnimation layer, or `None` when the scene has no layers.",
"c": [],
"b": [
[
0,
"scene_layers"
]
]
},
{
"q": "plug_kind",
"k": "def",
"s": 502,
"e": 511,
"doc": "",
"n": "What drives a channel: nothing, a plain animation curve, an animation layer blend node, or something else (constraint, expression...) which the tool must not overwrite.",
"c": [],
"b": [
[
0,
"editable"
]
]
},
{
"q": "layer_curve",
"k": "def",
"s": 514,
"e": 519,
"doc": "",
"n": "The animation curve that holds this plug's values on a given layer, or `None`.",
"c": [],
"b": [
[
0,
"LayerWriter.write"
],
[
0,
"apply"
]
]
},
{
"q": "is_tool_layer",
"k": "def",
"s": 522,
"e": 524,
"doc": "",
"n": "True if the layer exists and carries this tool's tag attribute. The tool only ever clears keys on its own layers.",
"c": [],
"b": [
[
0,
"_Muted.__init__"
],
[
0,
"read_original"
],
[
0,
"apply"
],
[
0,
"SmoothNoiseUI._update_enabled"
],
[
0,
"SmoothNoiseUI.refresh_layers"
]
]
},
{
"q": "scene_layers",
"k": "def",
"s": 527,
"e": 529,
"doc": "",
"n": "All animation layers except BaseAnimation, for the dropdown.",
"c": [
[
0,
"root_layer"
]
],
"b": [
[
0,
"SmoothNoiseUI.refresh_layers"
]
]
},
{
"q": "_NoUndo",
"k": "class",
"s": 532,
"e": 538,
"doc": "",
"n": "Pauses undo recording without flushing the history, then restores it.",
"c": [],
"b": [
[
0,
"_Muted.__enter__"
],
[
0,
"_Muted.__exit__"
]
]
},
{
"q": "_NoUndo.__enter__",
"k": "def",
"s": 533,
"e": 535,
"doc": "",
"n": "Remembers the undo state and turns recording off.",
"c": [],
"b": []
},
{
"q": "_NoUndo.__exit__",
"k": "def",
"s": 537,
"e": 538,
"doc": "",
"n": "Puts the undo state back.",
"c": [],
"b": []
},
{
"q": "_Muted",
"k": "class",
"s": 541,
"e": 558,
"doc": "Mutes a layer this tool made, so the original motion is read.",
"n": "Mutes the tool's own layer while reading, so the tool always analyzes and smooths the **original** motion, not the result of a previous fix. Re-running it does not smooth the smoothed result again.",
"c": [],
"b": [
[
0,
"read_original"
]
]
},
{
"q": "_Muted.__init__",
"k": "def",
"s": 544,
"e": 546,
"doc": "",
"n": "Only acts on a layer made by this tool.",
"c": [
[
0,
"is_tool_layer"
]
],
"b": []
},
{
"q": "_Muted.__enter__",
"k": "def",
"s": 548,
"e": 553,
"doc": "",
"n": "Remembers the mute state and mutes the layer, outside undo.",
"c": [
[
0,
"_NoUndo"
]
],
"b": []
},
{
"q": "_Muted.__exit__",
"k": "def",
"s": 555,
"e": 558,
"doc": "",
"n": "Restores the previous mute state, outside undo.",
"c": [
[
0,
"_NoUndo"
]
],
"b": []
},
{
"q": "_prepare_layer",
"k": "def",
"s": 561,
"e": 577,
"doc": "",
"n": "Gets the layer to write to: reuses a new-layer name that already exists (so re-runs land on the same layer), otherwise creates it (additive or override) and tags it. A chosen existing layer must exist and not be locked. Then the channels are added to the layer.",
"c": [
[
0,
"SmoothNoiseError"
]
],
"b": [
[
0,
"apply"
]
]
},
{
"q": "_tangent",
"k": "def",
"s": 580,
"e": 581,
"doc": "",
"n": "The tangent type for bulk-written keys: auto if this Maya's API has it, otherwise linear.",
"c": [],
"b": [
[
0,
"write_curve"
]
]
},
{
"q": "write_curve",
"k": "def",
"s": 584,
"e": 627,
"doc": "Keys `values` (internal units) on every frame of `curve`. Fast path: build\na temporary curve with the API and paste it in one undoable command; it\nis checked, and falls back to one key at a time if anything differs.\nReturns 'bulk' or 'per-key'.",
"n": "Writes a value on every frame of a curve. **Fast path:** build a temporary curve with the API (`MFnAnimCurve.addKeys`, all keys in one call), copy its keys and paste them over the range with `cmds` (so it is one undoable step), then delete the temporary curve. It then **checks** the result (three sample values, the key count, and that keys outside the range were not touched). If anything differs, it falls back to setting keys one by one.",
"c": [
[
0,
"_to_ui"
],
[
0,
"write_curve.outside"
],
[
0,
"_tangent"
]
],
"b": [
[
0,
"LayerWriter.write"
]
]
},
{
"q": "write_curve.outside",
"k": "def",
"s": 594,
"e": 596,
"doc": "",
"n": "Number of keys on the curve outside the range, to verify that pasting did not touch them.",
"c": [],
"b": [
[
0,
"write_curve"
]
]
},
{
"q": "LayerWriter",
"k": "class",
"s": 630,
"e": 669,
"doc": "Turns wanted final values into values of one channel on the layer.",
"n": "Converts \"the final value should be X\" into \"the layer curve should hold Y\", taking the layer type and weight into account.",
"c": [],
"b": [
[
0,
"apply"
]
]
},
{
"q": "LayerWriter.__init__",
"k": "def",
"s": 633,
"e": 640,
"doc": "",
"n": "Stores the plug and reads the layer's mode (additive or override) and weight. A weight of 0 is treated as 1 to avoid dividing by zero.",
"c": [],
"b": []
},
{
"q": "LayerWriter._layer_values",
"k": "def",
"s": 642,
"e": 649,
"doc": "",
"n": "The current values of the layer curve on every frame (or 0 for a new additive curve, or the final values for a new override curve).",
"c": [
[
0,
"_to_internal"
]
],
"b": [
[
0,
"LayerWriter.write"
]
]
},
{
"q": "LayerWriter.write",
"k": "def",
"s": 651,
"e": 669,
"doc": "Returns the writer used, or None when nothing had to change.",
"n": "Computes the new layer values: the current layer value plus the change still needed, divided by the weight (`layer + (target - final) / weight`). For a full-weight override layer the layer value is simply the target. It skips channels that need no change and have no curve yet, creates the layer curve with one key if needed, and writes all frames with `write_curve`.",
"c": [
[
0,
"layer_curve"
],
[
0,
"LayerWriter._layer_values"
],
[
0,
"SmoothNoiseError"
],
[
0,
"_to_ui"
],
[
0,
"write_curve"
]
],
"b": []
},
{
"q": "_ancestors",
"k": "def",
"s": 675,
"e": 677,
"doc": "",
"n": "All parent paths of a long DAG name, nearest first.",
"c": [],
"b": [
[
0,
"_controls"
]
]
},
{
"q": "editable",
"k": "def",
"s": 680,
"e": 681,
"doc": "",
"n": "A channel can be written if it is not locked and not driven by something other than keys.",
"c": [
[
0,
"plug_kind"
]
],
"b": [
[
0,
"Control.__init__"
]
]
},
{
"q": "Control",
"k": "class",
"s": 684,
"e": 748,
"doc": "",
"n": "Everything about one control that the world-to-local solve needs, read once.",
"c": [],
"b": [
[
0,
"_controls"
]
]
},
{
"q": "Control.__init__",
"k": "def",
"s": 686,
"e": 710,
"doc": "",
"n": "Reads the full name, whether it is a joint, the rotate order, rotate axis, joint orient (joints only), segment scale compensate, all four pivot attributes, and which translate/rotate channels are editable. Inverse matrices are computed once here because the solve uses them on every frame.",
"c": [
[
0,
"SmoothNoiseError"
],
[
0,
"_vec_attr"
],
[
0,
"_euler"
],
[
0,
"editable"
]
],
"b": []
},
{
"q": "Control.local_point",
"k": "def",
"s": 712,
"e": 725,
"doc": "q * localMatrix with translate = 0 (from motion_copy.py).",
"n": "Where a local point ends up under the control's local transform with translate = 0, following Maya's full transform order: scale pivot, scale, rotate pivot, rotate axis, rotation, joint orient. The solve uses it to find which translate puts the rotate pivot on target.",
"c": [],
"b": [
[
0,
"Control.solve"
]
]
},
{
"q": "Control.solve",
"k": "def",
"s": 727,
"e": 748,
"doc": "Local translate / rotate (internal units) that put the control on target.",
"n": "The world-to-local solve for one frame. 1) Target world matrix times the inverse parent matrix gives the wanted **local** matrix. 2) Its rotation, with rotate axis and joint orient removed, is decomposed into the control's rotate order, choosing the angles closest to the previous frame so there are no flips. 3) The translate is the difference between where the pivot should be and where it lands with zero translate. Only editable channels are changed.",
"c": [
[
0,
"_no_translate"
],
[
0,
"_diag"
],
[
0,
"_euler"
],
[
0,
"Control.local_point"
]
],
"b": []
},
{
"q": "_controls",
"k": "def",
"s": 751,
"e": 758,
"doc": "",
"n": "Builds the `Control` objects and gives each a **level**: how many of the other selected controls are its ancestors. Level 0 is solved first.",
"c": [
[
0,
"SmoothNoiseError"
],
[
0,
"Control"
],
[
0,
"_ancestors"
]
],
"b": [
[
0,
"analyze"
],
[
0,
"apply"
]
]
},
{
"q": "_frames",
"k": "def",
"s": 761,
"e": 771,
"doc": "",
"n": "The frame list from the timeline or the custom range; at least 7 frames, because the filter needs some length to work.",
"c": [
[
0,
"SmoothNoiseError"
]
],
"b": [
[
0,
"analyze"
],
[
0,
"apply"
]
]
},
{
"q": "_Progress",
"k": "class",
"s": 774,
"e": 795,
"doc": "",
"n": "Maya progress window with Cancel; updates only every 10 steps to stay fast.",
"c": [],
"b": [
[
0,
"analyze"
],
[
0,
"apply"
]
]
},
{
"q": "_Progress.__init__",
"k": "def",
"s": 775,
"e": 781,
"doc": "",
"n": "Opens the window unless Maya runs in batch mode.",
"c": [],
"b": []
},
{
"q": "_Progress.step",
"k": "def",
"s": 783,
"e": 791,
"doc": "",
"n": "Counts a step and, every 10 steps or when there is a status text, updates the bar and checks Cancel (raising `KeyboardInterrupt`).",
"c": [],
"b": []
},
{
"q": "_Progress.close",
"k": "def",
"s": 793,
"e": 795,
"doc": "",
"n": "Closes the window.",
"c": [],
"b": []
},
{
"q": "read_original",
"k": "def",
"s": 798,
"e": 820,
"doc": "World matrix, pivot position and orientation per frame, tool layer muted.",
"n": "Reads every control's world matrix on every frame with the tool layer muted, and stores the matrix, the world position of the rotate pivot and the orientation as a quaternion.",
"c": [
[
0,
"is_tool_layer"
],
[
0,
"Reader"
],
[
0,
"Evaluator"
],
[
0,
"_Muted"
]
],
"b": [
[
0,
"analyze"
],
[
0,
"apply"
]
]
},
{
"q": "analyze",
"k": "def",
"s": 826,
"e": 861,
"doc": "Auto: {node: {signal: (strength 0..100, mask, runs)}} and a report.",
"n": "The Auto analysis: read the original motion, then run `analyze_values` on each ticked position axis and `analyze_quats` on rotation. Returns `{node: {signal: (strength 0-100, mask, runs)}}` and a readable report. Changes nothing in the scene.",
"c": [
[
0,
"_controls"
],
[
0,
"_frames"
],
[
0,
"threshold_scale"
],
[
0,
"_lin_in"
],
[
0,
"_Progress"
],
[
0,
"_describe"
],
[
0,
"analyze_quats"
],
[
0,
"analyze_values"
],
[
0,
"read_original"
]
],
"b": [
[
0,
"SmoothNoiseUI._analyze.go"
]
]
},
{
"q": "_describe",
"k": "def",
"s": 864,
"e": 872,
"doc": "",
"n": "One report phrase per signal: \"clean\", or how many noisy stretches, how many frames, where, and the strength.",
"c": [],
"b": [
[
0,
"analyze"
]
]
},
{
"q": "apply",
"k": "def",
"s": 875,
"e": 984,
"doc": "strengths: {node: {signal: 0..100}}; masks: {node: {signal: [w]}} from\nanalyze, or None for the whole range (Manual). Returns a report.",
"n": "The main operation. Builds the target world matrices from the original motion, opens one undo chunk, prepares the layer, optionally clears the previous fix in the range, then solves and writes controls level by level. On cancel it closes the chunk and runs `undo`, so nothing changes. Returns a report of what was written.",
"c": [
[
0,
"_controls"
],
[
0,
"_frames"
],
[
0,
"_Progress"
],
[
0,
"LayerWriter"
],
[
0,
"_euler"
],
[
0,
"Reader"
],
[
0,
"Evaluator"
],
[
0,
"layer_curve"
],
[
0,
"is_tool_layer"
],
[
0,
"_prepare_layer"
],
[
0,
"_tmat"
],
[
0,
"blend_quats"
],
[
0,
"blend_positions"
],
[
0,
"apply.get"
],
[
0,
"read_original"
]
],
"b": [
[
0,
"SmoothNoiseUI._apply.go"
]
]
},
{
"q": "apply.get",
"k": "def",
"s": 899,
"e": 905,
"doc": "",
"n": "Strength and mask for one signal of one control: the strength from the table (0 if the signal is unticked), and the Auto mask, or the full mask in Manual.",
"c": [
[
0,
"full_mask"
]
],
"b": [
[
0,
"apply"
]
]
},
{
"q": "_maya_main_window",
"k": "def",
"s": 990,
"e": 992,
"doc": "",
"n": "Maya's main window as a Qt widget, used as the parent of the tool window.",
"c": [],
"b": [
[
0,
"show"
]
]
},
{
"q": "SmoothNoiseUI",
"k": "class",
"s": 998,
"e": 1391,
"doc": "",
"n": "The tool window (a `QDialog` in Maya, `object` without Qt so tests can import the file).",
"c": [],
"b": [
[
0,
"SmoothNoiseUI.__init__"
],
[
0,
"SmoothNoiseUI.closeEvent"
],
[
0,
"show"
]
]
},
{
"q": "SmoothNoiseUI.__init__",
"k": "def",
"s": 1001,
"e": 1011,
"doc": "",
"n": "Builds the UI, connects signals, fills the layer list, loads the settings and updates which fields are enabled. `self.analysis` will hold the last Auto result.",
"c": [
[
0,
"SmoothNoiseUI"
],
[
0,
"SmoothNoiseUI._build"
],
[
0,
"SmoothNoiseUI._connect"
],
[
0,
"SmoothNoiseUI.refresh_layers"
],
[
0,
"SmoothNoiseUI._load"
],
[
0,
"SmoothNoiseUI.set_cfg"
],
[
0,
"SmoothNoiseUI._update_enabled"
]
],
"b": []
},
{
"q": "SmoothNoiseUI._build",
"k": "def",
"s": 1014,
"e": 1142,
"doc": "",
"n": "Creates the controls table (one row per control, one column per signal), the signal checkboxes, the range box, the Auto and Manual tabs, the layer box and the Apply and Mute buttons.",
"c": [],
"b": [
[
0,
"SmoothNoiseUI.__init__"
]
]
},
{
"q": "SmoothNoiseUI._connect",
"k": "def",
"s": 1144,
"e": 1156,
"doc": "",
"n": "All signal connections. The Manual slider updates the table while moving and applies on release.",
"c": [
[
0,
"SmoothNoiseUI.add_selected"
],
[
0,
"SmoothNoiseUI.remove_rows"
],
[
0,
"SmoothNoiseUI.select_controls"
],
[
0,
"SmoothNoiseUI._update_enabled"
],
[
0,
"SmoothNoiseUI.from_highlight"
],
[
0,
"SmoothNoiseUI.refresh_layers"
],
[
0,
"SmoothNoiseUI._analyze"
],
[
0,
"SmoothNoiseUI._strength_moved"
],
[
0,
"SmoothNoiseUI._strength_released"
],
[
0,
"SmoothNoiseUI._apply"
],
[
0,
"SmoothNoiseUI._mute"
]
],
"b": [
[
0,
"SmoothNoiseUI.__init__"
]
]
},
{
"q": "SmoothNoiseUI._update_enabled",
"k": "def",
"s": 1158,
"e": 1166,
"doc": "",
"n": "Enables or disables fields that do not apply: custom range when the timeline is used, new-layer options when an existing layer is chosen, and \"replace\" only for layers made by this tool.",
"c": [
[
0,
"is_tool_layer"
]
],
"b": [
[
0,
"SmoothNoiseUI.__init__"
],
[
0,
"SmoothNoiseUI._connect"
],
[
0,
"SmoothNoiseUI.refresh_layers"
]
]
},
{
"q": "SmoothNoiseUI._say",
"k": "def",
"s": 1168,
"e": 1169,
"doc": "",
"n": "Writes the status line.",
"c": [],
"b": [
[
0,
"SmoothNoiseUI.add_selected"
],
[
0,
"SmoothNoiseUI.from_highlight"
],
[
0,
"SmoothNoiseUI._guard"
],
[
0,
"SmoothNoiseUI._analyze.go"
],
[
0,
"SmoothNoiseUI._apply.go"
],
[
0,
"SmoothNoiseUI._mute"
]
]
},
{
"q": "SmoothNoiseUI._rows",
"k": "def",
"s": 1172,
"e": 1174,
"doc": "",
"n": "The full node name stored on each row (`UserRole` data), while the cell shows the short name.",
"c": [],
"b": [
[
0,
"SmoothNoiseUI.add_selected"
],
[
0,
"SmoothNoiseUI.select_controls"
],
[
0,
"SmoothNoiseUI._analysis_key"
],
[
0,
"SmoothNoiseUI._analyze.go"
],
[
0,
"SmoothNoiseUI._apply.go"
]
]
},
{
"q": "SmoothNoiseUI._strengths",
"k": "def",
"s": 1176,
"e": 1187,
"doc": "",
"n": "Reads the table into `{node: {signal: 0-100}}`, clamping values and treating anything unreadable as 0.",
"c": [],
"b": [
[
0,
"SmoothNoiseUI._apply.go"
]
]
},
{
"q": "SmoothNoiseUI._set_cell",
"k": "def",
"s": 1189,
"e": 1195,
"doc": "",
"n": "Writes one strength cell, creating the item the first time.",
"c": [],
"b": [
[
0,
"SmoothNoiseUI.add_selected"
],
[
0,
"SmoothNoiseUI._analyze.go"
],
[
0,
"SmoothNoiseUI._strength_moved"
]
]
},
{
"q": "SmoothNoiseUI.add_selected",
"k": "def",
"s": 1197,
"e": 1214,
"doc": "",
"n": "Adds the selected transforms that are not in the table yet, with the current Manual strength. The name cell is made read-only. The old analysis is dropped.",
"c": [
[
0,
"SmoothNoiseUI._rows"
],
[
0,
"SmoothNoiseUI._set_cell"
],
[
0,
"SmoothNoiseUI._say"
]
],
"b": [
[
0,
"SmoothNoiseUI._connect"
]
]
},
{
"q": "SmoothNoiseUI.remove_rows",
"k": "def",
"s": 1216,
"e": 1219,
"doc": "",
"n": "Removes the selected rows, bottom to top so the indexes stay valid.",
"c": [],
"b": [
[
0,
"SmoothNoiseUI._connect"
]
]
},
{
"q": "SmoothNoiseUI.select_controls",
"k": "def",
"s": 1221,
"e": 1224,
"doc": "",
"n": "Selects the table's controls in Maya.",
"c": [
[
0,
"SmoothNoiseUI._rows"
]
],
"b": [
[
0,
"SmoothNoiseUI._connect"
]
]
},
{
"q": "SmoothNoiseUI.from_highlight",
"k": "def",
"s": 1226,
"e": 1234,
"doc": "",
"n": "Uses the range highlighted on the time slider (shift-drag). The end of that range is exclusive, hence the `- 1`.",
"c": [
[
0,
"SmoothNoiseUI._say"
]
],
"b": [
[
0,
"SmoothNoiseUI._connect"
]
]
},
{
"q": "SmoothNoiseUI.refresh_layers",
"k": "def",
"s": 1236,
"e": 1246,
"doc": "",
"n": "Refills the layer dropdown (\"New layer...\" plus the scene layers, marking the tool's own), keeping the current choice, with signals blocked while filling.",
"c": [
[
0,
"is_tool_layer"
],
[
0,
"scene_layers"
],
[
0,
"SmoothNoiseUI._update_enabled"
]
],
"b": [
[
0,
"SmoothNoiseUI.__init__"
],
[
0,
"SmoothNoiseUI._connect"
],
[
0,
"SmoothNoiseUI._apply"
]
]
},
{
"q": "SmoothNoiseUI.get_cfg",
"k": "def",
"s": 1249,
"e": 1264,
"doc": "",
"n": "Reads every widget into a settings dict.",
"c": [],
"b": [
[
0,
"SmoothNoiseUI._save"
],
[
0,
"SmoothNoiseUI._analyze"
],
[
0,
"SmoothNoiseUI._apply"
]
]
},
{
"q": "SmoothNoiseUI.set_cfg",
"k": "def",
"s": 1266,
"e": 1287,
"doc": "",
"n": "Fills the widgets from a settings dict over `DEFAULTS`. The strength slider is set with signals blocked so loading does not apply anything.",
"c": [],
"b": [
[
0,
"SmoothNoiseUI.__init__"
]
]
},
{
"q": "SmoothNoiseUI._load",
"k": "def",
"s": 1289,
"e": 1295,
"doc": "",
"n": "Reads the saved settings (JSON in an optionVar), or `{}`.",
"c": [],
"b": [
[
0,
"SmoothNoiseUI.__init__"
]
]
},
{
"q": "SmoothNoiseUI._save",
"k": "def",
"s": 1297,
"e": 1298,
"doc": "",
"n": "Saves the settings.",
"c": [
[
0,
"SmoothNoiseUI.get_cfg"
]
],
"b": [
[
0,
"SmoothNoiseUI._analyze"
],
[
0,
"SmoothNoiseUI._apply"
],
[
0,
"SmoothNoiseUI.closeEvent"
]
]
},
{
"q": "SmoothNoiseUI._analysis_key",
"k": "def",
"s": 1300,
"e": 1305,
"doc": "What an analysis depends on: if any of it changes, it's stale.",
"n": "A text fingerprint of everything an analysis depends on (range, fade, signals, sensitivity, thresholds, layer, timeline range, controls). If it changed, the stored analysis is stale.",
"c": [
[
0,
"SmoothNoiseUI._rows"
]
],
"b": [
[
0,
"SmoothNoiseUI._analyze.go"
],
[
0,
"SmoothNoiseUI._apply"
]
]
},
{
"q": "SmoothNoiseUI._guard",
"k": "def",
"s": 1308,
"e": 1317,
"doc": "",
"n": "Runs an action and handles errors in one place, like `_run` in the other tools.",
"c": [
[
0,
"SmoothNoiseUI._say"
],
[
0,
"SmoothNoiseError"
]
],
"b": [
[
0,
"SmoothNoiseUI._analyze"
],
[
0,
"SmoothNoiseUI._apply"
]
]
},
{
"q": "SmoothNoiseUI._analyze",
"k": "def",
"s": 1319,
"e": 1335,
"doc": "",
"n": "Runs Auto analysis and fills the table.",
"c": [
[
0,
"SmoothNoiseUI.get_cfg"
],
[
0,
"SmoothNoiseUI._save"
],
[
0,
"SmoothNoiseUI._analyze.go"
],
[
0,
"SmoothNoiseUI._guard"
]
],
"b": [
[
0,
"SmoothNoiseUI._connect"
],
[
0,
"SmoothNoiseUI._apply"
]
]
},
{
"q": "SmoothNoiseUI._analyze.go",
"k": "def",
"s": 1323,
"e": 1334,
"doc": "",
"n": "Calls `analyze`, writes each strength into the table, and stores the result with its fingerprint.",
"c": [
[
0,
"SmoothNoiseUI._rows"
],
[
0,
"analyze"
],
[
0,
"SmoothNoiseUI._say"
],
[
0,
"SmoothNoiseUI._set_cell"
],
[
0,
"SmoothNoiseUI._analysis_key"
]
],
"b": [
[
0,
"SmoothNoiseUI._analyze"
]
]
},
{
"q": "SmoothNoiseUI._strength_moved",
"k": "def",
"s": 1337,
"e": 1342,
"doc": "",
"n": "Manual slider moving: update the label and every ticked cell.",
"c": [
[
0,
"SmoothNoiseUI._set_cell"
]
],
"b": [
[
0,
"SmoothNoiseUI._connect"
]
]
},
{
"q": "SmoothNoiseUI._strength_released",
"k": "def",
"s": 1344,
"e": 1346,
"doc": "",
"n": "Manual slider released: apply in Manual mode.",
"c": [
[
0,
"SmoothNoiseUI._apply"
]
],
"b": [
[
0,
"SmoothNoiseUI._connect"
]
]
},
{
"q": "SmoothNoiseUI._apply",
"k": "def",
"s": 1348,
"e": 1372,
"doc": "",
"n": "Apply. In Auto, it reuses the analysis only if its fingerprint still matches; otherwise it analyzes again first. Then it runs `apply` with or without masks, refreshes the layer list and resets the Mute button.",
"c": [
[
0,
"SmoothNoiseUI.get_cfg"
],
[
0,
"SmoothNoiseUI._save"
],
[
0,
"SmoothNoiseUI._analyze"
],
[
0,
"SmoothNoiseUI._analysis_key"
],
[
0,
"SmoothNoiseUI._apply.go"
],
[
0,
"SmoothNoiseUI._guard"
],
[
0,
"SmoothNoiseUI.refresh_layers"
]
],
"b": [
[
0,
"SmoothNoiseUI._connect"
],
[
0,
"SmoothNoiseUI._strength_released"
]
]
},
{
"q": "SmoothNoiseUI._apply.go",
"k": "def",
"s": 1362,
"e": 1366,
"doc": "",
"n": "Calls `apply` and shows the report.",
"c": [
[
0,
"SmoothNoiseUI._strengths"
],
[
0,
"SmoothNoiseUI._rows"
],
[
0,
"apply"
],
[
0,
"SmoothNoiseUI._say"
]
],
"b": [
[
0,
"SmoothNoiseUI._apply"
]
]
},
{
"q": "SmoothNoiseUI._mute",
"k": "def",
"s": 1374,
"e": 1384,
"doc": "",
"n": "Mutes or unmutes the layer to compare with and without the fix.",
"c": [
[
0,
"SmoothNoiseUI._say"
]
],
"b": [
[
0,
"SmoothNoiseUI._connect"
]
]
},
{
"q": "SmoothNoiseUI.closeEvent",
"k": "def",
"s": 1386,
"e": 1391,
"doc": "",
"n": "Saves the settings when the window closes.",
"c": [
[
0,
"SmoothNoiseUI._save"
],
[
0,
"SmoothNoiseUI"
]
],
"b": []
},
{
"q": "show",
"k": "def",
"s": 1397,
"e": 1407,
"doc": "",
"n": "Entry point: closes the previous window, opens a new one parented to Maya, keeps a global reference.",
"c": [
[
0,
"_maya_main_window"
],
[
0,
"SmoothNoiseUI"
]
],
"b": []
}
],
"lines": {
"60": "A cutoff is \"how fast a wave can be and still survive\", in cycles per frame. 0.5 is the fastest possible (alternating every frame).",
"62": "1 / 0.15 ≈ 7 frames: anything that wobbles faster than that counts as jitter.",
"98": "Bilinear transform \"pre-warping\": maps the digital cutoff to the analog filter design.",
"99": "√2 is what makes a 2nd order filter a Butterworth (maximally flat).",
"106": "Pretend the signal was already at its first value forever, so the filter does not ramp up from 0.",
"109": "The filter equation: weighted current and past inputs minus weighted past outputs.",
"121": "How many frames to add at each end: about two periods of the cutoff, enough for the filter to settle.",
"122": "Odd reflection: mirror the start around the first value (`2*x0 - x[i]`). A straight line continues as the same straight line, so the ends stay exact.",
"126": "Reverse, filter again, reverse back: the backward pass that cancels the delay.",
"135": "Log scale: at s=0 the cutoff is FC_MAX, at s=1 it is FC_MIN, and each step multiplies by the same factor.",
"173": "Negative dot product = opposite side; flipping makes it the same rotation on the same side.",
"193": "The angle between two unit quaternions is `2 * acos(|dot|)`. `min(1.0, ...)` guards against rounding above 1.",
"200": "Filter x, y, z and w as four separate curves.",
"201": "`zip(*comps)` puts the four filtered lists back together per frame; normalizing makes each a valid rotation again.",
"221": "Gap since the previous run is small enough: extend that run instead of starting a new one.",
"234": "Distance in frames to the nearest range end.",
"256": "Even full strength cannot reach the goal: no point searching.",
"260": "Bisection: test the middle and keep the half that still contains the answer. 14 steps gives a precision of about 1/16000.",
"290": "Goal: a quarter of the measured jitter, but never asking for less than the threshold (that would over-smooth light noise).",
"318": "Blend original `a` toward smoothed `b` by the mask weight `w` (0 = untouched).",
"330": "Sensitivity 50 → 10⁰ = 1, 100 → 10⁻¹ = 0.1 (thresholds 10 times smaller), 0 → 10.",
"356": "`MDGContextGuard` only exists in newer Maya versions; `getattr` with a default avoids an error on older ones.",
"365": "`worldMatrix` is an array with one matrix per instance; this picks the one for this DAG path.",
"405": "Stops viewport redraws while the timeline is scrubbed: a big speed-up.",
"420": "Deleting the guard ends the \"evaluate at time t\" scope.",
"432": "The fast read must match the slow, trusted read before it is used.",
"503": "What feeds this channel, skipping unit conversion nodes in between.",
"509": "Animation layers connect through `animBlendNode...` nodes.",
"565": "Running again with the same new-layer name reuses that layer instead of making smoothNoise1, smoothNoise2...",
"605": "One API call adds every key to the temporary curve, much faster than one `setKeyframe` per frame.",
"609": "API edits are not undoable; copying from the temporary curve and pasting with `cmds` makes the write one undoable step.",
"612": "Deletes the temporary curve through an `MDGModifier` (the API way to change the graph).",
"621": "Any surprise sends the code to the safe per-key fallback in the `except` below.",
"640": "A layer at weight 0 would mean dividing by zero; treat it as 1.",
"662": "Layer value needed: current layer value + (wanted - what we get now) / weight. Works for additive and override layers because, either way, the result changes by `weight` for each unit of layer change.",
"716": "Maya applies rotate axis, then rotation, then joint orient (row vectors, so read left to right).",
"729": "World matrix times inverse parent matrix = local matrix.",
"733": "Keep only the rotation part of the local matrix (scale removed by going through a quaternion).",
"734": "Remove rotate axis and joint orient, then split what is left into Euler angles in the control's rotate order.",
"736": "Pick the angles closest to the previous frame: no 360 degree flips.",
"747": "Translate = where the pivot must be minus where it lands with zero translate.",
"757": "Depth among the selected controls: how many of its parents are also being smoothed.",
"785": "Updating the progress window is slow; doing it every 10 steps keeps the tool fast.",
"814": "The world orientation as a quaternion, ready for smoothing.",
"916": "Same world matrix but with the smoothed orientation.",
"919": "Then shift it so the rotate pivot lands on the smoothed position.",
"923": "Everything that changes the scene from here on is one undo step.",
"931": "Replace mode: clear the previous fix in the range first. Only on layers made by this tool.",
"934": "Parents first: each level is read after the previous level was written, so children are solved against corrected parents.",
"976": "Cancel: close the chunk and undo it, so the scene is exactly as before.",
"1208": "Bitwise \"and not\": keep every flag except editable, so the name cell cannot be typed into.",
"1217": "Remove from the bottom up, so removing a row does not shift the indexes of rows still to remove.",
"1232": "The highlighted range's end is exclusive, so the last frame is one less.",
"1305": "A JSON string is an easy way to compare all these values at once."
}
},
{
"path": "tests/test_smooth_noise.py",
"lang": "py",
"note": "Tests of the math outside Maya: `python3 tests/test_smooth_noise.py`. They use made-up motion with known noise, so they can check that the right part is removed.",
"code": "# -*- coding: utf-8 -*-\n\"\"\"Maths of smooth_noise.py, outside of Maya:  python3 tests/test_smooth_noise.py\"\"\"\nfrom __future__ import division, print_function\n\nimport math\nimport os\nimport random\nimport sys\nimport unittest\n\nsys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))\nimport smooth_noise as sn  # noqa: E402\n\n\ndef motion(n=200):\n    \"\"\"Clean mocap-like motion: slow swings in the 40-120 frame range.\"\"\"\n    return [10.0 * math.sin(2 * math.pi * i / 120.0) + 4.0 * math.sin(2 * math.pi * i / 45.0)\n            for i in range(n)]\n\n\ndef noise(n, amount, frames=None, seed=3):\n    rnd = random.Random(seed)\n    return [rnd.gauss(0.0, amount) if (frames is None or i in frames) else 0.0\n            for i in range(n)]\n\n\ndef jitter_noise(n, amount, frames=None, seed=3):\n    \"\"\"Mocap-style jitter: frame-to-frame (high frequency), not slow wander.\"\"\"\n    w = noise(n + 1, amount, None, seed)\n    j = [(w[i + 1] - w[i]) / math.sqrt(2.0) for i in range(n)]\n    return [v if (frames is None or i in frames) else 0.0 for i, v in enumerate(j)]\n\n\ndef rms(v):\n    return math.sqrt(sum(x * x for x in v) / len(v))\n\n\nclass Filter(unittest.TestCase):\n\n    def test_no_phase_shift(self):\n        x = [math.exp(-((i - 60) / 8.0) ** 2) for i in range(121)]\n        y = sn.filtfilt(x, 0.05)\n        self.assertEqual(y.index(max(y)), 60)\n\n    def test_keeps_slow_motion(self):\n        x = [math.sin(2 * math.pi * i / 100.0) for i in range(400)]     # 0.01 cycles/frame\n        y = sn.filtfilt(x, 0.05)\n        for a, b in zip(x[50:-50], y[50:-50]):\n            self.assertAlmostEqual(a, b, delta=0.02)\n\n    def test_removes_jitter(self):\n        j = jitter_noise(400, 1.0)\n        self.assertLess(rms(sn.filtfilt(j, 0.05)[20:-20]), 0.1 * rms(j))\n        # white noise also wanders slowly: that part can't be told from motion\n        w = noise(400, 1.0)\n        self.assertLess(rms(sn.filtfilt(w, 0.05)[20:-20]), 0.35 * rms(w))\n\n    def test_ends_do_not_drift(self):\n        x = [0.5 * i for i in range(100)]          # a ramp: odd reflection keeps it exact\n        y = sn.filtfilt(x, 0.02)\n        # tiny drift only (and the mask is 0 on the range ends anyway)\n        self.assertAlmostEqual(y[0], x[0], delta=1e-4 * x[-1])\n        self.assertAlmostEqual(y[-1], x[-1], delta=1e-4 * x[-1])\n\n    def test_constant_stays_constant(self):\n        self.assertEqual([round(v, 9) for v in sn.filtfilt([3.0] * 50, 0.05)], [3.0] * 50)\n\n    def test_short_or_off(self):\n        self.assertEqual(sn.filtfilt([1.0, 2.0, 3.0], 0.05), [1.0, 2.0, 3.0])\n        self.assertEqual(sn.smooth_values([1.0, 5.0, 2.0, 4.0, 1.0], 0.0), [1.0, 5.0, 2.0, 4.0, 1.0])\n\n    def test_strength_scale(self):\n        cut = [sn.strength_to_cutoff(s / 10.0) for s in range(1, 11)]\n        self.assertEqual(cut, sorted(cut, reverse=True))\n        self.assertIsNone(sn.strength_to_cutoff(0.0))\n        self.assertAlmostEqual(sn.strength_to_cutoff(1.0), sn.FC_MIN)\n\n\nclass Detect(unittest.TestCase):\n\n    def test_finds_the_noisy_stretch(self):\n        x = [a + b for a, b in zip(motion(), noise(200, 0.5, set(range(40, 71))))]\n        s, mask, runs, _ = sn.analyze_values(x, 0.1, 4)\n        self.assertEqual(len(runs), 1)\n        a, b = runs[0]\n        self.assertTrue(34 <= a <= 42 and 68 <= b <= 76, runs)\n        self.assertGreater(s, 0.0)\n        self.assertEqual(mask[100], 0.0)       # clean part untouched\n        self.assertEqual(mask[55], 1.0)\n\n    def test_clean_signal_is_left_alone(self):\n        s, mask, runs, _ = sn.analyze_values(motion(), 0.1, 4)\n        self.assertEqual((s, runs), (0.0, []))\n        self.assertEqual(set(mask), {0.0})\n\n    def test_range_cut_mid_stretch(self):\n        # range 1-50 on a stretch that's noisy from 40 to 70: only 40-50 found, 0 at the end\n        x = [a + b for a, b in zip(motion(), noise(200, 0.5, set(range(40, 71))))][:51]\n        _, mask, runs, _ = sn.analyze_values(x, 0.1, 4)\n        self.assertEqual(len(runs), 1)\n        self.assertTrue(34 <= runs[0][0] <= 42)\n        self.assertEqual(mask[-1], 0.0)\n        self.assertGreater(mask[45], 0.9)\n\n    def test_auto_strength_reaches_the_target_and_scales_with_noise(self):\n        clean = motion()\n        heavy = [a + b for a, b in zip(clean, noise(200, 0.8))]\n        light = [a + b for a, b in zip(clean, noise(200, 0.15))]\n        sh, _, runs, _ = sn.analyze_values(heavy, 0.05, 4)\n        sl, _, _, _ = sn.analyze_values(light, 0.05, 4)\n        self.assertGreater(sh, 0.0)\n        inside = [i for a, b in runs for i in range(a, b + 1)]\n        before = rms([sn.jitter(heavy)[i] for i in inside])\n        after = rms([sn.jitter(sn.smooth_values(heavy, sh))[i] for i in inside])\n        self.assertLessEqual(after, max(sn.JITTER_TARGET * before, 0.05) * 1.001)\n        self.assertLess(sl, sh)                 # lighter noise: gentler smoothing\n\n    def test_sensitivity(self):\n        self.assertAlmostEqual(sn.threshold_scale(50), 1.0)\n        self.assertLess(sn.threshold_scale(100), sn.threshold_scale(0))\n\n\nclass Masks(unittest.TestCase):\n\n    def test_full_mask_is_zero_at_range_ends_and_eases(self):\n        m = sn.full_mask(30, 5)\n        self.assertEqual((m[0], m[-1]), (0.0, 0.0))\n        self.assertEqual(m[:6], sorted(m[:6]))\n        self.assertEqual(m[10], 1.0)\n        self.assertEqual(sn.full_mask(5, 0), [0.0, 1.0, 1.0, 1.0, 0.0])\n\n    def test_runs_join_and_widen(self):\n        flags = [False] * 30\n        for i in (5, 6, 9, 20):\n            flags[i] = True\n        self.assertEqual(sn.find_runs(flags, join=2, widen=1), [(4, 10), (19, 21)])\n\n    def test_runs_mask_fades(self):\n        m = sn.runs_mask(40, [(15, 20)], 4)\n        self.assertEqual(m[17], 1.0)\n        self.assertEqual(m[5], 0.0)\n        self.assertEqual(m[10:16], sorted(m[10:16]))\n        self.assertEqual(m[20:26], sorted(m[20:26], reverse=True))\n\n\nclass Quaternions(unittest.TestCase):\n\n    def axis_angle(self, axis, deg):\n        h = math.radians(deg) / 2.0\n        s = math.sin(h)\n        return (axis[0] * s, axis[1] * s, axis[2] * s, math.cos(h))\n\n    def test_alignment_removes_sign_flips(self):\n        q = [self.axis_angle((0, 1, 0), d) for d in range(0, 100, 10)]\n        flipped = [tuple(-v for v in qq) if i % 2 else qq for i, qq in enumerate(q)]\n        aligned = sn.q_align(flipped)\n        for a, b in zip(aligned, aligned[1:]):\n            self.assertGreater(sn.q_dot(a, b), 0.0)\n\n    def test_smoothing_keeps_unit_length_and_reduces_jitter(self):\n        rnd = random.Random(5)\n        qs = []\n        for i in range(150):\n            base = 40.0 * math.sin(2 * math.pi * i / 100.0)\n            qs.append(sn.q_normalize(tuple(v + rnd.gauss(0, 0.01)\n                                           for v in self.axis_angle((0, 0, 1), base))))\n        sm = sn.smooth_quats(qs, sn.strength_to_cutoff(0.6))\n        for q in sm:\n            self.assertAlmostEqual(math.sqrt(sn.q_dot(q, q)), 1.0, places=9)\n        self.assertLess(rms(sn.rot_jitter(sm)[10:-10]), 0.3 * rms(sn.rot_jitter(qs)[10:-10]))\n\n    def test_slerp_ends(self):\n        a, b = self.axis_angle((1, 0, 0), 10), self.axis_angle((1, 0, 0), 70)\n        for x, y in zip(sn.q_slerp(a, b, 0.0), a):\n            self.assertAlmostEqual(x, y)\n        for x, y in zip(sn.q_slerp(a, b, 1.0), b):\n            self.assertAlmostEqual(x, y)\n        self.assertAlmostEqual(sn.q_angle(a, sn.q_slerp(a, b, 0.5)), 30.0, places=6)\n\n    def test_auto_rotation(self):\n        rnd = random.Random(8)\n        qs = [sn.q_normalize(tuple(v + (rnd.gauss(0, 0.02) if 60 <= i <= 90 else 0.0)\n                                   for v in self.axis_angle((0, 1, 0), 30 * math.sin(i / 20.0))))\n              for i in range(160)]\n        s, mask, runs, _ = sn.analyze_quats(qs, 0.3, 4)\n        self.assertEqual(len(runs), 1)\n        self.assertTrue(52 <= runs[0][0] <= 62 and 88 <= runs[0][1] <= 98, runs)\n        self.assertEqual(mask[20], 0.0)\n\n\nclass EndToEnd(unittest.TestCase):\n\n    def test_noisy_path_smoothed_where_masked_only(self):\n        n = 200\n        clean = [(a, 0.5 * a, -a) for a in motion(n)]\n        noisy_frames = set(range(80, 120))\n        nz = [jitter_noise(n, 0.6, noisy_frames, seed=s) for s in (1, 2, 3)]\n        noisy = [tuple(c[i] + nz[i][k] for i in range(3)) for k, c in enumerate(clean)]\n        axes = [[p[i] for p in noisy] for i in range(3)]\n        found = [sn.analyze_values(a, 0.1, 4) for a in axes]\n        out = sn.blend_positions(noisy, [f[0] for f in found], [f[1] for f in found])\n        for k in range(n):\n            if all(f[1][k] == 0.0 for f in found):\n                self.assertEqual(out[k], noisy[k])           # outside the mask: identical\n        err_before = rms([noisy[k][0] - clean[k][0] for k in range(85, 115)])\n        err_after = rms([out[k][0] - clean[k][0] for k in range(85, 115)])\n        self.assertLess(err_after, 0.4 * err_before)        # closer to the real motion\n\n\nif __name__ == '__main__':\n    unittest.main()",
"aliases": {
"division": "__future__.division",
"print_function": "__future__.print_function",
"math": "math",
"os": "os",
"random": "random",
"sys": "sys",
"unittest": "unittest"
},
"outline": [
{
"q": "motion",
"k": "def",
"s": 15,
"e": 18,
"doc": "Clean mocap-like motion: slow swings in the 40-120 frame range.",
"n": "Clean, slow motion like mocap: two sine waves with long periods (45 and 120 frames).",
"c": [],
"b": [
[
1,
"Detect.test_finds_the_noisy_stretch"
],
[
1,
"Detect.test_clean_signal_is_left_alone"
],
[
1,
"Detect.test_range_cut_mid_stretch"
],
[
1,
"Detect.test_auto_strength_reaches_the_target_and_scales_with_noise"
],
[
1,
"EndToEnd.test_noisy_path_smoothed_where_masked_only"
]
]
},
{
"q": "noise",
"k": "def",
"s": 21,
"e": 24,
"doc": "",
"n": "Random noise with a fixed seed (repeatable), optionally only on some frames.",
"c": [],
"b": [
[
1,
"jitter_noise"
],
[
1,
"Filter.test_removes_jitter"
],
[
1,
"Detect.test_finds_the_noisy_stretch"
],
[
1,
"Detect.test_range_cut_mid_stretch"
],
[
1,
"Detect.test_auto_strength_reaches_the_target_and_scales_with_noise"
]
]
},
{
"q": "jitter_noise",
"k": "def",
"s": 27,
"e": 31,
"doc": "Mocap-style jitter: frame-to-frame (high frequency), not slow wander.",
"n": "Frame-to-frame jitter: the difference of consecutive random values, which is fast noise like real mocap jitter.",
"c": [
[
1,
"noise"
]
],
"b": [
[
1,
"Filter.test_removes_jitter"
],
[
1,
"EndToEnd.test_noisy_path_smoothed_where_masked_only"
]
]
},
{
"q": "rms",
"k": "def",
"s": 34,
"e": 35,
"doc": "",
"n": "Root mean square, the size of a signal.",
"c": [],
"b": [
[
1,
"Filter.test_removes_jitter"
],
[
1,
"Detect.test_auto_strength_reaches_the_target_and_scales_with_noise"
],
[
1,
"Quaternions.test_smoothing_keeps_unit_length_and_reduces_jitter"
],
[
1,
"EndToEnd.test_noisy_path_smoothed_where_masked_only"
]
]
},
{
"q": "Filter",
"k": "class",
"s": 38,
"e": 76,
"doc": "",
"n": "Tests for `filtfilt` and the strength scale.",
"c": [],
"b": []
},
{
"q": "Filter.test_no_phase_shift",
"k": "def",
"s": 40,
"e": 43,
"doc": "",
"n": "A bump peaking at frame 60 still peaks at frame 60 after filtering: zero phase.",
"c": [
[
0,
"filtfilt"
]
],
"b": []
},
{
"q": "Filter.test_keeps_slow_motion",
"k": "def",
"s": 45,
"e": 49,
"doc": "",
"n": "A slow wave passes through almost unchanged.",
"c": [
[
0,
"filtfilt"
]
],
"b": []
},
{
"q": "Filter.test_removes_jitter",
"k": "def",
"s": 51,
"e": 56,
"doc": "",
"n": "Jitter is cut to under 10%. White noise is only cut to 35%, because its slow part cannot be told from real motion (and the comment says so).",
"c": [
[
1,
"jitter_noise"
],
[
1,
"rms"
],
[
0,
"filtfilt"
],
[
1,
"noise"
]
],
"b": []
},
{
"q": "Filter.test_ends_do_not_drift",
"k": "def",
"s": 58,
"e": 63,
"doc": "",
"n": "A straight ramp keeps its first and last values thanks to the odd reflection.",
"c": [
[
0,
"filtfilt"
]
],
"b": []
},
{
"q": "Filter.test_constant_stays_constant",
"k": "def",
"s": 65,
"e": 66,
"doc": "",
"n": "A constant stays exactly constant.",
"c": [
[
0,
"filtfilt"
]
],
"b": []
},
{
"q": "Filter.test_short_or_off",
"k": "def",
"s": 68,
"e": 70,
"doc": "",
"n": "Too-short input, or strength 0, returns the input unchanged.",
"c": [
[
0,
"filtfilt"
],
[
0,
"smooth_values"
]
],
"b": []
},
{
"q": "Filter.test_strength_scale",
"k": "def",
"s": 72,
"e": 76,
"doc": "",
"n": "Higher strength always means a lower cutoff; 0 means off; 1 means the minimum cutoff.",
"c": [
[
0,
"strength_to_cutoff"
]
],
"b": []
},
{
"q": "Detect",
"k": "class",
"s": 79,
"e": 120,
"doc": "",
"n": "Tests for the Auto analysis.",
"c": [],
"b": []
},
{
"q": "Detect.test_finds_the_noisy_stretch",
"k": "def",
"s": 81,
"e": 89,
"doc": "",
"n": "Noise added only on frames 40-70 is found as one stretch around there; clean frames get mask 0, noisy frames mask 1.",
"c": [
[
1,
"noise"
],
[
1,
"motion"
],
[
0,
"analyze_values"
]
],
"b": []
},
{
"q": "Detect.test_clean_signal_is_left_alone",
"k": "def",
"s": 91,
"e": 94,
"doc": "",
"n": "Clean motion: strength 0, no stretches, mask all zeros.",
"c": [
[
1,
"motion"
],
[
0,
"analyze_values"
]
],
"b": []
},
{
"q": "Detect.test_range_cut_mid_stretch",
"k": "def",
"s": 96,
"e": 103,
"doc": "",
"n": "When the range ends in the middle of a noisy stretch, the mask still goes to 0 on the last frame.",
"c": [
[
1,
"noise"
],
[
1,
"motion"
],
[
0,
"analyze_values"
]
],
"b": []
},
{
"q": "Detect.test_auto_strength_reaches_the_target_and_scales_with_noise",
"k": "def",
"s": 105,
"e": 116,
"doc": "",
"n": "The chosen strength brings jitter down to the target, and lighter noise gets a lower strength.",
"c": [
[
1,
"motion"
],
[
1,
"noise"
],
[
0,
"analyze_values"
],
[
0,
"jitter"
],
[
1,
"rms"
],
[
0,
"smooth_values"
]
],
"b": []
},
{
"q": "Detect.test_sensitivity",
"k": "def",
"s": 118,
"e": 120,
"doc": "",
"n": "Sensitivity 50 means scale 1, and higher sensitivity means smaller thresholds.",
"c": [
[
0,
"threshold_scale"
]
],
"b": []
},
{
"q": "Masks",
"k": "class",
"s": 123,
"e": 143,
"doc": "",
"n": "Tests for the masks and run finding.",
"c": [],
"b": []
},
{
"q": "Masks.test_full_mask_is_zero_at_range_ends_and_eases",
"k": "def",
"s": 125,
"e": 130,
"doc": "",
"n": "0 at both ends, rising smoothly, 1 in the middle.",
"c": [
[
0,
"full_mask"
]
],
"b": []
},
{
"q": "Masks.test_runs_join_and_widen",
"k": "def",
"s": 132,
"e": 136,
"doc": "",
"n": "Close flags join into one run and runs are widened.",
"c": [
[
0,
"find_runs"
]
],
"b": []
},
{
"q": "Masks.test_runs_mask_fades",
"k": "def",
"s": 138,
"e": 143,
"doc": "",
"n": "The mask is 1 inside the run, 0 far from it, and rises and falls smoothly around it.",
"c": [
[
0,
"runs_mask"
]
],
"b": []
},
{
"q": "Quaternions",
"k": "class",
"s": 146,
"e": 188,
"doc": "",
"n": "Tests for the quaternion helpers.",
"c": [],
"b": []
},
{
"q": "Quaternions.axis_angle",
"k": "def",
"s": 148,
"e": 151,
"doc": "",
"n": "Builds a quaternion `(x, y, z, w)` from an axis and an angle.",
"c": [],
"b": [
[
1,
"Quaternions.test_alignment_removes_sign_flips"
],
[
1,
"Quaternions.test_smoothing_keeps_unit_length_and_reduces_jitter"
],
[
1,
"Quaternions.test_slerp_ends"
],
[
1,
"Quaternions.test_auto_rotation"
]
]
},
{
"q": "Quaternions.test_alignment_removes_sign_flips",
"k": "def",
"s": 153,
"e": 158,
"doc": "",
"n": "Every other quaternion negated: after `q_align`, all neighbors agree.",
"c": [
[
1,
"Quaternions.axis_angle"
],
[
0,
"q_align"
],
[
0,
"q_dot"
]
],
"b": []
},
{
"q": "Quaternions.test_smoothing_keeps_unit_length_and_reduces_jitter",
"k": "def",
"s": 160,
"e": 170,
"doc": "",
"n": "Smoothed quaternions are still length 1 and the angular jitter drops a lot.",
"c": [
[
1,
"Quaternions.axis_angle"
],
[
0,
"q_normalize"
],
[
0,
"strength_to_cutoff"
],
[
0,
"smooth_quats"
],
[
0,
"q_dot"
],
[
0,
"rot_jitter"
],
[
1,
"rms"
]
],
"b": []
},
{
"q": "Quaternions.test_slerp_ends",
"k": "def",
"s": 172,
"e": 178,
"doc": "",
"n": "`q_slerp` gives `a` at 0, `b` at 1 and exactly half the angle at 0.5.",
"c": [
[
1,
"Quaternions.axis_angle"
],
[
0,
"q_slerp"
],
[
0,
"q_angle"
]
],
"b": []
},
{
"q": "Quaternions.test_auto_rotation",
"k": "def",
"s": 180,
"e": 188,
"doc": "",
"n": "Rotation noise added on frames 60-90 is found there and nowhere else.",
"c": [
[
1,
"Quaternions.axis_angle"
],
[
0,
"q_normalize"
],
[
0,
"analyze_quats"
]
],
"b": []
},
{
"q": "EndToEnd",
"k": "class",
"s": 191,
"e": 207,
"doc": "",
"n": "Analysis and blending together on a 3D path.",
"c": [],
"b": []
},
{
"q": "EndToEnd.test_noisy_path_smoothed_where_masked_only",
"k": "def",
"s": 193,
"e": 207,
"doc": "",
"n": "Outside the mask the path is identical; inside, the result is much closer to the clean motion than the noisy input was.",
"c": [
[
1,
"motion"
],
[
1,
"jitter_noise"
],
[
0,
"analyze_values"
],
[
0,
"blend_positions"
],
[
1,
"rms"
]
],
"b": []
}
],
"lines": {}
}
]
});
