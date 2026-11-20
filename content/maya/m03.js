(function () {
var SETUP = [
  'from maya import cmds as _c',
  '_c.createNode("transform", name="rig_grp")',
  '_c.createNode("transform", name="geo_grp", parent="rig_grp")',
  '_c.createNode("transform", name="ctrl_grp", parent="rig_grp")',
  '_c.polyCube(name="body_geo")',
  '_c.polyCube(name="head_geo")',
  '_c.parent("body_geo", "head_geo", "geo_grp")',
  '_c.spaceLocator(name="main_ctrl")',
  '_c.parent("main_ctrl", "ctrl_grp")',
  '_c.polyCube(name="loose_geo")'
].join('\n') + '\n';
var FILES = 'rig_grp\n  geo_grp\n    body_geo  → body_geoShape\n    head_geo  → head_geoShape\n  ctrl_grp\n    main_ctrl → main_ctrlShape\nloose_geo → loose_geoShape   (at the root)';

TA.add({
  id: 'm03',
  title: 'Hierarchy',

  explain: [
    'The hierarchy organizes the scene: the rig inside one group, the geometry inside another. Tools walk it constantly.',
    { type: 'analogy', text: 'just like a family: `listRelatives(parent=True)` asks “who is your mother?”, `children=True` “who are your children?”, and `allDescendents=True` “who are all your descendants: children, grandchildren…?”.' },
    '### Moving things in the hierarchy',
    '- `cmds.parent("child", "parent")` → puts the child under the parent.\n- `cmds.parent("node", world=True)` → moves it to the root.\n- `cmds.group("a", "b", name="grp")` → creates a group with those nodes.',
    '### Asking about the family: listRelatives',
    '- `children=True` (default) → direct children.\n- `parent=True` → the parent.\n- `allDescendents=True` → everything below.\n- `shapes=True` → only shapes. `type="mesh"` → only one type.\n- `fullPath=True` → full paths.',
    { type: 'warn', text: '`listRelatives` returns **`None`** (not `[]`) when it finds nothing. If you write `for x in cmds.listRelatives(...)`, your tool breaks with a `TypeError` on the first node with no children. Always write `cmds.listRelatives(...) or []`.' },
    { type: 'cg', text: 'before exporting a character, the tool takes `rig_grp`, finds every `mesh` under it with `allDescendents=True, type="mesh"` and exports only those.' },
    { type: 'tip', text: 'the `listRelatives` `None` detail is almost a password between TAs. If you mention it without being asked, it shows you have written real tools.' }
  ],

  example: {
    intro: 'We explore the family of `rig_grp`.',
    lines: [
      { code: 'from maya import cmds', note: 'We import.' },
      { code: 'print(cmds.listRelatives("rig_grp"))', note: 'Direct children.' },
      { code: 'print(cmds.listRelatives("body_geo", parent=True))', note: 'The parent (as a list).' },
      { code: 'print(cmds.listRelatives("rig_grp", allDescendents=True, type="mesh"))', note: 'Every mesh shape below, at any depth.' },
      { code: 'print(cmds.listRelatives("head_geoShape"))', note: 'A shape has no children → `None`.' },
      { code: 'for child in cmds.listRelatives("head_geoShape") or []:\n    print(child)', note: 'With `or []`, the loop simply does nothing. No error.' }
    ],
    output: "['geo_grp', 'ctrl_grp']\n['geo_grp']\n['body_geoShape', 'head_geoShape']\nNone"
  },

  mini: [
    {
      q: 'What happens with `for x in cmds.listRelatives("nodeWithNoChildren"):`?',
      options: ['The loop does nothing', '`TypeError`: cannot iterate over `None`', 'It walks every node in the scene'],
      answer: 1,
      why: 'It returns `None`. You have to write `cmds.listRelatives(...) or []`.'
    },
    {
      q: 'Which `listRelatives` option also gives the grandchildren?',
      options: ['`children=True`', '`allDescendents=True`', '`parent=True`'],
      answer: 1,
      why: '`children` only gives the direct children.'
    }
  ],

  exercises: [
    {
      id: 'e1',
      title: 'Tidying the scene',
      prompt: '`loose_geo` is at the root. Put it inside `geo_grp`.\n\nThen create `in_geo`: a **sorted** list of the direct children of `geo_grp`.',
      setup: SETUP, files: FILES,
      starter: 'from maya import cmds\n\n',
      tests: [
        { check: "cmds.listRelatives('loose_geo', parent=True) == ['geo_grp']", msg: 'loose_geo hangs under geo_grp' },
        { check: "in_geo == ['body_geo', 'head_geo', 'loose_geo']", msg: '`in_geo` has the three children, sorted' }
      ],
      hints: ['`cmds.parent("loose_geo", "geo_grp")`', '`sorted(cmds.listRelatives("geo_grp"))`'],
      solution: 'from maya import cmds\n\ncmds.parent("loose_geo", "geo_grp")\nin_geo = sorted(cmds.listRelatives("geo_grp"))\n'
    },
    {
      id: 'e2',
      title: 'Children without surprises',
      prompt: 'Write `children(node)`: return the direct children as a **list** (empty if there are none, never `None`).',
      setup: SETUP, files: FILES,
      starter: 'from maya import cmds\n\ndef children(node):\n    # your code\n    pass\n',
      tests: [
        { check: "children('rig_grp') == ['geo_grp', 'ctrl_grp']", msg: "children('rig_grp') gives ['geo_grp', 'ctrl_grp']" },
        { check: "children('head_geoShape') == []", msg: 'a node with no children gives [] (not None)' }
      ],
      hints: ['`return cmds.listRelatives(node, children=True) or []`'],
      solution: 'from maya import cmds\n\ndef children(node):\n    return cmds.listRelatives(node, children=True) or []\n'
    },
    {
      id: 'e3',
      title: 'A character\'s geometry',
      prompt: 'Write `geometry_of(group)`: return the **sorted** list of **transforms** that have a `mesh` shape and hang (at any depth) under `group`.',
      setup: SETUP, files: FILES,
      starter: 'from maya import cmds\n\ndef geometry_of(group):\n    # your code\n    pass\n',
      tests: [
        { check: "geometry_of('rig_grp') == ['body_geo', 'head_geo']", msg: "geometry_of('rig_grp') gives body_geo and head_geo" },
        { check: "geometry_of('ctrl_grp') == []", msg: 'a group with no geometry gives []' }
      ],
      hints: ['`cmds.listRelatives(group, allDescendents=True, type="mesh") or []` gives the shapes.', 'For each shape, its transform is `cmds.listRelatives(shape, parent=True)[0]`.'],
      solution: 'from maya import cmds\n\ndef geometry_of(group):\n    shapes = cmds.listRelatives(group, allDescendents=True, type="mesh") or []\n    return sorted({cmds.listRelatives(s, parent=True)[0] for s in shapes})\n'
    }
  ],

  summary: [
    '`parent(child, parent)`, `parent(node, world=True)` and `group(...)` change the hierarchy.',
    '`listRelatives`: `children`, `parent`, `allDescendents`, `shapes`, `type`, `fullPath`.',
    'It returns `None` when there is nothing: always write `... or []`.'
  ]
});
})();
