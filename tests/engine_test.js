/*
  engine_test.js - checks the typing engine: how mistakes are counted (align.js) and how a session moves on.
  Run:  node tests/engine_test.js     (also run by the Build workflow)
*/
"use strict";
global.TT = {};
require("../js/align.js");
require("../js/engine.js");
const assert = require("assert");
let passed = 0;
function test(name, fn) { fn(); passed++; console.log("ok   " + name); }

const S = "julie liked a red ruler;";
function typeAll(sentences, keys, options) {
  const s = TT.createSession(sentences, options); let now = 0;
  for (const k of keys) { if (k === "\b") { s.backspace(); } else { s.type(k, now += 100); } }
  return s;
}

test("perfect typing: no mistakes, 100%", () => {
  const a = TT.align(S, S);
  assert.deepStrictEqual([a.at, a.mistakes, a.correct], [S.length, 0, S.length]);
  assert.strictEqual(typeAll([S], S).stats(10000).accuracy, 100);
});

for (const [kind, typed] of [["wrong", "julie loked a red ruler;"], ["missed", "jule liked a red ruler;"],
                             ["extra", "juliie liked a red ruler;"], ["swapped", "julie likde a red ruler;"],
                             ["missed", "julie likeda red ruler;"]]) {
  test(kind + ": one mistake, and everything after it still right (" + typed + ")", () => {
    const a = TT.align(S, typed);
    assert.strictEqual(a.at, S.length);
    assert.strictEqual(a.mistakes, 1);
    assert.strictEqual(a.count[kind], 1);
    const s = typeAll([S], typed);
    assert.ok(s.finished, "the sentence ends at its last letter, with no extra key");
    assert.strictEqual(s.stats(10000).accuracy, Math.round(100 * (S.length - 1) / S.length));    // 96%
  });
}

test("the marks: which letter is wrong, missed or swapped, and where an extra key was typed", () => {
  let a = TT.align(S, "julie loked");
  assert.deepStrictEqual(a.marks[7], { wrong: "o" });
  a = TT.align(S, "jule liked");
  assert.deepStrictEqual(a.marks[3], { missed: true });
  a = TT.align(S, "juliie");
  assert.deepStrictEqual(a.extras[3].concat(a.extras[4], a.extras[5]), ["i"]);     // either i of the doubled pair
  a = TT.align(S, "julie likde");
  assert.ok(a.marks[9].swapped && a.marks[9].first && a.marks[10].swapped);
});

test("a mark can change with the next key: a wrong letter becomes a missed one", () => {
  assert.deepStrictEqual(TT.align(S, "jule").marks[3], { wrong: "e" });
  const a = TT.align(S, "jule ");
  assert.deepStrictEqual([a.marks[3], a.marks[4], a.at], [{ missed: true }, { ok: true }, 6]);
});

test("part way through: the cursor follows the typing", () => {
  assert.strictEqual(TT.align(S, "").at, 0);
  assert.strictEqual(TT.align(S, "jul").at, 3);
  assert.strictEqual(TT.align(S, "jle ").at, 6);       // the u was left out: the cursor is after "julie "
});

test("several sentences: accuracy is (letters - mistakes) / letters over all of them", () => {
  const two = ["sad dads", "a fad"];
  const s = typeAll(two, "sad das" + "s" + "a fad");   // "dass": the last d typed as s, then the sentence ends
  assert.ok(s.finished);
  const st = s.stats(60000);
  assert.strictEqual(st.accuracy, Math.round(100 * (13 - 1) / 13));
  assert.deepStrictEqual(st.count, { wrong: 1, missed: 0, extra: 0, swapped: 0 });
  assert.deepStrictEqual(st.wrongKeys, { d: 1 });
});

test("speed: correct letters / 5 per minute of typing (pauses not counted)", () => {
  const s = TT.createSession(["aaaaa aaaa"]);
  let now = 0; for (const k of "aaaaa aaaa") { s.type(k, now); now += 6000; }   // 10 keys, the last at 54 s
  assert.strictEqual(s.stats(now).wpm, Math.round(10 / 5 / (54 / 60) * 10) / 10);
});

test("the clock stops between sentences, from one's last key to the next one's first key", () => {
  const s = TT.createSession(["ab", "cd"]);
  s.type("a", 0); s.type("b", 1000);                       // 1 s for the first sentence
  assert.strictEqual(s.elapsedMs(30000), 1000);            // waiting before the next sentence: not counted
  s.type("c", 60000); s.type("d", 61000);                  // 1 s for the second
  assert.ok(s.finished);
  assert.strictEqual(s.elapsedMs(90000), 2000);
});

test("planned changes: {typed>fixed} is parsed into the sentence as it ends up, and the steps", () => {
  const p = TT.parseChanges("The cat {sad>sat} on the {met>mat}.");
  assert.strictEqual(p.text, "The cat sat on the mat.");
  assert.deepStrictEqual(p.changes.map(c => [c.at, c.from, c.to, c.keep]), [[8, "sad", "sat", 2], [19, "met", "mat", 1]]);
  assert.deepStrictEqual(p.stages.map(st => st.kind + ":" + st.target),
    ["type:The cat sad", "delete:The cat sa", "type:The cat sat on the met", "delete:The cat sat on the m", "type:The cat sat on the mat."]);
  assert.strictEqual(TT.parseChanges("no changes.").stages.length, 1);
  assert.strictEqual(TT.parseChanges("{chair>banana} x").changes[0].keep, 0);
});

test("planned changes: type the first word, Backspace, then the fix; 100% when done right", () => {
  const S2 = "The cat {sad>sat} on the {met>mat}.";
  const s = typeAll([S2], "The cat sad\bt on the met\b\bat.", { allowBackspace: true, requireCorrect: true });
  assert.ok(s.finished);
  const st = s.stats(100000);
  assert.strictEqual(st.accuracy, 100);
  // Backspace is asked for: other keys typed then are mistakes to fix, and the step waits for them
  const w = typeAll([S2], "The cat sad", { allowBackspace: true, requireCorrect: true });
  assert.ok(w.wantsBackspace() && w.expectedChar() === "");
  w.type("x", 5000);
  assert.ok(w.wantsBackspace() && w.currentStage().kind === "delete");
  w.backspace(); w.backspace();
  assert.strictEqual(w.currentStage().kind, "type");
  assert.strictEqual(w.expectedChar(), "t");
  // without "fix every mistake", Backspace still works for a planned change
  const n = typeAll(["a {cat>cut}."], "a cat\b\but.");
  assert.ok(n.finished);
});

test("fix every mistake in some sentences only (a list with fixAll)", () => {
  const s = TT.createSession(["ab", "cd"], { allowBackspace: true, requireCorrect: [false, true] });
  assert.ok(!s.isStrict(0) && s.isStrict(1));
  s.type("a", 0); s.type("x", 100);                    // a mistake left in the first sentence: it still ends
  assert.strictEqual(s.sentenceIndex, 1);
  s.type("c", 200); s.type("x", 300);                  // in the second, it must be fixed
  assert.ok(!s.finished && s.wantsBackspace());
  s.backspace(); s.type("d", 400);
  assert.ok(s.finished);
  assert.strictEqual(s.stats(500).count.wrong, 1);     // only the first sentence's mistake is left
});

test("Backspace (when allowed) takes back the last key; a fixed mistake does not count", () => {
  const s = typeAll([S], "julie lo\bi" + S.slice(8), { allowBackspace: true });
  assert.ok(s.finished);
  assert.strictEqual(s.stats(10000).accuracy, 100);
  const off = typeAll([S], "jul\b", {});
  assert.strictEqual(off.typed[0], "jul\b".slice(0, 3), "without allowBackspace nothing is taken back");
});

test("'fix every mistake' mode: the sentence waits at its end until it is right", () => {
  const s = typeAll(["sad"], "sas", { allowBackspace: true, requireCorrect: true });
  assert.ok(!s.finished);
  assert.strictEqual(s.pos, 3);
  s.type("x", 1000);                                   // typing is ignored now: only Backspace helps
  assert.strictEqual(s.typed[0], "sas");
  s.backspace(); s.type("d", 2000);
  assert.ok(s.finished);
});

test("many mistakes never give less than 0%", () => {
  assert.strictEqual(typeAll(["ab"], "xyzab").stats(1000).accuracy, 0);
});

console.log(passed + " engine checks passed.");
