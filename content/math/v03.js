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
  id: 'v03',
  title: 'Producto escalar',
  en: 'dot product',

  explain: [
    'El **producto escalar** (dot product) de dos vectores da **un solo número**. Ese número dice cuánto apuntan en la misma dirección.',
    { type: 'analogy', text: 'es como medir cuánto te ayuda el viento: si sopla en tu dirección, ayuda mucho (positivo); si sopla de lado, nada (cero); si sopla de frente, te frena (negativo).' },
    '### La fórmula',
    '`a · b = ax·bx + ay·by + az·bz`. Se multiplica componente a componente y se suma.',
    'También es igual a `|a| · |b| · cos(θ)`, donde θ es el ángulo entre ellos. Con vectores **normalizados**, el producto escalar es directamente el **coseno del ángulo**.',
    { type: 'viz', name: 'dot' },
    '### Cómo leer el resultado',
    '- **Positivo**: menos de 90° entre ellos (más o menos la misma dirección).\n- **Cero**: perpendiculares (90°).\n- **Negativo**: más de 90° (direcciones opuestas).\n- Con vectores unitarios: **1** = misma dirección, **-1** = opuestas.',
    { type: 'cg', text: '¿el enemigo está delante o detrás del jugador? `dot(enemigo - jugador, mirada)`. Si es positivo, está delante. Así funcionan muchos conos de visión y comprobaciones de «la cámara ve al personaje».' },
    { type: 'tip', text: 'pregunta clásica de entrevista: «¿cómo sabes si un objeto está delante de la cámara?». Respuesta: el producto escalar entre la dirección de la cámara y el vector hacia el objeto; si es positivo, está delante.' }
  ],

  example: {
    intro: '¿Está el enemigo delante del jugador?',
    lines: [
      { code: 'def punto(a, b):\n    return sum(x * y for x, y in zip(a, b))', note: 'Producto escalar: multiplicar y sumar.' },
      { code: 'jugador = (0, 0, 0)\nmirada = (0, 0, 1)', note: 'El jugador mira hacia +Z.' },
      { code: 'enemigo = (2, 0, 5)', note: 'Un enemigo delante y un poco a la derecha.' },
      { code: 'hacia = tuple(e - j for e, j in zip(enemigo, jugador))', note: 'Vector del jugador al enemigo: (2, 0, 5).' },
      { code: 'print(punto(hacia, mirada) > 0)', note: '`2·0 + 0·0 + 5·1 = 5`, positivo: está delante.' }
    ],
    output: 'True'
  },

  mini: [
    {
      q: '¿Cuánto vale `(1, 0, 0) · (0, 1, 0)`?',
      options: ['1', '0', '-1'],
      answer: 1,
      why: 'Son perpendiculares: `1·0 + 0·1 + 0·0 = 0`.'
    },
    {
      q: 'Dos vectores **unitarios** tienen producto escalar `-1`. ¿Qué significa?',
      options: ['Son perpendiculares', 'Apuntan en direcciones opuestas', 'Uno de ellos es cero'],
      answer: 1,
      why: 'Con vectores unitarios, el producto escalar es el coseno del ángulo. cos(180°) = -1.'
    }
  ],
  extra: [
    {
      q: '¿Qué devuelve el producto escalar?',
      options: ['Un vector', 'Un número', 'Una matriz'],
      answer: 1,
      why: 'Por eso se llama **escalar**: el resultado es un solo número.'
    },
    {
      q: 'Para calcular el ángulo entre dos vectores con el producto escalar, ¿qué tienes que hacer antes?',
      options: ['Nada', 'Normalizarlos (o dividir por sus longitudes)', 'Sumarlos'],
      answer: 1,
      why: '`cos θ = a·b / (|a|·|b|)`. Si ya son unitarios, `cos θ = a·b`.'
    }
  ],

  exercises: [
    {
      id: 'e1',
      title: 'Producto escalar',
      prompt: 'Escribe `punto(a, b)` para vectores de cualquier tamaño.',
      setup: SETUP,
      starter: 'def punto(a, b):\n    pass\n',
      tests: [
        { check: 'punto((1, 2, 3), (4, 5, 6)) == 32', msg: '(1,2,3)·(4,5,6) = 32' },
        { check: 'punto((1, 0, 0), (0, 1, 0)) == 0', msg: 'perpendiculares dan 0' },
        { check: 'punto((1, 0), (-1, 0)) == -1', msg: 'funciona en 2D: opuestos dan -1' }
      ],
      hints: ['`sum(x * y for x, y in zip(a, b))`'],
      solution: 'def punto(a, b):\n    return sum(x * y for x, y in zip(a, b))\n'
    },
    {
      id: 'e2',
      title: '¿Delante o detrás?',
      prompt: 'Escribe `delante(objeto, observador, mirada)`. Devuelve `True` si `objeto` está delante del observador (producto escalar mayor que 0).\n\n`objeto` y `observador` son posiciones; `mirada` es la dirección en la que mira.',
      setup: SETUP,
      starter: 'def delante(objeto, observador, mirada):\n    pass\n',
      tests: [
        { check: 'delante((2, 0, 5), (0, 0, 0), (0, 0, 1)) is True', msg: '(2,0,5) está delante de quien mira hacia +Z' },
        { check: 'delante((0, 0, -3), (0, 0, 0), (0, 0, 1)) is False', msg: '(0,0,-3) está detrás' },
        { check: 'delante((10, 0, 0), (8, 0, 0), (-1, 0, 0)) is False', msg: 'funciona cuando el observador no está en el origen' }
      ],
      hints: ['Primero el vector hacia el objeto: `objeto - observador`.', 'Luego `sum(h * m for h, m in zip(hacia, mirada)) > 0`.'],
      solution: 'def delante(objeto, observador, mirada):\n    hacia = [o - b for o, b in zip(objeto, observador)]\n    return sum(h * m for h, m in zip(hacia, mirada)) > 0\n'
    },
    {
      id: 'e3',
      title: 'Ángulo entre vectores',
      prompt: 'Escribe `angulo(a, b)`: el ángulo en **grados** entre dos vectores (no tienen por qué ser unitarios).\n\nUsa `cos θ = a·b / (|a|·|b|)`. Cuidado: por errores de redondeo el coseno puede salir 1.0000001; limítalo a [-1, 1] antes de `math.acos`.',
      setup: SETUP,
      starter: 'import math\n\ndef angulo(a, b):\n    pass\n',
      tests: [
        { check: '_cerca(angulo((1, 0, 0), (0, 1, 0)), 90)', msg: 'X e Y forman 90°' },
        { check: '_cerca(angulo((1, 0, 0), (1, 1, 0)), 45)', msg: '(1,0,0) y (1,1,0) forman 45°' },
        { check: '_cerca(angulo((2, 0, 0), (5, 0, 0)), 0)', msg: 'misma dirección: 0° (sin error de dominio)' },
        { check: '_cerca(angulo((0, 0, 1), (0, 0, -3)), 180)', msg: 'opuestos: 180°' }
      ],
      hints: ['`la = math.sqrt(sum(c*c for c in a))`, igual para b.', '`c = max(-1.0, min(1.0, punto / (la * lb)))`', '`return math.degrees(math.acos(c))`'],
      solution: 'import math\n\ndef angulo(a, b):\n    d = sum(x * y for x, y in zip(a, b))\n    la = math.sqrt(sum(c * c for c in a))\n    lb = math.sqrt(sum(c * c for c in b))\n    c = max(-1.0, min(1.0, d / (la * lb)))\n    return math.degrees(math.acos(c))\n',
      explain: 'Limitar el coseno a [-1, 1] evita un `ValueError: math domain error` que aparece en producción con vectores casi paralelos.'
    }
  ],

  summary: [
    'a · b = suma de productos; da un número.',
    'Positivo = misma dirección, 0 = perpendiculares, negativo = opuestos.',
    'Con unitarios es el coseno del ángulo: sirve para «delante/detrás» y conos de visión.'
  ]
});
})();
