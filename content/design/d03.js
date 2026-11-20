TA.add({
  id: 'd03',
  title: 'Errors and logs',

  explain: [
    'Every tool fails sometimes: a locked file, a missing node, a slow network. What matters is **how** it fails.',
    { type: 'analogy', text: 'a good error is like the car warning “low pressure in the rear left tire”. A bad error is a red light with no text. Both warn you, but only one tells you what to do.' },
    '### A good error message says three things',
    '- **What** happened: “Could not export shot sh045”.\n- **Why**: “Camera cam_sh045 does not exist”.\n- **What to do**: “Check that the camera is in the scene or rename it”.',
    '### In batches: do not stop everything for one failure',
    'Catch the error **per item**, store it with its context and keep going (lesson p12). At the end, a **summary**: how many succeeded, how many failed and why.',
    '### Validate up front, not halfway',
    'Check whatever you can **before** the heavy work starts: that folders exist, that the config is valid, that there are no name clashes. Failing at second 1 is much better than at hour 2.',
    '### Logs for the TA, messages for the artist',
    '- The **artist** sees a short, clear message.\n- The **log** (lesson p17) keeps the technical details and the *traceback* so you can fix it later.',
    { type: 'cg', text: 'when a bug hits 200 scenes (lesson d07), a good log tells you within minutes which scenes failed, with which tool version and at which step.' },
    { type: 'tip', text: 'interview sentence: “I make my tools fail early and clearly: I validate up front, in batches I log each error with context and continue, and at the end I give a summary”.' }
  ],

  example: {
    intro: 'The same failure, told two ways.',
    lines: [
      { label: 'Bad', code: "Error: 'NoneType' object is not iterable", note: 'The artist does not know what happened or what to do. They will message you.' },
      { label: 'Good (for the artist)', code: 'Could not export sh045: camera cam_sh045 does not exist.\nCheck the camera name. The other 29 shots exported fine.', note: 'What, why, what to do, and the state of the rest.' },
      { label: 'Good (in the log)', code: 'ERROR [exporter v1.4] sh045: listRelatives returned None for cam_sh045\nTraceback (most recent call last): ...', note: 'The technical details, for the TA.' }
    ]
  },

  mini: [
    {
      q: 'When is the best time to check that the output folder exists?',
      options: ['At the end, when writing the last file', 'At the start, before the heavy work', 'Never: if it fails, we will see'],
      answer: 1,
      why: 'Failing early saves time and avoids half-finished jobs.'
    },
    {
      q: 'Which three things should a good error message say?',
      options: ['The error code, the time and the user', 'What happened, why, and what to do', 'Only the traceback'],
      answer: 1,
      why: 'That way the artist can act without having to call you.'
    }
  ],

  exercises: [
    {
      id: 'e1',
      kind: 'free',
      title: 'An exporter that does not break',
      prompt: 'Your exporter processes 50 shots overnight. Yesterday it stopped at shot 12 and nobody noticed until the morning.\n\nHow would you change the error handling?',
      checklist: [
        'I validate up front: config, folders, permissions, that the shots exist.',
        'Each shot gets its own `try/except`: one failure does not stop the others.',
        'I log every error with context (shot, step, message) and the traceback.',
        'At the end I produce a summary (succeeded / failed / why).',
        'I notify someone (email, team chat message) if there are errors.',
        'I consider being able to re-run only the shots that failed.'
      ],
      model: '1. **Validation up front**: check the config, that the folders exist and that I have permissions. If something fails here, report it and do not start.\n2. **One try/except per shot**: if sh012 fails, log the error with `log.exception` and move on to sh013.\n3. **Summary at the end**: “48 succeeded, 2 failed”, with the reason for each.\n4. **Notification**: if there are errors, post the summary to the team channel.\n5. **Retry**: save the list of failed shots so only those can be re-run in the morning.',
      followups: ['Which errors would you catch, and which would you let stop everything?', 'How would you make re-running only the failed shots easy?']
    }
  ],

  summary: [
    'A good error says what happened, why, and what to do.',
    'Validate up front; in batches, catch per item, log and continue; summarize at the end.',
    'Clear messages for the artist; technical details and traceback in the log.'
  ]
});
