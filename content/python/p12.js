TA.add({
  id: 'p12',
  title: 'Exceptions',

  explain: [
    'An **exception** is an error that happens while the program runs: a file that does not exist, a badly written number, a deleted node.',
    'If nobody catches it, the program stops. In a tool that processes 200 scenes, that means scene 57 breaks the whole run.',
    { type: 'analogy', text: '`try` / `except` is a trapeze artist\'s net. You attempt the jump (`try`). If you fall, the net catches you (`except`) and the show goes on.' },
    '```python\ntry:\n    frames = int(text)\nexcept ValueError:\n    frames = 0\n```',
    '### Catch only what you expect',
    { type: 'compare',
      badTitle: 'Catches EVERYTHING, even your own bugs',
      bad: 'try:\n    export(shot)\nexcept:\n    pass',
      goodTitle: 'Catch the specific error and report it',
      good: 'try:\n    export(shot)\nexcept FileNotFoundError as e:\n    errors.append((shot, str(e)))',
      note: 'A bare `except:` hides programming mistakes (a misspelled name, for example). Then nobody knows why it fails.' },
    '### else and finally',
    '- `else:` runs if there was **no** error.\n- `finally:` runs **always**, error or not. Ideal for “closing” things (for example, closing an *undo chunk* in Maya).',
    '### Raising your own errors',
    'If a function receives impossible data, it is better to **complain loudly** than to return something odd: `raise ValueError("end is before start")`.',
    { type: 'cg', text: 'in a batch process: catch the error of **each** scene, store it in a list and move on to the next. At the end, show the report: “198 OK, 2 with errors, and why”.' },
    { type: 'tip', text: 'if they ask how you handle errors, the key answer is: “I do not stop the whole batch for one scene; I log the error with context and keep going”.' }
  ],

  example: {
    intro: 'We process several shots and some have broken data.',
    lines: [
      { code: 'data = {"sh010": "48", "sh020": "ninety", "sh030": "72"}', note: 'Frames arrive as text. One is written wrong.' },
      { code: 'ok, errors = {}, []', note: 'We keep the good ones and the errors separately.' },
      { code: 'for shot, text in data.items():\n    try:\n        ok[shot] = int(text)\n    except ValueError as e:\n        errors.append((shot, str(e)))', note: '`int("ninety")` raises `ValueError`. We catch it, note it, and carry on.' },
      { code: 'print(ok)', note: 'The shots that could be read.' },
      { code: 'print(errors)', note: 'Each error with its shot: that makes the report useful.' }
    ],
    output: "{'sh010': 48, 'sh030': 72}\n[('sh020', \"invalid literal for int() with base 10: 'ninety'\")]"
  },

  mini: [
    {
      q: 'When does the `finally` block run?',
      options: ['Only if there was an error', 'Only if there was no error', 'Always'],
      answer: 2,
      why: '`finally` always runs. That is why it is used to clean up or close things.'
    },
    {
      q: 'Why is a bare `except:` with no error type a bad idea?',
      options: ['Because it is slower', 'Because it also hides errors you did not expect, like programming mistakes', 'Because Python does not allow it'],
      answer: 1,
      why: 'It catches everything, even a `NameError` from a typo. The bug stays hidden.'
    }
  ],

  exercises: [
    {
      id: 'e1',
      title: 'Converting safely',
      prompt: 'Write `to_int(text, default=0)`: return `int(text)`, or `default` if the text is not a valid number. Catch **only** `ValueError`.',
      starter: 'def to_int(text, default=0):\n    # your code\n    pass\n',
      tests: [
        { check: "to_int('48') == 48", msg: 'to_int("48") gives 48' },
        { check: "to_int('abc') == 0", msg: 'to_int("abc") gives 0' },
        { check: "to_int('x', default=-1) == -1", msg: 'uses the default you pass' }
      ],
      hints: ['`try:` with `return int(text)` inside.', '`except ValueError:` and `return default`.'],
      solution: 'def to_int(text, default=0):\n    try:\n        return int(text)\n    except ValueError:\n        return default\n'
    },
    {
      id: 'e2',
      title: 'Flagging impossible data',
      prompt: 'Write `duration(start, end)` that returns `end - start + 1`. But if `end < start`, raise `ValueError` with a message that contains both numbers.',
      starter: 'def duration(start, end):\n    # your code\n    pass\n',
      tests: [
        { check: 'duration(1001, 1048) == 48', msg: 'duration(1001, 1048) gives 48' },
        { check: "_raises(lambda: duration(10, 5), ValueError)", msg: 'duration(10, 5) raises ValueError' },
        { check: "_msg(lambda: duration(10, 5)).count('10') >= 1 and _msg(lambda: duration(10, 5)).count('5') >= 1", msg: 'the error message mentions 10 and 5' }
      ],
      setup: 'def _raises(fn, exc):\n    try:\n        fn()\n    except exc:\n        return True\n    except Exception:\n        return False\n    return False\n\ndef _msg(fn):\n    try:\n        fn()\n    except Exception as e:\n        return str(e)\n    return ""\n',
      hints: ['`if end < start:` and inside `raise ValueError(f"end ({end}) is before start ({start})")`.'],
      solution: 'def duration(start, end):\n    if end < start:\n        raise ValueError(f"end ({end}) is before start ({start})")\n    return end - start + 1\n'
    },
    {
      id: 'e3',
      title: 'A batch that does not break',
      prompt: 'Write `process(shots)`: it takes `{shot: frames_text}` and returns `(ok, errors)`:\n\n- `ok`: dict `{shot: frames}` with the ones that could be converted.\n- `errors`: **sorted** list of the names of the shots that failed.\n\nAn error in one shot must not stop the others.',
      starter: 'def process(shots):\n    # your code\n    pass\n',
      tests: [
        { check: "process({'a': '10', 'b': 'x', 'c': '30', 'd': ''}) == ({'a': 10, 'c': 30}, ['b', 'd'])", msg: 'separates the good ones from the failures' },
        { check: "process({}) == ({}, [])", msg: 'no shots returns ({}, [])' }
      ],
      hints: ['Put the `try` / `except ValueError` inside the `for`.', 'At the end: `return ok, sorted(errors)`.'],
      solution: 'def process(shots):\n    ok, errors = {}, []\n    for shot, text in shots.items():\n        try:\n            ok[shot] = int(text)\n        except ValueError:\n            errors.append(shot)\n    return ok, sorted(errors)\n'
    }
  ],

  summary: [
    '`try` / `except SomeError` catches only what you expect; never a bare `except:`.',
    '`finally` always runs; `raise ValueError(...)` flags impossible data.',
    'In batches: catch per item, store the error with context and keep going.'
  ]
});
