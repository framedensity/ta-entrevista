TA.add({
  id: 'p18',
  title: 'TA: naming convention checker',

  explain: [
    'First TA project: a tool that checks a scene\'s names before it is delivered. Here you combine what you already know: dictionaries, regex, grouping and small functions.',
    { type: 'analogy', text: 'it is the pipeline\'s spell checker. It does not fix anything on its own: it points out where the problem is and why, so the artist decides.' },
    '### Rules are data, not code',
    'A common mistake is writing one `if` per rule. If the convention changes tomorrow, you have to edit the code. Better to keep the rules in a **dictionary**: node type → pattern.',
    { type: 'compare',
      badTitle: 'Rules mixed with the logic',
      bad: 'if kind == "camera" and not name.startswith("cam_"):\n    ...\nelif kind == "joint" and not name.endswith("_jnt"):\n    ...',
      goodTitle: 'Rules as data; the logic does not change',
      good: 'RULES = {\n    "camera": r"cam_sh\\d{3}",\n    "joint": r"[a-z]+_(l|r|c)_jnt",\n}\npattern = RULES.get(kind)\nif pattern and not re.fullmatch(pattern, name): ...' },
    'That way the rules can come from a project **JSON** (lesson 15), and each project has its own without touching the tool.',
    '### A useful report, not just «failed»',
    'A good checker says **which** name fails and **why**, and if it can, it **suggests** the right name. Grouping the failures by reason helps fix them in one go.',
    { type: 'cg', text: 'before sending the scene to lighting, the checker finds `Cam_SH10` (should be `cam_sh010`) and `Hip_JNT`. The artist fixes them in a minute instead of the render failing.' },
    { type: 'tip', text: 'in the interview, describe the structure: «rules in a JSON, a pure function that returns the problems, and the UI only displays them. That way I can run it in batch without opening Maya».' }
  ],

  example: {
    intro: 'Rules per node type, and a function that returns the problems.',
    lines: [
      { code: 'import re', note: 'We will use `re.fullmatch`.' },
      { code: 'RULES = {"camera": r"cam_sh\\d{3}", "joint": r"[a-z]+_(l|r|c)_jnt"}', note: 'The rules are data: type → pattern.' },
      { code: 'nodes = [("cam_sh010", "camera"), ("Cam_SH10", "camera"), ("hip_c_jnt", "joint"), ("knee_jnt", "joint")]', note: '(name, type) pairs.' },
      { code: 'bad = [n for n, t in nodes if t in RULES and not re.fullmatch(RULES[t], n)]', note: 'We only check the types that have a rule.' },
      { code: 'print(bad)', note: 'The two names that break the rules.' }
    ],
    output: "['Cam_SH10', 'knee_jnt']"
  },

  mini: [
    {
      q: 'Why keep the rules in a dictionary (or JSON) instead of in `if`s?',
      options: ['Because it is faster', 'Because changing the convention does not force a code change', 'Because `if` does not work with text'],
      answer: 1,
      why: 'Separating data and logic lets each project have its own rules without touching the tool.'
    },
    {
      q: 'A node is of a type that has **no** rule. What is most reasonable?',
      options: ['Flag it as an error', 'Skip it (there is nothing to check)', 'Delete it'],
      answer: 1,
      why: 'If there is no rule for that type, there is nothing to break. (Optionally, you can list it as «not checked».)'
    }
  ],

  exercises: [
    {
      id: 'e1',
      title: 'Checking with rules',
      prompt: 'Write `check(nodes, rules)`:\n\n- `nodes`: list of `(name, type)`.\n- `rules`: dict `{type: pattern}`.\n\nReturn a **dict** `{name: pattern_it_breaks}` with the nodes that have a rule and do **not** follow it (use `re.fullmatch`).',
      starter: 'import re\n\ndef check(nodes, rules):\n    # your code\n    pass\n',
      tests: [
        { check: "check([('cam_sh010', 'camera'), ('Cam_SH10', 'camera'), ('x', 'mesh')], {'camera': r'cam_sh\\d{3}'}) == {'Cam_SH10': r'cam_sh\\d{3}'}", msg: 'finds Cam_SH10 and skips the type with no rule' },
        { check: "check([], {'camera': 'x'}) == {}", msg: 'no nodes returns {}' }
      ],
      hints: ['`pattern = rules.get(kind)`; if it is `None`, move on to the next.', '`if not re.fullmatch(pattern, name): problems[name] = pattern`'],
      solution: 'import re\n\ndef check(nodes, rules):\n    problems = {}\n    for name, kind in nodes:\n        pattern = rules.get(kind)\n        if pattern and not re.fullmatch(pattern, name):\n            problems[name] = pattern\n    return problems\n'
    },
    {
      id: 'e2',
      title: 'Suggesting the right name',
      prompt: 'Write `suggest_camera(name)` that normalizes camera names:\n\n- all lowercase\n- the shot number with **3 digits**\n\nExamples: `"Cam_SH10"` → `"cam_sh010"`, `"CAM_sh7"` → `"cam_sh007"`.\n\nIf it finds no number, return `None`.',
      starter: 'import re\n\ndef suggest_camera(name):\n    # your code\n    pass\n',
      tests: [
        { check: "suggest_camera('Cam_SH10') == 'cam_sh010'", msg: 'Cam_SH10 → cam_sh010' },
        { check: "suggest_camera('CAM_sh7') == 'cam_sh007'", msg: 'CAM_sh7 → cam_sh007' },
        { check: "suggest_camera('cam_main') is None", msg: 'no number returns None' }
      ],
      hints: ['`m = re.search(r"\\d+", name)` finds the first number.', '`return f"cam_sh{int(m.group()):03d}"`'],
      solution: 'import re\n\ndef suggest_camera(name):\n    m = re.search(r"\\d+", name)\n    if not m:\n        return None\n    return f"cam_sh{int(m.group()):03d}"\n'
    },
    {
      id: 'e3',
      title: 'A report grouped by reason',
      prompt: 'Write `report(names)` that checks each name with these checks, **in this order**, and keeps the **first** reason that fails:\n\n1. `"uppercase"` if the name is not all lowercase.\n2. `"spaces"` if it contains a space.\n3. `"no version"` if it does not end in `_v` + 3 digits.\n\nReturn a plain dict `{reason: [sorted names]}` with only the reasons that have names.',
      starter: 'import re\nfrom collections import defaultdict\n\ndef report(names):\n    # your code\n    pass\n',
      tests: [
        { check: "report(['hero_v001', 'Hero_v001', 'my hero_v002', 'boss', 'Boss x']) == {'uppercase': ['Boss x', 'Hero_v001'], 'spaces': ['my hero_v002'], 'no version': ['boss']}", msg: 'groups by the first reason that fails' },
        { check: "report(['a_v001']) == {}", msg: 'if everything is fine, returns {}' }
      ],
      hints: ['Keep the checks in a list of `(reason, function)` and loop over it.', 'For example: `("uppercase", lambda n: n != n.lower())`. When you find the first one, `break`.'],
      solution: 'import re\nfrom collections import defaultdict\n\nCHECKS = [\n    ("uppercase", lambda n: n != n.lower()),\n    ("spaces", lambda n: " " in n),\n    ("no version", lambda n: not re.search(r"_v\\d{3}$", n)),\n]\n\ndef report(names):\n    groups = defaultdict(list)\n    for n in names:\n        for reason, fails in CHECKS:\n            if fails(n):\n                groups[reason].append(n)\n                break\n    return {r: sorted(v) for r, v in groups.items()}\n',
      explain: 'The checks are **data** (a list of pairs). Adding a new rule is adding one line, without touching the loop.'
    }
  ],

  summary: [
    'Rules as data (dict or JSON): the logic does not change when the convention does.',
    'Return problems with context (what and why) and, if you can, a suggestion.',
    'Pure functions without a UI: they can be tested and run in batches.'
  ]
});
