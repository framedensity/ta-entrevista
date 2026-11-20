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
  id: 'v05',
  title: 'Matrices',

  explain: [
    'A **matrix** is a table of numbers that **transforms** vectors: it rotates, scales or moves them. Every Maya transform node stores one.',
    { type: 'analogy', text: 'a matrix is like a recipe: you give it an ingredient (a vector) and it gives you back the dish (the transformed vector). Same recipe, any ingredient.' },
    { type: 'viz', name: 'matrix' },
    '### Matrix times vector',
    'Each component of the result is the **dot product** of one row of the matrix with the vector.',
    '```\n| a b |   | x |   | a·x + b·y |\n| c d | × | y | = | c·x + d·y |\n```',
    '### Rotation in 2D (and around Z in 3D)',
    '```\n| cos θ  −sin θ |\n| sin θ   cos θ |\n```\nWith θ = 90°, the vector `(1, 0)` becomes `(0, 1)`.',
    '### Combining transformations',
    'Multiplying two matrices = doing one transformation and then the other. **Order matters**: rotating then moving is not the same as moving then rotating.',
    { type: 'warn', text: 'Maya uses **row vectors** (`v × M`): matrices read in the opposite order to many textbooks, which use column vectors (`M × v`). Here we use columns. In the interview it is enough to say that order matters and that you have to know which convention each system uses.' },
    '### 4×4 matrices',
    'In 3D we use 4×4 matrices: the 3×3 part holds rotation and scale, and the last row (in Maya) holds the **translation**. That way a single matrix can rotate, scale and move at once.',
    { type: 'cg', text: '`cmds.xform(obj, q=True, ws=True, matrix=True)` returns 16 numbers: the 4×4 matrix in world space. With OpenMaya, `MMatrix` lets you multiply and invert them.' }
  ],

  example: {
    intro: 'Rotating a vector 90° with a matrix.',
    lines: [
      { code: 'import math', note: 'For sine and cosine.' },
      { code: 'def mul_mat_vec(m, v):\n    return tuple(sum(a * b for a, b in zip(row, v)) for row in m)', note: 'Each row, dot product with the vector.' },
      { code: 't = math.radians(90)\nrot = [[math.cos(t), -math.sin(t)],\n       [math.sin(t),  math.cos(t)]]', note: '2D rotation matrix. Trig functions use radians.' },
      { code: 'r = mul_mat_vec(rot, (1, 0))', note: 'Rotate the X axis.' },
      { code: 'print(tuple(round(c, 6) for c in r))', note: 'Rounded to hide the floating-point error (6e-17).' }
    ],
    output: '(0.0, 1.0)'
  },

  mini: [
    {
      q: 'What is each component of `M × v`?',
      options: ['The sum of a column', 'The dot product of one row of M with v', 'The cross product of M and v'],
      answer: 1,
      why: 'Row times vector, component by component, then add.'
    },
    {
      q: 'Does rotating 90° and then moving 5 in X give the same as moving 5 in X and then rotating 90°?',
      options: ['Yes, always', 'No: the order of transformations matters', 'Only in 3D'],
      answer: 1,
      why: 'Matrix multiplication is not commutative: A × B ≠ B × A.'
    }
  ],
  extra: [
    {
      q: 'What is the fourth row/column of a 4×4 matrix used for in Maya?',
      options: ['Color', 'Translation (position)', 'Nothing'],
      answer: 1,
      why: 'With 4×4, a single matrix combines rotation, scale and translation.'
    }
  ],

  exercises: [
    {
      id: 'e1',
      title: 'Matrix times vector',
      prompt: 'Write `mul_mat_vec(m, v)`. `m` is a list of rows (any size). Return a tuple.',
      setup: SETUP,
      starter: 'def mul_mat_vec(m, v):\n    pass\n',
      tests: [
        { check: 'mul_mat_vec([[1, 0, 0], [0, 2, 0], [0, 0, 3]], (1, 1, 1)) == (1, 2, 3)', msg: 'a scale matrix (1, 2, 3)' },
        { check: 'mul_mat_vec([[0, -1], [1, 0]], (1, 0)) == (0, 1)', msg: '90° rotation in 2D' },
        { check: 'mul_mat_vec([[1, 0], [0, 1]], (7, -2)) == (7, -2)', msg: 'the identity changes nothing' }
      ],
      hints: ['For each row: `sum(a * b for a, b in zip(row, v))`.', 'Wrap it in `tuple(... for row in m)`.'],
      solution: 'def mul_mat_vec(m, v):\n    return tuple(sum(a * b for a, b in zip(row, v)) for row in m)\n'
    },
    {
      id: 'e2',
      title: 'Rotate around Z',
      prompt: 'Write `rotate_z(v, degrees)`: rotate a 3D vector around the Z axis.\n\nThe matrix is:\n```\n| cos  −sin  0 |\n| sin   cos  0 |\n|  0     0   1 |\n```\nRemember to convert degrees to radians.',
      setup: SETUP,
      starter: 'import math\n\ndef rotate_z(v, degrees):\n    pass\n',
      tests: [
        { check: '_close(rotate_z((1, 0, 0), 90), (0, 1, 0))', msg: 'X rotated 90° is Y' },
        { check: '_close(rotate_z((1, 0, 5), 180), (-1, 0, 5))', msg: '180°: X becomes −X; Z does not change' },
        { check: '_close(rotate_z((0, 2, 0), -90), (2, 0, 0))', msg: 'negative angles turn the other way' }
      ],
      hints: ['`t = math.radians(degrees)`; `c, s = math.cos(t), math.sin(t)`.', '`m = [[c, -s, 0], [s, c, 0], [0, 0, 1]]` and multiply by `v`.'],
      solution: 'import math\n\ndef rotate_z(v, degrees):\n    t = math.radians(degrees)\n    c, s = math.cos(t), math.sin(t)\n    m = [[c, -s, 0], [s, c, 0], [0, 0, 1]]\n    return tuple(sum(a * b for a, b in zip(row, v)) for row in m)\n'
    },
    {
      id: 'e3',
      title: 'Matrix times matrix',
      prompt: 'Write `mul_mat(a, b)` for two square matrices of the same size. Return a list of rows.\n\nElement `[i][j]` of the result is the dot product of **row i** of `a` with **column j** of `b`.',
      setup: SETUP,
      starter: 'def mul_mat(a, b):\n    pass\n',
      tests: [
        { check: 'mul_mat([[1, 2], [3, 4]], [[5, 6], [7, 8]]) == [[19, 22], [43, 50]]', msg: '[[1,2],[3,4]] × [[5,6],[7,8]] = [[19,22],[43,50]]' },
        { check: 'mul_mat([[1, 0], [0, 1]], [[2, 3], [4, 5]]) == [[2, 3], [4, 5]]', msg: 'identity × M = M' },
        { check: 'mul_mat([[0, 1], [1, 0]], [[1, 2], [3, 4]]) != mul_mat([[1, 2], [3, 4]], [[0, 1], [1, 0]])', msg: 'A × B ≠ B × A (order matters)' }
      ],
      hints: ['Columns of b: `cols = list(zip(*b))`.', '`[[sum(x * y for x, y in zip(row, col)) for col in cols] for row in a]`'],
      solution: 'def mul_mat(a, b):\n    cols = list(zip(*b))\n    return [[sum(x * y for x, y in zip(row, col)) for col in cols] for row in a]\n',
      explain: '`zip(*b)` “transposes” the matrix: it turns columns into rows. A very handy Python trick.'
    }
  ],

  summary: [
    'A matrix transforms vectors; each component is row · vector.',
    'Multiplying matrices = chaining transformations, and order matters.',
    'Maya uses 4×4 with row vectors: translation sits in the last row.'
  ]
});
})();
