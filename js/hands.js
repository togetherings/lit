/*
  hands.js - builds the two hand pictures as inline SVG.

    TT.hands.restingOnKeyboard(rows, alt, opts)
                                           Page 1: hands resting on the keys, slightly see-through
                                           so the keys show underneath. opts (all optional):
                                             keyFingers  character -> finger id: colour the keys by finger
                                             shift       { left: {label, finger}, right: {label, finger} }
                                                         also draw both Shift keys, show lowercase keys,
                                                         and carry capital labels for the SVG class "shifted"
                                             shiftOf     function(character) -> its shifted label
    TT.hands.backOfHands(alt, hide)        Page 2: the backs of both hands, each finger covered
                                           by a coloured shape. hide = "left" or "right" draws only
                                           the other hand (nothing of the hidden hand is drawn, so its
                                           coloured fingertips and highlight rings are gone too).
    TT.hands.openWidth(hide)               width of that picture in its own units (used to keep a
                                           single hand the same size as a hand in the two-hand picture)

  THE HAND SHAPES are SVG path data in js/hand-art.js. That file is made by tools/import_hands.py
  from the two drawings in the art/ folder (left-hand-rest.svg and left-hand-open.svg, drawn in
  Inkscape). This file only places them on the page, flips the left hand into a right hand,
  and gives each shape a CLASS NAME.

  COLOURS ARE NOT STORED IN THE SHAPES. They are set in css/style.css (the page's own CSS can
  restyle an SVG only because it is placed inline in the page, as it is here):
    --skin, --skin-outline, --hand-opacity   skin tone, edge colour, see-through level
    --f-lp ... --f-rt                        one colour per finger, thumbs included (shared with the keyboard)
    --hl                                     outline colour used when a finger is highlighted
  Change a colour there and the keyboard AND the hands both change.
*/
TT.hands = (function () {
  "use strict";

  function r1(n) { return Math.round(n * 10) / 10; }
  function esc(t) { return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;"); }

  // One hand: the skin outline, plus (optionally) a colour shape for each finger.
  // "ids" gives the finger ids for [pinky, ring, middle, index, thumb]; they match the CSS classes fo-xx.
  // After the colour caps come the HIGHLIGHT RINGS: the same shapes with no fill, hidden until
  // highlightFinger() switches one on (Page 2 does this when the pointer is over a key).
  function hand(art, ids) {
    var out = '<path class="skin" d="' + art.outline + '"/>';
    if (ids) {
      var names = ["pinky", "ring", "middle", "index", "thumb"], fing = ids, caps = "", rings = "";
      names.forEach(function (name, i) {
        caps += '<path class="fo fo-' + fing[i] + '" d="' + art.fingers[name] + '"/>';
        rings += '<path class="hr hr-' + fing[i] + '" d="' + art.fingers[name] + '"/>';
      });
      out += caps + rings;
    }
    return out;
  }

  // Switch the highlight ring of one finger on or off, in every SVG inside "root".
  // id is a finger id such as "li", or several separated by spaces ("lt rt" lights both thumbs, as for the
  // space bar). Pass id = null to clear everything.
  function highlightFinger(root, id) {
    Array.prototype.forEach.call(root.querySelectorAll(".hr.on"), function (e) { e.classList.remove("on"); });
    (id || "").split(/\s+/).filter(Boolean).forEach(function (one) {
      Array.prototype.forEach.call(root.querySelectorAll(".hr-" + one), function (e) { e.classList.add("on"); });
    });
  }

  // =============================================================== PAGE 1: HANDS ON THE KEYS
  // Keyboard behind the hands: three letter rows plus the space bar.
  // opts.keyFingers: when given, each key also gets a class hk-xx so the CSS can colour it like the
  // keyboard on Page 2. opts.shift: draw the two Shift keys, and write two labels on every key
  // (class "lo" = normal, class "up" = shifted); the CSS shows one or the other.
  function keysBehind(rows, opts) {
    var xs = [25, 37.5, 62.5], ys = [40, 90, 140], s = "";
    function cls(ch) { return (opts.keyFingers && opts.keyFingers[ch]) ? "hk hk-" + opts.keyFingers[ch] : "hk"; }
    function label(ch, x, y) {
      var at = ' x="' + (x + 22) + '" y="' + (y + 29) + '" text-anchor="middle">';
      if (!opts.shift) { return '<text class="hl"' + at + esc(ch.toUpperCase()) + '</text>'; }
      return '<text class="hl lo"' + at + esc(ch) + '</text><text class="hl up"' + at + esc(opts.shiftOf(ch)) + '</text>';
    }
    rows.forEach(function (row, r) {
      row.split("").forEach(function (ch, i) {
        var x = xs[r] + i * 50;
        s += '<rect class="' + cls(ch) + '" x="' + x + '" y="' + ys[r] + '" width="44" height="44" rx="7"/>' + label(ch, x, ys[r]);
        if (r === 1 && (i === 3 || i === 6)) {      // the little raised bars on F and J
          s += '<rect class="bump" x="' + (x + 14) + '" y="' + (ys[r] + 36) + '" width="16" height="3" rx="1.5"/>';
        }
      });
    });
    s += '<rect class="' + cls(" ") + '" x="149.5" y="190" width="270" height="44" rx="7"/>';
    if (opts.shift) {      // the two Shift keys, either side of the bottom letter row (hovering one shows capitals)
      [["left", -18.5], ["right", 562.5]].forEach(function (side) {
        var d = opts.shift[side[0]], c = (opts.keyFingers && d.finger) ? " hk-" + d.finger : "";
        s += '<rect class="hk hk-shift' + c + '" x="' + side[1] + '" y="140" width="75" height="44" rx="7"/>' +
             '<text class="hl sm" x="' + (side[1] + 37.5) + '" y="168" text-anchor="middle">' + esc(d.label) + '</text>';
      });
    }
    return s;
  }

  function restingOnKeyboard(rows, alt, opts) {
    opts = opts || {};
    var art = TT.handArt.rest, w = art.size[0];
    // With Shift keys drawn the picture is wider (still centred on the hands)
    var view = opts.shift ? "-72.5 30 714 320" : "0 30 " + w + " 320";
    return '<svg class="hands-svg" viewBox="' + view + '" role="img" aria-label="' + esc(alt) + '" xmlns="http://www.w3.org/2000/svg">' +
      keysBehind(rows, opts) +
      '<g class="hands-over">' + hand(art) +
      '<g transform="translate(' + w + ' 0) scale(-1 1)">' + hand(art) + '</g></g></svg>';
  }

  // ====================================================== PAGE 2: BACKS OF THE HANDS, COLOURED
  // The drawing is used at its own size. The right hand is the left hand mirrored, with a small gap
  // between the two thumbs. "box" is the left hand's bounding box: [left, top, right, bottom].
  function openGeometry(hide) {
    var art = TT.handArt.open, b = art.box, gap = 12, margin = 4;
    var mirror = b[2] + gap / 2;                     // x of the mirror line between the hands
    var full = 2 * mirror + b[0];                    // total width of both hands: the same margin on both sides
    if (hide === "right") { return { x: b[0] - 6, w: b[2] - b[0] + 12, mirror: mirror, left: true, right: false }; }
    if (hide === "left")  { return { x: 2 * mirror - b[2] - 6, w: b[2] - b[0] + 12, mirror: mirror, left: false, right: true }; }
    return { x: 0, w: full, mirror: mirror, left: true, right: true };
  }
  function openWidth(hide) { return openGeometry(hide).w; }

  function backOfHands(alt, hide) {
    var art = TT.handArt.open, b = art.box, margin = 4, g = openGeometry(hide);
    return '<svg class="hands-svg hands-open" viewBox="' + r1(g.x) + ' ' + (b[1] - margin) + ' ' + r1(g.w) + ' ' + r1(b[3] - b[1] + margin) +
      '" role="img" aria-label="' + esc(alt) + '" xmlns="http://www.w3.org/2000/svg">' +
      (g.left ? hand(art, ["lp", "lr", "lm", "li", "lt"]) : "") +
      (g.right ? '<g transform="translate(' + r1(2 * g.mirror) + ' 0) scale(-1 1)">' + hand(art, ["rp", "rr", "rm", "ri", "rt"]) + '</g>' : "") +
      '</svg>';
  }

  return { restingOnKeyboard: restingOnKeyboard, backOfHands: backOfHands, openWidth: openWidth, highlightFinger: highlightFinger };
})();
