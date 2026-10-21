import { mk } from '@/scrapbook/fixtures/sampleItems';
import type { PlacedMemory } from '@/scrapbook/placement';
import type { PlacedBoopStamp } from '@/scrapbook/boopStamps';
import { packElements, rotatedBounds, themeForElement } from '@/scrapbook/placement/dynamicLayout';
import type { ThemePanelDef } from './themeSpreadsData';

export function packThemeMemories(panel: ThemePanelDef, memories: readonly PlacedMemory[], boopStamps: readonly PlacedBoopStamp[], frameW: number, designX0: number, measuredHeights: Record<string, number>) {
  const fixtures = panel.items.map(([id, placement]) => {
    const item = mk(id, placement);
    return rotatedBounds((item.x ?? 0) + designX0, item.y ?? 0, item.w, item.h, item.rot);
  });
  return packElements([...memories, ...boopStamps].filter((element) => themeForElement(element) === panel.id), frameW, 204, fixtures, measuredHeights);
}
