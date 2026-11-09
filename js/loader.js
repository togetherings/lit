/*
  loader.js - finds this zip's lesson and the learner's language, loads the keyboard and the lesson for them,
  then starts the program (js/app.js).

  The EduGame Kit's helper (edugame.js) does the choosing:
    - which lesson: EduGame.config.package.config.lesson ("01"), set per package in edugame.json
    - which language: the learner's choice in Options, then Kolibri's, the browser's, the default
  and the loading: EduGame.loadLanguage("lessons/01", {merge: false}) gives the nearest edition of the lesson
  (fr-CA, then fr, then the default language's), and the same for keyboards/.
  TT.load(code) is also what app.js calls when the learner picks another language in Options.
*/
(function () {
  "use strict";

  var pkg = (EduGame.config.package && EduGame.config.package.config) || {};
  TT.lessonNumber = pkg.lesson || "01";
  // The lesson's own settings (edugame.json, packages[].config.settings) go over the defaults in config.js
  Object.keys(pkg.settings || {}).forEach(function (k) { TT.config[k] = pkg.settings[k]; });

  // Load the keyboard and lesson for a language. done(lang) gets the joined language, or null.
  TT.load = function (code, done) {
    var opts = { merge: false, language: code };
    Promise.all([EduGame.loadLanguage("keyboards", opts), EduGame.loadLanguage("lessons/" + TT.lessonNumber, opts)])
      .then(function (files) {
        if (!files[0] || !files[1]) { done(null); return; }
        done(TT.makeLanguage(files[0], files[1], code));
      }, function () { done(null); });
  };

  function fail(text) {
    var p = document.createElement("p");
    p.className = "load-error";
    p.textContent = text;
    document.querySelector("main").appendChild(p);
  }

  EduGame.ready().then(function () {
    TT.load(EduGame.language(), function (lang) {
      if (!lang) { fail("The lesson " + TT.lessonNumber + " or its keyboard could not be loaded."); return; }
      TT.firstLanguage = lang;
      var tag = document.createElement("script");
      tag.src = "js/app.js";
      tag.onerror = function () { fail("The program file js/app.js could not be loaded."); };
      document.body.appendChild(tag);
    });
  });
})();
