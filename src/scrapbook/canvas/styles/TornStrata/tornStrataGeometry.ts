import type { MkResult, SampleItemId, SampleItemPlacement } from '@/scrapbook/fixtures/sampleItems';
import { mk } from '@/scrapbook/fixtures/sampleItems';
import { FAB_PILL_HEIGHT, SAFE } from '../../constants';
import { hash } from '../../itemSeed';
import { rng } from '../../rng';

export { hash, rng };

/**
 * Torn-strata data/algorithm, ported verbatim from references/Scrapbook Directions.dc.html's
 * `renderVals()` "1a torn strata" section (and its `rng`/`hash`/`tear`/`mk` helpers on the
 * same class) — docs/scrapbook-canvas-spec.md's "DATA AND ALGORITHM". Numbers, seeds, and
 * the accumulate-then-`.reverse()` DOM-order trick are copied as-is; nothing here is
 * "improved" or re-derived.
 */

export type StrataTexture = 'grid' | 'lined' | 'dot' | 'kraft';

interface StripDef {
  label: string;
  h: number;
  tex: StrataTexture;
  /** Only the first (OCT 2026) strip has this — the header-clearance pad. */
  pad?: number;
  quiet?: boolean;
  first?: boolean;
  its: Array<[SampleItemId, SampleItemPlacement]>;
}

/** Verbatim from the reference's `ST` array — 7 strips, oldest-last (reversed below to oldest-first DOM order). */
const ST: StripDef[] = [
  {
    label: 'OCT 2026',
    h: 420,
    tex: 'grid',
    pad: 118,
    its: [
      ['beer', { x: 30, y: 84, rot: -4, z: 1, attach: 'tape' }],
      ['quiet', { x: 222, y: 124, rot: 6, z: 0.85 }],
    ],
  },
  {
    label: 'SEP 2026',
    h: 470,
    tex: 'lined',
    its: [
      ['film', { x: 18, y: 76, rot: -3, z: 0.85, attach: 'clip' }],
      ['leh', { x: 216, y: 60, rot: 4, z: 0.9 }],
      ['v1', { x: 74, y: 294, rot: 2, z: 0.82, attach: 'tape' }],
    ],
  },
  {
    label: 'AUG 2026',
    h: 420,
    tex: 'dot',
    its: [
      ['beach', { x: 204, y: 64, rot: 3, z: 1 }],
      ['dog', { x: 16, y: 156, rot: -2, z: 0.85, attach: 'tape' }],
    ],
  },
  {
    label: 'JUL 2026',
    h: 380,
    tex: 'kraft',
    its: [
      ['buses', { x: 50, y: 120, rot: -5, z: 0.85 }],
      ['soup', { x: 200, y: 78, rot: 4, z: 0.9, attach: 'corners' }],
    ],
  },
  {
    label: 'JUN 2026',
    h: 370,
    tex: 'grid',
    its: [
      ['v2', { x: 18, y: 80, rot: -3, z: 0.85, attach: 'tape' }],
      ['anyway', { x: 184, y: 184, rot: 3, z: 0.85 }],
    ],
  },
  { label: 'JAN – MAY 2026', h: 140, tex: 'lined', quiet: true, its: [] },
  {
    label: 'DEC 2025',
    h: 400,
    tex: 'dot',
    first: true,
    its: [['snow', { x: 126, y: 80, rot: -2, z: 0.95, attach: 'tape' }]],
  },
];

/**
 * Verbatim port of the reference's `tear(w, h, seed)`. `main`'s map doesn't consume `r()`;
 * `fib`'s map does, once per point, continuing the same rng sequence `main` left untouched
 * — evaluated in object-literal source order (`main` then `fib`), exactly like the
 * reference, so the two paths stay in sync with it pixel for pixel.
 */
export function tear(w: number, h: number, seed: number): { main: string; fib: string } {
  const r = rng(seed);
  const pts: Array<[number, number]> = [];
  const f = (n: number) => n.toFixed(1);
  for (let x = w + 8; x > -8; x -= 4 + r() * 9) {
    pts.push([x, h + 4 + r() * 8 + (r() < 0.12 ? 6 + r() * 8 : 0)]);
  }
  pts.push([-8, h + 6]);
  const top = `M-8 0L${w + 8} 0`;
  return {
    main: top + pts.map((p) => `L${f(p[0])} ${f(p[1])}`).join('') + 'Z',
    fib: top + pts.map((p) => `L${f(p[0])} ${f(p[1] + 2 + r() * 2.5)}`).join('') + 'Z',
  };
}

export interface StrataItem extends MkResult {
  y: number;
}

export interface StrataStrip {
  label: string;
  tex: StrataTexture;
  top: number;
  hh: number;
  svgH: number;
  main: string;
  fib: string;
  labelTop: number;
  isQuiet: boolean;
  isFirst: boolean;
  items: StrataItem[];
}

/**
 * Verbatim port of `renderVals()`'s strata accumulation. `headerDelta` is the app's
 * measured-header correction (docs/scrapbook-canvas-spec.md's "Header offset
 * compensation") applied only to the first strip's `pad` (118), per this task's HEADER GAP
 * section — every other strip is untouched.
 *
 * `frameW` (Volume 1 SPEC OVERRIDES): the torn silhouette is a full-bleed layer, so `tear()`
 * is called with the real frame width instead of the reference's fixed 390 — since `tear()`
 * is a seeded point-walk whose point COUNT depends on the width it's walking (not just a
 * stretch of the same points), the silhouette's exact tooth pattern differs slightly from
 * the 390-reference whenever frameW != 390, as the overrides anticipated.
 *
 * DOM order: the reference calls `.reverse()` on the mapped array so the DOM renders
 * oldest-first (DEC 2025 first, OCT 2026 last) — newer strips paint over older ones below
 * them. `top` pixel offsets are computed BEFORE the reverse, in the original (newest-first)
 * ST order, so OCT 2026 still sits at `top: 0`. Do not sort/re-derive this order.
 */
export function buildStrata(headerDelta: number, frameW: number): { strata: StrataStrip[]; acc: number } {
  let acc = 0;
  const strata = ST.map((s, i) => {
    const pad = s.pad ? s.pad + headerDelta : 0;
    const hh = s.h + pad;
    const t = tear(frameW, hh, 11 + i * 7919);
    const strip: StrataStrip = {
      label: s.label,
      tex: s.tex,
      top: acc,
      hh,
      svgH: hh + 30,
      main: t.main,
      fib: t.fib,
      labelTop: pad + 36,
      isQuiet: !!s.quiet,
      isFirst: !!s.first,
      items: s.its.map(([id, p]) => ({ ...mk(id, p), y: (p.y ?? 0) + pad })),
    };
    acc += hh;
    return strip;
  }).reverse();
  return { strata, acc };
}

/**
 * sH: page (content-wrapper) height. Per this task's BOTTOM PADDING section: `acc + 40`
 * always, plus `FAB_PILL_HEIGHT + SAFE.bottom + 24` (pill height + bottom safe area + a
 * 24px clearance gap) when the add button is present (`view === 'visitor'`), so the last
 * strip can scroll clear of it.
 */
export function strataPageHeight(acc: number, view: 'own' | 'visitor'): number {
  const bottomExtra = view === 'visitor' ? FAB_PILL_HEIGHT + SAFE.bottom + 24 : 0;
  return acc + 40 + bottomExtra;
}
