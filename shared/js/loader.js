/*
  loader.js - loads the language files listed in config.js (languages), then starts the program.
  This is why index.html needs no <script> line for a language.

  Each name in the list is a lesson file in the lesson/ folder, without ".js" ("fr" loads lesson/fr.js). A lesson
  file says which keyboard (keyboards/<code>.js) and which wording (ui/<name>.js) it uses, so those are loaded in
  a second step, then core.js joins them into languages (TT.buildLanguages) and js/app.js runs. A file that is
  missing or broken is skipped (with a note in the browser console); if no language can be built a message is
  shown instead of the lesson.
*/
(function () {
  "use strict";

  function addScript(src, done) {
    var tag = document.createElement("script");
    tag.src = src;
    tag.async = false;                                   // run in the order they were added
    tag.onload = function () { done(true); };
    tag.onerror = function () { done(false); };
    document.body.appendChild(tag);
  }

  // Load every file in the list, then call done()
  function loadAll(files, done) {
    var waiting = files.length;
    if (!waiting) { done(); return; }
    files.forEach(function (file) {
      addScript(file, function (ok) {
        if (!ok) { console.warn("Could not load " + file); }
        waiting--;
        if (waiting === 0) { done(); }
      });
    });
  }

  var names = (TT.config.languages && TT.config.languages.length) ? TT.config.languages : [TT.config.language];

  // Step 1: the lesson files. Step 2: the keyboards and wording they ask for. Step 3: join them and start.
  loadAll(names.map(function (n) { return "lesson/" + n + ".js"; }), function () {
    var needed = [], seen = {};
    function want(path) { if (!seen[path]) { seen[path] = true; needed.push(path); } }
    Object.keys(TT.lessons).forEach(function (code) {
      want("keyboards/" + code + ".js");
      want("ui/" + TT.lessons[code].ui + ".js");
    });
    loadAll(needed, function () {
      TT.buildLanguages();
      if (Object.keys(TT.languages).length === 0) {
        document.getElementById("appTitle").textContent = "No language could be loaded. Check the languages list in config.js.";
        return;
      }
      addScript("js/app.js", function (loaded) {
        if (!loaded) { document.getElementById("appTitle").textContent = "The program file js/app.js could not be loaded."; }
      });
    });
  });
})();
