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
  id: 'v02',
  title: 'Length and normalization',

  explain: [
    'The **length** (magnitude) of a vector is how long the arrow is. To **normalize** a vector is to keep its direction but make its length exactly **1**.',
    { type: 'analogy', text: 'normalizing is like keeping only the compass reading: «north-east», no matter if it is 2 meters or 2 kilometers.' },
    '### Length: Pythagoras',
    'In 2D, the vector `(3, 4)` is `√(3² + 4²) = √25 = 5` long. In 3D you add z: `√(x² + y² + z²)`.',
    { type: 'viz', name: 'normalize' },
    '### Normalizing',
    'Divide every component by the length: `(3, 4) / 5 = (0.6, 0.8)`. A vector of length 1 is called a **unit vector**.',
    { type: 'warn', text: 'the vector `(0, 0, 0)` has no direction: normalizing it divides by zero. A good function checks this and complains (or returns zero, whatever the team agrees on).' },
    '### Distance',
    'The distance between two points is the length of their difference: `length(b - a)`.',
    { type: 'tip', text: 'performance trick: to **compare** distances you do not need the square root. If `d² < radius²`, then `d < radius`. With thousands of objects it shows, and it is a great thing to mention in an interview.' },
    { type: 'cg', text: 'to move something toward a target at constant speed, normalize the direction and multiply by the speed. Without normalizing, far-away objects would move faster.' }
  ],

  example: {
    intro: 'Length, normalization and distance.',
    lines: [
      { code: 'import math', note: 'For `math.sqrt` (square root).' },
      { code: 'def length(v):\n    return math.sqrt(sum(c * c for c in v))', note: 'Pythagoras for any number of dimensions.' },
      { code: 'def normalize(v):\n    l = length(v)\n    if l == 0:\n        raise ValueError("Cannot normalize a zero vector")\n    return tuple(c / l for c in v)', note: 'Check for zero before dividing.' },
      { code: 'print(length((3, 4, 0)), normalize((3, 4, 0)))', note: 'Length 5; direction (0.6, 0.8, 0).' }
    ],
    output: '5.0 (0.6, 0.8, 0.0)'
  },

  mini: [
    {
      q: 'What is the length of `(0, 3, 4)`?',
      options: ['7', '5', '25'],
      answer: 1,
      why: '`√(0 + 9 + 16) = √25 = 5`.'
    },
    {
      q: 'You have 5,000 enemies and want the ones closer than 10 units. What is most efficient?',
      options: ['Take the square root of every distance and compare with 10', 'Compare the **squared** distance with 100', 'Normalize every position'],
      answer: 1,
      why: 'If `d² < 100` then `d < 10`. You skip 5,000 square roots.'
    }
  ],
  extra: [
    {
      q: 'How long is a normalized vector?',
      options: ['0', '1', 'Depends on the vector'],
      answer: 1,
      why: 'Normalizing means making it length 1 (a unit vector).'
    }
  ],

  exercises: [
    {
      id: 'e1',
      title: 'Length and distance',
      prompt: 'Write `length(v)` and `distance(a, b)` for 3D vectors.',
      setup: SETUP,
      starter: 'import math\n\ndef length(v):\n    pass\n\ndef distance(a, b):\n    pass\n',
      tests: [
        { check: '_close(length((3, 4, 0)), 5)', msg: 'length((3,4,0)) is 5' },
        { check: '_close(length((1, 2, 2)), 3)', msg: 'length((1,2,2)) is 3' },
        { check: '_close(distance((1, 1, 1), (4, 5, 1)), 5)', msg: 'distance((1,1,1), (4,5,1)) is 5' }
      ],
      hints: ['`math.sqrt(x*x + y*y + z*z)`', 'distance = length of the difference: `length(tuple(q - p for p, q in zip(a, b)))`.'],
      solution: 'import math\n\ndef length(v):\n    return math.sqrt(sum(c * c for c in v))\n\ndef distance(a, b):\n    return length(tuple(q - p for p, q in zip(a, b)))\n'
    },
    {
      id: 'e2',
      title: 'Normalize safely',
      prompt: 'Write `normalize(v)`. If the length is 0, raise `ValueError`.',
      setup: SETUP + 'def _raises(fn, exc):\n    try:\n        fn()\n    except exc:\n        return True\n    except Exception:\n        return False\n    return False\n',
      starter: 'import math\n\ndef normalize(v):\n    pass\n',
      tests: [
        { check: '_close(normalize((3, 4, 0)), (0.6, 0.8, 0))', msg: 'normalize((3,4,0)) gives (0.6, 0.8, 0)' },
        { check: '_close(normalize((0, 0, -7)), (0, 0, -1))', msg: 'normalize((0,0,-7)) gives (0, 0, -1)' },
        { check: '_raises(lambda: normalize((0, 0, 0)), ValueError)', msg: '(0,0,0) raises ValueError' }
      ],
      hints: ['Compute the length `l` first.', '`if l == 0: raise ValueError("zero vector")`', '`return tuple(c / l for c in v)`'],
      solution: 'import math\n\ndef normalize(v):\n    l = math.sqrt(sum(c * c for c in v))\n    if l == 0:\n        raise ValueError("Cannot normalize a zero vector")\n    return tuple(c / l for c in v)\n'
    },
    {
      id: 'e3',
      title: 'Who is nearby (no square roots)',
      prompt: 'Write `nearby(center, objects, radius)`. `objects` is a dict `{name: position}`. Return a **sorted list** of the names at a distance **less than or equal to** `radius`.\n\nDo not use `math.sqrt`: compare squared distances.',
      setup: SETUP,
      starter: 'def nearby(center, objects, radius):\n    pass\n',
      tests: [
        { check: "nearby((0, 0, 0), {'a': (1, 0, 0), 'b': (6, 0, 0), 'c': (0, 3, 4)}, 5) == ['a', 'c']", msg: 'a (distance 1) and c (distance 5, right on the edge) are inside; b (6) is not' },
        { check: "nearby((10, 0, 0), {'x': (0, 0, 0)}, 3) == []", msg: 'if nobody is close, empty list' },
        { check: "'sqrt' not in _code", msg: 'does not use sqrt' }
      ],
      hints: ['`r2 = radius * radius`', 'For each object: `d2 = sum((p - c) ** 2 for p, c in zip(pos, center))`.', '`sorted(n for n, pos in objects.items() if d2(pos) <= r2)`'],
      solution: 'def nearby(center, objects, radius):\n    r2 = radius * radius\n    def d2(pos):\n        return sum((p - c) ** 2 for p, c in zip(pos, center))\n    return sorted(n for n, pos in objects.items() if d2(pos) <= r2)\n',
      explain: 'With thousands of objects, dropping the square root is a real optimization used in games and tools.'
    }
  ],

  summary: [
    'Length = √(x² + y² + z²); distance = length of the difference.',
    'Normalize = divide by the length (result has length 1); watch out for the zero vector.',
    'To compare distances, use squares and skip the root.'
  ]
});
})();
