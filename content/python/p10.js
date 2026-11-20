TA.add({
  id: 'p10',
  title: 'Well-made functions',

  explain: [
    'A TA tool is, above all, a set of small functions you can test separately. Writing **good** functions is what separates a script from a tool.',
    { type: 'analogy', text: 'a function is a recipe: it has ingredients (parameters), some steps and a finished dish (`return`). A good recipe works in any kitchen, not just yours.' },
    '### return, not print',
    'A function that calls `print` is only good for looking. A function that uses `return` lets you **use the result** somewhere else in the code.',
    '### Default and keyword arguments',
    '```python\ndef export(shot, fmt="fbx", include_camera=True):\n    ...\n\nexport("sh010")                        # uses the defaults\nexport("sh010", include_camera=False)  # by keyword: reads better\n```',
    '### The most famous trap: a mutable default value',
    'The default value is created **only once**, when the function is defined. If it is a list, every call shares the same list!',
    { type: 'compare',
      badTitle: 'The list is shared between calls',
      bad: 'def add(shot, items=[]):\n    items.append(shot)\n    return items\n\nadd("sh010")  # ["sh010"]\nadd("sh020")  # ["sh010", "sh020"]  ← surprise!',
      goodTitle: 'Use None and create the list inside',
      good: 'def add(shot, items=None):\n    if items is None:\n        items = []\n    items.append(shot)\n    return items' },
    { type: 'tip', text: 'this trap is a common interview question. Explain the «why»: the default value is evaluated when the function is defined, not when it is called.' },
    '### Returning several things',
    'With `return a, b` you return a **tuple**. When calling, you unpack it: `low, high = frame_range(frames)`.',
    { type: 'cg', text: 'separate «compute» from «act»: one function decides what needs renaming (and returns the list); another does it. That way you can test the first one without touching the scene.' }
  ],

  example: {
    intro: 'A small function with a default value and a docstring.',
    lines: [
      { code: 'def duration(start, end, include_end=True):\n    """Frames between start and end."""\n    d = end - start\n    return d + 1 if include_end else d', note: 'The text between `"""` is the **docstring**: it explains what the function does. `x if cond else y` picks a value in one line.' },
      { code: 'print(duration(1001, 1048))', note: 'Uses the default value: 48.' },
      { code: 'print(duration(1001, 1048, include_end=False))', note: 'By keyword: clear without looking at the definition. 47.' },
      { code: 'def frame_range(frames):\n    return min(frames), max(frames)', note: 'Returns a tuple of two values.' },
      { code: 'lo, hi = frame_range([1010, 1001, 1048])\nprint(lo, hi)', note: 'We unpack the tuple into two variables.' }
    ],
    output: '48\n47\n1001 1048'
  },

  mini: [
    {
      q: 'What does the second call print?',
      code: 'def f(x, l=[]):\n    l.append(x)\n    return l\nf(1)\nprint(f(2))',
      options: ['`[2]`', '`[1, 2]`', 'An error'],
      answer: 1,
      why: 'The default list was created once and is reused. That is why you should use `l=None`.'
    },
    {
      q: 'Why is `return` better than `print` in a tool function?',
      options: ['`print` is slower', 'With `return`, the result can be used and tested from other code', 'There is no difference'],
      answer: 1,
      why: 'What you print, only a person sees. What you return, the rest of the program (and the tests) can use.'
    }
  ],

  exercises: [
    {
      id: 'e1',
      title: 'Export file name',
      prompt: 'Write `export_name(shot, version, ext="fbx")` that returns `"sh010_v003.fbx"` for `("sh010", 3)`. The version always has 3 digits.',
      starter: 'def export_name(shot, version, ext="fbx"):\n    # your code\n    pass\n',
      tests: [
        { check: "export_name('sh010', 3) == 'sh010_v003.fbx'", msg: 'export_name("sh010", 3) gives "sh010_v003.fbx"' },
        { check: "export_name('sh020', 12, ext='abc') == 'sh020_v012.abc'", msg: 'accepts another extension by keyword' }
      ],
      hints: ['In an f-string, `{version:03d}` pads with zeros up to 3 digits.', '`return f"{shot}_v{version:03d}.{ext}"`'],
      solution: 'def export_name(shot, version, ext="fbx"):\n    return f"{shot}_v{version:03d}.{ext}"\n'
    },
    {
      id: 'e2',
      title: 'Fix the trap',
      prompt: 'This function has the shared-list bug. Fix it so every call without `items` starts with a new list.',
      starter: 'def add_shot(shot, items=[]):\n    items.append(shot)\n    return items\n',
      tests: [
        { check: "add_shot('a') == ['a'] and add_shot('b') == ['b']", msg: 'two calls in a row do not share the list' },
        { check: "add_shot('c', ['x']) == ['x', 'c']", msg: 'if you pass a list, it uses it' }
      ],
      hints: ['Change `items=[]` to `items=None`.', 'Inside: `if items is None: items = []`.'],
      solution: 'def add_shot(shot, items=None):\n    if items is None:\n        items = []\n    items.append(shot)\n    return items\n'
    },
    {
      id: 'e3',
      title: 'Sequence stats',
      prompt: 'Write `stats(shots)` that takes `{shot: frames}` and returns **three** values: `(total, average, longest)`. Round the average to 1 decimal with `round(x, 1)`.',
      starter: 'def stats(shots):\n    # your code\n    pass\n',
      tests: [
        { check: "stats({'a': 10, 'b': 30, 'c': 20}) == (60, 20.0, 'b')", msg: "stats({'a':10,'b':30,'c':20}) gives (60, 20.0, 'b')" },
        { check: "stats({'x': 5, 'y': 6})[1] == 5.5", msg: 'the average is 5.5' }
      ],
      hints: ['`total = sum(shots.values())`', '`return total, round(total / len(shots), 1), max(shots, key=shots.get)`'],
      solution: 'def stats(shots):\n    total = sum(shots.values())\n    average = round(total / len(shots), 1)\n    longest = max(shots, key=shots.get)\n    return total, average, longest\n'
    }
  ],

  summary: [
    'Return results with `return`; use default and keyword arguments so calls read well.',
    'Never use `[]` or `{}` as a default value: use `None` and create it inside.',
    '`return a, b` returns a tuple you unpack: `a, b = f()`.'
  ]
});
