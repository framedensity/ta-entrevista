(function () {
var SETUP = [
  'def _cerca(a, b, tol=1e-6):',
  '    if isinstance(a, (int, float)) and isinstance(b, (int, float)):',
  '        return abs(a - b) < tol',
  '    try:',
  '        a, b = list(a), list(b)',
  '    except TypeError:',
  '        return False',
  '    return len(a) == len(b) and all(_cerca(x, y, tol) for x, y in zip(a, b))'
].join('\n') + '\n';

var QMUL = 'def quat_mul(a, b):\n    aw, ax, ay, az = a\n    bw, bx, by, bz = b\n    return (aw*bw - ax*bx - ay*by - az*bz,\n            aw*bx + ax*bw + ay*bz - az*by,\n            aw*by - ax*bz + ay*bw + az*bx,\n            aw*bz + ax*by - ay*bx + az*bw)\n';

TA.add({
  id: 'v08',
  title: 'Cuaterniones',
  en: 'quaternions',

  explain: [
    'Un **cuaternión** (quaternion) guarda una rotación con **cuatro** números: `(w, x, y, z)`. No tiene bloqueo de cardán y se interpola muy bien. Por eso los motores de juego lo usan por dentro.',
    { type: 'analogy', text: 'Euler es como dar tres instrucciones seguidas («gira, inclina, ladea»). Un cuaternión es una sola instrucción: «gira tantos grados alrededor de **este** eje».' },
    '### Eje y ángulo',
    'Para girar θ alrededor de un eje unitario `(ex, ey, ez)`:\n\n`q = (cos(θ/2), ex·sin(θ/2), ey·sin(θ/2), ez·sin(θ/2))`',
    'Fíjate en el **θ/2**: es la parte que más sorprende. Un cuaternión de rotación siempre tiene longitud 1.',
    { type: 'viz', name: 'quat' },
    '### Lo que tienes que saber',
    '- **Sin bloqueo de cardán**: la rotación es un solo giro sobre un eje.\n- **Combinar** dos rotaciones = multiplicar cuaterniones. El orden importa (como con matrices).\n- **Interpolar** entre dos orientaciones queda suave y sin saltos: es la **slerp** (lección v10).\n- **Doble cobertura**: `q` y `−q` son la misma rotación. Al interpolar, hay que elegir el más cercano.\n- `(1, 0, 0, 0)` es la **identidad**: sin rotación.',
    { type: 'cg', text: 'en Maya, `om.MQuaternion` y `MTransformationMatrix.rotation(asQuaternion=True)`. Las curvas de rotación de un FBX exportado a un motor suelen convertirse a cuaterniones para interpolar en el juego.' },
    { type: 'tip', text: 'no hace falta saber demostrar nada. En la entrevista basta con: «cuatro números, eje y ángulo con θ/2, sin bloqueo de cardán, interpolación suave con slerp, y q y −q son la misma rotación».' }
  ],

  example: {
    intro: 'Un cuaternión de 90° alrededor de Z.',
    lines: [
      { code: 'import math', note: 'Para seno y coseno.' },
      { code: 'eje = (0, 0, 1)\ntheta = math.radians(90)', note: 'Eje Z y 90°.' },
      { code: 'w = math.cos(theta / 2)\ns = math.sin(theta / 2)', note: 'Ojo: la **mitad** del ángulo.' },
      { code: 'q = (w, eje[0] * s, eje[1] * s, eje[2] * s)', note: '`(cos 45°, 0, 0, sin 45°)`.' },
      { code: 'print(tuple(round(c, 4) for c in q))', note: 'Redondeado para leerlo mejor.' }
    ],
    output: '(0.7071, 0.0, 0.0, 0.7071)'
  },

  mini: [
    {
      q: '¿Qué ángulo se usa dentro del cuaternión para una rotación de 90°?',
      options: ['90°', '45° (la mitad)', '180° (el doble)'],
      answer: 1,
      why: 'La fórmula usa θ/2: `cos(45°)` y `sin(45°)`.'
    },
    {
      q: '¿Cuál de estas es una ventaja de los cuaterniones frente a Euler?',
      options: ['Son más fáciles de leer para un animador', 'No tienen bloqueo de cardán y se interpolan suavemente', 'Usan menos números'],
      answer: 1,
      why: 'Por eso se usan por dentro, aunque el animador vea Euler en el Channel Box.'
    }
  ],
  extra: [
    {
      q: '`q = (0.7, 0.7, 0, 0)` y `−q = (−0.7, −0.7, 0, 0)`. ¿Qué rotaciones representan?',
      options: ['Opuestas', 'La misma', 'Ninguna: −q no es válido'],
      answer: 1,
      why: 'Doble cobertura: q y −q dan la misma orientación.'
    },
    {
      q: '¿Qué cuaternión significa «sin rotación»?',
      options: ['`(0, 0, 0, 0)`', '`(1, 0, 0, 0)`', '`(0, 1, 1, 1)`'],
      answer: 1,
      why: 'cos(0) = 1 y sin(0) = 0: es la identidad.'
    }
  ],

  exercises: [
    {
      id: 'e1',
      title: 'Desde eje y ángulo',
      prompt: 'Escribe `quat_eje_angulo(eje, grados)`. Devuelve `(w, x, y, z)`.\n\nEl eje puede no ser unitario: **normalízalo** primero.',
      setup: SETUP,
      starter: 'import math\n\ndef quat_eje_angulo(eje, grados):\n    pass\n',
      tests: [
        { check: '_cerca(quat_eje_angulo((0, 0, 1), 90), (math.cos(math.pi / 4), 0, 0, math.sin(math.pi / 4)))', msg: '90° en Z → (cos 45°, 0, 0, sin 45°)' },
        { check: '_cerca(quat_eje_angulo((0, 5, 0), 180), (0, 0, 1, 0))', msg: 'normaliza el eje: (0,5,0), 180° → (0, 0, 1, 0)' },
        { check: '_cerca(quat_eje_angulo((1, 0, 0), 0), (1, 0, 0, 0))', msg: '0° → identidad' }
      ],
      hints: ['Longitud del eje: `l = math.sqrt(sum(c*c for c in eje))`.', '`h = math.radians(grados) / 2`; `s = math.sin(h)`.', '`return (math.cos(h), eje[0]/l*s, eje[1]/l*s, eje[2]/l*s)`'],
      solution: 'import math\n\ndef quat_eje_angulo(eje, grados):\n    l = math.sqrt(sum(c * c for c in eje))\n    ex, ey, ez = (c / l for c in eje)\n    h = math.radians(grados) / 2\n    s = math.sin(h)\n    return (math.cos(h), ex * s, ey * s, ez * s)\n'
    },
    {
      id: 'e2',
      title: 'Multiplicar cuaterniones',
      prompt: 'Escribe `quat_mul(a, b)` (producto de Hamilton). Con `a = (aw, ax, ay, az)` y `b = (bw, bx, by, bz)`:\n\n```\nw = aw·bw − ax·bx − ay·by − az·bz\nx = aw·bx + ax·bw + ay·bz − az·by\ny = aw·by − ax·bz + ay·bw + az·bx\nz = aw·bz + ax·by − ay·bx + az·bw\n```',
      setup: SETUP + 'import math\n_q90 = (math.cos(math.pi / 4), 0, 0, math.sin(math.pi / 4))\n',
      starter: 'def quat_mul(a, b):\n    pass\n',
      tests: [
        { check: '_cerca(quat_mul((1, 0, 0, 0), (0.5, 0.5, 0.5, 0.5)), (0.5, 0.5, 0.5, 0.5))', msg: 'identidad × q = q' },
        { check: '_cerca(quat_mul((0, 1, 0, 0), (0, 0, 1, 0)), (0, 0, 0, 1))', msg: 'i × j = k' },
        { check: '_cerca(quat_mul(_q90, _q90), (0, 0, 0, 1))', msg: '90° en Z dos veces = 180° en Z (0, 0, 0, 1)' }
      ],
      hints: ['Desempaqueta: `aw, ax, ay, az = a`.', 'Copia las cuatro fórmulas con cuidado con los signos.'],
      solution: QMUL
    },
    {
      id: 'e3',
      title: 'Rotar un vector',
      prompt: 'Escribe `rotar_vector(v, q)`. Para rotar un vector con un cuaternión unitario:\n\n1. Convierte `v` en cuaternión puro: `p = (0, vx, vy, vz)`.\n2. Calcula `q × p × q*`, donde `q* = (w, −x, −y, −z)` es el **conjugado**.\n3. Devuelve las tres últimas componentes.\n\nYa tienes `quat_mul`.',
      setup: SETUP + 'import math\n_q90 = (math.cos(math.pi / 4), 0, 0, math.sin(math.pi / 4))\n',
      starter: QMUL + '\ndef rotar_vector(v, q):\n    pass\n',
      tests: [
        { check: '_cerca(rotar_vector((1, 0, 0), _q90), (0, 1, 0))', msg: 'X rotado 90° en Z → Y' },
        { check: '_cerca(rotar_vector((0, 0, 3), _q90), (0, 0, 3))', msg: 'un vector sobre el eje de giro no cambia' },
        { check: '_cerca(rotar_vector((2, 0, 0), (0, 0, 1, 0)), (-2, 0, 0))', msg: '180° en Y: X pasa a −X' }
      ],
      hints: ['`conj = (q[0], -q[1], -q[2], -q[3])`', '`r = quat_mul(quat_mul(q, (0,) + tuple(v)), conj)`', '`return r[1:]`'],
      solution: QMUL + '\ndef rotar_vector(v, q):\n    p = (0,) + tuple(v)\n    conj = (q[0], -q[1], -q[2], -q[3])\n    r = quat_mul(quat_mul(q, p), conj)\n    return r[1:]\n'
    }
  ],

  summary: [
    'Cuaternión = (cos θ/2, eje · sin θ/2): un giro alrededor de un eje.',
    'Sin bloqueo de cardán; se combinan multiplicando y se interpolan con slerp.',
    'q y −q son la misma rotación; (1, 0, 0, 0) es la identidad.'
  ]
});
})();
