TA.add({
  id: 'm10',
  title: 'UI with PySide',

  explain: [
    'Maya tools usually have a window built with **PySide** (Qt for Python). Maya 2025 uses PySide6; earlier versions, PySide2. The code is almost the same.',
    { type: 'analogy', text: 'the UI is a car\'s dashboard: buttons and levers. The engine is your logic (the functions from the earlier lessons). The dashboard only **calls** the engine; it should not contain the engine.' },
    '### The Qt pieces',
    '- **Widgets**: `QPushButton` (button), `QLineEdit` (text), `QListWidget` (list), `QCheckBox`…\n- **Layouts**: they arrange the widgets: `QVBoxLayout` (in a column), `QHBoxLayout` (in a row).\n- **Signals and slots**: a widget emits a **signal** (`clicked`) and you connect it to a function (the **slot**).',
    '```python\nbutton = QtWidgets.QPushButton("Check")\nbutton.clicked.connect(self.check)\n```',
    '### A window parented to Maya',
    'If the window does not have Maya as its **parent**, it hides behind Maya when you click outside it. You get Maya\'s main window with `shiboken` and `OpenMayaUI`.',
    '```python\nimport maya.OpenMayaUI as omui\nfrom shiboken6 import wrapInstance\nfrom PySide6 import QtWidgets\n\ndef maya_window():\n    ptr = omui.MQtUtil.mainWindow()\n    return wrapInstance(int(ptr), QtWidgets.QWidget)\n```',
    '### The golden rules',
    '- **Separate logic and UI**: the window calls `check(nodes)`, which knows nothing about Qt. That way the same logic works in a batch with no window.\n- **A single instance**: if the artist opens the tool twice, close the previous one (or reuse it).\n- **Do not freeze Maya**: for long processes, show progress (`QProgressDialog`) and allow cancelling.\n- **Object name** (`setObjectName`) to find and close the old window.',
    { type: 'cg', text: 'a cinematics exporter: a list of shots with checkboxes, an «Export selected» button and a progress bar. Under the hood, each shot is exported by the same function the render farm uses without a UI.' },
    { type: 'tip', text: 'if they ask about PySide, what scores best is not knowing every widget, but saying: «I separate logic from UI; the UI only collects parameters and shows results».' },
    'This lesson has no simulator: the exercises are written answers.'
  ],

  example: {
    intro: 'A minimal window that calls the checker logic.',
    lines: [
      { label: 'Imports', code: 'from PySide6 import QtWidgets\nfrom shiboken6 import wrapInstance\nimport maya.OpenMayaUI as omui\nfrom maya import cmds\nfrom my_tools import checker  # the logic, no Qt', note: 'The logic lives in another module.' },
      { label: 'The window', code: 'class Window(QtWidgets.QDialog):\n    def __init__(self, parent=None):\n        super().__init__(parent)\n        self.setObjectName("checker_ui")\n        self.setWindowTitle("Naming checker")\n        self.results = QtWidgets.QListWidget()\n        button = QtWidgets.QPushButton("Check selection")\n        button.clicked.connect(self.check)\n        layout = QtWidgets.QVBoxLayout(self)\n        layout.addWidget(button)\n        layout.addWidget(self.results)', note: 'Widgets in a vertical layout. The `clicked` signal goes to the `check` method.' },
      { label: 'The slot', code: '    def check(self):\n        nodes = cmds.ls(sl=True, long=True)\n        problems = checker.check(nodes)\n        self.results.clear()\n        self.results.addItems([f"{n}: {reason}" for n, reason in problems.items()])', note: 'The UI collects the selection, calls the logic and shows the result. Nothing more.' },
      { label: 'Open only once', code: '_window = None\n\ndef show():\n    global _window\n    if _window is not None:\n        _window.close()\n        _window.deleteLater()\n    parent = wrapInstance(int(omui.MQtUtil.mainWindow()), QtWidgets.QWidget)\n    _window = Window(parent)\n    _window.show()', note: 'Closes the previous window and creates the new one with Maya as parent.' }
    ]
  },

  mini: [
    {
      q: 'What is the point of making Maya your window\'s parent?',
      options: ['To make it faster', 'So it does not hide behind Maya and closes with it', 'Buttons do not work otherwise'],
      answer: 1,
      why: 'A child window stays in front of Maya and is managed along with it.'
    },
    {
      q: 'What does `button.clicked.connect(self.check)` connect?',
      options: ['One Maya attribute to another', 'The button\'s click signal to the `check` method (the slot)', 'Two windows'],
      answer: 1,
      why: 'Signals and slots: when the button emits `clicked`, Qt calls `check`.'
    }
  ],

  exercises: [
    {
      id: 'e1',
      kind: 'free',
      title: 'Design the exporter window',
      prompt: 'Describe (or write in code) the UI of a cinematics exporter: which widgets it would have, how the code would be organized and how it would behave on a 30-shot export.',
      checklist: [
        'A list of shots with checkboxes or multi-select (`QListWidget` / `QTreeWidget`).',
        'Clear options (output folder, format) with defaults from the config.',
        'The export logic lives in functions/classes with no Qt; the UI only calls them.',
        'A progress bar (`QProgressDialog`) and the option to cancel long batches.',
        'A final report: which shots went fine and which failed, with the reason.',
        'Window parented to Maya and only one instance open.'
      ],
      model: '**Widgets:** a `QTreeWidget` with the shots (checkbox, name, frame range, camera), a `QLineEdit` + button for the output folder, a `QComboBox` for the format, and «Check» and «Export» buttons.\n\n**Code:**\n- `exporter.py`: pure functions (`plan`, `validate`, `export_shot`), no Qt.\n- `exporter_ui.py`: the window. It collects parameters, calls the logic and shows results.\n\n**30-shot batch:** a `QProgressDialog` that advances per shot and can be cancelled. Each shot runs in a `try/except`: if one fails, it is logged with `logging` and the batch continues. At the end, a summary «28 OK, 2 with errors (and why)».\n\n**Details:** the window is parented to Maya, has an `objectName` so the old one closes on reopen, and remembers the last folder used (`QSettings`).',
      followups: ['How would you keep Maya from freezing during the export?', 'How would you reuse the logic on the farm, with no UI?', 'What would you store in `QSettings`?']
    },
    {
      id: 'e2',
      kind: 'free',
      title: 'What would you improve in this code?',
      prompt: 'A teammate wrote this. Point out the problems and how you would fix them:\n\n```python\ndef open_tool():\n    w = QtWidgets.QWidget()\n    b = QtWidgets.QPushButton("Hide", w)\n    def hide():\n        for n in cmds.ls(sl=True):\n            cmds.setAttr(n + ".visibility", 0)\n    b.clicked.connect(hide)\n    w.show()\n```',
      checklist: [
        'The window has no parent (Maya): it hides behind Maya and can get lost.',
        '`w` is a local variable: Python may delete the window when the function returns. It has to be kept (in a global or attribute).',
        'Every call opens another window: there is no single-instance control.',
        'The logic (`hide`) lives inside the UI and depends on the selection: better a function that takes nodes.',
        'No undo chunk: hiding 50 nodes takes 50 Ctrl+Z.',
        'No layout: the button is placed by hand.'
      ],
      model: 'Problems: no parent, a local window (it can delete itself), several instances, logic mixed into the UI and dependent on the selection, no undo chunk, no layout.\n\n```python\ndef hide(nodes):\n    with undo_chunk():\n        for n in nodes:\n            if cmds.objExists(n):\n                cmds.setAttr(n + ".visibility", False)\n\nclass HideUI(QtWidgets.QDialog):\n    def __init__(self, parent=None):\n        super().__init__(parent)\n        self.setObjectName("hide_ui")\n        button = QtWidgets.QPushButton("Hide selection")\n        button.clicked.connect(lambda: hide(cmds.ls(sl=True, long=True)))\n        QtWidgets.QVBoxLayout(self).addWidget(button)\n\n_ui = None\ndef open_tool():\n    global _ui\n    if _ui:\n        _ui.close()\n    _ui = HideUI(maya_window())\n    _ui.show()\n```',
      followups: ['Why does the window sometimes vanish right after opening?', 'How would you test `hide` without opening the window?']
    }
  ],

  summary: [
    'Widgets + layouts + signals/slots (`button.clicked.connect(func)`).',
    'Window parented to Maya (`wrapInstance` + `MQtUtil.mainWindow()`), a single instance, kept outside the function.',
    'The UI only collects parameters and shows results; the logic lives elsewhere and works without a window.'
  ]
});
