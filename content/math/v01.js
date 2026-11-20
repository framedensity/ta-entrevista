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
  id: 'v01',
  title: 'Vectores',
  en: 'vectors',

  explain: [
    'Un **vector** es una flecha: tiene **dirección** y **longitud**. En 3D se escribe con tres números `(x, y, z)`.',
    { type: 'analogy', text: 'un vector es como una indicación para llegar a un sitio: «3 pasos a la derecha y 4 hacia delante». No dice desde dónde sales, solo cómo moverte.' },
    { type: 'viz', name: 'vector' },
    '### Punto y vector',
    'Un **punto** es un lugar: la posición de un objeto. Un **vector** es un desplazamiento: cómo ir de un lugar a otro. Los dos se escriben igual, `(x, y, z)`, pero significan cosas distintas.',
    '### Las tres operaciones básicas',
    '- **Suma** (vector addition): `a + b` = una flecha detrás de otra. Se suma componente a componente.\n- **Resta** (subtraction): `b - a` = la flecha que va **de a a b**. Es la más usada en TA.\n- **Escalar** (scalar multiplication): `v * 2` = la misma dirección, el doble de larga. Con `-1`, da la vuelta.',
    { type: 'cg', text: 'la cámara está en `(0, 2, 10)` y el personaje en `(3, 2, 6)`. El vector `personaje - cámara = (3, 0, -4)` es la dirección en la que la cámara tiene que mirar.' },
    { type: 'tip', text: 'regla para la resta: **destino menos origen**. «De la cámara al personaje» es `personaje - camara`.' },
    'En Maya los vectores ya existen (`om.MVector`), pero en la entrevista te pueden pedir escribirlos a mano con tuplas. Así ven que entiendes lo que hay por dentro.'
  ],

  example: {
    intro: 'Vectores 3D como tuplas.',
    lines: [
      { code: 'camara = (0, 2, 10)\npersonaje = (3, 2, 6)', note: 'Dos **puntos** en la escena.' },
      { code: 'def restar(a, b):\n    return (a[0] - b[0], a[1] - b[1], a[2] - b[2])', note: 'Componente a componente.' },
      { code: 'hacia = restar(personaje, camara)', note: 'Destino menos origen: de la cámara al personaje.' },
      { code: 'mitad = tuple(c * 0.5 for c in hacia)', note: 'Escalar por 0.5: la mitad del camino.' },
      { code: 'print(hacia, mitad)', note: 'Resultado.' }
    ],
    output: '(3, 0, -4) (1.5, 0.0, -2.0)'
  },

  mini: [
    {
      q: 'El enemigo está en `(5, 0, 5)` y el jugador en `(1, 0, 2)`. ¿Qué vector va **del jugador al enemigo**?',
      options: ['`(-4, 0, -3)`', '`(4, 0, 3)`', '`(6, 0, 7)`'],
      answer: 1,
      why: 'Destino menos origen: `(5-1, 0-0, 5-2) = (4, 0, 3)`.'
    },
    {
      q: '¿Qué pasa si multiplicas un vector por `-1`?',
      options: ['Se hace cero', 'Apunta en la dirección contraria, con la misma longitud', 'Se hace el doble de largo'],
      answer: 1,
      why: 'Cada componente cambia de signo: la flecha da la vuelta.'
    }
  ],
  extra: [
    {
      q: 'Un objeto está en `p` y se mueve con velocidad `v` (unidades por frame). ¿Dónde está tras 10 frames?',
      options: ['`p * v * 10`', '`p + v * 10`', '`v + 10`'],
      answer: 1,
      why: 'Al punto se le suma el desplazamiento: la velocidad escalada por el tiempo.'
    }
  ],

  exercises: [
    {
      id: 'e1',
      title: 'Sumar y restar',
      prompt: 'Escribe `sumar(a, b)` y `restar(a, b)` para vectores 3D. Deben devolver **tuplas** de 3 números.',
      setup: SETUP,
      starter: 'def sumar(a, b):\n    pass\n\ndef restar(a, b):\n    pass\n',
      tests: [
        { check: 'sumar((1, 2, 3), (4, 5, 6)) == (5, 7, 9)', msg: 'sumar((1,2,3), (4,5,6)) da (5, 7, 9)' },
        { check: 'restar((5, 0, 5), (1, 0, 2)) == (4, 0, 3)', msg: 'restar((5,0,5), (1,0,2)) da (4, 0, 3)' },
        { check: 'isinstance(sumar((0, 0, 0), (1, 1, 1)), tuple)', msg: 'devuelve una tupla' }
      ],
      hints: ['`return (a[0] + b[0], a[1] + b[1], a[2] + b[2])`', 'Más corto: `tuple(x + y for x, y in zip(a, b))`.'],
      solution: 'def sumar(a, b):\n    return tuple(x + y for x, y in zip(a, b))\n\ndef restar(a, b):\n    return tuple(x - y for x, y in zip(a, b))\n'
    },
    {
      id: 'e2',
      title: 'Escalar',
      prompt: 'Escribe `escalar(v, s)`: multiplica cada componente de `v` por el número `s`.',
      setup: SETUP,
      starter: 'def escalar(v, s):\n    pass\n',
      tests: [
        { check: 'escalar((1, 2, 3), 2) == (2, 4, 6)', msg: 'escalar((1,2,3), 2) da (2, 4, 6)' },
        { check: 'escalar((1, -2, 0), -1) == (-1, 2, 0)', msg: 'con -1 da la vuelta' },
        { check: '_cerca(escalar((4, 0, 2), 0.5), (2, 0, 1))', msg: 'funciona con decimales' }
      ],
      hints: ['Una comprensión dentro de `tuple(...)`.'],
      solution: 'def escalar(v, s):\n    return tuple(c * s for c in v)\n'
    },
    {
      id: 'e3',
      title: 'Punto intermedio',
      prompt: 'Escribe `punto_medio(a, b)`: el punto justo entre dos posiciones. Úsalo para colocar un objetivo de cámara entre dos personajes.\n\nPista: es `a + (b - a) * 0.5`.',
      setup: SETUP,
      starter: 'def punto_medio(a, b):\n    pass\n',
      tests: [
        { check: '_cerca(punto_medio((0, 0, 0), (4, 2, 0)), (2, 1, 0))', msg: 'entre (0,0,0) y (4,2,0) está (2, 1, 0)' },
        { check: '_cerca(punto_medio((-2, 1, 3), (2, 1, -3)), (0, 1, 0))', msg: 'funciona con negativos' }
      ],
      hints: ['También vale `(a + b) / 2` componente a componente.', '`tuple((x + y) / 2 for x, y in zip(a, b))`'],
      solution: 'def punto_medio(a, b):\n    return tuple((x + y) / 2 for x, y in zip(a, b))\n',
      explain: 'Es el caso t = 0.5 de la interpolación lineal (lección v09).'
    }
  ],

  summary: [
    'Un vector es una flecha (dirección + longitud); un punto es un lugar.',
    'Se suma, resta y escala componente a componente.',
    'De A hacia B: `B - A` (destino menos origen).'
  ]
});
})();
