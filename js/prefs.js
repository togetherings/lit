/*
  prefs.js - the hands' skin tone, one of the learner's choices in the Options panel.

  The Options button and panel are the EduGame Kit's (edugame.js): Appearance (light, dark or auto) and Language
  come with it, and this file adds the skin tone. The choice is kept with the learner's save, so it follows them.
  Defaults come from config.js (skinTone, skinTones); the names are words in lang/ (skin.light, skin.dark ...).
  The tone is applied by changing CSS variables, so it shows straight away, even while the panel is open.
*/
TT.prefs = (function () {
  "use strict";

  function tones() { return TT.config.skinTones || []; }
  function toneFor(id) {
    var list = tones();
    for (var i = 0; i < list.length; i++) { if (list[i].id === id) { return list[i]; } }
    return list[0] || { id: "default", color: "#4a2c1b" };
  }

  EduGame.addOption({
    key: "skin", label: "option.skin", keep: "learner", "default": TT.config.skinTone,
    choices: tones().map(function (t) { return { value: t.id, label: "skin." + t.id, color: t.color }; })
  });

  function skin() { return EduGame.option("skin"); }

  // Darken a "#rrggbb" colour (used for the dark edge round the hands)
  function darken(hex, factor) {
    var n = parseInt(hex.replace("#", ""), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    function h(v) { v = Math.round(v * factor); return (v < 16 ? "0" : "") + v.toString(16); }
    return "#" + h(r) + h(g) + h(b);
  }
  // (id: the tone to show, while the learner tries them in the panel; otherwise their chosen one)
  function applySkin(id) {
    var tone = toneFor(id || skin()), root = document.documentElement;
    root.style.setProperty("--skin", tone.color);
    root.style.setProperty("--skin-outline", darken(tone.color, 0.62));
  }

  applySkin();
  EduGame.ready().then(function () { applySkin(); });     // the learner's own choice is in their save
  EduGame.on("optionchange", function (e) { if (e.key === "skin") { applySkin(e.value); } });

  return { skin: skin, tones: tones, applySkin: applySkin };
})();
