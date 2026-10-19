import type { CSSProperties, ReactNode } from 'react';
import Note from '@/components/Note';
import ParcelTag from '@/components/ParcelTag';
import Stamp from '@/components/Stamp';
import VoicePostcard from '@/components/VoicePostcard';
import { AddFab } from '@/components/AddFab';
import { Header } from '@/components/Header';
import { HomeBottomNavigation } from '@/components/HomeBottomNavigation';
import { InviteSection } from '@/components/InviteSection';
import { Library } from '@/components/Library';
import { ScrapbookHeader } from '@/components/ScrapbookHeader';
import { ScreenShell } from '@/components/ScreenShell';
import { ThemeNavigation } from '@/components/ThemeNavigation';
import { ScrapbookCanvasPage } from '@/scrapbook/canvas';
import HomeScreen from '@/screens/HomeScreen/HomeScreen';
import { LIBRARY_ACTIVE_INDEX, LIBRARY_PEOPLE, OWNER_HANDLE, OWNER_NAME } from '@/data/mock';
import ScrapbookStylePreview from './ScrapbookStylePreview';

export type GalleryKind = 'screen' | 'component';

export interface GalleryEntry {
  kind: GalleryKind;
  id: string;
  title: string;
  description: string;
  render: () => ReactNode;
}

export const SCREENS: GalleryEntry[] = [
  {
    kind: 'screen',
    id: 'home',
    title: 'Home',
    description: 'Header, Library, and the invite section, stacked as the app’s landing screen.',
    render: () => <HomeScreen />,
  },
];

export const COMPONENTS: GalleryEntry[] = [
  {
    kind: 'component',
    id: 'header',
    title: 'Header',
    description: 'The "welcome to / {name}\'s Library" title row with the send button.',
    render: () => <Header ownerName={OWNER_NAME} />,
  },
  {
    kind: 'component',
    id: 'library',
    title: 'Library',
    description: 'The card-catalog drawer of friends\' scrapbooks.',
    render: () => <Library people={LIBRARY_PEOPLE} defaultSelected={LIBRARY_ACTIVE_INDEX} />,
  },
  {
    kind: 'component',
    id: 'screen-shell',
    title: 'ScreenShell',
    description: 'The reusable top/bottom safe-area bands and frame-width centering every screen wraps itself in.',
    render: () => (
      <div style={{ height: 420, width: 260, ['--screen-height' as string]: '420px' } as CSSProperties}>
        <ScreenShell>
          {Array.from({ length: 14 }, (_, i) => (
            <p key={i} style={{ margin: '0 0 16px', fontFamily: 'var(--font-condensed)' }}>
              scroll line {i + 1}
            </p>
          ))}
        </ScreenShell>
      </div>
    ),
  },
  {
    kind: 'component',
    id: 'invite-section',
    title: 'InviteSection',
    description: 'The flower doodle, invite copy, link row, and "invite a friend" button.',
    render: () => <InviteSection handle={OWNER_HANDLE} />,
  },
  {
    kind: 'component',
    id: 'stamp',
    title: 'Stamp',
    description: 'A photo/video scrap item with a flip-to-back face.',
    render: () => (
      <Stamp
        id="gallery-stamp"
        media={{ kind: 'empty', ratio: 4 / 3, label: 'photo' }}
        caption="the view from here"
        owner="Vishruth"
        from="priya"
        date="Oct 12"
        viewer="owner"
        seed={7}
      />
    ),
  },
  {
    kind: 'component',
    id: 'note',
    title: 'Note',
    description: 'A handwritten text scrap item.',
    render: () => (
      <Note id="gallery-note" text="wish you were here" owner="Vishruth" senderName="maya" date="Oct 9" viewer="owner" seed={3} />
    ),
  },
  {
    kind: 'component',
    id: 'voice-postcard',
    title: 'VoicePostcard',
    description: 'A waveform scrap item wired to a real <audio> element.',
    render: () => (
      <VoicePostcard id="gallery-voice" durationSec={42} owner="Vishruth" senderName="jun" date="Oct 4" viewer="owner" seed={11} />
    ),
  },
  {
    kind: 'component',
    id: 'tag',
    title: 'Tag',
    description: 'ParcelTag — a link scrap item with a preview slot.',
    render: () => (
      <ParcelTag
        id="gallery-tag"
        url="https://example.com/article"
        linkLabel="a good read"
        preview={{ kind: 'empty', ratio: 1.6, label: 'link' }}
        owner="Vishruth"
        senderName="ana"
        date="Sep 30"
        viewer="owner"
        seed={21}
      />
    ),
  },
  {
    kind: 'component',
    id: 'scrapbook-header',
    title: 'ScrapbookHeader',
    description: 'The back-arrow / title / avatar pill ported from references/scrapbook-header.html.',
    render: () => <ScrapbookHeader />,
  },
  {
    kind: 'component',
    id: 'home-bottom-navigation',
    title: 'HomeBottomNavigation',
    description: 'The sliding home/journal tab bar ported from references/home-bottom-navigation.html.',
    render: () => <HomeBottomNavigation />,
  },
  {
    kind: 'component',
    id: 'theme-navigation',
    title: 'ThemeNavigation',
    description: 'The text-hugging theme tab bar ported from references/theme-navigation.html.',
    render: () => <ThemeNavigation />,
  },
  {
    kind: 'component',
    id: 'add-fab',
    title: 'AddFab',
    description:
      'The four-circle fan "add" button ported from references/Scrapbook Add Button.html. Dev-only preview — assumes a 390x844 host (see addFabEngine.ts).',
    render: () => (
      <div style={{ position: 'relative', width: 390, height: 844, background: '#f4f4f3', borderRadius: 48, overflow: 'hidden' }}>
        <AddFab placement="br" />
      </div>
    ),
  },
  {
    kind: 'component',
    id: 'scrapbook-canvas-page-torn-strata-visitor',
    title: 'ScrapbookCanvasPage — torn strata (visitor)',
    description:
      'Frame 1a ported into the shared canvas-page shell — torn-paper month strips, bottom-center add button, view="visitor".',
    render: () => <ScrapbookCanvasPage style="torn-strata" view="visitor" />,
  },
  {
    kind: 'component',
    id: 'scrapbook-canvas-page-torn-strata-own',
    title: 'ScrapbookCanvasPage — torn strata (own)',
    description: 'Same frame with view="own" — confirms the add button does not render at all in your own scrapbook.',
    render: () => <ScrapbookCanvasPage style="torn-strata" view="own" />,
  },
  {
    kind: 'component',
    id: 'scrapbook-canvas-page-theme-spreads-visitor',
    title: 'ScrapbookCanvasPage — theme spreads (visitor)',
    description: 'Frame 1g — four swipeable theme panels driven by the repo ThemeNavigation, top-right add button, view="visitor".',
    render: () => <ScrapbookCanvasPage style="theme-spreads" view="visitor" />,
  },
  {
    kind: 'component',
    id: 'scrapbook-canvas-page-theme-spreads-own',
    title: 'ScrapbookCanvasPage — theme spreads (own)',
    description: 'Same frame with view="own" — confirms the add button does not render at all in your own scrapbook.',
    render: () => <ScrapbookCanvasPage style="theme-spreads" view="own" />,
  },
  {
    kind: 'component',
    id: 'scrapbook-canvas-page-envelopes-lip-visitor',
    title: 'ScrapbookCanvasPage — envelopes lip (visitor)',
    description:
      'Frame 1f-4 "pocket lip" — tap an envelope to spill its items into a fan, top-right add button stays visible while open, view="visitor".',
    render: () => <ScrapbookCanvasPage style="envelopes-lip" view="visitor" />,
  },
  {
    kind: 'component',
    id: 'scrapbook-canvas-page-envelopes-lip-own',
    title: 'ScrapbookCanvasPage — envelopes lip (own)',
    description: 'Same frame with view="own" — confirms the add button does not render, but "Put them back" still does once an envelope is open.',
    render: () => <ScrapbookCanvasPage style="envelopes-lip" view="own" />,
  },
  {
    kind: 'component',
    id: 'scrapbook-canvas-page-paper-wheel-visitor',
    title: 'ScrapbookCanvasPage — paper wheel (visitor)',
    description: 'Frame 1e-paper — drag or tap a month on the torn-paper disc to cross-fade its items, top-right add button, view="visitor".',
    render: () => <ScrapbookCanvasPage style="paper-wheel" view="visitor" />,
  },
  {
    kind: 'component',
    id: 'scrapbook-canvas-page-paper-wheel-own',
    title: 'ScrapbookCanvasPage — paper wheel (own)',
    description: 'Same frame with view="own" — confirms the add button does not render at all in your own scrapbook.',
    render: () => <ScrapbookCanvasPage style="paper-wheel" view="own" />,
  },
  {
    kind: 'component',
    id: 'scrapbook-style-preview',
    title: 'Scrapbook style preview (dev-only)',
    description: 'Verification harness — pick any of the four canvas styles and flip the viewer, at a fixed 390x844 frame.',
    render: () => <ScrapbookStylePreview />,
  },
  // Future components get a single new entry here — nothing else to wire up.
];

export const REGISTRY: GalleryEntry[] = [...SCREENS, ...COMPONENTS];
