TA.add({
  id: 'p04',
  title: 'Recorrer diccionarios',
  en: 'items(), comprehensions, sorting',

  explain: [
    'Ya sabes crear un diccionario y leer una clave. Ahora vamos a **recorrerlo entero**: pasar por todas sus parejas una por una.',
    { type: 'analogy', text: 'recorrer un diccionario es como leer la agenda del móvil de arriba abajo: en cada línea ves el nombre **y** el teléfono a la vez.' },
    '### Tres formas de recorrer',
    '- `for clave in d:` → solo las claves.\n- `for valor in d.values():` → solo los valores.\n- `for clave, valor in d.items():` → las dos cosas a la vez. **Es la que más vas a usar.**',
    '```python\nfor toma, frames in tomas.items():\n    print(toma, frames)\n```',
    { type: 'compare',
      badTitle: 'Funciona, pero busca dos veces',
      bad: 'for toma in tomas:\n    frames = tomas[toma]\n    print(toma, frames)',
      goodTitle: 'Más claro con items()',
      good: 'for toma, frames in tomas.items():\n    print(toma, frames)' },
    '### Comprensión de diccionario (dict comprehension)',
    'Una **comprensión** crea un diccionario nuevo en una sola línea. Sirve para **filtrar** o **transformar**.',
    '```python\nlargas = {t: f for t, f in tomas.items() if f > 60}\n```',
    'Se lee así: «para cada toma `t` con frames `f`, guarda `t: f`, solo si `f > 60`».',
    '### Ordenar y buscar el máximo',
    'Un diccionario no se ordena solo. Pero puedes pedir sus claves ordenadas según el valor con `key=`.',
    '- `sorted(tomas, key=tomas.get)` → claves ordenadas de menor a mayor valor.\n- `max(tomas, key=tomas.get)` → la clave con el valor más grande.\n- `sum(tomas.values())` → suma de todos los valores.',
    { type: 'cg', text: 'una herramienta de cinemáticas recibe un diccionario `{toma: frames}` y tiene que decir cuánto dura la secuencia, qué tomas son largas y cuál es la más larga.' },
    { type: 'tip', text: 'si te piden «la clave con el valor más alto», la respuesta corta es `max(d, key=d.get)`. Saberla demuestra que conoces Python, no solo bucles.' }
  ],

  example: {
    intro: 'Tenemos la duración de cada toma de una secuencia.',
    lines: [
      { code: 'tomas = {"sh010": 48, "sh020": 96, "sh030": 72}', note: 'Clave = nombre de la toma. Valor = frames.' },
      { code: 'for toma, frames in tomas.items():\n    print(f"{toma}: {frames} frames")', note: '`.items()` da parejas. En cada vuelta, `toma` y `frames` reciben una pareja.' },
      { code: 'total = sum(tomas.values())', note: 'Sumamos solo los valores: 48 + 96 + 72 = 216.' },
      { code: 'largas = {t: f for t, f in tomas.items() if f > 60}', note: 'Comprensión: un diccionario nuevo solo con las tomas de más de 60 frames.' },
      { code: 'mas_larga = max(tomas, key=tomas.get)', note: '`key=tomas.get` le dice a `max` que compare los **valores**, no los nombres.' },
      { code: 'print(total, largas, mas_larga)', note: 'Mostramos los resultados.' }
    ],
    output: "sh010: 48 frames\nsh020: 96 frames\nsh030: 72 frames\n216 {'sh020': 96, 'sh030': 72} sh020",
    outro: 'Sin `key=`, `max(tomas)` compararía los **textos** de las claves y devolvería `"sh030"` (la última en orden alfabético). Error muy común.'
  },

  mini: [
    {
      q: '¿Qué da `for k, v in d.items():` en cada vuelta?',
      options: ['Solo la clave', 'Solo el valor', 'La clave y el valor a la vez'],
      answer: 2,
      why: '`.items()` da parejas (clave, valor). Las «desempaquetamos» en `k` y `v`.'
    },
    {
      q: 'Con `d = {"a": 5, "b": 9, "c": 1}`, ¿qué devuelve `max(d, key=d.get)`?',
      options: ['`9`', '`"b"`', '`"c"`'],
      answer: 1,
      why: 'Devuelve la **clave** cuyo valor es el mayor. El valor mayor es 9, y su clave es `"b"`.'
    }
  ],
  extra: [
    {
      q: '¿Qué devuelve `max({"sh010": 90, "sh030": 10})` (sin `key`)?',
      options: ['`"sh010"`', '`"sh030"`', '`90`'],
      answer: 1,
      why: 'Sin `key`, compara las claves como texto. `"sh030"` > `"sh010"` alfabéticamente.'
    }
  ],

  exercises: [
    {
      id: 'e1',
      title: 'Duración total',
      prompt: 'Crea `total` con la suma de los frames de todas las tomas. Usa `.values()`.',
      starter: 'tomas = {"sh010": 48, "sh020": 96, "sh030": 72, "sh040": 24}\n\n',
      tests: [{ check: 'total == 240', msg: '`total` vale 240' }],
      hints: ['`sum()` suma todo lo que le des.', '`total = sum(tomas.values())`'],
      solution: 'tomas = {"sh010": 48, "sh020": 96, "sh030": 72, "sh040": 24}\n\ntotal = sum(tomas.values())\n'
    },
    {
      id: 'e2',
      title: 'Solo las tomas cortas',
      prompt: 'Crea un diccionario `cortas` con las tomas de **menos de 50** frames. Usa una comprensión de diccionario.',
      starter: 'tomas = {"sh010": 48, "sh020": 96, "sh030": 72, "sh040": 24}\n\n',
      tests: [
        { check: "cortas == {'sh010': 48, 'sh040': 24}", msg: '`cortas` tiene sh010 y sh040 con sus frames' },
        { check: "tomas == {'sh010': 48, 'sh020': 96, 'sh030': 72, 'sh040': 24}", msg: 'no has modificado `tomas`' }
      ],
      hints: ['La forma es `{k: v for k, v in d.items() if condición}`.', '`cortas = {t: f for t, f in tomas.items() if f < 50}`'],
      solution: 'tomas = {"sh010": 48, "sh020": 96, "sh030": 72, "sh040": 24}\n\ncortas = {t: f for t, f in tomas.items() if f < 50}\n'
    },
    {
      id: 'e3',
      title: 'La más larga y el orden',
      prompt: 'Crea `mas_larga` con el **nombre** de la toma con más frames.\n\nCrea `orden` con la lista de nombres ordenada de **más larga a más corta**. (Pista: `sorted` tiene `reverse=True`.)',
      starter: 'tomas = {"sh010": 48, "sh020": 96, "sh030": 72, "sh040": 24}\n\n',
      tests: [
        { check: "mas_larga == 'sh020'", msg: '`mas_larga` es "sh020"' },
        { check: "orden == ['sh020', 'sh030', 'sh010', 'sh040']", msg: '`orden` va de la más larga a la más corta' }
      ],
      hints: ['`max(tomas, key=tomas.get)`', '`sorted(tomas, key=tomas.get, reverse=True)`'],
      solution: 'tomas = {"sh010": 48, "sh020": 96, "sh030": 72, "sh040": 24}\n\nmas_larga = max(tomas, key=tomas.get)\norden = sorted(tomas, key=tomas.get, reverse=True)\n'
    }
  ],

  summary: [
    '`for k, v in d.items():` recorre claves y valores a la vez.',
    '`{k: v for k, v in d.items() if ...}` filtra o transforma en una línea.',
    '`max(d, key=d.get)` y `sorted(d, key=d.get)` comparan por el **valor**.'
  ]
});
