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
  id: 'v05',
  title: 'Matrices',
  en: 'matrices',

  explain: [
    'Una **matriz** (matrix) es una tabla de números que **transforma** vectores: los rota, los escala o los mueve. Todo nodo transform de Maya guarda una.',
    { type: 'analogy', text: 'una matriz es como una receta: le das un ingrediente (un vector) y te devuelve el plato (el vector transformado). Siempre la misma receta, para cualquier ingrediente.' },
    { type: 'viz', name: 'matrix' },
    '### Matriz por vector',
    'Cada componente del resultado es el **producto escalar** de una fila de la matriz con el vector.',
    '```\n| a b |   | x |   | a·x + b·y |\n| c d | × | y | = | c·x + d·y |\n```',
    '### Rotación en 2D (y alrededor de Z en 3D)',
    '```\n| cos θ  −sin θ |\n| sin θ   cos θ |\n```\nCon θ = 90°, el vector `(1, 0)` pasa a `(0, 1)`.',
    '### Combinar transformaciones',
    'Multiplicar dos matrices = hacer una transformación y luego la otra. **El orden importa**: rotar y luego mover no es lo mismo que mover y luego rotar.',
    { type: 'warn', text: 'Maya usa **vectores fila** (`v × M`): las matrices se leen en el orden contrario al de muchos libros, que usan vectores columna (`M × v`). Aquí usamos columnas. En la entrevista, basta con decir que el orden importa y que hay que saber qué convención usa cada sistema.' },
    '### Matriz 4×4',
    'En 3D se usan matrices 4×4: la parte 3×3 guarda rotación y escala, y la última fila (en Maya) guarda la **traslación**. Así una sola matriz puede rotar, escalar y mover a la vez.',
    { type: 'cg', text: '`cmds.xform(obj, q=True, ws=True, matrix=True)` devuelve 16 números: la matriz 4×4 en espacio mundial. Con OpenMaya, `MMatrix` permite multiplicarlas e invertirlas.' }
  ],

  example: {
    intro: 'Rotar un vector 90° con una matriz.',
    lines: [
      { code: 'import math', note: 'Para seno y coseno.' },
      { code: 'def mul_mat_vec(m, v):\n    return tuple(sum(a * b for a, b in zip(fila, v)) for fila in m)', note: 'Cada fila, producto escalar con el vector.' },
      { code: 't = math.radians(90)\nrot = [[math.cos(t), -math.sin(t)],\n       [math.sin(t),  math.cos(t)]]', note: 'Matriz de rotación 2D. Las funciones trigonométricas usan radianes.' },
      { code: 'r = mul_mat_vec(rot, (1, 0))', note: 'Rotamos el eje X.' },
      { code: 'print(tuple(round(c, 6) for c in r))', note: 'Redondeamos para ocultar el error de coma flotante (6e-17).' }
    ],
    output: '(0.0, 1.0)'
  },

  mini: [
    {
      q: '¿Qué es cada componente de `M × v`?',
      options: ['La suma de la columna', 'El producto escalar de una fila de M con v', 'El producto vectorial de M y v'],
      answer: 1,
      why: 'Fila por vector, componente a componente, y se suma.'
    },
    {
      q: '¿Rotar 90° y luego mover 5 en X da lo mismo que mover 5 en X y luego rotar 90°?',
      options: ['Sí, siempre', 'No: el orden de las transformaciones importa', 'Solo en 3D'],
      answer: 1,
      why: 'La multiplicación de matrices no es conmutativa: A × B ≠ B × A.'
    }
  ],
  extra: [
    {
      q: '¿Para qué sirve la cuarta fila/columna de una matriz 4×4 en Maya?',
      options: ['Para el color', 'Para la traslación (posición)', 'No se usa'],
      answer: 1,
      why: 'Con 4×4 una sola matriz combina rotación, escala y traslación.'
    }
  ],

  exercises: [
    {
      id: 'e1',
      title: 'Matriz por vector',
      prompt: 'Escribe `mul_mat_vec(m, v)`. `m` es una lista de filas (de cualquier tamaño). Devuelve una tupla.',
      setup: SETUP,
      starter: 'def mul_mat_vec(m, v):\n    pass\n',
      tests: [
        { check: 'mul_mat_vec([[1, 0, 0], [0, 2, 0], [0, 0, 3]], (1, 1, 1)) == (1, 2, 3)', msg: 'una matriz de escala (1, 2, 3)' },
        { check: 'mul_mat_vec([[0, -1], [1, 0]], (1, 0)) == (0, 1)', msg: 'rotación de 90° en 2D' },
        { check: 'mul_mat_vec([[1, 0], [0, 1]], (7, -2)) == (7, -2)', msg: 'la identidad no cambia nada' }
      ],
      hints: ['Para cada fila: `sum(a * b for a, b in zip(fila, v))`.', 'Envuelve todo en `tuple(... for fila in m)`.'],
      solution: 'def mul_mat_vec(m, v):\n    return tuple(sum(a * b for a, b in zip(fila, v)) for fila in m)\n'
    },
    {
      id: 'e2',
      title: 'Rotar alrededor de Z',
      prompt: 'Escribe `rotar_z(v, grados)`: rota un vector 3D alrededor del eje Z.\n\nLa matriz es:\n```\n| cos  −sin  0 |\n| sin   cos  0 |\n|  0     0   1 |\n```\nRecuerda convertir los grados a radianes.',
      setup: SETUP,
      starter: 'import math\n\ndef rotar_z(v, grados):\n    pass\n',
      tests: [
        { check: '_cerca(rotar_z((1, 0, 0), 90), (0, 1, 0))', msg: 'X rotado 90° es Y' },
        { check: '_cerca(rotar_z((1, 0, 5), 180), (-1, 0, 5))', msg: '180°: X pasa a −X; la Z no cambia' },
        { check: '_cerca(rotar_z((0, 2, 0), -90), (2, 0, 0))', msg: 'con ángulos negativos gira al otro lado' }
      ],
      hints: ['`t = math.radians(grados)`; `c, s = math.cos(t), math.sin(t)`.', '`m = [[c, -s, 0], [s, c, 0], [0, 0, 1]]` y multiplica por `v`.'],
      solution: 'import math\n\ndef rotar_z(v, grados):\n    t = math.radians(grados)\n    c, s = math.cos(t), math.sin(t)\n    m = [[c, -s, 0], [s, c, 0], [0, 0, 1]]\n    return tuple(sum(a * b for a, b in zip(fila, v)) for fila in m)\n'
    },
    {
      id: 'e3',
      title: 'Matriz por matriz',
      prompt: 'Escribe `mul_mat(a, b)` para dos matrices cuadradas del mismo tamaño. Devuelve una lista de filas.\n\nEl elemento `[i][j]` del resultado es el producto escalar de la **fila i** de `a` con la **columna j** de `b`.',
      setup: SETUP,
      starter: 'def mul_mat(a, b):\n    pass\n',
      tests: [
        { check: 'mul_mat([[1, 2], [3, 4]], [[5, 6], [7, 8]]) == [[19, 22], [43, 50]]', msg: '[[1,2],[3,4]] × [[5,6],[7,8]] = [[19,22],[43,50]]' },
        { check: 'mul_mat([[1, 0], [0, 1]], [[2, 3], [4, 5]]) == [[2, 3], [4, 5]]', msg: 'identidad × M = M' },
        { check: 'mul_mat([[0, 1], [1, 0]], [[1, 2], [3, 4]]) != mul_mat([[1, 2], [3, 4]], [[0, 1], [1, 0]])', msg: 'A × B ≠ B × A (el orden importa)' }
      ],
      hints: ['Columnas de b: `cols = list(zip(*b))`.', '`[[sum(x * y for x, y in zip(fila, col)) for col in cols] for fila in a]`'],
      solution: 'def mul_mat(a, b):\n    cols = list(zip(*b))\n    return [[sum(x * y for x, y in zip(fila, col)) for col in cols] for fila in a]\n',
      explain: '`zip(*b)` «transpone» la matriz: convierte columnas en filas. Es un truco muy útil de Python.'
    }
  ],

  summary: [
    'Una matriz transforma vectores; cada componente es fila · vector.',
    'Multiplicar matrices = encadenar transformaciones, y el orden importa.',
    'Maya usa 4×4 con vectores fila: la traslación va en la última fila.'
  ]
});
})();
