TA.add({
  id: 'd03',
  title: 'Errores y logs',
  en: 'error handling & logging',

  explain: [
    'Toda herramienta acaba fallando alguna vez: un archivo bloqueado, un nodo que no existe, una red lenta. Lo que importa es **cómo** falla.',
    { type: 'analogy', text: 'un buen error es como el aviso del coche «presión baja en la rueda trasera izquierda». Un mal error es una luz roja sin texto. Los dos avisan, pero solo uno te dice qué hacer.' },
    '### Un buen mensaje de error dice tres cosas',
    '- **Qué** pasó: «No se pudo exportar la toma sh045».\n- **Por qué**: «La cámara cam_sh045 no existe».\n- **Qué hacer**: «Revisa que la cámara esté en la escena o renómbrala».',
    '### En lotes: no pares todo por un fallo',
    'Atrapa el error **por elemento**, guárdalo con su contexto y sigue (lección p12). Al final, un **resumen**: cuántos bien, cuántos mal y por qué.',
    '### Valida antes, no a mitad',
    'Comprueba lo que puedas **antes** de empezar el trabajo pesado: que existan las carpetas, que la configuración sea válida, que no haya conflictos de nombres. Fallar en el segundo 1 es mucho mejor que en la hora 2.',
    '### Logs para el TA, mensajes para el artista',
    '- El **artista** ve un mensaje claro y corto.\n- El **log** (lección p17) guarda los detalles técnicos y el *traceback* para que tú lo arregles después.',
    { type: 'cg', text: 'cuando un error afecta a 200 escenas (lección d07), un buen log te dice en minutos qué escenas fallaron, con qué versión de la herramienta y en qué paso.' },
    { type: 'tip', text: 'frase para la entrevista: «Intento que la herramienta falle pronto y claro: valido al principio, en lotes registro cada error con contexto y sigo, y al final doy un resumen».' }
  ],

  example: {
    intro: 'El mismo fallo, contado de dos maneras.',
    lines: [
      { label: 'Mal', code: "Error: 'NoneType' object is not iterable", note: 'El artista no sabe qué pasó ni qué hacer. Te escribirá a ti.' },
      { label: 'Bien (para el artista)', code: 'No se pudo exportar sh045: la cámara cam_sh045 no existe.\nRevisa el nombre de la cámara. Las otras 29 tomas se exportaron bien.', note: 'Qué, por qué, qué hacer, y el estado del resto.' },
      { label: 'Bien (en el log)', code: 'ERROR [exportador v1.4] sh045: listRelatives devolvió None para cam_sh045\nTraceback (most recent call last): ...', note: 'Los detalles técnicos, para el TA.' }
    ]
  },

  mini: [
    {
      q: '¿Cuál es el mejor momento para comprobar que la carpeta de destino existe?',
      options: ['Al final, al escribir el último archivo', 'Al principio, antes del trabajo pesado', 'Nunca: si falla, ya se verá'],
      answer: 1,
      why: 'Fallar pronto ahorra tiempo y evita trabajos a medias.'
    },
    {
      q: '¿Qué tres cosas debe decir un buen mensaje de error?',
      options: ['El código de error, la hora y el usuario', 'Qué pasó, por qué y qué hacer', 'Solo el traceback'],
      answer: 1,
      why: 'Así el artista puede actuar sin tener que llamarte.'
    }
  ],

  exercises: [
    {
      id: 'e1',
      kind: 'free',
      title: 'Un exportador que no se rompe',
      prompt: 'Tu exportador procesa 50 tomas por la noche. Ayer se paró en la toma 12 y nadie se dio cuenta hasta la mañana.\n\n¿Cómo cambiarías el manejo de errores?',
      checklist: [
        'Valido al principio: configuración, carpetas, permisos, que existan las tomas.',
        'Cada toma va en su propio `try/except`: un fallo no para las demás.',
        'Registro cada error con contexto (toma, paso, mensaje) y el traceback en el log.',
        'Al final genero un resumen (bien / con error / por qué).',
        'Aviso a alguien (correo, mensaje en el chat del equipo) si hay errores.',
        'Me planteo poder relanzar solo las tomas que fallaron.'
      ],
      model: '1. **Validación al principio**: compruebo la configuración, que existan las carpetas y que tenga permisos. Si algo falla aquí, aviso y no empiezo.\n2. **Un try/except por toma**: si sh012 falla, registro el error con `log.exception` y paso a sh013.\n3. **Resumen al final**: «48 bien, 2 con error», con el motivo de cada uno.\n4. **Aviso**: si hay errores, mando un mensaje al canal del equipo con el resumen.\n5. **Reintento**: guardo la lista de tomas fallidas para poder relanzar solo esas por la mañana.',
      followups: ['¿Qué errores atraparías y cuáles dejarías que paren todo?', '¿Cómo harías que relanzar solo las fallidas sea fácil?']
    }
  ],

  summary: [
    'Un buen error dice qué pasó, por qué y qué hacer.',
    'Valida al principio; en lotes, atrapa por elemento, registra y sigue; resume al final.',
    'Mensajes claros para el artista; detalles técnicos y traceback en el log.'
  ]
});
