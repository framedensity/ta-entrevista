(function () {
var SETUP = [
  'from maya import cmds as _c',
  'for _n in ["Hero", "Boss", "sword", "Shield_Geo"]:',
  '    _c.polyCube(name=_n)',
  '_c.camera(name="Cam_SH10")',
  '_c.camera(name="CAM_sh7")',
  '_c.polyCube(name="hero_geo")',
  'del _n'
].join('\n') + '\n';
var FILES = 'Escena:\n  Hero, Boss, sword, Shield_Geo, hero_geo  (mesh)\n  Cam_SH10, CAM_sh7                        (camera)';

TA.add({
  id: 'm04',
  title: 'Renombrar y nomenclatura',
  en: 'rename',

  explain: [
    'Renombrar es fácil: `cmds.rename("viejo", "nuevo")`. Lo difícil es hacerlo **en lote** sin romper nada.',
    { type: 'analogy', text: 'renombrar en Maya es como cambiar el nombre a alguien en una fiesta llena de gente: si el nombre nuevo ya lo tiene otra persona, Maya le añade un número para no confundirlos.' },
    '### rename devuelve el nombre real',
    '`cmds.rename` devuelve el nombre que **de verdad** quedó. Si `hero_geo` ya existe, `rename("Hero", "hero_geo")` devuelve `hero_geo1`.',
    { type: 'warn', text: 'nunca asumas que el nombre quedó como pediste. Guarda lo que devuelve `rename` y compara: si no coincide, hay un conflicto que avisar.' },
    '### Los shapes también tienen nombre',
    'Al renombrar un transform, su shape **no** se renombra solo (en Maya real depende del caso). Muchas convenciones exigen `<transform>Shape`. Una herramienta seria renombra los dos.',
    '### Renombrar rutas largas: el orden importa',
    'Si renombras un **padre**, la ruta larga de todos sus hijos cambia. Si tenías guardadas esas rutas, ya no sirven. Por eso, al renombrar jerarquías por ruta larga, se renombra de **abajo arriba** (los hijos primero).',
    { type: 'cg', text: 'tu verificador de nomenclatura (lección p18) sugiere `cam_sh010` para `Cam_SH10`. Aquí aprendes a aplicar esas sugerencias en la escena de forma segura.' }
  ],

  example: {
    intro: 'Renombramos y miramos qué devuelve.',
    lines: [
      { code: 'from maya import cmds', note: 'Importamos.' },
      { code: 'print(cmds.rename("Boss", "boss_geo"))', note: 'No hay conflicto: queda tal cual.' },
      { code: 'print(cmds.rename("Hero", "hero_geo"))', note: '`hero_geo` ya existía → `hero_geo1`.' },
      { code: 'shape = cmds.listRelatives("boss_geo", shapes=True)[0]\nprint(shape)', note: 'El shape sigue con su nombre antiguo.' },
      { code: 'print(cmds.rename(shape, "boss_geoShape"))', note: 'Lo alineamos con su transform.' }
    ],
    output: 'boss_geo\nhero_geo1\nBossShape\nboss_geoShape'
  },

  mini: [
    {
      q: 'Existe `cam_A`. ¿Qué devuelve `cmds.rename("camera1", "cam_A")`?',
      options: ['`"cam_A"` y borra el antiguo', '`"cam_A1"`', 'Da error'],
      answer: 1,
      why: 'Maya añade un número. Tu herramienta debe detectarlo comparando con lo que pidió.'
    },
    {
      q: '¿Por qué se renombra de abajo arriba cuando se trabaja con rutas largas?',
      options: ['Porque es más rápido', 'Porque renombrar un padre cambia la ruta larga de sus hijos', 'Porque Maya lo exige'],
      answer: 1,
      why: 'Si renombras primero el padre, las rutas guardadas de los hijos dejan de existir.'
    }
  ],

  exercises: [
    {
      id: 'e1',
      title: 'Sufijo _geo',
      prompt: 'Renombra los transforms `"Boss"` y `"sword"` añadiéndoles `_geo` y pasándolos a minúsculas (`boss_geo`, `sword_geo`).\n\nGuarda en `nuevos` los nombres **que devuelve** `rename`.',
      setup: SETUP, files: FILES,
      starter: 'from maya import cmds\n\nnuevos = []\nfor nodo in ["Boss", "sword"]:\n    pass\n',
      tests: [
        { check: "nuevos == ['boss_geo', 'sword_geo']", msg: '`nuevos` es ["boss_geo", "sword_geo"]' },
        { check: "cmds.objExists('boss_geo') and not cmds.objExists('Boss')", msg: 'Boss ya no existe; boss_geo sí' }
      ],
      hints: ['`cmds.rename(nodo, nodo.lower() + "_geo")`'],
      solution: 'from maya import cmds\n\nnuevos = []\nfor nodo in ["Boss", "sword"]:\n    nuevos.append(cmds.rename(nodo, nodo.lower() + "_geo"))\n'
    },
    {
      id: 'e2',
      title: 'Avisar de conflictos',
      prompt: 'Escribe `renombrar(viejo, pedido)`: renombra y devuelve `(nombre_real, hubo_conflicto)`. `hubo_conflicto` es `True` si Maya no pudo usar el nombre pedido.',
      setup: SETUP, files: FILES,
      starter: 'from maya import cmds\n\ndef renombrar(viejo, pedido):\n    # tu código\n    pass\n',
      tests: [
        { check: "renombrar('Boss', 'boss_geo') == ('boss_geo', False)", msg: 'sin conflicto: (boss_geo, False)' },
        { check: "renombrar('Hero', 'hero_geo') == ('hero_geo1', True)", msg: 'con conflicto: (hero_geo1, True)' }
      ],
      hints: ['`real = cmds.rename(viejo, pedido)`', '`return real, real != pedido`'],
      solution: 'from maya import cmds\n\ndef renombrar(viejo, pedido):\n    real = cmds.rename(viejo, pedido)\n    return real, real != pedido\n'
    },
    {
      id: 'e3',
      title: 'Arreglar las cámaras (transform y shape)',
      prompt: 'Para cada cámara de producción (transforms `Cam_SH10` y `CAM_sh7`), renombra el transform a `cam_shXXX` (3 dígitos) y su shape a `cam_shXXXShape`.\n\nGuarda en `hechas` un dict `{viejo: nuevo}` con los transforms.',
      setup: SETUP, files: FILES,
      starter: 'import re\nfrom maya import cmds\n\nhechas = {}\nfor cam in ["Cam_SH10", "CAM_sh7"]:\n    pass\n',
      tests: [
        { check: "hechas == {'Cam_SH10': 'cam_sh010', 'CAM_sh7': 'cam_sh007'}", msg: '`hechas` tiene los dos cambios' },
        { check: "cmds.listRelatives('cam_sh010', shapes=True) == ['cam_sh010Shape'] and cmds.listRelatives('cam_sh007', shapes=True) == ['cam_sh007Shape']", msg: 'los shapes también se renombraron' }
      ],
      hints: ['`num = int(re.search(r"\\d+", cam).group())` y `nuevo = f"cam_sh{num:03d}"`.', 'Antes de renombrar el transform, guarda su shape: `shape = cmds.listRelatives(cam, shapes=True)[0]`.'],
      solution: 'import re\nfrom maya import cmds\n\nhechas = {}\nfor cam in ["Cam_SH10", "CAM_sh7"]:\n    num = int(re.search(r"\\d+", cam).group())\n    nuevo = f"cam_sh{num:03d}"\n    shape = cmds.listRelatives(cam, shapes=True)[0]\n    real = cmds.rename(cam, nuevo)\n    cmds.rename(shape, real + "Shape")\n    hechas[cam] = real\n'
    }
  ],

  summary: [
    '`cmds.rename` devuelve el nombre real: si choca, Maya añade un número.',
    'Compara lo pedido con lo devuelto para detectar conflictos.',
    'Renombra también los shapes; con rutas largas, de abajo arriba.'
  ]
});
})();
