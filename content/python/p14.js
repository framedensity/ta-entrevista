(function () {
var SETUP = [
  'import os',
  'for _p in ["project/sq010/sh010/anim_v001.fbx", "project/sq010/sh010/anim_v002.fbx",',
  '           "project/sq010/sh020/anim_v001.fbx", "project/sq010/sh020/notes.txt",',
  '           "project/sq020/sh010/anim_v003.fbx", "project/sq020/sh010/cam_v001.fbx",',
  '           "project/readme.txt"]:',
  '    os.makedirs(os.path.dirname(_p), exist_ok=True)',
  '    open(_p, "w").close()',
  'del _p'
].join('\n') + '\n';
var FILES = 'project/\n  readme.txt\n  sq010/\n    sh010/  anim_v001.fbx  anim_v002.fbx\n    sh020/  anim_v001.fbx  notes.txt\n  sq020/\n    sh010/  anim_v003.fbx  cam_v001.fbx';

TA.add({
  id: 'p14',
  title: 'Walking folders',

  explain: [
    '`os.listdir` only looks at **one** folder. But a project has folders inside folders: sequences, shots, departments… To search all of them, there are three tools.',
    { type: 'analogy', text: 'walking folders is like inspecting a building: you go into every floor, every room, and note what is there. `os.walk` does that walk for you.' },
    '### 1. os.walk',
    'Walks the folder and **all** its subfolders. For each folder it gives you three things: the path, the subfolders and the files.',
    '```python\nfor folder, subfolders, files in os.walk("project"):\n    for f in files:\n        path = os.path.join(folder, f)\n```',
    '### 2. glob: searching with wildcards',
    '`*` = any text. `**` = any number of folders (with `recursive=True`).',
    '```python\nimport glob\nglob.glob("project/**/*.fbx", recursive=True)\n```',
    '### 3. pathlib: paths as objects',
    '`pathlib.Path` is the modern way. The path is an object with handy properties, and you join it with `/`.',
    '```python\nfrom pathlib import Path\np = Path("project") / "sq010" / "sh010" / "anim_v002.fbx"\np.name     # "anim_v002.fbx"\np.stem     # "anim_v002"\np.suffix   # ".fbx"\np.parent.name  # "sh010"\nlist(Path("project").rglob("*.fbx"))   # recursive search\n```',
    { type: 'cg', text: 'before a delivery, find every `.fbx` in the project, know which shot each one belongs to (`p.parent.name`) and keep the latest version.' },
    { type: 'tip', text: 'if they ask which one you use: «`pathlib` for new code, because it reads better; `os.walk` when I need to skip folders while walking (by editing the subfolder list)».' }
  ],

  example: {
    intro: 'We find every exported animation in the project.',
    lines: [
      { code: 'from pathlib import Path', note: 'We import `Path`.' },
      { code: 'fbx = sorted(Path("project").rglob("*.fbx"))', note: '`rglob` searches every subfolder.' },
      { code: 'for p in fbx:\n    print(p.parent.parent.name, p.parent.name, p.stem)', note: 'Sequence (grandparent), shot (parent) and name without extension.' }
    ],
    output: 'sq010 sh010 anim_v001\nsq010 sh010 anim_v002\nsq010 sh020 anim_v001\nsq020 sh010 anim_v003\nsq020 sh010 cam_v001'
  },

  mini: [
    {
      q: 'In `for folder, subfolders, files in os.walk("x"):`, what is `files`?',
      options: ['The full paths of the files', 'The names of the files in that folder (no path)', 'Every file in every folder'],
      answer: 1,
      why: 'They are just names. For the full path: `os.path.join(folder, name)`.'
    },
    {
      q: 'With `p = Path("a/b/hero_v002.fbx")`, what is `p.stem`?',
      options: ['`"hero_v002.fbx"`', '`"hero_v002"`', '`".fbx"`'],
      answer: 1,
      why: '`stem` is the name without the extension. `name` includes it and `suffix` is only the extension.'
    }
  ],

  exercises: [
    {
      id: 'e1',
      title: 'Counting with os.walk',
      prompt: 'Use `os.walk` to create `total_fbx`: how many `.fbx` files there are in the whole `project`.',
      setup: SETUP, files: FILES,
      starter: 'import os\n\ntotal_fbx = 0\n',
      tests: [{ check: 'total_fbx == 5', msg: '`total_fbx` is 5' }],
      hints: ['Inside the `os.walk` loop, go through `files`.', 'Add 1 when `f.endswith(".fbx")`.'],
      solution: 'import os\n\ntotal_fbx = 0\nfor folder, subfolders, files in os.walk("project"):\n    for f in files:\n        if f.endswith(".fbx"):\n            total_fbx += 1\n'
    },
    {
      id: 'e2',
      title: 'A shot\'s files with pathlib',
      prompt: 'Write `files_in(sq, sh)` that returns the **sorted** list of names (with extension) inside `project/<sq>/<sh>`. Use `Path`.',
      setup: SETUP, files: FILES,
      starter: 'from pathlib import Path\n\ndef files_in(sq, sh):\n    # your code\n    pass\n',
      tests: [
        { check: "files_in('sq010', 'sh020') == ['anim_v001.fbx', 'notes.txt']", msg: 'sq010/sh020 has anim_v001.fbx and notes.txt' },
        { check: "files_in('sq020', 'sh010') == ['anim_v003.fbx', 'cam_v001.fbx']", msg: 'sq020/sh010 has two fbx files' }
      ],
      hints: ['`folder = Path("project") / sq / sh`', '`sorted(p.name for p in folder.iterdir())`'],
      solution: 'from pathlib import Path\n\ndef files_in(sq, sh):\n    folder = Path("project") / sq / sh\n    return sorted(p.name for p in folder.iterdir())\n'
    },
    {
      id: 'e3',
      title: 'Animation inventory',
      prompt: 'Create `inventory`: a dict `{"sq010/sh010": 2, ...}` with how many files starting with `anim_` there are in each shot. Only include shots that have at least one.',
      setup: SETUP, files: FILES,
      starter: 'from pathlib import Path\n\n',
      tests: [{ check: "inventory == {'sq010/sh010': 2, 'sq010/sh020': 1, 'sq020/sh010': 1}", msg: 'counts the anim_ files of each shot' }],
      hints: ['`Path("project").rglob("anim_*.fbx")`', 'The key: `f"{p.parent.parent.name}/{p.parent.name}"`. You can use `Counter` or `dict.get(k, 0) + 1`.'],
      solution: 'from pathlib import Path\nfrom collections import Counter\n\ninventory = dict(Counter(f"{p.parent.parent.name}/{p.parent.name}" for p in Path("project").rglob("anim_*")))\n'
    }
  ],

  summary: [
    '`os.walk` walks the whole tree: (folder, subfolders, files).',
    '`glob("**/*.fbx", recursive=True)` and `Path.rglob("*.fbx")` search with wildcards.',
    '`Path`: `/` to join, `.name`, `.stem`, `.suffix`, `.parent`.'
  ]
});
})();
