/*
  config.js - the DEFAULT settings for every lesson. Plain numbers / true-false, so it is safe to edit by hand.
  A lesson changes any of these in edugame.json: its package's "config": {"settings": {...}} (loader.js puts
  them over these). The version, the languages and the appearance a learner starts with are in edugame.json too.
*/
TT.config = {
  // ---------- PASS MARKS (change these to make the lesson easier or harder) ----------
  thresholds: {
    accuracy: 90,              // percent of keystrokes that must be correct
    wpm: 8                     // words per minute (one "word" = 5 characters)
  },

  // ---------- LESSON SETTINGS ----------
  sentenceDelaySeconds: 0.5,   // pause after each finished sentence before the next one appears.
                               // Typing is switched off during the pause. 0 = no pause.
  showTimer: true,             // small count-up timer in the corner of the practice page
  allowBackspace: false,       // false = wrong keys stay wrong. If true, accuracy is judged on the FINAL
                               // text (a mistake you have fixed with Backspace does not count against you).
                               // If this is true AND the accuracy
                               // pass mark above is 100, a sentence will not advance until every
                               // mistake has been fixed with Backspace (the timer keeps running).
                               // (How many sentences are picked is set per list in the lesson file.)

  // ---------- APPEARANCE ----------
  // Light, dark or auto, and the language, are the EduGame Kit's Options (edugame.json "options" sets the
  // appearance a learner starts with). The skin tone of the hands is LIT's own option in the same panel; the
  // learner's choice is kept with their save and wins over this default.
  skinTone: "dark",            // which skin tone the hands start with: one of the ids below
  skinTones: [                 // the choices in the Options panel (names are in lang/: skin.light, skin.tan ...)
    { id: "light",  color: "#f3d2b9" },
    { id: "tan",    color: "#dcaa7e" },
    { id: "medium", color: "#b97c4f" },
    { id: "brown",  color: "#8b5733" },
    { id: "dark",   color: "#4a2c1b" },
    { id: "deep",   color: "#2f1b10" }
  ],

  // ---------- IMAGES ----------
  // Pictures shown beside the text. The files live in the "images" folder of the zip.
  // Put a file name in quotes, or "" for no picture. Each place is set on its own.
  images: {
    folder: "images/",                  // folder (inside the zip) that holds the picture files
    intro:  "lion-placeholder.png",     // Page 1, floated to the right of the touch-typing text
    passed: "lion-placeholder.png",     // results page when the typing goal IS met
    failed: "lion-placeholder.png"      // results page when the typing goal is NOT met
  },

  // ---------- ON-SCREEN KEYBOARD ----------
  colorKeysOnPage1: true,      // colour the keys in Page 1's picture to match their fingers (the hands do not change)
  showShiftKeysOnPage1: false, // true = Page 1's picture also shows both Shift keys (coloured for the little fingers
                               // when colorKeysOnPage1 is on), shows lowercase keys, and shows capitals / shifted
                               // symbols while the mouse is over a Shift key. false = capital letters, no Shift keys.
  showKeyboard: true,          // draw the keyboard during practice
  showNextKeyHint: true        // outline the next key to press on that keyboard
};
