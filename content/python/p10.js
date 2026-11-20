TA.add({
  id: 'p10',
  title: 'Funciones bien hechas',
  en: 'functions & arguments',

  explain: [
    'Una herramienta de TA es, sobre todo, un conjunto de funciones pequeñas que se pueden probar por separado. Escribir **buenas** funciones es lo que separa un script de una herramienta.',
    { type: 'analogy', text: 'una función es una receta: tiene ingredientes (parámetros), unos pasos y un plato final (`return`). Una buena receta funciona en cualquier cocina, no solo en la tuya.' },
    '### return, no print',
    'Una función que hace `print` solo sirve para mirar. Una función que hace `return` sirve para **usar el resultado** en otra parte del código.',
    '### Parámetros por defecto y por nombre',
    '```python\ndef exportar(toma, formato="fbx", incluir_camara=True):\n    ...\n\nexportar("sh010")                      # usa los valores por defecto\nexportar("sh010", incluir_camara=False)  # por nombre: se lee mejor\n```',
    '### La trampa más famosa: el valor por defecto mutable',
    'El valor por defecto se crea **una sola vez**, cuando se define la función. Si es una lista, ¡todas las llamadas comparten la misma lista!',
    { type: 'compare',
      badTitle: 'La lista se comparte entre llamadas',
      bad: 'def anadir(toma, lista=[]):\n    lista.append(toma)\n    return lista\n\nanadir("sh010")  # ["sh010"]\nanadir("sh020")  # ["sh010", "sh020"]  ← ¡sorpresa!',
      goodTitle: 'Usa None y crea la lista dentro',
      good: 'def anadir(toma, lista=None):\n    if lista is None:\n        lista = []\n    lista.append(toma)\n    return lista' },
    { type: 'tip', text: 'esta trampa es pregunta de entrevista habitual. Explica el «por qué»: el valor por defecto se evalúa al definir la función, no al llamarla.' },
    '### Devolver varias cosas',
    'Con `return a, b` devuelves una **tupla**. Al llamar, la desempaquetas: `minimo, maximo = rango(frames)`.',
    { type: 'cg', text: 'separa «calcular» de «actuar»: una función decide qué hay que renombrar (y devuelve la lista); otra lo hace. Así puedes probar la primera sin tocar la escena.' }
  ],

  example: {
    intro: 'Una función pequeña, con valor por defecto y docstring.',
    lines: [
      { code: 'def duracion(inicio, fin, incluir_fin=True):\n    """Frames entre inicio y fin."""\n    d = fin - inicio\n    return d + 1 if incluir_fin else d', note: 'El texto entre `"""` es la **docstring**: explica qué hace. `x if cond else y` elige un valor en una línea.' },
      { code: 'print(duracion(1001, 1048))', note: 'Usa el valor por defecto: 48.' },
      { code: 'print(duracion(1001, 1048, incluir_fin=False))', note: 'Por nombre: se entiende sin mirar la definición. 47.' },
      { code: 'def rango(frames):\n    return min(frames), max(frames)', note: 'Devuelve una tupla de dos valores.' },
      { code: 'lo, hi = rango([1010, 1001, 1048])\nprint(lo, hi)', note: 'Desempaquetamos la tupla en dos variables.' }
    ],
    output: '48\n47\n1001 1048'
  },

  mini: [
    {
      q: '¿Qué imprime la segunda llamada?',
      code: 'def f(x, l=[]):\n    l.append(x)\n    return l\nf(1)\nprint(f(2))',
      options: ['`[2]`', '`[1, 2]`', 'Un error'],
      answer: 1,
      why: 'La lista por defecto se creó una vez y se reutiliza. Por eso hay que usar `l=None`.'
    },
    {
      q: '¿Por qué es mejor `return` que `print` en una función de herramienta?',
      options: ['`print` es más lento', 'Con `return`, el resultado se puede usar y probar desde otro código', 'No hay diferencia'],
      answer: 1,
      why: 'Lo que se imprime solo lo ve una persona. Lo que se devuelve lo puede usar el resto del programa (y los tests).'
    }
  ],

  exercises: [
    {
      id: 'e1',
      title: 'Nombre de exportación',
      prompt: 'Escribe `nombre_export(toma, version, ext="fbx")` que devuelva `"sh010_v003.fbx"` para `("sh010", 3)`. La versión siempre tiene 3 dígitos.',
      starter: 'def nombre_export(toma, version, ext="fbx"):\n    # tu código\n    pass\n',
      tests: [
        { check: "nombre_export('sh010', 3) == 'sh010_v003.fbx'", msg: 'nombre_export("sh010", 3) da "sh010_v003.fbx"' },
        { check: "nombre_export('sh020', 12, ext='abc') == 'sh020_v012.abc'", msg: 'acepta otra extensión por nombre' }
      ],
      hints: ['En un f-string, `{version:03d}` rellena con ceros hasta 3 dígitos.', '`return f"{toma}_v{version:03d}.{ext}"`'],
      solution: 'def nombre_export(toma, version, ext="fbx"):\n    return f"{toma}_v{version:03d}.{ext}"\n'
    },
    {
      id: 'e2',
      title: 'Arregla la trampa',
      prompt: 'Esta función tiene el error de la lista compartida. Arréglala para que cada llamada sin `lista` empiece con una lista nueva.',
      starter: 'def anadir_toma(toma, lista=[]):\n    lista.append(toma)\n    return lista\n',
      tests: [
        { check: "anadir_toma('a') == ['a'] and anadir_toma('b') == ['b']", msg: 'dos llamadas seguidas no comparten la lista' },
        { check: "anadir_toma('c', ['x']) == ['x', 'c']", msg: 'si le pasas una lista, la usa' }
      ],
      hints: ['Cambia `lista=[]` por `lista=None`.', 'Dentro: `if lista is None: lista = []`.'],
      solution: 'def anadir_toma(toma, lista=None):\n    if lista is None:\n        lista = []\n    lista.append(toma)\n    return lista\n'
    },
    {
      id: 'e3',
      title: 'Estadísticas de una secuencia',
      prompt: 'Escribe `estadisticas(tomas)` que reciba `{toma: frames}` y devuelva **tres** valores: `(total, media, mas_larga)`. La media redondeada a 1 decimal con `round(x, 1)`.',
      starter: 'def estadisticas(tomas):\n    # tu código\n    pass\n',
      tests: [
        { check: "estadisticas({'a': 10, 'b': 30, 'c': 20}) == (60, 20.0, 'b')", msg: "estadisticas({'a':10,'b':30,'c':20}) da (60, 20.0, 'b')" },
        { check: "estadisticas({'x': 5, 'y': 6})[1] == 5.5", msg: 'la media es 5.5' }
      ],
      hints: ['`total = sum(tomas.values())`', '`return total, round(total / len(tomas), 1), max(tomas, key=tomas.get)`'],
      solution: 'def estadisticas(tomas):\n    total = sum(tomas.values())\n    media = round(total / len(tomas), 1)\n    mas_larga = max(tomas, key=tomas.get)\n    return total, media, mas_larga\n'
    }
  ],

  summary: [
    'Devuelve resultados con `return`; usa parámetros por defecto y por nombre para que se lea bien.',
    'Nunca uses `[]` o `{}` como valor por defecto: usa `None` y créalo dentro.',
    '`return a, b` devuelve una tupla que se desempaqueta: `a, b = f()`.'
  ]
});
