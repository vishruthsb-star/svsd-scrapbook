import type { MkResult, SampleItemId, SampleItemPlacement } from '@/scrapbook/fixtures/sampleItems';
import { mk } from '@/scrapbook/fixtures/sampleItems';
import { FAB_PILL_HEIGHT, SAFE } from '../../constants';
import { hash } from '../../itemSeed';
import { rng } from '../../rng';
import type { PlacedMemory } from '@/scrapbook/placement';
import type { PlacedBoopStamp } from '@/scrapbook/boopStamps';
import { findCompactPlacement } from '@/scrapbook/placement/compactPlacement';

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
  dynamicItems: DynamicStrataItem[];
  boopStamps: PackedBoopStamp[];
}

/** A created item lives in its month's real strip, never in a canvas-level overlay. */
export interface DynamicStrataItem {
  memory: PlacedMemory;
  x: number;
  y: number;
  rot: number;
  z: number;
}

export interface PackedBoopStamp { stamp: PlacedBoopStamp; x: number; y: number; }

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

function memoryLabel(memory: PlacedMemory): string {
  const date = new Date(memory.createdAt);
  return `${MONTHS[date.getUTCMonth()] ?? 'JAN'} ${date.getUTCFullYear()}`;
}

function labelOrder(label: string): number {
  const [month, yearText] = label.split(' ');
  const year = Number(yearText) || 0;
  // The intentional Jan-May fixture section follows JUN in the reference ordering.
  const monthIndex = label.startsWith('JAN') ? 4 : Math.max(0, MONTHS.indexOf(month));
  return year * 12 + monthIndex;
}

function naturalSize(memory: PlacedMemory): [number, number] {
  if (memory.kind === 'stamp') {
    const ratio = Math.max(.5, Math.min(2, memory.ratio ?? 1));
    const captionLines = Math.max(0, Math.ceil((memory.text?.length ?? 0) / 19));
    return [150, 122 / ratio + 32 + captionLines * 18];
  }
  if (memory.kind === 'note') return [200, Math.max(170, 50 + Math.ceil((memory.text?.length ?? 0) / 20) * 30)];
  if (memory.kind === 'voice') return [230, 146];
  return [124, Math.max(158, 116 + Math.ceil((memory.text?.length ?? 0) / 13) * 15)];
}

function mixedSeed(value: string): number {
  let seed = hash(value) >>> 0;
  seed ^= seed >>> 16;
  seed = Math.imul(seed, 0x45d9f3b) >>> 0;
  seed ^= seed >>> 16;
  return seed >>> 0;
}

function dynamicRotation(id: string): number {
  const value = mixedSeed(id) / 0xffffffff;
  const rotation = -5 + value * 10;
  return Math.abs(rotation) < .7 ? (rotation < 0 ? -.7 : .7) : Number(rotation.toFixed(2));
}

interface Bounds { x: number; y: number; w: number; h: number; }

function rotatedBounds(x: number, y: number, width: number, height: number, rotation: number): Bounds {
  const radians = Math.abs(rotation) * Math.PI / 180;
  const w = Math.abs(width * Math.cos(radians)) + Math.abs(height * Math.sin(radians));
  const h = Math.abs(width * Math.sin(radians)) + Math.abs(height * Math.cos(radians));
  return { x: x - (w - width) / 2, y: y - (h - height) / 2, w, h };
}

/** Deterministic, rotation-aware packing below the reference fixtures in each strip. */
export function packDynamicStrataItems(memories: PlacedMemory[], startY: number, frameW: number, initialOccupied: Bounds[] = []): DynamicStrataItem[] {
  const occupied: Bounds[] = [...initialOccupied];
  return [...memories].sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id)).map((memory) => {
    const z = .84;
    const [naturalW, naturalH] = naturalSize(memory);
    const width = naturalW * z;
    const height = naturalH * z;
    const rotation = dynamicRotation(memory.id);
    const footprint = rotatedBounds(0, 0, width, height, rotation);
    const placed = findCompactPlacement({ frameWidth: frameW, startY, item: { w: footprint.w, h: footprint.h }, occupied, seed: mixedSeed(memory.id) });
    occupied.push({ x: placed.x, y: placed.y, w: footprint.w, h: footprint.h });
    return { memory, x: Math.round(placed.x + (footprint.w - width) / 2), y: Math.round(placed.y + (footprint.h - height) / 2), rot: rotation, z };
  });
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
export function buildStrata(headerDelta: number, frameW: number, memories: PlacedMemory[] = [], boopStamps: PlacedBoopStamp[] = []): { strata: StrataStrip[]; acc: number } {
  const byLabel = new Map<string, PlacedMemory[]>();
  for (const memory of memories) {
    const label = memoryLabel(memory);
    byLabel.set(label, [...(byLabel.get(label) ?? []), memory]);
  }
  const boopsByLabel = new Map<string, PlacedBoopStamp[]>();
  for (const stamp of boopStamps) {
    const label = memoryLabel({ createdAt: stamp.createdAt } as PlacedMemory);
    boopsByLabel.set(label, [...(boopsByLabel.get(label) ?? []), stamp]);
  }
  const definitions: StripDef[] = [...ST];
  for (const label of byLabel.keys()) {
    if (!definitions.some((definition) => definition.label === label)) definitions.push({ label, h: 142, tex: 'grid', its: [] });
  }
  definitions.sort((a, b) => labelOrder(b.label) - labelOrder(a.label));
  let acc = 0;
  const strata = definitions.map((s) => {
    const pad = s.pad ? s.pad + headerDelta : 0;
    const baseHeight = s.h + pad;
    const items = s.its.map(([id, p]) => ({ ...mk(id, p), y: (p.y ?? 0) + pad }));
    const fixtureBottom = items.reduce((bottom, item) => Math.max(bottom, item.y + item.h), pad + 64);
    const fixtureBounds = items.map((item) => rotatedBounds(item.x ?? 0, item.y, item.w, item.h, item.rot));
    // Start below the month label, not below every fixture: the shared placer can now use
    // genuine side gaps between the authored objects before it grows the paper vertically.
    const dynamicItems = packDynamicStrataItems(byLabel.get(s.label) ?? [], pad + 64, frameW, fixtureBounds);
    const dynamicBottom = dynamicItems.reduce((bottom, item) => Math.max(bottom, item.y + naturalSize(item.memory)[1] * item.z + 24), fixtureBottom);
    const occupied = [
      ...fixtureBounds,
      ...dynamicItems.map((item) => { const [w, h] = naturalSize(item.memory); return rotatedBounds(item.x, item.y, w * item.z, h * item.z, item.rot); }),
    ];
    const boopStamps = [...(boopsByLabel.get(s.label) ?? [])].sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id)).map((stamp) => {
      const footprint = rotatedBounds(0, 0, stamp.width, stamp.width, stamp.rotation);
      const placed = findCompactPlacement({ frameWidth: frameW, startY: pad + 64, item: { w: footprint.w, h: footprint.h }, occupied, seed: Math.abs(hash(stamp.id)) });
      occupied.push({ x: placed.x, y: placed.y, w: footprint.w, h: footprint.h });
      return { stamp, x: Math.round(placed.x + (footprint.w - stamp.width) / 2), y: Math.round(placed.y + (footprint.h - stamp.width) / 2) };
    });
    const boopBottom = boopStamps.reduce((bottom, item) => Math.max(bottom, item.y + item.stamp.width + 24), dynamicBottom);
    const hh = Math.max(baseHeight, Math.ceil(boopBottom));
    const sourceIndex = ST.findIndex((definition) => definition.label === s.label);
    const t = tear(frameW, hh, sourceIndex >= 0 ? 11 + sourceIndex * 7919 : Math.abs(hash(s.label)));
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
      items,
      dynamicItems,
      boopStamps,
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
