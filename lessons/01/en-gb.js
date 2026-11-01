/*
  lessons/01/en-gb.js - Lesson 1 for the UK keyboard. The lesson is exactly the same as lessons/01/en.js, so this
  file just says "use that one": change the English lesson once and both keyboards follow.
*/
(function () {
  TT.addLesson({
    keyboard: "en-gb",     // keyboards/en-gb.js
    ui: "en",              // ui/en.js
    lessonFrom: "en"       // copy the lesson (keys, advice, sentences) from lessons/01/en.js
  });
})();
