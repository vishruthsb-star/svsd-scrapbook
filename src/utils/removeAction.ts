import type { StampViewer } from '../types';

/**
 * Whether the remove button should render at all — one place to change the rule.
 * It lives on the back face (see RemoveButton.tsx), so "only when flipped" is already
 * handled by the existing front/back visibility CSS (same mechanism as ItemBack) — this
 * only gates it by who's allowed to act: 'self' = "I added this, I can take it back";
 * 'owner' = "this is on my board, I can remove it". Never 'other'. And only if the
 * caller actually supplied a handler.
 */
export function shouldShowRemoveAction(viewer: StampViewer, onRemove: (() => void) | undefined): boolean {
  return (viewer === 'self' || viewer === 'owner') && onRemove !== undefined;
}
