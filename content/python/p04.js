TA.add({
  id: 'p04',
  title: 'Looping over dictionaries',

  explain: [
    'You already know how to create a dictionary and read a key. Now let\'s **loop over all of it**: visit every pair, one by one.',
    { type: 'analogy', text: 'looping over a dictionary is like reading your phone contacts top to bottom: on each line you see the name **and** the number at the same time.' },
    '### Three ways to loop',
    '- `for key in d:` → keys only.\n- `for value in d.values():` → values only.\n- `for key, value in d.items():` → both at once. **This is the one you will use most.**',
    '```python\nfor shot, frames in shots.items():\n    print(shot, frames)\n```',
    { type: 'compare',
      badTitle: 'Works, but looks things up twice',
      bad: 'for shot in shots:\n    frames = shots[shot]\n    print(shot, frames)',
      goodTitle: 'Clearer with items()',
      good: 'for shot, frames in shots.items():\n    print(shot, frames)' },
    '### Dict comprehension',
    'A **comprehension** builds a new dictionary in a single line. Use it to **filter** or **transform**.',
    '```python\nlong_shots = {s: f for s, f in shots.items() if f > 60}\n```',
    'Read it as: «for each shot `s` with frames `f`, keep `s: f`, only if `f > 60`».',
    '### Sorting and finding the max',
    'A dictionary does not sort itself. But you can get its keys sorted by value with `key=`.',
    '- `sorted(shots, key=shots.get)` → keys sorted from lowest to highest value.\n- `max(shots, key=shots.get)` → the key with the biggest value.\n- `sum(shots.values())` → the sum of all values.',
    { type: 'cg', text: 'a cinematics tool receives a `{shot: frames}` dictionary and has to say how long the sequence is, which shots are long and which is the longest.' },
    { type: 'tip', text: 'if they ask for «the key with the highest value», the short answer is `max(d, key=d.get)`. Knowing it shows you know Python, not just loops.' }
  ],

  example: {
    intro: 'We have the duration of each shot in a sequence.',
    lines: [
      { code: 'shots = {"sh010": 48, "sh020": 96, "sh030": 72}', note: 'Key = shot name. Value = frames.' },
      { code: 'for shot, frames in shots.items():\n    print(f"{shot}: {frames} frames")', note: '`.items()` gives pairs. On each pass, `shot` and `frames` receive one pair.' },
      { code: 'total = sum(shots.values())', note: 'We add up only the values: 48 + 96 + 72 = 216.' },
      { code: 'long_shots = {s: f for s, f in shots.items() if f > 60}', note: 'Comprehension: a new dictionary with only the shots over 60 frames.' },
      { code: 'longest = max(shots, key=shots.get)', note: '`key=shots.get` tells `max` to compare the **values**, not the names.' },
      { code: 'print(total, long_shots, longest)', note: 'We show the results.' }
    ],
    output: "sh010: 48 frames\nsh020: 96 frames\nsh030: 72 frames\n216 {'sh020': 96, 'sh030': 72} sh020",
    outro: 'Without `key=`, `max(shots)` would compare the key **strings** and return `"sh030"` (last alphabetically). A very common mistake.'
  },

  mini: [
    {
      q: 'What does `for k, v in d.items():` give on each pass?',
      options: ['Only the key', 'Only the value', 'The key and the value together'],
      answer: 2,
      why: '`.items()` gives (key, value) pairs. We «unpack» them into `k` and `v`.'
    },
    {
      q: 'With `d = {"a": 5, "b": 9, "c": 1}`, what does `max(d, key=d.get)` return?',
      options: ['`9`', '`"b"`', '`"c"`'],
      answer: 1,
      why: 'It returns the **key** whose value is the largest. The largest value is 9, and its key is `"b"`.'
    }
  ],
  extra: [
    {
      q: 'What does `max({"sh010": 90, "sh030": 10})` (without `key`) return?',
      options: ['`"sh010"`', '`"sh030"`', '`90`'],
      answer: 1,
      why: 'Without `key`, it compares the keys as text. `"sh030"` > `"sh010"` alphabetically.'
    }
  ],

  exercises: [
    {
      id: 'e1',
      title: 'Total duration',
      prompt: 'Create `total` with the sum of the frames of every shot. Use `.values()`.',
      starter: 'shots = {"sh010": 48, "sh020": 96, "sh030": 72, "sh040": 24}\n\n',
      tests: [{ check: 'total == 240', msg: '`total` is 240' }],
      hints: ['`sum()` adds up whatever you give it.', '`total = sum(shots.values())`'],
      solution: 'shots = {"sh010": 48, "sh020": 96, "sh030": 72, "sh040": 24}\n\ntotal = sum(shots.values())\n'
    },
    {
      id: 'e2',
      title: 'Only the short shots',
      prompt: 'Create a dictionary `short_shots` with the shots of **fewer than 50** frames. Use a dict comprehension.',
      starter: 'shots = {"sh010": 48, "sh020": 96, "sh030": 72, "sh040": 24}\n\n',
      tests: [
        { check: "short_shots == {'sh010': 48, 'sh040': 24}", msg: '`short_shots` has sh010 and sh040 with their frames' },
        { check: "shots == {'sh010': 48, 'sh020': 96, 'sh030': 72, 'sh040': 24}", msg: 'you did not change `shots`' }
      ],
      hints: ['The shape is `{k: v for k, v in d.items() if condition}`.', '`short_shots = {s: f for s, f in shots.items() if f < 50}`'],
      solution: 'shots = {"sh010": 48, "sh020": 96, "sh030": 72, "sh040": 24}\n\nshort_shots = {s: f for s, f in shots.items() if f < 50}\n'
    },
    {
      id: 'e3',
      title: 'The longest one and the order',
      prompt: 'Create `longest` with the **name** of the shot with the most frames.\n\nCreate `order` with the list of names sorted from **longest to shortest**. (Hint: `sorted` has `reverse=True`.)',
      starter: 'shots = {"sh010": 48, "sh020": 96, "sh030": 72, "sh040": 24}\n\n',
      tests: [
        { check: "longest == 'sh020'", msg: '`longest` is "sh020"' },
        { check: "order == ['sh020', 'sh030', 'sh010', 'sh040']", msg: '`order` goes from longest to shortest' }
      ],
      hints: ['`max(shots, key=shots.get)`', '`sorted(shots, key=shots.get, reverse=True)`'],
      solution: 'shots = {"sh010": 48, "sh020": 96, "sh030": 72, "sh040": 24}\n\nlongest = max(shots, key=shots.get)\norder = sorted(shots, key=shots.get, reverse=True)\n'
    }
  ],

  summary: [
    '`for k, v in d.items():` loops over keys and values together.',
    '`{k: v for k, v in d.items() if ...}` filters or transforms in one line.',
    '`max(d, key=d.get)` and `sorted(d, key=d.get)` compare by **value**.'
  ]
});
