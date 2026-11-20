(function () {
var SETUP = [
  'import os',
  'os.makedirs("escenas")',
  'for _n in ["sh010_v001.ma", "sh010_v002.ma", "sh020_v001.ma", "notas.txt", "sh030_v001.mb"]:',
  '    open(os.path.join("escenas", _n), "w").close()',
  'del _n'
].join('\n') + '\n';
var FILES = 'escenas/\n  sh010_v001.ma\n  sh010_v002.ma\n  sh020_v001.ma\n  sh030_v001.mb\n  notas.txt';

TA.add({
  id: 'p13',
  title: 'os y os.path',
  en: 'files & paths',

  explain: [
    'Las herramientas de TA trabajan con **archivos**: buscan escenas, crean carpetas de exportación, renombran versiones. El módulo `os` es la puerta al sistema de archivos.',
    { type: 'analogy', text: 'una **ruta** (*path*) es la dirección de un archivo, como una dirección postal: país / ciudad / calle / número. `proyecto/sq010/sh010/anim.ma`.' },
    '### Nunca pegues rutas con +',
    { type: 'compare',
      badTitle: 'Se rompe entre Windows y Mac',
      bad: 'ruta = carpeta + "/" + archivo',
      goodTitle: 'os.path.join pone el separador correcto',
      good: 'ruta = os.path.join(carpeta, archivo)' },
    '### Lo más usado de os y os.path',
    '- `os.listdir(carpeta)` → lista de nombres dentro de la carpeta (sin la ruta).\n- `os.path.join(a, b)` → une partes de una ruta.\n- `os.path.exists(r)`, `os.path.isfile(r)`, `os.path.isdir(r)` → ¿existe?, ¿es archivo?, ¿es carpeta?\n- `os.path.basename(r)` → el nombre final. `os.path.dirname(r)` → la carpeta.\n- `os.path.splitext(nombre)` → separa `("sh010_v001", ".ma")`.\n- `os.makedirs(r, exist_ok=True)` → crea carpetas (y las de en medio). Sin error si ya existe.\n- `os.rename(viejo, nuevo)`, `os.remove(r)` → renombrar y borrar.',
    { type: 'warn', text: '`os.listdir` devuelve los nombres en **cualquier orden**. Si el orden importa, usa `sorted()`.' },
    { type: 'cg', text: 'antes de exportar una toma, la herramienta crea `export/sq010/sh010/` con `makedirs(..., exist_ok=True)`. Así no falla si la carpeta ya existía de una exportación anterior.' },
    'En estos ejercicios, cada vez que pulsas «Ejecutar», aparece una carpeta de trabajo nueva con archivos de prueba.'
  ],

  example: {
    intro: 'Miramos qué escenas hay en una carpeta.',
    lines: [
      { code: 'import os', note: 'Importamos el módulo.' },
      { code: 'nombres = sorted(os.listdir("escenas"))', note: 'Todos los nombres de la carpeta, ordenados.' },
      { code: 'mayas = [n for n in nombres if n.endswith((".ma", ".mb"))]', note: '`endswith` acepta una **tupla** de terminaciones.' },
      { code: 'base, ext = os.path.splitext(mayas[0])', note: 'Separa nombre y extensión: `"sh010_v001"`, `".ma"`.' },
      { code: 'destino = os.path.join("export", base)\nos.makedirs(destino, exist_ok=True)', note: 'Crea `export/sh010_v001`.' },
      { code: 'print(mayas, ext, os.path.isdir(destino))', note: 'Resultado.' }
    ],
    output: "['sh010_v001.ma', 'sh010_v002.ma', 'sh020_v001.ma', 'sh030_v001.mb'] .ma True"
  },

  mini: [
    {
      q: '¿Qué devuelve `os.path.splitext("cam.v2.fbx")`?',
      options: ['`("cam", ".v2.fbx")`', '`("cam.v2", ".fbx")`', '`["cam", "v2", "fbx"]`'],
      answer: 1,
      why: '`splitext` separa solo la **última** extensión.'
    },
    {
      q: '¿Para qué sirve `exist_ok=True` en `os.makedirs`?',
      options: ['Para borrar la carpeta si existe', 'Para no dar error si la carpeta ya existe', 'Para crear solo la última carpeta'],
      answer: 1,
      why: 'Sin `exist_ok=True`, si la carpeta ya existe, lanza `FileExistsError`.'
    }
  ],

  exercises: [
    {
      id: 'e1',
      title: 'Solo las escenas .ma',
      prompt: 'Crea `escenas_ma`: lista **ordenada** con los nombres de archivo que terminan en `.ma` dentro de la carpeta `escenas`.',
      files: FILES,
      setup: SETUP,
      starter: 'import os\n\n',
      tests: [{ check: "escenas_ma == ['sh010_v001.ma', 'sh010_v002.ma', 'sh020_v001.ma']", msg: '`escenas_ma` tiene las tres .ma, ordenadas' }],
      hints: ['`os.listdir("escenas")` da los nombres.', '`sorted(n for n in os.listdir("escenas") if n.endswith(".ma"))`'],
      solution: 'import os\n\nescenas_ma = sorted(n for n in os.listdir("escenas") if n.endswith(".ma"))\n'
    },
    {
      id: 'e2',
      title: 'Preparar la carpeta de exportación',
      prompt: 'Escribe `preparar(sq, sh)`: crea la carpeta `export/<sq>/<sh>` (con todas las de en medio) y devuelve su ruta. Si ya existe, **no** debe dar error.',
      setup: SETUP,
      files: FILES,
      starter: 'import os\n\ndef preparar(sq, sh):\n    # tu código\n    pass\n',
      tests: [
        { check: "preparar('sq010', 'sh010') == __import__('os').path.join('export', 'sq010', 'sh010')", msg: 'devuelve export/sq010/sh010' },
        { check: "__import__('os').path.isdir('export/sq010/sh010')", msg: 'la carpeta existe de verdad' },
        { check: "preparar('sq010', 'sh010') is not None", msg: 'llamarla dos veces no da error' }
      ],
      hints: ['`ruta = os.path.join("export", sq, sh)`', '`os.makedirs(ruta, exist_ok=True)` y luego `return ruta`.'],
      solution: 'import os\n\ndef preparar(sq, sh):\n    ruta = os.path.join("export", sq, sh)\n    os.makedirs(ruta, exist_ok=True)\n    return ruta\n'
    },
    {
      id: 'e3',
      title: 'Última versión de cada toma',
      prompt: 'En `escenas` hay varias versiones por toma (`sh010_v001.ma`, `sh010_v002.ma`…). Crea `ultimas`: un dict `{toma: nombre_de_archivo}` con la versión **más alta** de cada toma. Considera `.ma` y `.mb`.',
      setup: SETUP,
      files: FILES,
      starter: 'import os\n\n',
      tests: [{ check: "ultimas == {'sh010': 'sh010_v002.ma', 'sh020': 'sh020_v001.ma', 'sh030': 'sh030_v001.mb'}", msg: 'una entrada por toma, con su última versión' }],
      hints: ['Para cada archivo: `base, ext = os.path.splitext(n)` y `toma, ver = base.split("_v")`.', 'Guarda el archivo si la toma no está en `ultimas` o si su versión es mayor que la guardada.'],
      solution: 'import os\n\nultimas = {}\nfor n in sorted(os.listdir("escenas")):\n    base, ext = os.path.splitext(n)\n    if ext not in (".ma", ".mb"):\n        continue\n    toma, ver = base.split("_v")\n    actual = ultimas.get(toma)\n    if actual is None or int(ver) > int(os.path.splitext(actual)[0].split("_v")[1]):\n        ultimas[toma] = n\n',
      explain: 'Otra forma muy clara: agrupar con `defaultdict(list)` y después `max(archivos, key=version)` en cada grupo (lecciones 8 y 9).'
    }
  ],

  summary: [
    'Une rutas con `os.path.join`, nunca con `+`.',
    '`listdir` (desordenado: usa `sorted`), `splitext`, `basename`, `exists`, `isdir`.',
    '`os.makedirs(ruta, exist_ok=True)` crea toda la ruta sin fallar si ya existe.'
  ]
});
})();
