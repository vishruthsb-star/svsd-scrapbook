import type { ReactNode } from 'react';
import './PillButton.css';

export interface PillButtonProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}

/**
 * A plain white pill button — exactly AddFab's `.addfab__pill` visual (background, border,
 * 5-layer shadow, radius, Inter typography) with the icon and fan-opening behavior
 * removed. Written as its own independent stylesheet (not importing/sharing code with
 * addFabEngine.ts's injected CSS string) so AddFab's own look/gallery entry can never be
 * affected by a change here — values are kept in lockstep with addFabEngine.ts's `.addfab__
 * pill`/`.addfab__pill:focus-visible` rules by hand; see PillButton.css for the exact
 * source lines they're copied from.
 *
 * Used by EnvelopesLip's "Put them back" button; generic enough for any other plain pill
 * control a canvas page needs later.
 */
export default function PillButton({ children, onClick, className }: PillButtonProps) {
  return (
    <button type="button" className={`pill-button${className ? ' ' + className : ''}`} onClick={onClick}>
      {children}
    </button>
  );
}
