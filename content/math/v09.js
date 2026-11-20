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
  id: 'v09',
  title: 'Linear interpolation',

  explain: [
    'To **interpolate** is to compute the values in between two values. **Linear interpolation** (lerp) goes in a straight line at constant speed.',
    { type: 'analogy', text: 'it is like a progress bar: at `t = 0` you are at the start, at `t = 1` at the end, and at `t = 0.5` right in the middle.' },
    '### The formula',
    '`lerp(a, b, t) = a + (b − a) · t`',
    'It works the same with numbers, 3D positions and colors: apply it to each component.',
    { type: 'viz', name: 'lerp' },
    '### Inverse lerp and remapping',
    '- **Inverse lerp**: given a value `x` between `a` and `b`, which `t` does it match? `t = (x − a) / (b − a)`.\n- **Remap**: move a value from one range to another. It is an inverse lerp followed by a lerp.',
    '### Smoothing: ease in / ease out',
    'A plain lerp starts and stops abruptly. To make it speed up and slow down, you «bend» `t` before using it. The most common function is **smoothstep**: `3t² − 2t³`.',
    { type: 'cg', text: '*linear* tangents in the Graph Editor are a lerp between keys. *Auto* or *spline* tangents smooth the start and end, like a smoothstep. And remapping is handy, for example, to turn the camera distance (2 to 20 meters) into a depth-of-field aperture.' },
    { type: 'tip', text: '`t` does not have to be time: it is «how much of the way». With `t` outside [0, 1] the lerp **extrapolates** (overshoots). Often you want to clamp it.' }
  ],

  example: {
    intro: 'Lerp of a 3D position.',
    lines: [
      { code: 'def lerp(a, b, t):\n    return a + (b - a) * t', note: 'For numbers.' },
      { code: 'start = (0, 0, 0)\nend = (10, 4, -2)', note: 'Two camera positions.' },
      { code: 'quarter = tuple(lerp(a, b, 0.25) for a, b in zip(start, end))', note: 'The same lerp, component by component.' },
      { code: 'print(quarter)', note: 'A quarter of the way.' }
    ],
    output: '(2.5, 1.0, -0.5)'
  },

  mini: [
    {
      q: 'What is `lerp(10, 20, 0.3)`?',
      options: ['3', '13', '16'],
      answer: 1,
      why: '`10 + (20 − 10) · 0.3 = 13`.'
    },
    {
      q: 'A value goes from 0 to 50. Which `t` matches 40?',
      options: ['0.4', '0.8', '40'],
      answer: 1,
      why: 'Inverse lerp: `(40 − 0) / (50 − 0) = 0.8`.'
    }
  ],
  extra: [
    {
      q: 'What happens with `lerp(0, 10, 1.5)`?',
      options: ['It gives 10 (stops at the end)', 'It gives 15 (extrapolates)', 'It raises an error'],
      answer: 1,
      why: 'The formula does not clamp `t`. If you do not want to overshoot, clamp it to [0, 1] first.'
    }
  ],

  exercises: [
    {
      id: 'e1',
      title: 'Lerp for numbers and vectors',
      prompt: 'Write `lerp(a, b, t)` for numbers and `lerp_vec(a, b, t)` for tuples of any size.',
      setup: SETUP,
      starter: 'def lerp(a, b, t):\n    pass\n\ndef lerp_vec(a, b, t):\n    pass\n',
      tests: [
        { check: '_close(lerp(10, 20, 0.3), 13)', msg: 'lerp(10, 20, 0.3) = 13' },
        { check: '_close(lerp(5, -5, 1), -5)', msg: 'with t = 1 it gives b' },
        { check: '_close(lerp_vec((0, 0, 0), (10, 4, -2), 0.25), (2.5, 1, -0.5))', msg: 'lerp_vec a quarter of the way' },
        { check: 'isinstance(lerp_vec((0, 0), (1, 1), 0.5), tuple)', msg: 'lerp_vec returns a tuple' }
      ],
      hints: ['`return a + (b - a) * t`', '`lerp_vec`: `tuple(lerp(x, y, t) for x, y in zip(a, b))`.'],
      solution: 'def lerp(a, b, t):\n    return a + (b - a) * t\n\ndef lerp_vec(a, b, t):\n    return tuple(lerp(x, y, t) for x, y in zip(a, b))\n'
    },
    {
      id: 'e2',
      title: 'Remap',
      prompt: 'Write `remap(x, from_min, from_max, to_min, to_max)`: move `x` from the range `[from_min, from_max]` to the range `[to_min, to_max]`.\n\nExample: a camera distance of 11 in the range 2–20 matches 0.5 in the range 0–1.',
      setup: SETUP,
      starter: 'def remap(x, from_min, from_max, to_min, to_max):\n    pass\n',
      tests: [
        { check: '_close(remap(5, 0, 10, 0, 100), 50)', msg: '5 in 0–10 → 50 in 0–100' },
        { check: '_close(remap(11, 2, 20, 0, 1), 0.5)', msg: '11 in 2–20 → 0.5 in 0–1' },
        { check: '_close(remap(0.25, 0, 1, 16, 1.4), 12.35)', msg: 'works with reversed ranges (16 → 1.4)' }
      ],
      hints: ['First the inverse lerp: `t = (x - from_min) / (from_max - from_min)`.', 'Then the lerp: `to_min + (to_max - to_min) * t`.'],
      solution: 'def remap(x, from_min, from_max, to_min, to_max):\n    t = (x - from_min) / (from_max - from_min)\n    return to_min + (to_max - to_min) * t\n'
    },
    {
      id: 'e3',
      title: 'Ease in / ease out',
      prompt: 'Write `smoothstep(t)`: clamp `t` to [0, 1] and return `3t² − 2t³`.',
      setup: SETUP,
      starter: 'def smoothstep(t):\n    pass\n',
      tests: [
        { check: '_close(smoothstep(0), 0) and _close(smoothstep(1), 1)', msg: 'starts at 0 and ends at 1' },
        { check: '_close(smoothstep(0.5), 0.5)', msg: 'in the middle it is 0.5' },
        { check: '_close(smoothstep(0.25), 0.15625)', msg: 'at the start it is slower than a lerp (0.156 < 0.25)' },
        { check: '_close(smoothstep(-1), 0) and _close(smoothstep(2), 1)', msg: 'clamps values outside [0, 1]' }
      ],
      hints: ['`t = max(0.0, min(1.0, t))`', '`return 3 * t * t - 2 * t * t * t`'],
      solution: 'def smoothstep(t):\n    t = max(0.0, min(1.0, t))\n    return 3 * t * t - 2 * t ** 3\n',
      explain: 'Combined with lerp: `lerp(a, b, smoothstep(t))` starts slow, speeds up and slows down at the end, like a good camera curve.'
    }
  ],

  summary: [
    'lerp(a, b, t) = a + (b − a) · t; apply it per component.',
    'Inverse lerp gives the `t` of a value; remap = inverse + lerp.',
    'For ease in/out, bend `t` (smoothstep: 3t² − 2t³) and clamp it to [0, 1].'
  ]
});
})();
