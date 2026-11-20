(function () {
var SETUP = [
  'import os',
  'os.makedirs("render")',
  'for _n in ["Shot10_v1.exr", "shot20_V3.exr", "sh030_v002.exr", "Shot30_v2.exr", "notas.txt"]:',
  '    open(os.path.join("render", _n), "w").close()',
  'del _n'
].join('\n') + '\n';
var FILES = 'render/\n  Shot10_v1.exr\n  shot20_V3.exr\n  sh030_v002.exr\n  Shot30_v2.exr\n  notas.txt';
var NORM = 'import re\n\ndef normalizar(nombre):\n    """"Shot10_v1.exr" -> "sh010_v001.exr". Devuelve None si no encaja."""\n    m = re.fullmatch(r"(?i)sh(?:ot)?(\\d+)_v(\\d+)(\\.\\w+)", nombre)\n    if not m:\n        return None\n    return f"sh{int(m.group(1)):03d}_v{int(m.group(2)):03d}{m.group(3).lower()}"\n';

TA.add({
  id: 'p19',
  title: 'TA: renombrado por lotes seguro',
  en: 'batch rename with dry run',

  explain: [
    'Renombrar cientos de archivos es una tarea típica. También es **peligrosa**: un error puede sobrescribir renders de una semana. La clave es **planificar antes de actuar**.',
    { type: 'analogy', text: 'antes de mover los muebles de una casa, haces un plano: qué va a dónde. Si dos muebles van al mismo sitio, lo ves en el papel, no cuando ya rompiste algo.' },
    '### Tres pasos separados',
    '1. **Planificar**: calcular el nombre nuevo de cada archivo → un diccionario `{viejo: nuevo}`. No toca nada.\n2. **Validar**: buscar **conflictos**: dos archivos que acabarían con el mismo nombre, o un nombre nuevo que ya existe.\n3. **Aplicar**: renombrar. Con un modo **dry run** (*ensayo*), solo muestra lo que haría.',
    { type: 'compare',
      badTitle: 'Renombrar mientras calculas',
      bad: 'for n in os.listdir(carpeta):\n    os.rename(n, normalizar(n))  # ¿y si choca?',
      goodTitle: 'Plan → conflictos → aplicar',
      good: 'plan = planificar(nombres)\nchoques = conflictos(plan, nombres)\nif choques:\n    raise RuntimeError(choques)\naplicar(carpeta, plan, dry_run=True)' },
    { type: 'warn', text: 'en Windows, `os.rename` falla si el destino existe; en Mac y Linux, **lo sobrescribe sin avisar**. Por eso hay que comprobar los conflictos antes.' },
    { type: 'cg', text: 'llegan renders de un proveedor externo con nombres como `Shot10_v1.exr`. El pipeline espera `sh010_v001.exr`. La herramienta enseña el plan, el supervisor lo aprueba y solo entonces renombra.' },
    { type: 'tip', text: 'decir «siempre hago un dry run y valido conflictos antes de tocar archivos» en la entrevista transmite que has trabajado en producción de verdad.' }
  ],

  example: {
    intro: 'La función `normalizar` ya existe. Hacemos el plan y buscamos choques.',
    lines: [
      { code: 'nombres = ["Shot10_v1.exr", "sh010_v001.exr", "Shot20_v3.exr"]', note: '¡Ojo! El primero, normalizado, se llamaría igual que el segundo.' },
      { code: 'plan = {n: normalizar(n) for n in nombres if normalizar(n) not in (None, n)}', note: 'Solo los que cambian y que se pueden normalizar.' },
      { code: 'destinos = list(plan.values())\nquedan = set(nombres) - set(plan)', note: '`quedan`: archivos que no se renombran y seguirán ahí.' },
      { code: 'choques = [d for d in destinos if destinos.count(d) > 1 or d in quedan]', note: 'Choque: dos van al mismo nombre, o el nombre ya lo tiene otro archivo.' },
      { code: 'print(plan)\nprint(choques)', note: 'El plan y el problema que evitamos.' }
    ],
    output: "{'Shot10_v1.exr': 'sh010_v001.exr', 'Shot20_v3.exr': 'sh020_v003.exr'}\n['sh010_v001.exr']"
  },

  mini: [
    {
      q: '¿Qué hace un modo «dry run»?',
      options: ['Renombra más rápido', 'Muestra lo que haría, sin cambiar nada', 'Borra los archivos antiguos'],
      answer: 1,
      why: 'Es un ensayo: permite revisar el plan antes de tocar archivos.'
    },
    {
      q: 'En Linux, `os.rename("a.exr", "b.exr")` cuando `b.exr` ya existe…',
      options: ['Da error', 'Sobrescribe `b.exr` sin avisar', 'Crea `b (1).exr`'],
      answer: 1,
      why: 'Por eso un buen renombrador comprueba los conflictos antes.'
    }
  ],

  exercises: [
    {
      id: 'e1',
      title: 'Planificar',
      prompt: 'La función `normalizar` ya está escrita. Escribe `planificar(nombres)` que devuelva un dict `{viejo: nuevo}` **solo** con los archivos que se pueden normalizar **y** cambian de nombre.',
      starter: NORM + '\ndef planificar(nombres):\n    # tu código\n    pass\n',
      tests: [
        { check: "planificar(['Shot10_v1.exr', 'sh030_v002.exr', 'notas.txt', 'shot20_V3.exr']) == {'Shot10_v1.exr': 'sh010_v001.exr', 'shot20_V3.exr': 'sh020_v003.exr'}", msg: 'incluye solo los que cambian' },
        { check: "planificar([]) == {}", msg: 'sin nombres, plan vacío' }
      ],
      hints: ['Para cada nombre: `nuevo = normalizar(n)`.', 'Añádelo si `nuevo is not None and nuevo != n`.'],
      solution: NORM + '\ndef planificar(nombres):\n    plan = {}\n    for n in nombres:\n        nuevo = normalizar(n)\n        if nuevo is not None and nuevo != n:\n            plan[n] = nuevo\n    return plan\n'
    },
    {
      id: 'e2',
      title: 'Detectar conflictos',
      prompt: 'Escribe `conflictos(plan, existentes)` que devuelva la **lista ordenada** de nombres nuevos que chocan:\n\n- dos archivos del plan van al **mismo** nombre, o\n- el nombre nuevo ya lo tiene un archivo de `existentes` que **no** se va a renombrar.\n\nHazlo eficiente (sin `count` dentro de bucles).',
      starter: 'from collections import Counter\n\ndef conflictos(plan, existentes):\n    # tu código\n    pass\n',
      tests: [
        { check: "conflictos({'Shot30_v2.exr': 'sh030_v002.exr'}, ['Shot30_v2.exr', 'sh030_v002.exr']) == ['sh030_v002.exr']", msg: 'detecta que el destino ya existe' },
        { check: "conflictos({'a': 'x', 'b': 'x', 'c': 'y'}, ['a', 'b', 'c']) == ['x']", msg: 'detecta dos que van al mismo nombre' },
        { check: "conflictos({'a': 'b', 'b': 'c'}, ['a', 'b']) == []", msg: 'renombrar a un nombre que también se renombra no choca' }
      ],
      hints: ['`veces = Counter(plan.values())` cuenta los destinos.', '`quedan = set(existentes) - set(plan)` son los archivos que no se mueven.'],
      solution: 'from collections import Counter\n\ndef conflictos(plan, existentes):\n    veces = Counter(plan.values())\n    quedan = set(existentes) - set(plan)\n    return sorted({d for d in plan.values() if veces[d] > 1 or d in quedan})\n'
    },
    {
      id: 'e3',
      title: 'Aplicar con dry run',
      prompt: 'Escribe `aplicar(carpeta, plan, dry_run=True)`:\n\n- Devuelve una lista **ordenada** de textos `"viejo -> nuevo"`.\n- Solo renombra de verdad (con `os.rename`) si `dry_run=False`.',
      setup: SETUP, files: FILES,
      starter: 'import os\n\ndef aplicar(carpeta, plan, dry_run=True):\n    # tu código\n    pass\n',
      tests: [
        { check: "aplicar('render', {'Shot10_v1.exr': 'sh010_v001.exr'}) == ['Shot10_v1.exr -> sh010_v001.exr']", msg: 'devuelve las líneas del plan' },
        { check: "aplicar('render', {'Shot10_v1.exr': 'sh010_v001.exr'}) is not None and __import__('os').path.exists('render/Shot10_v1.exr')", msg: 'en dry run no toca nada' },
        { check: "aplicar('render', {'shot20_V3.exr': 'sh020_v003.exr'}, dry_run=False) and __import__('os').path.exists('render/sh020_v003.exr') and not __import__('os').path.exists('render/shot20_V3.exr')", msg: 'con dry_run=False renombra de verdad' }
      ],
      hints: ['`lineas = [f"{v} -> {n}" for v, n in plan.items()]`', '`if not dry_run:` recorre el plan y usa `os.rename(os.path.join(carpeta, v), os.path.join(carpeta, n))`.'],
      solution: 'import os\n\ndef aplicar(carpeta, plan, dry_run=True):\n    lineas = sorted(f"{v} -> {n}" for v, n in plan.items())\n    if not dry_run:\n        for viejo, nuevo in plan.items():\n            os.rename(os.path.join(carpeta, viejo), os.path.join(carpeta, nuevo))\n    return lineas\n'
    }
  ],

  summary: [
    'Separa planificar, validar y aplicar: el plan es un dict `{viejo: nuevo}`.',
    'Conflictos: destinos repetidos (`Counter`) o que ya existen y no se mueven.',
    'Ofrece siempre un dry run antes de tocar archivos.'
  ]
});
})();
