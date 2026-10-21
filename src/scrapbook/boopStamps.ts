import type { BoopStampKey } from '@/components/BoopFab';
export type { BoopStampKey } from '@/components/BoopFab';

/** A BOOP belongs to a book but is authored by a contributor. Keep those identities separate. */
export interface PlacedBoopStamp {
  id: string; stampKey: BoopStampKey; recipientBookId: string; senderId: string; stampDesignId: BoopStampKey;
  x: number; y: number; width: number; rotation: number; createdAt: string;
}
const STORAGE_KEY = 'scrapbook-boop-stamps-v1';
const STORAGE_VERSION_KEY = 'scrapbook-boop-stamps-version';
const STORAGE_VERSION = 2;
type LegacyBoop = Partial<PlacedBoopStamp> & { scrapbookId?: string; recipientName?: string };
function isRecord(value: unknown): value is LegacyBoop { return !!value && typeof value === 'object' && typeof (value as LegacyBoop).id === 'string' && typeof (value as LegacyBoop).stampKey === 'string'; }
function recipientIdFor(record: LegacyBoop): string | undefined { const id = record.recipientBookId ?? record.scrapbookId; return typeof id === 'string' && id.startsWith('library:') ? id.slice('library:'.length) : undefined; }
function migrate(record: LegacyBoop): PlacedBoopStamp | null {
  const recipientId = recipientIdFor(record); const recipientBookId = record.recipientBookId ?? record.scrapbookId; const stampDesignId = record.stampDesignId ?? record.stampKey;
  if (!recipientId || !recipientBookId || !stampDesignId || typeof record.createdAt !== 'string') return null;
  // v1 did not record sender identity. Only a non-self book can safely be recovered as the prototype account.
  const senderId = record.senderId ?? (recipientId === 'vishruth' ? undefined : 'vishruth');
  if (!senderId || senderId === recipientId) return null;
  return { id: record.id!, stampKey: stampDesignId, stampDesignId, recipientBookId, senderId, x: Number(record.x) || 0, y: Number(record.y) || 0, width: Number(record.width) || 136, rotation: Number(record.rotation) || 0, createdAt: record.createdAt };
}
export function loadBoopStamps(): PlacedBoopStamp[] { try { const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'); if (!Array.isArray(parsed)) return []; const stamps = parsed.filter(isRecord).map(migrate).filter((stamp): stamp is PlacedBoopStamp => stamp !== null); if (Number(localStorage.getItem(STORAGE_VERSION_KEY)) < STORAGE_VERSION) { localStorage.setItem(STORAGE_KEY, JSON.stringify(stamps)); localStorage.setItem(STORAGE_VERSION_KEY, String(STORAGE_VERSION)); } return stamps; } catch { return []; } }
export function saveBoopStamps(stamps: readonly PlacedBoopStamp[]) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(stamps)); localStorage.setItem(STORAGE_VERSION_KEY, String(STORAGE_VERSION)); } catch { /* storage is optional */ } }
export function clearBoopStamps() { try { localStorage.removeItem(STORAGE_KEY); localStorage.removeItem(STORAGE_VERSION_KEY); } catch { /* storage is optional */ } }
