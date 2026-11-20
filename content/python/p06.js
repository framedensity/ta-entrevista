TA.add({
  id: 'p06',
  title: 'Pattern: comparing lists and dicts',

  explain: [
    'Comparing two collections is **the most common task** in a TA tool. What is missing? What is extra? What changed between version 1 and version 2?',
    { type: 'analogy', text: 'it is like comparing your shopping list with what is in the fridge. What is on the list but not in the fridge is missing. What is in the fridge but not on the list is extra.' },
    '### The slow way (and the one you should not give in an interview)',
    { type: 'compare',
      badTitle: 'Loop inside a loop: n × m comparisons',
      bad: 'missing = []\nfor x in expected:\n    found = False\n    for y in actual:\n        if x == y:\n            found = True\n    if not found:\n        missing.append(x)',
      goodTitle: 'With a set: n + m steps',
      good: 'actual_set = set(actual)\nmissing = [x for x in expected if x not in actual_set]',
      note: 'With 10,000 items in each list, the slow way does 100 million comparisons. The fast one, about 20,000.' },
    'Look at the fast version: we use a **list comprehension** with `if x not in ...`. That **keeps the order** of `expected`. With `set(a) - set(b)` the order is lost.',
    '### Comparing dictionaries',
    'Dictionary keys behave like a set. You can do `d1.keys() & d2.keys()` directly.',
    '- **New** keys: `d2.keys() - d1.keys()`\n- **Removed** keys: `d1.keys() - d2.keys()`\n- Keys whose value **changed**: the shared ones where `d1[k] != d2[k]`',
    { type: 'cg', text: 'comparing a rig\'s attributes between two versions: `{"ikFk": 1, "stretch": 0}` vs `{"ikFk": 0, "stretch": 0, "twist": 1}`. `ikFk` changed and `twist` appeared.' },
    { type: 'tip', text: 'always mention complexity: “I turn the second list into a set so lookups are O(1), which makes the whole thing O(n + m) instead of O(n × m)”.' }
  ],

  example: {
    intro: 'We compare a control\'s attributes between two versions of the rig.',
    lines: [
      { code: 'v1 = {"ikFk": 1, "stretch": 0, "space": "world"}', note: 'Previous version.' },
      { code: 'v2 = {"ikFk": 0, "stretch": 0, "twist": 1}', note: 'New version.' },
      { code: 'added = sorted(v2.keys() - v1.keys())', note: 'Keys only in v2 → `["twist"]`.' },
      { code: 'removed = sorted(v1.keys() - v2.keys())', note: 'Keys only in v1 → `["space"]`.' },
      { code: 'changed = {k: (v1[k], v2[k]) for k in v1.keys() & v2.keys() if v1[k] != v2[k]}', note: 'We walk only the shared keys and store (before, after) if the value changed.' },
      { code: 'print(added, removed, changed)', note: 'The result of the “diff”.' }
    ],
    output: "['twist'] ['space'] {'ikFk': (1, 0)}"
  },

  mini: [
    {
      q: '`expected` and `actual` have 10,000 names each. What is the best way to find what is missing, **keeping the order** of `expected`?',
      options: ['Two nested `for` loops', '`sorted(set(expected) - set(actual))`', '`s = set(actual)` and `[x for x in expected if x not in s]`'],
      answer: 2,
      why: 'It is fast (the `in` is against a set) and keeps the original order. The `sorted` option changes the order to alphabetical.'
    },
    {
      q: 'What does `{"a": 1, "b": 2}.keys() & {"b": 5, "c": 3}.keys()` return?',
      options: ['`{"b"}`', '`{"a", "b", "c"}`', 'An error: keys are not a set'],
      answer: 0,
      why: 'Key views (`.keys()`) support set operations. The shared key is `"b"`.'
    }
  ],
  extra: [
    {
      q: 'What is the complexity of comparing two lists with two nested loops?',
      options: ['O(n + m)', 'O(n × m)', 'O(1)'],
      answer: 1,
      why: 'For each item of the first list you walk the whole second list: n × m.'
    }
  ],

  exercises: [
    {
      id: 'e1',
      title: 'A compare function',
      prompt: 'Write the function `compare(expected, actual)`. It must return **two sorted lists**: `(missing, extra)`.\n\n- `missing`: in `expected` but not in `actual`.\n- `extra`: in `actual` but not in `expected`.',
      starter: 'def compare(expected, actual):\n    # your code\n    pass\n',
      tests: [
        { check: "compare(['a', 'b', 'c'], ['b', 'c', 'd']) == (['a'], ['d'])", msg: "compare(['a','b','c'], ['b','c','d']) gives (['a'], ['d'])" },
        { check: "compare(['x'], ['x']) == ([], [])", msg: 'if they match, it returns two empty lists' },
        { check: "compare(['c', 'a'], []) == (['a', 'c'], [])", msg: 'the lists come out sorted' }
      ],
      hints: ['Convert both to `set` at the start.', '`return sorted(e - a), sorted(a - e)`'],
      solution: 'def compare(expected, actual):\n    e = set(expected)\n    a = set(actual)\n    return sorted(e - a), sorted(a - e)\n'
    },
    {
      id: 'e2',
      title: 'Missing, in script order',
      prompt: 'Create `missing`: the script\'s shots that have not been exported, **in the same order as the script** (not alphabetical).',
      starter: 'script = ["sh050", "sh010", "sh030", "sh020", "sh040"]\nexported = ["sh010", "sh040", "sh099"]\n\n',
      tests: [{ check: "missing == ['sh050', 'sh030', 'sh020']", msg: '`missing` keeps the script order' }],
      hints: ['First `done = set(exported)`.', 'Then a comprehension: `[s for s in script if s not in done]`.'],
      solution: 'script = ["sh050", "sh010", "sh030", "sh020", "sh040"]\nexported = ["sh010", "sh040", "sh099"]\n\ndone = set(exported)\nmissing = [s for s in script if s not in done]\n'
    },
    {
      id: 'e3',
      title: 'What changed in the rig',
      prompt: 'Create `changed`: a dictionary with the **shared** keys whose value changed. The value must be the pair `(before, after)`.\n\nAlso create `added` (sorted list of keys only in `v2`).',
      starter: 'v1 = {"ikFk": 1, "stretch": 0, "squash": 1, "space": "world"}\nv2 = {"ikFk": 0, "stretch": 0, "squash": 0, "twist": 1}\n\n',
      tests: [
        { check: "changed == {'ikFk': (1, 0), 'squash': (1, 0)}", msg: '`changed` has ikFk and squash with (before, after)' },
        { check: "added == ['twist']", msg: '`added` is ["twist"]' }
      ],
      hints: ['The shared keys are `v1.keys() & v2.keys()`.', '`{k: (v1[k], v2[k]) for k in v1.keys() & v2.keys() if v1[k] != v2[k]}`'],
      solution: 'v1 = {"ikFk": 1, "stretch": 0, "squash": 1, "space": "world"}\nv2 = {"ikFk": 0, "stretch": 0, "squash": 0, "twist": 1}\n\nchanged = {k: (v1[k], v2[k]) for k in v1.keys() & v2.keys() if v1[k] != v2[k]}\nadded = sorted(v2.keys() - v1.keys())\n'
    }
  ],

  summary: [
    'To compare, turn one collection into a `set`: O(n + m) instead of O(n × m).',
    'To keep the order: `[x for x in a if x not in set_b]`.',
    'For dicts: `d.keys()` supports `&`, `-`, `|`; compare values only on the shared keys.'
  ]
});
