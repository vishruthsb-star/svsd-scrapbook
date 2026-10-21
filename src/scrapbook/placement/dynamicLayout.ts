import type { PlacedMemory } from '.';
import type { PlacedBoopStamp } from '@/scrapbook/boopStamps';
import { findCompactPlacement } from './compactPlacement';

export const THEME_IDS = ['late-nights', 'laughing', 'trips', 'songs'] as const;
export type ThemeId = (typeof THEME_IDS)[number];

export const ENVELOPE_COUNT = 4;
/** Legacy fixture constant; new records use timestamp-based seasonal membership. */
export const WINTER_ENVELOPE_INDEX = 2;
/** Prototype policy: persisted dynamic content is always projected into the authored Winter envelope. */

export interface LayoutBounds { x: number; y: number; w: number; h: number; }
export type CanvasDynamicElement = PlacedMemory | PlacedBoopStamp;
export interface PackedElement { element: CanvasDynamicElement; x: number; y: number; rot: number; z: number; }
export interface PackedMemory extends PackedElement { memory: PlacedMemory; }

export function isBoopStamp(element: CanvasDynamicElement): element is PlacedBoopStamp {
  return 'stampKey' in element;
}

export function boopTargetId(id: string): string { return `boop:${id}`; }
export function targetIdForElement(element: CanvasDynamicElement): string { return isBoopStamp(element) ? boopTargetId(element.id) : element.id; }

export function stableHash(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function sortMemories(memories: readonly PlacedMemory[]): PlacedMemory[] {
  return [...memories].sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
}

export function themeForMemory(memory: PlacedMemory): ThemeId {
  return THEME_IDS.includes(memory.theme as ThemeId)
    ? memory.theme as ThemeId
    : THEME_IDS[stableHash(memory.id) % THEME_IDS.length];
}

/** Seasonal envelope membership derived from the authored timestamp. */
export function envelopeForMemory(memory: PlacedMemory): number {
  const month = new Date(memory.createdAt).getUTCMonth();
  if (Number.isNaN(month)) return 2;
  if (month >= 8 && month <= 10) return 0; // autumn
  if (month >= 5 && month <= 7) return 1; // summer
  if (month === 11 || month <= 1) return 2; // winter
  return 3; // spring
}

export function envelopeForElement(element: CanvasDynamicElement): number {
  return envelopeForMemory({ createdAt: element.createdAt } as PlacedMemory);
}

export function themeForElement(element: CanvasDynamicElement): ThemeId {
  return isBoopStamp(element) ? THEME_IDS[stableHash(element.id) % THEME_IDS.length] : themeForMemory(element);
}

/** Paper Wheel's historical fixture indexing is Dec=0, Jan=1 … Oct=10; November is its quiet slot. */
export function wheelMonthForMemory(memory: Pick<PlacedMemory, 'createdAt'>): number {
  const date = new Date(memory.createdAt);
  const month = Number.isNaN(date.getTime()) ? 0 : date.getMonth();
  return month === 11 ? 0 : month + 1;
}

export function wheelMonthForElement(element: CanvasDynamicElement): number {
  return wheelMonthForMemory(element);
}

export function memorySize(memory: PlacedMemory, measuredHeight?: number): [number, number] {
  if (memory.kind === 'stamp') {
    const ratio = Math.max(.5, Math.min(2, memory.ratio ?? 1));
    const captionLines = Math.max(0, Math.ceil((memory.text?.length ?? 0) / 19));
    return [150, measuredHeight ?? (122 / ratio + 32 + captionLines * 18)];
  }
  if (memory.kind === 'note') return [200, measuredHeight ?? Math.max(170, 50 + Math.ceil((memory.text?.length ?? 0) / 20) * 30)];
  if (memory.kind === 'voice') return [230, measuredHeight ?? 146];
  return [124, measuredHeight ?? Math.max(158, 116 + Math.ceil((memory.text?.length ?? 0) / 13) * 15)];
}

export function elementSize(element: CanvasDynamicElement, measuredHeight?: number): [number, number] {
  return isBoopStamp(element) ? [element.width, measuredHeight ?? element.width] : memorySize(element, measuredHeight);
}

export function dynamicRotation(id: string): number {
  const rotation = -5 + (stableHash(id) / 0xffffffff) * 10;
  return Math.abs(rotation) < .7 ? (rotation < 0 ? -.7 : .7) : Number(rotation.toFixed(2));
}

/**
 * A deliberately broad, but still readable, set of scrapbook tilts.  Layouts resolve an
 * element against rotations already used in its local cluster, rather than independently
 * hashing every element into the same narrow range.
 */
const ROTATION_PALETTE = [-7, 6.5, -4.5, 4, -2.5, 2, -1, 1, 7.5, -6, 3, -3.5, 0];
const MIN_ROTATION_SEPARATION = 1.25;

/**
 * Stable local rotation selection. `usedRotations` should contain the elements which are
 * visually grouped with this one. The preferred value keeps authored/boop tilts whenever
 * they are sufficiently distinct, otherwise a deterministic palette alternative is used.
 */
export function resolveDistinctRotation(id: string, usedRotations: readonly number[], preferred?: number): number {
  const candidates = preferred === undefined
    ? ROTATION_PALETTE.map((_, index) => ROTATION_PALETTE[(stableHash(id) + index) % ROTATION_PALETTE.length])
    : [preferred, ...ROTATION_PALETTE.map((_, index) => ROTATION_PALETTE[(stableHash(id) + index) % ROTATION_PALETTE.length])];
  const isDistinct = (angle: number) => usedRotations.every((used) => Math.abs(angle - used) >= MIN_ROTATION_SEPARATION);
  const separated = candidates.find(isDistinct);
  if (separated !== undefined) return separated;
  const unused = candidates.find((angle) => !usedRotations.includes(angle));
  if (unused !== undefined) return unused;
  const leastCrowded = candidates.reduce((best, angle) => {
    const nearest = Math.min(...usedRotations.map((used) => Math.abs(angle - used)));
    const bestNearest = Math.min(...usedRotations.map((used) => Math.abs(best - used)));
    return nearest > bestNearest ? angle : best;
  });
  // Dense generated clusters can exhaust the palette. Preserve the hard no-duplicate
  // guarantee with a small deterministic nudge, still inside a readable tilt range.
  let overflow = Number((leastCrowded + ((stableHash(id) % 9) + 1) / 10).toFixed(2));
  while (usedRotations.includes(overflow)) overflow = Number((overflow + .1).toFixed(2));
  return overflow;
}

export function elementRotation(element: CanvasDynamicElement): number {
  return isBoopStamp(element) ? element.rotation : dynamicRotation(element.id);
}

export function rotatedBounds(x: number, y: number, width: number, height: number, rotation: number): LayoutBounds {
  const radians = Math.abs(rotation) * Math.PI / 180;
  const w = Math.abs(width * Math.cos(radians)) + Math.abs(height * Math.sin(radians));
  const h = Math.abs(width * Math.sin(radians)) + Math.abs(height * Math.cos(radians));
  return { x: x - (w - width) / 2, y: y - (h - height) / 2, w, h };
}

export function packElements(
  elements: readonly CanvasDynamicElement[],
  frameWidth: number,
  startY: number,
  fixtureBounds: readonly LayoutBounds[] = [],
  measuredHeights: Record<string, number> = {},
  zoom = .84,
  fixtureRotations: readonly number[] = [],
): PackedElement[] {
  const occupied = [...fixtureBounds];
  const usedRotations = [...fixtureRotations];
  return [...elements].sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id)).map((element) => {
    const [naturalW, naturalH] = elementSize(element, measuredHeights[element.id]);
    const itemZoom = isBoopStamp(element) ? 1 : zoom;
    const width = naturalW * itemZoom;
    const height = naturalH * itemZoom;
    const rot = resolveDistinctRotation(element.id, usedRotations, isBoopStamp(element) ? element.rotation : undefined);
    const footprint = rotatedBounds(0, 0, width, height, rot);
    const placed = findCompactPlacement({
      frameWidth,
      startY,
      item: { w: footprint.w, h: footprint.h },
      occupied,
      seed: stableHash(element.id),
    });
    occupied.push({ x: placed.x, y: placed.y, w: footprint.w, h: footprint.h });
    usedRotations.push(rot);
    return { element, x: Math.round(placed.x + (footprint.w - width) / 2), y: Math.round(placed.y + (footprint.h - height) / 2), rot, z: itemZoom };
  });
}

export function packMemories(memories: readonly PlacedMemory[], frameWidth: number, startY: number, fixtureBounds: readonly LayoutBounds[] = [], measuredHeights: Record<string, number> = {}, zoom = .84): PackedMemory[] {
  return packElements(memories, frameWidth, startY, fixtureBounds, measuredHeights, zoom).map((placed) => ({ ...placed, memory: placed.element as PlacedMemory }));
}
