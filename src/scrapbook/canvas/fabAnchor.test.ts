import { describe, expect, it } from 'vitest';
import { fabAnchor, rightSafeCenter } from './fabAnchor';

const PILL_H = 52;
const HEADER_HEIGHT = 61; // ScrapbookHeader's measured height (X), for this worked example
const FRAME_W = 390;
const FRAME_H = 844;

describe('fabAnchor', () => {
  it('bottom-center: pill bottom at the frame bottom safe edge, centered horizontally', () => {
    // bottom = 844 - SAFE.bottom(34) = 810; y = 810 - 52/2 = 784. x = (24 + 366)/2 = 195.
    expect(fabAnchor('bc', 120, PILL_H, HEADER_HEIGHT, FRAME_W, FRAME_H)).toEqual({ x: 195, y: 784 });
  });

  it('top-right: pill top at safe-top + header + 20, right edge at frameW - SAFE.side, honoring the measured pill width', () => {
    // top = 62 + 61 + 20 = 143; y = 143 + 26 = 169. right = 390 - 24 = 366; x = 366 - 120/2 = 306.
    expect(fabAnchor('tr', 120, PILL_H, HEADER_HEIGHT, FRAME_W, FRAME_H)).toEqual({ x: 306, y: 169 });
  });

  it('bc ignores pillW (horizontally symmetric in the working rectangle)', () => {
    expect(fabAnchor('bc', 40, PILL_H, HEADER_HEIGHT, FRAME_W, FRAME_H)).toEqual(fabAnchor('bc', 400, PILL_H, HEADER_HEIGHT, FRAME_W, FRAME_H));
  });

  it('tracks a wider frame: bc stays centered on the real frameW, tr stays pinned to the real right edge', () => {
    const wide = fabAnchor('bc', 120, PILL_H, HEADER_HEIGHT, 402, FRAME_H);
    expect(wide.x).toBe((24 + (402 - 24)) / 2);
    const tr = fabAnchor('tr', 120, PILL_H, HEADER_HEIGHT, 402, FRAME_H);
    expect(tr.x).toBe(402 - 24 - 60);
  });

  it('keeps any right-anchored pill on the shared safe edge at narrow and wide frame widths', () => {
    expect(rightSafeCenter(390, 99) + 99 / 2).toBe(366);
    expect(rightSafeCenter(320, 99) + 99 / 2).toBe(296);
    expect(rightSafeCenter(480, 99) + 99 / 2).toBe(456);
  });
});
