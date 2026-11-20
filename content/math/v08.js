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

var QMUL = 'def quat_mul(a, b):\n    aw, ax, ay, az = a\n    bw, bx, by, bz = b\n    return (aw*bw - ax*bx - ay*by - az*bz,\n            aw*bx + ax*bw + ay*bz - az*by,\n            aw*by - ax*bz + ay*bw + az*bx,\n            aw*bz + ax*by - ay*bx + az*bw)\n';

TA.add({
  id: 'v08',
  title: 'Quaternions',

  explain: [
    'A **quaternion** stores a rotation in **four** numbers: `(w, x, y, z)`. It has no gimbal lock and interpolates very well. That is why game engines use them internally.',
    { type: 'analogy', text: 'Euler is like giving three instructions in a row (“turn, tilt, lean”). A quaternion is a single instruction: “turn this many degrees around **this** axis”.' },
    '### Axis and angle',
    'To turn by θ around a unit axis `(ex, ey, ez)`:\n\n`q = (cos(θ/2), ex·sin(θ/2), ey·sin(θ/2), ez·sin(θ/2))`',
    'Notice the **θ/2**: it is the part that surprises people most. A rotation quaternion always has length 1.',
    { type: 'viz', name: 'quat' },
    '### What you need to know',
    '- **No gimbal lock**: the rotation is a single turn around one axis.\n- **Combining** two rotations = multiplying quaternions. Order matters (as with matrices).\n- **Interpolating** between two orientations is smooth with no jumps: that is **slerp** (lesson v10).\n- **Double cover**: `q` and `−q` are the same rotation. When interpolating, you pick the closer one.\n- `(1, 0, 0, 0)` is the **identity**: no rotation.',
    { type: 'cg', text: 'in Maya, `om.MQuaternion` and `MTransformationMatrix.rotation(asQuaternion=True)`. Rotation curves in an FBX exported to an engine are usually converted to quaternions for in-game interpolation.' },
    { type: 'tip', text: 'you do not need to prove anything. In the interview it is enough to say: “four numbers, axis and angle with θ/2, no gimbal lock, smooth interpolation with slerp, and q and −q are the same rotation”.' }
  ],

  example: {
    intro: 'A quaternion for 90° around Z.',
    lines: [
      { code: 'import math', note: 'For sine and cosine.' },
      { code: 'axis = (0, 0, 1)\ntheta = math.radians(90)', note: 'Z axis and 90°.' },
      { code: 'w = math.cos(theta / 2)\ns = math.sin(theta / 2)', note: 'Careful: **half** the angle.' },
      { code: 'q = (w, axis[0] * s, axis[1] * s, axis[2] * s)', note: '`(cos 45°, 0, 0, sin 45°)`.' },
      { code: 'print(tuple(round(c, 4) for c in q))', note: 'Rounded so it is easier to read.' }
    ],
    output: '(0.7071, 0.0, 0.0, 0.7071)'
  },

  mini: [
    {
      q: 'Which angle goes inside the quaternion for a 90° rotation?',
      options: ['90°', '45° (half)', '180° (double)'],
      answer: 1,
      why: 'The formula uses θ/2: `cos(45°)` and `sin(45°)`.'
    },
    {
      q: 'Which of these is an advantage of quaternions over Euler?',
      options: ['They are easier for an animator to read', 'They have no gimbal lock and interpolate smoothly', 'They use fewer numbers'],
      answer: 1,
      why: 'That is why they are used internally, even though the animator sees Euler in the Channel Box.'
    }
  ],
  extra: [
    {
      q: '`q = (0.7, 0.7, 0, 0)` and `−q = (−0.7, −0.7, 0, 0)`. Which rotations do they represent?',
      options: ['Opposite ones', 'The same one', 'None: −q is not valid'],
      answer: 1,
      why: 'Double cover: q and −q give the same orientation.'
    },
    {
      q: 'Which quaternion means “no rotation”?',
      options: ['`(0, 0, 0, 0)`', '`(1, 0, 0, 0)`', '`(0, 1, 1, 1)`'],
      answer: 1,
      why: 'cos(0) = 1 and sin(0) = 0: it is the identity.'
    }
  ],

  exercises: [
    {
      id: 'e1',
      title: 'From axis and angle',
      prompt: 'Write `quat_from_axis_angle(axis, degrees)`. Return `(w, x, y, z)`.\n\nThe axis may not be a unit vector: **normalize** it first.',
      setup: SETUP,
      starter: 'import math\n\ndef quat_from_axis_angle(axis, degrees):\n    pass\n',
      tests: [
        { check: '_close(quat_from_axis_angle((0, 0, 1), 90), (math.cos(math.pi / 4), 0, 0, math.sin(math.pi / 4)))', msg: '90° around Z → (cos 45°, 0, 0, sin 45°)' },
        { check: '_close(quat_from_axis_angle((0, 5, 0), 180), (0, 0, 1, 0))', msg: 'normalizes the axis: (0,5,0), 180° → (0, 0, 1, 0)' },
        { check: '_close(quat_from_axis_angle((1, 0, 0), 0), (1, 0, 0, 0))', msg: '0° → identity' }
      ],
      hints: ['Axis length: `l = math.sqrt(sum(c*c for c in axis))`.', '`h = math.radians(degrees) / 2`; `s = math.sin(h)`.', '`return (math.cos(h), axis[0]/l*s, axis[1]/l*s, axis[2]/l*s)`'],
      solution: 'import math\n\ndef quat_from_axis_angle(axis, degrees):\n    l = math.sqrt(sum(c * c for c in axis))\n    ex, ey, ez = (c / l for c in axis)\n    h = math.radians(degrees) / 2\n    s = math.sin(h)\n    return (math.cos(h), ex * s, ey * s, ez * s)\n'
    },
    {
      id: 'e2',
      title: 'Multiplying quaternions',
      prompt: 'Write `quat_mul(a, b)` (the Hamilton product). With `a = (aw, ax, ay, az)` and `b = (bw, bx, by, bz)`:\n\n```\nw = aw·bw − ax·bx − ay·by − az·bz\nx = aw·bx + ax·bw + ay·bz − az·by\ny = aw·by − ax·bz + ay·bw + az·bx\nz = aw·bz + ax·by − ay·bx + az·bw\n```',
      setup: SETUP + 'import math\n_q90 = (math.cos(math.pi / 4), 0, 0, math.sin(math.pi / 4))\n',
      starter: 'def quat_mul(a, b):\n    pass\n',
      tests: [
        { check: '_close(quat_mul((1, 0, 0, 0), (0.5, 0.5, 0.5, 0.5)), (0.5, 0.5, 0.5, 0.5))', msg: 'identity × q = q' },
        { check: '_close(quat_mul((0, 1, 0, 0), (0, 0, 1, 0)), (0, 0, 0, 1))', msg: 'i × j = k' },
        { check: '_close(quat_mul(_q90, _q90), (0, 0, 0, 1))', msg: '90° around Z twice = 180° around Z (0, 0, 0, 1)' }
      ],
      hints: ['Unpack: `aw, ax, ay, az = a`.', 'Copy the four formulas carefully, watching the signs.'],
      solution: QMUL
    },
    {
      id: 'e3',
      title: 'Rotating a vector',
      prompt: 'Write `rotate_vector(v, q)`. To rotate a vector with a unit quaternion:\n\n1. Turn `v` into a pure quaternion: `p = (0, vx, vy, vz)`.\n2. Compute `q × p × q*`, where `q* = (w, −x, −y, −z)` is the **conjugate**.\n3. Return the last three components.\n\n`quat_mul` is already written.',
      setup: SETUP + 'import math\n_q90 = (math.cos(math.pi / 4), 0, 0, math.sin(math.pi / 4))\n',
      starter: QMUL + '\ndef rotate_vector(v, q):\n    pass\n',
      tests: [
        { check: '_close(rotate_vector((1, 0, 0), _q90), (0, 1, 0))', msg: 'X rotated 90° around Z → Y' },
        { check: '_close(rotate_vector((0, 0, 3), _q90), (0, 0, 3))', msg: 'a vector along the rotation axis does not change' },
        { check: '_close(rotate_vector((2, 0, 0), (0, 0, 1, 0)), (-2, 0, 0))', msg: '180° around Y: X becomes −X' }
      ],
      hints: ['`conj = (q[0], -q[1], -q[2], -q[3])`', '`r = quat_mul(quat_mul(q, (0,) + tuple(v)), conj)`', '`return r[1:]`'],
      solution: QMUL + '\ndef rotate_vector(v, q):\n    p = (0,) + tuple(v)\n    conj = (q[0], -q[1], -q[2], -q[3])\n    r = quat_mul(quat_mul(q, p), conj)\n    return r[1:]\n'
    }
  ],

  summary: [
    'Quaternion = (cos θ/2, axis · sin θ/2): one turn around one axis.',
    'No gimbal lock; combine them by multiplying and interpolate with slerp.',
    'q and −q are the same rotation; (1, 0, 0, 0) is the identity.'
  ]
});
})();
