(function () {
var SETUP = [
  'def _cerca(a, b, tol=1e-6):',
  '    if isinstance(a, (int, float)) and isinstance(b, (int, float)):',
  '        return abs(a - b) < tol',
  '    try:',
  '        a, b = list(a), list(b)',
  '    except TypeError:',
  '        return False',
  '    return len(a) == len(b) and all(_cerca(x, y, tol) for x, y in zip(a, b))'
].join('\n') + '\n';

TA.add({
  id: 'v06',
  title: 'Espacio local y mundial',
  en: 'local vs world space',

  explain: [
    'Cada objeto tiene su posición en dos «idiomas»: **local** (object/local space, relativa a su padre) y **mundial** (world space, relativa al origen de la escena).',
    { type: 'analogy', text: 'en un tren, tu asiento es «vagón 3, fila 5» (local). Para alguien en el andén, estás en un punto que cambia cuando el tren se mueve (mundial). Tu asiento local no cambia; tu posición mundial, sí.' },
    { type: 'viz', name: 'space' },
    '### De local a mundial',
    'Posición mundial = **matriz del padre** aplicada a la posición local: primero se rota (y escala) con el padre, y luego se suma la posición del padre.',
    '`mundo = pos_padre + rotar(local, ang_padre)`',
    '### De mundial a local',
    'Es el camino inverso: se resta la posición del padre y se rota con el ángulo **contrario**. En matrices: se multiplica por la **inversa** de la matriz del padre.',
    '### Jerarquías',
    'Con varios niveles (cadera → muslo → rodilla → pie), cada matriz se multiplica por la de su padre. La matriz mundial del pie es el producto de toda la cadena. Esto es la **cinemática directa** (forward kinematics, FK).',
    { type: 'cg', text: 'en Maya: `getAttr obj.translate` da la posición **local**; `xform(obj, q=True, ws=True, t=True)` da la **mundial**. Confundirlas es uno de los errores más comunes en herramientas de animación (por ejemplo, al hacer *snap* de un control a un joint).' },
    { type: 'tip', text: 'si te preguntan por `worldMatrix` y `parentInverseMatrix`: «la matriz mundial es la local por la mundial del padre; para pasar algo de mundial a local, multiplico por la inversa de la mundial del padre».' }
  ],

  example: {
    intro: 'Un hijo en local (2, 0) con un padre en (3, 1) rotado 90°.',
    lines: [
      { code: 'import math', note: 'Para la rotación.' },
      { code: 'def rotar(v, grados):\n    t = math.radians(grados)\n    c, s = math.cos(t), math.sin(t)\n    return (c * v[0] - s * v[1], s * v[0] + c * v[1])', note: 'Rotación 2D (la matriz de v05, escrita a mano).' },
      { code: 'padre_pos, padre_ang = (3, 1), 90\nlocal = (2, 0)', note: 'El hijo está 2 unidades «a la derecha» de su padre.' },
      { code: 'r = rotar(local, padre_ang)', note: 'Primero rota con el padre: (2, 0) → (0, 2).' },
      { code: 'mundo = (padre_pos[0] + r[0], padre_pos[1] + r[1])', note: 'Luego suma la posición del padre.' },
      { code: 'print(tuple(round(c, 6) for c in mundo))', note: 'En el mundo, el hijo está encima del padre.' }
    ],
    output: '(3.0, 3.0)'
  },

  mini: [
    {
      q: 'Mueves el padre 5 unidades en X. ¿Qué pasa con el `translate` (local) del hijo?',
      options: ['Aumenta 5 en X', 'No cambia', 'Se pone a cero'],
      answer: 1,
      why: 'El local es relativo al padre: no cambia. Lo que cambia es su posición mundial.'
    },
    {
      q: 'Quieres colocar un control exactamente donde está un joint, pero el control tiene un padre rotado. ¿Qué haces?',
      options: ['Copias el `translate` del joint al control', 'Lees la posición **mundial** del joint y la conviertes al espacio **local** del control (o usas `xform(ws=True)`)', 'Pones el control sin padre siempre'],
      answer: 1,
      why: 'Copiar el `translate` solo funciona si los dos tienen el mismo padre.'
    }
  ],
  extra: [
    {
      q: '¿Cómo se pasa de espacio mundial a local?',
      options: ['Multiplicando por la matriz mundial del padre', 'Multiplicando por la **inversa** de la matriz mundial del padre', 'Restando 1'],
      answer: 1,
      why: 'La inversa deshace la transformación del padre.'
    }
  ],

  exercises: [
    {
      id: 'e1',
      title: 'De local a mundial',
      prompt: 'Escribe `a_mundo(local, padre_pos, padre_ang)` en 2D: rota `local` con el ángulo del padre (en grados) y suma la posición del padre.\n\nYa tienes `rotar(v, grados)`.',
      setup: SETUP,
      starter: 'import math\n\ndef rotar(v, grados):\n    t = math.radians(grados)\n    c, s = math.cos(t), math.sin(t)\n    return (c * v[0] - s * v[1], s * v[0] + c * v[1])\n\ndef a_mundo(local, padre_pos, padre_ang):\n    pass\n',
      tests: [
        { check: '_cerca(a_mundo((1, 0), (2, 3), 90), (2, 4))', msg: 'local (1,0), padre en (2,3) rotado 90° → (2, 4)' },
        { check: '_cerca(a_mundo((1, 1), (0, 0), 0), (1, 1))', msg: 'padre en el origen sin rotar: no cambia' },
        { check: '_cerca(a_mundo((2, 0), (5, 0), 180), (3, 0))', msg: 'padre rotado 180°: el hijo queda detrás' }
      ],
      hints: ['`r = rotar(local, padre_ang)`', '`return (padre_pos[0] + r[0], padre_pos[1] + r[1])`'],
      solution: 'import math\n\ndef rotar(v, grados):\n    t = math.radians(grados)\n    c, s = math.cos(t), math.sin(t)\n    return (c * v[0] - s * v[1], s * v[0] + c * v[1])\n\ndef a_mundo(local, padre_pos, padre_ang):\n    r = rotar(local, padre_ang)\n    return (padre_pos[0] + r[0], padre_pos[1] + r[1])\n'
    },
    {
      id: 'e2',
      title: 'De mundial a local',
      prompt: 'Escribe `a_local(mundo, padre_pos, padre_ang)`: el camino inverso. Resta la posición del padre y rota con el ángulo **contrario**.',
      setup: SETUP,
      starter: 'import math\n\ndef rotar(v, grados):\n    t = math.radians(grados)\n    c, s = math.cos(t), math.sin(t)\n    return (c * v[0] - s * v[1], s * v[0] + c * v[1])\n\ndef a_local(mundo, padre_pos, padre_ang):\n    pass\n',
      tests: [
        { check: '_cerca(a_local((2, 4), (2, 3), 90), (1, 0))', msg: 'deshace el ejemplo anterior: (2,4) → (1, 0)' },
        { check: '_cerca(a_local((3, 0), (5, 0), 180), (2, 0))', msg: 'padre rotado 180°' }
      ],
      hints: ['Primero resta: `d = (mundo[0] - padre_pos[0], mundo[1] - padre_pos[1])`.', 'Luego `rotar(d, -padre_ang)`.'],
      solution: 'import math\n\ndef rotar(v, grados):\n    t = math.radians(grados)\n    c, s = math.cos(t), math.sin(t)\n    return (c * v[0] - s * v[1], s * v[0] + c * v[1])\n\ndef a_local(mundo, padre_pos, padre_ang):\n    d = (mundo[0] - padre_pos[0], mundo[1] - padre_pos[1])\n    return rotar(d, -padre_ang)\n',
      explain: 'El orden también se invierte: para ir a mundial se rota y luego se suma; para volver, se resta y luego se rota al revés.'
    },
    {
      id: 'e3',
      title: 'Cadena FK',
      prompt: 'Una cadena de huesos en 2D empieza en `(0, 0)`. Cada hueso tiene una longitud y un ángulo **relativo a su padre** (en grados). El primer hueso con ángulo 0 apunta hacia +X.\n\nEscribe `punta(longitudes, angulos)`: la posición mundial del final de la cadena.',
      setup: SETUP,
      starter: 'import math\n\ndef punta(longitudes, angulos):\n    pass\n',
      tests: [
        { check: '_cerca(punta([2], [0]), (2, 0))', msg: 'un hueso de 2 sin rotar → (2, 0)' },
        { check: '_cerca(punta([1, 1], [90, -90]), (1, 1))', msg: 'sube 1 y luego vuelve a +X: (1, 1)' },
        { check: '_cerca(punta([1, 1, 1], [0, 90, 90]), (0, 1))', msg: 'tres huesos que giran 90° cada uno: (0, 1)' }
      ],
      hints: ['Los ángulos se **acumulan**: el segundo hueso gira `angulos[0] + angulos[1]` en mundial.', 'Lleva `x, y, total = 0, 0, 0`. En cada hueso: `total += ang`, y suma `l·cos(total)`, `l·sin(total)`.'],
      solution: 'import math\n\ndef punta(longitudes, angulos):\n    x = y = total = 0.0\n    for l, ang in zip(longitudes, angulos):\n        total += ang\n        t = math.radians(total)\n        x += l * math.cos(t)\n        y += l * math.sin(t)\n    return (x, y)\n',
      explain: 'Así calcula Maya la posición de la mano a partir de los joints del brazo: cada rotación local se suma a la de los padres.'
    }
  ],

  summary: [
    'Local = relativo al padre; mundial = relativo al origen de la escena.',
    'Local → mundial: rotar con el padre y sumar su posición; al revés, con la inversa.',
    'En jerarquías, las transformaciones se acumulan (FK); `translate` es local, `xform(ws=True)` es mundial.'
  ]
});
})();
