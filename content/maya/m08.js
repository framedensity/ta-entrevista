(function () {
var SETUP = [
  'from maya import cmds as _c',
  'for _n in ["hero_geo", "boss_geo", "rock_geo"]:',
  '    _c.polyCube(name=_n)',
  '_c.select("hero_geo", "boss_geo")',
  'del _n'
].join('\n') + '\n';
var FILES = 'Scene:\n  hero_geo, boss_geo, rock_geo  (mesh)\nCurrent selection: hero_geo, boss_geo';

TA.add({
  id: 'm08',
  title: 'Good practices in Maya',

  explain: [
    'A script that works in your scene is not the same as a tool that works for 30 artists. These are the rules that separate the two.',
    '### 1. A single Ctrl+Z: undo chunks',
    'If your tool makes 500 changes, the artist would need 500 Ctrl+Z to undo it. With an **undo chunk**, it all counts as a single step.',
    { type: 'analogy', text: 'it is like putting every change into one box. Undo throws away the whole box, not one thing at a time.' },
    '```python\ncmds.undoInfo(openChunk=True)\ntry:\n    make_lots_of_changes()\nfinally:\n    cmds.undoInfo(closeChunk=True)\n```',
    { type: 'warn', text: 'the `finally` is mandatory. If there is an error and the chunk is not closed, Maya\'s undo stays broken for the rest of the session.' },
    'With a **context manager** (`with`) it is even cleaner and you can never forget it:',
    '```python\nfrom contextlib import contextmanager\n\n@contextmanager\ndef undo_chunk():\n    cmds.undoInfo(openChunk=True)\n    try:\n        yield\n    finally:\n        cmds.undoInfo(closeChunk=True)\n\nwith undo_chunk():\n    make_lots_of_changes()\n```',
    '### 2. Do not depend on the selection',
    { type: 'compare',
      badTitle: 'Uses the selection inside: cannot be called from other code',
      bad: 'def hide():\n    for n in cmds.ls(sl=True):\n        cmds.setAttr(n + ".visibility", 0)',
      goodTitle: 'Takes the nodes; the UI passes the selection',
      good: 'def hide(nodes):\n    for n in nodes:\n        cmds.setAttr(n + ".visibility", 0)\n\nhide(cmds.ls(sl=True))  # only in the button' },
    '### 3. Expect None and nodes that do not exist',
    '`listRelatives`, `listConnections`, `keyframe`… return `None`. Nodes may have been deleted. Use `or []` and `cmds.objExists()`.',
    '### 4. Unique names',
    'If two nodes share a name in different groups, the short name raises an error. Work with `ls(long=True)` when the scene is big.',
    { type: 'tip', text: 'if they show you a script and ask “what would you improve?”, check these four things in order: undo, selection, None, names. There is almost always something.' }
  ],

  example: {
    intro: 'A function that changes several nodes, in a single undo step.',
    lines: [
      { code: 'from contextlib import contextmanager\nfrom maya import cmds', note: 'We import.' },
      { code: '@contextmanager\ndef undo_chunk():\n    cmds.undoInfo(openChunk=True)\n    try:\n        yield\n    finally:\n        cmds.undoInfo(closeChunk=True)', note: 'Opens the chunk, lets the work happen (`yield`) and **always** closes it.' },
      { code: 'def hide(nodes):\n    with undo_chunk():\n        for n in nodes:\n            if cmds.objExists(n):\n                cmds.setAttr(n + ".visibility", False)', note: 'Takes the nodes, checks they exist and does it all in one undo step.' },
      { code: 'hide(["hero_geo", "does_not_exist"])\nprint(cmds.getAttr("hero_geo.visibility"))', note: 'The missing node is skipped without an error.' }
    ],
    output: 'False'
  },

  mini: [
    {
      q: 'Why does `closeChunk` go inside a `finally`?',
      options: ['Style', 'So it closes even if there is an error; otherwise Maya\'s undo stays broken', 'Because Maya requires it to work'],
      answer: 1,
      why: 'An open chunk that never closes leaves the undo history in a bad state.'
    },
    {
      q: 'What is better for a tool function?',
      options: ['Reading `cmds.ls(sl=True)` inside', 'Taking the list of nodes as a parameter', 'Selecting everything with `cmds.select(all=True)`'],
      answer: 1,
      why: 'That way it can be used from a button, a batch or a test.'
    }
  ],

  exercises: [
    {
      id: 'e1',
      title: 'Your own undo_chunk',
      prompt: 'Write the context manager `undo_chunk()` with `@contextmanager`. It must open the chunk on entry and **always close it**, even if there is an error inside.',
      files: FILES,
      starter: 'from contextlib import contextmanager\nfrom maya import cmds\n\n@contextmanager\ndef undo_chunk():\n    # your code\n    yield\n',
      tests: [
        { check: "(lambda: [cmds._undo_log.clear(), _try_ok(), list(cmds._undo_log)][2])() == ['open', 'close']", msg: 'opens and closes the chunk' },
        { check: "(lambda: [cmds._undo_log.clear(), _try_error(), list(cmds._undo_log)][2])() == ['open', 'close']", msg: 'closes it even if there is an error inside' }
      ],
      setup: SETUP + 'def _try_ok():\n    with undo_chunk():\n        pass\n\ndef _try_error():\n    try:\n        with undo_chunk():\n            raise ValueError("boom")\n    except ValueError:\n        pass\n',
      hints: ['`cmds.undoInfo(openChunk=True)` before the `try`.', '`try: yield` / `finally: cmds.undoInfo(closeChunk=True)`'],
      solution: 'from contextlib import contextmanager\nfrom maya import cmds\n\n@contextmanager\ndef undo_chunk():\n    cmds.undoInfo(openChunk=True)\n    try:\n        yield\n    finally:\n        cmds.undoInfo(closeChunk=True)\n'
    },
    {
      id: 'e2',
      title: 'Not depending on the selection',
      prompt: 'Rewrite `hide` so it **takes** the list of nodes instead of reading the selection.\n\nIt must return the list of nodes that did **not** exist (and skip them without an error).',
      setup: SETUP, files: FILES,
      starter: 'from maya import cmds\n\ndef hide():\n    for n in cmds.ls(sl=True):\n        cmds.setAttr(n + ".visibility", False)\n',
      tests: [
        { check: "hide(['rock_geo', 'ghost']) == ['ghost']", msg: 'returns the ones that do not exist' },
        { check: "cmds.getAttr('rock_geo.visibility') is False and cmds.getAttr('hero_geo.visibility') is True", msg: 'hides only the nodes it receives (not the selection)' }
      ],
      hints: ['`def hide(nodes):`', 'Inside: `if not cmds.objExists(n): missing.append(n); continue`'],
      solution: 'from maya import cmds\n\ndef hide(nodes):\n    missing = []\n    for n in nodes:\n        if not cmds.objExists(n):\n            missing.append(n)\n            continue\n        cmds.setAttr(n + ".visibility", False)\n    return missing\n'
    },
    {
      id: 'e3',
      title: 'A complete tool, in miniature',
      prompt: 'Write `move_to_group(nodes, group)`:\n\n- Create the empty group if it does not exist (`cmds.group(empty=True, name=group)`).\n- Put the nodes that exist inside it.\n- All in **one** undo chunk (open and close with `undoInfo`, with `finally`).\n- Return the **sorted** list of the group\'s children at the end.',
      setup: SETUP, files: FILES,
      starter: 'from maya import cmds\n\ndef move_to_group(nodes, group):\n    # your code\n    pass\n',
      tests: [
        { check: "move_to_group(['hero_geo', 'boss_geo', 'nothing'], 'chars_grp') == ['boss_geo', 'hero_geo']", msg: 'puts in the nodes that exist and returns the children' },
        { check: "cmds._undo_log[-2:] == ['open', 'close']", msg: 'uses an undo chunk that is opened and closed' },
        { check: "move_to_group(['rock_geo'], 'chars_grp') == ['boss_geo', 'hero_geo', 'rock_geo']", msg: 'if the group already exists, it reuses it' }
      ],
      hints: ['`if not cmds.objExists(group): cmds.group(empty=True, name=group)`', 'At the end: `return sorted(cmds.listRelatives(group, children=True) or [])`'],
      solution: 'from maya import cmds\n\ndef move_to_group(nodes, group):\n    cmds.undoInfo(openChunk=True)\n    try:\n        if not cmds.objExists(group):\n            cmds.group(empty=True, name=group)\n        for n in nodes:\n            if cmds.objExists(n):\n                cmds.parent(n, group)\n    finally:\n        cmds.undoInfo(closeChunk=True)\n    return sorted(cmds.listRelatives(group, children=True) or [])\n'
    }
  ],

  summary: [
    'Undo chunk with `finally` (or a `with` manager): everything undoes in one step.',
    'Functions take the nodes; only the button reads the selection.',
    'Expect `None` (`or []`), check `objExists` and use long names if there are duplicates.'
  ]
});
})();
