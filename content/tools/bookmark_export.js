TOOLS.add({
"id": "bookmark_export",
"order": 3,
"title": "Bookmark Export",
"tagline": "Playblast every time slider bookmark as its own clean .mp4, with an optional subtle camera move.",
"overview": [
"Animators mark the parts of a scene with **time slider bookmarks** (idle, loop, transition...). This tool playblasts each bookmark as its own movie, from a chosen camera, with the rig and grid hidden and anti-aliasing on. With no bookmarks, it exports the playback range.",
"### Output formats",
"- **.mp4 (H.264)**: Maya 2020 cannot write mp4, so the tool playblasts PNG frames and encodes them with **ffmpeg** (an external program).\n- **PNG sequence**: always works.\n- **Maya's movie writer** (.mov/.avi): the fallback when there is no ffmpeg.",
"Options: join every clip into one `<scene>_all.mp4`, include the timeline audio, and **drop the last frame** of each clip so loops play without a hitch.",
"### Camera move",
"Optionally, it builds a **new camera** with a subtle orbit, push-in and rise that runs continuously through the chosen clips in order, skipping the gaps between them. Good for reels: idle → loop → idle feels like one shot. Your original camera is never changed."
],
"why": [
"### Pure functions first",
"Everything that is just logic (clip list, file names, frame rates, the ffmpeg command, the camera move curve) is a small function with no Maya calls, tested in `tests/test_bookmark_export.py`. The Maya parts only gather data and call them.",
"### A temporary viewport",
"Playblasting the user's viewport would capture whatever is shown there: selection highlight, the rig, the grid, the HUD. `_Viewport` opens a separate window with its own model panel, sets it up for a clean capture, and restores the render settings and deletes the window afterwards, even on error, because it is a context manager.",
"### Fail early and clearly",
"ffmpeg is checked (found **and** actually runs) before any playblast starts, so you never wait for 20 playblasts to learn the encode will fail. Error messages say what to do (install ffmpeg, allow it in macOS privacy settings, use PNG). Expected problems are `BookmarkExportError`; the UI shows them as messages.",
"### Exact timing",
"NTSC rates such as 29.97 are passed to ffmpeg as exact fractions (`30000/1001`) and the audio length is set from the frame count, so the sound stays in sync and never cuts the video short.",
"### Camera move without touching the source",
"The move is baked on a duplicate camera tagged with the name of its source. Running it again deletes the old duplicate first, and picking the duplicate by mistake still finds the real source through the tag."
],
"flow": [
"### Export",
"1. `refresh` reads the bookmarks (`read_bookmarks`) and the playback range, builds the clip list with `make_clips` and shows it with checkboxes.\n2. **Export Playblasts** → `_export` reads the settings (`get_cfg`), saves them, and calls `export(cfg, clips)`.\n3. `export` picks the camera and folder, makes file names (`file_names`), checks ffmpeg, remembers the current frame and selection, and opens `_Viewport`.\n4. For each clip: `_export_mp4` (playblast PNGs → `renumber_plan` → `encode_cmd` → `run_process`), or `_export_png`, or `_export_native`.\n5. Optionally `_join` concatenates the mp4s. Finally the frame and selection are restored and a report is returned.",
"### Camera move",
"`_make_move` → `build_camera_move`: `progress_map` turns the clips into a 0→1 progress per frame, `move_at` turns progress into orbit/dolly/crane amounts, and for every frame the source camera's matrix is orbited around a pivot (`_pivot_at`) and keyed on the new camera."
],
"review": [
"**Camera move undo.** `build_camera_move` creates a camera and many keys without an undo chunk, so undoing it takes many Ctrl+Z. Wrapping it in `undoInfo(openChunk/closeChunk)` would make it one step.",
"**Rise keeps the aim.** The crane offset moves the camera up without re-aiming it, so the subject slides down in frame as it rises. That reads as a crane, but aiming at the pivot would keep the subject framed.",
"**Camera is not remembered.** `_save` leaves out `camera` and `target` on purpose (they are scene specific), so `_pending_camera` from saved settings is always empty and the active camera is used. Worth knowing when reading `refresh_cameras`.",
"**Small things.** `refresh` calls `read_bookmarks()` twice, and a cancelled export keeps the clips already written (the report says \"Cancelled\")."
],
"files": [
{
"path": "bookmark_export.py",
"lang": "py",
"note": "The whole tool: pure helpers, scene reading, the temporary viewport, the export, the camera move and the UI.",
"code": "# -*- coding: utf-8 -*-\n\"\"\"\nBookmark Export  -  Maya 2020.x (Python 2.7 / PySide2)\n\nPlayblasts every time slider bookmark as its own .mp4 (or the playback range\nwhen the scene has no bookmarks), from a chosen camera, with the rig hidden.\n\n  * .mp4 (H.264) through ffmpeg: Maya 2020 can't write mp4 itself, so frames\n    are playblasted as PNG and encoded. Without ffmpeg it falls back to\n    Maya's own QuickTime / AVI.\n  * Optional: join all clips into one <scene>_all.mp4, timeline audio, drop the\n    last frame of each clip for seamless loops.\n  * Secondary: a subtle camera move (orbit / dolly / crane) baked on a NEW\n    camera, running continuously through the chosen clips in order (gaps\n    between bookmarks are skipped), e.g. idle > loop start > loop end > idle.\n\nInstall : copy this file to your scripts folder (e.g. ~/maya/2020/scripts)\nRun     : import bookmark_export; bookmark_export.show()\n\"\"\"\nfrom __future__ import division, print_function\n\nimport glob\nimport json\nimport math\nimport os\nimport re\nimport shutil\nimport subprocess\nimport traceback\n\ntry:\n    import maya.cmds as cmds\n    import maya.mel as mel\n    import maya.OpenMayaUI as omui\n    import maya.api.OpenMaya as om\nexcept ImportError:  # the pure parts can be tested outside of Maya\n    cmds = mel = omui = om = None\n\ntry:\n    from PySide2 import QtCore, QtWidgets\n    from shiboken2 import wrapInstance\nexcept ImportError:\n    try:\n        from PySide6 import QtCore, QtWidgets\n        from shiboken6 import wrapInstance\n    except ImportError:\n        QtCore = QtWidgets = wrapInstance = None\n\ntry:\n    long\nexcept NameError:\n    long = int\n\nOPTION_VAR = 'bookmarkExportSettings'\nCAM_TAG = 'bookmarkExportSourceCamera'\nPADDING = 5\n\nFPS_UNITS = {'game': 15.0, 'film': 24.0, 'pal': 25.0, 'ntsc': 30.0, 'show': 48.0,\n             'palf': 50.0, 'ntscf': 60.0, 'millisec': 1000.0, 'sec': 1.0,\n             'min': 1.0 / 60.0, 'hour': 1.0 / 3600.0}\n\nQUALITY = {'high': 16, 'medium': 20, 'small': 25}    # x264 CRF\n\nPROFILE_DRIFT = 'drift'         # eased, one direction\nPROFILE_RETURN = 'return'       # goes out and comes back: first and last frame match\nPROFILE_LINEAR = 'linear'\n\nDEFAULTS = {\n    'camera': '',\n    'folder': '',\n    'template': '{scene}_{clip}',\n    'width': 1920,\n    'height': 1080,\n    'format': 'mp4',            # mp4 | native\n    'ffmpeg': '',\n    'quality': 'high',\n    'audio': True,\n    'join': False,\n    'full_range': False,\n    'drop_last': False,\n    'keep_frames': False,\n    'hide_rig': True,\n    'antialias': True,\n    'ao': False,\n    'textures': True,\n    'scene_lights': False,\n    # camera move\n    'target': '',\n    'orbit': 12.0,\n    'profile': PROFILE_DRIFT,\n    'dolly': 3.0,               # % closer at the end (or at the middle for return)\n    'crane': 0.0,               # height change, scene units\n    'follow': False,\n}\n\n\nclass BookmarkExportError(Exception):\n    pass\n\n\n# --------------------------------------------------------------------------\n# pure helpers (tested in tests/test_bookmark_export.py)\n# --------------------------------------------------------------------------\ndef parse_fps(unit):\n    \"\"\"Maya time unit ('film', 'ntsc', '23.976fps', '120fps'...) to fps.\"\"\"\n    if unit in FPS_UNITS:\n        return FPS_UNITS[unit]\n    m = re.match(r'^(\\d+(?:\\.\\d+)?)fps$', unit or '')\n    if m:\n        return float(m.group(1))\n    raise ValueError('Unknown time unit: %s' % unit)\n\n\ndef ffmpeg_rate(fps):\n    \"\"\"Exact rate string: NTSC rates as fractions so audio stays in sync.\"\"\"\n    for exact, frac in ((23.976, '24000/1001'), (29.97, '30000/1001'), (47.952, '48000/1001'),\n                        (59.94, '60000/1001'), (119.88, '120000/1001')):\n        if abs(fps - exact) < 1e-3:\n            return frac\n    return ('%g' % fps)\n\n\ndef sanitize(name):\n    clean = re.sub(r'[^A-Za-z0-9_\\-]+', '_', name or '').strip('_')\n    return clean or 'clip'\n\n\ndef file_names(clips, template, scene, camera):\n    \"\"\"One unique, safe file name (no extension) per clip.\"\"\"\n    out, seen = [], {}\n    for i, c in enumerate(clips):\n        try:\n            name = template.format(scene=scene, clip=c['name'], index=i + 1,\n                                   start=c['start'], end=c['end'], camera=camera)\n        except (KeyError, IndexError, ValueError):\n            raise ValueError('Bad name template \"%s\". Use {scene} {clip} {index} {start} '\n                             '{end} {camera}.' % template)\n        name = sanitize(name)\n        base, n = name, seen.get(name.lower(), 0)\n        while name.lower() in seen:\n            n += 1\n            name = '%s_%d' % (base, n + 1)\n        seen[base.lower()] = n\n        seen[name.lower()] = 0\n        out.append(name)\n    return out\n\n\ndef make_clips(bookmarks, playback, full_range=False, drop_last=False):\n    \"\"\"\n    bookmarks: [{'name', 'start', 'end'}] (end inclusive) in any order.\n    playback: (start, end). Clips are sorted by start; the playback range is\n    used when there are no bookmarks (or added when full_range is on).\n    \"\"\"\n    clips = [dict(b) for b in sorted(bookmarks, key=lambda b: (b['start'], b['end']))]\n    if not clips or full_range:\n        clips.append({'name': 'range', 'start': int(playback[0]), 'end': int(playback[1])})\n    for c in clips:\n        if c['end'] < c['start']:\n            c['start'], c['end'] = c['end'], c['start']\n        if drop_last and c['end'] > c['start']:\n            c['end'] -= 1\n    return clips\n\n\ndef merge_segments(clips):\n    \"\"\"Overlapping / touching clips as contiguous (start, end) runs.\"\"\"\n    out = []\n    for c in sorted(clips, key=lambda c: (c['start'], c['end'])):\n        if out and c['start'] <= out[-1][1] + 1:\n            out[-1][1] = max(out[-1][1], c['end'])\n        else:\n            out.append([c['start'], c['end']])\n    return [tuple(s) for s in out]\n\n\ndef progress_map(clips):\n    \"\"\"\n    {frame: 0..1} for every frame from the first to the last clip frame.\n    Progress only advances on frames inside clips, so the camera move runs\n    continuously through the clips and simply waits during gaps.\n    \"\"\"\n    segments = merge_segments(clips)\n    if not segments:\n        return {}\n    frames = [f for a, b in segments for f in range(a, b + 1)]\n    n = max(1, len(frames) - 1)\n    inside = dict((f, i / float(n)) for i, f in enumerate(frames))\n    out, last = {}, 0.0\n    for f in range(segments[0][0], segments[-1][1] + 1):\n        last = inside.get(f, last)\n        out[f] = last\n    return out\n\n\ndef smoothstep(u):\n    u = max(0.0, min(1.0, u))\n    return u * u * (3.0 - 2.0 * u)\n\n\ndef profile(u, kind):\n    \"\"\"Shape of the move over the whole sequence: 0 at the start.\"\"\"\n    u = max(0.0, min(1.0, u))\n    if kind == PROFILE_RETURN:\n        return 0.5 - 0.5 * math.cos(2.0 * math.pi * u)     # 0 > 1 > 0, eased\n    if kind == PROFILE_LINEAR:\n        return u\n    return smoothstep(u)\n\n\ndef move_at(u, cfg):\n    \"\"\"(orbit degrees, distance factor, crane offset) at progress u.\"\"\"\n    p = profile(u, cfg['profile'])      # 'return' goes 0 > 1 > 0 by itself\n    return cfg['orbit'] * p, 1.0 - cfg['dolly'] / 100.0 * p, cfg['crane'] * p\n\n\ndef encode_cmd(ffmpeg, pattern, fps, out, crf, audio=None, audio_start=0.0, frames=None):\n    \"\"\"\n    ffmpeg command line: PNG sequence (numbered from 0) to H.264 mp4. With\n    audio, the length is set from the frame count: the sound never cuts the\n    video short, and never runs past it.\n    \"\"\"\n    rate = ffmpeg_rate(fps)\n    cmd = [ffmpeg, '-y', '-loglevel', 'error', '-framerate', rate, '-start_number', '0',\n           '-i', pattern]\n    if audio:\n        if audio_start >= 0:\n            cmd += ['-ss', '%.6f' % audio_start, '-i', audio]\n        else:\n            cmd += ['-itsoffset', '%.6f' % -audio_start, '-i', audio]\n        cmd += ['-map', '0:v:0', '-map', '1:a:0', '-c:a', 'aac', '-b:a', '192k']\n        if frames:\n            cmd += ['-t', '%.6f' % (frames / float(fps))]\n    cmd += ['-c:v', 'libx264', '-preset', 'slow', '-crf', str(crf),\n            '-vf', 'pad=ceil(iw/2)*2:ceil(ih/2)*2',     # x264 needs even sizes\n            '-pix_fmt', 'yuv420p', '-r', rate, '-movflags', '+faststart', out]\n    return cmd\n\n\ndef concat_list(paths):\n    \"\"\"Contents of an ffmpeg concat list file.\"\"\"\n    return ''.join(\"file '%s'\\n\" % p.replace('\\\\', '/').replace(\"'\", \"'\\\\''\") for p in paths)\n\n\ndef renumber_plan(paths):\n    \"\"\"\n    Playblast frame files to sequential names (0..n-1), whatever the frame\n    numbers were (negative frames, gaps). Returns [(old, new)] in frame order.\n    \"\"\"\n    def frame_of(p):\n        m = re.search(r'\\.(-?\\d+)\\.png$', p)\n        return int(m.group(1)) if m else None\n    found = sorted((frame_of(p), p) for p in paths if frame_of(p) is not None)\n    out = []\n    for i, (_, p) in enumerate(found):\n        folder = os.path.dirname(p)\n        out.append((p, os.path.join(folder, 'seq.%0*d.png' % (PADDING, i))))\n    return out\n\n\n# --------------------------------------------------------------------------\n# Maya: scene\n# --------------------------------------------------------------------------\ndef read_bookmarks():\n    try:\n        cmds.loadPlugin('timeSliderBookmark', quiet=True)\n    except RuntimeError:\n        pass\n    out = []\n    for node in cmds.ls(type='timeSliderBookmark') or []:\n        try:\n            out.append({'node': node,\n                        'name': cmds.getAttr(node + '.name') or node,\n                        'start': int(round(cmds.getAttr(node + '.timeRangeStart'))),\n                        'end': int(round(cmds.getAttr(node + '.timeRangeStop')))})\n        except Exception:\n            continue\n    return sorted(out, key=lambda b: (b['start'], b['end']))\n\n\ndef playback_range():\n    return (int(cmds.playbackOptions(q=True, min=True)),\n            int(cmds.playbackOptions(q=True, max=True)))\n\n\ndef scene_fps():\n    return parse_fps(cmds.currentUnit(q=True, time=True))\n\n\ndef scene_name():\n    path = cmds.file(q=True, sceneName=True)\n    return os.path.splitext(os.path.basename(path))[0] if path else 'untitled'\n\n\ndef cameras():\n    shapes = cmds.ls(type='camera', long=True) or []\n    out = []\n    for s in shapes:\n        xf = cmds.listRelatives(s, parent=True, fullPath=True)\n        if xf:\n            out.append(xf[0].split('|')[-1] if len(cmds.ls(xf[0].split('|')[-1])) == 1\n                       else xf[0])\n    return sorted(out, key=lambda n: (n in ('persp', 'top', 'front', 'side'), n.lower()))\n\n\ndef active_camera():\n    panel = cmds.getPanel(withFocus=True)\n    if not panel or cmds.getPanel(typeOf=panel) != 'modelPanel':\n        panels = cmds.getPanel(visiblePanels=True) or []\n        panels = [p for p in panels if cmds.getPanel(typeOf=p) == 'modelPanel']\n        panel = panels[0] if panels else None\n    if not panel:\n        return None\n    cam = cmds.modelPanel(panel, q=True, camera=True)\n    if cmds.nodeType(cam) == 'camera':\n        cam = cmds.listRelatives(cam, parent=True)[0]\n    return cam\n\n\ndef timeline_sound():\n    \"\"\"(file, offset frame) of the sound shown on the time slider, or None.\"\"\"\n    try:\n        slider = mel.eval('$tmp = $gPlayBackSlider;')\n        node = cmds.timeControl(slider, q=True, sound=True)\n        if not node or not cmds.timeControl(slider, q=True, displaySound=True):\n            return None\n        path = cmds.getAttr(node + '.filename')\n        if path and os.path.isfile(path):\n            return path, cmds.getAttr(node + '.offset')\n    except Exception:\n        pass\n    return None\n\n\ndef find_ffmpeg(custom=''):\n    candidates = [custom] if custom else []\n    for d in os.environ.get('PATH', '').split(os.pathsep):\n        candidates.append(os.path.join(d, 'ffmpeg'))\n        candidates.append(os.path.join(d, 'ffmpeg.exe'))\n    candidates += ['/opt/homebrew/bin/ffmpeg', '/usr/local/bin/ffmpeg', '/usr/bin/ffmpeg',\n                   'C:/ffmpeg/bin/ffmpeg.exe', 'C:/Program Files/ffmpeg/bin/ffmpeg.exe']\n    for c in candidates:\n        if c and os.path.isfile(c) and os.access(c, os.X_OK):\n            return c\n    return None\n\n\ndef run_process(cmd):\n    kw = {'stdout': subprocess.PIPE, 'stderr': subprocess.PIPE}\n    if os.name == 'nt':\n        kw['creationflags'] = 0x08000000        # no console window\n    proc = subprocess.Popen(cmd, **kw)\n    out, err = proc.communicate()\n    if proc.returncode != 0:\n        raise BookmarkExportError('ffmpeg failed:\\n%s' % (err.decode('utf-8', 'replace')\n                                                     if isinstance(err, bytes) else err))\n\n\n# --------------------------------------------------------------------------\n# Maya: viewport for the playblast\n# --------------------------------------------------------------------------\nclass _Viewport(object):\n    \"\"\"A temporary panel looking through the camera, rig hidden, nice AA.\"\"\"\n\n    GLOBALS = 'hardwareRenderingGlobals'\n\n    def __init__(self, camera, cfg):\n        self.camera = camera\n        self.cfg = cfg\n        self.window = None\n        self.panel = None\n        self.saved = {}\n\n    def __enter__(self):\n        cfg = self.cfg\n        for attr, value in (('multiSampleEnable', cfg['antialias']),\n                            ('multiSampleCount', 16 if cfg['antialias'] else None),\n                            ('ssaoEnable', cfg['ao'])):\n            if value is None:\n                continue\n            plug = '%s.%s' % (self.GLOBALS, attr)\n            if cmds.objExists(plug):\n                self.saved[plug] = cmds.getAttr(plug)\n                cmds.setAttr(plug, value)\n        self.window = cmds.window(title='Bookmark Export', widthHeight=(960, 540),\n                                  sizeable=True)\n        cmds.paneLayout()\n        self.panel = cmds.modelPanel(menuBarVisible=False, label='Bookmark Export')\n        cmds.showWindow(self.window)\n        ed = self.panel\n        cmds.modelEditor(ed, e=True, camera=self.camera, displayAppearance='smoothShaded',\n                         displayTextures=cfg['textures'],\n                         displayLights='all' if cfg['scene_lights'] else 'default',\n                         headsUpDisplay=False, manipulators=False, grid=False,\n                         selectionHiliteDisplay=False, wireframeOnShaded=False)\n        if cfg['hide_rig']:\n            cmds.modelEditor(ed, e=True, allObjects=False)\n            for flag in ('polymeshes', 'nurbsSurfaces', 'subdivSurfaces', 'pluginShapes',\n                         'fluids', 'hairSystems', 'nParticles', 'particleInstancers',\n                         'imagePlane', 'strokes'):\n                try:\n                    cmds.modelEditor(ed, e=True, **{flag: True})\n                except TypeError:\n                    pass\n        try:\n            cmds.setFocus(self.panel)\n        except Exception:\n            pass\n        return self\n\n    def __exit__(self, *args):\n        for plug, value in self.saved.items():\n            try:\n                cmds.setAttr(plug, value)\n            except Exception:\n                pass\n        if self.window and cmds.window(self.window, exists=True):\n            cmds.deleteUI(self.window)\n        if self.panel and cmds.modelPanel(self.panel, exists=True):\n            cmds.deleteUI(self.panel, panel=True)\n\n    def playblast(self, **kw):\n        kw.update(offScreen=True, viewer=False, showOrnaments=False, percent=100,\n                  forceOverwrite=True, clearCache=True, quality=100)\n        try:\n            return cmds.playblast(editorPanelName=self.panel, **kw)\n        except TypeError:       # older Maya without editorPanelName\n            return cmds.playblast(**kw)\n\n\n# --------------------------------------------------------------------------\n# Maya: export\n# --------------------------------------------------------------------------\nclass _Progress(object):\n    def __init__(self, total):\n        self.total = max(1, total)\n        self.done = 0\n        self.ui = not cmds.about(batch=True)\n        if self.ui:\n            cmds.progressWindow(title='Bookmark Export', progress=0, maxValue=100,\n                                status='Starting...', isInterruptable=True)\n\n    def step(self, status):\n        if self.ui:\n            if cmds.progressWindow(q=True, isCancelled=True):\n                raise KeyboardInterrupt\n            cmds.progressWindow(e=True, status=status,\n                                progress=int(100.0 * self.done / self.total))\n        self.done += 1\n\n    def close(self):\n        if self.ui:\n            cmds.progressWindow(endProgress=True)\n\n\ndef _native_format():\n    \"\"\"\n    Maya's own movie writer for this platform. Never 'qt' on macOS: Maya\n    2020's QuickTime 7 path is dead on recent macOS and fails with a\n    misleading \"out of disk space\" error. On Windows, 'qt' needs QuickTime.\n    \"\"\"\n    formats = cmds.playblast(q=True, format=True) or []\n    if cmds.about(macOS=True) and 'avfoundation' in formats:\n        return 'avfoundation', 'H.264', '.mov'\n    if 'avi' in formats:\n        return 'avi', 'none', '.avi'\n    if 'qt' in formats:\n        return 'qt', 'H.264', '.mov'\n    raise BookmarkExportError('No movie format available in this Maya. Use .mp4 (ffmpeg) or '\n                              'PNG sequence.')\n\n\ndef ffmpeg_hint():\n    if cmds is not None and cmds.about(macOS=True):\n        return 'Install it with Homebrew (\"brew install ffmpeg\") or browse to the ffmpeg file.'\n    return ('Download it (e.g. gyan.dev/ffmpeg/builds, \"essentials\"), unzip, and browse to '\n            'bin/ffmpeg.exe.')\n\n\ndef check_ffmpeg(path):\n    \"\"\"Raises with a clear message unless ffmpeg is there and actually runs.\"\"\"\n    if not path:\n        raise BookmarkExportError('ffmpeg was not found, so .mp4 can\\'t be written. ' +\n                                  ffmpeg_hint() + ' Or pick the PNG sequence format.')\n    try:\n        run_process([path, '-version'])\n    except (OSError, BookmarkExportError) as e:\n        raise BookmarkExportError('ffmpeg at %s does not run (%s). On macOS, a downloaded '\n                                  'ffmpeg may need to be allowed in System Settings > Privacy '\n                                  '& Security. %s' % (path, str(e).splitlines()[0],\n                                                      ffmpeg_hint()))\n\n\ndef export(cfg, clips):\n    \"\"\"clips: [{'name', 'start', 'end'}]. Returns (report, folder).\"\"\"\n    camera = cfg['camera'] or active_camera()\n    if not camera or not cmds.objExists(camera):\n        raise BookmarkExportError('Pick the camera to playblast from.')\n    if not clips:\n        raise BookmarkExportError('No clips to export.')\n    folder = cfg['folder'] or os.path.join(cmds.workspace(q=True, rootDirectory=True),\n                                           'movies', 'bookmarks')\n    if not os.path.isdir(folder):\n        os.makedirs(folder)\n    names = file_names(clips, cfg['template'], scene_name(), camera.split('|')[-1])\n    fps = scene_fps()\n\n    fmt = cfg['format']\n    use_mp4 = fmt == 'mp4'\n    ffmpeg = None\n    if use_mp4:\n        ffmpeg = find_ffmpeg(cfg['ffmpeg'])\n        check_ffmpeg(ffmpeg)            # stop before any playblast, never fall back silently\n    notes = []\n    sound = timeline_sound() if cfg['audio'] else None\n\n    width, height = int(cfg['width']), int(cfg['height'])\n    saved_time = cmds.currentTime(q=True)\n    saved_sel = cmds.ls(sl=True)\n    cmds.select(clear=True)         # no selection highlight in the playblast\n    progress = _Progress(len(clips) * (2 if use_mp4 else 1) + (1 if cfg['join'] else 0))\n    outputs = []\n    try:\n        with _Viewport(camera, cfg) as view:\n            for clip, name in zip(clips, names):\n                progress.step('Playblasting %s (%d-%d)' % (clip['name'], clip['start'],\n                                                           clip['end']))\n                if use_mp4:\n                    outputs.append(_export_mp4(view, clip, name, folder, ffmpeg, fps, cfg,\n                                               sound, width, height, progress))\n                elif fmt == 'png':\n                    outputs.append(_export_png(view, clip, name, folder, width, height))\n                else:\n                    outputs.append(_export_native(view, clip, name, folder, width, height,\n                                                  sound))\n            if cfg['join'] and len(outputs) > 1:\n                progress.step('Joining clips')\n                if use_mp4:\n                    outputs.append(_join(ffmpeg, outputs, folder))\n                else:\n                    notes.append('Joining needs the .mp4 format: skipped.')\n    except KeyboardInterrupt:\n        notes.append('Cancelled.')\n    finally:\n        progress.close()\n        cmds.currentTime(saved_time, edit=True)\n        if saved_sel:\n            cmds.select(saved_sel, replace=True)\n\n    lines = ['%d file(s) in %s' % (len(outputs), folder)]\n    lines += ['  ' + os.path.basename(p) for p in outputs]\n    return '\\n'.join(lines + notes), folder\n\n\ndef _export_mp4(view, clip, name, folder, ffmpeg, fps, cfg, sound, width, height, progress):\n    frames_dir = os.path.join(folder, '_frames', name)\n    if os.path.isdir(frames_dir):\n        shutil.rmtree(frames_dir)\n    os.makedirs(frames_dir)\n    view.playblast(format='image', compression='png', filename=os.path.join(frames_dir, 'f'),\n                   startTime=clip['start'], endTime=clip['end'], framePadding=PADDING,\n                   widthHeight=(width, height))\n    pngs = glob.glob(os.path.join(frames_dir, 'f.*.png'))\n    if not pngs:\n        raise BookmarkExportError('The playblast of %s produced no frames.' % clip['name'])\n    for old, new in renumber_plan(pngs):\n        os.rename(old, new)\n    progress.step('Encoding %s' % name)\n    out = os.path.join(folder, name + '.mp4')\n    audio, audio_start = None, 0.0\n    if sound:\n        audio = sound[0]\n        audio_start = (clip['start'] - sound[1]) / fps\n    run_process(encode_cmd(ffmpeg, os.path.join(frames_dir, 'seq.%0' + str(PADDING) + 'd.png'),\n                           fps, out, QUALITY.get(cfg['quality'], 18), audio, audio_start,\n                           len(pngs)))\n    if not cfg['keep_frames']:\n        shutil.rmtree(frames_dir, ignore_errors=True)\n        parent = os.path.dirname(frames_dir)\n        if os.path.isdir(parent) and not os.listdir(parent):\n            os.rmdir(parent)\n    return out\n\n\ndef _export_png(view, clip, name, folder, width, height):\n    frames_dir = os.path.join(folder, name)\n    if os.path.isdir(frames_dir):\n        shutil.rmtree(frames_dir)\n    os.makedirs(frames_dir)\n    view.playblast(format='image', compression='png', filename=os.path.join(frames_dir, name),\n                   startTime=clip['start'], endTime=clip['end'], framePadding=4,\n                   widthHeight=(width, height))\n    if not glob.glob(os.path.join(frames_dir, '*.png')):\n        raise BookmarkExportError('The playblast of %s produced no frames.' % clip['name'])\n    return frames_dir\n\n\ndef _export_native(view, clip, name, folder, width, height, sound):\n    fmt, compression, ext = _native_format()\n    out = os.path.join(folder, name)\n    kw = {}\n    if sound:\n        slider = mel.eval('$tmp = $gPlayBackSlider;')\n        kw['sound'] = cmds.timeControl(slider, q=True, sound=True)\n    try:\n        result = view.playblast(format=fmt, compression=compression, filename=out,\n                                startTime=clip['start'], endTime=clip['end'],\n                                widthHeight=(width, height), **kw)\n    except RuntimeError as e:\n        failed = True\n        result, reason = None, str(e).strip()\n    else:\n        result = result or out + ext\n        failed = not (os.path.isfile(result) and os.path.getsize(result) > 0)\n        reason = 'empty file'\n    if failed:\n        for leftover in (out + ext, result):\n            if leftover and os.path.isfile(leftover):\n                os.remove(leftover)         # never leave a movie that won't play\n        raise BookmarkExportError(\n            'Maya could not write the %s movie for %s (%s). Maya\\'s movie writer often fails '\n            'with a misleading \"out of disk space\" error: use .mp4 (ffmpeg) or PNG sequence.'\n            % (fmt, clip['name'], reason))\n    return result\n\n\ndef _join(ffmpeg, paths, folder):\n    list_file = os.path.join(folder, '_join_list.txt')\n    with open(list_file, 'w') as f:\n        f.write(concat_list(paths))\n    out = os.path.join(folder, sanitize(scene_name()) + '_all.mp4')\n    try:\n        run_process([ffmpeg, '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0',\n                     '-i', list_file, '-c', 'copy', '-movflags', '+faststart', out])\n    finally:\n        os.remove(list_file)\n    return out\n\n\n# --------------------------------------------------------------------------\n# Maya: camera move\n# --------------------------------------------------------------------------\ndef _matrix_at(node, t):\n    return om.MMatrix(cmds.getAttr(node + '.worldMatrix', time=t))\n\n\ndef _point(m):\n    return om.MVector(m.getElement(3, 0), m.getElement(3, 1), m.getElement(3, 2))\n\n\ndef _translate_matrix(v):\n    return om.MMatrix([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, v.x, v.y, v.z, 1])\n\n\ndef _orbit_matrix(degrees):\n    a = math.radians(degrees)\n    c, s = math.cos(a), math.sin(a)\n    return om.MMatrix([c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1])\n\n\ndef _pivot_at(cfg, camera, t):\n    \"\"\"World point the camera orbits around.\"\"\"\n    target = cfg['target']\n    if target and cmds.objExists(target):\n        return _point(_matrix_at(target, t))\n    m = _matrix_at(camera, t)\n    forward = -om.MVector(m.getElement(2, 0), m.getElement(2, 1), m.getElement(2, 2))\n    coi = om.MDistance(cmds.getAttr(camera + '.centerOfInterest'),\n                       om.MDistance.uiUnit()).asCentimeters()\n    return _point(m) + forward.normal() * coi\n\n\ndef build_camera_move(cfg, clips):\n    \"\"\"Bakes the move on a new camera. Returns its name.\"\"\"\n    source = cfg['camera'] or active_camera()\n    if not source or not cmds.objExists(source):\n        raise BookmarkExportError('Pick the camera the move starts from.')\n    if cmds.attributeQuery(CAM_TAG, node=source, exists=True):\n        source = cmds.getAttr(source + '.' + CAM_TAG)       # picked our own camera\n    progress = progress_map(clips)\n    if not progress:\n        raise BookmarkExportError('No clips to move the camera through.')\n    frames = sorted(progress)\n\n    name = '%s_move' % source.split('|')[-1]\n    for node in cmds.ls(type='transform') or []:\n        if cmds.attributeQuery(CAM_TAG, node=node, exists=True) and \\\n                cmds.getAttr(node + '.' + CAM_TAG) == source:\n            cmds.delete(node)\n    cam = cmds.duplicate(source, name=name, returnRootsOnly=True)[0]\n    for child in cmds.listRelatives(cam, children=True, fullPath=True, type='transform') or []:\n        cmds.delete(child)\n    if cmds.listRelatives(cam, parent=True):\n        cam = cmds.parent(cam, world=True)[0]\n    for a in ('t', 'r', 's', 'tx', 'ty', 'tz', 'rx', 'ry', 'rz', 'sx', 'sy', 'sz'):\n        cmds.setAttr('%s.%s' % (cam, a), lock=False)\n    cmds.addAttr(cam, longName=CAM_TAG, dataType='string')\n    cmds.setAttr(cam + '.' + CAM_TAG, source, type='string')\n    order = cmds.getAttr(cam + '.rotateOrder')\n\n    unit = om.MDistance(1.0, om.MDistance.kCentimeters).asUnits(om.MDistance.uiUnit())\n    crane_cfg = dict(cfg)\n    crane_cfg['crane'] = om.MDistance(cfg['crane'], om.MDistance.uiUnit()).asCentimeters()\n    pivot0 = _pivot_at(cfg, source, frames[0])\n    prev = None\n    keys = dict((a, []) for a in ('tx', 'ty', 'tz', 'rx', 'ry', 'rz'))\n    for f in frames:\n        base = _matrix_at(source, f)            # keeps any animation of the camera\n        pivot = pivot0\n        if cfg['follow'] and cfg['target']:\n            pivot = _pivot_at(cfg, source, f)\n            base = base * _translate_matrix(pivot - pivot0)\n        orbit, distance, crane = move_at(progress[f], crane_cfg)\n        m = base * _translate_matrix(-pivot) * _orbit_matrix(orbit) * _translate_matrix(pivot)\n        pos = _point(m)\n        pos = pivot + (pos - pivot) * distance + om.MVector(0.0, crane, 0.0)\n        tm = om.MTransformationMatrix(m)\n        rot = tm.rotation().reorder(order)\n        if prev is not None:\n            rot = rot.closestSolution(prev)\n        prev = rot\n        for a, v in (('tx', pos.x * unit), ('ty', pos.y * unit), ('tz', pos.z * unit),\n                     ('rx', math.degrees(rot.x)), ('ry', math.degrees(rot.y)),\n                     ('rz', math.degrees(rot.z))):\n            keys[a].append((f, v))\n    for a, values in keys.items():\n        for f, v in values:\n            cmds.setKeyframe(cam, attribute=a, time=f, value=v)\n        cmds.keyTangent(cam, attribute=a, inTangentType='linear', outTangentType='linear')\n    return cam\n\n\n# --------------------------------------------------------------------------\n# UI\n# --------------------------------------------------------------------------\ndef _maya_main_window():\n    ptr = omui.MQtUtil.mainWindow()\n    return wrapInstance(long(ptr), QtWidgets.QWidget)\n\n\n_DialogBase = QtWidgets.QDialog if QtWidgets else object\n\n\nclass BookmarkExportUI(_DialogBase):\n    OBJECT_NAME = 'bookmarkExportWindow'\n\n    def __init__(self, parent=None):\n        super(BookmarkExportUI, self).__init__(parent)\n        self.setObjectName(self.OBJECT_NAME)\n        self.setWindowTitle('Bookmark Export')\n        self.setMinimumWidth(500)\n        self._last_folder = None\n        self._build()\n        self._connect()\n        self.set_cfg(self._load())\n        self.refresh()\n\n    # -- layout -----------------------------------------------------------\n    def _build(self):\n        W = QtWidgets\n        main = W.QVBoxLayout(self)\n\n        box = W.QGroupBox('Clips')\n        lay = W.QVBoxLayout(box)\n        self.tree = W.QTreeWidget()\n        self.tree.setHeaderLabels(['Clip', 'Start', 'End', 'Frames'])\n        self.tree.setRootIsDecorated(False)\n        self.tree.setMaximumHeight(170)\n        lay.addWidget(self.tree)\n        row = W.QHBoxLayout()\n        self.b_refresh = W.QPushButton('Refresh')\n        self.b_all = W.QPushButton('All')\n        self.b_none = W.QPushButton('None')\n        for b in (self.b_refresh, self.b_all, self.b_none):\n            row.addWidget(b)\n        lay.addLayout(row)\n        self.full_range = W.QCheckBox('Also export the whole playback range')\n        self.drop_last = W.QCheckBox('Drop the last frame of each clip (seamless loops)')\n        self.drop_last.setToolTip('A loop from 30 to 90 where 90 repeats 30: exports 30-89 so '\n                                  'it plays back without a hitch when looped.')\n        lay.addWidget(self.full_range)\n        lay.addWidget(self.drop_last)\n        main.addWidget(box)\n\n        box = W.QGroupBox('Camera && Output')\n        grid = W.QGridLayout(box)\n        grid.addWidget(W.QLabel('Camera'), 0, 0)\n        self.camera = W.QComboBox()\n        self.camera.setEditable(True)\n        grid.addWidget(self.camera, 0, 1, 1, 2)\n        self.b_cams = W.QPushButton('Reload')\n        grid.addWidget(self.b_cams, 0, 3)\n        grid.addWidget(W.QLabel('Folder'), 1, 0)\n        self.folder = W.QLineEdit()\n        self.folder.setPlaceholderText('<project>/movies/bookmarks')\n        grid.addWidget(self.folder, 1, 1, 1, 2)\n        self.b_folder = W.QPushButton('Browse')\n        grid.addWidget(self.b_folder, 1, 3)\n        grid.addWidget(W.QLabel('File name'), 2, 0)\n        self.template = W.QLineEdit()\n        self.template.setToolTip('Tokens: {scene} {clip} {index} {start} {end} {camera}')\n        grid.addWidget(self.template, 2, 1, 1, 3)\n        grid.addWidget(W.QLabel('Size'), 3, 0)\n        size = W.QHBoxLayout()\n        self.width = W.QSpinBox()\n        self.height = W.QSpinBox()\n        for s in (self.width, self.height):\n            s.setRange(16, 8192)\n        self.size_preset = W.QComboBox()\n        self.size_preset.addItems(['Presets', '1920 x 1080', '1280 x 720', '3840 x 2160',\n                                   '1080 x 1080', '1080 x 1920', 'Render settings'])\n        size.addWidget(self.width)\n        size.addWidget(W.QLabel('x'))\n        size.addWidget(self.height)\n        size.addWidget(self.size_preset)\n        grid.addLayout(size, 3, 1, 1, 3)\n        grid.addWidget(W.QLabel('Format'), 4, 0)\n        self.format = W.QComboBox()\n        self.format.addItem('.mp4 (H.264, needs ffmpeg)', 'mp4')\n        self.format.addItem('PNG sequence (always works)', 'png')\n        self.format.addItem(\"Maya's movie writer (.mov / .avi)\", 'native')\n        grid.addWidget(self.format, 4, 1)\n        self.quality = W.QComboBox()\n        self.quality.addItem('High quality', 'high')\n        self.quality.addItem('Medium', 'medium')\n        self.quality.addItem('Small files', 'small')\n        grid.addWidget(self.quality, 4, 2, 1, 2)\n        grid.addWidget(W.QLabel('ffmpeg'), 5, 0)\n        self.ffmpeg = W.QLineEdit()\n        self.ffmpeg.setPlaceholderText('auto-detect')\n        grid.addWidget(self.ffmpeg, 5, 1, 1, 2)\n        self.b_ffmpeg = W.QPushButton('Browse')\n        grid.addWidget(self.b_ffmpeg, 5, 3)\n        self.ffmpeg_status = W.QLabel('')\n        grid.addWidget(self.ffmpeg_status, 6, 1, 1, 3)\n        self.audio = W.QCheckBox('Timeline audio')\n        self.join = W.QCheckBox('Also join into one <scene>_all.mp4')\n        self.keep = W.QCheckBox('Keep PNG frames')\n        grid.addWidget(self.audio, 7, 1)\n        grid.addWidget(self.join, 7, 2)\n        grid.addWidget(self.keep, 7, 3)\n        main.addWidget(box)\n\n        box = W.QGroupBox('Look')\n        grid = W.QGridLayout(box)\n        self.hide_rig = W.QCheckBox('Geometry only (hide rig, grid)')\n        self.antialias = W.QCheckBox('Anti-aliasing')\n        self.ao = W.QCheckBox('Ambient occlusion')\n        self.textures = W.QCheckBox('Textures')\n        self.scene_lights = W.QCheckBox('Scene lights')\n        for i, w in enumerate((self.hide_rig, self.antialias, self.ao, self.textures,\n                               self.scene_lights)):\n            grid.addWidget(w, i // 3, i % 3)\n        main.addWidget(box)\n\n        box = W.QGroupBox('Camera move (optional)')\n        box.setToolTip('Creates a new camera with a subtle move running continuously through '\n                       'the checked clips in order. Your camera is not changed.')\n        grid = W.QGridLayout(box)\n        grid.addWidget(W.QLabel('Orbit around'), 0, 0)\n        self.target = W.QLineEdit()\n        self.target.setPlaceholderText(\"camera's center of interest\")\n        grid.addWidget(self.target, 0, 1, 1, 2)\n        self.b_target = W.QPushButton('<<')\n        self.b_target.setToolTip('Use the selected object (e.g. the character root)')\n        grid.addWidget(self.b_target, 0, 3)\n        grid.addWidget(W.QLabel('Orbit'), 1, 0)\n        self.orbit = W.QDoubleSpinBox()\n        self.orbit.setRange(-360, 360)\n        self.orbit.setSuffix(' deg')\n        self.orbit.setToolTip('Total turn over the whole sequence. Negative turns the other way.')\n        grid.addWidget(self.orbit, 1, 1)\n        grid.addWidget(W.QLabel('Push in'), 1, 2)\n        self.dolly = W.QDoubleSpinBox()\n        self.dolly.setRange(-50, 50)\n        self.dolly.setSuffix(' %')\n        self.dolly.setToolTip('How much closer the camera gets. Negative pulls out.')\n        grid.addWidget(self.dolly, 1, 3)\n        grid.addWidget(W.QLabel('Rise'), 2, 0)\n        self.crane = W.QDoubleSpinBox()\n        self.crane.setRange(-1e5, 1e5)\n        self.crane.setDecimals(2)\n        self.crane.setToolTip('Height change in scene units. Negative lowers.')\n        grid.addWidget(self.crane, 2, 1)\n        grid.addWidget(W.QLabel('Feel'), 2, 2)\n        self.profile = W.QComboBox()\n        self.profile.addItem('Drift (eased)', PROFILE_DRIFT)\n        self.profile.addItem('Out and back (ends match)', PROFILE_RETURN)\n        self.profile.addItem('Constant speed', PROFILE_LINEAR)\n        self.profile.setToolTip('Out and back: the last frame matches the first, so the '\n                                'whole reel loops seamlessly (idle to idle).')\n        grid.addWidget(self.profile, 2, 3)\n        self.follow = W.QCheckBox('Follow the target (root motion)')\n        grid.addWidget(self.follow, 3, 0, 1, 2)\n        self.b_move = W.QPushButton('Create Camera Move')\n        self.b_move.setToolTip('Re-create it any time: the previous one is replaced.')\n        grid.addWidget(self.b_move, 3, 2, 1, 2)\n        main.addWidget(box)\n\n        row = W.QHBoxLayout()\n        self.b_open = W.QPushButton('Open Folder')\n        self.b_export = W.QPushButton('Export Playblasts')\n        self.b_export.setStyleSheet('QPushButton {font-weight: bold; padding: 6px;'\n                                    'background: #3fa9f5; color: #10202c;}')\n        row.addWidget(self.b_open)\n        row.addWidget(self.b_export, 1)\n        main.addLayout(row)\n        self.status = W.QLabel('')\n        self.status.setWordWrap(True)\n        self.status.setTextInteractionFlags(QtCore.Qt.TextSelectableByMouse)\n        main.addWidget(self.status)\n\n    def _connect(self):\n        self.b_refresh.clicked.connect(self.refresh)\n        self.b_all.clicked.connect(lambda: self._check_all(True))\n        self.b_none.clicked.connect(lambda: self._check_all(False))\n        self.full_range.toggled.connect(self.refresh)\n        self.drop_last.toggled.connect(self.refresh)\n        self.b_cams.clicked.connect(self.refresh_cameras)\n        self.b_folder.clicked.connect(self._browse_folder)\n        self.b_ffmpeg.clicked.connect(self._browse_ffmpeg)\n        self.ffmpeg.editingFinished.connect(self._update_ffmpeg)\n        self.format.currentIndexChanged.connect(self._update_ffmpeg)\n        self.size_preset.activated.connect(self._apply_preset)\n        self.b_target.clicked.connect(self._pick_target)\n        self.b_move.clicked.connect(self._make_move)\n        self.b_export.clicked.connect(self._export)\n        self.b_open.clicked.connect(self._open_folder)\n\n    def _say(self, text):\n        self.status.setText(text)\n\n    # -- clips ------------------------------------------------------------\n    def refresh(self, *_):\n        checked = self._checked_names()\n        clips = make_clips(read_bookmarks(), playback_range(), self.full_range.isChecked(),\n                           self.drop_last.isChecked())\n        self.tree.clear()\n        for c in clips:\n            it = QtWidgets.QTreeWidgetItem([c['name'], str(c['start']), str(c['end']),\n                                            str(c['end'] - c['start'] + 1)])\n            it.setFlags(it.flags() | QtCore.Qt.ItemIsUserCheckable)\n            on = checked is None or c['name'] in checked\n            it.setCheckState(0, QtCore.Qt.Checked if on else QtCore.Qt.Unchecked)\n            it.setData(0, QtCore.Qt.UserRole, c)\n            self.tree.addTopLevelItem(it)\n        for i in range(4):\n            self.tree.resizeColumnToContents(i)\n        if not read_bookmarks():\n            self._say('No bookmarks in this scene: the playback range is exported.')\n        self.refresh_cameras()\n        self._update_ffmpeg()\n\n    def _items(self):\n        return [self.tree.topLevelItem(i) for i in range(self.tree.topLevelItemCount())]\n\n    def _checked_names(self):\n        items = self._items()\n        if not items:\n            return None\n        return set(it.data(0, QtCore.Qt.UserRole)['name'] for it in items\n                   if it.checkState(0) == QtCore.Qt.Checked)\n\n    def _check_all(self, state):\n        for it in self._items():\n            it.setCheckState(0, QtCore.Qt.Checked if state else QtCore.Qt.Unchecked)\n\n    def clips(self):\n        return [it.data(0, QtCore.Qt.UserRole) for it in self._items()\n                if it.checkState(0) == QtCore.Qt.Checked]\n\n    # -- camera / output --------------------------------------------------\n    def refresh_cameras(self):\n        current = self.camera.currentText() or self._pending_camera\n        self.camera.clear()\n        self.camera.addItems(cameras())\n        if current:\n            i = self.camera.findText(current)\n            if i < 0:\n                self.camera.addItem(current)\n                i = self.camera.count() - 1\n            self.camera.setCurrentIndex(i)\n        else:\n            act = active_camera()\n            i = self.camera.findText(act) if act else -1\n            if i >= 0:\n                self.camera.setCurrentIndex(i)\n\n    def _browse_folder(self):\n        path = QtWidgets.QFileDialog.getExistingDirectory(self, 'Export folder',\n                                                          self.folder.text())\n        if path:\n            self.folder.setText(path)\n\n    def _browse_ffmpeg(self):\n        path, _ = QtWidgets.QFileDialog.getOpenFileName(self, 'ffmpeg executable')\n        if path:\n            self.ffmpeg.setText(path)\n            self._update_ffmpeg()\n\n    def _update_ffmpeg(self, *_):\n        if self.format.currentData() != 'mp4':\n            self.ffmpeg_status.setText('')\n            return\n        found = find_ffmpeg(self.ffmpeg.text().strip())\n        self.ffmpeg_status.setWordWrap(True)\n        self.ffmpeg_status.setText('Using %s' % found if found else\n                                   'ffmpeg not found. ' + ffmpeg_hint())\n\n    def _apply_preset(self, index):\n        text = self.size_preset.itemText(index)\n        if text == 'Render settings':\n            self.width.setValue(cmds.getAttr('defaultResolution.width'))\n            self.height.setValue(cmds.getAttr('defaultResolution.height'))\n        elif ' x ' in text:\n            w, h = text.split(' x ')\n            self.width.setValue(int(w))\n            self.height.setValue(int(h))\n        self.size_preset.setCurrentIndex(0)\n\n    def _pick_target(self):\n        sel = cmds.ls(sl=True, type='transform')\n        if sel:\n            self.target.setText(sel[0])\n\n    def _open_folder(self):\n        folder = self._last_folder or self.folder.text() or os.path.join(\n            cmds.workspace(q=True, rootDirectory=True), 'movies', 'bookmarks')\n        if not os.path.isdir(folder):\n            self._say('Nothing exported yet.')\n            return\n        if os.name == 'nt':\n            os.startfile(folder)\n        else:\n            subprocess.Popen(['open' if os.uname()[0] == 'Darwin' else 'xdg-open', folder])\n\n    # -- config -----------------------------------------------------------\n    def get_cfg(self):\n        return {\n            'camera': self.camera.currentText().strip(),\n            'folder': self.folder.text().strip(),\n            'template': self.template.text().strip() or DEFAULTS['template'],\n            'width': self.width.value(),\n            'height': self.height.value(),\n            'format': self.format.currentData(),\n            'ffmpeg': self.ffmpeg.text().strip(),\n            'quality': self.quality.currentData(),\n            'audio': self.audio.isChecked(),\n            'join': self.join.isChecked(),\n            'full_range': self.full_range.isChecked(),\n            'drop_last': self.drop_last.isChecked(),\n            'keep_frames': self.keep.isChecked(),\n            'hide_rig': self.hide_rig.isChecked(),\n            'antialias': self.antialias.isChecked(),\n            'ao': self.ao.isChecked(),\n            'textures': self.textures.isChecked(),\n            'scene_lights': self.scene_lights.isChecked(),\n            'target': self.target.text().strip(),\n            'orbit': self.orbit.value(),\n            'profile': self.profile.currentData(),\n            'dolly': self.dolly.value(),\n            'crane': self.crane.value(),\n            'follow': self.follow.isChecked(),\n        }\n\n    def set_cfg(self, cfg):\n        c = dict(DEFAULTS)\n        c.update(cfg or {})\n        self._pending_camera = c['camera']\n        self.folder.setText(c['folder'])\n        self.template.setText(c['template'])\n        self.width.setValue(int(c['width']))\n        self.height.setValue(int(c['height']))\n        self.format.setCurrentIndex(max(0, self.format.findData(c['format'])))\n        self.ffmpeg.setText(c['ffmpeg'])\n        self.quality.setCurrentIndex(max(0, self.quality.findData(c['quality'])))\n        for w, k in ((self.audio, 'audio'), (self.join, 'join'), (self.keep, 'keep_frames'),\n                     (self.hide_rig, 'hide_rig'), (self.antialias, 'antialias'),\n                     (self.ao, 'ao'), (self.textures, 'textures'),\n                     (self.scene_lights, 'scene_lights'), (self.follow, 'follow')):\n            w.setChecked(bool(c[k]))\n        self.full_range.blockSignals(True)\n        self.drop_last.blockSignals(True)\n        self.full_range.setChecked(bool(c['full_range']))\n        self.drop_last.setChecked(bool(c['drop_last']))\n        self.full_range.blockSignals(False)\n        self.drop_last.blockSignals(False)\n        self.target.setText(c['target'])\n        self.orbit.setValue(c['orbit'])\n        self.profile.setCurrentIndex(max(0, self.profile.findData(c['profile'])))\n        self.dolly.setValue(c['dolly'])\n        self.crane.setValue(c['crane'])\n\n    def _load(self):\n        try:\n            if cmds.optionVar(exists=OPTION_VAR):\n                return json.loads(cmds.optionVar(q=OPTION_VAR))\n        except Exception:\n            pass\n        return {}\n\n    def _save(self, cfg):\n        keep = dict((k, v) for k, v in cfg.items() if k not in ('camera', 'target'))\n        cmds.optionVar(sv=(OPTION_VAR, json.dumps(keep)))\n\n    # -- actions ----------------------------------------------------------\n    def _make_move(self):\n        cfg = self.get_cfg()\n        self._save(cfg)\n        try:\n            cam = build_camera_move(cfg, self.clips())\n        except BookmarkExportError as e:\n            self._say(str(e))\n            return\n        except Exception as e:\n            traceback.print_exc()\n            self._say('Error: %s (see Script Editor)' % e)\n            return\n        self.refresh_cameras()\n        i = self.camera.findText(cam)\n        if i < 0:\n            self.camera.addItem(cam)\n            i = self.camera.count() - 1\n        self.camera.setCurrentIndex(i)\n        self._say('Created %s. It is now the export camera.' % cam)\n\n    def _export(self):\n        cfg = self.get_cfg()\n        self._save(cfg)\n        try:\n            report, folder = export(cfg, self.clips())\n        except BookmarkExportError as e:\n            self._say(str(e))\n            cmds.warning('Bookmark Export: %s' % str(e).split('\\n')[0])\n            return\n        except Exception as e:\n            traceback.print_exc()\n            self._say('Error: %s (see Script Editor)' % e)\n            return\n        self._last_folder = folder\n        self._say(report)\n        print('Bookmark Export:\\n' + report)\n\n    def closeEvent(self, event):\n        try:\n            self._save(self.get_cfg())\n        except Exception:\n            pass\n        super(BookmarkExportUI, self).closeEvent(event)\n\n\n_window = None\n\n\ndef show():\n    global _window\n    if _window is not None:\n        try:\n            _window.close()\n            _window.deleteLater()\n        except Exception:\n            pass\n    _window = BookmarkExportUI(_maya_main_window())\n    _window.show()\n    return _window\n\n\nif __name__ == '__main__':\n    show()",
"aliases": {
"division": "__future__.division",
"print_function": "__future__.print_function",
"glob": "glob",
"json": "json",
"math": "math",
"os": "os",
"re": "re",
"shutil": "shutil",
"subprocess": "subprocess",
"traceback": "traceback",
"cmds": "maya.cmds",
"mel": "maya.mel",
"omui": "maya.OpenMayaUI",
"om": "maya.api.OpenMaya",
"QtCore": "QtCore",
"QtWidgets": "QtWidgets",
"wrapInstance": "shiboken.wrapInstance",
"W": "QtWidgets"
},
"outline": [
{
"q": "BookmarkExportError",
"k": "class",
"s": 97,
"e": 98,
"doc": "",
"n": "Error type for problems the user can fix. The UI shows its message; any other exception is treated as a bug and prints a traceback.",
"c": [],
"b": [
[
0,
"run_process"
],
[
0,
"_native_format"
],
[
0,
"check_ffmpeg"
],
[
0,
"export"
],
[
0,
"_export_mp4"
],
[
0,
"_export_png"
],
[
0,
"_export_native"
],
[
0,
"build_camera_move"
],
[
0,
"BookmarkExportUI._make_move"
],
[
0,
"BookmarkExportUI._export"
]
]
},
{
"q": "parse_fps",
"k": "def",
"s": 104,
"e": 111,
"doc": "Maya time unit ('film', 'ntsc', '23.976fps', '120fps'...) to fps.",
"n": "Converts Maya's time unit name into frames per second: named units from `FPS_UNITS` (`film` = 24, `ntsc` = 30...) or a number like `23.976fps`. Unknown units raise `ValueError` instead of guessing.",
"c": [],
"b": [
[
0,
"scene_fps"
],
[
1,
"Rates.test_units"
]
]
},
{
"q": "ffmpeg_rate",
"k": "def",
"s": 114,
"e": 120,
"doc": "Exact rate string: NTSC rates as fractions so audio stays in sync.",
"n": "The frame rate as ffmpeg should receive it. NTSC rates are really fractions (29.97 is 30000/1001); passing the rounded decimal makes audio drift on long clips.",
"c": [],
"b": [
[
0,
"encode_cmd"
],
[
1,
"Rates.test_ntsc_rates_are_exact_fractions"
]
]
},
{
"q": "sanitize",
"k": "def",
"s": 123,
"e": 125,
"doc": "",
"n": "Makes a safe file name: anything that is not a letter, digit, `_` or `-` becomes `_`. Never returns an empty name.",
"c": [],
"b": [
[
0,
"file_names"
],
[
0,
"_join"
]
]
},
{
"q": "file_names",
"k": "def",
"s": 128,
"e": 146,
"doc": "One unique, safe file name (no extension) per clip.",
"n": "One unique file name per clip from the template (`{scene}_{clip}` by default). A bad template raises a clear error listing the valid tokens. Duplicates get `_2`, `_3`... compared case-insensitively, because Windows and macOS treat `Loop` and `loop` as the same file.",
"c": [
[
0,
"sanitize"
]
],
"b": [
[
0,
"export"
],
[
1,
"Names.test_template_and_cleanup"
],
[
1,
"Names.test_duplicates_get_numbered"
],
[
1,
"Names.test_bad_template"
]
]
},
{
"q": "make_clips",
"k": "def",
"s": 149,
"e": 163,
"doc": "bookmarks: [{'name', 'start', 'end'}] (end inclusive) in any order.\nplayback: (start, end). Clips are sorted by start; the playback range is\nused when there are no bookmarks (or added when full_range is on).",
"n": "Turns bookmarks into the list of clips to export: sorted by start, reversed bookmarks fixed, the playback range added when there are no bookmarks (or when asked). With \"drop last\", each clip loses its last frame, so a loop whose last frame repeats the first plays back without a stutter.",
"c": [],
"b": [
[
0,
"BookmarkExportUI.refresh"
],
[
1,
"Clips.test_no_bookmarks_exports_the_playback_range"
],
[
1,
"Clips.test_bookmarks_sorted_and_full_range_optional"
],
[
1,
"Clips.test_drop_last_frame_for_loops"
],
[
1,
"Clips.test_reversed_bookmark"
]
]
},
{
"q": "merge_segments",
"k": "def",
"s": 166,
"e": 174,
"doc": "Overlapping / touching clips as contiguous (start, end) runs.",
"n": "Merges overlapping or touching clips into continuous runs, for example 1-30 and 30-90 become 1-90.",
"c": [],
"b": [
[
0,
"progress_map"
]
]
},
{
"q": "progress_map",
"k": "def",
"s": 177,
"e": 193,
"doc": "{frame: 0..1} for every frame from the first to the last clip frame.\nProgress only advances on frames inside clips, so the camera move runs\ncontinuously through the clips and simply waits during gaps.",
"n": "For the camera move: a value from 0 to 1 for every frame. It only advances on frames inside clips, so the move runs at the same speed through every clip and simply waits during the gaps between bookmarks.",
"c": [
[
0,
"merge_segments"
]
],
"b": [
[
0,
"build_camera_move"
],
[
1,
"CameraMove.test_progress_runs_through_clips_and_waits_in_gaps"
]
]
},
{
"q": "smoothstep",
"k": "def",
"s": 196,
"e": 198,
"doc": "",
"n": "Ease in and out: `3u² - 2u³`. Starts and ends with zero speed.",
"c": [],
"b": [
[
0,
"profile"
]
]
},
{
"q": "profile",
"k": "def",
"s": 201,
"e": 208,
"doc": "Shape of the move over the whole sequence: 0 at the start.",
"n": "The shape of the move over the sequence: eased drift, out-and-back (a cosine, so the last frame equals the first and the reel loops), or linear.",
"c": [
[
0,
"smoothstep"
]
],
"b": [
[
0,
"move_at"
]
]
},
{
"q": "move_at",
"k": "def",
"s": 211,
"e": 214,
"doc": "(orbit degrees, distance factor, crane offset) at progress u.",
"n": "Turns progress into the three move amounts at one moment: orbit angle, distance factor (1 = original distance) and crane height.",
"c": [
[
0,
"profile"
]
],
"b": [
[
0,
"build_camera_move"
],
[
1,
"CameraMove.test_drift_starts_and_ends_still"
],
[
1,
"CameraMove.test_out_and_back_ends_where_it_started"
],
[
1,
"CameraMove.test_linear"
]
]
},
{
"q": "encode_cmd",
"k": "def",
"s": 217,
"e": 237,
"doc": "ffmpeg command line: PNG sequence (numbered from 0) to H.264 mp4. With\naudio, the length is set from the frame count: the sound never cuts the\nvideo short, and never runs past it.",
"n": "Builds the ffmpeg command as a list of arguments (no shell, so spaces in paths are safe). PNG sequence in, H.264 mp4 out. With audio, the audio is trimmed or delayed to line up with the clip start and the output length is set from the frame count.",
"c": [
[
0,
"ffmpeg_rate"
]
],
"b": [
[
0,
"_export_mp4"
],
[
1,
"Ffmpeg.test_encode_command"
],
[
1,
"Ffmpeg.test_audio_trim_and_delay"
]
]
},
{
"q": "concat_list",
"k": "def",
"s": 240,
"e": 242,
"doc": "Contents of an ffmpeg concat list file.",
"n": "The text file ffmpeg's concat feature reads to join clips: one `file 'path'` line each, with backslashes turned into slashes and single quotes escaped.",
"c": [],
"b": [
[
0,
"_join"
],
[
1,
"Ffmpeg.test_concat_list_quotes"
]
]
},
{
"q": "renumber_plan",
"k": "def",
"s": 245,
"e": 258,
"doc": "Playblast frame files to sequential names (0..n-1), whatever the frame\nnumbers were (negative frames, gaps). Returns [(old, new)] in frame order.",
"n": "Plans renaming the playblast frames to `seq.00000.png`, `seq.00001.png`... in frame order. ffmpeg needs a continuous sequence, but playblast names files by frame number, which can start anywhere or be negative.",
"c": [
[
0,
"renumber_plan.frame_of"
]
],
"b": [
[
0,
"_export_mp4"
],
[
1,
"Ffmpeg.test_renumber_handles_negative_frames_in_order"
]
]
},
{
"q": "renumber_plan.frame_of",
"k": "def",
"s": 250,
"e": 252,
"doc": "",
"n": "Reads the frame number from a file name like `f.-0001.png`, or `None` if it is not a frame.",
"c": [],
"b": [
[
0,
"renumber_plan"
]
]
},
{
"q": "read_bookmarks",
"k": "def",
"s": 264,
"e": 278,
"doc": "",
"n": "Reads every `timeSliderBookmark` node: name, start and end. Loads the bookmark plugin first (quietly) in case it is not loaded. Broken nodes are skipped.",
"c": [],
"b": [
[
0,
"BookmarkExportUI.refresh"
]
]
},
{
"q": "playback_range",
"k": "def",
"s": 281,
"e": 283,
"doc": "",
"n": "The timeline start and end as whole frames.",
"c": [],
"b": [
[
0,
"BookmarkExportUI.refresh"
]
]
},
{
"q": "scene_fps",
"k": "def",
"s": 286,
"e": 287,
"doc": "",
"n": "The scene's frame rate as a number.",
"c": [
[
0,
"parse_fps"
]
],
"b": [
[
0,
"export"
]
]
},
{
"q": "scene_name",
"k": "def",
"s": 290,
"e": 292,
"doc": "",
"n": "The scene file name without folder or extension, or `untitled`.",
"c": [],
"b": [
[
0,
"export"
],
[
0,
"_join"
]
]
},
{
"q": "cameras",
"k": "def",
"s": 295,
"e": 303,
"doc": "",
"n": "All camera transforms for the dropdown. Short names when unique, full paths when not. The four default cameras are sorted to the end.",
"c": [],
"b": [
[
0,
"BookmarkExportUI.refresh_cameras"
]
]
},
{
"q": "active_camera",
"k": "def",
"s": 306,
"e": 317,
"doc": "",
"n": "The camera of the viewport you are looking through: the focused panel, or the first visible model panel.",
"c": [],
"b": [
[
0,
"export"
],
[
0,
"build_camera_move"
],
[
0,
"BookmarkExportUI.refresh_cameras"
]
]
},
{
"q": "timeline_sound",
"k": "def",
"s": 320,
"e": 332,
"doc": "(file, offset frame) of the sound shown on the time slider, or None.",
"n": "The audio file shown on the time slider and its offset, or `None`. The time slider is found through the MEL global `$gPlayBackSlider`.",
"c": [],
"b": [
[
0,
"export"
]
]
},
{
"q": "find_ffmpeg",
"k": "def",
"s": 335,
"e": 345,
"doc": "",
"n": "Looks for ffmpeg: the path typed by the user, every folder on `PATH`, then common install folders (Homebrew, `/usr/local/bin`, `C:/ffmpeg/bin`...). Maya often starts with a shorter `PATH` than a terminal, which is why the common folders are checked too.",
"c": [],
"b": [
[
0,
"export"
],
[
0,
"BookmarkExportUI._update_ffmpeg"
]
]
},
{
"q": "run_process",
"k": "def",
"s": 348,
"e": 356,
"doc": "",
"n": "Runs a program, waits, and raises a `BookmarkExportError` with ffmpeg's error text if it fails. On Windows it hides the console window.",
"c": [
[
0,
"BookmarkExportError"
]
],
"b": [
[
0,
"check_ffmpeg"
],
[
0,
"_export_mp4"
],
[
0,
"_join"
]
]
},
{
"q": "_Viewport",
"k": "class",
"s": 362,
"e": 428,
"doc": "A temporary panel looking through the camera, rig hidden, nice AA.",
"n": "A temporary playblast window, used with `with`. It sets up a clean view on enter and puts everything back on exit.",
"c": [],
"b": [
[
0,
"export"
]
]
},
{
"q": "_Viewport.__init__",
"k": "def",
"s": 367,
"e": 372,
"doc": "",
"n": "Stores the camera and settings; `saved` will hold the render settings to restore.",
"c": [],
"b": []
},
{
"q": "_Viewport.__enter__",
"k": "def",
"s": 374,
"e": 409,
"doc": "",
"n": "Saves and changes Viewport 2.0 settings (anti-aliasing with 16 samples, ambient occlusion), opens a window with a model panel, looks through the camera, hides the HUD, grid and manipulators, and with \"geometry only\" turns everything off and then only meshes (and similar) back on, which hides the rig controls.",
"c": [],
"b": []
},
{
"q": "_Viewport.__exit__",
"k": "def",
"s": 411,
"e": 420,
"doc": "",
"n": "Restores every saved render setting and deletes the window and panel. Runs even if the export failed.",
"c": [],
"b": []
},
{
"q": "_Viewport.playblast",
"k": "def",
"s": 422,
"e": 428,
"doc": "",
"n": "Playblasts through this panel with fixed options (off-screen, no viewer, no ornaments, full size, overwrite). Falls back to a call without `editorPanelName` for older Maya versions.",
"c": [],
"b": []
},
{
"q": "_Progress",
"k": "class",
"s": 434,
"e": 453,
"doc": "",
"n": "Maya's progress window with a Cancel button, skipped in batch mode.",
"c": [],
"b": [
[
0,
"export"
]
]
},
{
"q": "_Progress.__init__",
"k": "def",
"s": 435,
"e": 441,
"doc": "",
"n": "Opens the progress window unless Maya runs without UI.",
"c": [],
"b": []
},
{
"q": "_Progress.step",
"k": "def",
"s": 443,
"e": 449,
"doc": "",
"n": "Updates the bar. If the user pressed Cancel, it raises `KeyboardInterrupt`, which `export` catches to stop cleanly.",
"c": [],
"b": []
},
{
"q": "_Progress.close",
"k": "def",
"s": 451,
"e": 453,
"doc": "",
"n": "Closes the progress window.",
"c": [],
"b": []
},
{
"q": "_native_format",
"k": "def",
"s": 456,
"e": 470,
"doc": "Maya's own movie writer for this platform. Never 'qt' on macOS: Maya\n2020's QuickTime 7 path is dead on recent macOS and fails with a\nmisleading \"out of disk space\" error. On Windows, 'qt' needs QuickTime.",
"n": "Picks Maya's own movie writer for this platform. It avoids QuickTime on macOS because that path is broken on recent macOS and fails with a misleading \"out of disk space\" error.",
"c": [
[
0,
"BookmarkExportError"
]
],
"b": [
[
0,
"_export_native"
]
]
},
{
"q": "ffmpeg_hint",
"k": "def",
"s": 473,
"e": 477,
"doc": "",
"n": "How to get ffmpeg on this platform, used in error messages.",
"c": [],
"b": [
[
0,
"check_ffmpeg"
],
[
0,
"BookmarkExportUI._update_ffmpeg"
]
]
},
{
"q": "check_ffmpeg",
"k": "def",
"s": 480,
"e": 491,
"doc": "Raises with a clear message unless ffmpeg is there and actually runs.",
"n": "Makes sure ffmpeg exists **and** runs (`ffmpeg -version`). A downloaded ffmpeg on macOS can exist but be blocked by security settings, so finding the file is not enough.",
"c": [
[
0,
"ffmpeg_hint"
],
[
0,
"BookmarkExportError"
],
[
0,
"run_process"
]
],
"b": [
[
0,
"export"
]
]
},
{
"q": "export",
"k": "def",
"s": 494,
"e": 552,
"doc": "clips: [{'name', 'start', 'end'}]. Returns (report, folder).",
"n": "The main export. It validates the camera and clips, prepares the folder and names, checks ffmpeg up front, saves the current frame and selection, clears the selection (no highlight in the movies), and runs each clip inside the temporary viewport. `finally` always closes the progress window and restores the frame and selection. Returns a text report.",
"c": [
[
0,
"active_camera"
],
[
0,
"BookmarkExportError"
],
[
0,
"scene_name"
],
[
0,
"file_names"
],
[
0,
"scene_fps"
],
[
0,
"check_ffmpeg"
],
[
0,
"find_ffmpeg"
],
[
0,
"timeline_sound"
],
[
0,
"_Progress"
],
[
0,
"_join"
],
[
0,
"_export_native"
],
[
0,
"_export_png"
],
[
0,
"_export_mp4"
],
[
0,
"_Viewport"
]
],
"b": [
[
0,
"BookmarkExportUI._export"
]
]
},
{
"q": "_export_mp4",
"k": "def",
"s": 555,
"e": 582,
"doc": "",
"n": "One clip as mp4: playblast PNGs into a temporary `_frames/<name>` folder, renumber them, encode with ffmpeg (with audio aligned to the clip start), then delete the frames unless \"keep frames\" is on.",
"c": [
[
0,
"BookmarkExportError"
],
[
0,
"renumber_plan"
],
[
0,
"encode_cmd"
],
[
0,
"run_process"
]
],
"b": [
[
0,
"export"
]
]
},
{
"q": "_export_png",
"k": "def",
"s": 585,
"e": 595,
"doc": "",
"n": "One clip as a PNG sequence in its own folder.",
"c": [
[
0,
"BookmarkExportError"
]
],
"b": [
[
0,
"export"
]
]
},
{
"q": "_export_native",
"k": "def",
"s": 598,
"e": 624,
"doc": "",
"n": "One clip with Maya's movie writer. If the result is missing or empty, it deletes the broken file and raises a clear error, so you never get a movie that will not play.",
"c": [
[
0,
"_native_format"
],
[
0,
"BookmarkExportError"
]
],
"b": [
[
0,
"export"
]
]
},
{
"q": "_join",
"k": "def",
"s": 627,
"e": 637,
"doc": "",
"n": "Joins the mp4s into one file with ffmpeg's concat feature, copying the streams without re-encoding (fast, no quality loss). The temporary list file is always deleted.",
"c": [
[
0,
"concat_list"
],
[
0,
"scene_name"
],
[
0,
"sanitize"
],
[
0,
"run_process"
]
],
"b": [
[
0,
"export"
]
]
},
{
"q": "_matrix_at",
"k": "def",
"s": 643,
"e": 644,
"doc": "",
"n": "A node's world matrix at a given frame, read without moving the timeline.",
"c": [],
"b": [
[
0,
"_pivot_at"
],
[
0,
"build_camera_move"
]
]
},
{
"q": "_point",
"k": "def",
"s": 647,
"e": 648,
"doc": "",
"n": "The translation part of a matrix. Maya matrices are row-major, so the position is in row 3.",
"c": [],
"b": [
[
0,
"_pivot_at"
],
[
0,
"build_camera_move"
]
]
},
{
"q": "_translate_matrix",
"k": "def",
"s": 651,
"e": 652,
"doc": "",
"n": "A matrix that only moves by a vector.",
"c": [],
"b": [
[
0,
"build_camera_move"
]
]
},
{
"q": "_orbit_matrix",
"k": "def",
"s": 655,
"e": 658,
"doc": "",
"n": "A matrix that rotates around the world Y axis by some degrees.",
"c": [],
"b": [
[
0,
"build_camera_move"
]
]
},
{
"q": "_pivot_at",
"k": "def",
"s": 661,
"e": 670,
"doc": "World point the camera orbits around.",
"n": "The point the camera orbits around: the chosen target, or the camera's center of interest (the point it looks at, at its center-of-interest distance).",
"c": [
[
0,
"_matrix_at"
],
[
0,
"_point"
]
],
"b": [
[
0,
"build_camera_move"
]
]
},
{
"q": "build_camera_move",
"k": "def",
"s": 673,
"e": 730,
"doc": "Bakes the move on a new camera. Returns its name.",
"n": "Creates the move camera. It finds the true source camera, deletes any previous move made from it, duplicates the source, removes its children, unparents it, unlocks its channels and tags it. Then for every frame: take the source camera's matrix, rotate it around the pivot by the orbit amount, move it toward the pivot for the push-in, raise it for the crane, convert the rotation to the camera's rotate order without flips, and key translate and rotate.",
"c": [
[
0,
"active_camera"
],
[
0,
"BookmarkExportError"
],
[
0,
"progress_map"
],
[
0,
"_pivot_at"
],
[
0,
"_point"
],
[
0,
"_translate_matrix"
],
[
0,
"_orbit_matrix"
],
[
0,
"move_at"
],
[
0,
"_matrix_at"
]
],
"b": [
[
0,
"BookmarkExportUI._make_move"
]
]
},
{
"q": "_maya_main_window",
"k": "def",
"s": 736,
"e": 738,
"doc": "",
"n": "Maya's main window as a Qt widget, used as the tool window's parent.",
"c": [],
"b": [
[
0,
"show"
]
]
},
{
"q": "BookmarkExportUI",
"k": "class",
"s": 744,
"e": 1149,
"doc": "",
"n": "The tool window (a `QDialog` in Maya, plain `object` when Qt is missing so tests can import the file).",
"c": [],
"b": [
[
0,
"BookmarkExportUI.__init__"
],
[
0,
"BookmarkExportUI.closeEvent"
],
[
0,
"show"
]
]
},
{
"q": "BookmarkExportUI.__init__",
"k": "def",
"s": 747,
"e": 756,
"doc": "",
"n": "Builds the UI, connects signals, loads the saved settings and fills the clip list.",
"c": [
[
0,
"BookmarkExportUI"
],
[
0,
"BookmarkExportUI._build"
],
[
0,
"BookmarkExportUI._connect"
],
[
0,
"BookmarkExportUI._load"
],
[
0,
"BookmarkExportUI.set_cfg"
],
[
0,
"BookmarkExportUI.refresh"
]
],
"b": []
},
{
"q": "BookmarkExportUI._build",
"k": "def",
"s": 759,
"e": 911,
"doc": "",
"n": "Creates four groups: Clips (a tree with checkboxes), Camera & Output, Look, and Camera move, plus Open Folder and Export buttons and a selectable status line.",
"c": [],
"b": [
[
0,
"BookmarkExportUI.__init__"
]
]
},
{
"q": "BookmarkExportUI._connect",
"k": "def",
"s": 913,
"e": 928,
"doc": "",
"n": "All signal connections in one place.",
"c": [
[
0,
"BookmarkExportUI.refresh"
],
[
0,
"BookmarkExportUI._check_all"
],
[
0,
"BookmarkExportUI.refresh_cameras"
],
[
0,
"BookmarkExportUI._browse_folder"
],
[
0,
"BookmarkExportUI._browse_ffmpeg"
],
[
0,
"BookmarkExportUI._update_ffmpeg"
],
[
0,
"BookmarkExportUI._apply_preset"
],
[
0,
"BookmarkExportUI._pick_target"
],
[
0,
"BookmarkExportUI._make_move"
],
[
0,
"BookmarkExportUI._export"
],
[
0,
"BookmarkExportUI._open_folder"
]
],
"b": [
[
0,
"BookmarkExportUI.__init__"
]
]
},
{
"q": "BookmarkExportUI._say",
"k": "def",
"s": 930,
"e": 931,
"doc": "",
"n": "Writes the status line.",
"c": [],
"b": [
[
0,
"BookmarkExportUI.refresh"
],
[
0,
"BookmarkExportUI._open_folder"
],
[
0,
"BookmarkExportUI._make_move"
],
[
0,
"BookmarkExportUI._export"
]
]
},
{
"q": "BookmarkExportUI.refresh",
"k": "def",
"s": 934,
"e": 952,
"doc": "",
"n": "Rebuilds the clip list from the scene, keeping the checked state of clips that were already there. Each tree item stores its whole clip dict as item data, so `clips()` can return them later.",
"c": [
[
0,
"BookmarkExportUI._checked_names"
],
[
0,
"playback_range"
],
[
0,
"read_bookmarks"
],
[
0,
"make_clips"
],
[
0,
"BookmarkExportUI.clips"
],
[
0,
"BookmarkExportUI._say"
],
[
0,
"BookmarkExportUI.refresh_cameras"
],
[
0,
"BookmarkExportUI._update_ffmpeg"
]
],
"b": [
[
0,
"BookmarkExportUI.__init__"
],
[
0,
"BookmarkExportUI._connect"
]
]
},
{
"q": "BookmarkExportUI._items",
"k": "def",
"s": 954,
"e": 955,
"doc": "",
"n": "All rows of the clip tree.",
"c": [],
"b": [
[
0,
"BookmarkExportUI._checked_names"
],
[
0,
"BookmarkExportUI._check_all"
],
[
0,
"BookmarkExportUI.clips"
]
]
},
{
"q": "BookmarkExportUI._checked_names",
"k": "def",
"s": 957,
"e": 962,
"doc": "",
"n": "Names of the checked clips, or `None` the first time (then everything starts checked).",
"c": [
[
0,
"BookmarkExportUI._items"
]
],
"b": [
[
0,
"BookmarkExportUI.refresh"
]
]
},
{
"q": "BookmarkExportUI._check_all",
"k": "def",
"s": 964,
"e": 966,
"doc": "",
"n": "All / None buttons.",
"c": [
[
0,
"BookmarkExportUI._items"
]
],
"b": [
[
0,
"BookmarkExportUI._connect"
]
]
},
{
"q": "BookmarkExportUI.clips",
"k": "def",
"s": 968,
"e": 970,
"doc": "",
"n": "The checked clips, as dicts.",
"c": [
[
0,
"BookmarkExportUI._items"
]
],
"b": [
[
0,
"BookmarkExportUI.refresh"
],
[
0,
"BookmarkExportUI._make_move"
],
[
0,
"BookmarkExportUI._export"
]
]
},
{
"q": "BookmarkExportUI.refresh_cameras",
"k": "def",
"s": 973,
"e": 987,
"doc": "",
"n": "Refills the camera dropdown, keeping the current choice (or adding it if it is not in the list), otherwise selecting the active viewport camera.",
"c": [
[
0,
"cameras"
],
[
0,
"active_camera"
]
],
"b": [
[
0,
"BookmarkExportUI._connect"
],
[
0,
"BookmarkExportUI.refresh"
],
[
0,
"BookmarkExportUI._make_move"
]
]
},
{
"q": "BookmarkExportUI._browse_folder",
"k": "def",
"s": 989,
"e": 993,
"doc": "",
"n": "Folder picker for the output folder.",
"c": [],
"b": [
[
0,
"BookmarkExportUI._connect"
]
]
},
{
"q": "BookmarkExportUI._browse_ffmpeg",
"k": "def",
"s": 995,
"e": 999,
"doc": "",
"n": "File picker for the ffmpeg executable.",
"c": [
[
0,
"BookmarkExportUI._update_ffmpeg"
]
],
"b": [
[
0,
"BookmarkExportUI._connect"
]
]
},
{
"q": "BookmarkExportUI._update_ffmpeg",
"k": "def",
"s": 1001,
"e": 1008,
"doc": "",
"n": "Shows which ffmpeg will be used, or how to get it, when the mp4 format is selected.",
"c": [
[
0,
"find_ffmpeg"
],
[
0,
"ffmpeg_hint"
]
],
"b": [
[
0,
"BookmarkExportUI._connect"
],
[
0,
"BookmarkExportUI.refresh"
],
[
0,
"BookmarkExportUI._browse_ffmpeg"
]
]
},
{
"q": "BookmarkExportUI._apply_preset",
"k": "def",
"s": 1010,
"e": 1019,
"doc": "",
"n": "Applies a size preset (or the render settings size) and resets the dropdown to \"Presets\" so it works like a menu.",
"c": [],
"b": [
[
0,
"BookmarkExportUI._connect"
]
]
},
{
"q": "BookmarkExportUI._pick_target",
"k": "def",
"s": 1021,
"e": 1024,
"doc": "",
"n": "Uses the selected object as the orbit target.",
"c": [],
"b": [
[
0,
"BookmarkExportUI._connect"
]
]
},
{
"q": "BookmarkExportUI._open_folder",
"k": "def",
"s": 1026,
"e": 1035,
"doc": "",
"n": "Opens the export folder in Explorer or Finder.",
"c": [
[
0,
"BookmarkExportUI._say"
]
],
"b": [
[
0,
"BookmarkExportUI._connect"
]
]
},
{
"q": "BookmarkExportUI.get_cfg",
"k": "def",
"s": 1038,
"e": 1064,
"doc": "",
"n": "Reads every widget into one settings dict.",
"c": [],
"b": [
[
0,
"BookmarkExportUI._make_move"
],
[
0,
"BookmarkExportUI._export"
],
[
0,
"BookmarkExportUI.closeEvent"
]
]
},
{
"q": "BookmarkExportUI.set_cfg",
"k": "def",
"s": 1066,
"e": 1092,
"doc": "",
"n": "Fills the widgets from a settings dict merged over `DEFAULTS`. The two checkboxes that trigger `refresh` are set with signals blocked.",
"c": [],
"b": [
[
0,
"BookmarkExportUI.__init__"
]
]
},
{
"q": "BookmarkExportUI._load",
"k": "def",
"s": 1094,
"e": 1100,
"doc": "",
"n": "Reads the saved settings (JSON in an optionVar), or `{}`.",
"c": [],
"b": [
[
0,
"BookmarkExportUI.__init__"
]
]
},
{
"q": "BookmarkExportUI._save",
"k": "def",
"s": 1102,
"e": 1104,
"doc": "",
"n": "Saves the settings, except the camera and target, which belong to one scene.",
"c": [],
"b": [
[
0,
"BookmarkExportUI._make_move"
],
[
0,
"BookmarkExportUI._export"
],
[
0,
"BookmarkExportUI.closeEvent"
]
]
},
{
"q": "BookmarkExportUI._make_move",
"k": "def",
"s": 1107,
"e": 1125,
"doc": "",
"n": "Builds the camera move and makes the new camera the export camera.",
"c": [
[
0,
"BookmarkExportUI.get_cfg"
],
[
0,
"BookmarkExportUI._save"
],
[
0,
"BookmarkExportUI._say"
],
[
0,
"BookmarkExportError"
],
[
0,
"BookmarkExportUI.clips"
],
[
0,
"build_camera_move"
],
[
0,
"BookmarkExportUI.refresh_cameras"
]
],
"b": [
[
0,
"BookmarkExportUI._connect"
]
]
},
{
"q": "BookmarkExportUI._export",
"k": "def",
"s": 1127,
"e": 1142,
"doc": "",
"n": "Runs the export, shows the report (or the error) and remembers the folder for Open Folder.",
"c": [
[
0,
"BookmarkExportUI.get_cfg"
],
[
0,
"BookmarkExportUI._save"
],
[
0,
"BookmarkExportUI._say"
],
[
0,
"BookmarkExportError"
],
[
0,
"BookmarkExportUI.clips"
],
[
0,
"export"
]
],
"b": [
[
0,
"BookmarkExportUI._connect"
]
]
},
{
"q": "BookmarkExportUI.closeEvent",
"k": "def",
"s": 1144,
"e": 1149,
"doc": "",
"n": "Saves the settings when the window closes.",
"c": [
[
0,
"BookmarkExportUI.get_cfg"
],
[
0,
"BookmarkExportUI._save"
],
[
0,
"BookmarkExportUI"
]
],
"b": []
},
{
"q": "show",
"k": "def",
"s": 1155,
"e": 1165,
"doc": "",
"n": "Entry point: closes the previous window, opens a new one parented to Maya, keeps a global reference.",
"c": [
[
0,
"_maya_main_window"
],
[
0,
"BookmarkExportUI"
]
],
"b": []
}
],
"lines": {
"62": "CRF is x264's quality setting: lower is better quality and bigger files. 16 is visually near lossless, 25 is small.",
"108": "Matches names like `23.976fps` or `120fps` and captures the number.",
"133": "The template is a normal Python format string, so `{clip}` is replaced by the clip name, and so on.",
"135": "An unknown token like `{nope}` raises `KeyError`; a stray brace raises `ValueError`. Both become one clear message.",
"170": "Overlapping or directly touching (next frame) clips join into the same run.",
"188": "Only frames inside clips get evenly spaced progress values.",
"191": "Gap frames are not in `inside`, so they keep the last value: the move waits.",
"198": "Smoothstep: `3u² - 2u³`.",
"205": "One full cosine wave: 0 at the start, 1 in the middle, 0 at the end, with eased turns.",
"228": "`-ss` before an input skips into it: the sound starts earlier than the clip, so its beginning is trimmed.",
"230": "`-itsoffset` delays an input: the sound starts after the clip start.",
"233": "Output length = frames / fps. This replaces `-shortest`, which would cut the video if the sound were shorter.",
"235": "H.264 with yuv420p needs even width and height; this pads odd sizes by one pixel.",
"236": "`yuv420p` is the pixel format every player understands. `+faststart` puts the index at the start of the file so it starts playing before fully downloaded.",
"242": "A single quote inside a quoted path is written as `'\\''`: close the quote, an escaped quote, reopen.",
"257": "`%0*d` takes the padding width from the arguments: `seq.00000.png`.",
"266": "Bookmarks are a plugin node type; loading it first makes `ls(type=...)` work.",
"303": "Sorting by a tuple: `False` sorts before `True`, so production cameras come first, then alphabetical.",
"323": "Gets the name of the time slider control from a MEL global variable.",
"351": "Windows flag CREATE_NO_WINDOW: ffmpeg runs without flashing a black console.",
"377": "`None` means \"do not touch\"; the loop skips it.",
"397": "Turn every object type off, then turn only geometry back on: controls, joints and locators stay hidden.",
"427": "Older Maya versions do not know the flag and raise `TypeError`; then playblast the active panel instead.",
"446": "Uses Python's \"user stopped\" error as a cancel signal; `export` catches it.",
"513": "Fail before doing any slow work, and never quietly switch to another format.",
"520": "Selected objects draw highlighted in the viewport; clearing the selection keeps the movies clean. It is restored in `finally`.",
"542": "Cancel from the progress window: stop, but still return a report of what was written.",
"573": "How far into the sound file this clip starts, in seconds: (clip start - sound offset) / fps.",
"619": "Deletes a broken or empty movie so it is not mistaken for a real result.",
"634": "`-c copy` joins without re-encoding: fast and no quality loss. It works because every clip was encoded with the same settings.",
"648": "Row 3 of a Maya matrix holds the translation.",
"667": "Row 2 is the camera's local Z axis. Cameras look down **negative** Z, hence the minus.",
"679": "If the chosen camera is a move camera, use its stored source instead, so the move is never built on top of a move.",
"690": "Copy the source camera (with its settings and focal length) instead of changing it.",
"696": "Unlock the channels in case the source camera was locked, so the new keys can be set.",
"712": "Follow mode: move the camera along with the target's travel.",
"714": "Rotating around a point: move so the pivot is at the origin, rotate, move back. (Maya multiplies row vectors, so the order reads left to right.)",
"716": "Push-in: scale the camera's offset from the pivot by `distance` (0.97 = 3% closer), then add the rise.",
"718": "Get the rotation and express it in the camera's rotate order, so the keyed values mean the same rotation.",
"720": "Choose the angles closest to the previous frame, avoiding 360 degree jumps between keys.",
"910": "Lets you select and copy the report text (file paths, errors).",
"945": "Stores the whole clip dict on the row. `UserRole` is the slot Qt reserves for your own data.",
"996": "Returns a pair (path, chosen filter); `_` ignores the second value.",
"1103": "Do not save scene-specific choices: a camera name from one scene means nothing in another."
}
},
{
"path": "tests/test_bookmark_export.py",
"lang": "py",
"note": "Tests for the pure helpers, runnable outside Maya: `python3 tests/test_bookmark_export.py`.",
"code": "# -*- coding: utf-8 -*-\n\"\"\"Pure parts of bookmark_export.py, outside of Maya:  python3 tests/test_bookmark_export.py\"\"\"\nfrom __future__ import division, print_function\n\nimport os\nimport sys\nimport unittest\n\nsys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))\nimport bookmark_export as de  # noqa: E402\n\nCFG = dict(de.DEFAULTS)\n\n\nclass Clips(unittest.TestCase):\n\n    def test_no_bookmarks_exports_the_playback_range(self):\n        self.assertEqual(de.make_clips([], (1, 120)), [{'name': 'range', 'start': 1, 'end': 120}])\n\n    def test_bookmarks_sorted_and_full_range_optional(self):\n        bm = [{'name': 'loop', 'start': 30, 'end': 90}, {'name': 'in', 'start': 1, 'end': 30}]\n        self.assertEqual([c['name'] for c in de.make_clips(bm, (1, 120))], ['in', 'loop'])\n        self.assertEqual([c['name'] for c in de.make_clips(bm, (1, 120), True)],\n                         ['in', 'loop', 'range'])\n\n    def test_drop_last_frame_for_loops(self):\n        clips = de.make_clips([{'name': 'loop', 'start': 30, 'end': 90},\n                               {'name': 'one', 'start': 5, 'end': 5}], (1, 120), drop_last=True)\n        self.assertEqual([(c['start'], c['end']) for c in clips], [(5, 5), (30, 89)])\n\n    def test_reversed_bookmark(self):\n        self.assertEqual(de.make_clips([{'name': 'a', 'start': 9, 'end': 3}], (1, 2))[0]['start'], 3)\n\n\nclass Names(unittest.TestCase):\n\n    def test_template_and_cleanup(self):\n        clips = [{'name': 'Idle > Loop', 'start': 1, 'end': 30}]\n        self.assertEqual(de.file_names(clips, '{scene}_{index}_{clip}', 'hero walk', 'cam'),\n                         ['hero_walk_1_Idle_Loop'])\n\n    def test_duplicates_get_numbered(self):\n        clips = [{'name': 'loop', 'start': 1, 'end': 2}] * 3 + [{'name': 'loop_2', 'start': 1, 'end': 2}]\n        names = de.file_names(clips, '{clip}', 's', 'c')\n        self.assertEqual(len(set(n.lower() for n in names)), 4)\n        self.assertEqual(names[0], 'loop')\n\n    def test_bad_template(self):\n        with self.assertRaises(ValueError):\n            de.file_names([{'name': 'a', 'start': 1, 'end': 2}], '{nope}', 's', 'c')\n\n\nclass Rates(unittest.TestCase):\n\n    def test_units(self):\n        self.assertEqual(de.parse_fps('film'), 24.0)\n        self.assertEqual(de.parse_fps('ntsc'), 30.0)\n        self.assertEqual(de.parse_fps('23.976fps'), 23.976)\n        self.assertEqual(de.parse_fps('120fps'), 120.0)\n        with self.assertRaises(ValueError):\n            de.parse_fps('banana')\n\n    def test_ntsc_rates_are_exact_fractions(self):\n        self.assertEqual(de.ffmpeg_rate(29.97), '30000/1001')\n        self.assertEqual(de.ffmpeg_rate(24.0), '24')\n\n\nclass CameraMove(unittest.TestCase):\n\n    def clips(self):\n        # idle > loop start, loop, loop end > idle, with a gap before the last one\n        return [{'name': 'a', 'start': 1, 'end': 30}, {'name': 'b', 'start': 30, 'end': 90},\n                {'name': 'c', 'start': 101, 'end': 120}]\n\n    def test_progress_runs_through_clips_and_waits_in_gaps(self):\n        p = de.progress_map(self.clips())\n        self.assertEqual(p[1], 0.0)\n        self.assertEqual(p[120], 1.0)\n        self.assertEqual(p[91], p[90])\n        self.assertEqual(p[100], p[90])\n        values = [p[f] for f in sorted(p)]\n        self.assertEqual(values, sorted(values))\n        steps = set(round(p[f + 1] - p[f], 9) for f in range(101, 120))\n        self.assertEqual(len(steps), 1)          # same speed in every clip\n        self.assertAlmostEqual(p[31] - p[30], p[102] - p[101])\n\n    def test_drift_starts_and_ends_still(self):\n        cfg = dict(CFG, orbit=12.0, dolly=3.0, crane=5.0, profile=de.PROFILE_DRIFT)\n        self.assertEqual(de.move_at(0.0, cfg), (0.0, 1.0, 0.0))\n        orbit, dist, crane = de.move_at(1.0, cfg)\n        self.assertAlmostEqual(orbit, 12.0)\n        self.assertAlmostEqual(dist, 0.97)\n        self.assertAlmostEqual(crane, 5.0)\n        e = 1e-4\n        self.assertLess(abs(de.move_at(e, cfg)[0]) / e, 0.01)       # eases in\n        self.assertLess(abs(12.0 - de.move_at(1 - e, cfg)[0]) / e, 0.01)\n\n    def test_out_and_back_ends_where_it_started(self):\n        cfg = dict(CFG, orbit=10.0, dolly=4.0, crane=2.0, profile=de.PROFILE_RETURN)\n        self.assertEqual(de.move_at(0.0, cfg), de.move_at(1.0, cfg))\n        self.assertAlmostEqual(de.move_at(0.5, cfg)[0], 10.0)\n\n    def test_linear(self):\n        cfg = dict(CFG, orbit=10.0, profile=de.PROFILE_LINEAR)\n        self.assertAlmostEqual(de.move_at(0.25, cfg)[0], 2.5)\n\n\nclass Ffmpeg(unittest.TestCase):\n\n    def test_encode_command(self):\n        cmd = de.encode_cmd('ffmpeg', 'f/seq.%05d.png', 29.97, 'out.mp4', 16)\n        self.assertEqual(cmd[cmd.index('-framerate') + 1], '30000/1001')\n        self.assertIn('libx264', cmd)\n        self.assertIn('yuv420p', cmd)\n        self.assertEqual(cmd[-1], 'out.mp4')\n        self.assertNotIn('-map', cmd)\n\n    def test_audio_trim_and_delay(self):\n        later = de.encode_cmd('ffmpeg', 'p', 24.0, 'o.mp4', 16, 'a.wav', 1.5)\n        self.assertEqual(later[later.index('-ss') + 1], '1.500000')\n        early = de.encode_cmd('ffmpeg', 'p', 24.0, 'o.mp4', 16, 'a.wav', -0.5)\n        self.assertEqual(early[early.index('-itsoffset') + 1], '0.500000')\n        self.assertNotIn('-shortest', early)     # would cut the video if the sound is short\n        timed = de.encode_cmd('ffmpeg', 'p', 24.0, 'o.mp4', 16, 'a.wav', 0.0, frames=48)\n        self.assertEqual(timed[timed.index('-t') + 1], '2.000000')\n\n    def test_concat_list_quotes(self):\n        self.assertEqual(de.concat_list(['C:\\\\a\\\\it\\'s.mp4']), \"file 'C:/a/it'\\\\''s.mp4'\\n\")\n\n    def test_renumber_handles_negative_frames_in_order(self):\n        paths = [os.path.join('d', 'f.%s.png' % n) for n in ('00002', '-0001', '00000', '00001')]\n        plan = de.renumber_plan(paths + [os.path.join('d', 'notes.txt')])\n        self.assertEqual([os.path.basename(o) for o, _ in plan],\n                         ['f.-0001.png', 'f.00000.png', 'f.00001.png', 'f.00002.png'])\n        self.assertEqual([os.path.basename(n) for _, n in plan],\n                         ['seq.00000.png', 'seq.00001.png', 'seq.00002.png', 'seq.00003.png'])\n\n\nif __name__ == '__main__':\n    unittest.main()",
"aliases": {
"division": "__future__.division",
"print_function": "__future__.print_function",
"os": "os",
"sys": "sys",
"unittest": "unittest"
},
"outline": [
{
"q": "Clips",
"k": "class",
"s": 15,
"e": 32,
"doc": "",
"n": "Tests for `make_clips`.",
"c": [],
"b": []
},
{
"q": "Clips.test_no_bookmarks_exports_the_playback_range",
"k": "def",
"s": 17,
"e": 18,
"doc": "",
"n": "No bookmarks: one clip named `range` covering the playback range.",
"c": [
[
0,
"make_clips"
]
],
"b": []
},
{
"q": "Clips.test_bookmarks_sorted_and_full_range_optional",
"k": "def",
"s": 20,
"e": 24,
"doc": "",
"n": "Bookmarks come out sorted by start; the range is added only when asked.",
"c": [
[
0,
"make_clips"
]
],
"b": []
},
{
"q": "Clips.test_drop_last_frame_for_loops",
"k": "def",
"s": 26,
"e": 29,
"doc": "",
"n": "Drop last removes one frame from each clip, but never from a one-frame clip.",
"c": [
[
0,
"make_clips"
]
],
"b": []
},
{
"q": "Clips.test_reversed_bookmark",
"k": "def",
"s": 31,
"e": 32,
"doc": "",
"n": "A bookmark with start after end is fixed.",
"c": [
[
0,
"make_clips"
]
],
"b": []
},
{
"q": "Names",
"k": "class",
"s": 35,
"e": 50,
"doc": "",
"n": "Tests for `file_names`.",
"c": [],
"b": []
},
{
"q": "Names.test_template_and_cleanup",
"k": "def",
"s": 37,
"e": 40,
"doc": "",
"n": "Tokens are filled in and unsafe characters become underscores.",
"c": [
[
0,
"file_names"
]
],
"b": []
},
{
"q": "Names.test_duplicates_get_numbered",
"k": "def",
"s": 42,
"e": 46,
"doc": "",
"n": "Three clips with the same name plus one already called `loop_2` still give four different names.",
"c": [
[
0,
"file_names"
]
],
"b": []
},
{
"q": "Names.test_bad_template",
"k": "def",
"s": 48,
"e": 50,
"doc": "",
"n": "An unknown token raises `ValueError`.",
"c": [
[
0,
"file_names"
]
],
"b": []
},
{
"q": "Rates",
"k": "class",
"s": 53,
"e": 65,
"doc": "",
"n": "Tests for `parse_fps` and `ffmpeg_rate`.",
"c": [],
"b": []
},
{
"q": "Rates.test_units",
"k": "def",
"s": 55,
"e": 61,
"doc": "",
"n": "Named units, decimal fps and an invalid unit.",
"c": [
[
0,
"parse_fps"
]
],
"b": []
},
{
"q": "Rates.test_ntsc_rates_are_exact_fractions",
"k": "def",
"s": 63,
"e": 65,
"doc": "",
"n": "29.97 becomes `30000/1001`; 24 stays `24`.",
"c": [
[
0,
"ffmpeg_rate"
]
],
"b": []
},
{
"q": "CameraMove",
"k": "class",
"s": 68,
"e": 105,
"doc": "",
"n": "Tests for the camera move curve.",
"c": [],
"b": []
},
{
"q": "CameraMove.clips",
"k": "def",
"s": 70,
"e": 73,
"doc": "",
"n": "Three clips with a gap before the last one.",
"c": [],
"b": [
[
1,
"CameraMove.test_progress_runs_through_clips_and_waits_in_gaps"
]
]
},
{
"q": "CameraMove.test_progress_runs_through_clips_and_waits_in_gaps",
"k": "def",
"s": 75,
"e": 85,
"doc": "",
"n": "Progress goes 0 to 1, never goes back, holds still in the gap, and advances at the same speed in every clip.",
"c": [
[
1,
"CameraMove.clips"
],
[
0,
"progress_map"
]
],
"b": []
},
{
"q": "CameraMove.test_drift_starts_and_ends_still",
"k": "def",
"s": 87,
"e": 96,
"doc": "",
"n": "Drift starts at zero, reaches the full amounts, and starts and ends with almost zero speed (eased).",
"c": [
[
0,
"move_at"
]
],
"b": []
},
{
"q": "CameraMove.test_out_and_back_ends_where_it_started",
"k": "def",
"s": 98,
"e": 101,
"doc": "",
"n": "Out and back: first and last values match, full orbit in the middle.",
"c": [
[
0,
"move_at"
]
],
"b": []
},
{
"q": "CameraMove.test_linear",
"k": "def",
"s": 103,
"e": 105,
"doc": "",
"n": "Linear: a quarter of the way gives a quarter of the orbit.",
"c": [
[
0,
"move_at"
]
],
"b": []
},
{
"q": "Ffmpeg",
"k": "class",
"s": 108,
"e": 136,
"doc": "",
"n": "Tests for the ffmpeg helpers.",
"c": [],
"b": []
},
{
"q": "Ffmpeg.test_encode_command",
"k": "def",
"s": 110,
"e": 116,
"doc": "",
"n": "Exact NTSC rate, H.264, yuv420p, output last, no audio mapping without audio.",
"c": [
[
0,
"encode_cmd"
]
],
"b": []
},
{
"q": "Ffmpeg.test_audio_trim_and_delay",
"k": "def",
"s": 118,
"e": 125,
"doc": "",
"n": "Audio starting before the clip is trimmed (`-ss`), audio starting after is delayed (`-itsoffset`), and the length comes from the frame count.",
"c": [
[
0,
"encode_cmd"
]
],
"b": []
},
{
"q": "Ffmpeg.test_concat_list_quotes",
"k": "def",
"s": 127,
"e": 128,
"doc": "",
"n": "Backslashes and quotes in paths are written safely.",
"c": [
[
0,
"concat_list"
]
],
"b": []
},
{
"q": "Ffmpeg.test_renumber_handles_negative_frames_in_order",
"k": "def",
"s": 130,
"e": 136,
"doc": "",
"n": "Frames -1, 0, 1, 2 are renumbered 0 to 3 in the right order, and other files are ignored.",
"c": [
[
0,
"renumber_plan"
]
],
"b": []
}
],
"lines": {}
}
]
});
