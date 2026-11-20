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
var CROSS = 'def cross(a, b):\n    return (a[1] * b[2] - a[2] * b[1],\n            a[2] * b[0] - a[0] * b[2],\n            a[0] * b[1] - a[1] * b[0])\n';

TA.add({
  id: 'v04',
  title: 'Cross product',

  explain: [
    'The **cross product** of two 3D vectors gives **another vector**, perpendicular to both.',
    { type: 'analogy', text: 'lay two pencils on a table at an angle. The cross product is a third pencil sticking straight up (or down), perpendicular to the table.' },
    { type: 'viz', name: 'cross' },
    '### The formula',
    '```\na × b = (ay·bz − az·by,\n         az·bx − ax·bz,\n         ax·by − ay·bx)\n```',
    '### Three properties',
    '- **Perpendicular** to `a` and to `b`.\n- **Order matters**: `b × a = −(a × b)`. Swapping the order flips the result.\n- **Length** = area of the parallelogram they form. If they are parallel, it is `(0, 0, 0)`.',
    '### Right-hand rule',
    'Maya uses a **right-handed** system: `X × Y = Z`. Point your fingers along `a`, curl them toward `b`, and your thumb shows `a × b`.',
    { type: 'cg', text: 'a triangle\'s **normal** is the cross product of two of its edges. It also builds the axes of a camera or a joint: from “forward” and “up”, the cross product gives you “right”.' },
    { type: 'tip', text: 'quick difference for the interview: the **dot** product gives a number (how alike are they?), the **cross** product gives a perpendicular vector (which axis is perpendicular to both?).' }
  ],

  example: {
    intro: 'The normal of a triangle lying on the ground.',
    lines: [
      { code: CROSS.replace(/\n$/, ''), note: 'The formula, component by component.' },
      { code: 'p0, p1, p2 = (0, 0, 0), (0, 0, 1), (1, 0, 0)', note: 'Three vertices on the ground plane (y = 0).' },
      { code: 'edge1 = tuple(b - a for a, b in zip(p0, p1))\nedge2 = tuple(b - a for a, b in zip(p0, p2))', note: 'Two edges leaving the same vertex.' },
      { code: 'print(cross(edge1, edge2))', note: 'The normal points up (+Y).' }
    ],
    output: '(0, 1, 0)'
  },

  mini: [
    {
      q: 'What does the cross product return?',
      options: ['A number', 'A vector perpendicular to both', 'The angle between them'],
      answer: 1,
      why: 'The dot product gives a number; the cross product, a perpendicular vector.'
    },
    {
      q: 'If `a × b = (0, 0, 1)`, what is `b × a`?',
      options: ['`(0, 0, 1)`', '`(0, 0, -1)`', '`(0, 0, 0)`'],
      answer: 1,
      why: 'Swapping the order flips the result.'
    }
  ],
  extra: [
    {
      q: 'What is the cross product of two parallel vectors?',
      options: ['A unit vector', 'The zero vector', 'One of the two vectors'],
      answer: 1,
      why: 'They form no parallelogram: the area (the length) is 0.'
    }
  ],

  exercises: [
    {
      id: 'e1',
      title: 'Cross product',
      prompt: 'Write `cross(a, b)` for 3D vectors. Return a tuple.',
      setup: SETUP,
      starter: 'def cross(a, b):\n    pass\n',
      tests: [
        { check: 'cross((1, 0, 0), (0, 1, 0)) == (0, 0, 1)', msg: 'X × Y = Z' },
        { check: 'cross((0, 1, 0), (1, 0, 0)) == (0, 0, -1)', msg: 'Y × X = −Z' },
        { check: 'cross((2, 3, 4), (5, 6, 7)) == (-3, 6, -3)', msg: '(2,3,4) × (5,6,7) = (-3, 6, -3)' }
      ],
      hints: ['First component: `a[1]*b[2] - a[2]*b[1]`.', 'Second: `a[2]*b[0] - a[0]*b[2]`. Third: `a[0]*b[1] - a[1]*b[0]`.'],
      solution: CROSS
    },
    {
      id: 'e2',
      title: 'Triangle normal',
      prompt: 'Write `normal(p0, p1, p2)`: the **unit** normal of the triangle, computed as `(p1 − p0) × (p2 − p0)`, normalized.\n\n`cross` is already written.',
      setup: SETUP,
      starter: 'import math\n\n' + CROSS + '\ndef normal(p0, p1, p2):\n    pass\n',
      tests: [
        { check: '_close(normal((0, 0, 0), (1, 0, 0), (0, 1, 0)), (0, 0, 1))', msg: 'triangle on the XY plane: normal (0, 0, 1)' },
        { check: '_close(normal((0, 0, 0), (2, 0, 0), (0, 0, 2)), (0, -1, 0))', msg: 'the result is normalized (length 1)' },
        { check: '_close(normal((1, 1, 1), (2, 1, 1), (1, 2, 1)), (0, 0, 1))', msg: 'works away from the origin' }
      ],
      hints: ['`e1 = [b - a for a, b in zip(p0, p1)]`, same for `e2` with `p2`.', '`n = cross(e1, e2)`, then divide by its length.'],
      solution: 'import math\n\n' + CROSS + '\ndef normal(p0, p1, p2):\n    e1 = [b - a for a, b in zip(p0, p1)]\n    e2 = [b - a for a, b in zip(p0, p2)]\n    n = cross(e1, e2)\n    l = math.sqrt(sum(c * c for c in n))\n    return tuple(c / l for c in n)\n'
    },
    {
      id: 'e3',
      title: 'Triangle area',
      prompt: 'Write `area(p0, p1, p2)`. The length of the cross product of two edges is the area of the **parallelogram**; the triangle is half of it.\n\nHandy for finding degenerate triangles (area close to 0) in a mesh checker.',
      setup: SETUP,
      starter: 'import math\n\n' + CROSS + '\ndef area(p0, p1, p2):\n    pass\n',
      tests: [
        { check: '_close(area((0, 0, 0), (4, 0, 0), (0, 3, 0)), 6)', msg: '4×3 right triangle: area 6' },
        { check: '_close(area((0, 0, 0), (1, 1, 1), (2, 2, 2)), 0)', msg: 'three points on a line: area 0 (degenerate)' }
      ],
      hints: ['Same as the normal, but without normalizing.', '`return math.sqrt(sum(c*c for c in n)) / 2`'],
      solution: 'import math\n\n' + CROSS + '\ndef area(p0, p1, p2):\n    e1 = [b - a for a, b in zip(p0, p1)]\n    e2 = [b - a for a, b in zip(p0, p2)]\n    n = cross(e1, e2)\n    return math.sqrt(sum(c * c for c in n)) / 2\n'
    }
  ],

  summary: [
    'a × b gives a vector perpendicular to both (3D only).',
    'Order matters: b × a = −(a × b); right hand: X × Y = Z.',
    'Use it for normals, areas and building axes (right from forward and up).'
  ]
});
})();
