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
  id: 'v07',
  title: 'Euler angles and gimbal lock',

  explain: [
    '**Euler angles** are the three numbers in `rotateX`, `rotateY`, `rotateZ`. They are easy to read, but they have two problems: **order** and **gimbal lock**.',
    { type: 'analogy', text: 'rotating with Euler is like giving three instructions in a row: «turn your head right, then tilt it up, then lean it sideways». Change the order of the instructions and the head ends up somewhere else.' },
    '### Rotation order',
    'The three rotations are applied **one after another**. In Maya, the `rotateOrder` attribute sets the order (default `xyz`). The same three numbers with a different order give a different orientation.',
    '### Gimbal lock',
    'With `xyz` order, if Y reaches **90°**, the X axis and the Z axis line up: rotating X or Z does **the same thing**. You have lost one degree of freedom.',
    { type: 'viz', name: 'gimbal' },
    'Try it in the figure: set Y to 90° and move X and Z. Both turn around the same axis.',
    { type: 'cg', text: 'in animation, gimbal lock causes weird spins and jumps in the curves. That is why riggers pick the `rotateOrder` based on the motion: for a neck that turns a lot in Y, Y goes **first or last**, so the axis that moves most does not cause the lock.' },
    '### 360° jumps',
    '`rotateY = 190` and `rotateY = -170` are the same orientation. But if one key is 170 and the next is -175, the curve spins almost a full turn backwards. The Graph Editor\'s **Euler Filter** fixes this by adding or subtracting 360°.',
    { type: 'tip', text: 'summary for the interview: «Euler is intuitive and it is what animators see, but it depends on the order and has gimbal lock. Internally, to interpolate or combine rotations, I use matrices or quaternions».' }
  ],

  example: {
    intro: 'Finding jumps of more than 180° between keys.',
    lines: [
      { code: 'keys = [170, -175, -160]', note: 'rotateY values on three frames in a row.' },
      { code: 'for a, b in zip(keys, keys[1:]):', note: 'Loop over (previous, next) pairs.' },
      { code: '    if abs(b - a) > 180:', note: 'A jump of more than half a turn is suspicious.' },
      { code: '        print("jump:", a, "→", b)', note: 'From 170 to -175 is 345°, but it really only turned 15°.' }
    ],
    output: 'jump: 170 → -175'
  },

  mini: [
    {
      q: 'With `rotateOrder = xyz`, which Y value causes gimbal lock?',
      options: ['0°', '±90°', '45°'],
      answer: 1,
      why: 'At ±90° on the middle axis, the first and last axes line up.'
    },
    {
      q: 'You change `rotateOrder` from `xyz` to `zxy` without changing the values. What happens?',
      options: ['Nothing', 'The object changes orientation', 'Maya throws an error'],
      answer: 1,
      why: 'The same numbers applied in a different order give a different orientation.'
    }
  ],
  extra: [
    {
      q: 'What does the Euler Filter do?',
      options: ['Removes keys', 'Adds or subtracts 360° to avoid jumps between neighboring keys', 'Converts to quaternions'],
      answer: 1,
      why: 'It keeps the same orientation but makes the curve continuous.'
    },
    {
      q: 'How do you avoid gimbal lock when **interpolating** rotations internally?',
      options: ['With more keys', 'With quaternions or matrices', 'With smaller values'],
      answer: 1,
      why: 'Quaternions have no gimbal lock (lesson v08).'
    }
  ],

  exercises: [
    {
      id: 'e1',
      title: 'Wrap an angle',
      prompt: 'Write `wrap_angle(a)`: return the equivalent angle in the range **[-180, 180)**.\n\nFor example, 190 → -170 and 540 → -180.',
      setup: SETUP,
      starter: 'def wrap_angle(a):\n    pass\n',
      tests: [
        { check: '_close(wrap_angle(190), -170)', msg: '190 → -170' },
        { check: '_close(wrap_angle(-190), 170)', msg: '-190 → 170' },
        { check: '_close(wrap_angle(765), 45)', msg: '765 (two turns + 45) → 45' },
        { check: '_close(wrap_angle(30), 30)', msg: 'an angle already in range does not change' }
      ],
      hints: ['Shift, take the modulo, shift back: `(a + 180) % 360 - 180`.', 'In Python, `%` with negatives already returns a positive result.'],
      solution: 'def wrap_angle(a):\n    return (a + 180) % 360 - 180\n'
    },
    {
      id: 'e2',
      title: 'Your own Euler Filter',
      prompt: 'Write `euler_filter(values)`: it takes a list of angles (consecutive keys) and returns a new list where each value is shifted by adding or subtracting 360 until its difference from the **previous, already fixed** value is at most 180.\n\nThe first value does not change.',
      setup: SETUP,
      starter: 'def euler_filter(values):\n    pass\n',
      tests: [
        { check: '_close(euler_filter([170, -175, -160]), [170, 185, 200])', msg: '[170, -175, -160] → [170, 185, 200]' },
        { check: '_close(euler_filter([0, 350]), [0, -10])', msg: '[0, 350] → [0, -10]' },
        { check: '_close(euler_filter([10, 20, 30]), [10, 20, 30])', msg: 'no jumps, nothing changes' },
        { check: '_close(euler_filter([0, 700]), [0, -20])', msg: 'jumps of several turns' },
        { check: 'euler_filter([]) == []', msg: 'empty list → empty list' }
      ],
      hints: ['Start with `res = values[:1]`.', 'For each next value: `while v - res[-1] > 180: v -= 360` (and the other way with `< -180`).'],
      solution: 'def euler_filter(values):\n    res = list(values[:1])\n    for v in values[1:]:\n        while v - res[-1] > 180:\n            v -= 360\n        while v - res[-1] < -180:\n            v += 360\n        res.append(v)\n    return res\n',
      explain: 'Compare with the **already fixed** value, not the original: otherwise the error carries over to the next keys.'
    }
  ],

  summary: [
    'Euler = three rotations in order; `rotateOrder` changes the result.',
    'Gimbal lock: with the middle axis at ±90°, two axes line up.',
    '360° jumps between keys are fixed with an Euler Filter.'
  ]
});
})();
