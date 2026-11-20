TA.add({
  id: 'p16',
  title: 'Classes',

  explain: [
    'When data and actions always go together (a shot has a start, an end, a camera… and knows how to compute its duration), a **class** keeps them organized.',
    { type: 'analogy', text: 'a **class** is the blueprint of a house. An **object** (instance) is a house built from that blueprint. You can build many houses from the same blueprint, each with its own furniture.' },
    '```python\nclass Shot:\n    def __init__(self, name, start, end):\n        self.name = name\n        self.start = start\n        self.end = end\n\n    def duration(self):\n        return self.end - self.start + 1\n\ns = Shot("sh010", 1001, 1048)\ns.duration()   # 48\n```',
    '- `__init__` runs when the object is created: it sets up its data.\n- `self` is «this particular object». That is why each shot keeps its own `start`.\n- A **method** is a function inside the class: `s.duration()`.',
    '### __repr__: how it looks when printed',
    'Without `__repr__`, printing an object gives something like `<Shot object at 0x7f...>`. With it, you see something useful while debugging.',
    '### dataclass: less code for data classes',
    '`@dataclass` writes the `__init__`, the `__repr__` and `==` comparison for you.',
    { type: 'compare',
      badTitle: 'Everything by hand',
      bad: 'class Shot:\n    def __init__(self, name, start, end):\n        self.name = name\n        self.start = start\n        self.end = end\n    def __repr__(self):\n        return f"Shot({self.name!r}, ...)"',
      goodTitle: 'With dataclass',
      good: 'from dataclasses import dataclass\n\n@dataclass\nclass Shot:\n    name: str\n    start: int\n    end: int' },
    { type: 'cg', text: 'an export tool has an `Exporter` class that keeps the config in `self` and has `validate()` and `export()` methods. The UI (PySide) only calls those methods.' },
    { type: 'tip', text: 'separating the **logic** (classes and functions with no UI) from the **UI** (PySide) is something TA interviewers value a lot: it can be tested and reused in batches without opening windows.' }
  ],

  example: {
    intro: 'A data class for shots.',
    lines: [
      { code: 'from dataclasses import dataclass, field', note: 'We import `dataclass`.' },
      { code: '@dataclass\nclass Shot:\n    name: str\n    start: int\n    end: int\n    cameras: list = field(default_factory=list)', note: 'Each field with its type. For default lists use `field(default_factory=list)` (the same trap as lesson 10).' },
      { code: '    def duration(self):\n        return self.end - self.start + 1', note: 'A normal method inside the class.' },
      { code: 's = Shot("sh010", 1001, 1048)\ns.cameras.append("cam_A")', note: 'We create an object and use its list.' },
      { code: 'print(s)\nprint(s.duration())', note: 'The automatic `__repr__` shows every field.' }
    ],
    output: "Shot(name='sh010', start=1001, end=1048, cameras=['cam_A'])\n48"
  },

  mini: [
    {
      q: 'What is `self` inside a method?',
      options: ['The class', 'The particular object the method was called on', 'A global variable'],
      answer: 1,
      why: 'In `s.duration()`, `self` is `s`. That way each object uses its own data.'
    },
    {
      q: 'What does `@dataclass` write for you?',
      options: ['`__init__`, `__repr__` and `__eq__`', 'Only `__init__`', 'A graphical UI'],
      answer: 0,
      why: 'That is why it is ideal for classes that are mostly data.'
    }
  ],

  exercises: [
    {
      id: 'e1',
      title: 'The Shot class',
      prompt: 'Create the class `Shot` with `name`, `start` and `end`, and these methods:\n\n- `duration()` → frames, counting start and end.\n- `contains(frame)` → `True` if the frame is between start and end (inclusive).',
      starter: 'class Shot:\n    def __init__(self, name, start, end):\n        pass\n',
      tests: [
        { check: "Shot('sh010', 1001, 1048).duration() == 48", msg: 'duration() gives 48' },
        { check: "Shot('sh010', 1001, 1048).contains(1048) is True", msg: 'contains(1048) is True' },
        { check: "Shot('sh010', 1001, 1048).contains(1000) is False", msg: 'contains(1000) is False' },
        { check: "Shot('x', 1, 2).name == 'x'", msg: 'stores the name in self.name' }
      ],
      hints: ['In `__init__`: `self.name = name`, and so on.', '`return self.start <= frame <= self.end`'],
      solution: 'class Shot:\n    def __init__(self, name, start, end):\n        self.name = name\n        self.start = start\n        self.end = end\n\n    def duration(self):\n        return self.end - self.start + 1\n\n    def contains(self, frame):\n        return self.start <= frame <= self.end\n'
    },
    {
      id: 'e2',
      title: 'With dataclass',
      prompt: 'Rewrite `Shot` as a `@dataclass` with `name: str`, `start: int`, `end: int`, and the `duration()` method.\n\nThen create `shots` with three objects (`sh010` 1001–1048, `sh020` 1049–1144, `sh030` 1145–1168) and `total` with the sum of their durations.',
      starter: 'from dataclasses import dataclass\n\n',
      tests: [
        { check: "Shot('a', 1, 10) == Shot('a', 1, 10)", msg: 'two equal shots are == (dataclass gives you that)' },
        { check: 'len(shots) == 3 and total == 168', msg: '`total` is 168 (48 + 96 + 24)' },
        { check: "'sh010' in repr(shots[0])", msg: 'the repr shows the name' }
      ],
      hints: ['`@dataclass` above `class Shot:` and the fields with their types.', '`total = sum(s.duration() for s in shots)`'],
      solution: 'from dataclasses import dataclass\n\n@dataclass\nclass Shot:\n    name: str\n    start: int\n    end: int\n\n    def duration(self):\n        return self.end - self.start + 1\n\nshots = [Shot("sh010", 1001, 1048), Shot("sh020", 1049, 1144), Shot("sh030", 1145, 1168)]\ntotal = sum(s.duration() for s in shots)\n'
    },
    {
      id: 'e3',
      title: 'Do they overlap?',
      prompt: 'Add to your `Shot` (it can be a dataclass) the method `overlaps(other)`: `True` if they share any frame.\n\nHint: two ranges do **not** overlap if one ends before the other starts.',
      starter: 'from dataclasses import dataclass\n\n@dataclass\nclass Shot:\n    name: str\n    start: int\n    end: int\n\n    def overlaps(self, other):\n        pass\n',
      tests: [
        { check: "Shot('a', 1, 10).overlaps(Shot('b', 10, 20)) is True", msg: '1–10 and 10–20 overlap (they share frame 10)' },
        { check: "Shot('a', 1, 10).overlaps(Shot('b', 11, 20)) is False", msg: '1–10 and 11–20 do not overlap' },
        { check: "Shot('a', 5, 6).overlaps(Shot('b', 1, 20)) is True", msg: 'one inside the other overlaps' }
      ],
      hints: ['They do not overlap if `self.end < other.start` or `other.end < self.start`.', '`return not (self.end < other.start or other.end < self.start)`'],
      solution: 'from dataclasses import dataclass\n\n@dataclass\nclass Shot:\n    name: str\n    start: int\n    end: int\n\n    def overlaps(self, other):\n        return not (self.end < other.start or other.end < self.start)\n'
    }
  ],

  summary: [
    'Class = blueprint; object = a built house. `self` is the particular object.',
    '`__init__` sets up the data; methods are the object\'s functions.',
    '`@dataclass` saves you `__init__`, `__repr__` and `__eq__` in data classes.'
  ]
});
