(function () {
var SETUP = [
  'import os',
  'os.makedirs("scenes")',
  'for _n in ["sh010_v001.ma", "sh010_v002.ma", "sh020_v001.ma", "notes.txt", "sh030_v001.mb"]:',
  '    open(os.path.join("scenes", _n), "w").close()',
  'del _n'
].join('\n') + '\n';
var FILES = 'scenes/\n  sh010_v001.ma\n  sh010_v002.ma\n  sh020_v001.ma\n  sh030_v001.mb\n  notes.txt';

TA.add({
  id: 'p13',
  title: 'os and os.path',

  explain: [
    'TA tools work with **files**: they find scenes, create export folders, rename versions. The `os` module is the door to the file system.',
    { type: 'analogy', text: 'a **path** is a file\'s address, like a postal address: country / city / street / number. `project/sq010/sh010/anim.ma`.' },
    '### Never glue paths with +',
    { type: 'compare',
      badTitle: 'Breaks between Windows and Mac',
      bad: 'path = folder + "/" + filename',
      goodTitle: 'os.path.join uses the right separator',
      good: 'path = os.path.join(folder, filename)' },
    '### The most used parts of os and os.path',
    '- `os.listdir(folder)` → list of names inside the folder (without the path).\n- `os.path.join(a, b)` → joins parts of a path.\n- `os.path.exists(p)`, `os.path.isfile(p)`, `os.path.isdir(p)` → does it exist? is it a file? a folder?\n- `os.path.basename(p)` → the final name. `os.path.dirname(p)` → the folder.\n- `os.path.splitext(name)` → splits into `("sh010_v001", ".ma")`.\n- `os.makedirs(p, exist_ok=True)` → creates folders (and the ones in between). No error if it already exists.\n- `os.rename(old, new)`, `os.remove(p)` → rename and delete.',
    { type: 'warn', text: '`os.listdir` returns the names in **any order**. If order matters, use `sorted()`.' },
    { type: 'cg', text: 'before exporting a shot, the tool creates `export/sq010/sh010/` with `makedirs(..., exist_ok=True)`. That way it does not fail if the folder already existed from a previous export.' },
    'In these exercises, every time you tap “Run”, a fresh working folder with test files appears.'
  ],

  example: {
    intro: 'We look at which scenes are in a folder.',
    lines: [
      { code: 'import os', note: 'We import the module.' },
      { code: 'names = sorted(os.listdir("scenes"))', note: 'Every name in the folder, sorted.' },
      { code: 'maya_files = [n for n in names if n.endswith((".ma", ".mb"))]', note: '`endswith` accepts a **tuple** of endings.' },
      { code: 'base, ext = os.path.splitext(maya_files[0])', note: 'Splits name and extension: `"sh010_v001"`, `".ma"`.' },
      { code: 'target = os.path.join("export", base)\nos.makedirs(target, exist_ok=True)', note: 'Creates `export/sh010_v001`.' },
      { code: 'print(maya_files, ext, os.path.isdir(target))', note: 'Result.' }
    ],
    output: "['sh010_v001.ma', 'sh010_v002.ma', 'sh020_v001.ma', 'sh030_v001.mb'] .ma True"
  },

  mini: [
    {
      q: 'What does `os.path.splitext("cam.v2.fbx")` return?',
      options: ['`("cam", ".v2.fbx")`', '`("cam.v2", ".fbx")`', '`["cam", "v2", "fbx"]`'],
      answer: 1,
      why: '`splitext` splits off only the **last** extension.'
    },
    {
      q: 'What is `exist_ok=True` for in `os.makedirs`?',
      options: ['To delete the folder if it exists', 'To not raise an error if the folder already exists', 'To create only the last folder'],
      answer: 1,
      why: 'Without `exist_ok=True`, if the folder already exists it raises `FileExistsError`.'
    }
  ],

  exercises: [
    {
      id: 'e1',
      title: 'Only the .ma scenes',
      prompt: 'Create `ma_scenes`: a **sorted** list of the file names ending in `.ma` inside the `scenes` folder.',
      files: FILES,
      setup: SETUP,
      starter: 'import os\n\n',
      tests: [{ check: "ma_scenes == ['sh010_v001.ma', 'sh010_v002.ma', 'sh020_v001.ma']", msg: '`ma_scenes` has the three .ma files, sorted' }],
      hints: ['`os.listdir("scenes")` gives the names.', '`sorted(n for n in os.listdir("scenes") if n.endswith(".ma"))`'],
      solution: 'import os\n\nma_scenes = sorted(n for n in os.listdir("scenes") if n.endswith(".ma"))\n'
    },
    {
      id: 'e2',
      title: 'Preparing the export folder',
      prompt: 'Write `prepare(sq, sh)`: create the folder `export/<sq>/<sh>` (with every folder in between) and return its path. If it already exists, it must **not** raise an error.',
      setup: SETUP,
      files: FILES,
      starter: 'import os\n\ndef prepare(sq, sh):\n    # your code\n    pass\n',
      tests: [
        { check: "prepare('sq010', 'sh010') == __import__('os').path.join('export', 'sq010', 'sh010')", msg: 'returns export/sq010/sh010' },
        { check: "__import__('os').path.isdir('export/sq010/sh010')", msg: 'the folder really exists' },
        { check: "prepare('sq010', 'sh010') is not None", msg: 'calling it twice does not raise' }
      ],
      hints: ['`path = os.path.join("export", sq, sh)`', '`os.makedirs(path, exist_ok=True)` and then `return path`.'],
      solution: 'import os\n\ndef prepare(sq, sh):\n    path = os.path.join("export", sq, sh)\n    os.makedirs(path, exist_ok=True)\n    return path\n'
    },
    {
      id: 'e3',
      title: 'Latest version of each shot',
      prompt: 'In `scenes` there are several versions per shot (`sh010_v001.ma`, `sh010_v002.ma`…). Create `latest`: a dict `{shot: file_name}` with the **highest** version of each shot. Consider `.ma` and `.mb`.',
      setup: SETUP,
      files: FILES,
      starter: 'import os\n\n',
      tests: [{ check: "latest == {'sh010': 'sh010_v002.ma', 'sh020': 'sh020_v001.ma', 'sh030': 'sh030_v001.mb'}", msg: 'one entry per shot, with its latest version' }],
      hints: ['For each file: `base, ext = os.path.splitext(n)` and `shot, ver = base.split("_v")`.', 'Store the file if the shot is not in `latest` yet, or if its version is higher than the stored one.'],
      solution: 'import os\n\nlatest = {}\nfor n in sorted(os.listdir("scenes")):\n    base, ext = os.path.splitext(n)\n    if ext not in (".ma", ".mb"):\n        continue\n    shot, ver = base.split("_v")\n    current = latest.get(shot)\n    if current is None or int(ver) > int(os.path.splitext(current)[0].split("_v")[1]):\n        latest[shot] = n\n',
      explain: 'Another very clear way: group with `defaultdict(list)` and then `max(files, key=version)` in each group (lessons 8 and 9).'
    }
  ],

  summary: [
    'Join paths with `os.path.join`, never with `+`.',
    '`listdir` (unordered: use `sorted`), `splitext`, `basename`, `exists`, `isdir`.',
    '`os.makedirs(path, exist_ok=True)` creates the whole path without failing if it exists.'
  ]
});
})();
