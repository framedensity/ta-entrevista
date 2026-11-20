TA.add({
  id: 'p11',
  title: 'Texto y expresiones regulares',
  en: 'strings & re',

  explain: [
    'En un pipeline, **todo son nombres**: nodos, archivos, carpetas. Saber partir, limpiar y comprobar texto es imprescindible.',
    '### Los métodos de texto más usados',
    '- `s.split("_")` → parte en una lista. `"_".join(lista)` → la vuelve a unir.\n- `s.strip()` → quita espacios de los lados.\n- `s.lower()`, `s.upper()` → minúsculas, mayúsculas.\n- `s.startswith("CHR_")`, `s.endswith(".ma")` → ¿empieza/termina así?\n- `s.replace("old", "new")` → reemplaza.\n- `f"{n:03d}"` → número con 3 dígitos (`007`).',
    { type: 'analogy', text: '`split` es cortar una barra de pan por las marcas. `join` es pegar las rebanadas con mantequilla (el separador) entre ellas.' },
    '### Expresiones regulares: patrones de texto',
    'Una **expresión regular** (*regular expression*, *regex*) describe la **forma** que debe tener un texto. Python las usa con el módulo `re`.',
    { type: 'analogy', text: 'una regex es como un molde de galletas: no dice qué galleta exacta, sino qué forma tiene que tener. Si el texto encaja en el molde, vale.' },
    'Las piezas básicas:',
    '- `\\d` → un dígito. `\\d{3}` → exactamente tres dígitos.\n- `[a-z]+` → una o más letras minúsculas.\n- `(CHR|PRP|ENV)` → una de estas opciones.\n- `^` principio, `$` final.\n- `( )` → un **grupo**: una parte que quieres sacar después.',
    '```python\nimport re\npatron = r"^(CHR|PRP)_([a-z]+)_v(\\d{3})$"\nm = re.match(patron, "CHR_hero_v012")\nm.group(2)   # "hero"\nm.group(3)   # "012"\n```',
    { type: 'warn', text: 'escribe los patrones con `r"..."` (*raw string*). Si no, Python interpreta las barras invertidas antes que `re`.' },
    '`re.fullmatch` comprueba el texto **entero**. `re.sub` reemplaza lo que encaje, y acepta una función para calcular el reemplazo.',
    { type: 'cg', text: 'comprobar que todos los nodos siguen la convención `TIPO_nombre_v###`, sacar el número de versión de un archivo, o subir la versión de `v007` a `v008`.' }
  ],

  example: {
    intro: 'Desmontamos y validamos un nombre de asset.',
    lines: [
      { code: 'import re', note: 'Módulo de expresiones regulares.' },
      { code: 'nombre = "CHR_hero_rig_v012"', note: 'Tipo, nombre, departamento, versión.' },
      { code: 'tipo, asset, dept, ver = nombre.split("_")', note: '`split` da 4 partes y las repartimos en 4 variables.' },
      { code: 'print(asset, int(ver[1:]))', note: '`ver[1:]` quita la "v". `int()` convierte "012" en 12.' },
      { code: 'ok = re.fullmatch(r"(CHR|PRP|ENV)_[a-z]+_[a-z]+_v\\d{3}", nombre) is not None', note: '`fullmatch` devuelve un objeto si encaja, o `None` si no.' },
      { code: 'nuevo = re.sub(r"v(\\d{3})", lambda m: f"v{int(m.group(1)) + 1:03d}", nombre)', note: 'Buscamos `v` + 3 dígitos y lo cambiamos por la versión siguiente.' },
      { code: 'print(ok, nuevo)', note: 'Resultado.' }
    ],
    output: 'hero 12\nTrue CHR_hero_rig_v013'
  },

  mini: [
    {
      q: '¿Qué encaja con el patrón `^sh\\d{3}$`?',
      options: ['`"sh10"`', '`"sh010"`', '`"sh0100"`'],
      answer: 1,
      why: '`\\d{3}` son exactamente 3 dígitos, y `$` obliga a terminar ahí.'
    },
    {
      q: '¿Qué devuelve `"_".join(["sq010", "sh020", "cam"])`?',
      options: ['`"sq010sh020cam"`', '`"sq010_sh020_cam"`', '`["sq010_", "sh020_", "cam_"]`'],
      answer: 1,
      why: '`join` pega los elementos poniendo el separador entre ellos.'
    }
  ],

  exercises: [
    {
      id: 'e1',
      title: 'Partes de un nombre',
      prompt: 'Escribe `partes(nombre)` que reciba algo como `"CHR_hero_rig_v012"` y devuelva el diccionario:\n\n`{"tipo": "CHR", "asset": "hero", "dept": "rig", "version": 12}` (la versión como **número**).',
      starter: 'def partes(nombre):\n    # tu código\n    pass\n',
      tests: [
        { check: "partes('CHR_hero_rig_v012') == {'tipo': 'CHR', 'asset': 'hero', 'dept': 'rig', 'version': 12}", msg: 'desmonta CHR_hero_rig_v012' },
        { check: "partes('PRP_sword_mod_v001')['version'] == 1", msg: 'la versión es un número (1, no "001")' }
      ],
      hints: ['`tipo, asset, dept, ver = nombre.split("_")`', '`int(ver[1:])` quita la "v" y convierte a número.'],
      solution: 'def partes(nombre):\n    tipo, asset, dept, ver = nombre.split("_")\n    return {"tipo": tipo, "asset": asset, "dept": dept, "version": int(ver[1:])}\n'
    },
    {
      id: 'e2',
      title: 'Validar con regex',
      prompt: 'Escribe `es_valido(nombre)` que devuelva `True` solo si el nombre es:\n\n- `CHR`, `PRP` o `ENV`\n- guion bajo y una o más letras minúsculas\n- `_v` y **exactamente** 3 dígitos\n\nEjemplo válido: `"PRP_sword_v003"`.',
      starter: 'import re\n\ndef es_valido(nombre):\n    # tu código\n    pass\n',
      tests: [
        { check: "es_valido('PRP_sword_v003') is True", msg: 'PRP_sword_v003 es válido' },
        { check: "es_valido('prp_sword_v003') is False", msg: 'prp en minúsculas no es válido' },
        { check: "es_valido('CHR_Hero_v001') is False", msg: 'mayúscula en el nombre no es válida' },
        { check: "es_valido('ENV_city_v01') is False", msg: 'v01 (2 dígitos) no es válido' },
        { check: "es_valido('ENV_city_v001_old') is False", msg: 'texto de más al final no es válido' }
      ],
      hints: ['Patrón: `r"(CHR|PRP|ENV)_[a-z]+_v\\d{3}"`', 'Usa `re.fullmatch(...)` y compara con `is not None`.'],
      solution: 'import re\n\ndef es_valido(nombre):\n    return re.fullmatch(r"(CHR|PRP|ENV)_[a-z]+_v\\d{3}", nombre) is not None\n'
    },
    {
      id: 'e3',
      title: 'Subir la versión',
      prompt: 'Escribe `subir_version(archivo)`: `"sh010_anim_v007.ma"` → `"sh010_anim_v008.ma"`. Mantén los 3 dígitos (`v099` → `v100`).',
      starter: 'import re\n\ndef subir_version(archivo):\n    # tu código\n    pass\n',
      tests: [
        { check: "subir_version('sh010_anim_v007.ma') == 'sh010_anim_v008.ma'", msg: 'v007 → v008' },
        { check: "subir_version('cam_v099.fbx') == 'cam_v100.fbx'", msg: 'v099 → v100' }
      ],
      hints: ['Usa `re.sub` con el patrón `r"_v(\\d{3})"`.', 'El reemplazo puede ser una función: `lambda m: f"_v{int(m.group(1)) + 1:03d}"`.'],
      solution: 'import re\n\ndef subir_version(archivo):\n    return re.sub(r"_v(\\d{3})", lambda m: f"_v{int(m.group(1)) + 1:03d}", archivo)\n'
    }
  ],

  summary: [
    '`split`/`join`, `strip`, `lower`, `startswith`/`endswith` y `f"{n:03d}"` cubren casi todo.',
    'Regex: `\\d{3}`, `[a-z]+`, `(A|B)`, grupos `( )`; usa siempre `r"..."`.',
    '`re.fullmatch` valida el texto entero; `re.sub` reemplaza (también con una función).'
  ]
});
