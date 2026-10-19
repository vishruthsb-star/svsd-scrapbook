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

export interface SeededRng {
  R: () => number;
  J: (amplitude: number) => number;
  ln: (x1: number, y1: number, x2: number, y2: number, o?: number, bow?: number) => string;
  box: (x: number, y: number, w: number, h: number, o?: number) => string;
  poly: (pts: Array<[number, number]>) => string;
  scal: (x: number, y: number, w: number, h: number, r: number) => string;
}
