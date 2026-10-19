import type { MkResult, SampleItemId } from '@/scrapbook/fixtures/sampleItems';
import { mk } from '@/scrapbook/fixtures/sampleItems';
import { SAFE } from '../../constants';

/**
 * Frame 1f-4 ("pocket lip") data/algorithm, ported verbatim from
 * references/EnvelopePhone.dc.html's `look === 'lip'` branch (DEF.lip, EXT/top0 for
 * look!=='kraft', FAN, SLOT, SE, and the per-envelope/per-item `envs` map in
 * `renderVals()`). Nothing here is re-derived or "improved" EXCEPT the closed-envelope
 * vertical step, which this task's CHANGE 1 replaces — see ENVELOPE_GAP below.
 */

/**
 * CHANGE 1: the clear vertical space between one envelope's closed footprint (pocket
 * band + label holder + its tallest standing item, at that item's REAL rotated bounds)
 * and the next envelope's footprint. Not a drop-in replacement for the old `DEF.lip` gap
 * (18) — the old model used one fixed step (`EXT + gap` = 190 + 18 = 208) for every
 * envelope regardless of its items' real heights, which is exactly what this task's brief
 * says looked crowded. This constant is the ONLY thing hand-set; the actual closed-Y step
 * between any two envelopes is computed per-pair in `buildEnvelopes()` from each
 * envelope's real measured footprint, specifically so it always comes out to this value.
 */
export const ENVELOPE_GAP = 44;

/** The always-visible pocket band's local y-range (see EnvelopesLip.tsx's `.envelopes-lip-pocket` path) — constant regardless of items, since the body/flap stay invisible (`bodyOp: 0`) until open. */
const POCKET_TOP = 100;
const POCKET_BOTTOM = 154;

/** look==='kraft' ? 150 : 168 — lip takes the non-kraft branch. */
const TOP0_BASE = 168;

const FAN: { x: number; y: number; rot: number }[] = [
  { x: 18, y: 138, rot: -6 },
  { x: 214, y: 128, rot: 5 },
  { x: 116, y: 268, rot: -2 },
  { x: 8, y: 404, rot: 4 },
  { x: 222, y: 392, rot: -5 },
  { x: 120, y: 452, rot: 7 },
];

/** Up to 4 items stand upright in the closed envelope's slot. */
const SLOT: { x: number; rot: number }[] = [
  { x: 22, rot: -2 },
  { x: 96, rot: 1.5 },
  { x: 166, rot: -1 },
  { x: 228, rot: 2 },
];

/** Verbatim from the reference's `SE` — 3 seasons/envelopes. */
const SE: [string, SampleItemId[]][] = [
  ['AUTUMN ’26', ['beer', 'quiet', 'leh', 'film', 'v1']],
  ['SUMMER ’26', ['beach', 'dog', 'buses', 'soup', 'v2', 'anyway']],
  ['WINTER ’25', ['snow']],
];

const OY_BASE = 616;

export interface LipItem extends Omit<MkResult, 'x' | 'y'> {
  x: number;
  y: number;
  op: number;
  delay: number;
  flip: boolean;
}

export interface LipEnvelope {
  label: string;
  y: number;
  op: number;
  pe: 'auto' | 'none';
  bodyOp: number;
  draw: number;
  items: LipItem[];
}

/**
 * Verbatim port of `renderVals()`'s per-envelope/per-item math for `look === 'lip'`.
 *
 * `headerDelta` (this task's HEADER GAP rule): shifts the first envelope and all following
 * ones, plus the open-state landing position (OY), by the same constant — i.e. `top0` and
 * `OY` both get `+ headerDelta`, so every envelope's slot keeps the reference's gap below
 * the header and the open/dropped position still clears it too.
 *
 * `frameH` (Volume 1 SPEC OVERRIDES "page-height logic"): replaces the reference's literal
 * 844 floor.
 *
 * `measuredHeights` (id -> real rendered height in px, optional): the reference derives a
 * closed-slot item's `y` from `132 - h` so every item's BOTTOM edge lands at 132 regardless
 * of height, using `h` from its own fixed per-type size table. The real Stamp/Note/
 * VoicePostcard/ParcelTag don't share that assumption — Stamp's height especially grows
 * with its caption/photo ratio (CLAUDE.md: "150×H (grows with caption)") — so `mk()`'s
 * guessed `h` can be noticeably off. EnvelopesLip.tsx measures each item's real rendered
 * height after mount and feeds it back in here; until that first measurement lands, the
 * `mk()` guess is used so there's still a reasonable position for the very first paint.
 *
 * `rotatedTopDeltas` (id -> px, optional; CHANGE 1): how far a closed-slot item's REAL
 * rotated bounding box extends above (negative) or below (positive) its own unrotated
 * `y`. `transform: rotate(...)` doesn't affect CSS layout sizing, so this can't be derived
 * from `measuredHeights` alone — EnvelopesLip.tsx measures the item's actual rotated DOM
 * node (`.decor-wrap`) directly and feeds the delta back in here. Until measured, 0 (no
 * correction) is used.
 */
export function buildEnvelopes(
  openIndex: number,
  headerDelta: number,
  frameH: number,
  measuredHeights: Record<string, number> = {},
  rotatedTopDeltas: Record<string, number> = {},
): { envs: LipEnvelope[]; innerH: number } {
  const top0 = TOP0_BASE + headerDelta;
  const OY = OY_BASE + headerDelta;
  const any = openIndex >= 0;

  // Each closed-slot item's position (independent of its envelope's own Y), plus this
  // envelope's measured footprint top — the topmost point among the pocket band (always
  // y=100) and every standing item's real rotated top.
  interface ClosedSlot {
    x: number;
    y: number;
    rot: number;
    op: number;
  }
  const built = SE.map(([label, ids]) => {
    let footprintTop = POCKET_TOP;
    const closedItems: ClosedSlot[] = ids.map((id, k) => {
      if (k >= 4) return { x: 100, y: 120, rot: 0, op: 0 };
      const x = SLOT[k].x;
      const h = measuredHeights[id] ?? mk(id, { z: 0.7 }).h;
      const y = Math.round(132 - h);
      const rot = SLOT[k].rot;
      const delta = rotatedTopDeltas[id] ?? 0;
      footprintTop = Math.min(footprintTop, y + delta);
      return { x, y, rot, op: 1 };
    });
    return { label, ids, closedItems, footprintTop };
  });

  // Sequential closed-Y: envelope i's gap from envelope (i-1)'s pocket bottom (154,
  // constant) to envelope i's OWN measured footprint top must equal ENVELOPE_GAP.
  const CY: number[] = [];
  built.forEach((b, i) => {
    CY[i] = i === 0 ? top0 : CY[i - 1] + (POCKET_BOTTOM - b.footprintTop) + ENVELOPE_GAP;
  });

  const lastFootprintHeight = POCKET_BOTTOM - built[built.length - 1].footprintTop;
  // Page/scroll height (CHANGE 1): the last envelope's footprint must be able to scroll
  // fully clear of the bottom safe area, same "+24" clearance convention as the other
  // canvas styles' own bottom-padding formulas.
  const contentH = Math.max(frameH, CY[CY.length - 1] + lastFootprintHeight + SAFE.bottom + 24);
  // Off-screen target for a non-selected envelope while another is open — independent of
  // the closed-stack CY values, but still frame-relative rather than the reference's
  // literal 844-based 920, so it stays comfortably below the real frame at any size.
  const offscreenY = frameH + 100;

  const envs: LipEnvelope[] = built.map((b, i) => {
    const open = openIndex === i;
    const items: LipItem[] = b.ids.map((id, k) => {
      if (open) {
        const f = FAN[k % 6];
        const x = f.x - 30;
        const y = f.y - OY;
        return { ...mk(id, { x, y, rot: f.rot, z: 0.7, attach: 'none' }), x, y, op: 1, delay: k * 30, flip: true };
      }
      const slot = b.closedItems[k];
      return { ...mk(id, { x: slot.x, y: slot.y, rot: slot.rot, z: 0.7, attach: 'none' }), x: slot.x, y: slot.y, op: slot.op, delay: k * 30, flip: false };
    });
    return {
      label: b.label,
      y: !any ? CY[i] : open ? OY : offscreenY,
      op: !any || open ? 1 : 0,
      pe: !any || open ? 'auto' : 'none',
      bodyOp: open ? 1 : 0,
      draw: open ? 0 : 1,
      items,
    };
  });

  return { envs, innerH: any ? frameH : contentH };
}
