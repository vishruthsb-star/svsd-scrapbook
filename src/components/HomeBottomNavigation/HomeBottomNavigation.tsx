import type { KeyboardEvent } from 'react';
import { useCallback, useRef, useState } from 'react';
import './HomeBottomNavigation.css';

export type HomeBottomNavigationValue = 'home' | 'journal';

export interface HomeBottomNavigationProps {
  /** Controlled value. Omit to let the component manage its own state (uncontrolled). */
  value?: HomeBottomNavigationValue;
  /** Initial value when uncontrolled. Defaults to the reference's "home". */
  defaultValue?: HomeBottomNavigationValue;
  onChange?: (value: HomeBottomNavigationValue) => void;
}

const TABS: { value: HomeBottomNavigationValue; label: string }[] = [
  { value: 'home', label: 'Home' },
  { value: 'journal', label: 'Journal' },
];

/**
 * Faithful port of references/home-bottom-navigation.html (Figma node 118:1756, "Frame 13").
 * The sliding white pill is driven by the `--index` CSS custom property exactly like the
 * reference (`[data-active="journal"]` sets `--index: 1`) — no layout math duplicated here.
 */
export default function HomeBottomNavigation({
  value,
  defaultValue = 'home',
  onChange,
}: HomeBottomNavigationProps) {
  const [internal, setInternal] = useState<HomeBottomNavigationValue>(defaultValue);
  const active = value ?? internal;
  const navRef = useRef<HTMLElement>(null);

  const select = useCallback(
    (next: HomeBottomNavigationValue, focusTab: boolean) => {
      if (value === undefined) setInternal(next);
      onChange?.(next);
      // Preserve the reference's `change` CustomEvent with detail.value for parity with
      // non-React consumers that might listen on the nav node directly.
      navRef.current?.dispatchEvent(new CustomEvent('change', { detail: { value: next } }));
      if (focusTab) {
        requestAnimationFrame(() => {
          navRef.current?.querySelector<HTMLButtonElement>(`[data-tab="${next}"]`)?.focus();
        });
      }
    },
    [value, onChange],
  );

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      select(TABS[Math.min(index + 1, TABS.length - 1)].value, true);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      select(TABS[Math.max(index - 1, 0)].value, true);
    }
  };

  return (
    <nav
      ref={navRef}
      className="home-bottom-navigation"
      data-active={active}
      role="tablist"
      aria-label="Home bottom navigation"
    >
      <span className="home-bottom-navigation__pill" aria-hidden="true" />

      {TABS.map((tab, i) => {
        const selected = active === tab.value;
        return (
          <button
            key={tab.value}
            className="home-bottom-navigation__item"
            role="tab"
            id={`tab-${tab.value}`}
            data-tab={tab.value}
            aria-selected={selected}
            aria-label={tab.label}
            tabIndex={selected ? 0 : -1}
            onClick={() => {
              if (selected) return;
              select(tab.value, false);
            }}
            onKeyDown={(e) => handleKeyDown(e, i)}
          >
            <span className="home-bottom-navigation__icon">
              {tab.value === 'home' ? <HomeIcon /> : <JournalIcon />}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

function HomeIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M3.91992 12.9269C7.27992 10.1502 10.6516 7.38911 14.0349 4.64355M13.8366 4.65522C17.2433 7.50967 20.6694 10.3486 24.1149 13.1719M6.38159 10.7102C6.36603 15.1436 6.36214 19.573 6.36992 23.9986M6.10159 23.8352C11.2971 23.9052 16.4927 23.913 21.6883 23.8586M21.5249 24.2202C21.4394 19.8102 21.4238 15.4002 21.4783 10.9902M11.6316 24.3136C11.6083 21.7624 11.6083 19.2152 11.6316 16.6719M11.4916 16.8119C13.226 16.7886 14.9605 16.7886 16.6949 16.8119M16.4149 16.3802C16.3449 18.908 16.3021 21.4319 16.2866 23.9519"
        stroke="#494444"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function JournalIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M7.97999 4.02522C12.9422 4.11078 17.9083 4.13022 22.8783 4.08355M22.645 3.76855C22.6839 10.5741 22.7228 17.3797 22.7617 24.1852M22.9133 23.9752C17.9433 23.913 12.9772 23.9247 8.01499 24.0102M8.13165 24.3719C8.23276 17.5119 8.26388 10.6519 8.22499 3.79189M12.0633 9.31022C14.5989 9.39578 17.1305 9.43855 19.6583 9.43855M11.9233 12.7169C13.6967 12.7636 15.47 12.8297 17.2433 12.9152M9.25165 5.85689C6.26499 5.82189 5.10999 6.67355 5.20332 7.52522C5.13332 8.22522 6.32332 9.14689 9.26332 9.12355M9.27499 10.4419C6.27665 10.4536 5.07499 11.3519 5.17999 12.0402C5.16832 12.9969 6.27665 13.7086 9.29832 13.6619M9.28665 15.2136C6.32332 15.1552 5.19165 16.0419 5.16832 16.7652C5.15665 17.6169 6.35832 18.4219 9.40332 18.5036M9.25165 19.8802C6.33499 19.8919 5.07499 20.7086 5.02832 21.5369C5.10999 22.2369 6.29999 23.1119 9.33332 23.1819"
        stroke="#494444"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
