TA.add({
  id: 'm09',
  title: 'OpenMaya API 2.0',
  en: 'OpenMaya',

  explain: [
    '`maya.cmds` es cómodo, pero trabaja con **texto**: nombres de nodos, `"nodo.atributo"`. Para operaciones pesadas (millones de vértices) o para reaccionar a eventos, se usa la **API**: `maya.api.OpenMaya`.',
    { type: 'analogy', text: '`cmds` es pedir algo en la ventanilla: dices el nombre y te lo traen. OpenMaya es entrar al almacén con una llave: más trabajo para entrar, pero coges todo de golpe y mucho más rápido.' },
    '### API 2.0 (no la 1.0)',
    'Hay dos versiones. Usa siempre la **2.0**: `import maya.api.OpenMaya as om`. Es más «pitónica» y más rápida. La 1.0 (`import maya.OpenMaya`) es antigua.',
    '### Las piezas básicas',
    '- `om.MSelectionList()` → una lista donde metes nombres para obtener sus «llaves».\n- `MDagPath` → la llave de un nodo del árbol DAG (con su ruta).\n- `MObject` → la llave de cualquier nodo.\n- **Function sets** (`MFn...`): herramientas para trabajar con un tipo: `MFnMesh` (mallas), `MFnTransform`, `MFnDependencyNode` (cualquier nodo).',
    '```python\nimport maya.api.OpenMaya as om\n\nsel = om.MSelectionList()\nsel.add("hero_geo")\ndag = sel.getDagPath(0)\nmalla = om.MFnMesh(dag)\npuntos = malla.getPoints(om.MSpace.kWorld)   # todos los vértices de una vez\n```',
    '### ¿Cuándo usar la API?',
    '- **Rendimiento**: leer o escribir muchos vértices, pesos de *skin*, etc. `cmds.xform` vértice a vértice es lentísimo; `getPoints` lo hace en una llamada.\n- **Callbacks**: reaccionar a eventos con `om.MMessage` / `MSceneMessage` (al guardar, al abrir, al renombrar).\n- **Nodos y comandos propios** (*plugins*).',
    { type: 'warn', text: 'la API no tiene *undo* automático como `cmds`. Si modificas la escena con la API fuera de un comando de plugin, el Ctrl+Z puede no funcionar. Para cambios que el artista querrá deshacer, `cmds` suele ser más seguro.' },
    { type: 'cg', text: 'una herramienta que comprueba si dos personajes se atraviesan en una cinemática de 600 frames necesita leer posiciones de vértices miles de veces: eso es trabajo para `MFnMesh.getPoints`, no para `cmds`.' },
    { type: 'tip', text: 'no hace falta saber la API de memoria. Lo que se espera es que sepas **cuándo** usarla y por qué: rendimiento, callbacks, plugins.' },
    'Esta lección no tiene simulador: los ejercicios son de respuesta escrita, y comparas con una respuesta modelo.'
  ],

  example: {
    intro: 'Leer las posiciones de todos los vértices: `cmds` frente a la API.',
    lines: [
      { label: 'cmds (lento)', code: 'n = cmds.polyEvaluate("hero_geo", vertex=True)\npuntos = [cmds.xform(f"hero_geo.vtx[{i}]", q=True, t=True, ws=True)\n          for i in range(n)]', note: 'Una llamada por vértice. Con 100 000 vértices, 100 000 llamadas.' },
      { label: 'API 2.0 (rápido)', code: 'import maya.api.OpenMaya as om\nsel = om.MSelectionList()\nsel.add("hero_geo")\nmalla = om.MFnMesh(sel.getDagPath(0))\npuntos = malla.getPoints(om.MSpace.kWorld)', note: 'Una sola llamada devuelve un `MPointArray` con todos los vértices.' },
      { label: 'Callback', code: 'def al_guardar(*args):\n    print("Comprobando la escena antes de guardar…")\n\nid_cb = om.MSceneMessage.addCallback(om.MSceneMessage.kBeforeSave, al_guardar)\n# más tarde:\nom.MMessage.removeCallback(id_cb)', note: 'Ejecuta tu función antes de cada guardado. Hay que **quitar** el callback cuando ya no se usa.' }
    ],
    outro: 'Fíjate en el último punto: un callback que no se quita sigue activo hasta cerrar Maya. Las herramientas guardan el id y lo quitan al cerrarse.'
  },

  mini: [
    {
      q: '¿Cuál es la razón principal para usar OpenMaya en vez de `cmds`?',
      options: ['Es más fácil de leer', 'Rendimiento con muchos datos, callbacks y plugins', 'Tiene undo automático'],
      answer: 1,
      why: 'La API es más rápida y permite cosas que `cmds` no puede, pero es más larga de escribir y no tiene undo automático.'
    },
    {
      q: '¿Qué importas para la API 2.0?',
      options: ['`import maya.OpenMaya`', '`import maya.api.OpenMaya as om`', '`from maya import api2`'],
      answer: 1,
      why: '`maya.OpenMaya` es la API 1.0, antigua.'
    }
  ],
  extra: [
    {
      q: '¿Qué pasa si registras un callback y nunca lo quitas?',
      options: ['Nada', 'Sigue ejecutándose hasta cerrar Maya, y puede duplicarse si recargas la herramienta', 'Maya lo quita al guardar'],
      answer: 1,
      why: 'Por eso se guarda el id y se llama a `MMessage.removeCallback` al cerrar la herramienta.'
    }
  ],

  exercises: [
    {
      id: 'e1',
      kind: 'free',
      title: '¿cmds o API?',
      prompt: 'Te piden una herramienta que, para una cinemática de 600 frames, compruebe en cada frame si la mano del personaje atraviesa la mesa (comparando posiciones de vértices).\n\n¿Usarías `cmds` o OpenMaya? Explica por qué y cómo lo plantearías a grandes rasgos.',
      checklist: [
        'Elijo OpenMaya (API 2.0) para leer los vértices, por rendimiento.',
        'Uso `MFnMesh.getPoints` (todos los puntos en una llamada), no un `xform` por vértice.',
        'Evalúo cada frame sin mover la línea de tiempo (o con `MDGContext` / tiempo en la API).',
        'Reduzco el problema: solo los vértices de la mano y una caja de la mesa, no toda la malla.',
        'El resultado es un informe (frames con problema) que el artista puede revisar.'
      ],
      model: 'Usaría la **API 2.0**. Con `cmds` tendría que pedir cada vértice con `xform`, y en 600 frames serían millones de llamadas.\n\n1. Obtengo el `MDagPath` de la malla con `MSelectionList`.\n2. Para cada frame, leo todos los puntos con `MFnMesh.getPoints(om.MSpace.kWorld)` en una sola llamada (evaluando en ese tiempo, sin mover la línea de tiempo).\n3. Para que sea rápido, solo miro los vértices de la mano y comparo con la caja (*bounding box*) de la mesa.\n4. Devuelvo una lista de frames con colisión, para que el animador la revise. La herramienta **no** corrige nada sola.',
      followups: ['¿Cómo harías que la comprobación no tarde minutos?', '¿Qué haces si el personaje tiene un *deformer* que cambia los vértices?', '¿Cómo mostrarías el resultado al animador?']
    },
    {
      id: 'e2',
      kind: 'free',
      title: 'Un callback al guardar',
      prompt: 'Quieres que, cada vez que el artista guarde, se compruebe la nomenclatura de la escena (tu verificador de p18).\n\nEscribe el código (o los pasos) para registrar ese callback y explica qué cuidados tendrías.',
      checklist: [
        'Uso `om.MSceneMessage.addCallback(om.MSceneMessage.kBeforeSave, funcion)`.',
        'Guardo el id que devuelve para poder quitarlo después.',
        'Quito el callback con `om.MMessage.removeCallback(id)` al cerrar o recargar la herramienta (para no duplicarlo).',
        'La comprobación es rápida y no bloquea el guardado si falla: avisa, no impide guardar (o lo decide el equipo).',
        'Atrapo los errores dentro del callback: un error ahí no debe romper el guardado.'
      ],
      model: '```python\nimport maya.api.OpenMaya as om\n\n_callbacks = []\n\ndef _antes_de_guardar(*args):\n    try:\n        problemas = revisar_escena()\n        if problemas:\n            om.MGlobal.displayWarning(f"{len(problemas)} nombres no cumplen la convención")\n    except Exception:\n        om.MGlobal.displayWarning("El verificador falló; se guarda igualmente")\n\ndef registrar():\n    quitar()\n    _callbacks.append(om.MSceneMessage.addCallback(om.MSceneMessage.kBeforeSave, _antes_de_guardar))\n\ndef quitar():\n    for cb in _callbacks:\n        om.MMessage.removeCallback(cb)\n    _callbacks.clear()\n```\n\nClaves: guardar el id, quitarlo antes de volver a registrar (si no, se duplica al recargar), y que un error en el callback nunca impida guardar el trabajo del artista.',
      followups: ['¿Bloquearías el guardado si hay errores de nombre? ¿Por qué?', '¿Qué pasa si recargas el módulo sin quitar el callback?', '¿Dónde registrarías el callback al arrancar Maya (`userSetup.py`)?']
    }
  ],

  summary: [
    'API 2.0: `import maya.api.OpenMaya as om`; `MSelectionList` → `MDagPath` → `MFnMesh`, etc.',
    'Úsala por rendimiento (muchos datos), para callbacks y para plugins.',
    'No tiene undo automático; los callbacks se registran con id y se quitan siempre.'
  ]
});
