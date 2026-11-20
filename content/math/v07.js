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
  id: 'v07',
  title: 'Ángulos de Euler y bloqueo de cardán',
  en: 'Euler angles & gimbal lock',

  explain: [
    'Los **ángulos de Euler** (Euler angles) son los tres números de `rotateX`, `rotateY`, `rotateZ`. Son fáciles de leer, pero tienen dos problemas: el **orden** y el **bloqueo de cardán** (gimbal lock).',
    { type: 'analogy', text: 'girar con Euler es como dar tres instrucciones seguidas: «gira la cabeza a la derecha, luego inclínala hacia arriba, luego ladéala». Si cambias el orden de las instrucciones, la cabeza acaba en otro sitio.' },
    '### El orden de rotación',
    'Las tres rotaciones se aplican **una detrás de otra**. En Maya, el atributo `rotateOrder` decide el orden (por defecto `xyz`). Los mismos tres números con otro orden dan otra orientación.',
    '### Bloqueo de cardán',
    'Con orden `xyz`, si Y llega a **90°**, el eje X y el eje Z quedan alineados: girar X o Z hace **lo mismo**. Has perdido un grado de libertad.',
    { type: 'viz', name: 'gimbal' },
    'Prueba en la figura: pon Y en 90° y mueve X y Z. Verás que los dos giran sobre el mismo eje.',
    { type: 'cg', text: 'en animación, el bloqueo de cardán produce giros raros y saltos en las curvas. Por eso los riggers eligen el `rotateOrder` según el movimiento: para un cuello que gira mucho en Y, se pone Y **primero o último**, para que el eje que más se mueve no cause el bloqueo.' },
    '### Saltos de 360°',
    '`rotateY = 190` y `rotateY = -170` son la misma orientación. Pero si una clave tiene 170 y la siguiente -175, la curva da casi una vuelta entera hacia atrás. El **Euler Filter** del Graph Editor arregla esto sumando o restando 360°.',
    { type: 'tip', text: 'resumen para la entrevista: «Euler es intuitivo y es lo que ven los animadores, pero depende del orden y tiene bloqueo de cardán. Internamente, para interpolar o combinar rotaciones, uso matrices o cuaterniones».' }
  ],

  example: {
    intro: 'Detectar saltos de más de 180° entre claves.',
    lines: [
      { code: 'claves = [170, -175, -160]', note: 'Valores de rotateY en tres frames seguidos.' },
      { code: 'for a, b in zip(claves, claves[1:]):', note: 'Recorremos los pares (anterior, siguiente).' },
      { code: '    if abs(b - a) > 180:', note: 'Un salto de más de media vuelta es sospechoso.' },
      { code: '        print("salto:", a, "→", b)', note: 'De 170 a -175 hay 345°, pero en realidad solo giró 15°.' }
    ],
    output: 'salto: 170 → -175'
  },

  mini: [
    {
      q: 'Con `rotateOrder = xyz`, ¿qué valor de Y produce el bloqueo de cardán?',
      options: ['0°', '±90°', '45°'],
      answer: 1,
      why: 'A ±90° en el eje del medio, el primero y el último quedan alineados.'
    },
    {
      q: 'Cambias `rotateOrder` de `xyz` a `zxy` sin cambiar los valores. ¿Qué pasa?',
      options: ['Nada', 'El objeto cambia de orientación', 'Maya da un error'],
      answer: 1,
      why: 'Los mismos números aplicados en otro orden dan otra orientación.'
    }
  ],
  extra: [
    {
      q: '¿Qué hace el Euler Filter?',
      options: ['Quita claves', 'Suma o resta 360° para evitar saltos entre claves seguidas', 'Convierte a cuaterniones'],
      answer: 1,
      why: 'Mantiene la misma orientación, pero hace que la curva sea continua.'
    },
    {
      q: '¿Cómo se evita el bloqueo de cardán al **interpolar** rotaciones internamente?',
      options: ['Con más claves', 'Con cuaterniones o matrices', 'Con valores más pequeños'],
      answer: 1,
      why: 'Los cuaterniones no tienen bloqueo de cardán (lección v08).'
    }
  ],

  exercises: [
    {
      id: 'e1',
      title: 'Normalizar un ángulo',
      prompt: 'Escribe `normalizar_angulo(a)`: devuelve el ángulo equivalente en el rango **[-180, 180)**.\n\nPor ejemplo, 190 → -170 y 540 → -180.',
      setup: SETUP,
      starter: 'def normalizar_angulo(a):\n    pass\n',
      tests: [
        { check: '_cerca(normalizar_angulo(190), -170)', msg: '190 → -170' },
        { check: '_cerca(normalizar_angulo(-190), 170)', msg: '-190 → 170' },
        { check: '_cerca(normalizar_angulo(765), 45)', msg: '765 (dos vueltas + 45) → 45' },
        { check: '_cerca(normalizar_angulo(30), 30)', msg: 'un ángulo ya en rango no cambia' }
      ],
      hints: ['Desplaza, aplica módulo y vuelve: `(a + 180) % 360 - 180`.', 'En Python, `%` con negativos ya devuelve un resultado positivo.'],
      solution: 'def normalizar_angulo(a):\n    return (a + 180) % 360 - 180\n'
    },
    {
      id: 'e2',
      title: 'Tu propio Euler Filter',
      prompt: 'Escribe `filtro_euler(valores)`: recibe una lista de ángulos (claves seguidas) y devuelve una lista nueva donde cada valor se ajusta sumando o restando 360 hasta que su diferencia con el **anterior ya ajustado** sea como mucho 180.\n\nEl primer valor no cambia.',
      setup: SETUP,
      starter: 'def filtro_euler(valores):\n    pass\n',
      tests: [
        { check: '_cerca(filtro_euler([170, -175, -160]), [170, 185, 200])', msg: '[170, -175, -160] → [170, 185, 200]' },
        { check: '_cerca(filtro_euler([0, 350]), [0, -10])', msg: '[0, 350] → [0, -10]' },
        { check: '_cerca(filtro_euler([10, 20, 30]), [10, 20, 30])', msg: 'sin saltos, no cambia nada' },
        { check: '_cerca(filtro_euler([0, 700]), [0, -20])', msg: 'saltos de varias vueltas' },
        { check: 'filtro_euler([]) == []', msg: 'lista vacía → lista vacía' }
      ],
      hints: ['Empieza con `res = valores[:1]`.', 'Para cada valor siguiente: `while v - res[-1] > 180: v -= 360` (y al revés con `< -180`).'],
      solution: 'def filtro_euler(valores):\n    res = list(valores[:1])\n    for v in valores[1:]:\n        while v - res[-1] > 180:\n            v -= 360\n        while v - res[-1] < -180:\n            v += 360\n        res.append(v)\n    return res\n',
      explain: 'Se compara con el valor **ya ajustado**, no con el original: si no, el error se arrastra en las claves siguientes.'
    }
  ],

  summary: [
    'Euler = tres rotaciones en orden; el `rotateOrder` cambia el resultado.',
    'Bloqueo de cardán: con el eje del medio a ±90°, dos ejes se alinean.',
    'Saltos de 360° entre claves se arreglan con un Euler Filter.'
  ]
});
})();
