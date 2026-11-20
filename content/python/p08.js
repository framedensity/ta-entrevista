TA.add({
  id: 'p08',
  title: 'Pattern: grouping and counting',

  explain: [
    'Lots of pipeline questions are “how many of each type are there?” or “give me the files grouped by shot”. Python has two tools made for this, in the `collections` module.',
    '### Grouping: the first-item problem',
    'To group, you keep **one list per key**. The problem: the first time, the key does not exist yet.',
    { type: 'compare',
      badTitle: 'Checking by hand every time',
      bad: 'groups = {}\nfor f in files:\n    shot = f.split("_")[0]\n    if shot not in groups:\n        groups[shot] = []\n    groups[shot].append(f)',
      goodTitle: 'defaultdict creates the list for you',
      good: 'from collections import defaultdict\ngroups = defaultdict(list)\nfor f in files:\n    shot = f.split("_")[0]\n    groups[shot].append(f)' },
    { type: 'analogy', text: '`defaultdict(list)` is a magic filing cabinet: if you open a drawer that does not exist, an empty drawer appears, ready to use.' },
    '`dict.setdefault(key, [])` does the same without importing anything, but it reads worse.',
    '### Counting: Counter',
    '`Counter` counts how many times each item appears. It is a dictionary `{item: times}`.',
    '```python\nfrom collections import Counter\nc = Counter(["mesh", "joint", "mesh", "camera", "mesh"])\nc["mesh"]          # 3\nc.most_common(1)   # [("mesh", 3)]\nc["light"]         # 0 (no error)\n```',
    { type: 'cg', text: 'before delivering a scene, a tool counts the nodes by type. If there are 400 `joint` nodes in a props scene, something is wrong.' },
    { type: 'tip', text: 'if you catch yourself writing “if the key does not exist, create it with 0, then add 1”, say out loud: “here I would use `Counter`”. It shows you know the standard library.' }
  ],

  example: {
    intro: 'Files exported from several shots.',
    lines: [
      { code: 'from collections import defaultdict, Counter', note: 'We import both tools.' },
      { code: 'files = ["sh010_cam.fbx", "sh010_hero.fbx", "sh020_cam.fbx", "sh010_boss.fbx"]', note: 'Every name starts with the shot.' },
      { code: 'by_shot = defaultdict(list)\nfor f in files:\n    by_shot[f.split("_")[0]].append(f)', note: '`split("_")[0]` gets the shot. The drawer is created on first use.' },
      { code: 'print(dict(by_shot))', note: 'We convert it to a plain dict just so it prints cleanly.' },
      { code: 'count = Counter(f.split("_")[0] for f in files)', note: 'We count files per shot.' },
      { code: 'print(count.most_common(1))', note: 'The shot with the most files.' }
    ],
    output: "{'sh010': ['sh010_cam.fbx', 'sh010_hero.fbx', 'sh010_boss.fbx'], 'sh020': ['sh020_cam.fbx']}\n[('sh010', 3)]"
  },

  mini: [
    {
      q: 'With `g = defaultdict(list)`, what happens on `g["new"].append(1)` if `"new"` did not exist?',
      options: ['`KeyError`', '`g["new"] = [1]` is created', 'Nothing'],
      answer: 1,
      why: '`defaultdict(list)` automatically creates an empty list for new keys.'
    },
    {
      q: 'What does `Counter("banana").most_common(1)` return?',
      options: ['`[("a", 3)]`', '`[("b", 1)]`', '`3`'],
      answer: 0,
      why: 'The most frequent letter is "a", which appears 3 times. `most_common(n)` returns a list of pairs.'
    }
  ],

  exercises: [
    {
      id: 'e1',
      title: 'Nodes per type',
      prompt: 'Create `by_type`: a `Counter` of how many nodes there are of each type.\n\nCreate `most_common`: the **name of the type** that appears most.',
      starter: 'types = ["mesh", "joint", "mesh", "camera", "joint", "mesh", "locator"]\n\n',
      tests: [
        { check: "by_type['mesh'] == 3 and by_type['joint'] == 2 and by_type['camera'] == 1", msg: '`by_type` counts each type correctly' },
        { check: "most_common == 'mesh'", msg: '`most_common` is "mesh"' }
      ],
      hints: ['`from collections import Counter`', '`by_type.most_common(1)` gives `[("mesh", 3)]`. The name is `[0][0]`.'],
      solution: 'from collections import Counter\n\ntypes = ["mesh", "joint", "mesh", "camera", "joint", "mesh", "locator"]\n\nby_type = Counter(types)\nmost_common = by_type.most_common(1)[0][0]\n'
    },
    {
      id: 'e2',
      title: 'Files by extension',
      prompt: 'Create `by_ext`: a dictionary `{extension: [files]}` using `defaultdict(list)`. The extension is what comes after the **last** dot.',
      starter: 'files = ["hero.ma", "hero.fbx", "boss.ma", "readme.txt", "cam.v2.fbx"]\n\n',
      tests: [
        { check: "dict(by_ext) == {'ma': ['hero.ma', 'boss.ma'], 'fbx': ['hero.fbx', 'cam.v2.fbx'], 'txt': ['readme.txt']}", msg: 'groups by extension, keeping the order' }
      ],
      hints: ['`"cam.v2.fbx".rsplit(".", 1)[1]` gives `"fbx"`: `rsplit` cuts from the right.', '`by_ext[ext].append(f)`'],
      solution: 'from collections import defaultdict\n\nfiles = ["hero.ma", "hero.fbx", "boss.ma", "readme.txt", "cam.v2.fbx"]\n\nby_ext = defaultdict(list)\nfor f in files:\n    ext = f.rsplit(".", 1)[1]\n    by_ext[ext].append(f)\n'
    },
    {
      id: 'e3',
      title: 'Shots per sequence',
      prompt: 'Names look like `sequence_shot`. Write `group(names)` that returns a **plain dict** `{sequence: [shots]}`, with the shots **sorted**.',
      starter: 'def group(names):\n    # your code\n    pass\n',
      tests: [
        { check: "group(['sq020_sh020', 'sq010_sh030', 'sq010_sh010', 'sq020_sh010']) == {'sq020': ['sh010', 'sh020'], 'sq010': ['sh010', 'sh030']}", msg: 'groups and sorts the shots' },
        { check: "type(group(['a_b'])) is dict", msg: 'returns a plain dict' }
      ],
      hints: ['`sq, sh = name.split("_")` splits into two variables.', 'At the end: `return {k: sorted(v) for k, v in groups.items()}`'],
      solution: 'from collections import defaultdict\n\ndef group(names):\n    groups = defaultdict(list)\n    for n in names:\n        sq, sh = n.split("_")\n        groups[sq].append(sh)\n    return {k: sorted(v) for k, v in groups.items()}\n'
    }
  ],

  summary: [
    '`defaultdict(list)` groups without checking whether the key exists.',
    '`Counter(iterable)` counts; `.most_common(n)` gives the most frequent.',
    'Both live in `collections`: naming them in the interview earns points.'
  ]
});
