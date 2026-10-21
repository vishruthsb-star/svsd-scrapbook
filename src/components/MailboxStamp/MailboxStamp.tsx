import type { MailboxNotificationType } from '@/data/mailboxNotifications';
import './MailboxStamp.css';

const ICONS: Record<MailboxNotificationType, string> = {
  invitation: 'M3.5 6.5h17v11h-17z M3.5 6.5l8.5 6.5 8.5-6.5',
  photo: 'M3.5 5.5h17v13h-17z M3.5 15.5l5-5 4 4 3-3 5 5 M17 9a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0',
  note: 'M4 5h16v14H4z M7.5 9h9 M7.5 12h9 M7.5 15h5', voice: 'M4 11v2 M7 9v6 M10 5v14 M13 8v8 M16 10v4 M19 11v2',
  link: 'M7 3.5h10l2.5 3v14h-15v-14z M13.5 8a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0 M8.5 15.5h7',
  joined: 'M16 8a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M4.5 20.5c1-4 4-6 7.5-6s6.5 2 7.5 6',
};
export default function MailboxStamp({ type, fill, tilt, unread }: { type: MailboxNotificationType; fill: string; tilt: number; unread: boolean }) {
  return <span className="mailbox-stamp" style={{ transform: `rotate(${tilt}deg)` }} aria-hidden="true"><svg width="60" height="68" viewBox="0 0 60 68" fill="none"><g filter="url(#mb-ink)"><rect x="2" y="2" width="56" height="64" fill="#FAF7F0" stroke="#111111" strokeWidth="4" strokeDasharray="1.5 4.5" strokeLinecap="round"/><rect x="8" y="8" width="44" height="52" fill={fill} stroke="#111111" strokeWidth="1.75" strokeLinejoin="round"/></g><g transform="translate(18 22)" stroke="#111111" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" filter="url(#mb-fine)">{type === 'photo' && <rect x="-2" y="-2" width="28" height="28" fill="#FAF7F0" stroke="none"/>}<path d={ICONS[type]}/></g></svg>{unread && <span className="mailbox-stamp-dot"/>}</span>;
}
