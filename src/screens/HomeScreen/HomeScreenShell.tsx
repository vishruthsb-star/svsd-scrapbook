import { useEffect, useRef } from 'react';
import { ScreenShell } from '@/components/ScreenShell';
import HomeScreen from './HomeScreen';

export interface HomeScreenShellProps { selectedPerson?: number; coverImages?: Record<string, string>; onSelectPerson?: (index: number) => void; onOpenOwnScrapbook?: () => void; onOpenPersonScrapbook?: (index: number) => void; onOpenMailbox?: () => void; }

export default function HomeScreenShell(props: HomeScreenShellProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scroll = scrollRef.current;
    if (!scroll) return;
    const shell = scroll.parentElement;
    const grid = scroll.querySelector<HTMLElement>('.home-grid-region');
    const topBand = shell?.querySelector<HTMLElement>('.screenshell-band-top');
    const bottomBand = shell?.querySelector<HTMLElement>('.screenshell-band-bottom');
    if (!shell || !grid || !topBand || !bottomBand) return;

    const safeTop = Number.parseFloat(getComputedStyle(shell).getPropertyValue('--safe-top')) || 0;
    const safeBottom = Number.parseFloat(getComputedStyle(shell).getPropertyValue('--safe-bottom')) || 0;
    const updateMasks = () => {
      const gridBox = grid.getBoundingClientRect();
      // The graph paper pseudo-element begins one top-safe-area above the section and
      // extends 14px below it. These are its real painted bounds, not merely the section box.
      const gridTop = gridBox.top - safeTop;
      const gridBottom = gridBox.bottom + 14;
      const viewportBottom = shell.getBoundingClientRect().bottom;
      const setBand = (band: HTMLElement, showGrid: boolean) => {
        band.classList.toggle('home-safe-band--grid', showGrid);
        // The one scroll container is the source of truth. Updating a paint-only custom
        // property avoids React state/layout work while keeping the repeated grid aligned.
        band.style.setProperty('--home-grid-offset-y', `${-scroll.scrollTop}px`);
      };
      setBand(topBand, gridTop < safeTop && gridBottom > 0);
      setBand(bottomBand, gridTop < viewportBottom && gridBottom > viewportBottom - safeBottom);
    };
    updateMasks();
    scroll.addEventListener('scroll', updateMasks, { passive: true });
    window.addEventListener('resize', updateMasks);
    return () => {
      scroll.removeEventListener('scroll', updateMasks);
      window.removeEventListener('resize', updateMasks);
    };
  }, []);

  return (
    <ScreenShell className="home-screen-shell" scrollRef={scrollRef}>
      <HomeScreen {...props} />
    </ScreenShell>
  );
}
