import { useMemo } from 'react';
import { makeRng } from '@/utils/geometry';
import './HandDrawnDivider.css';

export interface HandDrawnDividerProps { seed: number; className?: string; }

/** A fixed, subtly wobbled SVG divider using the shared seeded ink-line utility. */
export default function HandDrawnDivider({ seed, className = '' }: HandDrawnDividerProps) {
  const path = useMemo(() => makeRng(seed).ln(1, 2.5, 345, 2.5, 0.14, 0.22), [seed]);
  return <svg className={`hand-drawn-divider ${className}`} viewBox="0 0 346 5" preserveAspectRatio="none" aria-hidden="true"><path d={path} /></svg>;
}
