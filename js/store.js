// Progreso en localStorage. Si el navegador no deja guardar, la web sigue funcionando.
window.Store = (function () {
  var KEY = 'ta-entrevista-v1';
  var data = { done: {}, solved: {}, step: {}, mistakes: {}, free: false };
  try {
    var raw = localStorage.getItem(KEY);
    if (raw) { var o = JSON.parse(raw); for (var k in data) if (o[k] !== undefined) data[k] = o[k]; }
  } catch (e) {}
  function save() { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {} }

  return {
    isDone: function (id) { return !!data.done[id]; },
    setDone: function (id) { data.done[id] = Date.now(); save(); },
    isSolved: function (key) { return !!data.solved[key]; },
    setSolved: function (key) { data.solved[key] = true; save(); },
    getStep: function (id) { return data.step[id] || 0; },
    setStep: function (id, n) { data.step[id] = n; save(); },
    addMistake: function (key, info) { if (!data.mistakes[key]) { data.mistakes[key] = info; save(); } },
    clearMistake: function (key) { if (data.mistakes[key]) { delete data.mistakes[key]; save(); } },
    mistakes: function () { return data.mistakes; },
    free: function () { return !!data.free; },
    setFree: function (v) { data.free = !!v; save(); },
    reset: function () { data = { done: {}, solved: {}, step: {}, mistakes: {}, free: false }; save(); }
  };
})();
