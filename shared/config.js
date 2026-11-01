/*
  config.js - the DEFAULT settings for every lesson. Plain numbers / true-false, so it is safe to edit by hand.
  A lesson overrides any of these in its own lessons/NN/config.js; build.py puts the two together (this file
  first, then the lesson's overrides, then the version and language list) into the config.js inside each zip.
*/
TT.config = {
  // version, languages and language are written by build.py when it makes a zip (it adds them at the end of this
  // file), so the values here only matter if you open shared/index.html directly while developing.
  version: "dev",              // shown on the page (if showVersion is true); build.py uses the VERSION file
  showVersion: true,           // false = hide the version number in the page header
  // LANGUAGES: the codes of the files to load - each is a lesson/<code>.js file. The learner can pick between them on
  // the Options page. "language" is the one used first (until the learner chooses another).
  languages: [],
  language: "en",

  // ---------- PASS MARKS (change these to make the lesson easier or harder) ----------
  thresholds: {
    accuracy: 90,              // percent of keystrokes that must be correct
    wpm: 8                     // words per minute (one "word" = 5 characters)
  },

  // ---------- LESSON SETTINGS ----------
  showTouchTypingIntro: true,  // true = Page 1 "What is touch typing?" is shown first.
                               // Set to false in later lessons to start at the new keys.
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
  // theme: "auto" follows the device's light/dark setting, or force "light" or "dark".
  // The learner can change this (and the skin tone and language) in the Options page; their choice is
  // remembered in the browser and wins over these defaults.
  theme: "auto",
  skinTone: "dark",            // which skin tone the hands start with: one of the ids below
  skinTones: [                 // the choices in the Options page (names are in the language file: ui.skinNames)
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
