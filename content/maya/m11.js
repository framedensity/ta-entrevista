(function () {
var SETUP = [
  'from maya import cmds as _c',
  'for _n in ["arm_L", "arm_R", "leg_L", "Hero_Body", "cam"]:',
  '    _c.polyCube(name=_n)',
  'del _n'
].join('\n') + '\n';
var FILES = 'Scene:\n  arm_L, arm_R, leg_L, Hero_Body, cam  (mesh transforms)';

var UNDO = 'from maya import cmds\n\n\nclass UndoChunk(object):\n    def __enter__(self):\n        cmds.undoInfo(openChunk=True)\n        return self\n\n    def __exit__(self, exc_type, exc, tb):\n        cmds.undoInfo(closeChunk=True)\n        return False\n';

TA.add({
  id: 'm11',
  title: 'Structure of a real Maya tool',

  explain: [
    'The tools in the **Tools** tab are not one long function. They are a few classes in one file (or a few files), each with one job, calling each other. This lesson builds that structure in small pieces, and puts undo chunks where a real tool puts them.',
    { type: 'analogy', text: 'a restaurant: the waiter takes the order (UI), the chef decides what to cook (plan), the cooks do it (apply), and nothing leaves the kitchen half-done (undo chunk). Nobody does everybody\'s job.' },
    '### The usual layers, top to bottom',
    '1. **Pure logic**: functions or classes that work only with data (names, numbers, lists). No `cmds`. Easy to test anywhere.\n2. **Maya layer**: reads and writes the scene with `cmds`, inside an undo chunk.\n3. **UI**: buttons that collect options and call layer 2. No logic inside.',
    '### An undo chunk as a class',
    'm08 made `undo_chunk()` with `@contextmanager`. The same thing as a class is what you often see in studio code: `with` calls `__enter__` at the start and `__exit__` at the end, **even if there was an error**.',
    '```python\nclass UndoChunk(object):\n    def __enter__(self):\n        cmds.undoInfo(openChunk=True)\n        return self\n\n    def __exit__(self, exc_type, exc, tb):\n        cmds.undoInfo(closeChunk=True)\n        return False          # False: do not hide the error\n```',
    { type: 'warn', text: 'if `__exit__` returns `True`, Python swallows the error and the artist never sees it. Return `False` (or nothing) so the error still shows.' },
    '### Plan, then apply',
    'Split "what would change" from "change it". `plan()` returns a list like `[(old, new), ...]` and touches nothing, so a UI can show a preview or a dry run. `apply()` loops over the plan inside **one** undo chunk, so a single Ctrl+Z reverts the whole batch.',
    '### Classes calling each other',
    'A `Checker` finds problems and returns them as data. A `Fixer` receives a checker in `__init__`, asks it for the problems and fixes them. The fixer does not know *how* problems are found; the checker does not know how they are fixed. Swap either one and the other keeps working.',
    '```python\nchecker = Checker()\nfixer = Fixer(checker)       # the fixer keeps a reference\nfixer.fix_all(cmds.ls(type="transform"))\n```',
    { type: 'cg', text: 'Smooth Noise (Tools tab) follows exactly this shape: `_frames()` and the noise math are pure, `Reader` and `LayerWriter` talk to Maya, `apply()` wires them together inside one undo chunk, and the Qt window only calls `apply()`.' },
    { type: 'tip', text: 'when asked "how would you structure this tool?", answer in layers: pure logic you can test, a Maya layer with one undo chunk per user action, and a thin UI. Then name the classes and who calls whom.' }
  ],

  example: {
    intro: 'Three small pieces in one file, each calling the next.',
    lines: [
      { code: UNDO.replace(/\n$/, ''), note: '`with UndoChunk():` opens on entry and always closes on exit.' },
      { code: 'def new_name(name):\n    side = name[-2:] if name[-2:] in ("_L", "_R") else ""\n    return name[:len(name) - len(side)].lower() + side + "_geo"', note: 'Pure logic: a string in, a string out. No Maya.' },
      { code: 'def plan(nodes):\n    return [(n, new_name(n)) for n in nodes if new_name(n) != n]', note: 'Uses the pure function to build the plan, still without touching the scene.' },
      { code: 'def apply(changes):\n    with UndoChunk():\n        for old, new in changes:\n            cmds.rename(old, new)', note: 'The only part that changes the scene, all in one undo step.' },
      { code: 'changes = plan(["arm_L", "cam"])\nprint(changes)\napply(changes)\nprint(cmds._undo_log)', note: 'Preview first, then apply. The simulator logs the chunk.' }
    ],
    output: "[('arm_L', 'arm_L_geo'), ('cam', 'cam_geo')]\n['open', 'close']"
  },

  mini: [
    {
      q: 'Where does the undo chunk go in a batch rename of 200 nodes?',
      options: ['Inside the loop, one chunk per rename', 'Around the whole loop, one chunk for the batch', 'In the UI button, around `plan()`'],
      answer: 1,
      why: 'One user action = one Ctrl+Z. A chunk per rename would still need 200 undos.'
    },
    {
      q: 'Why does `plan()` not call `cmds.rename`?',
      options: ['Because `rename` is slow', 'So it can be previewed, dry-run and tested without changing the scene', 'Because classes cannot call `cmds`'],
      answer: 1,
      why: 'Separating the decision from the change gives you a preview for free and makes the logic testable.'
    }
  ],
  extra: [
    {
      q: '`__exit__(self, exc_type, exc, tb)` gets called after an error inside the `with`. What does `exc_type` hold?',
      options: ['Always `None`', 'The class of the error (for example `ValueError`), or `None` if there was no error', 'The line number of the error'],
      answer: 1,
      why: 'Python passes the error to `__exit__` so it can react (log it, clean up). Returning `False` lets it continue up to the caller.'
    }
  ],

  exercises: [
    {
      id: 'e1',
      title: 'UndoChunk as a class',
      prompt: 'Write the class `UndoChunk` so that `with UndoChunk():`\n\n- opens a chunk with `cmds.undoInfo(openChunk=True)` on entry,\n- **always** closes it with `cmds.undoInfo(closeChunk=True)` on exit, even after an error,\n- does **not** hide the error (it must still reach the caller).',
      setup: SETUP + 'def _try_ok():\n    with UndoChunk():\n        pass\n\ndef _try_error():\n    try:\n        with UndoChunk():\n            raise ValueError("boom")\n    except ValueError:\n        return "raised"\n    return "hidden"\n',
      files: FILES,
      starter: 'from maya import cmds\n\n\nclass UndoChunk(object):\n    def __enter__(self):\n        pass\n\n    def __exit__(self, exc_type, exc, tb):\n        pass\n',
      tests: [
        { check: "(lambda: [cmds._undo_log.clear(), _try_ok(), list(cmds._undo_log)][2])() == ['open', 'close']", msg: 'opens and closes the chunk' },
        { check: "(lambda: [cmds._undo_log.clear(), _try_error(), list(cmds._undo_log)][2])() == ['open', 'close']", msg: 'closes it even when there is an error inside' },
        { check: "_try_error() == 'raised'", msg: 'the error still reaches the caller' }
      ],
      hints: ['`__enter__`: `cmds.undoInfo(openChunk=True)` and `return self`.', '`__exit__`: `cmds.undoInfo(closeChunk=True)`.', 'End `__exit__` with `return False` so the error is not swallowed.'],
      solution: UNDO,
      explain: 'Python always calls `__exit__` when the `with` block ends, the same guarantee as `try/finally`, but written once and reused by every function of the tool.'
    },
    {
      id: 'e2',
      title: 'A Renamer: plan, then apply',
      prompt: '`UndoChunk` is already written. Write the class `Renamer(prefix)`:\n\n- `plan(nodes)`: returns a list of `(old, new)` where `new` is `prefix + old`, **skipping** nodes that already start with the prefix. It must not change the scene.\n- `apply(nodes)`: calls `self.plan(nodes)` and renames each pair with `cmds.rename`, all inside **one** `with UndoChunk():`. Returns the list of new names.',
      setup: SETUP,
      files: FILES,
      starter: UNDO + '\n\nclass Renamer(object):\n    def __init__(self, prefix):\n        self.prefix = prefix\n',
      tests: [
        { check: "Renamer('chr_').plan(['arm_L', 'chr_leg']) == [('arm_L', 'chr_arm_L')]", msg: 'plan builds (old, new) and skips names that already have the prefix' },
        { check: "(lambda: [Renamer('chr_').plan(['arm_L']), cmds.objExists('arm_L')][1])()", msg: 'plan does not change the scene' },
        { check: "(lambda: [cmds._undo_log.clear(), Renamer('chr_').apply(['arm_L', 'arm_R']), list(cmds._undo_log)])() [1:] == [['chr_arm_L', 'chr_arm_R'], ['open', 'close']]", msg: 'apply renames everything inside a single undo chunk' },
        { check: "cmds.objExists('chr_arm_L') and not cmds.objExists('arm_L')", msg: 'the nodes were renamed in the scene' }
      ],
      hints: ['`plan`: `[(n, self.prefix + n) for n in nodes if not n.startswith(self.prefix)]`', '`apply`: first `changes = self.plan(nodes)`, then `with UndoChunk():` around the loop.', 'Collect `cmds.rename(old, new)` results in a list and return it.'],
      solution: UNDO + '\n\nclass Renamer(object):\n    def __init__(self, prefix):\n        self.prefix = prefix\n\n    def plan(self, nodes):\n        return [(n, self.prefix + n) for n in nodes if not n.startswith(self.prefix)]\n\n    def apply(self, nodes):\n        changes = self.plan(nodes)\n        done = []\n        with UndoChunk():\n            for old, new in changes:\n                done.append(cmds.rename(old, new))\n        return done\n',
      explain: '`apply` reuses `plan` through `self.plan(...)`: the rule lives in one place. A UI can call `plan` for a preview and `apply` for the button, and one Ctrl+Z reverts the whole batch.'
    },
    {
      id: 'e3',
      title: 'A Checker and a Fixer working together',
      prompt: '`UndoChunk` is already written. Write two classes:\n\n- `Checker` with `problems(nodes)`: returns the nodes whose name has an **uppercase** letter (`n != n.lower()`), in the same order.\n- `Fixer(checker)`: stores the checker. `fix_all(nodes)` asks `self.checker.problems(nodes)` and renames each one to its lowercase name, inside **one** undo chunk. Returns the list of new names.\n\nThe Fixer must use the Checker, not repeat its rule.',
      setup: SETUP,
      files: FILES,
      starter: UNDO + '\n\nclass Checker(object):\n    pass\n\n\nclass Fixer(object):\n    pass\n',
      tests: [
        { check: "Checker().problems(['arm_L', 'Hero_Body', 'cam']) == ['arm_L', 'Hero_Body']", msg: 'Checker finds names with uppercase letters' },
        { check: "(lambda: [cmds._undo_log.clear(), Fixer(Checker()).fix_all(['arm_L', 'Hero_Body', 'cam']), list(cmds._undo_log)])()[1:] == [['arm_l', 'hero_body'], ['open', 'close']]", msg: 'Fixer renames them in one undo chunk' },
        { check: "(lambda c: [setattr(c, 'problems', lambda nodes: ['cam']), Fixer(c).fix_all(['cam', 'leg_L'])][1])(Checker()) == ['cam']", msg: 'Fixer asks its checker (it does not repeat the rule)' }
      ],
      hints: ['`Fixer.__init__(self, checker)`: `self.checker = checker`.', 'In `fix_all`: `bad = self.checker.problems(nodes)` before the undo chunk.', 'Inside `with UndoChunk():` loop over `bad` and `cmds.rename(n, n.lower())`.'],
      solution: UNDO + '\n\nclass Checker(object):\n    def problems(self, nodes):\n        return [n for n in nodes if n != n.lower()]\n\n\nclass Fixer(object):\n    def __init__(self, checker):\n        self.checker = checker\n\n    def fix_all(self, nodes):\n        bad = self.checker.problems(nodes)\n        done = []\n        with UndoChunk():\n            for n in bad:\n                done.append(cmds.rename(n, n.lower()))\n        return done\n',
      explain: 'The last test swaps the checker\'s rule and the Fixer follows it: that is the point of passing one object into another. In a real validator you can add new checks without touching the fixer.'
    }
  ],

  summary: [
    'Layers: pure logic (testable) / Maya layer with one undo chunk per user action / thin UI.',
    '`with` calls `__enter__` and `__exit__` (even after an error); return `False` so errors are not hidden.',
    'Split `plan()` from `apply()`, and let classes cooperate by passing one into another (`Fixer(checker)`).'
  ]
});
})();
