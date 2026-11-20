// Global content registry. Every lesson calls TA.add({...}).
window.TA = {
  curriculum: [],
  lessons: {},
  add: function (lesson) { this.lessons[lesson.id] = lesson; }
};
