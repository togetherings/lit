/*
  ui/fr.js - THE WORDING shown on screen in this language: button labels, messages, the touch-typing
  introduction (Page 1) and the finger names. It holds no lesson content and nothing about the keyboard, so every
  keyboard that uses this language shares it (keyboards/en.js and keyboards/en-gb.js both use ui/en.js).
  {n}, {total}, {acc}, {wpm} etc. inside the texts are filled in by the program.
*/
(function () {
  TT.addUi({
    code: "fr",

    ui: {
      appTitle: "LIT : Lessons In Typing",
      next: "Suivant",
      back: "Retour",
      start: "Commencer \u00E0 taper",
      tryAgain: "R\u00E9essayer",
      backToKeys: "Retour aux nouvelles touches",
      reviewKeys: "Revoir les nouvelles touches",
      whatIsTouchTyping: "Qu'est-ce que la dactylographie ?",
      newKeysHeading: "Les touches \u00E0 apprendre",
      leftHeading: "Main gauche",
      rightHeading: "Main droite",
      options: "Options",
      optionsTitle: "Options",
      themeLabel: "Apparence",
      themeAuto: "Automatique (comme mon appareil)",
      themeLight: "Clair",
      themeDark: "Sombre",
      skinLabel: "Couleur de peau des mains",
      languageLabel: "Langue",
      apply: "Appliquer",
      capsWarning: "\u26A0 Le verrouillage des majuscules est activ\u00E9",
      skinNames: { light: "Claire", tan: "H\u00E2l\u00E9e", medium: "Moyenne", brown: "Brune", dark: "Fonc\u00E9e", deep: "Tr\u00E8s fonc\u00E9e" },
      alreadyCompleted: "Vous avez d\u00E9j\u00E0 termin\u00E9 cette le\u00E7on. Votre meilleur r\u00E9sultat : {acc} % de pr\u00E9cision \u00E0 {wpm} mots par minute. Vous pouvez vous entra\u00EEner \u00E0 nouveau quand vous voulez.",
      timerLabel: "Temps",
      handsRestAlt: "Vue de dessus de deux mains pos\u00E9es sur le clavier : huit doigts sur les touches de la rang\u00E9e de d\u00E9part et les deux pouces sur la barre d'espace.",
      handsBackAlt: "Image du dos des deux mains. Chaque doigt a la couleur de ses touches sur le clavier, et les pouces sont gris.",
      sentenceOf: "Phrase {n} sur {total}",
      strictNotice: "Corrigez chaque erreur avec la touche Retour arri\u00E8re (\u2190) avant que la phrase suivante apparaisse.",
      clickToType: "Cliquez ici, puis commencez \u00E0 taper.",
      noSentences: "Aucune phrase d'entra\u00EEnement n'est pr\u00E9vue pour cette le\u00E7on.",
      resultsPassed: "Le\u00E7on termin\u00E9e ! Bravo.",
      resultsNotYet: "Pas encore tout \u00E0 fait : r\u00E9essayez.",
      accuracyLine: "Pr\u00E9cision : {acc} % (il en faut {needAcc} %)",
      wpmLine: "Vitesse : {wpm} mots par minute (il en faut {needWpm})"
    },

    introTouchTyping: [
      "Taper \u00E0 l'aveugle, c'est taper sans regarder le clavier. Chaque doigt a ses propres touches : vos doigts apprennent o\u00F9 se trouve chaque lettre.",
      "Asseyez-vous bien droit, gardez les poignets d\u00E9tendus et posez les doigts sur la rang\u00E9e de d\u00E9part. Revenez toujours \u00E0 cette rang\u00E9e apr\u00E8s chaque touche.",
      "Allez doucement. La pr\u00E9cision compte plus que la vitesse : la vitesse vient toute seule avec l'entra\u00EEnement."
    ],

    fingerNames: {
      lp: "auriculaire",
      lr: "annulaire",
      lm: "majeur",
      li: "index",
      ri: "index",
      rm: "majeur",
      rr: "annulaire",
      rp: "auriculaire",
      lt: "pouce",
      rt: "pouce"
    }
  });
})();
