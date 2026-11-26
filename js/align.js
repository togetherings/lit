/*
  align.js - lines up what the learner typed with the sentence, the way a spell-checker does, so one slip
  counts as one mistake (and everything typed after it can still be right). Four kinds of mistake, each 1:

    wrong    a different key in a letter's place            "loked" for "liked"
    missed   a letter left out                              "jule" for "julie"
    extra    a key that belongs nowhere                     "juliie" for "julie"
    swapped  two neighbouring letters the wrong way round   "likde" for "liked"

  TT.align(sentence, typed) matches the typed keys against the START of the sentence (the learner may be part
  way through) and returns:
    at        how many letters of the sentence the typing has reached (where the cursor goes)
    marks     one per letter before "at": {ok}, {wrong: the key typed}, {missed} or {swapped}
    extras    for each place 0..length, the extra keys typed just before that letter
    mistakes  how many mistakes (the four kinds added up)
    correct   how many letters were typed right
    count     {wrong, missed, extra, swapped}
  A mark can change as more is typed: "jule" reads as a wrong letter until the next key shows the i was left
  out ("jule "). The page simply draws the newest marks.
*/
TT.align = function (sentence, typed) {
  var n = sentence.length, m = typed.length, i, j;
  // d[i][j]: the fewest mistakes that turn the first i letters of the sentence into the first j keys typed
  var d = [];
  for (i = 0; i <= n; i++) { d.push(new Array(m + 1)); d[i][0] = i; }
  for (j = 0; j <= m; j++) { d[0][j] = j; }
  for (i = 1; i <= n; i++) {
    for (j = 1; j <= m; j++) {
      var same = sentence.charAt(i - 1) === typed.charAt(j - 1);
      var best = Math.min(d[i - 1][j - 1] + (same ? 0 : 1), d[i - 1][j] + 1, d[i][j - 1] + 1);
      if (swappedAt(i, j)) { best = Math.min(best, d[i - 2][j - 2] + 1); }
      d[i][j] = best;
    }
  }
  function swappedAt(i, j) {
    return i > 1 && j > 1 && sentence.charAt(i - 1) !== typed.charAt(j - 1) &&
           sentence.charAt(i - 1) === typed.charAt(j - 2) && sentence.charAt(i - 2) === typed.charAt(j - 1);
  }

  // How far through the sentence: the fewest mistakes; on a tie, the letter count closest to the keys typed
  // (so a wrong key reads as a wrong letter, not as a missed one, until the next key says otherwise).
  var at = 0;
  for (i = 1; i <= n; i++) {
    if (d[i][m] < d[at][m] || (d[i][m] === d[at][m] && Math.abs(i - m) < Math.abs(at - m))) { at = i; }
  }

  // Walk back through the table to mark each letter.
  var marks = new Array(at), extras = [], swaps = 0;
  for (i = 0; i <= n; i++) { extras.push([]); }
  i = at; j = m;
  while (i > 0 || j > 0) {
    var here = d[i][j];
    if (i > 0 && j > 0 && sentence.charAt(i - 1) === typed.charAt(j - 1) && here === d[i - 1][j - 1]) {
      marks[i - 1] = { ok: true }; i--; j--;
    } else if (swappedAt(i, j) && here === d[i - 2][j - 2] + 1) {
      marks[i - 1] = { swapped: true }; marks[i - 2] = { swapped: true, first: true }; swaps++; i -= 2; j -= 2;
    } else if (i > 0 && j > 0 && here === d[i - 1][j - 1] + 1) {
      marks[i - 1] = { wrong: typed.charAt(j - 1) }; i--; j--;
    } else if (i > 0 && here === d[i - 1][j] + 1) {
      marks[i - 1] = { missed: true }; i--;
    } else {
      extras[i].unshift(typed.charAt(j - 1)); j--;              // a key typed just before letter i that belongs nowhere
    }
  }
  var count = { wrong: 0, missed: 0, extra: 0, swapped: swaps }, correct = 0;
  marks.forEach(function (k) {
    if (k.ok) { correct++; } else if (k.wrong !== undefined) { count.wrong++; } else if (k.missed) { count.missed++; }
  });
  extras.forEach(function (e) { count.extra += e.length; });
  return { at: at, marks: marks, extras: extras, mistakes: d[at][m], correct: correct, count: count };
};
