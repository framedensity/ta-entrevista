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

TA.add({
  id: 'v01',
  title: 'Vectors',

  explain: [
    'A **vector** is an arrow: it has a **direction** and a **length**. In 3D it is written as three numbers `(x, y, z)`.',
    { type: 'analogy', text: 'a vector is like directions to a place: «3 steps right and 4 steps forward». It does not say where you start, only how to move.' },
    { type: 'viz', name: 'vector' },
    '### Point vs vector',
    'A **point** is a place: where an object is. A **vector** is a displacement: how to get from one place to another. Both are written the same way, `(x, y, z)`, but they mean different things.',
    '### The three basic operations',
    '- **Add**: `a + b` = one arrow after the other. Add component by component.\n- **Subtract**: `b - a` = the arrow that goes **from a to b**. The one you will use most as a TA.\n- **Scale** (scalar multiplication): `v * 2` = same direction, twice as long. With `-1`, it flips around.',
    { type: 'cg', text: 'the camera is at `(0, 2, 10)` and the character at `(3, 2, 6)`. The vector `character - camera = (3, 0, -4)` is the direction the camera has to look.' },
    { type: 'tip', text: 'rule for subtraction: **target minus origin**. «From the camera to the character» is `character - camera`.' },
    'Maya already has vectors (`om.MVector`), but in the interview they may ask you to write them by hand with tuples. That shows you understand what is inside.'
  ],

  example: {
    intro: '3D vectors as tuples.',
    lines: [
      { code: 'camera = (0, 2, 10)\ncharacter = (3, 2, 6)', note: 'Two **points** in the scene.' },
      { code: 'def subtract(a, b):\n    return (a[0] - b[0], a[1] - b[1], a[2] - b[2])', note: 'Component by component.' },
      { code: 'to_char = subtract(character, camera)', note: 'Target minus origin: from the camera to the character.' },
      { code: 'half = tuple(c * 0.5 for c in to_char)', note: 'Scale by 0.5: half of the way.' },
      { code: 'print(to_char, half)', note: 'Result.' }
    ],
    output: '(3, 0, -4) (1.5, 0.0, -2.0)'
  },

  mini: [
    {
      q: 'The enemy is at `(5, 0, 5)` and the player at `(1, 0, 2)`. Which vector goes **from the player to the enemy**?',
      options: ['`(-4, 0, -3)`', '`(4, 0, 3)`', '`(6, 0, 7)`'],
      answer: 1,
      why: 'Target minus origin: `(5-1, 0-0, 5-2) = (4, 0, 3)`.'
    },
    {
      q: 'What happens if you multiply a vector by `-1`?',
      options: ['It becomes zero', 'It points the opposite way, with the same length', 'It becomes twice as long'],
      answer: 1,
      why: 'Every component changes sign: the arrow turns around.'
    }
  ],
  extra: [
    {
      q: 'An object is at `p` and moves with velocity `v` (units per frame). Where is it after 10 frames?',
      options: ['`p * v * 10`', '`p + v * 10`', '`v + 10`'],
      answer: 1,
      why: 'You add the displacement to the point: the velocity scaled by time.'
    }
  ],

  exercises: [
    {
      id: 'e1',
      title: 'Add and subtract',
      prompt: 'Write `add(a, b)` and `subtract(a, b)` for 3D vectors. They must return **tuples** of 3 numbers.',
      setup: SETUP,
      starter: 'def add(a, b):\n    pass\n\ndef subtract(a, b):\n    pass\n',
      tests: [
        { check: 'add((1, 2, 3), (4, 5, 6)) == (5, 7, 9)', msg: 'add((1,2,3), (4,5,6)) gives (5, 7, 9)' },
        { check: 'subtract((5, 0, 5), (1, 0, 2)) == (4, 0, 3)', msg: 'subtract((5,0,5), (1,0,2)) gives (4, 0, 3)' },
        { check: 'isinstance(add((0, 0, 0), (1, 1, 1)), tuple)', msg: 'returns a tuple' }
      ],
      hints: ['`return (a[0] + b[0], a[1] + b[1], a[2] + b[2])`', 'Shorter: `tuple(x + y for x, y in zip(a, b))`.'],
      solution: 'def add(a, b):\n    return tuple(x + y for x, y in zip(a, b))\n\ndef subtract(a, b):\n    return tuple(x - y for x, y in zip(a, b))\n'
    },
    {
      id: 'e2',
      title: 'Scale',
      prompt: 'Write `scale(v, s)`: multiply every component of `v` by the number `s`.',
      setup: SETUP,
      starter: 'def scale(v, s):\n    pass\n',
      tests: [
        { check: 'scale((1, 2, 3), 2) == (2, 4, 6)', msg: 'scale((1,2,3), 2) gives (2, 4, 6)' },
        { check: 'scale((1, -2, 0), -1) == (-1, 2, 0)', msg: 'with -1 it flips around' },
        { check: '_close(scale((4, 0, 2), 0.5), (2, 0, 1))', msg: 'works with decimals' }
      ],
      hints: ['A comprehension inside `tuple(...)`.'],
      solution: 'def scale(v, s):\n    return tuple(c * s for c in v)\n'
    },
    {
      id: 'e3',
      title: 'Midpoint',
      prompt: 'Write `midpoint(a, b)`: the point right between two positions. Use it to place a camera target between two characters.\n\nHint: it is `a + (b - a) * 0.5`.',
      setup: SETUP,
      starter: 'def midpoint(a, b):\n    pass\n',
      tests: [
        { check: '_close(midpoint((0, 0, 0), (4, 2, 0)), (2, 1, 0))', msg: 'between (0,0,0) and (4,2,0) is (2, 1, 0)' },
        { check: '_close(midpoint((-2, 1, 3), (2, 1, -3)), (0, 1, 0))', msg: 'works with negatives' }
      ],
      hints: ['`(a + b) / 2` per component also works.', '`tuple((x + y) / 2 for x, y in zip(a, b))`'],
      solution: 'def midpoint(a, b):\n    return tuple((x + y) / 2 for x, y in zip(a, b))\n',
      explain: 'This is linear interpolation with t = 0.5 (lesson v09).'
    }
  ],

  summary: [
    'A vector is an arrow (direction + length); a point is a place.',
    'Add, subtract and scale component by component.',
    'From A to B: `B - A` (target minus origin).'
  ]
});
})();
