TA.add({
  id: 'd01',
  title: 'What makes a good tool?',

  explain: [
    'In the interview they will not only ask “can you code?”, but “can you make tools people actually **use**?”. Those are different things.',
    { type: 'analogy', text: 'a good tool is like a good kitchen knife: it does one thing very well, it does not cut you, and the cook forgets they are using it. A bad tool is a knife you have to learn to use and that sometimes breaks.' },
    '### The five qualities',
    '- **Solves the real problem**: the one the artist has, not the one you imagined. Ask first (lesson d02).\n- **Is safe**: never destroys work; warns before overwriting; can be undone.\n- **Fails well**: if something goes wrong, it says what, where and what to do (lesson d03).\n- **Is easy to use**: few steps, sensible defaults, no manual to read (lesson d04).\n- **Is maintainable**: tidy code, logic separate from the UI, configurable without touching code (lesson d05).',
    '### Measuring success',
    'A good tool **gets used**. If artists avoid it, something is wrong, even if the code is perfect. Ask, watch how they use it and improve it.',
    { type: 'cg', text: 'a tool that saves 5 minutes per shot, in a 200-shot cutscene, saves more than 16 hours. That is the kind of number worth mentioning in the interview.' },
    { type: 'tip', text: 'when you talk about your tools, use the structure **problem → solution → result** with a number: “checking every shot\'s frame range by hand took half a day per delivery; I automated it and now it takes a few minutes”.' }
  ],

  example: {
    intro: 'The same task, two tools.',
    lines: [
      { label: 'Tool A', code: '“Export” button.\nExports everything selected to C:/temp.\nIf the file exists, it overwrites it.\nIf something fails, a red Python error shows up.', note: 'Works on the author\'s machine. For everyone else, it is a risk.' },
      { label: 'Tool B', code: 'List of shots with their range and camera.\nDefault folder from the project.\nWarns before overwriting.\nWhen done: “28 exported, 2 with errors: sh045 has no camera”.', note: 'Does the same thing, but the artist knows what will happen and what happened.' }
    ],
    outro: 'The difference is not how hard the code is, but thinking about the person who will use it.'
  },

  mini: [
    {
      q: 'Your tool works perfectly, but animators keep doing the job by hand. What do you do?',
      options: ['Force them to use it', 'Watch how they work and ask what is missing so you can improve it', 'Nothing: the code is fine'],
      answer: 1,
      why: 'If it is not used, it does not solve the real problem. You need to understand why.'
    },
    {
      q: 'Which structure is best for describing a tool in the interview?',
      options: ['A list of its features', 'Problem → solution → result (with a number)', 'The language you wrote it in'],
      answer: 1,
      why: 'It shows you understand the impact, not just the technique.'
    }
  ],

  exercises: [
    {
      id: 'e1',
      kind: 'free',
      title: 'Your best tool',
      prompt: 'Describe a tool you have made in 4-6 sentences, as you would in the interview. If you have not built one yet, describe one you would build for a problem you have seen.',
      checklist: [
        'I start with the **problem**: what was happening and how much time it cost.',
        'I explain the **solution** in one or two sentences, without every detail.',
        'I give a **result with a number** (from X hours to Y minutes, across N projects).',
        'I mention **who** it helped (animators, the team, the studio) and that it is still in use.',
        'I leave a hook so they ask for more (an interesting technical detail).'
      ],
      model: '(Example) “Before every delivery, someone opened each cutscene shot by hand to check the camera name, the frame range and the output folder. With 150 shots, that took about a day, and mistakes still slipped through. I wrote a tool that reads every shot from the project data, runs those checks in a batch and produces a report of only the shots with problems. Now the check takes about ten minutes and runs before every delivery. The tricky part was handling shots that were intentionally different, so I added a per-shot exception list.”',
      followups: ['How did you tell noise apart from real fast motion?', 'How did you test it before giving it to the team?', 'What would you change if you built it today?']
    }
  ],

  summary: [
    'A good tool solves the real problem, is safe, fails well, is easy and maintainable.',
    'Success is measured in use: if nobody uses it, something is wrong.',
    'Describe it as problem → solution → result, with a number.'
  ]
});
