TA.add({
  id: 'p05',
  title: 'Conjuntos',
  en: 'sets',

  explain: [
    'Un **conjunto** (*set*) es una colección **sin repetidos** y **sin orden**. Parece poca cosa, pero resuelve muchos problemas de TA en una línea.',
    { type: 'analogy', text: 'un conjunto es la lista de invitados que tiene el portero de una fiesta. No importa el orden. Nadie aparece dos veces. Y el portero comprueba **al instante** si estás o no.' },
    'Lo creas con llaves, o convirtiendo una lista con `set()`. Los repetidos desaparecen solos.',
    '```python\ncamaras = set(["cam_A", "cam_B", "cam_A"])\n# {"cam_A", "cam_B"}\n```',
    { type: 'warn', text: '`{}` vacío es un **diccionario**, no un conjunto. Un conjunto vacío se escribe `set()`.' },
    '### ¿Por qué es tan rápido?',
    'Para saber si algo está en una **lista**, Python mira los elementos **uno por uno**. Con 100 000 elementos, puede mirar 100 000.',
    'En un **conjunto**, Python calcula directamente dónde estaría el dato (con un *hash*). Mira una sola vez, tenga el tamaño que tenga.',
    { type: 'compare',
      badTitle: 'Lista: busca uno por uno (lento si es grande)',
      bad: 'existentes = ["sh010", "sh020", ...]  # 50 000\nif "sh999" in existentes: ...',
      goodTitle: 'Conjunto: va directo (rápido)',
      good: 'existentes = set(lista_grande)\nif "sh999" in existentes: ...' },
    '### Operaciones de conjuntos',
    '- `a | b` → **unión**: lo que está en a **o** en b.\n- `a & b` → **intersección**: lo que está en **los dos**.\n- `a - b` → **diferencia**: lo que está en a pero **no** en b.\n- `a ^ b` → lo que está en **uno solo** de los dos.',
    { type: 'cg', text: '«¿Qué cámaras pide el guion que no existen en la escena?» es `esperadas - existentes`. Una línea, y rápido aunque haya miles.' },
    { type: 'tip', text: 'cuando te pregunten por eficiencia, di: «Para comprobar pertenencia muchas veces, convierto la lista en `set`, porque `in` pasa de O(n) a O(1) de media».' }
  ],

  example: {
    intro: 'El guion pide unas cámaras. En la escena hay otras.',
    lines: [
      { code: 'guion = {"cam_A", "cam_B", "cam_C"}', note: 'Conjunto con llaves: las cámaras que necesitamos.' },
      { code: 'escena = {"cam_B", "cam_C", "cam_D"}', note: 'Las cámaras que hay en la escena.' },
      { code: 'faltan = guion - escena', note: 'Diferencia: en el guion pero no en la escena → `{"cam_A"}`.' },
      { code: 'sobran = escena - guion', note: 'Al revés: en la escena pero no en el guion → `{"cam_D"}`.' },
      { code: 'ok = guion & escena', note: 'Intersección: están en los dos → `{"cam_B", "cam_C"}`.' },
      { code: 'print(sorted(faltan), sorted(sobran), sorted(ok))', note: 'Los conjuntos no tienen orden. Para mostrarlos bonitos, `sorted()` devuelve una lista ordenada.' }
    ],
    output: "['cam_A'] ['cam_D'] ['cam_B', 'cam_C']"
  },

  mini: [
    {
      q: '¿Qué es `{"a", "b"} & {"b", "c"}`?',
      options: ['`{"a", "b", "c"}`', '`{"b"}`', '`{"a", "c"}`'],
      answer: 1,
      why: '`&` es la intersección: lo que está en los dos. Solo `"b"`.'
    },
    {
      q: 'Tienes que comprobar 10 000 veces si un nombre está en una lista de 50 000 nombres. ¿Qué haces?',
      options: ['Usar la lista tal cual con `in`', 'Convertir la lista en `set` una vez y usar `in`', 'Ordenar la lista cada vez'],
      answer: 1,
      why: 'Con un `set`, cada `in` es casi instantáneo. Con la lista, cada `in` puede recorrer los 50 000.'
    }
  ],
  extra: [
    {
      q: '¿Qué crea `x = {}`?',
      options: ['Un conjunto vacío', 'Un diccionario vacío', 'Un error'],
      answer: 1,
      why: '`{}` es un diccionario vacío. El conjunto vacío es `set()`.'
    }
  ],

  exercises: [
    {
      id: 'e1',
      title: '¿Cuántos personajes distintos?',
      prompt: 'La lista `apariciones` tiene un personaje por cada toma en la que sale. Crea `unicos` con el **número** de personajes distintos.',
      starter: 'apariciones = ["hero", "villain", "hero", "npc_01", "hero", "villain"]\n\n',
      tests: [{ check: 'unicos == 3', msg: '`unicos` vale 3' }],
      hints: ['`set()` quita los repetidos.', '`unicos = len(set(apariciones))`'],
      solution: 'apariciones = ["hero", "villain", "hero", "npc_01", "hero", "villain"]\n\nunicos = len(set(apariciones))\n'
    },
    {
      id: 'e2',
      title: 'En las dos secuencias',
      prompt: 'Crea `compartidos`: una **lista ordenada** con los personajes que salen en las dos secuencias.',
      starter: 'sq010 = ["hero", "villain", "npc_01", "npc_02"]\nsq020 = ["npc_02", "hero", "boss"]\n\n',
      tests: [{ check: "compartidos == ['hero', 'npc_02']", msg: '`compartidos` es ["hero", "npc_02"]' }],
      hints: ['Convierte las dos listas con `set()` y usa `&`.', '`sorted(set(sq010) & set(sq020))`'],
      solution: 'sq010 = ["hero", "villain", "npc_01", "npc_02"]\nsq020 = ["npc_02", "hero", "boss"]\n\ncompartidos = sorted(set(sq010) & set(sq020))\n'
    },
    {
      id: 'e3',
      title: 'Las cámaras que faltan',
      prompt: 'Crea `faltan`: lista ordenada de cámaras que pide el guion pero **no** están en la escena.\n\nCrea `sobran`: lista ordenada de cámaras de la escena que el guion **no** pide.',
      starter: 'guion = ["cam_sh010", "cam_sh020", "cam_sh030", "cam_sh040"]\nescena = ["cam_sh010", "cam_sh030", "cam_test", "cam_sh040"]\n\n',
      tests: [
        { check: "faltan == ['cam_sh020']", msg: '`faltan` es ["cam_sh020"]' },
        { check: "sobran == ['cam_test']", msg: '`sobran` es ["cam_test"]' }
      ],
      hints: ['Diferencia: `set(a) - set(b)`.', 'Recuerda `sorted()` para obtener una lista ordenada.'],
      solution: 'guion = ["cam_sh010", "cam_sh020", "cam_sh030", "cam_sh040"]\nescena = ["cam_sh010", "cam_sh030", "cam_test", "cam_sh040"]\n\nfaltan = sorted(set(guion) - set(escena))\nsobran = sorted(set(escena) - set(guion))\n'
    }
  ],

  summary: [
    'Un `set` no tiene repetidos ni orden. `set(lista)` quita duplicados.',
    '`in` en un set es casi instantáneo: úsalo para buscar muchas veces.',
    '`|` unión, `&` en los dos, `-` en uno pero no en el otro.'
  ]
});
