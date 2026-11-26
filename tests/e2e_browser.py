"""
Plays every lesson in Chromium on the EduGame Kit's test page (as a learning system, like Kolibri), in each
language: Page 1 -> 2 -> 3, types every sentence, and checks that

  * the lesson ends as passed, the learning system gets "passed" and no score, and the result is kept on
    the edition's own board (en-01, fr-01 ...)
  * the language changes in the kit's Options panel, with the lesson's own edition and keyboard
  * nothing is wider than a phone (390 px), and the browser shows no errors or warnings

Then the website (edugame pages, with menu.html) and its offline copy: the menu in the visitor's language, a passed
lesson's result on the menu, Next lesson, the header's Lessons link, and Options going to the other language's page.

    python -m tests.e2e_browser [--screenshots DIR]

Needs EduGame Kit (pip install git+https://github.com/togetherings/edugame-kit) and Playwright.
"""
import argparse
import json
import os
import re
import sys
import threading

from playwright.sync_api import sync_playwright

from edugame import cli, project as projects

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GAME = projects.load(ROOT)


def edition(lesson, code):
    """The lesson file a language gets: its own, its base language's, or the default's."""
    for c in (code, code.split("-")[0], GAME.languages[0]):
        path = os.path.join(ROOT, "lessons", lesson, c + ".json")
        if os.path.exists(path):
            with open(path, encoding="utf-8") as f:
                return json.load(f)


# The kit's test page sandboxes the game's frame as Kolibri does ("allow-scripts allow-same-origin"), and
# Chromium warns about that pairing on every page. It's the page, not the game: every other warning still fails.
SANDBOX_WARNING = "can escape its sandboxing"


def problem(message):
    return message.type == "error" or (message.type == "warning" and SANDBOX_WARNING not in message.text)


def check_hands(game, page, code):
    """Page 1's hands: every fingertip on its key (the key the lesson's intro says it reaches, or its home key),
    measured on the lesson's own keyboard. An intro with "reaches" has one picture for each, taking turns."""
    frames = page.get("reaches") or [{"reach": page.get("reach") or {}}]
    game.locator(".intro-keyboard svg.hands-real").first.wait_for()
    assert game.locator(".intro-keyboard svg.hands-real").count() == len(frames), code
    if len(frames) > 1:
        assert game.locator(".reach-frames button").count() == len(frames), code
        game.locator(".reach-frames button").nth(1).click()                   # a caption shows its picture
        assert game.locator(".intro-keyboard svg.hands-real").nth(1).evaluate("s => s.classList.contains('shown')"), code
    misses = game.locator(".intro-keyboard").evaluate("""holder => {
      const hb = holder.getBoundingClientRect(), out = [];
      holder.querySelectorAll("svg.hands-real [data-finger]").forEach(g => {
        const key = holder.querySelector('.key[data-key="' + CSS.escape(g.dataset.key) + '"]');
        const [x, y] = g.dataset.tip.split(",").map(Number);
        if (!key) { out.push(g.dataset.finger + ": no key " + g.dataset.key); return; }
        const r = key.getBoundingClientRect();
        if (x < r.left - hb.left || x > r.right - hb.left || y < r.top - hb.top || y > r.bottom - hb.top) {
          out.push(g.dataset.finger + " misses " + g.dataset.key + " (" + x + "," + y + ")");
        }
      });
      return out;
    }""")
    assert not misses, (code, misses)
    for n, frame in enumerate(frames):
        reach = frame.get("reach") or {}
        fingers = game.locator(".intro-keyboard svg.hands-real").nth(n).locator("[data-finger]").evaluate_all(
            "a => a.map(g => [g.dataset.finger, g.dataset.key])")
        assert len(fingers) == 8, (code, fingers)
        for finger, key in fingers:
            if finger in reach:
                assert key == reach[finger], (code, finger, key)


# Reaches no lesson uses yet, drawn on lesson 1's keyboard in each of its languages: every fingertip must
# still land on its key (Shift: the palm turns and slides; the number row: the palm lifts; the bottom row:
# fingers slide back under their knuckles).
REACHES = [
    {"lp": "ShiftL", "rp": "ShiftR"},
    {"lm": "3", "rr": "9"},
    {"lp": "z", "lr": "x", "lm": "c", "li": "v", "ri": "m", "rm": ",", "rr": ".", "rp": "/"},
    {"li": "b", "ri": "n"},
]


def check_more_reaches(game, code, shots, page):
    # each finger's home key, from lesson 1's own picture (where no finger reaches)
    home = dict(game.locator(".intro-keyboard svg.hands-real [data-finger]").evaluate_all("a => a.map(g => [g.dataset.finger, g.dataset.key])"))
    for n, reach in enumerate(REACHES):
        misses = game.locator(".intro-keyboard").evaluate("""(holder, [reach, home]) => {
          holder.querySelectorAll(".key.off").forEach(k => k.classList.remove("off"));
          const key = t => holder.querySelector('.key[data-key="' + CSS.escape(t) + '"]');
          const want = {};
          Object.keys(reach).forEach(f => { if (key(reach[f])) { want[f] = reach[f]; } });   // keys this layout has
          TT.hands.onKeyboard(holder, { key, home, reach: want, alt: "" });
          const hb = holder.getBoundingClientRect(), out = [];
          holder.querySelectorAll("svg.hands-real [data-finger]").forEach(g => {
            const r = key(g.dataset.key).getBoundingClientRect(), [x, y] = g.dataset.tip.split(",").map(Number);
            if (x < r.left - hb.left || x > r.right - hb.left || y < r.top - hb.top || y > r.bottom - hb.top) {
              out.push(g.dataset.finger + " misses " + g.dataset.key);
            }
          });
          return out;
        }""", [reach, home])
        assert not misses, (code, reach, misses)
        if shots:
            game.locator(".intro-keyboard").screenshot(path=os.path.join(shots, "reach-%s-%d.png" % (code, n)))


def saved(page):
    store = page.evaluate("() => JSON.parse(localStorage.getItem('edugame-test-scorm:%s') || '{}')" % GAME.id)
    return store, json.loads(store.get("cmi.suspend_data") or "{}")


def with_slips(text):
    """The sentence typed with two slips: a letter left out, and two neighbouring letters swapped."""
    gone = next(i for i in range(2, len(text) - 1) if text[i] != " " and text[i] != text[i + 1])
    t = text[:gone] + text[gone + 1:]
    sw = next(i for i in range(gone + 2, len(t) - 2) if t[i] != t[i + 1] and " " not in t[i:i + 2])
    return t[:sw] + t[sw + 1] + t[sw] + t[sw + 2:]


def play_stepwise(page, game, ed):
    """Plays a lesson with planned changes ({typed>fixed}: the Backspace lesson) or "fix every mistake", one key
    at a time as the page asks (#sentence's data-next: a character, or "Backspace"). In the last list it makes a
    mistake on purpose: the note must say how to fix it, and the sentence must wait until it is fixed."""
    game.locator("#startBtn").click()
    sentence, slipped, notes = game.locator("#sentence"), False, set()
    for _ in range(5000):
        if game.locator("#page-results").is_visible():
            break
        nxt = sentence.get_attribute("data-next")
        if not nxt:
            page.wait_for_timeout(100)
            continue
        note = game.locator("#sentence .type-note")
        if note.count():
            notes.add(note.inner_text().split()[0])
        if not slipped and "3 of 3" in game.locator("#listName").inner_text() and nxt != "q" and nxt != "Backspace":
            slipped = True
            page.keyboard.type("q")                                         # a real mistake
            assert sentence.get_attribute("data-next") == "Backspace"
            assert game.locator("#sentence .ch.bad").count() == 1
            assert "fix" in game.locator("#sentence .type-note").inner_text()
            continue
        if nxt == "Backspace":
            page.keyboard.press("Backspace")
        else:
            page.keyboard.type(nxt)
    game.locator("#resultsBody .pass").wait_for()
    assert slipped
    assert {"Type", "Press", "Now"} <= notes, notes                    # every kind of note was shown


def play(page, game, lesson, slips=False):
    """Plays the lesson. With slips, the first sentence has two (a missed letter and a swap): each must count as
    one mistake and be marked, and the sentence must end at its last letter, with no extra key."""
    game.locator("#startBtn").click()
    total = int(re.search(r"(\d+)\D*$", game.locator("#progressText").inner_text()).group(1))
    for n in range(total):
        game.locator("#progressText:has-text('%d')" % (n + 1)).wait_for()
        text = game.locator("#sentence").inner_text().replace("\u00a0", " ")
        game.locator("#sentence").click()
        page.keyboard.type(with_slips(text) if slips and n == 0 else text, delay=70)   # about 170 words a minute
        if slips and n == 0:
            marks = game.locator("#sentence .miss, #sentence .swap-first, #sentence .bad, #sentence .extra").count()
            assert marks == 2, "two slips, two marks (%d)" % marks
            assert game.locator("#sentence .ok").count() == len(text) - 3, "everything else stays right"
        page.wait_for_timeout(700)                   # the pause between sentences
    game.locator("#resultsBody .pass").wait_for()
    if slips:
        assert game.locator("#resultsBody .mistakes").inner_text().count("1") >= 2      # one missed, one swapped
        assert game.locator("#resultsBody .practise kbd").count() >= 1


def languages(package):
    """The languages a lesson is written in: its package's "languages", or all the game's."""
    pkg = next(p for p in GAME.packages() if p["id"] == package)
    return pkg.get("languages") or GAME.languages


def intro(ed):
    return ed.get("intro") or ed.get("touchTyping")


def check(browser, base, package, lesson, shots):
    for code in languages(package):
        ed = edition(lesson, code)
        page = browser.new_page()
        page.goto(base)
        page.locator("#game").wait_for()
        page.locator("#reset").click()
        page.select_option("#mode", "scorm")
        page.select_option("#lang", code)
        game = page.frame_locator("#game")
        first = "#touchNext" if intro(ed) else "#startBtn"
        game.locator(first).wait_for()
        if intro(ed) and intro(ed).get("picture", "hands") == "hands":
            check_hands(game, intro(ed), code)
            if lesson == "01":
                check_more_reaches(game, code, shots, page)
                page.goto(base)                                   # start again: the lesson's own picture
                page.locator("#game").wait_for()
                page.locator("#reset").click()
                page.select_option("#mode", "scorm")
                page.select_option("#lang", code)
                game.locator(first).wait_for()
        assert game.locator("html").get_attribute("lang") == code, code
        if intro(ed):
            # Page 1 is the lesson's own, in its edition's language, with **bold** and [E] keys drawn as keys
            assert game.locator("#touchBody h2").inner_text() == intro(ed)["title"], code
            text = " ".join(intro(ed)["paragraphs"])
            assert game.locator("#touchBody p kbd.keycap").count() == len(re.findall(r"\[[^\[\]\s][^\[\]]{0,11}\]", text)), code
            assert game.locator("#touchBody p strong").count() == len(re.findall(r"\*\*[^*]+\*\*", text)), code
            assert "**" not in game.locator("#touchBody").inner_text(), code
            if shots and code == languages(package)[0]:
                page.screenshot(path=os.path.join(shots, "%s-intro.png" % package))
            game.locator("#touchNext").click()
        if shots and code == languages(package)[0]:
            page.screenshot(path=os.path.join(shots, "%s-keys.png" % package))
        assert game.locator("#keysBody h2").inner_text() == ed["title"], code
        stepwise = bool(ed.get("allowBackspace"))
        if stepwise:
            play_stepwise(page, game, ed)
        else:
            play(page, game, lesson, slips=(code == languages(package)[0]))
        store, record = saved(page)
        assert store["cmi.core.lesson_status"] == "passed" and "cmi.core.score.raw" not in store, store
        slipped = code == languages(package)[0] and not stepwise   # two slips in the first sentence: 2 mistakes in all
        if ed.get("review"):
            # a review hides the keyboard while typing, and names the lesson to practise each key that went wrong
            assert game.locator("#practiceKeyboard").is_hidden()
            if slipped:
                assert "(lesson " in game.locator("#resultsBody .practise").inner_text(), package
        assert record[ed["id"]][2] == 1, record                                   # [accuracy, speed, plays]
        assert (90 <= record[ed["id"]][0] < 100) if slipped else record[ed["id"]][0] == 100, record
        if shots and code == languages(package)[0]:
            page.screenshot(path=os.path.join(shots, "%s-results.png" % package))
        # Phone width
        page.set_viewport_size({"width": 390, "height": 800})
        game.locator("#resultsBack").click()
        assert game.locator("body").evaluate("b => b.scrollWidth <= b.clientWidth + 1"), code
        page.close()


def check_options(browser, base, lesson, shots):
    """The kit's Options panel: the skin tone shows at once, the language brings the other edition and keyboard.
    (For lessons written in French too.)"""
    page = browser.new_page()
    page.goto(base)
    page.locator("#reset").click()
    page.select_option("#lang", "en")
    game = page.frame_locator("#game")
    if intro(edition(lesson, "en")):
        game.locator("#touchNext").click()
    game.locator(".eg-options-button").click()
    card = game.locator(".eg-card")
    card.locator("input[name=eg-opt-skin][value=light]").check()
    assert game.locator("html").evaluate("h => getComputedStyle(h).getPropertyValue('--skin').trim()") == "#f3d2b9"
    card.locator("label[lang=fr]").click()
    if shots:
        page.screenshot(path=os.path.join(shots, "options.png"))
    card.locator(".eg-primary").click()
    fr = edition(lesson, "fr")
    game.locator("#keysBody h2:has-text('%s')" % fr["title"]).wait_for()
    assert game.locator("#page-keys .key.caps").first.inner_text().strip() == "Verr. maj"       # the AZERTY keyboard
    page.locator("#reload").click()
    page.frame_locator("#game").locator("html[lang=fr]").wait_for()                   # kept with the learner
    page.close()


def serve_folder(folder):
    import functools
    from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

    class Quiet(SimpleHTTPRequestHandler):
        def log_message(self, *a):
            pass

    server = ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(Quiet, directory=folder))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    return server, "http://127.0.0.1:%d/" % server.server_address[1]


def check_site(browser, shots):
    """The website: lessons at /<language>/lesson-NN/, the menu at /<language>/, and the offline copy."""
    import shutil
    import tempfile
    import zipfile

    from playwright.sync_api import expect
    from edugame import pages

    work = tempfile.mkdtemp(prefix="lit-site-")
    pages.build_pages(GAME, os.path.join(work, "lit"))
    server, base = serve_folder(work)
    try:
        context = browser.new_context(locale="en-US", viewport={"width": 1000, "height": 800})
        context.on("page", lambda pg: pg.on("pageerror", lambda e: problems.append(str(e))))
        problems = []
        page = context.new_page()
        page.goto(base + "lit/")
        page.wait_for_url("**/lit/en/")
        lessons = page.locator("button.lesson")
        lessons.first.wait_for()
        assert lessons.count() == len(GAME.packages()), lessons.count()
        assert page.locator("button.lesson.next").get_attribute("data-lesson") == "lesson-01"
        assert page.locator("#moreNote").is_hidden()
        assert page.locator("#downloadLink").get_attribute("href").endswith("/lit/releases/latest")
        lessons.first.click()
        page.wait_for_url("**/lit/en/lesson-01/")
        assert page.locator(".eg-menu-link").inner_text().strip() == "Lessons"
        page.locator("#touchNext").click()
        play(page, page, "01")
        page.locator("#nextLessonBtn").click()                       # passed: on to lesson 2
        page.wait_for_url("**/lit/en/lesson-02/")
        page.locator(".eg-menu-link").click()
        page.wait_for_url("**/lit/en/")
        page.locator("button.lesson.passed").first.wait_for()
        assert page.locator("button.lesson.passed").count() == 1
        assert page.locator("button.lesson.next").get_attribute("data-lesson") == "lesson-02"
        assert "%" in page.locator("button.lesson.passed .best").inner_text()
        if shots:
            page.screenshot(path=os.path.join(shots, "site-menu.png"), full_page=True)
        lessons.nth(2).click()                                       # lesson 3, then British English: the same lesson
        page.wait_for_url("**/lit/en/lesson-03/")
        page.locator(".eg-options-button").click()
        page.locator("input[name=eg-language][value='en-GB']").check()
        page.locator(".eg-actions .eg-primary").click()
        page.wait_for_url("**/lit/en-gb/lesson-03/")
        page.locator(".eg-options-button").click()                   # French has no lesson 3: the French menu
        page.locator("input[name=eg-language][value=fr]").check()
        page.locator(".eg-actions .eg-primary").click()
        page.wait_for_url("**/lit/fr/")
        page.locator("button.lesson").first.wait_for()
        assert page.locator("button.lesson").count() == 1 and page.locator("#moreNote").is_visible()
        assert page.title() == GAME.text("title", "fr")
        if shots:
            page.screenshot(path=os.path.join(shots, "site-menu-fr.png"), full_page=True)
        page.goto(base + "lit/play/lesson-02/?lang=en")              # an old address
        page.wait_for_url("**/lit/en/lesson-02/")
        context.close()

        # The offline copy, opened from a folder
        folder = os.path.join(work, "offline")
        zipfile.ZipFile(pages.offline_zip(GAME, work)).extractall(folder)
        context = browser.new_context(locale="es-MX", viewport={"width": 1000, "height": 800})
        page = context.new_page()
        page.on("pageerror", lambda e: problems.append(str(e)))
        page.goto("file://" + os.path.join(folder, "index.html"))
        page.locator("button.lesson").first.wait_for()
        assert page.url.endswith("#es-la"), page.url
        page.locator("button.lesson").first.click()
        expect(page).to_have_url(re.compile("#es-la/lesson-01$"))
        page.locator("#touchNext").wait_for()
        page.locator(".eg-menu-link").click()
        expect(page).to_have_url(re.compile("#es-la$"))
        page.locator("button.lesson").first.wait_for()
        context.close()
        assert not problems, problems
    finally:
        server.shutdown()
        shutil.rmtree(work, ignore_errors=True)
    print("website and offline copy: OK")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--screenshots")
    args = parser.parse_args()
    if args.screenshots:
        os.makedirs(args.screenshots, exist_ok=True)
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch()
        context = browser.new_context(viewport={"width": 1100, "height": 900})
        context.on("page", lambda pg: (pg.on("pageerror", lambda e: errors.append(str(e))),
                                       pg.on("console", lambda m: problem(m) and errors.append(m.text))))
        for pkg in GAME.packages():
            server = cli.make_preview_server(ROOT, 0, package=pkg["id"])
            threading.Thread(target=server.serve_forever, daemon=True).start()
            base = "http://127.0.0.1:%d/" % server.server_address[1]
            try:
                check(context, base, pkg["id"], pkg["config"]["lesson"], args.screenshots)
                if "fr" in languages(pkg["id"]):
                    check_options(context, base, pkg["config"]["lesson"], args.screenshots)
                print("%s: OK" % pkg["id"])
            finally:
                server.shutdown()
        check_site(browser, args.screenshots)
        browser.close()
    if errors:
        print("\n".join(errors))
        sys.exit("Browser errors (see above).")
    print("LIT browser test passed.")


if __name__ == "__main__":
    main()
