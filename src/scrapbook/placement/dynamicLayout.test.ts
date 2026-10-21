import { describe, expect, it } from 'vitest';
import type { PlacedMemory } from '.';
import { envelopeForMemory, packMemories, themeForMemory, wheelMonthForMemory } from './dynamicLayout';

const memory = (id: string, createdAt = '2026-01-10T12:00:00.000Z'): PlacedMemory => ({
  id, scrapbookId: 'library:maya', recipientId: 'maya', authorId: 'friend', createdAt, seed: 1, kind: 'note', text: 'hello there',
});

describe('dynamic canvas presentation helpers', () => {
  it('uses explicit theme metadata and otherwise derives a stable theme from the memory ID', () => {
    expect(themeForMemory({ ...memory('explicit'), theme: 'songs' })).toBe('songs');
    expect(themeForMemory(memory('legacy-id'))).toBe(themeForMemory(memory('legacy-id')));
  });

  it('maps envelopes and paper-wheel months independently of render order', () => {
    expect(envelopeForMemory(memory('same-id'))).toBe(envelopeForMemory(memory('same-id')));
    expect(wheelMonthForMemory(memory('jan', '2027-01-01T12:00:00.000Z'))).toBe(1);
    expect(wheelMonthForMemory(memory('dec', '2027-12-01T12:00:00.000Z'))).toBe(0);
  });

  it('packs repeated additions deterministically without fixture overlap', () => {
    const records = [memory('a'), memory('b'), memory('c')];
    const fixture = [{ x: 16, y: 204, w: 358, h: 170 }];
    const first = packMemories(records, 390, 204, fixture);
    const second = packMemories(records, 390, 204, fixture);
    expect(second).toEqual(first);
    for (const item of first) expect(item.y).toBeGreaterThanOrEqual(380);
  });
});
