(function () {
var SETUP = [
  'import json',
  'with open("config.json", "w", encoding="utf-8") as _f:',
  '    json.dump({"proyecto": "demo", "fps": 30, "export": {"formato": "fbx", "escala": 1.0}}, _f, indent=2)',
  'del _f'
].join('\n') + '\n';
var FILES = 'config.json\n{\n  "proyecto": "demo",\n  "fps": 30,\n  "export": {"formato": "fbx", "escala": 1.0}\n}';

TA.add({
  id: 'p15',
  title: 'JSON',
  en: 'json & config files',

  explain: [
    '**JSON** es un formato de texto para guardar datos. Se parece mucho a los diccionarios y listas de Python, y casi todos los programas lo entienden.',
    { type: 'analogy', text: 'JSON es como una ficha escrita a mano que cualquiera puede leer: «nombre: sh010, frames: 48». Puedes guardarla en un cajón (un archivo) y otra herramienta la lee después.' },
    '### Las cuatro funciones de json',
    '- `json.dumps(datos)` → convierte a **texto** (*dump string*).\n- `json.loads(texto)` → de texto a datos.\n- `json.dump(datos, archivo)` → escribe en un **archivo**.\n- `json.load(archivo)` → lee de un archivo.',
    'Truco para recordarlo: la **s** final es de *string*.',
    '### Leer y escribir archivos con with',
    '`with open(...)` abre el archivo y lo **cierra solo** al terminar, aunque haya un error.',
    '```python\nwith open("config.json", "w", encoding="utf-8") as f:\n    json.dump(datos, f, indent=2)\n\nwith open("config.json", encoding="utf-8") as f:\n    datos = json.load(f)\n```',
    { type: 'warn', text: 'JSON no tiene tuplas ni conjuntos: las tuplas vuelven como listas, y un `set` da error. Las claves siempre se guardan como texto.' },
    '### Configuración con valores por defecto',
    'Una herramienta trae valores por defecto. El usuario solo escribe en su JSON lo que quiere cambiar. Se combinan con `{**defecto, **usuario}`: lo de la derecha gana.',
    { type: 'cg', text: 'el exportador lee `config.json` del proyecto: fps, formato, escala. Si el archivo no existe, usa los valores por defecto en lugar de romperse.' }
  ],

  example: {
    intro: 'Leemos la configuración del proyecto.',
    lines: [
      { code: 'import json', note: 'Módulo de JSON.' },
      { code: 'with open("config.json", encoding="utf-8") as f:\n    cfg = json.load(f)', note: 'Ahora `cfg` es un diccionario normal de Python.' },
      { code: 'print(cfg["fps"], cfg["export"]["formato"])', note: 'Acceso anidado: un diccionario dentro de otro.' },
      { code: 'DEFECTO = {"fps": 24, "camara": "renderCam"}', note: 'Valores por defecto de la herramienta.' },
      { code: 'final = {**DEFECTO, **cfg}', note: 'Combinamos: lo del proyecto sobrescribe lo de por defecto.' },
      { code: 'print(final["fps"], final["camara"])', note: '`fps` viene del proyecto (30). `camara`, del defecto.' }
    ],
    output: '30 fbx\n30 renderCam'
  },

  mini: [
    {
      q: '¿Qué función escribe un diccionario en un archivo?',
      options: ['`json.dumps`', '`json.dump`', '`json.load`'],
      answer: 1,
      why: '`dump` va a un archivo. `dumps` (con s) devuelve un texto.'
    },
    {
      q: '¿Qué vale `{**{"a": 1, "b": 2}, **{"b": 9}}`?',
      options: ['`{"a": 1, "b": 2}`', '`{"a": 1, "b": 9}`', '`{"b": 9}`'],
      answer: 1,
      why: 'Se combinan los dos, y si una clave se repite, gana el de la derecha.'
    }
  ],

  exercises: [
    {
      id: 'e1',
      title: 'Leer la configuración',
      prompt: 'Lee `config.json` y crea `fps` y `formato` con sus valores.',
      setup: SETUP, files: FILES,
      starter: 'import json\n\n',
      tests: [
        { check: 'fps == 30', msg: '`fps` vale 30' },
        { check: "formato == 'fbx'", msg: '`formato` vale "fbx"' }
      ],
      hints: ['`with open("config.json", encoding="utf-8") as f: cfg = json.load(f)`', 'El formato está dentro de `cfg["export"]`.'],
      solution: 'import json\n\nwith open("config.json", encoding="utf-8") as f:\n    cfg = json.load(f)\nfps = cfg["fps"]\nformato = cfg["export"]["formato"]\n'
    },
    {
      id: 'e2',
      title: 'Guardar un informe',
      prompt: 'Guarda el diccionario `informe` en el archivo `informe.json` con `indent=2`.',
      setup: SETUP, files: FILES,
      starter: 'import json\n\ninforme = {"ok": ["sh010", "sh020"], "errores": {"sh030": "falta cámara"}}\n\n',
      tests: [
        { check: "__import__('json').load(open('informe.json', encoding='utf-8')) == informe", msg: 'informe.json contiene el informe' },
        { check: "'\\n  ' in open('informe.json', encoding='utf-8').read()", msg: 'el archivo usa sangría (indent=2)' }
      ],
      hints: ['Abre con `"w"` (escribir).', '`json.dump(informe, f, indent=2)`'],
      solution: 'import json\n\ninforme = {"ok": ["sh010", "sh020"], "errores": {"sh030": "falta cámara"}}\n\nwith open("informe.json", "w", encoding="utf-8") as f:\n    json.dump(informe, f, indent=2)\n'
    },
    {
      id: 'e3',
      title: 'Configuración a prueba de fallos',
      prompt: 'Escribe `cargar(ruta)`: lee el JSON de `ruta` y lo combina con `DEFECTO` (gana lo del archivo). Si el archivo **no existe**, devuelve una **copia** de `DEFECTO`.',
      setup: SETUP, files: FILES,
      starter: 'import json\n\nDEFECTO = {"fps": 24, "camara": "renderCam", "formato": "abc"}\n\ndef cargar(ruta):\n    # tu código\n    pass\n',
      tests: [
        { check: "cargar('config.json')['fps'] == 30 and cargar('config.json')['camara'] == 'renderCam'", msg: 'combina el archivo con los valores por defecto' },
        { check: "cargar('no_existe.json') == {'fps': 24, 'camara': 'renderCam', 'formato': 'abc'}", msg: 'sin archivo, devuelve los valores por defecto' },
        { check: "cargar('no_existe.json') is not DEFECTO", msg: 'devuelve una copia (no el mismo objeto DEFECTO)' }
      ],
      hints: ['`try:` abrir y `json.load`; `except FileNotFoundError:` devuelve `dict(DEFECTO)`.', 'Si se lee bien: `return {**DEFECTO, **datos}`.'],
      solution: 'import json\n\nDEFECTO = {"fps": 24, "camara": "renderCam", "formato": "abc"}\n\ndef cargar(ruta):\n    try:\n        with open(ruta, encoding="utf-8") as f:\n            datos = json.load(f)\n    except FileNotFoundError:\n        return dict(DEFECTO)\n    return {**DEFECTO, **datos}\n'
    }
  ],

  summary: [
    '`load`/`dump` con archivos, `loads`/`dumps` con texto (la s es de *string*).',
    'Abre archivos con `with open(..., encoding="utf-8")`: se cierran solos.',
    'Valores por defecto: `{**DEFECTO, **usuario}`; si falta el archivo, usa una copia del defecto.'
  ]
});
})();
