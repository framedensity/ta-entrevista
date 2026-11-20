TA.add({
  id: 'p16',
  title: 'Clases',
  en: 'classes & dataclasses',

  explain: [
    'Cuando los datos y las acciones van siempre juntos (una toma tiene inicio, fin, cámara… y sabe calcular su duración), una **clase** los mantiene ordenados.',
    { type: 'analogy', text: 'una **clase** es el plano de una casa. Un **objeto** (*instance*) es una casa construida con ese plano. Puedes construir muchas casas con el mismo plano, cada una con sus propios muebles.' },
    '```python\nclass Toma:\n    def __init__(self, nombre, inicio, fin):\n        self.nombre = nombre\n        self.inicio = inicio\n        self.fin = fin\n\n    def duracion(self):\n        return self.fin - self.inicio + 1\n\nt = Toma("sh010", 1001, 1048)\nt.duracion()   # 48\n```',
    '- `__init__` se ejecuta al crear el objeto: prepara sus datos.\n- `self` es «este objeto en concreto». Por eso cada toma guarda su propio `inicio`.\n- Un **método** es una función dentro de la clase: `t.duracion()`.',
    '### __repr__: cómo se ve al imprimir',
    'Sin `__repr__`, imprimir un objeto da algo como `<Toma object at 0x7f...>`. Con él, ves algo útil al depurar.',
    '### dataclass: menos código para clases de datos',
    '`@dataclass` escribe por ti el `__init__`, el `__repr__` y la comparación con `==`.',
    { type: 'compare',
      badTitle: 'Todo a mano',
      bad: 'class Toma:\n    def __init__(self, nombre, inicio, fin):\n        self.nombre = nombre\n        self.inicio = inicio\n        self.fin = fin\n    def __repr__(self):\n        return f"Toma({self.nombre!r}, ...)"',
      goodTitle: 'Con dataclass',
      good: 'from dataclasses import dataclass\n\n@dataclass\nclass Toma:\n    nombre: str\n    inicio: int\n    fin: int' },
    { type: 'cg', text: 'una herramienta de exportación tiene una clase `Exportador` que guarda la configuración en `self` y tiene métodos `validar()` y `exportar()`. La interfaz (PySide) solo llama a esos métodos.' },
    { type: 'tip', text: 'separar la **lógica** (clases y funciones sin interfaz) de la **interfaz** (PySide) es algo que los entrevistadores de TA valoran mucho: se puede probar y reutilizar en lotes sin abrir ventanas.' }
  ],

  example: {
    intro: 'Una clase de datos para las tomas.',
    lines: [
      { code: 'from dataclasses import dataclass, field', note: 'Importamos `dataclass`.' },
      { code: '@dataclass\nclass Toma:\n    nombre: str\n    inicio: int\n    fin: int\n    camaras: list = field(default_factory=list)', note: 'Cada campo con su tipo. Para listas por defecto se usa `field(default_factory=list)` (la misma trampa de la lección 10).' },
      { code: '    def duracion(self):\n        return self.fin - self.inicio + 1', note: 'Un método normal dentro de la clase.' },
      { code: 't = Toma("sh010", 1001, 1048)\nt.camaras.append("cam_A")', note: 'Creamos un objeto y usamos su lista.' },
      { code: 'print(t)\nprint(t.duracion())', note: 'El `__repr__` automático muestra todos los campos.' }
    ],
    output: "Toma(nombre='sh010', inicio=1001, fin=1048, camaras=['cam_A'])\n48"
  },

  mini: [
    {
      q: '¿Qué es `self` dentro de un método?',
      options: ['La clase', 'El objeto concreto con el que se llama al método', 'Una variable global'],
      answer: 1,
      why: 'En `t.duracion()`, `self` es `t`. Así cada objeto usa sus propios datos.'
    },
    {
      q: '¿Qué escribe automáticamente `@dataclass`?',
      options: ['`__init__`, `__repr__` y `__eq__`', 'Solo el `__init__`', 'Una interfaz gráfica'],
      answer: 0,
      why: 'Por eso es ideal para clases que son, sobre todo, datos.'
    }
  ],

  exercises: [
    {
      id: 'e1',
      title: 'La clase Toma',
      prompt: 'Crea la clase `Toma` con `nombre`, `inicio` y `fin`, y estos métodos:\n\n- `duracion()` → frames, contando inicio y fin.\n- `contiene(frame)` → `True` si el frame está entre inicio y fin (incluidos).',
      starter: 'class Toma:\n    def __init__(self, nombre, inicio, fin):\n        pass\n',
      tests: [
        { check: "Toma('sh010', 1001, 1048).duracion() == 48", msg: 'duracion() da 48' },
        { check: "Toma('sh010', 1001, 1048).contiene(1048) is True", msg: 'contiene(1048) es True' },
        { check: "Toma('sh010', 1001, 1048).contiene(1000) is False", msg: 'contiene(1000) es False' },
        { check: "Toma('x', 1, 2).nombre == 'x'", msg: 'guarda el nombre en self.nombre' }
      ],
      hints: ['En `__init__`: `self.nombre = nombre`, etc.', '`return self.inicio <= frame <= self.fin`'],
      solution: 'class Toma:\n    def __init__(self, nombre, inicio, fin):\n        self.nombre = nombre\n        self.inicio = inicio\n        self.fin = fin\n\n    def duracion(self):\n        return self.fin - self.inicio + 1\n\n    def contiene(self, frame):\n        return self.inicio <= frame <= self.fin\n'
    },
    {
      id: 'e2',
      title: 'Con dataclass',
      prompt: 'Reescribe `Toma` como `@dataclass` con `nombre: str`, `inicio: int`, `fin: int`, y el método `duracion()`.\n\nLuego crea `tomas` con tres objetos (`sh010` 1001–1048, `sh020` 1049–1144, `sh030` 1145–1168) y `total` con la suma de sus duraciones.',
      starter: 'from dataclasses import dataclass\n\n',
      tests: [
        { check: "Toma('a', 1, 10) == Toma('a', 1, 10)", msg: 'dos tomas iguales son == (lo da dataclass)' },
        { check: 'len(tomas) == 3 and total == 168', msg: '`total` vale 168 (48 + 96 + 24)' },
        { check: "'sh010' in repr(tomas[0])", msg: 'el repr muestra el nombre' }
      ],
      hints: ['`@dataclass` encima de `class Toma:` y los campos con su tipo.', '`total = sum(t.duracion() for t in tomas)`'],
      solution: 'from dataclasses import dataclass\n\n@dataclass\nclass Toma:\n    nombre: str\n    inicio: int\n    fin: int\n\n    def duracion(self):\n        return self.fin - self.inicio + 1\n\ntomas = [Toma("sh010", 1001, 1048), Toma("sh020", 1049, 1144), Toma("sh030", 1145, 1168)]\ntotal = sum(t.duracion() for t in tomas)\n'
    },
    {
      id: 'e3',
      title: '¿Se solapan?',
      prompt: 'Añade a tu `Toma` (puede ser dataclass) el método `solapa(otra)`: `True` si comparten algún frame.\n\nPista: dos rangos **no** se solapan si uno termina antes de que empiece el otro.',
      starter: 'from dataclasses import dataclass\n\n@dataclass\nclass Toma:\n    nombre: str\n    inicio: int\n    fin: int\n\n    def solapa(self, otra):\n        pass\n',
      tests: [
        { check: "Toma('a', 1, 10).solapa(Toma('b', 10, 20)) is True", msg: '1–10 y 10–20 se solapan (comparten el 10)' },
        { check: "Toma('a', 1, 10).solapa(Toma('b', 11, 20)) is False", msg: '1–10 y 11–20 no se solapan' },
        { check: "Toma('a', 5, 6).solapa(Toma('b', 1, 20)) is True", msg: 'una dentro de otra se solapa' }
      ],
      hints: ['No se solapan si `self.fin < otra.inicio` o `otra.fin < self.inicio`.', '`return not (self.fin < otra.inicio or otra.fin < self.inicio)`'],
      solution: 'from dataclasses import dataclass\n\n@dataclass\nclass Toma:\n    nombre: str\n    inicio: int\n    fin: int\n\n    def solapa(self, otra):\n        return not (self.fin < otra.inicio or otra.fin < self.inicio)\n'
    }
  ],

  summary: [
    'Clase = plano; objeto = casa construida. `self` es el objeto concreto.',
    '`__init__` prepara los datos; los métodos son funciones del objeto.',
    '`@dataclass` ahorra `__init__`, `__repr__` y `__eq__` en clases de datos.'
  ]
});
