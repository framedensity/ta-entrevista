TA.add({
  id: 'p06',
  title: 'Patrón: comparar listas y diccionarios',
  en: 'diffing collections',

  explain: [
    'Comparar dos colecciones es **la tarea más común** de una herramienta de TA. ¿Qué falta? ¿Qué sobra? ¿Qué ha cambiado entre la versión 1 y la 2?',
    { type: 'analogy', text: 'es como comparar la lista de la compra con lo que hay en la nevera. Lo que está en la lista y no en la nevera, falta. Lo que está en la nevera y no en la lista, sobra.' },
    '### La forma lenta (y la que no debes dar en la entrevista)',
    { type: 'compare',
      badTitle: 'Bucle dentro de bucle: n × m comparaciones',
      bad: 'faltan = []\nfor x in esperados:\n    encontrado = False\n    for y in encontrados:\n        if x == y:\n            encontrado = True\n    if not encontrado:\n        faltan.append(x)',
      goodTitle: 'Con un set: n + m pasos',
      good: 'encontrados_set = set(encontrados)\nfaltan = [x for x in esperados if x not in encontrados_set]',
      note: 'Con 10 000 elementos en cada lista, la forma lenta hace 100 millones de comparaciones. La rápida, unas 20 000.' },
    'Fíjate en la versión rápida: usamos una **comprensión de lista** con `if x not in ...`. Así se **mantiene el orden** de `esperados`. Con `set(a) - set(b)` el orden se pierde.',
    '### Comparar diccionarios',
    'Las claves de un diccionario se comportan como un conjunto. Puedes hacer `d1.keys() & d2.keys()` directamente.',
    '- Claves **nuevas**: `d2.keys() - d1.keys()`\n- Claves **borradas**: `d1.keys() - d2.keys()`\n- Claves con valor **cambiado**: las comunes donde `d1[k] != d2[k]`',
    { type: 'cg', text: 'comparar los atributos de un rig entre dos versiones: `{"ikFk": 1, "stretch": 0}` contra `{"ikFk": 0, "stretch": 0, "twist": 1}`. Cambió `ikFk` y apareció `twist`.' },
    { type: 'tip', text: 'menciona siempre la complejidad: «Convierto la segunda lista en set para que la búsqueda sea O(1), así todo el proceso es O(n + m) en vez de O(n × m)».' }
  ],

  example: {
    intro: 'Comparamos los atributos de un control entre dos versiones del rig.',
    lines: [
      { code: 'v1 = {"ikFk": 1, "stretch": 0, "space": "world"}', note: 'Versión anterior.' },
      { code: 'v2 = {"ikFk": 0, "stretch": 0, "twist": 1}', note: 'Versión nueva.' },
      { code: 'nuevas = sorted(v2.keys() - v1.keys())', note: 'Claves que solo están en v2 → `["twist"]`.' },
      { code: 'borradas = sorted(v1.keys() - v2.keys())', note: 'Claves que solo están en v1 → `["space"]`.' },
      { code: 'cambiadas = {k: (v1[k], v2[k]) for k in v1.keys() & v2.keys() if v1[k] != v2[k]}', note: 'Recorremos solo las claves comunes y guardamos (antes, después) si el valor cambió.' },
      { code: 'print(nuevas, borradas, cambiadas)', note: 'Resultado del «diff».' }
    ],
    output: "['twist'] ['space'] {'ikFk': (1, 0)}"
  },

  mini: [
    {
      q: '`esperados` y `encontrados` tienen 10 000 nombres cada uno. ¿Cuál es la mejor forma de saber qué falta, **manteniendo el orden** de `esperados`?',
      options: ['Dos bucles `for` anidados', '`sorted(set(esperados) - set(encontrados))`', '`s = set(encontrados)` y `[x for x in esperados if x not in s]`'],
      answer: 2,
      why: 'Es rápido (el `in` es contra un set) y mantiene el orden original. La opción con `sorted` cambia el orden a alfabético.'
    },
    {
      q: '¿Qué devuelve `{"a": 1, "b": 2}.keys() & {"b": 5, "c": 3}.keys()`?',
      options: ['`{"b"}`', '`{"a", "b", "c"}`', 'Un error: las claves no son un conjunto'],
      answer: 0,
      why: 'Las vistas de claves (`.keys()`) admiten operaciones de conjuntos. La clave común es `"b"`.'
    }
  ],
  extra: [
    {
      q: '¿Qué complejidad tiene comparar dos listas con dos bucles anidados?',
      options: ['O(n + m)', 'O(n × m)', 'O(1)'],
      answer: 1,
      why: 'Por cada elemento de la primera lista se recorre toda la segunda: n × m.'
    }
  ],

  exercises: [
    {
      id: 'e1',
      title: 'Función de comparación',
      prompt: 'Escribe la función `comparar(esperados, encontrados)`. Debe devolver **dos listas ordenadas**: `(faltan, sobran)`.\n\n- `faltan`: están en `esperados` pero no en `encontrados`.\n- `sobran`: están en `encontrados` pero no en `esperados`.',
      starter: 'def comparar(esperados, encontrados):\n    # tu código\n    pass\n',
      tests: [
        { check: "comparar(['a', 'b', 'c'], ['b', 'c', 'd']) == (['a'], ['d'])", msg: "comparar(['a','b','c'], ['b','c','d']) da (['a'], ['d'])" },
        { check: "comparar(['x'], ['x']) == ([], [])", msg: 'si son iguales, devuelve dos listas vacías' },
        { check: "comparar(['c', 'a'], []) == (['a', 'c'], [])", msg: 'las listas salen ordenadas' }
      ],
      hints: ['Convierte las dos a `set` al principio.', '`return sorted(e - f), sorted(f - e)`'],
      solution: 'def comparar(esperados, encontrados):\n    e = set(esperados)\n    f = set(encontrados)\n    return sorted(e - f), sorted(f - e)\n'
    },
    {
      id: 'e2',
      title: 'Faltan, en el orden del guion',
      prompt: 'Crea `faltan`: las tomas del guion que no se han exportado, **en el mismo orden que en el guion** (no alfabético).',
      starter: 'guion = ["sh050", "sh010", "sh030", "sh020", "sh040"]\nexportadas = ["sh010", "sh040", "sh099"]\n\n',
      tests: [{ check: "faltan == ['sh050', 'sh030', 'sh020']", msg: '`faltan` mantiene el orden del guion' }],
      hints: ['Primero `hechas = set(exportadas)`.', 'Luego una comprensión: `[t for t in guion if t not in hechas]`.'],
      solution: 'guion = ["sh050", "sh010", "sh030", "sh020", "sh040"]\nexportadas = ["sh010", "sh040", "sh099"]\n\nhechas = set(exportadas)\nfaltan = [t for t in guion if t not in hechas]\n'
    },
    {
      id: 'e3',
      title: 'Qué ha cambiado en el rig',
      prompt: 'Crea `cambiadas`: un diccionario con las claves **comunes** cuyo valor cambió. El valor debe ser la pareja `(antes, después)`.\n\nCrea también `nuevas` (lista ordenada de claves que solo están en `v2`).',
      starter: 'v1 = {"ikFk": 1, "stretch": 0, "squash": 1, "space": "world"}\nv2 = {"ikFk": 0, "stretch": 0, "squash": 0, "twist": 1}\n\n',
      tests: [
        { check: "cambiadas == {'ikFk': (1, 0), 'squash': (1, 0)}", msg: '`cambiadas` tiene ikFk y squash con (antes, después)' },
        { check: "nuevas == ['twist']", msg: '`nuevas` es ["twist"]' }
      ],
      hints: ['Las claves comunes son `v1.keys() & v2.keys()`.', '`{k: (v1[k], v2[k]) for k in v1.keys() & v2.keys() if v1[k] != v2[k]}`'],
      solution: 'v1 = {"ikFk": 1, "stretch": 0, "squash": 1, "space": "world"}\nv2 = {"ikFk": 0, "stretch": 0, "squash": 0, "twist": 1}\n\ncambiadas = {k: (v1[k], v2[k]) for k in v1.keys() & v2.keys() if v1[k] != v2[k]}\nnuevas = sorted(v2.keys() - v1.keys())\n'
    }
  ],

  summary: [
    'Para comparar, convierte una colección en `set`: O(n + m) en vez de O(n × m).',
    'Para mantener el orden: `[x for x in a if x not in set_b]`.',
    'En diccionarios: `d.keys()` admite `&`, `-`, `|`; compara valores solo en las claves comunes.'
  ]
});
