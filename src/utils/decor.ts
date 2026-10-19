import { makeRng } from './geometry';

export type DecorVariant = 'tape' | 'clip' | 'corners';

export interface DecorPiece {
  variant: DecorVariant;
  /** left offset in px, relative to the item's own box (tape/clip only; corners are fixed to the item's corners) */
  x: number;
  /** rotation in degrees (tape only) */
  rot: number;
}

const VARIANTS: DecorVariant[] = ['tape', 'clip', 'corners'];

// Offsets the RNG stream from whatever else is derived from the same item seed
// (e.g. stampGeometry), so decor choices don't correlate with a kind's own line art.
const DECOR_SEED_OFFSET = 9001;

/**
 * Deterministically picks 0–2 decor pieces (tape/paperclip/corner-triangles) for an item
 * from its seed alone — same seed, same decor, every render. Positions/rotations follow
 * Item.dc.html's attachment math (tape jitters along the top edge, corners sit fixed at
 * the top-left/bottom-right corners).
 */
export function pickDecor(seed: number, width: number): DecorPiece[] {
  const g = makeRng(seed + DECOR_SEED_OFFSET);
  const countRoll = g.R();
  const count = countRoll < 0.4 ? 0 : countRoll < 0.85 ? 1 : 2;

  const pieces: DecorPiece[] = [];
  const used = new Set<DecorVariant>();
  for (let i = 0; i < count; i++) {
    const remaining = VARIANTS.filter((v) => !used.has(v));
    const variant = remaining[Math.floor(g.R() * remaining.length)];
    used.add(variant);
    pieces.push({
      variant,
      x: variant === 'tape' ? width / 2 - 37 + g.J(10) : width / 2 - 22,
      rot: variant === 'tape' ? g.J(9) : 0,
    });
  }
  return pieces;
}
