TA.add({
  id: 'p12',
  title: 'Excepciones',
  en: 'try / except / raise',

  explain: [
    'Una **excepción** (*exception*) es un error que ocurre mientras el programa corre: un archivo que no existe, un número mal escrito, un nodo borrado.',
    'Si nadie la atrapa, el programa se para. En una herramienta que procesa 200 escenas, eso significa que la escena 57 rompe todo el proceso.',
    { type: 'analogy', text: '`try` / `except` es la red de un trapecista. Intentas el salto (`try`). Si te caes, la red te recoge (`except`) y puedes seguir con el espectáculo.' },
    '```python\ntry:\n    frames = int(texto)\nexcept ValueError:\n    frames = 0\n```',
    '### Atrapa solo lo que esperas',
    { type: 'compare',
      badTitle: 'Atrapa TODO, incluso tus propios errores',
      bad: 'try:\n    exportar(toma)\nexcept:\n    pass',
      goodTitle: 'Atrapa el error concreto y avisa',
      good: 'try:\n    exportar(toma)\nexcept FileNotFoundError as e:\n    errores.append((toma, str(e)))',
      note: 'Un `except:` vacío esconde errores de programación (un nombre mal escrito, por ejemplo). Luego nadie sabe por qué falla.' },
    '### else y finally',
    '- `else:` se ejecuta si **no** hubo error.\n- `finally:` se ejecuta **siempre**, haya error o no. Ideal para «cerrar» cosas (por ejemplo, cerrar un *undo chunk* en Maya).',
    '### Lanzar tus propios errores con raise',
    'Si una función recibe datos imposibles, es mejor **avisar en voz alta** que devolver algo raro: `raise ValueError("fin menor que inicio")`.',
    { type: 'cg', text: 'en un proceso por lotes: atrapa el error de **cada** escena, guárdalo en una lista y sigue con la siguiente. Al final, muestra el informe: «198 bien, 2 con error, y por qué».' },
    { type: 'tip', text: 'si te preguntan cómo manejas errores, la respuesta clave es: «no paro todo el lote por una escena; registro el error con contexto y sigo».' }
  ],

  example: {
    intro: 'Procesamos varias tomas y algunas tienen datos rotos.',
    lines: [
      { code: 'datos = {"sh010": "48", "sh020": "noventa", "sh030": "72"}', note: 'Los frames llegan como texto. Uno está mal escrito.' },
      { code: 'ok, errores = {}, []', note: 'Guardaremos los buenos y los errores por separado.' },
      { code: 'for toma, texto in datos.items():\n    try:\n        ok[toma] = int(texto)\n    except ValueError as e:\n        errores.append((toma, str(e)))', note: '`int("noventa")` lanza `ValueError`. Lo atrapamos, lo anotamos y seguimos.' },
      { code: 'print(ok)', note: 'Las tomas que sí se pudieron leer.' },
      { code: 'print(errores)', note: 'Cada error con su toma: así el informe es útil.' }
    ],
    output: "{'sh010': 48, 'sh030': 72}\n[('sh020', \"invalid literal for int() with base 10: 'noventa'\")]"
  },

  mini: [
    {
      q: '¿Cuándo se ejecuta el bloque `finally`?',
      options: ['Solo si hubo error', 'Solo si no hubo error', 'Siempre'],
      answer: 2,
      why: '`finally` se ejecuta siempre. Por eso se usa para limpiar o cerrar cosas.'
    },
    {
      q: '¿Por qué es mala idea `except:` sin tipo de error?',
      options: ['Porque es más lento', 'Porque esconde también errores que no esperabas, como fallos de programación', 'Porque Python no lo permite'],
      answer: 1,
      why: 'Atrapa todo, incluso un `NameError` por un nombre mal escrito. El fallo queda escondido.'
    }
  ],

  exercises: [
    {
      id: 'e1',
      title: 'Convertir con seguridad',
      prompt: 'Escribe `a_entero(texto, defecto=0)`: devuelve `int(texto)`, o `defecto` si el texto no es un número válido. Atrapa **solo** `ValueError`.',
      starter: 'def a_entero(texto, defecto=0):\n    # tu código\n    pass\n',
      tests: [
        { check: "a_entero('48') == 48", msg: 'a_entero("48") da 48' },
        { check: "a_entero('abc') == 0", msg: 'a_entero("abc") da 0' },
        { check: "a_entero('x', defecto=-1) == -1", msg: 'usa el valor por defecto que le pases' }
      ],
      hints: ['`try:` con `return int(texto)` dentro.', '`except ValueError:` y `return defecto`.'],
      solution: 'def a_entero(texto, defecto=0):\n    try:\n        return int(texto)\n    except ValueError:\n        return defecto\n'
    },
    {
      id: 'e2',
      title: 'Avisar de datos imposibles',
      prompt: 'Escribe `duracion(inicio, fin)` que devuelva `fin - inicio + 1`. Pero si `fin < inicio`, lanza `ValueError` con un mensaje que contenga los dos números.',
      starter: 'def duracion(inicio, fin):\n    # tu código\n    pass\n',
      tests: [
        { check: 'duracion(1001, 1048) == 48', msg: 'duracion(1001, 1048) da 48' },
        { check: "_raises(lambda: duracion(10, 5), ValueError)", msg: 'duracion(10, 5) lanza ValueError' },
        { check: "_msg(lambda: duracion(10, 5)).count('10') >= 1 and _msg(lambda: duracion(10, 5)).count('5') >= 1", msg: 'el mensaje del error menciona 10 y 5' }
      ],
      setup: 'def _raises(fn, exc):\n    try:\n        fn()\n    except exc:\n        return True\n    except Exception:\n        return False\n    return False\n\ndef _msg(fn):\n    try:\n        fn()\n    except Exception as e:\n        return str(e)\n    return ""\n',
      hints: ['`if fin < inicio:` y dentro `raise ValueError(f"fin ({fin}) menor que inicio ({inicio})")`.'],
      solution: 'def duracion(inicio, fin):\n    if fin < inicio:\n        raise ValueError(f"fin ({fin}) menor que inicio ({inicio})")\n    return fin - inicio + 1\n'
    },
    {
      id: 'e3',
      title: 'Un lote que no se rompe',
      prompt: 'Escribe `procesar(tomas)`: recibe `{toma: texto_frames}` y devuelve `(ok, errores)`:\n\n- `ok`: dict `{toma: frames}` con las que se pudieron convertir.\n- `errores`: lista **ordenada** con los nombres de las tomas que fallaron.\n\nUn error en una toma no debe parar las demás.',
      starter: 'def procesar(tomas):\n    # tu código\n    pass\n',
      tests: [
        { check: "procesar({'a': '10', 'b': 'x', 'c': '30', 'd': ''}) == ({'a': 10, 'c': 30}, ['b', 'd'])", msg: 'separa las buenas de las que fallan' },
        { check: "procesar({}) == ({}, [])", msg: 'sin tomas, devuelve ({}, [])' }
      ],
      hints: ['Dentro del `for`, pon el `try` / `except ValueError`.', 'Al final: `return ok, sorted(errores)`.'],
      solution: 'def procesar(tomas):\n    ok, errores = {}, []\n    for toma, texto in tomas.items():\n        try:\n            ok[toma] = int(texto)\n        except ValueError:\n            errores.append(toma)\n    return ok, sorted(errores)\n'
    }
  ],

  summary: [
    '`try` / `except TipoDeError` atrapa solo lo que esperas; nunca un `except:` vacío.',
    '`finally` siempre se ejecuta; `raise ValueError(...)` avisa de datos imposibles.',
    'En lotes: atrapa por elemento, guarda el error con contexto y sigue.'
  ]
});
