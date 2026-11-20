TA.add({
  id: 'd06',
  title: 'Caso: exportar 100 cortes de cinemática',
  en: 'design case',

  explain: [
    'Este es el tipo de pregunta de diseño que te pueden hacer: «¿Cómo automatizarías la exportación de las 100 tomas de una cinemática?». Aquí juntas todo lo de las lecciones anteriores.',
    { type: 'analogy', text: 'es como planear una mudanza de 100 cajas: primero haces la lista de qué va en cada caja, compruebas que todo cabe en el camión, numeras las cajas y, al llegar, revisas que no falte ninguna.' },
    '### Una estructura para responder',
    '1. **Aclarar** (d02): formato, motor, qué se exporta por toma (cámara, personajes, rango), quién lo lanza, cuánto tiempo hay.\n2. **Datos de entrada**: de dónde salen las tomas y sus rangos (atributos en la cámara, un archivo de edición, la base de datos de producción).\n3. **Plan**: una lista de trabajos `toma → qué exportar → dónde`. Sin tocar nada todavía (como el *dry run* de p19).\n4. **Validar**: cámaras que faltan, rangos que se solapan, nombres que chocan, carpetas.\n5. **Ejecutar**: por lotes, un error no para el resto, progreso visible, sin interfaz si es de noche.\n6. **Verificar y resumir**: comprobar que cada archivo existe y no está vacío; informe final.\n7. **Mantener**: configuración por proyecto, versión en los logs.',
    { type: 'tip', text: 'dilo en voz alta en este orden. Aunque no termines de explicarlo todo, una estructura clara ya demuestra mucho. Empieza por: «Primero aclararía…».' },
    { type: 'cg', text: 'con 100 tomas, si cada una tarda 1 minuto, el lote tarda casi 2 horas. Es buena idea poder lanzarlo sin interfaz, por la noche o en la granja, y poder repetir solo las tomas que fallaron.' }
  ],

  example: {
    intro: 'Esqueleto de la lógica (sin interfaz).',
    lines: [
      { label: '1. Plan', code: 'def planificar(tomas, cfg):\n    return [Trabajo(t.nombre, t.camara, t.inicio, t.fin,\n                    ruta=cfg.ruta_para(t)) for t in tomas]', note: 'Solo calcula qué hay que hacer.' },
      { label: '2. Validar', code: 'def validar(trabajos):\n    errores = []\n    errores += camaras_que_faltan(trabajos)\n    errores += rangos_solapados(trabajos)\n    errores += rutas_repetidas(trabajos)\n    return errores', note: 'Reglas separadas; fácil añadir más.' },
      { label: '3. Ejecutar', code: 'def ejecutar(trabajos, progreso=None):\n    hechos, fallos = [], {}\n    for i, t in enumerate(trabajos, 1):\n        try:\n            exportar(t)\n            hechos.append(t.nombre)\n        except Exception as e:\n            log.exception("Falló %s", t.nombre)\n            fallos[t.nombre] = str(e)\n        if progreso:\n            progreso(i, len(trabajos))\n    return hechos, fallos', note: 'Un fallo no para el resto. `progreso` es opcional: la ventana lo usa; el lote nocturno no.' },
      { label: '4. Verificar', code: 'def verificar(trabajos):\n    return [t.nombre for t in trabajos\n            if not os.path.exists(t.ruta) or os.path.getsize(t.ruta) == 0]', note: 'Comprueba que se exportó algo de verdad.' }
    ]
  },

  mini: [
    {
      q: '¿Por qué separar «planificar» de «ejecutar»?',
      options: ['Por estilo', 'Para poder revisar y validar el plan antes de exportar nada (y hacer un dry run)', 'Para que sea más lento'],
      answer: 1,
      why: 'Detectas los problemas antes de gastar dos horas exportando.'
    },
    {
      q: 'El lote tarda 2 horas. ¿Qué es lo más útil?',
      options: ['Que se pueda lanzar sin interfaz (de noche o en la granja) y repetir solo las fallidas', 'Que la ventana sea más bonita', 'Exportar todo dos veces por si acaso'],
      answer: 0,
      why: 'Así no bloquea al artista y los errores se corrigen sin repetirlo todo.'
    }
  ],

  exercises: [
    {
      id: 'e1',
      kind: 'free',
      title: 'Responde la pregunta de entrevista',
      prompt: '«Tenemos una cinemática de 100 tomas. Cada toma necesita exportar su cámara y la animación de los personajes al motor. ¿Cómo lo automatizarías?»\n\nEscribe tu respuesta como si hablaras (unos 2-3 minutos).',
      checklist: [
        'Empiezo aclarando requisitos (formato, motor, quién lo lanza, qué se exporta).',
        'Explico de dónde salen las tomas y sus rangos (metadatos, archivo de edición).',
        'Separo plan → validación → ejecución → verificación.',
        'Menciono validaciones concretas: cámaras que faltan, rangos solapados, nombres que chocan.',
        'Un error no para el lote; log con contexto; resumen al final; repetir solo las fallidas.',
        'Se puede lanzar sin interfaz (noche o granja) y con progreso en la interfaz.',
        'Configuración por proyecto y versión de la herramienta en los logs.'
      ],
      model: '«Primero aclararía el formato que espera el motor, si se exporta cámara y personajes por separado, y si lo lanza el artista o un proceso nocturno.\n\nLas tomas y sus rangos los leería de los metadatos de las cámaras (un atributo `shotName`) o del archivo de edición, no a mano.\n\nLo dividiría en cuatro pasos. Primero, un **plan**: para cada toma, qué exportar y a qué ruta, según la convención del proyecto. Segundo, **validar** el plan: cámaras que faltan, rangos que se solapan, nombres repetidos y carpetas. Si hay errores, aviso antes de empezar. Tercero, **ejecutar** toma a toma: si una falla, la registro en el log con el motivo y sigo con las demás. Cuarto, **verificar** que cada archivo existe y no está vacío, y generar un resumen.\n\nLa lógica estaría separada de la interfaz, para poder lanzarla de noche o en la granja y repetir solo las tomas que fallaron. Los valores del proyecto irían en un JSON, y guardaría la versión de la herramienta en los logs.»',
      followups: ['¿Cómo harías que fuera más rápido? (paralelo, granja)', '¿Qué haces si dos tomas comparten la misma cámara?', '¿Cómo sabría el motor qué versión de cada toma es la última?', '¿Cómo lo probarías antes de usarlo en producción?']
    }
  ],

  summary: [
    'Aclarar → plan → validar → ejecutar (sin parar por un fallo) → verificar → resumir.',
    'Datos de las tomas desde metadatos, nunca escritos a mano.',
    'Lógica sin interfaz: lote nocturno, granja y repetir solo las fallidas.'
  ]
});
