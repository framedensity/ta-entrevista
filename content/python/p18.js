TA.add({
  id: 'p18',
  title: 'TA: verificador de nomenclatura',
  en: 'naming convention checker',

  explain: [
    'Primer proyecto de TA: una herramienta que revisa los nombres de una escena antes de entregarla. Aquí juntas lo que ya sabes: diccionarios, regex, agrupar y funciones pequeñas.',
    { type: 'analogy', text: 'es el corrector ortográfico del pipeline. No arregla nada por su cuenta: señala dónde está el problema y por qué, para que el artista decida.' },
    '### Las reglas son datos, no código',
    'Un error común es escribir un `if` por cada regla. Si mañana cambia la convención, hay que tocar el código. Mejor guardar las reglas en un **diccionario**: tipo de nodo → patrón.',
    { type: 'compare',
      badTitle: 'Reglas mezcladas con la lógica',
      bad: 'if tipo == "camera" and not nombre.startswith("cam_"):\n    ...\nelif tipo == "joint" and not nombre.endswith("_jnt"):\n    ...',
      goodTitle: 'Reglas en datos; la lógica no cambia',
      good: 'REGLAS = {\n    "camera": r"cam_sh\\d{3}",\n    "joint": r"[a-z]+_(l|r|c)_jnt",\n}\npatron = REGLAS.get(tipo)\nif patron and not re.fullmatch(patron, nombre): ...' },
    'Así, las reglas pueden venir de un **JSON** del proyecto (lección 15), y cada proyecto tiene las suyas sin tocar la herramienta.',
    '### Informe útil, no solo «falló»',
    'Un buen verificador dice **qué** nombre falla y **por qué**, y si puede, **sugiere** el nombre correcto. Agrupar los fallos por motivo ayuda a arreglarlos de una vez.',
    { type: 'cg', text: 'antes de enviar la escena a iluminación, el verificador encuentra `Cam_SH10` (debería ser `cam_sh010`) y `Hip_JNT`. El artista los corrige en un minuto en vez de que falle el render.' },
    { type: 'tip', text: 'en la entrevista, describe la estructura: «reglas en un JSON, una función pura que devuelve los problemas, y la interfaz solo los muestra. Así lo puedo correr en lote sin abrir Maya».' }
  ],

  example: {
    intro: 'Reglas por tipo de nodo, y una función que devuelve los problemas.',
    lines: [
      { code: 'import re', note: 'Usaremos `re.fullmatch`.' },
      { code: 'REGLAS = {"camera": r"cam_sh\\d{3}", "joint": r"[a-z]+_(l|r|c)_jnt"}', note: 'Las reglas son datos: tipo → patrón.' },
      { code: 'nodos = [("cam_sh010", "camera"), ("Cam_SH10", "camera"), ("hip_c_jnt", "joint"), ("knee_jnt", "joint")]', note: 'Parejas (nombre, tipo).' },
      { code: 'malos = [n for n, t in nodos if t in REGLAS and not re.fullmatch(REGLAS[t], n)]', note: 'Solo revisamos los tipos que tienen regla.' },
      { code: 'print(malos)', note: 'Los dos nombres que no cumplen.' }
    ],
    output: "['Cam_SH10', 'knee_jnt']"
  },

  mini: [
    {
      q: '¿Por qué guardar las reglas en un diccionario (o JSON) en vez de en `if`?',
      options: ['Porque es más rápido', 'Porque cambiar la convención no obliga a cambiar el código', 'Porque `if` no funciona con texto'],
      answer: 1,
      why: 'Separar datos y lógica permite que cada proyecto tenga sus reglas sin tocar la herramienta.'
    },
    {
      q: 'Un nodo es de un tipo que **no** tiene regla. ¿Qué es lo más razonable?',
      options: ['Marcarlo como error', 'Ignorarlo (no hay nada que comprobar)', 'Borrarlo'],
      answer: 1,
      why: 'Si no hay regla para ese tipo, no hay nada que incumplir. (Opcionalmente, puedes listarlo como «sin revisar».)'
    }
  ],

  exercises: [
    {
      id: 'e1',
      title: 'Revisar con reglas',
      prompt: 'Escribe `revisar(nodos, reglas)`:\n\n- `nodos`: lista de `(nombre, tipo)`.\n- `reglas`: dict `{tipo: patrón}`.\n\nDevuelve un **dict** `{nombre: patrón_que_incumple}` con los nodos que tienen regla y **no** la cumplen (usa `re.fullmatch`).',
      starter: 'import re\n\ndef revisar(nodos, reglas):\n    # tu código\n    pass\n',
      tests: [
        { check: "revisar([('cam_sh010', 'camera'), ('Cam_SH10', 'camera'), ('x', 'mesh')], {'camera': r'cam_sh\\d{3}'}) == {'Cam_SH10': r'cam_sh\\d{3}'}", msg: 'detecta Cam_SH10 e ignora el tipo sin regla' },
        { check: "revisar([], {'camera': 'x'}) == {}", msg: 'sin nodos, devuelve {}' }
      ],
      hints: ['`patron = reglas.get(tipo)`; si es `None`, sigue con el siguiente.', '`if not re.fullmatch(patron, nombre): problemas[nombre] = patron`'],
      solution: 'import re\n\ndef revisar(nodos, reglas):\n    problemas = {}\n    for nombre, tipo in nodos:\n        patron = reglas.get(tipo)\n        if patron and not re.fullmatch(patron, nombre):\n            problemas[nombre] = patron\n    return problemas\n'
    },
    {
      id: 'e2',
      title: 'Sugerir el nombre correcto',
      prompt: 'Escribe `sugerir_camara(nombre)` que normalice nombres de cámara:\n\n- todo en minúsculas\n- el número de toma con **3 dígitos**\n\nEjemplos: `"Cam_SH10"` → `"cam_sh010"`, `"CAM_sh7"` → `"cam_sh007"`.\n\nSi no encuentra un número, devuelve `None`.',
      starter: 'import re\n\ndef sugerir_camara(nombre):\n    # tu código\n    pass\n',
      tests: [
        { check: "sugerir_camara('Cam_SH10') == 'cam_sh010'", msg: 'Cam_SH10 → cam_sh010' },
        { check: "sugerir_camara('CAM_sh7') == 'cam_sh007'", msg: 'CAM_sh7 → cam_sh007' },
        { check: "sugerir_camara('cam_main') is None", msg: 'sin número devuelve None' }
      ],
      hints: ['`m = re.search(r"\\d+", nombre)` busca el primer número.', '`return f"cam_sh{int(m.group()):03d}"`'],
      solution: 'import re\n\ndef sugerir_camara(nombre):\n    m = re.search(r"\\d+", nombre)\n    if not m:\n        return None\n    return f"cam_sh{int(m.group()):03d}"\n'
    },
    {
      id: 'e3',
      title: 'Informe agrupado por motivo',
      prompt: 'Escribe `informe(nombres)` que revise cada nombre con estas comprobaciones, **en este orden**, y se quede con el **primer** motivo que falle:\n\n1. `"mayúsculas"` si el nombre no es todo minúsculas.\n2. `"espacios"` si contiene un espacio.\n3. `"sin versión"` si no termina en `_v` + 3 dígitos.\n\nDevuelve un dict normal `{motivo: [nombres ordenados]}` solo con los motivos que tengan nombres.',
      starter: 'import re\nfrom collections import defaultdict\n\ndef informe(nombres):\n    # tu código\n    pass\n',
      tests: [
        { check: "informe(['hero_v001', 'Hero_v001', 'my hero_v002', 'boss', 'Boss x']) == {'mayúsculas': ['Boss x', 'Hero_v001'], 'espacios': ['my hero_v002'], 'sin versión': ['boss']}", msg: 'agrupa por el primer motivo que falla' },
        { check: "informe(['a_v001']) == {}", msg: 'si todo está bien, devuelve {}' }
      ],
      hints: ['Guarda las comprobaciones en una lista de `(motivo, función)` y recórrela.', 'Por ejemplo: `("mayúsculas", lambda n: n != n.lower())`. Al encontrar el primero, `break`.'],
      solution: 'import re\nfrom collections import defaultdict\n\nCOMPROBACIONES = [\n    ("mayúsculas", lambda n: n != n.lower()),\n    ("espacios", lambda n: " " in n),\n    ("sin versión", lambda n: not re.search(r"_v\\d{3}$", n)),\n]\n\ndef informe(nombres):\n    grupos = defaultdict(list)\n    for n in nombres:\n        for motivo, falla in COMPROBACIONES:\n            if falla(n):\n                grupos[motivo].append(n)\n                break\n    return {m: sorted(v) for m, v in grupos.items()}\n',
      explain: 'Las comprobaciones son **datos** (una lista de parejas). Añadir una regla nueva es añadir una línea, sin tocar el bucle.'
    }
  ],

  summary: [
    'Reglas como datos (dict o JSON): la lógica no cambia cuando cambia la convención.',
    'Devuelve problemas con contexto (qué y por qué) y, si puedes, una sugerencia.',
    'Funciones puras sin interfaz: se pueden probar y usar en lotes.'
  ]
});
