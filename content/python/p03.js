TA.add({
  id: 'p03',
  title: 'Dictionaries',

  explain: [
    'In a list, you find data by its number. But sometimes it is easier to find it by its **name**.',
    'For example, for a shot you want its start and end. Remembering “the start is item 1” is hard. Remembering `"start"` is easy.',
    { type: 'analogy', text: 'a **dictionary** is like the contacts on your phone. You look up a person\'s name and get their number.' },
    'Each entry has two parts:',
    '- The **key**: the name you look up. For example, `"start"`.\n- The **value**: the stored data. For example, `1001`.',
    { type: 'figure', html:
      '<svg viewBox="0 0 330 132" role="img" aria-label="Dictionary: three keys, name, start and end, point to their values">' +
      '<g font-family="ui-monospace,Menlo,monospace" font-size="13">' +
      '<rect x="10" y="8" width="110" height="30" rx="8" style="fill:var(--acc)"/><text x="65" y="28" text-anchor="middle" style="fill:var(--card)">"name"</text>' +
      '<rect x="200" y="8" width="120" height="30" rx="8" style="fill:var(--accbg);stroke:var(--acc)"/><text x="260" y="28" text-anchor="middle" style="fill:var(--ink)">"sh010"</text>' +
      '<rect x="10" y="50" width="110" height="30" rx="8" style="fill:var(--acc)"/><text x="65" y="70" text-anchor="middle" style="fill:var(--card)">"start"</text>' +
      '<rect x="200" y="50" width="120" height="30" rx="8" style="fill:var(--accbg);stroke:var(--acc)"/><text x="260" y="70" text-anchor="middle" style="fill:var(--ink)">1001</text>' +
      '<rect x="10" y="92" width="110" height="30" rx="8" style="fill:var(--acc)"/><text x="65" y="112" text-anchor="middle" style="fill:var(--card)">"end"</text>' +
      '<rect x="200" y="92" width="120" height="30" rx="8" style="fill:var(--accbg);stroke:var(--acc)"/><text x="260" y="112" text-anchor="middle" style="fill:var(--ink)">1048</text>' +
      '<g style="stroke:var(--acc);stroke-width:2"><line x1="122" y1="23" x2="196" y2="23"/><line x1="122" y1="65" x2="196" y2="65"/><line x1="122" y1="107" x2="196" y2="107"/></g>' +
      '<text x="160" y="18" text-anchor="middle" font-size="11" style="fill:var(--mute)">key → value</text>' +
      '</g></svg>' },
    'You write a dictionary with curly braces `{ }`. Each pair looks like `key: value`. Pairs are separated by commas.',
    '```python\nshot = {"name": "sh010", "start": 1001, "end": 1048}\n```',
    '### Read, add, and look up safely',
    'To **read** a value, put the key in square brackets: `shot["start"]`. If the key does not exist, Python raises an error (`KeyError`).',
    'To **add or change** a value, assign it: `shot["camera"] = "cam_A"`. If the key did not exist, it is created.',
    'To read **safely**, use `.get()`. If the key does not exist, there is no error: you get the default value you choose.',
    { type: 'cg', text: 'in Maya, every node has attributes: `translateX`, `rotateY`… A dictionary is perfect for storing them: attribute name → value. Also for a tool\'s config.' }
  ],

  example: {
    intro: 'Let\'s store a shot\'s data and work out its duration.',
    lines: [
      { code: 'shot = {"name": "sh010", "start": 1001, "end": 1048}', note: 'A dictionary with three key: value pairs.' },
      { code: 'duration = shot["end"] - shot["start"] + 1', note: 'We read two values by key. We add 1 because both the start and end frames count: 1048 - 1001 + 1 = 48.' },
      { code: 'shot["camera"] = "cam_A"', note: 'The key `"camera"` did not exist, so it is added.' },
      { code: 'fps = shot.get("fps", 24)', note: 'The key `"fps"` does not exist. With `.get()` there is no error: we get the default value, `24`.' },
      { code: 'print(duration, shot["camera"], fps)', note: 'We show the results.' },
      { code: 'print(list(shot.keys()))', note: '`.keys()` gives every key. With `list()` we see them as a list.' }
    ],
    output: "48 cam_A 24\n['name', 'start', 'end', 'camera']",
    outro: 'If we had written `shot["fps"]` without `.get()`, the program would have stopped with a `KeyError`.'
  },

  mini: [
    {
      q: 'If `shot = {"start": 1001, "end": 1048}`, what is `shot["start"]`?',
      options: ['`"start"`', '`1001`', '`1048`'],
      answer: 1,
      why: 'With the key `"start"` you get its value: `1001`.'
    },
    {
      q: 'The key `"fps"` does not exist. What does `shot.get("fps", 24)` return?',
      options: ['A `KeyError`', '`24`', '`None`'],
      answer: 1,
      why: '`.get()` does not raise. If the key does not exist, it returns the default you pass: `24`.'
    }
  ],

  exercises: [
    {
      id: 'e1',
      title: 'A shot\'s data',
      prompt: 'Create a dictionary `shot` with three pairs:\n\n- `"name"`: `"sh020"`\n- `"start"`: `1001`\n- `"end"`: `1096`',
      starter: '# Write your code here\n',
      tests: [
        { check: "shot.get('name') == 'sh020'", msg: 'the key "name" is "sh020"' },
        { check: "shot.get('start') == 1001", msg: 'the key "start" is 1001' },
        { check: "shot.get('end') == 1096", msg: 'the key "end" is 1096' }
      ],
      hints: ['Use curly braces `{ }` and write each pair as `"key": value`.', '`shot = {"name": "sh020", "start": 1001, "end": 1096}`'],
      solution: 'shot = {"name": "sh020", "start": 1001, "end": 1096}\n'
    },
    {
      id: 'e2',
      title: 'How long is it?',
      prompt: 'Create `duration` with the number of frames in the shot. Count both the start frame and the end frame.',
      starter: 'shot = {"name": "sh020", "start": 1001, "end": 1096}\n\n',
      tests: [
        { check: 'duration == 96', msg: '`duration` is 96' }
      ],
      hints: ['Read the values with `shot["end"]` and `shot["start"]`.', 'Do not forget the `+ 1`.'],
      solution: 'shot = {"name": "sh020", "start": 1001, "end": 1096}\n\nduration = shot["end"] - shot["start"] + 1\n'
    },
    {
      id: 'e3',
      title: 'Add and look up safely',
      prompt: 'Add the key `"camera"` with the value `"cam_B"` to `shot`.\n\nThen create `fps` with the value of the key `"fps"`. That key does not exist, so use `.get()` with `24` as the default.',
      starter: 'shot = {"name": "sh020", "start": 1001, "end": 1096}\n\n',
      tests: [
        { check: "shot.get('camera') == 'cam_B'", msg: 'the key "camera" is "cam_B"' },
        { check: 'fps == 24', msg: '`fps` is 24' },
        { check: "'fps' not in shot", msg: 'you did not create the "fps" key by hand' }
      ],
      hints: ['To add: `shot["camera"] = "cam_B"`.', 'To read safely: `shot.get("fps", 24)`.'],
      solution: 'shot = {"name": "sh020", "start": 1001, "end": 1096}\n\nshot["camera"] = "cam_B"\nfps = shot.get("fps", 24)\n'
    }
  ],

  summary: [
    'A **dictionary** stores **key: value** pairs inside `{ }`.',
    'Read with `d["key"]` and add with `d["key"] = value`.',
    '`.get(key, default)` reads without an error if the key does not exist.'
  ]
});
