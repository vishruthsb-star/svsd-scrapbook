import { BELT, BODY_LENGTH, CARD_CENTER, FRONT_WIDTH, TOP_OFFSET, type LibraryConfig, type LibraryPerson } from './types';

export type Point = [number, number];

/**
 * Deterministic 2D hash (same maths as the harness) — a seeded, non-random jitter so the
 * same (seed, index) always produces the same "wobble". No Math.random anywhere in this
 * module: the output must be identical on every render (and identical server/client, if
 * ever rendered there), or the hand-drawn line would shift and could cause a hydration
 * mismatch.
 */
export function hsh(a: number, b: number): number {
  const v = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return (v - Math.floor(v)) * 2 - 1;
}

/** Jitter amplitude from the "line quality" dial. */
export function amp(quality: number): number {
  return (1.1 * quality) / 100;
}

export function jit(pts: Point[], seed: number, a: number): Point[] {
  return pts.map((p, i): Point => (a ? [p[0] + a * hsh(seed, i * 2 + 1), p[1] + a * hsh(seed + 0.37, i * 2 + 2)] : [p[0], p[1]]));
}

export interface CornerSeg {
  a: Point;
  P: Point;
  b: Point;
}

/** Rounds each vertex of a polygon into a short straight run-in/out around a quadratic curve through it. */
export function corners(pts: Point[], rad: number[]): CornerSeg[] {
  const n = pts.length;
  return pts.map((P, i): CornerSeg => {
    const A = pts[(i - 1 + n) % n],
      B = pts[(i + 1) % n];
    const la = Math.hypot(A[0] - P[0], A[1] - P[1]) || 1,
      lb = Math.hypot(B[0] - P[0], B[1] - P[1]) || 1;
    const r = Math.min(rad[i] || 0, la / 2, lb / 2);
    return {
      a: [P[0] + ((A[0] - P[0]) * r) / la, P[1] + ((A[1] - P[1]) * r) / la],
      P,
      b: [P[0] + ((B[0] - P[0]) * r) / lb, P[1] + ((B[1] - P[1]) * r) / lb],
    };
  });
}

function fp(p: Point): string {
  return p[0].toFixed(2) + ' ' + p[1].toFixed(2);
}

/** Serializes a closed sequence of rounded corners into one continuous SVG path — no seams. */
export function ser(cs: CornerSeg[], idx: number[]): string {
  return (
    idx
      .map((i, k) => {
        const c = cs[i];
        return (k ? 'L' : 'M') + fp(c.a) + ' Q' + fp(c.P) + ' ' + fp(c.b);
      })
      .join(' ') + ' Z'
  );
}

/** A closed, hand-wobbled, corner-rounded shape as one path string. */
export function shape(pts: Point[], rad: number[], seed: number, quality: number): string {
  const cs = corners(jit(pts, seed, amp(quality)), rad);
  return ser(
    cs,
    pts.map((_, i) => i),
  );
}

/** An open, hand-wobbled polyline (used for the drawer's crease line). */
export function polyline(pts: Point[], seed: number, quality: number): string {
  return jit(pts, seed, amp(quality))
    .map((p, i) => (i ? 'L' : 'M') + fp(p))
    .join(' ');
}

export function rectPts(x: number, y: number, w: number, h: number): Point[] {
  return [
    [x, y],
    [x + w, y],
    [x + w, y + h],
    [x, y + h],
  ];
}

/* ------------------------------------------------------------------
   Layout model: depth is a property of the folder's index, never of where it currently
   sits. 0 = backmost/narrowest; each nearer folder is `growth`% wider; all centred on
   CARD_CENTER. A folder occupies one of two slots: top (behind/at the open folder) or
   shelf (in front of it).
------------------------------------------------------------------ */
export function widthOf(i: number, n: number, growth: number): number {
  return FRONT_WIDTH / Math.pow(1 + growth / 100, n - 1 - i);
}

export function topBase(tabH: number): number {
  return TOP_OFFSET + tabH + 6;
}

export function slotTop(i: number, tabH: number, gap: number): number {
  return topBase(tabH) + gap * i;
}

export function slotShelf(i: number, n: number, gap: number): number {
  return BELT - gap * (n - i);
}

export function targetY(i: number, sel: number, n: number, tabH: number, gap: number): number {
  return i <= sel ? slotTop(i, tabH, gap) : slotShelf(i, n, gap);
}

/** Same for every open folder — the visible height of the cover window. */
export function windowH(n: number, gap: number, tabH: number): number {
  return BELT - gap * (n - 1) - tabH - topBase(tabH);
}

export function compH(lip: number, crop: number): number {
  return BELT + lip + crop;
}

export interface FolderGeometry {
  bodyD: string;
  fillD: string;
  pshadowD: string;
  frameD: string;
  markD: string;
  tabLeft: number;
  tabTopPx: number;
  tabWidthPx: number;
  tabHeightPx: number;
  fontSizePx: number;
  pressOriginX: number;
  pressOriginY: number;
  width: number;
  left: number;
  right: number;
  /** cover/frame rect, in the folder's own coordinate space */
  frameX: number;
  frameY: number;
  frameW: number;
  frameH: number;
}

/**
 * Builds one folder's entire geometry: the single continuous outline path (flat edge,
 * concave fillet, slanted rise, convex tab corner, flat tab top, mirrored back down — no
 * seam at the tab base), the tab fill/unread-mark cutouts, the cover frame, and the tab's
 * own pixel box. Matches the harness's per-folder block in `applyGeometry` exactly.
 */
export function buildFolderGeometry(i: number, n: number, person: LibraryPerson, cfg: LibraryConfig): FolderGeometry {
  const a = amp(cfg.quality);
  const th = cfg.tabH;
  const W = widthOf(i, n, cfg.growth);
  const L = CARD_CENTER - W / 2,
    R = CARD_CENTER + W / 2;
  const tw = (W * cfg.tabW) / 100,
    m = W * 0.04;
  const tl = L + m + (person.col * (W - 2 * m - tw)) / 2;
  const dx = Math.min(th / Math.tan((cfg.slant * Math.PI) / 180), tw * 0.34);

  const pts: Point[] = [
    [L, 0],
    [tl, 0],
    [tl + dx, -th],
    [tl + tw - dx, -th],
    [tl + tw, 0],
    [R, 0],
    [R, BODY_LENGTH],
    [L, BODY_LENGTH],
  ];
  const cs = corners(jit(pts, i * 13 + 1, a), [cfg.sheetRadius, cfg.fillet, cfg.tabRadius, cfg.tabRadius, cfg.fillet, cfg.sheetRadius, 0, 0]);
  const bodyD = ser(cs, [0, 1, 2, 3, 4, 5, 6, 7]);
  const fillD = ser(cs, [1, 2, 3, 4]);

  const py0 = cfg.gap + 8,
    py1 = windowH(n, cfg.gap, th) + th + 22;
  const px = L + 13,
    pw = W - 26,
    ph = py1 - py0;
  const pshadowD = cfg.shadow > 0 ? shape(rectPts(px + cfg.shadow, py0 + cfg.shadow, pw, ph), [0, 0, 0, 0], i * 13 + 4, cfg.quality) : 'M0 0';
  const frameD = shape(rectPts(px, py0, pw, ph), [0, 0, 0, 0], i * 13 + 5, cfg.quality);

  const mk = person.unread ? 11 : 0;
  const markD = mk ? shape(rectPts(tl + tw - dx - 8, -th * 0.62, 5, 6), [0, 0, 0, 0], i * 13 + 9, cfg.quality) : 'M0 0';

  return {
    bodyD,
    fillD,
    pshadowD,
    frameD,
    markD,
    tabLeft: tl + dx,
    tabTopPx: -th,
    tabWidthPx: tw - 2 * dx - mk,
    tabHeightPx: th,
    fontSizePx: (cfg.tabSize * W) / FRONT_WIDTH,
    pressOriginX: tl + tw / 2,
    pressOriginY: -th / 2,
    width: W,
    left: L,
    right: R,
    frameX: px,
    frameY: py0,
    frameW: pw,
    frameH: ph,
  };
}

export interface DrawerGeometry {
  d: string;
  creaseD: string;
  top: number;
  halfWidth: number;
}

/** Drawer front: wider than the cabinet, a top lip, sides converging downward. */
export function buildDrawerGeometry(cfg: LibraryConfig): DrawerGeometry {
  const hw = FRONT_WIDTH / 2 + cfg.overhang,
    lip = cfg.lip,
    inset = lip * 0.9,
    H = 420,
    cv = (cfg.converge / 100) * H;
  const d = shape(
    [
      [CARD_CENTER - hw + inset, 0],
      [CARD_CENTER + hw - inset, 0],
      [CARD_CENTER + hw, lip],
      [CARD_CENTER + hw - cv, lip + H],
      [CARD_CENTER - hw + cv, lip + H],
      [CARD_CENTER - hw, lip],
    ],
    [2, 2, 1.5, 0, 0, 1.5],
    101,
    cfg.quality,
  );
  const creaseD =
    lip > 0
      ? polyline(
          [
            [CARD_CENTER - hw + 1, lip],
            [CARD_CENTER + hw - 1, lip],
          ],
          103,
          cfg.quality,
        )
      : 'M0 0';
  return { d, creaseD, top: BELT, halfWidth: hw };
}
