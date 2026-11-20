TA.add({
  id: 'p05',
  title: 'Sets',

  explain: [
    'A **set** is a collection with **no duplicates** and **no order**. It does not look like much, but it solves lots of TA problems in one line.',
    { type: 'analogy', text: 'a set is the guest list at a club door. Order does not matter. Nobody appears twice. And the bouncer checks **instantly** whether you are on it.' },
    'You create one with curly braces, or by converting a list with `set()`. Duplicates disappear on their own.',
    '```python\ncameras = set(["cam_A", "cam_B", "cam_A"])\n# {"cam_A", "cam_B"}\n```',
    { type: 'warn', text: 'an empty `{}` is a **dictionary**, not a set. An empty set is written `set()`.' },
    '### Why is it so fast?',
    'To know whether something is in a **list**, Python checks the items **one by one**. With 100,000 items, it may check 100,000.',
    'In a **set**, Python computes directly where the item would be (with a *hash*). It looks once, whatever the size.',
    { type: 'compare',
      badTitle: 'List: checks one by one (slow when big)',
      bad: 'existing = ["sh010", "sh020", ...]  # 50,000\nif "sh999" in existing: ...',
      goodTitle: 'Set: goes straight there (fast)',
      good: 'existing = set(big_list)\nif "sh999" in existing: ...' },
    '### Set operations',
    '- `a | b` → **union**: in a **or** in b.\n- `a & b` → **intersection**: in **both**.\n- `a - b` → **difference**: in a but **not** in b.\n- `a ^ b` → in **only one** of the two.',
    { type: 'cg', text: '«Which cameras does the script call for that do not exist in the scene?» is `expected - existing`. One line, and fast even with thousands.' },
    { type: 'tip', text: 'when they ask about efficiency, say: «To check membership many times, I convert the list to a `set`, because `in` goes from O(n) to O(1) on average».' }
  ],

  example: {
    intro: 'The script calls for some cameras. The scene has others.',
    lines: [
      { code: 'script = {"cam_A", "cam_B", "cam_C"}', note: 'A set with curly braces: the cameras we need.' },
      { code: 'scene = {"cam_B", "cam_C", "cam_D"}', note: 'The cameras in the scene.' },
      { code: 'missing = script - scene', note: 'Difference: in the script but not in the scene → `{"cam_A"}`.' },
      { code: 'extra = scene - script', note: 'The other way: in the scene but not in the script → `{"cam_D"}`.' },
      { code: 'ok = script & scene', note: 'Intersection: in both → `{"cam_B", "cam_C"}`.' },
      { code: 'print(sorted(missing), sorted(extra), sorted(ok))', note: 'Sets have no order. To show them neatly, `sorted()` returns a sorted list.' }
    ],
    output: "['cam_A'] ['cam_D'] ['cam_B', 'cam_C']"
  },

  mini: [
    {
      q: 'What is `{"a", "b"} & {"b", "c"}`?',
      options: ['`{"a", "b", "c"}`', '`{"b"}`', '`{"a", "c"}`'],
      answer: 1,
      why: '`&` is the intersection: what is in both. Only `"b"`.'
    },
    {
      q: 'You need to check 10,000 times whether a name is in a list of 50,000 names. What do you do?',
      options: ['Use the list as it is with `in`', 'Convert the list to a `set` once and use `in`', 'Sort the list every time'],
      answer: 1,
      why: 'With a `set`, each `in` is nearly instant. With the list, each `in` may walk all 50,000.'
    }
  ],
  extra: [
    {
      q: 'What does `x = {}` create?',
      options: ['An empty set', 'An empty dictionary', 'An error'],
      answer: 1,
      why: '`{}` is an empty dictionary. The empty set is `set()`.'
    }
  ],

  exercises: [
    {
      id: 'e1',
      title: 'How many different characters?',
      prompt: 'The list `appearances` has one character per shot they appear in. Create `unique` with the **number** of different characters.',
      starter: 'appearances = ["hero", "villain", "hero", "npc_01", "hero", "villain"]\n\n',
      tests: [{ check: 'unique == 3', msg: '`unique` is 3' }],
      hints: ['`set()` removes duplicates.', '`unique = len(set(appearances))`'],
      solution: 'appearances = ["hero", "villain", "hero", "npc_01", "hero", "villain"]\n\nunique = len(set(appearances))\n'
    },
    {
      id: 'e2',
      title: 'In both sequences',
      prompt: 'Create `shared`: a **sorted list** of the characters that appear in both sequences.',
      starter: 'sq010 = ["hero", "villain", "npc_01", "npc_02"]\nsq020 = ["npc_02", "hero", "boss"]\n\n',
      tests: [{ check: "shared == ['hero', 'npc_02']", msg: '`shared` is ["hero", "npc_02"]' }],
      hints: ['Convert both lists with `set()` and use `&`.', '`sorted(set(sq010) & set(sq020))`'],
      solution: 'sq010 = ["hero", "villain", "npc_01", "npc_02"]\nsq020 = ["npc_02", "hero", "boss"]\n\nshared = sorted(set(sq010) & set(sq020))\n'
    },
    {
      id: 'e3',
      title: 'The missing cameras',
      prompt: 'Create `missing`: a sorted list of cameras the script calls for that are **not** in the scene.\n\nCreate `extra`: a sorted list of cameras in the scene that the script does **not** call for.',
      starter: 'script = ["cam_sh010", "cam_sh020", "cam_sh030", "cam_sh040"]\nscene = ["cam_sh010", "cam_sh030", "cam_test", "cam_sh040"]\n\n',
      tests: [
        { check: "missing == ['cam_sh020']", msg: '`missing` is ["cam_sh020"]' },
        { check: "extra == ['cam_test']", msg: '`extra` is ["cam_test"]' }
      ],
      hints: ['Difference: `set(a) - set(b)`.', 'Remember `sorted()` to get a sorted list.'],
      solution: 'script = ["cam_sh010", "cam_sh020", "cam_sh030", "cam_sh040"]\nscene = ["cam_sh010", "cam_sh030", "cam_test", "cam_sh040"]\n\nmissing = sorted(set(script) - set(scene))\nextra = sorted(set(scene) - set(script))\n'
    }
  ],

  summary: [
    'A `set` has no duplicates and no order. `set(list)` removes duplicates.',
    '`in` on a set is nearly instant: use it when you look things up many times.',
    '`|` union, `&` in both, `-` in one but not the other.'
  ]
});
