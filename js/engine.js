/*
  engine.js - the typing logic. It knows nothing about the screen, which keeps it
  simple to test and to reuse. app.js asks it questions and draws the answers.
*/

// Pick "count" different sentences at random from the pool (the pool is not changed).
// If the pool has fewer than "count", all of them are used.
TT.pickRandom = function (pool, count) {
  var copy = pool.slice();
  for (var i = copy.length - 1; i > 0; i--) {            // shuffle (Fisher-Yates)
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = copy[i]; copy[i] = copy[j]; copy[j] = tmp;
  }
  return copy.slice(0, count);
};

// Choose the sentences for one attempt from the lesson's lists (up to four). All of list 1's picks come
// first, then list 2's, and so on. A list that is empty, or whose count is 0, adds nothing.
// Returns { sentences: [text, ...], listNames: [name of each sentence's list, ...] } (same order).
TT.buildAttempt = function (lists) {
  var sentences = [], listNames = [];
  (lists || []).forEach(function (list) {
    var pool = list.sentences || [], count = Math.max(0, Math.floor(+list.count || 0));
    if (!pool.length || count === 0) { return; }
    TT.pickRandom(pool, count).forEach(function (text) { sentences.push(text); listNames.push(list.name || ""); });
  });
  return { sentences: sentences, listNames: listNames };
};

// A "session" is one attempt at the lesson.
// options.allowBackspace    Backspace undoes the last character. Accuracy is then judged on the FINAL
//                           text: a mistake that has been fixed does not count against accuracy.
// options.requireCorrect    a sentence does not advance until every character is correct (the learner
//                           must Backspace and fix mistakes). Needs allowBackspace.
TT.createSession = function (sentences, options) {
  options = options || {};

  var session = {
    sentences: sentences,
    sentenceIndex: 0,          // which sentence we are on
    pos: 0,                    // which character of that sentence is next
    status: sentences.map(function (s) { return new Array(s.length); }), // "ok" | "bad" | undefined
    keystrokes: 0,             // keys pressed that count
    correctKeys: 0,
    errors: 0,
    startTime: null,           // set on the first key, so reading time is not counted
    pausedMs: 0,               // time spent in the pauses between sentences (not counted)
    endTime: null,
    finished: false,
    allowBackspace: !!options.allowBackspace,
    requireCorrect: !!options.requireCorrect && !!options.allowBackspace
  };

  // Handle one typed character. "now" is a timestamp in milliseconds.
  session.type = function (ch, now) {
    if (session.finished) { return false; }
    // End of the sentence reached with mistakes left in it: ignore typing until Backspace fixes them.
    if (session.pos >= session.sentences[session.sentenceIndex].length) { return false; }
    if (session.startTime === null) { session.startTime = now; }

    var expected = session.sentences[session.sentenceIndex].charAt(session.pos);
    var right = (ch === expected);

    session.keystrokes++;
    if (right) { session.correctKeys++; } else { session.errors++; }
    session.status[session.sentenceIndex][session.pos] = right ? "ok" : "bad";
    session.pos++;

    // End of sentence: move on straight away to the next one (no Enter key needed).
    if (session.pos >= session.sentences[session.sentenceIndex].length) {
      // "Fix every mistake" mode: stay here until the whole sentence is correct (the timer keeps running).
      if (session.requireCorrect && session.status[session.sentenceIndex].indexOf("bad") >= 0) { return right; }
      session.sentenceIndex++;
      session.pos = 0;
      if (session.sentenceIndex >= session.sentences.length) {
        session.finished = true;
        session.endTime = now;
      }
    }
    return right;
  };

  // Backspace: only works if the lesson allows it. A mistake stays counted as a
  // mistake even after it is corrected, so accuracy stays honest.
  session.backspace = function () {
    if (!session.allowBackspace || session.finished || session.pos === 0) { return false; }
    session.pos--;
    var was = session.status[session.sentenceIndex][session.pos];
    session.status[session.sentenceIndex][session.pos] = undefined;
    if (was === "ok") { session.correctKeys--; session.keystrokes--; }
    return true;
  };

  // The character the learner should type next ("" when finished).
  session.expectedChar = function () {
    return session.finished ? "" : session.sentences[session.sentenceIndex].charAt(session.pos);
  };

  // The app calls this after each pause between sentences, so pauses do not count as typing time.
  session.addPause = function (ms) { session.pausedMs += ms; };

  // Typing time so far in milliseconds: from the first key to the last key, minus the pauses.
  // This one number drives both the on-screen timer and the words-per-minute score.
  session.elapsedMs = function (now) {
    if (session.startTime === null) { return 0; }
    var end = session.endTime !== null ? session.endTime : now;
    return Math.max(0, end - session.startTime - session.pausedMs);
  };

  // Accuracy (whole %) and speed (words per minute, one decimal).
  // One "word" is 5 characters, and only correct characters count towards speed.
  session.stats = function (now) {
    var minutes = session.elapsedMs(now) / 60000;
    var acc = session.keystrokes ? 100 * session.correctKeys / session.keystrokes : 100;
    if (session.allowBackspace) {                      // Backspace allowed: judged on the final text, so fixed mistakes do not count
      var total = 0, bad = 0;
      session.sentences.forEach(function (s, i) { total += s.length; bad += session.status[i].filter(function (m) { return m === "bad"; }).length; });
      acc = total ? 100 * (total - bad) / total : 100;
    }
    var wpm = minutes > 0 ? (session.correctKeys / 5) / minutes : 0;
    return { accuracy: Math.round(acc), wpm: Math.round(wpm * 10) / 10 };
  };

  return session;
};
