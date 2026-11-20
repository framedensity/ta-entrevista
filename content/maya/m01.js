(function () {
var SETUP = [
  'from maya import cmds as _c',
  '_c.polyCube(name="hero_geo")',
  '_c.spaceLocator(name="ctrl_main")',
  '_c.camera(name="cam_sh010")',
  '_c.createNode("transform", name="empty_grp")'
].join('\n') + '\n';
var FILES = 'Scene (besides persp, top, front, side):\n  hero_geo   (transform) → hero_geoShape  (mesh)\n  ctrl_main  (transform) → ctrl_mainShape (locator)\n  cam_sh010  (transform) → cam_sh010Shape (camera)\n  empty_grp  (transform, no shape)\n  polyCube1  (history node)';

TA.add({
  id: 'm01',
  title: 'The scene as a family tree',

  explain: [
    'Everything in Maya is a **node**: an object, a camera, a material, even an operation like «make a cube». Each node has a **type** and some **attributes**.',
    { type: 'analogy', text: 'the scene is a **family tree**. There are parents, children and siblings. If you move the parent, the whole family moves with it.' },
    'That tree is called the **DAG** (Directed Acyclic Graph). It is the hierarchy you see in the *Outliner*.',
    '### Transform and shape: the inseparable pair',
    'What you see as «a cube» is actually **two nodes**:',
    '- The **transform**: where it is, how it is rotated and scaled. It is the one you select.\n- The **shape**: the actual geometry (the vertices). It lives **under** the transform, as its child.',
    { type: 'analogy', text: 'the transform is the **hanger** and the shape is the **clothes**. Move the hanger and the clothes go with it. A hanger on its own (an empty group) is invisible.' },
    'So `hero_geo` is the transform, and `hero_geoShape` is its shape of type `mesh`.',
    '### Nodes that are not in the tree',
    'Some nodes have no position: materials, history nodes like `polyCube1`. They exist in the scene, but not in the DAG.',
    '### A new scene is not empty',
    'Maya always creates four cameras: `persp`, `top`, `front` and `side`. Careful when listing cameras: your tool must ignore them!',
    { type: 'cg', text: 'a cinematics exporter looks for the shot cameras. If it does not filter out the four defaults, it exports `persp` as if it were a scripted camera.' },
    'In these exercises we use `from maya import cmds`. It is a **simulator** that runs the basics of Maya in the browser.'
  ],

  example: {
    intro: 'We look at what is in the scene.',
    lines: [
      { code: 'from maya import cmds', note: 'The usual way to import the commands.' },
      { code: 'print(cmds.ls(type="camera"))', note: 'Cameras are **shapes**. You get the 4 defaults and ours.' },
      { code: 'print(cmds.listRelatives("hero_geo", shapes=True))', note: 'The shape hanging under the transform.' },
      { code: 'print(cmds.nodeType("hero_geo"), cmds.nodeType("hero_geoShape"))', note: 'Transform on the outside, mesh inside.' },
      { code: 'print(cmds.listRelatives("empty_grp", shapes=True))', note: 'An empty group has no shape. It returns `None`, not an empty list!' }
    ],
    output: "['perspShape', 'topShape', 'frontShape', 'sideShape', 'cam_sh010Shape']\n['hero_geoShape']\ntransform mesh\nNone"
  },

  mini: [
    {
      q: 'You select a cube in the viewport. Which node did you select?',
      options: ['The shape (`mesh`)', 'The transform', 'The `polyCube1` node'],
      answer: 1,
      why: 'What you select and move is the transform. The shape hangs under it.'
    },
    {
      q: 'Which cameras come with a new Maya scene?',
      options: ['None', 'Only `persp`', '`persp`, `top`, `front` and `side`'],
      answer: 2,
      why: 'That is why tools filter out these four when looking for production cameras.'
    }
  ],
  extra: [
    {
      q: 'What does `cmds.listRelatives(node, shapes=True)` return if the node has no shapes?',
      options: ['`[]`', '`None`', 'An error'],
      answer: 1,
      why: 'A classic Maya trap: many commands return `None` when there are no results. Use `... or []`.'
    }
  ],

  exercises: [
    {
      id: 'e1',
      title: 'My transforms',
      prompt: 'Create `mine`: a **sorted** list of the transforms in the scene, **without** the four default cameras.',
      setup: SETUP, files: FILES,
      starter: 'from maya import cmds\n\nDEFAULT_CAMS = {"persp", "top", "front", "side"}\n\n',
      tests: [{ check: "mine == ['cam_sh010', 'ctrl_main', 'empty_grp', 'hero_geo']", msg: '`mine` has the 4 created transforms, sorted' }],
      hints: ['`cmds.ls(type="transform")` gives every transform.', '`sorted(t for t in cmds.ls(type="transform") if t not in DEFAULT_CAMS)`'],
      solution: 'from maya import cmds\n\nDEFAULT_CAMS = {"persp", "top", "front", "side"}\n\nmine = sorted(t for t in cmds.ls(type="transform") if t not in DEFAULT_CAMS)\n'
    },
    {
      id: 'e2',
      title: 'Hanger and clothes',
      prompt: 'Create `shape_types`: a dict `{transform: type_of_its_shape}` for the transforms in `TRANSFORMS`. If a transform has **no** shape, the value is `None`.',
      setup: SETUP, files: FILES,
      starter: 'from maya import cmds\n\nTRANSFORMS = ["hero_geo", "ctrl_main", "cam_sh010", "empty_grp"]\n\n',
      tests: [{ check: "shape_types == {'hero_geo': 'mesh', 'ctrl_main': 'locator', 'cam_sh010': 'camera', 'empty_grp': None}", msg: '`shape_types` gives the shape type, or None' }],
      hints: ['`shapes = cmds.listRelatives(t, shapes=True)` can be `None`.', '`shape_types[t] = cmds.nodeType(shapes[0]) if shapes else None`'],
      solution: 'from maya import cmds\n\nTRANSFORMS = ["hero_geo", "ctrl_main", "cam_sh010", "empty_grp"]\n\nshape_types = {}\nfor t in TRANSFORMS:\n    shapes = cmds.listRelatives(t, shapes=True)\n    shape_types[t] = cmds.nodeType(shapes[0]) if shapes else None\n'
    },
    {
      id: 'e3',
      title: 'Production cameras',
      prompt: 'Write `production_cameras()`: return the **sorted** list of camera **transforms**, without the default cameras.\n\nRemember: `ls(type="camera")` gives the **shapes**. You have to go up to their parent.',
      setup: SETUP, files: FILES,
      starter: 'from maya import cmds\n\ndef production_cameras():\n    # your code\n    pass\n',
      tests: [
        { check: "production_cameras() == ['cam_sh010']", msg: 'returns ["cam_sh010"]' },
        { check: "(cmds.camera(name='cam_sh020'), production_cameras())[1] == ['cam_sh010', 'cam_sh020']", msg: 'if another camera is created, it shows up' }
      ],
      hints: ['`cmds.listRelatives(shape, parent=True)[0]` is the transform.', 'Filter with `{"persp", "top", "front", "side"}`.'],
      solution: 'from maya import cmds\n\ndef production_cameras():\n    defaults = {"persp", "top", "front", "side"}\n    result = []\n    for shape in cmds.ls(type="camera"):\n        transform = cmds.listRelatives(shape, parent=True)[0]\n        if transform not in defaults:\n            result.append(transform)\n    return sorted(result)\n'
    }
  ],

  summary: [
    'Everything is a node; the ones with a position form the DAG tree (parents and children).',
    'A visible object = **transform** (hanger) + **shape** (clothes) underneath.',
    'A new scene has `persp/top/front/side`; many commands return `None` when there is nothing.'
  ]
});
})();
