(function () {
var SHOT = 'class Shot(object):\n    def __init__(self, name, start, end):\n        self.name = name\n        self.start = start\n        self.end = end\n\n    def duration(self):\n        return self.end - self.start + 1\n';

TA.add({
  id: 'p21',
  title: 'Classes working together',

  explain: [
    'Real tools have **several classes in the same file**, and they call each other all the time. In FlowTrail (Tools tab), a `Manager` holds many `Trail` objects and calls their methods; in Smooth Noise, `apply` creates `Control`, `Reader` and `LayerWriter` objects and passes them data. This lesson is about how that fits together.',
    { type: 'analogy', text: 'a film crew: the director (manager) does not hold the camera, but knows every camera operator and tells each one what to do. Each operator knows how to do their own job. Classes split work the same way.' },
    '### 1. One object holds others (composition)',
    'An attribute can be any value, including other objects or a list of them. Then a method calls the methods of the objects it holds.',
    '```python\nclass Shot(object):\n    def __init__(self, name, start, end):\n        self.name, self.start, self.end = name, start, end\n\n    def duration(self):\n        return self.end - self.start + 1\n\n\nclass Sequence(object):\n    def __init__(self, name):\n        self.name = name\n        self.shots = []                  # holds Shot objects\n\n    def add(self, shot):\n        self.shots.append(shot)\n\n    def total_frames(self):\n        return sum(s.duration() for s in self.shots)   # calls Shot\'s method\n```',
    '### 2. Calling inside the same object: `self.`',
    'Inside a class, one method calls another through `self`: `self.total_frames()`. Without `self.`, Python looks for a module-level function with that name instead.',
    '### 3. Order in the file does not matter (for calls)',
    'A method body runs only when it is called, so `Sequence` can create `Shot` objects even if `Shot` is written further down the file. What must exist is the name **at the moment the line runs**, not when the class is defined.',
    '### 4. Module-level helpers',
    'Small functions outside the classes (like `_frames(cfg)` in Smooth Noise) are shared by every class in the file. Use a leading `_` for helpers meant only for this file.',
    '### 5. Passing a method as a value (callbacks)',
    '`log.on_message` without parentheses is the method itself, already tied to `log`. Store it, call it later: this is exactly how Qt\'s `button.clicked.connect(self._do_export)` and FlowTrail\'s `mgr.listeners.append(self._on_manager)` work.',
    '### 6. Inheritance: a class built on another',
    '`class SpaceRef(Tracked):` gets every method of `Tracked` and can replace some. `super(SpaceRef, self).__init__(node)` (or `Tracked.__init__(self, node)`) runs the parent\'s version first.',
    { type: 'tip', text: 'in the interview, describe structure with responsibilities: «the Manager owns the trails and decides when to update; each Trail knows its own data; the UI only calls the Manager». That shows design thinking, not just syntax.' }
  ],

  example: {
    intro: 'A manager, the objects it holds, and a listener called back.',
    lines: [
      { code: SHOT.replace(/\n$/, ''), note: 'A small data class.' },
      { code: 'class Log(object):\n    def __init__(self):\n        self.lines = []\n\n    def write(self, text):\n        self.lines.append(text)', note: 'Another class that only collects messages.' },
      { code: 'class Exporter(object):\n    def __init__(self):\n        self.listeners = []\n\n    def export(self, shots):\n        for s in shots:\n            for fn in self.listeners:\n                fn("%s: %d frames" % (s.name, s.duration()))', note: '`Exporter` calls `Shot.duration()` and then every stored function.' },
      { code: 'log = Log()\nexp = Exporter()\nexp.listeners.append(log.write)', note: '`log.write` without `()`: the method itself, bound to `log`.' },
      { code: 'exp.export([Shot("sh010", 1, 48), Shot("sh020", 49, 96)])\nprint(log.lines)', note: 'The exporter wrote into the log without knowing what a `Log` is.' }
    ],
    output: "['sh010: 48 frames', 'sh020: 48 frames']"
  },

  mini: [
    {
      q: 'Inside a method of `Sequence`, how do you call its own method `total_frames`?',
      options: ['`total_frames()`', '`self.total_frames()`', '`Sequence.total_frames`'],
      answer: 1,
      why: 'Without `self.`, Python looks for a module-level function called `total_frames`.'
    },
    {
      q: 'What is `log.write` (without parentheses)?',
      options: ['An error', 'The method itself, tied to `log`, ready to be called later', 'The return value of `write`'],
      answer: 1,
      why: 'A bound method is a value: you can store it in a list or pass it to `connect`, and call it later.'
    }
  ],
  extra: [
    {
      q: '`Sequence.add` creates a `Shot`, but `class Shot` is written lower in the same file. Does it work?',
      options: ['No, classes must be defined in order', 'Yes, because the method body only runs when called, after the whole file has loaded', 'Only with `import Shot`'],
      answer: 1,
      why: 'Names are looked up when the line runs. By the time anyone calls `add`, the file has finished loading.'
    }
  ],

  exercises: [
    {
      id: 'e1',
      title: 'A sequence of shots',
      prompt: '`Shot` is already written. Write the class `Sequence`:\n\n- `__init__(self, name)`: stores the name and an empty list `self.shots`.\n- `add(self, shot)`: adds a `Shot`.\n- `total_frames(self)`: the sum of every shot\'s `duration()`.\n- `longest(self)`: the **Shot object** with the biggest duration (`None` if empty).',
      starter: SHOT + '\n\nclass Sequence(object):\n    pass\n',
      tests: [
        { check: "(lambda q: (q.add(Shot('a', 1, 10)), q.add(Shot('b', 11, 40)), q.total_frames())[2])(Sequence('sq010')) == 40", msg: 'total_frames adds the durations (10 + 30)' },
        { check: "(lambda q: (q.add(Shot('a', 1, 10)), q.add(Shot('b', 11, 40)), q.longest().name)[2])(Sequence('sq010')) == 'b'", msg: 'longest returns the Shot with the biggest duration' },
        { check: "Sequence('x').longest() is None and Sequence('x').total_frames() == 0", msg: 'an empty sequence gives None and 0' },
        { check: "Sequence('a').shots is not Sequence('b').shots", msg: 'each sequence has its own list' }
      ],
      hints: ['In `__init__`: `self.shots = []` (a new list per object).', '`sum(s.duration() for s in self.shots)`', '`max(self.shots, key=lambda s: s.duration()) if self.shots else None`'],
      solution: SHOT + '\n\nclass Sequence(object):\n    def __init__(self, name):\n        self.name = name\n        self.shots = []\n\n    def add(self, shot):\n        self.shots.append(shot)\n\n    def total_frames(self):\n        return sum(s.duration() for s in self.shots)\n\n    def longest(self):\n        if not self.shots:\n            return None\n        return max(self.shots, key=lambda s: s.duration())\n'
    },
    {
      id: 'e2',
      title: 'A manager that owns its objects',
      prompt: 'Write two classes, like FlowTrail\'s `Manager` and `Trail`:\n\n- `Trail(node)`: stores `node` and `visible = True`.\n- `Manager()`: holds `self.trails`, a dict `{node: Trail}`.\n  - `add(node)`: creates a `Trail` and stores it, **unless one already exists for that node**; returns the trail either way.\n  - `hide_all()`: sets `visible = False` on every trail.\n  - `visible_nodes()`: sorted list of nodes whose trail is visible.',
      starter: 'class Trail(object):\n    pass\n\n\nclass Manager(object):\n    pass\n',
      tests: [
        { check: "(lambda m: m.add('hand') is m.add('hand'))(Manager())", msg: 'adding the same node twice returns the same Trail object' },
        { check: "(lambda m: (m.add('hand'), m.add('foot'), m.visible_nodes())[2])(Manager()) == ['foot', 'hand']", msg: 'visible_nodes is sorted' },
        { check: "(lambda m: (m.add('hand'), m.hide_all(), m.visible_nodes(), m.trails['hand'].visible)[2:])(Manager()) == ([], False)", msg: 'hide_all hides every trail' },
        { check: "Trail('x').visible is True", msg: 'a new Trail is visible' }
      ],
      hints: ['`Manager.__init__`: `self.trails = {}`.', 'In `add`: `if node not in self.trails: self.trails[node] = Trail(node)` then `return self.trails[node]`.', '`sorted(n for n, t in self.trails.items() if t.visible)`'],
      solution: 'class Trail(object):\n    def __init__(self, node):\n        self.node = node\n        self.visible = True\n\n\nclass Manager(object):\n    def __init__(self):\n        self.trails = {}\n\n    def add(self, node):\n        if node not in self.trails:\n            self.trails[node] = Trail(node)\n        return self.trails[node]\n\n    def hide_all(self):\n        for t in self.trails.values():\n            t.visible = False\n\n    def visible_nodes(self):\n        return sorted(n for n, t in self.trails.items() if t.visible)\n',
      explain: 'The manager decides (no duplicates, hide all); each `Trail` only holds its own state. That split is what makes a big tool easy to read.'
    },
    {
      id: 'e3',
      title: 'Connecting objects with callbacks',
      prompt: 'Write:\n\n- `Exporter()` with `self.listeners = []`, `connect(fn)` that stores a function, and `export(names)` that, for each name, calls every stored function with the text `"exported <name>"`.\n- `Log()` with `self.messages = []` and a method `on_message(text)` that appends the text.\n\nThen create `exporter` and `log`, connect them with `exporter.connect(log.on_message)`, and run `exporter.export(["sh010", "sh020"])`.',
      starter: 'class Exporter(object):\n    pass\n\n\nclass Log(object):\n    pass\n\n\n# create the objects, connect them, export\n',
      tests: [
        { check: "log.messages == ['exported sh010', 'exported sh020']", msg: 'the log received both messages' },
        { check: "(lambda e, seen: (e.connect(seen.append), e.export(['x']), seen)[2])(Exporter(), []) == ['exported x']", msg: 'any function can be connected (here a list\'s append)' },
        { check: "'log.on_message)' in _code.replace(' ', '')", msg: 'connected with the bound method `log.on_message` (no parentheses)' }
      ],
      hints: ['`def connect(self, fn): self.listeners.append(fn)`', 'In `export`: two loops, names outside, listeners inside: `fn("exported %s" % name)`.', 'At the bottom: `exporter = Exporter()`, `log = Log()`, `exporter.connect(log.on_message)`, then export.'],
      solution: 'class Exporter(object):\n    def __init__(self):\n        self.listeners = []\n\n    def connect(self, fn):\n        self.listeners.append(fn)\n\n    def export(self, names):\n        for name in names:\n            for fn in self.listeners:\n                fn("exported %s" % name)\n\n\nclass Log(object):\n    def __init__(self):\n        self.messages = []\n\n    def on_message(self, text):\n        self.messages.append(text)\n\n\nexporter = Exporter()\nlog = Log()\nexporter.connect(log.on_message)\nexporter.export(["sh010", "sh020"])\n',
      explain: 'This is the same idea as a Qt signal: `button.clicked.connect(self.export)`. The exporter does not know or care what a `Log` is; it only calls the functions it was given.'
    }
  ],

  summary: [
    'Objects can hold other objects; methods call their methods (`s.duration()`), and their own through `self.`.',
    'Names are looked up when a line runs, so classes in one file can use each other in any order.',
    'A bound method (`log.write`) is a value you can store and call later: the basis of callbacks and Qt signals.'
  ]
});
})();
