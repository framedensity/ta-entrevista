# Entrevista TA

Sitio estático para preparar la entrevista técnica de Technical Artist (equipo de cinemáticas):
Python, Maya (`maya.cmds` / OpenMaya), matemáticas 3D y diseño de herramientas.

Pensado para leer en el móvil. No necesita servidor: funciona en GitHub Pages.

## Cómo abrirlo

- En línea: GitHub Pages.
- En local: abre `index.html` con doble clic. Python (Pyodide) se descarga de internet la primera vez que pulsas «Ejecutar».

## Estructura

```
index.html
css/style.css
js/
  app.js        rutas: ruta de estudio, lección, repaso, simulacro
  lesson.js     los 5 pasos de cada lección
  pyrunner.js   Python en el navegador (Pyodide 0.26.4) y corrección automática
  editor.js     área de código para el móvil (sin autocorrección, fila de símbolos)
  md.js         Markdown mínimo
  store.js      progreso y errores en localStorage
content/
  ta.js           registro global (TA.add)
  curriculum.js   orden de la ruta
  python/p01.js … lecciones
```

## Añadir una lección

1. Crea `content/<tema>/<id>.js` con `TA.add({ ... })`, copiando la forma de `content/python/p01.js`.
2. Añade la lección a `content/curriculum.js` (si no estaba).
3. Añade su `<script>` en `index.html`.

Los archivos son `.js` (no `.json` ni `.md`) para que el sitio también funcione al abrirlo con doble clic: el navegador no deja cargar `.json` desde `file://`. Los textos se escriben en Markdown dentro del archivo.

### Forma de una lección

- `explain`: textos en Markdown, o bloques `{type:'analogy'|'cg', text}` y `{type:'figure', html}`.
- `example`: `intro`, `lines` (`code` + `note`), `output`, `outro`.
- `mini`: preguntas de opción múltiple (`q`, `options`, `answer`, `why`).
- `exercises`: `prompt`, `starter`, `tests` (`check` es una expresión de Python; `_out` es lo que se imprimió), `hints`, `solution`.
- `summary`: 3 líneas.

## Progreso

Se guarda en el navegador (localStorage). Cada navegador tiene su propio progreso.
