(function () {
var SETUP = [
  'from maya import cmds as _c',
  '_c.spaceLocator(name="ctrl_A")',
  '_c.setAttr("ctrl_A.translateX", 3)',
  '_c.setAttr("ctrl_A.translateY", 1.5)',
  '_c.setAttr("ctrl_A.rotateY", 45)',
  '_c.spaceLocator(name="ctrl_B")',
  '_c.camera(name="cam_sh010")'
].join('\n') + '\n';
var FILES = 'Scene:\n  ctrl_A    (locator)  translate = (3, 1.5, 0), rotateY = 45\n  ctrl_B    (locator)  at the origin\n  cam_sh010 (camera)';

TA.add({
  id: 'm05',
  title: 'Attributes',

  explain: [
    '**Attributes** are a node\'s data: position, rotation, visibility, focal length… They are written as `"node.attribute"`.',
    { type: 'analogy', text: 'a node is a character sheet and its attributes are the fields: height, strength, name… `getAttr` reads a field and `setAttr` writes to it.' },
    '### Reading and writing',
    '```python\ncmds.getAttr("ctrl_A.translateX")      # 3.0\ncmds.setAttr("ctrl_A.translateX", 5)\ncmds.getAttr("ctrl_A.translate")       # [(5.0, 1.5, 0.0)]  ← a list with one tuple\n```',
    'Attributes have long and short names: `translateX` = `tx`, `rotateY` = `ry`, `visibility` = `v`.',
    { type: 'warn', text: '`getAttr("x.translate")` returns a **list with a tuple inside**: `[(x, y, z)]`. To get the three numbers: `cmds.getAttr("x.translate")[0]`.' },
    '### Your own attributes: addAttr',
    'You can add your own attributes to a node. It is the clean way to store **metadata** in the scene: which shot a camera belongs to, who approved it…',
    '```python\ncmds.addAttr("cam_sh010", longName="shotName", dataType="string")\ncmds.setAttr("cam_sh010.shotName", "sh010", type="string")\n```',
    { type: 'warn', text: 'for **text** attributes you must pass `type="string"` to `setAttr`. A very common slip.' },
    '### Check before touching',
    '- `cmds.objExists("node.attr")` → does the attribute exist?\n- `cmds.attributeQuery("attr", node="node", exists=True)` → the same, another way.\n- `cmds.listAttr("node", userDefined=True)` → only the attributes we added (or `None`).',
    { type: 'cg', text: 'the exporter reads `cam_sh010.shotName` to know which shot each camera belongs to, even if the artist renamed it.' }
  ],

  example: {
    intro: 'We read, write and add metadata.',
    lines: [
      { code: 'from maya import cmds', note: 'We import.' },
      { code: 'x, y, z = cmds.getAttr("ctrl_A.translate")[0]\nprint(x, y, z)', note: 'A list with one tuple: `[0]` and unpack.' },
      { code: 'cmds.setAttr("ctrl_B.translate", x, y, z)', note: '`setAttr` accepts the three values in a row for a compound attribute.' },
      { code: 'cmds.addAttr("cam_sh010", longName="shotName", dataType="string")\ncmds.setAttr("cam_sh010.shotName", "sh010", type="string")', note: 'We add a text attribute and give it a value.' },
      { code: 'print(cmds.getAttr("cam_sh010.shotName"), cmds.listAttr("cam_sh010", userDefined=True))', note: 'We read it and list our own attributes.' }
    ],
    output: "3.0 1.5 0.0\nsh010 ['shotName']"
  },

  mini: [
    {
      q: 'What does `cmds.getAttr("loc.translate")` return?',
      options: ['`(1.0, 2.0, 3.0)`', '`[(1.0, 2.0, 3.0)]`', '`1.0`'],
      answer: 1,
      why: 'A list with a tuple inside. Use `[0]` to get the tuple.'
    },
    {
      q: 'What is missing from `cmds.setAttr("cam.shotName", "sh010")` if `shotName` is text?',
      options: ['Nothing', '`type="string"`', '`dataType="text"`'],
      answer: 1,
      why: 'For text attributes, `setAttr` needs `type="string"`.'
    }
  ],

  exercises: [
    {
      id: 'e1',
      title: 'Reading the position',
      prompt: 'Create `pos`: a **tuple** `(x, y, z)` with `ctrl_A`\'s translation, and `turn` with its `rotateY`.',
      setup: SETUP, files: FILES,
      starter: 'from maya import cmds\n\n',
      tests: [
        { check: 'pos == (3.0, 1.5, 0.0)', msg: '`pos` is (3.0, 1.5, 0.0)' },
        { check: 'turn == 45.0', msg: '`turn` is 45.0' }
      ],
      hints: ['`cmds.getAttr("ctrl_A.translate")[0]`', '`cmds.getAttr("ctrl_A.rotateY")` (or `"ctrl_A.ry"`).'],
      solution: 'from maya import cmds\n\npos = cmds.getAttr("ctrl_A.translate")[0]\nturn = cmds.getAttr("ctrl_A.rotateY")\n'
    },
    {
      id: 'e2',
      title: 'Copying transforms',
      prompt: 'Write `copy_xform(source, target)`: copy the 9 translate, rotate and scale attributes (`translateX` … `scaleZ`) from `source` to `target`.',
      setup: SETUP, files: FILES,
      starter: 'from maya import cmds\n\nATTRS = [a + e for a in ("translate", "rotate", "scale") for e in "XYZ"]\n\ndef copy_xform(source, target):\n    # your code\n    pass\n',
      tests: [
        { check: "(copy_xform('ctrl_A', 'ctrl_B'), cmds.getAttr('ctrl_B.translate')[0])[1] == (3.0, 1.5, 0.0)", msg: 'ctrl_B has ctrl_A\'s translation' },
        { check: "cmds.getAttr('ctrl_B.rotateY') == 45.0 and cmds.getAttr('ctrl_B.scaleX') == 1.0", msg: 'rotation and scale too' }
      ],
      hints: ['`for a in ATTRS:`', '`cmds.setAttr(f"{target}.{a}", cmds.getAttr(f"{source}.{a}"))`'],
      solution: 'from maya import cmds\n\nATTRS = [a + e for a in ("translate", "rotate", "scale") for e in "XYZ"]\n\ndef copy_xform(source, target):\n    for a in ATTRS:\n        cmds.setAttr(f"{target}.{a}", cmds.getAttr(f"{source}.{a}"))\n'
    },
    {
      id: 'e3',
      title: 'Tagging the camera',
      prompt: 'Write `tag_camera(camera, shot)`: add a text attribute `shotName` to the camera (only if it does **not** already exist) and store the shot name in it.\n\nCalling it twice must not raise an error.',
      setup: SETUP, files: FILES,
      starter: 'from maya import cmds\n\ndef tag_camera(camera, shot):\n    # your code\n    pass\n',
      tests: [
        { check: "(tag_camera('cam_sh010', 'sh010'), cmds.getAttr('cam_sh010.shotName'))[1] == 'sh010'", msg: 'cam_sh010.shotName is "sh010"' },
        { check: "(tag_camera('cam_sh010', 'sh011'), cmds.getAttr('cam_sh010.shotName'))[1] == 'sh011'", msg: 'a second call does not raise and updates the value' }
      ],
      hints: ['`if not cmds.objExists(f"{camera}.shotName"):` → `addAttr`.', '`cmds.setAttr(f"{camera}.shotName", shot, type="string")`'],
      solution: 'from maya import cmds\n\ndef tag_camera(camera, shot):\n    if not cmds.objExists(f"{camera}.shotName"):\n        cmds.addAttr(camera, longName="shotName", dataType="string")\n    cmds.setAttr(f"{camera}.shotName", shot, type="string")\n'
    }
  ],

  summary: [
    '`getAttr` / `setAttr` with `"node.attribute"`; compound attributes give `[(x, y, z)]`.',
    '`addAttr` stores metadata; for text, `setAttr(..., type="string")`.',
    'Check with `objExists("node.attr")` before adding or reading.'
  ]
});
})();
