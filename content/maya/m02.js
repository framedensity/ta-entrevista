(function () {
var SETUP = [
  'from maya import cmds as _c',
  'for _n in ["hero_geo", "boss_geo", "sword_geo"]:',
  '    _c.polyCube(name=_n)',
  '_c.spaceLocator(name="hero_ctrl")',
  '_c.camera(name="cam_sh010")',
  '_c.camera(name="cam_sh020")',
  'del _n'
].join('\n') + '\n';
var FILES = 'Escena:\n  hero_geo, boss_geo, sword_geo  (mesh)\n  hero_ctrl                      (locator)\n  cam_sh010, cam_sh020           (camera)\n  + persp, top, front, side';

TA.add({
  id: 'm02',
  title: 'Crear y listar nodos',
  en: 'createNode / ls',

  explain: [
    'Casi todas las herramientas empiezan igual: **buscar** los nodos con los que trabajar. El comando estrella es `cmds.ls()`.',
    { type: 'analogy', text: '`ls` es el buscador de una biblioteca. Puedes pedir «todos los libros», «los de este autor» o «los que empiezan por *Hero*».' },
    '### ls: buscar',
    '- `cmds.ls()` → todos los nodos.\n- `cmds.ls(type="mesh")` → solo un tipo (también una lista de tipos).\n- `cmds.ls("*_geo")` → con comodines: `*` = cualquier texto.\n- `cmds.ls(selection=True)` (o `sl=True`) → la selección.\n- `cmds.ls(long=True)` → **rutas completas**: `|grupo|hero_geo`.',
    { type: 'warn', text: 'dos nodos en grupos distintos **pueden llamarse igual**. El nombre corto no siempre es único; la ruta larga (`long=True`) sí.' },
    '### Crear nodos',
    '- `cmds.createNode("transform", name="x")` → crea un nodo de cualquier tipo.\n- `cmds.spaceLocator(name="x")`, `cmds.polyCube(name="x")`, `cmds.camera(name="x")` → atajos que crean transform + shape. Devuelven una **lista**.',
    { type: 'warn', text: 'si pides un nombre que ya existe, Maya le añade un número: pides `hero_geo` y obtienes `hero_geo1`. Usa siempre el nombre que **devuelve** el comando, no el que pediste.' },
    { type: 'cg', text: 'el exportador busca `cmds.ls("cam_sh*", type="transform")` para encontrar todas las cámaras de tomas, y `cmds.ls("*_geo", type="transform")` para la geometría a exportar.' }
  ],

  example: {
    intro: 'Buscamos y creamos.',
    lines: [
      { code: 'from maya import cmds', note: 'Importamos los comandos.' },
      { code: 'print(cmds.ls("*_geo", type="transform"))', note: 'Transforms cuyo nombre acaba en `_geo`.' },
      { code: 'print(cmds.ls("cam_sh*", type="transform"))', note: 'Las cámaras de toma (y no `persp`).' },
      { code: 'loc = cmds.spaceLocator(name="hero_ctrl")[0]', note: 'Ya existe `hero_ctrl`… `spaceLocator` devuelve una lista; el nombre real es el primero.' },
      { code: 'print(loc)', note: 'Maya le puso un número.' }
    ],
    output: "['hero_geo', 'boss_geo', 'sword_geo']\n['cam_sh010', 'cam_sh020']\nhero_ctrl1"
  },

  mini: [
    {
      q: 'Haces `cmds.polyCube(name="box")` y ya existe un `box`. ¿Cómo se llama el nuevo?',
      options: ['`box` (y el viejo se borra)', '`box1`', 'Da error'],
      answer: 1,
      why: 'Maya evita duplicados añadiendo un número. Por eso hay que usar el valor que devuelve el comando.'
    },
    {
      q: '¿Qué hace `cmds.ls(long=True)`?',
      options: ['Lista más nodos', 'Devuelve rutas completas como `|grupo|nodo`', 'Lista los nodos más grandes'],
      answer: 1,
      why: 'La ruta completa es única aunque haya nombres cortos repetidos.'
    }
  ],

  exercises: [
    {
      id: 'e1',
      title: 'Buscar la geometría',
      prompt: 'Crea `geo`: lista **ordenada** de transforms cuyo nombre termina en `_geo`.',
      setup: SETUP, files: FILES,
      starter: 'from maya import cmds\n\n',
      tests: [{ check: "geo == ['boss_geo', 'hero_geo', 'sword_geo']", msg: '`geo` tiene los tres _geo ordenados' }],
      hints: ['`cmds.ls("*_geo", type="transform")`'],
      solution: 'from maya import cmds\n\ngeo = sorted(cmds.ls("*_geo", type="transform"))\n'
    },
    {
      id: 'e2',
      title: 'Crear locators para cada cámara',
      prompt: 'Para cada transform que empieza por `cam_sh`, crea un locator llamado `<camara>_aim` (por ejemplo `cam_sh010_aim`).\n\nGuarda en `creados` la lista de nombres **que devuelve Maya**.',
      setup: SETUP, files: FILES,
      starter: 'from maya import cmds\n\ncreados = []\n',
      tests: [
        { check: "sorted(creados) == ['cam_sh010_aim', 'cam_sh020_aim']", msg: 'se crearon los dos locators' },
        { check: "cmds.objExists('cam_sh010_aim') and cmds.nodeType(cmds.listRelatives('cam_sh010_aim', shapes=True)[0]) == 'locator'", msg: 'son locators de verdad' }
      ],
      hints: ['`for cam in cmds.ls("cam_sh*", type="transform"):`', '`creados.append(cmds.spaceLocator(name=cam + "_aim")[0])`'],
      solution: 'from maya import cmds\n\ncreados = []\nfor cam in cmds.ls("cam_sh*", type="transform"):\n    creados.append(cmds.spaceLocator(name=cam + "_aim")[0])\n'
    },
    {
      id: 'e3',
      title: 'Crear sin pisar',
      prompt: 'Escribe `crear_grupo(nombre)` que cree un transform vacío con `createNode` y devuelva el **nombre real**. Si lo llamas dos veces con `"export_grp"`, debe devolver `"export_grp"` y luego `"export_grp1"`.',
      setup: SETUP, files: FILES,
      starter: 'from maya import cmds\n\ndef crear_grupo(nombre):\n    # tu código\n    pass\n',
      tests: [
        { check: "crear_grupo('export_grp') == 'export_grp' and crear_grupo('export_grp') == 'export_grp1'", msg: 'devuelve el nombre real (con número la segunda vez)' },
        { check: "cmds.nodeType('export_grp') == 'transform'", msg: 'el nodo es un transform' }
      ],
      hints: ['`return cmds.createNode("transform", name=nombre)`'],
      solution: 'from maya import cmds\n\ndef crear_grupo(nombre):\n    return cmds.createNode("transform", name=nombre)\n'
    }
  ],

  summary: [
    '`cmds.ls()` busca: por tipo, con comodines `*`, la selección o con rutas largas.',
    'Los atajos (`spaceLocator`, `polyCube`, `camera`) devuelven una lista.',
    'Usa siempre el nombre que devuelve Maya: puede añadir un número.'
  ]
});
})();
