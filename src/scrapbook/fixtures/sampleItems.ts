/**
 * Sample scrapbook items — ported verbatim from references/Scrapbook Directions.dc.html's
 * `IDS`/`IT`/`mk()` (the fixture every frame in that file draws from). Field names, values,
 * and `mk()`'s merge order are copied as-is; only the per-image `ratio` is new (the
 * reference's own-dimension photos aren't part of its data model — see sampleItems' own
 * note below).
 *
 * Images: references/photo-beer.png, photo-leh.png, photo-beach.png, thumb-quiet.png were
 * actually JPEGs (not PNGs) despite their reference filenames — copied into
 * public/scrapbook/ with corrected .jpg extensions and real aspect ratios read from each
 * file's own JPEG SOF0 header, not invented.
 */

export type SampleItemType = 'stamp' | 'note' | 'voice' | 'tag';

export type SampleItemAttach = 'tape' | 'clip' | 'corners' | 'none';

export interface SampleItemPlacement {
  x?: number;
  y?: number;
  rot?: number;
  z?: number;
  attach?: SampleItemAttach;
}

export interface SampleItemBase {
  type: SampleItemType;
  text?: string;
  label?: string;
  city?: string;
  date: string;
  year: string;
  denom?: string;
  src?: string;
  /** Real image aspect ratio (width / height) — not in the reference's own data model; see file header. */
  ratio?: number;
  dur?: string;
  from: string;
  /** "same hand" grouping (1c) — unused by torn-strata, carried over for later styles. */
  hand: number;
  /** month index (0 = Dec '25 .. 10 = Oct '26) — used by the year-dial frame (1e), unused here. */
  m: number;
}

export const IDS = ['beer', 'quiet', 'leh', 'film', 'v1', 'beach', 'dog', 'buses', 'soup', 'v2', 'anyway', 'snow'] as const;

export type SampleItemId = (typeof IDS)[number];

export const IT: Record<SampleItemId, SampleItemBase> = {
  beer: {
    type: 'stamp',
    text: 'cranberry beer @ vault',
    label: 'vault',
    city: 'bengaluru',
    date: '12 oct',
    year: '2026',
    denom: '2',
    src: '/scrapbook/photo-beer.jpg',
    ratio: 1280 / 852,
    from: 'priya',
    hand: 0,
    m: 10,
  },
  quiet: {
    type: 'tag',
    text: 'the quiet hour',
    src: '/scrapbook/thumb-quiet.jpg',
    ratio: 1280 / 960,
    date: '4 oct',
    year: '2026',
    from: 'maya',
    hand: 1,
    m: 10,
  },
  leh: {
    type: 'stamp',
    text: 'juley',
    label: 'leh',
    city: 'leh',
    date: '28 sep',
    year: '2026',
    denom: '5',
    src: '/scrapbook/photo-leh.jpg',
    ratio: 1280 / 719,
    from: 'jun',
    hand: 2,
    m: 9,
  },
  film: {
    type: 'note',
    text: 'you laughed at the exact same part of the film i did, a full second before everyone else.',
    date: '19 sep',
    year: '2026',
    from: 'priya',
    hand: 0,
    m: 9,
  },
  v1: { type: 'voice', dur: '0:42', date: '3 sep', year: '2026', from: 'theo', hand: 3, m: 9 },
  beach: {
    type: 'stamp',
    text: 'low tide, all four of us',
    label: 'marina',
    city: 'chennai',
    date: '2 aug',
    year: '2026',
    denom: '3',
    src: '/scrapbook/photo-beach.jpg',
    ratio: 720 / 1280,
    from: 'maya',
    hand: 1,
    m: 8,
  },
  dog: {
    type: 'note',
    text: "saw a dog in a raincoat and it was so obviously your dog. you don't have a dog.",
    date: '11 aug',
    year: '2026',
    from: 'jun',
    hand: 2,
    m: 8,
  },
  buses: { type: 'tag', text: 'songs for buses', date: '20 jul', year: '2026', from: 'theo', hand: 3, m: 7 },
  soup: {
    type: 'stamp',
    text: 'tuesday soup',
    label: 'kitchen',
    city: 'pune',
    date: '8 jul',
    year: '2026',
    denom: '1',
    from: 'priya',
    hand: 0,
    m: 7,
  },
  v2: { type: 'voice', dur: '1:07', date: '21 jun', year: '2026', from: 'maya', hand: 1, m: 6 },
  anyway: { type: 'note', text: "the way you say 'anyway' like a door closing", date: '2 jun', year: '2026', from: 'jun', hand: 2, m: 6 },
  snow: {
    type: 'stamp',
    text: 'first snow',
    label: 'snow',
    city: 'manali',
    date: '14 dec',
    year: '2025',
    denom: '5',
    from: 'theo',
    hand: 3,
    m: 0,
  },
};

const TYPE_SIZE: Record<SampleItemType, [number, number]> = {
  stamp: [150, 196],
  note: [200, 170],
  voice: [230, 146],
  tag: [124, 200],
};

export interface MkResult extends SampleItemBase {
  id: SampleItemId;
  rot: number;
  x?: number;
  y?: number;
  z: number;
  attach?: SampleItemAttach;
  w: number;
  h: number;
  hint: string;
}

/** Verbatim port of the reference's `mk(id, o)` — merges a placement override onto the base item and computes `w`/`h`/`hint` from the type's base size × zoom. */
export function mk(id: SampleItemId, o: SampleItemPlacement = {}): MkResult {
  const b = IT[id];
  const z = o.z ?? 1;
  const s = TYPE_SIZE[b.type];
  return { ...b, id, rot: 0, ...o, z, w: s[0] * z, h: s[1] * z, hint: `${Math.round(s[0] * z)}px,${Math.round(s[1] * z)}px` };
}

/** Every real image URL referenced by the fixture — used to pre-decode canvas photos before first paint (see utils/decodeImages.ts). */
export const SAMPLE_IMAGE_SRCS: readonly string[] = Object.values(IT)
  .map((item) => item.src)
  .filter((src): src is string => typeof src === 'string');

/** Verbatim port of the reference's `fmt(it)` — "{date} {year}" uppercased, e.g. "12 OCT 2026". */
export function fmtDate(it: Pick<SampleItemBase, 'date' | 'year'>): string {
  return (it.date + ' ' + it.year).toUpperCase();
}
