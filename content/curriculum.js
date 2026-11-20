// Orden de la ruta. Cada lección vive en content/<id del tema>/<id de la lección>.js
// Para añadir una lección: crea el archivo y añade una línea aquí. No hace falta tocar index.html.
TA.curriculum = [
  { id: 'python', title: 'Python', icon: '🐍',
    note: 'Las dos primeras lecciones son opcionales. Lo importante empieza en «Diccionarios».',
    lessons: [
    { id: 'p01', title: 'Variables y tipos de datos', en: 'variables & data types', optional: true },
    { id: 'p02', title: 'Listas', en: 'lists', optional: true },
    { id: 'p03', title: 'Diccionarios', en: 'dictionaries' },
    { id: 'p04', title: 'Recorrer diccionarios', en: 'items(), comprehensions, sorting' },
    { id: 'p05', title: 'Conjuntos', en: 'sets' },
    { id: 'p06', title: 'Patrón: comparar listas y diccionarios', en: 'diffing collections' },
    { id: 'p07', title: 'Patrón: encontrar duplicados', en: 'finding duplicates efficiently' },
    { id: 'p08', title: 'Patrón: agrupar y contar', en: 'defaultdict & Counter' },
    { id: 'p09', title: 'Herramientas que ahorran bucles', en: 'enumerate, zip, any/all, sorted(key=)' },
    { id: 'p10', title: 'Funciones bien hechas', en: 'functions & arguments' },
    { id: 'p11', title: 'Texto y expresiones regulares', en: 'strings & re' },
    { id: 'p12', title: 'Excepciones', en: 'try / except / raise' },
    { id: 'p13', title: 'os y os.path', en: 'files & paths' },
    { id: 'p14', title: 'Recorrer carpetas', en: 'os.walk, glob, pathlib' },
    { id: 'p15', title: 'JSON', en: 'json & config files' },
    { id: 'p16', title: 'Clases', en: 'classes & dataclasses' },
    { id: 'p17', title: 'logging', en: 'logging instead of print' },
    { id: 'p18', title: 'TA: verificador de nomenclatura', en: 'naming convention checker' },
    { id: 'p19', title: 'TA: renombrado por lotes seguro', en: 'batch rename with dry run' },
    { id: 'p20', title: 'TA: configuración de una herramienta', en: 'tool config with defaults' }
  ]},
  { id: 'maya', title: 'Maya', icon: '🧊',
    note: 'Los ejercicios usan un simulador de `maya.cmds` dentro del navegador.',
    lessons: [
    { id: 'm01', title: 'La escena como árbol genealógico', en: 'nodes, DAG, transform & shape' },
    { id: 'm02', title: 'Crear y listar nodos', en: 'createNode / ls' },
    { id: 'm03', title: 'Jerarquía', en: 'parent / listRelatives' },
    { id: 'm04', title: 'Renombrar y nomenclatura', en: 'rename' },
    { id: 'm05', title: 'Atributos', en: 'getAttr / setAttr / addAttr' },
    { id: 'm06', title: 'Conexiones', en: 'connectAttr / listConnections' },
    { id: 'm07', title: 'Keyframes', en: 'setKeyframe / keyframe' },
    { id: 'm08', title: 'Buenas prácticas en Maya', en: 'undo chunks, no selection, None' },
    { id: 'm09', title: 'OpenMaya API 2.0', en: 'OpenMaya' },
    { id: 'm10', title: 'Interfaz con PySide', en: 'PySide UI' }
  ]},
  { id: 'math', title: 'Matemáticas 3D', icon: '📐',
    note: 'Las figuras se pueden arrastrar con el dedo.',
    lessons: [
    { id: 'v01', title: 'Vectores', en: 'vectors' },
    { id: 'v02', title: 'Magnitud y normalización', en: 'length & normalize' },
    { id: 'v03', title: 'Producto escalar', en: 'dot product' },
    { id: 'v04', title: 'Producto vectorial', en: 'cross product' },
    { id: 'v05', title: 'Matrices', en: 'matrices' },
    { id: 'v06', title: 'Espacio local y mundial', en: 'local vs world space' },
    { id: 'v07', title: 'Ángulos de Euler y bloqueo de cardán', en: 'Euler angles & gimbal lock' },
    { id: 'v08', title: 'Cuaterniones', en: 'quaternions' },
    { id: 'v09', title: 'Interpolación lineal', en: 'lerp' },
    { id: 'v10', title: 'Interpolación esférica', en: 'slerp' }
  ]},
  { id: 'design', title: 'Diseño de herramientas', icon: '🛠️',
    note: 'Respuestas libres: escribes, y luego comparas con los puntos clave.',
    lessons: [
    { id: 'd01', title: '¿Qué es una buena herramienta?', en: 'what makes a good tool' },
    { id: 'd02', title: 'Primero, los requisitos', en: 'requirements' },
    { id: 'd03', title: 'Errores y logs', en: 'error handling & logging' },
    { id: 'd04', title: 'Pensar como artista', en: 'artist UX' },
    { id: 'd05', title: 'Extensibilidad', en: 'extensibility' },
    { id: 'd06', title: 'Caso: exportar 100 cortes de cinemática', en: 'design case' },
    { id: 'd07', title: 'Caso: un error que afecta a 200 escenas', en: 'design case' }
  ]}
];
