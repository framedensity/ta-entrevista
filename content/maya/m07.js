(function () {
var SETUP = [
  'from maya import cmds as _c',
  '_c.spaceLocator(name="ball_ctrl")',
  '_c.setKeyframe("ball_ctrl", attribute="translateY", time=1, value=0)',
  '_c.setKeyframe("ball_ctrl", attribute="translateY", time=12, value=10)',
  '_c.setKeyframe("ball_ctrl", attribute="translateY", time=24, value=0)',
  '_c.spaceLocator(name="cam_target")',
  '_c.playbackOptions(minTime=1, maxTime=24)'
].join('\n') + '\n';
var FILES = 'Escena:\n  ball_ctrl  translateY con keys: frame 1 → 0, frame 12 → 10, frame 24 → 0\n  cam_target sin animación\nRango de reproducción: 1 – 24';

TA.add({
  id: 'm07',
  title: 'Keyframes',
  en: 'setKeyframe / keyframe',

  explain: [
    'La animación en Maya son **keyframes** (*claves*): valores guardados en frames concretos. Entre dos claves, Maya calcula los valores intermedios.',
    { type: 'analogy', text: 'las claves son las fotos de un *flipbook* que dibujas tú. Maya dibuja las páginas de en medio (la **interpolación**).' },
    '### Poner claves',
    '```python\ncmds.setKeyframe("ball_ctrl", attribute="translateY", time=1, value=0)\ncmds.setKeyframe("ball_ctrl", attribute="translateY", time=12, value=10)\n```',
    'Sin `value=`, guarda el valor actual. Sin `time=`, usa el frame actual (`cmds.currentTime()`).',
    '### Preguntar por las claves: keyframe con query',
    '- `cmds.keyframe(nodo, attribute="ty", query=True, timeChange=True)` → los frames con clave.\n- `... valueChange=True` → los valores.\n- `... keyframeCount=True` → cuántas claves hay.\n- Si no hay claves → `None` (sí, otra vez).',
    '### Leer el valor en cualquier frame',
    '`cmds.getAttr("ball_ctrl.translateY", time=6)` da el valor en el frame 6 **sin mover** la línea de tiempo. Es mucho más rápido que cambiar `currentTime` frame a frame.',
    { type: 'compare',
      badTitle: 'Mover el tiempo en cada frame (lento: Maya recalcula la escena)',
      bad: 'for f in range(1, 25):\n    cmds.currentTime(f)\n    valores.append(cmds.getAttr("ball_ctrl.ty"))',
      goodTitle: 'Leer con time= (no mueve la escena)',
      good: 'valores = [cmds.getAttr("ball_ctrl.ty", time=f) for f in range(1, 25)]' },
    '`cmds.playbackOptions(query=True, minTime=True)` y `maxTime=True` dan el rango de la toma.',
    { type: 'cg', text: 'un exportador de cinemáticas lee el rango de cada toma, comprueba que hay claves dentro de ese rango y «hornea» (*bake*) los valores frame a frame antes de exportar.' }
  ],

  example: {
    intro: 'Miramos la animación de la pelota.',
    lines: [
      { code: 'from maya import cmds', note: 'Importamos.' },
      { code: 'print(cmds.keyframe("ball_ctrl", attribute="ty", query=True, timeChange=True))', note: 'Frames con clave.' },
      { code: 'print(cmds.keyframe("ball_ctrl", attribute="ty", query=True, valueChange=True))', note: 'Valores de esas claves.' },
      { code: 'print(cmds.getAttr("ball_ctrl.ty", time=6))', note: 'En el frame 6, a mitad de subida (el simulador interpola en línea recta).' },
      { code: 'print(cmds.keyframe("cam_target", query=True, keyframeCount=True))', note: 'Sin animación: 0 claves.' }
    ],
    output: '[1.0, 12.0, 24.0]\n[0.0, 10.0, 0.0]\n4.545454545454546\n0'
  },

  mini: [
    {
      q: '¿Cuál es la forma rápida de leer el valor de un atributo en 200 frames?',
      options: ['Cambiar `currentTime` en cada frame y usar `getAttr`', 'Usar `getAttr(..., time=f)` para cada frame', 'Exportar a FBX y leer el archivo'],
      answer: 1,
      why: 'Con `time=` no se recalcula toda la escena en cada frame.'
    },
    {
      q: '¿Qué devuelve `keyframe(..., query=True, timeChange=True)` en un nodo sin claves?',
      options: ['`[]`', '`None`', '`0`'],
      answer: 1,
      why: 'Como `listRelatives`: `None` cuando no hay resultados. Usa `or []`.'
    }
  ],

  exercises: [
    {
      id: 'e1',
      title: 'Animar el objetivo de la cámara',
      prompt: 'Anima `cam_target.translateX`: valor `0` en el frame `1` y valor `5` en el frame `24`.',
      setup: SETUP, files: FILES,
      starter: 'from maya import cmds\n\n',
      tests: [
        { check: "cmds.keyframe('cam_target', attribute='translateX', query=True, timeChange=True) == [1.0, 24.0]", msg: 'claves en los frames 1 y 24' },
        { check: "cmds.keyframe('cam_target', attribute='translateX', query=True, valueChange=True) == [0.0, 5.0]", msg: 'valores 0 y 5' }
      ],
      hints: ['`cmds.setKeyframe("cam_target", attribute="translateX", time=1, value=0)`', 'Y otra igual para el frame 24.'],
      solution: 'from maya import cmds\n\ncmds.setKeyframe("cam_target", attribute="translateX", time=1, value=0)\ncmds.setKeyframe("cam_target", attribute="translateX", time=24, value=5)\n'
    },
    {
      id: 'e2',
      title: 'Rango animado',
      prompt: 'Escribe `rango_animado(nodo, attr)`: devuelve `(primer_frame, ultimo_frame)` con clave, o `None` si no tiene claves.',
      setup: SETUP, files: FILES,
      starter: 'from maya import cmds\n\ndef rango_animado(nodo, attr):\n    # tu código\n    pass\n',
      tests: [
        { check: "rango_animado('ball_ctrl', 'translateY') == (1.0, 24.0)", msg: 'ball_ctrl.translateY va de 1 a 24' },
        { check: "rango_animado('cam_target', 'translateX') is None", msg: 'sin claves devuelve None' }
      ],
      hints: ['`tiempos = cmds.keyframe(nodo, attribute=attr, query=True, timeChange=True)`', '`return (min(tiempos), max(tiempos)) if tiempos else None`'],
      solution: 'from maya import cmds\n\ndef rango_animado(nodo, attr):\n    tiempos = cmds.keyframe(nodo, attribute=attr, query=True, timeChange=True)\n    if not tiempos:\n        return None\n    return min(tiempos), max(tiempos)\n'
    },
    {
      id: 'e3',
      title: 'Hornear valores',
      prompt: 'Escribe `hornear(nodo, attr)`: devuelve un dict `{frame: valor}` para **cada frame entero** del rango de reproducción (`playbackOptions`), usando `getAttr(..., time=f)`. Redondea los valores a 2 decimales.',
      setup: SETUP, files: FILES,
      starter: 'from maya import cmds\n\ndef hornear(nodo, attr):\n    # tu código\n    pass\n',
      tests: [
        { check: "len(hornear('ball_ctrl', 'translateY')) == 24", msg: 'un valor por frame (24 frames)' },
        { check: "hornear('ball_ctrl', 'translateY')[12] == 10.0 and hornear('ball_ctrl', 'translateY')[1] == 0.0", msg: 'frame 12 = 10.0 y frame 1 = 0.0' },
        { check: "hornear('ball_ctrl', 'translateY')[6] == 4.55", msg: 'frame 6 redondeado = 4.55' }
      ],
      hints: ['`ini = int(cmds.playbackOptions(query=True, minTime=True))` (y lo mismo con `maxTime`).', '`{f: round(cmds.getAttr(f"{nodo}.{attr}", time=f), 2) for f in range(ini, fin + 1)}`'],
      solution: 'from maya import cmds\n\ndef hornear(nodo, attr):\n    ini = int(cmds.playbackOptions(query=True, minTime=True))\n    fin = int(cmds.playbackOptions(query=True, maxTime=True))\n    return {f: round(cmds.getAttr(f"{nodo}.{attr}", time=f), 2) for f in range(ini, fin + 1)}\n'
    }
  ],

  summary: [
    '`setKeyframe(nodo, attribute=, time=, value=)` pone claves.',
    '`keyframe(query=True, timeChange/valueChange/keyframeCount)` las consulta (`None` si no hay).',
    '`getAttr(plug, time=f)` lee cualquier frame sin mover la escena: rápido para hornear.'
  ]
});
})();
