import { ScrapbookCanvasPage } from '@/scrapbook/canvas';
import type { AddFabKind } from '@/components/AddFab';
import type { PlacedMemory } from '@/scrapbook/placement';

/**
 * Default scrapbook design for the Book tab: torn strata. Theme spreads (and the other two
 * styles) stay in the repo unchanged — only this selection changed. `fabPlacement`
 * overrides torn-strata's registry default (bottom-center) to top-right, since
 * bottom-center would sit directly under the app-shell-level HomeBottomNavigation, which
 * torn-strata's standalone gallery preview doesn't have to contend with.
 */
export interface CanvasScreenProps { recipientName: string; onAddSelect: (kind: AddFabKind) => void; items?: PlacedMemory[]; }
export default function CanvasScreen({ recipientName, onAddSelect, items }: CanvasScreenProps) {
  return <ScrapbookCanvasPage style="torn-strata" view="visitor" ownerName={recipientName} fabPlacement="tr" onAddSelect={onAddSelect} items={items} />;
}
