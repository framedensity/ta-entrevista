TA.add({
  id: 'm10',
  title: 'Interfaz con PySide',
  en: 'PySide UI',

  explain: [
    'Las herramientas de Maya suelen tener una ventana hecha con **PySide** (Qt para Python). Maya 2025 usa PySide6; versiones anteriores, PySide2. El código es casi igual.',
    { type: 'analogy', text: 'la interfaz es el salpicadero de un coche: botones y palancas. El motor es tu lógica (las funciones de las lecciones anteriores). El salpicadero solo **llama** al motor; no debería contener el motor.' },
    '### Las piezas de Qt',
    '- **Widgets**: `QPushButton` (botón), `QLineEdit` (texto), `QListWidget` (lista), `QCheckBox`…\n- **Layouts**: colocan los widgets: `QVBoxLayout` (en columna), `QHBoxLayout` (en fila).\n- **Signals y slots**: un widget emite una **señal** (`clicked`) y la conectas a una función (el **slot**).',
    '```python\nboton = QtWidgets.QPushButton("Revisar")\nboton.clicked.connect(self.revisar)\n```',
    '### Ventana hija de Maya',
    'Si la ventana no tiene a Maya como **padre**, se esconde detrás de Maya al hacer clic fuera. Se obtiene la ventana principal de Maya con `shiboken` y `OpenMayaUI`.',
    '```python\nimport maya.OpenMayaUI as omui\nfrom shiboken6 import wrapInstance\nfrom PySide6 import QtWidgets\n\ndef ventana_maya():\n    ptr = omui.MQtUtil.mainWindow()\n    return wrapInstance(int(ptr), QtWidgets.QWidget)\n```',
    '### Las reglas de oro',
    '- **Separar lógica e interfaz**: la ventana llama a `revisar(nodos)`, que no sabe nada de Qt. Así la misma lógica sirve en un lote sin ventana.\n- **Una sola instancia**: si el artista abre la herramienta dos veces, cierra la anterior (o reutilízala).\n- **No congelar Maya**: en procesos largos, muestra progreso (`QProgressDialog`) y permite cancelar.\n- **Nombre de objeto** (`setObjectName`) para encontrar y cerrar la ventana antigua.',
    { type: 'cg', text: 'un exportador de cinemáticas: una lista de tomas con casillas, un botón «Exportar seleccionadas» y una barra de progreso. Por dentro, cada toma la exporta la misma función que se usa en la granja de render sin interfaz.' },
    { type: 'tip', text: 'si te preguntan por PySide, lo que más puntúa no es saber todos los widgets, sino decir: «separo la lógica de la interfaz; la UI solo recoge parámetros y muestra resultados».' },
    'Esta lección no tiene simulador: los ejercicios son de respuesta escrita.'
  ],

  example: {
    intro: 'Una ventana mínima que llama a la lógica del verificador.',
    lines: [
      { label: 'Importar', code: 'from PySide6 import QtWidgets\nfrom shiboken6 import wrapInstance\nimport maya.OpenMayaUI as omui\nfrom maya import cmds\nfrom mis_herramientas import verificador  # la lógica, sin Qt', note: 'La lógica vive en otro módulo.' },
      { label: 'La ventana', code: 'class Ventana(QtWidgets.QDialog):\n    def __init__(self, parent=None):\n        super().__init__(parent)\n        self.setObjectName("verificador_ui")\n        self.setWindowTitle("Verificador de nombres")\n        self.lista = QtWidgets.QListWidget()\n        boton = QtWidgets.QPushButton("Revisar selección")\n        boton.clicked.connect(self.revisar)\n        capa = QtWidgets.QVBoxLayout(self)\n        capa.addWidget(boton)\n        capa.addWidget(self.lista)', note: 'Widgets en un layout vertical. La señal `clicked` va al método `revisar`.' },
      { label: 'El slot', code: '    def revisar(self):\n        nodos = cmds.ls(sl=True, long=True)\n        problemas = verificador.revisar(nodos)\n        self.lista.clear()\n        self.lista.addItems([f"{n}: {motivo}" for n, motivo in problemas.items()])', note: 'La UI recoge la selección, llama a la lógica y muestra el resultado. Nada más.' },
      { label: 'Abrir una sola vez', code: '_ventana = None\n\ndef mostrar():\n    global _ventana\n    if _ventana is not None:\n        _ventana.close()\n        _ventana.deleteLater()\n    padre = wrapInstance(int(omui.MQtUtil.mainWindow()), QtWidgets.QWidget)\n    _ventana = Ventana(padre)\n    _ventana.show()', note: 'Cierra la ventana anterior y crea la nueva con Maya como padre.' }
    ]
  },

  mini: [
    {
      q: '¿Para qué sirve dar a Maya como padre de tu ventana?',
      options: ['Para que sea más rápida', 'Para que no se esconda detrás de Maya y se cierre con ella', 'Es obligatorio para que funcionen los botones'],
      answer: 1,
      why: 'Una ventana hija se mantiene delante de Maya y se gestiona con ella.'
    },
    {
      q: '¿Qué conecta `boton.clicked.connect(self.revisar)`?',
      options: ['Un atributo de Maya con otro', 'La señal de clic del botón con el método `revisar` (slot)', 'Dos ventanas'],
      answer: 1,
      why: 'Signals y slots: cuando el botón emite `clicked`, Qt llama a `revisar`.'
    }
  ],

  exercises: [
    {
      id: 'e1',
      kind: 'free',
      title: 'Diseña la ventana del exportador',
      prompt: 'Describe (o escribe en código) la interfaz de un exportador de cinemáticas: qué widgets tendría, cómo se organizaría el código y cómo se comportaría en una exportación de 30 tomas.',
      checklist: [
        'Lista de tomas con casillas o selección múltiple (`QListWidget` / `QTreeWidget`).',
        'Opciones claras (carpeta de destino, formato) con valores por defecto de la configuración.',
        'La lógica de exportar está en funciones/clases sin Qt; la UI solo las llama.',
        'Barra de progreso (`QProgressDialog`) y posibilidad de cancelar en lotes largos.',
        'Informe final: qué tomas fueron bien y cuáles fallaron, con el motivo.',
        'Ventana hija de Maya y una sola instancia abierta.'
      ],
      model: '**Widgets:** un `QTreeWidget` con las tomas (casilla, nombre, rango de frames, cámara), un `QLineEdit` + botón para la carpeta de destino, un `QComboBox` para el formato, y los botones «Revisar» y «Exportar».\n\n**Código:**\n- `exportador.py`: funciones puras (`planificar`, `validar`, `exportar_toma`), sin Qt.\n- `exportador_ui.py`: la ventana. Recoge parámetros, llama a la lógica y muestra resultados.\n\n**Lote de 30 tomas:** un `QProgressDialog` que avanza por toma y se puede cancelar. Cada toma va en un `try/except`: si una falla, se registra con `logging` y se sigue. Al final, un resumen «28 bien, 2 con error (y por qué)».\n\n**Detalles:** la ventana es hija de Maya, tiene `objectName` para cerrar la anterior al reabrir, y recuerda la última carpeta usada (`QSettings`).',
      followups: ['¿Cómo evitarías que Maya se congele durante la exportación?', '¿Cómo reutilizarías la lógica en la granja, sin interfaz?', '¿Qué guardarías en `QSettings`?']
    },
    {
      id: 'e2',
      kind: 'free',
      title: '¿Qué mejorarías de este código?',
      prompt: 'Un compañero escribió esto. Señala los problemas y cómo los arreglarías:\n\n```python\ndef abrir():\n    w = QtWidgets.QWidget()\n    b = QtWidgets.QPushButton("Ocultar", w)\n    def ocultar():\n        for n in cmds.ls(sl=True):\n            cmds.setAttr(n + ".visibility", 0)\n    b.clicked.connect(ocultar)\n    w.show()\n```',
      checklist: [
        'La ventana no tiene padre (Maya): se esconde detrás y se puede perder.',
        '`w` es una variable local: Python puede borrar la ventana al salir de la función. Hay que guardarla (en un global o atributo).',
        'Cada llamada abre otra ventana: falta controlar una sola instancia.',
        'La lógica (`ocultar`) está dentro de la UI y depende de la selección: mejor una función que reciba nodos.',
        'Sin undo chunk: ocultar 50 nodos necesita 50 Ctrl+Z.',
        'No hay layout: el botón se coloca a mano.'
      ],
      model: 'Problemas: sin padre, ventana local (se puede borrar sola), varias instancias, lógica mezclada con la UI y dependiente de la selección, sin undo chunk, sin layout.\n\n```python\ndef ocultar(nodos):\n    with undo_chunk():\n        for n in nodos:\n            if cmds.objExists(n):\n                cmds.setAttr(n + ".visibility", False)\n\nclass OcultarUI(QtWidgets.QDialog):\n    def __init__(self, parent=None):\n        super().__init__(parent)\n        self.setObjectName("ocultar_ui")\n        boton = QtWidgets.QPushButton("Ocultar selección")\n        boton.clicked.connect(lambda: ocultar(cmds.ls(sl=True, long=True)))\n        QtWidgets.QVBoxLayout(self).addWidget(boton)\n\n_ui = None\ndef abrir():\n    global _ui\n    if _ui:\n        _ui.close()\n    _ui = OcultarUI(ventana_maya())\n    _ui.show()\n```',
      followups: ['¿Por qué la ventana desaparece a veces justo después de abrirse?', '¿Cómo probarías `ocultar` sin abrir la ventana?']
    }
  ],

  summary: [
    'Widgets + layouts + signals/slots (`boton.clicked.connect(funcion)`).',
    'Ventana hija de Maya (`wrapInstance` + `MQtUtil.mainWindow()`), una sola instancia, guardada fuera de la función.',
    'La UI solo recoge parámetros y muestra resultados; la lógica vive aparte y se puede usar sin ventana.'
  ]
});
