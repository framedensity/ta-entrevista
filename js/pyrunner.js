// Ejecuta Python en el navegador con Pyodide y corrige con casos de prueba.
// Pyodide se descarga solo la primera vez que se pulsa "Ejecutar".
window.PyRunner = (function () {
  var BASE = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/';
  var promise = null;

  var HARNESS = [
    'import sys, io, json, traceback',
    'def _ta_run(user_code, tests_json):',
    '    tests = json.loads(tests_json)',
    '    ns = {"__name__": "__main__"}',
    '    buf = io.StringIO()',
    '    old = sys.stdout',
    '    sys.stdout = buf',
    '    err = None',
    '    try:',
    '        exec(user_code, ns)',
    '    except Exception as e:',
    '        err = "".join(traceback.format_exception_only(type(e), e)).strip()',
    '    finally:',
    '        sys.stdout = old',
    '    out = buf.getvalue()',
    '    results = []',
    '    if err is None:',
    '        for t in tests:',
    '            env = dict(ns)',
    '            env["_out"] = out',
    '            try:',
    '                ok = bool(eval(t["check"], env))',
    '            except Exception:',
    '                ok = False',
    '            results.append({"ok": ok, "msg": t["msg"]})',
    '    return json.dumps({"out": out, "err": err, "results": results})'
  ].join('\n');

  function load() {
    if (promise) return promise;
    promise = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = BASE + 'pyodide.js';
      s.onload = function () {
        window.loadPyodide({ indexURL: BASE }).then(function (py) {
          py.runPython(HARNESS);
          resolve(py);
        }).catch(reject);
      };
      s.onerror = function () { promise = null; reject(new Error('No se pudo cargar Python. Revisa la conexión a internet.')); };
      document.head.appendChild(s);
    });
    return promise;
  }

  function run(code, tests) {
    return load().then(function (py) {
      py.globals.set('_ta_code', code);
      py.globals.set('_ta_tests', JSON.stringify(tests || []));
      return JSON.parse(py.runPython('_ta_run(_ta_code, _ta_tests)'));
    });
  }

  return { load: load, run: run };
})();
