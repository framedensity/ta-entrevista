# Explanations for every external name used in the tools.
# Keys: canonical module path (maya.cmds.keyframe), Qt class (QtWidgets.QLabel),
# builtins.<name>, or method.<name> for a method called on an object.
G = {}


def add(keys, text):
    for k in keys.split():
        G[k] = text


# ----------------------------------------------------------------- maya.cmds
add('maya.cmds', 'The Maya Python commands module. Every MEL command is available as a Python function: `cmds.ls(...)`, `cmds.setKeyframe(...)`.')
add('maya.cmds.ls', '`ls` lists nodes. `selection=True` gives the selection, `type=` filters by node type, `long=True` returns full DAG paths (unique even if short names repeat). Returns `[]` or `None` depending on flags, so code adds `or []`.')
add('maya.cmds.objExists', 'True if a node or a `node.attribute` plug exists. Used before reading or writing so a missing node does not raise.')
add('maya.cmds.getAttr', 'Reads an attribute value. `time=` reads the value at another frame without moving the timeline, which is much faster than changing `currentTime`. Compound attributes such as `translate` return `[(x, y, z)]`.')
add('maya.cmds.setAttr', 'Writes an attribute value. Raises if the attribute is locked or has an incoming connection (for example an animation curve on a layer or a constraint).')
add('maya.cmds.setKeyframe', 'Sets a key. With `value=` and `time=` it keys a specific value at a specific frame without changing the current pose. `breakdown=True` marks it as a breakdown key; `animLayer=` keys on that layer.')
add('maya.cmds.keyframe', 'Queries or edits keys. With `query=True`: `timeChange=True` returns key times, `valueChange=True` key values, `keyframeCount=True` the count, `name=True` the animCurve nodes. Without query it moves or changes keys (`valueChange=`, `timeChange=`, `relative=`). Returns `None` when there are no keys.')
add('maya.cmds.keyTangent', 'Queries or sets tangents: `inTangentType`/`outTangentType` (spline, linear, flat, fixed, ...), `inAngle`/`outAngle`, `inWeight`/`outWeight`, and `lock` (whether in and out move together).')
add('maya.cmds.copyKey', 'Copies keys to Maya\'s key clipboard (the same one the Graph Editor uses), keeping values, tangents and key types.')
add('maya.cmds.pasteKey', 'Pastes keys from the key clipboard. `option="replace"` replaces existing keys in the pasted range; `time=` sets where they land.')
add('maya.cmds.cutKey', 'Deletes keys (and optionally copies them to the clipboard). With `clear=True` it only deletes.')
add('maya.cmds.setInfinity', 'Sets what a curve does before its first key and after its last: `constant`, `linear`, `cycle`, `cycleRelative` or `oscillate`.')
add('maya.cmds.currentTime', 'Gets (`query=True`) or sets the current frame. Setting it re-evaluates the whole scene, which is slow inside loops.')
add('maya.cmds.playbackOptions', 'Gets or sets the timeline: `minTime`/`maxTime` (playback range), `animationStartTime`/`animationEndTime`, playback speed and looping.')
add('maya.cmds.xform', 'Queries or sets a transform. `worldSpace=True` works in world space, so it handles any parent hierarchy. Flags: `translation`, `rotation`, `scale`, `matrix`, `rotatePivot`.')
add('maya.cmds.listAttr', 'Lists attribute names on a node. `keyable=True` gives channel box keyables, `unlocked=True` drops locked ones, `userDefined=True` only custom attributes.')
add('maya.cmds.attributeQuery', 'Asks about an attribute\'s definition rather than its value: `exists`, `listDefault` (the default value), `minimum`/`maximum`, `listEnum`, and so on.')
add('maya.cmds.undoInfo', 'Controls undo. `openChunk=True` ... `closeChunk=True` groups everything in between into one undo step. `stateWithoutFlush=False` can pause undo recording for speed.')
add('maya.cmds.warning', 'Prints a yellow warning in the command line and Script Editor without stopping the script.')
add('maya.cmds.error', 'Prints a red error and raises `RuntimeError`, stopping the script.')
add('maya.cmds.optionVar', 'Reads and writes **optionVars**: small values (strings, numbers, lists) saved in Maya\'s user preferences, so they survive restarts. Good for tool settings.')
add('maya.cmds.workspaceControl', 'The container Maya uses for dockable panels. Querying `exists` and deleting it is how tools make sure only one copy of their window is open.')
add('maya.cmds.deleteUI', 'Deletes a Maya UI element (window, workspace control, menu, ...) by name.')
add('maya.cmds.inViewMessage', 'Shows a short message that fades out in the viewport. `amg=` is the text, `pos=` where it appears.')
add('maya.cmds.confirmDialog', 'A modal message box with buttons. Returns the label of the button the user pressed.')
add('maya.cmds.internalVar', 'Returns Maya\'s internal folders. `userScriptDir=True` is the user scripts folder where `userSetup.py` lives.')
add('maya.cmds.shelfButton', 'Creates a button on a shelf. `command=` is the code to run and `sourceType="python"` says it is Python, not MEL.')
add('maya.cmds.tabLayout', 'A tab layout control (old Maya UI). Here it is queried to find the currently selected shelf tab.')
add('maya.cmds.select', 'Changes the selection. `clear=True` empties it; `add=True` adds to it.')
add('maya.cmds.listRelatives', 'Lists parents, children, shapes or descendants. Returns `None` (not `[]`) when nothing is found, which is why tools write `or []`.')
add('maya.cmds.nodeType', 'Returns the type of a node: `transform`, `joint`, `mesh`, `animCurveTA`, ...')
add('maya.cmds.createNode', 'Creates a node of any type and returns its real name (Maya may add a number if the name is taken).')
add('maya.cmds.delete', 'Deletes nodes. With keys or channels it can also delete history, constraints or static channels depending on the flags.')
add('maya.cmds.rename', 'Renames a node and returns the name it actually got.')
add('maya.cmds.parent', 'Parents nodes; `world=True` unparents them.')
add('maya.cmds.connectAttr', 'Connects two plugs so the destination takes its value from the source.')
add('maya.cmds.disconnectAttr', 'Removes a connection between two plugs.')
add('maya.cmds.listConnections', 'Lists what a node or plug is connected to. `source`/`destination` pick the direction, `plugs=True` returns `node.attr` strings. Returns `None` when empty.')
add('maya.cmds.addAttr', 'Adds a custom attribute to a node. Text attributes need `dataType="string"`.')
add('maya.cmds.file', 'The scene file command: open, save, new, import, reference, query the scene name. Used heavily in batch scripts.')
add('maya.cmds.playblast', 'Captures the viewport frame by frame to images or a movie. `viewer=False` stops Maya from opening a player afterwards.')
add('maya.cmds.refresh', 'Forces a viewport redraw. `suspend=True` pauses redraws during heavy loops to make them much faster.')
add('maya.cmds.dgdirty', 'Marks nodes as needing re-evaluation so Maya recomputes them instead of using a cached value.')
add('maya.cmds.animLayer', 'Creates, edits and queries animation layers: add objects, set weight, mute, query the root layer, list curves on a layer.')
add('maya.cmds.bakeResults', 'Bakes the evaluated motion of objects into keys on every frame of a range, removing the need for constraints or expressions.')
add('maya.cmds.filterCurve', 'Runs a filter on animation curves, for example the Euler filter that removes 360 degree flips.')
add('maya.cmds.scriptJob', 'Runs a Python function when something happens in Maya: the selection changes, the time changes, a scene opens. Returns an id used to kill it later.')
add('maya.cmds.headsUpMessage', 'Shows a temporary message over the viewport.')
add('maya.cmds.progressWindow', 'Maya\'s simple progress window, with an optional cancel button.')
add('maya.cmds.waitCursor', 'Shows or hides the busy cursor.')
add('maya.cmds.window', 'Creates a classic Maya UI window (not Qt).')
add('maya.cmds.showWindow', 'Shows a classic Maya UI window.')

add('maya.mel', 'Lets Python run MEL code. Used when something only exists as a MEL global or procedure.')
add('maya.mel.eval', 'Runs a MEL string and returns the result of the last statement.')


add('maya.cmds.about', 'Information about the running Maya: version, operating system (`macOS=True`), and whether it runs without UI (`batch=True`).')
add('maya.cmds.currentUnit', 'Gets or sets the scene units. `time=True` gives the frame rate name (`film`, `ntsc`, `30fps`...), `linear=True` the distance unit.')
add('maya.cmds.duplicate', 'Copies nodes. `returnRootsOnly=True` returns only the top node of the copy.')
add('maya.cmds.getPanel', 'Finds UI panels: the one with focus (`withFocus`), all visible ones (`visiblePanels`), or a panel\'s type (`typeOf`).')
add('maya.cmds.loadPlugin', 'Loads a Maya plugin by name. `quiet=True` does not complain if it is already loaded.')
add('maya.cmds.modelEditor', 'Edits what a 3D viewport shows: camera, shading, textures, lights, and which object types are visible.')
add('maya.cmds.modelPanel', 'Creates or queries a 3D viewport panel (for example to get the camera it looks through).')
add('maya.cmds.paneLayout', 'A layout that holds panels; here it hosts the temporary viewport.')
add('maya.cmds.setFocus', 'Gives keyboard focus to a UI element or panel.')
add('maya.cmds.timeControl', 'Queries or edits the time slider, for example which sound node it shows.')
add('maya.cmds.workspace', 'The current project. `rootDirectory=True` gives the project folder.')
add('os.access', 'Checks permissions on a path; with `os.X_OK`, whether the file can be executed.')
add('os.X_OK', 'Flag for `os.access`: "can be executed".')
add('os.name', 'Short OS family name: `nt` on Windows, `posix` on macOS and Linux.')
add('os.pathsep', 'The separator between folders in the PATH variable: `;` on Windows, `:` elsewhere.')
add('os.rmdir', 'Deletes an empty folder.')
add('os.uname', 'System information on macOS/Linux; the first item is the OS name (`Darwin` on macOS).')

# ----------------------------------------------------------------- OpenMaya 2.0
add('maya.api.OpenMaya', 'Maya Python API 2.0. Faster than `cmds` for heavy math and for reading lots of data, and needed for callbacks and plugins.')
add('maya.api.OpenMaya.MVector', 'A 3D vector with math built in: `+`, `-`, `*` by a number, `*` between two vectors is the **dot product**, `^` is the **cross product**, `.length()`, `.normalize()`.')
add('maya.api.OpenMaya.MPoint', 'A 3D point (with a w component). Points minus points give vectors; points times matrices transform them.')
add('maya.api.OpenMaya.MMatrix', 'A 4x4 transform matrix. Multiply matrices to combine transforms; `.inverse()` undoes one.')
add('maya.api.OpenMaya.MTransformationMatrix', 'A matrix split into translate, rotate, scale and shear, so you can read or set each part.')
add('maya.api.OpenMaya.MEulerRotation', 'A rotation as three angles plus a rotate order. `.reorder()` changes the order and `.closestSolution()` avoids 360 degree flips.')
add('maya.api.OpenMaya.MQuaternion', 'A rotation stored as a quaternion. Used for smooth interpolation (`slerp`) and to avoid gimbal problems.')
add('maya.api.OpenMaya.MSelectionList', 'A list you add node names to, to get API handles (`MObject`, `MDagPath`) for them.')
add('maya.api.OpenMaya.MGlobal', 'Global helpers: messages (`displayWarning`), selection, MEL execution from the API.')
add('maya.api.OpenMaya.MSceneMessage', 'Scene event callbacks: before/after save, open, new, export. Returns an id to remove the callback later.')
add('maya.api.OpenMaya.MMessage', 'Base class for callbacks. `MMessage.removeCallback(id)` removes one.')
add('maya.api.OpenMaya.MSpace', 'Which space to work in: `kWorld`, `kObject`, `kTransform`.')
add('maya.api.OpenMaya.MTime', 'A time value with units (frames, seconds, ...).')
add('maya.api.OpenMaya.MDistance', 'A distance with a unit. Converts between the scene\'s UI unit (cm, m, inch...) and Maya\'s internal unit, centimeters.')
add('maya.api.OpenMaya.MFnDependencyNode', 'Function set to read and edit any node: its name, attributes and plugs.')

add('maya.api.OpenMaya.MAngle', 'An angle with a unit. Converts between the UI unit (usually degrees) and radians, which the API uses internally.')
add('maya.api.OpenMaya.MDGContext', 'An evaluation context: "evaluate the graph as if the current time were t". Lets you read values at other frames without moving the timeline.')
add('maya.api.OpenMaya.MDGContextGuard', 'While it exists, every plug read happens in the given context (time). Newer Maya versions only.')
add('maya.api.OpenMaya.MDGModifier', 'Collects graph changes (create, delete, connect nodes) and applies them with `doIt()`.')
add('maya.api.OpenMaya.MFn', 'Constants for node and attribute types (`MFn.kUnitAttribute`, `MFn.kTransform`...), used with `hasFn`.')
add('maya.api.OpenMaya.MFnMatrixData', 'Reads the matrix stored in a matrix plug\'s data object.')
add('maya.api.OpenMaya.MFnUnitAttribute', 'Function set for attributes with units (distance, angle, time): tells which unit type it is.')
add('maya.api.OpenMaya.MDagPath', 'A path to one instance of a DAG node, needed for world-space queries.')
add('maya.api.OpenMaya.MPlug', 'An API handle to one attribute of one node; reads with `asDouble()`, `asMObject()`...')
add('maya.api.OpenMaya.MObject', 'A generic API handle to a node or data.')
add('maya.api.OpenMayaAnim', 'Maya Python API 2.0 for animation: animation curves, skin clusters, anim layers.')
add('maya.api.OpenMayaAnim.MFnAnimCurve', 'Function set to create and edit animation curves through the API. `addKeys` adds many keys in one fast call.')
add('maya.cmds.undo', 'Undoes the last undo step (or chunk).')
add('random.Random', 'A random number generator with its own seed, so tests get the same "random" numbers every run.')

add('QtWidgets.QColorDialog', 'The standard color picker dialog. `getColor()` returns the chosen color (check `isValid()`).')
add('QtWidgets.QListWidgetItem', 'One row in a `QListWidget`: text, icon, checkbox and extra data.')
add('bisect.bisect_left', 'Binary search in a sorted list: the index where a value would be inserted, before any equal values. Much faster than scanning.')
add('bisect.bisect_right', 'Like `bisect_left`, but after any equal values.')
add('math.atan', 'Inverse tangent: the angle (radians) of a slope.')
add('maya.api.OpenMaya.MBoundingBox', 'An axis-aligned box (min and max corners).')
add('maya.api.OpenMaya.MColor', 'A color with alpha, used by the viewport drawing API.')
add('maya.api.OpenMaya.MColorArray', 'A list of `MColor`s, passed to the viewport in one call.')
add('maya.api.OpenMaya.MPointArray', 'A list of `MPoint`s, passed to the viewport in one call.')
add('maya.api.OpenMaya.MConditionMessage', 'Callbacks when a Maya condition changes, for example `playingBack` starting or stopping.')
add('maya.api.OpenMaya.MEventMessage', 'Callbacks for named Maya events: `timeChanged`, `SelectionChanged`, `Undo`, `Redo`, `playbackRangeChanged`...')
add('maya.api.OpenMaya.MFnCamera', 'Function set for cameras: view direction, focal length, film back...')
add('maya.api.OpenMaya.MFnData', 'Data type constants for attributes (`kString`, `kMatrix`...).')
add('maya.api.OpenMaya.MFnPlugin', 'Used in `initializePlugin` / `uninitializePlugin` to register and remove nodes and commands.')
add('maya.api.OpenMaya.MFnTypedAttribute', 'Creates attributes that hold typed data such as a string or a matrix.')
add('maya.api.OpenMaya.MPxNode', 'Base class for custom nodes; also holds node type constants and `addAttribute`.')
add('maya.api.OpenMaya.MTypeId', 'The unique numeric id of a custom node type.')
add('maya.api.OpenMaya.MUserData', 'Custom data a draw override passes from `prepareForDraw` to the drawing step.')
add('maya.api.OpenMayaAnim.MAnimControl', 'The time slider through the API: current time, playback range, whether it is playing.')
add('maya.api.OpenMayaAnim.MAnimMessage', 'Animation callbacks, for example "these animation curves were edited", with the exact curves.')
add('maya.api.OpenMayaRender', 'Viewport 2.0 API: draw overrides, render items, the UI draw manager.')
add('maya.api.OpenMayaRender.MDrawRegistry', 'Registers which draw override draws which node classification.')
add('maya.api.OpenMayaRender.MFrameContext', 'Information about the frame being drawn: camera, view direction and position, display style.')
add('maya.api.OpenMayaRender.MPxDrawOverride', 'Base class for custom Viewport 2.0 drawing of a node: prepare data, then add drawables.')
add('maya.api.OpenMayaRender.MRenderItem', 'A renderable item; here only its depth priority constants are used.')
add('maya.api.OpenMayaRender.MRenderer', 'The Viewport 2.0 renderer; holds constants such as which graphics APIs are supported.')
add('maya.api.OpenMayaRender.MUIDrawManager', 'Draws simple shapes in the viewport: lines, points, meshes, text, with color, width and style.')
add('maya.api.OpenMayaUI', 'Maya UI API 2.0: viewports (`M3dView`) and locator nodes.')
add('maya.api.OpenMayaUI.M3dView', 'A 3D viewport: its camera, converting between screen pixels and 3D (`worldToView`, `viewToWorld`), and refreshing.')
add('maya.api.OpenMayaUI.MPxLocatorNode', 'Base class for custom locator nodes (drawable helpers with no geometry).')
add('maya.cmds.currentCtx', 'The name of the active tool (context).')
add('maya.cmds.draggerContext', 'Creates a custom viewport tool with press, drag and release callbacks.')
add('maya.cmds.evalDeferred', 'Runs code later, when Maya is idle. `lowestPriority=True` waits until everything else is done.')
add('maya.cmds.flushUndo', 'Clears the whole undo queue.')
add('maya.cmds.listHistory', 'Every node upstream of a node: what feeds it (curves, constraints, deformers...).')
add('maya.cmds.pluginInfo', 'Queries a plugin, for example whether it is loaded.')
add('maya.cmds.setToolTo', 'Makes a tool (context) the active one.')
add('maya.cmds.shelfLayout', 'A shelf; here queried for its buttons.')
add('maya.cmds.unloadPlugin', 'Unloads a plugin.')
add('mock.MagicMock', 'Python 2 package of `unittest.mock`: a fake object that accepts any call.')
add('unittest.mock.MagicMock', 'A fake object that accepts any attribute or call and remembers how it was used; used to stand in for Maya in tests.')
add('types.ModuleType', 'Creates an empty module object; tests use it to build fake `maya` modules.')
add('uuid.uuid4', 'A random unique id.')

# ----------------------------------------------------------------- Qt
add('QtWidgets', 'The Qt module with all widgets (buttons, fields, layouts, dialogs). Imported from PySide2 in Maya 2020 (PySide6 in Maya 2025).')
add('QtCore', 'Qt core classes: signals, timers, enums (`QtCore.Qt.*`), events.')
add('QtGui', 'Qt drawing and input classes: colors, painters, fonts, cursors, key events.')
add('QtWidgets.QWidget', 'The base of every Qt widget. A plain `QWidget` is also used as an empty container to hold a layout.')
add('QtWidgets.QDialog', 'A window meant to be opened, answered and closed. `exec_()` opens it modally and returns `Accepted` or `Rejected`.')
add('QtWidgets.QMainWindow', 'A top-level window with menu bar, toolbars and a central widget.')
add('QtWidgets.QVBoxLayout', 'Layout that stacks widgets vertically.')
add('QtWidgets.QHBoxLayout', 'Layout that places widgets side by side.')
add('QtWidgets.QGridLayout', 'Layout that places widgets in rows and columns.')
add('QtWidgets.QFormLayout', 'Two-column layout: a label on the left and a field on the right, one row per setting.')
add('QtWidgets.QPushButton', 'A button. Its `clicked` signal is connected to the function to run.')
add('QtWidgets.QToolButton', 'A compact button, often with an icon or an arrow; can be checkable.')
add('QtWidgets.QCheckBox', 'An on/off option. `isChecked()` reads it; `toggled`/`stateChanged` signal changes.')
add('QtWidgets.QRadioButton', 'One of a group of mutually exclusive options.')
add('QtWidgets.QComboBox', 'A dropdown list. `currentText()` reads the choice; `currentIndexChanged` signals a change.')
add('QtWidgets.QLineEdit', 'A one-line text field. `text()` reads it, `setText()` writes it.')
add('QtWidgets.QPlainTextEdit', 'A multi-line text box, used here as a read-only report.')
add('QtWidgets.QTextEdit', 'A multi-line rich-text box.')
add('QtWidgets.QLabel', 'Static text (or an image) in the UI.')
add('QtWidgets.QSpinBox', 'A whole-number field with up/down arrows.')
add('QtWidgets.QDoubleSpinBox', 'A decimal number field with up/down arrows. `setRange` limits it; `value()` reads it.')
add('QtWidgets.QSlider', 'A standard slider for whole numbers.')
add('QtWidgets.QTabWidget', 'A widget with tabs, each tab holding its own widget.')
add('QtWidgets.QFrame', 'A widget with an optional border; with `HLine` it draws a separator line.')
add('QtWidgets.QDialogButtonBox', 'A row of standard dialog buttons (OK, Save, Cancel) placed in the platform\'s usual order. Its `accepted`/`rejected` signals close the dialog.')
add('QtWidgets.QGroupBox', 'A framed box with a title that groups related controls.')
add('QtWidgets.QScrollArea', 'A container that adds scroll bars when its content is bigger than the visible area.')
add('QtWidgets.QListWidget', 'A simple list of text items.')
add('QtWidgets.QTreeWidget', 'A list with columns and optional nested rows.')
add('QtWidgets.QTreeWidgetItem', 'One row in a `QTreeWidget`.')
add('QtWidgets.QTableWidget', 'A grid of editable cells.')
add('QtWidgets.QTableWidgetItem', 'One cell in a `QTableWidget`.')
add('QtWidgets.QHeaderView', 'The header of a table or tree; controls how columns resize.')
add('QtWidgets.QProgressBar', 'A progress bar widget.')
add('QtWidgets.QProgressDialog', 'A small dialog with a progress bar and a Cancel button for long jobs.')
add('QtWidgets.QMessageBox', 'Standard message and question dialogs (information, warning, yes/no).')
add('QtWidgets.QFileDialog', 'The standard open/save/choose-folder dialog.')
add('QtWidgets.QApplication', 'The running Qt application. `processEvents()` lets the UI redraw during a long loop.')
add('QtWidgets.QSizePolicy', 'How a widget grows or shrinks inside a layout.')
add('QtWidgets.QSplitter', 'Two or more panels with a draggable divider.')
add('QtWidgets.QButtonGroup', 'Groups buttons so only one can be checked, and gives each an id.')
add('QtWidgets.QStackedWidget', 'Shows one of several pages at a time.')
add('QtWidgets.QMenu', 'A popup or context menu.')
add('QtWidgets.QAction', 'A menu or toolbar command.')
add('QtWidgets.QStyle', 'Access to the platform style, for standard icons and metrics.')
add('QtWidgets.QAbstractItemView', 'Base class of list/tree/table views; holds enums such as selection modes.')
add('QtCore.Qt', 'Qt\'s namespace of enums and flags: alignments, arrow types, keys, mouse buttons, check states, pen styles.')
add('QtCore.Signal', 'Declares a custom **signal** on a class. Code connects functions to it with `.connect()`; the class fires it with `.emit()`.')
add('QtCore.QTimer', 'Runs a function after a delay or repeatedly. `singleShot(ms, func)` runs it once.')
add('QtCore.QObject', 'The base of everything in Qt that has signals or a parent.')
add('QtCore.QEvent', 'An event (key press, mouse move, close...). Event filters inspect `event.type()`.')
add('QtCore.QSize', 'A width and height pair.')
add('QtCore.QPoint', 'An x, y position in pixels.')
add('QtCore.QPointF', 'An x, y position with decimals.')
add('QtCore.QRectF', 'A rectangle with decimal coordinates.')
add('QtCore.QSettings', 'Saves small settings on disk (or registry) between sessions.')
add('QtGui.QColor', 'A color (red, green, blue, alpha from 0 to 255).')
add('QtGui.QPainter', 'Draws lines, shapes and text on a widget inside `paintEvent`.')
add('QtGui.QPen', 'Line style for `QPainter`: color, width, dash pattern.')
add('QtGui.QBrush', 'Fill style for `QPainter`.')
add('QtGui.QFont', 'A font (family, size, weight).')
add('QtGui.QPixmap', 'An image ready to draw on screen, such as a thumbnail.')
add('QtGui.QIcon', 'An icon for buttons and items.')
add('QtGui.QCursor', 'The mouse cursor; `QCursor.pos()` gives its screen position.')
add('QtGui.QKeySequence', 'A keyboard shortcut.')
add('QtGui.QPainterPath', 'A shape made of lines and curves, drawn by `QPainter`.')
add('QtGui.QPolygonF', 'A list of points drawn as a polygon or polyline.')
add('QtGui.QLinearGradient', 'A color gradient along a line.')
add('QtGui.QIntValidator', 'Restricts a text field to whole numbers.')
add('QtGui.QDoubleValidator', 'Restricts a text field to decimal numbers.')
add('shiboken.wrapInstance', 'Turns a raw C++ pointer (from `MQtUtil.mainWindow()`) into a usable PySide widget, typically to parent a tool window to Maya.')
add('maya.OpenMayaUI', 'Maya UI API (1.0). `MQtUtil.mainWindow()` gives Maya\'s main window pointer for parenting Qt windows.')
add('maya.OpenMayaUI.MQtUtil', 'Bridges Maya UI and Qt: get Maya\'s main window, or the Qt widget of a Maya control.')
add('maya.app.general.mayaMixin.MayaQWidgetDockableMixin', 'A mixin class that makes a Qt widget dockable in Maya. `show(dockable=True)` puts it in a workspace control.')
add('maya.app.general.mayaMixin', 'Maya helper classes for Qt windows, including the dockable mixin.')

# ----------------------------------------------------------------- Python standard library
add('json.dumps', 'Converts Python data (dicts, lists, strings, numbers) into a JSON text string.')
add('json.loads', 'Parses a JSON text string back into Python data.')
add('json.dump', 'Writes Python data as JSON into an open file.')
add('json.load', 'Reads JSON from an open file into Python data.')
add('os.path', 'Path helpers that work on Windows and Mac/Linux alike.')
add('os.path.join', 'Joins path parts with the right separator for the system.')
add('os.path.dirname', 'The folder part of a path.')
add('os.path.basename', 'The last part of a path (file or folder name).')
add('os.path.abspath', 'Turns a relative path into an absolute one.')
add('os.path.exists', 'True if the file or folder exists.')
add('os.path.isfile', 'True if the path is an existing file.')
add('os.path.isdir', 'True if the path is an existing folder.')
add('os.path.splitext', 'Splits `name.ext` into `("name", ".ext")`.')
add('os.path.normpath', 'Cleans a path: removes `..`, doubled slashes, uses the system separator.')
add('os.path.expanduser', 'Replaces `~` with the user\'s home folder.')
add('os.path.getmtime', 'When a file was last modified (seconds since 1970).')
add('os.path.getsize', 'File size in bytes.')
add('os.path.relpath', 'A path written relative to another folder.')
add('os.makedirs', 'Creates a folder and any missing parent folders. `exist_ok=True` means no error if it already exists.')
add('os.listdir', 'Names inside a folder, in no particular order.')
add('os.walk', 'Walks a folder tree: for each folder gives `(folder, subfolders, files)`.')
add('os.remove', 'Deletes a file.')
add('os.rename', 'Renames or moves a file.')
add('os.environ', 'The environment variables as a dict-like object.')
add('os.getcwd', 'The current working folder.')
add('os.sep', 'The path separator for this system.')
add('os.devnull', 'The path of the system\'s "discard everything" file, used to silence output.')
add('os.startfile', 'Windows only: opens a file or folder with its default program.')
add('sys.path', 'The list of folders Python searches when you `import` something. Adding a folder here makes the modules in it importable.')
add('sys.version_info', 'The running Python version, used to branch between Python 2 and 3.')
add('sys.argv', 'Command-line arguments passed to the script.')
add('sys.platform', 'The operating system name, for example `win32` or `darwin`.')
add('sys.modules', 'All imported modules, by name. Deleting entries forces a fresh import.')
add('sys.exit', 'Stops the script with an exit code.')
add('sys.stdout', 'Standard output (where `print` writes).')
add('math.sqrt', 'Square root.')
add('math.pi', 'The number pi.')
add('math.sin', 'Sine of an angle in radians.')
add('math.cos', 'Cosine of an angle in radians.')
add('math.atan2', 'The angle of a 2D vector (y, x), in radians, correct in all four quadrants.')
add('math.radians', 'Degrees to radians.')
add('math.degrees', 'Radians to degrees.')
add('math.exp', 'e to the power x; used for smooth falloffs.')
add('math.floor', 'Rounds down to a whole number.')
add('math.ceil', 'Rounds up to a whole number.')
add('math.hypot', 'Length of a 2D (or ND) vector: `sqrt(x*x + y*y)`.')
add('math.isnan', 'True if the value is "not a number".')
add('math.tan', 'Tangent of an angle in radians.')
add('math.acos', 'Inverse cosine; returns an angle in radians. Input must be between -1 and 1.')
add('math.log', 'Natural logarithm (or with a base).')
add('math.copysign', 'A value with the sign of another value.')
add('math.fabs', 'Absolute value as a float.')
add('subprocess', 'Runs other programs (here ffmpeg) from Python.')
add('subprocess.Popen', 'Starts another program and lets the script talk to it or wait for it.')
add('subprocess.call', 'Runs a program and waits for it; returns the exit code.')
add('subprocess.check_call', 'Runs a program and raises if it fails.')
add('subprocess.check_output', 'Runs a program and returns what it printed.')
add('subprocess.PIPE', 'Captures a program\'s output or input as a stream.')
add('subprocess.STDOUT', 'Sends error output to the same stream as normal output.')
add('subprocess.CalledProcessError', 'Raised when a program run by `check_call`/`check_output` fails.')
add('shutil.copy2', 'Copies a file and its timestamps.')
add('shutil.rmtree', 'Deletes a folder and everything in it.')
add('shutil.which', 'Finds a program on the PATH, like `which ffmpeg` in a terminal.')
add('shutil.move', 'Moves a file or folder.')
add('tempfile.mkdtemp', 'Creates a new empty temporary folder and returns its path.')
add('tempfile.gettempdir', 'The system temporary folder.')
add('time.time', 'Current time in seconds; subtracting two values measures how long something took.')
add('time.sleep', 'Pauses the script for a number of seconds.')
add('time.strftime', 'Formats the current date/time as text.')
add('re.compile', 'Prepares a regular expression once so it can be reused quickly.')
add('re.match', 'Matches a regular expression at the start of a string.')
add('re.search', 'Finds the first place a regular expression matches.')
add('re.sub', 'Replaces every match of a regular expression.')
add('re.findall', 'Returns every match of a regular expression.')
add('re.split', 'Splits a string wherever the regular expression matches.')
add('re.escape', 'Escapes special characters so text can be used literally inside a pattern.')
add('re.I', 'Flag: case-insensitive matching.')
add('re.IGNORECASE', 'Flag: case-insensitive matching.')
add('collections.defaultdict', 'A dict that creates a default value (for example an empty list) the first time a missing key is used.')
add('collections.OrderedDict', 'A dict that keeps insertion order (normal dicts only do so from Python 3.7).')
add('collections.namedtuple', 'A tuple with named fields: `p.x` instead of `p[0]`.')
add('collections.Counter', 'A dict that counts how many times each item appears.')
add('collections.deque', 'A list optimized for adding and removing at both ends.')
add('functools.partial', 'Creates a new function with some arguments already filled in. Often used to connect one button to a function with a fixed argument.')
add('functools.wraps', 'Used inside decorators so the wrapped function keeps its name and docstring.')
add('itertools.chain', 'Walks several lists one after another as if they were one.')
add('itertools.product', 'Every combination of items from several lists.')
add('traceback.format_exc', 'The full error report (traceback) of the exception being handled, as text.')
add('traceback.print_exc', 'Prints the full error report of the exception being handled.')
add('glob.glob', 'Files matching a wildcard pattern like `*.ma`.')
add('datetime.datetime', 'A date and time. `.now()` is the current one.')
add('copy.deepcopy', 'A full copy of nested data, so changing the copy never changes the original.')
add('weakref.ref', 'A reference that does not keep the object alive.')
add('logging.getLogger', 'Gets a named logger to write messages with levels (info, warning, error).')
add('unittest.TestCase', 'Base class for automated tests. Each `test_*` method is one test; `assertEqual` and friends check results.')
add('unittest.main', 'Runs the tests defined in the file.')
add('unittest.mock', 'Replaces real objects (like `maya.cmds`) with fakes during tests.')
add('importlib.reload', 'Re-imports a module after you edit it, without restarting Maya.')
add('struct.pack', 'Packs numbers into raw bytes.')
add('platform.system', 'The OS name: Windows, Darwin or Linux.')
add('io.open', 'Opens a file with an explicit encoding on both Python 2 and 3.')
add('codecs.open', 'Opens a file with an explicit encoding (works on Python 2).')
add('string.Template', 'Simple text templates with `$name` placeholders.')
add('random.random', 'A random number between 0 and 1.')
add('threading.Thread', 'Runs a function in a background thread.')
add('html.escape', 'Escapes `<`, `>` and `&` so text can be put inside HTML safely.')
add('getpass.getuser', 'The name of the logged-in user.')
add('numpy', 'Fast number arrays and math. (Maya 2020 does not ship it, so tools avoid it.)')

# ----------------------------------------------------------------- builtins
add('builtins.len', 'Number of items in a list, string, dict, ...')
add('builtins.range', 'A sequence of whole numbers: `range(3)` is 0, 1, 2; `range(a, b)` stops before `b`.')
add('builtins.enumerate', 'Loops with an index: `for i, item in enumerate(items)`.')
add('builtins.zip', 'Walks several lists in step: `for a, b in zip(list_a, list_b)`. Stops at the shortest.')
add('builtins.sorted', 'A new sorted list. `key=` picks what to sort by, `reverse=True` flips the order.')
add('builtins.min', 'Smallest value (or smallest by `key=`).')
add('builtins.max', 'Largest value (or largest by `key=`).')
add('builtins.abs', 'Absolute value: distance from zero, always positive.')
add('builtins.sum', 'Adds up all values.')
add('builtins.round', 'Rounds a number, optionally to N decimals.')
add('builtins.int', 'Converts to a whole number (cuts off decimals).')
add('builtins.float', 'Converts to a decimal number.')
add('builtins.str', 'Converts to text.')
add('builtins.bool', 'Converts to `True`/`False`. Empty lists, `None`, `0` and `""` are `False`.')
add('builtins.list', 'Makes a list (often a copy of another list or iterable).')
add('builtins.dict', 'Makes a dictionary.')
add('builtins.set', 'Makes a set: no duplicates, fast `in` checks.')
add('builtins.tuple', 'Makes a tuple: an unchangeable list.')
add('builtins.super', 'Calls the parent class\'s version of a method. `super(Class, self).__init__(...)` is the Python 2 compatible form.')
add('builtins.getattr', 'Reads an attribute by name stored in a string: `getattr(obj, "name")`, with an optional default.')
add('builtins.setattr', 'Sets an attribute by name stored in a string.')
add('builtins.hasattr', 'True if an object has an attribute with that name.')
add('builtins.isinstance', 'True if a value is of a given type (or one of several).')
add('builtins.open', 'Opens a file for reading (`"r"`), writing (`"w"`) or appending (`"a"`). Used with `with` so it closes itself.')
add('builtins.print', 'Writes text to the output (the Script Editor in Maya).')
add('builtins.map', 'Applies a function to every item.')
add('builtins.filter', 'Keeps items for which a function returns True.')
add('builtins.any', 'True if at least one item is true.')
add('builtins.all', 'True if every item is true.')
add('builtins.reversed', 'Walks a sequence backwards.')
add('builtins.iter', 'Gets an iterator from a sequence.')
add('builtins.next', 'Takes the next item from an iterator; with a default, no error when it is empty.')
add('builtins.id', 'A unique number for an object while it exists.')
add('builtins.type', 'The type of a value.')
add('builtins.repr', 'A text form of a value meant for debugging (strings get quotes).')
add('builtins.format', 'Formats a value as text.')
add('builtins.divmod', 'Whole division and remainder at once.')
add('builtins.pow', 'Power: `pow(a, b)` is a to the b.')
add('builtins.globals', 'The module\'s global variables as a dict.')
add('builtins.callable', 'True if a value can be called like a function.')
add('builtins.object', 'The base class of all classes.')
add('builtins.property', 'Makes a method readable like an attribute.')
add('builtins.staticmethod', 'A method that does not receive `self`.')
add('builtins.classmethod', 'A method that receives the class (`cls`) instead of an instance.')
add('builtins.Exception', 'The base class of normal errors. `except Exception` catches almost everything.')
add('builtins.RuntimeError', 'The error Maya commands raise when they fail (locked attribute, missing node, ...).')
add('builtins.ValueError', 'Raised when a value has the right type but a wrong content, for example `int("abc")` or bad JSON.')
add('builtins.KeyError', 'Raised when a dictionary key does not exist.')
add('builtins.TypeError', 'Raised when a value has the wrong type for an operation.')
add('builtins.IndexError', 'Raised when a list index is out of range.')
add('builtins.IOError', 'Raised when a file cannot be read or written.')
add('builtins.OSError', 'Raised for operating-system errors: missing files, permissions, failed programs.')
add('builtins.AttributeError', 'Raised when an object has no attribute with that name.')
add('builtins.ImportError', 'Raised when a module cannot be imported.')
add('builtins.NotImplementedError', 'Raised by methods that a subclass is supposed to implement.')
add('builtins.StopIteration', 'Raised when an iterator has no more items.')
add('builtins.ZeroDivisionError', 'Raised when dividing by zero.')
add('builtins.UnicodeDecodeError', 'Raised when bytes cannot be read as text in the given encoding.')
add('builtins.KeyboardInterrupt', 'Raised when the user stops a script (Ctrl+C).')
add('builtins.reload', 'Python 2 built-in to re-import a module (moved to `importlib.reload` in Python 3).')
add('builtins.unicode', 'Python 2 text type (just `str` in Python 3).')
add('builtins.basestring', 'Python 2 base type of all strings (does not exist in Python 3).')
add('builtins.xrange', 'Python 2 lazy version of `range`.')
add('builtins.locals', 'The local variables as a dict.')
add('builtins.vars', 'An object\'s attributes as a dict.')
add('builtins.chr', 'The character for a code number.')
add('builtins.ord', 'The code number of a character.')
add('builtins.hex', 'A number in hexadecimal text.')
add('builtins.bytes', 'Raw bytes.')
add('builtins.frozenset', 'An unchangeable set.')
add('builtins.slice', 'A slice object, the `a:b` part of `list[a:b]`.')
add('builtins.hash', 'A number used by dicts and sets to find a value quickly.')
add('builtins.exec', 'Runs Python code from a string.')
add('builtins.compile', 'Compiles Python code from a string.')
add('builtins.input', 'Reads a line typed by the user.')

# ----------------------------------------------------------------- methods on objects
M = {
    'connect': '`signal.connect(function)`: run `function` every time the signal fires (button clicked, value changed, ...). This is how Qt UIs call your code.',
    'disconnect': 'Removes a signal connection.',
    'clicked': 'Signal: the button was clicked.',
    'toggled': 'Signal: a checkable button or checkbox was turned on or off; sends the new state.',
    'valueChanged': 'Signal: a spin box or slider value changed; sends the new value.',
    'currentIndexChanged': 'Signal: a different combo box entry was chosen.',
    'editingFinished': 'Signal: the user pressed Enter or left a text field after editing it.',
    'textChanged': 'Signal: the text of a field changed (on every keystroke).',
    'stateChanged': 'Signal: a checkbox changed state.',
    'triggered': 'Signal: a menu action was chosen.',
    'accepted': 'Signal: a dialog was confirmed (OK/Save).',
    'rejected': 'Signal: a dialog was cancelled.',
    'addTopLevelItem': 'Adds a row at the top level of a `QTreeWidget`.',
    'topLevelItem': 'The top-level row at an index in a `QTreeWidget`.',
    'topLevelItemCount': 'How many top-level rows a `QTreeWidget` has.',
    'resizeColumnToContents': 'Makes a column just wide enough for its content.',
    'setRootIsDecorated': 'Whether a tree shows the expand arrows at the root; off makes it look like a flat list.',
    'itemText': 'The text of a combo box entry at an index.',
    'setEditable': 'Lets the user type into a combo box, not only pick from it.',
    'setTextInteractionFlags': 'What the user can do with a label\'s text, for example select and copy it.',
    'activated': 'Signal: the user picked a combo box entry (even the same one again).',
    'getElement': '`MMatrix.getElement(row, column)`: one number of the 4x4 matrix.',
    'rotation': '`MTransformationMatrix.rotation()`: the rotation part, as an `MEulerRotation` (or a quaternion if asked).',
    'addKeys': '`MFnAnimCurve.addKeys(times, values, ...)`: adds many keys in one call.',
    'asDouble': '`MPlug.asDouble()`: reads the plug as a number (optionally in a context).',
    'asMObject': '`MPlug.asMObject()`: reads the plug\'s data object (for matrices and other complex data).',
    'asMatrix': 'Converts a rotation (Euler or quaternion) or transformation to an `MMatrix`.',
    'asRadians': '`MAngle.asRadians()`: the angle in radians.',
    'attribute': '`MPlug.attribute()`: the attribute definition behind the plug.',
    'create': 'API function sets: creates a new node of that kind (here a temporary animation curve).',
    'deleteNode': '`MDGModifier.deleteNode(obj)`: queues a node deletion.',
    'doIt': '`MDGModifier.doIt()`: applies the queued changes.',
    'elementByLogicalIndex': 'One element of an array plug, by its index.',
    'findPlug': '`MFnDependencyNode.findPlug(name, False)`: gets the plug for an attribute name.',
    'getDagPath': '`MSelectionList.getDagPath(i)`: the DAG path of item i.',
    'getDependNode': '`MSelectionList.getDependNode(i)`: the `MObject` of item i.',
    'hasFn': '`MObject.hasFn(MFn.kSomething)`: true if the object is of that kind.',
    'instanceNumber': 'Which instance of a DAG node this path points to (0 for normal, non-instanced nodes).',
    'isEquivalent': 'Compares two matrices (or vectors) within a tolerance.',
    'matrix': '`MFnMatrixData.matrix()`: the stored `MMatrix`.',
    'name': 'The name of a node or plug.',
    'node': 'The node (`MObject`) a path or plug belongs to.',
    'unitType': 'Which kind of unit an attribute uses (distance, angle, time).',
    'setRotation': '`MTransformationMatrix.setRotation(q)`: replaces the rotation part.',
    'gauss': 'A random number from a normal (bell curve) distribution.',
    'insertRow': 'Adds an empty row to a table.',
    'removeRow': 'Deletes a row from a table.',
    'rowCount': 'Number of rows in a table.',
    'row': 'The row of a table index.',
    'selectedIndexes': 'The selected cells of a table or list.',
    'setSelectionBehavior': 'Whether clicking selects single cells or whole rows.',
    'setTextAlignment': 'Alignment of the text in a table cell.',
    'verticalHeader': 'The row-number header on the left of a table.',
    'sliderReleased': 'Signal: the user let go of a slider.',
    'asString': '`MPlug.asString()`: reads a string attribute.',
    'beginDrawable': 'Starts a group of drawing calls in `MUIDrawManager`.',
    'endDrawable': 'Ends that group.',
    'beginDrawInXray': 'Starts drawing that is always visible through geometry (newer Maya).',
    'endDrawInXray': 'Ends X-ray drawing.',
    'setColor': 'Drawing color for the next draw calls.',
    'setLineWidth': 'Line width for the next draw calls.',
    'setLineStyle': 'Solid or dashed lines.',
    'setPointSize': 'Point size for the next draw calls.',
    'setFontSize': 'Text size for the next draw calls.',
    'setDepthPriority': 'Draws in front of other items with lower priority.',
    'line': 'Draws one line between two points.',
    'lineStrip': 'Draws connected lines through a list of points.',
    'point': 'Draws one point.',
    'points': 'Draws a list of points.',
    'mesh': '`MUIDrawManager.mesh(kind, points, normals, colors)`: draws many lines or points in one call, with a color per point.',
    'getTuple': 'Reads a vector from the frame context (view direction, view position).',
    'registerNode': 'Registers a custom node type in a plugin.',
    'deregisterNode': 'Removes it when the plugin unloads.',
    'distanceTo': 'Distance between two `MPoint`s.',
    'inclusiveMatrix': 'The world matrix of a DAG path (including the node itself).',
    'isValid': 'True if an API handle (or a picked color) is still valid.',
    'fullPathName': 'Full DAG path of a node as text.',
    'getCamera': 'The camera of a viewport, as a DAG path.',
    'viewDirection': 'The direction a camera looks.',
    'worldToView': 'Converts a 3D point to viewport pixels.',
    'viewToWorld': 'Converts viewport pixels to a 3D ray (near point and direction).',
    'itemData': 'The data stored on a combo box entry.',
    'selectedItems': 'The selected rows of a list.',
    'setSelected': 'Selects or deselects a row.',
    'setSelectionMode': 'Single or multiple selection in a list.',
    'setStretch': 'How much extra space a layout item gets.',
    'setKeyboardTracking': 'Whether a spin box reports every keystroke or only the final value.',
    'fill': 'Fills a pixmap with one color.',
    'redF': 'Red component as 0-1.',
    'greenF': 'Green component as 0-1.',
    'blueF': 'Blue component as 0-1.',
    'uniform': 'A random number between two values.',
    'itemChanged': 'Signal: a list row changed (for example its checkbox).',
    'itemDoubleClicked': 'Signal: a list row was double-clicked.',
    'sliderPressed': 'Signal: the user grabbed a slider.',
    'currentData': 'The data stored on the selected combo box entry (the second argument of `addItem`).',
    'findData': 'Index of the combo box entry that carries this data, or -1.',
    'setCheckable': 'Makes a button stay pressed (on/off) instead of just clicking.',
    'addCallback': 'Registers a function to run on a Maya event and returns an id to remove it later.',
    'asCentimeters': '`MDistance.asCentimeters()`: the distance converted to centimeters.',
    'asUnits': '`MDistance.asUnits(unit)`: the distance converted to the given unit.',
    'emit': 'Fires a custom signal; every connected function runs.',
    'addWidget': 'Puts a widget into a layout.',
    'addLayout': 'Puts a layout inside another layout.',
    'addStretch': 'Adds empty stretchable space in a layout (pushes widgets to one side).',
    'addSpacing': 'Adds a fixed gap in a layout.',
    'addRow': 'Adds a label + field row to a `QFormLayout`.',
    'addTab': 'Adds a page to a `QTabWidget`.',
    'addItem': 'Adds one entry to a list, combo box or layout.',
    'addItems': 'Adds several text entries to a combo box or list.',
    'setLayout': 'Gives a widget its layout.',
    'setText': 'Sets the text of a label, field or button.',
    'text': 'Reads the text of a field, label or button.',
    'setChecked': 'Turns a checkbox or checkable button on or off.',
    'isChecked': 'True if a checkbox or checkable button is on.',
    'setValue': 'Sets a spin box or slider value.',
    'value': 'Reads a spin box or slider value.',
    'setRange': 'Sets the minimum and maximum of a spin box or slider.',
    'setMinimum': 'Sets the minimum value.',
    'setMaximum': 'Sets the maximum value.',
    'setDecimals': 'Number of decimals a spin box shows.',
    'setSingleStep': 'How much the arrows change a spin box.',
    'setSuffix': 'Text shown after a spin box number (for example "%").',
    'setVisible': 'Shows or hides a widget.',
    'setEnabled': 'Enables or greys out a widget.',
    'setStyleSheet': 'Styles a widget with CSS-like Qt style sheets.',
    'setToolTip': 'Text shown when hovering a widget.',
    'setPlaceholderText': 'Grey hint text shown in an empty field.',
    'setWordWrap': 'Lets a label wrap onto several lines.',
    'setReadOnly': 'Makes a text box read-only.',
    'setPlainText': 'Replaces the content of a plain text box.',
    'appendPlainText': 'Adds a line to a plain text box.',
    'setMaximumWidth': 'Limits how wide a widget can get.',
    'setMaximumHeight': 'Limits how tall a widget can get.',
    'setMinimumWidth': 'Sets how narrow a widget can get.',
    'setMinimumHeight': 'Sets how short a widget can get.',
    'setFixedWidth': 'Fixes a widget\'s width.',
    'setFixedHeight': 'Fixes a widget\'s height.',
    'setContentsMargins': 'Space around a layout\'s content.',
    'setSpacing': 'Space between widgets in a layout.',
    'setArrowType': 'Which arrow a `QToolButton` shows.',
    'setToolButtonStyle': 'Whether a tool button shows text, icon, or both.',
    'setFrameShape': 'The shape of a `QFrame` (box, line, ...).',
    'setFrameShadow': 'Raised, sunken or plain frame look.',
    'setCurrentIndex': 'Selects an entry by index (combo box, tabs, stack).',
    'currentIndex': 'Index of the selected entry.',
    'currentText': 'Text of the selected combo box entry.',
    'findText': 'Index of an entry with that text, or -1.',
    'clear': 'Removes all items or text (Qt), or empties a list/dict (Python).',
    'exec_': 'Opens a dialog modally and waits for it to close. (The underscore exists because `exec` was a reserved word in Python 2.)',
    'show': 'Shows a widget or window.',
    'close': 'Closes a widget or window (or a file).',
    'hide': 'Hides a widget.',
    'deleteLater': 'Asks Qt to delete the widget safely once the current event is finished.',
    'setWindowTitle': 'The text in a window\'s title bar.',
    'setObjectName': 'A name used to find the widget later (for example to delete an old copy of the window).',
    'setParent': 'Changes a widget\'s parent.',
    'setWindowFlags': 'Window behavior flags: tool window, stay on top, ...',
    'resize': 'Sets the widget size.',
    'update': 'Asks a widget to repaint soon (Qt), or merges another dict (Python dict).',
    'repaint': 'Repaints a widget immediately.',
    'width': 'Widget width in pixels.',
    'height': 'Widget height in pixels.',
    'rect': 'The widget\'s rectangle (0, 0, width, height).',
    'x': 'Horizontal position (of a mouse event or point).',
    'y': 'Vertical position (of a mouse event or point).',
    'pos': 'Position of a mouse event or widget.',
    'button': 'Which mouse button an event is about.',
    'modifiers': 'Which modifier keys (Shift, Ctrl, Alt) are held during an event.',
    'key': 'Which key a key event is about.',
    'accept': 'Closes a dialog as accepted (OK/Save), or marks an event as handled.',
    'reject': 'Closes a dialog as cancelled.',
    'ignore': 'Marks an event as not handled so it continues to the parent.',
    'setPen': 'Line color/style for the next `QPainter` drawing calls.',
    'setBrush': 'Fill color/style for the next `QPainter` drawing calls.',
    'setRenderHint': 'Turns on antialiasing and similar quality options for `QPainter`.',
    'fillRect': 'Fills a rectangle with a color.',
    'drawLine': 'Draws a line.',
    'drawRect': 'Draws a rectangle.',
    'drawRoundedRect': 'Draws a rectangle with rounded corners.',
    'drawEllipse': 'Draws a circle or ellipse.',
    'drawText': 'Draws text.',
    'drawPath': 'Draws a `QPainterPath`.',
    'drawPolyline': 'Draws connected line segments.',
    'drawPixmap': 'Draws an image.',
    'setFont': 'Sets the font.',
    'setAlignment': 'Text alignment in a label or field.',
    'setSizePolicy': 'How a widget grows in a layout.',
    'setHorizontalHeaderLabels': 'Column titles of a table.',
    'setHeaderLabels': 'Column titles of a tree.',
    'setColumnCount': 'Number of columns.',
    'setRowCount': 'Number of rows.',
    'setItem': 'Puts an item in a table cell.',
    'item': 'The item at a row (and column).',
    'setFlags': 'What the user can do with an item: select, edit, check.',
    'flags': 'An item\'s current flags.',
    'setCheckState': 'Ticks or unticks an item.',
    'checkState': 'Whether an item is ticked.',
    'setData': 'Stores extra data on an item (for example the node name behind the label).',
    'data': 'Reads data stored on an item.',
    'setSectionResizeMode': 'How a table/tree column resizes.',
    'horizontalHeader': 'The column header of a table.',
    'header': 'The header of a tree.',
    'singleShot': 'Runs a function once after a delay (`QTimer.singleShot(ms, func)`).',
    'start': 'Starts a timer.',
    'stop': 'Stops a timer.',
    'timeout': 'Timer signal fired when the time is up.',
    'processEvents': 'Lets Qt handle pending events (redraw, clicks) during a long loop.',
    'wasCanceled': 'True if the user pressed Cancel on a progress dialog.',
    'setWindowModality': 'Whether a window blocks the rest of the UI while open.',
    'installEventFilter': 'Lets an object watch another object\'s events.',
    'blockSignals': 'Temporarily stops a widget from firing signals (to change it in code without triggering handlers).',
    'length': '`MVector.length()`: the vector\'s length.',
    'normalize': '`MVector.normalize()`: scales the vector to length 1, in place.',
    'normal': '`MVector.normal()`: a length-1 copy of the vector.',
    'inverse': 'The inverse of a matrix or quaternion.',
    'asEulerRotation': 'Converts a quaternion or matrix to Euler angles.',
    'asQuaternion': 'Converts a rotation to a quaternion.',
    'reorder': 'Changes an Euler rotation\'s rotate order, keeping the same orientation.',
    'closestSolution': 'Picks the Euler angles closest to a previous rotation, avoiding 360 degree jumps.',
    'append': 'Adds one item to the end of a list.',
    'extend': 'Adds every item of another list to the end.',
    'insert': 'Inserts an item at a position.',
    'pop': 'Removes and returns an item (last by default; by key for dicts).',
    'remove': 'Removes the first item equal to a value.',
    'index': 'Position of a value in a list.',
    'count': 'How many times a value appears.',
    'sort': 'Sorts a list in place.',
    'reverse': 'Reverses a list in place.',
    'copy': 'A shallow copy of a list or dict.',
    'get': '`dict.get(key, default)`: the value, or the default if the key is missing (no `KeyError`).',
    'setdefault': '`dict.setdefault(key, value)`: returns the value, inserting `value` first if the key is missing.',
    'keys': 'The keys of a dict.',
    'values': 'The values of a dict.',
    'items': '`(key, value)` pairs of a dict, for `for key, value in d.items()`.',
    'add': 'Adds an item to a set.',
    'discard': 'Removes an item from a set if present.',
    'split': 'Splits text into a list at a separator.',
    'rsplit': 'Splits text from the right.',
    'strip': 'Removes spaces (or given characters) from both ends.',
    'lstrip': 'Removes spaces from the left.',
    'rstrip': 'Removes spaces from the right.',
    'join': '`sep.join(items)`: joins a list of strings with `sep` between them. (`os.path.join` joins paths.)',
    'format': 'Fills `{0}`, `{1}`, ... placeholders in a string.',
    'replace': 'Replaces every occurrence of some text.',
    'startswith': 'True if text starts with a prefix.',
    'endswith': 'True if text ends with a suffix.',
    'lower': 'Lowercase copy of text.',
    'upper': 'Uppercase copy of text.',
    'capitalize': 'Copy with the first letter uppercase.',
    'title': 'Copy with every word capitalized.',
    'find': 'Position of some text, or -1.',
    'encode': 'Text to bytes.',
    'decode': 'Bytes to text.',
    'isdigit': 'True if text is only digits.',
    'zfill': 'Pads a number string with zeros on the left.',
    'splitlines': 'Splits text into lines.',
    'read': 'Reads a file\'s content.',
    'write': 'Writes text to a file.',
    'readlines': 'Reads a file as a list of lines.',
    'wait': 'Waits for a started program to finish.',
    'communicate': 'Sends input to a program and collects its output, waiting for it to finish.',
    'poll': 'Checks whether a started program has finished, without waiting.',
    'kill': 'Stops a running program.',
    'group': 'The text matched by a regular expression (or one of its groups).',
    'groups': 'All groups matched by a regular expression.',
    'match': 'Matches a compiled pattern at the start of text.',
    'search': 'Finds a compiled pattern anywhere in text.',
    'sub': 'Replaces matches of a compiled pattern.',
    'now': 'The current date and time.',
    'strftime': 'Formats a date/time as text.',
    'total_seconds': 'A duration in seconds.',
    'exists': 'True if a path exists.',
    'abspath': 'An absolute path.',
    'dirname': 'The folder part of a path.',
    'assertEqual': 'Test check: fails if the two values differ.',
    'assertTrue': 'Test check: fails if the value is not true.',
    'assertFalse': 'Test check: fails if the value is true.',
    'assertIsNone': 'Test check: fails if the value is not `None`.',
    'assertIn': 'Test check: fails if the item is not in the container.',
    'assertAlmostEqual': 'Test check for decimals: equal within a small tolerance.',
    'assertRaises': 'Test check: the code inside must raise the given error.',
    'assertLess': 'Test check: first value must be smaller.',
    'assertGreater': 'Test check: first value must be bigger.',
    'assertNotEqual': 'Test check: values must differ.',
    'assertListEqual': 'Test check: two lists must be equal.',
}
for k, v in M.items():
    G['method.' + k] = v

GLOSSARY = G

# ----------------------------------------------------------------- Python syntax, matched by regex on a line
SYNTAX = [
    [r'^\s*def ', 'def', '`def name(args):` defines a function. The indented lines below are its body.'],
    [r'^\s*class ', 'class', '`class Name(Base):` defines a class. Methods inside receive the instance as `self`.'],
    [r'^\s*@staticmethod', '@staticmethod', 'A method that does not receive `self`; just a function grouped inside the class.'],
    [r'^\s*@classmethod', '@classmethod', 'A method that receives the class (`cls`), often used as an alternative constructor.'],
    [r'^\s*@property', '@property', 'Lets you read the method like an attribute: `obj.name` instead of `obj.name()`.'],
    [r'^\s*@\w', 'decorator', 'A **decorator** (`@name` above a def) wraps the function to add behavior.'],
    [r'\bdef __init__\b', '__init__', 'The constructor: runs when the object is created, to set up its attributes.'],
    [r'\bdef __enter__\b|\bdef __exit__\b', 'context manager', '`__enter__`/`__exit__` make a class usable with `with`: setup on enter, cleanup on exit (even on errors).'],
    [r'\bdef __repr__\b', '__repr__', 'What the object looks like when printed in the console.'],
    [r'\bwith\b.*:\s*$', 'with', '`with x:` runs setup before the block and cleanup after it, even if an error happens (files close, undo chunks close).'],
    [r'^\s*try:', 'try', '`try:` runs code that might fail; `except` below handles the error instead of stopping the script.'],
    [r'^\s*except\b', 'except', 'Handles an error raised inside the `try` block. Naming the error type catches only that kind.'],
    [r'^\s*finally:', 'finally', 'Runs after the `try` block no matter what, even if there was an error or a `return`.'],
    [r'^\s*raise\b', 'raise', 'Raises an error on purpose to stop and report a problem.'],
    [r'\blambda\b', 'lambda', 'A tiny inline function: `lambda x: x * 2`. Common for connecting a button to a call with fixed arguments.'],
    [r'\byield\b', 'yield', 'Makes the function a **generator**: it hands back values one at a time instead of building a whole list.'],
    [r'^\s*global ', 'global', 'Says the function will change a module-level variable instead of creating a local one.'],
    [r'^\s*nonlocal ', 'nonlocal', 'Lets an inner function change a variable of the enclosing function.'],
    [r'\bsuper\(', 'super()', 'Calls the parent class\'s version of the method.'],
    [r'\bfor\b.+\bin\b.+\bif\b', 'comprehension', 'A **comprehension** builds a list/dict/set in one line: `[x for x in items if test]`.'],
    [r'\[\s*[^\]]+\bfor\b[^\]]+\bin\b', 'list comprehension', '`[expr for x in items]` builds a new list in one line.'],
    [r'\{\s*[^}]+:\s*[^}]+\bfor\b', 'dict comprehension', '`{k: v for ...}` builds a dict in one line.'],
    [r'\bif __name__ == ["\']__main__["\']', '__main__', 'Runs only when the file is executed directly, not when it is imported.'],
    [r'\*\*\w+', '**kwargs', '`**kwargs` collects (or passes) keyword arguments as a dict; `**d` in a call unpacks a dict into keyword arguments.'],
    [r'\(\s*\*\w+|,\s*\*\w+', '*args', '`*args` collects (or passes) extra positional arguments as a tuple.'],
    [r'\bis None\b|\bis not None\b', 'is None', 'Checks for `None` by identity, the recommended way.'],
    [r'\bor \[\]|\bor \{\}', 'or []', '`x or []`: if `x` is `None` or empty, use an empty list. Many Maya commands return `None` instead of `[]`.'],
    [r' if .+ else ', 'conditional expression', '`a if condition else b` picks one of two values in a single expression.'],
    [r'"\{\d*\}|\'\{\d*\}|\{\d+(:[^}]*)?\}', 'str.format', '`"{0} {1}".format(a, b)` fills the numbered placeholders. `{0:.2f}` formats with 2 decimals.'],
    [r'\bassert\b', 'assert', 'Stops with an error if the condition is false. Used in tests and sanity checks.'],
    [r'^\s*from __future__ import', '__future__', 'Turns on Python 3 behavior in Python 2. `division` makes `/` always return a decimal result.'],
    [r'^\s*(import|from)\s', 'import', 'Loads a module so its functions can be used. `as` gives it a short name.'],
    [r'^\s*return\b', 'return', 'Ends the function and hands back a value (or `None` if no value is given).'],
    [r'^\s*continue\b', 'continue', 'Skips the rest of this loop pass and moves to the next item.'],
    [r'^\s*break\b', 'break', 'Leaves the loop immediately.'],
    [r'^\s*pass\b', 'pass', 'Does nothing; a placeholder where Python needs a statement.'],
    [r'\[\s*-?\d*\s*:\s*-?\d*\s*\]', 'slice', '`items[a:b]` takes a part of a list or string; `[-1]` is the last item, `[:-1]` everything but the last.'],
    [r'\bdel\b', 'del', 'Deletes a variable, list item or dict key.'],
    [r'\bisinstance\(', 'isinstance', 'Checks a value\'s type.'],
]
