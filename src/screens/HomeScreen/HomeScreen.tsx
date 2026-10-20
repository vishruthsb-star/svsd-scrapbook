import { useLayoutEffect, useRef } from 'react';
import { Header } from '@/components/Header';
import { InviteSection } from '@/components/InviteSection';
import { Library } from '@/components/Library';
import { LIBRARY_ACTIVE_INDEX, LIBRARY_PEOPLE, OWNER_HANDLE, OWNER_NAME } from '@/data/mock';
import './HomeScreen.css';

export default function HomeScreen() {
  const libraryWrapRef = useRef<HTMLDivElement>(null);
  const libraryScaleRef = useRef<HTMLDivElement>(null);

  // Library draws itself at a fixed intrinsic width (CARD_WIDTH); scale it down to fit the
  // safe-side margins instead of touching Library's own internal geometry.
  useLayoutEffect(() => {
    const wrap = libraryWrapRef.current;
    const scaleEl = libraryScaleRef.current;
    if (!wrap || !scaleEl) return;

    const measureAndScale = () => {
      scaleEl.style.transform = 'none';
      scaleEl.style.width = '';
      scaleEl.style.height = '';
      const natural = scaleEl.getBoundingClientRect();
      const available = wrap.getBoundingClientRect().width;
      const scale = Math.min(1, available / natural.width);
      scaleEl.style.width = `${natural.width}px`;
      scaleEl.style.height = `${natural.height}px`;
      scaleEl.style.transform = `scale(${scale})`;
      wrap.style.height = `${natural.height * scale}px`;
    };

    measureAndScale();
    // A window listener (not a ResizeObserver on `wrap`) — `wrap`'s own height is set by
    // this same effect, so observing it directly would re-trigger on its own mutation.
    window.addEventListener('resize', measureAndScale);
    return () => window.removeEventListener('resize', measureAndScale);
  }, []);

  return (
    <div className="home-root">
      <Header ownerName={OWNER_NAME} />
      <div className="home-library-wrap" ref={libraryWrapRef}>
        <div className="home-library-scale" ref={libraryScaleRef}>
          <Library people={LIBRARY_PEOPLE} defaultSelected={LIBRARY_ACTIVE_INDEX} />
        </div>
      </div>
      <div className="home-invite-wrap">
        <InviteSection handle={OWNER_HANDLE} />
      </div>
    </div>
  );
}
