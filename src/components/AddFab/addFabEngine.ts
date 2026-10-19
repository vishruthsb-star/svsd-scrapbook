/**
 * AddFab: standalone add button with a four-circle fan.
 *
 * This is a near-verbatim TypeScript port of the imperative DOM engine from
 * `references/Scrapbook Add Button.html` (window.AddFab IIFE) — logic, timings, and CSS
 * values are unchanged from the reference; only type annotations and the module
 * boundary (export instead of `window.AddFab`) were added. See AddFab.tsx for the thin
 * React wrapper that mounts/unmounts this engine.
 *
 * Host sizing: `host` must be position:relative (or absolute). The engine's own root div
 * is sized to `frameW`x`frameH` (default 390x844, the reference's original fixed size —
 * every existing caller that doesn't pass these is pixel-identical to before) with
 * `cornerRadius` (default 48). The `layout()` arc-fit clamp margins and the `local()`
 * pointer rescale are expressed relative to `frameW`/`frameH` rather than hardcoded to
 * 390/844. PLACEMENTS (the per-corner x/y/dir/spread/r defaults) are NOT rescaled to a
 * different frame size — pass explicit `x`/`y` overrides (in the new frame's coordinates)
 * when `frameW`/`frameH` differ from the default.
 *
 * Usage:  const fab = new AddFab(hostElement, { placement: 'br', onSelect: kind => {} });
 * placement: 'br' | 'bc' | 'tr'. Optional overrides: x, y, dir, spread, radius, frameW,
 * frameH, cornerRadius, zIndex.
 * Methods: open(), close(), setPlacement(name), destroy().
 */

export type AddFabPlacement = 'br' | 'bc' | 'tr';
export type AddFabKind = 'stamp' | 'note' | 'tag' | 'voice';

export interface AddFabOptions {
  placement?: AddFabPlacement;
  startOpen?: boolean;
  hidden?: boolean;
  onSelect?: ((kind: AddFabKind) => void) | null;
  x?: number;
  y?: number;
  dir?: number;
  spread?: number;
  radius?: number;
  /** Host width/height in px. Default 390/844 — the reference's original fixed host, so
   * omitting these leaves every existing caller pixel-identical. Every internal coordinate
   * that used to hardcode 390/844 (host size, `layout()`'s clamp margins, `local()`'s
   * pointer rescale) is now expressed relative to these instead. PLACEMENTS/the fan math
   * itself are unchanged — pass `x`/`y` to anchor into a non-390x844 frame. */
  frameW?: number;
  frameH?: number;
  /** Host corner radius in px. Default 48 (the reference's phone-mock radius). */
  cornerRadius?: number;
  /** CSS z-index for the host's root div. Default: unset (the reference never set one; stacking relies on DOM order). */
  zIndex?: number;
}

interface AddFabState {
  open: boolean | null;
  hover: number;
  picked: number;
  stage: number;
}

interface FanPoint {
  dx: number;
  dy: number;
}

const FONT = '"Inter", -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif';
const INK = '#464646';

const CSS = [
  // width/height/border-radius are intentionally NOT here: the shared stylesheet below is
  // injected once for every AddFab instance on the page, but frameW/frameH/cornerRadius
  // are per-instance, so they're set as inline styles on `root` in the constructor instead.
  '.addfab{position:absolute;left:0;top:0;overflow:hidden;pointer-events:none;transition:opacity 220ms ease}',
  '.addfab__scrim{position:absolute;inset:0;background:rgba(46,32,18,.38);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);transition:opacity 220ms ease}',
  '.addfab__item{position:absolute;width:56px;height:56px;margin:-28px 0 0 -28px;cursor:pointer;outline:none}',
  '.addfab__circle{width:56px;height:56px;box-sizing:border-box;border-radius:50%;background:#FFFFFF;border:.5px solid #ECECEC;display:flex;align-items:center;justify-content:center;box-shadow:0 27px 13.5px rgba(40,28,14,.09),0 7px 7.5px rgba(40,28,14,.12);transition:transform 200ms cubic-bezier(.34,1.56,.64,1)}',
  '.addfab__item:focus-visible .addfab__circle{outline:2px solid ' + INK + ';outline-offset:3px}',
  '.addfab__pill{position:absolute;transform:translate(-50%,-50%);height:52px;padding:0 22px 0 16px;box-sizing:border-box;display:flex;align-items:center;gap:8px;',
  'background:#FFFFFF;color:' + INK + ';border:.5px solid #ECECEC;border-radius:360px;',
  'box-shadow:0 7px 7.5px rgba(143,143,143,.10),0 27px 13.5px rgba(143,143,143,.09),0 60px 18px rgba(143,143,143,.05),0 107px 21.5px rgba(143,143,143,.01),0 168px 23.5px rgba(143,143,143,0);',
  'pointer-events:auto;cursor:pointer;touch-action:none;user-select:none;-webkit-user-select:none;',
  'font-family:' + FONT + ';font-size:16px;font-weight:400;line-height:1.5;letter-spacing:-.48px;white-space:nowrap;outline:none}',
  '.addfab__pill:focus-visible{outline:2px solid ' + INK + ';outline-offset:3px}',
  '.addfab__plus{overflow:visible;transition:transform 320ms cubic-bezier(.34,1.56,.64,1)}',
].join('');

const PLACEMENTS: Record<AddFabPlacement, { x: number; y: number; dir: number; spread: number; r: number }> = {
  br: { x: 318, y: 784, dir: -135, spread: 110, r: 100 },
  bc: { x: 195, y: 776, dir: -90, spread: 160, r: 108 },
  tr: { x: 322, y: 152, dir: 135, spread: 110, r: 100 },
};
const KINDS: [AddFabKind, string][] = [
  ['stamp', 'photo'],
  ['note', 'pen'],
  ['tag', 'link'],
  ['voice', 'mic'],
];

function circ(x: number, y: number, r: number): string {
  return 'M' + (x - r) + ' ' + y + 'a' + r + ' ' + r + ' 0 1 0 ' + 2 * r + ' 0a' + r + ' ' + r + ' 0 1 0 ' + -2 * r + ' 0';
}

const ICONS: Record<string, string> = {
  plus: 'M12 5v14 M5 12h14',
  photo: 'M3.5 5.5h17v13h-17z M3.5 15.5l5-5 4 4 3-3 5 5 ' + circ(15.75, 9, 1.25),
  pen: 'M15 4.5l4.5 4.5L9 19.5l-5 1 1-5z M13 6.5l4.5 4.5',
  link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.2 1.2 M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.2-1.2',
  mic: 'M9 6.5a3 3 0 0 1 6 0v4.5a3 3 0 0 1-6 0z M6 11a6 6 0 0 0 12 0 M12 17v3.5 M9 20.5h6',
};

/** Hand-drawn icon wobble, same seeded sketch as the rest of the app's line art (but this
 *  engine's own self-contained RNG/segmenter, kept verbatim rather than reused from
 *  utils/geometry.ts, to match the reference exactly). */
function rngI(seed: number) {
  let x = seed | 0;
  return function () {
    x = (x + 0x6d2b79f5) | 0;
    let t = Math.imul(x ^ (x >>> 15), 1 | x);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296 - 0.5;
  };
}

interface Pt {
  x: number;
  y: number;
}

type Seg =
  | { t: 'L'; a: Pt; b: Pt }
  | { t: 'C'; a: Pt; c1: Pt; c2: Pt; b: Pt }
  | { t: 'Q'; a: Pt; c1: Pt; b: Pt }
  | { t: 'A'; a: Pt; b: Pt; arc: number[] };

function segs(d: string): Seg[] {
  const NUM: Record<string, number> = { M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, T: 2, A: 7, Z: 0 };
  const toks = d.match(/[MmLlHhVvCcSsQqTtAaZz]|-?(?:\d+\.?\d*|\.\d+)(?:e-?\d+)?/g) || [];
  const out: Seg[] = [];
  let i = 0,
    cmd = 'M',
    cx = 0,
    cy = 0,
    sx = 0,
    sy = 0,
    lc: Pt | null = null,
    lq: Pt | null = null,
    cur: Pt | null = null,
    start: Pt | null = null;
  const P = (x: number, y: number): Pt => ({ x, y });
  while (i < toks.length) {
    if (/[a-z]/i.test(toks[i])) cmd = toks[i++];
    const U = cmd.toUpperCase();
    const rel = cmd !== U;
    const n = NUM[U];
    const p: number[] = [];
    if (U === 'Z') {
      if (cur && start && (cur.x !== start.x || cur.y !== start.y)) out.push({ t: 'L', a: cur, b: start });
      cur = start;
      cx = sx;
      cy = sy;
      lc = lq = null;
      continue;
    }
    for (let k = 0; k < n; k++) p.push(parseFloat(toks[i++]));
    const ox = rel ? cx : 0;
    const oy = rel ? cy : 0;
    let nxt: Pt | null = null;
    if (U === 'M') {
      cx = p[0] + ox;
      cy = p[1] + oy;
      sx = cx;
      sy = cy;
      cur = start = P(cx, cy);
      cmd = rel ? 'l' : 'L';
      lc = lq = null;
      continue;
    }
    if (U === 'L') nxt = P(p[0] + ox, p[1] + oy);
    if (U === 'H') nxt = P(p[0] + ox, cy);
    if (U === 'V') nxt = P(cx, p[0] + (rel ? cy : 0));
    if (nxt) {
      out.push({ t: 'L', a: cur as Pt, b: nxt });
      lc = lq = null;
    } else if (U === 'C' || U === 'S') {
      const c1 = U === 'C' ? P(p[0] + ox, p[1] + oy) : lc ? P(2 * cx - lc.x, 2 * cy - lc.y) : P(cx, cy);
      const o = U === 'C' ? 2 : 0;
      const c2 = P(p[o] + ox, p[o + 1] + oy);
      nxt = P(p[o + 2] + ox, p[o + 3] + oy);
      out.push({ t: 'C', a: cur as Pt, c1, c2, b: nxt });
      lc = c2;
      lq = null;
    } else if (U === 'Q' || U === 'T') {
      const q: Pt = U === 'Q' ? P(p[0] + ox, p[1] + oy) : lq ? P(2 * cx - lq.x, 2 * cy - lq.y) : P(cx, cy);
      nxt = U === 'Q' ? P(p[2] + ox, p[3] + oy) : P(p[0] + ox, p[1] + oy);
      out.push({ t: 'Q', a: cur as Pt, c1: q, b: nxt });
      lq = q;
      lc = null;
    } else if (U === 'A') {
      nxt = P(p[5] + ox, p[6] + oy);
      out.push({ t: 'A', a: cur as Pt, b: nxt, arc: p.slice(0, 5) });
      lc = lq = null;
    }
    cur = nxt;
    cx = (nxt as Pt).x;
    cy = (nxt as Pt).y;
  }
  return out;
}

const iconCache: Record<string, string> = {};

function sketch(name: string): string {
  if (iconCache[name]) return iconCache[name];
  const d = ICONS[name];
  const q = 0.35,
    amt = 0.38 * q,
    over = 1.2 * q,
    bowK = q;
  let h = 7;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  const r = rngI(h);
  const seen: { o: Pt; j: Pt }[] = [];
  const f = (v: number) => +v.toFixed(2);
  const J = (pt: Pt): Pt => {
    for (let s = 0; s < seen.length; s++) if (seen[s].o === pt) return seen[s].j;
    const j = { x: pt.x + r() * 2 * amt, y: pt.y + r() * 2 * amt };
    seen.push({ o: pt, j });
    return j;
  };
  const C = (pt: Pt): Pt => ({ x: pt.x + r() * 2 * amt * 0.6, y: pt.y + r() * 2 * amt * 0.6 });
  const res = segs(d)
    .map((s) => {
      const A = J(s.a);
      const B = J(s.b);
      if (s.t === 'L') {
        const dx = B.x - A.x,
          dy = B.y - A.y,
          L = Math.hypot(dx, dy) || 1,
          ux = dx / L,
          uy = dy / L;
        const o = Math.min(over, L * 0.18),
          o1 = o * (0.25 + r() + 0.5),
          o2 = o * (0.25 + r() + 0.5);
        const ax = A.x - ux * o1,
          ay = A.y - uy * o1,
          bx = B.x + ux * o2,
          by = B.y + uy * o2;
        const bow = r() * Math.min(1.1, L * 0.07) * bowK,
          mx = (ax + bx) / 2 - uy * bow,
          my = (ay + by) / 2 + ux * bow;
        return 'M' + f(ax) + ' ' + f(ay) + 'Q' + f(mx) + ' ' + f(my) + ' ' + f(bx) + ' ' + f(by);
      }
      if (s.t === 'C') {
        const c1 = C(s.c1),
          c2 = C(s.c2);
        return 'M' + f(A.x) + ' ' + f(A.y) + 'C' + f(c1.x) + ' ' + f(c1.y) + ' ' + f(c2.x) + ' ' + f(c2.y) + ' ' + f(B.x) + ' ' + f(B.y);
      }
      if (s.t === 'Q') {
        const qq = C(s.c1);
        return 'M' + f(A.x) + ' ' + f(A.y) + 'Q' + f(qq.x) + ' ' + f(qq.y) + ' ' + f(B.x) + ' ' + f(B.y);
      }
      const k = 1 + r() * 0.16;
      return 'M' + f(A.x) + ' ' + f(A.y) + 'A' + f(s.arc[0] * k) + ' ' + f(s.arc[1] * k) + ' ' + s.arc[2] + ' ' + s.arc[3] + ' ' + s.arc[4] + ' ' + f(B.x) + ' ' + f(B.y);
    })
    .join(' ');
  iconCache[name] = res;
  return res;
}

/**
 * Finds a fan arc that stays inside the screen margins, shrinking and rotating it as
 * needed. `m`/`top` are the reference's original fixed-px margins (38/74), now expressed
 * as offsets from `frameW`/`frameH`'s actual edges instead of the literals 390/806 (806
 * was always just `844 - 38`, i.e. the same `m` margin from the bottom edge).
 */
function layout(x: number, y: number, dir: number, spread: number, R0: number, frameW: number, frameH: number): FanPoint[] {
  const n = 4,
    m = 38,
    top = 74,
    bot = frameH - m;
  for (let R = R0; R >= 72; R -= 8) {
    for (let k = 0; k <= 36; k++) {
      const signs = k ? [1, -1] : [1];
      for (let si = 0; si < signs.length; si++) {
        const c = dir + signs[si] * k * 5;
        const pts: FanPoint[] = [];
        let ok = true;
        for (let i = 0; i < n; i++) {
          const a = ((c - spread / 2 + (i * spread) / (n - 1)) * Math.PI) / 180;
          const px = x + R * Math.cos(a);
          const py = y + R * Math.sin(a);
          if (px < m || px > frameW - m || py < top || py > bot) {
            ok = false;
            break;
          }
          pts.push({ dx: px - x, dy: py - y });
        }
        if (ok) return pts;
      }
    }
  }
  return [0, 1, 2, 3].map((i) => ({ dx: -69 + i * 46, dy: -96 }));
}

function icon(fid: string, size: number, sw: number, d: string, cls?: string): string {
  return (
    '<svg' +
    (cls ? ' class="' + cls + '"' : '') +
    ' width="' +
    size +
    '" height="' +
    size +
    '" viewBox="0 0 24 24" fill="none" stroke="' +
    (cls ? INK : '#181616') +
    '" stroke-linecap="round" stroke-linejoin="round" style="overflow:visible" aria-hidden="true"><g filter="url(#' +
    fid +
    ')"><path d="' +
    d +
    '" stroke-width="' +
    sw +
    '"></path></g></svg>'
  );
}

export class AddFab {
  static _n = 0;

  opts: Required<Pick<AddFabOptions, 'placement' | 'startOpen' | 'hidden'>> & AddFabOptions;
  state: AddFabState;
  pressing = false;
  hold = false;
  timers: ReturnType<typeof setTimeout>[] = [];
  ht: ReturnType<typeof setTimeout> | undefined;
  wasOpen = false;
  start: { x: number; y: number } = { x: 0, y: 0 };

  root: HTMLDivElement;
  scrim: HTMLElement;
  items: HTMLElement[];
  circles: HTMLElement[];
  pill: HTMLElement;
  plus: HTMLElement;

  private onDown: (e: PointerEvent) => void;
  private onMove: (e: PointerEvent) => void;
  private onUp: (e: PointerEvent) => void;

  constructor(host: HTMLElement, opts?: AddFabOptions) {
    // Pointer/keyboard handlers below are plain closures (ported verbatim from the
    // reference's IIFE-style methods), so they need a captured `self` rather than `this`.
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    this.opts = Object.assign(
      { placement: 'br' as AddFabPlacement, startOpen: false, hidden: false, onSelect: null, frameW: 390, frameH: 844, cornerRadius: 48 },
      opts || {},
    );
    this.state = { open: null, hover: -1, picked: -1, stage: 0 };

    if (!document.getElementById('addfab-css')) {
      const st = document.createElement('style');
      st.id = 'addfab-css';
      st.textContent = CSS;
      document.head.appendChild(st);
    }
    const fid = 'addfab-ink-' + ++AddFab._n;
    const root = document.createElement('div');
    root.className = 'addfab';
    root.style.width = this.opts.frameW + 'px';
    root.style.height = this.opts.frameH + 'px';
    root.style.borderRadius = this.opts.cornerRadius + 'px';
    if (this.opts.zIndex != null) root.style.zIndex = String(this.opts.zIndex);
    root.innerHTML =
      '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><filter id="' +
      fid +
      '" filterUnits="userSpaceOnUse" x="-12" y="-12" width="48" height="48"><feTurbulence type="fractalNoise" baseFrequency="0.11" numOctaves="2" seed="11"></feTurbulence><feDisplacementMap in="SourceGraphic" scale="0.6"></feDisplacementMap></filter></defs></svg>' +
      '<div class="addfab__scrim"></div>' +
      KINDS.map((k) => '<div class="addfab__item" role="button" aria-label="Add ' + k[0] + '"><div class="addfab__circle">' + icon(fid, 26, 1.8, sketch(k[1])) + '</div></div>').join('') +
      '<div class="addfab__pill" role="button" tabindex="0" aria-haspopup="true" aria-expanded="false">' +
      icon(fid, 24, 2, sketch('plus'), 'addfab__plus') +
      '<span>add</span></div>';

    this.root = root;
    this.scrim = root.querySelector('.addfab__scrim') as HTMLElement;
    this.items = Array.prototype.slice.call(root.querySelectorAll('.addfab__item'));
    this.circles = this.items.map((el) => el.firstChild as HTMLElement);
    this.pill = root.querySelector('.addfab__pill') as HTMLElement;
    this.plus = root.querySelector('.addfab__plus') as HTMLElement;

    this.onDown = function (e: PointerEvent) {
      e.preventDefault();
      try {
        self.pill.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      self.pressing = true;
      self.hold = false;
      self.wasOpen = self.isOpen();
      self.start = self.local(e);
      clearTimeout(self.ht);
      self.ht = setTimeout(function () {
        if (!self.pressing) return;
        self.hold = true;
        if (!self.isOpen()) {
          self.buzz(8);
          self.setState({ open: true });
        }
      }, 260);
    };
    this.onMove = function (e: PointerEvent) {
      if (!self.pressing) return;
      const l = self.local(e);
      if (!self.hold && Math.hypot(l.x - self.start.x, l.y - self.start.y) > 12) {
        self.hold = true;
        clearTimeout(self.ht);
        if (!self.isOpen()) self.setState({ open: true });
      }
      if (self.hold && self.isOpen()) {
        const h = self.hit(e);
        if (h !== self.state.hover) {
          if (h >= 0) self.buzz(4);
          self.setState({ hover: h });
        }
      }
    };
    this.onUp = function (e: PointerEvent) {
      if (!self.pressing) return;
      self.pressing = false;
      clearTimeout(self.ht);
      if (self.hold) {
        const h = self.hit(e);
        if (h >= 0) self.pick(h);
        else {
          self.setState({ hover: -1 });
          if (self.wasOpen) self.close();
        }
      } else self.setState({ open: !self.isOpen(), hover: -1 });
    };
    this.pill.addEventListener('pointerdown', this.onDown);
    this.pill.addEventListener('pointermove', this.onMove);
    this.pill.addEventListener('pointerup', this.onUp);
    this.pill.addEventListener('pointercancel', this.onUp);
    this.pill.addEventListener('keydown', function (e: KeyboardEvent) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        self.setState({ open: !self.isOpen(), hover: -1 });
      }
    });
    this.scrim.addEventListener('click', function () {
      self.close();
    });
    this.items.forEach(function (el, i) {
      el.addEventListener('click', function (e) {
        e.stopPropagation();
        self.pick(i);
      });
      el.addEventListener('keydown', function (e: KeyboardEvent) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          self.pick(i);
        }
      });
    });
    this.root.addEventListener('keydown', function (e: KeyboardEvent) {
      if (e.key === 'Escape') self.close();
    });

    this.render();
    host.appendChild(root);
  }

  cfg() {
    const o = this.opts,
      b = PLACEMENTS[o.placement] || PLACEMENTS.br;
    return {
      x: o.x != null ? o.x : b.x,
      y: o.y != null ? o.y : b.y,
      dir: o.dir != null ? o.dir : b.dir,
      spread: o.spread != null ? o.spread : b.spread,
      r: o.radius != null ? o.radius : b.r,
    };
  }
  isOpen() {
    return this.state.open != null ? this.state.open : !!this.opts.startOpen;
  }
  local(e: PointerEvent) {
    const r = this.root.getBoundingClientRect();
    return { x: ((e.clientX - r.left) * this.opts.frameW!) / r.width, y: ((e.clientY - r.top) * this.opts.frameH!) / r.height };
  }
  hit(e: PointerEvent) {
    const c = this.cfg(),
      pts = layout(c.x, c.y, c.dir, c.spread, c.r, this.opts.frameW!, this.opts.frameH!),
      l = this.local(e);
    let best = -1,
      bd = 36;
    pts.forEach((p, i) => {
      const d = Math.hypot(l.x - (c.x + p.dx), l.y - (c.y + p.dy));
      if (d < bd) {
        bd = d;
        best = i;
      }
    });
    return best;
  }
  buzz(p: number) {
    try {
      if (navigator.vibrate) navigator.vibrate(p);
    } catch {
      /* ignore */
    }
  }
  later(fn: () => void, ms: number) {
    this.timers.push(setTimeout(fn, ms));
  }
  setState(patch: Partial<AddFabState>) {
    Object.assign(this.state, patch);
    this.render();
  }
  pick(i: number) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    this.buzz(12);
    this.setState({ picked: i, stage: 1, hover: -1 });
    this.later(function () {
      self.setState({ stage: 2 });
    }, 140);
    this.later(function () {
      self.setState({ open: false, picked: -1, stage: 0 });
    }, 620);
    if (this.opts.onSelect) this.opts.onSelect(KINDS[i][0]);
  }
  open() {
    this.setState({ open: true });
  }
  close() {
    this.setState({ open: false, hover: -1, picked: -1, stage: 0 });
  }
  setPlacement(name: AddFabPlacement) {
    this.opts.placement = name;
    this.state = { open: false, hover: -1, picked: -1, stage: 0 };
    this.render();
  }
  destroy() {
    this.timers.forEach(clearTimeout);
    clearTimeout(this.ht);
    this.root.remove();
  }

  render() {
    const c = this.cfg(),
      S = this.state,
      hidden = !!this.opts.hidden,
      open = this.isOpen() && !hidden;
    const pts = layout(c.x, c.y, c.dir, c.spread, c.r, this.opts.frameW!, this.opts.frameH!);
    this.root.style.opacity = hidden ? '0' : '1';
    this.scrim.style.opacity = open ? '1' : '0';
    this.scrim.style.pointerEvents = open ? 'auto' : 'none';
    this.pill.style.left = c.x + 'px';
    this.pill.style.top = c.y + 'px';
    this.pill.setAttribute('aria-expanded', open ? 'true' : 'false');
    this.plus.style.transform = 'rotate(' + (open ? 45 : 0) + 'deg)';
    for (let i = 0; i < 4; i++) {
      const el = this.items[i],
        p = pts[i];
      const picked = S.picked === i,
        other = S.picked >= 0 && !picked,
        shown = open && !other;
      const s = !shown ? 0.3 : picked ? (S.stage === 1 ? 1.18 : 1) : 1;
      el.style.left = c.x + 'px';
      el.style.top = c.y + 'px';
      el.style.transition = picked
        ? 'transform 160ms cubic-bezier(.34,1.56,.64,1)'
        : open
          ? 'transform 420ms cubic-bezier(.34,1.56,.64,1) ' + i * 40 + 'ms, opacity 160ms ease ' + i * 40 + 'ms'
          : 'transform 220ms ease-in ' + (3 - i) * 25 + 'ms, opacity 180ms ease ' + (3 - i) * 25 + 'ms';
      el.style.transform = shown ? 'translate(' + p.dx.toFixed(1) + 'px, ' + p.dy.toFixed(1) + 'px) scale(' + s + ')' : 'translate(0px, 0px) scale(.3)';
      el.style.opacity = shown ? '1' : '0';
      el.style.pointerEvents = shown ? 'auto' : 'none';
      el.tabIndex = shown ? 0 : -1;
      this.circles[i].style.transform = 'scale(' + (S.hover === i ? 1.12 : 1) + ')';
    }
  }
}
