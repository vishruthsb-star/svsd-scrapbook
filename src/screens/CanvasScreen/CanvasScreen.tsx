import { memo } from 'react';
import { ScrapbookCanvasPage } from '@/scrapbook/canvas';
import type { CanvasStyle } from '@/scrapbook/canvas';
import type { AddFabKind } from '@/components/AddFab';
import type { PlacedMemory } from '@/scrapbook/placement';
import type { PlacedBoopStamp, BoopStampKey } from '@/scrapbook/boopStamps';
import type { ScrapbookPermissions } from '@/scrapbook/permissions';

/**
 * Default scrapbook design for the Book tab: torn strata. Theme spreads (and the other two
 * styles) stay in the repo unchanged — only this selection changed. `fabPlacement`
 * overrides torn-strata's registry default (bottom-center) to top-right, since
 * top-right clears the canvas header in the direct HomeScreenV2 flow.
 */
export interface CanvasScreenProps { recipientName: string; boopSenderName: string; coverImage?: string; style: CanvasStyle; permissions: ScrapbookPermissions; onBack?: () => void; onProfileOpen?: () => void; onAddSelect: (kind: AddFabKind) => void; items?: PlacedMemory[]; boopStamps?: PlacedBoopStamp[]; onBoopSelect: (key: BoopStampKey, position: { x: number; y: number }) => void; onRemoveItem?: (id: string) => void; scrollTargetId?: string | null; onScrollTargetHandled?: (id: string) => void; onBoopOpenChange?: (open: boolean) => void; }
const CanvasScreen = memo(function CanvasScreen({ recipientName, boopSenderName, coverImage, style, permissions, onBack, onProfileOpen, onAddSelect, items, boopStamps, onBoopSelect, onRemoveItem, scrollTargetId, onScrollTargetHandled, onBoopOpenChange }: CanvasScreenProps) {
  const view = permissions.isOwner ? 'own' : 'visitor';
  return <ScrapbookCanvasPage style={style} view={view} ownerName={recipientName} boopSenderName={boopSenderName} headerProps={{ title: `${recipientName}'s scrapbook`, coverSrc: coverImage, onBack, onProfileOpen }} fabPlacement={style === 'torn-strata' ? 'tr' : undefined} onAddSelect={permissions.canAddMemories ? onAddSelect : undefined} items={items} boopStamps={boopStamps} onBoopSelect={permissions.canBoop ? onBoopSelect : undefined} onRemoveItem={permissions.canRemoveItems ? onRemoveItem : undefined} scrollTargetId={scrollTargetId} onScrollTargetHandled={onScrollTargetHandled} onBoopOpenChange={onBoopOpenChange} />;
});

export default CanvasScreen;
