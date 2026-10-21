import type { BoopStampKey } from '@/components/BoopFab';
export type { BoopStampKey } from '@/components/BoopFab';
export interface PlacedBoopStamp { id: string; stampKey: BoopStampKey; scrapbookId: string; recipientName: string; x: number; y: number; width: number; rotation: number; createdAt: string; }
const STORAGE_KEY = 'scrapbook-boop-stamps-v1';
export function loadBoopStamps(): PlacedBoopStamp[] { try { const value: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'); return Array.isArray(value) ? value.filter((v): v is PlacedBoopStamp => !!v && typeof v === 'object' && typeof (v as PlacedBoopStamp).id === 'string' && typeof (v as PlacedBoopStamp).stampKey === 'string' && typeof (v as PlacedBoopStamp).scrapbookId === 'string') : []; } catch { return []; } }
export function saveBoopStamps(stamps: PlacedBoopStamp[]) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(stamps)); } catch { /* storage is optional */ } }
