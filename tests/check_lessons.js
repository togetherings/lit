/*
  tests/check_lessons.js - checks every lesson without a browser (used by the GitHub workflow; run it yourself with
  "node tests/check_lessons.js"). For each lesson folder it loads the shared core, every keyboard, wording and lesson
  file, joins them, and runs TT.checkLesson on each language. ANY warning (a sentence that uses an untaught key, a
  key with no finger, a missing file ...) is an error.
*/
const fs = require("fs"), path = require("path"), vm = require("vm");
const root = path.join(__dirname, "..");
let problems = 0;

function load(files, warn) {
  const sandbox = { console: { warn: warn, log() {} } };
  vm.createContext(sandbox);
  files.forEach(function (f) { vm.runInContext(fs.readFileSync(f, "utf8"), sandbox, { filename: f }); });
  return sandbox;
}

fs.readdirSync(path.join(root, "lessons")).sort().forEach(function (lesson) {
  const dir = path.join(root, "lessons", lesson);
  if (!fs.statSync(dir).isDirectory()) { return; }
  const codes = fs.readdirSync(dir).filter(f => f.endsWith(".js") && f !== "config.js").map(f => f.slice(0, -3));
  const warnings = [];
  const warn = function () { warnings.push(Array.prototype.join.call(arguments, " ")); };
  // the TT object lives in core.js ("var TT"), so run everything in one context
  const sandbox = { console: { warn: warn, log() {} } };
  vm.createContext(sandbox);
  const run = f => vm.runInContext(fs.readFileSync(f, "utf8"), sandbox, { filename: f });
  run(path.join(root, "shared/js/core.js"));
  run(path.join(root, "shared/config.js"));
  codes.forEach(c => run(path.join(dir, c + ".js")));
  const need = vm.runInContext("({kb: Object.keys(TT.lessons), ui: Object.keys(TT.lessons).map(function (k) { return TT.lessons[k].ui; })})", sandbox);
  need.kb.forEach(k => run(path.join(root, "shared/keyboards", k + ".js")));
  Array.from(new Set(need.ui)).forEach(u => run(path.join(root, "shared/ui", u + ".js")));
  vm.runInContext("TT.buildLanguages()", sandbox);
  const built = vm.runInContext("Object.keys(TT.languages)", sandbox);
  if (built.length !== codes.length) { warnings.push("only " + built.length + " of " + codes.length + " languages could be built"); }
  built.forEach(function (code) {
    vm.runInContext("(function () { var l = TT.languages['" + code + "']; TT.normalizeLesson(l); TT.checkLesson(l); })()", sandbox);
  });
  if (warnings.length) { problems += warnings.length; console.error("Lesson " + lesson + ": " + warnings.length + " problem(s)"); warnings.forEach(w => console.error("  - " + w)); }
  else { console.log("Lesson " + lesson + ": OK (" + built.join(", ") + ")"); }
});
if (problems) { process.exit(1); }
