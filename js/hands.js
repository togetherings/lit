/*
  hands.js - builds the two hand pictures as inline SVG.

    TT.hands.onKeyboard(holder, opts)      Page 1: the hands over the lesson's real keyboard (the one in "holder"),
                                           each fingertip on its home key or reaching for the key the lesson
                                           teaches. See "PAGE 1" below for opts.
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

  // ======================================================== PAGE 1: HANDS ON THE REAL KEYBOARD
  // The hands lie over the keyboard the lesson draws itself (built from keyboards/*.json, so ANSI, ISO and
  // AZERTY all come out right). Each fingertip is aimed at the measured centre of its key.
  //
  // The resting hand is cut into a palm and four fingers (tools/import_hands.py: js/hand-art.js "rest").
  // A finger turns about the middle of its knuckle; a round knuckle as wide as the finger covers the join.
  //   - Reaching UP a finger stretches; reaching DOWN (curling) it keeps its shape and slides back under
  //     its knuckle, so its tip stays round.
  //   - SHIFT: the little finger presses it near its inner end, and the palm turns a little (SHIFT_TURN)
  //     and slides part of the way (FOLLOW) towards it; the other fingers stay on their home keys.
  //   - THE NUMBER ROW: the palm lifts (LIFT rows); the other fingers stay on their home keys.
  //   - The right hand rests a little turned (RIGHT_POSE: wrist out, fingers pointing in), as real hands do,
  //     so its fingers curl towards the thumb on the bottom row, like the left hand's.
  // No outline: the pieces would show their joins. The hands are see-through as one shape (.hands-over).
  //
  // opts:
  //   key(token)   the key element for a token ("a", ";", "ShiftL", " " ...), from the lesson's keyboard
  //   home         finger id -> its home key's token: {lp: "a", lr: "s", ... rp: ";"}
  //   reach        finger id -> the token it reaches for: {lm: "e", rm: "i"} (others stay home)
  //   alt          text for screen readers
  // Each finger's <g> carries data-finger, data-key (the key it is on) and data-tip ("x,y" in the holder's pixels),
  // for the tests.
  var SHIFT_TURN = 12, FOLLOW = 0.4, LIFT = 0.6, RIGHT_POSE = { deg: 8, dx: -15 };
  var FINGER_INDEX = { p: 0, r: 1, m: 2, i: 3 }, made = 0;

  function onKeyboard(holder, opts) {
    var art = TT.handArt.rest, W = art.size[0], id = "th" + (++made);
    var old = holder.querySelector("svg.hands-real");
    if (old) { old.parentNode.removeChild(old); }
    var hb = holder.getBoundingClientRect();
    function centre(token, pressAt) {
      var el = opts.key(token);
      if (!el) { return null; }
      var r = el.getBoundingClientRect(), x = r.left - hb.left + r.width / 2;
      if (pressAt) {                       // Shift: near its inner end (pressAt = "left" or "right")
        var one = opts.key(opts.home.lr).getBoundingClientRect().width;
        x = pressAt === "right" ? r.right - hb.left - one * 0.6 : r.left - hb.left + one * 0.6;
      }
      return [x, r.top - hb.top + r.height / 2];
    }
    var a = centre(opts.home.lp), s2 = centre(opts.home.lr);
    if (!a || !s2) { return null; }
    var scale = (s2[0] - a[0]) / 50;      // the drawing's home keys are 50 units apart
    var defs = clip(id + "-palm", art.palm) + art.fingers.map(function (f) { return clip(id + "-" + f.name, f.body); }).join("");
    var body = handGroup("l", a, [59.5, 112], false) + handGroup("r", centre(opts.home.rp), [W - 59.5, 112], true);
    var height = Math.max(holder.scrollHeight, a[1] + 238 * scale);    // crop the arms as the old picture did
    holder.style.height = Math.round(height) + "px";
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "hands-svg hands-real");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", opts.alt || "");
    svg.setAttribute("viewBox", "0 0 " + r1(hb.width) + " " + Math.round(height));
    svg.innerHTML = "<defs>" + defs + "</defs>" + body;
    holder.appendChild(svg);
    return svg;

    function clip(cid, pts) {
      return '<clipPath id="' + cid + '" clipPathUnits="userSpaceOnUse"><polygon points="' +
        pts.map(function (p) { return p[0] + "," + p[1]; }).join(" ") + '"/></clipPath>';
    }

    // One hand, in the drawing's units (a left hand; the right one is drawn mirrored), placed so its little
    // finger's home key lands on the real key.
    function handGroup(side, anchorPx, anchorArt, mirror) {
      var reach = {}, P = [0, 0], turn = 0, wantsShift = null, lift = false;
      ["p", "r", "m", "i"].forEach(function (f) {
        var fid = side + f, token = (opts.reach || {})[fid];
        if (!token) { return; }
        var shift = /^Shift/.test(token);
        var from = centre(opts.home[fid]), to = centre(token, shift ? (side === "l" ? "right" : "left") : null);
        if (!from || !to) { return; }
        var dx = (to[0] - from[0]) / scale, dy = (to[1] - from[1]) / scale;
        if (mirror) { dx = -dx; }
        reach[fid] = [dx, dy];
        if (shift) { wantsShift = [dx, dy]; }
        if (dy < -75) { lift = true; }                    // more than a row and a half up: the number row
      });
      if (lift) { P[1] -= LIFT * 50; }
      if (wantsShift) {
        var d = Math.hypot(wantsShift[0], wantsShift[1]), past = Math.max(0, d - 60) * FOLLOW;
        P[0] += wantsShift[0] / d * past; P[1] += wantsShift[1] / d * past;
        turn = (wantsShift[0] < 0 ? -1 : 1) * SHIFT_TURN * Math.PI / 180;
      }
      if (side === "r") { turn += -RIGHT_POSE.deg * Math.PI / 180; P[0] -= RIGHT_POSE.dx; }
      var wrist = [art.fingers[1].pivot[0] + 25, art.fingers[1].pivot[1] + 210];   // below the middle of the palm
      var c = Math.cos(turn), sn = Math.sin(turn);
      function palmPoint(p) {
        var x = p[0] - wrist[0], y = p[1] - wrist[1];
        return [wrist[0] + c * x - sn * y + P[0], wrist[1] + sn * x + c * y + P[1]];
      }
      function toScreen(p) {
        var x = mirror ? W - p[0] : p[0];
        return [r1(anchorPx[0] + (x - anchorArt[0]) * scale), r1(anchorPx[1] + (p[1] - anchorArt[1]) * scale)];
      }
      var fingers = "";
      ["p", "r", "m", "i"].forEach(function (f) {
        var fid = side + f, part = art.fingers[FINGER_INDEX[f]], move = reach[fid] || [0, 0];
        var goal = [part.tip[0] + move[0], part.tip[1] + move[1]];
        var m = fingerMatrix(part.pivot, part.tip, palmPoint(part.pivot), goal);
        var piece = '<g transform="' + m.matrix + '"><path clip-path="url(#' + id + "-" + part.name + ')" d="' + art.outline + '"/></g>';
        if (m.slid) {        // nothing of a curled finger shows below its knuckle line
          var A = palmPoint(part.L), B = palmPoint(part.R), pv = palmPoint(part.pivot), tp = palmPoint(part.tip);
          var lx = B[0] - A[0], ly = B[1] - A[1], ll = Math.hypot(lx, ly), nx = tp[0] - pv[0], ny = tp[1] - pv[1], nl = Math.hypot(nx, ny);
          lx /= ll; ly /= ll; nx /= nl; ny /= nl;
          var a1 = [A[0] - lx * 300, A[1] - ly * 300], b1 = [B[0] + lx * 300, B[1] + ly * 300];
          piece = clip(id + "-up-" + fid, [a1, b1, [b1[0] + nx * 500, b1[1] + ny * 500], [a1[0] + nx * 500, a1[1] + ny * 500]]) +
                  '<g clip-path="url(#' + id + "-up-" + fid + ')">' + piece + "</g>";
        }
        var on = (opts.reach || {})[fid] || opts.home[fid];
        fingers += '<g data-finger="' + fid + '" data-key="' + esc(on) + '" data-tip="' + toScreen(goal).join(",") + '">' + piece + "</g>";
      });
      var palm = '<g transform="translate(' + r1(P[0]) + " " + r1(P[1]) + ") rotate(" + r1(turn * 180 / Math.PI) + " " +
                 wrist[0] + " " + wrist[1] + ')"><path clip-path="url(#' + id + '-palm)" d="' + art.outline + '"/>' +
                 art.fingers.map(function (f) { return '<circle cx="' + f.pivot[0] + '" cy="' + f.pivot[1] + '" r="' + f.r + '"/>'; }).join("") +
                 "</g>";
      var place = "translate(" + r1(anchorPx[0]) + " " + r1(anchorPx[1]) + ") scale(" + scale + ") translate(" + (-anchorArt[0]) + " " + (-anchorArt[1]) + ")";
      if (mirror) { place += " translate(" + W + " 0) scale(-1 1)"; }
      return '<g class="hands-over hand-' + side + '" transform="' + place + '">' + fingers + palm + "</g>";
    }
  }

  // A finger's base moves from B to B2 (with the palm) and its tip from T to G. Reaching further than its
  // resting length it turns and stretches along its length; reaching less (curling) it turns and slides back.
  function fingerMatrix(B, T, B2, G) {
    var tx = T[0] - B[0], ty = T[1] - B[1], gx = G[0] - B2[0], gy = G[1] - B2[1];
    var lt = Math.hypot(tx, ty), k = Math.hypot(gx, gy) / lt, ux = tx / lt, uy = ty / lt;
    var th = Math.atan2(gy, gx) - Math.atan2(ty, tx), c = Math.cos(th), s = Math.sin(th);
    var m11, m12, m21, m22, e, f, slid = k < 1;
    if (slid) {
      m11 = c; m12 = -s; m21 = s; m22 = c;
      e = G[0] - (m11 * T[0] + m12 * T[1]); f = G[1] - (m21 * T[0] + m22 * T[1]);
    } else {
      var s11 = 1 + (k - 1) * ux * ux, s12 = (k - 1) * ux * uy, s22 = 1 + (k - 1) * uy * uy;
      m11 = c * s11 - s * s12; m12 = c * s12 - s * s22; m21 = s * s11 + c * s12; m22 = s * s12 + c * s22;
      e = B2[0] - (m11 * B[0] + m12 * B[1]); f = B2[1] - (m21 * B[0] + m22 * B[1]);
    }
    return { slid: slid && k < 0.999, matrix: "matrix(" + [m11, m21, m12, m22, e, f].map(function (n) { return Math.round(n * 1e4) / 1e4; }).join(" ") + ")" };
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

  return { onKeyboard: onKeyboard, backOfHands: backOfHands, openWidth: openWidth, highlightFinger: highlightFinger };
})();
