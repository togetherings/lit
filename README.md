# LIT: Lessons In Typing

A touch-typing tutor for the [Kolibri](https://learningequality.org/kolibri/) offline learning platform, in several
languages and keyboard layouts. Each lesson is an HTML5 app packaged as **one zip** (`index.html` at its root) that
you upload to a channel in Kolibri Studio as an HTML5 app. It is a Scored Game made with
[EduGame Kit](https://github.com/togetherings/edugame-kit), so the [Kolibri Games](https://github.com/togetherings/kolibri-games)
plugin can show scoreboards for it. Plain HTML, CSS and JavaScript: no frameworks, no network access, so it loads
quickly and works offline.

Each lesson walks the learner through: **1.** what is touch typing (optional) → **2.** the new keys and which
finger types each → **3.** typing practice with sentences → **4.** results. The lesson is *passed* when the accuracy
and speed targets in `config.js` are both reached. Every page's text belongs to the lesson, in each language.

## Get the zips

* **Releases** (right-hand side of the repository page): every version has one zip per lesson, in two forms:
  `lit-lesson-01-0.23.0.zip` (every language: the learner chooses in *Options*, and gets Kolibri's language until they
  do) and `lit-lesson-01-fr-0.23.0.zip` (a single language).
* **Live site** (GitHub Pages): https://togetherings.github.io/lit/ - every lesson with all its languages, to try or share
  a link. Nothing is reported to a coach there, and progress is kept in the browser only.
* Or build them yourself with [EduGame Kit](https://github.com/togetherings/edugame-kit) (see below).

## Repository layout

LIT is a Scored Game made with EduGame Kit. Three kinds of material, each in its own place: **words** in `lang/`,
**content** (keyboards and lessons) in `keyboards/` and `lessons/`, and **settings** in `config.js` and `edugame.json`.

```
edugame.json               the version, languages, scoring, and the packages: one zip per lesson
config.js                  the DEFAULT settings (pass marks, timer, pictures, skin tones ...)
index.html  css/  js/  images/      the page frame, look, program and pictures (the same for every lesson)
lang/<language>.json       the wording on screen in one language, and the finger and skin tone names
keyboards/<language>.json  one physical keyboard: rows, Shift/AltGr layers, dead keys, which finger types which key
lessons/
  01/                      LESSON 1, one edition per language:
    en.json  fr.json  es-419.json     the "what is touch typing?" page, keys taught, advice, practice sentences
art/                       the hand drawings (Inkscape SVGs): the source for js/hand-art.js
tools/import_hands.py      rebuilds js/hand-art.js from art/
tests/                     check_lessons.js (no browser needed), e2e_browser.py (plays every lesson and language)
.github/workflows/         checks and builds on every push; attaches the zips to a release; publishes the site
```

A *language* is a code: `en` (English, US keyboard), `en-GB` (English, UK keyboard), `fr` (French, AZERTY) and `es-419`
(Latin American Spanish). For each, the game takes the nearest file in `lang/`, `keyboards/` and the lesson's folder:
`en-GB` has its own keyboard, but no lesson file of its own, so it gets the English edition (`lessons/01/en.json`) and
`lang/en.json`'s words (`lang/en-GB.json` only names the language). So each lesson is written once per language.

**Every page of a lesson is the lesson's own**, in each edition: Page 1 (`touchTyping`: a title and paragraphs, the
"what is touch typing?" introduction; leave it out and the lesson starts at the new keys), Page 2 (`title`, `advice`,
the keys) and the sentences.

The **Options** button is EduGame Kit's, in the header at the top of the page: Appearance (light, dark or auto),
Language, and LIT's own choice, the hands' skin tone. The appearance is kept on the device; the language and skin tone
are kept with the learner, so they follow them in Kolibri.

## Building

Install EduGame Kit (`pip install git+https://github.com/togetherings/edugame-kit.git`), then:

```
edugame preview .                          play it in the kit's test page (as Kolibri, or as a website)
edugame preview . --lang fr                French only
edugame check .                            missing words, and other problems
edugame build . -o dist                    each lesson with every language: dist/lit-lesson-01-0.23.0.zip
edugame build . -o dist --each-language    each lesson, one language at a time: dist/lit-lesson-01-fr-0.23.0.zip
edugame build . --package lesson-01 --lang en,en-GB
edugame pages . -o site                    the GitHub Pages site: a front page and every lesson
```

## Releasing

1. Change `version` in `edugame.json` (for example `0.24.0`), add a line to `CHANGELOG.md`, and merge into `main`.
2. Publish a release on GitHub's Releases page with the tag `v0.24.0` (it must equal `v` + the version). The workflow
   builds every zip and attaches them to the release.

## GitHub Pages (the live site)

The `GitHub Pages` workflow publishes the site (`edugame pages`) every time `main` changes. **One-time setup:** in the
repository, Settings → Pages → Source = **GitHub Actions**. (Free Pages need a public repository.) Each lesson is a
package, with its own Play button on the front page.

## Making a new lesson

1. Copy `lessons/01` to `lessons/02`.
2. In each edition change `id` (`en-02` ... the lesson's scoreboard and the learner's best result are kept under it:
   never change it later), `title`, `touchTyping` (or leave it out to start at the new keys), `knownKeys` (keys taught
   in earlier lessons), `newKeys`, `advice` and the practice sentences.
3. Add the lesson to `packages` in `edugame.json` (copy lesson 1's: `id`, `title`, `description`, `files`, and
   `config.lesson`), with its title and description in each `lang/<language>.json` (`package.lesson_02` ...), and
   its scoreboards to `scoring.boards.names` (`"en-02": "board.en_02"` ...). Settings that differ for this lesson go in
   its package's `config.settings`, like `{"thresholds": {"accuracy": 95, "wpm": 12}}`.
4. Run `node tests/check_lessons.js`: it warns about any sentence using a key that has not been taught, and about
   keys without a finger. Then `edugame preview . --package lesson-02`.

Keys in `knownKeys` / `newKeys`: case does not matter (`"A"`, `"a"`, `"TAB"`); `"space"` is the space bar; `"shift"` is
both Shift keys (or `"ShiftL"` / `"ShiftR"`). Numbers and symbols are taught in two states: list `"1"` for the key's
normal symbol and `"!"` for its shifted one. In sentences, write `⇥` for the Tab key and `↵` for Enter.

Up to **four sentence lists** per lesson, each with a `name` (shown above the typing box, or `""`), a `count` (how many
to pick at random each attempt; `0` = unused) and the `sentences`. An attempt types list 1's picks, then list 2's, and so on.

## Adding a language or keyboard

* **New language**: run `edugame translate . sw`. It adds `sw` to `languages` in `edugame.json` and makes
  `lang/sw.json` with the English words to translate; put the language's own name in `_language`. Then add
  `keyboards/sw.json` (copy the nearest keyboard) and an edition of each lesson, `lessons/NN/sw.json`, written for
  that language and keyboard.
* **New keyboard for a language** (like `en-GB`): add the code to `languages`, `keyboards/<code>.json`, and a
  `lang/<code>.json` with just its `_language` name. It uses its base language's lessons and words until it has its own.
* Keyboard options: `isoEnter` (L-shaped Enter), `altGr` (an Alt and an AltGr key, plus two more layers on the keys),
  extra keys beside Left Shift, Right Shift and Backspace (put a character in that slot of `keyboardRows`), and
  `deadKeys`.
* **Dead keys**: `deadKeys` lists each dead character and what every following character becomes (`^` then `e` → `ê`).
  A dead key does nothing when pressed; on Page 3 the hint lights the dead key first, then the letter. Teach them by
  listing the dead character (and its shifted form) in `newKeys`; sentences may then contain the finished characters.
  On a keyboard without dead keys the program combines the keys itself; on one with them the system does.

## Reporting to Kolibri

When the pass marks are reached the SCORM 1.2 status `passed` is sent (Kolibri currently ignores `completed`). **No
score is ever sent**: Kolibri reads a score as "percent completed" and would not finish the lesson unless accuracy
reached 100%. EduGame Kit's helper keeps the best passed result (accuracy, then speed) for each edition's board
(`en-01`, `fr-01` ...) in SCORM `suspend_data`, so it follows the learner across devices, and the Kolibri Games plugin
shows scoreboards from it.

## Testing

```
node tests/check_lessons.js        lesson checks, no browser needed (this also runs in the workflow)
python3 -m tests.e2e_browser       plays every lesson in every language in Chromium (needs EduGame Kit and Playwright)
```

## Notes

* Hands: `art/left-hand-rest.svg` (Page 1) and `art/left-hand-open.svg` (Page 2) are the source drawings. After
  changing them run `python3 tools/import_hands.py` (needs numpy, scipy, opencv-python) to rebuild `js/hand-art.js`.
* The picture beside the text (`images/lion-placeholder.png`) is a placeholder; the file names are set in `config.js` (`images`).
* The AltGr layers of the UK and Latin American keyboards are not yet checked against the manufacturers' charts.

## Licence

MIT, see `LICENSE`. Check that you have the right to publish any pictures you add to `images/`.
