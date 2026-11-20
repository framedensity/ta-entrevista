(function () {
var SETUP = [
  'def _close(a, b, tol=1e-6):',
  '    if isinstance(a, (int, float)) and isinstance(b, (int, float)):',
  '        return abs(a - b) < tol',
  '    try:',
  '        a, b = list(a), list(b)',
  '    except TypeError:',
  '        return False',
  '    return len(a) == len(b) and all(_close(x, y, tol) for x, y in zip(a, b))'
].join('\n') + '\n';
var ROT = 'import math\n\ndef rotate(v, degrees):\n    t = math.radians(degrees)\n    c, s = math.cos(t), math.sin(t)\n    return (c * v[0] - s * v[1], s * v[0] + c * v[1])\n';

TA.add({
  id: 'v06',
  title: 'Local and world space',

  explain: [
    'Every object has its position in two “languages”: **local** (object space, relative to its parent) and **world** (relative to the scene origin).',
    { type: 'analogy', text: 'on a train, your seat is “car 3, row 5” (local). For someone on the platform, you are at a spot that changes as the train moves (world). Your local seat does not change; your world position does.' },
    { type: 'viz', name: 'space' },
    '### Local to world',
    'World position = the **parent\'s matrix** applied to the local position: first rotate (and scale) with the parent, then add the parent\'s position.',
    '`world = parent_pos + rotate(local, parent_angle)`',
    '### World to local',
    'The opposite way: subtract the parent\'s position and rotate by the **opposite** angle. With matrices: multiply by the **inverse** of the parent\'s matrix.',
    '### Hierarchies',
    'With several levels (hip → thigh → knee → foot), each matrix is multiplied by its parent\'s. The foot\'s world matrix is the product of the whole chain. That is **forward kinematics** (FK).',
    { type: 'cg', text: 'in Maya: `getAttr obj.translate` gives the **local** position; `xform(obj, q=True, ws=True, t=True)` gives the **world** one. Mixing them up is one of the most common bugs in animation tools (for example when snapping a control to a joint).' },
    { type: 'tip', text: 'if they ask about `worldMatrix` and `parentInverseMatrix`: “the world matrix is the local matrix times the parent\'s world matrix; to bring something from world to local, I multiply by the inverse of the parent\'s world matrix”.' }
  ],

  example: {
    intro: 'A child at local (2, 0) under a parent at (3, 1) rotated 90°.',
    lines: [
      { code: ROT.replace(/\n$/, ''), note: '2D rotation (the matrix from v05, written by hand).' },
      { code: 'parent_pos, parent_angle = (3, 1), 90\nlocal = (2, 0)', note: 'The child sits 2 units “to the right” of its parent.' },
      { code: 'r = rotate(local, parent_angle)', note: 'First rotate with the parent: (2, 0) → (0, 2).' },
      { code: 'world = (parent_pos[0] + r[0], parent_pos[1] + r[1])', note: 'Then add the parent\'s position.' },
      { code: 'print(tuple(round(c, 6) for c in world))', note: 'In world space, the child is above the parent.' }
    ],
    output: '(3.0, 3.0)'
  },

  mini: [
    {
      q: 'You move the parent 5 units in X. What happens to the child\'s (local) `translate`?',
      options: ['It goes up by 5 in X', 'It does not change', 'It resets to zero'],
      answer: 1,
      why: 'Local is relative to the parent: it does not change. What changes is its world position.'
    },
    {
      q: 'You want to put a control exactly where a joint is, but the control has a rotated parent. What do you do?',
      options: ['Copy the joint\'s `translate` to the control', 'Read the joint\'s **world** position and convert it to the control\'s **local** space (or use `xform(ws=True)`)', 'Never give controls a parent'],
      answer: 1,
      why: 'Copying `translate` only works if both have the same parent.'
    }
  ],
  extra: [
    {
      q: 'How do you go from world space to local space?',
      options: ['Multiply by the parent\'s world matrix', 'Multiply by the **inverse** of the parent\'s world matrix', 'Subtract 1'],
      answer: 1,
      why: 'The inverse undoes the parent\'s transformation.'
    }
  ],

  exercises: [
    {
      id: 'e1',
      title: 'Local to world',
      prompt: 'Write `to_world(local, parent_pos, parent_angle)` in 2D: rotate `local` by the parent\'s angle (in degrees) and add the parent\'s position.\n\n`rotate(v, degrees)` is already written.',
      setup: SETUP,
      starter: ROT + '\ndef to_world(local, parent_pos, parent_angle):\n    pass\n',
      tests: [
        { check: '_close(to_world((1, 0), (2, 3), 90), (2, 4))', msg: 'local (1,0), parent at (2,3) rotated 90° → (2, 4)' },
        { check: '_close(to_world((1, 1), (0, 0), 0), (1, 1))', msg: 'parent at the origin, not rotated: no change' },
        { check: '_close(to_world((2, 0), (5, 0), 180), (3, 0))', msg: 'parent rotated 180°: the child ends up behind' }
      ],
      hints: ['`r = rotate(local, parent_angle)`', '`return (parent_pos[0] + r[0], parent_pos[1] + r[1])`'],
      solution: ROT + '\ndef to_world(local, parent_pos, parent_angle):\n    r = rotate(local, parent_angle)\n    return (parent_pos[0] + r[0], parent_pos[1] + r[1])\n'
    },
    {
      id: 'e2',
      title: 'World to local',
      prompt: 'Write `to_local(world, parent_pos, parent_angle)`: the opposite way. Subtract the parent\'s position and rotate by the **opposite** angle.',
      setup: SETUP,
      starter: ROT + '\ndef to_local(world, parent_pos, parent_angle):\n    pass\n',
      tests: [
        { check: '_close(to_local((2, 4), (2, 3), 90), (1, 0))', msg: 'undoes the previous example: (2,4) → (1, 0)' },
        { check: '_close(to_local((3, 0), (5, 0), 180), (2, 0))', msg: 'parent rotated 180°' }
      ],
      hints: ['Subtract first: `d = (world[0] - parent_pos[0], world[1] - parent_pos[1])`.', 'Then `rotate(d, -parent_angle)`.'],
      solution: ROT + '\ndef to_local(world, parent_pos, parent_angle):\n    d = (world[0] - parent_pos[0], world[1] - parent_pos[1])\n    return rotate(d, -parent_angle)\n',
      explain: 'The order flips too: to go to world you rotate then add; to come back you subtract then rotate the other way.'
    },
    {
      id: 'e3',
      title: 'FK chain',
      prompt: 'A chain of bones in 2D starts at `(0, 0)`. Each bone has a length and an angle **relative to its parent** (in degrees). The first bone with angle 0 points toward +X.\n\nWrite `chain_tip(lengths, angles)`: the world position of the end of the chain.',
      setup: SETUP,
      starter: 'import math\n\ndef chain_tip(lengths, angles):\n    pass\n',
      tests: [
        { check: '_close(chain_tip([2], [0]), (2, 0))', msg: 'one bone of length 2, not rotated → (2, 0)' },
        { check: '_close(chain_tip([1, 1], [90, -90]), (1, 1))', msg: 'goes up 1 and then back toward +X: (1, 1)' },
        { check: '_close(chain_tip([1, 1, 1], [0, 90, 90]), (0, 1))', msg: 'three bones turning 90° each: (0, 1)' }
      ],
      hints: ['Angles **accumulate**: the second bone turns `angles[0] + angles[1]` in world space.', 'Keep `x, y, total = 0, 0, 0`. For each bone: `total += angle`, then add `l·cos(total)`, `l·sin(total)`.'],
      solution: 'import math\n\ndef chain_tip(lengths, angles):\n    x = y = total = 0.0\n    for l, ang in zip(lengths, angles):\n        total += ang\n        t = math.radians(total)\n        x += l * math.cos(t)\n        y += l * math.sin(t)\n    return (x, y)\n',
      explain: 'This is how Maya computes the hand position from the arm joints: each local rotation adds to its parents\'.'
    }
  ],

  summary: [
    'Local = relative to the parent; world = relative to the scene origin.',
    'Local → world: rotate with the parent and add its position; the other way, use the inverse.',
    'In hierarchies transformations accumulate (FK); `translate` is local, `xform(ws=True)` is world.'
  ]
});
})();
