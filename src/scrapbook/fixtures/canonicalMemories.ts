import type { CanvasStyle } from '@/scrapbook/canvas';
import type { PlacedBoopStamp } from '@/scrapbook/boopStamps';
import type { PlacedMemory } from '@/scrapbook/placement';

/**
 * The shipped scrapbook collection. These records deliberately live outside browser
 * storage: a clean browser always gets the same authored books, while IndexedDB only
 * contains additions made during a session. Coordinates are derived by each canvas's
 * deterministic native layout adapter from these stable ids, dates, and grouping hints.
 */
const stamp = (id: string, recipientId: string, createdAt: string, authorId: string, text: string, src: string, ratio = .75, theme?: PlacedMemory['theme']): PlacedMemory => ({
  id: `default:${id}`, scrapbookId: `library:${recipientId}`, recipientId, authorId, createdAt, seed: id.split('').reduce((n, char) => ((n * 33) ^ char.charCodeAt(0)) | 0, 5381), kind: 'stamp', text, src, ratio, theme,
});
const note = (id: string, recipientId: string, createdAt: string, authorId: string, text: string, theme?: PlacedMemory['theme']): PlacedMemory => ({
  id: `default:${id}`, scrapbookId: `library:${recipientId}`, recipientId, authorId, createdAt, seed: id.split('').reduce((n, char) => ((n * 33) ^ char.charCodeAt(0)) | 0, 5381), kind: 'note', text, theme,
});
const tag = (id: string, recipientId: string, createdAt: string, authorId: string, text: string, url: string, theme?: PlacedMemory['theme']): PlacedMemory => ({
  id: `default:${id}`, scrapbookId: `library:${recipientId}`, recipientId, authorId, createdAt, seed: id.split('').reduce((n, char) => ((n * 33) ^ char.charCodeAt(0)) | 0, 5381), kind: 'tag', text, url, theme,
});

export const DEFAULT_PRESENTATION_BY_PERSON: Record<string, CanvasStyle> = {
  vishruth: 'torn-strata',
  priya: 'paper-wheel',
  maya: 'envelopes-lip',
  jun: 'theme-spreads',
  ana: 'torn-strata',
  sam: 'paper-wheel',
  theo: 'envelopes-lip',
};

const SEED_CANONICAL_MEMORIES: readonly PlacedMemory[] = [
  // Priya: the sentimental traveler — dense, chronological Torn Strata.
  stamp('priya-lake', 'priya', '2026-09-28T12:00:00.000Z', 'maya', 'we missed the turn, found this instead.', '/scrapbook/memories/lake-sunset.jpeg', 1.33),
  stamp('priya-fort', 'priya', '2026-09-12T12:00:00.000Z', 'jun', 'your “quick detour” was three flights of stairs.', '/scrapbook/memories/fort.jpeg', .72),
  note('priya-train', 'priya', '2026-08-22T12:00:00.000Z', 'theo', 'still laughing that you packed snacks for a two-hour train ride like we were crossing a continent.'),
  tag('priya-map', 'priya', '2026-08-04T12:00:00.000Z', 'maya', 'the route we absolutely did not follow', 'https://www.openstreetmap.org/'),
  stamp('priya-moon', 'priya', '2026-07-19T12:00:00.000Z', 'sam', 'the sea had better lighting than all of us.', '/scrapbook/memories/moon-sea.jpeg', .75),

  // Maya: fast, social, and song-led — semantic Theme Spreads.
  stamp('maya-roof', 'maya', '2026-10-10T12:00:00.000Z', 'varun', 'the group photo after everyone said “one last one.”', '/scrapbook/memories/roof-friends.jpeg', .75, 'laughing'),
  note('maya-2am', 'maya', '2026-09-30T12:00:00.000Z', 'priya', 'you sent “i’m heading home” at 1:48 and then somehow appeared in a different neighbourhood.', 'late-nights'),
  stamp('maya-coconut', 'maya', '2026-09-02T12:00:00.000Z', 'ana', 'wish u were here, obviously.', '/scrapbook/memories/coconut.jpeg', .75, 'trips'),
  tag('maya-song', 'maya', '2026-08-17T12:00:00.000Z', 'sam', 'this is the exact bus-window song', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'songs'),
  note('maya-ep', 'maya', '2026-07-11T12:00:00.000Z', 'jun', 'happy EP day to the only person who can turn a voice note into a full production meeting.', 'songs'),

  // Jun: a quiet visual-maker's envelope collection.
  stamp('jun-ibis', 'jun', '2026-10-03T12:00:00.000Z', 'ana', 'saw this patient little bird and thought: jun would wait for the good light too.', '/scrapbook/memories/ibis.jpeg', 1.5),
  note('jun-coffee', 'jun', '2026-09-09T12:00:00.000Z', 'maya', 'walked past that tiny bakery again today. still think you’d love it.'),
  stamp('jun-ink', 'jun', '2026-08-16T12:00:00.000Z', 'priya', 'proof that you cannot leave a surface un-inked.', '/scrapbook/memories/ink-hand.jpeg', .75),
  tag('jun-reading', 'jun', '2026-07-24T12:00:00.000Z', 'theo', 'saving this for your next “one chapter” evening', 'https://www.poetryfoundation.org/'),
  stamp('jun-grid', 'jun', '2026-06-18T12:00:00.000Z', 'sam', 'this took an unreasonable amount of patience. naturally, you nailed it.', '/scrapbook/memories/portrait-grid.jpeg', .75),

  // Ana: months on a Paper Wheel, focused on art, water, and faraway places.
  stamp('ana-louvre', 'ana', '2026-10-14T12:00:00.000Z', 'maya', 'you made the pyramid look like it was waiting for you.', '/scrapbook/memories/louvre-pyramid.jpeg', .75),
  stamp('ana-eiffel', 'ana', '2026-09-08T12:00:00.000Z', 'priya', 'yes, we stayed until it sparkled. no, nobody regrets it.', '/scrapbook/memories/eiffel.jpeg', .75),
  note('ana-august', 'ana', '2026-08-21T12:00:00.000Z', 'jun', 'you were right about that song. i finally get it.'),
  stamp('ana-bali', 'ana', '2026-07-05T12:00:00.000Z', 'sam', 'all the best for bali — you made leaving look extremely tempting.', '/scrapbook/memories/bali-illustration.jpeg', 1.33),
  tag('ana-museum', 'ana', '2026-06-12T12:00:00.000Z', 'theo', 'for the next museum day when we pretend we have a plan', 'https://www.louvre.fr/en'),

  // Sam: chaotic, affectionate, mostly outdoors.
  stamp('sam-tree', 'sam', '2026-10-01T12:00:00.000Z', 'varun', 'the tree was the only one taking this seriously.', '/scrapbook/memories/tree-friends.jpeg', .75),
  stamp('sam-beach', 'sam', '2026-09-14T12:00:00.000Z', 'theo', 'two hours of sunburn for this extremely good evidence.', '/scrapbook/memories/beach-selfie.jpeg', .75),
  note('sam-headphones', 'sam', '2026-08-06T12:00:00.000Z', 'maya', 'you left your headphones, then denied they were yours while wearing the exact same pair.'),
  stamp('sam-dye', 'sam', '2026-07-02T12:00:00.000Z', 'jun', 'your hands after “just helping for five minutes.”', '/scrapbook/memories/dye-bath.jpeg', .75),
  tag('sam-park', 'sam', '2026-06-09T12:00:00.000Z', 'priya', 'a walking route for the next accidental all-day outing', 'https://www.alltrails.com/'),

  // Theo: observant and a little dramatic, with roomy themed pages.
  stamp('theo-blue', 'theo', '2026-10-06T12:00:00.000Z', 'ana', 'you really did walk straight into the coldest water first.', '/scrapbook/memories/blue-beach.jpeg', .75, 'trips'),
  note('theo-laugh', 'theo', '2026-09-03T12:00:00.000Z', 'sam', 'this is still the funniest photo of you, and somehow you were not even in it.', 'laughing'),
  stamp('theo-ep', 'theo', '2026-08-12T12:00:00.000Z', 'maya', 'the tiny dog looks exactly as surprised as you were.', '/scrapbook/memories/ep-illustration.jpeg', .75, 'laughing'),
  tag('theo-playlist', 'theo', '2026-07-20T12:00:00.000Z', 'jun', 'put this on after midnight, no skipping', 'https://open.spotify.com/', 'songs'),
  note('theo-night', 'theo', '2026-06-28T12:00:00.000Z', 'priya', 'saw a streetlamp doing that weird halo thing and immediately thought of our 2am walks.', 'late-nights'),

  // Vishruth: the book friends have been adding to for years.
  stamp('vishruth-lake', 'vishruth', '2026-10-12T12:00:00.000Z', 'priya', 'you would have stopped here for forty photos. we stopped for forty photos.', '/scrapbook/memories/lake-sunset.jpeg', 1.33),
  note('vishruth-home', 'vishruth', '2026-09-16T12:00:00.000Z', 'maya', 'i heard someone laugh exactly like you on the train and it made my whole morning.'),
  stamp('vishruth-fort', 'vishruth', '2026-08-08T12:00:00.000Z', 'jun', 'for your folder called “places we should definitely go back to.”', '/scrapbook/memories/fort.jpeg', .72),
  tag('vishruth-recipe', 'vishruth', '2026-07-14T12:00:00.000Z', 'theo', 'the soup recipe you kept describing but never measuring', 'https://www.bbcgoodfood.com/recipes/collection/soup-recipes'),
  stamp('vishruth-roof', 'vishruth', '2026-06-01T12:00:00.000Z', 'sam', 'somehow nobody blinked. historic.', '/scrapbook/memories/roof-friends.jpeg', .75),
  // Stable mailbox deep-link targets; these are real contributions in Vishruth's book.
  stamp('vishruth-varun-photo', 'vishruth', '2026-10-20T21:02:00.000Z', 'varun', 'varun caught the bit right before everyone started laughing.', '/scrapbook/memories/tree-friends.jpeg', .75),
  { id: 'default:vishruth-jun-voice', scrapbookId: 'library:vishruth', recipientId: 'vishruth', authorId: 'jun', createdAt: '2026-10-17T12:00:00.000Z', seed: 87731, kind: 'voice', durationSec: 42 },
];

const SUPPLEMENTAL_DATES = [
  '2026-10-05', '2026-10-19', '2026-09-03', '2026-09-18', '2026-09-25',
  '2026-08-02', '2026-08-12', '2026-08-26', '2026-07-04', '2026-07-15',
  '2026-07-28', '2026-06-05', '2026-06-17', '2026-06-30', '2026-05-04',
  '2026-05-18', '2026-04-02', '2026-04-16', '2026-03-03', '2026-03-20',
  '2026-02-08', '2026-02-22', '2026-01-07', '2026-01-25', '2025-12-14', '2025-12-28',
] as const;
const SUPPLEMENTAL_COPY = [
  'the coffee was terrible but you defended it anyway.', 'found this in my camera roll and laughed all over again.',
  'for the group chat historian.', 'you were right about taking the long way home.',
  'this was the exact moment the plan became a bad idea.', 'saving this for your next tiny victory.',
  'nobody asked for a photo shoot. everyone participated.', 'your laugh is doing a lot of work in this picture.',
  'the weather was dramatic for absolutely no reason.', 'a very convincing argument for going outside.',
  'we said we would leave early. this is our alibi.', 'saw this and immediately thought of your weirdly specific recommendation.',
  'the snack run that became dinner.', 'proof that you can make any errand feel ceremonial.',
  'i still cannot believe that actually worked.', 'this has your name written all over it.',
  'a small dispatch from the place you would have loved.', 'keeping this here because you always forget the good parts.',
  'we were laughing too hard to explain it to anyone else.', 'a completely normal amount of enthusiasm.',
  'the photo is blurry because the moment was not.', 'you would have made us stay another hour.',
  'remember this when you say you are not sentimental.', 'one for the “we should do that again” pile.',
  'just a tiny reminder that your people are paying attention.',
  'the year-end check-in nobody planned, which made it better.',
] as const;
const SUPPLEMENTAL_IMAGES = [
  '/scrapbook/memories/tree-friends.jpeg', '/scrapbook/memories/beach-selfie.jpeg', '/scrapbook/memories/louvre-facade.jpeg',
  '/scrapbook/memories/coconut.jpeg', '/scrapbook/memories/blue-beach.jpeg', '/scrapbook/memories/dye-bath.jpeg',
  '/scrapbook/memories/fort.jpeg', '/scrapbook/memories/lake-sunset.jpeg', '/scrapbook/memories/roof-friends.jpeg',
] as const;
const SUPPLEMENTAL_LINKS = ['https://open.spotify.com/', 'https://www.bbcgoodfood.com/', 'https://www.poetryfoundation.org/', 'https://www.alltrails.com/', 'https://www.openstreetmap.org/'] as const;
const SUPPLEMENTAL_AUTHORS = ['maya', 'jun', 'priya', 'sam', 'theo', 'ana', 'varun'] as const;
const SUPPLEMENTAL_THEMES: NonNullable<PlacedMemory['theme']>[] = ['late-nights', 'laughing', 'trips', 'songs'];

function supplementalMemoriesFor(recipientId: string): PlacedMemory[] {
  return SUPPLEMENTAL_DATES.map((date, index) => {
    const id = `${recipientId}-archive-${index + 1}`;
    const timestamp = `${date}T12:00:00.000Z`;
    const author = SUPPLEMENTAL_AUTHORS[(index + recipientId.length) % SUPPLEMENTAL_AUTHORS.length];
    const copy = SUPPLEMENTAL_COPY[index];
    const theme = SUPPLEMENTAL_THEMES[index % SUPPLEMENTAL_THEMES.length];
    if (index % 3 === 0) return stamp(id, recipientId, timestamp, author, copy, SUPPLEMENTAL_IMAGES[index % SUPPLEMENTAL_IMAGES.length], index % 2 === 0 ? .75 : 1.33, theme);
    if (index % 3 === 1) return note(id, recipientId, timestamp, author, copy, theme);
    return tag(id, recipientId, timestamp, author, `saved for ${recipientId}: ${copy}`, SUPPLEMENTAL_LINKS[index % SUPPLEMENTAL_LINKS.length], theme);
  });
}

/** 31 stable memories per book: five hand-authored anchor moments plus 26 dated additions. */
export const CANONICAL_MEMORIES: readonly PlacedMemory[] = [
  ...SEED_CANONICAL_MEMORIES,
  ...['vishruth', 'priya', 'maya', 'jun', 'ana', 'sam', 'theo'].flatMap(supplementalMemoriesFor),
];

export function canonicalMemoriesFor(recipientId: string): PlacedMemory[] {
  return CANONICAL_MEMORIES.filter((memory) => memory.recipientId === recipientId);
}

const BOOP_SENDERS = ['vishruth', 'priya', 'maya', 'jun', 'ana', 'sam', 'theo'] as const;
const BOOP_DESIGNS: PlacedBoopStamp['stampDesignId'][] = ['grateful', 'giddy', 'curious', 'daydream', 'grin'];
const BOOP_POSITIONS = [[244, 112], [42, 474], [252, 305], [38, 398], [245, 164]] as const;
/** Five deterministic friend-sent marks per book. Sender and recipient can never coincide. */
export const CANONICAL_BOOPS: readonly PlacedBoopStamp[] = BOOP_SENDERS.flatMap((recipientId, recipientIndex) => BOOP_DESIGNS.map((stampDesignId, index) => {
  const senderId = BOOP_SENDERS[(recipientIndex + index + 1) % BOOP_SENDERS.length];
  const [x, y] = BOOP_POSITIONS[index];
  return { id: `default-boop-${recipientId}-${index + 1}`, stampKey: stampDesignId, stampDesignId, recipientBookId: `library:${recipientId}`, senderId, x, y, width: 96 + (index % 3) * 4, rotation: [-5, 4, 3, -4, 5][index], createdAt: `2026-0${7 + (index % 3)}-${String(21 + index).padStart(2, '0')}T12:00:00.000Z` };
}));

export function canonicalBoopsFor(recipientId: string): PlacedBoopStamp[] {
  return CANONICAL_BOOPS.filter((stamp) => stamp.recipientBookId === `library:${recipientId}`);
}
