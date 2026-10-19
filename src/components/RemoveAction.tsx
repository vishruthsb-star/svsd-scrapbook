import type { MouseEvent } from 'react';
import { DEFAULT_INK, INK_FILTER_STYLE } from '../utils/filters';
import './RemoveAction.css';

export type RemoveActionVariant = 'self' | 'owner';

export interface RemoveActionProps {
  variant: RemoveActionVariant;
  ink?: string;
  onRemove: () => void;
}

/**
 * The "take it back" (viewer 'self') / "return to sender" (viewer 'owner') control —
 * drawn outside the item entirely (see <Decor>'s `remove` slot), so it never mirrors or
 * rotates with the flip, and never scales with the item's `zoom`. New feature, not in any
 * of the original reference files — spec is references/co-scrapbook-v2.dc.html.
 */
export default function RemoveAction({ variant, ink = DEFAULT_INK, onRemove }: RemoveActionProps) {
  function handleClick(e: MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    onRemove();
  }

  if (variant === 'self') {
    return (
      <button type="button" className="remove-action remove-action--self" style={{ color: ink }} aria-label="Take it back" onClick={handleClick}>
        <svg className="remove-action-icon" width={30} height={24} style={{ stroke: ink }}>
          <g style={INK_FILTER_STYLE}>
            <path d="M26 22 C30 8 20 3 6 6 M11 0 L4 6 L11 12" />
          </g>
        </svg>
        <span className="remove-action-label">
          <span className="remove-action-text">take it back</span>
          <svg className="remove-action-underline" width={112} height={6} style={{ stroke: ink }}>
            <g style={INK_FILTER_STYLE}>
              <path d="M-2 3 C30 1 70 5 114 2" />
            </g>
          </svg>
        </span>
      </button>
    );
  }

  return (
    <button type="button" className="remove-action remove-action--owner" style={{ color: ink }} aria-label="Return to sender" onClick={handleClick}>
      <svg className="remove-action-box" viewBox="0 0 214 64" preserveAspectRatio="none" aria-hidden="true">
        <g style={INK_FILTER_STYLE}>
          <path
            style={{ stroke: ink, vectorEffect: 'non-scaling-stroke' }}
            d="M-3 2 L216 0 M213 -3 L215 66 M217 63 L-2 64 M1 67 L0 -3 M5 8 L209 7 M208 6 L209 57 M209 57 L6 58 M6 58 L5 7"
          />
        </g>
      </svg>
      <span className="remove-action-text">return to sender</span>
    </button>
  );
}
