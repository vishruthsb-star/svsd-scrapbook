import type { StampViewer } from '../types';

/**
 * Whether the remove control should render at all — one place to change the rule.
 * Visible only on the back (flipping it never shows a control for the front), only for
 * an item the viewer can act on ('self' = "I added this, I can take it back"; 'owner' =
 * "this is on my board, I can return it"), only if the item is actually flippable, and
 * only if the caller supplied a handler at all.
 */
export function shouldShowRemoveAction(viewer: StampViewer, flipped: boolean, flippable: boolean, onRemove: (() => void) | undefined): boolean {
  return flippable && flipped && (viewer === 'self' || viewer === 'owner') && onRemove !== undefined;
}
