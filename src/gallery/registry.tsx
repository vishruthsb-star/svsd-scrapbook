import type { ReactNode } from 'react';
import Note from '@/components/Note';
import ParcelTag from '@/components/ParcelTag';
import Stamp from '@/components/Stamp';
import VoicePostcard from '@/components/VoicePostcard';
import { Header } from '@/components/Header';
import { InviteSection } from '@/components/InviteSection';
import { Library } from '@/components/Library';
import HomeScreen from '@/screens/HomeScreen/HomeScreen';
import { LIBRARY_ACTIVE_INDEX, LIBRARY_PEOPLE, OWNER_HANDLE, OWNER_NAME } from '@/data/mock';

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
  // Future components get a single new entry here — nothing else to wire up.
];

export const REGISTRY: GalleryEntry[] = [...SCREENS, ...COMPONENTS];
