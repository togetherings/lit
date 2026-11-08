/*
  progress.js - the learner's best result in this lesson, kept by the EduGame Kit's helper (edugame.js).

  Each lesson edition has its own scoreboard ("board"): its id, like "en-01" or "fr-01" (lessons/NN/<language>.json).
  For each board the helper keeps the BEST passed attempt: the highest accuracy, then the highest speed
  (edugame.json: scoring). It saves it with the learner: in Kolibri (SCORM suspend_data), on the Kolibri Games
  games page, or in this browser. Kolibri Games shows scoreboards from it.

  WHAT IS SENT TO KOLIBRI (and what is deliberately NOT): when an attempt reaches the pass marks (config.js), the
  status "passed". NO SCORE IS EVER SENT: Kolibri reads a SCORM score as "percent completed", so it would not mark
  the lesson done unless accuracy reached 100%. The helper takes care of this.
*/
TT.progress = (function () {
  var board = "";
  var results = {};                 // board -> {acc, wpm, plays}, from the helper

  function get() {
    var r = results[board];
    return r ? { done: 1, acc: r.acc, wpm: r.wpm } : { done: 0, acc: 0, wpm: 0 };
  }

  function init(id) {
    board = id;
    return EduGame.ready().then(function (info) { results = info.results || {}; });
  }

  // An attempt begins (the helper times it) ...
  function start() { return EduGame.start({ board: board }); }

  // ... and ends. Only a PASSED attempt can become the kept best.
  function record(accuracy, wpm, passed) {
    return EduGame.finish({ acc: accuracy, wpm: wpm }, { board: board, passed: passed }).then(function (r) {
      if (r.kept) { results[board] = r.kept; }
      return r;
    }, function (err) { console.warn("LIT: the result could not be saved: " + (err && err.message)); });
  }

  // The learner left an attempt unfinished
  function abandon() { return EduGame.abandon(); }

  // Another language (Options): another edition, so another board
  function setLesson(id) { board = id; }

  return { init: init, get: get, start: start, record: record, abandon: abandon, setLesson: setLesson };
})();
