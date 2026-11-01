/*
  lessons/01/es-la.js - LESSON 1 in this language: which keys are taught, the advice on Page 2 and the practice
  sentences. The keyboard is in keyboards/es-la.js and the on-screen wording in ui/es.js.

  TO MAKE THE NEXT LESSON: copy the whole lessons/01 folder to lessons/02, then change the lesson id, title,
  knownKeys, newKeys, intro and sentences in each file, and the settings in config.js.
*/
(function () {

  // ==================================================================
  // PRACTICE SENTENCE LISTS - up to FOUR lists (name, count, sentences). See lessons/01/en.js for the full explanation.
  // Only real words that can be made with A S D F: a, as (ace), asa (handle), asada (roast), da / das (gives),
  // dada (given), fa (the note F) and their plurals. The sentences do not have to make sense. Lesson 1 has no end
  // mark (the "." key is not taught yet).
  // ==================================================================
  var list1 = {
    name: "",
    count: 6,
    sentences: [
      "asa asada da asas",
      "dada asada as asa",
      "fa da as dadas asas",
      "asadas dadas as fa",
      "da fa as asa dada",
      "das asas as asadas",
      "asa fa dadas da as",
      "as asadas das fa asa",
      "dadas as da asada fas",
      "fa das asas dada as",
      "asada asa fa as dadas",
      "das fas da asadas asa"
    ]
  };
  var list2 = { name: "", count: 0, sentences: [] };
  var list3 = { name: "", count: 0, sentences: [] };
  var list4 = { name: "", count: 0, sentences: [] };

  TT.addLesson({
    keyboard: "es-la",     // which keyboard file to use: keyboards/es-la.js
    ui: "es",              // which wording file to use: ui/es.js

    lesson: {
      id: "es-01",           // progress is saved under this name - do not change it later
      title: "Lecci\u00F3n 1: las teclas base de la mano izquierda",

      hideHand: "right",     // "left", "right" or "none": see lessons/01/en.js

      knownKeys: [],                              // keys taught in EARLIER lessons (none yet)
      newKeys: ["a", "s", "d", "f", "space"],     // keys taught in THIS lesson

      intro: [
        "Coloca los dedos de tu mano izquierda sobre las teclas A, S, D y F. El me\u00F1ique va en la A, el anular en la S, el dedo medio en la D y el \u00EDndice en la F.",
        "Apoya suavemente los pulgares en la barra espaciadora. Presi\u00F3nala con cualquiera de los dos pulgares despu\u00E9s de cada palabra.",
        "Deja la mano derecha relajada junto al teclado. Aprender\u00E1s sus teclas en las pr\u00F3ximas lecciones."
      ],

      sentenceLists: [list1, list2, list3, list4]
    }
  });
})();
