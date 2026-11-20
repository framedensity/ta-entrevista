TA.add({
  id: 'd07',
  title: 'Case: a bug that hits 200 scenes',

  explain: [
    'In production, sometimes a problem does not affect one scene but **200**: a rig change, a buggy tool, a convention that changed halfway. How you react here says a lot about you as a TA.',
    { type: 'analogy', text: 'it is like a water leak in a building. First you close the valve so it does not flood further. Then you see which floors are wet. Then you repair. And finally you find out why the pipe broke so it does not happen again.' },
    '### The four steps',
    '1. **Contain**: stop whatever is causing the problem (pull the tool version, tell the team not to publish). Keep it from growing.\n2. **Measure**: which scenes are affected? A script that walks all 200 and checks for the symptom (lessons p13, p14, p17). No guessing.\n3. **Fix**: if possible, an automatic batch fix, with a *dry run*, backups and verification. If not, prioritize with production (which shots ship first).\n4. **Prevent**: why did it happen? Add a check to the validator, a test, or a validation in the tool.',
    '### Communication',
    'As important as the code: tell the supervisors and affected departments early, say what you know and what you do not, and give an estimate. Be the **bridge** between artists and programmers.',
    { type: 'tip', text: 'a useful way to frame it: “in cinematics, one problem can hit 100 or 200 scenes; the TA\'s role is to be the bridge between artists and programmers and keep the impact small”. Have a real example ready (without confidential details).' },
    { type: 'cg', text: 'a rig change renamed a control. 200 animation scenes have keys on the old name. One script detects it, and another remaps the keys to the new name, with a dry run and a backup of each scene.' }
  ],

  example: {
    intro: 'Measure before fixing: a script that checks every scene.',
    lines: [
      { label: 'Walk', code: 'scenes = sorted(Path(project).rglob("*_anim_v*.ma"))', note: 'Every animation scene (lesson p14).' },
      { label: 'Check', code: 'affected = {}\nfor s in scenes:\n    try:\n        problem = check(s)  # opens it lightly and looks for the symptom\n        if problem:\n            affected[s.name] = problem\n    except Exception:\n        log.exception("Could not check %s", s)', note: 'Failing to open one scene does not stop the review.' },
      { label: 'Report', code: 'log.info("%d of %d scenes affected", len(affected), len(scenes))\nsave_json("report.json", affected)', note: 'Data, not guesses: that is how you decide with production.' }
    ]
  },

  mini: [
    {
      q: 'What do you do first when you find a problem that affects many scenes?',
      options: ['Fix every scene as fast as possible', 'Contain it: keep it from affecting more scenes and tell people', 'Wait and see if anyone complains'],
      answer: 1,
      why: 'If you do not stop the cause, the problem keeps growing while you fix it.'
    },
    {
      q: 'Before an automatic fix on 200 scenes, what is essential?',
      options: ['Doing it fast', 'A dry run, backups and verification afterwards', 'Doing it quietly so nobody is bothered'],
      answer: 1,
      why: 'A batch fix with a bug can make everything worse. You need to be able to roll back.'
    }
  ],

  exercises: [
    {
      id: 'e1',
      kind: 'free',
      title: 'Explain how you would handle it',
      prompt: '“An update to your export tool introduced a bug: cameras were exported one frame off. It has been used on about 200 scenes for a week. What do you do?”\n\nAnswer as in the interview.',
      checklist: [
        '**Contain**: pull the buggy version (roll back to the previous one) and tell the team.',
        '**Measure**: a script that finds which scenes/files were exported with that version (thanks to the version in the logs or metadata).',
        '**Fix**: re-export in a batch only the affected ones, with a dry run and verification.',
        '**Prioritize** with production: shots that ship first go first.',
        '**Communicate**: tell people early, with what is known, what is not, and when it will be done.',
        '**Prevent**: a test or check that would have caught the offset.'
      ],
      model: '“First I would **contain** it: roll back to the previous tool version and tell the team not to export any more with the broken one.\n\nThen I would **measure** the scope: since the tool stores its version in the logs and in each file\'s metadata, a script can list exactly which exports used the buggy version, instead of guessing.\n\nTo **fix** it, I would re-export in a batch only those scenes, with a dry run first, and then check that the frame range matches the scene. With production I would decide the order: what ships first goes first.\n\nI would keep **communicating**: what happened, how many scenes, what is fixed and how much is left.\n\nAnd to **prevent** it, I would add an automatic check comparing the exported range with the scene range, so an offset like this cannot slip through unnoticed again.”',
      followups: ['How would you know which scenes were exported with the bad version?', 'What would you do if there were no version records?', 'How would you stop an update from reaching everyone before it is tested?']
    }
  ],

  summary: [
    'Contain → measure → fix (dry run, backup, verification) → prevent.',
    'Communicate early: what is known, what is not, and when; be the bridge between artists and programmers.',
    'Recording the tool version lets you measure the scope with data.'
  ]
});
