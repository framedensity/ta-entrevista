TA.add({
  id: 'd02',
  title: 'Primero, los requisitos',
  en: 'requirements',

  explain: [
    'El error más caro de un TA es construir rápido **la herramienta equivocada**. Antes de escribir una línea, hay que entender qué se necesita de verdad.',
    { type: 'analogy', text: 'eres un sastre. Si haces el traje sin tomar medidas, quizá sea precioso, pero no le valdrá a nadie. Las preguntas son las medidas.' },
    '### Las preguntas clave',
    '- **¿Quién** la va a usar? ¿Animadores, iluminadores, la granja de render?\n- **¿Qué problema** tienen hoy? ¿Cuánto tiempo les cuesta?\n- **¿Con qué datos** trabaja? ¿Cuántos? (10 tomas o 2 000 cambian todo el diseño.)\n- **¿Qué sale** de la herramienta y quién lo recibe después?\n- **¿Qué no puede fallar?** ¿Qué pasa si falla a mitad?\n- **¿Hay plazo?** ¿Hace falta algo pequeño ya, y algo completo después?',
    '### En la entrevista: pregunta antes de responder',
    'Si te dan un problema de diseño («haz una herramienta que exporte cámaras»), **no empieces a diseñar enseguida**. Haz 2 o 3 preguntas. Los entrevistadores lo esperan: así se ve cómo trabajas en un equipo real.',
    { type: 'tip', text: 'una frase útil: «Antes de diseñarlo, me gustaría aclarar tres cosas: cuántas tomas hay, a qué formato y quién recibe el resultado». Después, si no hay respuesta, di qué **supones** y sigue.' },
    '### Empieza pequeño',
    'Haz primero una versión mínima que resuelva lo más doloroso. Dásela a uno o dos artistas, mira cómo la usan y mejórala. Es mejor que pasar dos meses en una herramienta enorme que nadie pidió así.',
    { type: 'cg', text: 'un director pide «una herramienta para revisar las cinemáticas». Tras preguntar, resulta que lo que de verdad quiere es ver todas las tomas seguidas con el nombre y el frame encima. Eso se hace en un día, no en un mes.' }
  ],

  example: {
    intro: 'Petición: «Necesitamos una herramienta para exportar las cámaras».',
    lines: [
      { label: 'Respuesta precipitada', code: '«Vale, hago un botón que exporta la cámara seleccionada a FBX.»', note: 'Puede que no sirva: ¿y si son 300 tomas? ¿y si el motor necesita otro formato?' },
      { label: 'Primero preguntas', code: '¿Cuántas cámaras/tomas por entrega?\n¿Qué formato y qué convención de nombres espera el motor?\n¿Hay que exportar también el rango de frames y la focal?\n¿Quién la usa: el artista o un proceso nocturno?', note: 'Cada respuesta cambia el diseño.' },
      { label: 'Diseño ajustado', code: 'Lote por secuencia, lee las cámaras por su atributo shotName,\nnombra los archivos según la convención del motor,\nmodo sin interfaz para el proceso nocturno.', note: 'Ahora sí resuelve el problema real.' }
    ]
  },

  mini: [
    {
      q: 'En la entrevista te piden diseñar una herramienta. ¿Qué haces primero?',
      options: ['Empiezas a escribir código en la pizarra', 'Haces 2-3 preguntas para aclarar el problema (o dices qué supones)', 'Dices que necesitas más tiempo'],
      answer: 1,
      why: 'Muestra que entiendes que el diseño depende de los requisitos.'
    },
    {
      q: '¿Por qué es importante saber si son 10 o 2 000 elementos?',
      options: ['No importa', 'Cambia el diseño: rendimiento, lotes, informes, si hace falta interfaz', 'Solo por la memoria'],
      answer: 1,
      why: 'Con 2 000, necesitas lotes, rendimiento, informes y quizá ejecución sin interfaz.'
    }
  ],

  exercises: [
    {
      id: 'e1',
      kind: 'free',
      title: '¿Qué preguntarías?',
      prompt: 'Un supervisor te dice: «Quiero una herramienta que compruebe las escenas de animación antes de enviarlas a iluminación».\n\nEscribe las preguntas que harías antes de diseñar nada, y qué supondrías si no te contestan.',
      checklist: [
        'Pregunto **qué** hay que comprobar exactamente (nombres, rango de frames, claves fuera de rango, referencias, cámaras…).',
        'Pregunto **cuántas** escenas y con qué frecuencia (una a una o en lote).',
        'Pregunto **quién** la usa y en qué momento (al guardar, al publicar, de noche).',
        'Pregunto qué pasa si algo falla: ¿bloquea el envío o solo avisa?',
        'Pregunto cómo se entrega el resultado (ventana, informe, mensaje al supervisor).',
        'Digo qué supongo si no hay respuesta y propongo empezar con una versión pequeña.'
      ],
      model: '«Antes de diseñarla preguntaría:\n- ¿Qué problemas llegan hoy a iluminación? Así sé qué comprobar primero.\n- ¿Cuántas escenas por día? ¿Se envían una a una o todas al final?\n- ¿La lanza el animador antes de publicar, o se hace automáticamente al publicar?\n- Si hay un error, ¿se bloquea el envío o solo se avisa?\n- ¿Quién necesita ver el resultado?\n\nSi no hay respuesta, supondría: se lanza al publicar, comprueba nombres, rango de frames y cámaras, avisa sin bloquear y genera un informe. Empezaría con las tres comprobaciones que más problemas causan y añadiría más después.»',
      followups: ['¿Qué comprobación harías primero y por qué?', '¿Cómo decidirías si bloquear o solo avisar?']
    }
  ],

  summary: [
    'Antes de construir: quién, qué problema, cuántos datos, qué sale, qué no puede fallar.',
    'En la entrevista, pregunta 2-3 cosas o di lo que supones antes de diseñar.',
    'Empieza con una versión mínima, dásela a pocos artistas y mejora.'
  ]
});
