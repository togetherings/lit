/*
  progress.js - remembers whether this lesson is passed, and reports to Kolibri.

  For the lesson we keep:  done (0/1), acc (accuracy %), wpm (speed) of the BEST passed attempt.
  The data is saved in two places, and the better result is used:
    1. SCORM 1.2 "suspend_data"  - follows the learner when run inside Kolibri.
    2. localStorage              - fallback for the same browser / local testing.
  Either one may be missing or blocked, so every call is wrapped in try/catch and
  the lesson still works without them.

  WHAT IS SENT TO KOLIBRI (and what is deliberately NOT):
    - When the pass marks (config.js) are reached, the status "passed" is sent.
      It must be "passed": Kolibri currently ignores "completed" (a Kolibri bug).
    - NO SCORE IS EVER SENT. Kolibri reads a SCORM score as "percent completed", so it would not
      mark the lesson done unless accuracy reached 100%. Accuracy and speed are kept only in the
      saved data above, for the "best result" message on Page 2.

  The SCORM connection is retried every time we save, because Kolibri may add its
  SCORM object to the page after our scripts have already loaded.
*/
TT.progress = (function () {
  var STORE_KEY = "tt_progress";  // do not change: it would hide saved progress
  var PASS_STATUS = "passed";     // do not change to "completed" (see above)
  var lessonId = "";
  var data = {};                  // { lessonId: {done, acc, wpm} }  (keyed by id so modules never clash)
  var api = null, lmsOpen = false, startedAt = Date.now();

  // ---------- small helpers ----------
  function blank() { return { done: 0, acc: 0, wpm: 0 }; }
  function norm(v) { v = v || {}; return { done: v.done ? 1 : 0, acc: +v.acc || 0, wpm: +v.wpm || 0 }; }
  function ok(r) { return String(r) === "true"; }

  // Is result "a" better than result "b"?  A passed result beats an unpassed one;
  // then higher accuracy wins; if accuracy is equal, higher speed wins.
  function better(a, b) {
    if (a.done !== b.done) { return a.done > b.done; }
    if (a.acc !== b.acc) { return a.acc > b.acc; }
    return a.wpm > b.wpm;
  }

  // Combine two saved copies, keeping the better result for each lesson. The accuracy and
  // speed always come from the SAME attempt (the best passed one).
  function merge(a, b) {
    var out = {};
    [a, b].forEach(function (src) {
      Object.keys(src || {}).forEach(function (id) {
        var n = norm(src[id]), m = out[id] || blank();
        out[id] = better(n, m) ? n : m;
      });
    });
    return out;
  }

  // ---------- localStorage ----------
  function readLocal() { try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch (e) { return {}; } }
  function writeLocal() { try { localStorage.setItem(STORE_KEY, JSON.stringify(data)); } catch (e) {} }

  // ---------- SCORM 1.2 ----------
  // Standard search: this window, then each parent window above it (some are blocked, hence try/catch).
  function findApi() {
    var w = window;
    for (var i = 0; i < 6; i++) {
      try { if (w.API) { return w.API; } } catch (e) {}
      try { if (w.parent && w.parent !== w) { w = w.parent; } else { break; } } catch (e) { break; }
    }
    return null;
  }
  function lmsSet(k, v) { try { return ok(api.LMSSetValue(k, String(v))); } catch (e) { return false; } }
  function lmsGet(k) { try { return String(api.LMSGetValue(k)); } catch (e) { return ""; } }
  function lmsCommit() { try { return ok(api.LMSCommit("")); } catch (e) { return false; } }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function hms(ms) { var s = Math.floor(ms / 1000); return pad(Math.floor(s / 3600)) + ":" + pad(Math.floor(s / 60) % 60) + ":" + pad(s % 60); }

  function readLms() {
    try { var o = JSON.parse(lmsGet("cmi.suspend_data")); return (o && typeof o === "object") ? o : {}; } catch (e) { return {}; }
  }

  // Find the SCORM object and start the session (once). Safe to call many times.
  function connect() {
    if (lmsOpen) { return true; }
    api = findApi();
    if (!api) { return false; }
    try { api.LMSInitialize(""); } catch (e) {}
    lmsOpen = true;   // even if Initialize said false (e.g. "already initialised"), we still try to write

    var st = lmsGet("cmi.core.lesson_status");
    if (st !== "completed" && st !== "passed") { lmsSet("cmi.core.lesson_status", "incomplete"); lmsCommit(); }
    data = merge(data, readLms());      // pick up progress saved on another device
    return true;
  }

  function writeLms() {
    if (!connect()) { return; }

    // 1. The pass status goes first, on its own, and is committed straight away.
    if (get().done) {
      lmsSet("cmi.core.lesson_status", PASS_STATUS);
      lmsCommit();
    }

    // 2. Then the saved details. (No score is sent - see the notes at the top of this file.)
    var str = JSON.stringify(data);
    if (str.length <= 4000) { lmsSet("cmi.suspend_data", str); }   // SCORM 1.2 limit is 4096 characters
    lmsSet("cmi.core.session_time", hms(Date.now() - startedAt));
    lmsCommit();
  }

  // ---------- public functions ----------
  function get() { return norm(data[lessonId]); }

  function init(id) {
    lessonId = id;
    data = readLocal();
    connect();                          // may merge saved data from Kolibri
    window.addEventListener("pagehide", close);
    window.addEventListener("beforeunload", close);
  }

  // Call at the end of every attempt. Only a PASSED attempt can become the saved best, and it
  // replaces the old best only if it is better (accuracy first, then speed).
  // "done" never goes back to 0.
  function record(accuracy, wpm, passed) {
    var cur = get();
    if (passed) {
      var candidate = { done: 1, acc: accuracy, wpm: wpm };
      data[lessonId] = better(candidate, cur) ? candidate : cur;
    }
    writeLocal();
    writeLms();
  }

  function close() {
    if (!lmsOpen) { return; }
    lmsOpen = false;
    lmsSet("cmi.core.session_time", hms(Date.now() - startedAt));
    lmsCommit();
    try { api.LMSFinish(""); } catch (e) {}
  }

  // Switch to another lesson (the language was changed on the Options page). The SCORM connection stays as it is.
  function setLesson(id) { lessonId = id; }

  return { init: init, get: get, record: record, setLesson: setLesson };
})();
