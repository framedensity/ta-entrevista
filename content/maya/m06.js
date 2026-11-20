(function () {
var SETUP = [
  'from maya import cmds as _c',
  '_c.spaceLocator(name="door_ctrl")',
  '_c.polyCube(name="door_geo")',
  '_c.polyCube(name="lid_geo")',
  '_c.connectAttr("door_ctrl.rotateY", "lid_geo.rotateX")',
  '_c.connectAttr("door_ctrl.translateY", "lid_geo.translateY")'
].join('\n') + '\n';
var FILES = 'Scene:\n  door_ctrl (locator)\n  door_geo  (mesh)\n  lid_geo   (mesh)\nExisting connections:\n  door_ctrl.rotateY    → lid_geo.rotateX\n  door_ctrl.translateY → lid_geo.translateY';

TA.add({
  id: 'm06',
  title: 'Connections',

  explain: [
    'An attribute can **receive** its value from another attribute. That is a **connection**. It is the basis of rigs: a control moves a door, an expression spins a wheel.',
    { type: 'analogy', text: 'a connection is a water pipe: the value flows from the **source** to the **destination**. Once a pipe feeds a tap, you can no longer fill it by hand.' },
    '```python\ncmds.connectAttr("door_ctrl.rotateY", "door_geo.rotateY")\n```',
    'Now, when you rotate `door_ctrl`, the door rotates with it.',
    { type: 'warn', text: 'an attribute with an **incoming** connection can no longer be changed with `setAttr`: it raises an error. And you cannot connect a second input to it, except with `force=True` (which replaces the old one).' },
    '### Asking about connections: listConnections',
    '- `source=True, destination=False` → only what comes **in**.\n- `source=False, destination=True` → only what goes **out**.\n- `plugs=True` → returns `"node.attribute"` instead of just the node.\n- If there is nothing → `None` (again).',
    '`cmds.disconnectAttr(source, destination)` cuts the pipe.',
    { type: 'cg', text: 'before exporting a door\'s animation, the exporter checks whether `door_geo.rotateY` is connected. If it is, the values have to be **baked**, because FBX does not store the connection.' }
  ],

  example: {
    intro: 'We explore the pipes going into `lid_geo`.',
    lines: [
      { code: 'from maya import cmds', note: 'We import.' },
      { code: 'print(cmds.listConnections("lid_geo", source=True, destination=False, plugs=True))', note: 'What comes into `lid_geo`, as `node.attribute`.' },
      { code: 'print(cmds.listConnections("lid_geo.rotateX", plugs=True))', note: 'You can also ask about a specific attribute.' },
      { code: 'try:\n    cmds.setAttr("lid_geo.rotateX", 10)\nexcept RuntimeError as e:\n    print("Error:", e)', note: 'You cannot write to a connected attribute.' },
      { code: 'print(cmds.listConnections("door_geo"))', note: 'No connections → `None`.' }
    ],
    output: "['door_ctrl.rotateY', 'door_ctrl.translateY']\n['door_ctrl.rotateY']\nError: setAttr: The attribute 'lid_geo.rotateX' is locked or connected and cannot be modified.\nNone"
  },

  mini: [
    {
      q: 'You connect `a.tx → b.tx`. What happens with `cmds.setAttr("b.tx", 5)`?',
      options: ['b.tx becomes 5', 'It raises an error: the attribute is connected', 'a.tx also becomes 5'],
      answer: 1,
      why: 'The connection decides b.tx\'s value. You have to disconnect first.'
    },
    {
      q: 'Which `listConnections` option gives `"node.attribute"` instead of just the node?',
      options: ['`long=True`', '`plugs=True`', '`fullPath=True`'],
      answer: 1,
      why: 'A *plug* is the node + attribute combination.'
    }
  ],

  exercises: [
    {
      id: 'e1',
      title: 'Wiring the door',
      prompt: 'Connect `door_ctrl.rotateY` to `door_geo.rotateY`.',
      setup: SETUP, files: FILES,
      starter: 'from maya import cmds\n\n',
      tests: [{ check: "cmds.isConnected('door_ctrl.rotateY', 'door_geo.rotateY')", msg: 'door_ctrl.rotateY → door_geo.rotateY' }],
      hints: ['`cmds.connectAttr(source, destination)`'],
      solution: 'from maya import cmds\n\ncmds.connectAttr("door_ctrl.rotateY", "door_geo.rotateY")\n'
    },
    {
      id: 'e2',
      title: 'What drives this node?',
      prompt: 'Write `inputs(node)`: return a **sorted** list of the plugs (`"node.attribute"`) that come **into** the node. Empty list if there are none.',
      setup: SETUP, files: FILES,
      starter: 'from maya import cmds\n\ndef inputs(node):\n    # your code\n    pass\n',
      tests: [
        { check: "inputs('lid_geo') == ['door_ctrl.rotateY', 'door_ctrl.translateY']", msg: 'lid_geo receives two connections' },
        { check: "inputs('door_geo') == []", msg: 'door_geo receives nothing → []' }
      ],
      hints: ['`cmds.listConnections(node, source=True, destination=False, plugs=True)`', 'Remember the `or []` and the `sorted`.'],
      solution: 'from maya import cmds\n\ndef inputs(node):\n    return sorted(cmds.listConnections(node, source=True, destination=False, plugs=True) or [])\n'
    },
    {
      id: 'e3',
      title: 'Freeing an attribute',
      prompt: 'Write `free_attr(plug)`: if `plug` (for example `"lid_geo.rotateX"`) has an incoming connection, disconnect it. Return the source plug that was disconnected, or `None` if there was none.',
      setup: SETUP, files: FILES,
      starter: 'from maya import cmds\n\ndef free_attr(plug):\n    # your code\n    pass\n',
      tests: [
        { check: "free_attr('lid_geo.rotateX') == 'door_ctrl.rotateY'", msg: 'returns the disconnected source' },
        { check: "free_attr('lid_geo.rotateX') is None", msg: 'if there is no connection any more, returns None' },
        { check: "(cmds.setAttr('lid_geo.rotateX', 10), cmds.getAttr('lid_geo.rotateX'))[1] == 10", msg: 'now the attribute can be written' }
      ],
      hints: ['`source = cmds.listConnections(plug, source=True, destination=False, plugs=True)`', 'If there is a source: `cmds.disconnectAttr(source[0], plug)` and return it.'],
      solution: 'from maya import cmds\n\ndef free_attr(plug):\n    source = cmds.listConnections(plug, source=True, destination=False, plugs=True)\n    if not source:\n        return None\n    cmds.disconnectAttr(source[0], plug)\n    return source[0]\n'
    }
  ],

  summary: [
    '`connectAttr(source, destination)`: the value flows from source to destination.',
    'An attribute with an input does not accept `setAttr`; `disconnectAttr` frees it.',
    '`listConnections(source=, destination=, plugs=)`; it returns `None` when there is nothing.'
  ]
});
})();
