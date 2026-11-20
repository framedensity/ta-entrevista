TA.add({
  id: 'p07',
  title: 'Patrón: encontrar duplicados',
  en: 'finding duplicates efficiently',

  explain: [
    'Nombres repetidos en una escena, dos tomas con el mismo número, un asset importado dos veces… Encontrar duplicados es otro clásico de entrevista.',
    { type: 'analogy', text: 'imagina que revisas entradas en la puerta de un concierto. Guardas en una caja cada número de entrada que ya pasó. Si llega uno que ya está en la caja, ¡es un duplicado!' },
    'Esa «caja de los ya vistos» es un **set**. Lo llamamos `vistos`.',
    { type: 'compare',
      badTitle: 'count() dentro de un bucle: recorre la lista n veces',
      bad: 'dups = []\nfor x in nombres:\n    if nombres.count(x) > 1 and x not in dups:\n        dups.append(x)',
      goodTitle: 'Un solo recorrido con un set de vistos',
      good: 'vistos = set()\ndups = set()\nfor x in nombres:\n    if x in vistos:\n        dups.add(x)\n    else:\n        vistos.add(x)',
      note: '`count()` recorre toda la lista cada vez: O(n²). El set de vistos lo hace en una pasada: O(n).' },
    '### Contar con Counter',
    'El módulo `collections` trae `Counter`: cuenta cuántas veces aparece cada cosa. Lo verás a fondo en la próxima lección.',
    '```python\nfrom collections import Counter\nc = Counter(nombres)\ndups = [n for n, veces in c.items() if veces > 1]\n```',
    '### Quitar duplicados sin perder el orden',
    '`set(lista)` quita repetidos, pero **desordena**. Para mantener el orden, usa `dict.fromkeys()`: los diccionarios recuerdan el orden de entrada.',
    '```python\nunicos = list(dict.fromkeys(nombres))\n```',
    '### ¿Duplicados «iguales pero distintos»?',
    'A veces `"Cam_A"` y `"cam_a"` son el mismo nombre para el pipeline. Antes de comparar, **normaliza**: pasa a minúsculas, quita espacios.',
    { type: 'cg', text: 'en Windows, `Hero.fbx` y `hero.fbx` son el mismo archivo. Un exportador que no lo detecte puede sobrescribir datos.' }
  ],

  example: {
    intro: 'Buscamos nombres de nodos repetidos.',
    lines: [
      { code: 'nombres = ["cam_A", "hero", "cam_B", "hero", "cam_A", "hero"]', note: 'Hay repetidos: "cam_A" (2 veces) y "hero" (3 veces).' },
      { code: 'vistos, dups = set(), set()', note: 'Dos conjuntos vacíos en una línea.' },
      { code: 'for n in nombres:\n    if n in vistos:\n        dups.add(n)\n    vistos.add(n)', note: 'Si ya lo vimos, es duplicado. Siempre lo marcamos como visto.' },
      { code: 'print(sorted(dups))', note: 'Duplicados, sin repetirse aunque aparezcan 3 veces.' },
      { code: 'print(list(dict.fromkeys(nombres)))', note: 'Lista sin repetidos y en el orden original.' }
    ],
    output: "['cam_A', 'hero']\n['cam_A', 'hero', 'cam_B']"
  },

  mini: [
    {
      q: '¿Por qué `lista.count(x)` dentro de un `for` es lento con listas grandes?',
      options: ['Porque `count` recorre toda la lista cada vez', 'Porque `count` no existe en listas', 'No es lento'],
      answer: 0,
      why: 'Cada `count` es O(n). Hacerlo n veces da O(n²).'
    },
    {
      q: '¿Qué devuelve `list(dict.fromkeys(["b", "a", "b", "c"]))`?',
      options: ['`["a", "b", "c"]`', '`["b", "a", "c"]`', '`["b", "a", "b", "c"]`'],
      answer: 1,
      why: 'Quita los repetidos y mantiene el orden de la primera aparición.'
    }
  ],

  exercises: [
    {
      id: 'e1',
      title: 'Función duplicados',
      prompt: 'Escribe `duplicados(lista)`. Devuelve una **lista ordenada** con los elementos que aparecen **más de una vez** (cada uno una sola vez). Hazlo en **una pasada** con un set de vistos.',
      starter: 'def duplicados(lista):\n    # tu código\n    pass\n',
      tests: [
        { check: "duplicados(['a', 'b', 'a', 'c', 'b', 'a']) == ['a', 'b']", msg: "duplicados(['a','b','a','c','b','a']) da ['a', 'b']" },
        { check: "duplicados(['x', 'y']) == []", msg: 'sin repetidos devuelve []' },
        { check: "duplicados(list(range(20000)) + [7]) == [7]", msg: 'funciona rápido con 20 000 elementos' }
      ],
      hints: ['Empieza con `vistos = set()` y `dups = set()`.', 'Al final: `return sorted(dups)`.'],
      solution: 'def duplicados(lista):\n    vistos = set()\n    dups = set()\n    for x in lista:\n        if x in vistos:\n            dups.add(x)\n        vistos.add(x)\n    return sorted(dups)\n'
    },
    {
      id: 'e2',
      title: 'Sin repetidos y en orden',
      prompt: 'Crea `orden_de_carga`: la lista de assets sin repetidos, en el **orden en que aparecen por primera vez**.',
      starter: 'assets = ["set_city", "chr_hero", "prp_sword", "chr_hero", "set_city", "fx_smoke"]\n\n',
      tests: [{ check: "orden_de_carga == ['set_city', 'chr_hero', 'prp_sword', 'fx_smoke']", msg: 'sin repetidos y en el orden original' }],
      hints: ['`set()` desordena. Usa un diccionario.', '`list(dict.fromkeys(assets))`'],
      solution: 'assets = ["set_city", "chr_hero", "prp_sword", "chr_hero", "set_city", "fx_smoke"]\n\norden_de_carga = list(dict.fromkeys(assets))\n'
    },
    {
      id: 'e3',
      title: 'Duplicados sin importar mayúsculas',
      prompt: 'Escribe `chocan(nombres)`: devuelve una lista ordenada con los nombres **en minúsculas** que chocarían si no se distinguen mayúsculas.\n\nEjemplo: `["Hero.fbx", "hero.fbx", "Boss.fbx"]` → `["hero.fbx"]`.',
      starter: 'def chocan(nombres):\n    # tu código\n    pass\n',
      tests: [
        { check: "chocan(['Hero.fbx', 'hero.fbx', 'Boss.fbx']) == ['hero.fbx']", msg: 'detecta Hero.fbx y hero.fbx' },
        { check: "chocan(['A', 'a', 'B', 'b', 'c']) == ['a', 'b']", msg: 'varios choques, ordenados' },
        { check: "chocan(['x', 'y']) == []", msg: 'sin choques devuelve []' }
      ],
      hints: ['Normaliza cada nombre con `.lower()` antes de mirar en `vistos`.', 'Es el mismo patrón de `duplicados`, pero con `n.lower()`.'],
      solution: 'def chocan(nombres):\n    vistos, dups = set(), set()\n    for n in nombres:\n        k = n.lower()\n        if k in vistos:\n            dups.add(k)\n        vistos.add(k)\n    return sorted(dups)\n'
    }
  ],

  summary: [
    'Duplicados en una pasada: un set `vistos` y otro `dups`. O(n).',
    'Evita `lista.count()` dentro de un bucle: es O(n²).',
    '`list(dict.fromkeys(l))` quita repetidos manteniendo el orden. Normaliza (`.lower()`) si hace falta.'
  ]
});
