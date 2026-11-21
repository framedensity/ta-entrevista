TOOLS.add({
"id": "flowtrail",
"order": 4,
"title": "FlowTrail",
"tagline": "Fast, editable motion trails: see arcs and spacing, drag the trail to fix the arc, slide keys to retime.",
"overview": [
"Maya's built-in motion trail is slow and hard to edit with. FlowTrail draws trails that stay fast on heavy rigs, show the **arc**, the **spacing** (one dot per frame) and the **speed**, and that you can **edit directly in the viewport**.",
"### What you can do",
"- **See**: path line, frame dots, keys (yellow on the layer you edit, grey on other layers), speed colors, spacing ticks, frame numbers, the live offset of an unkeyed pose, and a ghost of the motion with one layer muted.\n- **Edit**: drag a point to fix the arc (in-betweens become keys), ctrl+drag a key to retime it along the trail, shift+click to select keys, favor/breakdown, nudge, tangents.\n- **Reshape arcs**: Pull with falloff, Sketch the path by hand, Smooth Brush, or smooth the whole path with a slider. The first and last frames of an edit never move, so loops stay loops.\n- **Spaces**: show the trail in world space, in the camera's view (essential with a moving shot camera), or relative to an object.",
"The README tab of the code has the full user guide."
],
"why": [
"### Why it is fast (the four ideas from `core.py`)",
"1. Positions are sampled once and **cached per frame**.\n2. When a curve changes, only the frames that change can affect are resampled: the tool compares a **snapshot** of the curve before and after and widens the range by two keys for tangents.\n3. Updates are **deferred** to when Maya is idle, merged into one, and never run during playback.\n4. Drawing is a **Viewport 2.0 plugin** that only uploads ready-made arrays.",
"### Plugin and Python kept apart",
"The plugin knows nothing about animation. It reads the trail id stored on its node and asks `registry.build_packet` for drawing data. `registry.py` is a tiny module that is never reloaded, so the plugin and the package always share the same objects.",
"### Scenes never depend on the tool",
"The viewport nodes are deleted before every save and recreated after, so a saved scene opens fine on a machine without FlowTrail.",
"### Every edit is layer aware",
"Edits go to the layer selected in the Layer Editor (or a chosen one). New curves on a layer are seeded with the right values (0 on additive layers) so the rest of the animation does not change, and the layer weight is divided out.",
"### Write, read back, correct",
"When a reshaped path is written as keys, the curve between keys never exactly matches what was asked. `apply_path` reads the real result back after each write and adds or adjusts keys where it is still off, up to four passes, using as few keys as the accuracy allows.",
"### Pure math is testable",
"All the path math (smoothing, strokes, pins, spacing, key reduction) lives in `reshape.py` with no Maya, tested by `test_reshape.py`. `test_tool_flow.py` even runs the real edit code against a fake Maya."
],
"flow": [
"### Startup",
"`flowtrail.show()` (`__init__.py`) → `load_plugin()` → `core.get_manager()` creates the one `Manager`, which installs its Maya callbacks → `ui.show()` opens the panel.",
"### Creating a trail",
"\"+ Trail Selected\" → `Manager.add` creates a `Trail` and its viewport node (`create_shape`) and registers it in `registry.TRAILS` → `process_now` scans the curves that can move it (`anim.collect_upstream`) and samples positions (`sampling.sample`) → the plugin draws it: `prepareForDraw` → `registry.build_packet` → `Manager.packet` → `draw.build` (cached) + `draw.dynamic`.",
"### When you edit animation anywhere in Maya",
"Maya's curve-edited callback → `_on_curves` marks the curves dirty → `schedule` → idle → `process_now`: snapshot diff → `invalidate` only the changed frames → `_fill` resamples them → viewports redraw.",
"### Dragging a point with the Edit Trail Tool",
"`edit_tool._press` picks the point → `_drag` → `_begin_move` prepares an `anim.TranslateEdit` (or `_begin_soft` for falloff) → each mouse move `_apply_move` converts the mouse position on the camera plane into a parent-space offset → `TranslateEdit.apply` → `process_now` updates the trail live → `_release` closes the undo chunk.",
"### Sketching or smoothing an arc",
"The stroke or slider produces new display-space points (`reshape.clean_stroke`, `smooth_path`, `pin_correct`, `respace`) → `Manager.apply_display_path` converts to world → `apply_path` writes them as keys through `anim.PathEdit`, reading back and correcting."
],
"review": [
"**Polling instead of events.** The UI checks the active tool every 0.4 s. A `scriptJob` on the `ToolChanged` event would update only when needed. The polling is cheap, though, and also refreshes the edit layer, which has no event.",
"**Node type id.** `0x0007F7A1` is in the range Autodesk reserves for in-house use. That is fine for a personal or studio tool; a tool distributed to other studios should use a registered id block to avoid clashing with someone else's plugin.",
"**Undo chunks from UI sliders.** The favor slider opens an undo chunk on press and closes it on release. If an error happens mid-drag the chunk can stay open; the edit tool avoids this with its `_safe` decorator, and the slider could use the same idea.",
"**What the fake tests cannot catch.** `test_tool_flow.py` replaces Maya with fakes and interpolates linearly, so wrong assumptions about real Maya API behavior (tangents, layers) only show up in a test run inside Maya, as its own docstring says."
],
"files": [
{
"path": "flowtrail/README.md",
"lang": "md",
"note": "User documentation: install, basics, how to read the trail, reshaping arcs, timing and layers.",
"code": "# FlowTrail: motion trails you can animate with (Maya 2020.4+)\n\nFlowTrail is a fast alternative to Maya's motion trail. It shows the arc, the\nspacing and the speed of a move. You fix the arc by dragging the trail and\nretime by sliding keys along it. It works with animation layers.\n\n## Install\n1. Drag `flowtrail/install.py` into a Maya viewport. This adds a **FlowTrail** button to the current shelf and opens the UI.\n2. Or run it manually, with the folder that *contains* `flowtrail` on `sys.path`:\n   ```python\n   import flowtrail; flowtrail.show()\n   ```\n\nThe viewport node is a Python VP2 plugin (`plugin/flowTrailNode.py`). It loads\nautomatically. Trail nodes are removed before every save and rebuilt after it,\nso **scenes never depend on the plugin**.\n\n## Basics\n| Do | How |\n|---|---|\n| Create trails | select controls, then **+ Trail Selected** |\n| Quick look | **Auto trail on selection**: trails follow your selection |\n| Fix an arc / spacing | **Edit Trail Tool**, then drag any point. Dragging an in-between creates a key there |\n| Retime | Edit tool: **Ctrl+drag a key** along the trail |\n| Select keys | Edit tool: **Shift+click** keys (cyan) |\n| Go to a frame | Edit tool: click a point. It also selects the control |\n| Favor / breakdown | Timing tab slider or buttons (0 = previous key, 100 = next key) |\n| Nudge timing | Timing tab: -2 / -1 / +1 / +2 |\n| Ease | Timing tab: tangent buttons |\n\nWith no trail keys selected, the Timing tools act on the **current frame**.\n\n## Reading the trail\n- **Dots** are one per frame. Wide gaps mean fast motion, tight gaps mean slow motion or an ease.\n- **Squares** are keys. Yellow keys are on the layer you're editing; grey keys are on other layers.\n- **White dot** is the current frame.\n- **Red dot + dashed line** means the control was moved but not keyed yet.\n- **Speed colors** go from blue (slow) to red (fast).\n- **Spacing ticks** draw a spacing-chart tick across the path at every frame.\n- **Dashed ghost** (Layers tab) shows the motion with a layer muted, so you can see what the layer changes.\n\n## Reshaping arcs (Arcs tab)\nMade with loops in mind: **the first and last frame of an edit never move**, and\nby default their tangents are locked, so the seam and anything outside the edit\nstay exactly as they were.\n\n| Do | How |\n|---|---|\n| Draw the path by hand | **Sketch**, then draw over the trail. The part between the start and end of your stroke follows it, cleaned up |\n| Redraw a whole loop | **Sketch**, starting and ending at the seam |\n| Pull a section | **Pull**, then drag a point. Nearby frames follow (**Pull falloff**). The cyan preview applies on release |\n| Smooth one spot | **Smooth Brush**, then paint over it |\n| Smooth everything | Drag the **Smooth** slider to preview, release to apply, or use Light / Medium / Strong |\n| Limit an edit | Shift+click two keys: only the frames between them change |\n| Fix the speed at the seam | **Make Loop Seamless** (the first and last key must have the same values) |\n\nWhat the options do:\n- **Spacing:** *Keep my spacing* (default) keeps each frame's share of the path, so your eases survive and only the shape changes. *Even spacing* evens it out. *Smooth spacing too* also smooths the speed.\n- **New keys:** *Adaptive* (default) adds only the keys needed to follow the new path, then reads the real result back and adds more where it's off. *Every frame* bakes the span. *None* only moves the keys you already have, so complex shapes won't be matched exactly.\n- **Accuracy:** how closely Adaptive follows the path; higher means more keys.\n- **Keep all keyed poses:** the keys stay put and only the in-betweens change.\n- **Lock tangents:** those tangents become Fixed. Turn it off if you'd rather have the ends follow the new shape.\n\nA sketch only moves frames across the camera's view: each frame keeps its depth.\nSketch from a camera that faces the arc. Reshaping edits **translate**, on the\nedit layer. On override layers, use one that's already keyed: a new curve there\nreplaces the animation below it. Additive layers are the safest choice.\n\n## Animation layers\nThe trail always shows the final result of all layers. Edits go to the\n**edit layer**. By default that's the layer selected in Maya's Layer Editor;\nyou can also pick one in the Layers tab. Moving a pose adds the offset to\nthat layer, scaled by the layer weight. Retiming moves keys on all layers by\ndefault, so the layers stay in sync.\n\n## Why it's fast\n- Positions are sampled once and cached.\n- When a key changes, only the frames it can affect are resampled: the edited key plus or minus two neighbouring keys. Curves are diffed to find that range.\n- Updates are coalesced and run at idle. Nothing is computed during playback.\n- Drawing is a VP2 draw override that uploads the cached arrays.\n- Evaluation uses a DG context, so the timeline doesn't move. Switch **Range > Evaluation > Timeline** for rigs that don't evaluate correctly in a DG context.\n- Use **Range > Around current frame** on long shots.\n\n## Hotkey commands (Python)\n```python\nimport flowtrail\nflowtrail.add_selected()\nflowtrail.remove_selected()\nflowtrail.toggle_edit_tool()\nflowtrail.toggle_visibility()\nflowtrail.toggle_auto()\nflowtrail.nudge(-1); flowtrail.nudge(1)\nflowtrail.favor(-0.33); flowtrail.favor(0.33)\nflowtrail.set_tool('sketch')    # or 'move', 'brush'\nflowtrail.smooth_arcs(0.55)     # 0..1\nflowtrail.make_loop_seamless()\nflowtrail.unload()          # before updating the files\n```\n\n## Notes / limits\n- Dragging the trail edits **translate**. For FK / rotate-only controls, use the trail to read arcs and spacing, and use retime, favor and tangents to edit.\n- Hidden trails: check **Show > Locators** in the viewport.\n- Changes that aren't keys, such as new constraints, parenting or rig switches, need **Refresh**.",
"aliases": {},
"outline": [],
"lines": {}
},
{
"path": "flowtrail/__init__.py",
"lang": "py",
"note": "The package entry point. Everything a user or a hotkey calls lives here: `show()`, `add_selected()`, `nudge()`, `favor()`... Each one is a thin wrapper that makes sure the plugin is loaded and forwards to the manager in `core.py`.",
"code": "# -*- coding: utf-8 -*-\n\"\"\"\nFlowTrail - fast, editable motion trails for animators (Maya 2020+).\n\n    import flowtrail\n    flowtrail.show()\n\nHotkey friendly commands:\n    flowtrail.add_selected()      flowtrail.remove_selected()\n    flowtrail.toggle_edit_tool()  flowtrail.toggle_visibility()\n    flowtrail.nudge(-1) / (1)     flowtrail.favor(-0.33) / (0.33)\n    flowtrail.toggle_auto()\n    flowtrail.set_tool('move' / 'sketch' / 'brush')\n    flowtrail.smooth_arcs(0.55)   flowtrail.make_loop_seamless()\n\"\"\"\nfrom __future__ import absolute_import, division, print_function\n\nimport os\n\nfrom maya import cmds\n\n__version__ = '1.0.0'\n\nROOT = os.path.dirname(os.path.abspath(__file__))\nPLUGIN_PATH = os.path.join(ROOT, 'plugin', 'flowTrailNode.py')\n\n\ndef load_plugin():\n    if not cmds.pluginInfo(PLUGIN_PATH, q=True, loaded=True):\n        cmds.loadPlugin(PLUGIN_PATH, quiet=True)\n\n\ndef manager():\n    load_plugin()\n    from . import core\n    return core.get_manager()\n\n\ndef show():\n    manager()\n    from . import ui\n    return ui.show()\n\n\ndef add_selected():\n    sel = cmds.ls(sl=True, type='transform', long=True)\n    if sel:\n        manager().add(sel)\n\n\ndef remove_selected():\n    mgr = manager()\n    sel = set(cmds.ls(sl=True, long=True) or [])\n    mgr.remove([tid for tid, tr in mgr.trails.items() if tr.node in sel])\n\n\ndef clear():\n    manager().clear()\n\n\ndef toggle_visibility():\n    mgr = manager()\n    state = not any(tr.visible for tr in mgr.trails.values())\n    for tid in list(mgr.trails):\n        mgr.set_visible(tid, state)\n\n\ndef toggle_edit_tool():\n    manager()\n    from . import edit_tool\n    return edit_tool.toggle()\n\n\ndef toggle_auto():\n    from .settings import SETTINGS\n    mgr = manager()\n    SETTINGS.set('auto_selection', not SETTINGS.get('auto_selection'))\n    mgr.settings_changed(['auto_selection'])\n\n\ndef nudge(frames):\n    manager().nudge(frames)\n\n\ndef favor(amount):\n    from . import anim\n    with anim.undo_chunk('FlowTrail favor'):\n        manager().tween(amount)\n\n\ndef set_tool(mode):\n    \"\"\"Viewport tool: 'move' (pull), 'sketch' or 'brush'.\"\"\"\n    manager()\n    from . import edit_tool\n    edit_tool.set_mode(mode)\n\n\ndef smooth_arcs(strength=0.55):\n    \"\"\"0..1. Acts on selected keys' trails, else selected controls, else all visible.\"\"\"\n    manager().smooth_arcs(strength)\n\n\ndef make_loop_seamless():\n    manager().make_loop_seamless()\n\n\ndef unload():\n    \"\"\"Remove all trails, callbacks and the plugin (e.g. before updating).\"\"\"\n    from . import registry\n    mgr = registry.MANAGER[0]\n    if mgr is not None:\n        mgr.shutdown()\n    try:\n        from . import edit_tool\n        edit_tool.deactivate()\n        if cmds.draggerContext(edit_tool.CTX, exists=True):\n            cmds.deleteUI(edit_tool.CTX)\n    except Exception:\n        pass\n    if cmds.pluginInfo(PLUGIN_PATH, q=True, loaded=True):\n        cmds.flushUndo()\n        cmds.unloadPlugin(os.path.basename(PLUGIN_PATH))",
"aliases": {
"absolute_import": "__future__.absolute_import",
"division": "__future__.division",
"print_function": "__future__.print_function",
"os": "os",
"cmds": "maya.cmds"
},
"outline": [
{
"q": "load_plugin",
"k": "def",
"s": 28,
"e": 30,
"doc": "",
"n": "Loads the viewport draw plugin (`plugin/flowTrailNode.py`) by its full path, once.",
"c": [],
"b": [
[
1,
"manager"
]
]
},
{
"q": "manager",
"k": "def",
"s": 33,
"e": 36,
"doc": "",
"n": "Loads the plugin and returns the single `Manager` from `core`. Imports are inside the function so importing `flowtrail` itself stays cheap and does not need the plugin.",
"c": [
[
1,
"load_plugin"
],
[
6,
"get_manager"
]
],
"b": [
[
1,
"show"
],
[
1,
"add_selected"
],
[
1,
"remove_selected"
],
[
1,
"clear"
],
[
1,
"toggle_visibility"
],
[
1,
"toggle_edit_tool"
],
[
1,
"toggle_auto"
],
[
1,
"nudge"
],
[
1,
"favor"
],
[
1,
"set_tool"
],
[
1,
"smooth_arcs"
],
[
1,
"make_loop_seamless"
]
]
},
{
"q": "show",
"k": "def",
"s": 39,
"e": 42,
"doc": "",
"n": "Opens the FlowTrail window.",
"c": [
[
1,
"manager"
],
[
11,
"show"
]
],
"b": [
[
2,
"install"
]
]
},
{
"q": "add_selected",
"k": "def",
"s": 45,
"e": 48,
"doc": "",
"n": "Hotkey command: create trails for the selected transforms.",
"c": [
[
1,
"manager"
]
],
"b": []
},
{
"q": "remove_selected",
"k": "def",
"s": 51,
"e": 54,
"doc": "",
"n": "Hotkey command: remove the trails of the selected controls.",
"c": [
[
1,
"manager"
]
],
"b": []
},
{
"q": "clear",
"k": "def",
"s": 57,
"e": 58,
"doc": "",
"n": "Removes every trail.",
"c": [
[
1,
"manager"
]
],
"b": []
},
{
"q": "toggle_visibility",
"k": "def",
"s": 61,
"e": 65,
"doc": "",
"n": "Hides every trail if any is visible, otherwise shows them all.",
"c": [
[
1,
"manager"
]
],
"b": []
},
{
"q": "toggle_edit_tool",
"k": "def",
"s": 68,
"e": 71,
"doc": "",
"n": "Turns the viewport edit tool on or off.",
"c": [
[
1,
"manager"
],
[
10,
"toggle"
]
],
"b": []
},
{
"q": "toggle_auto",
"k": "def",
"s": 74,
"e": 78,
"doc": "",
"n": "Toggles \"auto trail on selection\" and tells the manager about it.",
"c": [
[
1,
"manager"
]
],
"b": []
},
{
"q": "nudge",
"k": "def",
"s": 81,
"e": 82,
"doc": "",
"n": "Moves the selected trail keys (or the current frame's keys) earlier or later by some frames.",
"c": [
[
1,
"manager"
]
],
"b": []
},
{
"q": "favor",
"k": "def",
"s": 85,
"e": 88,
"doc": "",
"n": "Breakdown/favor: moves the pose toward the previous or next key, in one undo step.",
"c": [
[
1,
"manager"
],
[
7,
"undo_chunk"
]
],
"b": []
},
{
"q": "set_tool",
"k": "def",
"s": 91,
"e": 95,
"doc": "Viewport tool: 'move' (pull), 'sketch' or 'brush'.",
"n": "Chooses the viewport tool mode: move (pull), sketch or brush.",
"c": [
[
1,
"manager"
],
[
10,
"set_mode"
]
],
"b": []
},
{
"q": "smooth_arcs",
"k": "def",
"s": 98,
"e": 100,
"doc": "0..1. Acts on selected keys' trails, else selected controls, else all visible.",
"n": "Smooths the arcs of the relevant trails with a strength from 0 to 1.",
"c": [
[
1,
"manager"
]
],
"b": []
},
{
"q": "make_loop_seamless",
"k": "def",
"s": 103,
"e": 104,
"doc": "",
"n": "Matches the speed at the loop seam.",
"c": [
[
1,
"manager"
]
],
"b": []
},
{
"q": "unload",
"k": "def",
"s": 107,
"e": 122,
"doc": "Remove all trails, callbacks and the plugin (e.g. before updating).",
"n": "Removes everything FlowTrail added (trails, callbacks, the edit tool, the plugin), for example before updating the files. The undo queue is flushed first, because undo entries can point at plugin code that is about to disappear.",
"c": [
[
10,
"deactivate"
]
],
"b": []
}
],
"lines": {
"121": "Clears the undo queue before unloading the plugin; undo entries that reference plugin nodes could crash Maya otherwise."
}
},
{
"path": "flowtrail/install.py",
"lang": "py",
"note": "Drag-and-drop installer: adds a shelf button that puts the parent folder on `sys.path` and opens FlowTrail.",
"code": "# -*- coding: utf-8 -*-\n\"\"\"\nDrag and drop this file into a Maya viewport to install FlowTrail.\n\nIt adds a \"FlowTrail\" button to the current shelf. Nothing is copied:\nkeep the flowtrail folder where it is.\n\"\"\"\nfrom __future__ import absolute_import, division, print_function\n\nimport os\nimport sys\n\nfrom maya import cmds, mel\n\nCOMMAND = '''import sys\np = r\"{path}\"\nif p not in sys.path:\n    sys.path.append(p)\nimport flowtrail\nflowtrail.show()\n'''\n\n\ndef install():\n    package = os.path.dirname(os.path.abspath(__file__))\n    parent = os.path.dirname(package)\n    if parent not in sys.path:\n        sys.path.append(parent)\n\n    shelf_top = mel.eval('$tmp = $gShelfTopLevel')\n    shelf = cmds.tabLayout(shelf_top, q=True, selectTab=True)\n    for b in cmds.shelfLayout(shelf, q=True, childArray=True) or []:\n        if cmds.shelfButton(b, q=True, exists=True) and \\\n                cmds.shelfButton(b, q=True, label=True) == 'FlowTrail':\n            cmds.deleteUI(b)\n    cmds.shelfButton(parent=shelf, label='FlowTrail', annotation='FlowTrail motion trails',\n                     image1='pythonFamily.png', imageOverlayLabel='Trail',\n                     sourceType='python', command=COMMAND.format(path=parent))\n\n    import flowtrail\n    flowtrail.show()\n    cmds.inViewMessage(amg='<hl>FlowTrail</hl> installed on shelf \"%s\"' % shelf,\n                       pos='topCenter', fade=True)\n\n\ndef onMayaDroppedPythonFile(*args):\n    install()",
"aliases": {
"absolute_import": "__future__.absolute_import",
"division": "__future__.division",
"print_function": "__future__.print_function",
"os": "os",
"sys": "sys",
"cmds": "maya.cmds",
"mel": "maya.mel"
},
"outline": [
{
"q": "install",
"k": "def",
"s": 24,
"e": 43,
"doc": "",
"n": "Adds the parent folder to `sys.path`, removes an older FlowTrail shelf button if there is one, creates a new one whose command adds the path and runs `flowtrail.show()`, then opens the tool.",
"c": [
[
1,
"show"
]
],
"b": [
[
2,
"onMayaDroppedPythonFile"
]
]
},
{
"q": "onMayaDroppedPythonFile",
"k": "def",
"s": 46,
"e": 47,
"doc": "",
"n": "Maya calls this when the file is dropped on the viewport.",
"c": [
[
2,
"install"
]
],
"b": []
}
],
"lines": {}
},
{
"path": "flowtrail/settings.py",
"lang": "py",
"note": "All user settings in one object (`SETTINGS`), stored as JSON in an optionVar. A `version` counter lets the rest of the tool notice when something changed.",
"code": "# -*- coding: utf-8 -*-\n\"\"\"Persistent user settings (stored in a Maya optionVar as json).\"\"\"\nfrom __future__ import absolute_import, division, print_function\n\nimport json\n\nfrom maya import cmds\n\nOPTION_VAR = 'flowTrailSettings'\nAUTO_LAYER = '__auto__'\n\nDEFAULTS = {\n    # range\n    'range_mode': 'playback',       # playback | around | custom\n    'before': 15,\n    'after': 15,\n    'custom_start': 1,\n    'custom_end': 120,\n    'substeps': 1,                  # samples per frame (smoother arcs)\n    'eval_mode': 'context',         # context (fast DG) | timeline (complex rigs)\n    # display\n    'show_line': True,\n    'show_frames': True,\n    'show_keys': True,\n    'show_ticks': False,\n    'speed_color': False,\n    'fade': True,\n    'on_top': True,\n    'show_live': True,\n    'labels': 'keys',               # none | keys | all\n    'line_width': 2.0,\n    'point_size': 5.0,\n    'key_size': 11.0,\n    'tick_size': 1.0,\n    'color_key': [1.0, 0.78, 0.15],\n    'color_key_other': [0.55, 0.55, 0.55],\n    'color_selected': [0.2, 1.0, 1.0],\n    'color_current': [1.0, 1.0, 1.0],\n    'color_live': [1.0, 0.25, 0.25],\n    'color_ghost': [0.7, 0.7, 0.7],\n    # space\n    'space': 'world',               # world | camera | object\n    'space_object': '',\n    # editing\n    'edit_layer': AUTO_LAYER,\n    'live_drag': True,\n    'retime_all_layers': True,\n    'click_select': True,\n    'click_jump': True,\n    # arcs (reshaping the path)\n    'tool_mode': 'move',            # move | sketch | brush\n    'falloff': 6,                   # frames pulled along when dragging a point\n    'brush_size': 40,               # pixels\n    'stroke_smooth': 0.5,\n    'spacing_mode': 'keep',         # keep | even | free\n    'key_mode': 'adaptive',         # adaptive | every | existing\n    'accuracy': 'medium',           # low | medium | high\n    'pin_keys': False,              # keep all keyed poses, reshape in-betweens only\n    'lock_end_tangents': True,      # keeps the loop seam and what's outside the edit\n    # layers\n    'ghost_layer': '',\n    # misc\n    'auto_selection': False,\n}\n\nPRESETS = [\n    ('Arc', {'show_line': True, 'show_frames': False, 'show_keys': True,\n             'show_ticks': False, 'speed_color': False, 'labels': 'none'}),\n    ('Spacing', {'show_line': True, 'show_frames': True, 'show_keys': True,\n                 'show_ticks': True, 'speed_color': False, 'labels': 'keys'}),\n    ('Speed', {'show_line': True, 'show_frames': True, 'show_keys': True,\n               'show_ticks': False, 'speed_color': True, 'labels': 'keys'}),\n    ('Full', {'show_line': True, 'show_frames': True, 'show_keys': True,\n              'show_ticks': True, 'speed_color': True, 'labels': 'all'}),\n]\n\n# settings that are scene specific and must not persist between sessions\n_VOLATILE = ('space', 'space_object', 'ghost_layer')\n\n\nclass Settings(object):\n\n    def __init__(self):\n        self.data = dict(DEFAULTS)\n        self.version = 0\n        self.load()\n\n    def get(self, key):\n        return self.data.get(key, DEFAULTS.get(key))\n\n    def set(self, key, value):\n        if self.data.get(key) == value:\n            return False\n        self.data[key] = value\n        self.version += 1\n        self.save()\n        return True\n\n    def update(self, values):\n        changed = [k for k, v in values.items() if self.data.get(k) != v]\n        if changed:\n            self.data.update(values)\n            self.version += 1\n            self.save()\n        return changed\n\n    def reset(self):\n        self.data = dict(DEFAULTS)\n        self.version += 1\n        self.save()\n\n    def load(self):\n        try:\n            if cmds.optionVar(exists=OPTION_VAR):\n                stored = json.loads(cmds.optionVar(q=OPTION_VAR))\n                for k, v in stored.items():\n                    if k in DEFAULTS and k not in _VOLATILE:\n                        self.data[k] = v\n        except Exception:\n            pass\n\n    def save(self):\n        try:\n            data = dict((k, v) for k, v in self.data.items() if k not in _VOLATILE)\n            cmds.optionVar(sv=(OPTION_VAR, json.dumps(data)))\n        except Exception:\n            pass\n\n\nSETTINGS = Settings()",
"aliases": {
"absolute_import": "__future__.absolute_import",
"division": "__future__.division",
"print_function": "__future__.print_function",
"json": "json",
"cmds": "maya.cmds"
},
"outline": [
{
"q": "Settings",
"k": "class",
"s": 81,
"e": 127,
"doc": "",
"n": "Holds the current settings dict, loads and saves it, and counts changes in `version`.",
"c": [],
"b": []
},
{
"q": "Settings.__init__",
"k": "def",
"s": 83,
"e": 86,
"doc": "",
"n": "Starts from `DEFAULTS` and loads the saved values over them.",
"c": [
[
3,
"Settings.load"
]
],
"b": []
},
{
"q": "Settings.get",
"k": "def",
"s": 88,
"e": 89,
"doc": "",
"n": "A setting, falling back to the default if it is missing.",
"c": [],
"b": []
},
{
"q": "Settings.set",
"k": "def",
"s": 91,
"e": 97,
"doc": "",
"n": "Changes one setting. Returns `False` and does nothing if the value is the same, so callers can skip work. Otherwise bumps `version` and saves.",
"c": [
[
3,
"Settings.save"
]
],
"b": []
},
{
"q": "Settings.update",
"k": "def",
"s": 99,
"e": 105,
"doc": "",
"n": "Changes several settings and returns the list of keys that really changed.",
"c": [
[
3,
"Settings.save"
]
],
"b": []
},
{
"q": "Settings.reset",
"k": "def",
"s": 107,
"e": 110,
"doc": "",
"n": "Back to the defaults.",
"c": [
[
3,
"Settings.save"
]
],
"b": []
},
{
"q": "Settings.load",
"k": "def",
"s": 112,
"e": 120,
"doc": "",
"n": "Reads the saved JSON, keeping only known keys and never the scene-specific ones (`_VOLATILE`).",
"c": [],
"b": [
[
3,
"Settings.__init__"
]
]
},
{
"q": "Settings.save",
"k": "def",
"s": 122,
"e": 127,
"doc": "",
"n": "Writes everything except the scene-specific keys. Errors are ignored: failing to save a preference must never break the tool.",
"c": [],
"b": [
[
3,
"Settings.set"
],
[
3,
"Settings.update"
],
[
3,
"Settings.reset"
]
]
}
],
"lines": {
"78": "Scene-specific choices: an object or layer name from one scene means nothing in the next, so these are never saved."
}
},
{
"path": "flowtrail/registry.py",
"lang": "py",
"note": "The tiny shared state between the Python package and the viewport plugin. It must never be reloaded, because the plugin keeps a reference to these exact objects.",
"code": "# -*- coding: utf-8 -*-\n\"\"\"\nShared state between the FlowTrail python package and the VP2 draw plugin.\n\nNever reload this module: the plugin keeps a reference to it.\n\"\"\"\n\nTRAILS = {}         # trail id -> core.Trail\nMANAGER = [None]    # [core.Manager]\n\n\ndef build_packet(trail_id, view_dir, view_pos):\n    \"\"\"Called by the draw override. Returns a draw.Packet or None.\"\"\"\n    mgr = MANAGER[0]\n    trail = TRAILS.get(trail_id)\n    if mgr is None or trail is None or not trail.visible:\n        return None\n    return mgr.packet(trail, view_dir, view_pos)",
"aliases": {},
"outline": [
{
"q": "build_packet",
"k": "def",
"s": 12,
"e": 18,
"doc": "Called by the draw override. Returns a draw.Packet or None.",
"n": "Called by the viewport plugin for each trail it draws. It returns the drawing data (a `draw.Packet`) from the manager, or `None` if the trail is hidden or gone. This one function is the whole contract between plugin and package.",
"c": [],
"b": []
}
],
"lines": {
"9": "A list with one item instead of a plain variable: other modules can change `MANAGER[0]` and everyone holding the list sees the change."
}
},
{
"path": "flowtrail/sampling.py",
"lang": "py",
"note": "Reads world matrices at many frames quickly, without moving the timeline (or by moving it, for rigs that need that).",
"code": "# -*- coding: utf-8 -*-\n\"\"\"\nFast evaluation of matrices over time.\n\nTwo engines:\n  context  - evaluates plugs in a DG context (no time change, no redraw).\n             Fastest for most rigs.\n  timeline - steps the current time with refresh suspended so the parallel\n             evaluation manager does the work. Use for rigs that don't\n             evaluate correctly in a DG context.\n\"\"\"\nfrom __future__ import absolute_import, division, print_function\n\nfrom maya import cmds\nimport maya.api.OpenMaya as om\n\n_GUARD = getattr(om, 'MDGContextGuard', None)\n_READER = [None]\n\n\ndef _dag(node):\n    sel = om.MSelectionList()\n    sel.add(node)\n    return sel.getDagPath(0)\n\n\ndef matrix_plug(node, attr='worldMatrix'):\n    dag = _dag(node)\n    plug = om.MFnDependencyNode(dag.node()).findPlug(attr, False)\n    if plug.isArray:\n        plug = plug.elementByLogicalIndex(dag.instanceNumber())\n    return plug\n\n\ndef _ctx(t):\n    return om.MDGContext(om.MTime(t, om.MTime.uiUnit()))\n\n\ndef _read_guard(plug, t):\n    ctx = _ctx(t)\n    guard = _GUARD(ctx)\n    try:\n        return om.MFnMatrixData(plug.asMObject()).matrix()\n    finally:\n        del guard\n\n\ndef _read_arg(plug, t):\n    return om.MFnMatrixData(plug.asMObject(_ctx(t))).matrix()\n\n\ndef _read_cmds(plug, t):\n    return om.MMatrix(cmds.getAttr(plug.name(), time=t))\n\n\ndef _reader(plug, t):\n    \"\"\"Pick (once) the fastest context evaluation that gives correct values.\"\"\"\n    if _READER[0] is not None:\n        return _READER[0]\n    ref = _read_cmds(plug, t)\n    candidates = []\n    if _GUARD is not None:\n        candidates.append(_read_guard)\n    candidates.append(_read_arg)\n    for fn in candidates:\n        try:\n            if fn(plug, t).isEquivalent(ref, 1e-4):\n                _READER[0] = fn\n                return fn\n        except Exception:\n            pass\n    _READER[0] = _read_cmds\n    return _read_cmds\n\n\ndef read_matrix(node, attr, t):\n    plug = matrix_plug(node, attr)\n    return _reader(plug, t)(plug, t)\n\n\ndef sample(requests, mode='context', attr='worldMatrix'):\n    \"\"\"\n    requests: {node: [times]}\n    returns:  {node: [(time, MMatrix), ...]}\n    \"\"\"\n    requests = dict((n, list(ts)) for n, ts in requests.items() if ts)\n    if not requests:\n        return {}\n    if mode == 'timeline':\n        return _sample_timeline(requests, attr)\n    out = {}\n    for node, times in requests.items():\n        try:\n            plug = matrix_plug(node, attr)\n        except Exception:\n            continue\n        reader = _reader(plug, times[0])\n        out[node] = [(t, reader(plug, t)) for t in times]\n    return out\n\n\ndef _sample_timeline(requests, attr):\n    plugs = {}\n    by_time = {}\n    for node, times in requests.items():\n        try:\n            plugs[node] = matrix_plug(node, attr)\n        except Exception:\n            continue\n        for t in times:\n            by_time.setdefault(t, []).append(node)\n    out = dict((n, []) for n in plugs)\n    current = cmds.currentTime(q=True)\n    cmds.refresh(suspend=True)\n    try:\n        for t in sorted(by_time):\n            cmds.currentTime(t, update=True)\n            for node in by_time[t]:\n                if node in plugs:\n                    m = om.MFnMatrixData(plugs[node].asMObject()).matrix()\n                    out[node].append((t, m))\n    finally:\n        cmds.currentTime(current, update=True)\n        cmds.refresh(suspend=False)\n    return out",
"aliases": {
"absolute_import": "__future__.absolute_import",
"division": "__future__.division",
"print_function": "__future__.print_function",
"cmds": "maya.cmds",
"om": "maya.api.OpenMaya"
},
"outline": [
{
"q": "_dag",
"k": "def",
"s": 21,
"e": 24,
"doc": "",
"n": "API DAG path for a node name.",
"c": [],
"b": [
[
5,
"matrix_plug"
]
]
},
{
"q": "matrix_plug",
"k": "def",
"s": 27,
"e": 32,
"doc": "",
"n": "The plug for a matrix attribute, picking the right array element for this instance.",
"c": [
[
5,
"_dag"
]
],
"b": [
[
5,
"read_matrix"
],
[
5,
"sample"
],
[
5,
"_sample_timeline"
]
]
},
{
"q": "_ctx",
"k": "def",
"s": 35,
"e": 36,
"doc": "",
"n": "A DG context at frame `t`.",
"c": [],
"b": [
[
5,
"_read_guard"
],
[
5,
"_read_arg"
]
]
},
{
"q": "_read_guard",
"k": "def",
"s": 39,
"e": 45,
"doc": "",
"n": "Reads a matrix inside an `MDGContextGuard` (newer Maya).",
"c": [
[
5,
"_ctx"
]
],
"b": [
[
5,
"_reader"
]
]
},
{
"q": "_read_arg",
"k": "def",
"s": 48,
"e": 49,
"doc": "",
"n": "Reads a matrix by passing the context to `asMObject` (older Maya).",
"c": [
[
5,
"_ctx"
]
],
"b": [
[
5,
"_reader"
]
]
},
{
"q": "_read_cmds",
"k": "def",
"s": 52,
"e": 53,
"doc": "",
"n": "Reads a matrix with `cmds.getAttr(time=)`: slow but always right.",
"c": [],
"b": [
[
5,
"_reader"
]
]
},
{
"q": "_reader",
"k": "def",
"s": 56,
"e": 73,
"doc": "Pick (once) the fastest context evaluation that gives correct values.",
"n": "Picks, once per session, the fastest reading method that matches the slow trusted one, and remembers it in `_READER`.",
"c": [
[
5,
"_read_cmds"
],
[
5,
"_read_guard"
],
[
5,
"_read_arg"
]
],
"b": [
[
5,
"read_matrix"
],
[
5,
"sample"
]
]
},
{
"q": "read_matrix",
"k": "def",
"s": 76,
"e": 78,
"doc": "",
"n": "One matrix of one node at one time.",
"c": [
[
5,
"matrix_plug"
],
[
5,
"_reader"
]
],
"b": [
[
10,
"_begin_move"
]
]
},
{
"q": "sample",
"k": "def",
"s": 81,
"e": 99,
"doc": "requests: {node: [times]}\nreturns:  {node: [(time, MMatrix), ...]}",
"n": "The main function: `{node: [times]}` in, `{node: [(time, matrix)]}` out, with the context engine or the timeline engine.",
"c": [
[
5,
"_sample_timeline"
],
[
5,
"_reader"
],
[
5,
"matrix_plug"
]
],
"b": [
[
6,
"Manager._fill"
],
[
6,
"Manager._parent_offsets"
],
[
14,
"Flow.setUp"
],
[
14,
"Flow.tearDown"
]
]
},
{
"q": "_sample_timeline",
"k": "def",
"s": 102,
"e": 125,
"doc": "",
"n": "Timeline engine: groups requests by time, steps the current time once per frame with redraws suspended, reads every node at that frame, and always restores the time.",
"c": [
[
5,
"matrix_plug"
]
],
"b": [
[
5,
"sample"
]
]
}
],
"lines": {
"18": "The chosen reading function, stored once per session (a one-item list so functions can change it without `global`).",
"67": "Use a fast method only if it gives the same matrix as the trusted `cmds` read."
}
},
{
"path": "flowtrail/core.py",
"lang": "py",
"note": "The heart of FlowTrail: the `Trail` objects with their position caches, and the `Manager` that listens to Maya events, keeps caches up to date incrementally, and performs every edit (drag, retime, tween, reshape). The docstring at the top lists the four reasons it is fast.",
"code": "# -*- coding: utf-8 -*-\n\"\"\"\nFlowTrail core: trails, caching, incremental updates and Maya callbacks.\n\nWhy it's fast:\n  * positions are sampled once and cached per frame\n  * when a curve changes, only the frames that change can affect are\n    resampled (diff of key snapshots, +/- two neighbouring keys)\n  * updates run deferred at idle, coalesced, never during playback\n  * drawing is a VP2 draw override that renders cached arrays\n\"\"\"\nfrom __future__ import absolute_import, division, print_function\n\nimport math\nimport time\nimport traceback\nimport uuid\nfrom collections import OrderedDict\n\nfrom maya import cmds\nimport maya.api.OpenMaya as om\nimport maya.api.OpenMayaAnim as oma\nimport maya.api.OpenMayaUI as omui\n\nfrom . import anim, draw, registry, reshape, sampling\nfrom .settings import SETTINGS\n\nGROUP = 'flowTrail_GRP'\nNODE_TYPE = 'flowTrail'\nPALETTE = [(0.25, 0.75, 1.0), (1.0, 0.55, 0.2), (0.55, 1.0, 0.35),\n           (1.0, 0.4, 0.65), (0.75, 0.55, 1.0), (1.0, 0.9, 0.3)]\nMAX_AUTO = 8\nRANGE_KEYS = ('range_mode', 'before', 'after', 'custom_start', 'custom_end', 'substeps')\nACCURACY = {'low': 0.002, 'medium': 0.001, 'high': 0.0004}  # share of the path length\nRESHAPE_PASSES = 4\n\nkey = anim.key\n\n\ndef current_time():\n    return oma.MAnimControl.currentTime().asUnits(om.MTime.uiUnit())\n\n\ndef refresh_views():\n    try:\n        omui.M3dView.scheduleRefreshAllViews()\n    except Exception:\n        try:\n            cmds.refresh(force=True)\n        except Exception:\n            pass\n\n\nclass _NoUndo(object):\n    def __enter__(self):\n        self.state = cmds.undoInfo(q=True, stateWithoutFlush=True)\n        cmds.undoInfo(stateWithoutFlush=False)\n\n    def __exit__(self, *args):\n        cmds.undoInfo(stateWithoutFlush=self.state)\n\n\ndef _defer(fn):\n    try:\n        cmds.evalDeferred(fn, lowestPriority=True)\n    except TypeError:\n        cmds.evalDeferred(fn)\n\n\n# ---------------------------------------------------------------------------\n# tracked objects\n# ---------------------------------------------------------------------------\nclass Tracked(object):\n    \"\"\"An object whose world matrix is sampled over time.\"\"\"\n\n    def __init__(self, node):\n        self.node = cmds.ls(node, long=True)[0]\n        self.uuid = cmds.ls(self.node, uuid=True)[0]\n        self.history = set()\n        self.curves = set()\n        self.snap = {}\n        self.cache = {}\n        self.needs_scan = True\n        self.version = 0\n        self._dag = None\n\n    @property\n    def short(self):\n        return self.node.split('|')[-1]\n\n    def resolve(self):\n        found = cmds.ls(self.uuid, long=True)\n        if not found:\n            return False\n        if found[0] != self.node:\n            self.node = found[0]\n            self._dag = None\n            self.needs_scan = True\n        return True\n\n    def dag(self):\n        if self._dag is None or not self._dag.isValid():\n            sel = om.MSelectionList()\n            sel.add(self.node)\n            self._dag = sel.getDagPath(0)\n        return self._dag\n\n    def scan(self):\n        self.history, self.curves = anim.collect_upstream(self.node)\n        self.snap = dict((c, anim.snapshot(c)) for c in self.curves)\n        self.invalidate(*anim.FULL)\n        self.needs_scan = False\n\n    def invalidate(self, lo, hi):\n        for store in self._stores():\n            for t in [t for t in store if lo <= t <= hi]:\n                del store[t]\n        self.version += 1\n\n    def _stores(self):\n        return [self.cache]\n\n    def store(self, t, matrix):\n        self.cache[t] = matrix\n\n\nclass SpaceRef(Tracked):\n    \"\"\"Reference space (camera or object) the trails can be displayed in.\"\"\"\n\n    def __init__(self, node):\n        Tracked.__init__(self, node)\n        self._inv = {}\n\n    def _stores(self):\n        return [self.cache, self._inv]\n\n    def inverse(self, t):\n        inv = self._inv.get(t)\n        if inv is None:\n            m = self.cache.get(t)\n            if m is None:\n                return None\n            inv = self._inv[t] = m.inverse()\n        return inv\n\n\nclass Trail(Tracked):\n\n    def __init__(self, node, color):\n        Tracked.__init__(self, node)\n        self.id = uuid.uuid4().hex[:10]\n        self.color = list(color)\n        self.visible = True\n        self.auto = False\n        try:\n            self.offset = tuple(cmds.getAttr(self.node + '.rotatePivot')[0])\n        except Exception:\n            self.offset = (0.0, 0.0, 0.0)\n        self.ghost = {}\n        self.own = set()\n        self.key_times = []\n        self.key_layers = {}\n        self.shape = None\n        self.drag_preview = {}\n        self.retime_preview = None\n        self.proposed = []              # [(time, display point)] not applied yet\n        self.stroke = []                # [display point] being drawn\n        self.pick_points = []\n        self._pk = None\n        self._pk_key = None\n\n    def _stores(self):\n        return [self.cache, self.ghost]\n\n    def store(self, t, matrix):\n        p = om.MPoint(*self.offset) * matrix\n        self.cache[t] = (p.x, p.y, p.z)\n\n    def store_ghost(self, t, matrix):\n        p = om.MPoint(*self.offset) * matrix\n        self.ghost[t] = (p.x, p.y, p.z)\n\n    def live_point(self):\n        try:\n            return om.MPoint(*self.offset) * self.dag().inclusiveMatrix()\n        except Exception:\n            return None\n\n    def scan(self):\n        Tracked.scan(self)\n        self.own = anim.own_curves(self.node)\n        self.curves.update(self.own)\n        for c in self.own:\n            if c not in self.snap:\n                self.snap[c] = anim.snapshot(c)\n\n    def update_keys(self, root, layer_map):\n        layers = {}\n        for c in self.own:\n            if not cmds.objExists(c):\n                continue\n            lay = layer_map.get(c) or root\n            for t in anim.key_times(c):\n                layers.setdefault(t, set()).add(lay)\n        self.key_layers = layers\n        self.key_times = sorted(layers)\n        self.version += 1\n\n    def neighbours(self, t):\n        prev = [k for k in self.key_times if k < t]\n        nxt = [k for k in self.key_times if k > t]\n        return (prev[-1] if prev else None), (nxt[0] if nxt else None)\n\n    def touch(self):\n        self.version += 1\n\n    # -- viewport node ----------------------------------------------------\n    def create_shape(self):\n        if self.shape and cmds.objExists(self.shape):\n            return\n        with _NoUndo():\n            if not cmds.objExists(GROUP):\n                grp = cmds.createNode('transform', name=GROUP, skipSelect=True)\n                cmds.setAttr(grp + '.overrideEnabled', 1)\n                cmds.setAttr(grp + '.overrideDisplayType', 2)   # unselectable\n                try:\n                    cmds.setAttr(grp + '.hiddenInOutliner', True)\n                except Exception:\n                    pass\n            name = 'flowTrail_%s' % self.short.replace(':', '_')\n            xf = cmds.createNode('transform', name=name, parent=GROUP, skipSelect=True)\n            shape = cmds.createNode(NODE_TYPE, name=xf.split('|')[-1] + 'Shape',\n                                    parent=xf, skipSelect=True)\n            cmds.setAttr(shape + '.trailId', self.id, type='string')\n            for a in ('t', 'r', 's'):\n                cmds.setAttr('%s.%s' % (xf, a), lock=True)\n            self.shape = cmds.ls(shape, long=True)[0]\n\n    def delete_shape(self):\n        if self.shape and cmds.objExists(self.shape):\n            with _NoUndo():\n                xf = cmds.listRelatives(self.shape, parent=True, fullPath=True)\n                cmds.delete(xf or self.shape)\n        self.shape = None\n\n\n# ---------------------------------------------------------------------------\n# manager\n# ---------------------------------------------------------------------------\nclass Manager(object):\n\n    def __init__(self):\n        self.trails = OrderedDict()\n        self.space = None\n        self.space_version = 0\n        self.selected_keys = set()      # {(trail_id, time)}\n        self.sel_version = 0\n        self.edit_layer = None\n        self.layer_root = None\n        self.layer_map = {}\n        self.layer_version = 0\n        self.ghost_layer = None\n        self.listeners = []\n        self.stats = ''\n        self._dirty = set()\n        self._check_all = False\n        self._pending = False\n        self._busy = False\n        self._sync_auto = False\n        self._times = []\n        self._times_key = None\n        self._color_index = 0\n        self._cb_ids = []\n        self._install_callbacks()\n\n    # -- callbacks --------------------------------------------------------\n    def _install_callbacks(self):\n        add = self._cb_ids.append\n        add(oma.MAnimMessage.addAnimCurveEditedCallback(self._on_curves))\n        for ev, fn in (('timeChanged', self._on_time), ('Undo', self._on_undo),\n                       ('Redo', self._on_undo), ('SelectionChanged', self._on_selection),\n                       ('playbackRangeChanged', self._on_range)):\n            try:\n                add(om.MEventMessage.addEventCallback(ev, fn))\n            except Exception:\n                pass\n        add(om.MConditionMessage.addConditionCallback('playingBack', self._on_play))\n        msg = om.MSceneMessage\n        add(msg.addCallback(msg.kBeforeSave, self._before_save))\n        add(msg.addCallback(msg.kAfterSave, self._after_save))\n        add(msg.addCallback(msg.kBeforeNew, self._on_new_scene))\n        add(msg.addCallback(msg.kBeforeOpen, self._on_new_scene))\n\n    def shutdown(self):\n        self.clear()\n        if self._cb_ids:\n            om.MMessage.removeCallbacks(self._cb_ids)\n        self._cb_ids = []\n        if registry.MANAGER[0] is self:\n            registry.MANAGER[0] = None\n\n    def _on_curves(self, edited, *args):\n        try:\n            for i in range(len(edited)):\n                self._dirty.add(om.MFnDependencyNode(edited[i]).name())\n            self.schedule()\n        except Exception:\n            pass\n\n    def _on_time(self, *args):\n        if self._busy or not self.trails:\n            return\n        if SETTINGS.get('range_mode') == 'around' and not oma.MAnimControl.isPlaying():\n            self.schedule()\n\n    def _on_play(self, state, *args):\n        if not state and self.trails:\n            self.schedule()\n\n    def _on_range(self, *args):\n        if self.trails and SETTINGS.get('range_mode') == 'playback':\n            self.schedule()\n\n    def _on_undo(self, *args):\n        if self.trails:\n            self._check_all = True\n            self.schedule()\n\n    def _on_selection(self, *args):\n        if SETTINGS.get('auto_selection') and not self._busy:\n            self._sync_auto = True\n            self.schedule()\n\n    def _before_save(self, *args):\n        for tr in self.trails.values():\n            tr.delete_shape()\n        if cmds.objExists(GROUP):\n            with _NoUndo():\n                cmds.delete(GROUP)\n\n    def _after_save(self, *args):\n        for tr in self.trails.values():\n            tr.create_shape()\n        try:\n            cmds.file(modified=False)\n        except Exception:\n            pass\n\n    def _on_new_scene(self, *args):\n        self.trails.clear()\n        registry.TRAILS.clear()\n        self.space = None\n        self.ghost_layer = None\n        self.selected_keys.clear()\n        SETTINGS.data['space'] = 'world'\n        SETTINGS.data['ghost_layer'] = ''\n        self._notify()\n\n    # -- listeners --------------------------------------------------------\n    def _notify(self):\n        for fn in list(self.listeners):\n            try:\n                fn()\n            except Exception:\n                traceback.print_exc()\n\n    # -- trails -----------------------------------------------------------\n    def _next_color(self):\n        c = PALETTE[self._color_index % len(PALETTE)]\n        self._color_index += 1\n        return c\n\n    def find(self, node):\n        long_name = (cmds.ls(node, long=True) or [None])[0]\n        for tr in self.trails.values():\n            if tr.node == long_name:\n                return tr\n        return None\n\n    def add(self, nodes, auto=False, process=True):\n        added = []\n        for node in cmds.ls(nodes, type='transform', long=True) or []:\n            if node.startswith('|' + GROUP):\n                continue\n            existing = self.find(node)\n            if existing is not None:\n                if not auto:\n                    existing.auto = False\n                continue\n            tr = Trail(node, self._next_color())\n            tr.auto = auto\n            tr.create_shape()\n            self.trails[tr.id] = tr\n            registry.TRAILS[tr.id] = tr\n            added.append(tr)\n        if added and process:\n            self.process_now()\n        self._notify()\n        return added\n\n    def remove(self, trail_ids):\n        for tid in list(trail_ids):\n            tr = self.trails.pop(tid, None)\n            registry.TRAILS.pop(tid, None)\n            if tr is not None:\n                tr.delete_shape()\n        self.selected_keys = set(k for k in self.selected_keys if k[0] in self.trails)\n        if not self.trails and cmds.objExists(GROUP):\n            with _NoUndo():\n                cmds.delete(GROUP)\n        self._notify()\n        refresh_views()\n\n    def clear(self):\n        self.remove(list(self.trails))\n\n    def set_visible(self, tid, state):\n        tr = self.trails.get(tid)\n        if tr is not None:\n            tr.visible = bool(state)\n            if state:\n                self.schedule()\n            refresh_views()\n\n    def set_color(self, tid, rgb):\n        tr = self.trails.get(tid)\n        if tr is not None:\n            tr.color = list(rgb)\n            tr.touch()\n            refresh_views()\n\n    def rescan(self):\n        for tr in self.trails.values():\n            tr.needs_scan = True\n        if self.space is not None:\n            self.space.needs_scan = True\n        self.process_now()\n\n    # -- space / ghost ----------------------------------------------------\n    def set_space(self, node):\n        self.space = SpaceRef(node) if node and cmds.objExists(node) else None\n        self.space_version += 1\n        self.process_now()\n\n    def set_ghost_layer(self, layer):\n        self.ghost_layer = layer if layer and cmds.objExists(layer) else None\n        for tr in self.trails.values():\n            tr.ghost.clear()\n            tr.touch()\n        self.process_now()\n\n    # -- range ------------------------------------------------------------\n    def visible_range(self):\n        mode = SETTINGS.get('range_mode')\n        if mode == 'around':\n            now = int(math.floor(current_time() + 1e-4))\n            a, b = now - int(SETTINGS.get('before')), now + int(SETTINGS.get('after'))\n        elif mode == 'custom':\n            a, b = SETTINGS.get('custom_start'), SETTINGS.get('custom_end')\n        else:\n            unit = om.MTime.uiUnit()\n            a = oma.MAnimControl.minTime().asUnits(unit)\n            b = oma.MAnimControl.maxTime().asUnits(unit)\n        a, b = float(a), float(b)\n        return (a, b) if a <= b else (b, a)\n\n    def visible_times(self):\n        a, b = self.visible_range()\n        sub = max(1, int(SETTINGS.get('substeps')))\n        k = (a, b, sub)\n        if k != self._times_key:\n            n = min(int(round((b - a) * sub)), 20000)\n            self._times = [key(a + i / float(sub)) for i in range(n + 1)]\n            self._times_key = k\n        return self._times\n\n    def display_xformer(self):\n        sp = self.space\n        if sp is None:\n            return lambda t: (True, None)\n        rnow = sp.cache.get(key(round(current_time())))\n        if rnow is None:\n            return lambda t: (False, None)\n\n        def xf(t):\n            inv = sp.inverse(t)\n            return (False, None) if inv is None else (True, inv * rnow)\n        return xf\n\n    # -- drawing ----------------------------------------------------------\n    def packet(self, trail, view_dir, view_pos):\n        now = current_time()\n        self.visible_times()\n        k = (trail.version, SETTINGS.version, self.space_version, self.sel_version,\n             self.layer_version, round(now, 3), self._times_key,\n             self.space.version if self.space else 0)\n        if trail._pk_key != k:\n            trail._pk = draw.build(self, trail, SETTINGS, now)\n            trail._pk_key = k\n            trail.pick_points = trail._pk.pick if trail._pk else []\n        if trail._pk is None:\n            return None\n        draw.dynamic(trail._pk, trail, SETTINGS, view_dir, view_pos)\n        return trail._pk\n\n    # -- key selection ----------------------------------------------------\n    def select_keys(self, items, add=False):\n        if not add:\n            self.selected_keys = set()\n        self.selected_keys.update(items)\n        self.sel_version += 1\n        self._notify()\n        refresh_views()\n\n    def toggle_key(self, trail, t):\n        k = (trail.id, t)\n        if k in self.selected_keys:\n            self.selected_keys.discard(k)\n        else:\n            self.selected_keys.add(k)\n        self.sel_version += 1\n        self._notify()\n        refresh_views()\n\n    def clear_key_selection(self):\n        if self.selected_keys:\n            self.select_keys([])\n\n    def keys_by_trail(self):\n        out = OrderedDict()\n        for tid, t in sorted(self.selected_keys, key=lambda k: k[1]):\n            tr = self.trails.get(tid)\n            if tr is not None:\n                out.setdefault(tr, []).append(t)\n        return out\n\n    # -- layers -----------------------------------------------------------\n    def refresh_edit_layer(self):\n        layer = anim.resolve_edit_layer(SETTINGS.get('edit_layer'))\n        if layer != self.edit_layer:\n            self.edit_layer = layer\n            self.layer_version += 1\n            refresh_views()\n        return layer\n\n    def edit_curves(self, trail, all_layers=False):\n        if all_layers or self.layer_root is None:\n            return [c for c in trail.own if cmds.objExists(c)]\n        return [c for c in anim.curves_on_layer(trail.own, self.edit_layer,\n                                                 self.layer_map, self.layer_root)\n                if cmds.objExists(c)]\n\n    def register_curves(self, trail, curves):\n        \"\"\"Track curves created by our own edits without a full rescan.\"\"\"\n        for c in curves:\n            trail.curves.add(c)\n            trail.own.add(c)\n            trail.snap[c] = anim.snapshot(c)\n        self.layer_root, self.layer_map = anim.layer_curve_map()\n        trail.update_keys(self.layer_root, self.layer_map)\n\n    def mark_dirty(self, curves):\n        self._dirty.update(curves)\n\n    # -- processing -------------------------------------------------------\n    def schedule(self):\n        if not self._pending:\n            self._pending = True\n            _defer(self._deferred)\n\n    def _deferred(self):\n        self._pending = False\n        if oma.MAnimControl.isPlaying():\n            return\n        self.process_now()\n\n    def process_now(self):\n        if self._busy:\n            return\n        self._busy = True\n        start = time.time()\n        samples = 0\n        try:\n            if self._sync_auto:\n                self._sync_auto = False\n                self._do_sync_auto()\n            self._validate()\n            dirty, self._dirty = self._dirty, set()\n            check_all, self._check_all = self._check_all, False\n\n            old_map = self.layer_map\n            self.layer_root, self.layer_map = anim.layer_curve_map()\n            layers_changed = old_map != self.layer_map\n            self.refresh_edit_layer()\n\n            tracked = list(self.trails.values())\n            if self.space is not None:\n                tracked.append(self.space)\n            known = set()\n            for tr in tracked:\n                known |= tr.curves\n            unknown = [c for c in dirty if c not in known and cmds.objExists(c)]\n            unknown_dest = {}\n            for c in unknown:\n                dests = cmds.listConnections(c, s=False, d=True) or []\n                unknown_dest[c] = set(cmds.ls(dests, long=True) or [])\n\n            for tr in tracked:\n                if tr.needs_scan:\n                    tr.scan()\n                    if isinstance(tr, Trail):\n                        tr.update_keys(self.layer_root, self.layer_map)\n                    continue\n                if any(dest & tr.history or tr.node in dest for dest in unknown_dest.values()):\n                    tr.scan()\n                    if isinstance(tr, Trail):\n                        tr.update_keys(self.layer_root, self.layer_map)\n                    continue\n                candidates = tr.curves if check_all else (tr.curves & dirty)\n                keys_changed = False\n                for c in candidates:\n                    new = anim.snapshot(c)\n                    rng = anim.changed_range(tr.snap.get(c), new)\n                    tr.snap[c] = new\n                    if rng is not None:\n                        tr.invalidate(*rng)\n                        if isinstance(tr, Trail) and c in tr.own:\n                            keys_changed = True\n                if isinstance(tr, Trail) and (keys_changed or layers_changed):\n                    tr.update_keys(self.layer_root, self.layer_map)\n\n            samples = self._fill()\n        except Exception:\n            traceback.print_exc()\n        finally:\n            self._busy = False\n        if samples:\n            self.stats = '%d samples in %d ms' % (samples, (time.time() - start) * 1000)\n        self._notify()\n        refresh_views()\n\n    def _validate(self):\n        gone = []\n        for tid, tr in self.trails.items():\n            if not tr.resolve() or not (tr.shape and cmds.objExists(tr.shape)):\n                gone.append(tid)\n        for tid in gone:\n            tr = self.trails.pop(tid)\n            registry.TRAILS.pop(tid, None)\n            tr.delete_shape()\n        if self.space is not None and not self.space.resolve():\n            self.space = None\n            self.space_version += 1\n        if self.ghost_layer and not cmds.objExists(self.ghost_layer):\n            self.ghost_layer = None\n\n    def _fill(self):\n        times = self.visible_times()\n        if not times:\n            return 0\n        mode = SETTINGS.get('eval_mode')\n        req, owners = {}, {}\n        visible = [tr for tr in self.trails.values() if tr.visible]\n        for tr in visible:\n            missing = [t for t in times if t not in tr.cache]\n            if missing:\n                req[tr.node] = missing\n                owners[tr.node] = tr\n        if self.space is not None:\n            need = set(times)\n            need.add(key(round(current_time())))\n            missing = sorted(t for t in need if t not in self.space.cache)\n            if missing:\n                req.setdefault(self.space.node, [])\n                req[self.space.node] = sorted(set(req[self.space.node]) | set(missing))\n        total = sum(len(v) for v in req.values())\n\n        ghost_req = {}\n        if self.ghost_layer:\n            for tr in visible:\n                missing = [t for t in times if t not in tr.ghost]\n                if missing:\n                    ghost_req[tr.node] = missing\n        total += sum(len(v) for v in ghost_req.values())\n        if not total:\n            return 0\n\n        if total > 400:\n            cmds.waitCursor(state=True)\n        try:\n            for node, results in sampling.sample(req, mode).items():\n                tr = owners.get(node)\n                space = self.space if (self.space and self.space.node == node) else None\n                for t, m in results:\n                    if tr is not None and t not in tr.cache:\n                        tr.store(t, m)\n                    if space is not None:\n                        space.store(t, m)\n                if tr is not None:\n                    tr.version += 1\n                if space is not None:\n                    space.version += 1\n                    space._inv.clear()\n            if ghost_req:\n                with anim.muted(self.ghost_layer):\n                    for node, results in sampling.sample(ghost_req, mode).items():\n                        tr = self.find(node)\n                        if tr is not None:\n                            for t, m in results:\n                                tr.store_ghost(t, m)\n                            tr.version += 1\n        finally:\n            if total > 400:\n                cmds.waitCursor(state=False)\n        return total\n\n    # -- auto trails ------------------------------------------------------\n    def _do_sync_auto(self):\n        sel = [s for s in (cmds.ls(sl=True, type='transform', long=True) or [])\n               if not s.startswith('|' + GROUP)][:MAX_AUTO]\n        drop = [tid for tid, tr in self.trails.items() if tr.auto and tr.node not in sel]\n        if drop:\n            for tid in drop:\n                tr = self.trails.pop(tid)\n                registry.TRAILS.pop(tid, None)\n                tr.delete_shape()\n        new = [s for s in sel if self.find(s) is None]\n        if new:\n            self.add(new, auto=True, process=False)\n\n    def settings_changed(self, keys):\n        keys = set(keys)\n        if 'auto_selection' in keys:\n            if SETTINGS.get('auto_selection'):\n                self._sync_auto = True\n            else:\n                self.remove([tid for tid, tr in self.trails.items() if tr.auto])\n        if 'edit_layer' in keys:\n            self.refresh_edit_layer()\n        if keys & set(RANGE_KEYS) or 'auto_selection' in keys or 'eval_mode' in keys:\n            self.schedule()\n        refresh_views()\n\n    # -- editing operations -----------------------------------------------\n    def _targets(self):\n        \"\"\"Selected trail keys, or the current frame on all visible trails.\"\"\"\n        groups = self.keys_by_trail()\n        if groups:\n            return groups, False\n        now = key(round(current_time()))\n        return OrderedDict((tr, [now]) for tr in self.trails.values() if tr.visible), True\n\n    def tween(self, factor):\n        groups, create = self._targets()\n        self.refresh_edit_layer()\n        for tr, times in groups.items():\n            curves = self.edit_curves(tr)\n            anim.tween(curves, times, factor, tr.key_times, create=create)\n            self.mark_dirty(curves)\n        self.process_now()\n\n    def nudge(self, delta):\n        groups = self.keys_by_trail()\n        if not groups:\n            cmds.warning('FlowTrail: select keys on a trail first (Edit Tool, click a key).')\n            return\n        self.refresh_edit_layer()\n        new_sel = set()\n        with anim.undo_chunk('FlowTrail nudge'):\n            for tr, times in groups.items():\n                curves = self.edit_curves(tr, SETTINGS.get('retime_all_layers'))\n                occupied = set(tr.key_times)\n                for t in sorted(times, reverse=delta > 0):\n                    target = key(t + delta)\n                    if target in occupied:\n                        new_sel.add((tr.id, t))\n                        continue\n                    if anim.retime(curves, t, target):\n                        occupied.discard(t)\n                        occupied.add(target)\n                        new_sel.add((tr.id, target))\n                    else:\n                        new_sel.add((tr.id, t))\n                self.mark_dirty(curves)\n        self.selected_keys = new_sel\n        self.sel_version += 1\n        self.process_now()\n\n    def set_tangents(self, kind):\n        groups, _ = self._targets()\n        self.refresh_edit_layer()\n        with anim.undo_chunk('FlowTrail tangents'):\n            for tr, times in groups.items():\n                curves = self.edit_curves(tr)\n                anim.set_tangents(curves, times, kind)\n                self.mark_dirty(curves)\n        self.process_now()\n\n    # -- reshaping the path -----------------------------------------------\n    def arc_trails(self):\n        \"\"\"Trails with selected keys, else selected controls, else all visible.\"\"\"\n        groups = self.keys_by_trail()\n        if groups:\n            return list(groups)\n        visible = [tr for tr in self.trails.values() if tr.visible]\n        selected = set(cmds.ls(sl=True, long=True) or [])\n        return [tr for tr in visible if tr.node in selected] or visible\n\n    def has_key_span(self, trail):\n        return sum(1 for tid, _ in self.selected_keys if tid == trail.id) >= 2\n\n    def arc_span(self, trail):\n        \"\"\"First to last selected key on the trail, else the visible range.\"\"\"\n        if self.has_key_span(trail):\n            times = [t for tid, t in self.selected_keys if tid == trail.id]\n            return min(times), max(times)\n        return self.visible_range()\n\n    def span_points(self, trail, lo, hi):\n        \"\"\"Whole frames in a span: (times, display points as tuples).\"\"\"\n        found = sorted((t, p) for t, p, _ in trail.pick_points\n                       if lo <= t <= hi and abs(t - round(t)) < 1e-4)\n        return [f[0] for f in found], [(f[1].x, f[1].y, f[1].z) for f in found]\n\n    def pins_for(self, trail, times, keep=None):\n        \"\"\"Indices that can't move: the ends, plus all keys if asked to.\"\"\"\n        pins = set([0, len(times) - 1])\n        if SETTINGS.get('pin_keys'):\n            keys = set(trail.key_times)\n            pins.update(i for i, t in enumerate(times) if t in keys and t != keep)\n        return sorted(pins)\n\n    def preview_smooth(self, strength):\n        \"\"\"Shows the smoothed path without touching any key.\"\"\"\n        loops = 0\n        for tr in self.arc_trails():\n            times, pts = self.span_points(tr, *self.arc_span(tr))\n            if len(times) < 4 or strength <= 0.0:\n                tr.proposed = []\n                continue\n            new, closed = reshape.smooth_path(pts, strength, self.pins_for(tr, times),\n                                              SETTINGS.get('spacing_mode'))\n            tr.proposed = list(zip(times, new))\n            loops += closed\n        self.stats = 'Smoothing %d%%%s' % (strength * 100, ' (loop: across the seam)' if loops else '')\n        self._notify()\n        refresh_views()\n\n    def clear_proposed(self):\n        for tr in self.trails.values():\n            tr.proposed = []\n            tr.stroke = []\n        refresh_views()\n\n    def commit_proposed(self):\n        pending = [tr for tr in self.trails.values() if tr.proposed]\n        with anim.undo_chunk('FlowTrail smooth'):\n            for tr in pending:\n                times = [p[0] for p in tr.proposed]\n                points = [p[1] for p in tr.proposed]\n                tr.proposed = []\n                self.apply_display_path(tr, times, points)\n        refresh_views()\n\n    def smooth_arcs(self, strength):\n        self.preview_smooth(strength)\n        self.commit_proposed()\n\n    def apply_display_path(self, trail, times, points):\n        \"\"\"Applies a path given in display space (what's drawn in the viewport).\"\"\"\n        xformer = self.display_xformer()\n        targets = {}\n        for t, p in zip(times, points):\n            ok, m = xformer(t)\n            if ok:\n                w = om.MPoint(p[0], p[1], p[2])\n                w = w * m.inverse() if m is not None else w\n                targets[t] = (w.x, w.y, w.z)\n        return self.apply_path(trail, targets)\n\n    def _parent_offsets(self, trail, deltas, cache):\n        \"\"\"World offsets {t: (x, y, z)} to UI units in the parent's space.\"\"\"\n        missing = [t for t in deltas if t not in cache]\n        if missing:\n            result = sampling.sample({trail.node: missing}, SETTINGS.get('eval_mode'),\n                                     'parentInverseMatrix')\n            cache.update(result.get(trail.node, []))\n        unit = om.MDistance(1.0, om.MDistance.kCentimeters).asUnits(om.MDistance.uiUnit())\n        out = {}\n        for t, d in deltas.items():\n            v = om.MVector(d[0], d[1], d[2]) * cache[t]\n            out[t] = (v.x * unit, v.y * unit, v.z * unit)\n        return out\n\n    def apply_path(self, trail, targets):\n        \"\"\"\n        Makes the trail follow `targets` ({time: world point}) with as few keys\n        as the settings allow. The first and last frames don't move. After each\n        write it reads the real result back and corrects it, because the curve\n        between keys never quite matches what was asked for.\n        \"\"\"\n        times = sorted(targets)\n        if len(times) < 3:\n            return False\n        start, end = times[0], times[-1]\n        mode = SETTINGS.get('key_mode')\n        tol = max(1e-4, ACCURACY.get(SETTINGS.get('accuracy'), ACCURACY['medium']) *\n                  reshape.arc_lengths([targets[t] for t in times])[-1])\n        edit = anim.PathEdit(trail.node, self.refresh_edit_layer(), start, end,\n                             SETTINGS.get('lock_end_tangents'))\n        with anim.undo_chunk('FlowTrail reshape'):\n            if not edit.prepare():\n                cmds.warning('FlowTrail: %s has no editable translate (locked, constrained '\n                             'or driven). Use it on IK / translate controls.' % trail.short)\n                return False\n            if edit.created:\n                self.register_curves(trail, edit.created)\n            self.mark_dirty(edit.curves())\n            self.process_now()\n\n            keys = [k for k in trail.key_times if start < k < end]\n            if mode == 'existing' and not keys:\n                cmds.warning('FlowTrail: no keys inside the edit. Change \"New keys\" to '\n                             'Adaptive or Every frame.')\n                return False\n            frames = None\n            pim = {}\n            for _ in range(RESHAPE_PASSES):\n                deltas = []\n                for t in times:\n                    w = trail.cache.get(t, targets[t])\n                    deltas.append(tuple(a - b for a, b in zip(targets[t], w)))\n                errors = [reshape.dist(d, (0.0, 0.0, 0.0)) for d in deltas]\n                if frames is None:\n                    if mode == 'every':\n                        frames = list(times[1:-1])\n                    elif mode == 'existing':\n                        frames = keys\n                    else:\n                        frames = reshape.choose_frames(times, deltas, keys, tol)\n                        frames = sorted((set(frames) | set(keys)) - set((start, end)))\n                    todo = frames\n                else:\n                    if mode == 'adaptive':\n                        frames = sorted(set(frames) |\n                                        set(reshape.worst_frames(times, errors, tol, set(frames))))\n                    todo = [t for t in frames if\n                            reshape.dist(reshape.delta_at(t, times, deltas), (0.0, 0.0, 0.0)) > tol]\n                    if not todo:\n                        break\n                wanted = dict((t, reshape.delta_at(t, times, deltas)) for t in todo)\n                edit.apply(self._parent_offsets(trail, wanted, pim))\n                self.mark_dirty(edit.curves())\n                self.process_now()\n        self.stats = '%s: %d keys in %d-%d' % (trail.short, edit.key_count(), start, end)\n        if edit.failed:\n            self.stats += ' (skipped %d locked/driven axis)' % len(edit.failed)\n        self._notify()\n        return True\n\n    def make_loop_seamless(self):\n        \"\"\"Same speed leaving the first key as arriving at the last one.\"\"\"\n        self.refresh_edit_layer()\n        matched, gaps = 0, 0\n        with anim.undo_chunk('FlowTrail loop seam'):\n            for tr in self.arc_trails():\n                lo, hi = self.arc_span(tr)\n                curves = self.edit_curves(tr)\n                done, open_ends = anim.match_loop_tangents(curves, lo, hi)\n                matched += len(done)\n                gaps += len(open_ends)\n                self.mark_dirty(done)\n        self.process_now()\n        self.stats = 'Loop seam: matched %d curve(s)' % matched\n        if gaps:\n            self.stats += ', %d skipped: first and last key differ' % gaps\n            cmds.warning('FlowTrail: %d curve(s) have different values on the first and '\n                         'last key, so they can\\'t loop.' % gaps)\n        self._notify()\n\n    def select_all_keys(self):\n        items = []\n        a, b = self.visible_range()\n        for tr in self.trails.values():\n            if tr.visible:\n                items.extend((tr.id, k) for k in tr.key_times if a <= k <= b)\n        self.select_keys(items)\n\n\ndef get_manager():\n    mgr = registry.MANAGER[0]\n    if mgr is None:\n        mgr = Manager()\n        registry.MANAGER[0] = mgr\n    return mgr",
"aliases": {
"absolute_import": "__future__.absolute_import",
"division": "__future__.division",
"print_function": "__future__.print_function",
"math": "math",
"time": "time",
"traceback": "traceback",
"uuid": "uuid",
"OrderedDict": "collections.OrderedDict",
"cmds": "maya.cmds",
"om": "maya.api.OpenMaya",
"oma": "maya.api.OpenMayaAnim",
"omui": "maya.api.OpenMayaUI"
},
"outline": [
{
"q": "current_time",
"k": "def",
"s": 40,
"e": 41,
"doc": "",
"n": "The current frame through the API (faster than `cmds.currentTime` inside draw code).",
"c": [],
"b": [
[
6,
"Manager.visible_range"
],
[
6,
"Manager.display_xformer"
],
[
6,
"Manager.packet"
],
[
6,
"Manager._fill"
],
[
6,
"Manager._targets"
]
]
},
{
"q": "refresh_views",
"k": "def",
"s": 44,
"e": 51,
"doc": "",
"n": "Asks every viewport to redraw soon (falls back to `cmds.refresh`).",
"c": [],
"b": [
[
6,
"Manager.remove"
],
[
6,
"Manager.set_visible"
],
[
6,
"Manager.set_color"
],
[
6,
"Manager.select_keys"
],
[
6,
"Manager.toggle_key"
],
[
6,
"Manager.refresh_edit_layer"
],
[
6,
"Manager.process_now"
],
[
6,
"Manager.settings_changed"
],
[
6,
"Manager.preview_smooth"
],
[
6,
"Manager.clear_proposed"
],
[
6,
"Manager.commit_proposed"
],
[
10,
"_drag_soft"
],
[
10,
"_drag_sketch"
],
[
10,
"_drag_brush"
],
[
10,
"_apply_move"
],
[
10,
"_drag"
]
]
},
{
"q": "_NoUndo",
"k": "class",
"s": 54,
"e": 60,
"doc": "",
"n": "Pauses undo recording; used for the helper nodes FlowTrail creates for drawing, which are not part of the user's work.",
"c": [],
"b": [
[
6,
"Trail.create_shape"
],
[
6,
"Trail.delete_shape"
],
[
6,
"Manager._before_save"
],
[
6,
"Manager.remove"
]
]
},
{
"q": "_NoUndo.__enter__",
"k": "def",
"s": 55,
"e": 57,
"doc": "",
"n": "Turns undo recording off, remembering the previous state.",
"c": [],
"b": []
},
{
"q": "_NoUndo.__exit__",
"k": "def",
"s": 59,
"e": 60,
"doc": "",
"n": "Restores the undo state.",
"c": [],
"b": []
},
{
"q": "_defer",
"k": "def",
"s": 63,
"e": 67,
"doc": "",
"n": "Runs a function later, when Maya is idle, at the lowest priority. Many quick events then become one update.",
"c": [],
"b": [
[
6,
"Manager.schedule"
]
]
},
{
"q": "Tracked",
"k": "class",
"s": 73,
"e": 124,
"doc": "An object whose world matrix is sampled over time.",
"n": "Any object whose world matrix is sampled over time: a trail, or the space the trails are displayed in. Keeps its upstream curves, their snapshots and a per-frame cache.",
"c": [],
"b": [
[
6,
"SpaceRef"
],
[
6,
"SpaceRef.__init__"
],
[
6,
"Trail"
],
[
6,
"Trail.__init__"
],
[
6,
"Trail.scan"
]
]
},
{
"q": "Tracked.__init__",
"k": "def",
"s": 76,
"e": 85,
"doc": "",
"n": "Stores the long name and the node's **UUID**, which survives renames and reparenting, plus empty caches. `needs_scan` means the upstream curves are not known yet.",
"c": [],
"b": [
[
6,
"SpaceRef.__init__"
],
[
6,
"Trail.__init__"
]
]
},
{
"q": "Tracked.short",
"k": "def",
"s": 87,
"e": 89,
"doc": "",
"n": "Short name (a property).",
"c": [],
"b": [
[
6,
"Trail.create_shape"
]
]
},
{
"q": "Tracked.resolve",
"k": "def",
"s": 91,
"e": 99,
"doc": "",
"n": "Finds the node again by UUID. If it was renamed or reparented, updates the name and asks for a rescan. Returns `False` if it was deleted.",
"c": [],
"b": []
},
{
"q": "Tracked.dag",
"k": "def",
"s": 101,
"e": 106,
"doc": "",
"n": "Cached API DAG path, rebuilt if it became invalid.",
"c": [],
"b": [
[
6,
"Trail.live_point"
]
]
},
{
"q": "Tracked.scan",
"k": "def",
"s": 108,
"e": 112,
"doc": "",
"n": "Finds every curve that can move the node (`collect_upstream`), snapshots them all, and clears the cache.",
"c": [
[
7,
"collect_upstream"
],
[
7,
"snapshot"
],
[
6,
"Tracked.invalidate"
]
],
"b": [
[
6,
"Trail.scan"
]
]
},
{
"q": "Tracked.invalidate",
"k": "def",
"s": 114,
"e": 118,
"doc": "",
"n": "Deletes cached values between two times and bumps `version` so the drawing is rebuilt.",
"c": [
[
6,
"Tracked.store"
],
[
6,
"Tracked._stores"
]
],
"b": [
[
6,
"Tracked.scan"
]
]
},
{
"q": "Tracked._stores",
"k": "def",
"s": 120,
"e": 121,
"doc": "",
"n": "Which dicts hold per-frame data (overridden by subclasses).",
"c": [],
"b": [
[
6,
"Tracked.invalidate"
]
]
},
{
"q": "Tracked.store",
"k": "def",
"s": 123,
"e": 124,
"doc": "",
"n": "Stores a sampled matrix for a time.",
"c": [],
"b": [
[
6,
"Tracked.invalidate"
]
]
},
{
"q": "SpaceRef",
"k": "class",
"s": 127,
"e": 144,
"doc": "Reference space (camera or object) the trails can be displayed in.",
"n": "A camera or object the trails can be displayed relative to (\"camera space\" shows the arc as the camera sees it, even when the camera moves).",
"c": [
[
6,
"Tracked"
]
],
"b": [
[
6,
"Manager.set_space"
]
]
},
{
"q": "SpaceRef.__init__",
"k": "def",
"s": 130,
"e": 132,
"doc": "",
"n": "Adds a cache of inverse matrices.",
"c": [
[
6,
"Tracked.__init__"
],
[
6,
"Tracked"
]
],
"b": []
},
{
"q": "SpaceRef._stores",
"k": "def",
"s": 134,
"e": 135,
"doc": "",
"n": "Both caches are cleared together.",
"c": [],
"b": []
},
{
"q": "SpaceRef.inverse",
"k": "def",
"s": 137,
"e": 144,
"doc": "",
"n": "The inverse matrix at a time, computed once and cached.",
"c": [],
"b": []
},
{
"q": "Trail",
"k": "class",
"s": 147,
"e": 244,
"doc": "",
"n": "One motion trail: a tracked control plus everything about how it is shown and edited (color, keys and their layers, the viewport node, drag and reshape previews).",
"c": [
[
6,
"Tracked"
]
],
"b": [
[
6,
"Manager.add"
],
[
6,
"Manager.process_now"
]
]
},
{
"q": "Trail.__init__",
"k": "def",
"s": 149,
"e": 170,
"doc": "",
"n": "A short random id, a color, the rotate pivot as the point that is traced, empty previews and the draw cache.",
"c": [
[
6,
"Tracked.__init__"
],
[
6,
"Tracked"
]
],
"b": []
},
{
"q": "Trail._stores",
"k": "def",
"s": 172,
"e": 173,
"doc": "",
"n": "The position cache and the ghost cache.",
"c": [],
"b": []
},
{
"q": "Trail.store",
"k": "def",
"s": 175,
"e": 177,
"doc": "",
"n": "Stores only the traced point (rotate pivot times world matrix), not the whole matrix: smaller, and all the drawing needs.",
"c": [],
"b": []
},
{
"q": "Trail.store_ghost",
"k": "def",
"s": 179,
"e": 181,
"doc": "",
"n": "Same for the ghost (motion with one layer muted).",
"c": [],
"b": []
},
{
"q": "Trail.live_point",
"k": "def",
"s": 183,
"e": 187,
"doc": "",
"n": "Where the control is right now in the scene, even if not keyed (the red dot).",
"c": [
[
6,
"Tracked.dag"
]
],
"b": []
},
{
"q": "Trail.scan",
"k": "def",
"s": 189,
"e": 195,
"doc": "",
"n": "Also finds the control's own curves (for keys and editing) and snapshots any new ones.",
"c": [
[
6,
"Tracked.scan"
],
[
6,
"Tracked"
],
[
7,
"own_curves"
],
[
7,
"snapshot"
]
],
"b": []
},
{
"q": "Trail.update_keys",
"k": "def",
"s": 197,
"e": 207,
"doc": "",
"n": "Rebuilds the list of key times and which layers have a key at each, used to draw keys yellow or grey.",
"c": [
[
7,
"key_times"
]
],
"b": []
},
{
"q": "Trail.neighbours",
"k": "def",
"s": 209,
"e": 212,
"doc": "",
"n": "Previous and next key around a time.",
"c": [],
"b": []
},
{
"q": "Trail.touch",
"k": "def",
"s": 214,
"e": 215,
"doc": "",
"n": "Bumps `version` so the drawing is rebuilt.",
"c": [],
"b": []
},
{
"q": "Trail.create_shape",
"k": "def",
"s": 218,
"e": 237,
"doc": "",
"n": "Creates the viewport node that draws the trail: a locked transform with a `flowTrail` shape under one hidden, unselectable group, outside undo. The shape stores the trail id, which is how the plugin finds the data.",
"c": [
[
6,
"Tracked.short"
],
[
6,
"_NoUndo"
]
],
"b": []
},
{
"q": "Trail.delete_shape",
"k": "def",
"s": 239,
"e": 244,
"doc": "",
"n": "Deletes the viewport node, outside undo.",
"c": [
[
6,
"_NoUndo"
]
],
"b": []
},
{
"q": "Manager",
"k": "class",
"s": 250,
"e": 987,
"doc": "",
"n": "The one object that owns every trail and coordinates everything. Created once and kept in `registry.MANAGER`.",
"c": [],
"b": [
[
6,
"get_manager"
],
[
14,
"Flow.setUp"
]
]
},
{
"q": "Manager.__init__",
"k": "def",
"s": 252,
"e": 274,
"doc": "",
"n": "Trails in an ordered dict, key selection, layer info, listeners (the UI), and the \"dirty\" bookkeeping used for incremental updates. Installs the callbacks.",
"c": [
[
6,
"Manager._install_callbacks"
]
],
"b": []
},
{
"q": "Manager._install_callbacks",
"k": "def",
"s": 277,
"e": 292,
"doc": "",
"n": "Listens to Maya: animation curves edited, time changed, undo/redo, selection changed, playback range changed, playback start/stop, and save/new/open. Each callback only records what happened and schedules an update.",
"c": [
[
6,
"Manager._on_curves"
],
[
6,
"Manager.add"
],
[
6,
"Manager._on_range"
],
[
6,
"Manager._on_selection"
],
[
6,
"Manager._on_undo"
],
[
6,
"Manager._on_time"
],
[
6,
"Manager._on_play"
],
[
6,
"Manager._before_save"
],
[
6,
"Manager._after_save"
],
[
6,
"Manager._on_new_scene"
]
],
"b": [
[
6,
"Manager.__init__"
]
]
},
{
"q": "Manager.shutdown",
"k": "def",
"s": 294,
"e": 300,
"doc": "",
"n": "Removes every trail and every callback.",
"c": [
[
6,
"Manager.clear"
]
],
"b": []
},
{
"q": "Manager._on_curves",
"k": "def",
"s": 302,
"e": 308,
"doc": "",
"n": "Curves were edited: remember their names as dirty and schedule an update.",
"c": [
[
6,
"Manager.schedule"
]
],
"b": [
[
6,
"Manager._install_callbacks"
]
]
},
{
"q": "Manager._on_time",
"k": "def",
"s": 310,
"e": 314,
"doc": "",
"n": "Time changed: only matters in \"around current frame\" mode, and never during playback.",
"c": [
[
6,
"Manager.schedule"
]
],
"b": [
[
6,
"Manager._install_callbacks"
]
]
},
{
"q": "Manager._on_play",
"k": "def",
"s": 316,
"e": 318,
"doc": "",
"n": "Playback stopped: update now (updates are skipped while playing).",
"c": [
[
6,
"Manager.schedule"
]
],
"b": [
[
6,
"Manager._install_callbacks"
]
]
},
{
"q": "Manager._on_range",
"k": "def",
"s": 320,
"e": 322,
"doc": "",
"n": "Playback range changed: update in playback-range mode.",
"c": [
[
6,
"Manager.schedule"
]
],
"b": [
[
6,
"Manager._install_callbacks"
]
]
},
{
"q": "Manager._on_undo",
"k": "def",
"s": 324,
"e": 327,
"doc": "",
"n": "Undo/redo can change anything: check every curve on the next update.",
"c": [
[
6,
"Manager.schedule"
]
],
"b": [
[
6,
"Manager._install_callbacks"
]
]
},
{
"q": "Manager._on_selection",
"k": "def",
"s": 329,
"e": 332,
"doc": "",
"n": "Selection changed: sync automatic trails if that option is on.",
"c": [
[
6,
"Manager.schedule"
]
],
"b": [
[
6,
"Manager._install_callbacks"
]
]
},
{
"q": "Manager._before_save",
"k": "def",
"s": 334,
"e": 339,
"doc": "",
"n": "Deletes the viewport nodes before saving, so the scene file never contains FlowTrail nodes and never depends on the plugin.",
"c": [
[
6,
"_NoUndo"
]
],
"b": [
[
6,
"Manager._install_callbacks"
]
]
},
{
"q": "Manager._after_save",
"k": "def",
"s": 341,
"e": 347,
"doc": "",
"n": "Recreates them after saving and clears the \"modified\" flag.",
"c": [],
"b": [
[
6,
"Manager._install_callbacks"
]
]
},
{
"q": "Manager._on_new_scene",
"k": "def",
"s": 349,
"e": 357,
"doc": "",
"n": "New or opened scene: forget every trail and the scene-specific settings.",
"c": [
[
6,
"Manager._notify"
]
],
"b": [
[
6,
"Manager._install_callbacks"
]
]
},
{
"q": "Manager._notify",
"k": "def",
"s": 360,
"e": 365,
"doc": "",
"n": "Calls every listener (the UI refreshes itself). One failing listener does not stop the others.",
"c": [],
"b": [
[
6,
"Manager._on_new_scene"
],
[
6,
"Manager.add"
],
[
6,
"Manager.remove"
],
[
6,
"Manager.select_keys"
],
[
6,
"Manager.toggle_key"
],
[
6,
"Manager.process_now"
],
[
6,
"Manager.preview_smooth"
],
[
6,
"Manager.apply_path"
],
[
6,
"Manager.make_loop_seamless"
]
]
},
{
"q": "Manager._next_color",
"k": "def",
"s": 368,
"e": 371,
"doc": "",
"n": "Next color from the palette, cycling.",
"c": [],
"b": [
[
6,
"Manager.add"
]
]
},
{
"q": "Manager.find",
"k": "def",
"s": 373,
"e": 378,
"doc": "",
"n": "The trail of a node, if any.",
"c": [],
"b": [
[
6,
"Manager.add"
],
[
6,
"Manager._fill"
],
[
6,
"Manager._do_sync_auto"
]
]
},
{
"q": "Manager.add",
"k": "def",
"s": 380,
"e": 399,
"doc": "",
"n": "Creates trails for transforms that do not have one yet (skipping FlowTrail's own nodes), registers them in `registry.TRAILS` so the plugin can find them, and computes them right away.",
"c": [
[
6,
"Manager._next_color"
],
[
6,
"Trail"
],
[
6,
"Manager.find"
],
[
6,
"Manager.process_now"
],
[
6,
"Manager._notify"
]
],
"b": [
[
6,
"Manager._install_callbacks"
],
[
6,
"Manager.select_keys"
],
[
6,
"Manager._do_sync_auto"
]
]
},
{
"q": "Manager.remove",
"k": "def",
"s": 401,
"e": 412,
"doc": "",
"n": "Deletes trails and their viewport nodes, drops their selected keys, and deletes the group when empty.",
"c": [
[
6,
"_NoUndo"
],
[
6,
"Manager._notify"
],
[
6,
"refresh_views"
]
],
"b": [
[
6,
"Manager.clear"
],
[
6,
"Manager.settings_changed"
]
]
},
{
"q": "Manager.clear",
"k": "def",
"s": 414,
"e": 415,
"doc": "",
"n": "Removes every trail.",
"c": [
[
6,
"Manager.remove"
]
],
"b": [
[
6,
"Manager.shutdown"
]
]
},
{
"q": "Manager.set_visible",
"k": "def",
"s": 417,
"e": 423,
"doc": "",
"n": "Shows or hides one trail.",
"c": [
[
6,
"refresh_views"
],
[
6,
"Manager.schedule"
]
],
"b": []
},
{
"q": "Manager.set_color",
"k": "def",
"s": 425,
"e": 430,
"doc": "",
"n": "Changes one trail's color.",
"c": [
[
6,
"refresh_views"
]
],
"b": []
},
{
"q": "Manager.rescan",
"k": "def",
"s": 432,
"e": 437,
"doc": "",
"n": "Forces every trail (and the space) to rediscover its curves, for example after rig changes.",
"c": [
[
6,
"Manager.process_now"
]
],
"b": []
},
{
"q": "Manager.set_space",
"k": "def",
"s": 440,
"e": 443,
"doc": "",
"n": "Display the trails relative to a camera or object (or world when `None`).",
"c": [
[
6,
"SpaceRef"
],
[
6,
"Manager.process_now"
]
],
"b": []
},
{
"q": "Manager.set_ghost_layer",
"k": "def",
"s": 445,
"e": 450,
"doc": "",
"n": "Choose a layer to compare against: the ghost shows the motion with that layer muted.",
"c": [
[
6,
"Manager.process_now"
]
],
"b": []
},
{
"q": "Manager.visible_range",
"k": "def",
"s": 453,
"e": 465,
"doc": "",
"n": "The frame range the trails cover: the playback range, a window around the current frame, or a custom range.",
"c": [
[
6,
"current_time"
]
],
"b": [
[
6,
"Manager.visible_times"
],
[
6,
"Manager.arc_span"
],
[
6,
"Manager.select_all_keys"
]
]
},
{
"q": "Manager.visible_times",
"k": "def",
"s": 467,
"e": 475,
"doc": "",
"n": "Every sample time in the range (with sub-frames if asked), cached until the range changes. Capped at 20,000 samples.",
"c": [
[
6,
"Manager.visible_range"
]
],
"b": [
[
6,
"Manager.packet"
],
[
6,
"Manager._fill"
]
]
},
{
"q": "Manager.display_xformer",
"k": "def",
"s": 477,
"e": 488,
"doc": "",
"n": "A function that converts a world position at time `t` into display space. For camera space: undo the camera's motion at `t`, then apply its matrix at the current frame, so the trail is drawn as the camera sees it now.",
"c": [
[
6,
"current_time"
],
[
6,
"Manager.display_xformer.xf"
]
],
"b": [
[
6,
"Manager.apply_display_path"
]
]
},
{
"q": "Manager.display_xformer.xf",
"k": "def",
"s": 485,
"e": 487,
"doc": "",
"n": "The conversion for one time.",
"c": [],
"b": [
[
6,
"Manager.display_xformer"
]
]
},
{
"q": "Manager.packet",
"k": "def",
"s": 491,
"e": 504,
"doc": "",
"n": "Called by the plugin through `registry`. Rebuilds the cached drawing (`draw.build`) only when one of the things it depends on changed (trail data, settings, space, selection, layers, current frame, range), then refreshes the per-draw parts (`draw.dynamic`).",
"c": [
[
6,
"current_time"
],
[
6,
"Manager.visible_times"
],
[
9,
"build"
],
[
9,
"dynamic"
]
],
"b": []
},
{
"q": "Manager.select_keys",
"k": "def",
"s": 507,
"e": 513,
"doc": "",
"n": "Selects trail keys (replacing or adding).",
"c": [
[
6,
"Manager.add"
],
[
6,
"Manager._notify"
],
[
6,
"refresh_views"
]
],
"b": [
[
6,
"Manager.clear_key_selection"
],
[
6,
"Manager.select_all_keys"
]
]
},
{
"q": "Manager.toggle_key",
"k": "def",
"s": 515,
"e": 523,
"doc": "",
"n": "Adds or removes one key from the selection.",
"c": [
[
6,
"Manager._notify"
],
[
6,
"refresh_views"
]
],
"b": []
},
{
"q": "Manager.clear_key_selection",
"k": "def",
"s": 525,
"e": 527,
"doc": "",
"n": "Clears the key selection.",
"c": [
[
6,
"Manager.select_keys"
]
],
"b": []
},
{
"q": "Manager.keys_by_trail",
"k": "def",
"s": 529,
"e": 535,
"doc": "",
"n": "Selected keys grouped by trail, in time order.",
"c": [],
"b": [
[
6,
"Manager._targets"
],
[
6,
"Manager.nudge"
],
[
6,
"Manager.arc_trails"
]
]
},
{
"q": "Manager.refresh_edit_layer",
"k": "def",
"s": 538,
"e": 544,
"doc": "",
"n": "Works out the layer edits go to and redraws if it changed.",
"c": [
[
7,
"resolve_edit_layer"
],
[
6,
"refresh_views"
]
],
"b": [
[
6,
"Manager.process_now"
],
[
6,
"Manager.settings_changed"
],
[
6,
"Manager.tween"
],
[
6,
"Manager.nudge"
],
[
6,
"Manager.set_tangents"
],
[
6,
"Manager.apply_path"
],
[
6,
"Manager.make_loop_seamless"
]
]
},
{
"q": "Manager.edit_curves",
"k": "def",
"s": 546,
"e": 551,
"doc": "",
"n": "The curves to edit for a trail: on the edit layer, or on all layers.",
"c": [
[
7,
"curves_on_layer"
]
],
"b": [
[
6,
"Manager.tween"
],
[
6,
"Manager.nudge"
],
[
6,
"Manager.set_tangents"
],
[
6,
"Manager.make_loop_seamless"
]
]
},
{
"q": "Manager.register_curves",
"k": "def",
"s": 553,
"e": 560,
"doc": "Track curves created by our own edits without a full rescan.",
"n": "Adds curves created by FlowTrail's own edits to the trail without a full rescan, and refreshes the key display.",
"c": [
[
7,
"snapshot"
],
[
7,
"layer_curve_map"
]
],
"b": [
[
6,
"Manager.apply_path"
]
]
},
{
"q": "Manager.mark_dirty",
"k": "def",
"s": 562,
"e": 563,
"doc": "",
"n": "Records curves that FlowTrail itself just changed, so the next update re-checks them.",
"c": [],
"b": [
[
6,
"Manager.tween"
],
[
6,
"Manager.nudge"
],
[
6,
"Manager.set_tangents"
],
[
6,
"Manager.apply_path"
],
[
6,
"Manager.make_loop_seamless"
]
]
},
{
"q": "Manager.schedule",
"k": "def",
"s": 566,
"e": 569,
"doc": "",
"n": "Asks for one update when Maya is idle. Many events in a row (a drag fires dozens) still produce a single update, because `_pending` stops more from being queued.",
"c": [
[
6,
"Manager._deferred"
],
[
6,
"_defer"
]
],
"b": [
[
6,
"Manager._on_curves"
],
[
6,
"Manager._on_time"
],
[
6,
"Manager._on_play"
],
[
6,
"Manager._on_range"
],
[
6,
"Manager._on_undo"
],
[
6,
"Manager._on_selection"
],
[
6,
"Manager.set_visible"
],
[
6,
"Manager.settings_changed"
]
]
},
{
"q": "Manager._deferred",
"k": "def",
"s": 571,
"e": 575,
"doc": "",
"n": "The scheduled update. Skipped during playback (the trails are cached, nothing needs recomputing while playing).",
"c": [
[
6,
"Manager.process_now"
]
],
"b": [
[
6,
"Manager.schedule"
]
]
},
{
"q": "Manager.process_now",
"k": "def",
"s": 577,
"e": 640,
"doc": "",
"n": "The incremental update, the core of why FlowTrail is fast. 1) Sync automatic trails and drop trails whose nodes were deleted. 2) Refresh which layer owns which curve. 3) For an edited curve nobody tracked yet, see if it feeds anything in a trail's history; if so that trail is rescanned. 4) For each known edited curve, compare its new snapshot with the old one and clear only the frames that can have changed (`changed_range`). 5) Sample only the missing frames (`_fill`). `_busy` prevents re-entry, and timing stats are shown in the UI.",
"c": [
[
6,
"Manager._fill"
],
[
6,
"Trail"
],
[
7,
"changed_range"
],
[
7,
"snapshot"
],
[
6,
"Manager.refresh_edit_layer"
],
[
7,
"layer_curve_map"
],
[
6,
"Manager._validate"
],
[
6,
"Manager._do_sync_auto"
],
[
6,
"Manager._notify"
],
[
6,
"refresh_views"
]
],
"b": [
[
6,
"Manager.add"
],
[
6,
"Manager.rescan"
],
[
6,
"Manager.set_space"
],
[
6,
"Manager.set_ghost_layer"
],
[
6,
"Manager._deferred"
],
[
6,
"Manager.tween"
],
[
6,
"Manager.nudge"
],
[
6,
"Manager.set_tangents"
],
[
6,
"Manager.apply_path"
],
[
6,
"Manager.make_loop_seamless"
]
]
},
{
"q": "Manager._validate",
"k": "def",
"s": 642,
"e": 655,
"doc": "",
"n": "Removes trails whose control or viewport node is gone, and forgets a deleted display space or ghost layer.",
"c": [],
"b": [
[
6,
"Manager.process_now"
]
]
},
{
"q": "Manager._fill",
"k": "def",
"s": 657,
"e": 715,
"doc": "",
"n": "Samples every frame that is missing from the caches, in one batch per node through `sampling.sample`, including the display space and, with the ghost layer muted, the ghost positions. Shows a wait cursor for big batches.",
"c": [
[
6,
"Manager.visible_times"
],
[
6,
"current_time"
],
[
6,
"Manager.find"
],
[
5,
"sample"
],
[
7,
"muted"
]
],
"b": [
[
6,
"Manager.process_now"
]
]
},
{
"q": "Manager._do_sync_auto",
"k": "def",
"s": 718,
"e": 729,
"doc": "",
"n": "Auto mode: keeps automatic trails on the current selection (up to 8), removing the ones no longer selected and adding new ones.",
"c": [
[
6,
"Manager.find"
],
[
6,
"Manager.add"
]
],
"b": [
[
6,
"Manager.process_now"
]
]
},
{
"q": "Manager.settings_changed",
"k": "def",
"s": 731,
"e": 742,
"doc": "",
"n": "Reacts to settings the UI changed: auto mode on/off, a new edit layer, or anything that changes the range or evaluation (which needs a new update).",
"c": [
[
6,
"Manager.remove"
],
[
6,
"Manager.refresh_edit_layer"
],
[
6,
"Manager.schedule"
],
[
6,
"refresh_views"
]
],
"b": []
},
{
"q": "Manager._targets",
"k": "def",
"s": 745,
"e": 751,
"doc": "Selected trail keys, or the current frame on all visible trails.",
"n": "What timing tools act on: the selected trail keys, or, if none, the current frame on every visible trail (and then keys are created where missing).",
"c": [
[
6,
"Manager.keys_by_trail"
],
[
6,
"current_time"
]
],
"b": [
[
6,
"Manager.tween"
],
[
6,
"Manager.set_tangents"
]
]
},
{
"q": "Manager.tween",
"k": "def",
"s": 753,
"e": 760,
"doc": "",
"n": "Favor/breakdown on the targets, on the edit layer, then an immediate update.",
"c": [
[
6,
"Manager._targets"
],
[
6,
"Manager.refresh_edit_layer"
],
[
6,
"Manager.mark_dirty"
],
[
7,
"tween"
],
[
6,
"Manager.edit_curves"
],
[
6,
"Manager.process_now"
]
],
"b": []
},
{
"q": "Manager.nudge",
"k": "def",
"s": 762,
"e": 787,
"doc": "",
"n": "Moves selected keys earlier or later by some frames, in one undo step. It goes through keys in the order that avoids collisions (latest first when moving later), never moves a key onto an occupied frame, and keeps the moved keys selected.",
"c": [
[
6,
"Manager.keys_by_trail"
],
[
6,
"Manager.refresh_edit_layer"
],
[
6,
"Manager.mark_dirty"
],
[
7,
"retime"
],
[
6,
"Manager.edit_curves"
],
[
7,
"undo_chunk"
],
[
6,
"Manager.process_now"
]
],
"b": []
},
{
"q": "Manager.set_tangents",
"k": "def",
"s": 789,
"e": 797,
"doc": "",
"n": "Sets the tangent type of the target keys, in one undo step.",
"c": [
[
6,
"Manager._targets"
],
[
6,
"Manager.refresh_edit_layer"
],
[
6,
"Manager.mark_dirty"
],
[
7,
"set_tangents"
],
[
6,
"Manager.edit_curves"
],
[
7,
"undo_chunk"
],
[
6,
"Manager.process_now"
]
],
"b": []
},
{
"q": "Manager.arc_trails",
"k": "def",
"s": 800,
"e": 807,
"doc": "Trails with selected keys, else selected controls, else all visible.",
"n": "Which trails the Arcs tools act on: trails with selected keys, else trails of selected controls, else every visible trail.",
"c": [
[
6,
"Manager.keys_by_trail"
]
],
"b": [
[
6,
"Manager.preview_smooth"
],
[
6,
"Manager.make_loop_seamless"
]
]
},
{
"q": "Manager.has_key_span",
"k": "def",
"s": 809,
"e": 810,
"doc": "",
"n": "True if at least two keys are selected on the trail, which limits an edit to the frames between them.",
"c": [],
"b": [
[
6,
"Manager.arc_span"
]
]
},
{
"q": "Manager.arc_span",
"k": "def",
"s": 812,
"e": 817,
"doc": "First to last selected key on the trail, else the visible range.",
"n": "The range an arc edit covers: between the first and last selected key, or the whole visible range.",
"c": [
[
6,
"Manager.has_key_span"
],
[
6,
"Manager.visible_range"
]
],
"b": [
[
6,
"Manager.preview_smooth"
],
[
6,
"Manager.make_loop_seamless"
]
]
},
{
"q": "Manager.span_points",
"k": "def",
"s": 819,
"e": 823,
"doc": "Whole frames in a span: (times, display points as tuples).",
"n": "The whole-frame times and their display positions in a range, taken from the points the edit tool can click.",
"c": [],
"b": [
[
6,
"Manager.preview_smooth"
]
]
},
{
"q": "Manager.pins_for",
"k": "def",
"s": 825,
"e": 831,
"doc": "Indices that can't move: the ends, plus all keys if asked to.",
"n": "Which frames must not move: always the two ends, and every key when \"pin keys\" is on.",
"c": [],
"b": [
[
6,
"Manager.preview_smooth"
]
]
},
{
"q": "Manager.preview_smooth",
"k": "def",
"s": 833,
"e": 847,
"doc": "Shows the smoothed path without touching any key.",
"n": "Computes the smoothed path with `reshape.smooth_path` and stores it as `proposed` so the viewport draws a cyan preview. No key is touched.",
"c": [
[
6,
"Manager.pins_for"
],
[
8,
"smooth_path"
],
[
6,
"Manager.arc_span"
],
[
6,
"Manager.span_points"
],
[
6,
"Manager.arc_trails"
],
[
6,
"Manager._notify"
],
[
6,
"refresh_views"
]
],
"b": [
[
6,
"Manager.smooth_arcs"
]
]
},
{
"q": "Manager.clear_proposed",
"k": "def",
"s": 849,
"e": 853,
"doc": "",
"n": "Throws away the previews.",
"c": [
[
6,
"refresh_views"
]
],
"b": []
},
{
"q": "Manager.commit_proposed",
"k": "def",
"s": 855,
"e": 863,
"doc": "",
"n": "Applies every previewed path, in one undo step.",
"c": [
[
6,
"Manager.apply_display_path"
],
[
7,
"undo_chunk"
],
[
6,
"refresh_views"
]
],
"b": [
[
6,
"Manager.smooth_arcs"
]
]
},
{
"q": "Manager.smooth_arcs",
"k": "def",
"s": 865,
"e": 867,
"doc": "",
"n": "Preview and apply in one go (the hotkey command).",
"c": [
[
6,
"Manager.preview_smooth"
],
[
6,
"Manager.commit_proposed"
]
],
"b": []
},
{
"q": "Manager.apply_display_path",
"k": "def",
"s": 869,
"e": 879,
"doc": "Applies a path given in display space (what's drawn in the viewport).",
"n": "The path the user sees may be in camera or object space; this converts it back to world positions before applying.",
"c": [
[
6,
"Manager.display_xformer"
],
[
6,
"Manager.apply_path"
]
],
"b": [
[
6,
"Manager.commit_proposed"
]
]
},
{
"q": "Manager._parent_offsets",
"k": "def",
"s": 881,
"e": 893,
"doc": "World offsets {t: (x, y, z)} to UI units in the parent's space.",
"n": "Turns world offsets into translate offsets in the control's parent space (vector times `parentInverseMatrix`, sampled per frame and cached), in UI units.",
"c": [
[
5,
"sample"
]
],
"b": [
[
6,
"Manager.apply_path"
]
]
},
{
"q": "Manager.apply_path",
"k": "def",
"s": 895,
"e": 959,
"doc": "Makes the trail follow `targets` ({time: world point}) with as few keys\nas the settings allow. The first and last frames don't move. After each\nwrite it reads the real result back and corrects it, because the curve\nbetween keys never quite matches what was asked for.",
"n": "Makes the trail follow a target path with as few keys as the settings allow. It prepares the translate curves (`PathEdit`), then repeats up to 4 passes: measure how far each frame is from its target, choose which frames to key (every frame, existing keys only, or adaptive with `choose_frames` and then `worst_frames`), write those offsets, and **read the real result back** (`process_now`). Reading back matters because the curve between keys never exactly follows what was asked; each pass fixes what is still off. Everything is one undo step.",
"c": [
[
8,
"arc_lengths"
],
[
6,
"Manager.refresh_edit_layer"
],
[
7,
"PathEdit"
],
[
6,
"Manager.process_now"
],
[
6,
"Manager.mark_dirty"
],
[
6,
"Manager._parent_offsets"
],
[
8,
"delta_at"
],
[
8,
"dist"
],
[
8,
"worst_frames"
],
[
8,
"choose_frames"
],
[
6,
"Manager.register_curves"
],
[
7,
"undo_chunk"
],
[
6,
"Manager._notify"
]
],
"b": [
[
6,
"Manager.apply_display_path"
]
]
},
{
"q": "Manager.make_loop_seamless",
"k": "def",
"s": 961,
"e": 979,
"doc": "Same speed leaving the first key as arriving at the last one.",
"n": "Matches the slope at the loop seam for the relevant trails, in one undo step, and warns about curves whose first and last values differ.",
"c": [
[
6,
"Manager.refresh_edit_layer"
],
[
6,
"Manager.mark_dirty"
],
[
7,
"match_loop_tangents"
],
[
6,
"Manager.edit_curves"
],
[
6,
"Manager.arc_span"
],
[
6,
"Manager.arc_trails"
],
[
7,
"undo_chunk"
],
[
6,
"Manager.process_now"
],
[
6,
"Manager._notify"
]
],
"b": []
},
{
"q": "Manager.select_all_keys",
"k": "def",
"s": 981,
"e": 987,
"doc": "",
"n": "Selects every key in range on every visible trail.",
"c": [
[
6,
"Manager.visible_range"
],
[
6,
"Manager.select_keys"
]
],
"b": []
},
{
"q": "get_manager",
"k": "def",
"s": 990,
"e": 995,
"doc": "",
"n": "Returns the one `Manager`, creating it the first time. It lives in `registry.MANAGER`, so reloading `core` while developing does not create a second manager with duplicate callbacks.",
"c": [
[
6,
"Manager"
]
],
"b": [
[
1,
"manager"
],
[
10,
"_safe.wrapper"
],
[
10,
"_press"
],
[
10,
"_drag"
],
[
10,
"_release"
],
[
11,
"FlowTrailUI.__init__"
],
[
14,
"Flow.setUp"
]
]
}
],
"lines": {
"78": "A UUID never changes when the node is renamed or reparented, unlike its name.",
"225": "Display type 2 = reference: visible but cannot be clicked in the viewport.",
"279": "Maya tells FlowTrail exactly which animation curves changed, so only those trails (and only the affected frames) are updated.",
"287": "Fires when playback starts or stops; updates wait until playback ends.",
"487": "Camera space: inverse camera matrix at `t` times camera matrix now.",
"494": "Everything the drawing depends on, as one tuple. If it equals the stored one, the cached drawing is reused.",
"567": "Only one update is ever queued at a time; later events in the same moment are folded into it.",
"614": "An unknown curve that drives something in this trail's history means the rig changed: rescan this trail.",
"619": "Normally only the edited curves are compared; after undo/redo every curve is.",
"623": "Which frames this edit can have changed; only those are cleared and resampled.",
"773": "Moving keys later: start with the latest, so a key never lands on one that has not moved yet.",
"877": "Undo the display-space conversion to get back to world space.",
"891": "Vector times parent inverse matrix: the offset in the parent's space (translation ignored).",
"907": "The tolerance is a share of the path length, so \"medium\" accuracy means the same thing on a small hand move and a big jump.",
"928": "Write, read back, correct: up to 4 passes until every frame is within tolerance."
}
},
{
"path": "flowtrail/anim.py",
"lang": "py",
"note": "Animation curve and animation layer helpers: find every curve that can move a control, detect which frames changed after an edit, and edit keys on the right layer (move, retime, tween, tangents).",
"code": "# -*- coding: utf-8 -*-\n\"\"\"\nAnimation curve / animation layer helpers.\n\n- finds every curve that can move an object (its own, parents, constraints...)\n- snapshots curves and diffs them to find the smallest time range to resample\n- layer aware key editing (move, retime, tween, tangents)\n\"\"\"\nfrom __future__ import absolute_import, division, print_function\n\nimport bisect\nimport math\nfrom contextlib import contextmanager\n\nfrom maya import cmds\n\nfrom .settings import AUTO_LAYER\n\nINF = float('inf')\nFULL = (-INF, INF)\n_PASS_TYPES = ('animBlendNode', 'pairBlend', 'unitConversion')\n_CYCLES = (3, 4, 5)\n\n\ndef key(t):\n    return round(float(t), 4)\n\n\n# ---------------------------------------------------------------------------\n# dependency discovery\n# ---------------------------------------------------------------------------\ndef ancestors(long_name):\n    parts = long_name.split('|')\n    return ['|'.join(parts[:i]) for i in range(len(parts) - 1, 1, -1)]\n\n\ndef collect_upstream(node, limit=40000):\n    \"\"\"\n    Everything that can affect the world matrix of `node`.\n    Returns (history_nodes: set of long names, curves: set of curve names).\n    \"\"\"\n    history = set([node])\n    curves = set()\n    pending = [node] + ancestors(node)\n    done = set()\n    while pending:\n        batch = [n for n in set(pending) if n not in done]\n        pending = []\n        if not batch:\n            break\n        done.update(batch)\n        hist = cmds.listHistory(batch) or []\n        if not hist:\n            continue\n        history.update(cmds.ls(hist, long=True) or [])\n        curves.update(cmds.ls(hist, type='animCurve') or [])\n        # upstream transforms are also moved by their own parents\n        for xf in cmds.ls(hist, type='transform', long=True) or []:\n            for a in ancestors(xf):\n                if a not in done:\n                    pending.append(a)\n        if len(history) > limit:\n            break\n    history.update(ancestors(node))\n    return history, curves\n\n\ndef own_curves(node):\n    \"\"\"Time curves that directly drive the attributes of `node` (all layers).\"\"\"\n    result = set()\n    seen = set()\n    stack = list(cmds.listConnections(node, s=True, d=False) or [])\n    while stack:\n        n = stack.pop()\n        if n in seen:\n            continue\n        seen.add(n)\n        try:\n            nt = cmds.nodeType(n)\n        except Exception:\n            continue\n        if nt.startswith('animCurveT'):\n            result.add(n)\n        elif nt.startswith(_PASS_TYPES):\n            stack.extend(cmds.listConnections(n, s=True, d=False) or [])\n    return result\n\n\ndef key_times(curve):\n    return [key(t) for t in (cmds.keyframe(curve, q=True, timeChange=True) or [])]\n\n\n# ---------------------------------------------------------------------------\n# snapshots / diffs\n# ---------------------------------------------------------------------------\ndef _r(v, n=4):\n    return round(v, n) if isinstance(v, float) else v\n\n\ndef snapshot(curve):\n    if not cmds.objExists(curve):\n        return None\n    if not cmds.nodeType(curve).startswith('animCurveT'):\n        return ({}, (0, 0), False)\n    tv = cmds.keyframe(curve, q=True, timeChange=True, valueChange=True) or []\n    n = len(tv) // 2\n    inf = (cmds.getAttr(curve + '.preInfinity'), cmds.getAttr(curve + '.postInfinity'))\n    if not n:\n        return ({}, inf, True)\n\n    def q(**kw):\n        res = cmds.keyTangent(curve, q=True, **kw) or []\n        return res if len(res) == n else [None] * n\n\n    ia, oa = q(inAngle=True), q(outAngle=True)\n    iw, ow = q(inWeight=True), q(outWeight=True)\n    itt, ott = q(inTangentType=True), q(outTangentType=True)\n    keys = {}\n    for i in range(n):\n        keys[key(tv[2 * i])] = (_r(tv[2 * i + 1], 5), _r(ia[i]), _r(oa[i]),\n                                _r(iw[i]), _r(ow[i]), itt[i], ott[i])\n    return (keys, inf, True)\n\n\ndef changed_range(old, new):\n    \"\"\"Smallest time range whose evaluation may differ between two snapshots.\"\"\"\n    if old is None or new is None or not old[2] or not new[2]:\n        return FULL\n    if old[1] != new[1]:\n        return FULL\n    ok, nk = old[0], new[0]\n    changed = [t for t in set(ok) | set(nk) if ok.get(t) != nk.get(t)]\n    if not changed:\n        return None\n    if any(v in _CYCLES for v in new[1]):\n        return FULL\n    times = sorted(set(ok) | set(nk))\n    lo, hi = min(changed), max(changed)\n    i = bisect.bisect_left(times, lo)\n    j = bisect.bisect_right(times, hi) - 1\n    # auto/spline tangents of the neighbours change too -> expand two keys\n    start = times[i - 2] if i >= 2 else -INF\n    end = times[j + 2] if j + 2 < len(times) else INF\n    return (start, end)\n\n\n# ---------------------------------------------------------------------------\n# animation layers\n# ---------------------------------------------------------------------------\ndef _lq(layer, **kw):\n    try:\n        return cmds.animLayer(layer, q=True, **kw)\n    except Exception:\n        return None\n\n\ndef root_layer():\n    try:\n        return cmds.animLayer(q=True, root=True)\n    except Exception:\n        return None\n\n\ndef anim_layers():\n    root = root_layer()\n    if not root:\n        return []\n    return [root] + [l for l in (cmds.ls(type='animLayer') or []) if l != root]\n\n\ndef layer_curve_map():\n    \"\"\"Returns (root_layer, {curve: layer}).\"\"\"\n    root = root_layer()\n    mapping = {}\n    if not root:\n        return None, mapping\n    for layer in anim_layers():\n        for c in _lq(layer, animCurves=True) or []:\n            mapping[c] = layer\n    return root, mapping\n\n\ndef selected_layers():\n    return [l for l in anim_layers() if _lq(l, selected=True)]\n\n\ndef resolve_edit_layer(pref=AUTO_LAYER):\n    \"\"\"Layer that edits go to. None when the scene has no animation layers.\"\"\"\n    layers = anim_layers()\n    if not layers:\n        return None\n    if pref and pref != AUTO_LAYER:\n        return pref if pref in layers else layers[0]\n    sel = [l for l in selected_layers() if not _lq(l, lock=True)]\n    sel = [l for l in sel if l != layers[0]] or sel\n    return sel[-1] if sel else layers[0]\n\n\ndef layer_weight(layer):\n    try:\n        w = cmds.getAttr(layer + '.weight')\n        return w if abs(w) > 1e-3 else 1.0\n    except Exception:\n        return 1.0\n\n\n@contextmanager\ndef muted(layer):\n    \"\"\"Temporarily mute a layer (not recorded in undo).\"\"\"\n    state = cmds.undoInfo(q=True, stateWithoutFlush=True)\n    cmds.undoInfo(stateWithoutFlush=False)\n    prev = cmds.getAttr(layer + '.mute')\n    try:\n        cmds.setAttr(layer + '.mute', True)\n        yield\n    finally:\n        cmds.setAttr(layer + '.mute', prev)\n        cmds.undoInfo(stateWithoutFlush=state)\n\n\ndef curves_on_layer(curves, layer, layer_map, root):\n    if layer is None:\n        return list(curves)\n    return [c for c in curves if (layer_map.get(c) or root) == layer]\n\n\n# ---------------------------------------------------------------------------\n# key editing\n# ---------------------------------------------------------------------------\ndef has_key(curve, t):\n    return bool(cmds.keyframe(curve, q=True, time=(t, t), keyframeCount=True))\n\n\ndef keys_at(curves, t):\n    return [c for c in curves if has_key(c, t)]\n\n\ndef curve_value(curve, t):\n    v = cmds.keyframe(curve, q=True, eval=True, time=(t, t), valueChange=True)\n    return v[0] if v else 0.0\n\n\ndef set_value(curve, t, value):\n    if has_key(curve, t):\n        cmds.keyframe(curve, edit=True, time=(t, t), valueChange=value, absolute=True)\n    else:\n        cmds.setKeyframe(curve, time=t, value=value)\n\n\ndef plug_source(plug):\n    src = cmds.listConnections(plug, s=True, d=False, skipConversionNodes=True) or []\n    if not src:\n        return None, 'none'\n    nt = cmds.nodeType(src[0])\n    if nt.startswith('animCurve'):\n        return src[0], 'plain'\n    if nt.startswith('animBlendNode'):\n        return src[0], 'layered'\n    return src[0], 'driven'\n\n\ndef layer_curve_for(plug, layer):\n    res = _lq(layer, findCurveForPlug=plug) or []\n    return res[0] if res else None\n\n\ndef _plug_in_layer(plug, layer):\n    node, attr = plug.split('.', 1)\n    node_long = (cmds.ls(node, long=True) or [node])[0]\n    names = set([attr, cmds.attributeQuery(attr, node=node, shortName=True)])\n    for a in _lq(layer, attribute=True) or []:\n        n, at = a.split('.', 1)\n        if at in names and (cmds.ls(n, long=True) or [n])[0] == node_long:\n            return True\n    return False\n\n\ndef ensure_curve(plug, layer, t, seeds):\n    \"\"\"\n    Curve to edit for `plug` on `layer`, with a key at `t` (shape preserved).\n    Creates the curve if needed, seeding keys at `seeds` so the rest of the\n    animation doesn't change. Returns (curve, weight, created) or (None,..).\n    \"\"\"\n    if cmds.getAttr(plug, lock=True):\n        return None, 1.0, False\n    src, kind = plug_source(plug)\n    if kind == 'driven':\n        return None, 1.0, False\n    root = root_layer()\n    created = False\n    if layer is None or root is None or (layer == root and kind != 'layered'):\n        if kind == 'none':\n            value = cmds.getAttr(plug)\n            for st in list(seeds) + [t]:\n                cmds.setKeyframe(plug, time=st, value=value)\n            src, kind = plug_source(plug)\n            if kind != 'plain':\n                return None, 1.0, False\n            created = True\n        elif not has_key(src, t):\n            cmds.setKeyframe(src, time=t, insert=True)\n        return src, 1.0, created\n\n    if layer != root and not _plug_in_layer(plug, layer):\n        cmds.animLayer(layer, edit=True, attribute=plug)\n    curve = layer_curve_for(plug, layer)\n    if curve is None:\n        override = layer != root and bool(_lq(layer, override=True))\n        for st in list(seeds) + [t]:\n            v = cmds.getAttr(plug, time=st) if (layer == root or override) else 0.0\n            cmds.setKeyframe(plug, time=st, value=v, animLayer=layer)\n        curve = layer_curve_for(plug, layer)\n        if curve is None:\n            return None, 1.0, False\n        created = True\n    elif not has_key(curve, t):\n        cmds.setKeyframe(curve, time=t, insert=True)\n    weight = 1.0 if layer == root else layer_weight(layer)\n    return curve, weight, created\n\n\nclass TranslateEdit(object):\n    \"\"\"Adds a parent-space translate offset at one frame, on one layer.\"\"\"\n\n    AXES = ('X', 'Y', 'Z')\n\n    def __init__(self, node, t, layer, seeds):\n        self.node = node\n        self.t = t\n        self.layer = layer\n        self.seeds = [s for s in seeds if s != t]\n        self.entries = None\n        self.created = []\n        self.failed = []\n\n    def prepare(self):\n        self.entries = []\n        for i, ax in enumerate(self.AXES):\n            plug = '%s.translate%s' % (self.node, ax)\n            curve, weight, created = ensure_curve(plug, self.layer, self.t, self.seeds)\n            if curve is None:\n                self.failed.append(plug)\n                continue\n            if created:\n                self.created.append(curve)\n            self.entries.append((i, curve, curve_value(curve, self.t), weight))\n        return bool(self.entries)\n\n    def curves(self):\n        return [e[1] for e in self.entries or []]\n\n    def apply(self, delta):\n        if self.entries is None:\n            self.prepare()\n        for i, curve, orig, weight in self.entries:\n            set_value(curve, self.t, orig + delta[i] / weight)\n\n\nclass PathEdit(object):\n    \"\"\"\n    Adds parent-space translate offsets over many frames, on one layer. The\n    start and end frames get a key but keep their value, and optionally their\n    tangents, so the animation outside the edit (and a loop seam) stays as is.\n    \"\"\"\n\n    AXES = ('X', 'Y', 'Z')\n\n    def __init__(self, node, layer, start, end, lock_tangents=True):\n        self.node = node\n        self.layer = layer\n        self.start = start\n        self.end = end\n        self.lock_tangents = lock_tangents\n        self.entries = []\n        self.created = []\n        self.failed = []\n        self.tangents = {}\n\n    def prepare(self):\n        for i, ax in enumerate(self.AXES):\n            plug = '%s.translate%s' % (self.node, ax)\n            curve, weight, created = ensure_curve(plug, self.layer, self.start, [self.end])\n            if curve is None:\n                self.failed.append(plug)\n                continue\n            if not has_key(curve, self.end):\n                cmds.setKeyframe(curve, time=self.end, insert=True)\n            if created:\n                self.created.append(curve)\n            self.entries.append((i, curve, weight))\n            if self.lock_tangents:\n                self.tangents[curve] = [(t, self._read_tangent(curve, t))\n                                        for t in (self.start, self.end)]\n        return bool(self.entries)\n\n    def curves(self):\n        return [e[1] for e in self.entries]\n\n    @staticmethod\n    def _read_tangent(curve, t):\n        kw = {}\n        for flag in ('inAngle', 'outAngle'):\n            kw[flag] = cmds.keyTangent(curve, q=True, time=(t, t), **{flag: True})[0]\n        if cmds.keyTangent(curve, q=True, weightedTangents=True)[0]:\n            for flag in ('inWeight', 'outWeight'):\n                kw[flag] = cmds.keyTangent(curve, q=True, time=(t, t), **{flag: True})[0]\n        return kw\n\n    def key_count(self):\n        \"\"\"Most keys on any axis inside the edit.\"\"\"\n        span = (self.start, self.end)\n        return max([cmds.keyframe(c, q=True, time=span, keyframeCount=True) or 0\n                    for c in self.curves()] or [0])\n\n    def apply(self, deltas):\n        \"\"\"deltas: {time: (x, y, z)} in UI units, as seen after the layer weight.\"\"\"\n        times = sorted(deltas)\n        for i, curve, weight in self.entries:\n            added = [t for t in times if not has_key(curve, t)]\n            for t in added:\n                cmds.setKeyframe(curve, time=t, insert=True)\n            # read everything first: each edit changes the curve around it\n            values = [curve_value(curve, t) for t in times]\n            for t, v in zip(times, values):\n                cmds.keyframe(curve, edit=True, time=(t, t), absolute=True,\n                              valueChange=v + deltas[t][i] / weight)\n            for t in added:\n                cmds.keyTangent(curve, time=(t, t), inTangentType='spline',\n                                outTangentType='spline')\n            for t, kw in self.tangents.get(curve, []):\n                cmds.keyTangent(curve, time=(t, t), **kw)\n\n\ndef match_loop_tangents(curves, start, end):\n    \"\"\"\n    Same slope leaving the first key and arriving at the last one, so a loop\n    doesn't change speed at the seam. Only for curves that really loop.\n    Returns (matched curves, curves whose ends have different values).\n    \"\"\"\n    matched, gaps = [], []\n    for c in curves:\n        if not (has_key(c, start) and has_key(c, end)):\n            continue\n        if abs(curve_value(c, start) - curve_value(c, end)) > 1e-3:\n            gaps.append(c)\n            continue\n        out_a = cmds.keyTangent(c, q=True, time=(start, start), outAngle=True)[0]\n        in_a = cmds.keyTangent(c, q=True, time=(end, end), inAngle=True)[0]\n        slope = (math.tan(math.radians(out_a)) + math.tan(math.radians(in_a))) * 0.5\n        angle = math.degrees(math.atan(slope))\n        for t in (start, end):\n            cmds.keyTangent(c, time=(t, t), inAngle=angle, outAngle=angle)\n        matched.append(c)\n    return matched, gaps\n\n\ndef retime(curves, t_from, t_to):\n    cs = keys_at(curves, t_from)\n    if not cs or t_from == t_to:\n        return False\n    cmds.keyframe(cs, edit=True, time=(t_from, t_from), relative=True,\n                  timeChange=t_to - t_from)\n    return True\n\n\ndef tween(curves, times, factor, neighbour_times, create=False):\n    \"\"\"factor -1 (previous key) .. 0 (half way) .. 1 (next key).\"\"\"\n    w = (factor + 1.0) * 0.5\n    selected = set(times)\n    nb = sorted(set(neighbour_times) - selected)\n    for t in times:\n        i = bisect.bisect_left(nb, t)\n        if i == 0 or i >= len(nb):\n            continue\n        tp, tn = nb[i - 1], nb[i]\n        for c in curves:\n            if not has_key(c, t):\n                if not create:\n                    continue\n                cmds.setKeyframe(c, time=t, insert=True)\n            vp, vn = curve_value(c, tp), curve_value(c, tn)\n            cmds.keyframe(c, edit=True, time=(t, t), valueChange=vp + (vn - vp) * w,\n                          absolute=True)\n\n\ndef set_tangents(curves, times, kind):\n    for t in times:\n        cs = keys_at(curves, t)\n        if not cs:\n            continue\n        if kind == 'step':\n            cmds.keyTangent(cs, time=(t, t), outTangentType='step')\n        else:\n            cmds.keyTangent(cs, time=(t, t), inTangentType=kind, outTangentType=kind)\n\n\n@contextmanager\ndef undo_chunk(name='FlowTrail'):\n    try:\n        cmds.undoInfo(openChunk=True, chunkName=name)\n    except TypeError:\n        cmds.undoInfo(openChunk=True)\n    try:\n        yield\n    finally:\n        cmds.undoInfo(closeChunk=True)",
"aliases": {
"absolute_import": "__future__.absolute_import",
"division": "__future__.division",
"print_function": "__future__.print_function",
"bisect": "bisect",
"math": "math",
"contextmanager": "contextlib.contextmanager",
"cmds": "maya.cmds"
},
"outline": [
{
"q": "key",
"k": "def",
"s": 25,
"e": 26,
"doc": "",
"n": "Rounds a time to 4 decimals so it can be used as a dict key without floating point mismatches (24.000001 and 24.0 become the same key).",
"c": [],
"b": [
[
7,
"key_times"
],
[
7,
"snapshot"
]
]
},
{
"q": "ancestors",
"k": "def",
"s": 32,
"e": 34,
"doc": "",
"n": "All parent paths of a long DAG name.",
"c": [],
"b": [
[
7,
"collect_upstream"
]
]
},
{
"q": "collect_upstream",
"k": "def",
"s": 37,
"e": 65,
"doc": "Everything that can affect the world matrix of `node`.\nReturns (history_nodes: set of long names, curves: set of curve names).",
"n": "Everything that can change a control's world position: its history, its parents, and the parents of anything upstream (a constraint target moves when **its** parent moves). Returns the nodes and the animation curves among them. A `limit` stops it on enormous rigs.",
"c": [
[
7,
"ancestors"
]
],
"b": [
[
6,
"Tracked.scan"
]
]
},
{
"q": "own_curves",
"k": "def",
"s": 68,
"e": 86,
"doc": "Time curves that directly drive the attributes of `node` (all layers).",
"n": "The time-based animation curves that directly drive the control's own attributes, on every layer: it follows connections back through layer blend, pair blend and unit conversion nodes.",
"c": [],
"b": [
[
6,
"Trail.scan"
]
]
},
{
"q": "key_times",
"k": "def",
"s": 89,
"e": 90,
"doc": "",
"n": "Key times of a curve, rounded with `key`.",
"c": [
[
7,
"key"
]
],
"b": [
[
6,
"Trail.update_keys"
]
]
},
{
"q": "_r",
"k": "def",
"s": 96,
"e": 97,
"doc": "",
"n": "Rounds floats so tiny numeric noise does not count as a change.",
"c": [],
"b": [
[
7,
"snapshot"
]
]
},
{
"q": "snapshot",
"k": "def",
"s": 100,
"e": 122,
"doc": "",
"n": "A compact fingerprint of a curve: every key's value, angles, weights and tangent types, plus the infinity modes. Two snapshots can be compared to see what an edit changed.",
"c": [
[
7,
"snapshot.q"
],
[
7,
"_r"
],
[
7,
"key"
]
],
"b": [
[
6,
"Tracked.scan"
],
[
6,
"Trail.scan"
],
[
6,
"Manager.register_curves"
],
[
6,
"Manager.process_now"
]
]
},
{
"q": "snapshot.q",
"k": "def",
"s": 111,
"e": 113,
"doc": "",
"n": "Queries one tangent property for every key at once; if Maya returns the wrong number of values, it returns `None` for each so the snapshot stays aligned with the keys.",
"c": [],
"b": [
[
7,
"snapshot"
]
]
},
{
"q": "changed_range",
"k": "def",
"s": 125,
"e": 144,
"doc": "Smallest time range whose evaluation may differ between two snapshots.",
"n": "The smallest time range that may evaluate differently between two snapshots. It widens by two keys on each side because auto/spline tangents of neighboring keys change too. A change in infinity, or a cycling curve, means everything may have changed.",
"c": [],
"b": [
[
6,
"Manager.process_now"
]
]
},
{
"q": "_lq",
"k": "def",
"s": 150,
"e": 154,
"doc": "",
"n": "An `animLayer` query that returns `None` instead of raising.",
"c": [],
"b": [
[
7,
"layer_curve_map"
],
[
7,
"selected_layers"
],
[
7,
"resolve_edit_layer"
],
[
7,
"layer_curve_for"
],
[
7,
"_plug_in_layer"
],
[
7,
"ensure_curve"
]
]
},
{
"q": "root_layer",
"k": "def",
"s": 157,
"e": 161,
"doc": "",
"n": "The BaseAnimation layer, or `None` when the scene has no layers.",
"c": [],
"b": [
[
7,
"anim_layers"
],
[
7,
"layer_curve_map"
],
[
7,
"ensure_curve"
]
]
},
{
"q": "anim_layers",
"k": "def",
"s": 164,
"e": 168,
"doc": "",
"n": "All layers, BaseAnimation first.",
"c": [
[
7,
"root_layer"
]
],
"b": [
[
7,
"layer_curve_map"
],
[
7,
"selected_layers"
],
[
7,
"resolve_edit_layer"
],
[
11,
"FlowTrailUI._refresh_layers"
]
]
},
{
"q": "layer_curve_map",
"k": "def",
"s": 171,
"e": 180,
"doc": "Returns (root_layer, {curve: layer}).",
"n": "Which layer every curve belongs to.",
"c": [
[
7,
"root_layer"
],
[
7,
"_lq"
],
[
7,
"anim_layers"
]
],
"b": [
[
6,
"Manager.register_curves"
],
[
6,
"Manager.process_now"
]
]
},
{
"q": "selected_layers",
"k": "def",
"s": 183,
"e": 184,
"doc": "",
"n": "Layers selected in the Animation Layer editor.",
"c": [
[
7,
"_lq"
],
[
7,
"anim_layers"
]
],
"b": [
[
7,
"resolve_edit_layer"
]
]
},
{
"q": "resolve_edit_layer",
"k": "def",
"s": 187,
"e": 196,
"doc": "Layer that edits go to. None when the scene has no animation layers.",
"n": "Which layer edits go to. \"Auto\" follows what the animator selected in the layer editor (the last unlocked one, preferring a real layer over BaseAnimation); a fixed choice is used if it still exists.",
"c": [
[
7,
"anim_layers"
],
[
7,
"_lq"
],
[
7,
"selected_layers"
]
],
"b": [
[
6,
"Manager.refresh_edit_layer"
]
]
},
{
"q": "layer_weight",
"k": "def",
"s": 199,
"e": 204,
"doc": "",
"n": "A layer's weight, treating 0 as 1 to avoid dividing by zero.",
"c": [],
"b": [
[
7,
"ensure_curve"
]
]
},
{
"q": "muted",
"k": "def",
"s": 207,
"e": 218,
"doc": "Temporarily mute a layer (not recorded in undo).",
"n": "Context manager that mutes a layer temporarily, outside undo (used to draw the \"ghost\": the motion without that layer).",
"c": [],
"b": [
[
6,
"Manager._fill"
]
]
},
{
"q": "curves_on_layer",
"k": "def",
"s": 221,
"e": 224,
"doc": "",
"n": "Only the curves that belong to one layer.",
"c": [],
"b": [
[
6,
"Manager.edit_curves"
]
]
},
{
"q": "has_key",
"k": "def",
"s": 230,
"e": 231,
"doc": "",
"n": "True if the curve has a key exactly at `t`.",
"c": [],
"b": [
[
7,
"keys_at"
],
[
7,
"set_value"
],
[
7,
"ensure_curve"
],
[
7,
"PathEdit.prepare"
],
[
7,
"PathEdit.apply"
],
[
7,
"match_loop_tangents"
],
[
7,
"tween"
]
]
},
{
"q": "keys_at",
"k": "def",
"s": 234,
"e": 235,
"doc": "",
"n": "The curves that have a key at `t`.",
"c": [
[
7,
"has_key"
]
],
"b": [
[
7,
"retime"
],
[
7,
"set_tangents"
]
]
},
{
"q": "curve_value",
"k": "def",
"s": 238,
"e": 240,
"doc": "",
"n": "The curve's evaluated value at `t` (between keys too).",
"c": [],
"b": [
[
7,
"TranslateEdit.prepare"
],
[
7,
"PathEdit.apply"
],
[
7,
"match_loop_tangents"
],
[
7,
"tween"
]
]
},
{
"q": "set_value",
"k": "def",
"s": 243,
"e": 247,
"doc": "",
"n": "Sets the value at `t`: edits the existing key or creates one.",
"c": [
[
7,
"has_key"
]
],
"b": [
[
7,
"TranslateEdit.apply"
]
]
},
{
"q": "plug_source",
"k": "def",
"s": 250,
"e": 259,
"doc": "",
"n": "What drives a plug: nothing, a plain curve, a layer blend, or something else (driven).",
"c": [],
"b": [
[
7,
"ensure_curve"
]
]
},
{
"q": "layer_curve_for",
"k": "def",
"s": 262,
"e": 264,
"doc": "",
"n": "The curve of a plug on a given layer.",
"c": [
[
7,
"_lq"
]
],
"b": [
[
7,
"ensure_curve"
]
]
},
{
"q": "_plug_in_layer",
"k": "def",
"s": 267,
"e": 275,
"doc": "",
"n": "Whether a plug is already a member of a layer, comparing both long and short attribute names and full node paths.",
"c": [
[
7,
"_lq"
]
],
"b": [
[
7,
"ensure_curve"
]
]
},
{
"q": "ensure_curve",
"k": "def",
"s": 278,
"e": 319,
"doc": "Curve to edit for `plug` on `layer`, with a key at `t` (shape preserved).\nCreates the curve if needed, seeding keys at `seeds` so the rest of the\nanimation doesn't change. Returns (curve, weight, created) or (None,..).",
"n": "Gets the curve to edit for one channel on one layer, ready with a key at `t`. If there is no curve yet, it creates one and also keys the **seed** frames with their current values, so adding a key at `t` does not change the animation elsewhere. Locked or driven channels return `None`. Also returns the layer weight to divide edits by.",
"c": [
[
7,
"plug_source"
],
[
7,
"root_layer"
],
[
7,
"has_key"
],
[
7,
"_plug_in_layer"
],
[
7,
"layer_curve_for"
],
[
7,
"_lq"
],
[
7,
"layer_weight"
]
],
"b": [
[
7,
"TranslateEdit.prepare"
],
[
7,
"PathEdit.prepare"
]
]
},
{
"q": "TranslateEdit",
"k": "class",
"s": 322,
"e": 356,
"doc": "Adds a parent-space translate offset at one frame, on one layer.",
"n": "Moves a control in parent space at one frame, on one layer: what happens when you drag a single trail point.",
"c": [],
"b": [
[
10,
"_begin_move"
]
]
},
{
"q": "TranslateEdit.__init__",
"k": "def",
"s": 327,
"e": 334,
"doc": "",
"n": "Stores the node, frame, layer and seed frames.",
"c": [],
"b": []
},
{
"q": "TranslateEdit.prepare",
"k": "def",
"s": 336,
"e": 347,
"doc": "",
"n": "Gets a ready curve for translate X, Y and Z and remembers each starting value. Channels that cannot be edited are listed in `failed`.",
"c": [
[
7,
"curve_value"
],
[
7,
"ensure_curve"
]
],
"b": [
[
7,
"TranslateEdit.apply"
]
]
},
{
"q": "TranslateEdit.curves",
"k": "def",
"s": 349,
"e": 350,
"doc": "",
"n": "The curves being edited.",
"c": [],
"b": []
},
{
"q": "TranslateEdit.apply",
"k": "def",
"s": 352,
"e": 356,
"doc": "",
"n": "Sets each axis to its starting value plus the drag offset divided by the layer weight. Called on every mouse move with the total offset, so the result never accumulates error.",
"c": [
[
7,
"TranslateEdit.prepare"
],
[
7,
"set_value"
]
],
"b": []
},
{
"q": "PathEdit",
"k": "class",
"s": 359,
"e": 431,
"doc": "Adds parent-space translate offsets over many frames, on one layer. The\nstart and end frames get a key but keep their value, and optionally their\ntangents, so the animation outside the edit (and a loop seam) stays as is.",
"n": "Moves a control over a range of frames (reshaping an arc). The first and last frames get keys but keep their values, and optionally their tangents, so nothing outside the edit changes and a loop seam stays intact.",
"c": [],
"b": [
[
6,
"Manager.apply_path"
],
[
14,
"Flow.setUp"
],
[
14,
"Flow.tearDown"
]
]
},
{
"q": "PathEdit.__init__",
"k": "def",
"s": 368,
"e": 377,
"doc": "",
"n": "Stores the node, layer and range.",
"c": [],
"b": []
},
{
"q": "PathEdit.prepare",
"k": "def",
"s": 379,
"e": 394,
"doc": "",
"n": "Gets ready curves with keys at both ends and records the end tangents if they are locked.",
"c": [
[
7,
"PathEdit._read_tangent"
],
[
7,
"has_key"
],
[
7,
"ensure_curve"
]
],
"b": []
},
{
"q": "PathEdit.curves",
"k": "def",
"s": 396,
"e": 397,
"doc": "",
"n": "The curves being edited.",
"c": [],
"b": [
[
7,
"PathEdit.key_count"
]
]
},
{
"q": "PathEdit._read_tangent",
"k": "def",
"s": 399,
"e": 407,
"doc": "",
"n": "The in/out angle (and weight on weighted curves) of one key.",
"c": [],
"b": [
[
7,
"PathEdit.prepare"
]
]
},
{
"q": "PathEdit.key_count",
"k": "def",
"s": 409,
"e": 413,
"doc": "Most keys on any axis inside the edit.",
"n": "The largest number of keys any axis has inside the range.",
"c": [
[
7,
"PathEdit.curves"
]
],
"b": []
},
{
"q": "PathEdit.apply",
"k": "def",
"s": 415,
"e": 431,
"doc": "deltas: {time: (x, y, z)} in UI units, as seen after the layer weight.",
"n": "Adds the wanted offsets at the given frames. It inserts any missing keys, **reads every value first**, then writes (each write would change the in-between values the next read sees), sets new keys to spline, and restores the locked end tangents.",
"c": [
[
7,
"curve_value"
],
[
7,
"has_key"
]
],
"b": []
},
{
"q": "match_loop_tangents",
"k": "def",
"s": 434,
"e": 454,
"doc": "Same slope leaving the first key and arriving at the last one, so a loop\ndoesn't change speed at the seam. Only for curves that really loop.\nReturns (matched curves, curves whose ends have different values).",
"n": "For curves whose first and last values match: averages the slope leaving the first key and arriving at the last one and applies it to both, so the loop does not change speed at the seam. Curves whose ends differ are reported instead.",
"c": [
[
7,
"curve_value"
],
[
7,
"has_key"
]
],
"b": [
[
6,
"Manager.make_loop_seamless"
]
]
},
{
"q": "retime",
"k": "def",
"s": 457,
"e": 463,
"doc": "",
"n": "Moves the keys at one time to another time on every curve that has a key there.",
"c": [
[
7,
"keys_at"
]
],
"b": [
[
6,
"Manager.nudge"
],
[
10,
"_release"
]
]
},
{
"q": "tween",
"k": "def",
"s": 466,
"e": 483,
"doc": "factor -1 (previous key) .. 0 (half way) .. 1 (next key).",
"n": "Favor / breakdown: puts the keys at `times` between the surrounding **other** keys, from -1 (previous) through 0 (halfway) to 1 (next). The frames being tweened are removed from the neighbor list first, so a key never counts as its own neighbor.",
"c": [
[
7,
"curve_value"
],
[
7,
"has_key"
]
],
"b": [
[
6,
"Manager.tween"
]
]
},
{
"q": "set_tangents",
"k": "def",
"s": 486,
"e": 494,
"doc": "",
"n": "Sets the tangent type of the keys at given times (step only changes the out tangent).",
"c": [
[
7,
"keys_at"
]
],
"b": [
[
6,
"Manager.set_tangents"
]
]
},
{
"q": "undo_chunk",
"k": "def",
"s": 497,
"e": 506,
"doc": "",
"n": "Context manager for a named undo chunk, with a fallback for Maya versions without chunk names.",
"c": [],
"b": [
[
1,
"favor"
],
[
6,
"Manager.nudge"
],
[
6,
"Manager.set_tangents"
],
[
6,
"Manager.commit_proposed"
],
[
6,
"Manager.apply_path"
],
[
6,
"Manager.make_loop_seamless"
],
[
11,
"FlowTrailUI._tween_click"
]
]
}
],
"lines": {
"21": "Node types that only pass values through; the search continues behind them to find the real curves.",
"22": "Infinity modes cycle, cycleRelative and oscillate: a change anywhere repeats everywhere.",
"142": "Two keys on each side: spline and auto tangents depend on neighbors, so their curves change too.",
"195": "Prefer a real layer over BaseAnimation when both are selected.",
"310": "New curve on an additive layer: seed with 0 (no change). On BaseAnimation or an override layer: seed with the current value.",
"423": "Read all values before changing any: each key edit changes the curve around it.",
"449": "Average the slopes (tangent of the angle), not the angles themselves, then convert back to an angle.",
"470": "The frames being tweened are not their own neighbors."
}
},
{
"path": "flowtrail/reshape.py",
"lang": "py",
"note": "The path math for reshaping arcs: smoothing, matching a hand-drawn stroke, keeping keys pinned, keeping spacing, and choosing as few keys as possible. Pure Python with no Maya, tested in `tests/test_reshape.py`.",
"code": "# -*- coding: utf-8 -*-\n\"\"\"\nPath reshaping maths: smoothing, hand-drawn strokes, pins and key reduction.\n\nPure python with no Maya imports, so it can be tested outside of Maya\n(see tests/test_reshape.py). Points are plain tuples of 2 or 3 floats.\n\"\"\"\nfrom __future__ import absolute_import, division, print_function\n\nimport bisect\nimport math\n\nSPACING_KEEP = 'keep'       # every frame keeps its share of the path\nSPACING_EVEN = 'even'       # same distance between all frames\nSPACING_FREE = 'free'       # whatever the smoothing gives (smooths speed too)\n\nSTROKE_CLOSED_GAP = 0.05    # a stroke with a smaller gap (share of its length) is a loop\nMIN_WAVE = 4.0              # samples: the lightest smoothing removes waves up to this\n\n\ndef dist(a, b):\n    return math.sqrt(sum((x - y) ** 2 for x, y in zip(a, b)))\n\n\ndef lerp(a, b, f):\n    return tuple(x + (y - x) * f for x, y in zip(a, b))\n\n\ndef arc_lengths(points):\n    out = [0.0]\n    for a, b in zip(points[:-1], points[1:]):\n        out.append(out[-1] + dist(a, b))\n    return out\n\n\ndef point_at(points, cum, s):\n    \"\"\"Point at arc length s along a polyline (cum = arc_lengths(points)).\"\"\"\n    if s <= 0.0:\n        return points[0]\n    if s >= cum[-1]:\n        return points[-1]\n    i = bisect.bisect_right(cum, s) - 1\n    return lerp(points[i], points[i + 1], (s - cum[i]) / (cum[i + 1] - cum[i]))\n\n\ndef is_closed(points, tol=0.01):\n    \"\"\"True when the path comes back to its start (a loop).\"\"\"\n    if len(points) < 4:\n        return False\n    length = arc_lengths(points)[-1]\n    return length > 1e-9 and dist(points[0], points[-1]) <= tol * length\n\n\n# ---------------------------------------------------------------------------\n# smoothing\n# ---------------------------------------------------------------------------\ndef _gain(m, cutoff):\n    \"\"\"1 up to half the cutoff, then a soft fade: avoids ringing on the path.\"\"\"\n    f = m / cutoff\n    if f <= 0.5:\n        return 1.0\n    return math.cos(math.pi * (f - 0.5)) ** 2 if f < 1.0 else 0.0\n\n\ndef _lowpass_closed(v, cutoff):\n    \"\"\"Fourier series of a periodic signal, keeping the slow harmonics.\"\"\"\n    n = len(v)\n    cos_t = [math.cos(2.0 * math.pi * i / n) for i in range(n)]\n    sin_t = [math.sin(2.0 * math.pi * i / n) for i in range(n)]\n    mean = sum(v) / n\n    out = [mean] * n\n    for m in range(1, min(int(math.ceil(cutoff)), n // 2 + 1)):\n        g = _gain(m, cutoff) * 2.0 / n\n        if g <= 0.0:\n            continue\n        a = sum(x * cos_t[(m * i) % n] for i, x in enumerate(v)) * g\n        b = sum(x * sin_t[(m * i) % n] for i, x in enumerate(v)) * g\n        for i in range(n):\n            out[i] += a * cos_t[(m * i) % n] + b * sin_t[(m * i) % n]\n    return out\n\n\ndef _lowpass_open(v, cutoff):\n    \"\"\"Sine series on top of the straight line between the ends: ends stay put.\"\"\"\n    last = len(v) - 1\n    line = [v[0] + (v[-1] - v[0]) * i / float(last) for i in range(last + 1)]\n    rest = [x - y for x, y in zip(v, line)]\n    sin_t = [math.sin(math.pi * i / last) for i in range(2 * last)]\n    out = list(line)\n    for m in range(1, min(int(math.ceil(cutoff)), last)):\n        g = _gain(m, cutoff) * 2.0 / last\n        if g <= 0.0:\n            continue\n        b = sum(x * sin_t[(m * i) % (2 * last)] for i, x in enumerate(rest)) * g\n        for i in range(last + 1):\n            out[i] += b * sin_t[(m * i) % (2 * last)]\n    return out\n\n\ndef lowpass(points, strength, closed=False):\n    \"\"\"\n    Removes wobble without shrinking the arcs, which is what plain averaging\n    does. strength sets the shortest wave that survives, on a log scale:\n    0 keeps everything, 1 keeps only the big shape of the path. A closed path\n    wraps around: its last point duplicates the first.\n    \"\"\"\n    strength = max(0.0, min(1.0, strength))\n    if strength <= 0.0 or len(points) < 4:\n        return list(points)\n    pts = points[:-1] if closed else points\n    count = len(pts) if closed else len(pts) - 1\n    harmonics_per_wave = 1.0 if closed else 2.0\n    longest = count * harmonics_per_wave / (2.0 if closed else 3.0)\n    wave = MIN_WAVE * (max(longest, MIN_WAVE) / MIN_WAVE) ** strength\n    cutoff = count * harmonics_per_wave / wave\n    filt = _lowpass_closed if closed else _lowpass_open\n    axes = [filt([p[d] for p in pts], cutoff) for d in range(len(pts[0]))]\n    out = list(zip(*axes))\n    return out + [out[0]] if closed else out\n\n\ndef _falloff(x, width):\n    return 0.5 * (1.0 + math.cos(math.pi * x / width)) if x < width else 0.0\n\n\ndef pin_correct(new, orig, pins):\n    \"\"\"\n    Puts the pinned indices back on their original position. Each pin's error\n    fades out smoothly on both sides, gone half way to the next pin, so the\n    middle of the path stays as it was solved. pins must include both ends.\n    \"\"\"\n    out = list(new)\n    pins = sorted(set(pins))\n    for a, b in zip(pins[:-1], pins[1:]):\n        width = (b - a) * 0.5\n        ra = [n - o for n, o in zip(new[a], orig[a])]\n        rb = [n - o for n, o in zip(new[b], orig[b])]\n        for i in range(a, b + 1):\n            fa, fb = _falloff(i - a, width), _falloff(b - i, width)\n            out[i] = tuple(n - x * fa - y * fb for n, x, y in zip(new[i], ra, rb))\n    for i in pins:\n        out[i] = tuple(orig[i])\n    return out\n\n\ndef spacing_params(points, mode=SPACING_KEEP):\n    \"\"\"0..1 position of every frame along a path.\"\"\"\n    n = len(points) - 1\n    if n < 1:\n        return [0.0]\n    cum = arc_lengths(points)\n    if mode == SPACING_EVEN or cum[-1] < 1e-9:\n        return [i / float(n) for i in range(n + 1)]\n    return [c / cum[-1] for c in cum]\n\n\ndef respace(new, orig, pins, mode=SPACING_KEEP):\n    \"\"\"Slides the frames along the new path, between pins, to set the spacing.\"\"\"\n    if mode == SPACING_FREE:\n        return list(new)\n    out = list(new)\n    pins = sorted(set(pins))\n    for a, b in zip(pins[:-1], pins[1:]):\n        if b - a < 2:\n            continue\n        if mode == SPACING_KEEP and arc_lengths(orig[a:b + 1])[-1] < 1e-9:\n            continue    # a hold: stays a hold\n        seg = new[a:b + 1]\n        cum = arc_lengths(seg)\n        for i, u in enumerate(spacing_params(orig[a:b + 1], mode)):\n            out[a + i] = point_at(seg, cum, u * cum[-1])\n    return out\n\n\ndef smooth_path(points, strength, pins=None, spacing=SPACING_KEEP):\n    \"\"\"\n    Smooths a path, keeping the pins exactly where they are. Loops are\n    filtered across the seam, so a kink at the start/end frame gets rounded\n    even though that frame doesn't move. Returns (points, closed).\n    \"\"\"\n    last = len(points) - 1\n    pins = sorted(set(list(pins or []) + [0, last]))\n    closed = is_closed(points)\n    free = lowpass(points, strength, closed)\n    return respace(pin_correct(free, points, pins), points, pins, spacing), closed\n\n\n# ---------------------------------------------------------------------------\n# hand drawn strokes\n# ---------------------------------------------------------------------------\ndef clean_stroke(stroke, smooth=0.5, spacing=4.0, max_points=400):\n    \"\"\"Evenly resampled and smoothed copy of a raw mouse stroke (pixels).\"\"\"\n    pts = [tuple(stroke[0])]\n    for p in stroke[1:]:\n        if dist(p, pts[-1]) > 1e-3:\n            pts.append(tuple(p))\n    if len(pts) < 2:\n        return pts\n    cum = arc_lengths(pts)\n    n = max(2, min(max_points, int(cum[-1] / spacing)))\n    even = [point_at(pts, cum, cum[-1] * i / float(n)) for i in range(n + 1)]\n    closed = len(even) > 3 and dist(even[0], even[-1]) <= STROKE_CLOSED_GAP * cum[-1]\n    if closed:      # hand drawn loops rarely close exactly\n        even[-1] = even[0]\n    return lowpass(even, 0.8 * smooth, closed)\n\n\ndef sample_stroke(stroke, params):\n    cum = arc_lengths(stroke)\n    return [point_at(stroke, cum, u * cum[-1]) for u in params]\n\n\ndef _passes(distances, slack):\n    \"\"\"Nearest frame of each separate time the trail passes under a point.\"\"\"\n    limit = min(distances) + slack\n    out, best = [], None\n    for i, d in enumerate(distances):\n        if d <= limit:\n            if best is None or d < distances[best]:\n                best = i\n        elif best is not None:\n            out.append(best)\n            best = None\n    if best is not None:\n        out.append(best)\n    return out\n\n\ndef pick_span(start, end, frames_xy, slack=12.0):\n    \"\"\"\n    Which part of the trail a stroke replaces: (first, last) frame index, or\n    None. Each end snaps to the nearest frame, so a stroke started on a key\n    keeps that key. Where the trail passes under a point more than once, it\n    takes the widest span: drawing from a loop's seam back to the seam\n    replaces the whole loop.\n    \"\"\"\n    if len(frames_xy) < 2:\n        return None\n    at_start = _passes([dist(start, p) for p in frames_xy], slack)\n    at_end = _passes([dist(end, p) for p in frames_xy], slack)\n    a, b = at_start[0], at_end[-1]\n    if a > b:   # drawn against time\n        a, b = at_end[0], at_start[-1]\n    return (a, b) if a < b else None\n\n\ndef stroke_is_forward(stroke, frames_xy, samples=16):\n    \"\"\"False when the stroke was drawn in the opposite direction of time.\"\"\"\n    params = [i / float(samples) for i in range(samples + 1)]\n    pts = sample_stroke(stroke, params)\n    trail = sample_stroke(frames_xy, params)\n    forward = sum(dist(a, b) for a, b in zip(pts, trail))\n    backward = sum(dist(a, b) for a, b in zip(reversed(pts), trail))\n    return forward <= backward\n\n\n# ---------------------------------------------------------------------------\n# key reduction\n# ---------------------------------------------------------------------------\ndef choose_frames(times, deltas, required, tol):\n    \"\"\"\n    Fewest frames so that interpolating the offset between them stays within\n    tol of the wanted offset. Always keeps `required` (ends, existing keys).\n    \"\"\"\n    index = dict((t, i) for i, t in enumerate(times))\n    keep = set(index[t] for t in required if t in index)\n    keep.update((0, len(times) - 1))\n    ordered = sorted(keep)\n    stack = list(zip(ordered[:-1], ordered[1:]))\n    while stack:\n        a, b = stack.pop()\n        if b - a < 2:\n            continue\n        worst, worst_err = None, tol\n        for i in range(a + 1, b):\n            f = (times[i] - times[a]) / (times[b] - times[a])\n            err = dist(deltas[i], lerp(deltas[a], deltas[b], f))\n            if err > worst_err:\n                worst, worst_err = i, err\n        if worst is not None:\n            keep.add(worst)\n            stack.append((a, worst))\n            stack.append((worst, b))\n    return [times[i] for i in sorted(keep)]\n\n\ndef worst_frames(times, errors, tol, have):\n    \"\"\"Frames to add after a pass: the worst frame of each run over tol.\"\"\"\n    out = []\n    best = None\n    for t, e in zip(times, errors):\n        if e > tol:\n            if best is None or e > best[0]:\n                best = (e, t)\n        elif best is not None:\n            out.append(best[1])\n            best = None\n    if best is not None:\n        out.append(best[1])\n    return [t for t in out if t not in have]\n\n\ndef delta_at(t, times, deltas):\n    \"\"\"Offset at any time (keys between samples follow their neighbours).\"\"\"\n    i = bisect.bisect_left(times, t)\n    if i <= 0:\n        return deltas[0]\n    if i >= len(times):\n        return deltas[-1]\n    return lerp(deltas[i - 1], deltas[i], (t - times[i - 1]) / (times[i] - times[i - 1]))",
"aliases": {
"absolute_import": "__future__.absolute_import",
"division": "__future__.division",
"print_function": "__future__.print_function",
"bisect": "bisect",
"math": "math"
},
"outline": [
{
"q": "dist",
"k": "def",
"s": 21,
"e": 22,
"doc": "",
"n": "Distance between two points (2D or 3D).",
"c": [],
"b": [
[
6,
"Manager.apply_path"
],
[
8,
"arc_lengths"
],
[
8,
"is_closed"
],
[
8,
"clean_stroke"
],
[
8,
"pick_span"
],
[
8,
"stroke_is_forward"
],
[
8,
"choose_frames"
],
[
13,
"Spacing.test_even_spacing"
],
[
14,
"Flow.test_brush_only_touches_where_painted"
]
]
},
{
"q": "lerp",
"k": "def",
"s": 25,
"e": 26,
"doc": "",
"n": "Point between `a` and `b` at fraction `f`.",
"c": [],
"b": [
[
8,
"point_at"
],
[
8,
"choose_frames"
],
[
8,
"delta_at"
],
[
10,
"_drag_brush"
]
]
},
{
"q": "arc_lengths",
"k": "def",
"s": 29,
"e": 33,
"doc": "",
"n": "Running distance along a polyline: `[0, d1, d1+d2, ...]`. Many functions use it to place things \"at 40% of the path\".",
"c": [
[
8,
"dist"
]
],
"b": [
[
6,
"Manager.apply_path"
],
[
8,
"is_closed"
],
[
8,
"spacing_params"
],
[
8,
"respace"
],
[
8,
"clean_stroke"
],
[
8,
"sample_stroke"
],
[
13,
"Strokes.test_hand_wobble_is_removed_keeping_size_and_ends"
]
]
},
{
"q": "point_at",
"k": "def",
"s": 36,
"e": 43,
"doc": "Point at arc length s along a polyline (cum = arc_lengths(points)).",
"n": "The point at a given distance along a polyline. `bisect` finds the segment quickly in the sorted running distances, then it interpolates inside that segment.",
"c": [
[
8,
"lerp"
]
],
"b": [
[
8,
"respace"
],
[
8,
"clean_stroke"
],
[
8,
"sample_stroke"
]
]
},
{
"q": "is_closed",
"k": "def",
"s": 46,
"e": 51,
"doc": "True when the path comes back to its start (a loop).",
"n": "True when the path ends where it starts (within 1% of its length): a loop.",
"c": [
[
8,
"arc_lengths"
],
[
8,
"dist"
]
],
"b": [
[
8,
"smooth_path"
]
]
},
{
"q": "_gain",
"k": "def",
"s": 57,
"e": 62,
"doc": "1 up to half the cutoff, then a soft fade: avoids ringing on the path.",
"n": "How much of each wave the smoothing keeps: everything up to half the cutoff, then a soft cosine fade to nothing. A hard cut would make the path ripple (\"ringing\").",
"c": [],
"b": [
[
8,
"_lowpass_closed"
],
[
8,
"_lowpass_open"
]
]
},
{
"q": "_lowpass_closed",
"k": "def",
"s": 65,
"e": 80,
"doc": "Fourier series of a periodic signal, keeping the slow harmonics.",
"n": "Smoothing for a **loop**: describe the path as a sum of waves that repeat around the loop (a Fourier series), keep the slow ones and drop the fast ones. Because the waves wrap around, the seam is smoothed too.",
"c": [
[
8,
"_gain"
]
],
"b": [
[
8,
"lowpass"
]
]
},
{
"q": "_lowpass_open",
"k": "def",
"s": 83,
"e": 97,
"doc": "Sine series on top of the straight line between the ends: ends stay put.",
"n": "Smoothing for an **open** path: take the straight line between the two ends, describe the difference from it as a sum of sine waves (which are 0 at both ends), keep the slow ones. The ends never move.",
"c": [
[
8,
"_gain"
]
],
"b": [
[
8,
"lowpass"
]
]
},
{
"q": "lowpass",
"k": "def",
"s": 100,
"e": 119,
"doc": "Removes wobble without shrinking the arcs, which is what plain averaging\ndoes. strength sets the shortest wave that survives, on a log scale:\n0 keeps everything, 1 keeps only the big shape of the path. A closed path\nwraps around: its last point duplicates the first.",
"n": "Removes wobble from a path **without shrinking its arcs**, which plain neighbor averaging does. Strength sets the shortest wave that survives, on a log scale. Each axis (x, y, z) is filtered separately.",
"c": [
[
8,
"_lowpass_open"
],
[
8,
"_lowpass_closed"
]
],
"b": [
[
8,
"smooth_path"
],
[
8,
"clean_stroke"
],
[
13,
"Smoothing.test_full_strength_removes_arc_bumps_but_keeps_the_arc"
],
[
13,
"Smoothing.test_big_loop_shape_survives_every_strength"
],
[
13,
"Smoothing.test_no_overshoot_ringing_on_a_sharp_corner"
],
[
13,
"Smoothing.test_zero_strength_changes_nothing"
]
]
},
{
"q": "_falloff",
"k": "def",
"s": 122,
"e": 123,
"doc": "",
"n": "Cosine falloff from 1 at distance 0 to 0 at `width`.",
"c": [],
"b": [
[
8,
"pin_correct"
]
]
},
{
"q": "pin_correct",
"k": "def",
"s": 126,
"e": 143,
"doc": "Puts the pinned indices back on their original position. Each pin's error\nfades out smoothly on both sides, gone half way to the next pin, so the\nmiddle of the path stays as it was solved. pins must include both ends.",
"n": "After smoothing, puts the **pinned** frames (keys you want to keep, and the ends) back exactly where they were. Each pin's correction fades out smoothly toward the next pin, so the rest of the new shape is kept.",
"c": [
[
8,
"_falloff"
]
],
"b": [
[
8,
"smooth_path"
],
[
10,
"_drag_soft"
],
[
10,
"_finish_sketch"
],
[
10,
"_finish_brush"
],
[
13,
"Pins.test_error_fades_and_middle_is_untouched"
]
]
},
{
"q": "spacing_params",
"k": "def",
"s": 146,
"e": 154,
"doc": "0..1 position of every frame along a path.",
"n": "Where each frame sits along the path, from 0 to 1: by real distance (keep spacing) or evenly.",
"c": [
[
8,
"arc_lengths"
]
],
"b": [
[
8,
"respace"
],
[
10,
"_finish_sketch"
],
[
13,
"Spacing.test_keep_preserves_each_frames_share_of_the_path"
],
[
14,
"Flow.test_smoothing_keeps_spacing_share"
]
]
},
{
"q": "respace",
"k": "def",
"s": 157,
"e": 172,
"doc": "Slides the frames along the new path, between pins, to set the spacing.",
"n": "Slides the frames along the new path so the **spacing** is kept from the original (your eases survive) or made even. A hold (no motion between pins) stays a hold. In \"free\" mode nothing is moved.",
"c": [
[
8,
"point_at"
],
[
8,
"spacing_params"
],
[
8,
"arc_lengths"
]
],
"b": [
[
8,
"smooth_path"
],
[
10,
"_finish_brush"
],
[
13,
"Spacing.test_holds_stay_holds"
]
]
},
{
"q": "smooth_path",
"k": "def",
"s": 175,
"e": 185,
"doc": "Smooths a path, keeping the pins exactly where they are. Loops are\nfiltered across the seam, so a kink at the start/end frame gets rounded\neven though that frame doesn't move. Returns (points, closed).",
"n": "The full smoothing step used by the Smooth button and brush: detect loop, low-pass, put pins back, fix spacing. Returns the new points and whether it was a loop.",
"c": [
[
8,
"is_closed"
],
[
8,
"lowpass"
],
[
8,
"pin_correct"
],
[
8,
"respace"
]
],
"b": [
[
6,
"Manager.preview_smooth"
],
[
13,
"Smoothing.test_removes_noise_without_shrinking_the_loop"
],
[
13,
"Smoothing.test_stronger_means_smoother"
],
[
13,
"Smoothing.test_ends_never_move"
],
[
13,
"Smoothing.test_inner_pins_never_move"
],
[
13,
"Smoothing.test_open_path_is_not_treated_as_a_loop"
],
[
13,
"Smoothing.test_loop_seam_kink_gets_rounded"
],
[
13,
"Spacing.test_keep_preserves_each_frames_share_of_the_path"
],
[
13,
"Spacing.test_even_spacing"
]
]
},
{
"q": "clean_stroke",
"k": "def",
"s": 191,
"e": 205,
"doc": "Evenly resampled and smoothed copy of a raw mouse stroke (pixels).",
"n": "Cleans a raw mouse stroke: drops duplicate points, resamples it evenly, closes it if its ends nearly touch (hand-drawn loops rarely close exactly), and smooths it a little.",
"c": [
[
8,
"dist"
],
[
8,
"arc_lengths"
],
[
8,
"point_at"
],
[
8,
"lowpass"
]
],
"b": [
[
10,
"_finish_sketch"
],
[
13,
"Strokes.test_hand_wobble_is_removed_keeping_size_and_ends"
],
[
13,
"Strokes.test_stroke_drawing_a_circle_stays_a_circle"
],
[
13,
"Strokes.test_hand_drawn_loop_with_a_gap_is_closed"
],
[
13,
"Strokes.test_single_click_stroke_does_not_crash"
]
]
},
{
"q": "sample_stroke",
"k": "def",
"s": 208,
"e": 210,
"doc": "",
"n": "Points on a stroke at given 0-1 positions.",
"c": [
[
8,
"arc_lengths"
],
[
8,
"point_at"
]
],
"b": [
[
8,
"stroke_is_forward"
],
[
10,
"_finish_sketch"
],
[
13,
"Strokes.test_stroke_samples_follow_spacing"
]
]
},
{
"q": "_passes",
"k": "def",
"s": 213,
"e": 226,
"doc": "Nearest frame of each separate time the trail passes under a point.",
"n": "For one screen point: the nearest frame of **each separate time** the trail passes under it. A loop passes under its seam point twice (start and end).",
"c": [],
"b": [
[
8,
"pick_span"
]
]
},
{
"q": "pick_span",
"k": "def",
"s": 229,
"e": 244,
"doc": "Which part of the trail a stroke replaces: (first, last) frame index, or\nNone. Each end snaps to the nearest frame, so a stroke started on a key\nkeeps that key. Where the trail passes under a point more than once, it\ntakes the widest span: drawing from a loop's seam back to the seam\nreplaces the whole loop.",
"n": "Decides which part of the trail a sketched stroke replaces: from the frame nearest the stroke start to the frame nearest its end. If the trail passes there more than once, it takes the widest span, so drawing from a loop's seam back to the seam replaces the whole loop. Strokes drawn backwards in time are handled.",
"c": [
[
8,
"dist"
],
[
8,
"_passes"
]
],
"b": [
[
10,
"_finish_sketch"
],
[
13,
"Strokes.test_partial_stroke_finds_the_span"
],
[
13,
"Strokes.test_stroke_started_on_a_frame_keeps_that_frame"
],
[
13,
"Strokes.test_stroke_on_one_spot_is_no_span"
],
[
13,
"Strokes.test_stroke_over_a_whole_loop_takes_the_whole_loop"
],
[
13,
"Strokes.test_backwards_stroke"
]
]
},
{
"q": "stroke_is_forward",
"k": "def",
"s": 247,
"e": 254,
"doc": "False when the stroke was drawn in the opposite direction of time.",
"n": "Was the stroke drawn in the same direction as time? Compares the stroke with the trail both ways.",
"c": [
[
8,
"sample_stroke"
],
[
8,
"dist"
]
],
"b": [
[
10,
"_finish_sketch"
],
[
13,
"Strokes.test_backwards_stroke"
],
[
13,
"Strokes.test_backwards_stroke_on_a_loop"
]
]
},
{
"q": "choose_frames",
"k": "def",
"s": 260,
"e": 284,
"doc": "Fewest frames so that interpolating the offset between them stays within\ntol of the wanted offset. Always keeps `required` (ends, existing keys).",
"n": "Key reduction: the fewest frames such that interpolating between them stays within `tol` of the wanted offsets. It splits each segment at its worst frame until every frame is close enough (the Ramer-Douglas-Peucker idea, applied over time). Required frames (ends, existing keys) are always kept.",
"c": [
[
8,
"lerp"
],
[
8,
"dist"
]
],
"b": [
[
6,
"Manager.apply_path"
],
[
13,
"KeyReduction.test_smooth_offset_needs_few_keys"
],
[
13,
"KeyReduction.test_required_frames_are_kept"
]
]
},
{
"q": "worst_frames",
"k": "def",
"s": 287,
"e": 300,
"doc": "Frames to add after a pass: the worst frame of each run over tol.",
"n": "After writing keys and reading the real result back, the worst frame of each stretch that is still off; the adaptive mode adds keys there.",
"c": [],
"b": [
[
6,
"Manager.apply_path"
],
[
13,
"KeyReduction.test_worst_frames"
]
]
},
{
"q": "delta_at",
"k": "def",
"s": 303,
"e": 310,
"doc": "Offset at any time (keys between samples follow their neighbours).",
"n": "The offset at any time, interpolated between the sampled times.",
"c": [
[
8,
"lerp"
]
],
"b": [
[
6,
"Manager.apply_path"
],
[
13,
"KeyReduction.test_smooth_offset_needs_few_keys"
],
[
13,
"KeyReduction.test_delta_at_between_samples"
],
[
14,
"FakeScene.offset"
]
]
}
],
"lines": {
"42": "`bisect` does a binary search on the sorted running distances: the segment that contains distance `s`.",
"62": "Cosine-squared fade from 1 to 0 between half the cutoff and the cutoff.",
"76": "How much of the m-th repeating wave is in the path (its cosine part); `g` already includes the fade.",
"86": "The straight line between the ends. Only the difference from it is filtered, so the ends stay fixed.",
"114": "Log scale between the shortest wave (4 samples) and the longest the path can hold.",
"140": "Subtract each nearby pin's error, weighted by how close this frame is to that pin.",
"167": "No distance between these pins in the original: do not spread frames out.",
"242": "The stroke started near a later frame than it ended: swap.",
"269": "Segments still to check. Using a stack instead of recursion avoids recursion limits on long ranges.",
"277": "How far straight interpolation between the two kept frames is from what is wanted at frame `i`."
}
},
{
"path": "flowtrail/draw.py",
"lang": "py",
"note": "Turns a trail's cached positions into the point and color arrays the viewport plugin draws. It runs during viewport drawing, so it only uses the API (no `maya.cmds`) and does as little work as possible.",
"code": "# -*- coding: utf-8 -*-\n\"\"\"\nBuilds the arrays the VP2 draw override renders. API only - no maya.cmds,\nthis runs inside the viewport draw.\n\nStatic parts are cached per trail (rebuilt only when data, settings or the\ncurrent frame change). Live position and spacing ticks are refreshed every\ndraw because they depend on interaction / the camera.\n\"\"\"\nfrom __future__ import absolute_import, division, print_function\n\nimport math\n\nimport maya.api.OpenMaya as om\n\nRAMP = [(0.0, (0.25, 0.5, 1.0)),\n        (0.45, (0.2, 0.95, 0.55)),\n        (0.75, (1.0, 0.85, 0.2)),\n        (1.0, (1.0, 0.25, 0.2))]\n\n\ndef _mix(a, b, f):\n    return (a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f)\n\n\ndef ramp(v):\n    v = max(0.0, min(1.0, v))\n    for (p0, c0), (p1, c1) in zip(RAMP[:-1], RAMP[1:]):\n        if v <= p1:\n            return _mix(c0, c1, (v - p0) / (p1 - p0))\n    return RAMP[-1][1]\n\n\ndef _color(rgb, a=1.0):\n    return om.MColor((rgb[0], rgb[1], rgb[2], a))\n\n\ndef _is_frame(t):\n    return abs(t - round(t)) < 1e-4\n\n\ndef _points(tuples):\n    arr = om.MPointArray()\n    for p in tuples:\n        arr.append(om.MPoint(p[0], p[1], p[2]))\n    return arr\n\n\nclass Packet(object):\n\n    def __init__(self):\n        self.on_top = True\n        self.line_width = 2.0\n        self.point_size = 5.0\n        self.key_size = 10.0\n        self.lines = []                 # [(MPointArray, MColorArray)]\n        self.ghost = []                 # [MPointArray]\n        self.ghost_color = None\n        self.frames = None\n        self.frame_cols = None\n        self.keys = None\n        self.key_cols = None\n        self.sel = None\n        self.sel_color = None\n        self.current = None\n        self.current_world = None\n        self.current_color = None\n        self.live = None\n        self.live_color = None\n        self.labels = []                # [(MPoint, str)]\n        self.label_color = None\n        self.ticks = None\n        self.tick_cols = None\n        self.tick_src = []              # [(prev, p, next, MColor)]\n        self.tick_size = 1.0\n        self.preview = None             # (MPoint, label)\n        self.pick = []                  # [(t, MPoint, is_key)]\n        self.proposed = None            # reshaped path, before it's applied\n        self.proposed_color = None\n        self.stroke = None              # stroke being drawn\n        self.stroke_color = None\n\n\ndef build(mgr, trail, s, now):\n    times = mgr.visible_times()\n    if not times:\n        return None\n    pk = Packet()\n    pk.on_top = s.get('on_top')\n    pk.line_width = float(s.get('line_width'))\n    pk.point_size = float(s.get('point_size'))\n    pk.key_size = float(s.get('key_size'))\n    pk.tick_size = float(s.get('tick_size'))\n\n    base = tuple(trail.color)\n    past = _mix(base, (0.45, 0.45, 0.45), 0.6)\n    fade = s.get('fade')\n    span = max(now - times[0], times[-1] - now, 1.0)\n    xformer = mgr.display_xformer()\n    preview = trail.drag_preview\n\n    def to_display(world, t):\n        ok, m = xformer(t)\n        if not ok:\n            return None\n        p = om.MPoint(world[0], world[1], world[2])\n        return p * m if m is not None else p\n\n    disp = {}\n    for t in times:\n        w = preview.get(t) or trail.cache.get(t)\n        if w is not None:\n            p = to_display(w, t)\n            if p is not None:\n                disp[t] = p\n    if not disp:\n        return pk\n\n    frames = [t for t in times if t in disp and _is_frame(t)]\n\n    # speed (display space, units per frame)\n    speed_norm = None\n    if s.get('speed_color') and len(frames) > 1:\n        speeds = {}\n        for a, b in zip(frames[:-1], frames[1:]):\n            speeds[a] = disp[a].distanceTo(disp[b]) / max(b - a, 1e-6)\n        speeds[frames[-1]] = speeds.get(frames[-2], 0.0)\n        ordered = sorted(speeds.values())\n        top = ordered[int(0.95 * (len(ordered) - 1))] or max(ordered) or 1.0\n\n        def speed_norm(t):\n            return speeds.get(math.floor(t + 1e-4), 0.0) / top\n\n    def rgb_at(t):\n        if speed_norm is not None:\n            return ramp(speed_norm(t))\n        return past if t < now - 1e-4 else base\n\n    def alpha_at(t):\n        return 1.0 - 0.8 * min(1.0, abs(t - now) / span) if fade else 1.0\n\n    # path line, split where samples are missing\n    if s.get('show_line'):\n        seg_p, seg_c = om.MPointArray(), om.MColorArray()\n        for t in times:\n            p = disp.get(t)\n            if p is None:\n                if len(seg_p) > 1:\n                    pk.lines.append((seg_p, seg_c))\n                seg_p, seg_c = om.MPointArray(), om.MColorArray()\n                continue\n            seg_p.append(p)\n            seg_c.append(_color(rgb_at(t), alpha_at(t)))\n        if len(seg_p) > 1:\n            pk.lines.append((seg_p, seg_c))\n\n    # frame dots + spacing ticks source\n    if s.get('show_frames') or s.get('show_ticks'):\n        fp, fc = om.MPointArray(), om.MColorArray()\n        for i, t in enumerate(frames):\n            col = _color(_mix(rgb_at(t), (1.0, 1.0, 1.0), 0.3), alpha_at(t))\n            fp.append(disp[t])\n            fc.append(col)\n            if 0 < i < len(frames) - 1:\n                pk.tick_src.append((disp[frames[i - 1]], disp[t], disp[frames[i + 1]], col))\n        if s.get('show_frames'):\n            pk.frames, pk.frame_cols = fp, fc\n\n    # keys\n    keys_visible = [k for k in trail.key_times if k in disp]\n    if s.get('show_keys') and keys_visible:\n        kp, kc, sp = om.MPointArray(), om.MColorArray(), om.MPointArray()\n        main = s.get('color_key')\n        other = s.get('color_key_other')\n        edit_layer = mgr.edit_layer\n        for k in keys_visible:\n            layers = trail.key_layers.get(k, ())\n            on_edit = edit_layer is None or edit_layer in layers or \\\n                (edit_layer == mgr.layer_root and None in layers)\n            kp.append(disp[k])\n            kc.append(_color(main if on_edit else other, max(0.35, alpha_at(k))))\n            if (trail.id, k) in mgr.selected_keys:\n                sp.append(disp[k])\n        pk.keys, pk.key_cols = kp, kc\n        if len(sp):\n            pk.sel, pk.sel_color = sp, _color(s.get('color_selected'))\n\n    # labels\n    mode = s.get('labels')\n    if mode != 'none':\n        pk.label_color = _color(_mix(base, (1.0, 1.0, 1.0), 0.6))\n        src = frames if mode == 'all' else keys_visible\n        for t in src:\n            pk.labels.append((disp[t], ' %d' % int(round(t))))\n\n    # current frame\n    now_k = round(round(now), 4)\n    if now_k in disp:\n        pk.current = disp[now_k]\n        pk.current_world = trail.cache.get(now_k)\n        pk.current_color = _color(s.get('color_current'))\n    pk.live_color = _color(s.get('color_live'))\n\n    # ghost (layer comparison)\n    if trail.ghost:\n        pk.ghost_color = _color(s.get('color_ghost'), 0.8)\n        seg = om.MPointArray()\n        for t in times:\n            w = trail.ghost.get(t)\n            p = to_display(w, t) if w is not None else None\n            if p is None:\n                if len(seg) > 1:\n                    pk.ghost.append(seg)\n                seg = om.MPointArray()\n                continue\n            seg.append(p)\n        if len(seg) > 1:\n            pk.ghost.append(seg)\n\n    # retime preview\n    rp = trail.retime_preview\n    if rp and rp[1] in disp:\n        pk.preview = (disp[rp[1]], ' %d > %d' % (int(rp[0]), int(rp[1])))\n\n    keyset = set(keys_visible)\n    pk.pick = [(t, disp[t], t in keyset) for t in frames]\n    pk.pick.extend((k, disp[k], True) for k in keys_visible if not _is_frame(k))\n    return pk\n\n\ndef dynamic(pk, trail, s, view_dir, view_pos):\n    \"\"\"Per-draw parts: live position, camera facing ticks, reshape previews.\"\"\"\n    pk.proposed = _points(p for _, p in trail.proposed) if trail.proposed else None\n    pk.proposed_color = _color(s.get('color_selected'))\n    pk.stroke = _points(trail.stroke) if len(trail.stroke) > 1 else None\n    pk.stroke_color = _color(s.get('color_current'))\n\n    pk.live = None\n    if s.get('show_live') and pk.current_world is not None:\n        live = trail.live_point()\n        if live is not None:\n            cw = pk.current_world\n            if live.distanceTo(om.MPoint(cw[0], cw[1], cw[2])) > 1e-3:\n                pk.live = live\n\n    pk.ticks = None\n    if s.get('show_ticks') and pk.tick_src and view_dir is not None:\n        vd = om.MVector(view_dir[0], view_dir[1], view_dir[2])\n        eye = om.MPoint(view_pos[0], view_pos[1], view_pos[2]) if view_pos else None\n        tp, tc = om.MPointArray(), om.MColorArray()\n        for prev, p, nxt, col in pk.tick_src:\n            side = (nxt - prev) ^ vd\n            if side.length() < 1e-9:\n                continue\n            side.normalize()\n            dist = eye.distanceTo(p) if eye is not None else 100.0\n            side *= dist * 0.012 * pk.tick_size\n            tp.append(p + side)\n            tp.append(p - side)\n            tc.append(col)\n            tc.append(col)\n        if len(tp):\n            pk.ticks, pk.tick_cols = tp, tc",
"aliases": {
"absolute_import": "__future__.absolute_import",
"division": "__future__.division",
"print_function": "__future__.print_function",
"math": "math",
"om": "maya.api.OpenMaya"
},
"outline": [
{
"q": "_mix",
"k": "def",
"s": 22,
"e": 23,
"doc": "",
"n": "Blend between two colors.",
"c": [],
"b": [
[
9,
"ramp"
],
[
9,
"build"
]
]
},
{
"q": "ramp",
"k": "def",
"s": 26,
"e": 31,
"doc": "",
"n": "Speed color: maps 0 to 1 onto blue → green → yellow → red, using the stops in `RAMP`.",
"c": [
[
9,
"_mix"
]
],
"b": [
[
9,
"build.rgb_at"
]
]
},
{
"q": "_color",
"k": "def",
"s": 34,
"e": 35,
"doc": "",
"n": "An `MColor` from RGB and alpha.",
"c": [],
"b": [
[
9,
"build"
],
[
9,
"dynamic"
]
]
},
{
"q": "_is_frame",
"k": "def",
"s": 38,
"e": 39,
"doc": "",
"n": "True for whole frames (sub-frame samples are only for a smoother line).",
"c": [],
"b": [
[
9,
"build"
]
]
},
{
"q": "_points",
"k": "def",
"s": 42,
"e": 46,
"doc": "",
"n": "A list of tuples as an `MPointArray`, the type the viewport draws.",
"c": [],
"b": [
[
9,
"dynamic"
]
]
},
{
"q": "Packet",
"k": "class",
"s": 49,
"e": 81,
"doc": "",
"n": "Everything needed to draw one trail: lines, frame dots, keys, selected keys, current frame, labels, ghost, ticks, previews, and pick points for clicking. The plugin only reads it.",
"c": [],
"b": [
[
9,
"build"
]
]
},
{
"q": "Packet.__init__",
"k": "def",
"s": 51,
"e": 81,
"doc": "",
"n": "Every field starts empty; `build` and `dynamic` fill what is needed.",
"c": [],
"b": []
},
{
"q": "build",
"k": "def",
"s": 84,
"e": 228,
"doc": "",
"n": "Builds the parts that only change when the data, the settings or the current frame change (so they can be cached): the path line (split where samples are missing), frame dots, keys (yellow on the layer being edited, grey on other layers, cyan when selected), labels, the current frame, the ghost of another layer, the retime preview, and the points the edit tool can click. Positions go through `display_xformer` so the trail can be shown in world, camera or object space.",
"c": [
[
9,
"Packet"
],
[
9,
"_mix"
],
[
9,
"build.to_display"
],
[
9,
"_is_frame"
],
[
9,
"build.alpha_at"
],
[
9,
"build.rgb_at"
],
[
9,
"_color"
]
],
"b": [
[
6,
"Manager.packet"
]
]
},
{
"q": "build.to_display",
"k": "def",
"s": 102,
"e": 107,
"doc": "",
"n": "Moves a world position into the chosen display space at time `t`.",
"c": [],
"b": [
[
9,
"build"
]
]
},
{
"q": "build.speed_norm",
"k": "def",
"s": 131,
"e": 132,
"doc": "",
"n": "Speed of the frame relative to the fast end of the shot (95th percentile, so one spike does not wash out the colors).",
"c": [],
"b": [
[
9,
"build.rgb_at"
]
]
},
{
"q": "build.rgb_at",
"k": "def",
"s": 134,
"e": 137,
"doc": "",
"n": "Trail color at time `t`: speed color, or a dimmer color for the past and the trail color for the future.",
"c": [
[
9,
"build.speed_norm"
],
[
9,
"ramp"
]
],
"b": [
[
9,
"build"
]
]
},
{
"q": "build.alpha_at",
"k": "def",
"s": 139,
"e": 140,
"doc": "",
"n": "Fade with distance from the current frame, if fading is on.",
"c": [],
"b": [
[
9,
"build"
]
]
},
{
"q": "dynamic",
"k": "def",
"s": 231,
"e": 263,
"doc": "Per-draw parts: live position, camera facing ticks, reshape previews.",
"n": "Parts recomputed on every draw because they depend on the camera or on interaction: the reshape preview and stroke, the live position (red dot when the control was moved but not keyed), and the spacing ticks, which are drawn sideways to the path **as seen from the camera** (path direction crossed with the view direction).",
"c": [
[
9,
"_points"
],
[
9,
"_color"
]
],
"b": [
[
6,
"Manager.packet"
]
]
}
],
"lines": {
"129": "Normalize by the 95th percentile speed, not the maximum, so one very fast frame does not make everything else look blue.",
"178": "Keys on the layer you are editing are drawn in the main key color; keys that live only on other layers are grey.",
"252": "`^` between `MVector`s is the cross product: perpendicular to both the path direction and the view direction, so the tick always faces the camera.",
"257": "Scale the tick with distance from the camera so it keeps the same size on screen."
}
},
{
"path": "flowtrail/edit_tool.py",
"lang": "py",
"note": "The viewport tool: a Maya `draggerContext` that turns mouse press, drag and release into trail edits (move a pose, retime a key, select keys, sketch a path, brush-smooth). The docstring at the top is the user guide.",
"code": "# -*- coding: utf-8 -*-\n\"\"\"\nViewport edit tool.\n\n  click            go to that frame + select the control\n  drag             move the pose at that frame (creates a key on in-betweens)\n                   -> this is how you fix arcs and spacing directly\n  ctrl + drag key  slide the key in time along the trail (retime)\n  shift + click    add / remove a key from the trail key selection\n  click empty      clear the key selection\n\nSketch mode        draw the path by hand, over the part of the trail to replace\nBrush mode         paint over the trail to smooth it where you paint\n\nReshaping never moves the first and last frame of the edit.\n\"\"\"\nfrom __future__ import absolute_import, division, print_function\n\nimport math\nimport traceback\n\nfrom maya import cmds\nimport maya.api.OpenMaya as om\nimport maya.api.OpenMayaUI as omui\n\nfrom . import anim, core, reshape, sampling\nfrom .settings import SETTINGS\n\nCTX = 'flowTrailEditCtx'\nPICK_RADIUS = 16\nDRAG_THRESHOLD = 3\n\nHELP = {\n    'move': ('<hl>FlowTrail Edit</hl>  drag: move pose  |  ctrl+drag key: retime  |  '\n             'shift+click: select keys  |  click: go to frame'),\n    'sketch': ('<hl>FlowTrail Sketch</hl>  draw over the trail: the part between the '\n               'start and end of your stroke follows it'),\n    'brush': '<hl>FlowTrail Smooth Brush</hl>  paint over the trail to smooth it',\n}\n\n\nclass _Session(object):\n    def __init__(self):\n        self.reset()\n\n    def reset(self):\n        self.mode = None\n        self.trail = None\n        self.t = None\n        self.is_key = False\n        self.anchor = (0, 0)\n        self.moved = False\n        self.start_disp = None\n        self.orig_world = None\n        self.to_world = None\n        self.normal = None\n        self.pim = None\n        self.edit = None\n        self.ready = False\n        self.lo = None\n        self.hi = None\n        self.target = None\n        self.chunk = False\n        self.unit = 1.0\n        self.stroke = []\n        self.times = []\n        self.orig = []\n        self.points = []\n        self.weights = []\n        self.pins = []\n        self.touched = None\n\n\nS = _Session()\n\n\ndef _q(**kw):\n    return cmds.draggerContext(CTX, q=True, **kw)\n\n\ndef _open_chunk():\n    if not S.chunk:\n        try:\n            cmds.undoInfo(openChunk=True, chunkName='FlowTrail edit')\n        except TypeError:\n            cmds.undoInfo(openChunk=True)\n        S.chunk = True\n\n\ndef _close_chunk():\n    if S.chunk:\n        cmds.undoInfo(closeChunk=True)\n        S.chunk = False\n\n\ndef _view_xy(p, view):\n    r = view.worldToView(p)\n    return r[0], r[1]\n\n\ndef _pick(mgr, x, y):\n    view = omui.M3dView.active3dView()\n    best = None\n    for tr in mgr.trails.values():\n        if not tr.visible:\n            continue\n        for t, p, is_key in tr.pick_points:\n            sx, sy = _view_xy(p, view)\n            d = ((sx - x) ** 2 + (sy - y) ** 2) ** 0.5 - (5 if is_key else 0)\n            if d < PICK_RADIUS and (best is None or d < best[0]):\n                best = (d, tr, t, is_key, p)\n    return best[1:] if best else None\n\n\ndef _ray(view, x, y):\n    r = view.viewToWorld(int(x), int(y))\n    return r[0], r[1]\n\n\ndef _ray_plane(x, y, through=None):\n    \"\"\"Where the mouse hits the camera-facing plane through a point.\"\"\"\n    view = omui.M3dView.active3dView()\n    origin, direction = _ray(view, x, y)\n    denom = direction * S.normal\n    if abs(denom) < 1e-9:\n        return None\n    s = (((through or S.start_disp) - origin) * S.normal) / denom\n    return origin + direction * s\n\n\ndef _view_normal():\n    view = omui.M3dView.active3dView()\n    return om.MFnCamera(view.getCamera()).viewDirection(om.MSpace.kWorld)\n\n\ndef _nearest_trail(mgr, x, y):\n    \"\"\"Closest trail to the mouse, at any distance: (trail, point) or None.\"\"\"\n    view = omui.M3dView.active3dView()\n    best = None\n    for tr in mgr.trails.values():\n        if tr.visible:\n            for _, p, _ in tr.pick_points:\n                sx, sy = _view_xy(p, view)\n                d = (sx - x) ** 2 + (sy - y) ** 2\n                if best is None or d < best[0]:\n                    best = (d, tr, p)\n    return best[1:] if best else None\n\n\ndef _message(text):\n    try:\n        cmds.inViewMessage(amg=text, pos='topCenter', fade=True, fadeStayTime=2000)\n    except Exception:\n        pass\n\n\n# ---------------------------------------------------------------------------\n# reshaping: soft drag, sketch, brush\n# ---------------------------------------------------------------------------\ndef _begin_soft(mgr):\n    \"\"\"Drag with falloff: neighbouring frames follow, the path stays smooth.\"\"\"\n    tr, t = S.trail, S.t\n    times, pts = mgr.span_points(tr, *mgr.visible_range())\n    if t in (times[0], times[-1]):\n        _message('First and last frames stay pinned. Set <hl>Falloff</hl> to 0 to move them.')\n        return False\n    reach = float(SETTINGS.get('falloff'))\n    window = [i for i, f in enumerate(times) if abs(f - t) <= reach]\n    S.times = [times[i] for i in window]\n    S.orig = [pts[i] for i in window]\n    S.weights = [0.5 * (1.0 + math.cos(math.pi * (f - t) / reach)) for f in S.times]\n    S.pins = mgr.pins_for(tr, S.times, keep=t)\n    S.normal = _view_normal()\n    return True\n\n\ndef _drag_soft(x, y):\n    disp = _ray_plane(x, y)\n    if disp is None:\n        return\n    d = disp - S.start_disp\n    moved = [(p[0] + d.x * w, p[1] + d.y * w, p[2] + d.z * w)\n             for p, w in zip(S.orig, S.weights)]\n    S.points = reshape.pin_correct(moved, S.orig, S.pins)\n    S.trail.proposed = list(zip(S.times, S.points))\n    core.refresh_views()\n\n\ndef _begin_sketch(mgr, x, y):\n    near = _nearest_trail(mgr, x, y)\n    if near is None:\n        cmds.warning('FlowTrail: no visible trail to sketch on.')\n        return\n    S.trail, S.start_disp = near\n    S.normal = _view_normal()\n    S.stroke = [(float(x), float(y))]\n    S.mode = 'sketch'\n\n\ndef _drag_sketch(x, y):\n    S.stroke.append((float(x), float(y)))\n    p = _ray_plane(x, y)\n    if p is not None:\n        S.trail.stroke.append((p.x, p.y, p.z))\n    core.refresh_views()\n\n\ndef _finish_sketch(mgr):\n    tr = S.trail\n    tr.stroke = []\n    times, pts = mgr.span_points(tr, *mgr.arc_span(tr))\n    view = omui.M3dView.active3dView()\n    xy = [_view_xy(om.MPoint(p[0], p[1], p[2]), view) for p in pts]\n    span = (0, len(pts) - 1) if mgr.has_key_span(tr) else \\\n        reshape.pick_span(S.stroke[0], S.stroke[-1], xy)\n    stroke = reshape.clean_stroke(S.stroke, SETTINGS.get('stroke_smooth'))\n    if span is None or len(stroke) < 2 or span[1] - span[0] < 2:\n        _message('Start and end your stroke on <hl>different points</hl> of the trail.')\n        return\n    a, b = span\n    times, pts, xy = times[a:b + 1], pts[a:b + 1], xy[a:b + 1]\n    if not reshape.stroke_is_forward(stroke, xy):\n        stroke.reverse()\n    mode = SETTINGS.get('spacing_mode')\n    params = reshape.spacing_params(pts, mode if mode == reshape.SPACING_EVEN\n                                    else reshape.SPACING_KEEP)\n    # every frame keeps its depth: it only moves across the camera's view\n    new = []\n    for (sx, sy), p in zip(reshape.sample_stroke(stroke, params), pts):\n        hit = _ray_plane(sx, sy, om.MPoint(p[0], p[1], p[2]))\n        new.append((hit.x, hit.y, hit.z) if hit is not None else p)\n    new = reshape.pin_correct(new, pts, mgr.pins_for(tr, times))\n    mgr.apply_display_path(tr, times, new)\n\n\ndef _begin_brush(mgr, x, y):\n    near = _nearest_trail(mgr, x, y)\n    if near is None:\n        cmds.warning('FlowTrail: no visible trail to smooth.')\n        return\n    S.trail = near[0]\n    S.times, S.orig = mgr.span_points(S.trail, *mgr.arc_span(S.trail))\n    S.points = list(S.orig)\n    S.mode = 'brush'\n\n\ndef _touched_window():\n    lo, hi = S.touched\n    return max(0, lo - 1), min(len(S.points) - 1, hi + 1)\n\n\ndef _drag_brush(x, y):\n    view = omui.M3dView.active3dView()\n    radius = float(SETTINGS.get('brush_size'))\n    old = S.points\n    new = list(old)\n    for i in range(1, len(old) - 1):\n        sx, sy = _view_xy(om.MPoint(old[i][0], old[i][1], old[i][2]), view)\n        d2 = ((sx - x) ** 2 + (sy - y) ** 2) / (radius * radius)\n        if d2 < 1.0:\n            mid = reshape.lerp(old[i - 1], old[i + 1], 0.5)\n            new[i] = reshape.lerp(old[i], mid, 0.6 * (1.0 - d2) ** 2)\n            S.touched = (min(S.touched[0], i), max(S.touched[1], i)) if S.touched else (i, i)\n    S.points = new\n    if S.touched:\n        a, b = _touched_window()\n        S.trail.proposed = list(zip(S.times[a:b + 1], S.points[a:b + 1]))\n    core.refresh_views()\n\n\ndef _finish_brush(mgr):\n    S.trail.proposed = []\n    if not S.touched:\n        return\n    a, b = _touched_window()\n    times, orig = S.times[a:b + 1], S.orig[a:b + 1]\n    pins = mgr.pins_for(S.trail, times)\n    new = reshape.pin_correct(S.points[a:b + 1], orig, pins)\n    mgr.apply_display_path(S.trail, times,\n                           reshape.respace(new, orig, pins, SETTINGS.get('spacing_mode')))\n\n\n# ---------------------------------------------------------------------------\n# callbacks\n# ---------------------------------------------------------------------------\ndef _safe(fn):\n    def wrapper(*args):\n        try:\n            fn()\n        except Exception:\n            traceback.print_exc()\n            for tr in core.get_manager().trails.values():\n                tr.drag_preview = {}\n                tr.retime_preview = None\n                tr.proposed = []\n                tr.stroke = []\n            _close_chunk()\n            S.reset()\n    return wrapper\n\n\n@_safe\ndef _press():\n    mgr = core.get_manager()\n    S.reset()\n    if _q(button=True) != 1:\n        return\n    x, y = _q(anchorPoint=True)[:2]\n    S.anchor = (x, y)\n    tool = SETTINGS.get('tool_mode')\n    if tool == 'sketch':\n        _begin_sketch(mgr, x, y)\n        return\n    if tool == 'brush':\n        _begin_brush(mgr, x, y)\n        return\n    mod = _q(modifier=True)\n    hit = _pick(mgr, x, y)\n    if hit is None:\n        if mod != 'shift':\n            mgr.clear_key_selection()\n        return\n    S.trail, S.t, S.is_key, S.start_disp = hit\n    if mod == 'shift':\n        if S.is_key:\n            mgr.toggle_key(S.trail, S.t)\n        return\n    if mod == 'ctrl':\n        if S.is_key:\n            prev, nxt = S.trail.neighbours(S.t)\n            S.lo = prev + 1 if prev is not None else -anim.INF\n            S.hi = nxt - 1 if nxt is not None else anim.INF\n            S.mode = 'retime'\n        return\n    S.mode = 'move'\n\n\ndef _begin_move(mgr):\n    tr, t = S.trail, S.t\n    w = tr.cache.get(t)\n    if w is None:\n        return False\n    S.orig_world = om.MPoint(w[0], w[1], w[2])\n    ok, m = mgr.display_xformer()(t)\n    S.to_world = m.inverse() if (ok and m is not None) else None\n    view = omui.M3dView.active3dView()\n    S.normal = om.MFnCamera(view.getCamera()).viewDirection(om.MSpace.kWorld)\n    S.pim = sampling.read_matrix(tr.node, 'parentInverseMatrix', t)\n    S.unit = om.MDistance(1.0, om.MDistance.kCentimeters).asUnits(om.MDistance.uiUnit())\n    layer = mgr.refresh_edit_layer()\n    seeds = [k for k in tr.neighbours(t) if k is not None]\n    _open_chunk()\n    S.edit = anim.TranslateEdit(tr.node, t, layer, seeds)\n    if not S.edit.prepare():\n        cmds.warning('FlowTrail: %s has no editable translate (locked, constrained or '\n                     'driven). Use it on IK / translate controls.' % tr.short)\n        return False\n    if S.edit.created:\n        mgr.register_curves(tr, S.edit.created)\n    if S.edit.failed:\n        print('FlowTrail: skipped %s' % ', '.join(S.edit.failed))\n    return True\n\n\ndef _apply_move(mgr, x, y, final):\n    disp = _ray_plane(x, y)\n    if disp is None:\n        return\n    world = disp * S.to_world if S.to_world is not None else disp\n    d = (world - S.orig_world) * S.pim\n    delta = (d.x * S.unit, d.y * S.unit, d.z * S.unit)\n    if SETTINGS.get('live_drag') or final:\n        S.trail.drag_preview = {}\n        S.edit.apply(delta)\n        mgr.mark_dirty(S.edit.curves())\n        mgr.process_now()\n    else:\n        S.trail.drag_preview = {S.t: (world.x, world.y, world.z)}\n        S.trail.touch()\n        core.refresh_views()\n\n\n@_safe\ndef _drag():\n    if S.mode is None:\n        return\n    mgr = core.get_manager()\n    x, y = _q(dragPoint=True)[:2]\n    if not S.moved:\n        if abs(x - S.anchor[0]) + abs(y - S.anchor[1]) < DRAG_THRESHOLD:\n            return\n        S.moved = True\n    if S.mode == 'sketch':\n        _drag_sketch(x, y)\n    elif S.mode == 'brush':\n        _drag_brush(x, y)\n    elif S.mode == 'soft':\n        _drag_soft(x, y)\n    elif S.mode == 'move':\n        if not S.ready:\n            S.ready = True\n            if SETTINGS.get('falloff') > 0 and abs(S.t - round(S.t)) < 1e-4:\n                S.mode = 'soft' if _begin_soft(mgr) else None\n                if S.mode:\n                    _drag_soft(x, y)\n                return\n            if not _begin_move(mgr):\n                S.mode = None\n                return\n        _apply_move(mgr, x, y, final=False)\n    elif S.mode == 'retime':\n        view = omui.M3dView.active3dView()\n        best = None\n        for t, p, _ in S.trail.pick_points:\n            if S.lo <= t <= S.hi or t == S.t:\n                sx, sy = _view_xy(p, view)\n                d = (sx - x) ** 2 + (sy - y) ** 2\n                if best is None or d < best[0]:\n                    best = (d, t)\n        if best is not None:\n            S.target = best[1]\n            S.trail.retime_preview = (S.t, S.target) if S.target != S.t else None\n            S.trail.touch()\n            core.refresh_views()\n\n\n@_safe\ndef _release():\n    mgr = core.get_manager()\n    try:\n        if S.mode == 'sketch':\n            if S.moved:\n                _finish_sketch(mgr)\n            else:\n                S.trail.stroke = []\n        elif S.mode == 'brush':\n            _finish_brush(mgr)\n        elif S.mode == 'soft':\n            S.trail.proposed = []\n            if S.points:\n                mgr.apply_display_path(S.trail, S.times, S.points)\n        elif S.mode == 'move' and S.moved and S.ready:\n            if not SETTINGS.get('live_drag'):\n                x, y = _q(dragPoint=True)[:2]\n                _apply_move(mgr, x, y, final=True)\n            S.trail.drag_preview = {}\n            S.trail.touch()\n        elif S.mode == 'retime' and S.moved:\n            S.trail.retime_preview = None\n            S.trail.touch()\n            if S.target is not None and S.target != S.t:\n                mgr.refresh_edit_layer()\n                curves = mgr.edit_curves(S.trail, SETTINGS.get('retime_all_layers'))\n                _open_chunk()\n                if anim.retime(curves, S.t, S.target):\n                    mgr.mark_dirty(curves)\n                    was_sel = (S.trail.id, S.t) in mgr.selected_keys\n                    mgr.selected_keys.discard((S.trail.id, S.t))\n                    if was_sel:\n                        mgr.selected_keys.add((S.trail.id, S.target))\n                    mgr.sel_version += 1\n        elif S.trail is not None and not S.moved and S.mode in ('move', 'retime'):\n            _click(mgr)\n    finally:\n        _close_chunk()\n        trail = S.trail\n        S.reset()\n        if trail is not None:\n            mgr.process_now()\n\n\ndef _click(mgr):\n    if S.is_key:\n        mgr.select_keys([(S.trail.id, S.t)])\n    if SETTINGS.get('click_select'):\n        cmds.select(S.trail.node, replace=True)\n    if SETTINGS.get('click_jump'):\n        cmds.currentTime(S.t, edit=True)\n\n\n# ---------------------------------------------------------------------------\n# tool activation\n# ---------------------------------------------------------------------------\ndef ensure_context():\n    if not cmds.draggerContext(CTX, exists=True):\n        cmds.draggerContext(CTX, pressCommand=_press, dragCommand=_drag,\n                            releaseCommand=_release, space='screen', cursor='hand',\n                            undoMode='step')\n    return CTX\n\n\ndef is_active():\n    try:\n        return cmds.currentCtx() == CTX\n    except Exception:\n        return False\n\n\ndef activate():\n    ensure_context()\n    cmds.setToolTo(CTX)\n    _message(HELP.get(SETTINGS.get('tool_mode'), HELP['move']))\n\n\ndef set_mode(mode):\n    \"\"\"Switch the viewport tool: 'move', 'sketch' or 'brush'.\"\"\"\n    SETTINGS.set('tool_mode', mode)\n    activate()\n\n\ndef deactivate():\n    if is_active():\n        cmds.setToolTo('selectSuperContext')\n\n\ndef toggle():\n    if is_active():\n        deactivate()\n    else:\n        activate()\n    return is_active()",
"aliases": {
"absolute_import": "__future__.absolute_import",
"division": "__future__.division",
"print_function": "__future__.print_function",
"math": "math",
"traceback": "traceback",
"cmds": "maya.cmds",
"om": "maya.api.OpenMaya",
"omui": "maya.api.OpenMayaUI"
},
"outline": [
{
"q": "_Session",
"k": "class",
"s": 42,
"e": 71,
"doc": "",
"n": "Everything about the drag in progress: what was clicked, the mode, the starting point, the edit object, previews. One instance `S` is reset at every press, so a new drag never sees old state.",
"c": [],
"b": []
},
{
"q": "_Session.__init__",
"k": "def",
"s": 43,
"e": 44,
"doc": "",
"n": "Starts reset.",
"c": [
[
10,
"_Session.reset"
]
],
"b": []
},
{
"q": "_Session.reset",
"k": "def",
"s": 46,
"e": 71,
"doc": "",
"n": "Clears every field.",
"c": [],
"b": [
[
10,
"_Session.__init__"
]
]
},
{
"q": "_q",
"k": "def",
"s": 77,
"e": 78,
"doc": "",
"n": "Short way to query the dragger context (mouse position, button, modifier keys).",
"c": [],
"b": [
[
10,
"_press"
],
[
10,
"_drag"
],
[
10,
"_release"
]
]
},
{
"q": "_open_chunk",
"k": "def",
"s": 81,
"e": 87,
"doc": "",
"n": "Opens a named undo chunk once per drag, so a whole drag (dozens of small key changes) is one undo step.",
"c": [],
"b": [
[
10,
"_begin_move"
],
[
10,
"_release"
]
]
},
{
"q": "_close_chunk",
"k": "def",
"s": 90,
"e": 93,
"doc": "",
"n": "Closes it if it is open.",
"c": [],
"b": [
[
10,
"_safe.wrapper"
],
[
10,
"_release"
]
]
},
{
"q": "_view_xy",
"k": "def",
"s": 96,
"e": 98,
"doc": "",
"n": "Projects a 3D point to screen pixels in the active viewport.",
"c": [],
"b": [
[
10,
"_pick"
],
[
10,
"_nearest_trail"
],
[
10,
"_finish_sketch"
],
[
10,
"_drag_brush"
],
[
10,
"_drag"
]
]
},
{
"q": "_pick",
"k": "def",
"s": 101,
"e": 112,
"doc": "",
"n": "Finds the trail point under the mouse: the closest frame or key within 16 pixels across all visible trails. Keys get a 5 pixel bonus so they win over the frame dots around them.",
"c": [
[
10,
"_view_xy"
]
],
"b": [
[
10,
"_press"
]
]
},
{
"q": "_ray",
"k": "def",
"s": 115,
"e": 117,
"doc": "",
"n": "The 3D ray through a screen pixel (start point and direction).",
"c": [],
"b": [
[
10,
"_ray_plane"
]
]
},
{
"q": "_ray_plane",
"k": "def",
"s": 120,
"e": 128,
"doc": "Where the mouse hits the camera-facing plane through a point.",
"n": "Where the mouse ray hits a plane that faces the camera and goes through a given point. Dragging on that plane moves points across the screen without changing their depth, which is what an animator expects from dragging in the viewport.",
"c": [
[
10,
"_ray"
]
],
"b": [
[
10,
"_drag_soft"
],
[
10,
"_drag_sketch"
],
[
10,
"_finish_sketch"
],
[
10,
"_apply_move"
]
]
},
{
"q": "_view_normal",
"k": "def",
"s": 131,
"e": 133,
"doc": "",
"n": "The active camera's viewing direction, used as the plane normal.",
"c": [],
"b": [
[
10,
"_begin_soft"
],
[
10,
"_begin_sketch"
]
]
},
{
"q": "_nearest_trail",
"k": "def",
"s": 136,
"e": 147,
"doc": "Closest trail to the mouse, at any distance: (trail, point) or None.",
"n": "The trail closest to the mouse at any distance (for sketching and brushing, which do not need a precise click).",
"c": [
[
10,
"_view_xy"
]
],
"b": [
[
10,
"_begin_sketch"
],
[
10,
"_begin_brush"
]
]
},
{
"q": "_message",
"k": "def",
"s": 150,
"e": 154,
"doc": "",
"n": "A short help message at the top of the viewport.",
"c": [],
"b": [
[
10,
"_begin_soft"
],
[
10,
"_finish_sketch"
],
[
10,
"activate"
]
]
},
{
"q": "_begin_soft",
"k": "def",
"s": 160,
"e": 174,
"doc": "Drag with falloff: neighbouring frames follow, the path stays smooth.",
"n": "Starts a drag with **falloff**: the frames within \"falloff\" frames of the grabbed one move too, weighted by a cosine curve, so the arc stays smooth. The first and last frames of the range stay pinned.",
"c": [
[
10,
"_message"
],
[
10,
"_view_normal"
]
],
"b": [
[
10,
"_drag"
],
[
14,
"Flow.test_pull_moves_neighbours_and_stops_at_falloff"
],
[
14,
"Flow.test_pull_refuses_the_pinned_ends"
]
]
},
{
"q": "_drag_soft",
"k": "def",
"s": 177,
"e": 186,
"doc": "",
"n": "Moves the grabbed frame on the camera plane, moves its neighbors by their weights, puts pins back, and shows the result as a preview. Nothing is keyed until release.",
"c": [
[
10,
"_ray_plane"
],
[
8,
"pin_correct"
],
[
6,
"refresh_views"
]
],
"b": [
[
10,
"_drag"
],
[
14,
"Flow.test_pull_moves_neighbours_and_stops_at_falloff"
]
]
},
{
"q": "_begin_sketch",
"k": "def",
"s": 189,
"e": 197,
"doc": "",
"n": "Starts a sketch on the trail nearest the mouse.",
"c": [
[
10,
"_nearest_trail"
],
[
10,
"_view_normal"
]
],
"b": [
[
10,
"_press"
],
[
14,
"Flow.sketch"
]
]
},
{
"q": "_drag_sketch",
"k": "def",
"s": 200,
"e": 205,
"doc": "",
"n": "Records the stroke in screen pixels and also in 3D (for drawing it in the viewport).",
"c": [
[
10,
"_ray_plane"
],
[
6,
"refresh_views"
]
],
"b": [
[
10,
"_drag"
],
[
14,
"Flow.sketch"
]
]
},
{
"q": "_finish_sketch",
"k": "def",
"s": 208,
"e": 233,
"doc": "",
"n": "Turns the stroke into a new path: decides which part of the trail it replaces (`pick_span`, or the selected keys), cleans the stroke, flips it if drawn backwards, spaces the frames along it like the original spacing, and moves each frame onto the stroke **at its own depth** (each frame only moves across the screen). Pins go back and the path is applied with `apply_display_path`.",
"c": [
[
10,
"_view_xy"
],
[
8,
"pick_span"
],
[
8,
"clean_stroke"
],
[
10,
"_message"
],
[
8,
"stroke_is_forward"
],
[
8,
"spacing_params"
],
[
10,
"_ray_plane"
],
[
8,
"sample_stroke"
],
[
8,
"pin_correct"
]
],
"b": [
[
10,
"_release"
],
[
14,
"Flow.sketch"
]
]
},
{
"q": "_begin_brush",
"k": "def",
"s": 236,
"e": 244,
"doc": "",
"n": "Starts brushing on the nearest trail, with a working copy of its points.",
"c": [
[
10,
"_nearest_trail"
]
],
"b": [
[
10,
"_press"
],
[
14,
"Flow.test_brush_only_touches_where_painted"
]
]
},
{
"q": "_touched_window",
"k": "def",
"s": 247,
"e": 249,
"doc": "",
"n": "The range of frames the brush has touched, plus one on each side.",
"c": [],
"b": [
[
10,
"_drag_brush"
],
[
10,
"_finish_brush"
]
]
},
{
"q": "_drag_brush",
"k": "def",
"s": 252,
"e": 268,
"doc": "",
"n": "Each frame under the brush moves toward the midpoint of its two neighbors, more near the brush center. Repeated strokes smooth more. The touched part is shown as a preview.",
"c": [
[
8,
"lerp"
],
[
10,
"_view_xy"
],
[
10,
"_touched_window"
],
[
6,
"refresh_views"
]
],
"b": [
[
10,
"_drag"
],
[
14,
"Flow.test_brush_only_touches_where_painted"
]
]
},
{
"q": "_finish_brush",
"k": "def",
"s": 271,
"e": 280,
"doc": "",
"n": "Applies the brushed part: pins back, spacing restored, then `apply_display_path`.",
"c": [
[
10,
"_touched_window"
],
[
8,
"pin_correct"
],
[
8,
"respace"
]
],
"b": [
[
10,
"_release"
],
[
14,
"Flow.test_brush_only_touches_where_painted"
]
]
},
{
"q": "_safe",
"k": "def",
"s": 286,
"e": 299,
"doc": "",
"n": "A **decorator** for the three mouse callbacks: if anything fails, it prints the error, clears every preview, closes the undo chunk and resets the session, so a bug never leaves the tool stuck in a half-finished drag.",
"c": [
[
10,
"_safe.wrapper"
]
],
"b": [
[
10,
"_press"
],
[
10,
"_drag"
],
[
10,
"_release"
]
]
},
{
"q": "_safe.wrapper",
"k": "def",
"s": 287,
"e": 298,
"doc": "",
"n": "The function Maya actually calls; it runs the real callback inside `try/except`.",
"c": [
[
10,
"_close_chunk"
],
[
6,
"get_manager"
]
],
"b": [
[
10,
"_safe"
]
]
},
{
"q": "_press",
"k": "def",
"s": 302,
"e": 335,
"doc": "",
"n": "Mouse down. Sketch and brush modes start right away. Otherwise it picks the point under the mouse: shift toggles key selection, ctrl on a key starts a retime limited to the frames between its neighbors, a plain press prepares a move. Clicking empty space clears the selection.",
"c": [
[
6,
"get_manager"
],
[
10,
"_q"
],
[
10,
"_begin_sketch"
],
[
10,
"_begin_brush"
],
[
10,
"_pick"
],
[
10,
"_safe"
]
],
"b": [
[
10,
"ensure_context"
]
]
},
{
"q": "_begin_move",
"k": "def",
"s": 338,
"e": 362,
"doc": "",
"n": "Prepares a single-frame move: remembers the start position, the display-space conversion, the camera plane, the parent inverse matrix and the unit scale, opens the undo chunk and prepares a `TranslateEdit` on the edit layer (seeding the neighboring keys so the rest of the animation does not change).",
"c": [
[
5,
"read_matrix"
],
[
10,
"_open_chunk"
],
[
7,
"TranslateEdit"
]
],
"b": [
[
10,
"_drag"
]
]
},
{
"q": "_apply_move",
"k": "def",
"s": 365,
"e": 380,
"doc": "",
"n": "Converts the mouse position into a translate offset in parent space and applies it. With \"live drag\" the key changes on every mouse move and the trail updates live; without it, only a preview dot moves and the key is set on release.",
"c": [
[
10,
"_ray_plane"
],
[
6,
"refresh_views"
]
],
"b": [
[
10,
"_drag"
],
[
10,
"_release"
]
]
},
{
"q": "_drag",
"k": "def",
"s": 383,
"e": 424,
"doc": "",
"n": "Mouse move. Ignores the first 3 pixels (so a click is not taken as a tiny drag), then sends the move to the right mode. A plain move on a whole frame becomes a soft (falloff) drag when falloff is above 0. A retime snaps to the nearest allowed frame and shows a \"from > to\" preview.",
"c": [
[
6,
"get_manager"
],
[
10,
"_q"
],
[
6,
"refresh_views"
],
[
10,
"_view_xy"
],
[
10,
"_apply_move"
],
[
10,
"_begin_move"
],
[
10,
"_drag_soft"
],
[
10,
"_begin_soft"
],
[
10,
"_drag_brush"
],
[
10,
"_drag_sketch"
],
[
10,
"_safe"
]
],
"b": [
[
10,
"ensure_context"
]
]
},
{
"q": "_release",
"k": "def",
"s": 427,
"e": 469,
"doc": "",
"n": "Mouse up. Finishes whatever was in progress (apply the sketch, brush or soft path, set the final move, perform the retime and keep the key selected), or treats it as a click if the mouse did not move. `finally` always closes the undo chunk, resets the session and updates.",
"c": [
[
6,
"get_manager"
],
[
10,
"_close_chunk"
],
[
10,
"_click"
],
[
7,
"retime"
],
[
10,
"_open_chunk"
],
[
10,
"_apply_move"
],
[
10,
"_q"
],
[
10,
"_finish_brush"
],
[
10,
"_finish_sketch"
],
[
10,
"_safe"
]
],
"b": [
[
10,
"ensure_context"
]
]
},
{
"q": "_click",
"k": "def",
"s": 472,
"e": 478,
"doc": "",
"n": "A click on a point: select the key, select the control, and jump to that frame (each optional in settings).",
"c": [],
"b": [
[
10,
"_release"
]
]
},
{
"q": "ensure_context",
"k": "def",
"s": 484,
"e": 489,
"doc": "",
"n": "Creates the `draggerContext` once, with the three callbacks.",
"c": [
[
10,
"_release"
],
[
10,
"_drag"
],
[
10,
"_press"
]
],
"b": [
[
10,
"activate"
]
]
},
{
"q": "is_active",
"k": "def",
"s": 492,
"e": 496,
"doc": "",
"n": "True if the edit tool is the current Maya tool.",
"c": [],
"b": [
[
10,
"deactivate"
],
[
10,
"toggle"
],
[
11,
"FlowTrailUI._poll"
]
]
},
{
"q": "activate",
"k": "def",
"s": 499,
"e": 502,
"doc": "",
"n": "Makes it the current tool and shows the help line for the current mode.",
"c": [
[
10,
"ensure_context"
],
[
10,
"_message"
]
],
"b": [
[
10,
"set_mode"
],
[
10,
"toggle"
]
]
},
{
"q": "set_mode",
"k": "def",
"s": 505,
"e": 508,
"doc": "Switch the viewport tool: 'move', 'sketch' or 'brush'.",
"n": "Saves the mode (move, sketch, brush) and activates the tool.",
"c": [
[
10,
"activate"
]
],
"b": [
[
1,
"set_tool"
],
[
11,
"FlowTrailUI._arcs_tab"
]
]
},
{
"q": "deactivate",
"k": "def",
"s": 511,
"e": 513,
"doc": "",
"n": "Goes back to Maya's select tool.",
"c": [
[
10,
"is_active"
]
],
"b": [
[
1,
"unload"
],
[
10,
"toggle"
]
]
},
{
"q": "toggle",
"k": "def",
"s": 516,
"e": 521,
"doc": "",
"n": "On/off, returning the new state (for the UI button and hotkey).",
"c": [
[
10,
"activate"
],
[
10,
"deactivate"
],
[
10,
"is_active"
]
],
"b": [
[
1,
"toggle_edit_tool"
],
[
11,
"FlowTrailUI._toggle_tool"
]
]
}
],
"lines": {
"109": "Pixel distance, with keys made 5 pixels \"closer\" so they are easier to grab.",
"127": "Ray-plane intersection: how far along the ray the plane is (dot products with the plane normal).",
"171": "Cosine falloff: 1 on the grabbed frame, easing to 0 at the falloff distance.",
"230": "Each frame is moved on its own camera-facing plane, so its depth never changes.",
"262": "Pull toward the neighbors' midpoint, strongest at the brush center and fading to 0 at its edge.",
"286": "A decorator: `@_safe` above a function replaces it with `wrapper`, which calls it inside error handling.",
"331": "A retimed key can slide only between its neighbors, never past them.",
"370": "World offset to parent space (vector times parent inverse matrix).",
"390": "Under 3 pixels of movement is still a click, not a drag.",
"488": "Each press-drag-release counts as one step for the tool context; the chunk inside keeps the edits together."
}
},
{
"path": "flowtrail/ui.py",
"lang": "py",
"note": "The dockable window. Most widgets are tied to a setting by three small helpers (`_check`, `_spin`, `_combo`), so adding an option is one line and the UI never gets out of sync with `SETTINGS`.",
"code": "# -*- coding: utf-8 -*-\n\"\"\"FlowTrail dockable UI (PySide2, Maya 2020+).\"\"\"\nfrom __future__ import absolute_import, division, print_function\n\nfrom maya import cmds\nimport maya.api.OpenMayaUI as omui\n\ntry:\n    from PySide2 import QtCore, QtGui, QtWidgets\nexcept ImportError:  # Maya 2025+\n    from PySide6 import QtCore, QtGui, QtWidgets\n\nfrom maya.app.general.mayaMixin import MayaQWidgetDockableMixin\n\nfrom . import anim, core, edit_tool\nfrom .settings import AUTO_LAYER, PRESETS, SETTINGS\n\nOBJECT_NAME = 'FlowTrailUI'\nACCENT = '#3fa9f5'\n\nSTYLE = \"\"\"\nQPushButton { padding: 4px 8px; }\nQPushButton#primary { background: %(a)s; color: #10202c; font-weight: bold; border-radius: 3px; }\nQPushButton#primary:hover { background: #6cc0ff; }\nQPushButton#tool { padding: 7px; font-weight: bold; border-radius: 3px; }\nQPushButton#tool:checked { background: #f5a623; color: #241500; }\nQLabel#hint { color: #8a8a8a; }\nQLabel#status { color: #8a8a8a; padding: 2px; }\nQGroupBox { font-weight: bold; margin-top: 8px; }\nQGroupBox::title { subcontrol-origin: margin; left: 6px; padding: 0 3px; }\n\"\"\" % {'a': ACCENT}\n\n_INSTANCE = [None]\n\n\ndef _hint(text):\n    lab = QtWidgets.QLabel(text)\n    lab.setObjectName('hint')\n    lab.setWordWrap(True)\n    return lab\n\n\ndef _swatch(rgb, size=12):\n    pix = QtGui.QPixmap(size, size)\n    pix.fill(QtGui.QColor.fromRgbF(rgb[0], rgb[1], rgb[2]))\n    return QtGui.QIcon(pix)\n\n\nclass FlowTrailUI(MayaQWidgetDockableMixin, QtWidgets.QWidget):\n\n    def __init__(self, parent=None):\n        super(FlowTrailUI, self).__init__(parent=parent)\n        self.setObjectName(OBJECT_NAME)\n        self.setWindowTitle('FlowTrail')\n        self.setStyleSheet(STYLE)\n        self.mgr = core.get_manager()\n        self._bindings = []          # (key, setter) to refresh widgets from settings\n        self._updating = False\n        self._tween_open = False\n        self._build()\n        self.mgr.listeners.append(self._on_manager)\n        self._timer = QtCore.QTimer(self)\n        self._timer.timeout.connect(self._poll)\n        self._timer.start(400)\n        self._refresh_list()\n        self._refresh_layers()\n        self._sync_widgets()\n\n    # ------------------------------------------------------------------ build\n    def _build(self):\n        root = QtWidgets.QVBoxLayout(self)\n        root.setContentsMargins(6, 6, 6, 6)\n        root.setSpacing(6)\n\n        row = QtWidgets.QHBoxLayout()\n        add = QtWidgets.QPushButton('+  Trail Selected')\n        add.setObjectName('primary')\n        add.setToolTip('Create a motion trail for every selected control')\n        add.clicked.connect(self._add_selected)\n        rem = QtWidgets.QPushButton('Remove')\n        rem.clicked.connect(self._remove_selected)\n        clr = QtWidgets.QPushButton('Clear')\n        clr.clicked.connect(self.mgr.clear)\n        ref = QtWidgets.QPushButton('Refresh')\n        ref.setToolTip('Rebuild everything (use after constraints / parenting changes)')\n        ref.clicked.connect(self.mgr.rescan)\n        for w in (add, rem, clr, ref):\n            row.addWidget(w)\n        row.setStretch(0, 1)\n        root.addLayout(row)\n\n        self.tool_btn = QtWidgets.QPushButton('Edit Trail Tool')\n        self.tool_btn.setObjectName('tool')\n        self.tool_btn.setCheckable(True)\n        self.tool_btn.setToolTip(edit_tool.__doc__.strip())\n        self.tool_btn.clicked.connect(self._toggle_tool)\n        root.addWidget(self.tool_btn)\n\n        self.auto_cb = self._check('Auto trail on selection', 'auto_selection',\n                                   'Temporary trails follow your selection (max 8)')\n        root.addWidget(self.auto_cb)\n\n        self.list = QtWidgets.QListWidget()\n        self.list.setSelectionMode(QtWidgets.QAbstractItemView.ExtendedSelection)\n        self.list.setMaximumHeight(110)\n        self.list.setToolTip('Checkbox: show/hide.  Double-click: change color.')\n        self.list.itemChanged.connect(self._item_changed)\n        self.list.itemDoubleClicked.connect(self._pick_color)\n        root.addWidget(self.list)\n\n        tabs = QtWidgets.QTabWidget()\n        tabs.addTab(self._display_tab(), 'Display')\n        tabs.addTab(self._arcs_tab(), 'Arcs')\n        tabs.addTab(self._timing_tab(), 'Timing')\n        tabs.addTab(self._range_tab(), 'Range')\n        tabs.addTab(self._layers_tab(), 'Layers')\n        root.addWidget(tabs, 1)\n\n        self.status = QtWidgets.QLabel('')\n        self.status.setObjectName('status')\n        root.addWidget(self.status)\n\n    def _display_tab(self):\n        w = QtWidgets.QWidget()\n        lay = QtWidgets.QVBoxLayout(w)\n\n        presets = QtWidgets.QHBoxLayout()\n        for name, values in PRESETS:\n            b = QtWidgets.QPushButton(name)\n            b.clicked.connect(lambda checked=False, v=values: self._apply(v))\n            presets.addWidget(b)\n        lay.addLayout(presets)\n\n        grid = QtWidgets.QGridLayout()\n        checks = [('Path line', 'show_line', ''),\n                  ('Frame dots', 'show_frames', 'One dot per frame: the spacing'),\n                  ('Key markers', 'show_keys', 'Grey keys live on other anim layers'),\n                  ('Spacing ticks', 'show_ticks', 'Spacing-chart ticks across the path'),\n                  ('Speed colors', 'speed_color', 'Blue = slow ... red = fast'),\n                  ('Fade past/future', 'fade', ''),\n                  ('Draw on top', 'on_top', 'X-ray: trail is never hidden by geometry'),\n                  ('Live offset', 'show_live',\n                   'Red dot/line when the control was moved but not keyed')]\n        for i, (label, k, tip) in enumerate(checks):\n            grid.addWidget(self._check(label, k, tip), i // 2, i % 2)\n        lay.addLayout(grid)\n\n        form = QtWidgets.QFormLayout()\n        form.addRow('Frame numbers', self._combo('labels', [('None', 'none'),\n                                                           ('On keys', 'keys'),\n                                                           ('Every frame', 'all')]))\n        form.addRow('Line width', self._spin('line_width', 1, 8, 0.5, True))\n        form.addRow('Dot size', self._spin('point_size', 1, 20, 1, True))\n        form.addRow('Key size', self._spin('key_size', 2, 30, 1, True))\n        form.addRow('Tick size', self._spin('tick_size', 0.2, 5, 0.2, True))\n        lay.addLayout(form)\n        lay.addStretch(1)\n        return w\n\n    def _arcs_tab(self):\n        w = QtWidgets.QWidget()\n        lay = QtWidgets.QVBoxLayout(w)\n        lay.addWidget(_hint('Reshape the path. The first and last frame of an edit never '\n                            'move, so loops stay loops. Shift+click two keys to limit an '\n                            'edit to the frames between them.'))\n\n        box = QtWidgets.QGroupBox('Draw it')\n        bl = QtWidgets.QVBoxLayout(box)\n        row = QtWidgets.QHBoxLayout()\n        self.mode_btns = {}\n        for label, mode, tip in (\n                ('Pull', 'move', 'Drag a point: nearby frames follow (see Falloff)'),\n                ('Sketch', 'sketch', 'Draw the path by hand over the trail. It replaces the '\n                                     'part between the start and end of your stroke'),\n                ('Smooth Brush', 'brush', 'Paint over the trail to smooth it locally')):\n            b = QtWidgets.QPushButton(label)\n            b.setObjectName('tool')\n            b.setCheckable(True)\n            b.setToolTip(tip)\n            b.clicked.connect(lambda checked=False, m=mode: edit_tool.set_mode(m))\n            self.mode_btns[mode] = b\n            row.addWidget(b)\n        bl.addLayout(row)\n        form = QtWidgets.QFormLayout()\n        falloff = self._spin('falloff', 0, 200, 1)\n        falloff.setSuffix(' frames')\n        falloff.setToolTip('How many frames each side follow a dragged point. 0 moves only '\n                           'that frame, and can also move the first and last frames')\n        form.addRow('Pull falloff', falloff)\n        form.addRow('Sketch cleanup', self._combo('stroke_smooth', [('Light', 0.25),\n                                                                   ('Medium', 0.5),\n                                                                   ('Strong', 1.0)]))\n        brush = self._spin('brush_size', 5, 400, 5)\n        brush.setSuffix(' px')\n        form.addRow('Brush size', brush)\n        bl.addLayout(form)\n        lay.addWidget(box)\n\n        box = QtWidgets.QGroupBox('Smooth the whole path')\n        bl = QtWidgets.QVBoxLayout(box)\n        self.smooth = QtWidgets.QSlider(QtCore.Qt.Horizontal)\n        self.smooth.setRange(0, 100)\n        self.smooth.setToolTip('Drag to preview in the viewport, release to apply.\\n'\n                               'Acts on trails with selected keys, else selected controls, '\n                               'else all visible trails.')\n        self.smooth.sliderPressed.connect(self._smooth_start)\n        self.smooth.valueChanged.connect(self._smooth_move)\n        self.smooth.sliderReleased.connect(self._smooth_end)\n        bl.addWidget(self.smooth)\n        row = QtWidgets.QHBoxLayout()\n        for label, amount in (('Light', 0.3), ('Medium', 0.55), ('Strong', 0.8)):\n            b = QtWidgets.QPushButton(label)\n            b.clicked.connect(lambda checked=False, a=amount: self.mgr.smooth_arcs(a))\n            row.addWidget(b)\n        bl.addLayout(row)\n        lay.addWidget(box)\n\n        box = QtWidgets.QGroupBox('Loops')\n        bl = QtWidgets.QVBoxLayout(box)\n        b = QtWidgets.QPushButton('Make Loop Seamless')\n        b.setToolTip('Same speed leaving the first key as arriving at the last one, on the '\n                     'edit layer. The first and last key must have the same values.')\n        b.clicked.connect(self.mgr.make_loop_seamless)\n        bl.addWidget(b)\n        bl.addWidget(self._check('Lock tangents on the first and last frame',\n                                 'lock_end_tangents',\n                                 'Keeps the loop seam, and everything outside the edit, as it '\n                                 'was. Those tangents become Fixed'))\n        bl.addWidget(self._check('Keep all keyed poses (reshape in-betweens only)', 'pin_keys'))\n        lay.addWidget(box)\n\n        form = QtWidgets.QFormLayout()\n        form.addRow('Spacing', self._combo('spacing_mode', [\n            ('Keep my spacing', 'keep'),\n            ('Even spacing', 'even'),\n            ('Smooth spacing too', 'free')]))\n        form.addRow('New keys', self._combo('key_mode', [\n            ('Adaptive (fewest keys)', 'adaptive'),\n            ('Every frame', 'every'),\n            ('None: existing keys only', 'existing')]))\n        form.addRow('Accuracy', self._combo('accuracy', [('Low (fewer keys)', 'low'),\n                                                        ('Medium', 'medium'),\n                                                        ('High (more keys)', 'high')]))\n        lay.addLayout(form)\n        lay.addStretch(1)\n        return w\n\n    def _timing_tab(self):\n        w = QtWidgets.QWidget()\n        lay = QtWidgets.QVBoxLayout(w)\n        lay.addWidget(_hint('Edit Trail Tool: drag a point to fix the arc/spacing '\n                            '(keys in-betweens automatically). Ctrl+drag a key to slide '\n                            'its timing. Shift+click keys to select them for the tools '\n                            'below. With no keys selected, tools act on the current frame.'))\n\n        self.sel_label = QtWidgets.QLabel('No trail keys selected')\n        lay.addWidget(self.sel_label)\n        sel_row = QtWidgets.QHBoxLayout()\n        b = QtWidgets.QPushButton('Select keys in range')\n        b.clicked.connect(self.mgr.select_all_keys)\n        sel_row.addWidget(b)\n        b = QtWidgets.QPushButton('Deselect')\n        b.clicked.connect(self.mgr.clear_key_selection)\n        sel_row.addWidget(b)\n        lay.addLayout(sel_row)\n\n        box = QtWidgets.QGroupBox('Favor (breakdown)')\n        bl = QtWidgets.QVBoxLayout(box)\n        self.tween = QtWidgets.QSlider(QtCore.Qt.Horizontal)\n        self.tween.setRange(-100, 100)\n        self.tween.setValue(0)\n        self.tween.setToolTip('Drag: favor previous key (left) or next key (right)')\n        self.tween.sliderPressed.connect(self._tween_start)\n        self.tween.valueChanged.connect(self._tween_move)\n        self.tween.sliderReleased.connect(self._tween_end)\n        bl.addWidget(self.tween)\n        marks = QtWidgets.QHBoxLayout()\n        for v in (-100, -66, -33, 0, 33, 66, 100):\n            b = QtWidgets.QPushButton('%d' % (50 + v // 2) if v else '50')\n            b.setToolTip('Set to %d%% towards the next key' % (50 + v // 2))\n            b.setMaximumWidth(36)\n            b.clicked.connect(lambda checked=False, f=v / 100.0: self._tween_click(f))\n            marks.addWidget(b)\n        bl.addLayout(marks)\n        lay.addWidget(box)\n\n        box = QtWidgets.QGroupBox('Timing')\n        tl = QtWidgets.QHBoxLayout(box)\n        for label, d in (('<< -2', -2), ('< -1', -1), ('+1 >', 1), ('+2 >>', 2)):\n            b = QtWidgets.QPushButton(label)\n            b.clicked.connect(lambda checked=False, dd=d: self.mgr.nudge(dd))\n            tl.addWidget(b)\n        lay.addWidget(box)\n\n        box = QtWidgets.QGroupBox('Ease (tangents)')\n        gl = QtWidgets.QGridLayout(box)\n        tangents = [('Auto', 'auto'), ('Spline', 'spline'), ('Clamped', 'clamped'),\n                    ('Linear', 'linear'), ('Flat (ease)', 'flat'), ('Stepped', 'step')]\n        for i, (label, kind) in enumerate(tangents):\n            b = QtWidgets.QPushButton(label)\n            b.clicked.connect(lambda checked=False, k=kind: self.mgr.set_tangents(k))\n            gl.addWidget(b, i // 3, i % 3)\n        lay.addWidget(box)\n\n        box = QtWidgets.QGroupBox('Edit options')\n        ol = QtWidgets.QVBoxLayout(box)\n        ol.addWidget(self._check('Live drag (see the whole trail update while dragging)',\n                                 'live_drag', 'Turn off for very heavy rigs'))\n        ol.addWidget(self._check('Retime keys on all layers', 'retime_all_layers',\n                                 'Keeps layered animation in sync when sliding keys'))\n        ol.addWidget(self._check('Click selects the control', 'click_select'))\n        ol.addWidget(self._check('Click jumps to frame', 'click_jump'))\n        lay.addWidget(box)\n        lay.addStretch(1)\n        return w\n\n    def _range_tab(self):\n        w = QtWidgets.QWidget()\n        lay = QtWidgets.QVBoxLayout(w)\n        form = QtWidgets.QFormLayout()\n        form.addRow('Range', self._combo('range_mode', [('Playback range', 'playback'),\n                                                       ('Around current frame', 'around'),\n                                                       ('Custom', 'custom')]))\n        form.addRow('Frames before', self._spin('before', 1, 1000, 1))\n        form.addRow('Frames after', self._spin('after', 1, 1000, 1))\n        form.addRow('Custom start', self._spin('custom_start', -100000, 100000, 1))\n        form.addRow('Custom end', self._spin('custom_end', -100000, 100000, 1))\n        form.addRow('Samples / frame', self._combo('substeps', [('1', 1), ('2 (smoother)', 2),\n                                                               ('4 (smoothest)', 4)]))\n        form.addRow('Evaluation', self._combo('eval_mode', [\n            ('Fast (DG context)', 'context'),\n            ('Timeline (complex rigs)', 'timeline')]))\n        lay.addLayout(form)\n        lay.addWidget(_hint('Use \"Timeline\" only if a rig shows a wrong trail in Fast '\n                            'mode (some rigs ignore DG context evaluation).'))\n\n        box = QtWidgets.QGroupBox('Display space')\n        bl = QtWidgets.QVBoxLayout(box)\n        bl.addWidget(_hint('Camera space shows the arc as the camera sees it - essential '\n                           'with moving shot cameras. Object space shows motion relative '\n                           'to e.g. the character root.'))\n        row = QtWidgets.QHBoxLayout()\n        for label, mode in (('World', 'world'), ('Active camera', 'camera'),\n                            ('Selected object', 'object')):\n            b = QtWidgets.QPushButton(label)\n            b.clicked.connect(lambda checked=False, m=mode: self._set_space(m))\n            row.addWidget(b)\n        bl.addLayout(row)\n        self.space_label = QtWidgets.QLabel('Space: World')\n        bl.addWidget(self.space_label)\n        lay.addWidget(box)\n        lay.addStretch(1)\n        return w\n\n    def _layers_tab(self):\n        w = QtWidgets.QWidget()\n        lay = QtWidgets.QVBoxLayout(w)\n        lay.addWidget(_hint('Trails always show the final motion (all layers). Edits go '\n                            'to the layer below. \"Auto\" follows the layer selected in '\n                            \"Maya's Layer Editor.\"))\n        row = QtWidgets.QHBoxLayout()\n        self.layer_combo = QtWidgets.QComboBox()\n        self.layer_combo.currentIndexChanged.connect(self._layer_changed)\n        row.addWidget(self.layer_combo, 1)\n        b = QtWidgets.QPushButton('Reload')\n        b.clicked.connect(self._refresh_layers)\n        row.addWidget(b)\n        form = QtWidgets.QFormLayout()\n        form.addRow('Edit layer', row)\n        self.edit_layer_label = QtWidgets.QLabel('-')\n        form.addRow('Editing now', self.edit_layer_label)\n        lay.addLayout(form)\n\n        box = QtWidgets.QGroupBox('Compare layer')\n        bl = QtWidgets.QVBoxLayout(box)\n        bl.addWidget(_hint('Draws a dashed ghost trail of the motion with this layer '\n                           'muted, so you see exactly what the layer changes.'))\n        self.ghost_combo = QtWidgets.QComboBox()\n        self.ghost_combo.currentIndexChanged.connect(self._ghost_changed)\n        bl.addWidget(self.ghost_combo)\n        lay.addWidget(box)\n        lay.addStretch(1)\n        return w\n\n    # ------------------------------------------------------------ bindings\n    def _commit(self, k, value):\n        if self._updating:\n            return\n        if SETTINGS.set(k, value):\n            self.mgr.settings_changed([k])\n\n    def _apply(self, values):\n        changed = SETTINGS.update(values)\n        if changed:\n            self.mgr.settings_changed(changed)\n        self._sync_widgets()\n\n    def _check(self, label, k, tip=''):\n        cb = QtWidgets.QCheckBox(label)\n        if tip:\n            cb.setToolTip(tip)\n        cb.toggled.connect(lambda v, kk=k: self._commit(kk, bool(v)))\n        self._bindings.append((k, lambda v, w=cb: w.setChecked(bool(v))))\n        return cb\n\n    def _spin(self, k, lo, hi, step, double=False):\n        sp = QtWidgets.QDoubleSpinBox() if double else QtWidgets.QSpinBox()\n        sp.setRange(lo, hi)\n        sp.setSingleStep(step)\n        sp.setKeyboardTracking(False)\n        conv = float if double else int\n        sp.valueChanged.connect(lambda v, kk=k: self._commit(kk, conv(v)))\n        self._bindings.append((k, lambda v, w=sp: w.setValue(v)))\n        return sp\n\n    def _combo(self, k, items):\n        cb = QtWidgets.QComboBox()\n        for label, value in items:\n            cb.addItem(label, value)\n        values = [v for _, v in items]\n        cb.currentIndexChanged.connect(lambda i, kk=k: self._commit(kk, values[i]))\n        self._bindings.append((k, lambda v, w=cb: w.setCurrentIndex(\n            values.index(v) if v in values else 0)))\n        return cb\n\n    def _sync_widgets(self):\n        self._updating = True\n        try:\n            for k, setter in self._bindings:\n                setter(SETTINGS.get(k))\n        finally:\n            self._updating = False\n\n    # ------------------------------------------------------------ trails\n    def _add_selected(self):\n        sel = cmds.ls(sl=True, type='transform', long=True)\n        if not sel:\n            cmds.warning('FlowTrail: select one or more controls first.')\n            return\n        self.mgr.add(sel)\n\n    def _selected_ids(self):\n        return [it.data(QtCore.Qt.UserRole) for it in self.list.selectedItems()]\n\n    def _remove_selected(self):\n        ids = self._selected_ids()\n        if not ids:\n            sel = set(cmds.ls(sl=True, long=True) or [])\n            ids = [tid for tid, tr in self.mgr.trails.items() if tr.node in sel]\n        self.mgr.remove(ids)\n\n    def _refresh_list(self):\n        self._updating = True\n        try:\n            selected = set(self._selected_ids())\n            self.list.clear()\n            for tid, tr in self.mgr.trails.items():\n                label = tr.short + ('   (auto)' if tr.auto else '')\n                it = QtWidgets.QListWidgetItem(_swatch(tr.color), label)\n                it.setData(QtCore.Qt.UserRole, tid)\n                it.setFlags(it.flags() | QtCore.Qt.ItemIsUserCheckable)\n                it.setCheckState(QtCore.Qt.Checked if tr.visible else QtCore.Qt.Unchecked)\n                self.list.addItem(it)\n                it.setSelected(tid in selected)\n        finally:\n            self._updating = False\n\n    def _item_changed(self, item):\n        if not self._updating:\n            self.mgr.set_visible(item.data(QtCore.Qt.UserRole),\n                                 item.checkState() == QtCore.Qt.Checked)\n\n    def _pick_color(self, item):\n        tr = self.mgr.trails.get(item.data(QtCore.Qt.UserRole))\n        if tr is None:\n            return\n        c = QtWidgets.QColorDialog.getColor(QtGui.QColor.fromRgbF(*tr.color), self,\n                                            'Trail color')\n        if c.isValid():\n            self.mgr.set_color(tr.id, (c.redF(), c.greenF(), c.blueF()))\n            self._refresh_list()\n\n    # ------------------------------------------------------------ timing\n    def _tween_start(self):\n        if not self._tween_open:\n            cmds.undoInfo(openChunk=True)\n            self._tween_open = True\n\n    def _tween_move(self, value):\n        if self._tween_open:\n            self.mgr.tween(value / 100.0)\n\n    def _tween_end(self):\n        if self._tween_open:\n            cmds.undoInfo(closeChunk=True)\n            self._tween_open = False\n        self.tween.blockSignals(True)\n        self.tween.setValue(0)\n        self.tween.blockSignals(False)\n\n    def _tween_click(self, f):\n        with anim.undo_chunk('FlowTrail favor'):\n            self.mgr.tween(f)\n\n    # ------------------------------------------------------------ arcs\n    def _smooth_start(self):\n        self._smoothing = True\n        self.mgr.preview_smooth(self.smooth.value() / 100.0)\n\n    def _smooth_move(self, value):\n        if getattr(self, '_smoothing', False):\n            self.mgr.preview_smooth(value / 100.0)\n\n    def _smooth_end(self):\n        self._smoothing = False\n        self.mgr.commit_proposed()\n        self.smooth.blockSignals(True)\n        self.smooth.setValue(0)\n        self.smooth.blockSignals(False)\n\n    # ------------------------------------------------------------ space\n    def _set_space(self, mode):\n        node = None\n        if mode == 'camera':\n            try:\n                cam = omui.M3dView.active3dView().getCamera()\n                cam.pop()\n                node = cam.fullPathName()\n            except Exception:\n                node = None\n        elif mode == 'object':\n            sel = cmds.ls(sl=True, type='transform', long=True)\n            if not sel:\n                cmds.warning('FlowTrail: select the object to use as space.')\n                return\n            node = sel[0]\n        SETTINGS.data['space'] = mode if node else 'world'\n        self.mgr.set_space(node)\n        self.space_label.setText('Space: %s' % (node.split('|')[-1] if node else 'World'))\n\n    # ------------------------------------------------------------ layers\n    def _refresh_layers(self):\n        layers = anim.anim_layers()\n        self._updating = True\n        try:\n            self.layer_combo.clear()\n            self.layer_combo.addItem('Auto (Layer Editor selection)', AUTO_LAYER)\n            for l in layers:\n                self.layer_combo.addItem(l, l)\n            cur = SETTINGS.get('edit_layer')\n            idx = self.layer_combo.findData(cur)\n            self.layer_combo.setCurrentIndex(idx if idx >= 0 else 0)\n\n            self.ghost_combo.clear()\n            self.ghost_combo.addItem('Off', '')\n            for l in layers[1:]:\n                self.ghost_combo.addItem('Mute: %s' % l, l)\n            idx = self.ghost_combo.findData(self.mgr.ghost_layer or '')\n            self.ghost_combo.setCurrentIndex(idx if idx >= 0 else 0)\n        finally:\n            self._updating = False\n\n    def _layer_changed(self, index):\n        if not self._updating:\n            self._commit('edit_layer', self.layer_combo.itemData(index))\n\n    def _ghost_changed(self, index):\n        if not self._updating:\n            self.mgr.set_ghost_layer(self.ghost_combo.itemData(index) or None)\n\n    # ------------------------------------------------------------ updates\n    def _toggle_tool(self):\n        self.tool_btn.setChecked(edit_tool.toggle())\n\n    def _poll(self):\n        try:\n            active = edit_tool.is_active()\n            self.tool_btn.setChecked(active)\n            mode = SETTINGS.get('tool_mode')\n            for m, b in self.mode_btns.items():\n                b.setChecked(active and m == mode)\n            if self.mgr.trails:\n                self.mgr.refresh_edit_layer()\n            el = self.mgr.edit_layer\n            self.edit_layer_label.setText(el or 'Base animation (no layers)')\n        except Exception:\n            pass\n\n    def _on_manager(self):\n        self._refresh_list()\n        groups = self.mgr.keys_by_trail()\n        n = sum(len(v) for v in groups.values())\n        if n:\n            frames = sorted(set(int(round(t)) for v in groups.values() for t in v))\n            txt = ', '.join(str(f) for f in frames[:12]) + (' ...' if len(frames) > 12 else '')\n            self.sel_label.setText('%d key(s) selected: %s' % (n, txt))\n        else:\n            self.sel_label.setText('No trail keys selected (tools use the current frame)')\n        self.status.setText('%d trail(s)   %s' % (len(self.mgr.trails), self.mgr.stats))\n\n    def _cleanup(self):\n        if self._on_manager in self.mgr.listeners:\n            self.mgr.listeners.remove(self._on_manager)\n        self._timer.stop()\n\n    def dockCloseEventTriggered(self):\n        self._cleanup()\n\n    def closeEvent(self, event):\n        self._cleanup()\n        super(FlowTrailUI, self).closeEvent(event)\n\n\ndef show():\n    control = OBJECT_NAME + 'WorkspaceControl'\n    if _INSTANCE[0] is not None:\n        try:\n            _INSTANCE[0]._cleanup()\n        except Exception:\n            pass\n    if cmds.workspaceControl(control, q=True, exists=True):\n        cmds.deleteUI(control)\n    win = FlowTrailUI()\n    win.show(dockable=True, floating=True, width=330, height=640)\n    _INSTANCE[0] = win\n    return win",
"aliases": {
"absolute_import": "__future__.absolute_import",
"division": "__future__.division",
"print_function": "__future__.print_function",
"cmds": "maya.cmds",
"omui": "maya.api.OpenMayaUI",
"MayaQWidgetDockableMixin": "maya.app.general.mayaMixin.MayaQWidgetDockableMixin",
"QtCore": "QtCore",
"QtGui": "QtGui",
"QtWidgets": "QtWidgets"
},
"outline": [
{
"q": "_hint",
"k": "def",
"s": 36,
"e": 40,
"doc": "",
"n": "A grey, wrapping help label.",
"c": [],
"b": [
[
11,
"FlowTrailUI._arcs_tab"
],
[
11,
"FlowTrailUI._timing_tab"
],
[
11,
"FlowTrailUI._range_tab"
],
[
11,
"FlowTrailUI._layers_tab"
]
]
},
{
"q": "_swatch",
"k": "def",
"s": 43,
"e": 46,
"doc": "",
"n": "A small square icon of a trail's color for the trail list.",
"c": [],
"b": [
[
11,
"FlowTrailUI._refresh_list"
]
]
},
{
"q": "FlowTrailUI",
"k": "class",
"s": 49,
"e": 611,
"doc": "",
"n": "The dockable panel (the same mixin pattern as other Maya tools).",
"c": [],
"b": [
[
11,
"FlowTrailUI.__init__"
],
[
11,
"FlowTrailUI.closeEvent"
],
[
11,
"show"
]
]
},
{
"q": "FlowTrailUI.__init__",
"k": "def",
"s": 51,
"e": 67,
"doc": "",
"n": "Builds the UI, registers itself as a listener of the manager (so manager changes refresh the window), and starts a timer that polls a few things Maya does not signal (which tool is active, the edit layer) every 0.4 seconds.",
"c": [
[
11,
"FlowTrailUI"
],
[
6,
"get_manager"
],
[
11,
"FlowTrailUI._build"
],
[
11,
"FlowTrailUI._on_manager"
],
[
11,
"FlowTrailUI._poll"
],
[
11,
"FlowTrailUI._refresh_list"
],
[
11,
"FlowTrailUI._refresh_layers"
],
[
11,
"FlowTrailUI._sync_widgets"
]
],
"b": []
},
{
"q": "FlowTrailUI._build",
"k": "def",
"s": 70,
"e": 121,
"doc": "",
"n": "Top row (add, remove, clear, refresh), the Edit Trail Tool button, the auto-trail checkbox, the trail list (checkbox = visible, double-click = color), five tabs, and a status line.",
"c": [
[
11,
"FlowTrailUI._add_selected"
],
[
11,
"FlowTrailUI._remove_selected"
],
[
11,
"FlowTrailUI._toggle_tool"
],
[
11,
"FlowTrailUI._check"
],
[
11,
"FlowTrailUI._item_changed"
],
[
11,
"FlowTrailUI._pick_color"
],
[
11,
"FlowTrailUI._display_tab"
],
[
11,
"FlowTrailUI._arcs_tab"
],
[
11,
"FlowTrailUI._timing_tab"
],
[
11,
"FlowTrailUI._range_tab"
],
[
11,
"FlowTrailUI._layers_tab"
]
],
"b": [
[
11,
"FlowTrailUI.__init__"
]
]
},
{
"q": "FlowTrailUI._display_tab",
"k": "def",
"s": 123,
"e": 158,
"doc": "",
"n": "Display presets (Arc, Spacing, Speed, Full) and every display option.",
"c": [
[
11,
"FlowTrailUI._apply"
],
[
11,
"FlowTrailUI._check"
],
[
11,
"FlowTrailUI._combo"
],
[
11,
"FlowTrailUI._spin"
]
],
"b": [
[
11,
"FlowTrailUI._build"
]
]
},
{
"q": "FlowTrailUI._arcs_tab",
"k": "def",
"s": 160,
"e": 246,
"doc": "",
"n": "The reshaping tools: Pull / Sketch / Smooth Brush mode buttons with their options, the smooth slider (drag to preview, release to apply) and quick buttons, loop tools, and the spacing / new keys / accuracy options.",
"c": [
[
11,
"_hint"
],
[
10,
"set_mode"
],
[
11,
"FlowTrailUI._spin"
],
[
11,
"FlowTrailUI._combo"
],
[
11,
"FlowTrailUI._smooth_start"
],
[
11,
"FlowTrailUI._smooth_move"
],
[
11,
"FlowTrailUI._smooth_end"
],
[
11,
"FlowTrailUI._check"
]
],
"b": [
[
11,
"FlowTrailUI._build"
]
]
},
{
"q": "FlowTrailUI._timing_tab",
"k": "def",
"s": 248,
"e": 315,
"doc": "",
"n": "Key selection, the favor slider and quick percentages, nudge buttons, tangent buttons and edit options.",
"c": [
[
11,
"_hint"
],
[
11,
"FlowTrailUI._tween_start"
],
[
11,
"FlowTrailUI._tween_move"
],
[
11,
"FlowTrailUI._tween_end"
],
[
11,
"FlowTrailUI._tween_click"
],
[
11,
"FlowTrailUI._check"
]
],
"b": [
[
11,
"FlowTrailUI._build"
]
]
},
{
"q": "FlowTrailUI._range_tab",
"k": "def",
"s": 317,
"e": 353,
"doc": "",
"n": "Range mode and sampling, evaluation engine, and the display space (world, active camera, selected object).",
"c": [
[
11,
"FlowTrailUI._combo"
],
[
11,
"FlowTrailUI._spin"
],
[
11,
"_hint"
],
[
11,
"FlowTrailUI._set_space"
]
],
"b": [
[
11,
"FlowTrailUI._build"
]
]
},
{
"q": "FlowTrailUI._layers_tab",
"k": "def",
"s": 355,
"e": 383,
"doc": "",
"n": "Which layer edits go to, and which layer the dashed ghost compares against.",
"c": [
[
11,
"_hint"
],
[
11,
"FlowTrailUI._layer_changed"
],
[
11,
"FlowTrailUI._refresh_layers"
],
[
11,
"FlowTrailUI._ghost_changed"
]
],
"b": [
[
11,
"FlowTrailUI._build"
]
]
},
{
"q": "FlowTrailUI._commit",
"k": "def",
"s": 386,
"e": 390,
"doc": "",
"n": "Saves one setting from a widget and tells the manager, unless the UI itself is filling widgets (`_updating`), which would otherwise echo every value back.",
"c": [],
"b": [
[
11,
"FlowTrailUI._check"
],
[
11,
"FlowTrailUI._spin"
],
[
11,
"FlowTrailUI._combo"
],
[
11,
"FlowTrailUI._layer_changed"
]
]
},
{
"q": "FlowTrailUI._apply",
"k": "def",
"s": 392,
"e": 396,
"doc": "",
"n": "Applies a preset (several settings at once) and refreshes the widgets.",
"c": [
[
11,
"FlowTrailUI._sync_widgets"
]
],
"b": [
[
11,
"FlowTrailUI._display_tab"
]
]
},
{
"q": "FlowTrailUI._check",
"k": "def",
"s": 398,
"e": 404,
"doc": "",
"n": "A checkbox bound to a setting: toggling saves it, and a setter is registered so `_sync_widgets` can update it from settings later.",
"c": [
[
11,
"FlowTrailUI._commit"
]
],
"b": [
[
11,
"FlowTrailUI._build"
],
[
11,
"FlowTrailUI._display_tab"
],
[
11,
"FlowTrailUI._arcs_tab"
],
[
11,
"FlowTrailUI._timing_tab"
]
]
},
{
"q": "FlowTrailUI._spin",
"k": "def",
"s": 406,
"e": 414,
"doc": "",
"n": "Same for a number field. `setKeyboardTracking(False)` means typing \"120\" commits once, not 1, 12 and 120.",
"c": [
[
11,
"FlowTrailUI._commit"
]
],
"b": [
[
11,
"FlowTrailUI._display_tab"
],
[
11,
"FlowTrailUI._arcs_tab"
],
[
11,
"FlowTrailUI._range_tab"
]
]
},
{
"q": "FlowTrailUI._combo",
"k": "def",
"s": 416,
"e": 424,
"doc": "",
"n": "Same for a dropdown of (label, value) pairs.",
"c": [
[
11,
"FlowTrailUI._commit"
]
],
"b": [
[
11,
"FlowTrailUI._display_tab"
],
[
11,
"FlowTrailUI._arcs_tab"
],
[
11,
"FlowTrailUI._range_tab"
]
]
},
{
"q": "FlowTrailUI._sync_widgets",
"k": "def",
"s": 426,
"e": 432,
"doc": "",
"n": "Sets every bound widget from the current settings, with `_updating` on so nothing is committed back.",
"c": [],
"b": [
[
11,
"FlowTrailUI.__init__"
],
[
11,
"FlowTrailUI._apply"
]
]
},
{
"q": "FlowTrailUI._add_selected",
"k": "def",
"s": 435,
"e": 440,
"doc": "",
"n": "Trails for the selected controls.",
"c": [],
"b": [
[
11,
"FlowTrailUI._build"
]
]
},
{
"q": "FlowTrailUI._selected_ids",
"k": "def",
"s": 442,
"e": 443,
"doc": "",
"n": "Trail ids of the rows selected in the list.",
"c": [],
"b": [
[
11,
"FlowTrailUI._remove_selected"
],
[
11,
"FlowTrailUI._refresh_list"
]
]
},
{
"q": "FlowTrailUI._remove_selected",
"k": "def",
"s": 445,
"e": 450,
"doc": "",
"n": "Removes the trails selected in the list, or, if none, the trails of the selected controls.",
"c": [
[
11,
"FlowTrailUI._selected_ids"
]
],
"b": [
[
11,
"FlowTrailUI._build"
]
]
},
{
"q": "FlowTrailUI._refresh_list",
"k": "def",
"s": 452,
"e": 466,
"doc": "",
"n": "Rebuilds the trail list, keeping the list selection.",
"c": [
[
11,
"_swatch"
],
[
11,
"FlowTrailUI._selected_ids"
]
],
"b": [
[
11,
"FlowTrailUI.__init__"
],
[
11,
"FlowTrailUI._pick_color"
],
[
11,
"FlowTrailUI._on_manager"
]
]
},
{
"q": "FlowTrailUI._item_changed",
"k": "def",
"s": 468,
"e": 471,
"doc": "",
"n": "A row's checkbox changed: show or hide that trail.",
"c": [],
"b": [
[
11,
"FlowTrailUI._build"
]
]
},
{
"q": "FlowTrailUI._pick_color",
"k": "def",
"s": 473,
"e": 481,
"doc": "",
"n": "Double-click a row: pick a new trail color.",
"c": [
[
11,
"FlowTrailUI._refresh_list"
]
],
"b": [
[
11,
"FlowTrailUI._build"
]
]
},
{
"q": "FlowTrailUI._tween_start",
"k": "def",
"s": 484,
"e": 487,
"doc": "",
"n": "Favor slider pressed: open an undo chunk so the whole drag is one undo.",
"c": [],
"b": [
[
11,
"FlowTrailUI._timing_tab"
]
]
},
{
"q": "FlowTrailUI._tween_move",
"k": "def",
"s": 489,
"e": 491,
"doc": "",
"n": "Favor slider moving: apply the favor amount.",
"c": [],
"b": [
[
11,
"FlowTrailUI._timing_tab"
]
]
},
{
"q": "FlowTrailUI._tween_end",
"k": "def",
"s": 493,
"e": 499,
"doc": "",
"n": "Released: close the chunk and recenter the slider without firing it.",
"c": [],
"b": [
[
11,
"FlowTrailUI._timing_tab"
]
]
},
{
"q": "FlowTrailUI._tween_click",
"k": "def",
"s": 501,
"e": 503,
"doc": "",
"n": "A percentage button: one favor in its own undo chunk.",
"c": [
[
7,
"undo_chunk"
]
],
"b": [
[
11,
"FlowTrailUI._timing_tab"
]
]
},
{
"q": "FlowTrailUI._smooth_start",
"k": "def",
"s": 506,
"e": 508,
"doc": "",
"n": "Smooth slider pressed: start previewing.",
"c": [],
"b": [
[
11,
"FlowTrailUI._arcs_tab"
]
]
},
{
"q": "FlowTrailUI._smooth_move",
"k": "def",
"s": 510,
"e": 512,
"doc": "",
"n": "Smooth slider moving: update the preview (nothing is keyed).",
"c": [],
"b": [
[
11,
"FlowTrailUI._arcs_tab"
]
]
},
{
"q": "FlowTrailUI._smooth_end",
"k": "def",
"s": 514,
"e": 519,
"doc": "",
"n": "Released: apply the preview, then reset the slider.",
"c": [],
"b": [
[
11,
"FlowTrailUI._arcs_tab"
]
]
},
{
"q": "FlowTrailUI._set_space",
"k": "def",
"s": 522,
"e": 539,
"doc": "",
"n": "Display space: world, the camera of the active viewport (`pop()` turns the camera shape path into its transform), or the selected object.",
"c": [],
"b": [
[
11,
"FlowTrailUI._range_tab"
]
]
},
{
"q": "FlowTrailUI._refresh_layers",
"k": "def",
"s": 542,
"e": 561,
"doc": "",
"n": "Refills the edit layer and ghost layer dropdowns.",
"c": [
[
7,
"anim_layers"
]
],
"b": [
[
11,
"FlowTrailUI.__init__"
],
[
11,
"FlowTrailUI._layers_tab"
]
]
},
{
"q": "FlowTrailUI._layer_changed",
"k": "def",
"s": 563,
"e": 565,
"doc": "",
"n": "Edit layer chosen.",
"c": [
[
11,
"FlowTrailUI._commit"
]
],
"b": [
[
11,
"FlowTrailUI._layers_tab"
]
]
},
{
"q": "FlowTrailUI._ghost_changed",
"k": "def",
"s": 567,
"e": 569,
"doc": "",
"n": "Ghost layer chosen.",
"c": [],
"b": [
[
11,
"FlowTrailUI._layers_tab"
]
]
},
{
"q": "FlowTrailUI._toggle_tool",
"k": "def",
"s": 572,
"e": 573,
"doc": "",
"n": "The Edit Trail Tool button.",
"c": [
[
10,
"toggle"
]
],
"b": [
[
11,
"FlowTrailUI._build"
]
]
},
{
"q": "FlowTrailUI._poll",
"k": "def",
"s": 575,
"e": 587,
"doc": "",
"n": "Runs every 0.4 s: keeps the tool buttons in sync with the active Maya tool (the user can switch tools with hotkeys) and shows the current edit layer.",
"c": [
[
10,
"is_active"
]
],
"b": [
[
11,
"FlowTrailUI.__init__"
]
]
},
{
"q": "FlowTrailUI._on_manager",
"k": "def",
"s": 589,
"e": 599,
"doc": "",
"n": "Called by the manager after every change: refreshes the trail list, the selected-keys label and the status line.",
"c": [
[
11,
"FlowTrailUI._refresh_list"
]
],
"b": [
[
11,
"FlowTrailUI.__init__"
],
[
11,
"FlowTrailUI._cleanup"
]
]
},
{
"q": "FlowTrailUI._cleanup",
"k": "def",
"s": 601,
"e": 604,
"doc": "",
"n": "Stops listening to the manager and stops the timer, so a closed window does not keep running code.",
"c": [
[
11,
"FlowTrailUI._on_manager"
]
],
"b": [
[
11,
"FlowTrailUI.dockCloseEventTriggered"
],
[
11,
"FlowTrailUI.closeEvent"
]
]
},
{
"q": "FlowTrailUI.dockCloseEventTriggered",
"k": "def",
"s": 606,
"e": 607,
"doc": "",
"n": "Called by the dockable mixin when the docked panel is closed.",
"c": [
[
11,
"FlowTrailUI._cleanup"
]
],
"b": []
},
{
"q": "FlowTrailUI.closeEvent",
"k": "def",
"s": 609,
"e": 611,
"doc": "",
"n": "Called when the floating window closes.",
"c": [
[
11,
"FlowTrailUI._cleanup"
],
[
11,
"FlowTrailUI"
]
],
"b": []
},
{
"q": "show",
"k": "def",
"s": 614,
"e": 626,
"doc": "",
"n": "Cleans up and deletes any previous window, then opens a new floating, dockable one and keeps it in `_INSTANCE`.",
"c": [
[
11,
"FlowTrailUI"
]
],
"b": [
[
1,
"show"
]
]
}
],
"lines": {
"64": "Poll every 400 ms for state Maya does not send signals about.",
"130": "`v=values` freezes this preset for this button (otherwise every button would apply the last preset of the loop).",
"403": "Remember how to update this widget from a setting value; `_sync_widgets` calls every one of these.",
"410": "Commit only when typing is finished, not on every keystroke.",
"527": "Removes the last element of the DAG path: from the camera shape to its transform."
}
},
{
"path": "flowtrail/plugin/flowTrailNode.py",
"lang": "py",
"note": "The Viewport 2.0 plugin that draws the trails. The node stores only a trail id; everything it draws is prepared in Python by `core` and `draw`, so each redraw is just a few array uploads. This split is what keeps the viewport fast while scrubbing.",
"code": "# -*- coding: utf-8 -*-\n\"\"\"\nFlowTrail viewport node (Viewport 2.0 draw override, Python API 2.0).\n\nThe node holds no data: it only stores a trail id. Everything it draws comes\npre-computed from flowtrail.registry, so a redraw is just a few array uploads.\n\"\"\"\nimport sys\nimport traceback\n\nimport maya.api.OpenMaya as om\nimport maya.api.OpenMayaRender as omr\nimport maya.api.OpenMayaUI as omui\n\n\ndef maya_useNewAPI():\n    pass\n\n\nNODE_NAME = 'flowTrail'\nNODE_ID = om.MTypeId(0x0007F7A1)\nCLASSIFICATION = 'drawdb/geometry/flowTrail'\nREGISTRANT = 'FlowTrailPlugin'\n\n_REG = [None]\n_ERRORS = [0]\n\n\ndef _registry():\n    if _REG[0] is None:\n        try:\n            from flowtrail import registry\n            _REG[0] = registry\n        except Exception:\n            return None\n    return _REG[0]\n\n\nclass FlowTrailNode(omui.MPxLocatorNode):\n    aTrailId = None\n\n    def __init__(self):\n        omui.MPxLocatorNode.__init__(self)\n\n    @staticmethod\n    def creator():\n        return FlowTrailNode()\n\n    @staticmethod\n    def initialize():\n        fn = om.MFnTypedAttribute()\n        FlowTrailNode.aTrailId = fn.create('trailId', 'tid', om.MFnData.kString)\n        fn.storable = False\n        om.MPxNode.addAttribute(FlowTrailNode.aTrailId)\n\n    def isBounded(self):\n        return False\n\n\nclass FlowTrailData(om.MUserData):\n    def __init__(self):\n        om.MUserData.__init__(self, False)\n        self.packet = None\n\n\nclass FlowTrailDrawOverride(omr.MPxDrawOverride):\n\n    @staticmethod\n    def creator(obj):\n        return FlowTrailDrawOverride(obj)\n\n    @staticmethod\n    def draw(context, data):\n        return\n\n    def __init__(self, obj):\n        omr.MPxDrawOverride.__init__(self, obj, FlowTrailDrawOverride.draw, True)\n\n    def supportedDrawAPIs(self):\n        return omr.MRenderer.kAllDevices\n\n    def isBounded(self, objPath, cameraPath):\n        return False\n\n    def boundingBox(self, objPath, cameraPath):\n        return om.MBoundingBox()\n\n    def hasUIDrawables(self):\n        return True\n\n    def prepareForDraw(self, objPath, cameraPath, frameContext, oldData):\n        data = oldData if isinstance(oldData, FlowTrailData) else FlowTrailData()\n        data.packet = None\n        reg = _registry()\n        if reg is None:\n            return data\n        try:\n            tid = om.MPlug(objPath.node(), FlowTrailNode.aTrailId).asString()\n            view_dir = frameContext.getTuple(omr.MFrameContext.kViewDirection)\n            view_pos = frameContext.getTuple(omr.MFrameContext.kViewPosition)\n            data.packet = reg.build_packet(tid, view_dir, view_pos)\n        except Exception:\n            if _ERRORS[0] < 5:\n                _ERRORS[0] += 1\n                traceback.print_exc()\n        return data\n\n    def addUIDrawables(self, objPath, dm, frameContext, data):\n        pk = getattr(data, 'packet', None)\n        if pk is None:\n            return\n        M = omr.MUIDrawManager\n        xray = bool(pk.on_top) and hasattr(dm, 'beginDrawInXray')\n        if xray:\n            dm.beginDrawInXray()\n        else:\n            dm.beginDrawable()\n            if pk.on_top:\n                try:\n                    dm.setDepthPriority(omr.MRenderItem.sActiveWireDepthPriority)\n                except Exception:\n                    pass\n        try:\n            if pk.ghost:\n                dm.setColor(pk.ghost_color)\n                dm.setLineWidth(max(1.0, pk.line_width * 0.75))\n                dm.setLineStyle(M.kDashed)\n                for pts in pk.ghost:\n                    dm.lineStrip(pts, False)\n                dm.setLineStyle(M.kSolid)\n\n            dm.setLineWidth(pk.line_width)\n            for pts, cols in pk.lines:\n                dm.mesh(M.kLineStrip, pts, None, cols)\n\n            if pk.ticks is not None:\n                dm.setLineWidth(max(1.0, pk.line_width * 0.75))\n                dm.mesh(M.kLines, pk.ticks, None, pk.tick_cols)\n\n            if pk.live is not None and pk.current is not None:\n                dm.setColor(pk.live_color)\n                dm.setLineWidth(1.5)\n                dm.setLineStyle(M.kDashed)\n                dm.line(pk.current, pk.live)\n                dm.setLineStyle(M.kSolid)\n\n            if pk.frames is not None and len(pk.frames):\n                dm.setPointSize(pk.point_size)\n                dm.mesh(M.kPoints, pk.frames, None, pk.frame_cols)\n\n            if pk.sel is not None:\n                dm.setColor(pk.sel_color)\n                dm.setPointSize(pk.key_size + 6.0)\n                dm.points(pk.sel, False)\n\n            if pk.keys is not None and len(pk.keys):\n                dm.setPointSize(pk.key_size)\n                dm.mesh(M.kPoints, pk.keys, None, pk.key_cols)\n\n            if pk.current is not None:\n                dm.setColor(pk.current_color)\n                dm.setPointSize(max(4.0, pk.key_size * 0.65))\n                dm.point(pk.current)\n\n            if pk.live is not None:\n                dm.setColor(pk.live_color)\n                dm.setPointSize(max(4.0, pk.key_size * 0.65))\n                dm.point(pk.live)\n\n            if pk.preview is not None:\n                dm.setColor(pk.sel_color or pk.current_color)\n                dm.setPointSize(pk.key_size + 4.0)\n                dm.point(pk.preview[0])\n                dm.setFontSize(M.kDefaultFontSize)\n                dm.text(pk.preview[0], pk.preview[1], M.kLeft)\n\n            if pk.proposed is not None and len(pk.proposed) > 1:\n                dm.setColor(pk.proposed_color)\n                dm.setLineWidth(pk.line_width + 1.0)\n                dm.lineStrip(pk.proposed, False)\n                dm.setPointSize(pk.point_size)\n                dm.points(pk.proposed, False)\n\n            if pk.stroke is not None:\n                dm.setColor(pk.stroke_color)\n                dm.setLineWidth(pk.line_width + 1.0)\n                dm.lineStrip(pk.stroke, False)\n\n            if pk.labels:\n                dm.setColor(pk.label_color)\n                dm.setFontSize(M.kSmallFontSize)\n                for p, s in pk.labels:\n                    dm.text(p, s, M.kLeft)\n        finally:\n            if xray:\n                dm.endDrawInXray()\n            else:\n                dm.endDrawable()\n\n\ndef initializePlugin(obj):\n    plugin = om.MFnPlugin(obj, 'FlowTrail', '1.0', 'Any')\n    plugin.registerNode(NODE_NAME, NODE_ID, FlowTrailNode.creator, FlowTrailNode.initialize,\n                        om.MPxNode.kLocatorNode, CLASSIFICATION)\n    omr.MDrawRegistry.registerDrawOverrideCreator(CLASSIFICATION, REGISTRANT,\n                                                   FlowTrailDrawOverride.creator)\n\n\ndef uninitializePlugin(obj):\n    plugin = om.MFnPlugin(obj)\n    omr.MDrawRegistry.deregisterDrawOverrideCreator(CLASSIFICATION, REGISTRANT)\n    plugin.deregisterNode(NODE_ID)",
"aliases": {
"sys": "sys",
"traceback": "traceback",
"om": "maya.api.OpenMaya",
"omr": "maya.api.OpenMayaRender",
"omui": "maya.api.OpenMayaUI"
},
"outline": [
{
"q": "maya_useNewAPI",
"k": "def",
"s": 16,
"e": 17,
"doc": "",
"n": "An empty function whose presence tells Maya this plugin uses Python API 2.0.",
"c": [],
"b": []
},
{
"q": "_registry",
"k": "def",
"s": 29,
"e": 36,
"doc": "",
"n": "Imports `flowtrail.registry` the first time it is needed and keeps it. The plugin never imports `core` directly, only this small shared module.",
"c": [],
"b": [
[
12,
"FlowTrailDrawOverride.prepareForDraw"
]
]
},
{
"q": "FlowTrailNode",
"k": "class",
"s": 39,
"e": 57,
"doc": "",
"n": "A locator node type (`MPxLocatorNode`): it lives in the scene and can be drawn, but has no geometry. One per trail.",
"c": [],
"b": [
[
12,
"FlowTrailNode.creator"
],
[
12,
"FlowTrailNode.initialize"
],
[
12,
"FlowTrailDrawOverride.prepareForDraw"
],
[
12,
"initializePlugin"
]
]
},
{
"q": "FlowTrailNode.__init__",
"k": "def",
"s": 42,
"e": 43,
"doc": "",
"n": "Calls the parent constructor.",
"c": [],
"b": []
},
{
"q": "FlowTrailNode.creator",
"k": "def",
"s": 45,
"e": 47,
"doc": "",
"n": "Maya calls this to make a new node instance.",
"c": [
[
12,
"FlowTrailNode"
]
],
"b": [
[
12,
"initializePlugin"
]
]
},
{
"q": "FlowTrailNode.initialize",
"k": "def",
"s": 49,
"e": 54,
"doc": "",
"n": "Defines the node's one attribute: `trailId`, a string. `storable = False` means it is never written to a file (the nodes are deleted before saving anyway).",
"c": [
[
12,
"FlowTrailNode"
]
],
"b": [
[
12,
"initializePlugin"
]
]
},
{
"q": "FlowTrailNode.isBounded",
"k": "def",
"s": 56,
"e": 57,
"doc": "",
"n": "No bounding box: the trail can be anywhere, and a box would make Maya cull it when the node's origin is off screen.",
"c": [],
"b": []
},
{
"q": "FlowTrailData",
"k": "class",
"s": 60,
"e": 63,
"doc": "",
"n": "The per-draw data passed from preparation to drawing: just the packet.",
"c": [],
"b": [
[
12,
"FlowTrailDrawOverride.prepareForDraw"
]
]
},
{
"q": "FlowTrailData.__init__",
"k": "def",
"s": 61,
"e": 63,
"doc": "",
"n": "Empty packet. `False` tells Maya not to delete the data after each draw, so it can be reused.",
"c": [],
"b": []
},
{
"q": "FlowTrailDrawOverride",
"k": "class",
"s": 66,
"e": 198,
"doc": "",
"n": "Viewport 2.0 draw override: Maya calls `prepareForDraw` and then `addUIDrawables` for each trail node on every redraw.",
"c": [],
"b": [
[
12,
"FlowTrailDrawOverride.creator"
],
[
12,
"FlowTrailDrawOverride.__init__"
],
[
12,
"initializePlugin"
]
]
},
{
"q": "FlowTrailDrawOverride.creator",
"k": "def",
"s": 68,
"e": 70,
"doc": "",
"n": "Maya calls this to create the override for a node.",
"c": [
[
12,
"FlowTrailDrawOverride"
]
],
"b": [
[
12,
"initializePlugin"
]
]
},
{
"q": "FlowTrailDrawOverride.draw",
"k": "def",
"s": 72,
"e": 74,
"doc": "",
"n": "Required callback; unused because everything is drawn as UI drawables.",
"c": [],
"b": [
[
12,
"FlowTrailDrawOverride.__init__"
]
]
},
{
"q": "FlowTrailDrawOverride.__init__",
"k": "def",
"s": 76,
"e": 77,
"doc": "",
"n": "Registers with Maya.",
"c": [
[
12,
"FlowTrailDrawOverride.draw"
],
[
12,
"FlowTrailDrawOverride"
]
],
"b": []
},
{
"q": "FlowTrailDrawOverride.supportedDrawAPIs",
"k": "def",
"s": 79,
"e": 80,
"doc": "",
"n": "Works with every viewport backend (OpenGL, DirectX).",
"c": [],
"b": []
},
{
"q": "FlowTrailDrawOverride.isBounded",
"k": "def",
"s": 82,
"e": 83,
"doc": "",
"n": "Unbounded, same reason as the node.",
"c": [],
"b": []
},
{
"q": "FlowTrailDrawOverride.boundingBox",
"k": "def",
"s": 85,
"e": 86,
"doc": "",
"n": "An empty box, required by the API.",
"c": [],
"b": []
},
{
"q": "FlowTrailDrawOverride.hasUIDrawables",
"k": "def",
"s": 88,
"e": 89,
"doc": "",
"n": "Yes: drawing happens in `addUIDrawables`.",
"c": [],
"b": []
},
{
"q": "FlowTrailDrawOverride.prepareForDraw",
"k": "def",
"s": 91,
"e": 106,
"doc": "",
"n": "Reads the trail id from the node, gets the camera's view direction and position, and asks `registry.build_packet` for the ready-made drawing data. Errors are printed at most 5 times so a bug cannot flood the Script Editor on every redraw.",
"c": [
[
12,
"FlowTrailData"
],
[
12,
"_registry"
],
[
12,
"FlowTrailNode"
]
],
"b": []
},
{
"q": "FlowTrailDrawOverride.addUIDrawables",
"k": "def",
"s": 108,
"e": 198,
"doc": "",
"n": "Draws the packet with Maya's `MUIDrawManager`, back to front: the dashed ghost, the colored path, spacing ticks, the dashed line to the live position, frame dots, selected keys (bigger, behind), keys, the current frame, the live position, the retime preview with its label, the reshape preview, the sketch stroke and the frame labels. \"On top\" mode draws in X-ray so the trail is never hidden by the character.",
"c": [],
"b": []
},
{
"q": "initializePlugin",
"k": "def",
"s": 201,
"e": 206,
"doc": "",
"n": "Called when the plugin loads: registers the node type and its draw override.",
"c": [
[
12,
"FlowTrailNode.initialize"
],
[
12,
"FlowTrailNode"
],
[
12,
"FlowTrailNode.creator"
],
[
12,
"FlowTrailDrawOverride.creator"
],
[
12,
"FlowTrailDrawOverride"
]
],
"b": []
},
{
"q": "uninitializePlugin",
"k": "def",
"s": 209,
"e": 212,
"doc": "",
"n": "Called when it unloads: removes them again.",
"c": [],
"b": []
}
],
"lines": {
"21": "Every custom node type needs a unique id. Ids below 0x80000 are reserved for local, in-house use; a tool shared with other studios should use an id block registered with Autodesk.",
"22": "The draw classification links the node type to its draw override.",
"53": "Never saved to the scene file.",
"113": "X-ray drawing (always visible through geometry) exists only in newer Maya; otherwise a high depth priority is used.",
"134": "One call draws the whole path with a color per point: much faster than one line per segment."
}
},
{
"path": "flowtrail/tests/test_reshape.py",
"lang": "py",
"note": "Tests of the pure path math in `reshape.py`, runnable outside Maya: `python3 flowtrail/tests/test_reshape.py`.",
"code": "# -*- coding: utf-8 -*-\n\"\"\"Run outside of Maya:  python3 flowtrail/tests/test_reshape.py\"\"\"\nfrom __future__ import absolute_import, division, print_function\n\nimport math\nimport os\nimport random\nimport sys\nimport unittest\n\nsys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))\nimport reshape as r  # noqa: E402\n\n\ndef circle(n=120, radius=10.0, noise=0.0, seed=1):\n    \"\"\"Closed 3D loop: the last point repeats the first.\"\"\"\n    rnd = random.Random(seed)\n    pts = []\n    for i in range(n):\n        a = 2.0 * math.pi * i / n\n        pts.append((radius * math.cos(a) + rnd.uniform(-noise, noise),\n                    radius * math.sin(a) + rnd.uniform(-noise, noise),\n                    rnd.uniform(-noise, noise)))\n    return pts + [pts[0]]\n\n\ndef radius_error(pts, radius=10.0):\n    return max(abs(math.hypot(p[0], p[1]) - radius) for p in pts)\n\n\ndef corner_angle(a, b, c):\n    \"\"\"Direction change at b, in degrees.\"\"\"\n    u = [y - x for x, y in zip(a, b)]\n    v = [y - x for x, y in zip(b, c)]\n    dot = sum(x * y for x, y in zip(u, v))\n    lens = math.sqrt(sum(x * x for x in u)) * math.sqrt(sum(x * x for x in v))\n    return math.degrees(math.acos(max(-1.0, min(1.0, dot / lens))))\n\n\nclass Smoothing(unittest.TestCase):\n\n    def test_removes_noise_without_shrinking_the_loop(self):\n        noisy = circle(noise=0.5)\n        out, closed = r.smooth_path(noisy, 0.5, spacing=r.SPACING_FREE)\n        self.assertTrue(closed)\n        # measured far from the seam: the pinned frame keeps its own noise,\n        # and that offset fades out over half the path\n        self.assertLess(radius_error(out[45:-45]), radius_error(noisy[45:-45]) * 0.5)\n        mean = sum(math.hypot(p[0], p[1]) for p in out) / len(out)\n        self.assertAlmostEqual(mean, 10.0, delta=0.25)\n\n    def test_stronger_means_smoother(self):\n        noisy = circle(noise=0.5)\n        def roughness(pts):\n            return sum(corner_angle(a, b, c) for a, b, c in zip(pts, pts[1:], pts[2:]))\n        light = r.smooth_path(noisy, 0.2, spacing=r.SPACING_FREE)[0]\n        strong = r.smooth_path(noisy, 0.9, spacing=r.SPACING_FREE)[0]\n        self.assertLess(roughness(light), roughness(noisy))\n        self.assertLess(roughness(strong), roughness(light))\n\n    def test_ends_never_move(self):\n        noisy = circle(noise=0.5)\n        for mode in (r.SPACING_KEEP, r.SPACING_EVEN, r.SPACING_FREE):\n            out, _ = r.smooth_path(noisy, 1.0, spacing=mode)\n            self.assertEqual(tuple(out[0]), tuple(noisy[0]))\n            self.assertEqual(tuple(out[-1]), tuple(noisy[-1]))\n            self.assertEqual(len(out), len(noisy))\n\n    def test_inner_pins_never_move(self):\n        noisy = circle(noise=0.5)\n        out, _ = r.smooth_path(noisy, 1.0, pins=[30, 60, 90])\n        for i in (30, 60, 90):\n            self.assertEqual(tuple(out[i]), tuple(noisy[i]))\n\n    def test_open_path_is_not_treated_as_a_loop(self):\n        line = [(float(i), 0.0, 0.0) for i in range(30)]\n        self.assertFalse(r.smooth_path(line, 0.5)[1])\n\n    def test_loop_seam_kink_gets_rounded(self):\n        # teardrop: a real corner exactly on the start/end frame\n        n = 80\n        pts = []\n        for i in range(n):\n            a = 2.0 * math.pi * i / n\n            pts.append((10.0 * math.cos(a), 10.0 * math.sin(a) * math.sin(a / 2.0), 0.0))\n        pts.append(pts[0])\n        before = corner_angle(pts[-2], pts[0], pts[1])\n        self.assertGreater(before, 60.0)\n        out, closed = r.smooth_path(pts, 0.8, spacing=r.SPACING_FREE)\n        self.assertTrue(closed)\n        self.assertEqual(tuple(out[0]), tuple(pts[0]))\n        self.assertLess(corner_angle(out[-2], out[0], out[1]), before * 0.5)\n\n    def test_full_strength_removes_arc_bumps_but_keeps_the_arc(self):\n        # one big arc with a 16 frame bump riding on it\n        pts = [(float(i), 40.0 * math.sin(math.pi * i / 120.0) +\n                math.sin(2.0 * math.pi * i / 16.0), 0.0) for i in range(121)]\n        out = r.lowpass(pts, 1.0)\n        for i in range(10, 111):\n            self.assertAlmostEqual(out[i][1], 40.0 * math.sin(math.pi * i / 120.0), delta=0.25)\n\n    def test_big_loop_shape_survives_every_strength(self):\n        for n in (24, 60, 120, 240):\n            loop = [(10.0 * math.cos(2.0 * math.pi * i / n),\n                     10.0 * math.sin(2.0 * math.pi * i / n), 0.0) for i in range(n)]\n            loop.append(loop[0])\n            for s in (0.25, 0.5, 0.75, 1.0):\n                self.assertLess(radius_error(r.lowpass(loop, s, True)), 1e-6)\n\n    def test_no_overshoot_ringing_on_a_sharp_corner(self):\n        pts = [(float(i), float(min(i, 60 - i)), 0.0) for i in range(61)]\n        for s in (0.25, 0.5, 0.75, 1.0):\n            self.assertLess(max(p[1] for p in r.lowpass(pts, s)), 30.5)\n\n    def test_zero_strength_changes_nothing(self):\n        noisy = circle(noise=0.5)\n        self.assertEqual(r.lowpass(noisy, 0.0, True), noisy)\n\n\nclass Spacing(unittest.TestCase):\n\n    def path_with_ease(self):\n        # eased: tight spacing at both ends, wide in the middle\n        pts = []\n        for i in range(41):\n            u = i / 40.0\n            s = u * u * (3.0 - 2.0 * u)\n            pts.append((20.0 * s, 4.0 * math.sin(s * math.pi), 0.0))\n        return pts\n\n    def test_keep_preserves_each_frames_share_of_the_path(self):\n        orig = self.path_with_ease()\n        out, _ = r.smooth_path(orig, 0.6, spacing=r.SPACING_KEEP)\n        for a, b in zip(r.spacing_params(orig), r.spacing_params(out)):\n            self.assertAlmostEqual(a, b, delta=0.01)\n\n    def test_even_spacing(self):\n        orig = self.path_with_ease()\n        out, _ = r.smooth_path(orig, 0.3, spacing=r.SPACING_EVEN)\n        gaps = [r.dist(a, b) for a, b in zip(out[:-1], out[1:])]\n        self.assertLess(max(gaps) - min(gaps), max(gaps) * 0.1)\n\n    def test_holds_stay_holds(self):\n        orig = [(0.0, 0.0, 0.0)] * 10 + [(float(i), 0.0, 0.0) for i in range(1, 11)]\n        out = r.respace(list(orig), orig, [0, 9, 19])\n        for p in out[:10]:\n            self.assertEqual(tuple(p), (0.0, 0.0, 0.0))\n\n\nclass Pins(unittest.TestCase):\n\n    def test_error_fades_and_middle_is_untouched(self):\n        orig = [(float(i), 0.0) for i in range(21)]\n        moved = [(p[0], p[1] + 5.0) for p in orig]\n        out = r.pin_correct(moved, orig, [0, 20])\n        self.assertEqual(tuple(out[0]), orig[0])\n        self.assertEqual(tuple(out[20]), orig[20])\n        self.assertAlmostEqual(out[10][1], 5.0)\n        heights = [p[1] for p in out[:11]]\n        self.assertEqual(heights, sorted(heights))\n\n\nclass Strokes(unittest.TestCase):\n\n    def test_hand_wobble_is_removed_keeping_size_and_ends(self):\n        raw = [(float(x), 100.0 + 5.0 * math.sin(2.0 * math.pi * x / 50.0))\n               for x in range(0, 601, 2)]\n        out = r.clean_stroke(raw, 1.0)\n        self.assertLess(max(abs(p[1] - 100.0) for p in out[10:-10]), 1.0)\n        self.assertEqual(tuple(out[0]), raw[0])\n        self.assertEqual(tuple(out[-1]), raw[-1])\n        self.assertGreater(r.arc_lengths(out)[-1], 595.0)\n\n    def test_stroke_drawing_a_circle_stays_a_circle(self):\n        raw = [(200.0 + 100.0 * math.cos(2.0 * math.pi * i / 300),\n                200.0 + 100.0 * math.sin(2.0 * math.pi * i / 300)) for i in range(301)]\n        for smooth in (0.25, 0.5, 1.0):\n            out = r.clean_stroke(raw, smooth)\n            self.assertLess(max(abs(math.hypot(p[0] - 200.0, p[1] - 200.0) - 100.0)\n                                for p in out), 0.2)\n\n    def test_hand_drawn_loop_with_a_gap_is_closed(self):\n        raw = [(200.0 + 100.0 * math.cos(2.0 * math.pi * i / 300),\n                200.0 + 100.0 * math.sin(2.0 * math.pi * i / 300)) for i in range(290)]\n        out = r.clean_stroke(raw, 0.5)\n        self.assertEqual(tuple(out[0]), tuple(out[-1]))\n\n    def test_single_click_stroke_does_not_crash(self):\n        self.assertEqual(len(r.clean_stroke([(5.0, 5.0), (5.0, 5.0)])), 1)\n\n    def test_partial_stroke_finds_the_span(self):\n        frames = [(float(i * 10), 0.0) for i in range(50)]\n        self.assertEqual(r.pick_span((102.0, 5.0), (301.0, 5.0), frames, slack=2.0), (10, 30))\n\n    def test_stroke_started_on_a_frame_keeps_that_frame(self):\n        # dense frames all within the slack: snap to the nearest, not the earliest\n        frames = [(float(i * 3), 0.0) for i in range(50)]\n        self.assertEqual(r.pick_span(frames[10], frames[30], frames), (10, 30))\n\n    def test_stroke_on_one_spot_is_no_span(self):\n        frames = [(float(i * 3), 0.0) for i in range(50)]\n        self.assertIsNone(r.pick_span(frames[10], (31.0, 0.0), frames))\n\n    def test_stroke_over_a_whole_loop_takes_the_whole_loop(self):\n        loop = [(100.0 * math.cos(2.0 * math.pi * i / 60), 100.0 * math.sin(2.0 * math.pi * i / 60))\n                for i in range(61)]\n        self.assertEqual(r.pick_span(loop[0], loop[0], loop), (0, 60))\n\n    def test_backwards_stroke(self):\n        frames = [(float(i * 10), 0.0) for i in range(50)]\n        self.assertEqual(r.pick_span((301.0, 5.0), (102.0, 5.0), frames, slack=2.0), (10, 30))\n        self.assertFalse(r.stroke_is_forward(list(reversed(frames)), frames))\n        self.assertTrue(r.stroke_is_forward(frames, frames))\n\n    def test_backwards_stroke_on_a_loop(self):\n        loop = [(100.0 * math.cos(2.0 * math.pi * i / 60), 100.0 * math.sin(2.0 * math.pi * i / 60))\n                for i in range(61)]\n        self.assertFalse(r.stroke_is_forward(list(reversed(loop)), loop))\n\n    def test_stroke_samples_follow_spacing(self):\n        stroke = [(0.0, 0.0), (100.0, 0.0)]\n        self.assertEqual(r.sample_stroke(stroke, [0.0, 0.25, 1.0]),\n                         [(0.0, 0.0), (25.0, 0.0), (100.0, 0.0)])\n\n\nclass KeyReduction(unittest.TestCase):\n\n    def test_smooth_offset_needs_few_keys(self):\n        times = [float(i) for i in range(101)]\n        deltas = [(math.sin(math.pi * t / 100.0), 0.0, 0.0) for t in times]\n        keys = r.choose_frames(times, deltas, [0.0, 100.0], 0.01)\n        self.assertLess(len(keys), 16)\n        for t in times:\n            got = r.delta_at(t, keys, [(math.sin(math.pi * k / 100.0), 0.0, 0.0) for k in keys])\n            self.assertLess(abs(got[0] - math.sin(math.pi * t / 100.0)), 0.011)\n\n    def test_required_frames_are_kept(self):\n        times = [float(i) for i in range(21)]\n        keys = r.choose_frames(times, [(0.0, 0.0, 0.0)] * 21, [0.0, 7.0, 20.0], 0.01)\n        self.assertEqual(keys, [0.0, 7.0, 20.0])\n\n    def test_worst_frames(self):\n        times = [0.0, 1.0, 2.0, 3.0, 4.0, 5.0, 6.0]\n        errors = [0.0, 0.5, 0.9, 0.5, 0.0, 0.7, 0.0]\n        self.assertEqual(r.worst_frames(times, errors, 0.1, set()), [2.0, 5.0])\n        self.assertEqual(r.worst_frames(times, errors, 0.1, set([2.0])), [5.0])\n\n    def test_delta_at_between_samples(self):\n        self.assertEqual(r.delta_at(0.5, [0.0, 1.0], [(0.0,), (2.0,)]), (1.0,))\n\n\nif __name__ == '__main__':\n    unittest.main()",
"aliases": {
"absolute_import": "__future__.absolute_import",
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
"q": "circle",
"k": "def",
"s": 15,
"e": 24,
"doc": "Closed 3D loop: the last point repeats the first.",
"n": "A closed 3D circle (the last point repeats the first), optionally with random noise, as test input.",
"c": [],
"b": [
[
13,
"Smoothing.test_removes_noise_without_shrinking_the_loop"
],
[
13,
"Smoothing.test_stronger_means_smoother"
],
[
13,
"Smoothing.test_ends_never_move"
],
[
13,
"Smoothing.test_inner_pins_never_move"
],
[
13,
"Smoothing.test_zero_strength_changes_nothing"
]
]
},
{
"q": "radius_error",
"k": "def",
"s": 27,
"e": 28,
"doc": "",
"n": "How far the points are from the ideal radius: measures shrinking or wobble.",
"c": [],
"b": [
[
13,
"Smoothing.test_removes_noise_without_shrinking_the_loop"
],
[
13,
"Smoothing.test_big_loop_shape_survives_every_strength"
]
]
},
{
"q": "corner_angle",
"k": "def",
"s": 31,
"e": 37,
"doc": "Direction change at b, in degrees.",
"n": "The angle at a point between its neighbors: measures how sharp a corner is.",
"c": [],
"b": [
[
13,
"Smoothing.test_stronger_means_smoother.roughness"
],
[
13,
"Smoothing.test_loop_seam_kink_gets_rounded"
]
]
},
{
"q": "Smoothing",
"k": "class",
"s": 40,
"e": 117,
"doc": "",
"n": "Tests for `lowpass` / `smooth_path`.",
"c": [],
"b": []
},
{
"q": "Smoothing.test_removes_noise_without_shrinking_the_loop",
"k": "def",
"s": 42,
"e": 50,
"doc": "",
"n": "A noisy circle comes out smooth **and** keeps its radius (plain averaging would shrink it).",
"c": [
[
13,
"circle"
],
[
8,
"smooth_path"
],
[
13,
"radius_error"
]
],
"b": []
},
{
"q": "Smoothing.test_stronger_means_smoother",
"k": "def",
"s": 52,
"e": 59,
"doc": "",
"n": "More strength gives a smoother path.",
"c": [
[
13,
"circle"
],
[
8,
"smooth_path"
],
[
13,
"Smoothing.test_stronger_means_smoother.roughness"
]
],
"b": []
},
{
"q": "Smoothing.test_stronger_means_smoother.roughness",
"k": "def",
"s": 54,
"e": 55,
"doc": "",
"n": "A roughness measure for comparing strengths.",
"c": [
[
13,
"corner_angle"
]
],
"b": [
[
13,
"Smoothing.test_stronger_means_smoother"
]
]
},
{
"q": "Smoothing.test_ends_never_move",
"k": "def",
"s": 61,
"e": 67,
"doc": "",
"n": "The first and last points stay exactly in place.",
"c": [
[
13,
"circle"
],
[
8,
"smooth_path"
]
],
"b": []
},
{
"q": "Smoothing.test_inner_pins_never_move",
"k": "def",
"s": 69,
"e": 73,
"doc": "",
"n": "Pinned points in the middle stay exactly in place.",
"c": [
[
13,
"circle"
],
[
8,
"smooth_path"
]
],
"b": []
},
{
"q": "Smoothing.test_open_path_is_not_treated_as_a_loop",
"k": "def",
"s": 75,
"e": 77,
"doc": "",
"n": "An open arc is not mistaken for a loop.",
"c": [
[
8,
"smooth_path"
]
],
"b": []
},
{
"q": "Smoothing.test_loop_seam_kink_gets_rounded",
"k": "def",
"s": 79,
"e": 92,
"doc": "",
"n": "A sharp kink at the seam of a loop is smoothed, even though the seam frame itself does not move.",
"c": [
[
13,
"corner_angle"
],
[
8,
"smooth_path"
]
],
"b": []
},
{
"q": "Smoothing.test_full_strength_removes_arc_bumps_but_keeps_the_arc",
"k": "def",
"s": 94,
"e": 100,
"doc": "",
"n": "Full strength removes bumps but the overall arc survives.",
"c": [
[
8,
"lowpass"
]
],
"b": []
},
{
"q": "Smoothing.test_big_loop_shape_survives_every_strength",
"k": "def",
"s": 102,
"e": 108,
"doc": "",
"n": "The big shape of a loop is never destroyed, at any strength.",
"c": [
[
8,
"lowpass"
],
[
13,
"radius_error"
]
],
"b": []
},
{
"q": "Smoothing.test_no_overshoot_ringing_on_a_sharp_corner",
"k": "def",
"s": 110,
"e": 113,
"doc": "",
"n": "No ripples next to a sharp corner (that is what the soft `_gain` fade prevents).",
"c": [
[
8,
"lowpass"
]
],
"b": []
},
{
"q": "Smoothing.test_zero_strength_changes_nothing",
"k": "def",
"s": 115,
"e": 117,
"doc": "",
"n": "Strength 0 returns the input unchanged.",
"c": [
[
13,
"circle"
],
[
8,
"lowpass"
]
],
"b": []
},
{
"q": "Spacing",
"k": "class",
"s": 120,
"e": 147,
"doc": "",
"n": "Tests for `respace` and `spacing_params`.",
"c": [],
"b": []
},
{
"q": "Spacing.path_with_ease",
"k": "def",
"s": 122,
"e": 129,
"doc": "",
"n": "A test path whose frames bunch up at the ends (an ease in and out).",
"c": [],
"b": [
[
13,
"Spacing.test_keep_preserves_each_frames_share_of_the_path"
],
[
13,
"Spacing.test_even_spacing"
]
]
},
{
"q": "Spacing.test_keep_preserves_each_frames_share_of_the_path",
"k": "def",
"s": 131,
"e": 135,
"doc": "",
"n": "\"Keep\" mode: each frame stays at the same fraction of the path, so the ease survives.",
"c": [
[
13,
"Spacing.path_with_ease"
],
[
8,
"smooth_path"
],
[
8,
"spacing_params"
]
],
"b": []
},
{
"q": "Spacing.test_even_spacing",
"k": "def",
"s": 137,
"e": 141,
"doc": "",
"n": "\"Even\" mode: equal distance between frames.",
"c": [
[
13,
"Spacing.path_with_ease"
],
[
8,
"smooth_path"
],
[
8,
"dist"
]
],
"b": []
},
{
"q": "Spacing.test_holds_stay_holds",
"k": "def",
"s": 143,
"e": 147,
"doc": "",
"n": "Frames that did not move (a hold) still do not move.",
"c": [
[
8,
"respace"
]
],
"b": []
},
{
"q": "Pins",
"k": "class",
"s": 150,
"e": 160,
"doc": "",
"n": "Tests for `pin_correct`.",
"c": [],
"b": []
},
{
"q": "Pins.test_error_fades_and_middle_is_untouched",
"k": "def",
"s": 152,
"e": 160,
"doc": "",
"n": "A pin's correction fades out and does not reach the middle between pins.",
"c": [
[
8,
"pin_correct"
]
],
"b": []
},
{
"q": "Strokes",
"k": "class",
"s": 163,
"e": 223,
"doc": "",
"n": "Tests for stroke cleaning and span picking.",
"c": [],
"b": []
},
{
"q": "Strokes.test_hand_wobble_is_removed_keeping_size_and_ends",
"k": "def",
"s": 165,
"e": 172,
"doc": "",
"n": "Hand shake is removed without shrinking the stroke or moving its ends.",
"c": [
[
8,
"clean_stroke"
],
[
8,
"arc_lengths"
]
],
"b": []
},
{
"q": "Strokes.test_stroke_drawing_a_circle_stays_a_circle",
"k": "def",
"s": 174,
"e": 180,
"doc": "",
"n": "A drawn circle stays a circle.",
"c": [
[
8,
"clean_stroke"
]
],
"b": []
},
{
"q": "Strokes.test_hand_drawn_loop_with_a_gap_is_closed",
"k": "def",
"s": 182,
"e": 186,
"doc": "",
"n": "A loop drawn with a small gap is closed.",
"c": [
[
8,
"clean_stroke"
]
],
"b": []
},
{
"q": "Strokes.test_single_click_stroke_does_not_crash",
"k": "def",
"s": 188,
"e": 189,
"doc": "",
"n": "A one-point stroke is handled safely.",
"c": [
[
8,
"clean_stroke"
]
],
"b": []
},
{
"q": "Strokes.test_partial_stroke_finds_the_span",
"k": "def",
"s": 191,
"e": 193,
"doc": "",
"n": "A stroke over part of the trail selects that part.",
"c": [
[
8,
"pick_span"
]
],
"b": []
},
{
"q": "Strokes.test_stroke_started_on_a_frame_keeps_that_frame",
"k": "def",
"s": 195,
"e": 198,
"doc": "",
"n": "Starting a stroke on a key keeps that key as the edit's end.",
"c": [
[
8,
"pick_span"
]
],
"b": []
},
{
"q": "Strokes.test_stroke_on_one_spot_is_no_span",
"k": "def",
"s": 200,
"e": 202,
"doc": "",
"n": "Starting and ending in the same spot selects nothing.",
"c": [
[
8,
"pick_span"
]
],
"b": []
},
{
"q": "Strokes.test_stroke_over_a_whole_loop_takes_the_whole_loop",
"k": "def",
"s": 204,
"e": 207,
"doc": "",
"n": "Drawing from the seam around and back to the seam replaces the whole loop.",
"c": [
[
8,
"pick_span"
]
],
"b": []
},
{
"q": "Strokes.test_backwards_stroke",
"k": "def",
"s": 209,
"e": 213,
"doc": "",
"n": "A stroke drawn against time still maps to the right frames.",
"c": [
[
8,
"pick_span"
],
[
8,
"stroke_is_forward"
]
],
"b": []
},
{
"q": "Strokes.test_backwards_stroke_on_a_loop",
"k": "def",
"s": 215,
"e": 218,
"doc": "",
"n": "Same, on a loop.",
"c": [
[
8,
"stroke_is_forward"
]
],
"b": []
},
{
"q": "Strokes.test_stroke_samples_follow_spacing",
"k": "def",
"s": 220,
"e": 223,
"doc": "",
"n": "Frames are placed along the stroke following the spacing.",
"c": [
[
8,
"sample_stroke"
]
],
"b": []
},
{
"q": "KeyReduction",
"k": "class",
"s": 226,
"e": 249,
"doc": "",
"n": "Tests for `choose_frames`, `worst_frames` and `delta_at`.",
"c": [],
"b": []
},
{
"q": "KeyReduction.test_smooth_offset_needs_few_keys",
"k": "def",
"s": 228,
"e": 235,
"doc": "",
"n": "A smooth change needs only a few keys.",
"c": [
[
8,
"choose_frames"
],
[
8,
"delta_at"
]
],
"b": []
},
{
"q": "KeyReduction.test_required_frames_are_kept",
"k": "def",
"s": 237,
"e": 240,
"doc": "",
"n": "Required frames are always in the result.",
"c": [
[
8,
"choose_frames"
]
],
"b": []
},
{
"q": "KeyReduction.test_worst_frames",
"k": "def",
"s": 242,
"e": 246,
"doc": "",
"n": "The worst frame of each stretch over the tolerance is returned.",
"c": [
[
8,
"worst_frames"
]
],
"b": []
},
{
"q": "KeyReduction.test_delta_at_between_samples",
"k": "def",
"s": 248,
"e": 249,
"doc": "",
"n": "Interpolation between samples is correct.",
"c": [
[
8,
"delta_at"
]
],
"b": []
}
],
"lines": {}
},
{
"path": "flowtrail/tests/test_tool_flow.py",
"lang": "py",
"note": "Runs the **real** edit-tool and manager code (mouse input to written keys) against a small fake scene, outside Maya. Maya modules are replaced with `MagicMock` fakes. As the docstring says honestly, it checks the logic and catches typos, but it cannot prove the Maya API calls behave as assumed.",
"code": "# -*- coding: utf-8 -*-\n\"\"\"\nRuns the real reshape code paths (mouse input to written keys) against a small\nsimulated scene, outside of Maya:  python3 flowtrail/tests/test_tool_flow.py\n\nMaya is replaced by fakes, so this checks our logic and catches typos. It does\nNOT prove the Maya API calls behave as assumed: that needs a test in Maya.\nThe simulated curve interpolates linearly between keys, unlike real tangents.\n\"\"\"\nfrom __future__ import absolute_import, division, print_function\n\nimport math\nimport os\nimport sys\nimport types\nimport unittest\ntry:\n    from unittest.mock import MagicMock\nexcept ImportError:\n    from mock import MagicMock\n\n\nclass Vec(object):\n    def __init__(self, x=0.0, y=0.0, z=0.0, w=1.0):\n        self.x, self.y, self.z = x, y, z\n\n    def __sub__(self, o):\n        return Vec(self.x - o.x, self.y - o.y, self.z - o.z)\n\n    def __add__(self, o):\n        return Vec(self.x + o.x, self.y + o.y, self.z + o.z)\n\n    def __mul__(self, o):\n        if isinstance(o, Vec):\n            return self.x * o.x + self.y * o.y + self.z * o.z\n        if isinstance(o, (int, float)):\n            return Vec(self.x * o, self.y * o, self.z * o)\n        return self     # matrices are identity in this scene\n\n\ndef install_fakes():\n    maya = types.ModuleType('maya')\n    cmds = MagicMock(name='cmds')\n    cmds.optionVar.return_value = False\n    cmds.ls.return_value = []\n    api = types.ModuleType('maya.api')\n    om = MagicMock(name='om')\n    om.MPoint = om.MVector = Vec\n    om.MDistance.return_value.asUnits.return_value = 1.0\n    oma = MagicMock(name='oma')\n    omui = MagicMock(name='omui')\n    view = omui.M3dView.active3dView.return_value\n    view.worldToView.side_effect = lambda p: (p.x, p.y)\n    view.viewToWorld.side_effect = lambda x, y: (Vec(x, y, -100.0), Vec(0.0, 0.0, 1.0))\n    om.MFnCamera.return_value.viewDirection.return_value = Vec(0.0, 0.0, 1.0)\n    time_ctl = oma.MAnimControl\n    time_ctl.minTime.return_value.asUnits.return_value = 1.0\n    time_ctl.maxTime.return_value.asUnits.return_value = 121.0\n    time_ctl.currentTime.return_value.asUnits.return_value = 1.0\n    maya.cmds, maya.mel = cmds, MagicMock()\n    sys.modules.update({'maya': maya, 'maya.cmds': cmds, 'maya.mel': maya.mel, 'maya.api': api,\n                        'maya.api.OpenMaya': om, 'maya.api.OpenMayaAnim': oma,\n                        'maya.api.OpenMayaUI': omui})\n    api.OpenMaya, api.OpenMayaAnim, api.OpenMayaUI = om, oma, omui\n\n\ninstall_fakes()\nsys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))\nfrom flowtrail import anim, core, edit_tool, reshape, sampling  # noqa: E402\nfrom flowtrail.settings import DEFAULTS, SETTINGS  # noqa: E402\n\n\nclass FakeScene(object):\n    \"\"\"One object: its position is a base path plus keyed offsets.\"\"\"\n\n    def __init__(self, base, keys):\n        self.base = base\n        self.offsets = dict((t, (0.0, 0.0, 0.0)) for t in keys)\n        self.written = set()\n\n    def offset(self, t):\n        times = sorted(self.offsets)\n        return reshape.delta_at(t, times, [self.offsets[k] for k in times])\n\n    def position(self, t):\n        return tuple(a + b for a, b in zip(self.base[t], self.offset(t)))\n\n\nclass FakeTrail(object):\n    def __init__(self, scene):\n        self.scene = scene\n        self.id = 'trail'\n        self.node = '|ctrl'\n        self.short = 'ctrl'\n        self.visible = True\n        self.color = [1.0, 1.0, 1.0]\n        self.proposed = []\n        self.stroke = []\n        self.drag_preview = {}\n        self.retime_preview = None\n        self.key_times = sorted(scene.offsets)\n        self.sync()\n\n    def sync(self):\n        self.cache = dict((t, self.scene.position(t)) for t in self.scene.base)\n        self.key_times = sorted(self.scene.offsets)\n        keys = set(self.key_times)\n        self.pick_points = [(t, Vec(*self.cache[t]), t in keys) for t in sorted(self.cache)]\n\n\ndef fake_path_edit(scene):\n    class Edit(object):\n        def __init__(self, node, layer, start, end, lock=True):\n            self.start, self.end = start, end\n            self.created, self.failed = [], []\n\n        def prepare(self):\n            for t in (self.start, self.end):\n                scene.offsets.setdefault(t, scene.offset(t))\n            return True\n\n        def curves(self):\n            return ['curve']\n\n        def key_count(self):\n            return len([t for t in scene.offsets if self.start <= t <= self.end])\n\n        def apply(self, deltas):\n            current = dict((t, scene.offset(t)) for t in deltas)\n            for t, d in deltas.items():\n                scene.offsets[t] = tuple(a + b for a, b in zip(current[t], d))\n                scene.written.add(t)\n    return Edit\n\n\ndef wobbly_loop(n=120, radius=200.0, wobble=6.0, waves=14):\n    base = {}\n    for i in range(n + 1):\n        a = 2.0 * math.pi * i / n\n        r = radius + wobble * math.sin(waves * a)\n        base[float(i + 1)] = (300.0 + r * math.cos(a), 300.0 + r * math.sin(a), 7.0)\n    return base\n\n\nclass Flow(unittest.TestCase):\n\n    def setUp(self):\n        SETTINGS.data = dict(DEFAULTS)\n        self.scene = FakeScene(wobbly_loop(), [1.0, 31.0, 61.0, 91.0, 121.0])\n        self.trail = FakeTrail(self.scene)\n        self.mgr = core.Manager()\n        self.mgr.trails['trail'] = self.trail\n        self.mgr.process_now = self.trail.sync\n        self.mgr.refresh_edit_layer = lambda: None\n        core.get_manager = lambda: self.mgr\n        self.real_edit = anim.PathEdit\n        self.real_sample = sampling.sample\n        anim.PathEdit = fake_path_edit(self.scene)\n        sampling.sample = lambda req, mode='context', attr='worldMatrix': dict(\n            (n, [(t, object()) for t in ts]) for n, ts in req.items())\n        edit_tool.S.reset()\n        self.before = dict(self.trail.cache)\n\n    def tearDown(self):\n        anim.PathEdit = self.real_edit\n        sampling.sample = self.real_sample\n\n    def radius_error(self, lo=11.0, hi=111.0):\n        return max(abs(math.hypot(p[0] - 300.0, p[1] - 300.0) - 200.0)\n                   for t, p in self.trail.cache.items() if lo <= t <= hi)\n\n    def tolerance(self):\n        return core.ACCURACY['medium'] * 2.0 * math.pi * 200.0 * 1.2\n\n    def assert_ends_pinned(self, first=1.0, last=121.0):\n        for t in (first, last):\n            self.assertEqual(self.trail.cache[t], self.before[t])\n            self.assertNotIn(t, self.scene.written)\n\n    def sketch(self, stroke):\n        S = edit_tool.S\n        edit_tool._begin_sketch(self.mgr, stroke[0][0], stroke[0][1])\n        for x, y in stroke[1:]:\n            edit_tool._drag_sketch(x, y)\n        S.moved = True\n        edit_tool._finish_sketch(self.mgr)\n\n    def test_redrawing_a_whole_loop_follows_the_stroke(self):\n        stroke = [(300.0 + 200.0 * math.cos(2.0 * math.pi * i / 200.0),\n                   300.0 + 200.0 * math.sin(2.0 * math.pi * i / 200.0)) for i in range(201)]\n        self.assertGreater(self.radius_error(), 4.0)\n        self.sketch(stroke)\n        self.assertLess(self.radius_error(), self.tolerance())\n        self.assert_ends_pinned()\n        self.assertEqual(self.trail.stroke, [])\n        self.assertLess(len(self.scene.offsets), 100)\n\n    def test_reversed_stroke_keeps_time_going_forward(self):\n        stroke = [(300.0 + 200.0 * math.cos(2.0 * math.pi * i / 200.0),\n                   300.0 + 200.0 * math.sin(2.0 * math.pi * i / 200.0)) for i in range(200, -1, -1)]\n        self.sketch(stroke)\n        self.assertLess(self.radius_error(), self.tolerance())\n        quarter = self.trail.cache[31.0]\n        self.assertAlmostEqual(math.atan2(quarter[1] - 300.0, quarter[0] - 300.0), math.pi / 2.0,\n                               delta=0.2)\n\n    def test_partial_stroke_only_changes_that_span(self):\n        p = self.trail.cache\n        a, b = p[31.0], p[61.0]\n        stroke = [(a[0] + (b[0] - a[0]) * i / 40.0, a[1] + (b[1] - a[1]) * i / 40.0)\n                  for i in range(41)]\n        self.sketch(stroke)\n        for t, q in self.trail.cache.items():\n            if t <= 31.0 or t >= 61.0:\n                self.assertEqual(q, self.before[t])\n        mid = self.trail.cache[46.0]     # was at radius 206: now on the chord\n        self.assertLess(math.hypot(mid[0] - 300.0, mid[1] - 300.0), 160.0)\n\n    def test_sketch_keeps_depth(self):\n        stroke = [(p[0] + 5.0, p[1]) for t, p in sorted(self.trail.cache.items())]\n        self.sketch(stroke)\n        for q in self.trail.cache.values():\n            self.assertAlmostEqual(q[2], 7.0)\n\n    def test_tiny_stroke_is_refused(self):\n        p = self.trail.cache[40.0]\n        self.sketch([(p[0], p[1]), (p[0] + 1.0, p[1])])\n        self.assertEqual(self.trail.cache, self.before)\n\n    def test_smooth_slider_previews_then_applies(self):\n        self.mgr.preview_smooth(0.8)\n        self.assertEqual(self.trail.cache, self.before)    # preview touches nothing\n        self.assertTrue(self.trail.proposed)\n        self.mgr.commit_proposed()\n        self.assertEqual(self.trail.proposed, [])\n        self.assertLess(self.radius_error(), 3.0)\n        self.assert_ends_pinned()\n\n    def test_smoothing_keeps_spacing_share(self):\n        self.mgr.smooth_arcs(0.8)\n        times = sorted(self.trail.cache)\n        before = reshape.spacing_params([self.before[t] for t in times])\n        after = reshape.spacing_params([self.trail.cache[t] for t in times])\n        # the wobble itself is what adds path length: compare at a coarse scale\n        for i in range(0, len(times), 30):\n            self.assertAlmostEqual(before[i], after[i], delta=0.03)\n\n    def test_selected_keys_limit_the_edit(self):\n        self.mgr.selected_keys = set([('trail', 31.0), ('trail', 91.0)])\n        self.mgr.smooth_arcs(0.8)\n        self.assert_ends_pinned(31.0, 91.0)\n        for t, q in self.trail.cache.items():\n            if t < 31.0 or t > 91.0:\n                self.assertEqual(q, self.before[t])\n\n    def test_keep_all_keyed_poses(self):\n        SETTINGS.data['pin_keys'] = True\n        self.mgr.smooth_arcs(0.8)\n        for k in (1.0, 31.0, 61.0, 91.0, 121.0):\n            self.assertEqual(self.trail.cache[k], self.before[k])\n\n    def test_brush_only_touches_where_painted(self):\n        S = edit_tool.S\n        at = self.trail.cache[46.0]\n        edit_tool._begin_brush(self.mgr, at[0], at[1])\n        for _ in range(12):\n            edit_tool._drag_brush(at[0], at[1])\n        self.assertTrue(self.trail.proposed)\n        S.moved = True\n        edit_tool._finish_brush(self.mgr)\n        self.assertEqual(self.trail.proposed, [])\n        changed = [t for t, q in self.trail.cache.items()\n                   if reshape.dist(q, self.before[t]) > 0.01]\n        self.assertTrue(changed)\n        self.assertGreater(min(changed), 30.0)\n        self.assertLess(max(changed), 62.0)\n\n    def test_pull_moves_neighbours_and_stops_at_falloff(self):\n        S = edit_tool.S\n        SETTINGS.data['falloff'] = 10\n        at = self.trail.cache[61.0]\n        S.trail, S.t, S.start_disp = self.trail, 61.0, Vec(*at)\n        self.assertTrue(edit_tool._begin_soft(self.mgr))\n        edit_tool._drag_soft(at[0] + 40.0, at[1])\n        self.mgr.apply_display_path(self.trail, S.times, S.points)\n        q = self.trail.cache\n        self.assertAlmostEqual(q[61.0][0], at[0] + 40.0, delta=1.0)\n        moved_near = q[56.0][0] - self.before[56.0][0]\n        self.assertTrue(10.0 < moved_near < 30.0)\n        for t in (50.0, 72.0):\n            self.assertEqual(q[t], self.before[t])\n\n    def test_pull_refuses_the_pinned_ends(self):\n        S = edit_tool.S\n        S.trail, S.t, S.start_disp = self.trail, 1.0, Vec(*self.trail.cache[1.0])\n        self.assertFalse(edit_tool._begin_soft(self.mgr))\n\n    def test_every_frame_and_existing_key_modes(self):\n        SETTINGS.data['key_mode'] = 'every'\n        self.mgr.smooth_arcs(0.8)\n        self.assertEqual(len(self.scene.offsets), 121)\n        self.setUp()\n        SETTINGS.data['key_mode'] = 'existing'\n        self.mgr.smooth_arcs(0.8)\n        self.assertEqual(sorted(self.scene.offsets), [1.0, 31.0, 61.0, 91.0, 121.0])\n\n\nif __name__ == '__main__':\n    unittest.main()",
"aliases": {
"absolute_import": "__future__.absolute_import",
"division": "__future__.division",
"print_function": "__future__.print_function",
"math": "math",
"os": "os",
"sys": "sys",
"types": "types",
"unittest": "unittest",
"MagicMock": "mock.MagicMock"
},
"outline": [
{
"q": "Vec",
"k": "class",
"s": 23,
"e": 38,
"doc": "",
"n": "A tiny vector class that stands in for `MPoint`/`MVector`: add, subtract, dot product, scale. Matrices are treated as identity.",
"c": [],
"b": [
[
14,
"Vec.__sub__"
],
[
14,
"Vec.__add__"
],
[
14,
"Vec.__mul__"
],
[
14,
"install_fakes"
],
[
14,
"FakeTrail.sync"
],
[
14,
"Flow.test_pull_moves_neighbours_and_stops_at_falloff"
],
[
14,
"Flow.test_pull_refuses_the_pinned_ends"
]
]
},
{
"q": "Vec.__init__",
"k": "def",
"s": 24,
"e": 25,
"doc": "",
"n": "x, y, z (w is accepted and ignored, like `MPoint`).",
"c": [],
"b": []
},
{
"q": "Vec.__sub__",
"k": "def",
"s": 27,
"e": 28,
"doc": "",
"n": "Vector subtraction (`a - b`).",
"c": [
[
14,
"Vec"
]
],
"b": []
},
{
"q": "Vec.__add__",
"k": "def",
"s": 30,
"e": 31,
"doc": "",
"n": "Vector addition (`a + b`).",
"c": [
[
14,
"Vec"
]
],
"b": []
},
{
"q": "Vec.__mul__",
"k": "def",
"s": 33,
"e": 38,
"doc": "",
"n": "`*` with a vector is the dot product, with a number it scales, with anything else (a matrix) it returns itself.",
"c": [
[
14,
"Vec"
]
],
"b": []
},
{
"q": "install_fakes",
"k": "def",
"s": 41,
"e": 64,
"doc": "",
"n": "Puts fake `maya`, `maya.cmds` and API modules into `sys.modules` **before** FlowTrail is imported, so `from maya import cmds` inside FlowTrail gets the fakes. The fake view maps 3D to screen as `(x, y)`, which makes the math easy to check.",
"c": [
[
14,
"Vec"
]
],
"b": []
},
{
"q": "FakeScene",
"k": "class",
"s": 73,
"e": 86,
"doc": "One object: its position is a base path plus keyed offsets.",
"n": "A fake animated object: a base path plus keyed offsets, interpolated linearly.",
"c": [],
"b": [
[
14,
"Flow.setUp"
]
]
},
{
"q": "FakeScene.__init__",
"k": "def",
"s": 76,
"e": 79,
"doc": "",
"n": "Base positions per frame and zero offsets on the given keys.",
"c": [],
"b": []
},
{
"q": "FakeScene.offset",
"k": "def",
"s": 81,
"e": 83,
"doc": "",
"n": "The offset at any time, interpolated between keys.",
"c": [
[
8,
"delta_at"
]
],
"b": [
[
14,
"FakeScene.position"
]
]
},
{
"q": "FakeScene.position",
"k": "def",
"s": 85,
"e": 86,
"doc": "",
"n": "Base plus offset: where the object is at time `t`.",
"c": [
[
14,
"FakeScene.offset"
]
],
"b": []
},
{
"q": "FakeTrail",
"k": "class",
"s": 89,
"e": 108,
"doc": "",
"n": "Stands in for `core.Trail` with only what the edit code uses.",
"c": [],
"b": [
[
14,
"Flow.setUp"
]
]
},
{
"q": "FakeTrail.__init__",
"k": "def",
"s": 90,
"e": 102,
"doc": "",
"n": "Copies the attributes the code reads (id, node, color, previews) and syncs from the scene.",
"c": [
[
14,
"FakeTrail.sync"
]
],
"b": []
},
{
"q": "FakeTrail.sync",
"k": "def",
"s": 104,
"e": 108,
"doc": "",
"n": "Rebuilds the cache, key times and pick points from the fake scene (this replaces `process_now`).",
"c": [
[
14,
"Vec"
]
],
"b": [
[
14,
"FakeTrail.__init__"
]
]
},
{
"q": "fake_path_edit",
"k": "def",
"s": 111,
"e": 133,
"doc": "",
"n": "Returns a fake `PathEdit` class that writes offsets into the fake scene instead of into Maya curves, and records which frames were written.",
"c": [
[
14,
"fake_path_edit.Edit"
]
],
"b": [
[
14,
"Flow.setUp"
]
]
},
{
"q": "fake_path_edit.Edit",
"k": "class",
"s": 112,
"e": 132,
"doc": "",
"n": "The fake class.",
"c": [],
"b": [
[
14,
"fake_path_edit"
]
]
},
{
"q": "fake_path_edit.Edit.__init__",
"k": "def",
"s": 113,
"e": 115,
"doc": "",
"n": "Stores the edit range.",
"c": [],
"b": []
},
{
"q": "fake_path_edit.Edit.prepare",
"k": "def",
"s": 117,
"e": 120,
"doc": "",
"n": "Makes sure both ends have keys.",
"c": [],
"b": []
},
{
"q": "fake_path_edit.Edit.curves",
"k": "def",
"s": 122,
"e": 123,
"doc": "",
"n": "One fake curve name.",
"c": [],
"b": []
},
{
"q": "fake_path_edit.Edit.key_count",
"k": "def",
"s": 125,
"e": 126,
"doc": "",
"n": "Keys inside the range.",
"c": [],
"b": []
},
{
"q": "fake_path_edit.Edit.apply",
"k": "def",
"s": 128,
"e": 132,
"doc": "",
"n": "Adds the offsets on top of the current ones and records the written frames.",
"c": [],
"b": []
},
{
"q": "wobbly_loop",
"k": "def",
"s": 136,
"e": 142,
"doc": "",
"n": "Test input: a circle with a wavy edge, frames 1 to 121.",
"c": [],
"b": [
[
14,
"Flow.setUp"
]
]
},
{
"q": "Flow",
"k": "class",
"s": 145,
"e": 305,
"doc": "",
"n": "End-to-end tests of sketching, smoothing, brushing and pulling through the real code.",
"c": [],
"b": []
},
{
"q": "Flow.setUp",
"k": "def",
"s": 147,
"e": 162,
"doc": "",
"n": "Resets settings, builds the fake scene and trail, a real `Manager` with its update and layer calls replaced, and swaps `PathEdit` and `sampling.sample` for fakes.",
"c": [
[
14,
"wobbly_loop"
],
[
14,
"FakeScene"
],
[
14,
"FakeTrail"
],
[
6,
"Manager"
],
[
6,
"get_manager"
],
[
7,
"PathEdit"
],
[
5,
"sample"
],
[
14,
"fake_path_edit"
]
],
"b": [
[
14,
"Flow.test_every_frame_and_existing_key_modes"
]
]
},
{
"q": "Flow.tearDown",
"k": "def",
"s": 164,
"e": 166,
"doc": "",
"n": "Puts the real `PathEdit` and `sample` back.",
"c": [
[
7,
"PathEdit"
],
[
5,
"sample"
]
],
"b": []
},
{
"q": "Flow.radius_error",
"k": "def",
"s": 168,
"e": 170,
"doc": "",
"n": "How far the result is from a perfect circle.",
"c": [],
"b": [
[
14,
"Flow.test_redrawing_a_whole_loop_follows_the_stroke"
],
[
14,
"Flow.test_reversed_stroke_keeps_time_going_forward"
],
[
14,
"Flow.test_smooth_slider_previews_then_applies"
]
]
},
{
"q": "Flow.tolerance",
"k": "def",
"s": 172,
"e": 173,
"doc": "",
"n": "The accuracy the code promises for this path size.",
"c": [],
"b": [
[
14,
"Flow.test_redrawing_a_whole_loop_follows_the_stroke"
],
[
14,
"Flow.test_reversed_stroke_keeps_time_going_forward"
]
]
},
{
"q": "Flow.assert_ends_pinned",
"k": "def",
"s": 175,
"e": 178,
"doc": "",
"n": "The first and last frames did not move and were never written.",
"c": [],
"b": [
[
14,
"Flow.test_redrawing_a_whole_loop_follows_the_stroke"
],
[
14,
"Flow.test_smooth_slider_previews_then_applies"
],
[
14,
"Flow.test_selected_keys_limit_the_edit"
]
]
},
{
"q": "Flow.sketch",
"k": "def",
"s": 180,
"e": 186,
"doc": "",
"n": "Simulates a sketch: press, drag through the points, release.",
"c": [
[
10,
"_begin_sketch"
],
[
10,
"_drag_sketch"
],
[
10,
"_finish_sketch"
]
],
"b": [
[
14,
"Flow.test_redrawing_a_whole_loop_follows_the_stroke"
],
[
14,
"Flow.test_reversed_stroke_keeps_time_going_forward"
],
[
14,
"Flow.test_partial_stroke_only_changes_that_span"
],
[
14,
"Flow.test_sketch_keeps_depth"
],
[
14,
"Flow.test_tiny_stroke_is_refused"
]
]
},
{
"q": "Flow.test_redrawing_a_whole_loop_follows_the_stroke",
"k": "def",
"s": 188,
"e": 196,
"doc": "",
"n": "Drawing a perfect circle over the wobbly loop makes it round, ends pinned.",
"c": [
[
14,
"Flow.radius_error"
],
[
14,
"Flow.sketch"
],
[
14,
"Flow.tolerance"
],
[
14,
"Flow.assert_ends_pinned"
]
],
"b": []
},
{
"q": "Flow.test_reversed_stroke_keeps_time_going_forward",
"k": "def",
"s": 198,
"e": 205,
"doc": "",
"n": "Drawing the loop backwards does not reverse time.",
"c": [
[
14,
"Flow.sketch"
],
[
14,
"Flow.tolerance"
],
[
14,
"Flow.radius_error"
]
],
"b": []
},
{
"q": "Flow.test_partial_stroke_only_changes_that_span",
"k": "def",
"s": 207,
"e": 217,
"doc": "",
"n": "A partial stroke changes only that part of the loop.",
"c": [
[
14,
"Flow.sketch"
]
],
"b": []
},
{
"q": "Flow.test_sketch_keeps_depth",
"k": "def",
"s": 219,
"e": 223,
"doc": "",
"n": "Sketching does not change depth.",
"c": [
[
14,
"Flow.sketch"
]
],
"b": []
},
{
"q": "Flow.test_tiny_stroke_is_refused",
"k": "def",
"s": 225,
"e": 228,
"doc": "",
"n": "A stroke that is too small changes nothing.",
"c": [
[
14,
"Flow.sketch"
]
],
"b": []
},
{
"q": "Flow.test_smooth_slider_previews_then_applies",
"k": "def",
"s": 230,
"e": 237,
"doc": "",
"n": "The slider previews without writing, and applies on release.",
"c": [
[
14,
"Flow.radius_error"
],
[
14,
"Flow.assert_ends_pinned"
]
],
"b": []
},
{
"q": "Flow.test_smoothing_keeps_spacing_share",
"k": "def",
"s": 239,
"e": 246,
"doc": "",
"n": "Smoothing keeps each frame's share of the path.",
"c": [
[
8,
"spacing_params"
]
],
"b": []
},
{
"q": "Flow.test_selected_keys_limit_the_edit",
"k": "def",
"s": 248,
"e": 254,
"doc": "",
"n": "Two selected keys limit the edit to the frames between them.",
"c": [
[
14,
"Flow.assert_ends_pinned"
]
],
"b": []
},
{
"q": "Flow.test_keep_all_keyed_poses",
"k": "def",
"s": 256,
"e": 260,
"doc": "",
"n": "\"Keep all keyed poses\" never moves a key.",
"c": [],
"b": []
},
{
"q": "Flow.test_brush_only_touches_where_painted",
"k": "def",
"s": 262,
"e": 276,
"doc": "",
"n": "The brush changes only the painted frames.",
"c": [
[
10,
"_begin_brush"
],
[
10,
"_drag_brush"
],
[
10,
"_finish_brush"
],
[
8,
"dist"
]
],
"b": []
},
{
"q": "Flow.test_pull_moves_neighbours_and_stops_at_falloff",
"k": "def",
"s": 278,
"e": 291,
"doc": "",
"n": "Pulling a point moves its neighbors and nothing beyond the falloff.",
"c": [
[
14,
"Vec"
],
[
10,
"_begin_soft"
],
[
10,
"_drag_soft"
]
],
"b": []
},
{
"q": "Flow.test_pull_refuses_the_pinned_ends",
"k": "def",
"s": 293,
"e": 296,
"doc": "",
"n": "The first and last frames cannot be pulled.",
"c": [
[
14,
"Vec"
],
[
10,
"_begin_soft"
]
],
"b": []
},
{
"q": "Flow.test_every_frame_and_existing_key_modes",
"k": "def",
"s": 298,
"e": 305,
"doc": "",
"n": "The \"every frame\" and \"existing keys only\" key modes write the expected frames.",
"c": [
[
14,
"Flow.setUp"
]
],
"b": []
}
],
"lines": {}
}
]
});
