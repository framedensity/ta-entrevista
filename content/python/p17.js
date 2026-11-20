TA.add({
  id: 'p17',
  title: 'logging',
  en: 'logging instead of print',

  explain: [
    '`print` sirve para probar. Pero en una herramienta que usan 30 artistas, necesitas saber **qué pasó**, **cuándo** y **qué gravedad** tenía. Para eso está el módulo `logging`.',
    { type: 'analogy', text: '`logging` es la caja negra de un avión. Va anotando lo que pasa, con la hora y la importancia. Si algo falla, abres la caja y ves la historia.' },
    '### Los niveles',
    '- `DEBUG` → detalles para ti mientras programas.\n- `INFO` → «todo va bien»: exportando sh010…\n- `WARNING` → algo raro, pero sigue: falta una cámara opcional.\n- `ERROR` → algo falló: no se pudo exportar sh020.\n- `CRITICAL` → la herramienta no puede continuar.',
    'Configuras el **nivel mínimo** que quieres ver. Con `level=logging.INFO`, los mensajes `DEBUG` no se muestran.',
    '```python\nimport logging\nlogging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")\nlog = logging.getLogger("exportador")\nlog.info("Exportando %s", toma)\nlog.warning("Sin cámara en %s", toma)\n```',
    { type: 'compare',
      badTitle: 'print: no se puede filtrar ni guardar fácilmente',
      bad: 'print("ERROR no se pudo exportar", toma)',
      goodTitle: 'logging: nivel, nombre y formato',
      good: 'log.error("No se pudo exportar %s", toma)' },
    '### logger.exception',
    'Dentro de un `except`, `log.exception("...")` guarda el mensaje **y** el *traceback* completo. Es la mejor forma de que el TA pueda arreglar el error después.',
    { type: 'cg', text: 'cada herramienta usa `logging.getLogger("nombre_herramienta")`. Así, en un archivo de log del estudio, sabes qué herramienta escribió cada línea.' },
    { type: 'tip', text: 'usa `%s` en lugar de f-strings dentro de `log.info(...)`. El texto solo se construye si el nivel está activo. Es un detalle que muestra experiencia.' }
  ],

  example: {
    intro: 'Un exportador que informa de lo que hace.',
    lines: [
      { code: 'import logging', note: 'Módulo estándar.' },
      { code: 'logging.basicConfig(level=logging.INFO, format="%(levelname)s [%(name)s] %(message)s")', note: 'Nivel mínimo INFO y formato con nivel y nombre.' },
      { code: 'log = logging.getLogger("exportador")', note: 'Un logger con el nombre de la herramienta.' },
      { code: 'log.debug("detalle interno")', note: 'No se ve: DEBUG está por debajo de INFO.' },
      { code: 'log.info("Exportando %s", "sh010")', note: '`%s` se rellena con el argumento.' },
      { code: 'try:\n    1 / 0\nexcept ZeroDivisionError:\n    log.exception("Fallo en %s", "sh020")', note: 'Guarda el mensaje y el traceback.' }
    ],
    output: 'INFO [exportador] Exportando sh010\nERROR [exportador] Fallo en sh020\nTraceback (most recent call last):\n  ...\nZeroDivisionError: division by zero'
  },

  mini: [
    {
      q: 'Con `level=logging.WARNING`, ¿qué mensajes se ven?',
      options: ['Todos', 'WARNING, ERROR y CRITICAL', 'Solo WARNING'],
      answer: 1,
      why: 'El nivel es el **mínimo**: se ve ese nivel y los más graves.'
    },
    {
      q: '¿Qué añade `log.exception(...)` respecto a `log.error(...)`?',
      options: ['Nada', 'El traceback del error que se está atrapando', 'Para el programa'],
      answer: 1,
      why: 'Se usa dentro de `except` y guarda también la pila de llamadas: dónde ocurrió el error.'
    }
  ],

  exercises: [
    {
      id: 'e1',
      title: 'Configurar y registrar',
      prompt: 'Configura `logging.basicConfig` con nivel `INFO`. Crea un logger llamado `"exportador"` y registra con `info` el mensaje `Exportando sh010`.',
      starter: 'import logging\n\n',
      tests: [
        { check: "'Exportando sh010' in _log", msg: 'el log contiene "Exportando sh010"' },
        { check: "logging.getLogger('exportador').getEffectiveLevel() == logging.INFO", msg: 'el nivel efectivo es INFO' }
      ],
      hints: ['`logging.basicConfig(level=logging.INFO)`', '`log = logging.getLogger("exportador")` y `log.info("Exportando %s", "sh010")`.'],
      solution: 'import logging\n\nlogging.basicConfig(level=logging.INFO)\nlog = logging.getLogger("exportador")\nlog.info("Exportando %s", "sh010")\n'
    },
    {
      id: 'e2',
      title: 'Avisar sin parar',
      prompt: 'Recorre `tomas` (`{toma: cámara}`). Para cada toma **sin cámara** (`None`), registra un `warning` que contenga el nombre de la toma. Las que sí tienen cámara, regístralas con `info`.\n\nAl final, `sin_camara` debe tener cuántos avisos diste.',
      starter: 'import logging\n\nlogging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")\nlog = logging.getLogger("revisor")\n\ntomas = {"sh010": "cam_A", "sh020": None, "sh030": "cam_C", "sh040": None}\nsin_camara = 0\n',
      tests: [
        { check: "'WARNING' in _log and 'sh020' in _log and 'sh040' in _log", msg: 'hay WARNING para sh020 y sh040' },
        { check: "_log.count('WARNING') == 2 and _log.count('INFO') == 2", msg: '2 avisos y 2 info' },
        { check: 'sin_camara == 2', msg: '`sin_camara` vale 2' }
      ],
      hints: ['`for toma, cam in tomas.items():`', '`if cam is None:` → `log.warning("Sin cámara: %s", toma)` y suma 1.'],
      solution: 'import logging\n\nlogging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")\nlog = logging.getLogger("revisor")\n\ntomas = {"sh010": "cam_A", "sh020": None, "sh030": "cam_C", "sh040": None}\nsin_camara = 0\nfor toma, cam in tomas.items():\n    if cam is None:\n        log.warning("Sin cámara: %s", toma)\n        sin_camara += 1\n    else:\n        log.info("%s usa %s", toma, cam)\n'
    },
    {
      id: 'e3',
      title: 'Guardar el error completo',
      prompt: 'La función `exportar(toma)` falla con algunas tomas. Escribe `lote(tomas)` que llame a `exportar` para cada una; si falla, usa `log.exception` (con el nombre de la toma) y **sigue**. Devuelve la lista de tomas que fallaron.',
      starter: 'import logging\n\nlogging.basicConfig(level=logging.INFO)\nlog = logging.getLogger("lote")\n\ndef exportar(toma):\n    if toma.endswith("0"):\n        return True\n    raise RuntimeError("cámara bloqueada")\n\ndef lote(tomas):\n    # tu código\n    pass\n',
      tests: [
        { check: "lote(['sh010', 'sh015', 'sh020', 'sh025']) == ['sh015', 'sh025']", msg: 'devuelve las tomas que fallaron' },
        { check: "_ta_log_has_traceback()", msg: 'el log incluye el traceback (log.exception)' }
      ],
      setup: 'import io as _io, logging as _lg\n_buf = _io.StringIO()\n_h = _lg.StreamHandler(_buf)\n_lg.getLogger().addHandler(_h)\n_lg.getLogger().setLevel(_lg.INFO)\ndef _ta_log_has_traceback():\n    lote(["sh015"])\n    return "Traceback" in _buf.getvalue() and "sh015" in _buf.getvalue()\n',
      hints: ['`try: exportar(t)` / `except RuntimeError: log.exception("Falló %s", t)`.', 'Guarda las que fallan en una lista y devuélvela.'],
      solution: 'import logging\n\nlogging.basicConfig(level=logging.INFO)\nlog = logging.getLogger("lote")\n\ndef exportar(toma):\n    if toma.endswith("0"):\n        return True\n    raise RuntimeError("cámara bloqueada")\n\ndef lote(tomas):\n    fallos = []\n    for t in tomas:\n        try:\n            exportar(t)\n        except RuntimeError:\n            log.exception("Falló %s", t)\n            fallos.append(t)\n    return fallos\n'
    }
  ],

  summary: [
    '`logging` en vez de `print`: niveles (DEBUG < INFO < WARNING < ERROR < CRITICAL), nombre y formato.',
    '`logging.getLogger("herramienta")` y `log.info("texto %s", valor)`.',
    'Dentro de `except`, `log.exception(...)` guarda también el traceback.'
  ]
});
