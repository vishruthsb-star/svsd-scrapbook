import type { ThemeNavigationValue } from '@/components/ThemeNavigation';
import type { SampleItemId, SampleItemPlacement } from '@/scrapbook/fixtures/sampleItems';

/**
 * Frame 1g ("theme spreads") data, ported verbatim from
 * references/Scrapbook Directions.dc.html: the per-panel ink annotation paths (lines
 * 424/431/438/444 — circled theme word + arrows/dashed route) and the `G` item-placement
 * array (renderVals(), "1g theme spreads"). Nothing here is re-derived or "improved".
 */

export interface ThemeInkPath {
  d: string;
  /** Only the trips panel's dashed route overrides these (stroke-width 1.6, dasharray "7 8"); everyone else inherits the group's 1.8/solid. */
  strokeWidth?: number;
  strokeDasharray?: string;
}

export interface ThemePanelDef {
  /** Matches ThemeNavigation's TABS values so the pill and the scroller stay in lockstep. */
  id: ThemeNavigationValue;
  word: string;
  wordLeft: number;
  ink: ThemeInkPath[];
  items: Array<[SampleItemId, SampleItemPlacement]>;
}

export const THEME_PANELS: ThemePanelDef[] = [
  {
    id: 'late-nights',
    word: 'late nights',
    wordLeft: 36,
    ink: [
      { d: 'M22 168 C16 142 80 130 150 132 C196 134 206 152 198 168 C184 188 70 192 36 182 C14 176 14 154 44 144' },
      { d: 'M120 640 C150 634 158 620 166 590 M154 598 L166 588 L172 602' },
    ],
    items: [
      ['beer', { x: 22, y: 210, z: 1.05, rot: -5, attach: 'tape' }],
      ['soup', { x: 240, y: 206, z: 0.8, rot: 7, attach: 'corners' }],
      ['v1', { x: 150, y: 442, z: 0.9, rot: 3 }],
    ],
  },
  {
    id: 'laughing',
    word: 'laughing',
    wordLeft: 38,
    ink: [
      { d: 'M24 168 C18 142 70 132 128 134 C168 136 176 152 168 168 C156 186 66 190 38 180 C18 174 18 154 46 146' },
      { d: 'M300 254 C304 262 302 268 298 276 M292 268 L298 278 L306 270' },
    ],
    items: [
      ['film', { x: 18, y: 210, z: 0.85, rot: -3, attach: 'clip' }],
      ['dog', { x: 196, y: 282, z: 0.85, rot: 4 }],
      ['anyway', { x: 30, y: 424, z: 0.8, rot: 2, attach: 'tape' }],
      ['v2', { x: 186, y: 494, z: 0.8, rot: -4, attach: 'tape' }],
    ],
  },
  {
    id: 'trips',
    word: 'trips',
    wordLeft: 44,
    ink: [
      { d: 'M26 168 C20 144 54 134 92 136 C122 138 130 152 124 166 C114 184 60 188 40 180 C22 174 22 156 48 148' },
      { d: 'M100 300 C200 280 320 330 286 392 C262 452 160 446 128 534', strokeWidth: 1.6, strokeDasharray: '7 8' },
    ],
    items: [
      ['leh', { x: 24, y: 210, z: 0.9, rot: -4, attach: 'tape' }],
      ['beach', { x: 214, y: 300, z: 0.9, rot: 5 }],
      ['snow', { x: 62, y: 452, z: 0.85, rot: -2, attach: 'corners' }],
    ],
  },
  {
    id: 'songs',
    word: 'songs',
    wordLeft: 44,
    ink: [
      { d: 'M26 168 C20 144 64 134 108 136 C142 138 150 152 144 166 C134 184 66 188 42 180 C22 174 22 156 50 148' },
      { d: 'M226 650 C250 648 262 634 268 612 M258 618 L268 608 L276 620' },
    ],
    items: [
      ['quiet', { x: 50, y: 270, z: 1.1, rot: -6 }],
      ['buses', { x: 214, y: 318, z: 1, rot: 7 }],
    ],
  },
];
