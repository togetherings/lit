/*
  tests/check_lessons.js - checks every lesson without a browser (used by the GitHub workflow; run it yourself with
  "node tests/check_lessons.js"). For each lesson folder, and each of the game's languages (edugame.json), it joins
  the nearest keyboard (keyboards/<language>.json) and lesson edition (lessons/NN/<language>.json), as the game does,
  and runs TT.checkLesson. ANY warning (a sentence that uses an untaught key, a key with no finger, a missing
  file ...) is an error. It also checks that every edition's board id is unique, and that each lesson is a package.
  A lesson is checked in its package's "languages" (all the game's languages if it doesn't list them), and each of
  those must have an edition in its own language: fr-CA may use fr.json and en-GB en.json, but French getting the
  English lesson (a missing fr.json) is an error. List only the languages a lesson is written in.
*/
const fs = require("fs"), path = require("path"), vm = require("vm");
const root = path.join(__dirname, "..");
const game = JSON.parse(fs.readFileSync(path.join(root, "edugame.json"), "utf8"));
let problems = 0;

// The nearest file for a language, as the kit's helper finds it: fr-CA, then fr, then the default language.
function nearest(dir, code) {
  const tries = [code, code.split("-")[0], game.languages[0]];
  for (const c of tries) {
    const f = path.join(root, dir, c + ".json");
    if (fs.existsSync(f)) { return { file: f, data: JSON.parse(fs.readFileSync(f, "utf8")) }; }
  }
  return null;
}

const boards = {};
fs.readdirSync(path.join(root, "lessons")).sort().forEach(function (lesson) {
  const dir = path.join(root, "lessons", lesson);
  if (!fs.statSync(dir).isDirectory()) { return; }
  const warnings = [];
  const sandbox = { console: { warn: function () { warnings.push(Array.prototype.join.call(arguments, " ")); }, log() {} } };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(root, "js/core.js"), "utf8"), sandbox);
  vm.runInContext("this.TT = TT", sandbox);
  vm.runInContext(fs.readFileSync(path.join(root, "js/engine.js"), "utf8"), sandbox);   // TT.parseChanges
  const pkg = (game.packages || []).find(p => p.config && p.config.lesson === lesson);
  if (!pkg) {
    warnings.push("no package in edugame.json has config.lesson \"" + lesson + "\"");
  }
  const languages = (pkg && pkg.languages) || game.languages;
  languages.forEach(function (code) {
    const kb = nearest("keyboards", code), les = nearest("lessons/" + lesson, code);
    if (!kb) { warnings.push(code + ": no keyboard"); return; }
    if (!les) { warnings.push(code + ": no lesson edition"); return; }
    const id = les.data.id, from = path.basename(les.file, ".json");
    if (from.split("-")[0] !== code.split("-")[0]) {
      warnings.push(code + ": no lessons/" + lesson + "/" + code + ".json, so it would get the " + from + " lesson. Write it, " +
                    "or leave " + code + " out of the package's \"languages\" in edugame.json");
      return;
    }
    // The menu (js/menu.js) finds each lesson's best result by this rule
    if (id !== from.split("-")[0] + "-" + lesson) { warnings.push(code + ": the board id must be \"" + from.split("-")[0] + "-" + lesson + "\", not \"" + id + "\" (js/menu.js relies on it)"); }
    if (boards[id] && boards[id] !== lesson + "/" + from) { warnings.push(code + ": the board id \"" + id + "\" is also used by lessons/" + boards[id]); }
    boards[id] = lesson + "/" + from;
    sandbox.kb = kb.data; sandbox.les = les.data; sandbox.code = code;
    const before = warnings.length;
    vm.runInContext("(function () { var l = TT.makeLanguage(kb, les, code); TT.normalizeLesson(l); TT.checkLesson(l); })()", sandbox);
    for (let i = before; i < warnings.length; i++) { warnings[i] = code + ": " + warnings[i]; }
  });
  if (warnings.length) { problems += warnings.length; console.error("Lesson " + lesson + ": " + warnings.length + " problem(s)"); warnings.forEach(w => console.error("  - " + w)); }
  else { console.log("Lesson " + lesson + ": OK (" + ((pkg && pkg.languages) || game.languages).join(", ") + ")"); }
});
if (problems) { process.exit(1); }
