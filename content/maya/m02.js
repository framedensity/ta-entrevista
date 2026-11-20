(function () {
var SETUP = [
  'from maya import cmds as _c',
  'for _n in ["hero_geo", "boss_geo", "sword_geo"]:',
  '    _c.polyCube(name=_n)',
  '_c.spaceLocator(name="hero_ctrl")',
  '_c.camera(name="cam_sh010")',
  '_c.camera(name="cam_sh020")',
  'del _n'
].join('\n') + '\n';
var FILES = 'Scene:\n  hero_geo, boss_geo, sword_geo  (mesh)\n  hero_ctrl                      (locator)\n  cam_sh010, cam_sh020           (camera)\n  + persp, top, front, side';

TA.add({
  id: 'm02',
  title: 'Creating and listing nodes',

  explain: [
    'Almost every tool starts the same way: **finding** the nodes to work with. The star command is `cmds.ls()`.',
    { type: 'analogy', text: '`ls` is a library catalog. You can ask for «every book», «the ones by this author» or «the ones starting with *Hero*».' },
    '### ls: searching',
    '- `cmds.ls()` → every node.\n- `cmds.ls(type="mesh")` → just one type (also a list of types).\n- `cmds.ls("*_geo")` → with wildcards: `*` = any text.\n- `cmds.ls(selection=True)` (or `sl=True`) → the selection.\n- `cmds.ls(long=True)` → **full paths**: `|group|hero_geo`.',
    { type: 'warn', text: 'two nodes in different groups **can have the same name**. The short name is not always unique; the long path (`long=True`) is.' },
    '### Creating nodes',
    '- `cmds.createNode("transform", name="x")` → creates a node of any type.\n- `cmds.spaceLocator(name="x")`, `cmds.polyCube(name="x")`, `cmds.camera(name="x")` → shortcuts that create transform + shape. They return a **list**.',
    { type: 'warn', text: 'if you ask for a name that already exists, Maya adds a number: you ask for `hero_geo` and get `hero_geo1`. Always use the name the command **returns**, not the one you asked for.' },
    { type: 'cg', text: 'the exporter runs `cmds.ls("cam_sh*", type="transform")` to find every shot camera, and `cmds.ls("*_geo", type="transform")` for the geometry to export.' }
  ],

  example: {
    intro: 'We search and create.',
    lines: [
      { code: 'from maya import cmds', note: 'We import the commands.' },
      { code: 'print(cmds.ls("*_geo", type="transform"))', note: 'Transforms whose name ends in `_geo`.' },
      { code: 'print(cmds.ls("cam_sh*", type="transform"))', note: 'The shot cameras (and not `persp`).' },
      { code: 'loc = cmds.spaceLocator(name="hero_ctrl")[0]', note: '`hero_ctrl` already exists… `spaceLocator` returns a list; the real name is the first item.' },
      { code: 'print(loc)', note: 'Maya added a number.' }
    ],
    output: "['hero_geo', 'boss_geo', 'sword_geo']\n['cam_sh010', 'cam_sh020']\nhero_ctrl1"
  },

  mini: [
    {
      q: 'You run `cmds.polyCube(name="box")` and a `box` already exists. What is the new one called?',
      options: ['`box` (and the old one is deleted)', '`box1`', 'It raises an error'],
      answer: 1,
      why: 'Maya avoids duplicates by adding a number. That is why you must use the value the command returns.'
    },
    {
      q: 'What does `cmds.ls(long=True)` do?',
      options: ['Lists more nodes', 'Returns full paths like `|group|node`', 'Lists the biggest nodes'],
      answer: 1,
      why: 'The full path is unique even when short names repeat.'
    }
  ],

  exercises: [
    {
      id: 'e1',
      title: 'Finding the geometry',
      prompt: 'Create `geo`: a **sorted** list of transforms whose name ends in `_geo`.',
      setup: SETUP, files: FILES,
      starter: 'from maya import cmds\n\n',
      tests: [{ check: "geo == ['boss_geo', 'hero_geo', 'sword_geo']", msg: '`geo` has the three _geo nodes, sorted' }],
      hints: ['`cmds.ls("*_geo", type="transform")`'],
      solution: 'from maya import cmds\n\ngeo = sorted(cmds.ls("*_geo", type="transform"))\n'
    },
    {
      id: 'e2',
      title: 'A locator for each camera',
      prompt: 'For every transform starting with `cam_sh`, create a locator called `<camera>_aim` (for example `cam_sh010_aim`).\n\nStore in `created` the list of names **that Maya returns**.',
      setup: SETUP, files: FILES,
      starter: 'from maya import cmds\n\ncreated = []\n',
      tests: [
        { check: "sorted(created) == ['cam_sh010_aim', 'cam_sh020_aim']", msg: 'both locators were created' },
        { check: "cmds.objExists('cam_sh010_aim') and cmds.nodeType(cmds.listRelatives('cam_sh010_aim', shapes=True)[0]) == 'locator'", msg: 'they really are locators' }
      ],
      hints: ['`for cam in cmds.ls("cam_sh*", type="transform"):`', '`created.append(cmds.spaceLocator(name=cam + "_aim")[0])`'],
      solution: 'from maya import cmds\n\ncreated = []\nfor cam in cmds.ls("cam_sh*", type="transform"):\n    created.append(cmds.spaceLocator(name=cam + "_aim")[0])\n'
    },
    {
      id: 'e3',
      title: 'Creating without clobbering',
      prompt: 'Write `make_group(name)` that creates an empty transform with `createNode` and returns the **real name**. If you call it twice with `"export_grp"`, it must return `"export_grp"` and then `"export_grp1"`.',
      setup: SETUP, files: FILES,
      starter: 'from maya import cmds\n\ndef make_group(name):\n    # your code\n    pass\n',
      tests: [
        { check: "make_group('export_grp') == 'export_grp' and make_group('export_grp') == 'export_grp1'", msg: 'returns the real name (with a number the second time)' },
        { check: "cmds.nodeType('export_grp') == 'transform'", msg: 'the node is a transform' }
      ],
      hints: ['`return cmds.createNode("transform", name=name)`'],
      solution: 'from maya import cmds\n\ndef make_group(name):\n    return cmds.createNode("transform", name=name)\n'
    }
  ],

  summary: [
    '`cmds.ls()` searches: by type, with `*` wildcards, the selection, or long paths.',
    'The shortcuts (`spaceLocator`, `polyCube`, `camera`) return a list.',
    'Always use the name Maya returns: it may have added a number.'
  ]
});
})();
