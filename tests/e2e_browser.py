"""
Plays every lesson in Chromium on the EduGame Kit's test page (as a learning system, like Kolibri), in each
language: Page 1 -> 2 -> 3, types every sentence, and checks that

  * the lesson ends as passed, the learning system gets "passed" and no score, and the result is kept on
    the edition's own board (en-01, fr-01 ...)
  * the language changes in the kit's Options panel, with the lesson's own edition and keyboard
  * nothing is wider than a phone (390 px), and the browser shows no errors or warnings

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


def saved(page):
    store = page.evaluate("() => JSON.parse(localStorage.getItem('edugame-test-scorm:%s') || '{}')" % GAME.id)
    return store, json.loads(store.get("cmi.suspend_data") or "{}")


def play(page, game, lesson):
    game.locator("#startBtn").click()
    total = int(re.search(r"(\d+)\D*$", game.locator("#progressText").inner_text()).group(1))
    for n in range(total):
        game.locator("#progressText:has-text('%d')" % (n + 1)).wait_for()
        text = game.locator("#sentence").inner_text().replace(" ", " ")
        game.locator("#sentence").click()
        page.keyboard.type(text, delay=70)          # about 170 words a minute: fast, but possible
        page.wait_for_timeout(700)                   # the pause between sentences
    game.locator("#resultsBody .pass").wait_for()


def check(browser, base, package, lesson, shots):
    for code in GAME.languages:
        ed = edition(lesson, code)
        page = browser.new_page()
        page.goto(base)
        page.locator("#game").wait_for()
        page.locator("#reset").click()
        page.select_option("#mode", "scorm")
        page.select_option("#lang", code)
        game = page.frame_locator("#game")
        first = "#touchNext" if ed.get("touchTyping") else "#startBtn"
        game.locator(first).wait_for()
        assert game.locator("html").get_attribute("lang") == code, code
        if ed.get("touchTyping"):
            # Page 1 is the lesson's own, in its edition's language
            assert game.locator("#touchBody h2").inner_text() == ed["touchTyping"]["title"], code
            game.locator("#touchNext").click()
        assert game.locator("#keysBody h2").inner_text() == ed["title"], code
        play(page, game, lesson)
        store, record = saved(page)
        assert store["cmi.core.lesson_status"] == "passed" and "cmi.core.score.raw" not in store, store
        assert record[ed["id"]][0] == 100 and record[ed["id"]][2] == 1, record   # [accuracy, speed, plays]
        if shots and code == GAME.languages[0]:
            page.screenshot(path=os.path.join(shots, "%s-results.png" % package))
        # Phone width
        page.set_viewport_size({"width": 390, "height": 800})
        game.locator("#resultsBack").click()
        assert game.locator("body").evaluate("b => b.scrollWidth <= b.clientWidth + 1"), code
        page.close()


def check_options(browser, base, lesson, shots):
    """The kit's Options panel: the skin tone shows at once, the language brings the other edition and keyboard."""
    page = browser.new_page()
    page.goto(base)
    page.locator("#reset").click()
    page.select_option("#lang", "en")
    game = page.frame_locator("#game")
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
    assert game.locator(".key.caps").first.inner_text().strip() == "Verr. maj"       # the AZERTY keyboard
    page.locator("#reload").click()
    page.frame_locator("#game").locator("html[lang=fr]").wait_for()                   # kept with the learner
    page.close()


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
                                       pg.on("console", lambda m: m.type in ("error", "warning") and errors.append(m.text))))
        for pkg in GAME.packages():
            server = cli.make_preview_server(ROOT, 0, package=pkg["id"])
            threading.Thread(target=server.serve_forever, daemon=True).start()
            base = "http://127.0.0.1:%d/" % server.server_address[1]
            try:
                check(context, base, pkg["id"], pkg["config"]["lesson"], args.screenshots)
                check_options(context, base, pkg["config"]["lesson"], args.screenshots)
                print("%s: OK" % pkg["id"])
            finally:
                server.shutdown()
        browser.close()
    if errors:
        print("\n".join(errors))
        sys.exit("Browser errors (see above).")
    print("LIT browser test passed.")


if __name__ == "__main__":
    main()
