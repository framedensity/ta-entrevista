TA.add({
  id: 'd04',
  title: 'Thinking like an artist',

  explain: [
    'Many TAs started as artists. That experience is a big advantage: you know **where it hurts** for the artist. This lesson is about designing from that point of view.',
    { type: 'analogy', text: 'a good waiter does not ask you twenty questions to serve you a coffee. They know what people usually order, suggest it, and only ask what really matters.' },
    '### Principles',
    '- **Sensible defaults**: the most common case should work in one click.\n- **Few steps**: if the artist has to make 6 clicks every time, they will stop using it.\n- **Do not interrupt creativity**: the tool works in the background; it does not force a new way of working.\n- **Safety**: never lose work. Warn before overwriting, and allow undo.\n- **Feedback**: the artist always knows what is happening (progress) and what happened (summary).\n- **Speak their language**: “shot”, “camera”, “range”, not “MDagPath” or “KeyError”.',
    '### Automate the mechanical, not the creative',
    'The best tools remove the **mechanical** work (checking specs, setting up exports, cleaning noise) so the artist spends their time on the **creative** part (camera, acting, timing).',
    { type: 'cg', text: 'instead of a window with 15 options, the exporter reads the project config and only shows the shot list and one button. Advanced options sit in a collapsed section.' },
    { type: 'tip', text: 'if you have production experience as an artist, say so: “Because I have done this work myself, I know where the time goes. I automate the mechanical part so the team can focus on the creative part”.' }
  ],

  example: {
    intro: 'Two UIs for the same tool.',
    lines: [
      { label: 'Designed by a programmer', code: 'Fields: absolute path, format, scale, up axis, fps,\nstart frame, end frame, camera name, file name…\nButton: Run', note: 'Everything is configurable, but the artist has to fill it in every time and can make mistakes.' },
      { label: 'Designed by an artist', code: 'Shot list (range and camera already detected).\nButton: Export selected.\n▸ Advanced options (collapsed)', note: 'Values come from the project. The artist only picks the shots.' }
    ]
  },

  mini: [
    {
      q: 'What should you automate with a tool?',
      options: ['Creative decisions, to go faster', 'Mechanical, repetitive work, to free up creative time', 'Everything possible, no exceptions'],
      answer: 1,
      why: 'Creative decisions belong to the artist. The tool takes the mechanical part off their hands.'
    },
    {
      q: 'Where would you put an option that only 5% of artists use?',
      options: ['Front and center, in big letters', 'In a collapsed advanced-options section', 'I would never add it'],
      answer: 1,
      why: 'It is available for whoever needs it, without getting in everyone else\'s way.'
    }
  ],

  exercises: [
    {
      id: 'e1',
      kind: 'free',
      title: 'Improve the experience',
      prompt: 'An artist complains: “the export tool is slow to use: every time I have to type the path, the frame range and pick the camera, and sometimes I get it wrong”.\n\nWhat would you change?',
      checklist: [
        'Detect each shot\'s range and camera automatically (by name or metadata).',
        'Default path from the project and naming convention; remember the last one used.',
        'Show what was detected so the artist confirms it instead of typing it.',
        'Validate before exporting and warn clearly (for example, camera not found).',
        'Allow several shots at once (batch).',
        'Watch or ask other artists to confirm it is the real problem.'
      ],
      model: 'I would remove everything the artist types by hand:\n- The **range** is read from the scene or the shot attribute.\n- The **camera** is found by its `shotName` attribute or the naming convention.\n- The **path** comes from the project config, and the tool remembers the last one.\n\nThe window would show the shot list with everything already detected; the artist only ticks which to export. Before exporting, the tool validates and warns if anything is missing. And I would check it with two or three artists before calling it done.',
      followups: ['What happens if the automatic detection is wrong?', 'How would you know the new version is actually faster to use?']
    }
  ],

  summary: [
    'Defaults, few steps, feedback, and never lose work.',
    'Automate the mechanical to free up creative time.',
    'Experience as an artist is an edge: use it and mention it.'
  ]
});
