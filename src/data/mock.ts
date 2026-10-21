import type { LibraryPerson } from '@/components/Library';
import type { CanvasStyle } from '@/scrapbook/canvas';

export const OWNER_NAME = 'Vishruth';
export const OWNER_HANDLE = 'vishruth';
export const SCRAPBOOK_COVERS: Record<string, string> = {
  vishruth: '/album-covers/vishruth.jpg',
  priya: '/album-covers/priya.jpg',
  maya: '/album-covers/maya.jpg',
  jun: '/album-covers/jun.jpg',
  ana: '/album-covers/ana.jpg',
  sam: '/album-covers/sam.jpg',
  theo: '/album-covers/theo.jpg',
};

/**
 * Which scrapbook canvas style (torn-strata / theme-spreads / envelopes-lip / paper-wheel)
 * the owner's page currently uses. No real "scrapbook page" screen exists yet (only
 * HomeScreen), so this is the minimal model for that choice — swap for a persisted/
 * real value later without touching the components that read it.
 */
export const DEFAULT_SCRAPBOOK_STYLE: CanvasStyle = 'torn-strata';

export const LIBRARY_PEOPLE: LibraryPerson[] = [
  { name: 'priya', col: 1, coverImage: SCRAPBOOK_COVERS.priya },
  { name: 'maya', col: 2, unread: true, coverImage: SCRAPBOOK_COVERS.maya },
  { name: 'jun', col: 0, coverImage: SCRAPBOOK_COVERS.jun },
  { name: 'ana', col: 0, coverImage: SCRAPBOOK_COVERS.ana },
  { name: 'sam', col: 1, coverImage: SCRAPBOOK_COVERS.sam },
  { name: 'theo', col: 2, unread: true, coverImage: SCRAPBOOK_COVERS.theo },
];

export const LIBRARY_ACTIVE_INDEX = LIBRARY_PEOPLE.findIndex((p) => p.name === 'priya');
