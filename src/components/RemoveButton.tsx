import { useMemo, type MouseEvent } from 'react';
import { makeRng } from '../utils/geometry';
import { ACCENT_RED, ACCENT_RED_TINT, DEFAULT_INK, INK_FILTER_STYLE } from '../utils/filters';
import './RemoveButton.css';

// Decorrelates this from whatever else is derived from the same item seed (geometry,
// decor), same convention as Decor's own seed offset.
const REMOVE_SEED_OFFSET = 7331;
const BOX_W = 92;
const BOX_H = 30;

export interface RemoveButtonProps {
  /** the card's own width, so the button can center itself and never overflow a narrow card (e.g. ParcelTag) */
  cardWidth: number;
  seed: number;
  ink?: string;
  onRemove: () => void;
}

/**
 * The back face's "remove" control: a small hand-drawn red-outlined, lightly-tinted
 * rectangle with a red X icon and the word "remove" in the card's ink color. New feature
 * — no design file for it exists in references/ (checked Item.dc.html and
 * co-scrapbook-v2.dc.html; neither has it), so this is built from the written spec rather
 * than ported. Lives inside the back face content (not a separate overlay), so it flips
 * and tilts with the card for free, and is gated by `shouldShowRemoveAction` (viewer
 * self/owner only) — the existing front/back visibility CSS already handles "only when
 * flipped", same as `ItemBack`.
 */
export default function RemoveButton({ cardWidth, seed, ink = DEFAULT_INK, onRemove }: RemoveButtonProps) {
  const geo = useMemo(() => {
    const g = makeRng(seed + REMOVE_SEED_OFFSET);
    const rect = g.frameBox(2, 2, BOX_W - 4, BOX_H - 4);
    const strokeA = g.ln(9, 9, 19, 19, 1);
    const strokeB = g.ln(19, 9, 9, 19, 1);
    return { rect, strokeA, strokeB };
  }, [seed]);

  const left = Math.max(4, Math.min(cardWidth - BOX_W - 4, (cardWidth - BOX_W) / 2));

  function handleClick(e: MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    onRemove();
  }

  return (
    <button type="button" className="remove-button" style={{ left, width: BOX_W, height: BOX_H, color: ink }} aria-label="Remove" onClick={handleClick}>
      <svg className="remove-button-art" width={BOX_W} height={BOX_H}>
        <g style={INK_FILTER_STYLE}>
          <path d={geo.rect} style={{ fill: ACCENT_RED_TINT, stroke: ACCENT_RED, strokeWidth: 1.6 }} />
          <path d={geo.strokeA} style={{ fill: 'none', stroke: ACCENT_RED, strokeWidth: 1.8 }} />
          <path d={geo.strokeB} style={{ fill: 'none', stroke: ACCENT_RED, strokeWidth: 1.8 }} />
        </g>
      </svg>
      <span className="remove-button-label">remove</span>
    </button>
  );
}
