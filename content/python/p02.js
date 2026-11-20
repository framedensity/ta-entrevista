TA.add({
  id: 'p02',
  title: 'Lists',

  explain: [
    'A cutscene does not have a single shot. It has many. Creating one variable for each (`shot1`, `shot2`…) would be a mess.',
    'To keep lots of data together, we use a **list**.',
    { type: 'analogy', text: 'a list is like a train. Each car carries one piece of data. The cars always stay in the same order.' },
    'You write a list with square brackets `[ ]`. Separate the items with commas.',
    '```python\nshots = ["sh010", "sh020", "sh030"]\n```',
    '### The index: the number of each car',
    'Every car has a number: the **index**. With the index you take an item out of the list.',
    'Careful! The first car is **0**, not 1. Python starts counting at zero.',
    { type: 'figure', html:
      '<svg viewBox="0 0 330 112" role="img" aria-label="A train of three cars with indexes 0, 1 and 2, and also -3, -2 and -1">' +
      '<g font-family="ui-monospace,Menlo,monospace" font-size="13">' +
      '<rect x="8" y="30" width="96" height="44" rx="8" style="fill:var(--accbg);stroke:var(--acc)"/><text x="56" y="57" text-anchor="middle" style="fill:var(--ink)">"sh010"</text>' +
      '<rect x="117" y="30" width="96" height="44" rx="8" style="fill:var(--accbg);stroke:var(--acc)"/><text x="165" y="57" text-anchor="middle" style="fill:var(--ink)">"sh020"</text>' +
      '<rect x="226" y="30" width="96" height="44" rx="8" style="fill:var(--accbg);stroke:var(--acc)"/><text x="274" y="57" text-anchor="middle" style="fill:var(--ink)">"sh030"</text>' +
      '<line x1="104" y1="52" x2="117" y2="52" style="stroke:var(--acc);stroke-width:3"/><line x1="213" y1="52" x2="226" y2="52" style="stroke:var(--acc);stroke-width:3"/>' +
      '<text x="56" y="20" text-anchor="middle" font-weight="700" style="fill:var(--acc)">[0]</text><text x="165" y="20" text-anchor="middle" font-weight="700" style="fill:var(--acc)">[1]</text><text x="274" y="20" text-anchor="middle" font-weight="700" style="fill:var(--acc)">[2]</text>' +
      '<text x="56" y="96" text-anchor="middle" style="fill:var(--mute)">[-3]</text><text x="165" y="96" text-anchor="middle" style="fill:var(--mute)">[-2]</text><text x="274" y="96" text-anchor="middle" style="fill:var(--mute)">[-1]</text>' +
      '</g></svg>' },
    'With a **negative** index you count from the end. `-1` is always the last car, even if you do not know how many there are.',
    '### Three handy tools',
    '- `len(list)`: counts how many items there are (length).\n- `list.append(item)`: hooks a new car onto the end.\n- `item in list`: asks whether the item is in the list. Gives `True` or `False`.',
    { type: 'cg', text: 'a TA tool receives the list of shots in a sequence and exports them one by one, in order. If a new shot arrives, it is added with `append()`.' }
  ],

  example: {
    intro: 'Let\'s handle the shot list of a sequence.',
    lines: [
      { code: 'shots = ["sh010", "sh020", "sh030"]', note: 'We create a list with three strings. They go inside `[ ]`, separated by commas.' },
      { code: 'first = shots[0]', note: 'Index `0` is the first car: `"sh010"`.' },
      { code: 'last = shots[-1]', note: 'Index `-1` is the last car: `"sh030"`.' },
      { code: 'shots.append("sh040")', note: 'We add a new shot at the end. Now there are four.' },
      { code: 'total = len(shots)', note: '`len()` counts the items: `4`.' },
      { code: 'print(first, last, total)', note: 'We show the three results.' },
      { code: 'print("sh020" in shots)', note: 'Is "sh020" in the list? Yes, so it shows `True`.' }
    ],
    output: 'sh010 sh030 4\nTrue',
    outro: 'Notice: `last` is `"sh030"` because we stored it **before** adding `"sh040"`. Python runs lines in order, top to bottom.'
  },

  mini: [
    {
      q: 'If `shots = ["sh010", "sh020", "sh030"]`, what is `shots[1]`?',
      options: ['`"sh010"`', '`"sh020"`', '`"sh030"`'],
      answer: 1,
      why: 'Python counts from 0. Index 0 is "sh010", and index 1 is "sh020".'
    },
    {
      q: 'What does `shots.append("sh040")` do?',
      options: ['Adds "sh040" at the start', 'Adds "sh040" at the end', 'Removes "sh040" from the list'],
      answer: 1,
      why: '`append()` always hooks the new item onto the end, like one more car.'
    }
  ],

  exercises: [
    {
      id: 'e1',
      title: 'The camera list',
      prompt: 'Create a list `cameras` with these three strings, in this order: `"cam_A"`, `"cam_B"`, `"cam_C"`.\n\nThen create `first` with the first camera and `last` with the last one. Use indexes.',
      starter: '# Write your code here\n',
      tests: [
        { check: "cameras == ['cam_A', 'cam_B', 'cam_C']", msg: '`cameras` has the three cameras in order' },
        { check: "first == 'cam_A'", msg: '`first` is "cam_A"' },
        { check: "last == 'cam_C'", msg: '`last` is "cam_C"' }
      ],
      hints: ['The list goes in square brackets: `["cam_A", "cam_B", "cam_C"]`.', 'The first is index `0`. The last can be `-1`.'],
      solution: 'cameras = ["cam_A", "cam_B", "cam_C"]\nfirst = cameras[0]\nlast = cameras[-1]\n'
    },
    {
      id: 'e2',
      title: 'A new camera arrives',
      prompt: 'Add `"cam_D"` to the end of the list with `append()`.\n\nThen create `total` with the number of cameras.',
      starter: 'cameras = ["cam_A", "cam_B", "cam_C"]\n\n',
      tests: [
        { check: "cameras[-1] == 'cam_D'", msg: '"cam_D" is at the end of the list' },
        { check: 'total == 4', msg: '`total` is 4' }
      ],
      hints: ['`cameras.append("cam_D")`', 'To count, use `len(cameras)`.'],
      solution: 'cameras = ["cam_A", "cam_B", "cam_C"]\n\ncameras.append("cam_D")\ntotal = len(cameras)\n'
    },
    {
      id: 'e3',
      title: 'Is this camera there?',
      prompt: 'Before exporting, a tool checks whether a camera exists.\n\nCreate `has_b` with the result of asking whether `"cam_B"` is in the list. Also create `has_z` for `"cam_Z"`.',
      starter: 'cameras = ["cam_A", "cam_B", "cam_C"]\n\n',
      tests: [
        { check: 'has_b is True', msg: '`has_b` is `True`' },
        { check: 'has_z is False', msg: '`has_z` is `False`' }
      ],
      hints: ['Use the word `in`: `"cam_B" in cameras`.', '`has_z = "cam_Z" in cameras`'],
      solution: 'cameras = ["cam_A", "cam_B", "cam_C"]\n\nhas_b = "cam_B" in cameras\nhas_z = "cam_Z" in cameras\n'
    }
  ],

  summary: [
    'A **list** keeps many items in order: `[a, b, c]`.',
    'The **index** starts at 0. `-1` is the last one.',
    '`len()` counts, `append()` adds to the end and `in` asks whether an item is there.'
  ]
});
