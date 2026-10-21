import { useLayoutEffect, useRef } from 'react';
import type { RefObject } from 'react';

export function findItemTarget(root: ParentNode | null, id: string): HTMLElement | null {
  if (!root) return null;
  return Array.from(root.querySelectorAll<HTMLElement>('[data-scrapbook-item-id]')).find((element) => element.dataset.scrapbookItemId === id) ?? null;
}

export function revealInScroller(scroller: HTMLElement, target: HTMLElement, topInset: number, bottomInset: number): void {
  const viewport = scroller.getBoundingClientRect();
  const item = target.getBoundingClientRect();
  const topSafe = viewport.top + topInset;
  const bottomSafe = viewport.bottom - bottomInset;
  if (item.top >= topSafe && item.bottom <= bottomSafe) return;
  const visibleHeight = Math.max(1, scroller.clientHeight - topInset - bottomInset);
  const top = Math.max(0, scroller.scrollTop + item.top - viewport.top - topInset - Math.max(0, (visibleHeight - item.height) / 2));
  scroller.scrollTo({ top, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
}

interface UseTargetRevealOptions {
  targetId?: string | null;
  ready?: boolean;
  rootRef: RefObject<HTMLElement | null>;
  findRoot?: () => ParentNode | null;
  reveal: (target: HTMLElement) => void;
  onHandled?: (id: string) => void;
  maxFrames?: number;
}

/** Bounded retries cover mount/layout transitions without allowing an old insertion request to scroll forever. */
export function useTargetReveal({ targetId, ready = true, rootRef, findRoot, reveal, onHandled, maxFrames = 48 }: UseTargetRevealOptions): void {
  const handledRef = useRef<string | null>(null);

  useLayoutEffect(() => {
    if (!targetId || !ready || targetId === handledRef.current) return;
    let cancelled = false;
    let frame = 0;
    let attempts = 0;
    const tryReveal = () => {
      if (cancelled || !targetId) return;
      const target = findItemTarget(findRoot?.() ?? rootRef.current, targetId);
      if (target) {
        reveal(target);
        handledRef.current = targetId;
        onHandled?.(targetId);
        return;
      }
      attempts += 1;
      if (attempts >= maxFrames) {
        handledRef.current = targetId;
        onHandled?.(targetId);
        return;
      }
      frame = requestAnimationFrame(tryReveal);
    };
    frame = requestAnimationFrame(tryReveal);
    return () => { cancelled = true; cancelAnimationFrame(frame); };
  }, [findRoot, maxFrames, onHandled, ready, reveal, rootRef, targetId]);
}
