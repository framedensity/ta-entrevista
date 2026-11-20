TA.add({
  id: 'p20',
  title: 'TA: tool configuration',

  explain: [
    'A studio tool is used across many projects. Each project, and even each shot, wants something different: other fps, another format, another scale. The answer is a **layered config**.',
    { type: 'analogy', text: 'it is like dressing in layers: the T-shirt (the defaults) is always there; on top, the project sweater; and if a particular shot is cold, that shot\'s coat. What is on the outside is what shows.' },
    '### Layers: defaults → project → shot',
    'Each layer **only** writes what changes. The final result is computed by merging them, from the most general to the most specific.',
    '### The nested-dictionary problem',
    '`{**a, **b}` only merges the **top level**. If `b` has `{"export": {"scale": 2}}`, it wipes out all of `a`\'s `export`, not just the scale.',
    { type: 'compare',
      badTitle: 'Shallow merge: "format" is lost',
      bad: 'a = {"export": {"format": "fbx", "scale": 1}}\nb = {"export": {"scale": 2}}\n{**a, **b}\n# {"export": {"scale": 2}}',
      goodTitle: 'Deep (recursive) merge',
      good: 'def merge(a, b):\n    r = dict(a)\n    for k, v in b.items():\n        if isinstance(v, dict) and isinstance(r.get(k), dict):\n            r[k] = merge(r[k], v)\n        else:\n            r[k] = v\n    return r' },
    'The function calls itself for the inner dictionaries: that is **recursion**.',
    '### Validate before using',
    'A badly written config (fps as text, a format that does not exist) should be caught **on load**, with a clear message, not halfway through a 3-hour export.',
    { type: 'cg', text: 'the project exports at 30 fps as `.fbx`, but shot sh045 (slow motion) needs 120 fps. Only that shot wears the `{"fps": 120}` coat.' },
    { type: 'tip', text: 'deep-merging dictionaries is a common coding question. Explain the case that breaks the shallow version.' }
  ],

  example: {
    intro: 'Three config layers.',
    lines: [
      { code: 'DEFAULTS = {"fps": 24, "export": {"format": "fbx", "scale": 1.0}}', note: 'The T-shirt: what the tool ships with.' },
      { code: 'project = {"fps": 30}', note: 'The sweater: the project only changes the fps.' },
      { code: 'shot = {"export": {"scale": 0.01}}', note: 'The coat: this shot only changes the scale.' },
      { code: 'final = merge(merge(DEFAULTS, project), shot)', note: 'From general to specific.' },
      { code: 'print(final)', note: 'The format survives even though the shot touched `export`.' }
    ],
    output: "{'fps': 30, 'export': {'format': 'fbx', 'scale': 0.01}}"
  },

  mini: [
    {
      q: 'What does `{**{"e": {"a": 1, "b": 2}}, **{"e": {"b": 9}}}` give?',
      options: ['`{"e": {"a": 1, "b": 9}}`', '`{"e": {"b": 9}}`', 'An error'],
      answer: 1,
      why: 'Merging with `**` is shallow: the `"e"` on the right replaces the left one entirely.'
    },
    {
      q: 'In which order are the layers merged?',
      options: ['From the most specific to the most general', 'From the most general to the most specific', 'It does not matter'],
      answer: 1,
      why: 'The last one applied wins. That is why the most specific layer (the shot) goes last.'
    }
  ],

  exercises: [
    {
      id: 'e1',
      title: 'Deep merge',
      prompt: 'Write `merge(a, b)`: return a **new** dict with `a` and `b` merged. If both have a dict under the same key, merge those too (recursively). Otherwise `b` wins. Do **not** modify `a` or `b`.',
      starter: 'def merge(a, b):\n    # your code\n    pass\n',
      tests: [
        { check: "merge({'e': {'a': 1, 'b': 2}, 'x': 1}, {'e': {'b': 9}}) == {'e': {'a': 1, 'b': 9}, 'x': 1}", msg: 'merges the inner dict' },
        { check: "merge({'a': {'b': {'c': 1, 'd': 2}}}, {'a': {'b': {'d': 3}}}) == {'a': {'b': {'c': 1, 'd': 3}}}", msg: 'works across several levels' },
        { check: "(lambda a: (merge(a, {'e': {'z': 0}}), a)[1])({'e': {'y': 1}}) == {'e': {'y': 1}}", msg: 'does not modify the original dict' }
      ],
      hints: ['Start with `r = dict(a)` (a copy).', 'If `v` is a dict and `r.get(k)` is too, `r[k] = merge(r[k], v)`; otherwise `r[k] = v`.'],
      solution: 'def merge(a, b):\n    r = dict(a)\n    for k, v in b.items():\n        if isinstance(v, dict) and isinstance(r.get(k), dict):\n            r[k] = merge(r[k], v)\n        else:\n            r[k] = v\n    return r\n'
    },
    {
      id: 'e2',
      title: 'Validating the config',
      prompt: 'Write `validate(cfg)` that returns a **list** of error strings (empty if all is fine):\n\n- `"fps"` must be an `int` greater than 0 → otherwise: `"fps must be a positive integer"`\n- `cfg["export"]["format"]` must be in `{"fbx", "abc"}` → otherwise: `"invalid format: <value>"`\n\nUse `.get()` so it does not crash if a key is missing.',
      starter: 'def validate(cfg):\n    # your code\n    pass\n',
      tests: [
        { check: "validate({'fps': 30, 'export': {'format': 'fbx'}}) == []", msg: 'a correct config gives no errors' },
        { check: "validate({'fps': '30', 'export': {'format': 'fbx'}}) == ['fps must be a positive integer']", msg: 'fps as text is an error' },
        { check: "validate({'fps': 24, 'export': {'format': 'obj'}}) == ['invalid format: obj']", msg: 'an unknown format is an error' },
        { check: "len(validate({})) == 2", msg: 'an empty dict gives both errors (and raises nothing)' }
      ],
      hints: ['`fps = cfg.get("fps")` and `if not isinstance(fps, int) or fps <= 0:`', '`fmt = cfg.get("export", {}).get("format")`'],
      solution: 'def validate(cfg):\n    errors = []\n    fps = cfg.get("fps")\n    if not isinstance(fps, int) or isinstance(fps, bool) or fps <= 0:\n        errors.append("fps must be a positive integer")\n    fmt = cfg.get("export", {}).get("format")\n    if fmt not in {"fbx", "abc"}:\n        errors.append(f"invalid format: {fmt}")\n    return errors\n'
    },
    {
      id: 'e3',
      title: 'A shot\'s final config',
      prompt: 'Use your `merge` (paste it at the top) to write `config_for(shot)`: merge `DEFAULTS`, then `PROJECT`, then `PER_SHOT.get(shot, {})`.',
      starter: 'DEFAULTS = {"fps": 24, "export": {"format": "fbx", "scale": 1.0}}\nPROJECT = {"fps": 30}\nPER_SHOT = {"sh045": {"fps": 120}, "sh050": {"export": {"scale": 0.01}}}\n\n# paste your merge function here\n\ndef config_for(shot):\n    # your code\n    pass\n',
      tests: [
        { check: "config_for('sh010') == {'fps': 30, 'export': {'format': 'fbx', 'scale': 1.0}}", msg: 'a normal shot uses the project values' },
        { check: "config_for('sh045')['fps'] == 120", msg: 'sh045 runs at 120 fps' },
        { check: "config_for('sh050')['export'] == {'format': 'fbx', 'scale': 0.01}", msg: 'sh050 changes the scale and keeps the format' },
        { check: "DEFAULTS == {'fps': 24, 'export': {'format': 'fbx', 'scale': 1.0}}", msg: 'DEFAULTS was not modified' }
      ],
      hints: ['`return merge(merge(DEFAULTS, PROJECT), PER_SHOT.get(shot, {}))`'],
      solution: 'DEFAULTS = {"fps": 24, "export": {"format": "fbx", "scale": 1.0}}\nPROJECT = {"fps": 30}\nPER_SHOT = {"sh045": {"fps": 120}, "sh050": {"export": {"scale": 0.01}}}\n\ndef merge(a, b):\n    r = dict(a)\n    for k, v in b.items():\n        if isinstance(v, dict) and isinstance(r.get(k), dict):\n            r[k] = merge(r[k], v)\n        else:\n            r[k] = v\n    return r\n\ndef config_for(shot):\n    return merge(merge(DEFAULTS, PROJECT), PER_SHOT.get(shot, {}))\n'
    }
  ],

  summary: [
    'Layered config: defaults → project → shot; the most specific wins.',
    '`{**a, **b}` is shallow; for nested dicts, merge recursively.',
    'Validate on load and return clear errors, without odd exceptions.'
  ]
});
