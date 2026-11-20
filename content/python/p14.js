(function () {
var SETUP = [
  'import os',
  'for _p in ["proyecto/sq010/sh010/anim_v001.fbx", "proyecto/sq010/sh010/anim_v002.fbx",',
  '           "proyecto/sq010/sh020/anim_v001.fbx", "proyecto/sq010/sh020/notas.txt",',
  '           "proyecto/sq020/sh010/anim_v003.fbx", "proyecto/sq020/sh010/cam_v001.fbx",',
  '           "proyecto/readme.txt"]:',
  '    os.makedirs(os.path.dirname(_p), exist_ok=True)',
  '    open(_p, "w").close()',
  'del _p'
].join('\n') + '\n';
var FILES = 'proyecto/\n  readme.txt\n  sq010/\n    sh010/  anim_v001.fbx  anim_v002.fbx\n    sh020/  anim_v001.fbx  notas.txt\n  sq020/\n    sh010/  anim_v003.fbx  cam_v001.fbx';

TA.add({
  id: 'p14',
  title: 'Recorrer carpetas',
  en: 'os.walk, glob, pathlib',

  explain: [
    '`os.listdir` solo mira **una** carpeta. Pero un proyecto tiene carpetas dentro de carpetas: secuencias, tomas, departamentos… Para buscar en todas, hay tres herramientas.',
    { type: 'analogy', text: 'recorrer carpetas es como revisar un edificio: entras en cada planta, en cada habitación, y anotas lo que hay. `os.walk` hace ese recorrido por ti.' },
    '### 1. os.walk',
    'Recorre la carpeta y **todas** sus subcarpetas. En cada carpeta te da tres cosas: la ruta, las subcarpetas y los archivos.',
    '```python\nfor carpeta, subcarpetas, archivos in os.walk("proyecto"):\n    for a in archivos:\n        ruta = os.path.join(carpeta, a)\n```',
    '### 2. glob: buscar con comodines',
    '`*` = cualquier texto. `**` = cualquier número de carpetas (con `recursive=True`).',
    '```python\nimport glob\nglob.glob("proyecto/**/*.fbx", recursive=True)\n```',
    '### 3. pathlib: rutas como objetos',
    '`pathlib.Path` es la forma moderna. La ruta es un objeto con propiedades útiles, y se une con `/`.',
    '```python\nfrom pathlib import Path\np = Path("proyecto") / "sq010" / "sh010" / "anim_v002.fbx"\np.name     # "anim_v002.fbx"\np.stem     # "anim_v002"\np.suffix   # ".fbx"\np.parent.name  # "sh010"\nlist(Path("proyecto").rglob("*.fbx"))   # búsqueda recursiva\n```',
    { type: 'cg', text: 'antes de una entrega, buscar todos los `.fbx` del proyecto, saber a qué toma pertenece cada uno (`p.parent.name`) y quedarse con la última versión.' },
    { type: 'tip', text: 'si te preguntan cuál usas: «`pathlib` para código nuevo, porque es más legible; `os.walk` cuando necesito saltar carpetas mientras recorro (modificando la lista de subcarpetas)».' }
  ],

  example: {
    intro: 'Buscamos todas las animaciones exportadas del proyecto.',
    lines: [
      { code: 'from pathlib import Path', note: 'Importamos `Path`.' },
      { code: 'fbx = sorted(Path("proyecto").rglob("*.fbx"))', note: '`rglob` busca en todas las subcarpetas.' },
      { code: 'for p in fbx:\n    print(p.parent.parent.name, p.parent.name, p.stem)', note: 'Secuencia (abuelo), toma (padre) y nombre sin extensión.' }
    ],
    output: 'sq010 sh010 anim_v001\nsq010 sh010 anim_v002\nsq010 sh020 anim_v001\nsq020 sh010 anim_v003\nsq020 sh010 cam_v001'
  },

  mini: [
    {
      q: 'En `for carpeta, subcarpetas, archivos in os.walk("x"):`, ¿qué es `archivos`?',
      options: ['Las rutas completas de los archivos', 'Los nombres de los archivos de esa carpeta (sin ruta)', 'Todos los archivos de todas las carpetas'],
      answer: 1,
      why: 'Son solo nombres. Para la ruta completa: `os.path.join(carpeta, nombre)`.'
    },
    {
      q: 'Con `p = Path("a/b/hero_v002.fbx")`, ¿qué es `p.stem`?',
      options: ['`"hero_v002.fbx"`', '`"hero_v002"`', '`".fbx"`'],
      answer: 1,
      why: '`stem` es el nombre sin la extensión. `name` lo incluye y `suffix` es solo la extensión.'
    }
  ],

  exercises: [
    {
      id: 'e1',
      title: 'Contar con os.walk',
      prompt: 'Usa `os.walk` para crear `total_fbx`: cuántos archivos `.fbx` hay en todo `proyecto`.',
      setup: SETUP, files: FILES,
      starter: 'import os\n\ntotal_fbx = 0\n',
      tests: [{ check: 'total_fbx == 5', msg: '`total_fbx` vale 5' }],
      hints: ['Dentro del `for` de `os.walk`, recorre `archivos`.', 'Suma 1 cuando `a.endswith(".fbx")`.'],
      solution: 'import os\n\ntotal_fbx = 0\nfor carpeta, subcarpetas, archivos in os.walk("proyecto"):\n    for a in archivos:\n        if a.endswith(".fbx"):\n            total_fbx += 1\n'
    },
    {
      id: 'e2',
      title: 'Archivos de una toma con pathlib',
      prompt: 'Escribe `archivos_de(sq, sh)` que devuelva la lista **ordenada** de nombres (con extensión) dentro de `proyecto/<sq>/<sh>`. Usa `Path`.',
      setup: SETUP, files: FILES,
      starter: 'from pathlib import Path\n\ndef archivos_de(sq, sh):\n    # tu código\n    pass\n',
      tests: [
        { check: "archivos_de('sq010', 'sh020') == ['anim_v001.fbx', 'notas.txt']", msg: 'sq010/sh020 tiene anim_v001.fbx y notas.txt' },
        { check: "archivos_de('sq020', 'sh010') == ['anim_v003.fbx', 'cam_v001.fbx']", msg: 'sq020/sh010 tiene dos fbx' }
      ],
      hints: ['`carpeta = Path("proyecto") / sq / sh`', '`sorted(p.name for p in carpeta.iterdir())`'],
      solution: 'from pathlib import Path\n\ndef archivos_de(sq, sh):\n    carpeta = Path("proyecto") / sq / sh\n    return sorted(p.name for p in carpeta.iterdir())\n'
    },
    {
      id: 'e3',
      title: 'Inventario de animaciones',
      prompt: 'Crea `inventario`: un dict `{"sq010/sh010": 2, ...}` con cuántos archivos que empiezan por `anim_` hay en cada toma. Solo incluye las tomas que tengan al menos uno.',
      setup: SETUP, files: FILES,
      starter: 'from pathlib import Path\n\n',
      tests: [{ check: "inventario == {'sq010/sh010': 2, 'sq010/sh020': 1, 'sq020/sh010': 1}", msg: 'cuenta los anim_ de cada toma' }],
      hints: ['`Path("proyecto").rglob("anim_*.fbx")`', 'La clave: `f"{p.parent.parent.name}/{p.parent.name}"`. Puedes usar `Counter` o `dict.get(k, 0) + 1`.'],
      solution: 'from pathlib import Path\nfrom collections import Counter\n\ninventario = dict(Counter(f"{p.parent.parent.name}/{p.parent.name}" for p in Path("proyecto").rglob("anim_*")))\n'
    }
  ],

  summary: [
    '`os.walk` recorre todo el árbol: (carpeta, subcarpetas, archivos).',
    '`glob("**/*.fbx", recursive=True)` y `Path.rglob("*.fbx")` buscan con comodines.',
    '`Path`: `/` para unir, `.name`, `.stem`, `.suffix`, `.parent`.'
  ]
});
})();
