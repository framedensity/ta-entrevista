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
  id: 'v10',
  title: 'Spherical interpolation',

  explain: [
    'If you interpolate **directions** or **orientations** with a plain lerp, the result “shrinks” along the way and the speed is not constant. **Slerp** (spherical linear interpolation) follows the arc at constant angular speed.',
    { type: 'analogy', text: 'picture a clock hand going from 12 to 3. A lerp would cut straight across the inside of the circle (the hand gets shorter). Slerp moves the tip along the edge, like a real clock hand.' },
    { type: 'viz', name: 'slerp' },
    '### Three options',
    '- **lerp**: fast, but the length drops in the middle (at 90°, the halfway point has length 0.71).\n- **nlerp** (normalized lerp): lerp then normalize. Correct length and very fast, but the speed is not quite constant.\n- **slerp**: follows the arc at constant speed. A little more expensive.',
    '### The slerp formula',
    'With θ = the angle between `a` and `b` (unit vectors):\n\n`slerp(a, b, t) = a·sin((1−t)θ)/sin θ + b·sin(tθ)/sin θ`',
    { type: 'warn', text: 'if `a` and `b` are almost the same, `sin θ` is almost 0 and you divide by zero. In that case use lerp (or nlerp), which is practically identical.' },
    '### With quaternions',
    'The same slerp works for quaternions. But first check the **shortest path**: if `dot(q1, q2) < 0`, flip the sign of `q2` (remember: `q` and `−q` are the same rotation). Otherwise the interpolation goes the long way around.',
    { type: 'cg', text: 'when blending two poses or two animation clips, the engine slerps (or nlerps) the quaternion of every joint. A turn that “goes the long way around” in a blend is usually this shortest-path problem.' },
    { type: 'tip', text: 'in the interview: “for orientations I use quaternion slerp, checking the shortest path first; if they are very close, I use nlerp to avoid dividing by zero”.' }
  ],

  example: {
    intro: 'Comparing lerp and slerp halfway between X and Y.',
    lines: [
      { code: 'import math', note: 'For sine, cosine and square root.' },
      { code: 'a, b, t = (1, 0, 0), (0, 1, 0), 0.5', note: 'Two unit directions 90° apart.' },
      { code: 'l = tuple(x + (y - x) * t for x, y in zip(a, b))', note: 'Lerp: (0.5, 0.5, 0).' },
      { code: 'print(round(math.sqrt(sum(c * c for c in l)), 3))', note: 'Length of the lerp: it has shrunk.' },
      { code: 'theta = math.acos(sum(x * y for x, y in zip(a, b)))\nwa = math.sin((1 - t) * theta) / math.sin(theta)\nwb = math.sin(t * theta) / math.sin(theta)', note: 'Slerp weights.' },
      { code: 's = tuple(wa * x + wb * y for x, y in zip(a, b))\nprint(round(math.sqrt(sum(c * c for c in s)), 3))', note: 'Slerp keeps length 1.' }
    ],
    output: '0.707\n1.0'
  },

  mini: [
    {
      q: 'You lerp between two unit directions 90° apart. How long is the result at `t = 0.5`?',
      options: ['1', 'About 0.71', '0'],
      answer: 1,
      why: 'Lerp cuts across the inside of the arc: `(0.5, 0.5)` has length √0.5 ≈ 0.71.'
    },
    {
      q: 'When slerping quaternions, `dot(q1, q2)` is negative. What do you do?',
      options: ['Nothing', 'Flip the sign of q2 to take the shortest path', 'Switch to Euler'],
      answer: 1,
      why: 'q2 and −q2 are the same rotation; with the sign flipped, the interpolation takes the short way.'
    }
  ],
  extra: [
    {
      q: 'Why is nlerp sometimes used instead of slerp?',
      options: ['Because it is more accurate', 'Because it is cheaper and nearly identical for small angles', 'Because it does not need normalizing'],
      answer: 1,
      why: 'In blends with many joints per frame, the difference is barely visible and the savings are real.'
    }
  ],

  exercises: [
    {
      id: 'e1',
      title: 'nlerp',
      prompt: 'Write `nlerp(a, b, t)`: lerp between two vectors, then normalize the result.',
      setup: SETUP,
      starter: 'import math\n\ndef nlerp(a, b, t):\n    pass\n',
      tests: [
        { check: '_close(nlerp((1, 0, 0), (0, 1, 0), 0.5), (math.sqrt(0.5), math.sqrt(0.5), 0))', msg: 'halfway between X and Y: (0.707, 0.707, 0)' },
        { check: '_close(nlerp((1, 0, 0), (0, 1, 0), 0.25), (0.75 / math.sqrt(0.625), 0.25 / math.sqrt(0.625), 0))', msg: 'with t = 0.25 the result has length 1' },
        { check: '_close(nlerp((0, 0, 1), (0, 1, 0), 0), (0, 0, 1))', msg: 'with t = 0 it gives a' }
      ],
      hints: ['Lerp per component: `l = [x + (y - x) * t for x, y in zip(a, b)]`.', 'Then divide each component by the length of `l`.'],
      solution: 'import math\n\ndef nlerp(a, b, t):\n    l = [x + (y - x) * t for x, y in zip(a, b)]\n    n = math.sqrt(sum(c * c for c in l))\n    return tuple(c / n for c in l)\n'
    },
    {
      id: 'e2',
      title: 'slerp',
      prompt: 'Write `slerp(a, b, t)` for two **unit** vectors.\n\n1. `cos θ = a·b`, clamped to [-1, 1].\n2. If `sin θ` is very small (less than 1e-6), return the lerp.\n3. Otherwise use the weights `sin((1−t)θ)/sin θ` and `sin(tθ)/sin θ`.',
      setup: SETUP,
      starter: 'import math\n\ndef slerp(a, b, t):\n    pass\n',
      tests: [
        { check: '_close(slerp((1, 0, 0), (0, 1, 0), 0.5), (math.sqrt(0.5), math.sqrt(0.5), 0))', msg: 'halfway between X and Y' },
        { check: '_close(slerp((1, 0, 0), (0, 1, 0), 1 / 3), (math.cos(math.pi / 6), 0.5, 0))', msg: 'with t = 1/3 it turns exactly 30° (constant speed)' },
        { check: '_close(slerp((0, 0, 1), (0, 0, 1), 0.5), (0, 0, 1))', msg: 'with a = b it does not divide by zero' }
      ],
      hints: ['`c = max(-1.0, min(1.0, sum(x*y for x, y in zip(a, b))))`; `theta = math.acos(c)`.', '`s = math.sin(theta)`; if `s < 1e-6`, return the lerp.', '`wa = math.sin((1 - t) * theta) / s`, `wb = math.sin(t * theta) / s`.'],
      solution: 'import math\n\ndef slerp(a, b, t):\n    c = max(-1.0, min(1.0, sum(x * y for x, y in zip(a, b))))\n    theta = math.acos(c)\n    s = math.sin(theta)\n    if s < 1e-6:\n        return tuple(x + (y - x) * t for x, y in zip(a, b))\n    wa = math.sin((1 - t) * theta) / s\n    wb = math.sin(t * theta) / s\n    return tuple(wa * x + wb * y for x, y in zip(a, b))\n'
    },
    {
      id: 'e3',
      title: 'The shortest path',
      prompt: 'Write `shortest_path(q1, q2)`. If the dot product of the two quaternions (all 4 components) is negative, return `q2` with every component negated. Otherwise return `q2` as is (as a tuple).',
      setup: SETUP,
      starter: 'def shortest_path(q1, q2):\n    pass\n',
      tests: [
        { check: '_close(shortest_path((1, 0, 0, 0), (-1, 0, 0, 0)), (1, 0, 0, 0))', msg: 'negative dot: flip the sign of q2' },
        { check: '_close(shortest_path((1, 0, 0, 0), (0.6, 0.8, 0, 0)), (0.6, 0.8, 0, 0))', msg: 'positive dot: q2 unchanged' },
        { check: '_close(shortest_path((0.6, 0.8, 0, 0), (-0.5, -0.5, 0.5, 0.5)), (0.5, 0.5, -0.5, -0.5))', msg: 'works with general quaternions' }
      ],
      hints: ['`d = sum(x * y for x, y in zip(q1, q2))`', '`if d < 0: return tuple(-c for c in q2)`'],
      solution: 'def shortest_path(q1, q2):\n    d = sum(x * y for x, y in zip(q1, q2))\n    if d < 0:\n        return tuple(-c for c in q2)\n    return tuple(q2)\n',
      explain: 'This small step avoids the classic “turning the long way around” in animation blends.'
    }
  ],

  summary: [
    'A lerp of directions shrinks; nlerp normalizes it; slerp follows the arc at constant speed.',
    'slerp: weights sin((1−t)θ)/sin θ and sin(tθ)/sin θ; if θ ≈ 0, use lerp.',
    'With quaternions, if dot < 0, flip the sign of one: shortest path.'
  ]
});
})();
