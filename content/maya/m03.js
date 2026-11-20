(function () {
var SETUP = [
  'from maya import cmds as _c',
  '_c.createNode("transform", name="rig_grp")',
  '_c.createNode("transform", name="geo_grp", parent="rig_grp")',
  '_c.createNode("transform", name="ctrl_grp", parent="rig_grp")',
  '_c.polyCube(name="body_geo")',
  '_c.polyCube(name="head_geo")',
  '_c.parent("body_geo", "head_geo", "geo_grp")',
  '_c.spaceLocator(name="main_ctrl")',
  '_c.parent("main_ctrl", "ctrl_grp")',
  '_c.polyCube(name="sueltos_geo")'
].join('\n') + '\n';
var FILES = 'rig_grp\n  geo_grp\n    body_geo  → body_geoShape\n    head_geo  → head_geoShape\n  ctrl_grp\n    main_ctrl → main_ctrlShape\nsueltos_geo → sueltos_geoShape   (en la raíz)';

TA.add({
  id: 'm03',
  title: 'Jerarquía',
  en: 'parent / listRelatives',

  explain: [
    'La jerarquía organiza la escena: el rig dentro de un grupo, la geometría dentro de otro. Las herramientas la recorren constantemente.',
    { type: 'analogy', text: 'como en una familia: `listRelatives(parent=True)` pregunta «¿quién es tu madre?», `children=True` «¿quiénes son tus hijos?», y `allDescendents=True` «¿quiénes son todos tus descendientes: hijos, nietos…?».' },
    '### Mover en la jerarquía',
    '- `cmds.parent("hijo", "padre")` → mete el hijo bajo el padre.\n- `cmds.parent("nodo", world=True)` → lo saca a la raíz.\n- `cmds.group("a", "b", name="grp")` → crea un grupo con esos nodos.',
    '### Preguntar por la familia: listRelatives',
    '- `children=True` (por defecto) → hijos directos.\n- `parent=True` → el padre.\n- `allDescendents=True` → todos los de debajo.\n- `shapes=True` → solo shapes. `type="mesh"` → solo un tipo.\n- `fullPath=True` → rutas completas.',
    { type: 'warn', text: '`listRelatives` devuelve **`None`** (no `[]`) cuando no encuentra nada. Si haces `for x in cmds.listRelatives(...)`, tu herramienta se rompe con `TypeError` en el primer nodo sin hijos. Escribe siempre `cmds.listRelatives(...) or []`.' },
    { type: 'cg', text: 'antes de exportar un personaje, la herramienta toma `rig_grp`, busca todos los `mesh` que cuelgan de él con `allDescendents=True, type="mesh"` y exporta solo esos.' },
    { type: 'tip', text: 'el detalle del `None` de `listRelatives` es casi una contraseña entre TAs. Si lo mencionas sin que te pregunten, se nota que has escrito herramientas de verdad.' }
  ],

  example: {
    intro: 'Exploramos la familia de `rig_grp`.',
    lines: [
      { code: 'from maya import cmds', note: 'Importamos.' },
      { code: 'print(cmds.listRelatives("rig_grp"))', note: 'Hijos directos.' },
      { code: 'print(cmds.listRelatives("body_geo", parent=True))', note: 'El padre (como lista).' },
      { code: 'print(cmds.listRelatives("rig_grp", allDescendents=True, type="mesh"))', note: 'Todos los shapes de tipo mesh por debajo, a cualquier profundidad.' },
      { code: 'print(cmds.listRelatives("head_geoShape"))', note: 'Un shape no tiene hijos → `None`.' },
      { code: 'for hijo in cmds.listRelatives("head_geoShape") or []:\n    print(hijo)', note: 'Con `or []`, el bucle simplemente no hace nada. Sin error.' }
    ],
    output: "['geo_grp', 'ctrl_grp']\n['geo_grp']\n['body_geoShape', 'head_geoShape']\nNone"
  },

  mini: [
    {
      q: '¿Qué pasa con `for x in cmds.listRelatives("nodoSinHijos"):`?',
      options: ['El bucle no hace nada', '`TypeError`: no se puede recorrer `None`', 'Recorre todos los nodos de la escena'],
      answer: 1,
      why: 'Devuelve `None`. Hay que escribir `cmds.listRelatives(...) or []`.'
    },
    {
      q: '¿Qué opción de `listRelatives` da también los nietos?',
      options: ['`children=True`', '`allDescendents=True`', '`parent=True`'],
      answer: 1,
      why: '`children` solo da los hijos directos.'
    }
  ],

  exercises: [
    {
      id: 'e1',
      title: 'Ordenar la escena',
      prompt: '`sueltos_geo` está en la raíz. Mételo dentro de `geo_grp`.\n\nLuego crea `en_geo`: lista **ordenada** de hijos directos de `geo_grp`.',
      setup: SETUP, files: FILES,
      starter: 'from maya import cmds\n\n',
      tests: [
        { check: "cmds.listRelatives('sueltos_geo', parent=True) == ['geo_grp']", msg: 'sueltos_geo cuelga de geo_grp' },
        { check: "en_geo == ['body_geo', 'head_geo', 'sueltos_geo']", msg: '`en_geo` tiene los tres hijos ordenados' }
      ],
      hints: ['`cmds.parent("sueltos_geo", "geo_grp")`', '`sorted(cmds.listRelatives("geo_grp"))`'],
      solution: 'from maya import cmds\n\ncmds.parent("sueltos_geo", "geo_grp")\nen_geo = sorted(cmds.listRelatives("geo_grp"))\n'
    },
    {
      id: 'e2',
      title: 'Hijos sin sorpresas',
      prompt: 'Escribe `hijos(nodo)`: devuelve los hijos directos como **lista** (vacía si no tiene, nunca `None`).',
      setup: SETUP, files: FILES,
      starter: 'from maya import cmds\n\ndef hijos(nodo):\n    # tu código\n    pass\n',
      tests: [
        { check: "hijos('rig_grp') == ['geo_grp', 'ctrl_grp']", msg: "hijos('rig_grp') da ['geo_grp', 'ctrl_grp']" },
        { check: "hijos('head_geoShape') == []", msg: 'un nodo sin hijos da [] (no None)' }
      ],
      hints: ['`return cmds.listRelatives(nodo, children=True) or []`'],
      solution: 'from maya import cmds\n\ndef hijos(nodo):\n    return cmds.listRelatives(nodo, children=True) or []\n'
    },
    {
      id: 'e3',
      title: 'Geometría de un personaje',
      prompt: 'Escribe `geometria_de(grupo)`: devuelve la lista **ordenada** de **transforms** que tienen un shape `mesh` y cuelgan (a cualquier profundidad) de `grupo`.',
      setup: SETUP, files: FILES,
      starter: 'from maya import cmds\n\ndef geometria_de(grupo):\n    # tu código\n    pass\n',
      tests: [
        { check: "geometria_de('rig_grp') == ['body_geo', 'head_geo']", msg: "geometria_de('rig_grp') da body_geo y head_geo" },
        { check: "geometria_de('ctrl_grp') == []", msg: 'un grupo sin geometría da []' }
      ],
      hints: ['`cmds.listRelatives(grupo, allDescendents=True, type="mesh") or []` da los shapes.', 'Para cada shape, su transform es `cmds.listRelatives(shape, parent=True)[0]`.'],
      solution: 'from maya import cmds\n\ndef geometria_de(grupo):\n    shapes = cmds.listRelatives(grupo, allDescendents=True, type="mesh") or []\n    return sorted({cmds.listRelatives(s, parent=True)[0] for s in shapes})\n'
    }
  ],

  summary: [
    '`parent(hijo, padre)`, `parent(nodo, world=True)` y `group(...)` cambian la jerarquía.',
    '`listRelatives`: `children`, `parent`, `allDescendents`, `shapes`, `type`, `fullPath`.',
    'Devuelve `None` si no hay nada: escribe siempre `... or []`.'
  ]
});
})();
