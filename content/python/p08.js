TA.add({
  id: 'p08',
  title: 'Patrón: agrupar y contar',
  en: 'defaultdict & Counter',

  explain: [
    'Muchas preguntas de pipeline son «¿cuántos hay de cada tipo?» o «dame los archivos agrupados por toma». Python tiene dos herramientas hechas para esto, en el módulo `collections`.',
    '### Agrupar: el problema del primer elemento',
    'Para agrupar, guardas una **lista por cada clave**. El problema: la primera vez, la clave no existe todavía.',
    { type: 'compare',
      badTitle: 'Comprobar a mano cada vez',
      bad: 'grupos = {}\nfor archivo in archivos:\n    toma = archivo.split("_")[0]\n    if toma not in grupos:\n        grupos[toma] = []\n    grupos[toma].append(archivo)',
      goodTitle: 'defaultdict crea la lista sola',
      good: 'from collections import defaultdict\ngrupos = defaultdict(list)\nfor archivo in archivos:\n    toma = archivo.split("_")[0]\n    grupos[toma].append(archivo)' },
    { type: 'analogy', text: '`defaultdict(list)` es un archivador mágico: si abres un cajón que no existe, aparece un cajón vacío listo para usar.' },
    'Con `dict.setdefault(clave, [])` haces lo mismo sin importar nada, pero se lee peor.',
    '### Contar: Counter',
    '`Counter` cuenta cuántas veces aparece cada elemento. Es un diccionario `{elemento: veces}`.',
    '```python\nfrom collections import Counter\nc = Counter(["mesh", "joint", "mesh", "camera", "mesh"])\nc["mesh"]          # 3\nc.most_common(1)   # [("mesh", 3)]\nc["light"]         # 0 (no da error)\n```',
    { type: 'cg', text: 'antes de entregar una escena, una herramienta cuenta los nodos por tipo. Si hay 400 `joint` en una escena de props, algo va mal.' },
    { type: 'tip', text: 'si escribes a mano «si no existe la clave, créala con 0, y suma 1», di en voz alta: «aquí usaría `Counter`». Demuestra que conoces la librería estándar.' }
  ],

  example: {
    intro: 'Archivos exportados de varias tomas.',
    lines: [
      { code: 'from collections import defaultdict, Counter', note: 'Importamos las dos herramientas.' },
      { code: 'archivos = ["sh010_cam.fbx", "sh010_hero.fbx", "sh020_cam.fbx", "sh010_boss.fbx"]', note: 'Cada nombre empieza por la toma.' },
      { code: 'por_toma = defaultdict(list)\nfor a in archivos:\n    por_toma[a.split("_")[0]].append(a)', note: '`split("_")[0]` saca la toma. El cajón se crea solo la primera vez.' },
      { code: 'print(dict(por_toma))', note: 'Lo convertimos a dict normal solo para imprimirlo limpio.' },
      { code: 'cuenta = Counter(a.split("_")[0] for a in archivos)', note: 'Contamos archivos por toma.' },
      { code: 'print(cuenta.most_common(1))', note: 'La toma con más archivos.' }
    ],
    output: "{'sh010': ['sh010_cam.fbx', 'sh010_hero.fbx', 'sh010_boss.fbx'], 'sh020': ['sh020_cam.fbx']}\n[('sh010', 3)]"
  },

  mini: [
    {
      q: 'Con `g = defaultdict(list)`, ¿qué pasa al hacer `g["nuevo"].append(1)` si `"nuevo"` no existía?',
      options: ['`KeyError`', 'Se crea `g["nuevo"] = [1]`', 'No hace nada'],
      answer: 1,
      why: '`defaultdict(list)` crea una lista vacía automáticamente para las claves nuevas.'
    },
    {
      q: '¿Qué devuelve `Counter("banana").most_common(1)`?',
      options: ['`[("a", 3)]`', '`[("b", 1)]`', '`3`'],
      answer: 0,
      why: 'La letra más frecuente es "a", que aparece 3 veces. `most_common(n)` devuelve una lista de parejas.'
    }
  ],

  exercises: [
    {
      id: 'e1',
      title: 'Nodos por tipo',
      prompt: 'Crea `por_tipo`: un `Counter` con cuántos nodos hay de cada tipo.\n\nCrea `mas_comun`: el **nombre del tipo** más frecuente.',
      starter: 'tipos = ["mesh", "joint", "mesh", "camera", "joint", "mesh", "locator"]\n\n',
      tests: [
        { check: "por_tipo['mesh'] == 3 and por_tipo['joint'] == 2 and por_tipo['camera'] == 1", msg: '`por_tipo` cuenta bien cada tipo' },
        { check: "mas_comun == 'mesh'", msg: '`mas_comun` es "mesh"' }
      ],
      hints: ['`from collections import Counter`', '`por_tipo.most_common(1)` da `[("mesh", 3)]`. El nombre es `[0][0]`.'],
      solution: 'from collections import Counter\n\ntipos = ["mesh", "joint", "mesh", "camera", "joint", "mesh", "locator"]\n\npor_tipo = Counter(tipos)\nmas_comun = por_tipo.most_common(1)[0][0]\n'
    },
    {
      id: 'e2',
      title: 'Archivos por extensión',
      prompt: 'Crea `por_ext`: un diccionario `{extensión: [archivos]}` usando `defaultdict(list)`. La extensión es lo que va después del **último** punto.',
      starter: 'archivos = ["hero.ma", "hero.fbx", "boss.ma", "readme.txt", "cam.v2.fbx"]\n\n',
      tests: [
        { check: "dict(por_ext) == {'ma': ['hero.ma', 'boss.ma'], 'fbx': ['hero.fbx', 'cam.v2.fbx'], 'txt': ['readme.txt']}", msg: 'agrupa por extensión, respetando el orden' }
      ],
      hints: ['`"cam.v2.fbx".rsplit(".", 1)[1]` da `"fbx"`: `rsplit` corta desde la derecha.', '`por_ext[ext].append(a)`'],
      solution: 'from collections import defaultdict\n\narchivos = ["hero.ma", "hero.fbx", "boss.ma", "readme.txt", "cam.v2.fbx"]\n\npor_ext = defaultdict(list)\nfor a in archivos:\n    ext = a.rsplit(".", 1)[1]\n    por_ext[ext].append(a)\n'
    },
    {
      id: 'e3',
      title: 'Tomas por secuencia',
      prompt: 'Los nombres son `secuencia_toma`. Escribe `agrupar(nombres)` que devuelva un **dict normal** `{secuencia: [tomas]}`, con las tomas **ordenadas**.',
      starter: 'def agrupar(nombres):\n    # tu código\n    pass\n',
      tests: [
        { check: "agrupar(['sq020_sh020', 'sq010_sh030', 'sq010_sh010', 'sq020_sh010']) == {'sq020': ['sh010', 'sh020'], 'sq010': ['sh010', 'sh030']}", msg: 'agrupa y ordena las tomas' },
        { check: "type(agrupar(['a_b'])) is dict", msg: 'devuelve un dict normal' }
      ],
      hints: ['`sq, sh = nombre.split("_")` separa en dos variables.', 'Al final: `return {k: sorted(v) for k, v in grupos.items()}`'],
      solution: 'from collections import defaultdict\n\ndef agrupar(nombres):\n    grupos = defaultdict(list)\n    for n in nombres:\n        sq, sh = n.split("_")\n        grupos[sq].append(sh)\n    return {k: sorted(v) for k, v in grupos.items()}\n'
    }
  ],

  summary: [
    '`defaultdict(list)` agrupa sin comprobar si la clave existe.',
    '`Counter(iterable)` cuenta; `.most_common(n)` da los más frecuentes.',
    'Ambos están en `collections`: decir su nombre en la entrevista suma puntos.'
  ]
});
