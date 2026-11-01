/*
  app.js - the pages and buttons. It connects the pieces:
    keyboards/*.js, ui/*.js, lesson/*.js (joined into one "language" by core.js)
                -> the keyboard and fingers, the wording, and the lesson itself
    prefs.js    -> the learner's Options choices (theme, skin tone, language)
    engine.js   -> counts right/wrong keys, speed and the timer
    hands.js    -> the two hand pictures
    progress.js -> remembers the result
  Pages:  1 touch typing  ->  2 new keys  ->  3 practice  ->  4 results
  (Page 1 is skipped when showTouchTypingIntro is false in config.js.)
  The Options page is a panel that opens over Page 1 or Page 2.
*/
(function () {
  "use strict";

  var cfg = TT.config;

  // The CURRENT language. Everything below that depends on the language is (re)computed by setLanguage(),
  // which is also what the Options page calls, so the language can change without reloading the page.
  var lang, ui, lesson, langCode;
  var specials, shiftMap, fingersOf, fingerOf, shiftedFingers, specialByChar, baseOfShifted;
  var altGrOn, altGrMap, altGrShiftMap, baseOfAltGr, baseOfAltGrShift;      // AltGr mode (keyboardOptions.altGr)
  var deadTable, composedFrom;                                              // dead keys (lang.deadKeys), see below

  var session = null;         // the current typing attempt (from engine.js)
  var listNames = [];         // the name of the sentence list each sentence of the attempt came from
  var keyMap = {};            // key name (a character, or Tab / Enter / ShiftL ...) -> its element on the keyboard

  // Pause between sentences: while "locked" the learner's typing is ignored.
  var locked = false, lockStart = 0, lockTimer = null;
  var clockTimer = null;      // refreshes the on-screen timer

  function setLanguage(code) {
    langCode = code;
    lang = TT.languages[code];
    ui = lang.ui;
    lesson = lang.lesson;
    TT.normalizeLesson(lang);   // key names in knownKeys / newKeys: any case, "space", "shift" ...

    // Special keys (Tab, Enter, Shift ...) and what Shift does
    specials = lang.specialKeys || {};
    shiftMap = lang.shiftMap || {};

    // Reverse of lang.fingerKeys: character -> every finger that can press it (e.g. "a" -> ["lp"]; the space
    // bar -> ["lt", "rt"]). fingerOf is just the first of them.
    fingersOf = {}; fingerOf = {};
    Object.keys(lang.fingerKeys).forEach(function (finger) {
      lang.fingerKeys[finger].split("").forEach(function (ch) { (fingersOf[ch] = fingersOf[ch] || []).push(finger); });
    });
    Object.keys(fingersOf).forEach(function (ch) { fingerOf[ch] = fingersOf[ch][0]; });
    // A shifted symbol that is not itself a key is typed with the same finger as its key ("!" like "1").
    // Only used for the list of new keys; keys drawn on the keyboard use fingerKeys alone (it always wins).
    shiftedFingers = {};
    Object.keys(shiftMap).forEach(function (k) { if (fingersOf[k] && !fingersOf[shiftMap[k]]) { shiftedFingers[shiftMap[k]] = fingersOf[k]; } });

    specialByChar = {};                                     // "\u21E5" -> "Tab", "\u21B5" -> "Enter"
    Object.keys(specials).forEach(function (t) { if (specials[t].char) { specialByChar[specials[t].char] = t; } });
    baseOfShifted = {};                                     // "!" -> "1"
    Object.keys(shiftMap).forEach(function (k) { baseOfShifted[shiftMap[k]] = k; });

    // AltGr mode: two more layers (AltGr, AltGr+Shift) defined by altGrMap / altGrShiftMap in the language file
    altGrOn = !!(lang.keyboardOptions && lang.keyboardOptions.altGr);
    altGrMap = altGrOn ? (lang.altGrMap || {}) : {};
    altGrShiftMap = altGrOn ? (lang.altGrShiftMap || {}) : {};
    baseOfAltGr = {}; baseOfAltGrShift = {};                // "\u20AC" -> "4"
    Object.keys(altGrMap).forEach(function (k) { baseOfAltGr[altGrMap[k]] = k; });
    Object.keys(altGrShiftMap).forEach(function (k) { baseOfAltGrShift[altGrShiftMap[k]] = k; });
    // like a shifted symbol, an AltGr character that is not a key itself is typed with the finger of its key
    [altGrMap, altGrShiftMap].forEach(function (m) {
      Object.keys(m).forEach(function (k) {
        var c = isLetter(m[k]) ? m[k].toLowerCase() : m[k];
        if (fingersOf[k] && !fingersOf[c] && !shiftedFingers[c]) { shiftedFingers[c] = fingersOf[k]; }
      });
    });

    // DEAD KEYS (lang.deadKeys). deadTable: dead character -> { typed character -> what it produces }.
    // composedFrom: a produced character that has no key of its own -> how to type it, e.g. "\u00EA" -> { dead: "^", typed: "e" }.
    // (Results that are the dead character itself, or longer than one character, are not "composed" characters.)
    deadTable = lang.deadKeys || {};
    composedFrom = {};
    Object.keys(deadTable).forEach(function (d) {
      Object.keys(deadTable[d]).forEach(function (t) {
        var out = deadTable[d][t];
        if (out.length === 1 && out !== d && !composedFrom[out]) { composedFrom[out] = { dead: d, typed: t }; }
      });
    });
    resetDead();

    applyStaticText();
    TT.checkLesson(lang);                                   // author warnings in the console
  }

  // ---------------------------------------------------------------- small helpers
  function shifted(ch) { return shiftMap[ch] || ch.toUpperCase(); }          // "a" -> "A", "1" -> "!"
  // Every finger that presses a KEY on the keyboard: a special key has one (its "finger"); the space bar has two
  // thumbs; any other key is whatever fingerKeys says (nothing if it is not listed there)
  function fingersForKey(token) { return specials[token] ? [specials[token].finger] : (fingersOf[token] || []); }
  // The same, but a shifted symbol such as "!" (not a key itself) takes the finger of its key. For the new-keys list.
  function fingersForToken(token) { var f = fingersForKey(token); return f.length ? f : (shiftedFingers[token] || []); }
  // The Shift key on the OPPOSITE hand to the key being typed (the touch-typing rule)
  function shiftKeyFor(base) { return (lang.fingerHands || {})[fingerOf[base]] === "left" ? "ShiftR" : "ShiftL"; }
  // Which keys to light up for a character that must be typed (capitals also light the opposite Shift key)
  function keysForChar(ch) {
    if (specialByChar[ch]) { return [specialByChar[ch]]; }
    // A character needing AltGr lights its key AND the AltGr key; one needing AltGr+Shift lights the Shift key too
    if (baseOfAltGr[ch]) { return [baseOfAltGr[ch], "AltGr"]; }
    if (baseOfAltGrShift[ch]) { return [baseOfAltGrShift[ch], "AltGr", shiftKeyFor(baseOfAltGrShift[ch])]; }
    if (baseOfShifted[ch]) { return [baseOfShifted[ch], shiftKeyFor(baseOfShifted[ch])]; }
    var lower = ch.toLowerCase();
    if (lower !== ch && fingerOf[lower] && !shiftMap[lower]) { return [lower, shiftKeyFor(lower)]; }
    return [ch];
  }

  // ---------------------------------------------------------------- dead keys
  // A dead key does nothing when pressed; the NEXT character typed is changed by it (^ then e gives \u00EA). The
  // language file lists them in "deadKeys" (see keyboards/fr.js). Two ways a dead key reaches us:
  //   - the learner's own keyboard layout has dead keys (a French keyboard): the system combines the two keys
  //     itself and we receive the finished character (we only notice the "Dead" key press, to move the hint on);
  //   - we receive a plain "^" (a keyboard without dead keys): we hold it in "pending" and combine it with the
  //     next character using the deadKeys table.
  var pending = null;         // a dead character we are holding, waiting for the next character
  var osDead = false;         // the system is holding a dead key for us
  var composing = false;      // the system is in the middle of combining a dead key (composition events)
  function resetDead() { pending = null; osDead = false; }

  // Can this character be typed directly (a key, a shifted or AltGr character, Tab/Enter, a capital)?
  function typable(ch) {
    return !!(fingersOf[ch] || specialByChar[ch] || baseOfShifted[ch] || baseOfAltGr[ch] || baseOfAltGrShift[ch] ||
              (ch.toLowerCase() !== ch && fingersOf[ch.toLowerCase()]));
  }
  // Which character, typed after this dead key, produces "out"?  (null if none)
  function typedFor(dead, out) {
    var table = deadTable[dead] || {}, found = null;
    Object.keys(table).forEach(function (t) { if (found === null && table[t] === out) { found = t; } });
    return found;
  }
  // The keys to highlight for the character that is expected next. A character that needs a dead key is typed in two
  // steps: first the dead key, then (once it is pressed) the key it modifies.
  function hintKeys(ch) {
    var composed = composedFrom[ch];
    if (pending) { var t = typedFor(pending, ch); if (t !== null) { return keysForChar(t); } }
    else if (osDead && composed) { return keysForChar(composed.typed); }
    if (composed && !typable(ch)) { return keysForChar(composed.dead); }
    return keysForChar(ch);
  }

  function el(id) { return document.getElementById(id); }
  function make(tag, className, text) {
    var e = document.createElement(tag);
    if (className) { e.className = className; }
    if (text !== undefined) { e.textContent = text; }
    return e;
  }
  function clear(node) { while (node.firstChild) { node.removeChild(node.firstChild); } }
  function keyLabel(ch) { return lang.keyLabels[ch] || ch.toUpperCase(); }
  function fill(text, values) {   // replaces {n}, {acc} ... in a text
    return text.replace(/\{(\w+)\}/g, function (m, k) { return values[k] !== undefined ? values[k] : m; });
  }
  function clock(ms) {            // 75000 -> "1:15"
    var s = Math.floor(ms / 1000), r = s % 60;
    return Math.floor(s / 60) + ":" + (r < 10 ? "0" : "") + r;
  }
  // Pictures are plain SVG text made by hands.js (no user input in it), so innerHTML is safe here.
  function figure(svgText) {
    var box = make("div", "figure");
    box.innerHTML = svgText;
    return box;
  }

  // A picture floated to the right of the text. "which" is the setting in config.js (intro / passed /
  // failed); "cls" sets its size in the CSS. Returns null if no file name was given.
  function sideImage(which, cls) {
    var name = cfg.images && cfg.images[which];
    if (!name) { return null; }
    var img = make("img", "side-image " + cls);
    img.src = (cfg.images.folder || "") + name;
    img.alt = "";                                    // decorative picture
    img.onerror = function () { if (img.parentNode) { img.parentNode.removeChild(img); } };   // missing file: just no picture
    return img;
  }

  var PAGES = ["touch", "keys", "practice", "results"];
  function showPage(name) {
    PAGES.forEach(function (p) { el("page-" + p).hidden = (p !== name); });
    window.scrollTo(0, 0);
  }

  // Texts that are not rebuilt page by page: the header, the title, the buttons marked data-ui
  function applyStaticText() {
    document.documentElement.lang = lang.htmlLang || lang.code;
    document.title = ui.appTitle;
    el("appTitle").textContent = ui.appTitle;
    el("version").textContent = "v" + cfg.version;
    el("version").hidden = !cfg.showVersion;
    Array.prototype.forEach.call(document.querySelectorAll("[data-ui]"), function (node) {
      node.textContent = ui[node.getAttribute("data-ui")];
    });
    el("timer").title = ui.timerLabel;
    el("timer").setAttribute("aria-label", ui.timerLabel);
  }

  // ------------------------------------------------------------ on-screen keyboard
  // Is this key one of the taught keys? "new" (this lesson), "known" (earlier lessons) or "locked".
  function stateOf(token) {
    return lesson.newKeys.indexOf(token) >= 0 ? "new" : (lesson.knownKeys.indexOf(token) >= 0 ? "known" : "locked");
  }
  function isLetter(token) { return token.toLowerCase() !== token.toUpperCase(); }

  // The rows of keys to draw, from lang.keyboardRows and lang.keyboardOptions. Each key is a small record:
  //   { token, width }   a key (width in normal-key widths; leave it out to use the key's own width)
  //   { spacer }         an invisible gap (under an L-shaped Enter)
  //   { token: "Enter", iso: true }   the L-shaped ISO Enter
  // EXTRA KEYS: a special key that has a shortWidth (ShiftL, ShiftR, Backspace) has an "extra key" slot beside
  // it in keyboardRows - after ShiftL, before ShiftR and before Backspace. If the slot is "" nothing is drawn;
  // if it holds a character, that key is drawn and the special key switches to its shortWidth.
  // The key just before Enter (the \ key on a US keyboard, # on a UK one) is listed in the HOME ROW. For the
  // ANSI layout it is moved up to the end of the row above (1.5 wide); for ISO it stays, and Enter becomes the
  // tall L-shaped key.
  function keyboardLayout() {
    var o = lang.keyboardOptions || {};
    var rows = lang.keyboardRows.map(function (r) { return r.map(function (t) { return { token: t }; }); });

    // Extra-key slots: the entry just inside the first or last key of a row, when that key can be shortened
    function slot(r, keyIndex, slotIndex) {
      var key = specials[r[keyIndex].token];
      if (!key || !key.shortWidth) { return; }
      if (r[slotIndex].token !== "") { r[keyIndex].width = key.shortWidth; }   // defined: shown, and the key gets shorter
    }
    rows.forEach(function (r) {
      if (r.length < 2) { return; }
      slot(r, 0, 1);                          // e.g. ShiftL: the slot after it
      slot(r, r.length - 1, r.length - 2);    // e.g. ShiftR, Backspace: the slot before them
    });
    // An undefined key ("") is not displayed
    rows = rows.map(function (r) { return r.filter(function (k) { return k.token !== ""; }); });

    // The home row (the one holding Enter) and the row above it. The key just before Enter is the one that an
    // ANSI keyboard has at the end of the row above: "\\" on a US keyboard, "#" on a UK one.
    var home = -1;
    rows.forEach(function (r, i) { if (r.some(function (k) { return k.token === "Enter"; })) { home = i; } });
    if (home > 0) {
      var row = rows[home], above = rows[home - 1];
      var en = row.map(function (k) { return k.token; }).indexOf("Enter");
      var bs = en - 1;
      if (bs >= 0 && specials[row[bs].token]) { bs = -1; }       // a special key (e.g. Caps) is not the \\ key
      if (o.isoEnter) {
        if (bs >= 0) { row[bs].width = 1; }                     // that key stays in the home row, one key wide
        row[en] = { spacer: 1.25 };                             // ... and Enter's lower part is drawn from the row above
        above.push({ token: "Enter", iso: true, width: 1.5 });
      } else if (bs >= 0) {
        var moved = row.splice(bs, 1)[0];                       // ANSI: it goes to the end of the row above
        moved.width = 1.5;
        above.push(moved);
      }
    }
    // How far each row is moved to the right (key widths): from keyboardIndent in the language file
    rows.forEach(function (r, i) { r.indent = (lang.keyboardIndent && lang.keyboardIndent[i]) || 0; });

    // AltGr mode: a plain Alt key to the left of the space bar and an AltGr key to its right.
    // The row moves left by the width of Alt so the space bar stays where it was.
    if (altGrOn && specials.Alt && specials.AltGr) {
      rows.forEach(function (r) {
        var at = r.map(function (k) { return k.token; }).indexOf(" ");
        if (at < 0) { return; }
        r.splice(at + 1, 0, { token: "AltGr" });
        r.splice(at, 0, { token: "Alt" });
        r.indent = Math.max(0, r.indent - specials.Alt.width);
      });
    }
    return rows;
  }

  // Draws the keyboard. Keys are coloured by finger, and by state (new / known / locked).
  // Every letter and symbol key holds two labels: normal (class "lo") and shifted (class "up").
  //  - LETTER keys (class "ltr") show capitals while the keyboard has the class "letters-up".
  //    Their colour is the same either way.
  //  - SYMBOL and NUMBER keys (class "sym") show the shifted symbol while the keyboard has the class
  //    "symbols-up". Their colour depends on the symbol shown: if "1" is taught but "!" is not, the key is
  //    coloured normally and turns grey while shifted. (setShiftState() below switches all of this.)
  // Returns key name -> element (for every key, including Tab, Enter, Shift ...).
  function buildKeyboard(container) {
    var map = {}, layerKeys = [], bumps = lang.keyBumps || [];
    clear(container);

    function makeKey(desc) {
      if (desc.spacer) {
        var gap = make("span", "keyspacer");
        gap.style.setProperty("--w", desc.spacer);
        return gap;
      }
      var token = desc.token;
      var special = specials[token];
      var fingers = fingersForKey(token), finger = fingers[0] || "none";   // a key with no finger in fingerKeys gets none
      var state = stateOf(token);
      // (a letter-like key that has its own shifted character, such as French \u00E9 -> 2, counts as a symbol key)
      var letter = !special && token !== " " && isLetter(token) && !shiftMap[token];
      var symbol = !special && token !== " " && !letter;
      var width = desc.width || (special ? (special.width || 1) : ((lang.keyWidths || {})[token] || 1));
      var agChar = altGrMap[token], agsChar = altGrShiftMap[token];         // what this key types with AltGr, AltGr+Shift
      var k = make("span", "key " + state + " f-" + finger + (special && special.shift ? " shift" : "") + (special && special.caps ? " caps" : "") + (special && special.altgr ? " altgr" : "") +
                           (token === " " ? " space" : "") + (letter ? " ltr" : "") + (symbol ? " sym" : "") + (desc.iso ? " isoenter" : ""));
      if (desc.iso) { k.appendChild(make("span", "lbl", special.label)); }
      else if (special) { k.textContent = special.label; }
      else if (token === " ") { k.textContent = keyLabel(token); }
      else {
        k.appendChild(make("span", "lo", token)); k.appendChild(make("span", "up", shifted(token)));
        if (altGrOn) { k.appendChild(make("span", "ag", agChar || "")); k.appendChild(make("span", "as", agsChar || "")); }   // blank when the key has no character in that layer
      }
      if (bumps.indexOf(token) >= 0) { k.appendChild(make("span", "bump")); }          // the raised bar on F and J
      if (width !== 1) { k.style.setProperty("--w", width); }                // wider keys (Tab, Enter, Shift, space ...)
      if (state !== "locked" && fingers.length) { k.setAttribute("data-finger", fingers.join(" ")); }   // Page 2 highlights these fingers on hover
      if (letter || symbol) {
        // The key's taught-state in each layer. Letters keep their state under Shift/Caps; symbols depend on the
        // shifted symbol. In the AltGr layers it depends on the AltGr character (blank = not taught = grey).
        var layerState = function (c) { return c ? stateOf(isLetter(c) ? c.toLowerCase() : c) : "locked"; };
        layerKeys.push({ el: k, finger: fingers.join(" "),
          states: { base: state, shift: letter ? state : stateOf(shiftMap[token] || ""), ag: layerState(agChar), ags: layerState(agsChar) } });
      }
      if (token) { map[token] = k; }
      return k;
    }

    keyboardLayout().forEach(function (row, r) {
      var rowEl = make("div", "kb-row");
      var indent = row.indent || 0;
      if (indent) { rowEl.style.marginLeft = "calc((var(--key) + var(--gap)) * " + indent + ")"; }
      row.forEach(function (desc) { rowEl.appendChild(makeKey(desc)); });
      container.appendChild(rowEl);
    });
    container._layerKeys = layerKeys;
    return map;
  }

  // Switch a keyboard between its layers.
  //   lettersUp  letters show capitals          (Shift is down/hovered, or Caps is on/hovered)
  //   symbolsUp  numbers and symbols show their shifted form (Shift only - Caps never changes them)
  //   altLayer   "ag" (AltGr) or "ags" (AltGr+Shift) shows that layer's characters on every letter and symbol key
  //              (blank where a key has none); it replaces the two settings above. Leave it out for no AltGr layer.
  // Letter and symbol keys are also re-coloured for the layer now showing, and only taught keys react to hovering.
  function setShiftState(container, lettersUp, symbolsUp, altLayer) {
    container.classList.toggle("letters-up", !altLayer && !!lettersUp);
    container.classList.toggle("symbols-up", !altLayer && !!symbolsUp);
    container.classList.toggle("layer-ag", altLayer === "ag");
    container.classList.toggle("layer-ags", altLayer === "ags");
    (container._layerKeys || []).forEach(function (rec) {
      var state = rec.states[altLayer || (symbolsUp ? "shift" : "base")];
      rec.el.className = rec.el.className.replace(/\b(new|known|locked)\b/, state);
      if (state === "locked" || !rec.finger) { rec.el.removeAttribute("data-finger"); } else { rec.el.setAttribute("data-finger", rec.finger); }
    });
  }

  // ---------------------------------------------------------------- Page 1: touch typing
  function showTouchPage() {
    stopPractice();
    var box = el("touchBody");
    clear(box);
    // The picture comes FIRST so it floats to the right of the title as well as the paragraphs
    var pic = sideImage("intro", "intro");
    if (pic) { box.appendChild(pic); }
    box.appendChild(make("h2", null, ui.whatIsTouchTyping));
    lang.introTouchTyping.forEach(function (p) { box.appendChild(make("p", null, p)); });

    // The hands picture starts below the text and the image. Keys are coloured by finger if
    // config.js says so, and the two Shift keys are added if showShiftKeysOnPage1 is true.
    var opts = { keyFingers: cfg.colorKeysOnPage1 ? fingerOf : null, shiftOf: shifted };
    if (cfg.showShiftKeysOnPage1 && specials.ShiftL && specials.ShiftR) {
      opts.shift = { left: { label: specials.ShiftL.label, finger: specials.ShiftL.finger },
                     right: { label: specials.ShiftR.label, finger: specials.ShiftR.finger } };
    }
    var fig = figure(TT.hands.restingOnKeyboard(lang.handsImageRows, ui.handsRestAlt, opts));
    box.appendChild(fig);
    if (opts.shift) {                                   // mouse over a Shift key: show capitals and shifted symbols
      var svg = fig.querySelector("svg");
      svg.addEventListener("mouseover", function (e) { svg.classList.toggle("shifted", !!(e.target.closest && e.target.closest(".hk-shift"))); });
      svg.addEventListener("mouseout", function (e) { if (!e.relatedTarget || !svg.contains(e.relatedTarget)) { svg.classList.remove("shifted"); } });
    }
    showPage("touch");
  }

  // ---------------------------------------------------------------- Page 2: new keys
  function showKeysPage() {
    stopPractice();
    var box = el("keysBody");
    clear(box);

    box.appendChild(make("h2", null, lesson.title));

    // If already completed, show the best completed attempt (best accuracy, and its speed)
    var best = TT.progress.get();
    if (best.done) {
      box.appendChild(make("p", "note", fill(ui.alreadyCompleted, { acc: best.acc, wpm: best.wpm })));
    }

    // 1. The lesson's advice text
    box.appendChild(make("h3", null, ui.newKeysHeading));
    lesson.intro.forEach(function (p) { box.appendChild(make("p", null, p)); });

    // 2. The keyboard, straight under the text, with this lesson's keys highlighted
    var kb = make("div", "keyboard");
    buildKeyboard(kb);
    box.appendChild(kb);

    // 3. The new keys and the hands, side by side: new left-hand keys on the left, the hands (350px wide) in
    //    the middle, new right-hand keys on the right. A key is listed once for EACH finger that can press it,
    //    so the space bar appears under both "Left Hand" (left thumb) and "Right Hand" (right thumb).
    //    lesson.hideHand ("left" / "right") leaves out that hand, its fingertips, highlights and key column.
    var hide = String(lesson.hideHand || "").toLowerCase();
    if (hide !== "left" && hide !== "right") { hide = ""; }
    var layout = make("div", "keylayout" + (hide ? " one-hand hide-" + hide : ""));
    var cols = { left: make("div", "keycol left"), right: make("div", "keycol right") };
    var lists = { left: make("ul", "newkeys"), right: make("ul", "newkeys") };
    lesson.newKeys.forEach(function (ch) {
      var special = specials[ch];
      fingersForToken(ch).forEach(function (finger) {
        var side = (lang.fingerHands || {})[finger] === "right" ? "right" : "left";
        if (side === hide) { return; }                       // that hand is hidden: its keys are not listed
        var li = make("li");
        var chip = make("span", "chip f-" + finger, special ? special.label : keyLabel(ch));
        chip.setAttribute("data-finger", finger);     // hovering it highlights this finger on the hands
        li.appendChild(chip);
        li.appendChild(make("span", null, lang.fingerNames[finger]));
        lists[side].appendChild(li);
      });
    });
    [["left", ui.leftHeading], ["right", ui.rightHeading]].forEach(function (side) {
      if (!lists[side[0]].children.length) { return; }          // no new keys on this side: no heading, no list
      cols[side[0]].appendChild(make("h4", null, side[1]));
      cols[side[0]].appendChild(lists[side[0]]);
    });
    var hands = figure(TT.hands.backOfHands(ui.handsBackAlt, hide));
    hands.classList.add("small");
    // one hand keeps the same size as a hand in the two-hand picture (350px for two)
    hands.style.width = Math.round(350 * TT.hands.openWidth(hide) / TT.hands.openWidth("")) + "px";
    if (hide !== "left") { layout.appendChild(cols.left); }
    layout.appendChild(hands);
    if (hide !== "right") { layout.appendChild(cols.right); }
    box.appendChild(layout);

    // Hovering a coloured key (or one of the new keys in the list) outlines that finger's tip on the hands.
    // Hovering a Shift key (even a locked one) shows capitals AND shifted symbols; hovering CAPS shows
    // capital letters only. Keys that are not taught in the state being shown turn grey.
    // AltGr mode: hovering the AltGr key shows the AltGr layer. The layer stays for up to ONE SECOND after the
    // pointer leaves AltGr, so you can move on to Shift and see the AltGr+Shift layer (it then stays while the
    // pointer is on Shift, as if both keys were held).
    var over = { shift: false, caps: false, altgr: false }, grace = false, combo = false, graceTimer = null;
    function updateLayers() {
      if (altGrOn && (over.altgr || grace || combo)) { setShiftState(kb, false, false, over.shift ? "ags" : "ag"); }
      else { setShiftState(kb, over.shift || over.caps, over.shift, null); }
    }
    box.onmouseover = function (e) {
      var inKey = function (sel) { return !!(e.target.closest && e.target.closest(sel)); };
      var now = { shift: inKey(".key.shift"), caps: inKey(".key.caps"), altgr: altGrOn && inKey(".key.altgr") };
      if (over.altgr && !now.altgr) {                                // the pointer has just left AltGr: start the grace second
        grace = true;
        clearTimeout(graceTimer);
        graceTimer = setTimeout(function () { grace = false; updateLayers(); }, 1000);
      }
      if (now.altgr) { grace = false; combo = false; clearTimeout(graceTimer); }
      if (now.shift && grace) { combo = true; }                      // reached Shift within the second: AltGr + Shift
      if (!now.shift) { combo = false; }
      over = now;
      updateLayers();
      var t = e.target.closest ? e.target.closest("[data-finger]") : null;
      TT.hands.highlightFinger(box, t ? t.getAttribute("data-finger") : null);
    };
    box.onmouseout = function (e) {
      if (!e.relatedTarget || !box.contains(e.relatedTarget)) {
        TT.hands.highlightFinger(box, null);
        over = { shift: false, caps: false, altgr: false }; grace = false; combo = false; clearTimeout(graceTimer);
        updateLayers();
      }
    };

    // "Back" only makes sense if Page 1 exists
    el("keysBack").hidden = !cfg.showTouchTypingIntro;
    showPage("keys");
  }

  // ---------------------------------------------------------------- Page 3: practice
  function startPractice(ev) {
    stopPractice();
    var allowBack = lesson.allowBackspace !== undefined ? lesson.allowBackspace : cfg.allowBackspace;
    // "Fix every mistake" mode: Backspace is allowed AND the accuracy pass mark is 100
    var strict = !!allowBack && cfg.thresholds.accuracy >= 100;
    el("strictNote").textContent = ui.strictNotice;
    el("strictNote").hidden = !strict;
    el("capsWarning").textContent = ui.capsWarning;
    el("capsWarning").hidden = true;

    // A new random selection every attempt: all picks from list 1, then list 2, and so on
    var attempt = TT.buildAttempt(lesson.sentenceLists);
    listNames = attempt.listNames;
    var kb = el("practiceKeyboard");
    kb.hidden = !cfg.showKeyboard;
    keyMap = buildKeyboard(kb);
    setShiftState(kb, false, false);
    if (ev && ev.getModifierState) { showShift(ev); }      // pick up Caps Lock / Shift already on when the page opens
    el("timer").hidden = !cfg.showTimer;
    if (!attempt.sentences.length) {                    // every list is empty or has a count of 0
      session = null;
      el("progressText").textContent = ""; el("listName").hidden = true;
      el("sentence").textContent = ui.noSentences;
      showPage("practice");
      return;
    }
    session = TT.createSession(attempt.sentences, { allowBackspace: allowBack, requireCorrect: strict });

    clockTimer = setInterval(updateClock, 250);
    updateClock();

    showPage("practice");
    render();
    el("capture").focus();
  }

  // Leaving the practice page (or restarting): cancel any pause and stop the timer.
  function stopPractice() {
    clearTimeout(lockTimer);
    clearInterval(clockTimer);
    locked = false;
    session = null;
    resetDead();
  }

  // The timer counts typing time only. It starts at the first key, freezes during the
  // pause between sentences, and stops after the last key (the same time WPM uses).
  function updateClock() {
    if (!session) { return; }
    el("timer").textContent = clock(session.elapsedMs(locked ? lockStart : Date.now()));
  }

  // Redraws a sentence: green = correct, red = wrong, yellow = next.
  // "index" lets us keep showing the sentence just finished during the pause.
  function render(index) {
    var showing = index !== undefined ? index : session.sentenceIndex;
    var isCurrent = (showing === session.sentenceIndex && !session.finished);
    var text = el("sentence");
    clear(text);
    var sentence = session.sentences[showing];
    var marks = session.status[showing];

    for (var i = 0; i < sentence.length; i++) {
      var cls = "ch";
      if (marks[i] === "ok") { cls += " ok"; }
      else if (marks[i] === "bad") { cls += " bad"; }
      else if (isCurrent && i === session.pos) { cls += " cur"; }
      if (sentence.charAt(i) === " ") { cls += " sp"; }
      if (specialByChar[sentence.charAt(i)]) { cls += " sym"; }         // the Tab / Enter symbols
      text.appendChild(make("span", cls, sentence.charAt(i) === " " ? "\u00a0" : sentence.charAt(i)));
    }

    el("progressText").textContent = fill(ui.sentenceOf, { n: showing + 1, total: session.sentences.length });

    // The name of the list this sentence came from, above the typing box (nothing if it has no name)
    var name = listNames[showing] || "";
    el("listName").textContent = name;
    el("listName").hidden = !name;

    // Highlight the next key(s) on the on-screen keyboard (not during the pause)
    Object.keys(keyMap).forEach(function (t) { keyMap[t].className = keyMap[t].className.replace(" next", ""); });
    if (cfg.showNextKeyHint && isCurrent) {
      var waiting = session.pos >= sentence.length;                       // "fix every mistake" mode: Backspace is next
      (waiting ? ["Backspace"] : hintKeys(session.expectedChar())).forEach(function (t) {
        if (keyMap[t]) { keyMap[t].className += " next"; }
      });
    }
  }

  // A plain character from the keyboard (not already combined by the system): dead keys are handled here.
  function receiveTyped(ch) {
    if (!session || session.finished || locked) { return; }
    osDead = false;
    if (pending) {
      var dead = pending, out;
      pending = null;
      out = deadTable[dead][ch];                       // e.g. ^ then e -> ê;  ^ then space -> ^
      if (out === undefined) { out = dead + ch; }      // it cannot modify this character: both are typed, as on a real keyboard
      for (var i = 0; i < out.length; i++) { handleChar(out.charAt(i)); }
    } else if (deadTable[ch]) {
      pending = ch;                                    // a dead key: nothing is typed yet, the hint moves on to the next key
      render();
    } else {
      handleChar(ch);
    }
  }

  function handleChar(ch) {
    if (!session || session.finished || locked) { return; }   // typing is ignored during the pause
    var before = session.sentenceIndex;
    session.type(ch, Date.now());
    if (session.finished || session.sentenceIndex !== before) {
      pauseThenContinue(before);
    } else {
      render();
    }
  }

  // A sentence has just been finished: leave it on screen, ignore typing for a moment, then go on.
  function pauseThenContinue(finishedIndex) {
    var ms = Math.max(0, (+cfg.sentenceDelaySeconds || 0) * 1000);
    if (ms === 0) { continueAfterPause(); return; }
    locked = true;
    lockStart = Date.now();
    render(finishedIndex);
    lockTimer = setTimeout(function () {
      locked = false;
      // pauses between sentences do not count as typing time (the final one is already outside the timing)
      if (!session.finished) { session.addPause(Date.now() - lockStart); }
      continueAfterPause();
    }, ms);
  }

  function continueAfterPause() {
    if (session.finished) { showResults(); } else { render(); el("capture").focus(); }
  }

  // ---------------------------------------------------------------- Page 4: results
  function showResults() {
    var st = session.stats(Date.now());
    var need = cfg.thresholds;
    var passed = st.accuracy >= need.accuracy && st.wpm >= need.wpm;
    TT.progress.record(st.accuracy, st.wpm, passed);

    var box = el("resultsBody");
    clear(box);
    // Text on the left; the picture (a different one for success and failure) centred in the space to its right
    var layout = make("div", "result-layout"), text = make("div", "result-text");
    text.appendChild(make("h2", passed ? "pass" : "notyet", passed ? ui.resultsPassed : ui.resultsNotYet));
    text.appendChild(make("p", st.accuracy >= need.accuracy ? "met" : "unmet",
      fill(ui.accuracyLine, { acc: st.accuracy, needAcc: need.accuracy })));
    text.appendChild(make("p", st.wpm >= need.wpm ? "met" : "unmet",
      fill(ui.wpmLine, { wpm: st.wpm, needWpm: need.wpm })));
    layout.appendChild(text);
    var pic = sideImage(passed ? "passed" : "failed", "result");
    if (pic) { var space = make("div", "result-pic"); space.appendChild(pic); layout.appendChild(space); }
    box.appendChild(layout);

    stopPractice();   // this attempt is over
    showPage("results");
  }

  // ---------------------------------------------------------------- typing input
  // A hidden text box receives the typing. Using it (not raw key events) means the
  // character is whatever the learner's keyboard layout really produced, and it
  // also lets tablets pop up their on-screen keyboard.
  var capture = el("capture");

  capture.addEventListener("input", function (e) {
    if (composing || e.isComposing) { return; }          // the system is combining a dead key: wait for compositionend
    var typed = capture.value;
    capture.value = "";
    for (var i = 0; i < typed.length; i++) { receiveTyped(typed.charAt(i)); }
  });
  // A dead key on the learner's own keyboard: the system combines it with the next key and gives us the finished
  // character(s) here (e.g. "\u00EA", or "^x" when it could not be combined). They are typed as they are.
  capture.addEventListener("compositionstart", function () { composing = true; });
  capture.addEventListener("compositionend", function (e) {
    composing = false;
    var text = e.data || "";
    capture.value = "";
    osDead = false;
    if (!session || session.finished || locked) { return; }
    for (var i = 0; i < text.length; i++) { handleChar(text.charAt(i)); }
    if (!text) { render(); }                             // cancelled: show the first hint again
  });

  // The Page 3 keyboard follows the real keyboard: numbers and symbols show their shifted form while Shift is
  // held; letters show capitals when Shift is held OR Caps Lock is engaged (both together give lowercase, as
  // on a real keyboard). Hovering with the mouse does nothing here. A warning shows while Caps Lock is on.
  // In AltGr mode, holding AltGr (or Ctrl+Alt, which is how Windows reports it) shows the AltGr layer, and AltGr
  // with Shift shows the AltGr+Shift layer. Caps Lock does not matter then.
  function showShift(e) {
    var shift = !!e.shiftKey, caps = !!(e.getModifierState && e.getModifierState("CapsLock"));
    var alt = altGrOn && !!((e.getModifierState && e.getModifierState("AltGraph")) || (e.ctrlKey && e.altKey));
    setShiftState(el("practiceKeyboard"), shift !== caps, shift, alt ? (shift ? "ags" : "ag") : null);
    el("capsWarning").hidden = !caps;
  }

  capture.addEventListener("keydown", function (e) {
    showShift(e);
    if (e.key === "Dead") {                     // the system is holding a dead key: nothing typed yet, move the hint on
      if (session && !locked && !session.finished) { osDead = true; render(); }
    } else if (e.key === "Backspace" && (pending || osDead)) {
      var wasSystem = osDead;                   // Backspace cancels a waiting dead key
      resetDead();
      if (!wasSystem || !composing) { e.preventDefault(); }   // (let the browser cancel its own composition)
      if (session && !locked) { render(); }
    } else if (e.key === "Backspace") {
      e.preventDefault();                       // never edit the hidden box
      if (session && !locked && session.backspace()) { render(); }
    } else if ((e.key === "Tab" || e.key === "Enter") && practiceVisible()) {
      e.preventDefault();                       // Tab must not leave the typing box, Enter must not press a button
      var symbol = specials[e.key] && specials[e.key].char;     // the symbol used in sentences for this key
      if (symbol) { handleChar(symbol); }
    }
  });
  capture.addEventListener("keyup", showShift);

  // Show a reminder if the typing box loses focus; clicking the page gives it back.
  // The hint is hidden with CSS "visibility" (class "show"), so it never moves the buttons.
  function practiceVisible() { return !el("page-practice").hidden; }
  capture.addEventListener("blur", function () {
    resetDead(); composing = false; capture.value = "";
    setShiftState(el("practiceKeyboard"), false, false);
    if (practiceVisible()) { el("focusHint").className = "show"; }
  });
  capture.addEventListener("focus", function () { el("focusHint").className = ""; });
  document.addEventListener("click", function () { if (practiceVisible()) { capture.focus(); } });

  // ---------------------------------------------------------------- Options page
  // A panel over Page 1 / Page 2. Dark/light and skin tone apply instantly (they only change CSS variables).
  // The language also applies instantly: setLanguage() swaps the wording and lesson and the page is redrawn,
  // so nothing ever needs to reload. Back closes the panel and changes nothing.
  var optionsFrom = "touch";      // the page that opened the panel, so it can be redrawn afterwards
  var optionsOpener = null;

  function radioRow(name, choices, current) {
    var row = make("div", "opt-row");
    choices.forEach(function (c) {
      var label = make("label");
      var input = make("input");
      input.type = "radio"; input.name = name; input.value = c[0]; input.checked = (c[0] === current);
      label.appendChild(input);
      label.appendChild(make("span", null, c[1]));
      row.appendChild(label);
    });
    return row;
  }

  function buildOptions() {
    var box = el("optionsBody");
    clear(box);

    var fs = make("fieldset");                                           // light / dark
    fs.appendChild(make("legend", null, ui.themeLabel));
    fs.appendChild(radioRow("theme", [["auto", ui.themeAuto], ["light", ui.themeLight], ["dark", ui.themeDark]], TT.prefs.theme()));
    box.appendChild(fs);

    fs = make("fieldset");                                               // hand skin tone
    fs.appendChild(make("legend", null, ui.skinLabel));
    var swatches = make("div", "swatches");
    TT.prefs.tones().forEach(function (tone) {
      var label = make("label", "swatch");
      var input = make("input");
      input.type = "radio"; input.name = "skin"; input.value = tone.id; input.checked = (tone.id === TT.prefs.skin());
      var dot = make("span", "dot");
      dot.style.background = tone.color;
      label.appendChild(input); label.appendChild(dot);
      label.appendChild(make("span", null, (ui.skinNames && ui.skinNames[tone.id]) || tone.id));
      swatches.appendChild(label);
    });
    fs.appendChild(swatches);
    box.appendChild(fs);

    var codes = Object.keys(TT.languages);                               // language: every file loaded in index.html
    if (codes.length > 1) {
      fs = make("fieldset");
      fs.appendChild(make("legend", null, ui.languageLabel));
      var select = make("select"); select.id = "optLang";
      codes.forEach(function (code) {
        var option = make("option", null, TT.languages[code].name || code);
        option.value = code; option.selected = (code === langCode);
        select.appendChild(option);
      });
      fs.appendChild(select);
      box.appendChild(fs);
    }
  }

  function openOptions(from) {
    optionsFrom = from;
    optionsOpener = document.activeElement;
    buildOptions();
    el("page-options").hidden = false;
    var first = el("optionsBody").querySelector("input:checked, select");
    if (first) { first.focus(); }
  }

  function closeOptions() {
    el("page-options").hidden = true;
    if (optionsOpener && optionsOpener.focus) { optionsOpener.focus(); }
  }

  function applyOptions() {
    var body = el("optionsBody");
    function checked(name) { var n = body.querySelector("input[name=" + name + "]:checked"); return n ? n.value : undefined; }
    var langSelect = el("optLang");
    var choice = { theme: checked("theme"), skin: checked("skin"), lang: langSelect ? langSelect.value : langCode };
    TT.prefs.set(choice);
    TT.prefs.applyTheme();                                               // instant: CSS variables
    TT.prefs.applySkin();
    var changed = choice.lang !== langCode;
    if (changed) {
      setLanguage(choice.lang);                                          // instant: new wording and lesson
      TT.progress.setLesson(lesson.id);
    }
    closeOptions();
    if (changed) { if (optionsFrom === "keys" || !cfg.showTouchTypingIntro) { showKeysPage(); } else { showTouchPage(); } }
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !el("page-options").hidden) { closeOptions(); }
  });

  // ---------------------------------------------------------------- buttons and start up
  el("touchNext").addEventListener("click", showKeysPage);
  el("keysBack").addEventListener("click", showTouchPage);
  el("startBtn").addEventListener("click", startPractice);
  el("practiceBack").addEventListener("click", showKeysPage);   // back to Page 2
  el("retryBtn").addEventListener("click", startPractice);
  el("resultsBack").addEventListener("click", showKeysPage);
  el("optionsBtn1").addEventListener("click", function () { openOptions("touch"); });
  el("optionsBtn2").addEventListener("click", function () { openOptions("keys"); });
  el("optionsApply").addEventListener("click", applyOptions);
  el("optionsBack").addEventListener("click", closeOptions);

  setLanguage(TT.prefs.lang());
  TT.progress.init(lesson.id);
  if (cfg.showTouchTypingIntro) { showTouchPage(); } else { showKeysPage(); }
})();
