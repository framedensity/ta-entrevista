TA.add({
  id: 'm09',
  title: 'OpenMaya API 2.0',

  explain: [
    '`maya.cmds` is convenient, but it works with **text**: node names, `"node.attribute"`. For heavy work (millions of vertices) or to react to events, you use the **API**: `maya.api.OpenMaya`.',
    { type: 'analogy', text: '`cmds` is ordering at the counter: you say the name and they bring it to you. OpenMaya is walking into the warehouse with a key: more work to get in, but you grab everything at once and much faster.' },
    '### API 2.0 (not 1.0)',
    'There are two versions. Always use **2.0**: `import maya.api.OpenMaya as om`. It is more «pythonic» and faster. 1.0 (`import maya.OpenMaya`) is the old one.',
    '### The basic pieces',
    '- `om.MSelectionList()` → a list you add names to, to get their «keys».\n- `MDagPath` → the key to a DAG node (with its path).\n- `MObject` → the key to any node.\n- **Function sets** (`MFn...`): tools for working with one type: `MFnMesh` (meshes), `MFnTransform`, `MFnDependencyNode` (any node).',
    '```python\nimport maya.api.OpenMaya as om\n\nsel = om.MSelectionList()\nsel.add("hero_geo")\ndag = sel.getDagPath(0)\nmesh = om.MFnMesh(dag)\npoints = mesh.getPoints(om.MSpace.kWorld)   # every vertex at once\n```',
    '### When to use the API?',
    '- **Performance**: reading or writing lots of vertices, skin weights, and so on. `cmds.xform` vertex by vertex is painfully slow; `getPoints` does it in one call.\n- **Callbacks**: reacting to events with `om.MMessage` / `MSceneMessage` (on save, on open, on rename).\n- **Custom nodes and commands** (plugins).',
    { type: 'warn', text: 'the API has no automatic *undo* like `cmds`. If you change the scene through the API outside a plugin command, Ctrl+Z may not work. For changes the artist will want to undo, `cmds` is usually safer.' },
    { type: 'cg', text: 'a tool that checks whether two characters intersect in a 600-frame cutscene needs to read vertex positions thousands of times: that is a job for `MFnMesh.getPoints`, not for `cmds`.' },
    { type: 'tip', text: 'you do not need to know the API by heart. What they expect is that you know **when** to use it and why: performance, callbacks, plugins.' },
    'This lesson has no simulator: the exercises are written answers that you compare with a model answer.'
  ],

  example: {
    intro: 'Reading the positions of every vertex: `cmds` vs the API.',
    lines: [
      { label: 'cmds (slow)', code: 'n = cmds.polyEvaluate("hero_geo", vertex=True)\npoints = [cmds.xform(f"hero_geo.vtx[{i}]", q=True, t=True, ws=True)\n          for i in range(n)]', note: 'One call per vertex. With 100,000 vertices, 100,000 calls.' },
      { label: 'API 2.0 (fast)', code: 'import maya.api.OpenMaya as om\nsel = om.MSelectionList()\nsel.add("hero_geo")\nmesh = om.MFnMesh(sel.getDagPath(0))\npoints = mesh.getPoints(om.MSpace.kWorld)', note: 'A single call returns an `MPointArray` with every vertex.' },
      { label: 'Callback', code: 'def on_save(*args):\n    print("Checking the scene before saving…")\n\ncb_id = om.MSceneMessage.addCallback(om.MSceneMessage.kBeforeSave, on_save)\n# later:\nom.MMessage.removeCallback(cb_id)', note: 'Runs your function before every save. You have to **remove** the callback when it is no longer needed.' }
    ],
    outro: 'Note the last point: a callback that is never removed stays active until Maya closes. Tools keep the id and remove it when they shut down.'
  },

  mini: [
    {
      q: 'What is the main reason to use OpenMaya instead of `cmds`?',
      options: ['It is easier to read', 'Performance with lots of data, callbacks and plugins', 'It has automatic undo'],
      answer: 1,
      why: 'The API is faster and can do things `cmds` cannot, but it is more verbose and has no automatic undo.'
    },
    {
      q: 'What do you import for API 2.0?',
      options: ['`import maya.OpenMaya`', '`import maya.api.OpenMaya as om`', '`from maya import api2`'],
      answer: 1,
      why: '`maya.OpenMaya` is API 1.0, the old one.'
    }
  ],
  extra: [
    {
      q: 'What happens if you register a callback and never remove it?',
      options: ['Nothing', 'It keeps running until Maya closes, and can be duplicated if you reload the tool', 'Maya removes it on save'],
      answer: 1,
      why: 'That is why you keep the id and call `MMessage.removeCallback` when the tool closes.'
    }
  ],

  exercises: [
    {
      id: 'e1',
      kind: 'free',
      title: 'cmds or the API?',
      prompt: 'You are asked for a tool that, for a 600-frame cutscene, checks on every frame whether the character\'s hand goes through the table (by comparing vertex positions).\n\nWould you use `cmds` or OpenMaya? Explain why and how you would approach it at a high level.',
      checklist: [
        'I choose OpenMaya (API 2.0) to read the vertices, for performance.',
        'I use `MFnMesh.getPoints` (every point in one call), not one `xform` per vertex.',
        'I evaluate each frame without moving the timeline (or with `MDGContext` / time in the API).',
        'I shrink the problem: only the hand vertices and a box around the table, not the whole mesh.',
        'The result is a report (frames with a problem) the artist can review.'
      ],
      model: 'I would use **API 2.0**. With `cmds` I would have to ask for every vertex with `xform`, and over 600 frames that would be millions of calls.\n\n1. Get the mesh\'s `MDagPath` with `MSelectionList`.\n2. For each frame, read every point with `MFnMesh.getPoints(om.MSpace.kWorld)` in one call (evaluated at that time, without moving the timeline).\n3. To keep it fast, only look at the hand vertices and compare them with the table\'s bounding box.\n4. Return a list of frames with a collision, for the animator to review. The tool does **not** fix anything on its own.',
      followups: ['How would you keep the check from taking minutes?', 'What do you do if the character has a deformer that changes the vertices?', 'How would you show the result to the animator?']
    },
    {
      id: 'e2',
      kind: 'free',
      title: 'A callback on save',
      prompt: 'You want the scene\'s naming to be checked every time the artist saves (your checker from p18).\n\nWrite the code (or the steps) to register that callback and explain what you would be careful about.',
      checklist: [
        'I use `om.MSceneMessage.addCallback(om.MSceneMessage.kBeforeSave, func)`.',
        'I keep the id it returns so I can remove it later.',
        'I remove the callback with `om.MMessage.removeCallback(id)` when the tool closes or reloads (so it is not duplicated).',
        'The check is quick and does not block the save if it fails: it warns, it does not prevent saving (or the team decides).',
        'I catch errors inside the callback: an error there must never break the save.'
      ],
      model: '```python\nimport maya.api.OpenMaya as om\n\n_callbacks = []\n\ndef _before_save(*args):\n    try:\n        problems = check_scene()\n        if problems:\n            om.MGlobal.displayWarning(f"{len(problems)} names break the convention")\n    except Exception:\n        om.MGlobal.displayWarning("The checker failed; saving anyway")\n\ndef register():\n    unregister()\n    _callbacks.append(om.MSceneMessage.addCallback(om.MSceneMessage.kBeforeSave, _before_save))\n\ndef unregister():\n    for cb in _callbacks:\n        om.MMessage.removeCallback(cb)\n    _callbacks.clear()\n```\n\nKey points: keep the id, remove it before registering again (otherwise it duplicates on reload), and an error in the callback must never stop the artist\'s work from being saved.',
      followups: ['Would you block the save if there are naming errors? Why?', 'What happens if you reload the module without removing the callback?', 'Where would you register the callback when Maya starts (`userSetup.py`)?']
    }
  ],

  summary: [
    'API 2.0: `import maya.api.OpenMaya as om`; `MSelectionList` → `MDagPath` → `MFnMesh`, and so on.',
    'Use it for performance (lots of data), callbacks and plugins.',
    'It has no automatic undo; callbacks are registered with an id and always removed.'
  ]
});
