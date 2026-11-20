TA.add({
  id: 'd05',
  title: 'Extensibilidad',
  en: 'extensibility',

  explain: [
    'Una herramienta de estudio vive años. Cambian los proyectos, las versiones de Maya, el motor del juego y la persona que la mantiene. Diseñarla para que **cambie fácil** es parte del trabajo.',
    { type: 'analogy', text: 'una herramienta extensible es como una regleta de enchufes: cuando llega un aparato nuevo, lo enchufas. Una herramienta rígida es como tener el cable soldado: para cada aparato nuevo hay que abrir la pared.' },
    '### Técnicas',
    '- **Configuración fuera del código** (JSON por proyecto, lecciones p15 y p20): cambiar fps o formato no requiere programar.\n- **Reglas como datos** (lección p18): añadir una comprobación es añadir una línea a una lista.\n- **Lógica separada de la interfaz** (lección m10): la misma lógica sirve en la ventana, en un lote y en la granja.\n- **Funciones pequeñas con una sola tarea**: se prueban y se reutilizan.\n- **Registro de «plugins»**: una lista de comprobaciones o exportadores que se pueden añadir sin tocar el núcleo.',
    '```python\nCOMPROBACIONES = []\n\ndef comprobacion(func):\n    COMPROBACIONES.append(func)\n    return func\n\n@comprobacion\ndef rango_valido(escena): ...\n\n@comprobacion\ndef camaras_con_nombre(escena): ...\n\n# el núcleo solo recorre la lista\nfor c in COMPROBACIONES:\n    problemas += c(escena)\n```',
    '### Versiones y cambios de Maya',
    'Evita depender de detalles frágiles: identificadores internos que cambian entre versiones, rutas fijas, nombres «mágicos». Guarda la **versión** de la herramienta en los logs y en los archivos que genera.',
    { type: 'cg', text: 'tu caso de MotionBuilder: los identificadores de componentes cambiaban con cada versión y las herramientas se rompían. Pasaste a buscar por **nombre de tipo**, y las herramientas siguieron funcionando en varias versiones. Eso es diseño extensible.' },
    { type: 'tip', text: 'cuenta ese caso en la entrevista: es un ejemplo real y concreto de pensar en el mantenimiento a largo plazo.' }
  ],

  example: {
    intro: 'Añadir un formato de exportación nuevo.',
    lines: [
      { label: 'Rígido', code: 'def exportar(toma, formato):\n    if formato == "fbx":\n        ...\n    elif formato == "abc":\n        ...\n    # nuevo formato = tocar esta función', note: 'Cada formato nuevo obliga a modificar (y volver a probar) la función central.' },
      { label: 'Extensible', code: 'EXPORTADORES = {"fbx": exportar_fbx, "abc": exportar_abc}\n\ndef exportar(toma, formato):\n    try:\n        funcion = EXPORTADORES[formato]\n    except KeyError:\n        raise ValueError(f"Formato desconocido: {formato}")\n    return funcion(toma)\n\nEXPORTADORES["usd"] = exportar_usd  # nuevo formato: una línea', note: 'Un diccionario de funciones. El núcleo no cambia.' }
    ]
  },

  mini: [
    {
      q: '¿Qué hace más fácil añadir una comprobación nueva a un verificador?',
      options: ['Un `if` largo con todas las reglas', 'Una lista (o registro) de funciones de comprobación que el núcleo recorre', 'Copiar el verificador entero'],
      answer: 1,
      why: 'Añadir es poner una función más en la lista, sin tocar el bucle principal.'
    },
    {
      q: '¿Por qué guardar la versión de la herramienta en los logs?',
      options: ['Por estética', 'Para saber con qué versión se generó un archivo o un error', 'Lo exige Python'],
      answer: 1,
      why: 'Cuando algo falla semanas después, saber la versión acelera mucho la investigación.'
    }
  ],

  exercises: [
    {
      id: 'e1',
      kind: 'free',
      title: 'Preparada para el futuro',
      prompt: 'Tu exportador de cámaras funciona para el proyecto actual (FBX, 30 fps). El año que viene habrá otro proyecto con otro motor (USD, 60 fps) y otra convención de nombres.\n\n¿Cómo lo diseñarías desde ahora para que ese cambio sea fácil?',
      checklist: [
        'Configuración por proyecto en un archivo (fps, formato, convención) con valores por defecto.',
        'Exportadores por formato en un registro/diccionario: añadir USD sin tocar el núcleo.',
        'La convención de nombres como datos o como una función intercambiable.',
        'Lógica separada de la interfaz y funciones pequeñas.',
        'Versión de la herramienta en los logs y en los archivos generados.',
        'Pruebas sencillas de la lógica para cambiar con confianza.'
      ],
      model: '- Todo lo que cambia entre proyectos (fps, formato, convención, rutas) va en un **JSON del proyecto**, combinado con valores por defecto.\n- Cada formato es una función registrada en un diccionario `EXPORTADORES`. USD es una entrada nueva, no un cambio en el núcleo.\n- La convención de nombres es una función por proyecto que recibe la toma y devuelve el nombre.\n- La ventana solo llama a la lógica, así que la misma lógica sirve en lotes.\n- Guardo la versión de la herramienta en el log y en los metadatos de cada archivo exportado.\n- Algunas pruebas automáticas de la lógica (nombres, rangos) para no romper lo que ya funciona.',
      followups: ['¿Qué parte sería más difícil de cambiar y cómo la aislarías?', '¿Cómo probarías el exportador sin abrir Maya?']
    }
  ],

  summary: [
    'Configuración y reglas como datos; lógica separada de la interfaz.',
    'Registros (dicts o listas de funciones) para añadir sin tocar el núcleo.',
    'Evita detalles frágiles entre versiones y registra la versión de la herramienta.'
  ]
});
