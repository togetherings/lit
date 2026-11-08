/*
  core.js - creates the one shared object, "TT", that every other file uses.

  A lesson is played in one language, which is three things put together when the page starts
  (see loader.js):
    keyboards/<language>.json   the physical keyboard: rows, Shift/AltGr layers, dead keys, which finger types which key
    lessons/NN/<language>.json  the lesson's edition in that language: the "what is touch typing?" page, the keys
                                taught, the advice and the practice sentences
    lang/<language>.json        the wording on screen and the finger names (read with EduGame.t)
  The EduGame Kit's helper picks the language, and finds the nearest file of each: a UK English learner (en-GB)
  gets keyboards/en-GB.json and, while there's no lessons/NN/en-GB.json, the English edition lessons/NN/en.json.
*/
var TT = {
  // Join a keyboard and a lesson edition into the "language" app.js uses: the keyboard's fields, and .lesson.
  makeLanguage: function (keyboard, lesson, code) {
    var lang = JSON.parse(JSON.stringify(keyboard || {}));     // the lesson is changed while running: give it its own copy
    lang.code = code;
    lang.lesson = JSON.parse(JSON.stringify(lesson || {}));
    return lang;
  },

  // Turn the key names typed into knownKeys / newKeys into the exact names the program uses.
  //  - Upper/lower case does not matter: "A", "a", "TAB", "tab" and "Tab" all work.
  //  - "space" is the space bar, and "shift" means BOTH Shift keys (ShiftL and ShiftR).
  //  - Other nicknames (see keyAliases in the keyboard file) work too, e.g. "capslock".
  // Letters become lowercase (the keyboard rows use lowercase). Symbols such as ! or 1 are left alone.
  // The labels drawn on the keys are NOT affected: they come from the keyboard layout.
  normalizeKeys: function (lang, list) {
    var specials = lang.specialKeys || {}, aliases = lang.keyAliases || {}, byLower = {}, out = [];
    Object.keys(specials).forEach(function (t) { byLower[t.toLowerCase()] = t; });
    Object.keys(aliases).forEach(function (a) { byLower[a.toLowerCase()] = aliases[a]; });
    (list || []).forEach(function (raw) {
      var key = String(raw), found;
      if (key.length === 1) { found = key === " " ? " " : key.toLowerCase(); }          // one character: a letter, symbol or space
      else { found = byLower[key.trim().toLowerCase()]; }
      if (found === undefined) { console.warn("Unknown key name \"" + raw + "\" in knownKeys/newKeys"); return; }
      (Array.isArray(found) ? found : [found]).forEach(function (t) { if (out.indexOf(t) < 0) { out.push(t); } });
    });
    return out;
  },

  // Normalise the lesson's two key lists in place (call once, before anything else uses them).
  normalizeLesson: function (lang) {
    lang.lesson.knownKeys = this.normalizeKeys(lang, lang.lesson.knownKeys);
    lang.lesson.newKeys = this.normalizeKeys(lang, lang.lesson.newKeys);
  },

  // Author's safety net: warns in the browser console if the lesson is missing a field, or if a
  // practice sentence uses a character whose key has not been taught yet.
  checkLesson: function (lang) {
    var lesson = lang.lesson, specials = lang.specialKeys || {}, shiftMap = lang.shiftMap || {};
    ["id", "title", "knownKeys", "newKeys", "advice", "sentenceLists"].forEach(function (f) {
      if (!lesson[f]) { console.warn("Lesson is missing '" + f + "'"); }
    });

    // Which characters may appear in sentences, given the keys taught so far?
    //  - every key listed (a letter, a number or symbol, or the space bar), exactly as listed
    //  - Tab / Enter appear as their symbols (the "char" in specialKeys)
    //  - a CAPITAL letter if its letter is taught AND a Shift key or Caps is taught
    //  - a shifted symbol such as ! only if that symbol itself is listed (and it needs a Shift key)
    var tokens = (lesson.knownKeys || []).concat(lesson.newKeys || []);
    var hasShift = tokens.indexOf("ShiftL") >= 0 || tokens.indexOf("ShiftR") >= 0;
    var hasCaps = tokens.indexOf("Caps") >= 0;
    var shifted = {};
    Object.keys(shiftMap).forEach(function (k) { shifted[shiftMap[k]] = true; });
    var hasAltGr = tokens.indexOf("AltGr") >= 0, altGrChars = {};
    [lang.altGrMap, lang.altGrShiftMap].forEach(function (m) {
      Object.keys(m || {}).forEach(function (k) { altGrChars[m[k].toLowerCase()] = true; });
    });
    var allowed = [];
    tokens.forEach(function (t) {
      if (specials[t]) { if (specials[t].char) { allowed.push(specials[t].char); } return; }
      allowed.push(t);
      if (t.toLowerCase() !== t.toUpperCase() && (hasShift || hasCaps)) { allowed.push(t.toUpperCase()); }
      if (altGrChars[t] && !hasAltGr) { console.warn("The AltGr character \"" + t + "\" is taught but the AltGr key is not"); }
      if (shifted[t] && !hasShift) { console.warn("The shifted symbol \"" + t + "\" is taught but no Shift key is"); }
    });

    // Dead keys: a character produced by a dead key (e.g. ê = ^ then e) may appear in a sentence once the dead
    // character itself ("^" - or "¨", the shifted symbol of the same key) and the character it modifies are taught.
    // (A dead character must be typable: a key, or the shifted/AltGr character of one.)
    var dead = lang.deadKeys || {}, fingeredEarly = {};
    Object.keys(lang.fingerKeys || {}).forEach(function (f) { lang.fingerKeys[f].split("").forEach(function (ch) { fingeredEarly[ch] = true; }); });
    Object.keys(dead).forEach(function (d) {
      if (!fingeredEarly[d] && !shifted[d] && !altGrChars[d]) { console.warn("Dead key \"" + d + "\" in deadKeys is not a key, a shifted symbol or an AltGr character of the keyboard"); }
      Object.keys(dead[d]).forEach(function (typed) {
        var out = dead[d][typed];
        if (out.length === 1 && out !== d && allowed.indexOf(out) < 0 && allowed.indexOf(d) >= 0 && allowed.indexOf(typed) >= 0) { allowed.push(out); }
      });
    });

    // Every key drawn on the keyboard should have a finger (special keys have their own; the others come from
    // fingerKeys). An extra key such as "<" needs adding to fingerKeys.
    var fingered = {};
    Object.keys(lang.fingerKeys || {}).forEach(function (f) { lang.fingerKeys[f].split("").forEach(function (ch) { fingered[ch] = true; }); });
    (lang.keyboardRows || []).forEach(function (row) {
      row.forEach(function (t) {
        if (t !== "" && !specials[t] && !fingered[t]) { console.warn("Key \"" + t + "\" in keyboardRows has no finger: add it to fingerKeys in the keyboard file"); }
      });
    });

    var total = 0;
    (lesson.sentenceLists || []).forEach(function (list, n) {
      var sentences = list.sentences || [], count = +list.count || 0;
      // (An empty list is simply skipped, so only warn when a list has some sentences but fewer than its count.)
      if (sentences.length > 0 && count > sentences.length) { console.warn("List " + (n + 1) + ": count is " + count + " but it has only " + sentences.length + " sentences"); }
      if (count > 0) { total += Math.min(count, sentences.length); }
      sentences.forEach(function (s) {
        s.split("").forEach(function (ch) {
          if (allowed.indexOf(ch) < 0) { console.warn("List " + (n + 1) + ": sentence \"" + s + "\" uses \"" + ch + "\", which has not been taught (a capital needs Shift or Caps taught, and a shifted symbol such as ! must itself be listed in newKeys/knownKeys)"); }
        });
      });
    });
    if (total === 0) { console.warn("No sentences will be picked: every list is empty or has a count of 0"); }
  }
};
