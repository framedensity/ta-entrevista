(function () {
var SETUP = [
  'import os, sys, importlib',
  '_m = None',
  'for _m in [k for k in list(sys.modules) if k in ("shots", "heavy") or k == "pipeline" or k.startswith("pipeline.")]:',
  '    del sys.modules[_m]',
  'if os.getcwd() not in sys.path:',
  '    sys.path.insert(0, os.getcwd())',
  'os.makedirs("pipeline")',
  '_files = {',
  '    "shots.py": "FPS = 24.0\\n\\ndef duration(start, end):\\n    return end - start + 1\\n",',
  '    "heavy.py": "def build():\\n    return \'built\'\\n",',
  '    "pipeline/__init__.py": "",',
  '    "pipeline/naming.py": "def shot_name(n):\\n    return \'sh%03d\' % n\\n",',
  '    "pipeline/export.py": "from . import naming\\n\\ndef export_shot(n):\\n    return \'export/\' + naming.shot_name(n) + \'.fbx\'\\n",',
  '}',
  'for _p, _c in _files.items():',
  '    with open(_p, "w") as _f:',
  '        _f.write(_c)',
  'importlib.invalidate_caches()',
  'del _p, _c, _f, _files, _m'
].join('\n') + '\n';
var FILES = 'shots.py           FPS = 24.0, duration(start, end)\nheavy.py           build()\npipeline/\n  __init__.py      (empty)\n  naming.py        shot_name(n)\n  export.py        from . import naming ; export_shot(n)';

TA.add({
  id: 'p22',
  title: 'Modules and packages',

  explain: [
    'A small tool fits in one `.py` file. A big one is split into several files that import each other: FlowTrail has `core.py`, `anim.py`, `draw.py`, `ui.py`... in one folder. This lesson is how that works.',
    { type: 'analogy', text: 'a kitchen with stations: the cold station, the grill, the pastry. Each station has its own tools. When the grill needs a sauce, it asks the sauce station instead of making it again. Each `.py` file is a station; `import` is asking another station.' },
    '### Module = one .py file',
    '`import shots` runs `shots.py` once and gives you its names as `shots.duration`, `shots.FPS`. Python finds the file through the folders in `sys.path`.',
    '```python\nimport shots                    # shots.duration(...)\nfrom shots import duration      # duration(...)\nimport pipeline.naming as nm    # nm.shot_name(...)\n```',
    '### Package = a folder of modules',
    'A folder with an `__init__.py` file is a **package**. `__init__.py` runs when the package is imported; it can be empty, or it can hold the public commands (FlowTrail\'s `flowtrail.show()` lives there).',
    '### Relative imports inside a package',
    'Inside the package, files import each other with a dot: `from . import naming` means "naming, from this same package". FlowTrail\'s `core.py` does `from . import anim, draw, registry, reshape, sampling`. It keeps working even if the whole folder is renamed or moved.',
    '### Imported once, then cached',
    'The first `import` runs the file; later imports reuse it from `sys.modules`. That is why editing a file in Maya needs `importlib.reload(module)` (and why FlowTrail\'s `registry.py` says "never reload this module": the plugin keeps a reference to it).',
    '### Import inside a function',
    'An import can be written inside a function; it runs only when the function is called. FlowTrail\'s `__init__.py` does this so `import flowtrail` is fast and does not load the plugin or Qt until you call `show()`. It is also the usual fix for **circular imports** (two files importing each other at the top).',
    '### `if __name__ == "__main__":`',
    'Code under this line runs only when the file is executed directly, not when it is imported. Tools use it for "run me as a script" behavior.',
    { type: 'cg', text: 'a typical TA layout: `mytool/core.py` (logic, no UI), `mytool/ui.py` (Qt window that imports core), `mytool/__init__.py` (a `show()` function), `mytool/tests/` (tests that import core without Maya UI).' }
  ],

  example: {
    intro: 'The working folder has `shots.py` and a `pipeline` package (open the file list in the exercises).',
    lines: [
      { code: 'import shots', note: 'Runs `shots.py` once; its names live under `shots.`.' },
      { code: 'print(shots.duration(1001, 1048), shots.FPS)', note: 'A function and a constant from the module.' },
      { code: 'from pipeline.naming import shot_name', note: 'Take one name directly from a module inside the package.' },
      { code: 'from pipeline import export', note: 'Import a module of the package. Inside it, `from . import naming` finds its neighbor.' },
      { code: 'print(shot_name(7), export.export_shot(10))', note: 'Both work together.' }
    ],
    output: '48 24.0\nsh007 export/sh010.fbx'
  },

  mini: [
    {
      q: 'What makes a folder a package that you can import from?',
      options: ['A file called `main.py`', 'A file called `__init__.py`', 'Nothing, any folder works'],
      answer: 1,
      why: '`__init__.py` marks the folder as a package and runs when it is imported. (Python 3 can import folders without it, but Maya tools always include it.)'
    },
    {
      q: 'Inside `mytool/ui.py`, how do you import `mytool/core.py`?',
      options: ['`import core.py`', '`from . import core`', '`include core`'],
      answer: 1,
      why: 'The dot means "from this same package", so it keeps working if the package is renamed.'
    }
  ],
  extra: [
    {
      q: 'You edited `core.py` while Maya is open, and `import core` still runs the old code. Why?',
      options: ['Maya caches files on disk', 'Python already imported it; later imports reuse it until you `reload` it', 'The file was not saved as UTF-8'],
      answer: 1,
      why: 'Imported modules are kept in `sys.modules`. `importlib.reload(core)` runs the file again.'
    }
  ],

  exercises: [
    {
      id: 'e1',
      title: 'Use a module',
      prompt: 'The working folder has `shots.py` with `FPS` and `duration(start, end)`.\n\nImport it, create `d` with the duration of frames 1001 to 1048, and `seconds` with `d / shots.FPS`.',
      setup: SETUP, files: FILES,
      starter: '# import the module here\n\n',
      tests: [
        { check: 'd == 48', msg: '`d` is 48' },
        { check: 'seconds == 2.0', msg: '`seconds` is 2.0' },
        { check: "'import shots' in _code or 'from shots import' in _code", msg: 'uses `shots.py` instead of rewriting the function' }
      ],
      hints: ['`import shots`', '`d = shots.duration(1001, 1048)`'],
      solution: 'import shots\n\nd = shots.duration(1001, 1048)\nseconds = d / shots.FPS\n'
    },
    {
      id: 'e2',
      title: 'Use a package',
      prompt: 'The `pipeline` package has `naming.py` (`shot_name(n)`) and `export.py` (`export_shot(n)`, which itself uses `naming`).\n\nCreate `name` with `shot_name(5)` and `path` with `export_shot(5)`, importing from the package.',
      setup: SETUP, files: FILES,
      starter: '# import from the pipeline package\n\n',
      tests: [
        { check: "name == 'sh005'", msg: "`name` is 'sh005'" },
        { check: "path == 'export/sh005.fbx'", msg: "`path` is 'export/sh005.fbx'" },
        { check: "'pipeline' in _code", msg: 'imports from the package' }
      ],
      hints: ['`from pipeline.naming import shot_name`', '`from pipeline import export` and then `export.export_shot(5)`.'],
      solution: 'from pipeline.naming import shot_name\nfrom pipeline import export\n\nname = shot_name(5)\npath = export.export_shot(5)\n'
    },
    {
      id: 'e3',
      title: 'Import only when needed',
      prompt: '`heavy.py` stands for a slow module (Qt, a plugin...). Write `show()` that imports `build` from `heavy` **inside the function** and returns `build()`.\n\nImporting your code must not load `heavy` yet; only calling `show()` does.',
      setup: SETUP, files: FILES,
      starter: 'def show():\n    pass\n',
      tests: [
        { check: "'heavy' not in __import__('sys').modules", msg: '`heavy` is not loaded until `show()` is called' },
        { check: "show() == 'built'", msg: "`show()` returns 'built'" }
      ],
      hints: ['Inside `show`: `from heavy import build`', 'Then `return build()`.', 'Do not put any import of `heavy` at the top of the file.'],
      solution: 'def show():\n    from heavy import build\n    return build()\n',
      explain: 'This is exactly what FlowTrail\'s `__init__.py` does: `import flowtrail` is instant, and the heavy parts load the first time you call `flowtrail.show()`.'
    }
  ],

  summary: [
    'Module = one `.py` file (`import x`, `from x import f`); package = a folder with `__init__.py`.',
    'Inside a package, `from . import other` imports a neighbor; imports are cached, `importlib.reload` re-runs a file.',
    'Imports inside functions load slow parts only when needed and avoid circular imports.'
  ]
});
})();
