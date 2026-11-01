# LIT: Lessons In Typing

A touch-typing tutor for the [Kolibri](https://learningequality.org/kolibri/) offline learning platform, in several
languages and keyboard layouts. Each lesson is an HTML5 app packaged as **one zip** (`index.html` at its root) that
you import into Kolibri as an HTML5 resource. Plain HTML, CSS and JavaScript: no frameworks, no network access, so it
loads quickly and works offline (and from `file://` for testing).

Each lesson walks the learner through: **1.** what is touch typing (optional) → **2.** the new keys and which
finger types each → **3.** typing practice with sentences → **4.** results. The lesson is *passed* when the accuracy
and speed targets in `config.js` are both reached.

## Get the zips

* **Releases** (right-hand side of the repository page): every tagged version has one zip per lesson, in two forms:
  `LIT-lesson01-all-v022.zip` (every language, the learner can switch in *Options*) and
  `LIT-lesson01-fr-v022.zip` (a single language).
* **Live site** (GitHub Pages): https://togetherings.github.io/lit/ - every lesson with all its languages, to try or share
  a link. Nothing is reported to a coach there, and progress is kept in the browser only.
* Or build them yourself: `python3 build.py --all` (zips go to `dist/`). See below.

## Repository layout

```
VERSION                    the version number (three digits); shown on the page and in the zip name
build.py                   makes the zips
shared/                    the same for every lesson
  index.html  config.js    the page frame, and the DEFAULT settings
  css/  js/  images/       look, program, pictures
  keyboards/<code>.js      one physical keyboard: rows, Shift/AltGr layers, dead keys, which finger types which key
  ui/<name>.js             the wording on screen in one language, and the finger names
lessons/
  01/                      LESSON 1
    config.js              settings that differ from the defaults for this lesson
    en.js  en-gb.js        the lesson for each keyboard: keys taught, advice, practice sentences
    fr.js  es-la.js
art/                       the hand drawings (Inkscape SVGs): the source for shared/js/hand-art.js
tools/import_hands.py      rebuilds shared/js/hand-art.js from art/
tests/                     check_lessons.js (no browser needed), browser_smoke.py (plays the built zips)
.github/workflows/         checks and builds on every push; attaches the zips to a release when you push a tag
```

A *language* is a **keyboard + wording + lesson** joined when the page starts. The language code is the keyboard's file
name (`en` US keyboard, `en-gb` UK, `fr` French AZERTY, `es-la` Latin American Spanish). Two keyboards can share the
same wording (`en` and `en-gb` both use `ui/en.js`), and a lesson file can say `lessonFrom: "en"` to reuse the
English lesson on another keyboard, so each lesson is written once.

## Building

```
python3 build.py 01                   lesson 01, every language in one zip
python3 build.py 01 --lang fr         lesson 01, French only (no language picker is shown)
python3 build.py 01 --lang en,en-gb   only those languages
python3 build.py 01 --default fr      the language shown first
python3 build.py --all                everything: each lesson "all" plus one zip per language
python3 build.py --site               the GitHub Pages site (folder site/): front page + every lesson, all languages
```

The zip's `config.js` is `shared/config.js` + `lessons/NN/config.js` + the version and language list that build.py adds.

## Releasing

1. Change `VERSION` (for example `023`), commit, and push to `main`. The workflow checks and builds everything.
2. Tag it: `git tag v023 && git push origin v023`. The workflow builds again and publishes a release with all the zips.
   (The tag must equal `v` + the contents of `VERSION`, otherwise the workflow stops.)

## GitHub Pages (the live site)

The workflow publishes `site/` (made by `build.py --site`) every time `main` changes. **One-time setup:** in the repository,
Settings → Pages → Source = **GitHub Actions**. (Free Pages need a public repository.) The site is at
`https://togetherings.github.io/lit/`, with each lesson at `/lesson01/`, `/lesson02/` ... A new lesson folder under
`lessons/` appears on the front page automatically. To look at it locally: `python3 build.py --site`, then
`python3 -m http.server -d site` and open http://localhost:8000/.

## Making a new lesson

1. Copy `lessons/01` to `lessons/02`.
2. In each language file change `id` (`en-02` ... progress is saved under it: never change it later), `title`,
   `knownKeys` (keys taught in earlier lessons), `newKeys`, `intro` and the practice sentences.
3. Set `showTouchTypingIntro: false` in `lessons/02/config.js` if the lesson should start at the new keys.
4. Run `node tests/check_lessons.js`: it warns about any sentence using a key that has not been taught, and about
   keys without a finger. Then `python3 build.py 02`.

Keys in `knownKeys` / `newKeys`: case does not matter (`"A"`, `"a"`, `"TAB"`); `"space"` is the space bar; `"shift"` is
both Shift keys (or `"ShiftL"` / `"ShiftR"`). Numbers and symbols are taught in two states: list `"1"` for the key's
normal symbol and `"!"` for its shifted one. In sentences, write `⇥` for the Tab key and `↵` for Enter.

Up to **four sentence lists** per lesson, each with a `name` (shown above the typing box, or `""`), a `count` (how many
to pick at random each attempt; `0` = unused) and the `sentences`. An attempt types list 1's picks, then list 2's, and so on.

## Adding a language or keyboard

* **New keyboard**: copy the nearest `shared/keyboards/*.js`, change the rows, maps and fingers, give it a new `code`
  and `name`. Then add `lessons/NN/<code>.js` for each lesson (it names the keyboard and wording to use).
* **New wording**: copy a `shared/ui/*.js` file and translate it.
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
reached 100%. Progress (best passed result) is saved in SCORM `suspend_data` and `localStorage`, so it follows the
learner across devices.

## Testing

```
node tests/check_lessons.js        lesson checks, no browser needed (this also runs in the workflow)
python3 build.py --all && python3 tests/browser_smoke.py     plays every built zip in Chromium (needs playwright)
```

## Notes

* Hands: `art/left-hand-rest.svg` (Page 1) and `art/left-hand-open.svg` (Page 2) are the source drawings. After
  changing them run `python3 tools/import_hands.py` (needs numpy, scipy, opencv-python) to rebuild `shared/js/hand-art.js`.
* The picture beside the text (`shared/images/lion-placeholder.png`) is a placeholder; the file names are set in `config.js` (`images`).
* The AltGr layers of the UK and Latin American keyboards are not yet checked against the manufacturers' charts.

## Licence

MIT, see `LICENSE`. Check that you have the right to publish any pictures you add to `shared/images`.
