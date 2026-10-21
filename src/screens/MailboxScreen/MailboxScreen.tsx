import { ScreenShell } from '@/components/ScreenShell';
import MailboxStamp from '@/components/MailboxStamp/MailboxStamp';
import { MAILBOX_NOTIFICATIONS, STAMP_COLORS, type MailboxNotification } from '@/data/mailboxNotifications';
import houseIllustration from '../../../references/house.svg';
import './MailboxScreen.css';
export interface MailboxScreenProps { onBack: () => void; onOpenNotification: (notification: MailboxNotification) => void; }
export default function MailboxScreen({ onBack, onOpenNotification }: MailboxScreenProps) {
  return <ScreenShell className="mailbox-shell" maskBottom={false}><main className="mailbox-root"><svg className="mailbox-defs" aria-hidden="true"><defs><filter id="mb-ink" filterUnits="userSpaceOnUse" x="-300" y="-300" width="2400" height="2400"><feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="5"/><feDisplacementMap in="SourceGraphic" scale="2.4"/></filter><filter id="mb-fine" filterUnits="userSpaceOnUse" x="-300" y="-300" width="2400" height="2400"><feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="2" seed="5"/><feDisplacementMap in="SourceGraphic" scale="1.1"/></filter></defs></svg><header className="mailbox-header"><button type="button" className="mailbox-back" aria-label="Back to home" onClick={onBack}><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#111111" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><g filter="url(#mb-fine)"><path d="M15 4.5L7.5 12l7.5 7.5"/></g></svg></button><span>your mailbox</span></header><div className="mailbox-illustration"><img src={houseIllustration} width="140" alt=""/></div><section className="mailbox-list" aria-label="Mailbox notifications">{MAILBOX_NOTIFICATIONS.map((notification) => {
    const content = <><MailboxStamp type={notification.type} fill={STAMP_COLORS[notification.type]} tilt={notification.tilt} unread={!notification.read}/><span className="mailbox-copy"><span className="mailbox-sender">{notification.senderName}</span><span className="mailbox-text">{notification.text}</span></span></>;
    return notification.type === 'invitation'
      ? <div key={notification.id} className="mailbox-row mailbox-row--static">{content}</div>
      : <button key={notification.id} type="button" className="mailbox-row" aria-label={`${notification.senderName} ${notification.text}`} onClick={() => onOpenNotification(notification)}>{content}</button>;
  })}</section></main></ScreenShell>;
}
