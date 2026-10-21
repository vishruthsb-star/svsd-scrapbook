import { SAFE } from './constants';

export type FabPlacement = 'bc' | 'tr';

export interface FabAnchorPoint {
  x: number;
  y: number;
}

/** Center a pill whose right edge sits on the canvas safe-area boundary. */
export function rightSafeCenter(frameW: number, pillW: number): number {
  return frameW - SAFE.side - pillW / 2;
}

/**
 * The AddFab pill's center point, derived from the add-button working rectangle (the
 * Volume 1 SPEC OVERRIDES: `left = SAFE.side`, `right = frameW - SAFE.side`, `bottom =
 * frameH - SAFE.bottom`, `top = SAFE.top + headerHeight + 20`) — not a hardcoded placement
 * table, and not the literals 390/844/34 either: `frameW`/`frameH` are the real measured
 * frame size. `pillW`/`pillH` should come from measuring the actual rendered pill (height
 * is fixed at 52 by addFabEngine.ts's `.addfab__pill` CSS; width is content-driven).
 * `headerHeight` is the measured ScrapbookHeader height (X).
 *
 * AddFab's own `x`/`y` options are the fan's center, and the pill is drawn centered on
 * that same point (`transform: translate(-50%, -50%)` in addFabEngine.ts's render()), so
 * this anchor can be passed straight through as AddFab's `x`/`y` props.
 *
 * `pillW` only affects 'tr' (the pill hugs the working rectangle's right edge); 'bc' is
 * horizontally symmetric inside the rectangle, so pillW is ignored there.
 */
export function fabAnchor(
  placement: FabPlacement,
  pillW: number,
  pillH: number,
  headerHeight: number,
  frameW: number,
  frameH: number,
): FabAnchorPoint {
  const left = SAFE.side;
  const right = frameW - SAFE.side;
  const bottom = frameH - SAFE.bottom;
  const top = SAFE.top + headerHeight + 20;

  if (placement === 'bc') {
    return { x: (left + right) / 2, y: bottom - pillH / 2 };
  }

  return { x: rightSafeCenter(frameW, pillW), y: top + pillH / 2 };
}
