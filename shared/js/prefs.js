/*
  prefs.js - the learner's personal choices from the Options page, and applying them.

    theme     "auto" (follow the device's light/dark setting), "light" or "dark"
    skin      which skin tone the hands use (an id from config.js skinTones)
    lang      which language file to use (a code from the languages list in config.js)

  Defaults come from config.js. A choice made in the Options page is saved in the browser
  (localStorage, wrapped in try/catch because it can be blocked) and wins over the defaults.
  Theme and skin tone are applied by changing CSS variables, so they take effect INSTANTLY, with no
  reload. (Language is applied by app.js, which also rebuilds the page text without reloading.)
*/
TT.prefs = (function () {
  "use strict";
  var KEY = "lit_prefs";
  var saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { saved = {}; }
  var media = null;
  try { media = window.matchMedia("(prefers-color-scheme: dark)"); } catch (e) {}

  function tones() { return TT.config.skinTones || []; }
  function toneFor(id) {
    var list = tones();
    for (var i = 0; i < list.length; i++) { if (list[i].id === id) { return list[i]; } }
    return list[0] || { id: "default", color: "#4a2c1b" };
  }

  // ---- the current values (a saved choice, otherwise the config.js default) ----
  function theme() { return ["auto", "light", "dark"].indexOf(saved.theme) >= 0 ? saved.theme : TT.config.theme; }
  function skin() { return tones().some(function (t) { return t.id === saved.skin; }) ? saved.skin : TT.config.skinTone; }
  // The language to use first: the learner's saved choice, otherwise the default in config.js. Both must be
  // a language that was actually loaded (config.js languages); if not, the first loaded one is used.
  function lang() {
    var loaded = Object.keys(TT.languages);
    if (saved.lang && TT.languages[saved.lang]) { return saved.lang; }
    if (TT.languages[TT.config.language]) { return TT.config.language; }
    return loaded[0];
  }

  // "auto" is worked out from the device's own setting
  function resolvedTheme() {
    var t = theme();
    if (t === "auto") { return (media && media.matches) ? "dark" : "light"; }
    return t === "dark" ? "dark" : "light";
  }
  function applyTheme() { document.documentElement.setAttribute("data-theme", resolvedTheme()); }

  // Darken a "#rrggbb" colour (used for the dark edge round the hands)
  function darken(hex, factor) {
    var n = parseInt(hex.replace("#", ""), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    function h(v) { v = Math.round(v * factor); return (v < 16 ? "0" : "") + v.toString(16); }
    return "#" + h(r) + h(g) + h(b);
  }
  function applySkin() {
    var tone = toneFor(skin()), root = document.documentElement;
    root.style.setProperty("--skin", tone.color);
    root.style.setProperty("--skin-outline", darken(tone.color, 0.62));
  }

  // Remember choices. p may hold any of theme, skin, lang.
  function set(p) {
    ["theme", "skin", "lang"].forEach(function (k) { if (p[k] !== undefined) { saved[k] = p[k]; } });
    try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch (e) {}
  }

  // When the device switches between light and dark, follow it (only while the setting is "auto")
  if (media) {
    var follow = function () { if (theme() === "auto") { applyTheme(); } };
    if (media.addEventListener) { media.addEventListener("change", follow); } else if (media.addListener) { media.addListener(follow); }
  }

  applyTheme();       // as early as possible, so the page never flashes the wrong theme
  applySkin();

  return { theme: theme, skin: skin, lang: lang, tones: tones, set: set, applyTheme: applyTheme, applySkin: applySkin };
})();
