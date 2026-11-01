#!/usr/bin/env python3
"""
build.py - makes the zip files you upload to Kolibri.  (Needs only python3.)

Every zip is ONE lesson: index.html at the top, plus the shared program and the files of that lesson.

    python3 build.py 01                  lesson 01, ALL its languages in one zip   -> LIT-lesson01-all-v022.zip
    python3 build.py 01 --lang fr        lesson 01, French only                    -> LIT-lesson01-fr-v022.zip
    python3 build.py 01 --lang en,en-gb  lesson 01, only these languages           -> LIT-lesson01-en+en-gb-v022.zip
    python3 build.py --all               every lesson: the all-languages zip and one zip per language
    python3 build.py --site              a folder, site/, for GitHub Pages: every lesson with all its languages
    python3 build.py 01 --default fr     the language shown first (default: the first one, "en" if there is one)

The zips are written to the dist/ folder. The version number comes from the VERSION file and is shown on the page.

WHAT GOES IN A ZIP
    index.html, css/, js/, images/        from shared/                 (the same for every lesson)
    config.js                             shared/config.js + lessons/NN/config.js + the version and language list
    lesson/<code>.js                      from lessons/NN/             (keys taught, advice, sentences)
    keyboards/<code>.js, ui/<name>.js     from shared/                 (only the ones those lessons use)
A lesson file that says  lessonFrom: "en"  (such as lessons/01/en-gb.js) is replaced in the zip by a copy of that
lesson with the keyboard changed, so every zip is complete without the other languages.
"""
import argparse, os, re, sys, zipfile

ROOT = os.path.dirname(os.path.abspath(__file__))
SHARED = os.path.join(ROOT, "shared")
LESSONS = os.path.join(ROOT, "lessons")
DIST = os.path.join(ROOT, "dist")


def read(path):
    with open(path, encoding="utf-8") as f:
        return f.read()


def version():
    return read(os.path.join(ROOT, "VERSION")).strip()


def lesson_languages(lesson):
    """The language codes a lesson has: every lessons/NN/<code>.js except config.js. 'en' is listed first."""
    folder = os.path.join(LESSONS, lesson)
    if not os.path.isdir(folder):
        sys.exit("There is no folder lessons/%s" % lesson)
    codes = sorted(f[:-3] for f in os.listdir(folder) if f.endswith(".js") and f != "config.js")
    return sorted(codes, key=lambda c: (c != "en", c))


def resolved_lesson(lesson, code):
    """The text of lessons/NN/<code>.js, with 'lessonFrom' replaced by a real copy of the lesson it points to."""
    text = read(os.path.join(LESSONS, lesson, code + ".js"))
    m = re.search(r'lessonFrom:\s*"([^"]+)"', text)
    if not m:
        return text
    source = os.path.join(LESSONS, lesson, m.group(1) + ".js")
    if not os.path.isfile(source):
        sys.exit("lessons/%s/%s.js says lessonFrom \"%s\", but that file does not exist" % (lesson, code, m.group(1)))
    mine = text
    keyboard = re.search(r'keyboard:\s*"([^"]+)"', mine).group(1)
    ui = re.search(r'\bui:\s*"([^"]+)"', mine).group(1)
    copy = read(source)
    copy = re.sub(r'(keyboard:\s*)"[^"]*"', r'\1"%s"' % keyboard, copy, count=1)
    copy = re.sub(r'(\bui:\s*)"[^"]*"', r'\1"%s"' % ui, copy, count=1)
    return "/* lessons/%s/%s.js - a copy of lessons/%s/%s.js made by build.py for the %s keyboard. */\n%s" % (
        lesson, code, lesson, m.group(1), keyboard, copy)


def assemble(lesson, langs, default=None):
    """Collect the files of one lesson build. Returns (files, chosen): files maps each path inside the zip to its bytes."""
    available = lesson_languages(lesson)
    chosen = langs or available
    for c in chosen:
        if c not in available:
            sys.exit("Lesson %s has no language \"%s\" (it has: %s)" % (lesson, c, ", ".join(available)))
    first = default or chosen[0]
    if first not in chosen:
        sys.exit("--default \"%s\" is not one of the languages in this zip" % first)
    ver = version()

    # the files each language needs
    files = {}                                   # path inside the zip -> bytes
    keyboards, uis = set(), set()
    for c in chosen:
        text = resolved_lesson(lesson, c)
        files["lesson/%s.js" % c] = text.encode("utf-8")
        keyboards.add(re.search(r'keyboard:\s*"([^"]+)"', text).group(1))
        uis.add(re.search(r'\bui:\s*"([^"]+)"', text).group(1))
    for k in sorted(keyboards):
        path = os.path.join(SHARED, "keyboards", k + ".js")
        if not os.path.isfile(path):
            sys.exit("shared/keyboards/%s.js is missing" % k)
        files["keyboards/%s.js" % k] = read(path).encode("utf-8")
    for u in sorted(uis):
        path = os.path.join(SHARED, "ui", u + ".js")
        if not os.path.isfile(path):
            sys.exit("shared/ui/%s.js is missing" % u)
        files["ui/%s.js" % u] = read(path).encode("utf-8")

    # shared program files
    for folder in ("css", "js", "images"):
        for name in sorted(os.listdir(os.path.join(SHARED, folder))):
            with open(os.path.join(SHARED, folder, name), "rb") as f:
                files["%s/%s" % (folder, name)] = f.read()
    files["index.html"] = read(os.path.join(SHARED, "index.html")).encode("utf-8")

    # config.js = defaults + this lesson's settings + what the build decides
    cfg = read(os.path.join(SHARED, "config.js"))
    lesson_cfg = os.path.join(LESSONS, lesson, "config.js")
    if os.path.isfile(lesson_cfg):
        cfg += "\n\n// ===== Lesson %s settings (from lessons/%s/config.js) =====\n" % (lesson, lesson) + read(lesson_cfg)
    cfg += ("\n\n// ===== Written by build.py =====\nTT.config.version = \"%s\";\nTT.config.languages = [%s];\nTT.config.language = \"%s\";\n"
            % (ver, ", ".join('"%s"' % c for c in chosen), first))
    files["config.js"] = cfg.encode("utf-8")
    return files, chosen


def build(lesson, langs, default=None):
    """Make one zip. langs = list of language codes, or None for all of the lesson's languages."""
    files, chosen = assemble(lesson, langs, default)
    ver = version()
    os.makedirs(DIST, exist_ok=True)
    label = "all" if langs is None else "+".join(chosen)
    out = os.path.join(DIST, "LIT-lesson%s-%s-v%s.zip" % (lesson, label, ver))
    if os.path.exists(out):
        os.remove(out)
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
        for name in sorted(files, key=lambda n: (n != "index.html", n)):          # index.html first
            info = zipfile.ZipInfo(name, date_time=(2026, 1, 1, 0, 0, 0))          # fixed date: the same input gives the same zip
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o644 << 16
            z.writestr(info, files[name])
    print("%-48s %6.1f KB   languages: %s" % (os.path.basename(out), os.path.getsize(out) / 1024, ", ".join(chosen)))
    return out


def unescape(text):
    """Turn \\u00E9 written in a language file back into the character."""
    return re.sub(r"\\u([0-9A-Fa-f]{4})", lambda m: chr(int(m.group(1), 16)), text)


def build_site():
    """Make site/ for GitHub Pages: every lesson with all its languages, at site/lessonNN/, and a front page."""
    import html, shutil
    site = os.path.join(ROOT, "site")
    if os.path.isdir(site):
        shutil.rmtree(site)
    os.makedirs(site)
    items = []
    for lesson in sorted(d for d in os.listdir(LESSONS) if os.path.isdir(os.path.join(LESSONS, d))):
        files, chosen = assemble(lesson, None)
        for name, data in files.items():
            path = os.path.join(site, "lesson" + lesson, name)
            os.makedirs(os.path.dirname(path), exist_ok=True)
            with open(path, "wb") as f:
                f.write(data)
        first = resolved_lesson(lesson, chosen[0])
        title = unescape(re.search(r'title:\s*"([^"]*)"', first).group(1))
        names = [unescape(re.search(r'name:\s*"([^"]*)"', read(os.path.join(SHARED, "keyboards", c + ".js"))).group(1)) for c in chosen]
        items.append((lesson, title, names))
        print("site/lesson%s/   %s   languages: %s" % (lesson, title, ", ".join(chosen)))
    rows = "\n".join(
        '    <li><a href="lesson%s/">%s</a><span>%s</span></li>' % (n, html.escape(t), html.escape(" \u00B7 ".join(langs)))
        for n, t, langs in items)
    page = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>LIT: Lessons In Typing</title>
<style>
  :root { --bg: #d3e9f6; --card: #fffdf8; --ink: #1c3557; --soft: #5b6f8a; --accent: #f6c453; }
  @media (prefers-color-scheme: dark) { :root { --bg: #101a2b; --card: #17243a; --ink: #e8eef8; --soft: #9fb2cc; --accent: #c99a2e; } }
  body { margin: 0; background: var(--bg); color: var(--ink); font: 18px/1.5 system-ui, sans-serif; }
  main { max-width: 640px; margin: 0 auto; padding: 32px 16px; }
  .card { background: var(--card); border: 3px solid var(--ink); border-radius: 14px; padding: 24px; }
  h1 { margin: 0 0 4px; font-size: 1.6rem; }
  p { margin: 0 0 16px; color: var(--soft); }
  ul { list-style: none; margin: 0; padding: 0; }
  li { margin: 0 0 12px; }
  li a { display: block; padding: 12px 16px; border: 3px solid var(--ink); border-radius: 10px; background: var(--accent); color: #1c3557; font-weight: bold; text-decoration: none; }
  li a:hover, li a:focus-visible { outline: 3px solid var(--ink); outline-offset: 2px; }
  li span { display: block; margin-top: 4px; font-size: .9rem; color: var(--soft); }
  small { color: var(--soft); }
  small a { color: var(--ink); }
</style>
</head>
<body>
<main>
  <div class="card">
    <h1>LIT: Lessons In Typing</h1>
    <p>Learn to touch type. Choose a lesson; you can change the language in its Options page.</p>
    <ul>
%s
    </ul>
    <p><small>Version %s. Progress is saved in this browser only. For Kolibri, download the zip files from the <a href="https://github.com/togetherings/lit/releases">releases page</a>.</small></p>
  </div>
</main>
</body>
</html>
""" % (rows, version())
    with open(os.path.join(site, "index.html"), "w", encoding="utf-8") as f:
        f.write(page)
    open(os.path.join(site, ".nojekyll"), "w").close()       # tell GitHub Pages to serve the files exactly as they are


def main():
    ap = argparse.ArgumentParser(description="Build Kolibri-ready zips of LIT lessons.")
    ap.add_argument("lesson", nargs="?", help="lesson number, e.g. 01")
    ap.add_argument("--lang", help="only these language codes, comma separated (default: all of the lesson's languages)")
    ap.add_argument("--default", help="the language shown first")
    ap.add_argument("--all", action="store_true", help="build every lesson: all languages together, and each language alone")
    ap.add_argument("--site", action="store_true", help="build site/ for GitHub Pages (every lesson, all languages, with a front page)")
    args = ap.parse_args()
    if args.site:
        build_site()
    elif args.all:
        for lesson in sorted(d for d in os.listdir(LESSONS) if os.path.isdir(os.path.join(LESSONS, d))):
            langs = lesson_languages(lesson)
            build(lesson, None)
            if len(langs) > 1:
                for c in langs:
                    build(lesson, [c])
    elif args.lesson:
        build(args.lesson, args.lang.split(",") if args.lang else None, args.default)
    else:
        ap.error("give a lesson number (e.g. 01) or --all")


if __name__ == "__main__":
    main()
