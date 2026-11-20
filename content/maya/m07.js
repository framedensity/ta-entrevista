(function () {
var SETUP = [
  'from maya import cmds as _c',
  '_c.spaceLocator(name="ball_ctrl")',
  '_c.setKeyframe("ball_ctrl", attribute="translateY", time=1, value=0)',
  '_c.setKeyframe("ball_ctrl", attribute="translateY", time=12, value=10)',
  '_c.setKeyframe("ball_ctrl", attribute="translateY", time=24, value=0)',
  '_c.spaceLocator(name="cam_target")',
  '_c.playbackOptions(minTime=1, maxTime=24)'
].join('\n') + '\n';
var FILES = 'Scene:\n  ball_ctrl  translateY keys: frame 1 → 0, frame 12 → 10, frame 24 → 0\n  cam_target no animation\nPlayback range: 1 – 24';

TA.add({
  id: 'm07',
  title: 'Keyframes',

  explain: [
    'Animation in Maya is **keyframes** (keys): values stored on specific frames. Between two keys, Maya computes the in-between values.',
    { type: 'analogy', text: 'keys are the flipbook drawings you make yourself. Maya draws the pages in between (the **interpolation**).' },
    '### Setting keys',
    '```python\ncmds.setKeyframe("ball_ctrl", attribute="translateY", time=1, value=0)\ncmds.setKeyframe("ball_ctrl", attribute="translateY", time=12, value=10)\n```',
    'Without `value=`, it stores the current value. Without `time=`, it uses the current frame (`cmds.currentTime()`).',
    '### Asking about keys: keyframe with query',
    '- `cmds.keyframe(node, attribute="ty", query=True, timeChange=True)` → the keyed frames.\n- `... valueChange=True` → the values.\n- `... keyframeCount=True` → how many keys there are.\n- No keys → `None` (yes, again).',
    '### Reading the value on any frame',
    '`cmds.getAttr("ball_ctrl.translateY", time=6)` gives the value on frame 6 **without moving** the timeline. It is much faster than stepping `currentTime` frame by frame.',
    { type: 'compare',
      badTitle: 'Moving time every frame (slow: Maya re-evaluates the scene)',
      bad: 'for f in range(1, 25):\n    cmds.currentTime(f)\n    values.append(cmds.getAttr("ball_ctrl.ty"))',
      goodTitle: 'Reading with time= (the scene does not move)',
      good: 'values = [cmds.getAttr("ball_ctrl.ty", time=f) for f in range(1, 25)]' },
    '`cmds.playbackOptions(query=True, minTime=True)` and `maxTime=True` give the shot range.',
    { type: 'cg', text: 'a cinematics exporter reads each shot\'s range, checks there are keys inside it and **bakes** the values frame by frame before exporting.' }
  ],

  example: {
    intro: 'We look at the ball\'s animation.',
    lines: [
      { code: 'from maya import cmds', note: 'We import.' },
      { code: 'print(cmds.keyframe("ball_ctrl", attribute="ty", query=True, timeChange=True))', note: 'Keyed frames.' },
      { code: 'print(cmds.keyframe("ball_ctrl", attribute="ty", query=True, valueChange=True))', note: 'The values of those keys.' },
      { code: 'print(cmds.getAttr("ball_ctrl.ty", time=6))', note: 'On frame 6, halfway up (the simulator interpolates in a straight line).' },
      { code: 'print(cmds.keyframe("cam_target", query=True, keyframeCount=True))', note: 'No animation: 0 keys.' }
    ],
    output: '[1.0, 12.0, 24.0]\n[0.0, 10.0, 0.0]\n4.545454545454546\n0'
  },

  mini: [
    {
      q: 'What is the fast way to read an attribute\'s value over 200 frames?',
      options: ['Change `currentTime` every frame and use `getAttr`', 'Use `getAttr(..., time=f)` for each frame', 'Export to FBX and read the file'],
      answer: 1,
      why: 'With `time=`, the whole scene is not re-evaluated on every frame.'
    },
    {
      q: 'What does `keyframe(..., query=True, timeChange=True)` return on a node with no keys?',
      options: ['`[]`', '`None`', '`0`'],
      answer: 1,
      why: 'Like `listRelatives`: `None` when there are no results. Use `or []`.'
    }
  ],

  exercises: [
    {
      id: 'e1',
      title: 'Animating the camera target',
      prompt: 'Animate `cam_target.translateX`: value `0` on frame `1` and value `5` on frame `24`.',
      setup: SETUP, files: FILES,
      starter: 'from maya import cmds\n\n',
      tests: [
        { check: "cmds.keyframe('cam_target', attribute='translateX', query=True, timeChange=True) == [1.0, 24.0]", msg: 'keys on frames 1 and 24' },
        { check: "cmds.keyframe('cam_target', attribute='translateX', query=True, valueChange=True) == [0.0, 5.0]", msg: 'values 0 and 5' }
      ],
      hints: ['`cmds.setKeyframe("cam_target", attribute="translateX", time=1, value=0)`', 'And another one like it for frame 24.'],
      solution: 'from maya import cmds\n\ncmds.setKeyframe("cam_target", attribute="translateX", time=1, value=0)\ncmds.setKeyframe("cam_target", attribute="translateX", time=24, value=5)\n'
    },
    {
      id: 'e2',
      title: 'Animated range',
      prompt: 'Write `key_range(node, attr)`: return `(first_frame, last_frame)` with a key, or `None` if there are no keys.',
      setup: SETUP, files: FILES,
      starter: 'from maya import cmds\n\ndef key_range(node, attr):\n    # your code\n    pass\n',
      tests: [
        { check: "key_range('ball_ctrl', 'translateY') == (1.0, 24.0)", msg: 'ball_ctrl.translateY goes from 1 to 24' },
        { check: "key_range('cam_target', 'translateX') is None", msg: 'no keys returns None' }
      ],
      hints: ['`times = cmds.keyframe(node, attribute=attr, query=True, timeChange=True)`', '`return (min(times), max(times)) if times else None`'],
      solution: 'from maya import cmds\n\ndef key_range(node, attr):\n    times = cmds.keyframe(node, attribute=attr, query=True, timeChange=True)\n    if not times:\n        return None\n    return min(times), max(times)\n'
    },
    {
      id: 'e3',
      title: 'Baking values',
      prompt: 'Write `bake(node, attr)`: return a dict `{frame: value}` for **every whole frame** in the playback range (`playbackOptions`), using `getAttr(..., time=f)`. Round the values to 2 decimals.',
      setup: SETUP, files: FILES,
      starter: 'from maya import cmds\n\ndef bake(node, attr):\n    # your code\n    pass\n',
      tests: [
        { check: "len(bake('ball_ctrl', 'translateY')) == 24", msg: 'one value per frame (24 frames)' },
        { check: "bake('ball_ctrl', 'translateY')[12] == 10.0 and bake('ball_ctrl', 'translateY')[1] == 0.0", msg: 'frame 12 = 10.0 and frame 1 = 0.0' },
        { check: "bake('ball_ctrl', 'translateY')[6] == 4.55", msg: 'frame 6 rounded = 4.55' }
      ],
      hints: ['`start = int(cmds.playbackOptions(query=True, minTime=True))` (and the same with `maxTime`).', '`{f: round(cmds.getAttr(f"{node}.{attr}", time=f), 2) for f in range(start, end + 1)}`'],
      solution: 'from maya import cmds\n\ndef bake(node, attr):\n    start = int(cmds.playbackOptions(query=True, minTime=True))\n    end = int(cmds.playbackOptions(query=True, maxTime=True))\n    return {f: round(cmds.getAttr(f"{node}.{attr}", time=f), 2) for f in range(start, end + 1)}\n'
    }
  ],

  summary: [
    '`setKeyframe(node, attribute=, time=, value=)` sets keys.',
    '`keyframe(query=True, timeChange/valueChange/keyframeCount)` queries them (`None` if there are none).',
    '`getAttr(plug, time=f)` reads any frame without moving the scene: fast for baking.'
  ]
});
})();
