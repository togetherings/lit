#!/usr/bin/env python3
"""
tests/browser_smoke.py - opens the built zips (run build.py first) in a real browser and plays them.
Needs: pip install playwright && playwright install chromium.     Run:  python3 tests/browser_smoke.py
For every zip in dist/ and every language in it: Page 1 -> 2 -> 3, types every sentence correctly, checks that the
lesson ends as complete, that there were no console errors or warnings, and that nothing overflows a phone screen
(390 px wide). Zips with several languages must show the language picker on the Options page; a one-language zip must not.
"""
import glob, json, os, re, sys, tempfile, zipfile
from playwright.sync_api import sync_playwright

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
failures = []

def check(ok, what):
    if not ok:
        failures.append(what)
        print("  FAIL:", what)

with sync_playwright() as p, tempfile.TemporaryDirectory() as tmp:
    browser = p.chromium.launch()
    for zpath in sorted(glob.glob(os.path.join(ROOT, "dist", "*.zip"))):
        name = os.path.basename(zpath)
        folder = os.path.join(tmp, name[:-4])
        with zipfile.ZipFile(zpath) as z:
            z.extractall(folder)
        langs = json.loads(re.search(r"TT\.config\.languages = (\[.*?\]);", open(os.path.join(folder, "config.js"), encoding="utf-8").read()).group(1))
        print(name, langs)
        for code in langs:
            for width in (1000, 390):
                page = browser.new_page(viewport={"width": width, "height": 900})
                logs = []
                page.on("console", lambda m: logs.append(m.type + ": " + m.text) if m.type in ("warning", "error") else None)
                page.on("pageerror", lambda e: logs.append("pageerror: " + str(e)))
                page.add_init_script("localStorage.setItem('lit_prefs', %s)" % json.dumps(json.dumps({"lang": code})))
                page.goto("file://" + os.path.join(folder, "index.html"))
                page.wait_for_selector("#touchNext")
                page.click("#touchNext")
                if width == 1000:
                    page.click("#optionsBtn2")
                    has_picker = page.query_selector("#optLang") is not None
                    check(has_picker == (len(langs) > 1), "%s: language picker should %sbe shown" % (name, "" if len(langs) > 1 else "not "))
                    page.click("#optionsBack")
                page.click("#startBtn")
                if width == 1000:
                    total = int(re.search(r"(\d+)\D*$", page.inner_text("#progressText")).group(1))
                    for _ in range(total):
                        page.keyboard.type(page.inner_text("#sentence").replace(" ", " "))
                        page.wait_for_timeout(650)
                    check(page.is_visible("#resultsBody .pass"), "%s [%s]: the lesson did not end as passed" % (name, code))
                check(not page.evaluate("document.documentElement.scrollWidth > window.innerWidth"), "%s [%s] %dpx: page is wider than the screen" % (name, code, width))
                check(not logs, "%s [%s] %dpx: console problems: %s" % (name, code, width, logs))
                page.close()
    browser.close()
print("FAILED: %d" % len(failures) if failures else "All good")
sys.exit(1 if failures else 0)
