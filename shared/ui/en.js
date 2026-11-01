/*
  ui/en.js - THE WORDING shown on screen in this language: button labels, messages, the touch-typing
  introduction (Page 1) and the finger names. It holds no lesson content and nothing about the keyboard, so every
  keyboard that uses this language shares it (keyboards/en.js and keyboards/en-gb.js both use ui/en.js).
  {n}, {total}, {acc}, {wpm} etc. inside the texts are filled in by the program.
*/
(function () {
  TT.addUi({
    code: "en",

    ui: {
      appTitle: "LIT: Lessons In Typing",
      next: "Next",
      back: "Back",
      start: "Start typing",
      tryAgain: "Try again",
      backToKeys: "Back to the new keys",
      reviewKeys: "Review the new keys",
      whatIsTouchTyping: "What is touch typing?",
      newKeysHeading: "Keys you will learn",
      leftHeading: "Left Hand",
      rightHeading: "Right Hand",
      options: "Options",
      optionsTitle: "Options",
      themeLabel: "Appearance",
      themeAuto: "Automatic (match my device)",
      themeLight: "Light",
      themeDark: "Dark",
      skinLabel: "Hand skin tone",
      languageLabel: "Language",
      apply: "Apply",
      capsWarning: "\u26A0 Caps Lock is on",
      skinNames: { light: "Light", tan: "Tan", medium: "Medium", brown: "Brown", dark: "Dark", deep: "Deep" },
      alreadyCompleted: "You have already completed this lesson. Your best result: {acc}% accuracy at {wpm} words per minute. You can practise again any time.",
      timerLabel: "Time",
      handsRestAlt: "Top-down picture of two hands resting on the keyboard: eight fingers on the home row keys and both thumbs on the space bar.",
      handsBackAlt: "Picture of the backs of both hands. Each finger is coloured to match its keys on the keyboard, and the thumbs are grey.",
      sentenceOf: "Sentence {n} of {total}",
      strictNotice: "Fix every mistake with Backspace (\u2190) before the next sentence appears.",
      clickToType: "Click here, then start typing.",
      noSentences: "No practice sentences are set up for this lesson.",
      resultsPassed: "Lesson complete! Well done.",
      resultsNotYet: "Not quite yet - try again.",
      accuracyLine: "Accuracy: {acc}% (you need {needAcc}%)",
      wpmLine: "Speed: {wpm} words per minute (you need {needWpm})"
    },

    // Shown on Page 1 (can be switched off in config.js)
    introTouchTyping: [
      "Touch typing means typing without looking at the keyboard. Each finger has its own keys, so your fingers learn where everything is.",
      "Sit up straight, keep your wrists relaxed, and let your fingers rest on the home row. Always return to the home row after each key.",
      "Go slowly. Accuracy matters more than speed - speed comes by itself with practice."
    ],

    // Names shown in the list of new keys. They do not say "left" or "right": the column heading does.
    fingerNames: {
      lp: "little finger",
      lr: "ring finger",
      lm: "middle finger",
      li: "index finger",
      ri: "index finger",
      rm: "middle finger",
      rr: "ring finger",
      rp: "little finger",
      lt: "thumb",
      rt: "thumb"
    }
  });
})();
