// Orden de la ruta. Para añadir una lección: crea su archivo en content/ y añádelo aquí.
TA.curriculum = [
  { id: 'python', title: 'Python', icon: '🐍', lessons: [
    { id: 'p01', title: 'Variables y tipos de datos', en: 'variables & data types' },
    { id: 'p02', title: 'Listas', en: 'lists' },
    { id: 'p03', title: 'Diccionarios', en: 'dictionaries' },
    { id: 'p04', title: 'Condicionales', en: 'if / else' },
    { id: 'p05', title: 'Bucles', en: 'for / while loops' },
    { id: 'p06', title: 'Funciones', en: 'functions' },
    { id: 'p07', title: 'Texto y f-strings', en: 'strings' },
    { id: 'p08', title: 'Excepciones', en: 'try / except' },
    { id: 'p09', title: 'Clases', en: 'classes' },
    { id: 'p10', title: 'Rutas y archivos', en: 'pathlib / os' },
    { id: 'p11', title: 'JSON', en: 'JSON' },
    { id: 'p12', title: 'TA: verificador de nomenclatura', en: 'naming convention checker' },
    { id: 'p13', title: 'TA: procesamiento por lotes', en: 'batch processing' },
    { id: 'p14', title: 'TA: archivos de configuración', en: 'config files' }
  ]},
  { id: 'maya', title: 'Maya', icon: '🧊', lessons: [
    { id: 'm01', title: 'La escena como árbol genealógico', en: 'nodes & DAG' },
    { id: 'm02', title: 'Crear y listar nodos', en: 'createNode / ls' },
    { id: 'm03', title: 'Jerarquía', en: 'parent / listRelatives' },
    { id: 'm04', title: 'Renombrar y nomenclatura', en: 'rename' },
    { id: 'm05', title: 'Atributos', en: 'getAttr / setAttr / addAttr' },
    { id: 'm06', title: 'Conexiones', en: 'connectAttr' },
    { id: 'm07', title: 'Keyframes', en: 'setKeyframe / keyframe' },
    { id: 'm08', title: 'Buenas prácticas', en: 'undo chunk, no depender de la selección' },
    { id: 'm09', title: 'OpenMaya API 2.0', en: 'OpenMaya' },
    { id: 'm10', title: 'Interfaz con PySide', en: 'PySide UI' }
  ]},
  { id: 'math', title: 'Matemáticas 3D', icon: '📐', lessons: [
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
  { id: 'design', title: 'Diseño de herramientas', icon: '🛠️', lessons: [
    { id: 'd01', title: '¿Qué es una buena herramienta?', en: 'what makes a good tool' },
    { id: 'd02', title: 'Primero, los requisitos', en: 'requirements' },
    { id: 'd03', title: 'Errores y logs', en: 'error handling & logging' },
    { id: 'd04', title: 'Pensar como artista', en: 'artist UX' },
    { id: 'd05', title: 'Extensibilidad', en: 'extensibility' },
    { id: 'd06', title: 'Caso: exportar 100 cortes de cinemática', en: 'design case' },
    { id: 'd07', title: 'Caso: un error que afecta a 200 escenas', en: 'design case' }
  ]}
];
