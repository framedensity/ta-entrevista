// Registro global del contenido. Cada lección llama a TA.add({...}).
window.TA = {
  curriculum: [],
  lessons: {},
  add: function (lesson) { this.lessons[lesson.id] = lesson; }
};
