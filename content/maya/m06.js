(function () {
var SETUP = [
  'from maya import cmds as _c',
  '_c.spaceLocator(name="door_ctrl")',
  '_c.polyCube(name="door_geo")',
  '_c.polyCube(name="lid_geo")',
  '_c.connectAttr("door_ctrl.rotateY", "lid_geo.rotateX")',
  '_c.connectAttr("door_ctrl.translateY", "lid_geo.translateY")'
].join('\n') + '\n';
var FILES = 'Escena:\n  door_ctrl (locator)\n  door_geo  (mesh)\n  lid_geo   (mesh)\nConexiones ya hechas:\n  door_ctrl.rotateY    → lid_geo.rotateX\n  door_ctrl.translateY → lid_geo.translateY';

TA.add({
  id: 'm06',
  title: 'Conexiones',
  en: 'connectAttr / listConnections',

  explain: [
    'Un atributo puede **recibir** su valor de otro atributo. Eso es una **conexión**. Es la base de los rigs: un control mueve una puerta, una expresión mueve una rueda.',
    { type: 'analogy', text: 'una conexión es una tubería de agua: el valor fluye del **origen** (*source*) al **destino** (*destination*). Si conectas una tubería a un grifo, ya no puedes llenarlo a mano.' },
    '```python\ncmds.connectAttr("door_ctrl.rotateY", "door_geo.rotateY")\n```',
    'Ahora, al girar `door_ctrl`, la puerta gira con él.',
    { type: 'warn', text: 'un atributo con una conexión de **entrada** ya no se puede cambiar con `setAttr`: da error. Y no se le puede conectar una segunda entrada, salvo con `force=True` (que sustituye la anterior).' },
    '### Preguntar por las conexiones: listConnections',
    '- `source=True, destination=False` → solo lo que **entra**.\n- `source=False, destination=True` → solo lo que **sale**.\n- `plugs=True` → devuelve `"nodo.atributo"` en vez de solo el nodo.\n- Si no hay nada → `None` (otra vez).',
    '`cmds.disconnectAttr(origen, destino)` corta la tubería.',
    { type: 'cg', text: 'antes de exportar la animación de una puerta, el exportador comprueba si `door_geo.rotateY` está conectado. Si lo está, hay que **hornear** (*bake*) los valores, porque el FBX no guarda la conexión.' }
  ],

  example: {
    intro: 'Exploramos las tuberías de `lid_geo`.',
    lines: [
      { code: 'from maya import cmds', note: 'Importamos.' },
      { code: 'print(cmds.listConnections("lid_geo", source=True, destination=False, plugs=True))', note: 'Lo que entra en `lid_geo`, como `nodo.atributo`.' },
      { code: 'print(cmds.listConnections("lid_geo.rotateX", plugs=True))', note: 'También se puede preguntar por un atributo concreto.' },
      { code: 'try:\n    cmds.setAttr("lid_geo.rotateX", 10)\nexcept RuntimeError as e:\n    print("Error:", e)', note: 'No se puede escribir en un atributo conectado.' },
      { code: 'print(cmds.listConnections("door_geo"))', note: 'Sin conexiones → `None`.' }
    ],
    output: "['door_ctrl.rotateY', 'door_ctrl.translateY']\n['door_ctrl.rotateY']\nError: El atributo 'lid_geo.rotateX' está conectado y no se puede cambiar.\nNone"
  },

  mini: [
    {
      q: 'Conectas `a.tx → b.tx`. ¿Qué pasa con `cmds.setAttr("b.tx", 5)`?',
      options: ['b.tx vale 5', 'Da error: el atributo está conectado', 'a.tx también vale 5'],
      answer: 1,
      why: 'El valor de b.tx lo decide la conexión. Hay que desconectar primero.'
    },
    {
      q: '¿Qué opción de `listConnections` da `"nodo.atributo"` en vez de solo el nodo?',
      options: ['`long=True`', '`plugs=True`', '`fullPath=True`'],
      answer: 1,
      why: 'Un *plug* es la combinación nodo + atributo.'
    }
  ],

  exercises: [
    {
      id: 'e1',
      title: 'Conectar la puerta',
      prompt: 'Conecta `door_ctrl.rotateY` a `door_geo.rotateY`.',
      setup: SETUP, files: FILES,
      starter: 'from maya import cmds\n\n',
      tests: [{ check: "cmds.isConnected('door_ctrl.rotateY', 'door_geo.rotateY')", msg: 'door_ctrl.rotateY → door_geo.rotateY' }],
      hints: ['`cmds.connectAttr(origen, destino)`'],
      solution: 'from maya import cmds\n\ncmds.connectAttr("door_ctrl.rotateY", "door_geo.rotateY")\n'
    },
    {
      id: 'e2',
      title: '¿Qué controla este nodo?',
      prompt: 'Escribe `entradas(nodo)`: devuelve una lista **ordenada** de los plugs (`"nodo.atributo"`) que **entran** en el nodo. Lista vacía si no hay.',
      setup: SETUP, files: FILES,
      starter: 'from maya import cmds\n\ndef entradas(nodo):\n    # tu código\n    pass\n',
      tests: [
        { check: "entradas('lid_geo') == ['door_ctrl.rotateY', 'door_ctrl.translateY']", msg: 'lid_geo recibe dos conexiones' },
        { check: "entradas('door_geo') == []", msg: 'door_geo no recibe nada → []' }
      ],
      hints: ['`cmds.listConnections(nodo, source=True, destination=False, plugs=True)`', 'Recuerda el `or []` y el `sorted`.'],
      solution: 'from maya import cmds\n\ndef entradas(nodo):\n    return sorted(cmds.listConnections(nodo, source=True, destination=False, plugs=True) or [])\n'
    },
    {
      id: 'e3',
      title: 'Liberar un atributo',
      prompt: 'Escribe `liberar(plug)`: si `plug` (por ejemplo `"lid_geo.rotateX"`) tiene una conexión de entrada, desconéctala. Devuelve el plug de origen que se desconectó, o `None` si no había ninguna.',
      setup: SETUP, files: FILES,
      starter: 'from maya import cmds\n\ndef liberar(plug):\n    # tu código\n    pass\n',
      tests: [
        { check: "liberar('lid_geo.rotateX') == 'door_ctrl.rotateY'", msg: 'devuelve el origen desconectado' },
        { check: "liberar('lid_geo.rotateX') is None", msg: 'si ya no hay conexión, devuelve None' },
        { check: "(cmds.setAttr('lid_geo.rotateX', 10), cmds.getAttr('lid_geo.rotateX'))[1] == 10", msg: 'ahora se puede escribir en el atributo' }
      ],
      hints: ['`origen = cmds.listConnections(plug, source=True, destination=False, plugs=True)`', 'Si hay origen: `cmds.disconnectAttr(origen[0], plug)` y devuélvelo.'],
      solution: 'from maya import cmds\n\ndef liberar(plug):\n    origen = cmds.listConnections(plug, source=True, destination=False, plugs=True)\n    if not origen:\n        return None\n    cmds.disconnectAttr(origen[0], plug)\n    return origen[0]\n'
    }
  ],

  summary: [
    '`connectAttr(origen, destino)`: el valor fluye del origen al destino.',
    'Un atributo con entrada no acepta `setAttr`; `disconnectAttr` lo libera.',
    '`listConnections(source=, destination=, plugs=)`; devuelve `None` si no hay nada.'
  ]
});
})();
