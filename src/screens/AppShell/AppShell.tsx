import type { ReactNode, TransitionEvent } from 'react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import HomeBottomNavigation from '@/components/HomeBottomNavigation/HomeBottomNavigation';
import type { HomeBottomNavigationValue } from '@/components/HomeBottomNavigation/HomeBottomNavigation';
import { SAMPLE_IMAGE_SRCS } from '@/scrapbook/fixtures/sampleItems';
import CanvasScreen from '@/screens/CanvasScreen/CanvasScreen';
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
        <HomeScreenShell />
      </ScreenPanel>
      <ScreenPanel active={navValue === 'journal'} id="panel-journal" labelledBy="tab-journal" className="app-shell-canvas">
        <CanvasScreen />
      </ScreenPanel>
      <nav className="app-shell-nav-overlay">
        <HomeBottomNavigation value={navValue} onChange={setNavValue} />
      </nav>
    </div>
  );
}
