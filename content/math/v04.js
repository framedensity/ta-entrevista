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
  id: 'v04',
  title: 'Producto vectorial',
  en: 'cross product',

  explain: [
    'El **producto vectorial** (cross product) de dos vectores 3D da **otro vector**, perpendicular a los dos.',
    { type: 'analogy', text: 'pon dos lápices sobre la mesa formando un ángulo. El producto vectorial es un tercer lápiz clavado hacia arriba (o hacia abajo), perpendicular a la mesa.' },
    { type: 'viz', name: 'cross' },
    '### La fórmula',
    '```\na × b = (ay·bz − az·by,\n         az·bx − ax·bz,\n         ax·by − ay·bx)\n```',
    '### Tres propiedades',
    '- **Perpendicular** a `a` y a `b`.\n- **El orden importa**: `b × a = −(a × b)`. Cambiar el orden da la vuelta al resultado.\n- **Longitud** = área del paralelogramo que forman. Si son paralelos, da `(0, 0, 0)`.',
    '### Regla de la mano derecha',
    'Maya usa un sistema de **mano derecha** (right-handed): `X × Y = Z`. Apunta los dedos en `a`, dóblalos hacia `b`, y el pulgar señala `a × b`.',
    { type: 'cg', text: 'la **normal** de un triángulo es el producto vectorial de dos de sus lados. También sirve para construir los ejes de una cámara o de un joint: con la dirección «hacia delante» y «arriba», el producto vectorial te da «derecha».' },
    { type: 'tip', text: 'diferencia rápida para la entrevista: el **escalar** da un número (¿cuánto se parecen?), el **vectorial** da un vector perpendicular (¿qué eje es perpendicular a los dos?).' }
  ],

  example: {
    intro: 'La normal de un triángulo en el suelo.',
    lines: [
      { code: 'def cruz(a, b):\n    return (a[1]*b[2] - a[2]*b[1],\n            a[2]*b[0] - a[0]*b[2],\n            a[0]*b[1] - a[1]*b[0])', note: 'La fórmula, componente a componente.' },
      { code: 'p0, p1, p2 = (0, 0, 0), (0, 0, 1), (1, 0, 0)', note: 'Tres vértices en el plano del suelo (y = 0).' },
      { code: 'lado1 = tuple(b - a for a, b in zip(p0, p1))\nlado2 = tuple(b - a for a, b in zip(p0, p2))', note: 'Dos lados que salen del mismo vértice.' },
      { code: 'print(cruz(lado1, lado2))', note: 'La normal apunta hacia arriba (+Y).' }
    ],
    output: '(0, 1, 0)'
  },

  mini: [
    {
      q: '¿Qué devuelve el producto vectorial?',
      options: ['Un número', 'Un vector perpendicular a los dos', 'El ángulo entre ellos'],
      answer: 1,
      why: 'El escalar da un número; el vectorial, un vector perpendicular.'
    },
    {
      q: 'Si `a × b = (0, 0, 1)`, ¿cuánto vale `b × a`?',
      options: ['`(0, 0, 1)`', '`(0, 0, -1)`', '`(0, 0, 0)`'],
      answer: 1,
      why: 'Cambiar el orden da la vuelta al resultado.'
    }
  ],
  extra: [
    {
      q: '¿Qué da el producto vectorial de dos vectores paralelos?',
      options: ['Un vector unitario', 'El vector cero', 'Uno de los dos vectores'],
      answer: 1,
      why: 'No forman ningún paralelogramo: el área (la longitud) es 0.'
    }
  ],

  exercises: [
    {
      id: 'e1',
      title: 'Producto vectorial',
      prompt: 'Escribe `cruz(a, b)` para vectores 3D. Devuelve una tupla.',
      setup: SETUP,
      starter: 'def cruz(a, b):\n    pass\n',
      tests: [
        { check: 'cruz((1, 0, 0), (0, 1, 0)) == (0, 0, 1)', msg: 'X × Y = Z' },
        { check: 'cruz((0, 1, 0), (1, 0, 0)) == (0, 0, -1)', msg: 'Y × X = −Z' },
        { check: 'cruz((2, 3, 4), (5, 6, 7)) == (-3, 6, -3)', msg: '(2,3,4) × (5,6,7) = (-3, 6, -3)' }
      ],
      hints: ['Primera componente: `a[1]*b[2] - a[2]*b[1]`.', 'Segunda: `a[2]*b[0] - a[0]*b[2]`. Tercera: `a[0]*b[1] - a[1]*b[0]`.'],
      solution: 'def cruz(a, b):\n    return (a[1] * b[2] - a[2] * b[1],\n            a[2] * b[0] - a[0] * b[2],\n            a[0] * b[1] - a[1] * b[0])\n'
    },
    {
      id: 'e2',
      title: 'Normal de un triángulo',
      prompt: 'Escribe `normal(p0, p1, p2)`: la normal **unitaria** del triángulo, calculada como `(p1 − p0) × (p2 − p0)`, normalizada.\n\nYa tienes `cruz` escrita.',
      setup: SETUP,
      starter: 'import math\n\ndef cruz(a, b):\n    return (a[1] * b[2] - a[2] * b[1],\n            a[2] * b[0] - a[0] * b[2],\n            a[0] * b[1] - a[1] * b[0])\n\ndef normal(p0, p1, p2):\n    pass\n',
      tests: [
        { check: '_cerca(normal((0, 0, 0), (1, 0, 0), (0, 1, 0)), (0, 0, 1))', msg: 'triángulo en el plano XY: normal (0, 0, 1)' },
        { check: '_cerca(normal((0, 0, 0), (2, 0, 0), (0, 0, 2)), (0, -1, 0))', msg: 'el resultado está normalizado (longitud 1)' },
        { check: '_cerca(normal((1, 1, 1), (2, 1, 1), (1, 2, 1)), (0, 0, 1))', msg: 'funciona fuera del origen' }
      ],
      hints: ['`l1 = [b - a for a, b in zip(p0, p1)]`, igual para `l2` con `p2`.', '`n = cruz(l1, l2)`, luego divide por su longitud.'],
      solution: 'import math\n\ndef cruz(a, b):\n    return (a[1] * b[2] - a[2] * b[1],\n            a[2] * b[0] - a[0] * b[2],\n            a[0] * b[1] - a[1] * b[0])\n\ndef normal(p0, p1, p2):\n    l1 = [b - a for a, b in zip(p0, p1)]\n    l2 = [b - a for a, b in zip(p0, p2)]\n    n = cruz(l1, l2)\n    l = math.sqrt(sum(c * c for c in n))\n    return tuple(c / l for c in n)\n'
    },
    {
      id: 'e3',
      title: 'Área de un triángulo',
      prompt: 'Escribe `area(p0, p1, p2)`. La longitud del producto vectorial de dos lados es el área del **paralelogramo**; el triángulo es la mitad.\n\nÚtil para detectar triángulos degenerados (área casi 0) en un verificador de mallas.',
      setup: SETUP,
      starter: 'import math\n\ndef cruz(a, b):\n    return (a[1] * b[2] - a[2] * b[1],\n            a[2] * b[0] - a[0] * b[2],\n            a[0] * b[1] - a[1] * b[0])\n\ndef area(p0, p1, p2):\n    pass\n',
      tests: [
        { check: '_cerca(area((0, 0, 0), (4, 0, 0), (0, 3, 0)), 6)', msg: 'triángulo rectángulo 4×3: área 6' },
        { check: '_cerca(area((0, 0, 0), (1, 1, 1), (2, 2, 2)), 0)', msg: 'tres puntos en línea: área 0 (degenerado)' }
      ],
      hints: ['Igual que la normal, pero sin normalizar.', '`return math.sqrt(sum(c*c for c in n)) / 2`'],
      solution: 'import math\n\ndef cruz(a, b):\n    return (a[1] * b[2] - a[2] * b[1],\n            a[2] * b[0] - a[0] * b[2],\n            a[0] * b[1] - a[1] * b[0])\n\ndef area(p0, p1, p2):\n    l1 = [b - a for a, b in zip(p0, p1)]\n    l2 = [b - a for a, b in zip(p0, p2)]\n    n = cruz(l1, l2)\n    return math.sqrt(sum(c * c for c in n)) / 2\n'
    }
  ],

  summary: [
    'a × b da un vector perpendicular a los dos (solo en 3D).',
    'El orden importa: b × a = −(a × b); mano derecha: X × Y = Z.',
    'Se usa para normales, áreas y para construir ejes (derecha a partir de delante y arriba).'
  ]
});
})();
