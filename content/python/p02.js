TA.add({
  id: 'p02',
  title: 'Listas',
  en: 'lists',

  explain: [
    'Una cinemática no tiene una sola toma. Tiene muchas. Crear una variable para cada una (`toma1`, `toma2`…) sería un lío.',
    'Para guardar muchos datos juntos, usamos una **lista** (*list*).',
    { type: 'analogy', text: 'una lista es como un tren. Cada vagón lleva un dato. Los vagones van siempre en el mismo orden.' },
    'Escribes una lista con corchetes `[ ]`. Separas los datos con comas.',
    '```python\ntomas = ["sh010", "sh020", "sh030"]\n```',
    '### El índice: el número de cada vagón',
    'Cada vagón tiene un número: el **índice** (*index*). Con el índice sacas un dato de la lista.',
    '¡Ojo! El primer vagón es el **0**, no el 1. Python empieza a contar desde cero.',
    { type: 'figure', html:
      '<svg viewBox="0 0 330 112" role="img" aria-label="Un tren de tres vagones con índices 0, 1 y 2, y también -3, -2 y -1">' +
      '<g font-family="ui-monospace,Menlo,monospace" font-size="13">' +
      '<rect x="8" y="30" width="96" height="44" rx="8" style="fill:var(--accbg);stroke:var(--acc)"/><text x="56" y="57" text-anchor="middle" style="fill:var(--ink)">"sh010"</text>' +
      '<rect x="117" y="30" width="96" height="44" rx="8" style="fill:var(--accbg);stroke:var(--acc)"/><text x="165" y="57" text-anchor="middle" style="fill:var(--ink)">"sh020"</text>' +
      '<rect x="226" y="30" width="96" height="44" rx="8" style="fill:var(--accbg);stroke:var(--acc)"/><text x="274" y="57" text-anchor="middle" style="fill:var(--ink)">"sh030"</text>' +
      '<line x1="104" y1="52" x2="117" y2="52" style="stroke:var(--acc);stroke-width:3"/><line x1="213" y1="52" x2="226" y2="52" style="stroke:var(--acc);stroke-width:3"/>' +
      '<text x="56" y="20" text-anchor="middle" font-weight="700" style="fill:var(--acc)">[0]</text><text x="165" y="20" text-anchor="middle" font-weight="700" style="fill:var(--acc)">[1]</text><text x="274" y="20" text-anchor="middle" font-weight="700" style="fill:var(--acc)">[2]</text>' +
      '<text x="56" y="96" text-anchor="middle" style="fill:var(--mute)">[-3]</text><text x="165" y="96" text-anchor="middle" style="fill:var(--mute)">[-2]</text><text x="274" y="96" text-anchor="middle" style="fill:var(--mute)">[-1]</text>' +
      '</g></svg>' },
    'Con un índice **negativo** cuentas desde el final. `-1` siempre es el último vagón, aunque no sepas cuántos hay.',
    '### Tres herramientas útiles',
    '- `len(lista)`: cuenta cuántos datos hay (*length*, longitud).\n- `lista.append(dato)`: engancha un vagón nuevo al final.\n- `dato in lista`: pregunta si el dato está en la lista. Da `True` o `False`.',
    { type: 'cg', text: 'una herramienta de TA recibe la lista de tomas de una secuencia y las exporta una por una, en orden. Si llega una toma nueva, se añade con `append()`.' }
  ],

  example: {
    intro: 'Vamos a manejar la lista de tomas de una secuencia.',
    lines: [
      { code: 'tomas = ["sh010", "sh020", "sh030"]', note: 'Creamos una lista con tres textos. Van entre `[ ]` y separados por comas.' },
      { code: 'primera = tomas[0]', note: 'El índice `0` es el primer vagón: `"sh010"`.' },
      { code: 'ultima = tomas[-1]', note: 'El índice `-1` es el último vagón: `"sh030"`.' },
      { code: 'tomas.append("sh040")', note: 'Añadimos una toma nueva al final. Ahora hay cuatro.' },
      { code: 'total = len(tomas)', note: '`len()` cuenta los datos: `4`.' },
      { code: 'print(primera, ultima, total)', note: 'Mostramos los tres resultados.' },
      { code: 'print("sh020" in tomas)', note: '¿Está "sh020" en la lista? Sí, así que muestra `True`.' }
    ],
    output: 'sh010 sh030 4\nTrue',
    outro: 'Fíjate: `ultima` vale `"sh030"` porque la guardamos **antes** de añadir `"sh040"`. Python ejecuta las líneas en orden, de arriba abajo.'
  },

  mini: [
    {
      q: 'Si `tomas = ["sh010", "sh020", "sh030"]`, ¿qué es `tomas[1]`?',
      options: ['`"sh010"`', '`"sh020"`', '`"sh030"`'],
      answer: 1,
      why: 'Python cuenta desde 0. El índice 0 es "sh010", y el índice 1 es "sh020".'
    },
    {
      q: '¿Qué hace `tomas.append("sh040")`?',
      options: ['Añade "sh040" al principio', 'Añade "sh040" al final', 'Borra "sh040" de la lista'],
      answer: 1,
      why: '`append()` siempre engancha el dato nuevo al final, como un vagón más.'
    }
  ],

  exercises: [
    {
      id: 'e1',
      title: 'La lista de cámaras',
      prompt: 'Crea una lista `camaras` con estos tres textos, en este orden: `"cam_A"`, `"cam_B"`, `"cam_C"`.\n\nLuego crea `primera` con la primera cámara y `ultima` con la última. Usa índices.',
      starter: '# Escribe tu código aquí\n',
      tests: [
        { check: "camaras == ['cam_A', 'cam_B', 'cam_C']", msg: '`camaras` tiene las tres cámaras en orden' },
        { check: "primera == 'cam_A'", msg: '`primera` es "cam_A"' },
        { check: "ultima == 'cam_C'", msg: '`ultima` es "cam_C"' }
      ],
      hints: ['La lista va entre corchetes: `["cam_A", "cam_B", "cam_C"]`.', 'La primera es el índice `0`. La última puede ser `-1`.'],
      solution: 'camaras = ["cam_A", "cam_B", "cam_C"]\nprimera = camaras[0]\nultima = camaras[-1]\n'
    },
    {
      id: 'e2',
      title: 'Llega una cámara nueva',
      prompt: 'Añade `"cam_D"` al final de la lista con `append()`.\n\nDespués crea `total` con el número de cámaras.',
      starter: 'camaras = ["cam_A", "cam_B", "cam_C"]\n\n',
      tests: [
        { check: "camaras[-1] == 'cam_D'", msg: '"cam_D" está al final de la lista' },
        { check: 'total == 4', msg: '`total` vale 4' }
      ],
      hints: ['`camaras.append("cam_D")`', 'Para contar, usa `len(camaras)`.'],
      solution: 'camaras = ["cam_A", "cam_B", "cam_C"]\n\ncamaras.append("cam_D")\ntotal = len(camaras)\n'
    },
    {
      id: 'e3',
      title: '¿Está esta cámara?',
      prompt: 'Antes de exportar, una herramienta comprueba si una cámara existe.\n\nCrea `hay_b` con el resultado de preguntar si `"cam_B"` está en la lista. Crea también `hay_z` para `"cam_Z"`.',
      starter: 'camaras = ["cam_A", "cam_B", "cam_C"]\n\n',
      tests: [
        { check: 'hay_b is True', msg: '`hay_b` es `True`' },
        { check: 'hay_z is False', msg: '`hay_z` es `False`' }
      ],
      hints: ['Usa la palabra `in`: `"cam_B" in camaras`.', '`hay_z = "cam_Z" in camaras`'],
      solution: 'camaras = ["cam_A", "cam_B", "cam_C"]\n\nhay_b = "cam_B" in camaras\nhay_z = "cam_Z" in camaras\n'
    }
  ],

  summary: [
    'Una **lista** guarda muchos datos en orden: `[a, b, c]`.',
    'El **índice** empieza en 0. El `-1` es el último.',
    '`len()` cuenta, `append()` añade al final e `in` pregunta si un dato está.'
  ]
});
