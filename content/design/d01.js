TA.add({
  id: 'd01',
  title: '¿Qué es una buena herramienta?',
  en: 'what makes a good tool',

  explain: [
    'En la entrevista no solo te preguntarán «¿sabes programar?», sino «¿sabes hacer herramientas que la gente **use**?». No es lo mismo.',
    { type: 'analogy', text: 'una buena herramienta es como un buen cuchillo de cocina: hace una cosa muy bien, no te corta a ti, y el cocinero se olvida de que lo está usando. Una mala herramienta es un cuchillo que hay que aprender a usar y que a veces se rompe.' },
    '### Las cinco cualidades',
    '- **Resuelve el problema real**: el que tiene el artista, no el que tú imaginaste. Primero se pregunta (lección d02).\n- **Es segura**: no destruye trabajo; avisa antes de sobrescribir; se puede deshacer.\n- **Falla bien**: si algo va mal, dice qué, dónde y qué hacer (lección d03).\n- **Es fácil de usar**: pocos pasos, valores por defecto sensatos, sin leer un manual (lección d04).\n- **Se puede mantener**: código ordenado, lógica separada de la interfaz, configurable sin tocar código (lección d05).',
    '### Medir el éxito',
    'Una herramienta buena **se usa**. Si los artistas la evitan, algo falla, aunque el código sea perfecto. Pregunta, observa cómo la usan y mejora.',
    { type: 'cg', text: 'una herramienta que ahorra 5 minutos por toma, en una cinemática de 200 tomas, ahorra más de 16 horas. Ese es el tipo de número que conviene contar en la entrevista.' },
    { type: 'tip', text: 'cuando hables de tus herramientas, usa la estructura **problema → solución → resultado** con un número: «el ajuste de profundidad de campo tardaba medio día por proyecto; lo automaticé y ahora tarda menos de una hora».' }
  ],

  example: {
    intro: 'La misma tarea, dos herramientas.',
    lines: [
      { label: 'Herramienta A', code: 'Botón «Exportar».\nExporta todo lo seleccionado a C:/temp.\nSi el archivo existe, lo sobrescribe.\nSi algo falla, aparece un error de Python en rojo.', note: 'Funciona en el ordenador de quien la hizo. Para los demás, es un riesgo.' },
      { label: 'Herramienta B', code: 'Lista de tomas con su rango y cámara.\nCarpeta por defecto según el proyecto.\nAvisa si va a sobrescribir.\nAl terminar: «28 exportadas, 2 con error: sh045 sin cámara».', note: 'Hace lo mismo, pero el artista sabe qué va a pasar y qué pasó.' }
    ],
    outro: 'La diferencia no está en lo difícil del código, sino en pensar en la persona que la va a usar.'
  },

  mini: [
    {
      q: 'Tu herramienta funciona perfectamente, pero los animadores siguen haciendo el trabajo a mano. ¿Qué haces?',
      options: ['Les obligas a usarla', 'Observas cómo trabajan y preguntas qué les falla para mejorarla', 'Nada: el código está bien'],
      answer: 1,
      why: 'Si no se usa, no resuelve el problema real. Hay que entender por qué.'
    },
    {
      q: '¿Qué estructura es mejor para contar una herramienta en la entrevista?',
      options: ['Lista de funciones que tiene', 'Problema → solución → resultado (con un número)', 'El lenguaje en que la escribiste'],
      answer: 1,
      why: 'Muestra que entiendes el impacto, no solo la técnica.'
    }
  ],

  exercises: [
    {
      id: 'e1',
      kind: 'free',
      title: 'Tu mejor herramienta',
      prompt: 'Cuenta en 4-6 frases una herramienta que hayas hecho (por ejemplo, la de ruido de captura de movimiento o la de profundidad de campo), como lo harías en la entrevista.',
      checklist: [
        'Empiezo por el **problema**: qué pasaba y cuánto tiempo costaba.',
        'Explico la **solución** en una o dos frases, sin entrar en todos los detalles.',
        'Doy un **resultado con número** (de X horas a Y minutos, en N proyectos).',
        'Menciono a **quién** ayudó (animadores, la ciudad, el estudio) y que se sigue usando.',
        'Dejo un gancho para que me pregunten más (un detalle técnico interesante).'
      ],
      model: '«En captura de movimiento, el ruido y los saltos de las articulaciones se corregían a mano, personaje por personaje. En una escena de 30 personajes eran unas dos semanas de trabajo. Hice una herramienta que detecta automáticamente los picos en los valores de las claves y los suaviza solo en esas zonas. Ahora la misma escena se limpia en 30 o 40 minutos, y el equipo puede empezar antes con el ajuste fino de la animación. La parte más difícil fue no estropear los movimientos rápidos de verdad, que también tienen cambios bruscos.»',
      followups: ['¿Cómo distinguías el ruido de un movimiento rápido real?', '¿Cómo la probaste antes de dársela al equipo?', '¿Qué cambiarías si la hicieras hoy?']
    }
  ],

  summary: [
    'Una buena herramienta resuelve el problema real, es segura, falla bien, es fácil y se mantiene.',
    'El éxito se mide en uso: si no la usan, algo falla.',
    'Cuéntala como problema → solución → resultado, con un número.'
  ]
});
