TA.add({
  id: 'd05',
  title: 'Extensibility',

  explain: [
    'A studio tool lives for years. Projects change, Maya versions change, the game engine changes, and so does the person maintaining it. Designing it so it is **easy to change** is part of the job.',
    { type: 'analogy', text: 'an extensible tool is like a power strip: when a new device arrives, you plug it in. A rigid tool is like having the cable soldered in: for every new device you have to open the wall.' },
    '### Techniques',
    '- **Config outside the code** (per-project JSON, lessons p15 and p20): changing fps or format needs no programming.\n- **Rules as data** (lesson p18): adding a check is adding a line to a list.\n- **Logic separate from the UI** (lesson m10): the same logic works in the window, in a batch and on the farm.\n- **Small single-purpose functions**: easy to test and reuse.\n- **A «plugin» registry**: a list of checks or exporters you can add to without touching the core.',
    '```python\nCHECKS = []\n\ndef check(func):\n    CHECKS.append(func)\n    return func\n\n@check\ndef valid_range(scene): ...\n\n@check\ndef cameras_named(scene): ...\n\n# the core just loops over the list\nfor c in CHECKS:\n    problems += c(scene)\n```',
    '### Versions and Maya changes',
    'Avoid depending on fragile details: internal IDs that change between versions, hard-coded paths, «magic» names. Store the tool **version** in the logs and in the files it creates.',
    { type: 'cg', text: 'your MotionBuilder case: component IDs changed with every version and the tools broke. You switched to looking things up by **type name**, and the tools kept working across several versions. That is extensible design.' },
    { type: 'tip', text: 'tell that story in the interview: it is a real, concrete example of thinking about long-term maintenance.' }
  ],

  example: {
    intro: 'Adding a new export format.',
    lines: [
      { label: 'Rigid', code: 'def export(shot, fmt):\n    if fmt == "fbx":\n        ...\n    elif fmt == "abc":\n        ...\n    # new format = edit this function', note: 'Every new format means changing (and re-testing) the central function.' },
      { label: 'Extensible', code: 'EXPORTERS = {"fbx": export_fbx, "abc": export_abc}\n\ndef export(shot, fmt):\n    try:\n        func = EXPORTERS[fmt]\n    except KeyError:\n        raise ValueError(f"Unknown format: {fmt}")\n    return func(shot)\n\nEXPORTERS["usd"] = export_usd  # new format: one line', note: 'A dict of functions. The core does not change.' }
    ]
  },

  mini: [
    {
      q: 'What makes adding a new check to a validator easier?',
      options: ['One long `if` with every rule', 'A list (or registry) of check functions that the core loops over', 'Copying the whole validator'],
      answer: 1,
      why: 'Adding is just one more function in the list, without touching the main loop.'
    },
    {
      q: 'Why store the tool version in the logs?',
      options: ['For looks', 'To know which version produced a file or an error', 'Python requires it'],
      answer: 1,
      why: 'When something fails weeks later, knowing the version speeds up the investigation a lot.'
    }
  ],

  exercises: [
    {
      id: 'e1',
      kind: 'free',
      title: 'Ready for the future',
      prompt: 'Your camera exporter works for the current project (FBX, 30 fps). Next year there will be another project with another engine (USD, 60 fps) and a different naming convention.\n\nHow would you design it now so that change is easy?',
      checklist: [
        'Per-project config in a file (fps, format, convention) with defaults.',
        'Exporters per format in a registry/dict: add USD without touching the core.',
        'The naming convention as data or as a swappable function.',
        'Logic separate from the UI, and small functions.',
        'Tool version in the logs and in the generated files.',
        'Simple tests of the logic so changes are safe.'
      ],
      model: '- Everything that changes between projects (fps, format, convention, paths) goes in a **project JSON**, merged with defaults.\n- Each format is a function registered in an `EXPORTERS` dict. USD is a new entry, not a change to the core.\n- The naming convention is a per-project function that takes the shot and returns the name.\n- The window only calls the logic, so the same logic works in batches.\n- I store the tool version in the log and in the metadata of every exported file.\n- A few automated tests of the logic (names, ranges) so I do not break what already works.',
      followups: ['Which part would be hardest to change, and how would you isolate it?', 'How would you test the exporter without opening Maya?']
    }
  ],

  summary: [
    'Config and rules as data; logic separate from the UI.',
    'Registries (dicts or lists of functions) to add things without touching the core.',
    'Avoid fragile details between versions and record the tool version.'
  ]
});
