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

TA.add({
  id: 'v10',
  title: 'Interpolación esférica',
  en: 'slerp',

  explain: [
    'Si interpolas **direcciones** u **orientaciones** con una lerp normal, el resultado se «encoge» por el camino y la velocidad no es constante. La **slerp** (spherical linear interpolation) va por el arco, a velocidad angular constante.',
    { type: 'analogy', text: 'imagina la aguja de un reloj que va de las 12 a las 3. La lerp cortaría en línea recta por dentro de la esfera (la aguja se acorta). La slerp mueve la punta por el borde, como una aguja de verdad.' },
    { type: 'viz', name: 'slerp' },
    '### Tres opciones',
    '- **lerp**: rápida, pero la longitud baja en el medio (con 90°, la mitad mide 0.71).\n- **nlerp** (normalized lerp): lerp y luego normalizar. Longitud correcta y muy rápida, pero la velocidad no es del todo constante.\n- **slerp**: va por el arco a velocidad constante. Un poco más cara.',
    '### La fórmula de slerp',
    'Con θ = ángulo entre `a` y `b` (unitarios):\n\n`slerp(a, b, t) = a·sin((1−t)θ)/sin θ + b·sin(tθ)/sin θ`',
    { type: 'warn', text: 'si `a` y `b` son casi iguales, `sin θ` es casi 0 y se divide por cero. En ese caso se usa lerp (o nlerp), que es prácticamente igual.' },
    '### Con cuaterniones',
    'La misma slerp sirve para cuaterniones. Pero antes hay que mirar el **camino corto**: si `dot(q1, q2) < 0`, se cambia el signo de `q2` (recuerda: `q` y `−q` son la misma rotación). Si no, la interpolación da la vuelta larga.',
    { type: 'cg', text: 'al mezclar dos poses o dos clips de animación, el motor hace slerp (o nlerp) de los cuaterniones de cada joint. Un giro que «da la vuelta larga» en un blend suele ser este problema del camino corto.' },
    { type: 'tip', text: 'en la entrevista: «para orientaciones uso slerp de cuaterniones, comprobando antes el camino corto; si están muy cerca, uso nlerp para evitar dividir por cero».' }
  ],

  example: {
    intro: 'Comparar lerp y slerp a mitad de camino entre X e Y.',
    lines: [
      { code: 'import math', note: 'Para seno, coseno y raíz.' },
      { code: 'a, b, t = (1, 0, 0), (0, 1, 0), 0.5', note: 'Dos direcciones unitarias a 90°.' },
      { code: 'l = tuple(x + (y - x) * t for x, y in zip(a, b))', note: 'Lerp: (0.5, 0.5, 0).' },
      { code: 'print(round(math.sqrt(sum(c * c for c in l)), 3))', note: 'Longitud de la lerp: se ha encogido.' },
      { code: 'theta = math.acos(sum(x * y for x, y in zip(a, b)))\nwa = math.sin((1 - t) * theta) / math.sin(theta)\nwb = math.sin(t * theta) / math.sin(theta)', note: 'Pesos de la slerp.' },
      { code: 's = tuple(wa * x + wb * y for x, y in zip(a, b))\nprint(round(math.sqrt(sum(c * c for c in s)), 3))', note: 'La slerp mantiene la longitud 1.' }
    ],
    output: '0.707\n1.0'
  },

  mini: [
    {
      q: 'Haces lerp entre dos direcciones unitarias a 90°. ¿Qué longitud tiene el resultado en `t = 0.5`?',
      options: ['1', 'Unos 0.71', '0'],
      answer: 1,
      why: 'La lerp corta por dentro del arco: `(0.5, 0.5)` mide √0.5 ≈ 0.71.'
    },
    {
      q: 'Al hacer slerp de cuaterniones, `dot(q1, q2)` es negativo. ¿Qué haces?',
      options: ['Nada', 'Cambias el signo de q2 para ir por el camino corto', 'Cambias a Euler'],
      answer: 1,
      why: 'q2 y −q2 son la misma rotación; con el signo cambiado, la interpolación va por el camino corto.'
    }
  ],
  extra: [
    {
      q: '¿Por qué se usa a veces nlerp en vez de slerp?',
      options: ['Porque es más precisa', 'Porque es más barata y casi igual cuando los ángulos son pequeños', 'Porque no hace falta normalizar'],
      answer: 1,
      why: 'En blends con muchos joints por frame, la diferencia apenas se ve y el ahorro sí.'
    }
  ],

  exercises: [
    {
      id: 'e1',
      title: 'nlerp',
      prompt: 'Escribe `nlerp(a, b, t)`: lerp entre dos vectores y después normaliza el resultado.',
      setup: SETUP,
      starter: 'import math\n\ndef nlerp(a, b, t):\n    pass\n',
      tests: [
        { check: '_cerca(nlerp((1, 0, 0), (0, 1, 0), 0.5), (math.sqrt(0.5), math.sqrt(0.5), 0))', msg: 'a mitad de camino entre X e Y: (0.707, 0.707, 0)' },
        { check: '_cerca(nlerp((1, 0, 0), (0, 1, 0), 0.25), (0.75 / math.sqrt(0.625), 0.25 / math.sqrt(0.625), 0))', msg: 'con t = 0.25 el resultado tiene longitud 1' },
        { check: '_cerca(nlerp((0, 0, 1), (0, 1, 0), 0), (0, 0, 1))', msg: 'con t = 0 da a' }
      ],
      hints: ['Lerp por componente: `l = [x + (y - x) * t for x, y in zip(a, b)]`.', 'Después divide cada componente por la longitud de `l`.'],
      solution: 'import math\n\ndef nlerp(a, b, t):\n    l = [x + (y - x) * t for x, y in zip(a, b)]\n    n = math.sqrt(sum(c * c for c in l))\n    return tuple(c / n for c in l)\n'
    },
    {
      id: 'e2',
      title: 'slerp',
      prompt: 'Escribe `slerp(a, b, t)` para dos vectores **unitarios**.\n\n1. `cos θ = a·b`, limitado a [-1, 1].\n2. Si `sin θ` es muy pequeño (menor que 1e-6), devuelve la lerp.\n3. Si no, usa los pesos `sin((1−t)θ)/sin θ` y `sin(tθ)/sin θ`.',
      setup: SETUP,
      starter: 'import math\n\ndef slerp(a, b, t):\n    pass\n',
      tests: [
        { check: '_cerca(slerp((1, 0, 0), (0, 1, 0), 0.5), (math.sqrt(0.5), math.sqrt(0.5), 0))', msg: 'a mitad de camino entre X e Y' },
        { check: '_cerca(slerp((1, 0, 0), (0, 1, 0), 1 / 3), (math.cos(math.pi / 6), 0.5, 0))', msg: 'con t = 1/3 gira exactamente 30° (velocidad constante)' },
        { check: '_cerca(slerp((0, 0, 1), (0, 0, 1), 0.5), (0, 0, 1))', msg: 'con a = b no divide por cero' }
      ],
      hints: ['`c = max(-1.0, min(1.0, sum(x*y for x, y in zip(a, b))))`; `theta = math.acos(c)`.', '`s = math.sin(theta)`; si `s < 1e-6`, devuelve la lerp.', '`wa = math.sin((1 - t) * theta) / s`, `wb = math.sin(t * theta) / s`.'],
      solution: 'import math\n\ndef slerp(a, b, t):\n    c = max(-1.0, min(1.0, sum(x * y for x, y in zip(a, b))))\n    theta = math.acos(c)\n    s = math.sin(theta)\n    if s < 1e-6:\n        return tuple(x + (y - x) * t for x, y in zip(a, b))\n    wa = math.sin((1 - t) * theta) / s\n    wb = math.sin(t * theta) / s\n    return tuple(wa * x + wb * y for x, y in zip(a, b))\n'
    },
    {
      id: 'e3',
      title: 'El camino corto',
      prompt: 'Escribe `camino_corto(q1, q2)`. Si el producto escalar de los dos cuaterniones (las 4 componentes) es negativo, devuelve `q2` con todas sus componentes cambiadas de signo. Si no, devuelve `q2` tal cual (como tupla).',
      setup: SETUP,
      starter: 'def camino_corto(q1, q2):\n    pass\n',
      tests: [
        { check: '_cerca(camino_corto((1, 0, 0, 0), (-1, 0, 0, 0)), (1, 0, 0, 0))', msg: 'dot negativo: cambia el signo de q2' },
        { check: '_cerca(camino_corto((1, 0, 0, 0), (0.6, 0.8, 0, 0)), (0.6, 0.8, 0, 0))', msg: 'dot positivo: q2 no cambia' },
        { check: '_cerca(camino_corto((0.6, 0.8, 0, 0), (-0.5, -0.5, 0.5, 0.5)), (0.5, 0.5, -0.5, -0.5))', msg: 'funciona con cuaterniones generales' }
      ],
      hints: ['`d = sum(x * y for x, y in zip(q1, q2))`', '`if d < 0: return tuple(-c for c in q2)`'],
      solution: 'def camino_corto(q1, q2):\n    d = sum(x * y for x, y in zip(q1, q2))\n    if d < 0:\n        return tuple(-c for c in q2)\n    return tuple(q2)\n',
      explain: 'Este pequeño paso evita el típico «giro por el camino largo» en los blends de animación.'
    }
  ],

  summary: [
    'La lerp de direcciones se encoge; nlerp la normaliza; slerp va por el arco a velocidad constante.',
    'slerp: pesos sin((1−t)θ)/sin θ y sin(tθ)/sin θ; si θ ≈ 0, usa lerp.',
    'Con cuaterniones, si dot < 0, cambia el signo de uno: camino corto.'
  ]
});
})();
