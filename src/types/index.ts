export type MediaKind = 'image' | 'video' | 'empty';

export interface StampMedia {
  kind: MediaKind;
  /** image/video URL; unused when kind is 'empty' */
  src?: string;
  /** width / height of the media (or of the slot when empty) */
  ratio: number;
  /** label chip text shown on an empty slot */
  label?: string;
}

export type StampViewer = 'other' | 'owner' | 'self';

export interface StampLayout {
  W: number;
  H: number;
  winX: number;
  winY: number;
  winW: number;
  winH: number;
  capY: number;
  capH: number;
  clamped: boolean;
}

export interface StampGeometry {
  outline: string;
  frame: string;
  backLines: string;
  censorFill: string;
  censorScribble: string;
}

export interface NoteGeometry {
  fillD: string;
  outline: string;
  /** torn-edge zigzag border notches, alternating red/blue, deterministic (not seed-random) */
  redD: string;
  blueD: string;
  backLines: string;
  censorFill: string;
  censorScribble: string;
}

export interface VoiceGeometry {
  fillD: string;
  outline: string;
  divider: string;
  chipLines: string;
  scalBox: string;
  playTriangle: string;
  /** one path segment per waveform bar, index-aligned; slice by playback progress to reveal */
  bars: string[];
  backLines: string;
  censorFill: string;
  censorScribble: string;
}

export interface TagLayout {
  W: number;
  H: number;
  slotX: number;
  slotY: number;
  slotW: number;
  slotH: number;
  linkX: number;
  linkY: number;
  linkW: number;
  underlineY: number;
  clamped: boolean;
}

export interface TagGeometry {
  fillD: string;
  outline: string;
  /** punched-hole grommet rings, fixed geometry (not seed-random) */
  holes: string;
  /** string loop curling off the top of the tag, fixed geometry (not seed-random) */
  string: string;
  slotFrame: string;
  underline: string;
  backLines: string;
  censorFill: string;
  censorScribble: string;
}

export interface SeededRng {
  R: () => number;
  J: (amplitude: number) => number;
  ln: (x1: number, y1: number, x2: number, y2: number, o?: number, bow?: number) => string;
  box: (x: number, y: number, w: number, h: number, o?: number) => string;
  /** a single continuous wobbled rectangle — unlike `box`, adjacent edges share their exact
   * jittered corner point, so there's never a corner gap or stray tick. For media frames. */
  frameBox: (x: number, y: number, w: number, h: number) => string;
  poly: (pts: Array<[number, number]>) => string;
  scal: (x: number, y: number, w: number, h: number, r: number) => string;
}

/* ------------------------------------------------------------------
   ScrapItem: the app-level data model for the four scrapbook item kinds.
   Each item component (Stamp, Note, VoicePostcard, ParcelTag) renders one kind.
------------------------------------------------------------------ */
export type ScrapViewer = StampViewer;

interface ScrapItemCommon {
  id: string;
  seed: number;
  viewer: ScrapViewer;
  senderName: string;
  date: string;
  caption?: string;
}

export interface StampScrapItem extends ScrapItemCommon {
  kind: 'stamp';
  mediaSrc: string;
  mediaType: 'image' | 'video';
}

export interface NoteScrapItem extends ScrapItemCommon {
  kind: 'note';
  text: string;
}

export interface VoiceScrapItem extends ScrapItemCommon {
  kind: 'voice';
  audioSrc?: string;
  durationSec?: number;
}

export interface TagScrapItem extends ScrapItemCommon {
  kind: 'tag';
  url: string;
  linkLabel: string;
  previewSrc?: string;
  previewType?: 'image' | 'video';
}

export type ScrapItem = StampScrapItem | NoteScrapItem | VoiceScrapItem | TagScrapItem;

/** The four user-facing ways a scrapbook can be presented. */
export type ScrapbookPresentation = 'canvas' | 'wheel' | 'envelope' | 'cover';

export type ScrapbookPermission = 'owner' | 'can write' | 'can look';

export interface ScrapbookContributor {
  id: string;
  name: string;
  permission: ScrapbookPermission;
  fill: string;
  rotation: number;
}
