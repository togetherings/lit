/*
  keyboards/fr.js - THE KEYBOARD: French with a standard French (AZERTY, ISO) keyboard.
  Everything about the physical keyboard lives here, so every lesson can share it: the rows of keys, the Shift /
  AltGr layers, dead keys, which finger types which key, and the names written on the special keys. It holds
  NO lesson text. The lesson (keys taught, advice, sentences) is in lessons/NN/fr.js and the on-screen wording
  is in ui/fr.js.

  TO ADD A KEYBOARD: copy the file that is closest, change the rows / maps / fingers, give it a new "code" and
  "name", then add a lessons/NN/<code>.js file for each lesson (it names this keyboard) and put the code in each
  lesson's language list (see build.py).
*/
(function () {
  TT.addKeyboard({
    code: "fr",                    // the file name, and the language code used everywhere else
    name: "Fran\u00E7ais (clavier AZERTY)",                     // shown in the Options page
    htmlLang: "fr",        // the language code written into the page (screen readers, hyphenation)

    // ================================================================
    // KEYBOARD: the standard French AZERTY layout (Windows "French"), with an ISO Enter and AltGr
    // ================================================================
    // See keyboards/en-gb.js for what the rows, the extra-key slots and the home-row key before Enter mean. Here the
    // key before Enter in the home row is the * key. The first key of the top row (the superscript 2 key) is
    // the one under Escape. The number row types punctuation: the digits are on Shift.
    keyboardRows: [
      ["\u00B2", "&", "\u00E9", "\"", "'", "(", "-", "\u00E8", "_", "\u00E7", "\u00E0", ")", "=", "", "Backspace"],
      ["Tab", "a", "z", "e", "r", "t", "y", "u", "i", "o", "p", "^", "$"],
      ["Caps", "q", "s", "d", "f", "g", "h", "j", "k", "l", "m", "\u00F9", "*", "Enter"],
      ["ShiftL", "<", "w", "x", "c", "v", "b", "n", ",", ";", ":", "!", "", "ShiftR"],
      [" "]
    ],

    keyboardOptions: { isoEnter: true, altGr: true },

    keyboardIndent: [0, 0, 0, 0, 3.75],

    keyBumps: ["f", "j"],

    specialKeys: {
      Tab:       { label: "Tab",       finger: "lp", width: 1.5,  char: "\u21E5" },
      Caps:      { label: "Verr. maj", finger: "lp", width: 1.75, caps: true },
      Enter:     { label: "Entr\u00E9e", finger: "rp", width: 2.25, char: "\u21B5" },
      Backspace: { label: "\u2190",    finger: "rp", width: 2, shortWidth: 1 },
      ShiftL:    { label: "Maj",       finger: "lp", width: 2.25, shortWidth: 1.25, shift: true },
      ShiftR:    { label: "Maj",       finger: "rp", width: 2.75, shortWidth: 1.75, shift: true },
      Alt:       { label: "Alt",       finger: "lt", width: 1.25 },
      AltGr:     { label: "Alt Gr",    finger: "rt", width: 1.25, altgr: true }
    },

    keyWidths: { " ": 6.25 },

    keyAliases: {
      space: " ", espace: " ",
      shift: ["ShiftL", "ShiftR"], maj: ["ShiftL", "ShiftR"],
      capslock: "Caps", "caps lock": "Caps", "verr. maj": "Caps", "verr maj": "Caps",
      "return": "Enter", "entr\u00E9e": "Enter",
      lshift: "ShiftL", rshift: "ShiftR", leftshift: "ShiftL", rightshift: "ShiftR",
      "alt gr": "AltGr", altgraph: "AltGr", "alt graph": "AltGr"
    },

    // ================================================================
    // DEAD KEYS
    // ================================================================
    // A dead key does nothing when it is pressed; the NEXT character typed is changed by it. On a French keyboard
    // there are two, both on the key to the right of P: the circumflex ^ (the key on its own) and the diaeresis
    // (trema) - which is the same key with Shift. (Both are listed below by the character they type.)
    // For each dead character, the table says what each following character becomes. The following character is
    // the one the learner types ("e", or "E" for a capital, which also needs Shift) and the result is what appears.
    // To teach them, list "^" (and the diaeresis for the Shift state) in newKeys / knownKeys, together with the
    // letters; a sentence may then use the finished characters. A character that is not in a table cannot be
    // modified: both characters are typed (as on a real keyboard). A result may be longer than one character
    // (typing ^ twice gives ^^).
    // The same key press is expected from the learner whatever their keyboard: on a French keyboard the system
    // combines the keys itself; on any other keyboard the program does the combining using these tables.
    deadKeys: {
      "^": {
        "a": "\u00E2", "e": "\u00EA", "i": "\u00EE", "o": "\u00F4", "u": "\u00FB",
        "A": "\u00C2", "E": "\u00CA", "I": "\u00CE", "O": "\u00D4", "U": "\u00DB",
        " ": "^", "^": "^^"
      },
      "\u00A8": {
        "a": "\u00E4", "e": "\u00EB", "i": "\u00EF", "o": "\u00F6", "u": "\u00FC", "y": "\u00FF",
        "A": "\u00C4", "E": "\u00CB", "I": "\u00CF", "O": "\u00D6", "U": "\u00DC", "Y": "\u0178",
        " ": "\u00A8", "\u00A8": "\u00A8\u00A8"
      }
    },

    // AltGr layer of the French keyboard. Not listed: the characters that are themselves dead keys on a French
    // keyboard (the tilde and the grave accent), which this program does not teach.
    altGrMap: {
      "\"": "#", "'": "{", "(": "[", "-": "|", "_": "\\", "\u00E0": "@", ")": "]", "=": "}",
      "e": "\u20AC", "$": "\u00A4"
    },
    altGrShiftMap: {},

    // What each key types while Shift is held. Letters simply become capitals. The number row types digits.
    shiftMap: {
      "&": "1", "\u00E9": "2", "\"": "3", "'": "4", "(": "5", "-": "6", "\u00E8": "7", "_": "8", "\u00E7": "9", "\u00E0": "0",
      ")": "\u00B0", "=": "+", "^": "\u00A8", "$": "\u00A3", "\u00F9": "%", "*": "\u00B5",
      "<": ">", ",": "?", ";": ".", ":": "/", "!": "\u00A7"
    },

    keyLabels: { " ": "Barre d'espace" },

    handsImageRows: ["azertyuiop", "qsdfghjklm", "wxcvbn,;:!"],

    fingerKeys: {
      lp: "aqw&\u00B2<",
      lr: "zsx\u00E9",
      lm: "edc\"",
      li: "rfvtgb'(",
      ri: "yhnuj,-\u00E8",
      rm: "ik;_",
      rr: "ol:\u00E7",
      rp: "pm!\u00E0)=^$\u00F9*",
      lt: " ",
      rt: " "
    },
    fingerHands: {
      lp: "left", lr: "left", lm: "left", li: "left", lt: "left",
      ri: "right", rm: "right", rr: "right", rp: "right", rt: "right"
    }
  });
})();
