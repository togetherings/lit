/*
  ui/es.js - THE WORDING shown on screen in this language: button labels, messages, the touch-typing
  introduction (Page 1) and the finger names. It holds no lesson content and nothing about the keyboard, so every
  keyboard that uses this language shares it (keyboards/en.js and keyboards/en-gb.js both use ui/en.js).
  {n}, {total}, {acc}, {wpm} etc. inside the texts are filled in by the program.
*/
(function () {
  TT.addUi({
    code: "es",

    ui: {
      appTitle: "LIT: Lessons In Typing",
      next: "Siguiente",
      back: "Atr\u00E1s",
      start: "Empezar a escribir",
      tryAgain: "Intentar de nuevo",
      backToKeys: "Volver a las teclas nuevas",
      reviewKeys: "Repasar las teclas nuevas",
      whatIsTouchTyping: "\u00BFQu\u00E9 es la mecanograf\u00EDa al tacto?",
      newKeysHeading: "Teclas que aprender\u00E1s",
      leftHeading: "Mano izquierda",
      rightHeading: "Mano derecha",
      options: "Opciones",
      optionsTitle: "Opciones",
      themeLabel: "Apariencia",
      themeAuto: "Autom\u00E1tica (igual que mi dispositivo)",
      themeLight: "Claro",
      themeDark: "Oscuro",
      skinLabel: "Color de piel de las manos",
      languageLabel: "Idioma",
      apply: "Aplicar",
      capsWarning: "\u26A0 El bloqueo de may\u00FAsculas est\u00E1 activado",
      skinNames: { light: "Clara", tan: "Trigue\u00F1a", medium: "Media", brown: "Morena", dark: "Oscura", deep: "Muy oscura" },
      alreadyCompleted: "Ya completaste esta lecci\u00F3n. Tu mejor resultado: {acc} % de precisi\u00F3n a {wpm} palabras por minuto. Puedes practicar de nuevo cuando quieras.",
      timerLabel: "Tiempo",
      handsRestAlt: "Vista desde arriba de dos manos sobre el teclado: ocho dedos en las teclas de la fila base y los dos pulgares en la barra espaciadora.",
      handsBackAlt: "Imagen del dorso de ambas manos. Cada dedo tiene el color de sus teclas en el teclado, y los pulgares son grises.",
      sentenceOf: "Oraci\u00F3n {n} de {total}",
      strictNotice: "Corrige cada error con la tecla de borrar (\u2190) antes de que aparezca la siguiente oraci\u00F3n.",
      clickToType: "Haz clic aqu\u00ED y empieza a escribir.",
      noSentences: "Esta lecci\u00F3n no tiene oraciones de pr\u00E1ctica.",
      resultsPassed: "\u00A1Lecci\u00F3n completada! Muy bien.",
      resultsNotYet: "A\u00FAn no: int\u00E9ntalo de nuevo.",
      accuracyLine: "Precisi\u00F3n: {acc} % (necesitas {needAcc} %)",
      wpmLine: "Velocidad: {wpm} palabras por minuto (necesitas {needWpm})"
    },

    introTouchTyping: [
      "Escribir al tacto es escribir sin mirar el teclado. Cada dedo tiene sus propias teclas, as\u00ED que tus dedos aprenden d\u00F3nde est\u00E1 cada letra.",
      "Si\u00E9ntate derecho, mant\u00E9n las mu\u00F1ecas relajadas y apoya los dedos en la fila base. Despu\u00E9s de cada tecla, vuelve siempre a la fila base.",
      "Ve despacio. La precisi\u00F3n importa m\u00E1s que la velocidad: la velocidad llega sola con la pr\u00E1ctica."
    ],

    fingerNames: {
      lp: "me\u00F1ique",
      lr: "anular",
      lm: "dedo medio",
      li: "\u00EDndice",
      ri: "\u00EDndice",
      rm: "dedo medio",
      rr: "anular",
      rp: "me\u00F1ique",
      lt: "pulgar",
      rt: "pulgar"
    }
  });
})();
