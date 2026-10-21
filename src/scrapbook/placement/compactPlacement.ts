/** Deterministic 2-D packing for newly created scrapbook objects. */
export interface PlacementBounds { x: number; y: number; w: number; h: number; }
export interface CompactPlacementOptions {
  frameWidth: number;
  startY: number;
  item: Pick<PlacementBounds, 'w' | 'h'>;
  occupied: PlacementBounds[];
  gap?: number;
  seed: number;
}
export interface CompactPlacement { x: number; y: number; requiredHeight: number; }

export function boundsOverlap(a: PlacementBounds, b: PlacementBounds, gap = 16): boolean {
  return a.x - gap < b.x + b.w && a.x + a.w + gap > b.x && a.y - gap < b.y + b.h && a.y + a.h + gap > b.y;
}

function rectDistance(a: PlacementBounds, b: PlacementBounds): number {
  const dx = Math.max(b.x - (a.x + a.w), a.x - (b.x + b.w), 0);
  const dy = Math.max(b.y - (a.y + a.h), a.y - (b.y + b.h), 0);
  return Math.hypot(dx, dy);
}

/** Scores candidates around occupied artwork before extending the strip. */
export function findCompactPlacement({ frameWidth, startY, item, occupied, gap = 16, seed }: CompactPlacementOptions): CompactPlacement {
  const side = 16;
  const minX = side;
  const maxX = Math.max(minX, frameWidth - item.w - side);
  const clampX = (x: number) => Math.round(Math.max(minX, Math.min(maxX, x)));
  const jitterX = (seed % 13) - 6;
  const jitterY = (Math.floor(seed / 13) % 9) - 4;
  const candidates = new Map<string, PlacementBounds>();
  const add = (x: number, y: number) => {
    const candidate = { x: clampX(x), y: Math.max(startY, Math.round(y)), w: item.w, h: item.h };
    candidates.set(`${candidate.x}:${candidate.y}`, candidate);
  };
  const anchors = seed % 2 ? [minX, maxX, (minX + maxX) / 2] : [maxX, minX, (minX + maxX) / 2];
  anchors.forEach((x) => add(x + jitterX, startY + jitterY));
  for (const other of occupied) {
    const middleX = other.x + other.w / 2 - item.w / 2 + jitterX;
    const middleY = other.y + other.h / 2 - item.h / 2 + jitterY;
    add(other.x + other.w + gap, other.y + jitterY);
    add(other.x - item.w - gap, other.y + jitterY);
    add(middleX, other.y - item.h - gap);
    add(middleX, other.y + other.h + gap);
    add(other.x + other.w + gap, middleY);
    add(other.x - item.w - gap, middleY);
  }
  const currentBottom = occupied.reduce((bottom, other) => Math.max(bottom, other.y + other.h), startY);
  for (let y = startY; y <= currentBottom + item.h + gap; y += 12) for (let x = minX; x <= maxX; x += 12) add(x + jitterX, y + jitterY);
  const valid = [...candidates.values()].filter((candidate) => !occupied.some((other) => boundsOverlap(candidate, other, gap)));
  const choices = valid.length ? valid : [{ x: clampX(seed % 2 ? minX : maxX), y: Math.max(startY, currentBottom + gap), w: item.w, h: item.h }];
  choices.sort((a, b) => {
    const aBottom = Math.max(currentBottom, a.y + a.h);
    const bBottom = Math.max(currentBottom, b.y + b.h);
    const aNear = occupied.length ? Math.min(...occupied.map((other) => rectDistance(a, other))) : 0;
    const bNear = occupied.length ? Math.min(...occupied.map((other) => rectDistance(b, other))) : 0;
    const aScore = (aBottom - startY) * 5 + Math.abs(aNear - gap) * 2 + Math.abs(a.x - (seed % 2 ? minX : maxX)) * .08;
    const bScore = (bBottom - startY) * 5 + Math.abs(bNear - gap) * 2 + Math.abs(b.x - (seed % 2 ? minX : maxX)) * .08;
    return aScore - bScore || ((a.x * 31 + a.y + seed) % 17) - ((b.x * 31 + b.y + seed) % 17);
  });
  const best = choices[0];
  return { x: best.x, y: best.y, requiredHeight: Math.ceil(best.y + best.h + 24) };
}
