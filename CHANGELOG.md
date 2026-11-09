# Changelog

LIT used three-digit version numbers up to 022. From 0.23.0 it uses `major.minor.patch`, like the other games made
with EduGame Kit.

## 0.23.0

- **Made with EduGame Kit.** LIT is a Scored Game: the kit's helper saves each lesson's best result (accuracy, then
  speed) on the edition's own scoreboard (`en-01`, `fr-01`, `es-01`), and the Kolibri Games plugin shows scoreboards
  from it. Kolibri still gets only the status `passed`, never a score. Saves from version 022 are not carried over.
- **The header** at the top of the page is the kit's: the lesson's title and the **Options** button, in the same place
  on every page. The title and version number LIT showed there before are gone.
- **Options** is the kit's panel: Appearance, Language, and LIT's hand skin tone. A learner who hasn't chosen a language
  gets Kolibri's (on the Kolibri Games games page), then the browser's. The language and skin tone are kept with the
  learner.
- **The "what is touch typing?" page belongs to each lesson**, in each language (`touchTyping` in the lesson's file),
  like the rest of the lesson's text. A lesson without it starts at the new keys.
- **New layout:** words in `lang/<language>.json`, keyboards in `keyboards/<language>.json`, and each lesson's editions
  in `lessons/NN/<language>.json`. Language codes are standard: `es-la` is now `es-419`, `en-gb` is `en-GB`. The UK
  keyboard uses the English lesson without a file of its own.
- **Zips** are made by `edugame build` (one per lesson, with every language, and `--each-language` for one language
  each) and named like `lit-lesson-01-fr-0.23.0.zip`. `build.py` is gone.
- The GitHub Pages site is made by `edugame pages`.
- New `tests/e2e_browser.py` plays every lesson in every language through the kit's test page.
