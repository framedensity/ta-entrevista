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
  id: 'v02',
  title: 'Magnitud y normalización',
  en: 'length & normalize',

  explain: [
    'La **magnitud** (length / magnitude) de un vector es lo que mide la flecha. **Normalizar** (normalize) es dejar la flecha con la misma dirección pero con longitud **1**.',
    { type: 'analogy', text: 'normalizar es como quedarte solo con la brújula: «hacia el noreste», sin importar si son 2 metros o 2 kilómetros.' },
    '### Longitud: Pitágoras',
    'En 2D, el vector `(3, 4)` mide `√(3² + 4²) = √25 = 5`. En 3D se añade la z: `√(x² + y² + z²)`.',
    { type: 'viz', name: 'normalize' },
    '### Normalizar',
    'Divide cada componente por la longitud: `(3, 4) / 5 = (0.6, 0.8)`. Un vector de longitud 1 se llama **vector unitario** (unit vector).',
    { type: 'warn', text: 'el vector `(0, 0, 0)` no tiene dirección: normalizarlo divide por cero. Una buena función lo comprueba y avisa (o devuelve cero, según lo que acuerde el equipo).' },
    '### Distancia',
    'La distancia entre dos puntos es la longitud de su resta: `longitud(b - a)`.',
    { type: 'tip', text: 'truco de rendimiento: para **comparar** distancias no hace falta la raíz. Si `d² < radio²`, entonces `d < radio`. Con miles de objetos se nota, y en la entrevista queda muy bien mencionarlo.' },
    { type: 'cg', text: 'para mover algo a velocidad constante hacia un objetivo, se normaliza la dirección y se multiplica por la velocidad. Sin normalizar, los objetos lejanos irían más rápido.' }
  ],

  example: {
    intro: 'Longitud, normalización y distancia.',
    lines: [
      { code: 'import math', note: 'Para `math.sqrt` (raíz cuadrada).' },
      { code: 'def longitud(v):\n    return math.sqrt(sum(c * c for c in v))', note: 'Pitágoras para cualquier número de dimensiones.' },
      { code: 'def normalizar(v):\n    l = longitud(v)\n    if l == 0:\n        raise ValueError("No se puede normalizar un vector cero")\n    return tuple(c / l for c in v)', note: 'Comprobamos el cero antes de dividir.' },
      { code: 'print(longitud((3, 4, 0)), normalizar((3, 4, 0)))', note: 'Longitud 5; dirección (0.6, 0.8, 0).' }
    ],
    output: '5.0 (0.6, 0.8, 0.0)'
  },

  mini: [
    {
      q: '¿Cuál es la longitud de `(0, 3, 4)`?',
      options: ['7', '5', '25'],
      answer: 1,
      why: '`√(0 + 9 + 16) = √25 = 5`.'
    },
    {
      q: 'Tienes 5 000 enemigos y quieres saber cuáles están a menos de 10 unidades. ¿Qué es más eficiente?',
      options: ['Calcular la raíz de cada distancia y comparar con 10', 'Comparar la distancia **al cuadrado** con 100', 'Normalizar todas las posiciones'],
      answer: 1,
      why: 'Si `d² < 100` entonces `d < 10`. Te ahorras 5 000 raíces cuadradas.'
    }
  ],
  extra: [
    {
      q: '¿Qué longitud tiene un vector normalizado?',
      options: ['0', '1', 'Depende del vector'],
      answer: 1,
      why: 'Normalizar significa dejarlo con longitud 1 (vector unitario).'
    }
  ],

  exercises: [
    {
      id: 'e1',
      title: 'Longitud y distancia',
      prompt: 'Escribe `longitud(v)` y `distancia(a, b)` para vectores 3D.',
      setup: SETUP,
      starter: 'import math\n\ndef longitud(v):\n    pass\n\ndef distancia(a, b):\n    pass\n',
      tests: [
        { check: '_cerca(longitud((3, 4, 0)), 5)', msg: 'longitud((3,4,0)) es 5' },
        { check: '_cerca(longitud((1, 2, 2)), 3)', msg: 'longitud((1,2,2)) es 3' },
        { check: '_cerca(distancia((1, 1, 1), (4, 5, 1)), 5)', msg: 'distancia((1,1,1), (4,5,1)) es 5' }
      ],
      hints: ['`math.sqrt(x*x + y*y + z*z)`', 'distancia = longitud de la resta: `longitud(tuple(q - p for p, q in zip(a, b)))`.'],
      solution: 'import math\n\ndef longitud(v):\n    return math.sqrt(sum(c * c for c in v))\n\ndef distancia(a, b):\n    return longitud(tuple(q - p for p, q in zip(a, b)))\n'
    },
    {
      id: 'e2',
      title: 'Normalizar con seguridad',
      prompt: 'Escribe `normalizar(v)`. Si la longitud es 0, lanza `ValueError`.',
      setup: SETUP + 'def _raises(fn, exc):\n    try:\n        fn()\n    except exc:\n        return True\n    except Exception:\n        return False\n    return False\n',
      starter: 'import math\n\ndef normalizar(v):\n    pass\n',
      tests: [
        { check: '_cerca(normalizar((3, 4, 0)), (0.6, 0.8, 0))', msg: 'normalizar((3,4,0)) da (0.6, 0.8, 0)' },
        { check: '_cerca(normalizar((0, 0, -7)), (0, 0, -1))', msg: 'normalizar((0,0,-7)) da (0, 0, -1)' },
        { check: '_raises(lambda: normalizar((0, 0, 0)), ValueError)', msg: 'con (0,0,0) lanza ValueError' }
      ],
      hints: ['Calcula la longitud `l` primero.', '`if l == 0: raise ValueError("vector cero")`', '`return tuple(c / l for c in v)`'],
      solution: 'import math\n\ndef normalizar(v):\n    l = math.sqrt(sum(c * c for c in v))\n    if l == 0:\n        raise ValueError("No se puede normalizar un vector cero")\n    return tuple(c / l for c in v)\n'
    },
    {
      id: 'e3',
      title: 'Quién está cerca (sin raíces)',
      prompt: 'Escribe `cercanos(centro, objetos, radio)`. `objetos` es un diccionario `{nombre: posicion}`. Devuelve una **lista ordenada** con los nombres a una distancia **menor o igual** que `radio`.\n\nNo uses `math.sqrt`: compara distancias al cuadrado.',
      setup: SETUP,
      starter: 'def cercanos(centro, objetos, radio):\n    pass\n',
      tests: [
        { check: "cercanos((0, 0, 0), {'a': (1, 0, 0), 'b': (6, 0, 0), 'c': (0, 3, 4)}, 5) == ['a', 'c']", msg: 'a (distancia 1) y c (distancia 5, justo en el borde) están dentro; b (6) no' },
        { check: "cercanos((10, 0, 0), {'x': (0, 0, 0)}, 3) == []", msg: 'si nadie está cerca, lista vacía' },
        { check: "'sqrt' not in _codigo", msg: 'no usa sqrt' }
      ],
      hints: ['`r2 = radio * radio`', 'Para cada objeto: `d2 = sum((p - c) ** 2 for p, c in zip(pos, centro))`.', '`sorted(n for n, pos in objetos.items() if d2(pos) <= r2)`'],
      solution: 'def cercanos(centro, objetos, radio):\n    r2 = radio * radio\n    def d2(pos):\n        return sum((p - c) ** 2 for p, c in zip(pos, centro))\n    return sorted(n for n, pos in objetos.items() if d2(pos) <= r2)\n',
      explain: 'Con miles de objetos, quitar la raíz cuadrada es una optimización real que se usa en juegos y herramientas.'
    }
  ],

  summary: [
    'Longitud = √(x² + y² + z²); distancia = longitud de la resta.',
    'Normalizar = dividir por la longitud (resultado de longitud 1); cuidado con el vector cero.',
    'Para comparar distancias, usa los cuadrados y evita la raíz.'
  ]
});
})();
