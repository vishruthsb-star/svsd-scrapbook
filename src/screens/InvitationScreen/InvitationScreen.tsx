import { ScreenShell } from '@/components/ScreenShell';
import './InvitationScreen.css';

export default function InvitationScreen({ inviterName, onBack }: { inviterName: string; onBack: () => void }) {
  return <ScreenShell maskBottom={false}><main className="invitation-root"><button className="invitation-back" type="button" onClick={onBack}>← back to mailbox</button><p className="invitation-kicker">INVITATION</p><h1>{inviterName} invited you to join their scrapbook.</h1><p>This prototype records the invitation without accepting it.</p></main></ScreenShell>;
}
