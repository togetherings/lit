/*
  keyboards/en.js - THE KEYBOARD: English with a standard US (ANSI) keyboard.
  Everything about the physical keyboard lives here, so every lesson can share it: the rows of keys, the Shift /
  AltGr layers, dead keys, which finger types which key, and the names written on the special keys. It holds
  NO lesson text. The lesson (keys taught, advice, sentences) is in lessons/NN/en.js and the on-screen wording
  is in ui/en.js.

  TO ADD A KEYBOARD: copy the file that is closest, change the rows / maps / fingers, give it a new "code" and
  "name", then add a lessons/NN/<code>.js file for each lesson (it names this keyboard) and put the code in each
  lesson's language list (see build.py).
*/
(function () {
  TT.addKeyboard({
    code: "en",                    // the file name, and the language code used everywhere else
    name: "English (US keyboard)",                     // shown in the Options page
    htmlLang: "en-US",        // the language code written into the page (screen readers, hyphenation)

    // ================================================================
    // KEYBOARD: the rows that are drawn, names for special keys, and fingers
    // ================================================================
    // Each row is a list of keys. A single character is that key. Longer names (Tab, Caps, Enter,
    // Backspace, ShiftL, ShiftR) are special keys described in "specialKeys" below. The last row is the
    // space bar.
    //
    // NOTE 1 - the key just before Enter in the HOME ROW (the \ key here; on a UK keyboard it is #): that is where
    // it sits on an ISO keyboard. For the standard ANSI keyboard (the default) the program moves it automatically
    // to the end of the row above, where an ANSI keyboard has it (and makes it wider). So keep it in this row
    // whichever layout is used.
    //
    // NOTE 2 - EXTRA KEYS. Some keyboards (ISO, JIS and others) have one extra key next to a key that is
    // shorter on those keyboards. Each of these has a SLOT in its row:
    //     the entry right AFTER  "ShiftL"     = an extra key between Left Shift and Z
    //     the entry right BEFORE "ShiftR"     = an extra key between / and Right Shift
    //     the entry right BEFORE "Backspace"  = an extra key between = and Backspace
    // A slot holding "" means "no such key": nothing is drawn, and the special key beside it keeps its
    // normal width. Put the key's CHARACTER in the slot to show the key. It is then an ordinary symbol key
    // (like "[" or ";"): give the character a finger in fingerKeys, and a shifted symbol in shiftMap if it
    // has one. The special key beside it automatically switches to its shortWidth (see specialKeys) to make
    // room. Example - an extra key "<" between Left Shift and Z:   ["ShiftL", "<", "z", ...]   and add "<"
    // to fingerKeys.lp.
    keyboardRows: [
      ["`", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "=", "", "Backspace"],
      ["Tab", "q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "[", "]"],
      ["Caps", "a", "s", "d", "f", "g", "h", "j", "k", "l", ";", "'", "\\", "Enter"],
      ["ShiftL", "", "z", "x", "c", "v", "b", "n", "m", ",", ".", "/", "", "ShiftR"],
      [" "]
    ],

    // Keyboard shape options for this language. Turn each on (true) or off (false).
    //   isoEnter   the key before Enter (\ here) stays in the home row, and Enter becomes an L-shaped key two
    //              rows tall (narrower at the bottom). false = the ANSI shape: a wide Enter, with that key at the
    //              end of the row above.
    //   altGr      AltGr mode. Adds a plain Alt key to the left of the space bar (left thumb; it does nothing)
    //              and an AltGr key to its right (right thumb). The AltGr key adds two more layers to the
    //              letter and symbol keys, like Shift does: AltGr, and AltGr+Shift. They are defined by
    //              altGrMap and altGrShiftMap below. On Page 2, hovering AltGr shows its layer (it stays up to
    //              a second after the pointer leaves, so you can move on to Shift for the AltGr+Shift layer);
    //              on Page 3, holding AltGr (and Shift) does. Keys with no character in a layer show blank.
    // (The extra keys beside Left Shift, Right Shift and Backspace are not options: they appear when a
    // character is put in their slot in keyboardRows above.)
    keyboardOptions: { isoEnter: false, altGr: false },

    // How far each row is moved to the right, in key widths (only the space bar row needs it).
    keyboardIndent: [0, 0, 0, 0, 3.75],

    // Marks (little raised bars) drawn on these keys so fingers can find the home position
    keyBumps: ["f", "j"],

    // Keys that are not typed characters. Put the name (e.g. "Tab") in a lesson's newKeys or
    // knownKeys to teach it.
    //   label   what is written on the key      finger   which finger presses it
    //   width   key width in normal-key widths   char     the symbol used for it inside a sentence
    //   shortWidth   a narrower width, used automatically when an extra key is defined beside this key (see NOTE 2 above)
    //   shift   true for the two Shift keys (hovering/holding them shows capitals and shifted symbols)
    specialKeys: {
      Tab:       { label: "Tab",   finger: "lp", width: 1.5,  char: "\u21E5" },   // left little finger; sentences use ⇥
      Caps:      { label: "CAPS",  finger: "lp", width: 1.75, caps: true },   // caps: hovering/engaging it shows capital LETTERS only
      Enter:     { label: "Enter", finger: "rp", width: 2.25, char: "\u21B5" },   // right little finger; sentences use ↵
      Backspace: { label: "\u2190", finger: "rp", width: 2, shortWidth: 1 },       // shortWidth: used when an extra key is defined before it
      ShiftL:    { label: "Shift", finger: "lp", width: 2.25, shortWidth: 1.25, shift: true },   // shortWidth: used when an extra key is defined after it
      ShiftR:    { label: "Shift", finger: "rp", width: 2.75, shortWidth: 1.75, shift: true },   // shortWidth: used when an extra key is defined before it
      Alt:       { label: "Alt",   finger: "lt", width: 1.25 },                      // left of the space bar, left thumb. Does nothing. Shown only in AltGr mode
      AltGr:     { label: "AltGr", finger: "rt", width: 1.25, altgr: true }          // right of the space bar, right thumb. Hovering (Page 2) / holding it (Page 3) shows the AltGr layers. AltGr mode only
    },

    // Width of ordinary keys that are not one unit wide (the space bar)
    keyWidths: { " ": 6.25 },

    // Other names that may be used in knownKeys / newKeys (case does not matter). "shift" means both Shift keys.
    // The special key names above ("Tab", "enter", "CAPS" ...) work in any case without being listed here.
    keyAliases: {
      space: " ",
      shift: ["ShiftL", "ShiftR"],
      capslock: "Caps", "caps lock": "Caps",
      "return": "Enter",
      lshift: "ShiftL", rshift: "ShiftR", leftshift: "ShiftL", rightshift: "ShiftR",
      "alt gr": "AltGr", altgraph: "AltGr", "alt graph": "AltGr"
    },

    // The AltGr layers (used only when keyboardOptions.altGr is true). Each list maps a key's normal character to
    // the character it types with AltGr held, and with AltGr+Shift held. Keys not listed type nothing in that
    // layer (they show blank). To teach such a character, list it in newKeys / knownKeys like any other (an
    // accented letter is a letter, so "A-acute" and "a-acute" are one entry; it needs the AltGr key taught too).
    altGrMap: {},
    altGrShiftMap: {},

    // What each key types while Shift is held. Letters simply become capitals.
    shiftMap: {
      "`": "~", "1": "!", "2": "@", "3": "#", "4": "$", "5": "%", "6": "^", "7": "&", "8": "*", "9": "(", "0": ")",
      "-": "_", "=": "+", "[": "{", "]": "}", "\\": "|", ";": ":", "'": "\"", ",": "<", ".": ">", "/": "?"
    },

    keyLabels: { " ": "Space bar" },    // letters just use their own character

    // The three letter rows drawn in the picture of hands on the keyboard (Page 1). The fingers
    // rest on the 1st-4th and 7th-10th keys of the middle row.
    handsImageRows: ["qwertyuiop", "asdfghjkl;", "zxcvbnm,./"],

    // Which finger types which key. Finger ids are also used for colours in the CSS.
    // Every character key on the keyboard needs a finger here, including any extra key you add in keyboardRows.
    fingerKeys: {
      lp: "qaz1`",      // left little finger
      lr: "wsx2",       // left ring finger
      lm: "edc3",       // left middle finger
      li: "rfvtgb45",   // left index finger
      ri: "yhnujm67",   // right index finger
      rm: "ik,8",       // right middle finger
      rr: "ol.9",       // right ring finger
      rp: "p;/0-=[]\\'",  // right little finger
      lt: " ",          // left thumb   - the space bar is listed under BOTH thumbs, so either
      rt: " "           // right thumb    thumb may press it (a key may be listed under more than one finger)
    },
    // Which hand each finger belongs to. Page 2 lists left-hand keys under "Left" and right-hand keys under "Right".
    fingerHands: {
      lp: "left", lr: "left", lm: "left", li: "left", lt: "left",
      ri: "right", rm: "right", rr: "right", rp: "right", rt: "right"
    }
  });
})();
