import type { LibraryPerson } from '@/components/Library';
import type { CanvasStyle } from '@/scrapbook/canvas';

export const OWNER_NAME = 'Vishruth';
export const OWNER_HANDLE = 'vishruth';

/**
 * Which scrapbook canvas style (torn-strata / theme-spreads / envelopes-lip / paper-wheel)
 * the owner's page currently uses. No real "scrapbook page" screen exists yet (only
 * HomeScreen), so this is the minimal model for that choice — swap for a persisted/
 * real value later without touching the components that read it.
 */
export const DEFAULT_SCRAPBOOK_STYLE: CanvasStyle = 'torn-strata';

export const LIBRARY_PEOPLE: LibraryPerson[] = [
  { name: 'priya', col: 1 },
  { name: 'maya', col: 2, unread: true },
  { name: 'jun', col: 0 },
  { name: 'ana', col: 0 },
  { name: 'sam', col: 1 },
  { name: 'theo', col: 2, unread: true },
];

export const LIBRARY_ACTIVE_INDEX = LIBRARY_PEOPLE.findIndex((p) => p.name === 'priya');
