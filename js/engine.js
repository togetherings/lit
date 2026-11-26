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

// A "session" is one attempt at the lesson. Every key typed for a sentence is kept, and after each key the
// typing is lined up with the sentence (align.js): a missed letter, an extra key, a wrong key or a swapped
// pair is ONE mistake, and the letters typed after it still count as right.
// options.allowBackspace    Backspace takes back the last key. Accuracy is judged on what is left, so a
//                           mistake that has been fixed does not count.
// options.requireCorrect    a sentence does not end until it is typed exactly right (the learner must Backspace
//                           and fix mistakes). Needs allowBackspace.
TT.createSession = function (sentences, options) {
  options = options || {};

  var session = {
    sentences: sentences,
    sentenceIndex: 0,          // which sentence we are on
    pos: 0,                    // how far through it the typing has reached (where the cursor is)
    typed: sentences.map(function () { return ""; }),     // the keys typed for each sentence
    aligned: sentences.map(function () { return null; }), // TT.align() of each sentence's typing
    keystrokes: 0,             // keys pressed
    wrongKeys: {},             // letter -> how often it went wrong (typed wrong, missed or swapped), for practice
    startTime: null,           // set on the first key, so reading time is not counted
    pausedMs: 0,               // time spent in the pauses between sentences (not counted)
    endTime: null,
    finished: false,
    allowBackspace: !!options.allowBackspace,
    requireCorrect: !!options.requireCorrect && !!options.allowBackspace
  };

  function realign() {
    var k = session.sentenceIndex, a = TT.align(session.sentences[k], session.typed[k]);
    session.aligned[k] = a;
    session.pos = a.at;
    return a;
  }

  // Handle one typed character. "now" is a timestamp in milliseconds. Returns true if it was the key expected.
  session.type = function (ch, now) {
    if (session.finished) { return false; }
    var k = session.sentenceIndex, sentence = session.sentences[k];
    // "Fix every mistake" mode, end of the sentence reached with mistakes left in it: only Backspace helps now.
    if (session.requireCorrect && session.pos >= sentence.length) { return false; }
    if (session.startTime === null) { session.startTime = now; }
    var expected = sentence.charAt(session.pos);
    session.typed[k] += ch;
    session.keystrokes++;
    var a = realign();

    // The sentence ends when the typing reaches its last letter (no Enter key needed).
    if (a.at >= sentence.length && !(session.requireCorrect && a.mistakes > 0)) {
      a.marks.forEach(function (mark, i) {
        if (!mark.ok) { var c = sentence.charAt(i); session.wrongKeys[c] = (session.wrongKeys[c] || 0) + 1; }
      });
      session.sentenceIndex++;
      session.pos = 0;
      if (session.sentenceIndex >= session.sentences.length) {
        session.finished = true;
        session.endTime = now;
      }
    }
    return ch === expected;
  };

  // Backspace: only works if the lesson allows it. It takes back the last key typed in this sentence.
  session.backspace = function () {
    var k = session.sentenceIndex;
    if (!session.allowBackspace || session.finished || !session.typed[k]) { return false; }
    session.typed[k] = session.typed[k].slice(0, -1);
    realign();
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

  // Accuracy (whole %): (letters - mistakes) / letters, over the sentences typed so far.
  // Speed (words per minute, one decimal): one "word" is 5 characters, and only letters typed right count.
  // count: the mistakes of each kind; wrongKeys: which letters went wrong, and how often.
  session.stats = function (now) {
    var letters = 0, mistakes = 0, correct = 0, count = { wrong: 0, missed: 0, extra: 0, swapped: 0 };
    session.aligned.forEach(function (a, i) {
      if (!a) { return; }
      letters += session.sentences[i].length;
      mistakes += a.mistakes;
      correct += a.correct;
      Object.keys(count).forEach(function (c) { count[c] += a.count[c]; });
    });
    var acc = letters ? Math.max(0, 100 * (letters - mistakes) / letters) : 100;
    var minutes = session.elapsedMs(now) / 60000;
    var wpm = minutes > 0 ? (correct / 5) / minutes : 0;
    return { accuracy: Math.round(acc), wpm: Math.round(wpm * 10) / 10, count: count, wrongKeys: session.wrongKeys };
  };

  return session;
};
