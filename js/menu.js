/*
  menu.js - the menu of lessons (menu.html), on the website and in the offline copy.

  EduGame.site() (the EduGame Kit) lists the lessons in this page's language, each with its title, description,
  address and config (config.lesson: "03"). Each lesson is one button: the whole oval opens it. A passed lesson shows a
  tick and its best result; the first lesson not passed yet is highlighted as the next one. Every lesson stays open.
  A review (config.review) has a star for its number, and takes a whole row, under the lessons it covers.

  Results come from the helper (EduGame.ready().results): one board per lesson edition, named "<language>-<NN>" after
  the lesson file's language ("en-03" for en and en-GB, "es-01" for es-la). tests/check_lessons.js checks that rule.
*/
(function () {
  var t = EduGame.t;
  var site = EduGame.site();
  var results = {};

  function el(id) { return document.getElementById(id); }
  function make(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) { e.className = cls; }
    if (text != null) { e.textContent = text; }
    return e;
  }

  function board(pkg) { return site.language.split("-")[0].toLowerCase() + "-" + pkg.config.lesson; }

  // "LIT 3: Reaching up: E and I" -> "Reaching up: E and I" (the number is in the circle)
  function shortTitle(title) {
    var s = title.replace(/^LIT\s*\d+\s*:\s*/, "");
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function render() {
    var list = el("lessonList");
    while (list.firstChild) { list.removeChild(list.firstChild); }
    var passed = 0, nextShown = false;
    site.packages.forEach(function (pkg) {
      var review = !!pkg.config.review;            // a review: across both columns, under the lessons it covers
      var n = review ? null : parseInt(pkg.config.lesson, 10);
      var best = results[board(pkg)];
      var b = make("button", "lesson" + (review ? " review" : ""));
      b.type = "button";
      b.setAttribute("data-lesson", pkg.id);
      var text = make("span", "text");
      var name = make("span", "name", review ? pkg.title.replace(/^LIT\s+/, "") : (best ? n + ". " : "") + shortTitle(pkg.title));
      text.appendChild(name);
      if (best) {
        passed++;
        b.className += " passed";
        text.appendChild(make("span", "best", t("menuBest", { acc: EduGame.number(best.acc), wpm: EduGame.number(best.wpm) })));
      } else {
        text.appendChild(make("span", "about", pkg.description));
        if (!nextShown) {
          nextShown = true;
          b.className += " next";
          name.appendChild(document.createTextNode(" "));
          name.appendChild(make("span", "tag", t("menuNext")));
        }
      }
      var num = make("span", "num", best ? "✓" : (review ? "★" : String(n)));
      num.setAttribute("aria-hidden", "true");
      b.appendChild(num);
      b.appendChild(text);
      b.addEventListener("click", function () { EduGame.goTo(pkg.url); });
      var li = make("li", review ? "review" : null);
      li.appendChild(b);
      list.appendChild(li);
    });
    // Reviews aren't lessons: "3 of 16 passed" counts lessons only
    var lessons = site.packages.filter(function (p) { return !p.config.review; });
    var done = lessons.filter(function (p) { return results[board(p)]; }).length;
    el("menuSummary").textContent = t("menuPassed", { n: done, total: lessons.length });

    // Other languages with more lessons than this one
    var more = site.languages.filter(function (l) { return l.packages > site.packages.length; });
    el("moreNote").hidden = !more.length;
    el("moreNote").textContent = t("menuMore", { names: more.map(function (l) { return l.name; }).join(", ") });
  }

  // "Use LIT in your school": words with a {link} in them become text with a link
  function linked(id, key, url) {
    var box = el(id), parts = t(key).split("{link}");
    while (box.firstChild) { box.removeChild(box.firstChild); }
    box.appendChild(document.createTextNode(parts[0]));
    if (parts.length > 1) {
      var a = make("a", null, t(key + "Link"));
      a.href = url; a.target = "_blank"; a.rel = "noopener";
      box.appendChild(a);
      box.appendChild(document.createTextNode(parts[1]));
    }
  }
  function getSection() {
    linked("menuGetDownload", "menuGetDownload", TT.config.downloadUrl);
    ["Kolibri", "Scorm", "Rachel"].forEach(function (k) {
      var li = el("menuGet" + k), words = t("menuGet" + k).split("**");
      while (li.firstChild) { li.removeChild(li.firstChild); }
      li.appendChild(make("b", null, words[1] || ""));
      li.appendChild(document.createTextNode(words[2] || words[0]));
    });
    el("menuGetOffline").textContent = t("menuGetOffline");
    linked("menuGetCode", "menuGetCode", TT.config.codeUrl);
  }
  getSection();
  EduGame.on("languagechange", getSection);

  if (!site) {   // opened from a lesson's zip, where there is no menu
    el("lessonList").appendChild(make("li", null, "This page is only for the website."));
    return;
  }
  EduGame.ready().then(function (info) {
    results = info.results || {};
    render();
  });
})();
