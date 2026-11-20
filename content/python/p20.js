TA.add({
  id: 'p20',
  title: 'TA: configuración de una herramienta',
  en: 'tool config with defaults',

  explain: [
    'Una herramienta de estudio se usa en muchos proyectos. Cada proyecto, e incluso cada toma, quiere algo distinto: otros fps, otro formato, otra escala. La solución es una **configuración en capas**.',
    { type: 'analogy', text: 'es como la ropa en capas: la camiseta (valores por defecto) siempre está; encima, el jersey del proyecto; y si hace frío en una toma concreta, el abrigo de esa toma. Lo de fuera es lo que se ve.' },
    '### Capas: defecto → proyecto → toma',
    'Cada capa **solo** escribe lo que cambia. El resultado final se calcula combinándolas, de la más general a la más concreta.',
    '### El problema de los diccionarios anidados',
    '`{**a, **b}` combina solo el **primer nivel**. Si `b` tiene `{"export": {"escala": 2}}`, borra todo el `export` de `a`, no solo la escala.',
    { type: 'compare',
      badTitle: 'Combinación superficial: se pierde "formato"',
      bad: 'a = {"export": {"formato": "fbx", "escala": 1}}\nb = {"export": {"escala": 2}}\n{**a, **b}\n# {"export": {"escala": 2}}',
      goodTitle: 'Combinación profunda (recursiva)',
      good: 'def combinar(a, b):\n    r = dict(a)\n    for k, v in b.items():\n        if isinstance(v, dict) and isinstance(r.get(k), dict):\n            r[k] = combinar(r[k], v)\n        else:\n            r[k] = v\n    return r' },
    'La función se llama a sí misma para los diccionarios de dentro: eso es **recursión**.',
    '### Validar antes de usar',
    'Una configuración mal escrita (fps en texto, un formato que no existe) debe detectarse **al cargar**, con un mensaje claro, no a mitad de una exportación de 3 horas.',
    { type: 'cg', text: 'el proyecto exporta a 30 fps en `.fbx`, pero la toma sh045 (cámara lenta) necesita 120 fps. Solo esa toma lleva el abrigo `{"fps": 120}`.' },
    { type: 'tip', text: 'la combinación profunda de diccionarios es una pregunta de código frecuente. Explica el caso que rompe la versión superficial.' }
  ],

  example: {
    intro: 'Tres capas de configuración.',
    lines: [
      { code: 'DEFECTO = {"fps": 24, "export": {"formato": "fbx", "escala": 1.0}}', note: 'La camiseta: lo que trae la herramienta.' },
      { code: 'proyecto = {"fps": 30}', note: 'El jersey: el proyecto solo cambia los fps.' },
      { code: 'toma = {"export": {"escala": 0.01}}', note: 'El abrigo: esta toma solo cambia la escala.' },
      { code: 'final = combinar(combinar(DEFECTO, proyecto), toma)', note: 'De lo general a lo concreto.' },
      { code: 'print(final)', note: 'Se mantiene el formato aunque la toma tocó `export`.' }
    ],
    output: "{'fps': 30, 'export': {'formato': 'fbx', 'escala': 0.01}}"
  },

  mini: [
    {
      q: '¿Qué da `{**{"e": {"a": 1, "b": 2}}, **{"e": {"b": 9}}}`?',
      options: ['`{"e": {"a": 1, "b": 9}}`', '`{"e": {"b": 9}}`', 'Un error'],
      answer: 1,
      why: 'La combinación con `**` es superficial: el `"e"` de la derecha reemplaza entero al de la izquierda.'
    },
    {
      q: '¿En qué orden se combinan las capas?',
      options: ['De la más concreta a la más general', 'De la más general a la más concreta', 'Da igual'],
      answer: 1,
      why: 'Lo último que se aplica gana. Por eso la capa más concreta (la toma) va al final.'
    }
  ],

  exercises: [
    {
      id: 'e1',
      title: 'Combinación profunda',
      prompt: 'Escribe `combinar(a, b)`: devuelve un **nuevo** dict con `a` y `b` combinados. Si los dos tienen un dict en la misma clave, combínalos también (recursivo). Si no, gana `b`. **No** modifiques `a` ni `b`.',
      starter: 'def combinar(a, b):\n    # tu código\n    pass\n',
      tests: [
        { check: "combinar({'e': {'a': 1, 'b': 2}, 'x': 1}, {'e': {'b': 9}}) == {'e': {'a': 1, 'b': 9}, 'x': 1}", msg: 'combina el dict de dentro' },
        { check: "combinar({'a': {'b': {'c': 1, 'd': 2}}}, {'a': {'b': {'d': 3}}}) == {'a': {'b': {'c': 1, 'd': 3}}}", msg: 'funciona a varios niveles' },
        { check: "(lambda a: (combinar(a, {'e': {'z': 0}}), a)[1])({'e': {'y': 1}}) == {'e': {'y': 1}}", msg: 'no modifica el dict original' }
      ],
      hints: ['Empieza con `r = dict(a)` (una copia).', 'Si `v` es dict y `r.get(k)` también, `r[k] = combinar(r[k], v)`; si no, `r[k] = v`.'],
      solution: 'def combinar(a, b):\n    r = dict(a)\n    for k, v in b.items():\n        if isinstance(v, dict) and isinstance(r.get(k), dict):\n            r[k] = combinar(r[k], v)\n        else:\n            r[k] = v\n    return r\n'
    },
    {
      id: 'e2',
      title: 'Validar la configuración',
      prompt: 'Escribe `validar(cfg)` que devuelva una **lista** de textos de error (vacía si todo está bien):\n\n- `"fps"` debe ser un `int` mayor que 0 → si no: `"fps debe ser un entero positivo"`\n- `cfg["export"]["formato"]` debe estar en `{"fbx", "abc"}` → si no: `"formato no válido: <valor>"`\n\nUsa `.get()` para que no falle si falta una clave.',
      starter: 'def validar(cfg):\n    # tu código\n    pass\n',
      tests: [
        { check: "validar({'fps': 30, 'export': {'formato': 'fbx'}}) == []", msg: 'una config correcta no da errores' },
        { check: "validar({'fps': '30', 'export': {'formato': 'fbx'}}) == ['fps debe ser un entero positivo']", msg: 'fps como texto es un error' },
        { check: "validar({'fps': 24, 'export': {'formato': 'obj'}}) == ['formato no válido: obj']", msg: 'formato desconocido es un error' },
        { check: "len(validar({})) == 2", msg: 'con un dict vacío da los dos errores (y no lanza excepciones)' }
      ],
      hints: ['`fps = cfg.get("fps")` y `if not isinstance(fps, int) or fps <= 0:`', '`formato = cfg.get("export", {}).get("formato")`'],
      solution: 'def validar(cfg):\n    errores = []\n    fps = cfg.get("fps")\n    if not isinstance(fps, int) or isinstance(fps, bool) or fps <= 0:\n        errores.append("fps debe ser un entero positivo")\n    formato = cfg.get("export", {}).get("formato")\n    if formato not in {"fbx", "abc"}:\n        errores.append(f"formato no válido: {formato}")\n    return errores\n'
    },
    {
      id: 'e3',
      title: 'Configuración final de una toma',
      prompt: 'Usa tu `combinar` (pégala aquí arriba) para escribir `config_de(toma)`: combina `DEFECTO`, luego `PROYECTO`, y luego `POR_TOMA.get(toma, {})`.',
      starter: 'DEFECTO = {"fps": 24, "export": {"formato": "fbx", "escala": 1.0}}\nPROYECTO = {"fps": 30}\nPOR_TOMA = {"sh045": {"fps": 120}, "sh050": {"export": {"escala": 0.01}}}\n\n# pega aquí tu función combinar\n\ndef config_de(toma):\n    # tu código\n    pass\n',
      tests: [
        { check: "config_de('sh010') == {'fps': 30, 'export': {'formato': 'fbx', 'escala': 1.0}}", msg: 'una toma normal usa el proyecto' },
        { check: "config_de('sh045')['fps'] == 120", msg: 'sh045 va a 120 fps' },
        { check: "config_de('sh050')['export'] == {'formato': 'fbx', 'escala': 0.01}", msg: 'sh050 cambia la escala y mantiene el formato' },
        { check: "DEFECTO == {'fps': 24, 'export': {'formato': 'fbx', 'escala': 1.0}}", msg: 'DEFECTO no se ha modificado' }
      ],
      hints: ['`return combinar(combinar(DEFECTO, PROYECTO), POR_TOMA.get(toma, {}))`'],
      solution: 'DEFECTO = {"fps": 24, "export": {"formato": "fbx", "escala": 1.0}}\nPROYECTO = {"fps": 30}\nPOR_TOMA = {"sh045": {"fps": 120}, "sh050": {"export": {"escala": 0.01}}}\n\ndef combinar(a, b):\n    r = dict(a)\n    for k, v in b.items():\n        if isinstance(v, dict) and isinstance(r.get(k), dict):\n            r[k] = combinar(r[k], v)\n        else:\n            r[k] = v\n    return r\n\ndef config_de(toma):\n    return combinar(combinar(DEFECTO, PROYECTO), POR_TOMA.get(toma, {}))\n'
    }
  ],

  summary: [
    'Configuración en capas: defecto → proyecto → toma; lo más concreto gana.',
    '`{**a, **b}` es superficial; para dicts anidados, combina de forma recursiva.',
    'Valida al cargar y devuelve errores claros, sin lanzar excepciones raras.'
  ]
});
