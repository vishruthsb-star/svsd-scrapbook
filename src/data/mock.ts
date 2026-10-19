import type { LibraryPerson } from '@/components/Library';

export const OWNER_NAME = 'Vishruth';
export const OWNER_HANDLE = 'vishruth';

export const LIBRARY_PEOPLE: LibraryPerson[] = [
  { name: 'priya', col: 1 },
  { name: 'maya', col: 2, unread: true },
  { name: 'jun', col: 0 },
  { name: 'ana', col: 0 },
  { name: 'sam', col: 1 },
  { name: 'theo', col: 2, unread: true },
];

export const LIBRARY_ACTIVE_INDEX = LIBRARY_PEOPLE.findIndex((p) => p.name === 'priya');
