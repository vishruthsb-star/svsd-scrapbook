import { useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react';
import { DEFAULT_INK } from '../utils/filters';
import './FlipCard.css';

export interface FlipCardProps {
  front: ReactNode;
  back: ReactNode;
  width: number;
  height: number;
  /** Pass both to control flip state externally; omit to let FlipCard manage its own. */
  flipped?: boolean;
  onFlip?: (flipped: boolean) => void;
  /** Text/icon color for front+back content (inherited); defaults to the house ink color. */
  ink?: string;
}

/**
 * Generic tap/click-to-flip card: perspective 1100px, 560ms cubic-bezier(.34,1.56,.64,1)
 * rotateY, with front/back visibility swapped at the 230ms midpoint so neither face is
 * briefly see-through mid-flip.
 *
 * Any interactive element placed inside `front`/`back` (a play button, a link) must call
 * `e.stopPropagation()` in its own click handler — otherwise the click bubbles up to this
 * card's root and flips it instead of activating the control.
 */
export default function FlipCard({ front, back, width, height, flipped: flippedProp, onFlip, ink = DEFAULT_INK }: FlipCardProps) {
  const [internalFlipped, setInternalFlipped] = useState(false);
  const controlled = flippedProp !== undefined;
  const flipped = controlled ? flippedProp : internalFlipped;

  function toggle() {
    const next = !flipped;
    if (!controlled) setInternalFlipped(next);
    onFlip?.(next);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Enter' || e.key === ' ') toggle();
  }

  return (
    <div
      className="flip-card"
      style={{ width, height, color: ink } as CSSProperties}
      onClick={toggle}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div className={`flip-card-flipper${flipped ? ' flipped' : ''}`}>
        <div className="flip-card-face flip-card-front">{front}</div>
        <div className="flip-card-face flip-card-back">{back}</div>
      </div>
    </div>
  );
}
