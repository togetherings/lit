/*
  lessons/01/fr.js - LESSON 1 in this language: which keys are taught, the advice on Page 2 and the practice
  sentences. The keyboard is in keyboards/fr.js and the on-screen wording in ui/fr.js.

  TO MAKE THE NEXT LESSON: copy the whole lessons/01 folder to lessons/02, then change the lesson id, title,
  knownKeys, newKeys, intro and sentences in each file, and the settings in config.js.
*/
(function () {

  // ==================================================================
  // PRACTICE SENTENCE LISTS - up to FOUR lists (name, count, sentences). See lessons/01/en.js for the full explanation.
  // The home keys Q S D F make no real French words, so lesson 1 uses made-up words. The lesson has no end mark
  // (the ";" key is not taught yet).
  // ==================================================================
  var list1 = {
    name: "",
    count: 6,
    sentences: [
      "sqd fsq dfs qdf sfq",
      "fsd qsf dqs sdq fqd",
      "qds fdq sfd dsq qfs",
      "dqf sqs fds qdd sff",
      "qsd dsf fqs sfd dqs fsq",
      "sdf qdq fss dfd qsq",
      "dsq fdf sqf qqs dds ffq",
      "fqs sdd qfd dfq sqq fsf",
      "qdf sfs dqd fdq ssq dff",
      "sfq dds qfs fdd sqs dqf",
      "fds qfq sdq dsd ffs qsf",
      "dqs fsd sfs qdd fqf sdq"
    ]
  };
  var list2 = { name: "", count: 0, sentences: [] };
  var list3 = { name: "", count: 0, sentences: [] };
  var list4 = { name: "", count: 0, sentences: [] };

  TT.addLesson({
    keyboard: "fr",     // which keyboard file to use: keyboards/fr.js
    ui: "fr",              // which wording file to use: ui/fr.js

    lesson: {
      id: "fr-01",           // progress is saved under this name - do not change it later
      title: "Le\u00E7on 1 : les touches de d\u00E9part de la main gauche",

      hideHand: "right",     // "left", "right" or "none": see lessons/01/en.js

      knownKeys: [],                              // keys taught in EARLIER lessons (none yet)
      newKeys: ["q", "s", "d", "f", "space"],     // keys taught in THIS lesson

      intro: [
        "Posez les doigts de votre main gauche sur les touches Q, S, D et F. L'auriculaire va sur Q, l'annulaire sur S, le majeur sur D et l'index sur F.",
        "Posez doucement vos pouces sur la barre d'espace. Appuyez dessus avec l'un ou l'autre pouce apr\u00E8s chaque mot.",
        "Gardez la main droite d\u00E9tendue \u00E0 c\u00F4t\u00E9 du clavier. Vous apprendrez ses touches dans les le\u00E7ons suivantes.",
        "Ces touches ne forment aucun vrai mot fran\u00E7ais : les phrases d'entra\u00EEnement sont faites de mots invent\u00E9s."
      ],

      sentenceLists: [list1, list2, list3, list4]
    }
  });
})();
