import { useId, useRef } from 'react';
import type { CSSProperties } from 'react';
import { ScreenShell } from '@/components/ScreenShell';
import { SCRAPBOOK_PRESENTATIONS } from '@/data/scrapbookProfile';
import type { ScrapbookContributor, ScrapbookPresentation } from '@/types';
import type { ScrapbookPermissions } from '@/scrapbook/permissions';
import './ScrapbookProfileScreen.css';

export interface ScrapbookProfileScreenProps {
  ownerName?: string;
  presentation: ScrapbookPresentation;
  contributors: readonly ScrapbookContributor[];
  coverImage?: string;
  onBack: () => void;
  onPresentationChange: (presentation: ScrapbookPresentation) => void;
  onContributorRemove: (id: string) => void;
  onInvite: () => void;
  onCoverFileChange: (file: File) => void;
  permissions: ScrapbookPermissions;
}

const TAG_PATH = 'M1 2C35 0 70 3 99 1 L100 50 L98 99 C65 100 30 98 2 99 L0 50Z';

function InkDefs({ hatchId, inkId, fineId }: { hatchId: string; inkId: string; fineId: string }) {
  return <svg className="scrapbook-profile-defs" aria-hidden="true"><defs>
    <pattern id={hatchId} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="5" stroke="#111111" strokeWidth="1" /></pattern>
    <filter id={inkId} x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="1" seed="7" result="noise" /><feDisplacementMap in="SourceGraphic" in2="noise" scale="0.7" xChannelSelector="R" yChannelSelector="G" /></filter>
    <filter id={fineId} x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="1" seed="11" result="noise" /><feDisplacementMap in="SourceGraphic" in2="noise" scale="0.35" xChannelSelector="R" yChannelSelector="G" /></filter>
  </defs></svg>;
}

export default function ScrapbookProfileScreen({ ownerName = 'vishruth', presentation, contributors, coverImage, onBack, onPresentationChange, onContributorRemove, onInvite, onCoverFileChange, permissions }: ScrapbookProfileScreenProps) {
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, '');
  const hatchId = `profile-hatch-${rawId}`;
  const inkId = `profile-ink-${rawId}`;
  const fineId = `profile-fine-${rawId}`;
  const inputRef = useRef<HTMLInputElement>(null);
  const title = `${ownerName.toLowerCase()}’s scrapbook`;

  return <ScreenShell maskBottom={false} className="scrapbook-profile-shell">
    <InkDefs hatchId={hatchId} inkId={inkId} fineId={fineId} />
    <main className={`scrapbook-profile scrapbook-profile--${permissions.isOwner ? 'owner' : 'viewer'}`} aria-label={`${ownerName}'s scrapbook profile`}>
      <button type="button" className="scrapbook-profile-back" onClick={onBack}>
        <span className="scrapbook-profile-back-icon" aria-hidden="true"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#111111" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><g filter={`url(#${fineId})`}><path d="M15 4.5L7.5 12l7.5 7.5" /></g></svg></span>
        <span>back</span>
      </button>

      <div className="scrapbook-profile-cover-wrap">
        <div className="scrapbook-profile-cover">
          <svg width="240" height="240" viewBox="0 0 240 240" fill="none" aria-hidden="true"><g filter={`url(#${inkId})`}><rect x="2" y="2" width="236" height="236" fill={coverImage ? 'none' : '#FAF7F0'} stroke="#111111" strokeWidth="2" /><rect x="16" y="16" width="208" height="208" fill={coverImage ? 'none' : `url(#${hatchId})`} stroke="#111111" strokeWidth="1.75" /></g></svg>
          {coverImage && <img className="scrapbook-profile-cover-image" src={coverImage} alt="Selected scrapbook cover" />}
          <div className="scrapbook-profile-tape" aria-hidden="true"><svg width="90" height="28"><rect width="90" height="28" fill="#FAF7F0" /><rect width="90" height="28" fill={`url(#${hatchId})`} /></svg></div>
          {permissions.canEditProfile && <><button type="button" className="scrapbook-profile-edit" aria-label="Choose a scrapbook cover image" onClick={() => inputRef.current?.click()}><svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden="true"><g filter={`url(#${inkId})`}><path d="M3 4C20 2 40 4 53 3 L54 28 L52 53 C35 54 20 52 4 53 L2 28Z" stroke="#111111" strokeWidth="2" /></g></svg><svg className="scrapbook-profile-pencil" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111111" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><g filter={`url(#${fineId})`}><path d="M4 20l4-1 11-11-3-3L5 16z M14 6l3 3" /></g></svg></button><input ref={inputRef} className="sr-only" type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) onCoverFileChange(file); event.target.value = ''; }} /></>}
        </div>
      </div>

      <h1>{title}</h1>
      {permissions.canChangePresentation && <section className="scrapbook-profile-section" aria-labelledby="shown-as"><h2 id="shown-as">shown as</h2><div className="scrapbook-profile-options">{SCRAPBOOK_PRESENTATIONS.map((option) => <button key={option} type="button" className="scrapbook-profile-option" aria-pressed={presentation === option} onClick={() => onPresentationChange(option)}><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><g filter={`url(#${inkId})`}><path d={TAG_PATH} fill={presentation === option ? `url(#${hatchId})` : '#FAF7F0'} stroke="#111111" strokeWidth="2" vectorEffect="non-scaling-stroke" /></g></svg><span>{option}</span></button>)}</div></section>}

      <section className="scrapbook-profile-section scrapbook-profile-permissions" aria-labelledby="writers"><h2 id="writers">who can write here</h2><div className="scrapbook-profile-people">{contributors.map((person) => <div className="scrapbook-profile-person" key={person.id} style={{ '--profile-rotation': `${person.rotation}deg` } as CSSProperties}><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><g filter={`url(#${inkId})`}><path d={TAG_PATH} fill={person.fill} stroke="#111111" strokeWidth="2" vectorEffect="non-scaling-stroke" /></g></svg><span className="scrapbook-profile-person-name">{person.name}</span>{permissions.isOwner && <span className="scrapbook-profile-person-role">{person.permission}</span>}{permissions.canManageContributors && person.permission !== 'owner' && <button type="button" className="scrapbook-profile-remove" aria-label={`Remove ${person.name}`} onClick={() => onContributorRemove(person.id)}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111111" strokeWidth="1.75" strokeLinecap="round"><g filter={`url(#${fineId})`}><path d="M6 6l12 12 M18 6L6 18" /></g></svg></button>}</div>)}{permissions.canInviteContributors && <button type="button" className="scrapbook-profile-invite" onClick={onInvite}><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><g filter={`url(#${inkId})`}><path d={TAG_PATH} fill="none" stroke="#111111" strokeWidth="2" strokeDasharray="6 6" vectorEffect="non-scaling-stroke" /></g></svg><span>+ invite someone</span></button>}</div></section>
    </main>
  </ScreenShell>;
}
