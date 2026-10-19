import { describe, expect, it } from 'vitest';
import { compH, slotShelf, slotTop, targetY, widthOf, windowH } from './geometry';
import { DEFAULT_LIBRARY_CONFIG, DEFAULT_LIBRARY_PEOPLE, FRONT_WIDTH } from './types';

const cfg = DEFAULT_LIBRARY_CONFIG;
const n = DEFAULT_LIBRARY_PEOPLE.length;

describe('Library layout math', () => {
  it('folder widths strictly increase from back (0, narrowest) to front (n-1, widest)', () => {
    const widths = Array.from({ length: n }, (_, i) => widthOf(i, n, cfg.growth));
    for (let i = 1; i < n; i++) {
      expect(widths[i]).toBeGreaterThan(widths[i - 1]);
    }
  });

  it('every folder is narrower than the drawer front', () => {
    const drawerWidth = FRONT_WIDTH + 2 * cfg.overhang;
    for (let i = 0; i < n; i++) {
      expect(widthOf(i, n, cfg.growth)).toBeLessThan(drawerWidth);
    }
  });

  it('the frontmost folder (i = n-1) is exactly FRONT_WIDTH wide; depth growth compounds backward from it', () => {
    expect(widthOf(n - 1, n, cfg.growth)).toBeCloseTo(FRONT_WIDTH, 6);
    expect(widthOf(0, n, cfg.growth)).toBeCloseTo(FRONT_WIDTH / Math.pow(1 + cfg.growth / 100, n - 1), 6);
  });

  it('slotTop/slotShelf for a given folder index never depend on which folder is selected', () => {
    for (let i = 0; i < n; i++) {
      const top = slotTop(i, cfg.tabH, cfg.gap);
      const shelf = slotShelf(i, n, cfg.gap);
      for (let sel = 0; sel < n; sel++) {
        expect(slotTop(i, cfg.tabH, cfg.gap)).toBe(top);
        expect(slotShelf(i, n, cfg.gap)).toBe(shelf);
        // targetY always resolves to exactly one of these two fixed slots, never a third value
        const y = targetY(i, sel, n, cfg.tabH, cfg.gap);
        expect(y === top || y === shelf).toBe(true);
      }
    }
  });

  it('targetY keeps every folder up to and including the selection in the top stack, the rest on the shelf', () => {
    for (let sel = 0; sel < n; sel++) {
      for (let i = 0; i < n; i++) {
        const y = targetY(i, sel, n, cfg.tabH, cfg.gap);
        if (i <= sel) expect(y).toBe(slotTop(i, cfg.tabH, cfg.gap));
        else expect(y).toBe(slotShelf(i, n, cfg.gap));
      }
    }
  });

  it('adjacent top-stack slots (and adjacent shelf slots) are exactly one gap apart', () => {
    for (let i = 1; i < n; i++) {
      expect(slotTop(i, cfg.tabH, cfg.gap) - slotTop(i - 1, cfg.tabH, cfg.gap)).toBeCloseTo(cfg.gap, 6);
      expect(slotShelf(i, n, cfg.gap) - slotShelf(i - 1, n, cfg.gap)).toBeCloseTo(cfg.gap, 6);
    }
  });

  it('windowH (the open-cover height) is independent of which folder is open', () => {
    const h = windowH(n, cfg.gap, cfg.tabH);
    expect(h).toBeGreaterThan(0);
    expect(h).toBeCloseTo(470 - cfg.gap * (n - 1) - cfg.tabH - (14 + cfg.tabH + 6), 6);
  });

  it('compH is the shelf line plus the drawer lip plus the visible crop', () => {
    expect(compH(cfg.lip, cfg.crop)).toBeCloseTo(470 + cfg.lip + cfg.crop, 6);
  });
});
