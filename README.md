# TA Interview

A static site for preparing the Technical Artist technical interview (cinematics team):
Python, Maya (`maya.cmds` / OpenMaya), 3D math and tool design.

Built to read on a phone. No server needed: it runs on GitHub Pages.

## Opening it

- Online: GitHub Pages.
- Locally: double-click `index.html`. Python (Pyodide) downloads from the internet the first time you tap “Run”.

## Structure

```
index.html
css/style.css
js/
  app.js        routes: study path, lesson, review, mock exam
  lesson.js     the 5 steps of every lesson
  pyrunner.js   Python in the browser (Pyodide 0.26.4) and auto-grading
  maya_mock.js  small maya.cmds simulator for the Maya exercises
  viz.js        interactive 3D math figures
  editor.js     phone-friendly code area (no autocorrect, auto-indent, symbol row)
  md.js         minimal Markdown
  store.js      progress and mistakes in localStorage
content/
  ta.js           global registry (TA.add)
  curriculum.js   path order
  python/ maya/ math/ design/   one file per lesson
```

## Adding a lesson

1. Create `content/<module>/<id>.js` with `TA.add({ ... })`, copying the shape of an existing lesson.
2. Add the lesson to `content/curriculum.js`. Lessons load automatically from there.

The files are `.js` (not `.json` or `.md`) so the site also works when opened by double-click: browsers do not load `.json` from `file://`. Texts are Markdown inside the file.

### Lesson shape

- `explain`: Markdown strings, or blocks `{type:'analogy'|'cg'|'tip'|'warn', text}`, `{type:'figure', html}`, `{type:'viz', name}`, `{type:'compare', bad, good}`.
- `example`: `intro`, `lines` (`code` + `note`), `output`, `outro`.
- `mini` / `extra`: multiple-choice questions (`q`, `options`, `answer`, `why`).
- `exercises`: `prompt`, `setup`, `starter`, `tests` (`check` is a Python expression; `_out` is what was printed, `_log` is stderr, `_code` is the user's code), `hints`, `solution`. Free-answer exercises use `kind:'free'` with `checklist`, `model` and `followups`.
- `summary`: 3 lines.

## Progress

Saved in the browser (localStorage). Each browser keeps its own progress.
