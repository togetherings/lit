/*
  lessons/01/config.js - the settings for LESSON 1 that differ from the defaults in shared/config.js.
  build.py adds this to the end of the defaults, so anything you list here wins. Delete a line to go back to the
  default. (A setting that holds several values, such as thresholds, replaces the whole default, so give all of them.)
*/
Object.assign(TT.config, {
  showTouchTypingIntro: true      // Lesson 1 starts with Page 1 "What is touch typing?"; later lessons can set false

  // Other settings you may want to change for a lesson (see shared/config.js for what each one does):
  // thresholds: { accuracy: 90, wpm: 8 },
  // sentenceDelaySeconds: 0.5,
  // allowBackspace: false,
  // showShiftKeysOnPage1: false,
});
