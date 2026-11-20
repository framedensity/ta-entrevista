(function () {
var SETUP = [
  'from maya import cmds as _c',
  '_c.spaceLocator(name="ctrl_A")',
  '_c.setAttr("ctrl_A.translateX", 3)',
  '_c.setAttr("ctrl_A.translateY", 1.5)',
  '_c.setAttr("ctrl_A.rotateY", 45)',
  '_c.spaceLocator(name="ctrl_B")',
  '_c.camera(name="cam_sh010")'
].join('\n') + '\n';
var FILES = 'Escena:\n  ctrl_A    (locator)  translate = (3, 1.5, 0), rotateY = 45\n  ctrl_B    (locator)  en el origen\n  cam_sh010 (camera)';

TA.add({
  id: 'm05',
  title: 'Atributos',
  en: 'getAttr / setAttr / addAttr',

  explain: [
    'Los **atributos** son los datos de un nodo: posición, rotación, visibilidad, distancia focal… Se escriben como `"nodo.atributo"`.',
    { type: 'analogy', text: 'un nodo es una ficha de personaje y los atributos son sus casillas: altura, fuerza, nombre… `getAttr` lee una casilla y `setAttr` escribe en ella.' },
    '### Leer y escribir',
    '```python\ncmds.getAttr("ctrl_A.translateX")      # 3.0\ncmds.setAttr("ctrl_A.translateX", 5)\ncmds.getAttr("ctrl_A.translate")       # [(5.0, 1.5, 0.0)]  ← lista con una tupla\n```',
    'Los atributos tienen nombres largos y cortos: `translateX` = `tx`, `rotateY` = `ry`, `visibility` = `v`.',
    { type: 'warn', text: '`getAttr("x.translate")` devuelve una **lista con una tupla dentro**: `[(x, y, z)]`. Para sacar los tres números: `cmds.getAttr("x.translate")[0]`.' },
    '### Atributos propios: addAttr',
    'Puedes añadir tus propios atributos a un nodo. Es la forma limpia de guardar **metadatos** en la escena: a qué toma pertenece una cámara, quién la aprobó…',
    '```python\ncmds.addAttr("cam_sh010", longName="shotName", dataType="string")\ncmds.setAttr("cam_sh010.shotName", "sh010", type="string")\n```',
    { type: 'warn', text: 'para atributos de **texto** hay que pasar `type="string"` en `setAttr`. Es un olvido muy común.' },
    '### Comprobar antes de tocar',
    '- `cmds.objExists("nodo.attr")` → ¿existe el atributo?\n- `cmds.attributeQuery("attr", node="nodo", exists=True)` → lo mismo, de otra forma.\n- `cmds.listAttr("nodo", userDefined=True)` → solo los atributos que añadimos nosotros (o `None`).',
    { type: 'cg', text: 'el exportador lee `cam_sh010.shotName` para saber a qué toma pertenece cada cámara, aunque el artista la haya renombrado.' }
  ],

  example: {
    intro: 'Leemos, escribimos y añadimos metadatos.',
    lines: [
      { code: 'from maya import cmds', note: 'Importamos.' },
      { code: 'x, y, z = cmds.getAttr("ctrl_A.translate")[0]\nprint(x, y, z)', note: 'Lista con una tupla: `[0]` y desempaquetamos.' },
      { code: 'cmds.setAttr("ctrl_B.translate", x, y, z)', note: '`setAttr` acepta los tres valores seguidos para un compuesto.' },
      { code: 'cmds.addAttr("cam_sh010", longName="shotName", dataType="string")\ncmds.setAttr("cam_sh010.shotName", "sh010", type="string")', note: 'Añadimos un atributo de texto y le damos valor.' },
      { code: 'print(cmds.getAttr("cam_sh010.shotName"), cmds.listAttr("cam_sh010", userDefined=True))', note: 'Lo leemos y listamos los atributos propios.' }
    ],
    output: "3.0 1.5 0.0\nsh010 ['shotName']"
  },

  mini: [
    {
      q: '¿Qué devuelve `cmds.getAttr("loc.translate")`?',
      options: ['`(1.0, 2.0, 3.0)`', '`[(1.0, 2.0, 3.0)]`', '`1.0`'],
      answer: 1,
      why: 'Una lista con una tupla dentro. Se usa `[0]` para sacar la tupla.'
    },
    {
      q: '¿Qué falta en `cmds.setAttr("cam.shotName", "sh010")` si `shotName` es de texto?',
      options: ['Nada', '`type="string"`', '`dataType="text"`'],
      answer: 1,
      why: 'Para atributos de texto, `setAttr` necesita `type="string"`.'
    }
  ],

  exercises: [
    {
      id: 'e1',
      title: 'Leer la posición',
      prompt: 'Crea `pos`: una **tupla** `(x, y, z)` con la traslación de `ctrl_A`, y `giro` con su `rotateY`.',
      setup: SETUP, files: FILES,
      starter: 'from maya import cmds\n\n',
      tests: [
        { check: 'pos == (3.0, 1.5, 0.0)', msg: '`pos` es (3.0, 1.5, 0.0)' },
        { check: 'giro == 45.0', msg: '`giro` es 45.0' }
      ],
      hints: ['`cmds.getAttr("ctrl_A.translate")[0]`', '`cmds.getAttr("ctrl_A.rotateY")` (o `"ctrl_A.ry"`).'],
      solution: 'from maya import cmds\n\npos = cmds.getAttr("ctrl_A.translate")[0]\ngiro = cmds.getAttr("ctrl_A.rotateY")\n'
    },
    {
      id: 'e2',
      title: 'Copiar transformaciones',
      prompt: 'Escribe `copiar(origen, destino)`: copia los 9 atributos de traslación, rotación y escala (`translateX` … `scaleZ`) de `origen` a `destino`.',
      setup: SETUP, files: FILES,
      starter: 'from maya import cmds\n\nATTRS = [a + e for a in ("translate", "rotate", "scale") for e in "XYZ"]\n\ndef copiar(origen, destino):\n    # tu código\n    pass\n',
      tests: [
        { check: "(copiar('ctrl_A', 'ctrl_B'), cmds.getAttr('ctrl_B.translate')[0])[1] == (3.0, 1.5, 0.0)", msg: 'ctrl_B tiene la traslación de ctrl_A' },
        { check: "cmds.getAttr('ctrl_B.rotateY') == 45.0 and cmds.getAttr('ctrl_B.scaleX') == 1.0", msg: 'rotación y escala también' }
      ],
      hints: ['`for a in ATTRS:`', '`cmds.setAttr(f"{destino}.{a}", cmds.getAttr(f"{origen}.{a}"))`'],
      solution: 'from maya import cmds\n\nATTRS = [a + e for a in ("translate", "rotate", "scale") for e in "XYZ"]\n\ndef copiar(origen, destino):\n    for a in ATTRS:\n        cmds.setAttr(f"{destino}.{a}", cmds.getAttr(f"{origen}.{a}"))\n'
    },
    {
      id: 'e3',
      title: 'Etiquetar la cámara',
      prompt: 'Escribe `etiquetar(camara, toma)`: añade a la cámara un atributo de texto `shotName` (solo si **no** existe ya) y guarda en él el nombre de la toma.\n\nLlamarla dos veces no debe dar error.',
      setup: SETUP, files: FILES,
      starter: 'from maya import cmds\n\ndef etiquetar(camara, toma):\n    # tu código\n    pass\n',
      tests: [
        { check: "(etiquetar('cam_sh010', 'sh010'), cmds.getAttr('cam_sh010.shotName'))[1] == 'sh010'", msg: 'cam_sh010.shotName vale "sh010"' },
        { check: "(etiquetar('cam_sh010', 'sh011'), cmds.getAttr('cam_sh010.shotName'))[1] == 'sh011'", msg: 'una segunda llamada no da error y actualiza el valor' }
      ],
      hints: ['`if not cmds.objExists(f"{camara}.shotName"):` → `addAttr`.', '`cmds.setAttr(f"{camara}.shotName", toma, type="string")`'],
      solution: 'from maya import cmds\n\ndef etiquetar(camara, toma):\n    if not cmds.objExists(f"{camara}.shotName"):\n        cmds.addAttr(camara, longName="shotName", dataType="string")\n    cmds.setAttr(f"{camara}.shotName", toma, type="string")\n'
    }
  ],

  summary: [
    '`getAttr` / `setAttr` con `"nodo.atributo"`; los compuestos dan `[(x, y, z)]`.',
    '`addAttr` guarda metadatos; para texto, `setAttr(..., type="string")`.',
    'Comprueba con `objExists("nodo.attr")` antes de añadir o leer.'
  ]
});
})();
