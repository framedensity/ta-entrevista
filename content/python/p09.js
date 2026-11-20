TA.add({
  id: 'p09',
  title: 'Herramientas que ahorran bucles',
  en: 'enumerate, zip, any/all, sorted(key=)',

  explain: [
    'Sabes escribir bucles. Esta lección es sobre escribir **menos**: Python trae funciones que reemplazan los bucles más típicos. El código queda más corto y con menos errores.',
    { type: 'analogy', text: 'son como las herramientas eléctricas de un taller. Puedes atornillar a mano, pero el destornillador eléctrico lo hace igual, más rápido y sin cansarte.' },
    '### enumerate: el número y el elemento',
    { type: 'compare',
      badTitle: 'Contador a mano',
      bad: 'i = 0\nfor toma in tomas:\n    print(i, toma)\n    i += 1',
      goodTitle: 'enumerate',
      good: 'for i, toma in enumerate(tomas, start=1):\n    print(i, toma)' },
    '### zip: recorrer dos listas a la vez',
    '`zip(a, b)` empareja el primero con el primero, el segundo con el segundo… Con `dict(zip(a, b))` creas un diccionario.',
    '```python\nnombres = ["sh010", "sh020"]\nframes = [48, 96]\ndict(zip(nombres, frames))  # {"sh010": 48, "sh020": 96}\n```',
    '### any y all: preguntas de sí o no',
    '- `all(...)` → ¿se cumple para **todos**?\n- `any(...)` → ¿se cumple para **alguno**?',
    '```python\nall(f > 0 for f in frames)        # ¿todas las tomas tienen frames?\nany(n.startswith("tmp") for n in nombres)  # ¿queda algo temporal?\n```',
    '### sorted, min y max con key',
    '`key=` es una función que dice **qué mirar** para comparar. Con `lambda` la escribes en el momento.',
    '```python\ntomas = [("sh010", 48), ("sh020", 96)]\nsorted(tomas, key=lambda t: t[1])  # ordena por frames\n```',
    { type: 'cg', text: 'ordenar archivos por número de versión, emparejar cámaras con sus rangos de frames, comprobar que ninguna toma tiene 0 frames antes de exportar.' }
  ],

  example: {
    intro: 'Nombres y frames llegan en dos listas separadas.',
    lines: [
      { code: 'nombres = ["sh030", "sh010", "sh020"]\nframes = [72, 48, 0]', note: 'Dos listas que van en paralelo.' },
      { code: 'tomas = dict(zip(nombres, frames))', note: '`zip` empareja y `dict` crea el diccionario.' },
      { code: 'validas = all(f > 0 for f in frames)', note: '¿Todas tienen frames? No: sh020 tiene 0 → `False`.' },
      { code: 'por_frames = sorted(tomas.items(), key=lambda kv: kv[1])', note: 'Ordenamos las parejas por el valor (posición 1).' },
      { code: 'for i, (n, f) in enumerate(por_frames, start=1):\n    print(i, n, f)', note: '`enumerate` numera desde 1. Desempaquetamos la pareja en `(n, f)`.' },
      { code: 'print(validas)', note: 'Resultado de `all`.' }
    ],
    output: '1 sh020 0\n2 sh010 48\n3 sh030 72\nFalse'
  },

  mini: [
    {
      q: '¿Qué devuelve `list(zip([1, 2, 3], ["a", "b"]))`?',
      options: ['`[(1, "a"), (2, "b")]`', '`[(1, "a"), (2, "b"), (3, None)]`', 'Un error'],
      answer: 0,
      why: '`zip` se para cuando se acaba la lista más corta.'
    },
    {
      q: '¿Qué devuelve `any([])`?',
      options: ['`True`', '`False`', 'Un error'],
      answer: 1,
      why: 'No hay ningún elemento que cumpla, así que `any` es `False`. (Y `all([])` es `True`.)'
    }
  ],

  exercises: [
    {
      id: 'e1',
      title: 'Lista numerada',
      prompt: 'Crea `lineas`: una lista de textos con el formato `"1: sh010"`, `"2: sh020"`… usando `enumerate` desde 1.',
      starter: 'tomas = ["sh010", "sh020", "sh030"]\n\n',
      tests: [{ check: "lineas == ['1: sh010', '2: sh020', '3: sh030']", msg: '`lineas` tiene el formato "1: sh010"' }],
      hints: ['Comprensión: `[f"{i}: {t}" for i, t in enumerate(tomas, start=1)]`'],
      solution: 'tomas = ["sh010", "sh020", "sh030"]\n\nlineas = [f"{i}: {t}" for i, t in enumerate(tomas, start=1)]\n'
    },
    {
      id: 'e2',
      title: 'Rangos de cámara',
      prompt: 'Crea `rangos`: un diccionario `{camara: (inicio, fin)}` usando `zip` con las tres listas.\n\nCrea `todo_ok`: `True` si **todos** los rangos tienen `fin > inicio`.',
      starter: 'camaras = ["cam_A", "cam_B", "cam_C"]\ninicios = [1001, 1049, 1100]\nfines = [1048, 1099, 1100]\n\n',
      tests: [
        { check: "rangos == {'cam_A': (1001, 1048), 'cam_B': (1049, 1099), 'cam_C': (1100, 1100)}", msg: '`rangos` empareja cada cámara con (inicio, fin)' },
        { check: 'todo_ok is False', msg: '`todo_ok` es False (cam_C tiene fin == inicio)' }
      ],
      hints: ['`zip` acepta tres listas: `zip(camaras, inicios, fines)`.', '`all(f > i for i, f in rangos.values())`'],
      solution: 'camaras = ["cam_A", "cam_B", "cam_C"]\ninicios = [1001, 1049, 1100]\nfines = [1048, 1099, 1100]\n\nrangos = {c: (i, f) for c, i, f in zip(camaras, inicios, fines)}\ntodo_ok = all(f > i for i, f in rangos.values())\n'
    },
    {
      id: 'e3',
      title: 'Ordenar versiones de verdad',
      prompt: 'Ordenar texto da `v10` antes que `v2`. Crea `ordenados`: la lista ordenada por el **número** de versión.\n\nCrea `ultima`: el archivo con la versión más alta.',
      starter: 'archivos = ["hero_v10.ma", "hero_v2.ma", "hero_v1.ma", "hero_v9.ma"]\n\ndef version(nombre):\n    # "hero_v10.ma" -> 10\n    return int(nombre.split("_v")[1].split(".")[0])\n\n',
      tests: [
        { check: "ordenados == ['hero_v1.ma', 'hero_v2.ma', 'hero_v9.ma', 'hero_v10.ma']", msg: '`ordenados` sigue el número de versión' },
        { check: "ultima == 'hero_v10.ma'", msg: '`ultima` es hero_v10.ma' }
      ],
      hints: ['La función `version` ya está hecha. Pásala como `key=version`.', '`max(archivos, key=version)`'],
      solution: 'archivos = ["hero_v10.ma", "hero_v2.ma", "hero_v1.ma", "hero_v9.ma"]\n\ndef version(nombre):\n    return int(nombre.split("_v")[1].split(".")[0])\n\nordenados = sorted(archivos, key=version)\nultima = max(archivos, key=version)\n'
    }
  ],

  summary: [
    '`enumerate` numera, `zip` empareja listas, `dict(zip(a, b))` crea diccionarios.',
    '`all()` y `any()` responden «¿todos?» y «¿alguno?» en una línea.',
    '`key=` (una función o `lambda`) dice qué comparar en `sorted`, `min` y `max`.'
  ]
});
