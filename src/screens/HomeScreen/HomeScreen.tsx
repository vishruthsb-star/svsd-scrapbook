import { useEffect, useLayoutEffect, useRef } from 'react';
import { Header } from '@/components/Header';
import { InviteSection } from '@/components/InviteSection';
import { Library } from '@/components/Library';
import { ScrapbookCover } from '@/components/ScrapbookCover';
import { HandDrawnDivider } from '@/components/HandDrawnDivider';
import { LIBRARY_ACTIVE_INDEX, LIBRARY_PEOPLE, OWNER_HANDLE, OWNER_NAME } from '@/data/mock';
import './HomeScreen.css';

export interface HomeScreenProps {
  selectedPerson?: number;
  onSelectPerson?: (index: number) => void;
  onOpenOwnScrapbook?: () => void;
  onOpenPersonScrapbook?: (index: number) => void;
  onOpenMailbox?: () => void;
}

export default function HomeScreen({ selectedPerson, onSelectPerson, onOpenOwnScrapbook, onOpenPersonScrapbook, onOpenMailbox }: HomeScreenProps) {
  const libraryWrapRef = useRef<HTMLDivElement>(null);
  const libraryScaleRef = useRef<HTMLDivElement>(null);
  const coverNavigationTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const coverNavigationPendingRef = useRef(false);
  const openOwnScrapbookRef = useRef(onOpenOwnScrapbook);
  openOwnScrapbookRef.current = onOpenOwnScrapbook;

  useEffect(() => () => {
    if (coverNavigationTimerRef.current !== null) window.clearTimeout(coverNavigationTimerRef.current);
    coverNavigationTimerRef.current = null;
    coverNavigationPendingRef.current = false;
  }, []);

  const openOwnScrapbookAfterCoverAnimation = () => {
    if (coverNavigationPendingRef.current) return;
    coverNavigationPendingRef.current = true;
    // ScrapbookCover starts its authored burst before calling this handler. A short slice
    // of its 1500ms visual timeline supplies tactile feedback before the screen changes.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      coverNavigationPendingRef.current = false;
      openOwnScrapbookRef.current?.();
      return;
    }
    coverNavigationTimerRef.current = window.setTimeout(() => {
      coverNavigationTimerRef.current = null;
      // Home stays mounted beneath the canvas, so this guard must be released for the
      // next visit home; otherwise later taps animate but never schedule navigation.
      coverNavigationPendingRef.current = false;
      openOwnScrapbookRef.current?.();
    }, 180);
  };

  // Preserve Library's authored geometry and only scale its outer integration box.
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
    window.addEventListener('resize', measureAndScale);
    return () => window.removeEventListener('resize', measureAndScale);
  }, []);

  return (
    <div className="home-root">
      <div className="home-grid-region">
        <Header ownerName={OWNER_NAME} onSendClick={onOpenMailbox} />
        <section className="home-scrapbook-section" aria-labelledby="home-scrapbook-heading">
          <div className="home-section-heading"><p id="home-scrapbook-heading" className="home-section-label">01 · YOUR SCRAPBOOK</p><HandDrawnDivider seed={101} /></div>
          <ScrapbookCover onClick={openOwnScrapbookAfterCoverAnimation} />
        </section>
        <section className="home-people-section" aria-labelledby="home-people-heading">
          <div className="home-section-heading"><p id="home-people-heading" className="home-section-label">02 · PEOPLE IN YOUR FOLDER</p><HandDrawnDivider seed={202} /></div>
          <div className="home-people-copy"><p>who’s been on your mind?</p><p>your collection of scrapbooks</p></div>
          <div className="home-library-wrap" ref={libraryWrapRef}>
            <div className="home-library-scale" ref={libraryScaleRef}>
              <Library people={LIBRARY_PEOPLE} selected={selectedPerson} defaultSelected={LIBRARY_ACTIVE_INDEX} onSelect={onSelectPerson} onOpen={onOpenPersonScrapbook} />
            </div>
          </div>
        </section>
      </div>
      <div className="home-invite-wrap"><InviteSection handle={OWNER_HANDLE} /></div>
    </div>
  );
}
