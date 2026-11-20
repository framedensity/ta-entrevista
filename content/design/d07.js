TA.add({
  id: 'd07',
  title: 'Caso: un error que afecta a 200 escenas',
  en: 'design case',

  explain: [
    'En producción, a veces un problema no afecta a una escena, sino a **200**: un cambio en el rig, una herramienta con un error, una convención que cambió a mitad. Cómo reaccionas aquí dice mucho de ti como TA.',
    { type: 'analogy', text: 'es como una fuga de agua en un edificio. Primero cierras la llave para que no se inunde más. Después ves qué pisos están mojados. Luego reparas. Y al final, averiguas por qué se rompió la tubería para que no vuelva a pasar.' },
    '### Los cuatro pasos',
    '1. **Contener**: parar lo que causa el problema (retirar la versión de la herramienta, avisar al equipo de que no publique). Que no crezca.\n2. **Medir**: ¿qué escenas están afectadas? Un script que recorre las 200 y comprueba el síntoma (lecciones p13, p14, p17). Sin suponer.\n3. **Arreglar**: si se puede, un arreglo automático en lote, con *dry run*, copia de seguridad y verificación. Si no, priorizar con producción (qué tomas se entregan antes).\n4. **Prevenir**: ¿por qué pasó? Añadir una comprobación al verificador, un test, o una validación en la herramienta.',
    '### Comunicación',
    'Igual de importante que el código: avisar pronto a supervisión y a los departamentos afectados, decir qué se sabe y qué no, y dar una estimación. Hacer de **puente** entre artistas y programadores.',
    { type: 'tip', text: 'este caso conecta con lo que dices en tu respuesta 【6】 de Kojima: «en cinemáticas, un problema puede afectar a 100 o 200 escenas; mi papel es hacer de puente entre artistas y programadores y minimizar el impacto». Ten preparado un ejemplo real (sin datos confidenciales).' },
    { type: 'cg', text: 'un cambio en el rig cambió el nombre de un control. 200 escenas de animación tienen claves en el nombre antiguo. Un script lo detecta, y otro remapea las claves al nombre nuevo, con dry run y copia de cada escena.' }
  ],

  example: {
    intro: 'Medir antes de arreglar: un script que revisa todas las escenas.',
    lines: [
      { label: 'Recorrer', code: 'escenas = sorted(Path(proyecto).rglob("*_anim_v*.ma"))', note: 'Todas las escenas de animación (lección p14).' },
      { label: 'Comprobar', code: 'afectadas = {}\nfor e in escenas:\n    try:\n        problema = comprobar(e)  # abre en modo ligero y mira el síntoma\n        if problema:\n            afectadas[e.name] = problema\n    except Exception:\n        log.exception("No se pudo revisar %s", e)', note: 'Un fallo al abrir una escena no para la revisión.' },
      { label: 'Informe', code: 'log.info("%d de %d escenas afectadas", len(afectadas), len(escenas))\nguardar_json("informe.json", afectadas)', note: 'Con datos, no suposiciones: así se decide con producción.' }
    ]
  },

  mini: [
    {
      q: '¿Qué haces primero cuando descubres un problema que afecta a muchas escenas?',
      options: ['Arreglar todas las escenas lo antes posible', 'Contener: evitar que afecte a más escenas y avisar', 'Esperar a ver si alguien se queja'],
      answer: 1,
      why: 'Si no paras la causa, mientras arreglas, el problema sigue creciendo.'
    },
    {
      q: 'Antes de un arreglo automático en 200 escenas, ¿qué es imprescindible?',
      options: ['Hacerlo rápido', 'Dry run, copia de seguridad y verificación después', 'Hacerlo sin avisar para no molestar'],
      answer: 1,
      why: 'Un arreglo en lote con un error puede empeorarlo todo. Hay que poder volver atrás.'
    }
  ],

  exercises: [
    {
      id: 'e1',
      kind: 'free',
      title: 'Cuenta cómo lo gestionarías',
      prompt: '«Una actualización de tu herramienta de exportación introdujo un error: las cámaras se exportaron con un desfase de un frame. Ya se usó en unas 200 escenas durante una semana. ¿Qué haces?»\n\nResponde como en la entrevista.',
      checklist: [
        '**Contener**: retiro la versión con el error (vuelvo a la anterior) y aviso al equipo.',
        '**Medir**: script que revisa qué escenas/archivos se exportaron con esa versión (gracias a la versión en los logs o metadatos).',
        '**Arreglar**: reexportar en lote solo las afectadas, con dry run y verificación.',
        '**Priorizar** con producción: las tomas que se entregan antes, primero.',
        '**Comunicar**: aviso pronto, con qué se sabe, qué no y cuándo estará.',
        '**Prevenir**: un test o comprobación que habría detectado el desfase.'
      ],
      model: '«Primero lo **contendría**: volvería a la versión anterior de la herramienta y avisaría al equipo para que no exporte más con la versión rota.\n\nDespués **mediría** el alcance: como la herramienta guarda su versión en los logs y en los metadatos de cada archivo, un script puede listar exactamente qué exportaciones usaron la versión con el error, en vez de suponer.\n\nPara **arreglar**, reexportaría en lote solo esas escenas, con dry run primero y comprobando después que el rango de frames coincide con la escena. Con producción decidiría el orden: primero lo que se entrega antes.\n\nIría **comunicando**: qué pasó, cuántas escenas, qué está arreglado y cuánto falta.\n\nY para **prevenir**, añadiría una comprobación automática que compare el rango exportado con el de la escena, para que un desfase así no vuelva a pasar sin que nadie lo vea.»',
      followups: ['¿Cómo sabrías qué escenas se exportaron con la versión mala?', '¿Qué harías si no hay registro de versiones?', '¿Cómo evitarías que una actualización llegue a todos sin probarla?']
    }
  ],

  summary: [
    'Contener → medir → arreglar (dry run, copia, verificación) → prevenir.',
    'Comunicar pronto: qué se sabe, qué no y cuándo; ser puente entre artistas y programadores.',
    'Registrar la versión de la herramienta permite medir el alcance con datos.'
  ]
});
