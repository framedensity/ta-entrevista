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
  id: 'v09',
  title: 'Interpolación lineal',
  en: 'lerp',

  explain: [
    '**Interpolar** es calcular los valores intermedios entre dos valores. La **interpolación lineal** (lerp, de *linear interpolation*) va en línea recta y a velocidad constante.',
    { type: 'analogy', text: 'es como una barra de progreso: con `t = 0` estás al principio, con `t = 1` al final, y con `t = 0.5` justo en la mitad.' },
    '### La fórmula',
    '`lerp(a, b, t) = a + (b − a) · t`',
    'Funciona igual con números, con posiciones 3D y con colores: se aplica a cada componente.',
    { type: 'viz', name: 'lerp' },
    '### La inversa y el remapeo',
    '- **Lerp inversa** (inverse lerp): dado un valor `x` entre `a` y `b`, ¿qué `t` le corresponde? `t = (x − a) / (b − a)`.\n- **Remapear** (remap): pasar un valor de un rango a otro. Es una lerp inversa seguida de una lerp.',
    '### Suavizar: ease in / ease out',
    'Una lerp pura empieza y termina de golpe. Para que acelere y frene, se «deforma» `t` antes de usarlo. La función más común es **smoothstep**: `3t² − 2t³`.',
    { type: 'cg', text: 'las tangentes *linear* del Graph Editor son lerp entre claves. Las tangentes *auto* o *spline* suavizan la entrada y la salida, como un smoothstep. Y remapear sirve, por ejemplo, para convertir la distancia de la cámara (de 2 a 20 metros) en una apertura de profundidad de campo.' },
    { type: 'tip', text: '`t` no tiene por qué ser tiempo: es «cuánto del camino». Con `t` fuera de [0, 1] la lerp **extrapola** (se pasa). Muchas veces conviene limitarlo (clamp).' }
  ],

  example: {
    intro: 'Lerp de una posición en 3D.',
    lines: [
      { code: 'def lerp(a, b, t):\n    return a + (b - a) * t', note: 'Para números.' },
      { code: 'inicio = (0, 0, 0)\nfin = (10, 4, -2)', note: 'Dos posiciones de la cámara.' },
      { code: 'cuarto = tuple(lerp(a, b, 0.25) for a, b in zip(inicio, fin))', note: 'Misma lerp, componente a componente.' },
      { code: 'print(cuarto)', note: 'A un cuarto del camino.' }
    ],
    output: '(2.5, 1.0, -0.5)'
  },

  mini: [
    {
      q: '¿Cuánto vale `lerp(10, 20, 0.3)`?',
      options: ['3', '13', '16'],
      answer: 1,
      why: '`10 + (20 − 10) · 0.3 = 13`.'
    },
    {
      q: 'Un valor va de 0 a 50. ¿Qué `t` le corresponde a 40?',
      options: ['0.4', '0.8', '40'],
      answer: 1,
      why: 'Lerp inversa: `(40 − 0) / (50 − 0) = 0.8`.'
    }
  ],
  extra: [
    {
      q: '¿Qué pasa con `lerp(0, 10, 1.5)`?',
      options: ['Da 10 (se para en el final)', 'Da 15 (extrapola)', 'Da un error'],
      answer: 1,
      why: 'La fórmula no limita `t`. Si no quieres pasarte, limítalo a [0, 1] antes.'
    }
  ],

  exercises: [
    {
      id: 'e1',
      title: 'Lerp de números y vectores',
      prompt: 'Escribe `lerp(a, b, t)` para números y `lerp_vec(a, b, t)` para tuplas de cualquier tamaño.',
      setup: SETUP,
      starter: 'def lerp(a, b, t):\n    pass\n\ndef lerp_vec(a, b, t):\n    pass\n',
      tests: [
        { check: '_cerca(lerp(10, 20, 0.3), 13)', msg: 'lerp(10, 20, 0.3) = 13' },
        { check: '_cerca(lerp(5, -5, 1), -5)', msg: 'con t = 1 da b' },
        { check: '_cerca(lerp_vec((0, 0, 0), (10, 4, -2), 0.25), (2.5, 1, -0.5))', msg: 'lerp_vec a un cuarto del camino' },
        { check: 'isinstance(lerp_vec((0, 0), (1, 1), 0.5), tuple)', msg: 'lerp_vec devuelve una tupla' }
      ],
      hints: ['`return a + (b - a) * t`', '`lerp_vec`: `tuple(lerp(x, y, t) for x, y in zip(a, b))`.'],
      solution: 'def lerp(a, b, t):\n    return a + (b - a) * t\n\ndef lerp_vec(a, b, t):\n    return tuple(lerp(x, y, t) for x, y in zip(a, b))\n'
    },
    {
      id: 'e2',
      title: 'Remapear',
      prompt: 'Escribe `remapear(x, de_min, de_max, a_min, a_max)`: pasa `x` del rango `[de_min, de_max]` al rango `[a_min, a_max]`.\n\nEjemplo: la distancia de cámara 11 en el rango 2–20 corresponde a 0.5 en el rango 0–1.',
      setup: SETUP,
      starter: 'def remapear(x, de_min, de_max, a_min, a_max):\n    pass\n',
      tests: [
        { check: '_cerca(remapear(5, 0, 10, 0, 100), 50)', msg: '5 en 0–10 → 50 en 0–100' },
        { check: '_cerca(remapear(11, 2, 20, 0, 1), 0.5)', msg: '11 en 2–20 → 0.5 en 0–1' },
        { check: '_cerca(remapear(0.25, 0, 1, 16, 1.4), 12.35)', msg: 'funciona con rangos al revés (16 → 1.4)' }
      ],
      hints: ['Primero la lerp inversa: `t = (x - de_min) / (de_max - de_min)`.', 'Después la lerp: `a_min + (a_max - a_min) * t`.'],
      solution: 'def remapear(x, de_min, de_max, a_min, a_max):\n    t = (x - de_min) / (de_max - de_min)\n    return a_min + (a_max - a_min) * t\n'
    },
    {
      id: 'e3',
      title: 'Ease in / ease out',
      prompt: 'Escribe `suavizar(t)`: limita `t` a [0, 1] y devuelve el **smoothstep** `3t² − 2t³`.',
      setup: SETUP,
      starter: 'def suavizar(t):\n    pass\n',
      tests: [
        { check: '_cerca(suavizar(0), 0) and _cerca(suavizar(1), 1)', msg: 'empieza en 0 y acaba en 1' },
        { check: '_cerca(suavizar(0.5), 0.5)', msg: 'en la mitad vale 0.5' },
        { check: '_cerca(suavizar(0.25), 0.15625)', msg: 'al principio va más despacio que una lerp (0.156 < 0.25)' },
        { check: '_cerca(suavizar(-1), 0) and _cerca(suavizar(2), 1)', msg: 'limita los valores fuera de [0, 1]' }
      ],
      hints: ['`t = max(0.0, min(1.0, t))`', '`return 3 * t * t - 2 * t * t * t`'],
      solution: 'def suavizar(t):\n    t = max(0.0, min(1.0, t))\n    return 3 * t * t - 2 * t ** 3\n',
      explain: 'Combinado con lerp: `lerp(a, b, suavizar(t))` arranca despacio, acelera y frena al final, como una buena curva de cámara.'
    }
  ],

  summary: [
    'lerp(a, b, t) = a + (b − a) · t; se aplica por componente.',
    'Lerp inversa da el `t` de un valor; remapear = inversa + lerp.',
    'Para ease in/out, deforma `t` (smoothstep: 3t² − 2t³) y limítalo a [0, 1].'
  ]
});
})();
