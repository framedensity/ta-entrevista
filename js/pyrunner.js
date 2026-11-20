// Ejecuta Python en el navegador con Pyodide y corrige con casos de prueba.
// Pyodide se descarga solo la primera vez que se pulsa "Ejecutar".
// Cada ejecución empieza en una carpeta limpia (/home/pyodide/ta_trabajo) y con la escena de Maya vacía.
window.PyRunner = (function () {
  var BASE = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/';
  var promise = null;

  var HARNESS = [
    'import sys, io, json, traceback, os, shutil, logging, types',
    '_TA_HOME = "/home/pyodide"',
    '_TA_BASE = _TA_HOME + "/ta_trabajo"',
    'def _ta_reset():',
    '    os.makedirs(_TA_HOME, exist_ok=True)',
    '    os.chdir(_TA_HOME)',
    '    shutil.rmtree(_TA_BASE, ignore_errors=True)',
    '    os.makedirs(_TA_BASE)',
    '    os.chdir(_TA_BASE)',
    '    root = logging.getLogger()',
    '    for h in list(root.handlers):',
    '        root.removeHandler(h)',
    '    root.setLevel(logging.WARNING)',
    '    for name in list(logging.Logger.manager.loggerDict):',
    '        lg = logging.getLogger(name)',
    '        for h in list(lg.handlers):',
    '            lg.removeHandler(h)',
    '        lg.setLevel(logging.NOTSET)',
    '        lg.propagate = True',
    '    if "maya.cmds" in sys.modules:',
    '        sys.modules["maya.cmds"]._reset()',
    'def _ta_run(user_code, tests_json, setup):',
    '    tests = json.loads(tests_json)',
    '    _ta_reset()',
    '    ns = {"__name__": "__main__"}',
    '    out, errb = io.StringIO(), io.StringIO()',
    '    old_o, old_e = sys.stdout, sys.stderr',
    '    err = None',
    '    try:',
    '        sys.stdout, sys.stderr = out, errb',
    '        if setup:',
    '            exec(compile(setup, "<preparacion>", "exec"), ns)',
    '        exec(compile(user_code, "<tu codigo>", "exec"), ns)',
    '    except SyntaxError as e:',
    '        err = "SyntaxError (línea %s): %s" % (e.lineno, e.msg)',
    '    except Exception as e:',
    '        line = None',
    '        for fr in traceback.extract_tb(e.__traceback__):',
    '            if fr.filename == "<tu codigo>":',
    '                line = fr.lineno',
    '        err = "%s: %s" % (type(e).__name__, e)',
    '        if line:',
    '            err += "  (línea %d)" % line',
    '    finally:',
    '        sys.stdout, sys.stderr = old_o, old_e',
    '    results = []',
    '    if err is None:',
    '        for t in tests:',
    '            env = dict(ns)',
    '            env["_out"] = out.getvalue()',
    '            env["_log"] = errb.getvalue()',
    '            env["_codigo"] = user_code',
    '            try:',
    '                sys.stdout, sys.stderr = io.StringIO(), io.StringIO()',
    '                ok = bool(eval(t["check"], env))',
    '            except Exception:',
    '                ok = False',
    '            finally:',
    '                sys.stdout, sys.stderr = old_o, old_e',
    '            results.append({"ok": ok, "msg": t["msg"]})',
    '    return json.dumps({"out": out.getvalue() + errb.getvalue(), "err": err, "results": results})',
    'def _ta_install_maya(src):',
    '    maya = types.ModuleType("maya")',
    '    cmds = types.ModuleType("maya.cmds")',
    '    exec(src, cmds.__dict__)',
    '    maya.cmds = cmds',
    '    sys.modules["maya"] = maya',
    '    sys.modules["maya.cmds"] = cmds',
    '    cmds._reset()'
  ].join('\n');

  function load() {
    if (promise) return promise;
    promise = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = BASE + 'pyodide.js';
      s.onload = function () {
        window.loadPyodide({ indexURL: BASE }).then(function (py) {
          py.runPython(HARNESS);
          if (window.TA_MAYA_MOCK) {
            py.globals.set('_ta_mock_src', window.TA_MAYA_MOCK);
            py.runPython('_ta_install_maya(_ta_mock_src)');
          }
          resolve(py);
        }).catch(function (e) { promise = null; reject(e); });
      };
      s.onerror = function () { promise = null; reject(new Error('No se pudo cargar Python. Revisa la conexión a internet.')); };
      document.head.appendChild(s);
    });
    return promise;
  }

  function run(code, tests, setup) {
    return load().then(function (py) {
      py.globals.set('_ta_code', code);
      py.globals.set('_ta_tests', JSON.stringify(tests || []));
      py.globals.set('_ta_setup', setup || '');
      return JSON.parse(py.runPython('_ta_run(_ta_code, _ta_tests, _ta_setup)'));
    });
  }

  return { load: load, run: run };
})();
