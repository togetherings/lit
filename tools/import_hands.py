#!/usr/bin/env python3
"""
import_hands.py - OPTIONAL maker tool (the lesson itself never runs it).

Reads the two hand drawings you made in Inkscape:
    art/left-hand-rest.svg   Page 1: hand resting on the keyboard
    art/left-hand-open.svg   Page 2: hand with fingers spread, shown coloured
and writes js/hand-art.js, which the lesson loads.  Run it again whenever you change an SVG:

    python3 tools/import_hands.py          (needs python3, numpy, scipy, opencv-python)

HOW TO DRAW THE FILES (Inkscape)
  - ONE path per file: the outline of a LEFT hand, back view, fingers pointing up, thumb on the right.
  - Any size or position on the page is fine. Do not leave transforms on the path or its layer
    (use Path > "Object to Path", and ungroup / apply transforms if Inkscape added any).
  - The path must have exactly five fingertips (four fingers and the thumb) pointing up.
  - Colours are NOT taken from the SVG: they come from css/style.css.

WHAT THIS SCRIPT DOES
  rest: scales/moves the hand so the four fingertips land on the A S D F keys of the keyboard picture.
  open: keeps your drawing as it is, and builds the five finger colour shapes by finding the fingertips
        and the "webs" between the fingers in YOUR outline. The colour covers only the tip of each finger,
        down to about the first knuckle (see FINGER_COLOUR_FRACTION below). Each cap is cut out of your
        outline, so it is the exact shape of the fingertip.
"""
import math, os, re, json
import numpy as np, cv2
from scipy.ndimage import gaussian_filter1d

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, ".."))
OUT = os.path.join(ROOT, "js", "hand-art.js")

# Keyboard picture geometry (must match js/hands.js): key centres of A S D F, and the height the
# four fingertips should reach on the home row.
KEY_X = [59.5, 109.5, 159.5, 209.5]
TIP_Y = 102.0
REST_WIDTH = 569          # width of the keyboard picture (the right hand is this one mirrored)

# How far down each finger the colour reaches, as a fraction of the finger's length measured from
# its tip to where it starts at the web. About 0.35 ends at the first knuckle below the fingertip.
# Make the number smaller for a shorter colour cap, larger for a longer one.
FINGER_COLOUR_FRACTION = 0.35
THUMB_COLOUR_FRACTION = 0.45      # the thumb's first joint is a little further from its tip

# ------------------------------------------------------------------ reading SVG path data
TOK = re.compile(r"([MmLlHhVvCcSsQqTtAaZz])|([-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?)")

def read_path(file):
    s = open(file, encoding="utf-8").read()
    if re.search(r"transform\s*=", s):
        raise SystemExit(file + ": has a transform. In Inkscape ungroup the layer/path or apply transforms, then save again.")
    paths = re.findall(r"<path\b[^>]*?\bd=\"([^\"]+)\"", s, re.S)
    if len(paths) != 1:
        raise SystemExit("%s: expected exactly one path, found %d" % (file, len(paths)))
    return parse(paths[0])

def parse(d):
    """Path text -> list of absolute segments: ('M',p) ('L',p) ('C',p1,p2,p3) ('Q',p1,p2) ('Z',)"""
    toks = [m.group(1) or float(m.group(2)) for m in TOK.finditer(d)]
    i, cur, start, cmd, segs, prev = 0, (0.0, 0.0), (0.0, 0.0), None, [], None
    def num():
        nonlocal i
        v = toks[i]; i += 1; return v
    while i < len(toks):
        if isinstance(toks[i], str):
            cmd = toks[i]; i += 1
            if cmd in "Zz":
                segs.append(("Z",)); cur = start; prev = None; continue
        rel, C = cmd.islower(), cmd.upper()
        ox, oy = cur if rel else (0.0, 0.0)
        if C == "M":
            cur = (ox + num(), oy + num()); start = cur; segs.append(("M", cur)); cmd = "l" if rel else "L"; prev = None
        elif C == "L":
            cur = (ox + num(), oy + num()); segs.append(("L", cur)); prev = None
        elif C == "H":
            cur = ((cur[0] if rel else 0) + num(), cur[1]); segs.append(("L", cur)); prev = None
        elif C == "V":
            cur = (cur[0], (cur[1] if rel else 0) + num()); segs.append(("L", cur)); prev = None
        elif C == "C":
            p1 = (ox + num(), oy + num()); p2 = (ox + num(), oy + num()); p3 = (ox + num(), oy + num())
            segs.append(("C", p1, p2, p3)); cur = p3; prev = ("C", p2)
        elif C == "S":
            p1 = (2 * cur[0] - prev[1][0], 2 * cur[1] - prev[1][1]) if prev and prev[0] == "C" else cur
            p2 = (ox + num(), oy + num()); p3 = (ox + num(), oy + num())
            segs.append(("C", p1, p2, p3)); cur = p3; prev = ("C", p2)
        elif C == "Q":
            p1 = (ox + num(), oy + num()); p2 = (ox + num(), oy + num())
            segs.append(("Q", p1, p2)); cur = p2; prev = ("Q", p1)
        elif C == "T":
            p1 = (2 * cur[0] - prev[1][0], 2 * cur[1] - prev[1][1]) if prev and prev[0] == "Q" else cur
            p2 = (ox + num(), oy + num())
            segs.append(("Q", p1, p2)); cur = p2; prev = ("Q", p1)
        else:
            raise SystemExit("Arc commands (A) are not supported: convert the shape with Path > Object to Path.")
    return segs

def transform(segs, a, bx, by):
    f = lambda p: (a * p[0] + bx, a * p[1] + by)
    return [(s[0],) + tuple(f(p) for p in s[1:]) for s in segs]

def polygon(segs, steps=24):
    """Flatten the curves into a list of (x, y) points."""
    pts, cur = [], None
    for s in segs:
        if s[0] in "ML": cur = s[1]; pts.append(cur)
        elif s[0] == "C":
            p0, p1, p2, p3 = cur, s[1], s[2], s[3]
            for k in range(1, steps + 1):
                t = k / steps; u = 1 - t
                pts.append((u**3*p0[0]+3*u*u*t*p1[0]+3*u*t*t*p2[0]+t**3*p3[0], u**3*p0[1]+3*u*u*t*p1[1]+3*u*t*t*p2[1]+t**3*p3[1]))
            cur = p3
        elif s[0] == "Q":
            p0, p1, p2 = cur, s[1], s[2]
            for k in range(1, steps + 1):
                t = k / steps; u = 1 - t
                pts.append((u*u*p0[0]+2*u*t*p1[0]+t*t*p2[0], u*u*p0[1]+2*u*t*p1[1]+t*t*p2[1]))
            cur = p2
    return np.array(pts)

def fmt(v):
    return ("%.2f" % v).rstrip("0").rstrip(".")

def path_text(segs):
    out = ""
    for s in segs:
        out += s[0] + " ".join(fmt(c) for p in s[1:] for c in p)
    return out + ("" if out.endswith("Z") else "Z")

# ------------------------------------------------------------------ finding fingertips and webs
def resample(poly, n=3000):
    p = np.vstack([poly, poly[:1]])
    d = np.r_[0, np.cumsum(np.hypot(*np.diff(p, axis=0).T))]
    t = np.linspace(0, d[-1], n, endpoint=False)
    return np.stack([np.interp(t, d, p[:, 0]), np.interp(t, d, p[:, 1])], 1)

def find_tips_and_webs(poly):
    """Five fingertips (little, ring, middle, index, thumb) and the four webs between them."""
    pts = resample(poly); n = len(pts)
    x = gaussian_filter1d(pts[:, 0], 4, mode="wrap"); y = gaussian_filter1d(pts[:, 1], 4, mode="wrap")
    w = n // 60
    tips = []
    for i in range(n):
        idx = [(i + k) % n for k in range(-w, w + 1)]
        if y[i] == y[idx].min():
            if tips and abs(x[i] - pts[tips[-1], 0]) < 6 and (i - tips[-1]) % n < w * 2: continue
            tips.append(i)
    # a tip must stand clearly above the lowest point nearby (ignores small bumps)
    tips = [i for i in tips if max(y[(i + k) % n] for k in range(-3 * w, 3 * w + 1)) - y[i] > 8]
    if len(tips) != 5:
        raise SystemExit("Found %d fingertips, expected 5 (four fingers + thumb pointing up)." % len(tips))
    tips.sort(key=lambda i: x[i])
    webs = []
    for a, b in zip(tips, tips[1:]):
        arcs = []
        for lo, hi in ((a, b), (b, a)):
            arc = [(lo + k) % n for k in range(((hi - lo) % n) + 1)]
            if not any(t in arc[1:-1] for t in tips): arcs.append(arc)
        arc = min(arcs, key=len)
        j = max(arc, key=lambda q: y[q])
        webs.append((float(x[j]), float(y[j])))
    return [(float(x[i]), float(y[i])) for i in tips], webs

# ------------------------------------------------------------------ the finger colour shapes (open hand)
def side(p0, p1, q):
    return (p1[0] - p0[0]) * (q[1] - p0[1]) - (p1[1] - p0[1]) * (q[0] - p0[0])

def clip_half(poly, p0, p1, ref):
    """Keep the part of a convex polygon on the same side of line p0-p1 as the point 'ref'."""
    sgn = 1 if side(p0, p1, ref) >= 0 else -1
    out = []
    for a, b in zip(poly, poly[1:] + poly[:1]):
        sa, sb = sgn * side(p0, p1, a), sgn * side(p0, p1, b)
        if sa >= 0: out.append(a)
        if (sa >= 0) != (sb >= 0):
            t = sa / (sa - sb); out.append((a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])))
    return out

def finger_shapes(poly):
    tips, v = find_tips_and_webs(poly)
    mid = lambda a, b: ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2)
    # separators: a line from each web up between the two neighbouring fingertips
    seps = [(v[j], mid(tips[j], tips[j + 1])) for j in range(4)]
    # where each finger "starts": the middle of its webs (outer fingers: mirror the single web)
    ref = [None] * 5
    ref[0] = (2 * v[0][0] - mid(v[0], v[1])[0], 2 * v[0][1] - mid(v[0], v[1])[1])
    ref[1], ref[2] = mid(v[0], v[1]), mid(v[1], v[2])
    ref[3] = (2 * v[2][0] - mid(v[1], v[2])[0], 2 * v[2][1] - mid(v[1], v[2])[1])
    # thumb: its axis runs from the tip towards the centre of the thumb part of the outline
    P = np.array(poly)
    big = (P[:, 0].min() - 20, P[:, 1].min() - 20, P[:, 0].max() + 20, P[:, 1].max() + 20)
    box = [(big[0], big[1]), (big[2], big[1]), (big[2], big[3]), (big[0], big[3])]
    pts = resample(poly, 4000)
    on_thumb_side = np.array([side(*seps[3], q) * side(*seps[3], tips[4]) > 0 for q in pts])
    near = pts[(np.hypot(pts[:, 0] - tips[4][0], pts[:, 1] - tips[4][1]) < 60) & on_thumb_side]
    c = near.mean(axis=0); u = np.array([c[0] - tips[4][0], c[1] - tips[4][1]]); u /= np.hypot(*u)
    t = float(np.dot(np.array(v[3]) - np.array(tips[4]), u))
    ref[4] = (tips[4][0] + u[0] * t, tips[4][1] + u[1] * t)

    def cut_line(k):   # line across the finger at its first knuckle, square to the finger's direction
        if k == 4:
            ax = (u[0], u[1]); length = math.hypot(ref[4][0] - tips[4][0], ref[4][1] - tips[4][1]); frac = THUMB_COLOUR_FRACTION
        else:
            ax = (ref[k][0] - tips[k][0], ref[k][1] - tips[k][1]); length = math.hypot(*ax); ax = (ax[0] / length, ax[1] / length)
            frac = FINGER_COLOUR_FRACTION
        c = (tips[k][0] + ax[0] * length * frac, tips[k][1] + ax[1] * length * frac)
        return c, (c[0] - ax[1], c[1] + ax[0])

    sepsides = {0: [0], 1: [0, 1], 2: [1, 2], 3: [2, 3], 4: [3]}
    shapes = {}
    for k, name in enumerate(["pinky", "ring", "middle", "index", "thumb"]):
        region = box[:]
        for j in sepsides[k]: region = clip_half(region, seps[j][0], seps[j][1], tips[k])
        region = clip_half(region, *cut_line(k), tips[k])        # stop at the first knuckle
        shapes[name] = region
    return shapes


def exact_caps(outline_poly, regions, S=8):
    """Cut each finger region out of the hand outline, so every colour cap is the exact shape you can see.
    (Exact shapes let the page draw a clean highlight outline all the way round a fingertip.)"""
    P = np.array(outline_poly)
    x0, y0 = P[:, 0].min() - 3, P[:, 1].min() - 3
    W, H = int((P[:, 0].max() - x0 + 3) * S), int((P[:, 1].max() - y0 + 3) * S)
    to_px = lambda pts: np.array([((x - x0) * S, (y - y0) * S) for x, y in pts], np.int32)
    hand = np.zeros((H, W), np.uint8); cv2.fillPoly(hand, [to_px(outline_poly)], 255)
    out = {}
    for name, region in regions.items():
        m = np.zeros((H, W), np.uint8); cv2.fillPoly(m, [to_px(region)], 255)
        m = cv2.bitwise_and(m, hand)
        cs, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
        c = max(cs, key=cv2.contourArea)
        c = cv2.approxPolyDP(c, 0.08 * S, True)[:, 0, :] / S
        out[name] = "M" + "L".join(fmt(x + x0) + " " + fmt(y + y0) for x, y in c) + "Z"
    return out

# ------------------------------------------------------------------ main
def main():
    # ---- rest hand: fit it to the keys
    segs = read_path(os.path.join(ROOT, "art", "left-hand-rest.svg"))
    tips, _ = find_tips_and_webs(polygon(segs))
    xs = [t[0] for t in tips[:4]]; ys = [t[1] for t in tips[:4]]
    a, bx = np.polyfit(xs, KEY_X, 1)
    by = TIP_Y - a * float(np.mean(ys))
    rest = transform(segs, a, bx, by)
    err = max(abs(a * x + bx - k) for x, k in zip(xs, KEY_X))
    print("rest: scale %.4f, fingertips land within %.2f units of the key centres" % (a, err))

    # ---- open hand: keep as drawn
    osegs = read_path(os.path.join(ROOT, "art", "left-hand-open.svg"))
    opoly = polygon(osegs)
    shapes = exact_caps(opoly, finger_shapes(opoly))
    box = [float(opoly[:, 0].min()), float(opoly[:, 1].min()), float(opoly[:, 0].max()), float(opoly[:, 1].max())]
    print("open: bounding box", [round(v, 1) for v in box])

    art = {"rest": {"outline": path_text(rest), "size": [REST_WIDTH, 420]},
           "open": {"outline": path_text(osegs), "fingers": shapes, "box": [round(v, 2) for v in box]}}
    with open(OUT, "w") as f:
        f.write("/* GENERATED by tools/import_hands.py from art/left-hand-*.svg - re-run that script instead of editing this file.\n"
                "   SVG path data for a left hand (back view). hands.js draws, mirrors, clips and colours it. */\n"
                "TT.handArt = " + json.dumps(art, separators=(",", ":")) + ";\n")
    print("wrote", OUT, os.path.getsize(OUT), "bytes")

if __name__ == "__main__":
    main()
