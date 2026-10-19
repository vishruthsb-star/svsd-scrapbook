import type { SeededRng, StampGeometry, StampLayout } from '../types';

const f = (n: number) => n.toFixed(1);

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
