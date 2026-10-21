export interface LibraryPerson {
  name: string;
  coverImage?: string;
  /** which third of the card the tab sits in — keeps the left/middle/right stagger */
  col: 0 | 1 | 2;
  unread?: boolean;
}

export type LibraryFont = 'hand' | 'condensed' | 'mono';
export type LibraryEngine = 'spring' | 'curve';
export type LibraryCurve = 'ios' | 'expo' | 'standard';
export type LibraryPreview = 'shaded' | 'plain';
export type LibraryMotionMode = 'auto' | 'full' | 'reduced';

export interface LibraryConfig {
  quality: number;
  grain: number;
  stroke: number;
  font: LibraryFont;
  tabH: number;
  tabW: number;
  slant: number;
  tabRadius: number;
  fillet: number;
  tabSize: number;
  gap: number;
  growth: number;
  sheetRadius: number;
  shadow: number;
  overhang: number;
  lip: number;
  converge: number;
  crop: number;
  preview: LibraryPreview;
  hatch: number;
  engine: LibraryEngine;
  duration: number;
  bounce: number;
  curve: LibraryCurve;
  stagger: number;
  press: number;
  pressMs: number;
  lift: number;
  liftShadow: number;
  fillDelay: number;
  fillMs: number;
  motion: LibraryMotionMode;
}

/** Final values chosen in the harness — the component's actual defaults (not the harness's own exploratory defaults). */
export const DEFAULT_LIBRARY_CONFIG: LibraryConfig = {
  quality: 77,
  grain: 0.05,
  stroke: 1.85,
  font: 'condensed',
  tabH: 45,
  tabW: 36,
  slant: 64,
  tabRadius: 7,
  fillet: 4.5,
  tabSize: 21,
  gap: 27,
  growth: 1.9,
  sheetRadius: 7,
  shadow: 0,
  overhang: 18.5,
  lip: 6.5,
  converge: 16,
  crop: 54,
  preview: 'shaded',
  hatch: 5.5,
  engine: 'spring',
  duration: 450,
  bounce: 0.1,
  curve: 'ios',
  stagger: 0,
  press: 0.97,
  pressMs: 80,
  lift: 2,
  liftShadow: 0.28,
  fillDelay: 150,
  fillMs: 150,
  motion: 'auto',
};

export const DEFAULT_LIBRARY_PEOPLE: LibraryPerson[] = [
  { name: 'maya', col: 2, unread: true, coverImage: '/album-covers/maya.jpg' },
  { name: 'priya', col: 1, coverImage: '/album-covers/priya.jpg' },
  { name: 'jun', col: 0, coverImage: '/album-covers/jun.jpg' },
  { name: 'theo', col: 2, unread: true, coverImage: '/album-covers/theo.jpg' },
  { name: 'ana', col: 0, coverImage: '/album-covers/ana.jpg' },
  { name: 'sam', col: 1, coverImage: '/album-covers/sam.jpg' },
];

export const DEFAULT_SELECTED_INDEX = 2; // jun

export const FONT_STACKS: Record<LibraryFont, readonly [string, number]> = {
  hand: ["'Shantell Sans', cursive", 300],
  condensed: ["'Barlow Condensed', sans-serif", 400],
  mono: ["'DM Mono', monospace", 400],
};

export const CURVE_BEZIER: Record<LibraryCurve, string> = {
  ios: 'cubic-bezier(0.32, 0.72, 0, 1)',
  expo: 'cubic-bezier(0.16, 1, 0.3, 1)',
  standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
};

/* Fixed layout constants — not configurable (not part of the harness's own control panel). */
export const CARD_WIDTH = 372; // CW
export const CARD_CENTER = CARD_WIDTH / 2; // CX
export const FRONT_WIDTH = 325; // WF — width of the frontmost (widest) folder
export const BELT = 470; // y of the shelf line
export const TOP_OFFSET = 14; // OY
export const BODY_LENGTH = 620; // BODY — how far each folder's sides run down (clipped by the component's height)
