import { describe, expect, it } from 'vitest';
import type { PlacedMemory } from '@/scrapbook/placement';
import type { PlacedBoopStamp } from '@/scrapbook/boopStamps';
import { buildStrata } from './tornStrataGeometry';

const memory = (id: string, createdAt = '2026-10-20T12:00:00.000Z'): PlacedMemory => ({
  id, scrapbookId: 'library:maya', recipientId: 'maya', authorId: 'friend', createdAt, seed: 1, kind: 'voice', durationSec: 4,
});

describe('TornStrata created-memory placement', () => {
  it('keeps fixtures unchanged when there are no created memories', () => {
    const { strata } = buildStrata(0, 390);
    expect(strata.find((strip) => strip.label === 'OCT 2026')?.items.map((item) => item.id)).toEqual(['beer', 'quiet']);
    expect(strata.every((strip) => strip.dynamicItems.length === 0)).toBe(true);
  });

  it('adds created records to their real month and grows that strip', () => {
    const base = buildStrata(0, 390);
    const next = buildStrata(0, 390, [memory('created-oct')]);
    const baseOct = base.strata.find((strip) => strip.label === 'OCT 2026')!;
    const nextOct = next.strata.find((strip) => strip.label === 'OCT 2026')!;
    expect(nextOct.dynamicItems.map((item) => item.memory.id)).toEqual(['created-oct']);
    expect(nextOct.hh).toBeGreaterThan(baseOct.hh);
    expect(next.strata.find((strip) => strip.label === 'SEP 2026')!.top).toBeGreaterThan(base.strata.find((strip) => strip.label === 'SEP 2026')!.top);
  });

  it('packs crowded created records deterministically without overlapping their conservative footprints', () => {
    const records = Array.from({ length: 7 }, (_, index) => memory(`voice-${index}`));
    const first = buildStrata(0, 390, records).strata.find((strip) => strip.label === 'OCT 2026')!.dynamicItems;
    const second = buildStrata(0, 390, records).strata.find((strip) => strip.label === 'OCT 2026')!.dynamicItems;
    expect(second).toEqual(first);
    expect(new Set(first.map((item) => item.rot)).size).toBe(first.length);
    for (let a = 0; a < first.length; a += 1) for (let b = a + 1; b < first.length; b += 1) {
      // Voice is 230x146 at .84 zoom. This intentionally ignores the extra rotation margin,
      // so a pass here means the rendered conservative boxes have at least as much space.
      const one = first[a]; const two = first[b];
      const separated = one.x + 193 <= two.x || two.x + 193 <= one.x || one.y + 123 <= two.y || two.y + 123 <= one.y;
      expect(separated).toBe(true);
    }
  });

  it('uses side-by-side space for consecutive BOOP stamps before growing the month', () => {
    const stamps: PlacedBoopStamp[] = [0, 1].map((index) => ({
      id: `boop-${index}`, stampKey: index ? 'giddy' : 'nostalgic', stampDesignId: index ? 'giddy' : 'nostalgic', recipientBookId: 'library:maya', senderId: index ? 'jun' : 'priya',
      x: 0, y: 0, width: 136, rotation: index ? 4 : -3, createdAt: '2026-10-20T12:00:00.000Z',
    }));
    const placed = buildStrata(0, 390, [], stamps).strata.find((strip) => strip.label === 'OCT 2026')!.boopStamps;
    expect(placed).toHaveLength(2);
    expect(Math.abs(placed[0].x - placed[1].x)).toBeGreaterThan(120);
    expect(placed[0].x + stamps[0].width <= placed[1].x || placed[1].x + stamps[1].width <= placed[0].x).toBe(true);
  });
});
