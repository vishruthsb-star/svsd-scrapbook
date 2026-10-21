import type { SampleItemAttach, SampleItemId, SampleItemType } from '@/scrapbook/fixtures/sampleItems';
import { mk } from '@/scrapbook/fixtures/sampleItems';
import { SAFE } from '../../constants';
import type { PlacedMemory } from '@/scrapbook/placement';
import type { PlacedBoopStamp } from '@/scrapbook/boopStamps';
import { envelopeForElement, memorySize, sortMemories } from '@/scrapbook/placement/dynamicLayout';

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

export interface LipItem {
  id: string;
  type: SampleItemType;
  text?: string;
  label?: string;
  city?: string;
  date: string;
  year: string;
  denom?: string;
  dur?: string;
  src?: string;
  ratio?: number;
  from: string;
  attach?: SampleItemAttach;
  seed?: number;
  memory?: PlacedMemory;
  boop?: PlacedBoopStamp;
  x: number;
  y: number;
  rot: number;
  z: number;
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
  page: number;
  pageCount: number;
}

interface EnvelopeEntry { id: string; fixtureId?: SampleItemId; memory?: PlacedMemory; boop?: PlacedBoopStamp; }

function entriesForEnvelope(index: number, memories: readonly PlacedMemory[], boopStamps: readonly PlacedBoopStamp[]): EnvelopeEntry[] {
  const fixtures: EnvelopeEntry[] = SE[index][1].map((fixtureId) => ({ id: fixtureId, fixtureId }));
  const dynamic: EnvelopeEntry[] = sortMemories(memories.filter((memory) => envelopeForElement(memory) === index)).map((memory) => ({ id: memory.id, memory }));
  const boops: EnvelopeEntry[] = [...boopStamps].filter((stamp) => envelopeForElement(stamp) === index).sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id)).map((boop) => ({ id: boop.id, boop }));
  const dynamicEntries = [...dynamic, ...boops].sort((a, b) => (a.memory?.createdAt ?? a.boop?.createdAt ?? '').localeCompare(b.memory?.createdAt ?? b.boop?.createdAt ?? '') || a.id.localeCompare(b.id));
  return [...fixtures, ...dynamicEntries];
}

export function envelopePageForMemory(memory: PlacedMemory | PlacedBoopStamp, memories: readonly PlacedMemory[], boopStamps: readonly PlacedBoopStamp[] = []): { envelopeIndex: number; page: number } {
  const envelopeIndex = envelopeForElement(memory);
  const position = entriesForEnvelope(envelopeIndex, memories, boopStamps).findIndex((entry) => entry.id === memory.id);
  return { envelopeIndex, page: Math.max(0, Math.floor(position / FAN.length)) };
}

function entryHeight(entry: EnvelopeEntry, measuredHeights: Record<string, number>): number {
  if (entry.fixtureId) return measuredHeights[entry.id] ?? mk(entry.fixtureId, { z: .7 }).h;
  if (entry.boop) return measuredHeights[entry.id] ?? entry.boop.width;
  return measuredHeights[entry.id] ?? memorySize(entry.memory!)[1] * .7;
}

function itemFromEntry(entry: EnvelopeEntry, x: number, y: number, rot: number, z: number, op: number, delay: number, flip: boolean): LipItem {
  if (entry.fixtureId) {
    const item = mk(entry.fixtureId, { x, y, rot, z, attach: 'none' });
    return { ...item, x, y, rot, z, op, delay, flip };
  }
  if (entry.boop) {
    return { id: entry.boop.id, type: 'stamp', date: '', year: '', from: '', boop: entry.boop, x, y, rot, z, op, delay, flip };
  }
  const memory = entry.memory!;
  const date = new Date(memory.createdAt);
  return {
    id: memory.id, type: memory.kind, text: memory.text,
    date: date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }), year: String(date.getFullYear()),
    src: memory.src, ratio: memory.ratio, from: memory.authorId, memory,
    x, y, rot, z, op, delay, flip,
  };
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
  memories: readonly PlacedMemory[] = [],
  boopStamps: readonly PlacedBoopStamp[] = [],
  pages: Record<number, number> = {},
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
  const built = SE.map(([label], index) => {
    const entries = entriesForEnvelope(index, memories, boopStamps);
    let footprintTop = POCKET_TOP;
    const closedItems: ClosedSlot[] = entries.slice(0, 4).map((entry, k) => {
      const x = SLOT[k].x;
      const h = entryHeight(entry, measuredHeights);
      const y = Math.round(132 - h);
      const rot = SLOT[k].rot;
      const delta = rotatedTopDeltas[entry.id] ?? 0;
      footprintTop = Math.min(footprintTop, y + delta);
      return { x, y, rot, op: 1 };
    });
    return { label, entries, closedItems, footprintTop, page: Math.min(pages[index] ?? 0, Math.max(0, Math.ceil(entries.length / FAN.length) - 1)) };
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
    const visibleEntries = open ? b.entries.slice(b.page * FAN.length, b.page * FAN.length + FAN.length) : b.entries.slice(0, 4);
    const items: LipItem[] = visibleEntries.map((entry, k) => {
      if (open) {
        const f = FAN[k];
        const x = f.x - 30;
        const y = f.y - OY;
        return itemFromEntry(entry, x, y, entry.boop ? entry.boop.rotation : f.rot, entry.boop ? 1 : .7, 1, k * 30, true);
      }
      const slot = b.closedItems[k];
      return itemFromEntry(entry, slot.x, slot.y, entry.boop ? entry.boop.rotation : slot.rot, entry.boop ? 1 : .7, slot.op, k * 30, false);
    });
    return {
      label: b.label,
      y: !any ? CY[i] : open ? OY : offscreenY,
      op: !any || open ? 1 : 0,
      pe: !any || open ? 'auto' : 'none',
      bodyOp: open ? 1 : 0,
      draw: open ? 0 : 1,
      items,
      page: b.page,
      pageCount: Math.max(1, Math.ceil(b.entries.length / FAN.length)),
    };
  });

  return { envs, innerH: any ? frameH : contentH };
}
