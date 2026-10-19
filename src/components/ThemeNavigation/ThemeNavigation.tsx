import type { KeyboardEvent } from 'react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import './ThemeNavigation.css';

export type ThemeNavigationValue = 'late-nights' | 'laughing' | 'trips' | 'songs';

export interface ThemeNavigationProps {
  /** Controlled value. Omit to let the component manage its own state (uncontrolled). */
  value?: ThemeNavigationValue;
  /** Initial value when uncontrolled. Defaults to the reference's "late-nights". */
  defaultValue?: ThemeNavigationValue;
  onChange?: (value: ThemeNavigationValue) => void;
}

const TABS: { value: ThemeNavigationValue; label: string }[] = [
  { value: 'late-nights', label: 'late nights' },
  { value: 'laughing', label: 'laughing' },
  { value: 'trips', label: 'trips' },
  { value: 'songs', label: 'songs' },
];

/**
 * Faithful port of references/theme-navigation.html (Figma node 118:1767, "Frame 14").
 * Same track/pill/shadow/motion system as HomeBottomNavigation, but the pill hugs each
 * option's text (measured with getBoundingClientRect for sub-pixel --pill-x/--pill-w,
 * exactly like the reference's placePill()) instead of sliding between two fixed slots.
 */
export default function ThemeNavigation({ value, defaultValue = 'late-nights', onChange }: ThemeNavigationProps) {
  const [internal, setInternal] = useState<ThemeNavigationValue>(defaultValue);
  const active = value ?? internal;
  const navRef = useRef<HTMLElement>(null);
  const [isReady, setIsReady] = useState(false);

  const placePill = useCallback(() => {
    const nav = navRef.current;
    if (!nav) return;
    const activeTab = nav.querySelector<HTMLButtonElement>('[aria-selected="true"]') ?? nav.querySelector<HTMLButtonElement>('[role="tab"]');
    if (!activeTab) return;
    const tr = activeTab.getBoundingClientRect();
    const nr = nav.getBoundingClientRect();
    // getBoundingClientRect keeps sub-pixel precision (offsetLeft/offsetWidth round to whole px)
    nav.style.setProperty('--pill-x', `${tr.left - nr.left}px`);
    nav.style.setProperty('--pill-w', `${tr.width}px`);
  }, []);

  // First paint: measure without animating, then enable transitions (double rAF, exactly
  // like the reference, so the pill never animates in from 0).
  useLayoutEffect(() => {
    placePill();
    let raf1 = 0;
    let raf2 = 0;
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setIsReady(true));
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-measure on every active-tab change.
  useLayoutEffect(() => {
    placePill();
  }, [active, placePill]);

  // Re-measure if the font finishes loading or the layout changes.
  useEffect(() => {
    document.fonts?.ready?.then(placePill);
    const nav = navRef.current;
    if (!nav || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(placePill);
    ro.observe(nav);
    return () => ro.disconnect();
  }, [placePill]);

  const select = (next: ThemeNavigationValue, focusTab: boolean) => {
    if (value === undefined) setInternal(next);
    onChange?.(next);
    navRef.current?.dispatchEvent(new CustomEvent('change', { detail: { value: next } }));
    if (focusTab) {
      requestAnimationFrame(() => {
        navRef.current?.querySelector<HTMLButtonElement>(`[data-tab="${next}"]`)?.focus();
      });
    }
  };

  const handleKeyDown = (index: number) => (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      select(TABS[Math.min(index + 1, TABS.length - 1)].value, true);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      select(TABS[Math.max(index - 1, 0)].value, true);
    } else if (event.key === 'Home') {
      event.preventDefault();
      select(TABS[0].value, true);
    } else if (event.key === 'End') {
      event.preventDefault();
      select(TABS[TABS.length - 1].value, true);
    }
  };

  return (
    <nav
      ref={navRef}
      className={`theme-navigation${isReady ? ' is-ready' : ''}`}
      data-active={active}
      role="tablist"
      aria-label="Theme navigation"
    >
      <span className="theme-navigation__pill" aria-hidden="true" />

      {TABS.map((tab, i) => {
        const selected = active === tab.value;
        return (
          <button
            key={tab.value}
            className="theme-navigation__item"
            role="tab"
            data-tab={tab.value}
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => {
              if (selected) return;
              select(tab.value, false);
            }}
            onKeyDown={handleKeyDown(i)}
          >
            <span className="theme-navigation__label">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
