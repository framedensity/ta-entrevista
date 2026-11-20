TA.add({
  id: 'p07',
  title: 'Pattern: finding duplicates',

  explain: [
    'Duplicate names in a scene, two shots with the same number, an asset imported twice… Finding duplicates is another interview classic.',
    { type: 'analogy', text: 'imagine checking tickets at a concert door. You drop every ticket number that has already gone in into a box. If one arrives that is already in the box, it is a duplicate!' },
    'That “box of already seen” is a **set**. We call it `seen`.',
    { type: 'compare',
      badTitle: 'count() inside a loop: walks the list n times',
      bad: 'dups = []\nfor x in names:\n    if names.count(x) > 1 and x not in dups:\n        dups.append(x)',
      goodTitle: 'A single pass with a set of seen items',
      good: 'seen = set()\ndups = set()\nfor x in names:\n    if x in seen:\n        dups.add(x)\n    else:\n        seen.add(x)',
      note: '`count()` walks the whole list every time: O(n²). The seen set does it in one pass: O(n).' },
    '### Counting with Counter',
    'The `collections` module has `Counter`: it counts how many times each thing appears. You will see it in depth in the next lesson.',
    '```python\nfrom collections import Counter\nc = Counter(names)\ndups = [n for n, times in c.items() if times > 1]\n```',
    '### Removing duplicates without losing the order',
    '`set(list)` removes repeats, but **scrambles the order**. To keep the order, use `dict.fromkeys()`: dictionaries remember insertion order.',
    '```python\nunique = list(dict.fromkeys(names))\n```',
    '### Duplicates that are “the same but different”?',
    'Sometimes `"Cam_A"` and `"cam_a"` are the same name for the pipeline. Before comparing, **normalize**: lowercase, strip spaces.',
    { type: 'cg', text: 'on Windows, `Hero.fbx` and `hero.fbx` are the same file. An exporter that does not catch this can overwrite data.' }
  ],

  example: {
    intro: 'We look for repeated node names.',
    lines: [
      { code: 'names = ["cam_A", "hero", "cam_B", "hero", "cam_A", "hero"]', note: 'There are repeats: "cam_A" (twice) and "hero" (3 times).' },
      { code: 'seen, dups = set(), set()', note: 'Two empty sets in one line.' },
      { code: 'for n in names:\n    if n in seen:\n        dups.add(n)\n    seen.add(n)', note: 'If we have seen it, it is a duplicate. We always mark it as seen.' },
      { code: 'print(sorted(dups))', note: 'Duplicates, listed once even if they appear 3 times.' },
      { code: 'print(list(dict.fromkeys(names)))', note: 'A list without repeats, in the original order.' }
    ],
    output: "['cam_A', 'hero']\n['cam_A', 'hero', 'cam_B']"
  },

  mini: [
    {
      q: 'Why is `list.count(x)` inside a `for` loop slow with big lists?',
      options: ['Because `count` walks the whole list every time', 'Because lists do not have `count`', 'It is not slow'],
      answer: 0,
      why: 'Each `count` is O(n). Doing it n times gives O(n²).'
    },
    {
      q: 'What does `list(dict.fromkeys(["b", "a", "b", "c"]))` return?',
      options: ['`["a", "b", "c"]`', '`["b", "a", "c"]`', '`["b", "a", "b", "c"]`'],
      answer: 1,
      why: 'It removes repeats and keeps the order of first appearance.'
    }
  ],

  exercises: [
    {
      id: 'e1',
      title: 'A duplicates function',
      prompt: 'Write `duplicates(items)`. Return a **sorted list** of the items that appear **more than once** (each one listed once). Do it in **one pass** with a seen set.',
      starter: 'def duplicates(items):\n    # your code\n    pass\n',
      tests: [
        { check: "duplicates(['a', 'b', 'a', 'c', 'b', 'a']) == ['a', 'b']", msg: "duplicates(['a','b','a','c','b','a']) gives ['a', 'b']" },
        { check: "duplicates(['x', 'y']) == []", msg: 'no repeats returns []' },
        { check: "duplicates(list(range(20000)) + [7]) == [7]", msg: 'runs fast with 20,000 items' }
      ],
      hints: ['Start with `seen = set()` and `dups = set()`.', 'At the end: `return sorted(dups)`.'],
      solution: 'def duplicates(items):\n    seen = set()\n    dups = set()\n    for x in items:\n        if x in seen:\n            dups.add(x)\n        seen.add(x)\n    return sorted(dups)\n'
    },
    {
      id: 'e2',
      title: 'No repeats, in order',
      prompt: 'Create `load_order`: the list of assets without repeats, in the **order they first appear**.',
      starter: 'assets = ["set_city", "chr_hero", "prp_sword", "chr_hero", "set_city", "fx_smoke"]\n\n',
      tests: [{ check: "load_order == ['set_city', 'chr_hero', 'prp_sword', 'fx_smoke']", msg: 'no repeats and in the original order' }],
      hints: ['`set()` scrambles the order. Use a dictionary.', '`list(dict.fromkeys(assets))`'],
      solution: 'assets = ["set_city", "chr_hero", "prp_sword", "chr_hero", "set_city", "fx_smoke"]\n\nload_order = list(dict.fromkeys(assets))\n'
    },
    {
      id: 'e3',
      title: 'Case-insensitive duplicates',
      prompt: 'Write `clashes(names)`: return a sorted list of the names **in lowercase** that would clash if case is ignored.\n\nExample: `["Hero.fbx", "hero.fbx", "Boss.fbx"]` → `["hero.fbx"]`.',
      starter: 'def clashes(names):\n    # your code\n    pass\n',
      tests: [
        { check: "clashes(['Hero.fbx', 'hero.fbx', 'Boss.fbx']) == ['hero.fbx']", msg: 'catches Hero.fbx and hero.fbx' },
        { check: "clashes(['A', 'a', 'B', 'b', 'c']) == ['a', 'b']", msg: 'several clashes, sorted' },
        { check: "clashes(['x', 'y']) == []", msg: 'no clashes returns []' }
      ],
      hints: ['Normalize each name with `.lower()` before checking `seen`.', 'Same pattern as `duplicates`, but with `n.lower()`.'],
      solution: 'def clashes(names):\n    seen, dups = set(), set()\n    for n in names:\n        k = n.lower()\n        if k in seen:\n            dups.add(k)\n        seen.add(k)\n    return sorted(dups)\n'
    }
  ],

  summary: [
    'Duplicates in one pass: a `seen` set and a `dups` set. O(n).',
    'Avoid `list.count()` inside a loop: it is O(n²).',
    '`list(dict.fromkeys(l))` removes repeats and keeps the order. Normalize (`.lower()`) when needed.'
  ]
});
