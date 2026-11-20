TA.add({
  id: 'p09',
  title: 'Tools that save loops',

  explain: [
    'You know how to write loops. This lesson is about writing **fewer**: Python comes with functions that replace the most typical loops. The code ends up shorter and with fewer bugs.',
    { type: 'analogy', text: 'they are like the power tools in a workshop. You can screw by hand, but the electric screwdriver does the same job, faster and without tiring you out.' },
    '### enumerate: the number and the item',
    { type: 'compare',
      badTitle: 'Counter by hand',
      bad: 'i = 0\nfor shot in shots:\n    print(i, shot)\n    i += 1',
      goodTitle: 'enumerate',
      good: 'for i, shot in enumerate(shots, start=1):\n    print(i, shot)' },
    '### zip: walking two lists at once',
    '`zip(a, b)` pairs the first with the first, the second with the second… With `dict(zip(a, b))` you build a dictionary.',
    '```python\nnames = ["sh010", "sh020"]\nframes = [48, 96]\ndict(zip(names, frames))  # {"sh010": 48, "sh020": 96}\n```',
    '### any and all: yes-or-no questions',
    '- `all(...)` → is it true for **every** item?\n- `any(...)` → is it true for **at least one**?',
    '```python\nall(f > 0 for f in frames)        # do all shots have frames?\nany(n.startswith("tmp") for n in names)  # anything temporary left?\n```',
    '### sorted, min and max with key',
    '`key=` is a function that says **what to look at** when comparing. With `lambda` you write it on the spot.',
    '```python\nshots = [("sh010", 48), ("sh020", 96)]\nsorted(shots, key=lambda s: s[1])  # sort by frames\n```',
    { type: 'cg', text: 'sorting files by version number, pairing cameras with their frame ranges, checking that no shot has 0 frames before exporting.' }
  ],

  example: {
    intro: 'Names and frames arrive in two separate lists.',
    lines: [
      { code: 'names = ["sh030", "sh010", "sh020"]\nframes = [72, 48, 0]', note: 'Two lists that go side by side.' },
      { code: 'shots = dict(zip(names, frames))', note: '`zip` pairs them and `dict` builds the dictionary.' },
      { code: 'valid = all(f > 0 for f in frames)', note: 'Do they all have frames? No: sh020 has 0 → `False`.' },
      { code: 'by_frames = sorted(shots.items(), key=lambda kv: kv[1])', note: 'We sort the pairs by value (position 1).' },
      { code: 'for i, (n, f) in enumerate(by_frames, start=1):\n    print(i, n, f)', note: '`enumerate` counts from 1. We unpack the pair into `(n, f)`.' },
      { code: 'print(valid)', note: 'The result of `all`.' }
    ],
    output: '1 sh020 0\n2 sh010 48\n3 sh030 72\nFalse'
  },

  mini: [
    {
      q: 'What does `list(zip([1, 2, 3], ["a", "b"]))` return?',
      options: ['`[(1, "a"), (2, "b")]`', '`[(1, "a"), (2, "b"), (3, None)]`', 'An error'],
      answer: 0,
      why: '`zip` stops when the shortest list runs out.'
    },
    {
      q: 'What does `any([])` return?',
      options: ['`True`', '`False`', 'An error'],
      answer: 1,
      why: 'No item meets the condition, so `any` is `False`. (And `all([])` is `True`.)'
    }
  ],

  exercises: [
    {
      id: 'e1',
      title: 'A numbered list',
      prompt: 'Create `lines`: a list of strings in the format `"1: sh010"`, `"2: sh020"`… using `enumerate` from 1.',
      starter: 'shots = ["sh010", "sh020", "sh030"]\n\n',
      tests: [{ check: "lines == ['1: sh010', '2: sh020', '3: sh030']", msg: '`lines` has the format "1: sh010"' }],
      hints: ['Comprehension: `[f"{i}: {s}" for i, s in enumerate(shots, start=1)]`'],
      solution: 'shots = ["sh010", "sh020", "sh030"]\n\nlines = [f"{i}: {s}" for i, s in enumerate(shots, start=1)]\n'
    },
    {
      id: 'e2',
      title: 'Camera ranges',
      prompt: 'Create `ranges`: a dictionary `{camera: (start, end)}` using `zip` with the three lists.\n\nCreate `all_ok`: `True` if **every** range has `end > start`.',
      starter: 'cameras = ["cam_A", "cam_B", "cam_C"]\nstarts = [1001, 1049, 1100]\nends = [1048, 1099, 1100]\n\n',
      tests: [
        { check: "ranges == {'cam_A': (1001, 1048), 'cam_B': (1049, 1099), 'cam_C': (1100, 1100)}", msg: '`ranges` pairs each camera with (start, end)' },
        { check: 'all_ok is False', msg: '`all_ok` is False (cam_C has end == start)' }
      ],
      hints: ['`zip` accepts three lists: `zip(cameras, starts, ends)`.', '`all(e > s for s, e in ranges.values())`'],
      solution: 'cameras = ["cam_A", "cam_B", "cam_C"]\nstarts = [1001, 1049, 1100]\nends = [1048, 1099, 1100]\n\nranges = {c: (s, e) for c, s, e in zip(cameras, starts, ends)}\nall_ok = all(e > s for s, e in ranges.values())\n'
    },
    {
      id: 'e3',
      title: 'Sorting versions properly',
      prompt: 'Sorting text puts `v10` before `v2`. Create `ordered`: the list sorted by version **number**.\n\nCreate `latest`: the file with the highest version.',
      starter: 'files = ["hero_v10.ma", "hero_v2.ma", "hero_v1.ma", "hero_v9.ma"]\n\ndef version(name):\n    # "hero_v10.ma" -> 10\n    return int(name.split("_v")[1].split(".")[0])\n\n',
      tests: [
        { check: "ordered == ['hero_v1.ma', 'hero_v2.ma', 'hero_v9.ma', 'hero_v10.ma']", msg: '`ordered` follows the version number' },
        { check: "latest == 'hero_v10.ma'", msg: '`latest` is hero_v10.ma' }
      ],
      hints: ['The `version` function is already written. Pass it as `key=version`.', '`max(files, key=version)`'],
      solution: 'files = ["hero_v10.ma", "hero_v2.ma", "hero_v1.ma", "hero_v9.ma"]\n\ndef version(name):\n    return int(name.split("_v")[1].split(".")[0])\n\nordered = sorted(files, key=version)\nlatest = max(files, key=version)\n'
    }
  ],

  summary: [
    '`enumerate` numbers, `zip` pairs lists, `dict(zip(a, b))` builds dictionaries.',
    '`all()` and `any()` answer «all of them?» and «any of them?» in one line.',
    '`key=` (a function or `lambda`) says what to compare in `sorted`, `min` and `max`.'
  ]
});
