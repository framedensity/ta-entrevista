TA.add({
  id: 'p11',
  title: 'Text and regular expressions',

  explain: [
    'In a pipeline, **everything is names**: nodes, files, folders. Knowing how to split, clean and check text is essential.',
    '### The most used string methods',
    '- `s.split("_")` → splits into a list. `"_".join(items)` → joins it back.\n- `s.strip()` → removes spaces from both ends.\n- `s.lower()`, `s.upper()` → lowercase, uppercase.\n- `s.startswith("CHR_")`, `s.endswith(".ma")` → does it start/end like this?\n- `s.replace("old", "new")` → replaces.\n- `f"{n:03d}"` → number with 3 digits (`007`).',
    { type: 'analogy', text: '`split` is cutting a loaf of bread at the marks. `join` is sticking the slices back together with butter (the separator) between them.' },
    '### Regular expressions: text patterns',
    'A **regular expression** (regex) describes the **shape** a piece of text must have. Python uses them through the `re` module.',
    { type: 'analogy', text: 'a regex is like a cookie cutter: it does not say which exact cookie, but what shape it must have. If the text fits the cutter, it passes.' },
    'The basic pieces:',
    '- `\\d` → one digit. `\\d{3}` → exactly three digits.\n- `[a-z]+` → one or more lowercase letters.\n- `(CHR|PRP|ENV)` → one of these options.\n- `^` start, `$` end.\n- `( )` → a **group**: a part you want to pull out later.',
    '```python\nimport re\npattern = r"^(CHR|PRP)_([a-z]+)_v(\\d{3})$"\nm = re.match(pattern, "CHR_hero_v012")\nm.group(2)   # "hero"\nm.group(3)   # "012"\n```',
    { type: 'warn', text: 'write patterns as `r"..."` (raw strings). Otherwise Python interprets the backslashes before `re` sees them.' },
    '`re.fullmatch` checks the **whole** text. `re.sub` replaces whatever matches, and accepts a function to compute the replacement.',
    { type: 'cg', text: 'checking that every node follows the `TYPE_name_v###` convention, pulling the version number out of a file, or bumping the version from `v007` to `v008`.' }
  ],

  example: {
    intro: 'We take apart and validate an asset name.',
    lines: [
      { code: 'import re', note: 'The regular-expression module.' },
      { code: 'name = "CHR_hero_rig_v012"', note: 'Type, name, department, version.' },
      { code: 'kind, asset, dept, ver = name.split("_")', note: '`split` gives 4 parts and we spread them over 4 variables.' },
      { code: 'print(asset, int(ver[1:]))', note: '`ver[1:]` drops the "v". `int()` turns "012" into 12.' },
      { code: 'ok = re.fullmatch(r"(CHR|PRP|ENV)_[a-z]+_[a-z]+_v\\d{3}", name) is not None', note: '`fullmatch` returns an object if it matches, or `None` if not.' },
      { code: 'new = re.sub(r"v(\\d{3})", lambda m: f"v{int(m.group(1)) + 1:03d}", name)', note: 'We find `v` + 3 digits and replace it with the next version.' },
      { code: 'print(ok, new)', note: 'Result.' }
    ],
    output: 'hero 12\nTrue CHR_hero_rig_v013'
  },

  mini: [
    {
      q: 'What matches the pattern `^sh\\d{3}$`?',
      options: ['`"sh10"`', '`"sh010"`', '`"sh0100"`'],
      answer: 1,
      why: '`\\d{3}` is exactly 3 digits, and `$` forces it to end there.'
    },
    {
      q: 'What does `"_".join(["sq010", "sh020", "cam"])` return?',
      options: ['`"sq010sh020cam"`', '`"sq010_sh020_cam"`', '`["sq010_", "sh020_", "cam_"]`'],
      answer: 1,
      why: '`join` glues the items together with the separator between them.'
    }
  ],

  exercises: [
    {
      id: 'e1',
      title: 'Parts of a name',
      prompt: 'Write `parts(name)` that takes something like `"CHR_hero_rig_v012"` and returns the dictionary:\n\n`{"type": "CHR", "asset": "hero", "dept": "rig", "version": 12}` (version as a **number**).',
      starter: 'def parts(name):\n    # your code\n    pass\n',
      tests: [
        { check: "parts('CHR_hero_rig_v012') == {'type': 'CHR', 'asset': 'hero', 'dept': 'rig', 'version': 12}", msg: 'takes apart CHR_hero_rig_v012' },
        { check: "parts('PRP_sword_mod_v001')['version'] == 1", msg: 'the version is a number (1, not "001")' }
      ],
      hints: ['`kind, asset, dept, ver = name.split("_")`', '`int(ver[1:])` drops the "v" and converts to a number.'],
      solution: 'def parts(name):\n    kind, asset, dept, ver = name.split("_")\n    return {"type": kind, "asset": asset, "dept": dept, "version": int(ver[1:])}\n'
    },
    {
      id: 'e2',
      title: 'Validate with regex',
      prompt: 'Write `is_valid(name)` that returns `True` only if the name is:\n\n- `CHR`, `PRP` or `ENV`\n- an underscore and one or more lowercase letters\n- `_v` and **exactly** 3 digits\n\nValid example: `"PRP_sword_v003"`.',
      starter: 'import re\n\ndef is_valid(name):\n    # your code\n    pass\n',
      tests: [
        { check: "is_valid('PRP_sword_v003') is True", msg: 'PRP_sword_v003 is valid' },
        { check: "is_valid('prp_sword_v003') is False", msg: 'lowercase prp is not valid' },
        { check: "is_valid('CHR_Hero_v001') is False", msg: 'an uppercase letter in the name is not valid' },
        { check: "is_valid('ENV_city_v01') is False", msg: 'v01 (2 digits) is not valid' },
        { check: "is_valid('ENV_city_v001_old') is False", msg: 'extra text at the end is not valid' }
      ],
      hints: ['Pattern: `r"(CHR|PRP|ENV)_[a-z]+_v\\d{3}"`', 'Use `re.fullmatch(...)` and compare with `is not None`.'],
      solution: 'import re\n\ndef is_valid(name):\n    return re.fullmatch(r"(CHR|PRP|ENV)_[a-z]+_v\\d{3}", name) is not None\n'
    },
    {
      id: 'e3',
      title: 'Bump the version',
      prompt: 'Write `bump_version(filename)`: `"sh010_anim_v007.ma"` → `"sh010_anim_v008.ma"`. Keep 3 digits (`v099` → `v100`).',
      starter: 'import re\n\ndef bump_version(filename):\n    # your code\n    pass\n',
      tests: [
        { check: "bump_version('sh010_anim_v007.ma') == 'sh010_anim_v008.ma'", msg: 'v007 → v008' },
        { check: "bump_version('cam_v099.fbx') == 'cam_v100.fbx'", msg: 'v099 → v100' }
      ],
      hints: ['Use `re.sub` with the pattern `r"_v(\\d{3})"`.', 'The replacement can be a function: `lambda m: f"_v{int(m.group(1)) + 1:03d}"`.'],
      solution: 'import re\n\ndef bump_version(filename):\n    return re.sub(r"_v(\\d{3})", lambda m: f"_v{int(m.group(1)) + 1:03d}", filename)\n'
    }
  ],

  summary: [
    '`split`/`join`, `strip`, `lower`, `startswith`/`endswith` and `f"{n:03d}"` cover almost everything.',
    'Regex: `\\d{3}`, `[a-z]+`, `(A|B)`, groups `( )`; always use `r"..."`.',
    '`re.fullmatch` validates the whole text; `re.sub` replaces (also with a function).'
  ]
});
