import { describe, expect, it } from 'vitest';
import type { PlacedBoopStamp } from '@/scrapbook/boopStamps';
import type { PlacedMemory } from '@/scrapbook/placement';
import { boopTargetId, envelopeForElement, themeForElement, wheelMonthForElement, WINTER_ENVELOPE_INDEX } from '@/scrapbook/placement/dynamicLayout';
import { buildEnvelopes, envelopePageForMemory } from './styles/EnvelopesLip/envelopesLipGeometry';
import { buildWheel } from './styles/PaperWheel/paperWheelGeometry';
import { packThemeMemories } from './styles/ThemeSpreads/themeSpreadsGeometry';
import { THEME_PANELS } from './styles/ThemeSpreads/themeSpreadsData';

const boop = (id = 'boop-1'): PlacedBoopStamp => ({ id, stampKey: 'giddy', scrapbookId: 'library:maya', recipientName: 'maya', x: 0, y: 0, width: 136, rotation: -3, createdAt: '2026-01-12T12:00:00.000Z' });
const memory = (id = 'memory-1'): PlacedMemory => ({ id, scrapbookId: 'library:maya', recipientId: 'maya', authorId: 'friend', createdAt: '2026-01-11T12:00:00.000Z', seed: 1, kind: 'note', text: 'winter note' });

describe('BOOP canvas projection', () => {
  it('uses a namespaced target and stable theme/month projection', () => {
    expect(boopTargetId('same')).toBe('boop:same');
    expect(themeForElement(boop('same'))).toBe(themeForElement(boop('same')));
    expect(wheelMonthForElement(boop())).toBe(1);
  });

  it('packs BOOPs into their theme alongside live-memory collision bounds', () => {
    const stamp = boop();
    const panel = THEME_PANELS.find((candidate) => candidate.id === themeForElement(stamp))!;
    const packed = packThemeMemories(panel, [memory()], [stamp], 390, 0, {});
    expect(packed.some((item) => item.element.id === stamp.id)).toBe(true);
    expect(packThemeMemories(panel, [memory()], [stamp], 390, 0, {})).toEqual(packed);
  });

  it('projects all dynamic element types into Winter without moving fixture envelopes', () => {
    const stamp = boop();
    expect(envelopeForElement(memory())).toBe(WINTER_ENVELOPE_INDEX);
    expect(envelopeForElement(stamp)).toBe(WINTER_ENVELOPE_INDEX);
    expect(envelopePageForMemory(stamp, [memory()], [stamp]).envelopeIndex).toBe(WINTER_ENVELOPE_INDEX);
    const { envs } = buildEnvelopes(-1, 0, 844, {}, {}, [memory()], [stamp]);
    expect(envs[0].items.map((item) => item.id)).toEqual(['beer', 'quiet', 'leh', 'film']);
  });

  it('adds BOOPs to their selected wheel month without changing the wheel size', () => {
    const stamp = boop();
    const wheel = buildWheel(2, 0, 844, 390, [memory()], [stamp]);
    expect(wheel.items.find((item) => item.boop?.id === stamp.id)?.boop).toEqual(stamp);
    expect(wheel.items.find((item) => item.boop?.id === stamp.id)?.w).toBe(136);
  });

  it('keeps Winter envelope paging available after the six-item fan is full', () => {
    const stamps = Array.from({ length: 7 }, (_, index) => ({ ...boop(`boop-${index}`), createdAt: `2026-01-${String(index + 1).padStart(2, '0')}T12:00:00.000Z` }));
    const last = stamps[stamps.length - 1];
    expect(envelopePageForMemory(last, [], stamps)).toEqual({ envelopeIndex: WINTER_ENVELOPE_INDEX, page: 1 });
    const { envs } = buildEnvelopes(WINTER_ENVELOPE_INDEX, 0, 844, {}, {}, [], stamps, { [WINTER_ENVELOPE_INDEX]: 1 });
    expect(envs[WINTER_ENVELOPE_INDEX].items.some((item) => item.boop?.id === last.id)).toBe(true);
  });
});
