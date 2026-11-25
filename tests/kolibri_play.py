"""
Play steps for EduGame Kit's real-Kolibri test (the "Real Kolibri" job in
.github/workflows/build.yml; on your own computer: edugame kolibri-test .).

The kit sets up a throwaway Kolibri, adds the first lesson's zip to a channel and opens it in
Learn as a learner (in English). It checks the save reaches Kolibri, fits SCORM 1.2 and comes
back next time; these steps play the lesson so there's something to save:

  1. first visit: Page 1 -> Page 2 -> practice, type every sentence, and see the lesson passed
     (Kolibri must count it as done, with no score);
  2. second visit: the lesson's best result is still there, on the edition's own board (en-01).

Not part of the game (edugame.json's exclude has tests/*).
"""
import re

SHOWN = "!document.getElementById('page-%s').hidden"


def first_visit(game):
    game.check(game.wait_for(SHOWN % "touch" + " || " + SHOWN % "keys"), "the lesson opened")
    if game.js(SHOWN % "touch"):                        # Page 1: what is touch typing?
        game.click("#touchNext")
    game.check(game.wait_for(SHOWN % "keys"), "Page 2: the new keys")
    game.click("#startBtn")
    total = int(re.search(r"(\d+)\D*$", game.text("#progressText")).group(1))
    for n in range(total):
        game.check(game.wait_for("/\\b%d\\b/.test(document.getElementById('progressText').textContent)" % (n + 1)),
                   "sentence %d of %d" % (n + 1, total))
        text = game.text("#sentence").replace(" ", " ")
        game.page.keyboard.type(text, delay=70)        # about 170 words a minute: fast, but possible
        game.page.wait_for_timeout(700)                 # the pause between sentences
    game.check(game.wait_for("!!document.querySelector('#resultsBody .pass')"), "the lesson is passed")
    game.shot("results")
    game.expect_complete = True                         # passed: Kolibri counts the lesson as done
    game.data["best"] = game.js("JSON.stringify(TT.progress.get())")


def came_back(game):
    game.check(game.wait_for("window.TT && TT.progress && TT.progress.get().done === 1"),
               "the lesson's best result came back")
    best = game.js("JSON.stringify(TT.progress.get())")
    game.check(best == game.data["best"], "the same best result as before: %s, %s" % (game.data["best"], best))
