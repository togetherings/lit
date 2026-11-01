/*
  keyboards/es-la.js - THE KEYBOARD: Spanish with a Latin American keyboard (Windows "Spanish - Latin American", ISO shape).
  Everything about the physical keyboard lives here, so every lesson can share it: the rows of keys, the Shift /
  AltGr layers, dead keys, which finger types which key, and the names written on the special keys. It holds
  NO lesson text. The lesson (keys taught, advice, sentences) is in lessons/NN/es-la.js and the on-screen wording
  is in ui/es.js.

  TO ADD A KEYBOARD: copy the file that is closest, change the rows / maps / fingers, give it a new "code" and
  "name", then add a lessons/NN/<code>.js file for each lesson (it names this keyboard) and put the code in each
  lesson's language list (see build.py).
*/
(function () {
  TT.addKeyboard({
    code: "es-la",                    // the file name, and the language code used everywhere else
    name: "Espa\u00F1ol (teclado latinoamericano)",                     // shown in the Options page
    htmlLang: "es-419",        // the language code written into the page (screen readers, hyphenation)

    // ================================================================
    // KEYBOARD: the Windows "Spanish - Latin American" layout, ISO shape
    // ================================================================
    // See keyboards/en-gb.js for what the rows, the extra-key slots and the home-row key before Enter mean. Here the
    // key before Enter in the home row is the } key, and the { key beside it is an ordinary key.
    // The first key of the top row is the key left of 1 (| and a degree sign). The "<" key is the extra key
    // between Left Shift and Z.
    keyboardRows: [
      ["|", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "'", "\u00BF", "", "Backspace"],
      ["Tab", "q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "\u00B4", "+"],
      ["Caps", "a", "s", "d", "f", "g", "h", "j", "k", "l", "\u00F1", "{", "}", "Enter"],
      ["ShiftL", "<", "z", "x", "c", "v", "b", "n", "m", ",", ".", "-", "", "ShiftR"],
      [" "]
    ],

    keyboardOptions: { isoEnter: true, altGr: true },

    keyboardIndent: [0, 0, 0, 0, 3.75],

    keyBumps: ["f", "j"],

    specialKeys: {
      Tab:       { label: "Tab",        finger: "lp", width: 1.5,  char: "\u21E5" },
      Caps:      { label: "Bloq",       finger: "lp", width: 1.75, caps: true },
      Enter:     { label: "Enter",      finger: "rp", width: 2.25, char: "\u21B5" },
      Backspace: { label: "\u2190",     finger: "rp", width: 2, shortWidth: 1 },
      ShiftL:    { label: "Shift",      finger: "lp", width: 2.25, shortWidth: 1.25, shift: true },
      ShiftR:    { label: "Shift",      finger: "rp", width: 2.75, shortWidth: 1.75, shift: true },
      Alt:       { label: "Alt",        finger: "lt", width: 1.25 },
      AltGr:     { label: "Alt Gr",     finger: "rt", width: 1.25, altgr: true }
    },

    keyWidths: { " ": 6.25 },

    keyAliases: {
      space: " ", espacio: " ",
      shift: ["ShiftL", "ShiftR"], "may\u00FAs": ["ShiftL", "ShiftR"],
      capslock: "Caps", "caps lock": "Caps", "bloq may\u00FAs": "Caps", "bloq mayus": "Caps",
      "return": "Enter",
      lshift: "ShiftL", rshift: "ShiftR", leftshift: "ShiftL", rightshift: "ShiftR",
      "alt gr": "AltGr", altgraph: "AltGr", "alt graph": "AltGr"
    },

    // ================================================================
    // DEAD KEYS (see keyboards/fr.js for the full explanation)
    // ================================================================
    // This layout has one dead key: the acute accent (the key right of P), and the diaeresis on Shift.
    // The acute accent makes a, e, i, o, u (and y) into \u00E1 \u00E9 \u00ED \u00F3 \u00FA \u00FD; the diaeresis makes the
    // \u00FC of "ping\u00FCino". Not used in lesson 1: teach them later by listing "\u00B4" (and the diaeresis for Shift) in newKeys.
    deadKeys: {
      "\u00B4": {
        "a": "\u00E1", "e": "\u00E9", "i": "\u00ED", "o": "\u00F3", "u": "\u00FA", "y": "\u00FD",
        "A": "\u00C1", "E": "\u00C9", "I": "\u00CD", "O": "\u00D3", "U": "\u00DA", "Y": "\u00DD",
        " ": "\u00B4", "\u00B4": "\u00B4\u00B4"
      },
      "\u00A8": {
        "a": "\u00E4", "e": "\u00EB", "i": "\u00EF", "o": "\u00F6", "u": "\u00FC", "y": "\u00FF",
        "A": "\u00C4", "E": "\u00CB", "I": "\u00CF", "O": "\u00D6", "U": "\u00DC", "Y": "\u0178",
        " ": "\u00A8", "\u00A8": "\u00A8\u00A8"
      }
    },

    // AltGr layer. Only the characters I am sure of are listed (@ on AltGr+Q, the backslash on AltGr+apostrophe,
    // and the not-sign on the key left of 1). The AltGr layer also holds the tilde, ^ and ` (some of them dead
    // keys); add them here once checked against Microsoft's chart. Keys not listed show blank on AltGr.
    altGrMap: {
      "|": "\u00AC", "q": "@", "'": "\\"
    },
    altGrShiftMap: {},

    // What each key types while Shift is held. Letters simply become capitals.
    shiftMap: {
      "|": "\u00B0", "1": "!", "2": "\"", "3": "#", "4": "$", "5": "%", "6": "&", "7": "/", "8": "(", "9": ")", "0": "=",
      "'": "?", "\u00BF": "\u00A1", "\u00B4": "\u00A8", "+": "*", "{": "[", "}": "]",
      "<": ">", ",": ";", ".": ":", "-": "_"
    },

    keyLabels: { " ": "Barra espaciadora" },

    handsImageRows: ["qwertyuiop", "asdfghjkl\u00F1", "zxcvbnm,.-"],

    fingerKeys: {
      lp: "qaz1|<",
      lr: "wsx2",
      lm: "edc3",
      li: "rfvtgb45",
      ri: "yhnujm67",
      rm: "ik,8",
      rr: "ol.9",
      rp: "p\u00F1-0'\u00BF\u00B4+{}",
      lt: " ",
      rt: " "
    },
    fingerHands: {
      lp: "left", lr: "left", lm: "left", li: "left", lt: "left",
      ri: "right", rm: "right", rr: "right", rp: "right", rt: "right"
    }
  });
})();
