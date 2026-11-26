# Changelog

LIT used three-digit version numbers up to 022. From 0.23.0 it uses `major.minor.patch`, like the other games made
with EduGame Kit.

## 0.24.0

- **Fairer accuracy.** What is typed is lined up with the sentence, the way a spell-checker does (`js/align.js`): a
  wrong key, a missed letter, an extra key or two letters swapped is one mistake each, and everything typed after
  it still counts. (Before, every key was compared with the letter in the same place, so one missed or extra letter
  made the rest of the sentence wrong: 13% for one missed letter in a 24-letter sentence, now 96%.) Accuracy is
  (letters - mistakes) / letters; speed counts the letters typed right. A sentence ends when the typing reaches its
  last letter, so a missed letter no longer needs an extra key press.
- **Each kind of mistake is marked as it is typed**, with its own look (not colour alone): a wrong key in red with a
  badge showing the key typed, a missed letter as a dashed crossed-out box, a swapped pair in orange with a two-way
  arrow, an extra key as a small red tab between letters. A mark can change with the next key ("jule" is a wrong
  letter until "jule " shows the i was missed).
- **The results page lists the mistakes by kind, and the keys to practise** (the three letters that went wrong
  most often), in English, French and Spanish.
- `tests/engine_test.js` checks the counting (also run in the Build workflow); the browser test types a sentence
  with a missed letter and a swap in every lesson.
- **Page 1's picture is the lesson's own keyboard with the hands over it**, so every layout comes out right (the UK
  keyboard's short Shift and extra key, AZERTY ...). Keys are coloured by finger, and a lesson's intro chooses which
  keys show (`keys`: letters, shift, symbols or all). **Fingers reach for the keys a lesson teaches** (`reach`): a
  finger stretches up or curls down to the bottom row, the palm lifts for the number row and turns towards a Shift
  key, and the other fingers stay on their home keys. No outline on the hands, and the right hand rests turned 8
  degrees as real hands do. `tools/import_hands.py` now also cuts the resting hand into a palm and fingers.
- **Lessons 4-8 in English** (en and en-GB), from the lesson plan, with an intro picture of each reach: R and U, G and
  H, W and O, T and Y, Q and P (the whole top row of letters). Lesson 2 now has lesson 1's introduction.
- The browser test checks every fingertip lands on its key, in every lesson and language, and draws Shift,
  number-row and bottom-row reaches on each keyboard too.
- **Releases are bundles** (kit 0.3.4, `release-bundles`): `lit-all-languages-<version>.zip` and one for each language
  (`lit-en-<version>.zip` ...), each holding the lesson zips, instead of a zip for every lesson and language.
- **Lessons 2 and 3, in English** (en and en-GB), from the lesson plan: lesson 2, the right-hand home keys and the
  semicolon; lesson 3, E and I, the first keys off the home row, with an introduction about leaving the home row.
  Each lists its languages in `edugame.json` (`"languages": ["en", "en-GB"]`), so only English zips are made for
  it, and French and Spanish learners never get an English lesson.
- **Page 1 is each lesson's own introduction** (`intro`, was `touchTyping`, which still works), for anything that
  doesn't fit on the keys page. A lesson chooses its picture: `"hands"` (as before), `"none"`, or its own picture
  file. Paragraphs on Page 1 and Page 2 can have `**bold**` and `[E]` (a key drawn as a key).
- `tests/check_lessons.js` checks each lesson in its own languages, and fails if a language would get another
  language's lesson. The browser test plays every lesson in its languages and checks the introduction's formatting.
- **Kit updates come as pull requests.** The Build and GitHub Pages workflows call EduGame Kit's own, at a kit
  release (now 0.3.2), and Dependabot opens a pull request for each new kit release (and for the GitHub actions).
  The checks are now **Kit / Build**, **Kit / Browser** and **Kit / Real Kolibri**; **Checks passed** keeps its name.
- `tests/kolibri_play.py`: play steps for the kit's real-Kolibri test (it passes lesson 1, then checks the best result
  comes back).
- **Kit 0.3.2:** lesson 1 is played in a real Kolibri on every push (Kit / Real Kolibri, with `tests/kolibri_play.py`),
  every lesson and language in a browser (Kit / Browser, `tests/e2e_browser.py`), and the zips per language are
  built by the kit's workflow (`each-language`). The Zips per language job is gone.
- `tests/e2e_browser.py` ignores Chromium's warning about the kit's test page frame ("can escape its sandboxing"):
  the page sandboxes the game as Kolibri does. Every other warning still fails it.

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
