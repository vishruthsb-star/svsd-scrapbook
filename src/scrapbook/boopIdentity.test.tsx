import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { BoopStamp } from '@/components/BoopFab';
import { CANONICAL_BOOPS, CANONICAL_MEMORIES, canonicalBoopsFor } from './fixtures/canonicalMemories';

const PLACEHOLDER_COPY = /\b(?:dfss|djdjd|asdf|qwerty|lorem ipsum)\b/i;

describe('canonical BOOP identity', () => {
  it('never sends a canonical BOOP to its own sender and keeps varied senders per book', () => {
    for (const stamp of CANONICAL_BOOPS) expect(stamp.senderId).not.toBe(stamp.recipientBookId.replace('library:', ''));
    for (const bookId of new Set(CANONICAL_BOOPS.map((stamp) => stamp.recipientBookId))) {
      expect(new Set(canonicalBoopsFor(bookId.replace('library:', '')).map((stamp) => stamp.senderId)).size).toBeGreaterThan(1);
    }
  });

  it('renders the sender name into the SVG, never a recipient prop', () => {
    const markup = renderToStaticMarkup(<BoopStamp stampKey="giddy" senderName="Maya" />);
    expect(markup).toContain('Maya was');
    expect(markup).not.toContain('Priya was');
  });
});

describe('canonical memory copy', () => {
  it('does not ship known keyboard-mash placeholders', () => {
    expect(CANONICAL_MEMORIES.some((memory) => PLACEHOLDER_COPY.test(memory.text ?? ''))).toBe(false);
  });
});
