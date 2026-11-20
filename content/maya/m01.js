(function () {
var SETUP = [
  'from maya import cmds as _c',
  '_c.polyCube(name="hero_geo")',
  '_c.spaceLocator(name="ctrl_main")',
  '_c.camera(name="cam_sh010")',
  '_c.createNode("transform", name="empty_grp")'
].join('\n') + '\n';
var FILES = 'Escena (además de persp, top, front, side):\n  hero_geo   (transform) → hero_geoShape  (mesh)\n  ctrl_main  (transform) → ctrl_mainShape (locator)\n  cam_sh010  (transform) → cam_sh010Shape (camera)\n  empty_grp  (transform, sin forma)\n  polyCube1  (nodo de historia)';

TA.add({
  id: 'm01',
  title: 'La escena como árbol genealógico',
  en: 'nodes, DAG, transform & shape',

  explain: [
    'Todo en Maya es un **nodo** (*node*): un objeto, una cámara, un material, incluso una operación como «crear un cubo». Cada nodo tiene un **tipo** y unos **atributos**.',
    { type: 'analogy', text: 'la escena es un **árbol genealógico**. Hay padres, hijos y hermanos. Si mueves al padre, toda su familia se mueve con él.' },
    'Ese árbol se llama **DAG** (*Directed Acyclic Graph*). Es la jerarquía que ves en el *Outliner*.',
    '### Transform y shape: la pareja inseparable',
    'Lo que ves como «un cubo» son en realidad **dos nodos**:',
    '- El **transform**: dónde está, cómo está girado y escalado. Es el que seleccionas.\n- El **shape** (*forma*): la geometría de verdad (los vértices). Vive **debajo** del transform, como su hijo.',
    { type: 'analogy', text: 'el transform es la **percha** y el shape es la **ropa**. Mueves la percha y la ropa va con ella. La percha sola (un grupo vacío) no se ve.' },
    'Así, `hero_geo` es el transform, y `hero_geoShape` es su shape de tipo `mesh`.',
    '### Nodos que no están en el árbol',
    'Algunos nodos no tienen posición: materiales, nodos de historia como `polyCube1`. Existen en la escena, pero no en el DAG.',
    '### Una escena nueva no está vacía',
    'Maya crea siempre cuatro cámaras: `persp`, `top`, `front` y `side`. ¡Cuidado al listar cámaras: tu herramienta debe ignorarlas!',
    { type: 'cg', text: 'un exportador de cinemáticas busca las cámaras de la toma. Si no filtra las cuatro por defecto, exporta `persp` como si fuera una cámara del guion.' },
    'En estos ejercicios usamos `from maya import cmds`. Es un **simulador** en el navegador con lo básico de Maya.'
  ],

  example: {
    intro: 'Miramos qué hay en la escena.',
    lines: [
      { code: 'from maya import cmds', note: 'La forma habitual de importar los comandos.' },
      { code: 'print(cmds.ls(type="camera"))', note: 'Las cámaras son **shapes**. Salen las 4 por defecto y la nuestra.' },
      { code: 'print(cmds.listRelatives("hero_geo", shapes=True))', note: 'El shape que cuelga del transform.' },
      { code: 'print(cmds.nodeType("hero_geo"), cmds.nodeType("hero_geoShape"))', note: 'Transform por fuera, mesh por dentro.' },
      { code: 'print(cmds.listRelatives("empty_grp", shapes=True))', note: 'Un grupo vacío no tiene shape. ¡Devuelve `None`, no una lista vacía!' }
    ],
    output: "['perspShape', 'topShape', 'frontShape', 'sideShape', 'cam_sh010Shape']\n['hero_geoShape']\ntransform mesh\nNone"
  },

  mini: [
    {
      q: 'Seleccionas un cubo en el viewport. ¿Qué nodo has seleccionado?',
      options: ['El shape (`mesh`)', 'El transform', 'El nodo `polyCube1`'],
      answer: 1,
      why: 'Lo que seleccionas y mueves es el transform. El shape cuelga de él.'
    },
    {
      q: '¿Qué cámaras trae una escena nueva de Maya?',
      options: ['Ninguna', 'Solo `persp`', '`persp`, `top`, `front` y `side`'],
      answer: 2,
      why: 'Por eso las herramientas filtran estas cuatro al buscar cámaras de producción.'
    }
  ],
  extra: [
    {
      q: '¿Qué devuelve `cmds.listRelatives(nodo, shapes=True)` si el nodo no tiene shapes?',
      options: ['`[]`', '`None`', 'Un error'],
      answer: 1,
      why: 'Una trampa clásica de Maya: muchos comandos devuelven `None` cuando no hay resultados. Usa `... or []`.'
    }
  ],

  exercises: [
    {
      id: 'e1',
      title: 'Mis transforms',
      prompt: 'Crea `mios`: lista **ordenada** de transforms de la escena, **sin** las cuatro cámaras por defecto.',
      setup: SETUP, files: FILES,
      starter: 'from maya import cmds\n\nPOR_DEFECTO = {"persp", "top", "front", "side"}\n\n',
      tests: [{ check: "mios == ['cam_sh010', 'ctrl_main', 'empty_grp', 'hero_geo']", msg: '`mios` tiene los 4 transforms creados, ordenados' }],
      hints: ['`cmds.ls(type="transform")` da todos los transforms.', '`sorted(t for t in cmds.ls(type="transform") if t not in POR_DEFECTO)`'],
      solution: 'from maya import cmds\n\nPOR_DEFECTO = {"persp", "top", "front", "side"}\n\nmios = sorted(t for t in cmds.ls(type="transform") if t not in POR_DEFECTO)\n'
    },
    {
      id: 'e2',
      title: 'Percha y ropa',
      prompt: 'Crea `formas`: dict `{transform: tipo_de_su_shape}` para los transforms de `TRANSFORMS`. Si un transform **no tiene** shape, el valor es `None`.',
      setup: SETUP, files: FILES,
      starter: 'from maya import cmds\n\nTRANSFORMS = ["hero_geo", "ctrl_main", "cam_sh010", "empty_grp"]\n\n',
      tests: [{ check: "formas == {'hero_geo': 'mesh', 'ctrl_main': 'locator', 'cam_sh010': 'camera', 'empty_grp': None}", msg: '`formas` da el tipo del shape, o None' }],
      hints: ['`shapes = cmds.listRelatives(t, shapes=True)` puede ser `None`.', '`formas[t] = cmds.nodeType(shapes[0]) if shapes else None`'],
      solution: 'from maya import cmds\n\nTRANSFORMS = ["hero_geo", "ctrl_main", "cam_sh010", "empty_grp"]\n\nformas = {}\nfor t in TRANSFORMS:\n    shapes = cmds.listRelatives(t, shapes=True)\n    formas[t] = cmds.nodeType(shapes[0]) if shapes else None\n'
    },
    {
      id: 'e3',
      title: 'Cámaras de producción',
      prompt: 'Escribe `camaras_de_produccion()`: devuelve la lista **ordenada** de **transforms** de cámara, sin las cámaras por defecto.\n\nRecuerda: `ls(type="camera")` da los **shapes**. Tienes que subir a su padre.',
      setup: SETUP, files: FILES,
      starter: 'from maya import cmds\n\ndef camaras_de_produccion():\n    # tu código\n    pass\n',
      tests: [
        { check: "camaras_de_produccion() == ['cam_sh010']", msg: 'devuelve ["cam_sh010"]' },
        { check: "(cmds.camera(name='cam_sh020'), camaras_de_produccion())[1] == ['cam_sh010', 'cam_sh020']", msg: 'si se crea otra cámara, aparece' }
      ],
      hints: ['`cmds.listRelatives(shape, parent=True)[0]` es el transform.', 'Filtra con `{"persp", "top", "front", "side"}`.'],
      solution: 'from maya import cmds\n\ndef camaras_de_produccion():\n    defecto = {"persp", "top", "front", "side"}\n    resultado = []\n    for shape in cmds.ls(type="camera"):\n        transform = cmds.listRelatives(shape, parent=True)[0]\n        if transform not in defecto:\n            resultado.append(transform)\n    return sorted(resultado)\n'
    }
  ],

  summary: [
    'Todo es un nodo; los que tienen posición forman el árbol DAG (padres e hijos).',
    'Un objeto visible = **transform** (percha) + **shape** (ropa) debajo.',
    'Una escena nueva trae `persp/top/front/side`; muchos comandos devuelven `None` si no hay nada.'
  ]
});
})();
