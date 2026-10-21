import type { ReactNode } from 'react';
import EnvelopesLip from './styles/EnvelopesLip/EnvelopesLip';
import PaperWheel from './styles/PaperWheel/PaperWheel';
import ThemeSpreads from './styles/ThemeSpreads/ThemeSpreads';
import TornStrata from './styles/TornStrata/TornStrata';
import type { FabPlacement } from './fabAnchor';
import type { PlacedMemory } from '@/scrapbook/placement';
import type { PlacedBoopStamp } from '@/scrapbook/boopStamps';

export type CanvasStyle = 'torn-strata' | 'theme-spreads' | 'envelopes-lip' | 'paper-wheel';

export interface CanvasStyleProps {
  /** Volume 1 SPEC OVERRIDES naming — replaces 'self' | 'other'. */
  view: 'own' | 'visitor';
  /** (safe-top + measured header height) - reference header bottom (113). */
  headerDelta: number;
  ownerName: string;
  /** Real measured frame size (ScreenShell's W/H) — full-bleed layers use these directly. */
  frameW: number;
  frameH: number;
  /** (frameW - 390) / 2 — hand-placed reference-coordinate content offsets by this so it lands centered regardless of how much wider the real frame is than the reference's 390. */
  designX0: number;
  /** Created memories are consumed by the style that owns their grouping/navigation. */
  items?: PlacedMemory[];
  boopStamps?: PlacedBoopStamp[];
  /** Set only after a successful user insertion; styles may reveal this item in their own scroller. */
  scrollTargetId?: string | null;
  /** A style calls this once its bounded DOM-target request has completed. */
  onScrollTargetHandled?: (id: string) => void;
  onRemoveItem?: (id: string) => void;
}

/**
 * One entry per references/Scrapbook Directions.dc.html frame (1a torn strata, 1g theme
 * spreads, 1f-4 envelopes "pocket lip", 1e-paper "paper wheel"). All four are implemented.
 */
export const CANVAS_STYLES: Record<CanvasStyle, (props: CanvasStyleProps) => ReactNode> = {
  'torn-strata': (props) => <TornStrata {...props} />,
  'theme-spreads': (props) => <ThemeSpreads {...props} />,
  'envelopes-lip': (props) => <EnvelopesLip {...props} />,
  'paper-wheel': (props) => <PaperWheel {...props} />,
};

/**
 * Which corner each style's add button anchors to (torn-strata: bottom-center; theme-
 * spreads/envelopes-lip/paper-wheel: top-right).
 */
export const CANVAS_STYLE_FAB_PLACEMENT: Record<CanvasStyle, FabPlacement> = {
  'torn-strata': 'bc',
  'theme-spreads': 'tr',
  'envelopes-lip': 'tr',
  'paper-wheel': 'tr',
};
