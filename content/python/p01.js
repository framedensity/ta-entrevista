TA.add({
  id: 'p01',
  title: 'Variables y tipos de datos',
  en: 'variables & data types',

  explain: [
    'Un programa necesita recordar datos. Por ejemplo, el nombre de una cámara o cuántos frames dura una toma. Para recordarlos, usamos **variables**.',
    { type: 'analogy', text: 'una **variable** (*variable*) es una caja con una etiqueta. Dentro de la caja guardas un dato. Con la etiqueta lo encuentras después.' },
    { type: 'figure', html:
      '<svg viewBox="0 0 330 120" role="img" aria-label="Tres cajas con etiquetas: camara, frames y fps">' +
      '<g font-family="ui-monospace,Menlo,monospace" font-size="13">' +
      '<rect x="8" y="34" width="96" height="58" rx="10" style="fill:var(--accbg);stroke:var(--acc)"/>' +
      '<rect x="20" y="18" width="72" height="24" rx="6" style="fill:var(--acc)"/><text x="56" y="35" text-anchor="middle" style="fill:var(--card)">camara</text>' +
      '<text x="56" y="74" text-anchor="middle" style="fill:var(--ink)">"cam_A"</text>' +
      '<rect x="117" y="34" width="96" height="58" rx="10" style="fill:var(--accbg);stroke:var(--acc)"/>' +
      '<rect x="129" y="18" width="72" height="24" rx="6" style="fill:var(--acc)"/><text x="165" y="35" text-anchor="middle" style="fill:var(--card)">frames</text>' +
      '<text x="165" y="74" text-anchor="middle" style="fill:var(--ink)">48</text>' +
      '<rect x="226" y="34" width="96" height="58" rx="10" style="fill:var(--accbg);stroke:var(--acc)"/>' +
      '<rect x="238" y="18" width="72" height="24" rx="6" style="fill:var(--acc)"/><text x="274" y="35" text-anchor="middle" style="fill:var(--card)">fps</text>' +
      '<text x="274" y="74" text-anchor="middle" style="fill:var(--ink)">24.0</text>' +
      '</g><text x="165" y="114" text-anchor="middle" font-size="12" style="fill:var(--mute)">etiqueta = nombre · dentro = valor</text></svg>' },
    'En Python creas una variable con el signo `=`. A la izquierda va el nombre. A la derecha va el valor.',
    '¡Ojo! Aquí `=` no significa «es igual a». Significa «guarda esto en esta caja».',
    '```python\nfps = 24\n```',
    '### Los tipos de datos',
    'Cada dato tiene un **tipo de dato** (*data type*). El tipo dice qué clase de cosa hay en la caja.',
    { type: 'analogy', text: 'no es lo mismo una caja con agua que una caja con cartas. Con el agua no puedes leer, y con las cartas no puedes beber. Con los datos pasa igual.' },
    'Los cuatro tipos básicos son:',
    '- `int` (*integer*, número entero): `48`\n- `float` (*float*, número decimal): `23.976`\n- `str` (*string*, cadena de texto): `"cam_A"`. El texto siempre va entre comillas.\n- `bool` (*boolean*, booleano): solo puede ser `True` (verdadero) o `False` (falso).',
    'Si no sabes qué hay en una caja, usa `type()`. Te dice el tipo del dato.',
    { type: 'cg', text: 'una herramienta para exportar cinemáticas guarda el nombre de la cámara (`str`), el frame de inicio (`int`), los fps (`float`) y si la toma está aprobada (`bool`).' }
  ],

  example: {
    intro: 'Vamos a guardar los datos de una toma (*shot*) y calcular cuánto dura en segundos.',
    lines: [
      { code: 'camara = "cam_shot010"', note: 'Creamos la caja `camara` y guardamos un texto (`str`).' },
      { code: 'frames = 48', note: 'Guardamos un número entero (`int`): la toma dura 48 frames.' },
      { code: 'fps = 24.0', note: 'Guardamos un decimal (`float`): 24 fotogramas por segundo.' },
      { code: 'aprobada = True', note: 'Guardamos un booleano (`bool`): la toma está aprobada.' },
      { code: 'segundos = frames / fps', note: 'Usamos dos cajas para calcular una nueva. `/` es dividir. 48 / 24.0 = 2.0' },
      { code: 'print(camara, segundos)', note: '`print()` muestra datos en pantalla. Si le das varios, los separa con un espacio.' },
      { code: 'print(type(frames))', note: '`type()` nos dice el tipo. Aquí es `int`.' }
    ],
    output: "cam_shot010 2.0\n<class 'int'>",
    outro: 'Fíjate: dividir con `/` siempre da un `float` (por eso sale `2.0` y no `2`).'
  },

  mini: [
    {
      q: '¿Qué hace la línea `fps = 24`?',
      options: ['Guarda el valor 24 en una caja llamada `fps`', 'Pregunta si `fps` es igual a 24', 'Muestra 24 en pantalla'],
      answer: 0,
      why: 'El signo `=` guarda un valor. Para mostrar en pantalla se usa `print()`.'
    },
    {
      q: '¿De qué tipo es `"cam_A"`?',
      options: ['`int`', '`float`', '`str`', '`bool`'],
      answer: 2,
      why: 'Va entre comillas, así que es texto: un `str` (*string*).'
    }
  ],

  exercises: [
    {
      id: 'e1',
      title: 'Tu primera variable',
      prompt: 'Crea una variable `camara` con el texto `"cam_shot020"`.\n\nCrea otra variable `frames` con el número entero `72`.',
      starter: '# Escribe tu código aquí\n',
      tests: [
        { check: "camara == 'cam_shot020'", msg: '`camara` guarda el texto "cam_shot020"' },
        { check: "frames == 72 and type(frames) is int", msg: '`frames` guarda el entero 72' }
      ],
      hints: ['El texto va entre comillas: `"cam_shot020"`.', 'Un número entero se escribe sin comillas y sin punto: `72`.'],
      solution: 'camara = "cam_shot020"\nframes = 72\n'
    },
    {
      id: 'e2',
      title: 'De frames a segundos',
      prompt: 'Ya tienes `frames` y `fps`.\n\nCrea la variable `segundos` dividiendo `frames` entre `fps`. Después, muestra `segundos` con `print()`.',
      starter: 'frames = 96\nfps = 24\n\n',
      tests: [
        { check: 'segundos == 4', msg: '`segundos` vale 4.0' },
        { check: "'4.0' in _out", msg: 'Se muestra `4.0` en pantalla' }
      ],
      hints: ['Dividir es `/`.', 'Primero `segundos = frames / fps`, y en otra línea `print(segundos)`.'],
      solution: 'frames = 96\nfps = 24\n\nsegundos = frames / fps\nprint(segundos)\n'
    },
    {
      id: 'e3',
      title: '¿Es una toma válida?',
      prompt: 'Una toma es válida si tiene más de 0 frames.\n\nLa comparación `>` (mayor que) da como resultado `True` o `False`. Crea la variable `es_valida` con el resultado de `frames > 0`.',
      starter: 'frames = 30\n\n',
      tests: [
        { check: 'es_valida is True', msg: '`es_valida` es `True`' },
        { check: "type(es_valida) is bool", msg: '`es_valida` es de tipo `bool`' }
      ],
      hints: ['No escribas `True` a mano: deja que Python lo calcule con la comparación.', '`es_valida = frames > 0`'],
      solution: 'frames = 30\n\nes_valida = frames > 0\n'
    }
  ],

  summary: [
    'Una **variable** es una caja con etiqueta: `nombre = valor`.',
    'Los tipos básicos son `int`, `float`, `str` y `bool`. `type()` te dice cuál es.',
    'En TA usamos variables para guardar datos de tomas, cámaras y frames.'
  ]
});
