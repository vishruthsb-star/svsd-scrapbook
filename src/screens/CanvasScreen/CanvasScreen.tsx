import { ScrapbookCanvasPage } from '@/scrapbook/canvas';
import type { AddFabKind } from '@/components/AddFab';
import type { PlacedMemory } from '@/scrapbook/placement';
import type { PlacedBoopStamp, BoopStampKey } from '@/scrapbook/boopStamps';

/**
 * Default scrapbook design for the Book tab: torn strata. Theme spreads (and the other two
 * styles) stay in the repo unchanged — only this selection changed. `fabPlacement`
 * overrides torn-strata's registry default (bottom-center) to top-right, since
 * top-right clears the canvas header in the direct HomeScreenV2 flow.
 */
export interface CanvasScreenProps { recipientName: string; onBack?: () => void; onAddSelect: (kind: AddFabKind) => void; items?: PlacedMemory[]; boopStamps?: PlacedBoopStamp[]; onBoopSelect: (key: BoopStampKey, position: { x: number; y: number }) => void; scrollTargetId?: string | null; onBoopOpenChange?: (open: boolean) => void; }
export default function CanvasScreen({ recipientName, onBack, onAddSelect, items, boopStamps, onBoopSelect, scrollTargetId, onBoopOpenChange }: CanvasScreenProps) {
  return <ScrapbookCanvasPage style="torn-strata" view="visitor" ownerName={recipientName} headerProps={{ title: `${recipientName}'s scrapbook`, onBack }} fabPlacement="tr" onAddSelect={onAddSelect} items={items} boopStamps={boopStamps} onBoopSelect={onBoopSelect} scrollTargetId={scrollTargetId} onBoopOpenChange={onBoopOpenChange} />;
}
