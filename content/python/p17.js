TA.add({
  id: 'p17',
  title: 'logging',

  explain: [
    '`print` is fine for testing. But in a tool used by 30 artists, you need to know **what happened**, **when** and **how serious** it was. That is what the `logging` module is for.',
    { type: 'analogy', text: '`logging` is a plane\'s black box. It keeps notes of what happens, with the time and the importance. If something fails, you open the box and read the story.' },
    '### The levels',
    '- `DEBUG` → details for you while you code.\n- `INFO` → «all good»: exporting sh010…\n- `WARNING` → something odd, but it continues: an optional camera is missing.\n- `ERROR` → something failed: could not export sh020.\n- `CRITICAL` → the tool cannot continue.',
    'You set the **minimum level** you want to see. With `level=logging.INFO`, `DEBUG` messages are hidden.',
    '```python\nimport logging\nlogging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")\nlog = logging.getLogger("exporter")\nlog.info("Exporting %s", shot)\nlog.warning("No camera in %s", shot)\n```',
    { type: 'compare',
      badTitle: 'print: hard to filter or save',
      bad: 'print("ERROR could not export", shot)',
      goodTitle: 'logging: level, name and format',
      good: 'log.error("Could not export %s", shot)' },
    '### logger.exception',
    'Inside an `except`, `log.exception("...")` stores the message **and** the full *traceback*. It is the best way to let the TA fix the error later.',
    { type: 'cg', text: 'every tool uses `logging.getLogger("tool_name")`. That way, in a studio log file, you know which tool wrote each line.' },
    { type: 'tip', text: 'use `%s` instead of f-strings inside `log.info(...)`. The text is only built if the level is active. It is a detail that shows experience.' }
  ],

  example: {
    intro: 'An exporter that reports what it does.',
    lines: [
      { code: 'import logging', note: 'Standard module.' },
      { code: 'logging.basicConfig(level=logging.INFO, format="%(levelname)s [%(name)s] %(message)s")', note: 'Minimum level INFO and a format with level and name.' },
      { code: 'log = logging.getLogger("exporter")', note: 'A logger named after the tool.' },
      { code: 'log.debug("internal detail")', note: 'Not shown: DEBUG is below INFO.' },
      { code: 'log.info("Exporting %s", "sh010")', note: '`%s` is filled in with the argument.' },
      { code: 'try:\n    1 / 0\nexcept ZeroDivisionError:\n    log.exception("Failed on %s", "sh020")', note: 'Stores the message and the traceback.' }
    ],
    output: 'INFO [exporter] Exporting sh010\nERROR [exporter] Failed on sh020\nTraceback (most recent call last):\n  ...\nZeroDivisionError: division by zero'
  },

  mini: [
    {
      q: 'With `level=logging.WARNING`, which messages are shown?',
      options: ['All of them', 'WARNING, ERROR and CRITICAL', 'Only WARNING'],
      answer: 1,
      why: 'The level is the **minimum**: you see that level and the more serious ones.'
    },
    {
      q: 'What does `log.exception(...)` add compared to `log.error(...)`?',
      options: ['Nothing', 'The traceback of the error being caught', 'It stops the program'],
      answer: 1,
      why: 'It is used inside `except` and also stores the call stack: where the error happened.'
    }
  ],

  exercises: [
    {
      id: 'e1',
      title: 'Set up and log',
      prompt: 'Configure `logging.basicConfig` with level `INFO`. Create a logger called `"exporter"` and log the message `Exporting sh010` with `info`.',
      starter: 'import logging\n\n',
      tests: [
        { check: "'Exporting sh010' in _log", msg: 'the log contains "Exporting sh010"' },
        { check: "logging.getLogger('exporter').getEffectiveLevel() == logging.INFO", msg: 'the effective level is INFO' }
      ],
      hints: ['`logging.basicConfig(level=logging.INFO)`', '`log = logging.getLogger("exporter")` and `log.info("Exporting %s", "sh010")`.'],
      solution: 'import logging\n\nlogging.basicConfig(level=logging.INFO)\nlog = logging.getLogger("exporter")\nlog.info("Exporting %s", "sh010")\n'
    },
    {
      id: 'e2',
      title: 'Warn without stopping',
      prompt: 'Loop over `shots` (`{shot: camera}`). For each shot **with no camera** (`None`), log a `warning` that contains the shot name. Log the ones that do have a camera with `info`.\n\nAt the end, `no_camera` must hold how many warnings you gave.',
      starter: 'import logging\n\nlogging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")\nlog = logging.getLogger("checker")\n\nshots = {"sh010": "cam_A", "sh020": None, "sh030": "cam_C", "sh040": None}\nno_camera = 0\n',
      tests: [
        { check: "'WARNING' in _log and 'sh020' in _log and 'sh040' in _log", msg: 'there is a WARNING for sh020 and sh040' },
        { check: "_log.count('WARNING') == 2 and _log.count('INFO') == 2", msg: '2 warnings and 2 info lines' },
        { check: 'no_camera == 2', msg: '`no_camera` is 2' }
      ],
      hints: ['`for shot, cam in shots.items():`', '`if cam is None:` → `log.warning("No camera: %s", shot)` and add 1.'],
      solution: 'import logging\n\nlogging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")\nlog = logging.getLogger("checker")\n\nshots = {"sh010": "cam_A", "sh020": None, "sh030": "cam_C", "sh040": None}\nno_camera = 0\nfor shot, cam in shots.items():\n    if cam is None:\n        log.warning("No camera: %s", shot)\n        no_camera += 1\n    else:\n        log.info("%s uses %s", shot, cam)\n'
    },
    {
      id: 'e3',
      title: 'Keeping the full error',
      prompt: 'The function `export(shot)` fails for some shots. Write `batch(shots)` that calls `export` for each one; if it fails, use `log.exception` (with the shot name) and **keep going**. Return the list of shots that failed.',
      starter: 'import logging\n\nlogging.basicConfig(level=logging.INFO)\nlog = logging.getLogger("batch")\n\ndef export(shot):\n    if shot.endswith("0"):\n        return True\n    raise RuntimeError("camera locked")\n\ndef batch(shots):\n    # your code\n    pass\n',
      tests: [
        { check: "batch(['sh010', 'sh015', 'sh020', 'sh025']) == ['sh015', 'sh025']", msg: 'returns the shots that failed' },
        { check: "_ta_log_has_traceback()", msg: 'the log includes the traceback (log.exception)' }
      ],
      setup: 'import io as _io, logging as _lg\n_buf = _io.StringIO()\n_h = _lg.StreamHandler(_buf)\n_lg.getLogger().addHandler(_h)\n_lg.getLogger().setLevel(_lg.INFO)\ndef _ta_log_has_traceback():\n    batch(["sh015"])\n    return "Traceback" in _buf.getvalue() and "sh015" in _buf.getvalue()\n',
      hints: ['`try: export(s)` / `except RuntimeError: log.exception("Failed %s", s)`.', 'Keep the failures in a list and return it.'],
      solution: 'import logging\n\nlogging.basicConfig(level=logging.INFO)\nlog = logging.getLogger("batch")\n\ndef export(shot):\n    if shot.endswith("0"):\n        return True\n    raise RuntimeError("camera locked")\n\ndef batch(shots):\n    failed = []\n    for s in shots:\n        try:\n            export(s)\n        except RuntimeError:\n            log.exception("Failed %s", s)\n            failed.append(s)\n    return failed\n'
    }
  ],

  summary: [
    '`logging` instead of `print`: levels (DEBUG < INFO < WARNING < ERROR < CRITICAL), name and format.',
    '`logging.getLogger("tool")` and `log.info("text %s", value)`.',
    'Inside `except`, `log.exception(...)` also stores the traceback.'
  ]
});
