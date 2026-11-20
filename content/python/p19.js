(function () {
var SETUP = [
  'import os',
  'os.makedirs("render")',
  'for _n in ["Shot10_v1.exr", "shot20_V3.exr", "sh030_v002.exr", "Shot30_v2.exr", "notes.txt"]:',
  '    open(os.path.join("render", _n), "w").close()',
  'del _n'
].join('\n') + '\n';
var FILES = 'render/\n  Shot10_v1.exr\n  shot20_V3.exr\n  sh030_v002.exr\n  Shot30_v2.exr\n  notes.txt';
var NORM = 'import re\n\ndef normalize(name):\n    """"Shot10_v1.exr" -> "sh010_v001.exr". Returns None if it does not match."""\n    m = re.fullmatch(r"(?i)sh(?:ot)?(\\d+)_v(\\d+)(\\.\\w+)", name)\n    if not m:\n        return None\n    return f"sh{int(m.group(1)):03d}_v{int(m.group(2)):03d}{m.group(3).lower()}"\n';

TA.add({
  id: 'p19',
  title: 'TA: safe batch rename',

  explain: [
    'Renaming hundreds of files is a typical task. It is also **dangerous**: one mistake can overwrite a week of renders. The key is to **plan before acting**.',
    { type: 'analogy', text: 'before moving the furniture in a house, you draw a plan: what goes where. If two pieces go to the same spot, you see it on paper, not after you have broken something.' },
    '### Three separate steps',
    '1. **Plan**: compute the new name of every file → a dict `{old: new}`. It touches nothing.\n2. **Validate**: look for **conflicts**: two files that would end up with the same name, or a new name that already exists.\n3. **Apply**: rename. With a **dry run** mode, it only shows what it would do.',
    { type: 'compare',
      badTitle: 'Renaming while you compute',
      bad: 'for n in os.listdir(folder):\n    os.rename(n, normalize(n))  # what if it clashes?',
      goodTitle: 'Plan → conflicts → apply',
      good: 'plan = make_plan(names)\nclashes = conflicts(plan, names)\nif clashes:\n    raise RuntimeError(clashes)\napply(folder, plan, dry_run=True)' },
    { type: 'warn', text: 'on Windows, `os.rename` fails if the target exists; on Mac and Linux, it **overwrites it silently**. That is why you must check for conflicts first.' },
    { type: 'cg', text: 'renders arrive from an outside vendor with names like `Shot10_v1.exr`. The pipeline expects `sh010_v001.exr`. The tool shows the plan, the supervisor approves it, and only then does it rename.' },
    { type: 'tip', text: 'saying “I always do a dry run and check for conflicts before touching files” in the interview tells them you have worked in real production.' }
  ],

  example: {
    intro: 'The `normalize` function already exists. We build the plan and look for clashes.',
    lines: [
      { code: 'names = ["Shot10_v1.exr", "sh010_v001.exr", "Shot20_v3.exr"]', note: 'Careful! The first one, once normalized, would have the same name as the second.' },
      { code: 'plan = {n: normalize(n) for n in names if normalize(n) not in (None, n)}', note: 'Only the ones that change and can be normalized.' },
      { code: 'targets = list(plan.values())\nstaying = set(names) - set(plan)', note: '`staying`: files that are not renamed and will still be there.' },
      { code: 'clashes = [t for t in targets if targets.count(t) > 1 or t in staying]', note: 'Clash: two go to the same name, or another file already has that name.' },
      { code: 'print(plan)\nprint(clashes)', note: 'The plan and the problem we avoided.' }
    ],
    output: "{'Shot10_v1.exr': 'sh010_v001.exr', 'Shot20_v3.exr': 'sh020_v003.exr'}\n['sh010_v001.exr']"
  },

  mini: [
    {
      q: 'What does a “dry run” mode do?',
      options: ['Renames faster', 'Shows what it would do, without changing anything', 'Deletes the old files'],
      answer: 1,
      why: 'It is a rehearsal: you can review the plan before touching files.'
    },
    {
      q: 'On Linux, `os.rename("a.exr", "b.exr")` when `b.exr` already exists…',
      options: ['Raises an error', 'Overwrites `b.exr` silently', 'Creates `b (1).exr`'],
      answer: 1,
      why: 'That is why a good renamer checks for conflicts first.'
    }
  ],

  exercises: [
    {
      id: 'e1',
      title: 'Planning',
      prompt: 'The `normalize` function is already written. Write `make_plan(names)` that returns a dict `{old: new}` with **only** the files that can be normalized **and** change name.',
      starter: NORM + '\ndef make_plan(names):\n    # your code\n    pass\n',
      tests: [
        { check: "make_plan(['Shot10_v1.exr', 'sh030_v002.exr', 'notes.txt', 'shot20_V3.exr']) == {'Shot10_v1.exr': 'sh010_v001.exr', 'shot20_V3.exr': 'sh020_v003.exr'}", msg: 'includes only the ones that change' },
        { check: "make_plan([]) == {}", msg: 'no names, empty plan' }
      ],
      hints: ['For each name: `new = normalize(n)`.', 'Add it if `new is not None and new != n`.'],
      solution: NORM + '\ndef make_plan(names):\n    plan = {}\n    for n in names:\n        new = normalize(n)\n        if new is not None and new != n:\n            plan[n] = new\n    return plan\n'
    },
    {
      id: 'e2',
      title: 'Detecting conflicts',
      prompt: 'Write `conflicts(plan, existing)` that returns the **sorted list** of new names that clash:\n\n- two files in the plan go to the **same** name, or\n- the new name already belongs to a file in `existing` that is **not** being renamed.\n\nMake it efficient (no `count` inside loops).',
      starter: 'from collections import Counter\n\ndef conflicts(plan, existing):\n    # your code\n    pass\n',
      tests: [
        { check: "conflicts({'Shot30_v2.exr': 'sh030_v002.exr'}, ['Shot30_v2.exr', 'sh030_v002.exr']) == ['sh030_v002.exr']", msg: 'detects that the target already exists' },
        { check: "conflicts({'a': 'x', 'b': 'x', 'c': 'y'}, ['a', 'b', 'c']) == ['x']", msg: 'detects two going to the same name' },
        { check: "conflicts({'a': 'b', 'b': 'c'}, ['a', 'b']) == []", msg: 'renaming to a name that is itself being renamed is not a clash' }
      ],
      hints: ['`times = Counter(plan.values())` counts the targets.', '`staying = set(existing) - set(plan)` are the files that do not move.'],
      solution: 'from collections import Counter\n\ndef conflicts(plan, existing):\n    times = Counter(plan.values())\n    staying = set(existing) - set(plan)\n    return sorted({t for t in plan.values() if times[t] > 1 or t in staying})\n'
    },
    {
      id: 'e3',
      title: 'Applying with a dry run',
      prompt: 'Write `apply(folder, plan, dry_run=True)`:\n\n- Return a **sorted** list of strings `"old -> new"`.\n- Only really rename (with `os.rename`) if `dry_run=False`.',
      setup: SETUP, files: FILES,
      starter: 'import os\n\ndef apply(folder, plan, dry_run=True):\n    # your code\n    pass\n',
      tests: [
        { check: "apply('render', {'Shot10_v1.exr': 'sh010_v001.exr'}) == ['Shot10_v1.exr -> sh010_v001.exr']", msg: 'returns the plan lines' },
        { check: "apply('render', {'Shot10_v1.exr': 'sh010_v001.exr'}) is not None and __import__('os').path.exists('render/Shot10_v1.exr')", msg: 'in a dry run it touches nothing' },
        { check: "apply('render', {'shot20_V3.exr': 'sh020_v003.exr'}, dry_run=False) and __import__('os').path.exists('render/sh020_v003.exr') and not __import__('os').path.exists('render/shot20_V3.exr')", msg: 'with dry_run=False it really renames' }
      ],
      hints: ['`lines = [f"{o} -> {n}" for o, n in plan.items()]`', '`if not dry_run:` loop over the plan and use `os.rename(os.path.join(folder, o), os.path.join(folder, n))`.'],
      solution: 'import os\n\ndef apply(folder, plan, dry_run=True):\n    lines = sorted(f"{o} -> {n}" for o, n in plan.items())\n    if not dry_run:\n        for old, new in plan.items():\n            os.rename(os.path.join(folder, old), os.path.join(folder, new))\n    return lines\n'
    }
  ],

  summary: [
    'Separate plan, validate and apply: the plan is a dict `{old: new}`.',
    'Conflicts: repeated targets (`Counter`) or targets that already exist and are not moving.',
    'Always offer a dry run before touching files.'
  ]
});
})();
