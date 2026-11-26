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
// Returns { sentences: [text, ...], listNames: [name of each sentence's list, ...], lists: [its list, ...] }
// (same order).
TT.buildAttempt = function (lists) {
  var sentences = [], listNames = [], from = [];
  (lists || []).forEach(function (list) {
    var pool = list.sentences || [], count = Math.max(0, Math.floor(+list.count || 0));
    if (!pool.length || count === 0) { return; }
    TT.pickRandom(pool, count).forEach(function (text) { sentences.push(text); listNames.push(list.name || ""); from.push(list); });
  });
  return { sentences: sentences, listNames: listNames, lists: from };
};

// PLANNED CHANGES (the Backspace lesson). A sentence can hold words to type and then change, written
// {typed>fixed}: "The cat {sad>sat} on the {met>mat}." The learner types "The cat sad", deletes back to what the
// two words share ("sa"), types the rest ("t"), and so on. TT.parseChanges gives
//   text     the sentence as it ends up ("The cat sat on the mat.")
//   changes  [{at, from, to, keep}]: where the word starts in text, the two words, and how many letters they share
//            from the start (a change at the end of a word keeps all but the last letter; at the start, none)
//   stages   the steps, in order: {kind: "type", target} (type until the typing is exactly target), then for a
//            change {kind: "delete", target, change} (Backspace until the typing is target), ... and lastly
//            {kind: "type", target: text}
// A sentence without {..>..} has no changes and one stage.
TT.CHANGE_RE = /\{([^{}>]+)>([^{}>]+)\}/g;
TT.parseChanges = function (raw) {
  var text = "", changes = [], last = 0, m;
  TT.CHANGE_RE.lastIndex = 0;
  while ((m = TT.CHANGE_RE.exec(raw)) !== null) {
    text += raw.slice(last, m.index);
    var keep = 0;
    while (keep < m[1].length && keep < m[2].length && m[1].charAt(keep) === m[2].charAt(keep)) { keep++; }
    changes.push({ at: text.length, from: m[1], to: m[2], keep: keep });
    text += m[2];
    last = m.index + m[0].length;
  }
  text += raw.slice(last);
  var stages = [];
  changes.forEach(function (c) {
    stages.push({ kind: "type", target: text.slice(0, c.at) + c.from, change: c });
    stages.push({ kind: "delete", target: text.slice(0, c.at) + c.from.slice(0, c.keep), shown: text.slice(0, c.at) + c.from, change: c });
  });
  stages.push({ kind: "type", target: text });
  return { text: text, changes: changes, stages: stages };
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
  var plans = sentences.map(TT.parseChanges);           // planned changes (the Backspace lesson), if any

  var session = {
    sentences: plans.map(function (p) { return p.text; }),   // each sentence as it ends up
    plans: plans,
    stage: sentences.map(function () { return 0; }),          // which step of its plan each sentence is on
    sentenceIndex: 0,          // which sentence we are on
    pos: 0,                    // how far through it the typing has reached (where the cursor is)
    typed: sentences.map(function () { return ""; }),     // the keys typed for each sentence
    aligned: sentences.map(function () { return null; }), // TT.align() of each sentence's typing
    keystrokes: 0,             // keys pressed
    wrongKeys: {},             // letter -> how often it went wrong (typed wrong, missed or swapped), for practice
    startTime: null,           // set on the first key, so reading time is not counted
    pausedMs: 0,               // time between sentences: from the end of one to the first key of the next (not counted)
    idleSince: null,           // when the last sentence ended (the clock is stopped until the next key)
    endTime: null,
    finished: false,
    allowBackspace: !!options.allowBackspace,
    requireCorrect: !!options.requireCorrect && !!options.allowBackspace
  };

  // What the typing is lined up with now: the sentence, or (with planned changes) the step's target
  function currentStage(k) { return session.plans[k].stages[session.stage[k]]; }
  session.currentStage = function () { return session.finished ? null : currentStage(session.sentenceIndex); };
  session.target = function (k) {
    if (k === undefined) { k = session.sentenceIndex; }
    var st = currentStage(k);
    return st ? (st.kind === "delete" ? st.shown : st.target) : session.sentences[k];
  };

  function realign() {
    var k = session.sentenceIndex, a = TT.align(session.target(k), session.typed[k]);
    session.aligned[k] = a;
    session.pos = a.at;
    return a;
  }

  // A planned change's step is done: on to the next one (and line the typing up with its target)
  function nextStages() {
    var k = session.sentenceIndex, stages = session.plans[k].stages, moved = false;
    for (;;) {
      var st = stages[session.stage[k]], typed = session.typed[k];
      var done = st.kind === "type" ? (session.stage[k] < stages.length - 1 && typed === st.target)
                                    : (typed.length <= st.target.length && st.target.indexOf(typed) === 0);
      if (!done) { break; }
      session.stage[k]++;
      moved = true;
    }
    if (moved) { realign(); }
  }

  // Handle one typed character. "now" is a timestamp in milliseconds. Returns true if it was the key expected.
  session.type = function (ch, now) {
    if (session.finished) { return false; }
    var k = session.sentenceIndex, sentence = session.sentences[k], target = session.target(k);
    var stage = currentStage(k);
    // "Fix every mistake" mode, end of the sentence (or of a step) reached with mistakes left in it: only
    // Backspace helps now. While a planned change waits for Backspace, any other key is a mistake to fix.
    if (session.requireCorrect && stage.kind === "type" && session.pos >= target.length) { return false; }
    if (session.startTime === null) { session.startTime = now; }
    if (session.idleSince !== null) {               // the first key after a sentence: the clock starts again
      session.pausedMs += Math.max(0, now - session.idleSince);
      session.idleSince = null;
    }
    var expected = stage.kind === "delete" ? "" : target.charAt(session.pos);
    session.typed[k] += ch;
    session.keystrokes++;
    var a = realign();
    nextStages();
    a = session.aligned[k];
    if (session.target(k) !== sentence) { return ch === expected; }   // a planned change is still to come

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
      } else {
        session.idleSince = now;                   // the clock stops until the next sentence's first key
      }
    }
    return ch === expected;
  };

  // Backspace: only works if the lesson allows it (or a planned change asks for it). It takes back the last key
  // typed in this sentence.
  session.backspace = function () {
    var k = session.sentenceIndex;
    if (session.finished || !session.typed[k]) { return false; }
    if (!session.allowBackspace && currentStage(k).kind !== "delete") { return false; }
    session.typed[k] = session.typed[k].slice(0, -1);
    realign();
    nextStages();
    return true;
  };

  // Backspace is what's needed next: a planned change waits for it (the step is "delete"), or, in "fix every
  // mistake" mode, there is a mistake to fix.
  session.wantsBackspace = function () {
    if (session.finished) { return false; }
    var k = session.sentenceIndex, st = currentStage(k);
    return st.kind === "delete" || (session.requireCorrect && !!session.aligned[k] && session.aligned[k].mistakes > 0);
  };

  // The character the learner should type next ("" when finished, or when Backspace is next).
  session.expectedChar = function () {
    if (session.finished || currentStage(session.sentenceIndex).kind === "delete") { return ""; }
    return session.target(session.sentenceIndex).charAt(session.pos);
  };

  // Typing time so far in milliseconds: from the first key to the last key, without the time between a sentence's
  // end and the next sentence's first key. This one number drives both the on-screen timer and the words-per-minute
  // score.
  session.elapsedMs = function (now) {
    if (session.startTime === null) { return 0; }
    var end = session.endTime !== null ? session.endTime : (session.idleSince !== null ? session.idleSince : now);
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
