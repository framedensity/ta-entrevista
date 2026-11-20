TA.add({
  id: 'p03',
  title: 'Diccionarios',
  en: 'dictionaries',

  explain: [
    'En una lista, buscas los datos por su número. Pero a veces es más cómodo buscarlos por su **nombre**.',
    'Por ejemplo, de una toma quieres saber su inicio y su fin. Recordar que «el inicio es el dato 1» es difícil. Recordar `"inicio"` es fácil.',
    { type: 'analogy', text: 'un **diccionario** (*dictionary*) es como la agenda del móvil. Buscas por el nombre de la persona y obtienes su teléfono.' },
    'Cada entrada tiene dos partes:',
    '- La **clave** (*key*): el nombre que usas para buscar. Por ejemplo, `"inicio"`.\n- El **valor** (*value*): el dato guardado. Por ejemplo, `1001`.',
    { type: 'figure', html:
      '<svg viewBox="0 0 330 132" role="img" aria-label="Diccionario: tres claves, nombre, inicio y fin, apuntan a sus valores">' +
      '<g font-family="ui-monospace,Menlo,monospace" font-size="13">' +
      '<rect x="10" y="8" width="110" height="30" rx="8" style="fill:var(--acc)"/><text x="65" y="28" text-anchor="middle" style="fill:var(--card)">"nombre"</text>' +
      '<rect x="200" y="8" width="120" height="30" rx="8" style="fill:var(--accbg);stroke:var(--acc)"/><text x="260" y="28" text-anchor="middle" style="fill:var(--ink)">"sh010"</text>' +
      '<rect x="10" y="50" width="110" height="30" rx="8" style="fill:var(--acc)"/><text x="65" y="70" text-anchor="middle" style="fill:var(--card)">"inicio"</text>' +
      '<rect x="200" y="50" width="120" height="30" rx="8" style="fill:var(--accbg);stroke:var(--acc)"/><text x="260" y="70" text-anchor="middle" style="fill:var(--ink)">1001</text>' +
      '<rect x="10" y="92" width="110" height="30" rx="8" style="fill:var(--acc)"/><text x="65" y="112" text-anchor="middle" style="fill:var(--card)">"fin"</text>' +
      '<rect x="200" y="92" width="120" height="30" rx="8" style="fill:var(--accbg);stroke:var(--acc)"/><text x="260" y="112" text-anchor="middle" style="fill:var(--ink)">1048</text>' +
      '<g style="stroke:var(--acc);stroke-width:2"><line x1="122" y1="23" x2="196" y2="23"/><line x1="122" y1="65" x2="196" y2="65"/><line x1="122" y1="107" x2="196" y2="107"/></g>' +
      '<text x="160" y="18" text-anchor="middle" font-size="11" style="fill:var(--mute)">clave → valor</text>' +
      '</g></svg>' },
    'Escribes un diccionario con llaves `{ }`. Cada pareja va así: `clave: valor`. Las parejas se separan con comas.',
    '```python\ntoma = {"nombre": "sh010", "inicio": 1001, "fin": 1048}\n```',
    '### Leer, añadir y buscar con seguridad',
    'Para **leer** un valor, pones la clave entre corchetes: `toma["inicio"]`. Si la clave no existe, Python da un error (`KeyError`).',
    'Para **añadir o cambiar** un valor, lo asignas: `toma["camara"] = "cam_A"`. Si la clave no existía, se crea.',
    'Para leer **con seguridad**, usa `.get()`. Si la clave no existe, no hay error: recibes el valor por defecto que tú elijas.',
    { type: 'cg', text: 'en Maya, cada nodo tiene atributos: `translateX`, `rotateY`… Un diccionario es perfecto para guardarlos: nombre del atributo → valor. También para la configuración de una herramienta.' }
  ],

  example: {
    intro: 'Vamos a guardar los datos de una toma y calcular su duración.',
    lines: [
      { code: 'toma = {"nombre": "sh010", "inicio": 1001, "fin": 1048}', note: 'Un diccionario con tres parejas clave: valor.' },
      { code: 'duracion = toma["fin"] - toma["inicio"] + 1', note: 'Leemos dos valores por su clave. Sumamos 1 porque contamos el frame de inicio y el de fin: 1048 - 1001 + 1 = 48.' },
      { code: 'toma["camara"] = "cam_A"', note: 'La clave `"camara"` no existía, así que se añade.' },
      { code: 'fps = toma.get("fps", 24)', note: 'La clave `"fps"` no existe. Con `.get()` no hay error: recibimos el valor por defecto, `24`.' },
      { code: 'print(duracion, toma["camara"], fps)', note: 'Mostramos los resultados.' },
      { code: 'print(list(toma.keys()))', note: '`.keys()` da todas las claves. Con `list()` las vemos como una lista.' }
    ],
    output: "48 cam_A 24\n['nombre', 'inicio', 'fin', 'camara']",
    outro: 'Si hubiéramos escrito `toma["fps"]` sin `.get()`, el programa se habría parado con un `KeyError`.'
  },

  mini: [
    {
      q: 'Si `toma = {"inicio": 1001, "fin": 1048}`, ¿qué es `toma["inicio"]`?',
      options: ['`"inicio"`', '`1001`', '`1048`'],
      answer: 1,
      why: 'Con la clave `"inicio"` obtienes su valor: `1001`.'
    },
    {
      q: 'La clave `"fps"` no existe. ¿Qué devuelve `toma.get("fps", 24)`?',
      options: ['Un error `KeyError`', '`24`', '`None`'],
      answer: 1,
      why: '`.get()` no da error. Si la clave no existe, devuelve el valor por defecto que le pasas: `24`.'
    }
  ],

  exercises: [
    {
      id: 'e1',
      title: 'Los datos de una toma',
      prompt: 'Crea un diccionario `toma` con tres parejas:\n\n- `"nombre"`: `"sh020"`\n- `"inicio"`: `1001`\n- `"fin"`: `1096`',
      starter: '# Escribe tu código aquí\n',
      tests: [
        { check: "toma.get('nombre') == 'sh020'", msg: 'la clave "nombre" vale "sh020"' },
        { check: "toma.get('inicio') == 1001", msg: 'la clave "inicio" vale 1001' },
        { check: "toma.get('fin') == 1096", msg: 'la clave "fin" vale 1096' }
      ],
      hints: ['Usa llaves `{ }` y escribe cada pareja como `"clave": valor`.', '`toma = {"nombre": "sh020", "inicio": 1001, "fin": 1096}`'],
      solution: 'toma = {"nombre": "sh020", "inicio": 1001, "fin": 1096}\n'
    },
    {
      id: 'e2',
      title: '¿Cuánto dura?',
      prompt: 'Crea `duracion` con la cantidad de frames de la toma. Cuenta el frame de inicio y el de fin.',
      starter: 'toma = {"nombre": "sh020", "inicio": 1001, "fin": 1096}\n\n',
      tests: [
        { check: 'duracion == 96', msg: '`duracion` vale 96' }
      ],
      hints: ['Lee los valores con `toma["fin"]` y `toma["inicio"]`.', 'No olvides el `+ 1`.'],
      solution: 'toma = {"nombre": "sh020", "inicio": 1001, "fin": 1096}\n\nduracion = toma["fin"] - toma["inicio"] + 1\n'
    },
    {
      id: 'e3',
      title: 'Añadir y buscar con seguridad',
      prompt: 'Añade a `toma` la clave `"camara"` con el valor `"cam_B"`.\n\nLuego crea `fps` con el valor de la clave `"fps"`. Esa clave no existe, así que usa `.get()` con `24` por defecto.',
      starter: 'toma = {"nombre": "sh020", "inicio": 1001, "fin": 1096}\n\n',
      tests: [
        { check: "toma.get('camara') == 'cam_B'", msg: 'la clave "camara" vale "cam_B"' },
        { check: 'fps == 24', msg: '`fps` vale 24' },
        { check: "'fps' not in toma", msg: 'no has creado la clave "fps" a mano' }
      ],
      hints: ['Para añadir: `toma["camara"] = "cam_B"`.', 'Para leer con seguridad: `toma.get("fps", 24)`.'],
      solution: 'toma = {"nombre": "sh020", "inicio": 1001, "fin": 1096}\n\ntoma["camara"] = "cam_B"\nfps = toma.get("fps", 24)\n'
    }
  ],

  summary: [
    'Un **diccionario** guarda parejas **clave: valor** entre llaves `{ }`.',
    'Lees con `d["clave"]` y añades con `d["clave"] = valor`.',
    '`.get(clave, por_defecto)` lee sin error si la clave no existe.'
  ]
});
