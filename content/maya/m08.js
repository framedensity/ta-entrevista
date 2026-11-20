(function () {
var SETUP = [
  'from maya import cmds as _c',
  'for _n in ["hero_geo", "boss_geo", "rock_geo"]:',
  '    _c.polyCube(name=_n)',
  '_c.select("hero_geo", "boss_geo")',
  'del _n'
].join('\n') + '\n';
var FILES = 'Escena:\n  hero_geo, boss_geo, rock_geo  (mesh)\nSelección actual: hero_geo, boss_geo';

TA.add({
  id: 'm08',
  title: 'Buenas prácticas en Maya',
  en: 'undo chunks, no selection, None',

  explain: [
    'Un script que funciona en tu escena no es lo mismo que una herramienta que funciona para 30 artistas. Estas son las reglas que separan una cosa de la otra.',
    '### 1. Un solo Ctrl+Z: undo chunk',
    'Si tu herramienta hace 500 cambios, el artista necesitaría 500 Ctrl+Z para deshacerla. Con un **undo chunk**, todo cuenta como un solo paso.',
    { type: 'analogy', text: 'es como meter todos los cambios en una sola caja. Deshacer tira la caja entera, no cosa por cosa.' },
    '```python\ncmds.undoInfo(openChunk=True)\ntry:\n    hacer_muchos_cambios()\nfinally:\n    cmds.undoInfo(closeChunk=True)\n```',
    { type: 'warn', text: 'el `finally` es obligatorio. Si hay un error y el chunk no se cierra, el *undo* de Maya queda roto para el resto de la sesión.' },
    'Con un **gestor de contexto** (`with`) queda aún más limpio y no se olvida nunca:',
    '```python\nfrom contextlib import contextmanager\n\n@contextmanager\ndef undo_chunk():\n    cmds.undoInfo(openChunk=True)\n    try:\n        yield\n    finally:\n        cmds.undoInfo(closeChunk=True)\n\nwith undo_chunk():\n    hacer_muchos_cambios()\n```',
    '### 2. No dependas de la selección',
    { type: 'compare',
      badTitle: 'Usa la selección por dentro: no se puede llamar desde otro código',
      bad: 'def ocultar():\n    for n in cmds.ls(sl=True):\n        cmds.setAttr(n + ".visibility", 0)',
      goodTitle: 'Recibe los nodos; la interfaz pasa la selección',
      good: 'def ocultar(nodos):\n    for n in nodos:\n        cmds.setAttr(n + ".visibility", 0)\n\nocultar(cmds.ls(sl=True))  # solo en el botón' },
    '### 3. Espera None y nodos que no existen',
    '`listRelatives`, `listConnections`, `keyframe`… devuelven `None`. Los nodos pueden haberse borrado. Usa `or []` y `cmds.objExists()`.',
    '### 4. Nombres únicos',
    'Si dos nodos se llaman igual en grupos distintos, el nombre corto da error. Trabaja con `ls(long=True)` cuando la escena es grande.',
    { type: 'tip', text: 'si te enseñan un script y te preguntan «¿qué mejorarías?», revisa estas cuatro cosas en orden: undo, selección, None, nombres. Casi siempre hay algo.' }
  ],

  example: {
    intro: 'Una función que cambia varios nodos, en un solo paso de undo.',
    lines: [
      { code: 'from contextlib import contextmanager\nfrom maya import cmds', note: 'Importamos.' },
      { code: '@contextmanager\ndef undo_chunk():\n    cmds.undoInfo(openChunk=True)\n    try:\n        yield\n    finally:\n        cmds.undoInfo(closeChunk=True)', note: 'Abre el chunk, deja trabajar (`yield`) y lo cierra **siempre**.' },
      { code: 'def ocultar(nodos):\n    with undo_chunk():\n        for n in nodos:\n            if cmds.objExists(n):\n                cmds.setAttr(n + ".visibility", False)', note: 'Recibe los nodos, comprueba que existen y lo hace todo en un paso de undo.' },
      { code: 'ocultar(["hero_geo", "no_existe"])\nprint(cmds.getAttr("hero_geo.visibility"))', note: 'El nodo que no existe se ignora sin error.' }
    ],
    output: 'False'
  },

  mini: [
    {
      q: '¿Por qué el `closeChunk` va dentro de un `finally`?',
      options: ['Por estilo', 'Para que se cierre aunque haya un error; si no, el undo de Maya queda roto', 'Porque Maya lo exige para funcionar'],
      answer: 1,
      why: 'Un chunk abierto sin cerrar deja el historial de undo en mal estado.'
    },
    {
      q: '¿Qué es mejor para una función de herramienta?',
      options: ['Leer `cmds.ls(sl=True)` dentro', 'Recibir la lista de nodos como parámetro', 'Seleccionar todo con `cmds.select(all=True)`'],
      answer: 1,
      why: 'Así se puede usar desde un botón, desde un lote o desde un test.'
    }
  ],

  exercises: [
    {
      id: 'e1',
      title: 'Tu propio undo_chunk',
      prompt: 'Escribe el gestor de contexto `undo_chunk()` con `@contextmanager`. Debe abrir el chunk al entrar y **cerrarlo siempre**, incluso si dentro hay un error.',
      setup: SETUP, files: FILES,
      starter: 'from contextlib import contextmanager\nfrom maya import cmds\n\n@contextmanager\ndef undo_chunk():\n    # tu código\n    yield\n',
      tests: [
        { check: "(lambda: [cmds._undo_log.clear(), _probar_ok(), list(cmds._undo_log)][2])() == ['open', 'close']", msg: 'abre y cierra el chunk' },
        { check: "(lambda: [cmds._undo_log.clear(), _probar_error(), list(cmds._undo_log)][2])() == ['open', 'close']", msg: 'lo cierra aunque haya un error dentro' }
      ],
      setup: SETUP + 'def _probar_ok():\n    with undo_chunk():\n        pass\n\ndef _probar_error():\n    try:\n        with undo_chunk():\n            raise ValueError("fallo")\n    except ValueError:\n        pass\n',
      hints: ['`cmds.undoInfo(openChunk=True)` antes del `try`.', '`try: yield` / `finally: cmds.undoInfo(closeChunk=True)`'],
      solution: 'from contextlib import contextmanager\nfrom maya import cmds\n\n@contextmanager\ndef undo_chunk():\n    cmds.undoInfo(openChunk=True)\n    try:\n        yield\n    finally:\n        cmds.undoInfo(closeChunk=True)\n'
    },
    {
      id: 'e2',
      title: 'Sin depender de la selección',
      prompt: 'Reescribe `ocultar` para que **reciba** la lista de nodos en vez de leer la selección.\n\nDebe devolver la lista de nodos que **no** existían (y saltarlos sin error).',
      setup: SETUP, files: FILES,
      starter: 'from maya import cmds\n\ndef ocultar():\n    for n in cmds.ls(sl=True):\n        cmds.setAttr(n + ".visibility", False)\n',
      tests: [
        { check: "ocultar(['rock_geo', 'fantasma']) == ['fantasma']", msg: 'devuelve los que no existen' },
        { check: "cmds.getAttr('rock_geo.visibility') is False and cmds.getAttr('hero_geo.visibility') is True", msg: 'oculta solo los nodos que recibe (no la selección)' }
      ],
      hints: ['`def ocultar(nodos):`', 'Dentro: `if not cmds.objExists(n): faltan.append(n); continue`'],
      solution: 'from maya import cmds\n\ndef ocultar(nodos):\n    faltan = []\n    for n in nodos:\n        if not cmds.objExists(n):\n            faltan.append(n)\n            continue\n        cmds.setAttr(n + ".visibility", False)\n    return faltan\n'
    },
    {
      id: 'e3',
      title: 'Una herramienta completa en pequeño',
      prompt: 'Escribe `mover_a_grupo(nodos, grupo)`:\n\n- Crea el grupo vacío si no existe (`cmds.group(empty=True, name=grupo)`).\n- Mete dentro los nodos que existan.\n- Todo en **un solo** undo chunk (abre y cierra con `undoInfo`, con `finally`).\n- Devuelve la lista **ordenada** de hijos del grupo al terminar.',
      setup: SETUP, files: FILES,
      starter: 'from maya import cmds\n\ndef mover_a_grupo(nodos, grupo):\n    # tu código\n    pass\n',
      tests: [
        { check: "mover_a_grupo(['hero_geo', 'boss_geo', 'nada'], 'chars_grp') == ['boss_geo', 'hero_geo']", msg: 'mete los nodos que existen y devuelve los hijos' },
        { check: "cmds._undo_log[-2:] == ['open', 'close']", msg: 'usa un undo chunk abierto y cerrado' },
        { check: "mover_a_grupo(['rock_geo'], 'chars_grp') == ['boss_geo', 'hero_geo', 'rock_geo']", msg: 'si el grupo ya existe, lo reutiliza' }
      ],
      hints: ['`if not cmds.objExists(grupo): cmds.group(empty=True, name=grupo)`', 'Al final: `return sorted(cmds.listRelatives(grupo, children=True) or [])`'],
      solution: 'from maya import cmds\n\ndef mover_a_grupo(nodos, grupo):\n    cmds.undoInfo(openChunk=True)\n    try:\n        if not cmds.objExists(grupo):\n            cmds.group(empty=True, name=grupo)\n        for n in nodos:\n            if cmds.objExists(n):\n                cmds.parent(n, grupo)\n    finally:\n        cmds.undoInfo(closeChunk=True)\n    return sorted(cmds.listRelatives(grupo, children=True) or [])\n'
    }
  ],

  summary: [
    'Undo chunk con `finally` (o un gestor `with`): todo se deshace en un paso.',
    'Las funciones reciben los nodos; solo el botón lee la selección.',
    'Espera `None` (`or []`), comprueba `objExists` y usa nombres largos si hay duplicados.'
  ]
});
})();
