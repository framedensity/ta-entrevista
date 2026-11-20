TA.add({
  id: 'd06',
  title: 'Case: exporting 100 cutscene shots',

  explain: [
    'This is the kind of design question you may get: “How would you automate exporting the 100 shots of a cutscene?”. Here you put together everything from the previous lessons.',
    { type: 'analogy', text: 'it is like planning a move with 100 boxes: first you list what goes in each box, check everything fits in the truck, number the boxes and, when you arrive, check that none is missing.' },
    '### A structure for your answer',
    '1. **Clarify** (d02): format, engine, what is exported per shot (camera, characters, range), who runs it, how much time there is.\n2. **Input data**: where the shots and their ranges come from (camera attributes, an edit file, the production database).\n3. **Plan**: a list of jobs `shot → what to export → where`. Without touching anything yet (like the *dry run* in p19).\n4. **Validate**: missing cameras, overlapping ranges, clashing names, folders.\n5. **Run**: in batches, one error does not stop the rest, visible progress, headless if overnight.\n6. **Verify and summarize**: check every file exists and is not empty; final report.\n7. **Maintain**: per-project config, version in the logs.',
    { type: 'tip', text: 'say it out loud in this order. Even if you do not finish explaining everything, a clear structure already shows a lot. Start with: “First I would clarify…”.' },
    { type: 'cg', text: 'with 100 shots, if each takes 1 minute, the batch takes almost 2 hours. It is a good idea to be able to run it headless, overnight or on the farm, and to re-run only the shots that failed.' }
  ],

  example: {
    intro: 'Skeleton of the logic (no UI).',
    lines: [
      { label: '1. Plan', code: 'def plan(shots, cfg):\n    return [Job(s.name, s.camera, s.start, s.end,\n                path=cfg.path_for(s)) for s in shots]', note: 'Only works out what needs doing.' },
      { label: '2. Validate', code: 'def validate(jobs):\n    errors = []\n    errors += missing_cameras(jobs)\n    errors += overlapping_ranges(jobs)\n    errors += duplicate_paths(jobs)\n    return errors', note: 'Separate rules; easy to add more.' },
      { label: '3. Run', code: 'def run(jobs, progress=None):\n    done, failed = [], {}\n    for i, j in enumerate(jobs, 1):\n        try:\n            export(j)\n            done.append(j.name)\n        except Exception as e:\n            log.exception("Failed %s", j.name)\n            failed[j.name] = str(e)\n        if progress:\n            progress(i, len(jobs))\n    return done, failed', note: 'One failure does not stop the rest. `progress` is optional: the window uses it; the nightly batch does not.' },
      { label: '4. Verify', code: 'def verify(jobs):\n    return [j.name for j in jobs\n            if not os.path.exists(j.path) or os.path.getsize(j.path) == 0]', note: 'Checks that something was really exported.' }
    ]
  },

  mini: [
    {
      q: 'Why separate “plan” from “run”?',
      options: ['Style', 'So you can review and validate the plan before exporting anything (and do a dry run)', 'To make it slower'],
      answer: 1,
      why: 'You catch problems before spending two hours exporting.'
    },
    {
      q: 'The batch takes 2 hours. What is most useful?',
      options: ['Being able to run it headless (overnight or on the farm) and re-run only the failures', 'Making the window prettier', 'Exporting everything twice just in case'],
      answer: 0,
      why: 'It does not block the artist and errors get fixed without redoing everything.'
    }
  ],

  exercises: [
    {
      id: 'e1',
      kind: 'free',
      title: 'Answer the interview question',
      prompt: '“We have a 100-shot cutscene. Each shot needs its camera and the character animation exported to the engine. How would you automate it?”\n\nWrite your answer as if you were speaking (about 2-3 minutes).',
      checklist: [
        'I start by clarifying requirements (format, engine, who runs it, what gets exported).',
        'I explain where the shots and their ranges come from (metadata, edit file).',
        'I separate plan → validation → run → verification.',
        'I mention concrete validations: missing cameras, overlapping ranges, clashing names.',
        'One error does not stop the batch; log with context; summary at the end; re-run only the failures.',
        'It can run headless (overnight or farm) and shows progress in the UI.',
        'Per-project config and tool version in the logs.'
      ],
      model: '“First I would clarify which format the engine expects, whether camera and characters are exported separately, and whether the artist runs it or a nightly process does.\n\nI would read the shots and their ranges from the camera metadata (a `shotName` attribute) or from the edit file, never by hand.\n\nI would split it into four steps. First, a **plan**: for each shot, what to export and to which path, following the project convention. Second, **validate** the plan: missing cameras, overlapping ranges, duplicate names and folders. If there are errors, I report them before starting. Third, **run** shot by shot: if one fails, I log it with the reason and carry on with the rest. Fourth, **verify** that every file exists and is not empty, and produce a summary.\n\nThe logic would be separate from the UI, so it can run overnight or on the farm and re-run only the failed shots. Project values would live in a JSON, and I would record the tool version in the logs.”',
      followups: ['How would you make it faster? (parallel, farm)', 'What do you do if two shots share the same camera?', 'How would the engine know which version of each shot is the latest?', 'How would you test it before using it in production?']
    }
  ],

  summary: [
    'Clarify → plan → validate → run (without stopping on a failure) → verify → summarize.',
    'Shot data from metadata, never typed by hand.',
    'Logic without UI: nightly batch, farm, and re-running only the failures.'
  ]
});
