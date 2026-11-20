TA.add({
  id: 'p01',
  title: 'Variables and data types',

  explain: [
    'A program needs to remember data. For example, the name of a camera or how many frames a shot lasts. To remember them, we use **variables**.',
    { type: 'analogy', text: 'a **variable** is a box with a label. Inside the box you keep a piece of data. With the label you find it again later.' },
    { type: 'figure', html:
      '<svg viewBox="0 0 330 120" role="img" aria-label="Three boxes with labels: camera, frames and fps">' +
      '<g font-family="ui-monospace,Menlo,monospace" font-size="13">' +
      '<rect x="8" y="34" width="96" height="58" rx="10" style="fill:var(--accbg);stroke:var(--acc)"/>' +
      '<rect x="20" y="18" width="72" height="24" rx="6" style="fill:var(--acc)"/><text x="56" y="35" text-anchor="middle" style="fill:var(--card)">camera</text>' +
      '<text x="56" y="74" text-anchor="middle" style="fill:var(--ink)">"cam_A"</text>' +
      '<rect x="117" y="34" width="96" height="58" rx="10" style="fill:var(--accbg);stroke:var(--acc)"/>' +
      '<rect x="129" y="18" width="72" height="24" rx="6" style="fill:var(--acc)"/><text x="165" y="35" text-anchor="middle" style="fill:var(--card)">frames</text>' +
      '<text x="165" y="74" text-anchor="middle" style="fill:var(--ink)">48</text>' +
      '<rect x="226" y="34" width="96" height="58" rx="10" style="fill:var(--accbg);stroke:var(--acc)"/>' +
      '<rect x="238" y="18" width="72" height="24" rx="6" style="fill:var(--acc)"/><text x="274" y="35" text-anchor="middle" style="fill:var(--card)">fps</text>' +
      '<text x="274" y="74" text-anchor="middle" style="fill:var(--ink)">24.0</text>' +
      '</g><text x="165" y="114" text-anchor="middle" font-size="12" style="fill:var(--mute)">label = name · inside = value</text></svg>' },
    'In Python you create a variable with the `=` sign. The name goes on the left. The value goes on the right.',
    'Careful! Here `=` does not mean «is equal to». It means «put this in this box».',
    '```python\nfps = 24\n```',
    '### Data types',
    'Every piece of data has a **data type**. The type says what kind of thing is in the box.',
    { type: 'analogy', text: 'a box of water is not the same as a box of letters. You cannot read water, and you cannot drink letters. Data works the same way.' },
    'The four basic types are:',
    '- `int` (integer, whole number): `48`\n- `float` (decimal number): `23.976`\n- `str` (string, text): `"cam_A"`. Text always goes in quotes.\n- `bool` (boolean): can only be `True` or `False`.',
    'If you do not know what is in a box, use `type()`. It tells you the type of the data.',
    { type: 'cg', text: 'a cutscene export tool stores the camera name (`str`), the start frame (`int`), the fps (`float`) and whether the shot is approved (`bool`).' }
  ],

  example: {
    intro: 'Let\'s store a shot\'s data and work out how long it lasts in seconds.',
    lines: [
      { code: 'camera = "cam_shot010"', note: 'We create the box `camera` and store some text (`str`).' },
      { code: 'frames = 48', note: 'We store a whole number (`int`): the shot is 48 frames long.' },
      { code: 'fps = 24.0', note: 'We store a decimal (`float`): 24 frames per second.' },
      { code: 'approved = True', note: 'We store a boolean (`bool`): the shot is approved.' },
      { code: 'seconds = frames / fps', note: 'We use two boxes to compute a new one. `/` divides. 48 / 24.0 = 2.0' },
      { code: 'print(camera, seconds)', note: '`print()` shows data on screen. If you give it several values, it separates them with a space.' },
      { code: 'print(type(frames))', note: '`type()` tells us the type. Here it is `int`.' }
    ],
    output: "cam_shot010 2.0\n<class 'int'>",
    outro: 'Notice: dividing with `/` always gives a `float` (that is why you get `2.0` and not `2`).'
  },

  mini: [
    {
      q: 'What does the line `fps = 24` do?',
      options: ['Stores the value 24 in a box called `fps`', 'Asks whether `fps` equals 24', 'Shows 24 on screen'],
      answer: 0,
      why: 'The `=` sign stores a value. To show something on screen you use `print()`.'
    },
    {
      q: 'What type is `"cam_A"`?',
      options: ['`int`', '`float`', '`str`', '`bool`'],
      answer: 2,
      why: 'It is in quotes, so it is text: a `str` (string).'
    }
  ],

  exercises: [
    {
      id: 'e1',
      title: 'Your first variable',
      prompt: 'Create a variable `camera` with the text `"cam_shot020"`.\n\nCreate another variable `frames` with the whole number `72`.',
      starter: '# Write your code here\n',
      tests: [
        { check: "camera == 'cam_shot020'", msg: '`camera` holds the text "cam_shot020"' },
        { check: "frames == 72 and type(frames) is int", msg: '`frames` holds the integer 72' }
      ],
      hints: ['Text goes in quotes: `"cam_shot020"`.', 'A whole number is written without quotes or a dot: `72`.'],
      solution: 'camera = "cam_shot020"\nframes = 72\n'
    },
    {
      id: 'e2',
      title: 'From frames to seconds',
      prompt: 'You already have `frames` and `fps`.\n\nCreate the variable `seconds` by dividing `frames` by `fps`. Then show `seconds` with `print()`.',
      starter: 'frames = 96\nfps = 24\n\n',
      tests: [
        { check: 'seconds == 4', msg: '`seconds` is 4.0' },
        { check: "'4.0' in _out", msg: '`4.0` is shown on screen' }
      ],
      hints: ['Dividing is `/`.', 'First `seconds = frames / fps`, and on another line `print(seconds)`.'],
      solution: 'frames = 96\nfps = 24\n\nseconds = frames / fps\nprint(seconds)\n'
    },
    {
      id: 'e3',
      title: 'Is it a valid shot?',
      prompt: 'A shot is valid if it has more than 0 frames.\n\nThe comparison `>` (greater than) gives `True` or `False`. Create the variable `is_valid` with the result of `frames > 0`.',
      starter: 'frames = 30\n\n',
      tests: [
        { check: 'is_valid is True', msg: '`is_valid` is `True`' },
        { check: "type(is_valid) is bool", msg: '`is_valid` is a `bool`' }
      ],
      hints: ['Do not type `True` by hand: let Python work it out with the comparison.', '`is_valid = frames > 0`'],
      solution: 'frames = 30\n\nis_valid = frames > 0\n'
    }
  ],

  summary: [
    'A **variable** is a labeled box: `name = value`.',
    'The basic types are `int`, `float`, `str` and `bool`. `type()` tells you which one.',
    'As a TA you use variables to store shot, camera and frame data.'
  ]
});
