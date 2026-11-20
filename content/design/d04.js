TA.add({
  id: 'd04',
  title: 'Pensar como artista',
  en: 'artist UX',

  explain: [
    'Tú eres también artista de cinemáticas. Esa es tu gran ventaja como TA: sabes **dónde le duele** al artista. Esta lección es sobre aprovecharla.',
    { type: 'analogy', text: 'un buen camarero no te pregunta veinte cosas para servirte un café. Sabe lo que suele pedir la gente, te lo propone, y solo pregunta lo que de verdad cambia.' },
    '### Principios',
    '- **Valores por defecto sensatos**: lo más común debe funcionar con un clic.\n- **Pocos pasos**: si el artista tiene que hacer 6 clics cada vez, lo dejará de usar.\n- **No interrumpir la creatividad**: la herramienta trabaja por detrás; no obliga a cambiar la forma de trabajar.\n- **Seguridad**: nunca perder trabajo. Avisar antes de sobrescribir, y poder deshacer.\n- **Feedback**: el artista siempre sabe qué está pasando (progreso) y qué pasó (resumen).\n- **Hablar su idioma**: «toma», «cámara», «rango», no «MDagPath» ni «KeyError».',
    '### Automatizar lo mecánico, no lo creativo',
    'Las mejores herramientas quitan el trabajo **mecánico** (comprobar especificaciones, configurar exportaciones, limpiar ruido) para que el artista dedique su tiempo a lo **creativo** (la cámara, la actuación, el ritmo).',
    { type: 'cg', text: 'en vez de una ventana con 15 opciones, el exportador lee la configuración del proyecto y solo muestra la lista de tomas y un botón. Las opciones avanzadas quedan en una sección plegada.' },
    { type: 'tip', text: 'frase muy tuya para la entrevista: «Como también hago cinemáticas, sé dónde se pierde el tiempo. Automatizo lo mecánico para que el equipo pueda concentrarse en la parte creativa».' }
  ],

  example: {
    intro: 'Dos interfaces para la misma herramienta.',
    lines: [
      { label: 'Pensada por un programador', code: 'Campos: ruta absoluta, formato, escala, eje arriba, fps,\nrango inicial, rango final, nombre de la cámara, nombre del archivo…\nBotón: Ejecutar', note: 'Todo configurable, pero el artista tiene que rellenarlo cada vez y puede equivocarse.' },
      { label: 'Pensada por un artista', code: 'Lista de tomas (con rango y cámara ya detectados).\nBotón: Exportar seleccionadas.\n▸ Opciones avanzadas (plegadas)', note: 'Los valores vienen del proyecto. El artista solo elige qué tomas.' }
    ]
  },

  mini: [
    {
      q: '¿Qué deberías automatizar con una herramienta?',
      options: ['Las decisiones creativas, para ir más rápido', 'El trabajo mecánico y repetitivo, para liberar tiempo creativo', 'Todo lo posible, sin excepción'],
      answer: 1,
      why: 'Las decisiones creativas son del artista. La herramienta le quita lo mecánico.'
    },
    {
      q: 'Una opción que solo usa el 5 % de los artistas, ¿dónde la pondrías?',
      options: ['En primer plano, con letra grande', 'En una sección de opciones avanzadas, plegada', 'No la pondría nunca'],
      answer: 1,
      why: 'Está disponible para quien la necesita, sin estorbar a los demás.'
    }
  ],

  exercises: [
    {
      id: 'e1',
      kind: 'free',
      title: 'Mejora la experiencia',
      prompt: 'Un artista se queja: «la herramienta de exportar es lenta de usar: cada vez tengo que escribir la ruta, el rango de frames y elegir la cámara, y a veces me equivoco».\n\n¿Qué cambiarías?',
      checklist: [
        'Detectar automáticamente el rango y la cámara de cada toma (por nombre o metadatos).',
        'Ruta por defecto según el proyecto y la convención; recordar la última usada.',
        'Mostrar lo detectado para que el artista lo confirme, en vez de escribirlo.',
        'Validar antes de exportar y avisar con claridad (por ejemplo, cámara no encontrada).',
        'Permitir varias tomas a la vez (lote).',
        'Observar o preguntar a otros artistas para confirmar que es el problema real.'
      ],
      model: 'Quitaría todo lo que el artista escribe a mano:\n- El **rango** se lee de la escena o del atributo de la toma.\n- La **cámara** se encuentra por su atributo `shotName` o por la convención de nombres.\n- La **ruta** sale de la configuración del proyecto, y la herramienta recuerda la última.\n\nLa ventana mostraría la lista de tomas con todo ya detectado; el artista solo marca cuáles exportar. Antes de exportar, la herramienta valida y avisa si falta algo. Y lo comprobaría con dos o tres artistas antes de darlo por terminado.',
      followups: ['¿Qué pasa si la detección automática se equivoca?', '¿Cómo sabrías que la nueva versión es realmente más rápida de usar?']
    }
  ],

  summary: [
    'Valores por defecto, pocos pasos, feedback y nunca perder trabajo.',
    'Automatiza lo mecánico para liberar tiempo creativo.',
    'Tu experiencia como artista es tu ventaja: úsala y menciónala.'
  ]
});
