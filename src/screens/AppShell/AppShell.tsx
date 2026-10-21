import type { ReactNode, TransitionEvent } from 'react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import HomeBottomNavigation from '@/components/HomeBottomNavigation/HomeBottomNavigation';
import type { HomeBottomNavigationValue } from '@/components/HomeBottomNavigation/HomeBottomNavigation';
import { SAMPLE_IMAGE_SRCS } from '@/scrapbook/fixtures/sampleItems';
import CanvasScreen from '@/screens/CanvasScreen/CanvasScreen';
import ComposeMemoryScreen from '@/screens/ComposeMemoryScreen/ComposeMemoryScreen';
import type { ComposeKind, ComposedMemory } from '@/screens/ComposeMemoryScreen/ComposeMemoryScreen';
import type { AddFabKind } from '@/components/AddFab';
import { LIBRARY_ACTIVE_INDEX, LIBRARY_PEOPLE } from '@/data/mock';
import type { PlacedMemory } from '@/scrapbook/placement';
import { loadMemories, saveMemory } from '@/scrapbook/persistence/localScrapbookStore';
import HomeScreenShell from '@/screens/HomeScreen/HomeScreenShell';
import { decodeImages } from '@/utils/decodeImages';
import './AppShell.css';

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
}

interface ScreenPanelProps {
  active: boolean;
  id: string;
  labelledBy: string;
  className?: string;
  children: ReactNode;
}

/**
 * One tab's content, kept permanently mounted (never remounted on switch — see CanvasScreen,
 * whose ResizeObserver/font-ready measurements would otherwise have to redo themselves) and
 * stacked (position:absolute, inset:0) so outgoing and incoming overlap during the crossfade
 * instead of leaving a gap.
 *
 * `active` drives the fade via the `.is-active` class (opacity 0<->1, ~280ms). Crucially,
 * `visibility: hidden` + `inert` + `aria-hidden` — the things that actually remove a panel
 * from paint/hit-testing/the a11y tree — are only applied once the exit transition's
 * `transitionend` fires, never synchronously with the tab switch. Applying them immediately
 * (the previous bug: the `hidden` attribute, which forces `display: none` the instant React
 * sets it) is what made the outgoing screen vanish in a single frame with no fade at all.
 *
 * The one-shot "entering" animation (fade + 8px rise) is applied imperatively via
 * classList/animationend rather than React state, so it plays exactly once per switch and
 * never re-fires on an unrelated re-render while a panel stays active. It's skipped on this
 * component's very first mount (`isFirstRun`) so the screen that's active on initial load
 * (Home) doesn't visibly rise into place.
 */
function ScreenPanel({ active, id, labelledBy, className, children }: ScreenPanelProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isFirstRun = useRef(true);
  const [idleHidden, setIdleHidden] = useState(!active);
  const [prevActive, setPrevActive] = useState(active);

  // React's documented render-time "adjust state when a prop changes" pattern (not an
  // effect — it runs synchronously within this render, before paint) instead of a
  // useLayoutEffect setState call: an element can't visibly fade in while
  // visibility:hidden, so clearing idleHidden has to land in the SAME commit that
  // `active` flips true, not a commit after it. Mirrored for reduced motion, where no
  // transitionend will ever fire to flip idleHidden back on (see handleTransitionEnd).
  if (active !== prevActive) {
    setPrevActive(active);
    if (active) setIdleHidden(false);
    else if (prefersReducedMotion()) setIdleHidden(true);
  }

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const firstRun = isFirstRun.current;
    isFirstRun.current = false;
    if (!active || firstRun || prefersReducedMotion()) return;

    el.classList.remove('is-entering');
    void el.offsetWidth; // force reflow so re-adding the class restarts the keyframe animation
    el.classList.add('is-entering');
    const onDone = () => el.classList.remove('is-entering');
    el.addEventListener('animationend', onDone, { once: true });
    return () => el.removeEventListener('animationend', onDone);
  }, [active]);

  const handleTransitionEnd = (e: TransitionEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget || e.propertyName !== 'opacity') return;
    if (!active) setIdleHidden(true);
  };

  const classes = [
    'app-shell-screen',
    className,
    active ? 'is-active' : null,
    idleHidden ? 'is-idle-hidden' : null,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      ref={ref}
      id={id}
      className={classes}
      role="tabpanel"
      aria-labelledby={labelledBy}
      aria-hidden={idleHidden ? true : undefined}
      inert={idleHidden ? true : undefined}
      onTransitionEnd={handleTransitionEnd}
    >
      {children}
    </div>
  );
}

export default function AppShell() {
  const [navValue, setNavValue] = useState<HomeBottomNavigationValue>('home');
  const [selectedPerson, setSelectedPerson] = useState(LIBRARY_ACTIVE_INDEX);
  const [composeKind, setComposeKind] = useState<ComposeKind | null>(null);
  const [createdItems, setCreatedItems] = useState<PlacedMemory[]>([]);
  const savingRef = useRef(false);
  const recipient = LIBRARY_PEOPLE[selectedPerson];

  useEffect(() => {
    const onPopState = () => setComposeKind(null);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadMemories(recipient.name).then((items) => {
      if (!cancelled) setCreatedItems(items);
    }).catch((error: unknown) => console.warn('Could not restore scrapbook memories', error));
    return () => { cancelled = true; };
  }, [recipient.name]);

  const openCompose = (kind: AddFabKind) => {
    if (composeKind) return;
    window.history.pushState({ scrapbookCompose: true, scrapbookId: `library:${recipient.name}` }, '');
    setComposeKind(kind);
  };
  const closeCompose = () => {
    if (window.history.state?.scrapbookCompose) window.history.back();
    else setComposeKind(null);
  };
  const completeCompose = async (memory: ComposedMemory) => {
    if (savingRef.current) return;
    savingRef.current = true;
    const id = crypto.randomUUID();
    const seed = [...id].reduce((value, char) => ((value * 31) + char.charCodeAt(0)) | 0, 17);
    const base = { id, scrapbookId: `library:${recipient.name}`, recipientId: recipient.name, authorId: 'prototype-contributor', createdAt: new Date().toISOString(), seed };
    const mediaKey = memory.kind === 'stamp' || memory.kind === 'voice' ? `media:${id}` : undefined;
    const item: PlacedMemory = memory.kind === 'stamp' ? { ...base, kind: 'stamp', text: memory.caption, src: URL.createObjectURL(memory.file), mediaKey, ratio: memory.ratio } : memory.kind === 'note' ? { ...base, kind: 'note', text: memory.text } : memory.kind === 'tag' ? { ...base, kind: 'tag', text: memory.title, url: memory.url } : { ...base, kind: 'voice', src: URL.createObjectURL(memory.blob), mediaKey, durationSec: memory.durationSec };
    try {
      await saveMemory(item, memory.kind === 'stamp' ? memory.file : memory.kind === 'voice' ? memory.blob : undefined);
      setCreatedItems((items) => [...items, item]);
      closeCompose();
    } catch (error) {
      console.error('Could not save scrapbook memory', error);
      window.alert("Couldn't save this memory. Please try again.");
    } finally { savingRef.current = false; }
  };

  // Pre-decode the canvas screen's photos while Home is still showing, so the first switch
  // to Journal doesn't stall on JPEG decode (the canvas panel is mounted from the start but
  // stays visibility:hidden/inert until first activated — see ScreenPanel above and
  // utils/decodeImages.ts).
  useEffect(() => {
    decodeImages(SAMPLE_IMAGE_SRCS);
  }, []);

  return (
    <div className="app-shell-root">
      <ScreenPanel active={navValue === 'home'} id="panel-home" labelledBy="tab-home" className="app-shell-home">
        <HomeScreenShell selectedPerson={selectedPerson} onSelectPerson={setSelectedPerson} />
      </ScreenPanel>
      <ScreenPanel active={navValue === 'journal'} id="panel-journal" labelledBy="tab-journal" className="app-shell-canvas">
        <CanvasScreen recipientName={recipient.name} onAddSelect={openCompose} items={createdItems.filter((item) => item.recipientId === recipient.name)} />
      </ScreenPanel>
      {!composeKind && <nav className="app-shell-nav-overlay">
        <HomeBottomNavigation value={navValue} onChange={setNavValue} />
      </nav>}
      {composeKind && (
        <div className="app-shell-compose" role="dialog" aria-modal="true" aria-label={`Compose memory for ${recipient.name}`}>
          <ComposeMemoryScreen kind={composeKind} recipientName={recipient.name} onClose={closeCompose} onComplete={completeCompose} showDevTabs={false} />
        </div>
      )}
    </div>
  );
}
