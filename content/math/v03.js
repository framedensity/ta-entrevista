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
  id: 'v03',
  title: 'Dot product',

  explain: [
    'The **dot product** of two vectors gives **a single number**. That number tells you how much they point the same way.',
    { type: 'analogy', text: 'it is like measuring how much the wind helps you: blowing your way, it helps a lot (positive); from the side, not at all (zero); head-on, it slows you down (negative).' },
    '### The formula',
    '`a · b = ax·bx + ay·by + az·bz`. Multiply component by component and add.',
    'It also equals `|a| · |b| · cos(θ)`, where θ is the angle between them. With **normalized** vectors, the dot product is directly the **cosine of the angle**.',
    { type: 'viz', name: 'dot' },
    '### Reading the result',
    '- **Positive**: less than 90° apart (roughly the same direction).\n- **Zero**: perpendicular (90°).\n- **Negative**: more than 90° apart (opposite directions).\n- With unit vectors: **1** = same direction, **-1** = opposite.',
    { type: 'cg', text: 'is the enemy in front of or behind the player? `dot(enemy - player, facing)`. If it is positive, it is in front. Lots of vision cones and «can the camera see the character» checks work this way.' },
    { type: 'tip', text: 'classic interview question: «how do you know if an object is in front of the camera?». Answer: the dot product of the camera direction and the vector to the object; if it is positive, it is in front.' }
  ],

  example: {
    intro: 'Is the enemy in front of the player?',
    lines: [
      { code: 'def dot(a, b):\n    return sum(x * y for x, y in zip(a, b))', note: 'Dot product: multiply and add.' },
      { code: 'player = (0, 0, 0)\nfacing = (0, 0, 1)', note: 'The player looks toward +Z.' },
      { code: 'enemy = (2, 0, 5)', note: 'An enemy ahead and a little to the side.' },
      { code: 'to_enemy = tuple(e - p for e, p in zip(enemy, player))', note: 'Vector from the player to the enemy: (2, 0, 5).' },
      { code: 'print(dot(to_enemy, facing) > 0)', note: '`2·0 + 0·0 + 5·1 = 5`, positive: it is in front.' }
    ],
    output: 'True'
  },

  mini: [
    {
      q: 'What is `(1, 0, 0) · (0, 1, 0)`?',
      options: ['1', '0', '-1'],
      answer: 1,
      why: 'They are perpendicular: `1·0 + 0·1 + 0·0 = 0`.'
    },
    {
      q: 'Two **unit** vectors have a dot product of `-1`. What does that mean?',
      options: ['They are perpendicular', 'They point in opposite directions', 'One of them is zero'],
      answer: 1,
      why: 'With unit vectors, the dot product is the cosine of the angle. cos(180°) = -1.'
    }
  ],
  extra: [
    {
      q: 'What does the dot product return?',
      options: ['A vector', 'A number', 'A matrix'],
      answer: 1,
      why: 'That is why it is also called the **scalar** product: the result is a single number.'
    },
    {
      q: 'To get the angle between two vectors with the dot product, what do you need to do first?',
      options: ['Nothing', 'Normalize them (or divide by their lengths)', 'Add them'],
      answer: 1,
      why: '`cos θ = a·b / (|a|·|b|)`. If they are already unit vectors, `cos θ = a·b`.'
    }
  ],

  exercises: [
    {
      id: 'e1',
      title: 'Dot product',
      prompt: 'Write `dot(a, b)` for vectors of any size.',
      setup: SETUP,
      starter: 'def dot(a, b):\n    pass\n',
      tests: [
        { check: 'dot((1, 2, 3), (4, 5, 6)) == 32', msg: '(1,2,3)·(4,5,6) = 32' },
        { check: 'dot((1, 0, 0), (0, 1, 0)) == 0', msg: 'perpendicular gives 0' },
        { check: 'dot((1, 0), (-1, 0)) == -1', msg: 'works in 2D: opposite gives -1' }
      ],
      hints: ['`sum(x * y for x, y in zip(a, b))`'],
      solution: 'def dot(a, b):\n    return sum(x * y for x, y in zip(a, b))\n'
    },
    {
      id: 'e2',
      title: 'In front or behind?',
      prompt: 'Write `in_front(obj, viewer, facing)`. Return `True` if `obj` is in front of the viewer (dot product greater than 0).\n\n`obj` and `viewer` are positions; `facing` is the direction the viewer looks.',
      setup: SETUP,
      starter: 'def in_front(obj, viewer, facing):\n    pass\n',
      tests: [
        { check: 'in_front((2, 0, 5), (0, 0, 0), (0, 0, 1)) is True', msg: '(2,0,5) is in front of someone looking toward +Z' },
        { check: 'in_front((0, 0, -3), (0, 0, 0), (0, 0, 1)) is False', msg: '(0,0,-3) is behind' },
        { check: 'in_front((10, 0, 0), (8, 0, 0), (-1, 0, 0)) is False', msg: 'works when the viewer is not at the origin' }
      ],
      hints: ['First the vector to the object: `obj - viewer`.', 'Then `sum(t * f for t, f in zip(to_obj, facing)) > 0`.'],
      solution: 'def in_front(obj, viewer, facing):\n    to_obj = [o - v for o, v in zip(obj, viewer)]\n    return sum(t * f for t, f in zip(to_obj, facing)) > 0\n'
    },
    {
      id: 'e3',
      title: 'Angle between vectors',
      prompt: 'Write `angle(a, b)`: the angle in **degrees** between two vectors (not necessarily unit vectors).\n\nUse `cos θ = a·b / (|a|·|b|)`. Careful: because of rounding the cosine can come out as 1.0000001; clamp it to [-1, 1] before `math.acos`.',
      setup: SETUP,
      starter: 'import math\n\ndef angle(a, b):\n    pass\n',
      tests: [
        { check: '_close(angle((1, 0, 0), (0, 1, 0)), 90)', msg: 'X and Y are 90° apart' },
        { check: '_close(angle((1, 0, 0), (1, 1, 0)), 45)', msg: '(1,0,0) and (1,1,0) are 45° apart' },
        { check: '_close(angle((2, 0, 0), (5, 0, 0)), 0)', msg: 'same direction: 0° (no domain error)' },
        { check: '_close(angle((0, 0, 1), (0, 0, -3)), 180)', msg: 'opposite: 180°' }
      ],
      hints: ['`la = math.sqrt(sum(c*c for c in a))`, same for b.', '`c = max(-1.0, min(1.0, d / (la * lb)))`', '`return math.degrees(math.acos(c))`'],
      solution: 'import math\n\ndef angle(a, b):\n    d = sum(x * y for x, y in zip(a, b))\n    la = math.sqrt(sum(c * c for c in a))\n    lb = math.sqrt(sum(c * c for c in b))\n    c = max(-1.0, min(1.0, d / (la * lb)))\n    return math.degrees(math.acos(c))\n',
      explain: 'Clamping the cosine to [-1, 1] avoids a `ValueError: math domain error` that shows up in production with nearly parallel vectors.'
    }
  ],

  summary: [
    'a · b = sum of products; it gives a number.',
    'Positive = same direction, 0 = perpendicular, negative = opposite.',
    'With unit vectors it is the cosine of the angle: use it for «in front / behind» and vision cones.'
  ]
});
})();
