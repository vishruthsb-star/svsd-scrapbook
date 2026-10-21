import type { MkResult, SampleItemAttach, SampleItemId, SampleItemType } from '@/scrapbook/fixtures/sampleItems';
import { IDS, IT, mk } from '@/scrapbook/fixtures/sampleItems';
import { rng } from '../../rng';
import type { PlacedMemory } from '@/scrapbook/placement';
import type { PlacedBoopStamp } from '@/scrapbook/boopStamps';
import { elementSize, isBoopStamp, packElements, rotatedBounds, wheelMonthForElement } from '@/scrapbook/placement/dynamicLayout';

/**
 * Frame 1e-paper ("paper wheel") data/algorithm, ported verbatim from the
 * `material === 'paper'` branch of references/WheelPhone.dc.html's `renderVals()`
 * (`cfg()`, `mOf`/`eff`/`di`, `torn()`, the `items`/`fit` scaling, and the `months` loop).
 * Only the paper branch is ported — dot/stamp/tape are a different material this task
 * doesn't ask for. Harness defaults only: radius 246, rise 198 (no sliders).
 */

export const RADIUS = 246;
export const RISE = 198;
const OUTER_R = RADIUS + 22;
/** Wheel-local center (both x and y) — fixed, since radius never changes (no slider). */
const C = OUTER_R + 14;
export const WHEEL_D = 2 * C;

/** cfg() for material !== 'dot': n=12 (full year), step=30deg/month, k=.6 (dx*.6deg per px, i.e. 50px ≈ 1 month over 30deg). */
const N = 12;
const STEP = 30;
const K = 0.6;

const FULL = [
  'november',
  'december',
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
];

interface DPEntry {
  x: number;
  y: number;
  z: number;
  rot: number;
  attach?: SampleItemAttach;
}

/** Verbatim from the reference's `DP` — per-item placement above the wheel. */
const DP: Record<SampleItemId, DPEntry> = {
  beer: { x: 30, y: 236, z: 1, rot: -4, attach: 'tape' },
  quiet: { x: 222, y: 296, z: 0.9, rot: 6 },
  film: { x: 16, y: 236, z: 0.85, rot: -3, attach: 'clip' },
  leh: { x: 216, y: 222, z: 0.9, rot: 4 },
  v1: { x: 90, y: 436, z: 0.82, rot: 2 },
  beach: { x: 30, y: 236, z: 1, rot: -3 },
  dog: { x: 184, y: 340, z: 0.85, rot: 3, attach: 'tape' },
  buses: { x: 64, y: 290, z: 0.9, rot: -5 },
  soup: { x: 204, y: 250, z: 0.95, rot: 4, attach: 'corners' },
  v2: { x: 22, y: 250, z: 0.85, rot: -3, attach: 'tape' },
  anyway: { x: 180, y: 390, z: 0.85, rot: 3 },
  snow: { x: 118, y: 250, z: 1, rot: -2, attach: 'tape' },
};

/** month slot index (0..11) -> 1e month index (-1..10, -1 = "nov '25" padding, 0 = dec 2025). */
export function mOf(i: number): number {
  return i - 1;
}

/** Verbatim port of `eff()`: the month slot currently closest to the needle, from `di`/`ddx`. */
export function effFromDi(di: number, ddx: number): number {
  return Math.max(0, Math.min(N - 1, Math.round(di - (ddx * K) / STEP)));
}

/**
 * Verbatim port of the reference's `torn(C, R, seed, spiky)` — a seeded closed torn-paper
 * disc outline (same 16807 LCG as `tear()`, but walking a full circle instead of a strip).
 */
export function torn(c: number, R: number, seed: number, spiky: boolean): string {
  const r = rng(seed);
  const p1 = r() * 6.28;
  const p2 = r() * 6.28;
  const p3 = r() * 6.28;
  const pts: string[] = [];
  for (let a = 0; a < 360; a += 1.2) {
    const t = (a * Math.PI) / 180;
    let rr = R + 2.2 * Math.sin(3 * t + p1) + 1.6 * Math.sin(7 * t + p2) + Math.sin(13 * t + p3) + r() * (spiky ? 3.4 : 1.3);
    if (r() < 0.03) rr -= 2.5;
    pts.push((c + rr * Math.sin(t)).toFixed(1) + ' ' + (c - rr * Math.cos(t)).toFixed(1));
  }
  return 'M' + pts.join('L') + 'Z';
}

export interface WheelItem extends Omit<MkResult, 'id' | 'x' | 'y' | 'type'> {
  id: string;
  type: SampleItemType | 'boop';
  x: number;
  y: number;
  op: number;
  tf: string;
  pe: 'auto' | 'none';
  memory?: PlacedMemory;
  boop?: PlacedBoopStamp;
}

export interface WheelMonth {
  index: number;
  a: number;
  label: string;
  ff: string;
  fw: number;
  fs: number;
  ls: number;
  col: string;
  lx: number;
  ly: number;
  lo: number;
  underline: boolean;
}

export interface WheelResult {
  dMonth: string;
  dYear: string;
  dQuiet: boolean;
  qTop: number;
  qH: number;
  qHi: number;
  items: WheelItem[];
  months: WheelMonth[];
  wt: number;
  cy: number;
  wx: number;
  wy: number;
  dRot: string;
  pUnder: string;
  pFibre: string;
  pTop: string;
  tabTop: number;
  nTick: string;
}

/**
 * Verbatim port of `renderVals()` for `material === 'paper'`. `frameH` (Volume 1 SPEC
 * OVERRIDES) replaces the reference's literal 844 in `wt = frameH - rise` — the wheel is
 * bottom-anchored, so a taller frame just gives the disc more room below the items,
 * exactly like the reference's own rise-from-bottom-edge framing. This page never passes
 * `fab` to WheelPhone's own (unused) internal AddFab wiring, so `availB` always takes the
 * `wt - 20` branch (the `fab ? ... : ` clamp never applies) — matches frame 1e-paper's own
 * `<dc-import name="WheelPhone" material="paper" radius=... rise=...>` call, which omits
 * `fab` entirely.
 */
export function buildWheel(di: number, ddx: number, frameH: number, frameW = 390, memories: readonly PlacedMemory[] = [], boopStamps: readonly PlacedBoopStamp[] = [], measuredHeights: Record<string, number> = {}): WheelResult {
  const wt = frameH - RISE;
  const cy = wt + OUTER_R;

  const eff = effFromDi(di, ddx);
  const m = mOf(eff);
  const availB = wt - 20;

  const fit: Record<number, number> = {};
  IDS.forEach((id) => {
    const mm = IT[id].m;
    const d = DP[id];
    const baseH = mk(id, { z: 1 }).h;
    fit[mm] = Math.max(fit[mm] ?? 0, d.y + baseH * d.z);
  });

  const items: WheelItem[] = IDS.map((id) => {
    const b = IT[id];
    const d = DP[id];
    const base = mk(id, { z: 1 });
    const k = Math.max(0.45, Math.min(1, (availB - 220) / (fit[b.m] - 220)));
    const w = base.w * d.z;
    const z = d.z * k;
    const cx = 195 + (d.x + w / 2 - 195) * k;
    const vis = b.m === m;
    const x = Math.round(cx - (w * k) / 2);
    const y = Math.round(220 + (d.y - 220) * k);
    const merged = mk(id, { x, y, rot: d.rot, z, attach: d.attach });
    return { ...merged, x, y, op: vis ? 1 : 0, tf: vis ? 'translateY(0px)' : 'translateY(24px)', pe: vis ? 'auto' : 'none' };
  });

  const fixtureBounds = items.filter((item) => item.op === 1).map((item) => rotatedBounds(item.x, item.y, item.w, item.h, item.rot));
  const dynamicItems: WheelItem[] = packElements([...memories, ...boopStamps].filter((element) => wheelMonthForElement(element) === m), frameW, 220, fixtureBounds, measuredHeights, .82).map((placed) => {
    const element = placed.element;
    const [w, h] = elementSize(element, measuredHeights[element.id]);
    if (isBoopStamp(element)) return {
      id: element.id, type: 'boop', date: '', year: '', from: '', hand: 0, m, rot: placed.rot, z: placed.z, w, h, hint: '', x: placed.x, y: placed.y, op: 1, tf: 'translateY(0px)', pe: 'auto', boop: element,
    };
    const date = new Date(element.createdAt);
    return {
      id: element.id, type: element.kind, text: element.text,
      date: date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }), year: String(date.getFullYear()),
      src: element.src, ratio: element.ratio, from: element.authorId,
      hand: 0, m, rot: placed.rot, z: placed.z, w: w * placed.z, h: h * placed.z, hint: '',
      x: placed.x, y: placed.y, op: 1, tf: 'translateY(0px)', pe: 'auto', memory: element,
    };
  });

  const hasM = (mm: number) => IDS.some((id) => IT[id].m === mm) || [...memories, ...boopStamps].some((element) => wheelMonthForElement(element) === mm);
  const qH = Math.max(80, Math.min(200, availB - 236));
  const qTop = Math.round((220 + availB) / 2 - qH / 2);

  const months: WheelMonth[] = Array.from({ length: N }, (_, i) => {
    const mm = mOf(i);
    const has = hasM(mm);
    const a = i * STEP;
    const nm = FULL[mm + 1];
    const short = nm.slice(0, 3);
    const dl = OUTER_R - 36;
    const label = mm === -1 ? 'nov ’25' : mm === 0 ? 'dec' : short;
    return {
      index: i,
      a,
      label,
      ff: "'Shantell Sans',cursive",
      fw: has ? 400 : 300,
      fs: 18,
      ls: 0,
      col: has ? '#111111' : '#6F695F',
      lx: C - 45,
      ly: Math.round(C - dl - 14),
      lo: Math.round(dl + 14),
      underline: has,
    };
  });

  const yr = (mm: number) => (mm <= 0 ? '2025' : '2026');

  return {
    dMonth: FULL[m + 1],
    dYear: yr(m),
    dQuiet: !hasM(m),
    qTop,
    qH,
    qHi: qH - 6,
    items: [...items, ...dynamicItems],
    months,
    wt,
    cy,
    wx: 195 - C,
    wy: cy - C,
    dRot: (-(di * STEP) + ddx * K).toFixed(2),
    pUnder: torn(C, OUTER_R - 2, 5, false),
    pFibre: torn(C, OUTER_R - 3, 13, true),
    pTop: torn(C, OUTER_R - 6, 9, false),
    tabTop: wt - 24,
    nTick: `M188 ${wt + 8}L195 ${wt + 20}L203 ${wt + 3}`,
  };
}
