(function () {
var SETUP = [
  'from maya import cmds as _c',
  'for _n in ["Hero", "Boss", "sword", "Shield_Geo"]:',
  '    _c.polyCube(name=_n)',
  '_c.camera(name="Cam_SH10")',
  '_c.camera(name="CAM_sh7")',
  '_c.polyCube(name="hero_geo")',
  'del _n'
].join('\n') + '\n';
var FILES = 'Scene:\n  Hero, Boss, sword, Shield_Geo, hero_geo  (mesh)\n  Cam_SH10, CAM_sh7                        (camera)';

TA.add({
  id: 'm04',
  title: 'Renaming and naming conventions',

  explain: [
    'Renaming is easy: `cmds.rename("old", "new")`. The hard part is doing it **in batch** without breaking anything.',
    { type: 'analogy', text: 'renaming in Maya is like changing someone\'s name at a crowded party: if the new name already belongs to someone else, Maya adds a number so they do not get mixed up.' },
    '### rename returns the real name',
    '`cmds.rename` returns the name that **actually** stuck. If `hero_geo` already exists, `rename("Hero", "hero_geo")` returns `hero_geo1`.',
    { type: 'warn', text: 'never assume the name ended up as you asked. Keep what `rename` returns and compare: if they differ, there is a conflict to report.' },
    '### Shapes have names too',
    'When you rename a transform, its shape is **not** renamed automatically (in real Maya it depends on the case). Many conventions require `<transform>Shape`. A serious tool renames both.',
    '### Renaming long paths: order matters',
    'If you rename a **parent**, the long path of all its children changes. If you had stored those paths, they no longer work. That is why, when renaming hierarchies by long path, you rename **bottom-up** (children first).',
    { type: 'cg', text: 'your naming checker (lesson p18) suggests `cam_sh010` for `Cam_SH10`. Here you learn to apply those suggestions to the scene safely.' }
  ],

  example: {
    intro: 'We rename and look at what comes back.',
    lines: [
      { code: 'from maya import cmds', note: 'We import.' },
      { code: 'print(cmds.rename("Boss", "boss_geo"))', note: 'No conflict: it stays as asked.' },
      { code: 'print(cmds.rename("Hero", "hero_geo"))', note: '`hero_geo` already existed → `hero_geo1`.' },
      { code: 'shape = cmds.listRelatives("boss_geo", shapes=True)[0]\nprint(shape)', note: 'The shape still has its old name.' },
      { code: 'print(cmds.rename(shape, "boss_geoShape"))', note: 'We line it up with its transform.' }
    ],
    output: 'boss_geo\nhero_geo1\nBossShape\nboss_geoShape'
  },

  mini: [
    {
      q: '`cam_A` exists. What does `cmds.rename("camera1", "cam_A")` return?',
      options: ['`"cam_A"`, and the old one is deleted', '`"cam_A1"`', 'It raises an error'],
      answer: 1,
      why: 'Maya adds a number. Your tool should detect it by comparing with what it asked for.'
    },
    {
      q: 'Why rename bottom-up when working with long paths?',
      options: ['Because it is faster', 'Because renaming a parent changes the long path of its children', 'Because Maya requires it'],
      answer: 1,
      why: 'If you rename the parent first, the stored paths of the children stop existing.'
    }
  ],

  exercises: [
    {
      id: 'e1',
      title: 'The _geo suffix',
      prompt: 'Rename the transforms `"Boss"` and `"sword"` by lowercasing them and adding `_geo` (`boss_geo`, `sword_geo`).\n\nStore in `new_names` the names **that `rename` returns**.',
      setup: SETUP, files: FILES,
      starter: 'from maya import cmds\n\nnew_names = []\nfor node in ["Boss", "sword"]:\n    pass\n',
      tests: [
        { check: "new_names == ['boss_geo', 'sword_geo']", msg: '`new_names` is ["boss_geo", "sword_geo"]' },
        { check: "cmds.objExists('boss_geo') and not cmds.objExists('Boss')", msg: 'Boss no longer exists; boss_geo does' }
      ],
      hints: ['`cmds.rename(node, node.lower() + "_geo")`'],
      solution: 'from maya import cmds\n\nnew_names = []\nfor node in ["Boss", "sword"]:\n    new_names.append(cmds.rename(node, node.lower() + "_geo"))\n'
    },
    {
      id: 'e2',
      title: 'Reporting conflicts',
      prompt: 'Write `safe_rename(old, wanted)`: rename and return `(real_name, had_conflict)`. `had_conflict` is `True` if Maya could not use the name you asked for.',
      setup: SETUP, files: FILES,
      starter: 'from maya import cmds\n\ndef safe_rename(old, wanted):\n    # your code\n    pass\n',
      tests: [
        { check: "safe_rename('Boss', 'boss_geo') == ('boss_geo', False)", msg: 'no conflict: (boss_geo, False)' },
        { check: "safe_rename('Hero', 'hero_geo') == ('hero_geo1', True)", msg: 'with a conflict: (hero_geo1, True)' }
      ],
      hints: ['`real = cmds.rename(old, wanted)`', '`return real, real != wanted`'],
      solution: 'from maya import cmds\n\ndef safe_rename(old, wanted):\n    real = cmds.rename(old, wanted)\n    return real, real != wanted\n'
    },
    {
      id: 'e3',
      title: 'Fixing the cameras (transform and shape)',
      prompt: 'For each production camera (transforms `Cam_SH10` and `CAM_sh7`), rename the transform to `cam_shXXX` (3 digits) and its shape to `cam_shXXXShape`.\n\nStore in `done` a dict `{old: new}` for the transforms.',
      setup: SETUP, files: FILES,
      starter: 'import re\nfrom maya import cmds\n\ndone = {}\nfor cam in ["Cam_SH10", "CAM_sh7"]:\n    pass\n',
      tests: [
        { check: "done == {'Cam_SH10': 'cam_sh010', 'CAM_sh7': 'cam_sh007'}", msg: '`done` has both changes' },
        { check: "cmds.listRelatives('cam_sh010', shapes=True) == ['cam_sh010Shape'] and cmds.listRelatives('cam_sh007', shapes=True) == ['cam_sh007Shape']", msg: 'the shapes were renamed too' }
      ],
      hints: ['`num = int(re.search(r"\\d+", cam).group())` and `new = f"cam_sh{num:03d}"`.', 'Before renaming the transform, grab its shape: `shape = cmds.listRelatives(cam, shapes=True)[0]`.'],
      solution: 'import re\nfrom maya import cmds\n\ndone = {}\nfor cam in ["Cam_SH10", "CAM_sh7"]:\n    num = int(re.search(r"\\d+", cam).group())\n    new = f"cam_sh{num:03d}"\n    shape = cmds.listRelatives(cam, shapes=True)[0]\n    real = cmds.rename(cam, new)\n    cmds.rename(shape, real + "Shape")\n    done[cam] = real\n'
    }
  ],

  summary: [
    '`cmds.rename` returns the real name: on a clash, Maya adds a number.',
    'Compare what you asked for with what came back to detect conflicts.',
    'Rename the shapes too; with long paths, go bottom-up.'
  ]
});
})();
