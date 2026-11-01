/*
  lessons/01/en.js - LESSON 1 in this language: which keys are taught, the advice on Page 2 and the practice
  sentences. The keyboard is in keyboards/en.js and the on-screen wording in ui/en.js.

  TO MAKE THE NEXT LESSON: copy the whole lessons/01 folder to lessons/02, then change the lesson id, title,
  knownKeys, newKeys, intro and sentences in each file, and the settings in config.js.
*/
(function () {

  // ==================================================================
  // PRACTICE SENTENCE LISTS - up to FOUR lists. Each list has:
  //   name       shown above the typing box on Page 3 while that list's sentences are being
  //              typed. Use "" for no name (nothing is shown).
  //   count      how many sentences to pick, at random, from this list each attempt.
  //              0 means "do not use this list". (If count is bigger than the list, all are used.)
  //   sentences  the sentences themselves: type each one straight into the list, one per line,
  //              inside quote marks and followed by a comma. TO ADD A SENTENCE: add a new line.
  // An attempt types ALL of list 1's picks first, then list 2's, then list 3's, then list 4's.
  // An empty list, or a count of 0, is skipped. "Sentence n of x" counts everything picked.
  //
  // Rules for sentences: use real words, spaces between them, and only keys taught so far (the
  // program warns in the browser console if one is not allowed). Sentences do not need to make
  // sense in the first lessons. Lesson 1 has no end mark because ";" has not been taught. From the
  // next lessons on, end each sentence with ";" until "." is learned.
  // Special keys inside a sentence: write the symbol  ⇥  where the Tab key must be pressed and
  // ↵  where the Enter key must be pressed (the keys must be listed in the lesson's newKeys or
  // knownKeys as "Tab" / "Enter"). Capital letters and shifted symbols need the Shift keys
  // ("ShiftL" / "ShiftR") to be taught first.
  // ==================================================================
  var list1 = {
    name: "",
    count: 6,
    sentences: [
      "a sad dad adds a fad",
      "dads add fads as dad adds ads",
      "sad dads add sass",
      "a dad adds as a sad fad adds",
      "fads add a sass as dads add",
      "as a sad dad adds ads",
      "dad adds ads as a sad fad adds sass",
      "a fad adds sass as dads add ads",
      "sad dads add fads as sad dads add",
      "as dad adds a fad a sad dad adds ads",
      "dads add a sass as a sad fad adds",
      "a dad adds ads as sad dads add fads"
    ]
  };
  var list2 = { name: "", count: 0, sentences: [] };
  var list3 = { name: "", count: 0, sentences: [] };
  var list4 = { name: "", count: 0, sentences: [] };

  TT.addLesson({
    keyboard: "en",     // which keyboard file to use: keyboards/en.js
    ui: "en",              // which wording file to use: ui/en.js

    lesson: {
      id: "en-01",           // progress is saved under this name - do not change it later
      title: "Lesson 1: Left-hand home keys",

      // Hide a hand on Page 2: "left", "right" or "none" ("" also means none). The hidden hand is not
      // drawn (so its coloured fingertips and highlights are gone too) and its column of new keys is
      // not listed. Lesson 1 teaches only left-hand keys, so the right hand is hidden.
      hideHand: "right",

      // Key lists. Upper/lower case does not matter ("A" = "a", "TAB" = "Tab"). Use "space" (or " ") for the
      // space bar and "shift" for BOTH Shift keys (or "ShiftL" / "ShiftR" for one). Symbols and numbers are
      // taught in two states: list "1" to teach the key's normal symbol and "!" to teach its shifted symbol.
      knownKeys: [],                       // keys taught in EARLIER lessons (none yet)
      newKeys: ["a", "s", "d", "f", "space"],  // keys taught in THIS lesson

      // Advice shown on Page 2, above the list of keys and fingers
      intro: [
        "Rest the fingers of your left hand on the keys A, S, D and F. Your little finger goes on A, then ring finger on S, middle finger on D and index finger on F.",
        "Rest your thumbs lightly on the space bar. Press it with either thumb after every word.",
        "Keep your right hand relaxed beside the keyboard. You will learn its keys in the next lessons."
      ],

      sentenceLists: [list1, list2, list3, list4]
    }
  });
})();
