(function () {
var SETUP = [
  'import json',
  'with open("config.json", "w", encoding="utf-8") as _f:',
  '    json.dump({"project": "demo", "fps": 30, "export": {"format": "fbx", "scale": 1.0}}, _f, indent=2)',
  'del _f'
].join('\n') + '\n';
var FILES = 'config.json\n{\n  "project": "demo",\n  "fps": 30,\n  "export": {"format": "fbx", "scale": 1.0}\n}';

TA.add({
  id: 'p15',
  title: 'JSON',

  explain: [
    '**JSON** is a text format for storing data. It looks a lot like Python dictionaries and lists, and almost every program understands it.',
    { type: 'analogy', text: 'JSON is like a hand-written index card anyone can read: “name: sh010, frames: 48”. You can keep it in a drawer (a file) and another tool reads it later.' },
    '### The four json functions',
    '- `json.dumps(data)` → converts to **text** (dump string).\n- `json.loads(text)` → from text to data.\n- `json.dump(data, file)` → writes to a **file**.\n- `json.load(file)` → reads from a file.',
    'A trick to remember it: the trailing **s** stands for *string*.',
    '### Reading and writing files with with',
    '`with open(...)` opens the file and **closes it for you** when done, even if there is an error.',
    '```python\nwith open("config.json", "w", encoding="utf-8") as f:\n    json.dump(data, f, indent=2)\n\nwith open("config.json", encoding="utf-8") as f:\n    data = json.load(f)\n```',
    { type: 'warn', text: 'JSON has no tuples or sets: tuples come back as lists, and a `set` raises an error. Keys are always stored as text.' },
    '### Config with defaults',
    'A tool ships with default values. The user only writes in their JSON what they want to change. They are merged with `{**DEFAULTS, **user}`: the right side wins.',
    { type: 'cg', text: 'the exporter reads the project\'s `config.json`: fps, format, scale. If the file does not exist, it uses the defaults instead of breaking.' }
  ],

  example: {
    intro: 'We read the project config.',
    lines: [
      { code: 'import json', note: 'The JSON module.' },
      { code: 'with open("config.json", encoding="utf-8") as f:\n    cfg = json.load(f)', note: 'Now `cfg` is a normal Python dictionary.' },
      { code: 'print(cfg["fps"], cfg["export"]["format"])', note: 'Nested access: a dictionary inside another.' },
      { code: 'DEFAULTS = {"fps": 24, "camera": "renderCam"}', note: 'The tool\'s default values.' },
      { code: 'final = {**DEFAULTS, **cfg}', note: 'We merge: the project values override the defaults.' },
      { code: 'print(final["fps"], final["camera"])', note: '`fps` comes from the project (30). `camera`, from the defaults.' }
    ],
    output: '30 fbx\n30 renderCam'
  },

  mini: [
    {
      q: 'Which function writes a dictionary to a file?',
      options: ['`json.dumps`', '`json.dump`', '`json.load`'],
      answer: 1,
      why: '`dump` goes to a file. `dumps` (with s) returns text.'
    },
    {
      q: 'What is `{**{"a": 1, "b": 2}, **{"b": 9}}`?',
      options: ['`{"a": 1, "b": 2}`', '`{"a": 1, "b": 9}`', '`{"b": 9}`'],
      answer: 1,
      why: 'Both are merged, and if a key repeats, the right one wins.'
    }
  ],

  exercises: [
    {
      id: 'e1',
      title: 'Reading the config',
      prompt: 'Read `config.json` and create `fps` and `fmt` with their values.',
      setup: SETUP, files: FILES,
      starter: 'import json\n\n',
      tests: [
        { check: 'fps == 30', msg: '`fps` is 30' },
        { check: "fmt == 'fbx'", msg: '`fmt` is "fbx"' }
      ],
      hints: ['`with open("config.json", encoding="utf-8") as f: cfg = json.load(f)`', 'The format is inside `cfg["export"]`.'],
      solution: 'import json\n\nwith open("config.json", encoding="utf-8") as f:\n    cfg = json.load(f)\nfps = cfg["fps"]\nfmt = cfg["export"]["format"]\n'
    },
    {
      id: 'e2',
      title: 'Saving a report',
      prompt: 'Save the dictionary `report` to the file `report.json` with `indent=2`.',
      setup: SETUP, files: FILES,
      starter: 'import json\n\nreport = {"ok": ["sh010", "sh020"], "errors": {"sh030": "missing camera"}}\n\n',
      tests: [
        { check: "__import__('json').load(open('report.json', encoding='utf-8')) == report", msg: 'report.json contains the report' },
        { check: "'\\n  ' in open('report.json', encoding='utf-8').read()", msg: 'the file is indented (indent=2)' }
      ],
      hints: ['Open with `"w"` (write).', '`json.dump(report, f, indent=2)`'],
      solution: 'import json\n\nreport = {"ok": ["sh010", "sh020"], "errors": {"sh030": "missing camera"}}\n\nwith open("report.json", "w", encoding="utf-8") as f:\n    json.dump(report, f, indent=2)\n'
    },
    {
      id: 'e3',
      title: 'A failure-proof config',
      prompt: 'Write `load_config(path)`: read the JSON at `path` and merge it with `DEFAULTS` (the file wins). If the file **does not exist**, return a **copy** of `DEFAULTS`.',
      setup: SETUP, files: FILES,
      starter: 'import json\n\nDEFAULTS = {"fps": 24, "camera": "renderCam", "format": "abc"}\n\ndef load_config(path):\n    # your code\n    pass\n',
      tests: [
        { check: "load_config('config.json')['fps'] == 30 and load_config('config.json')['camera'] == 'renderCam'", msg: 'merges the file with the defaults' },
        { check: "load_config('missing.json') == {'fps': 24, 'camera': 'renderCam', 'format': 'abc'}", msg: 'with no file, returns the defaults' },
        { check: "load_config('missing.json') is not DEFAULTS", msg: 'returns a copy (not the DEFAULTS object itself)' }
      ],
      hints: ['`try:` open and `json.load`; `except FileNotFoundError:` return `dict(DEFAULTS)`.', 'If it reads fine: `return {**DEFAULTS, **data}`.'],
      solution: 'import json\n\nDEFAULTS = {"fps": 24, "camera": "renderCam", "format": "abc"}\n\ndef load_config(path):\n    try:\n        with open(path, encoding="utf-8") as f:\n            data = json.load(f)\n    except FileNotFoundError:\n        return dict(DEFAULTS)\n    return {**DEFAULTS, **data}\n'
    }
  ],

  summary: [
    '`load`/`dump` with files, `loads`/`dumps` with text (the s is for *string*).',
    'Open files with `with open(..., encoding="utf-8")`: they close themselves.',
    'Defaults: `{**DEFAULTS, **user}`; if the file is missing, use a copy of the defaults.'
  ]
});
})();
