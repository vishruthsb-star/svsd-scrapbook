import type { PlacedMemory } from '@/scrapbook/placement';

export type MailboxNotificationType = 'invitation' | 'photo' | 'note' | 'voice' | 'link' | 'joined';

export const STAMP_COLORS: Record<MailboxNotificationType, string> = {
  invitation: '#F7C6D0', photo: '#F2C94C', note: '#FFFFFF', voice: '#8CC7A0', link: '#9EC5E8', joined: '#FAF7F0',
};

export type MailboxTarget =
  | { kind: 'scrapbook-item'; scrapbookOwnerId: string; itemId: string }
  | { kind: 'scrapbook'; scrapbookOwnerId: string }
  | { kind: 'invitation'; invitationId: string; inviterId: string; scrapbookOwnerId: string };

export interface MailboxNotification {
  id: string; type: MailboxNotificationType; senderId: string; senderName: string; recipientBookId: string;
  text: string; createdAt: string; read: boolean; tilt: number; target: MailboxTarget;
}

export const MAILBOX_NOTIFICATIONS: readonly MailboxNotification[] = [
  { id: 'mail-invite-varun', type: 'invitation', senderId: 'varun', senderName: 'varun', recipientBookId: 'varun', text: 'sent you an invite to join his book', createdAt: '2026-10-20T21:14:00Z', read: false, tilt: -2, target: { kind: 'invitation', invitationId: 'invite-varun-book', inviterId: 'varun', scrapbookOwnerId: 'varun' } },
  { id: 'mail-photo-varun', type: 'photo', senderId: 'varun', senderName: 'varun', recipientBookId: 'vishruth', text: 'added a photo to your scrapbook', createdAt: '2026-10-20T21:02:00Z', read: false, tilt: 1.5, target: { kind: 'scrapbook-item', scrapbookOwnerId: 'vishruth', itemId: 'default:vishruth-varun-photo' } },
  { id: 'mail-note-maya', type: 'note', senderId: 'maya', senderName: 'maya', recipientBookId: 'vishruth', text: 'left you a note', createdAt: '2026-10-18T12:00:00Z', read: true, tilt: -1, target: { kind: 'scrapbook-item', scrapbookOwnerId: 'vishruth', itemId: 'default:vishruth-home' } },
  { id: 'mail-voice-jun', type: 'voice', senderId: 'jun', senderName: 'jun', recipientBookId: 'vishruth', text: 'sent you a voice postcard', createdAt: '2026-10-17T12:00:00Z', read: true, tilt: 2.5, target: { kind: 'scrapbook-item', scrapbookOwnerId: 'vishruth', itemId: 'default:vishruth-jun-voice' } },
  { id: 'mail-link-theo', type: 'link', senderId: 'theo', senderName: 'theo', recipientBookId: 'vishruth', text: 'tagged a link for you', createdAt: '2026-10-15T12:00:00Z', read: true, tilt: -2.5, target: { kind: 'scrapbook-item', scrapbookOwnerId: 'vishruth', itemId: 'default:vishruth-recipe' } },
  { id: 'mail-joined-cal', type: 'joined', senderId: 'cal', senderName: 'cal', recipientBookId: 'vishruth', text: 'joined your scrapbook', createdAt: '2026-10-12T12:00:00Z', read: true, tilt: 1, target: { kind: 'scrapbook', scrapbookOwnerId: 'vishruth' } },
];

/** Explicit, stable artifacts for the mailbox prototype; kept separate from the source fixtures. */
export const MAILBOX_PROTOTYPE_ITEMS: readonly PlacedMemory[] = [
  { id: 'mail-varun-photo', scrapbookId: 'library:varun', recipientId: 'varun', authorId: 'varun', createdAt: '2026-10-20T21:02:00Z', seed: 301, kind: 'stamp', text: 'a small thing from today', src: '/scrapbook/photo-beer.jpg', ratio: 1280 / 852 },
  { id: 'mail-maya-note', scrapbookId: 'library:maya', recipientId: 'maya', authorId: 'maya', createdAt: '2026-10-18T12:00:00Z', seed: 302, kind: 'note', text: 'saving this thought here for you.', },
  { id: 'mail-jun-voice', scrapbookId: 'library:jun', recipientId: 'jun', authorId: 'jun', createdAt: '2026-10-17T12:00:00Z', seed: 303, kind: 'voice', durationSec: 42 },
  { id: 'mail-theo-link', scrapbookId: 'library:theo', recipientId: 'theo', authorId: 'theo', createdAt: '2026-10-15T12:00:00Z', seed: 304, kind: 'tag', text: 'a good read for later', url: 'https://example.com' },
];
