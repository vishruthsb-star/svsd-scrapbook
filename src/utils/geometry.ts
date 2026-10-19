import type { NoteGeometry, SeededRng, StampGeometry, StampLayout, TagGeometry, TagLayout, VoiceGeometry } from '../types';

const f = (n: number) => n.toFixed(1);

export interface InkStrokeWidths {
  /** for the card's own outline/frame strokes */
  thick: string;
  /** for the thinner back-face address lines */
  thin: string;
}

/**
 * Stroke widths scale inversely with an item's `zoom` so the drawn line stays a constant
 * visual thickness regardless of zoom level (zoom then scales it back up). Every item
 * computes this the same way — matches Item.dc.html's `sw: f(2/z), swThin: f(1.4/z)`.
 */
export function inkStrokeWidths(zoom: number): InkStrokeWidths {
  return { thick: (2 / zoom).toFixed(2), thin: (1.4 / zoom).toFixed(2) };
}

/**
 * Seeded hand-drawn line helpers. Same maths as the design source (Item.dc.html) /
 * references/stamp-test.html — a seed always produces the same "wobble" so a stamp's
 * line art is stable across re-renders.
 */
export function makeRng(seed: number): SeededRng {
  let s = seed | 0;
  const R = () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const J = (a: number) => (R() - 0.5) * 2 * a;

  const ln = (x1: number, y1: number, x2: number, y2: number, o = 3, bow = 1.1) => {
    const dx = x2 - x1,
      dy = y2 - y1,
      L = Math.hypot(dx, dy) || 1,
      ux = dx / L,
      uy = dy / L;
    const o1 = o * (0.3 + R()),
      o2 = o * (0.3 + R());
    const ax = x1 - ux * o1 + J(0.5),
      ay = y1 - uy * o1 + J(0.5),
      bx = x2 + ux * o2 + J(0.5),
      by = y2 + uy * o2 + J(0.5);
    const mx = (ax + bx) / 2 - uy * J(bow),
      my = (ay + by) / 2 + ux * J(bow);
    return `M${f(ax)} ${f(ay)}Q${f(mx)} ${f(my)} ${f(bx)} ${f(by)}`;
  };

  const box = (x: number, y: number, w: number, h: number, o = 3) =>
    ln(x, y, x + w, y, o) + ln(x + w, y, x + w, y + h, o) + ln(x + w, y + h, x, y + h, o) + ln(x, y + h, x, y, o);

  const poly = (pts: Array<[number, number]>) =>
    'M' + pts.map(([x, y]) => `${f(x + J(0.7))} ${f(y + J(0.7))}`).join('L') + 'Z';

  const scal = (x: number, y: number, w: number, h: number, r: number) => {
    let d = `M${x} ${y}`;
    const edge = (x1: number, y1: number, x2: number, y2: number) => {
      const L = Math.hypot(x2 - x1, y2 - y1),
        n = Math.max(2, Math.round(L / (r * 3.3))),
        ux = (x2 - x1) / L,
        uy = (y2 - y1) / L,
        st = L / n;
      for (let i = 0; i < n; i++) {
        const s0 = i * st + st / 2 - r,
          e = s0 + 2 * r;
        d += `L${f(x1 + ux * s0)} ${f(y1 + uy * s0)}A${r} ${r} 0 0 0 ${f(x1 + ux * e)} ${f(y1 + uy * e)}`;
      }
      d += `L${x2} ${y2}`;
    };
    edge(x, y, x + w, y);
    edge(x + w, y, x + w, y + h);
    edge(x + w, y + h, x, y + h);
    edge(x, y + h, x, y);
    return d + 'Z';
  };

  return { R, J, ln, box, poly, scal };
}

export function stampGeometry(L: StampLayout, seed: number): StampGeometry {
  const g = makeRng(seed);
  const outline = g.scal(4, 4, L.W - 8, L.H - 8, 4.2);
  const frame = g.box(L.winX, L.winY, L.winW, L.winH, 2);
  const bt = 24,
    px = 18;
  let backLines = '';
  for (let k = 0; ; k++) {
    const y = bt + 24 * k + 21;
    if (y > L.H - 12) break;
    backLines += g.ln(px - 4, y, L.W - px + 4, y, 2, 0.8);
  }
  let cs = '',
    cx = -3;
  for (let i = 0; i < 19; i++) {
    cx += 4.8 + g.J(1.2);
    cs += (i ? 'L' : 'M') + f(cx) + ' ' + f(i % 2 ? 21 + g.J(1.5) : 1 + g.J(1.5));
  }
  const censorFill = g.poly([
    [0, 4],
    [88, 2],
    [90, 18],
    [2, 20],
  ]);
  return { outline, frame, backLines, censorFill, censorScribble: cs };
}

export const NOTE_W = 200,
  NOTE_H = 170,
  NOTE_BT = 22,
  NOTE_PX = 22,
  NOTE_ROWS = 5,
  NOTE_GAP = 24;

/** Shared back-face geometry: the address-line rows plus the censor bar/scribble. */
function backGeometry(g: SeededRng, W: number, rows: number, bt: number, px: number) {
  let backLines = '';
  for (let k = 0; k < rows; k++) {
    const y = bt + 24 * k + 21;
    backLines += g.ln(px - 4, y, W - px + 4, y, 2, 0.8);
  }
  let cs = '',
    cx = -3;
  for (let i = 0; i < 19; i++) {
    cx += 4.8 + g.J(1.2);
    cs += (i ? 'L' : 'M') + f(cx) + ' ' + f(i % 2 ? 21 + g.J(1.5) : 1 + g.J(1.5));
  }
  const censorFill = g.poly([
    [0, 4],
    [88, 2],
    [90, 18],
    [2, 20],
  ]);
  return { backLines, censorFill, censorScribble: cs };
}

/**
 * Note card geometry: a plain hand-wobbled rectangle (not the stamp's scalloped edge)
 * plus a deterministic (seed-independent) zigzag of torn-edge notches along all four
 * sides, alternating red/blue — matches Item.dc.html's `type === 'note'` branch exactly.
 */
export function noteGeometry(seed: number): NoteGeometry {
  const g = makeRng(seed);
  const W = NOTE_W,
    H = NOTE_H;
  const fillD = g.poly([
    [2, 2],
    [W - 2, 2],
    [W - 2, H - 2],
    [2, H - 2],
  ]);
  const outline = g.box(2, 2, W - 4, H - 4, 3.5);

  const q = (pts: Array<[number, number]>) => pts.map(([x, y]) => `${f(x)} ${f(y)}`).join('L');
  let redD = '',
    blueD = '',
    k = 0;
  const push = (d: string) => {
    if (k++ % 2) blueD += d;
    else redD += d;
  };
  for (let x = 12; x < W - 14; x += 13) {
    push(
      `M${q([
        [x, 5],
        [x + 7, 5],
        [x + 3, 12],
        [x - 4, 12],
      ])}Z`,
    );
  }
  for (let y = 18; y < H - 16; y += 13) {
    push(
      `M${q([
        [W - 5, y],
        [W - 5, y + 7],
        [W - 12, y + 3],
        [W - 12, y - 4],
      ])}Z`,
    );
  }
  for (let x = W - 14; x > 12; x -= 13) {
    push(
      `M${q([
        [x, H - 5],
        [x - 7, H - 5],
        [x - 3, H - 12],
        [x + 4, H - 12],
      ])}Z`,
    );
  }
  for (let y = H - 18; y > 16; y -= 13) {
    push(
      `M${q([
        [5, y],
        [5, y - 7],
        [12, y - 3],
        [12, y + 4],
      ])}Z`,
    );
  }

  const { backLines, censorFill, censorScribble } = backGeometry(g, W, NOTE_ROWS, NOTE_BT, NOTE_PX);
  return { fillD, outline, redD, blueD, backLines, censorFill, censorScribble };
}

export const VOICE_W = 230,
  VOICE_H = 146,
  VOICE_BT = 14,
  VOICE_PX = 20,
  VOICE_ROWS = 5,
  VOICE_GAP = 0,
  VOICE_BAR_COUNT = 24;

/**
 * Voice postcard geometry: same plain hand-wobbled rectangle as the note, plus a
 * waveform (24 bars, deterministic heights from the seed), a divider, a few filler
 * lines, a small scalloped box, and a filled play-triangle — matches Item.dc.html's
 * `type === 'voice'` branch exactly. `bars` holds every bar's path segment regardless of
 * playback progress; the caller slices it to reveal bars up to the current progress,
 * exactly like the original's `i < shown` check (shown shrinks the drawn set, not the
 * computed heights).
 */
export function voiceGeometry(seed: number): VoiceGeometry {
  const g = makeRng(seed);
  const W = VOICE_W,
    H = VOICE_H;
  const fillD = g.poly([
    [2, 2],
    [W - 2, 2],
    [W - 2, H - 2],
    [2, H - 2],
  ]);
  const outline = g.box(2, 2, W - 4, H - 4, 3.5);
  const divider = g.ln(118, 16, 118, H - 16, 2);

  const n = VOICE_BAR_COUNT;
  const bars: string[] = [];
  for (let i = 0; i < n; i++) {
    const env = Math.pow(Math.sin((Math.PI * (i + 0.5)) / n), 0.6);
    const hh = 5 + g.R() * 40 * env + 6 * env;
    const x1 = 16 + i * 4 + g.J(0.3),
      y1 = 60 - hh / 2;
    const x2 = 16 + i * 4 + g.J(0.5),
      y2 = 60 + hh / 2;
    bars.push(`M${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}`);
  }

  const chipLines = g.ln(134, 76, 212, 76, 3) + g.ln(134, 98, 212, 98, 3) + g.ln(134, 120, 200, 120, 3);
  const scalBox = g.scal(184, 14, 30, 36, 2.4);
  const playTriangle = g.poly([
    [18, 112],
    [18, 132],
    [34, 122],
  ]);

  const { backLines, censorFill, censorScribble } = backGeometry(g, W, VOICE_ROWS, VOICE_BT, VOICE_PX);
  return { fillD, outline, divider, chipLines, scalBox, playTriangle, bars, backLines, censorFill, censorScribble };
}

/**
 * Parcel tag geometry: the luggage-tag silhouette (a hand-wobbled hexagon with a cut
 * top-left corner), a punched hole + reinforcement ring and a string loop (both fixed,
 * seed-independent — like real hardware, not hand-inked), the preview slot's frame, and
 * a decorative underline below the link line — matches Item.dc.html's `type === 'tag'`
 * branch, generalized to the tag's own (seed-varying) height.
 */
export function tagGeometry(L: TagLayout, seed: number): TagGeometry {
  const g = makeRng(seed);
  const W = L.W,
    H = L.H;
  const outline = g.poly([
    [4, 34],
    [34, 4],
    [W - 34, 4],
    [W - 4, 34],
    [W - 4, H - 4],
    [4, H - 4],
  ]);
  const cx = W / 2;
  const holes = `M${cx - 7} 30a7 7 0 1 0 14 0a7 7 0 1 0 -14 0M${cx - 12} 30a12 12 0 1 0 24 0a12 12 0 1 0 -24 0`;
  const string = `M${cx} 30C${cx - 20} 8 ${cx + 10} -16 ${cx - 8} -46M${cx} 30C${cx + 18} 6 ${cx - 4} -18 ${cx + 10} -48`;
  const slotFrame = g.box(L.slotX, L.slotY, L.slotW, L.slotH, 2);
  const underline = g.ln(16, L.underlineY, W - 16, L.underlineY, 3);

  const bt = 54,
    px = 14,
    rows = 5;
  const { backLines, censorFill, censorScribble } = backGeometry(g, W, rows, bt, px);
  return { fillD: outline, outline, holes, string, slotFrame, underline, backLines, censorFill, censorScribble };
}
