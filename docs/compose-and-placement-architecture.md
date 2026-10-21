# Compose and placement architecture audit

## Scope and conclusion

This is an architecture audit for the complete add-memory experience. No product code was changed. The app already has the visual primitives needed to show every artifact and the add fan can report the chosen kind. It does not yet have a compose screen, product navigation into one, durable scrapbook data, a selected-recipient model, or a placement policy for created items.

The recommended direction is one canonical persisted `ScrapbookMemory` entity, a single renderer adapter that maps it to the existing `Stamp`, `Note`, `VoicePostcard`, and `ParcelTag` components, and a separate style-owned placement adapter for each canvas. Do not make a third item renderer and do not turn the reference fixture coordinates into a generic layout engine.

## 1. Current state

| Capability | Status | Evidence |
| --- | --- | --- |
| Four visual artifact renderers | Fully implemented and used in gallery/harness | `src/components/Stamp.tsx`, `Note.tsx`, `VoicePostcard.tsx`, `ParcelTag.tsx` |
| Item flip, privacy back face, deterministic decor and removal UI | Fully implemented in item components | `FlipCard`, `ItemBack`, `Decor`, `RemoveButton` |
| Image/video file selection, object-URL preview and metadata ratio extraction | Implemented but only in the unmounted legacy harness | `src/App.tsx` |
| Audio file selection and card playback | Implemented but only in the legacy harness / item renderer | `src/App.tsx`, `VoicePostcard.tsx` |
| Link preview upload and Microlink screenshot experiment | Implemented but only in legacy harness; not production-safe persistence | `src/App.tsx` |
| Microphone recording | Not implemented | No `MediaRecorder` or `getUserMedia` usage |
| Add fan visual interaction and kind callback | Fully implemented component, disconnected in the live canvas | `AddFab` exposes `onSelect(kind)`; `ScrapbookCanvasPage` supplies none |
| Active product canvas | Implemented as a fixed torn-strata fixture preview | `CanvasScreen.tsx` uses visitor view and fixture-backed style |
| Other three canvas styles | Implemented as gallery previews, not product-selectable | style registry and gallery entries |
| Compose flows | Present only as the reference prototype | `references/Compose Flows.dc.html` |
| Real creation, recipient association, persistence, return-to-canvas state | Not implemented | No store/API, and `items?: unknown[]` is unused |
| Dynamic canvas insertion/placement | Not implemented | All styles render fixture arrays and hard-coded placement records |

The root route is a development gallery. `AppShell` is reached through the gallery and keeps Home and Journal mounted locally. The Library changes a selected folder but does not choose or navigate to a real recipient scrapbook. `CanvasScreen` hard-codes `torn-strata`, `visitor`, and a top-right override so it clears the app-shell bottom navigation.

## 2. Source-of-truth reference mapping

| Concern | Source of truth | Existing port/use | Notes |
| --- | --- | --- | --- |
| Compose screens | `references/Compose Flows.dc.html` | None | Extract application screens only; discard phone bezel, status area, and comparison-harness copy. |
| Add fan | `references/Scrapbook Add Button.html` | `src/components/AddFab/*` | Preserve engine, callback API, motion, icons and gesture behavior. |
| Stamp | `references/stamp-test.html` | `Stamp.tsx` | This wins over `Item.dc.html` for Stamp. |
| Note, voice and tag | `references/Item.dc.html` | respective item components | Existing item primitives are the target renderers. |
| Canvas styles | `references/Scrapbook Directions.dc.html`; envelope/wheel supplements | four `src/scrapbook/canvas/styles/*` implementations | The spec explicitly says fixture coordinates are reference data, not dynamic placement. |
| Canvas policy/invariants | `docs/scrapbook-canvas-spec.md` | `ScrapbookCanvasPage`, anchors, styles | Existing names are `own`/`visitor`, while the spec uses `self`/`other`; reconcile before expanding. |

### Compose-reference inventory

All reference compose screens use a 393 x 852 phone content frame, Shantell Sans at weight 300, the shared `#ink` SVG filter, a hand-drawn close X at left/top, and centered recipient text at top 62. Application implementation should use the existing app screen frame and `ScreenShell`, not copy the reference's device bezel/status area.

Common send control: a 132 x 60 hand-drawn outlined pill with a 24px “send” label. Reference hover is rotate -2 degrees plus scale 1.04; press scale .96. Disabled instances are 30% opacity and visually non-actionable. The close X must cancel/back out without producing an item.

#### Image → Stamp

- Background `#F2C230`, dark ink `#111111`, recipient “for maya”. The stamp is at left 76/top 168, 240 x 314 visual reference area, rotated -2 degrees; it imports a stamp at zoom 1.6.
- Empty state: a hatched stamp with an upload icon and “upload from device.” The icon bobs 6px in a 2.2s ease-in-out infinite animation. Tapping opens a device picker. Send is disabled.
- Uploading state: upload prompt is replaced by an ink progress path (dash array 150, 2.4s ease-out loop) and an `uploading` label; send remains disabled.
- Added state: selected media replaces the hatch. The stamp is tappable to replace it. A caption input sits at left/right 56, top 548 with “add a line, if you want” (19px) and an ink underline; send enables. The reference shows `from your camera roll` as the artifact label.
- Existing `Stamp` supports image and video previews plus caption-driven height. Its generic, content-driven dimensions differ from the fixed reference compose preview, which is acceptable only when the compose screen deliberately supplies its preview scale/position.

#### Pen → Note

- Background `#FAF7F0`, dark ink, recipient “for jun”. The note preview begins at left 36/top 196, with a 320 x 272 reference area and -1.5 degree rotation at zoom 1.6. It is non-flippable while authoring.
- Empty state renders “write here” in Shantell Sans, 22.4px, 38% opacity, plus the reference-described blinking 1-second step caret. Placeholder disappears on the first keystroke; send is disabled.
- Typing state renders the live text through the Note preview unchanged and enables send. The reference gives no max length or overflow rule. The current Note intentionally has fixed dimensions and lets overflow spill, so a product max length is required before shipping.

#### Microphone → VoicePostcard

- Background `#0F3B2E`, foreground `#FAF7F0`, red record fill `#D8422C`, recipient “for priya”. Voice preview sits left 24/top 210 at zoom 1.5, rotation -2 degrees, non-flippable.
- Ready: card has no waveform bars, text “tap to record,” condensed 14px tracking .16em timer `0:00`, and an 84px record control at left 154/top 666. Hover scale 1.06; press .94.
- Recording: text changes to “listening,” timer advances, and one waveform bar is added every 170ms, looping at 34 bars. Record control becomes pause. Reference says stopping ends a one-take recording.
- Paused: bars and timer freeze, pause icon remains, and there are no further controls; flow hands off to review.
- Review: actual voice preview with duration; its play icon is the playback control. Send at top 664 and underlined “again” at top 744 are both centered. Again discards/restarts the take.
- Playing: preview play becomes pause and waveform reveals left-to-right with audio playback. Pausing returns to review.
- Existing `VoicePostcard` already owns HTML audio playback/progress, but its waveform is generated geometry rather than a recorded amplitude waveform. The compose animation can be reference-faithful independently; using captured waveform samples on the final card is a separate product decision.

#### Link → ParcelTag

- Background `#2E6BE6`, foreground `#FAF7F0`, recipient “for theo”. The reference contains two live text fields at left/right 44/top 140: link then title, each 76px high and 34px apart.
- Resting labels are 22px at 70% opacity on the input line; underline is 1.6px at 55%. Focused or filled labels move up 26px, shrink to 13px and become opaque in 220ms cubic-bezier(.3,.8,.3,1). Focused underline becomes 3px/100% in 200ms. A filled blurred field remains small/above with a 1.6px opaque underline.
- The tag preview is at left 104/top 380, rotated 3 degrees and zoom 1.3. It uses title text, starts at 25% opacity, and fades to full opacity over 300ms when title is present. Send at top 720 enables as soon as the link field has text (not title).
- Existing `ParcelTag` validates neither URL nor title, and can use an optional uploaded/fetched preview. Its Google favicon fallback and legacy Microlink fetch should not become the persistence design.

### Reusable compose structure

Create a `ComposeMemoryScreen` shell (recipient header, close/cancel, send control, page color/ink tokens) plus four kind modules rather than four duplicate full screens. Each module owns only its draft fields and state machine, and renders an existing item component in `authoring` mode through the same renderer adapter planned for canvas use. Add explicit authoring options to existing components only where needed (for example `flippable={false}`); do not duplicate their SVG/card markup.

## 3. Proposed canonical item architecture

The current `ScrapItem` union is closest to the domain need but lacks recipient/scrapbook identity, media metadata, creation metadata and true tag URLs in canvas data. The fixture `SampleItemBase` instead carries presentation grouping (`m`, `hand`) and a reference-specific field vocabulary. Keep that fixture model isolated.

```ts
type MemoryKind = 'stamp' | 'note' | 'voice' | 'tag';

interface ScrapbookMemoryBase {
  id: string;
  scrapbookId: string;
  recipientId: string;
  authorId: string;
  createdAt: string;          // ISO 8601
  seed: number;               // persisted, never regenerated
  kind: MemoryKind;
  placementVersion: 1;
}

interface StampMemory extends ScrapbookMemoryBase {
  kind: 'stamp';
  caption: string;
  media: { storageKey: string; mimeType: string; width: number; height: number; durationSec?: number };
}
interface NoteMemory extends ScrapbookMemoryBase { kind: 'note'; text: string; }
interface VoiceMemory extends ScrapbookMemoryBase {
  kind: 'voice';
  audio: { storageKey: string; mimeType: string; durationSec: number; waveform?: number[] };
}
interface TagMemory extends ScrapbookMemoryBase {
  kind: 'tag';
  url: string;
  title: string;
  preview?: { storageKey: string; mimeType: string; width: number; height: number };
}
type ScrapbookMemory = StampMemory | NoteMemory | VoiceMemory | TagMemory;
```

Use ISO dates for storage and format them at rendering time. Store stable media keys, not browser `blob:` URLs. The data layer resolves a short-lived display URL only when rendering. `recipientId` may be redundant with `scrapbookId` in a future normalized backend, but retaining both during this prototype makes the compose target explicit and testable.

Use two adapters, not new rendering systems:

1. `memoryToItemProps(memory, context)` maps canonical fields to the existing item components: media ratio, caption/text, audio URL/duration, tag URL/title/preview, sender display name, formatted date, viewer and seed.
2. `memoryToCanvasRecord(memory)` adds only derived grouping keys and style placement output. Existing `ScrapbookItem` should evolve into this canonical renderer adapter; fixture conversion should be a separate `sampleItemToMemory` adapter for previews.

The existing canvas adapter has known fidelity gaps: it discards actual tag URLs, ignores audio sources, maps every visitor item to `other`, and does not honor fixture `attach` because decor is seed-controlled. These must be resolved in the adapter, not by making a parallel item implementation.

## 4. Per-canvas placement constraints

| Style | Grouping/navigation | Existing placement and sizing | Dynamic insertion policy |
| --- | --- | --- | --- |
| TornStrata | Vertical chronological month strips; newest strip visually overlays older strips; scroll vertically | `ST` contains hand x/y/rotation/zoom per fixture; strip height is reference-defined and backgrounds are full-width. Stamp height may be content-driven. Existing items may overlap intentionally. | Group new memory into `createdAt` month. Add a `TornStrataPlacementPolicy` that packs only dynamic items in a reserved/new dynamic region of that month, measures real rendered bounds, avoids the add-fab clearance, and grows only that generated region/strip. Preserve all fixture coordinates and z/DOM order. |
| ThemeSpreads | Four semantic panels (late nights/laughing/trips/songs); horizontal snap, each panel independently vertically scrolls | `THEME_PANELS` assigns fixture membership and absolute x/y/zoom/rotation. Panel content height is measured from actual item bottoms. Overlap is intentional in the reference. | Product needs a deterministic classification rule (user selects theme, inferred tags, or default “unfiled”). Within a panel, use a generated lane/grid below existing reference blocks or a measured free-space packer; expand that panel's vertical content. Do not infer a theme solely from date. |
| EnvelopesLip | Three seasonal envelopes; vertical closed stack; tap one to open a six-position fan and then close via control | `SE` groups fixture ids by season. Closed envelopes show at most four visible upright slots; fifth/sixth items are hidden until open. Real item heights and rotated bounds are measured. Open fan has six hard-coded slots; seventh has no defined behavior. | Group by season from `createdAt`. Define overflow before coding: paging/stack within an envelope, a generated additional envelope, or seasonal sub-envelopes. A dynamic policy must allocate closed slots and an open fan/page layout based on real item bounds; it cannot append indefinitely to six reference fan slots. |
| PaperWheel | Month wheel selected by drag/tap; only selected month items show above a fixed bottom-anchored wheel | `DP` is fixture x/y/zoom/rotation by item; selected month is `createdAt`-like fixture month. Items cross-fade/translate; scaling fits fixed content above wheel; scroll height measures actual bounds. | Group by `createdAt` month. Implement a month-local packer in the available region above the wheel after preserving reference items. It must iterate measured dimensions and determine fit/overflow rather than rely on fixed base heights. Product must choose paging, scroll-only lanes, or scale floor behavior for dense months. |

All styles must retain the existing design coordinate treatment: full-bleed layers use measured frame dimensions; reference-positioned layers use the centered 390px design coordinates; canvas safe areas are intentionally unmasked. AddFab currently satisfies root-last/z-index layering, but its internal fan fit still uses margins 38/74/`frameH - 38`, not the spec's working rectangle. That is a documented discrepancy to decide on rather than silently changing.

Insertion belongs in a new `src/scrapbook/placement/` domain module, with one pure policy per style and tests. A style component receives its already-placed dynamic records and remains responsible for its rendering/interaction. DOM measurement may be needed for final bounds, so use a two-pass deterministic process: tentative pure placement from known/content estimates, measure actual item boxes after mount, then reconcile only generated placements. Persist the resulting style placement only if stable cross-session exactness is required; otherwise persist a placement version and regenerate deterministically from memory ids/seeds and ordered data.

## 5. Proposed data flow: AddFab to canvas

1. Resolve the active recipient/scrapbook context before rendering the canvas: `{ scrapbookId, recipientId, recipientName, style, viewer }` plus canonical memory list.
2. `ScrapbookCanvasPage` passes `onSelect` to the unchanged `AddFab`. Callback receives `stamp | note | tag | voice`.
3. Canvas owner/controller stores a `ComposeRouteState` containing the chosen kind, active scrapbook/recipient identity, and return location/style. Open compose as a screen/route layered in the app flow; close returns with no mutation.
4. Compose loads a kind-specific draft state, previews it through the existing item renderer in authoring mode, and performs local validation. File/audio drafts use revocable object URLs only until submit.
5. On submit, media is uploaded/persisted first; the final canonical memory is created only with durable media references. The save transaction associates it with the chosen scrapbook and recipient, assigns id/seed/timestamp, and returns the saved entity.
6. Update the memory store optimistically or from the save response. Pass typed memories into `ScrapbookCanvasPage` and style placement adapters; do not pass `unknown[]`.
7. Placement policy inserts the new item into the selected style's appropriate group. Canvas rerenders and returns/focuses to the newly created item or its group in a motion-safe manner.

Until a backend exists, an explicitly named local persistence repository can prove the architecture, but browser object URLs must never be saved. The legacy `scrapbook-board-v1` removal storage is unrelated demo state and should not be extended into the product model by accident.

## 6. Technical dependencies and blockers

| Need | Recommended approach | Current blocker/risk |
| --- | --- | --- |
| Image selection/preview | File input with `accept="image/*,video/*"`; use temporary object URL; load media metadata for ratio; revoke on replace/unmount | Existing harness logic is reusable only after extracting it from unmounted `App.tsx`. |
| Real image/video persistence | Upload blob to chosen storage service; persist key, MIME type, dimensions and optional video duration | No backend/storage/auth or upload contract exists. |
| Recording | `navigator.mediaDevices.getUserMedia({ audio: true })` + `MediaRecorder`; choose supported MIME, collect chunks, stop once, create review object URL, derive duration | Permissions, denial/unavailable devices, iOS/Safari codec support, cleanup of tracks/URLs, and no existing recorder utility. |
| Audio review/playback | Compose preview can use `VoicePostcard`; object URL during review and durable URL after save | Existing final playback works, but recorded waveform visualization/data is undecided. |
| Link validation/title | Parse with `new URL`, normalize/require `http(s)`, retain exact title input; block send with accessible errors | Reference enables send on any nonempty link, but production needs a decision about permissive versus validated submission. |
| Link preview | Make preview optional. Prefer a backend metadata service if remote screenshots are desired. | Legacy Microlink call is direct browser third-party traffic and may fail due to CORS/privacy/availability; Google favicon fallback is external too. |
| Recipient and association | Context/repository resolves real selected Library person and scrapbook id before compose | Library selection is local-only; no user/scrapbook entities, authorization or routing. |
| Return after save | Store compose route state and return path; focus/scroll to placed item | AppShell has local tab switching only; no screen-level compose routing. |

## 7. Outstanding product decisions

- Who may add? Existing canvas code says `visitor` sees AddFab, whereas the spec says `other`; confirm whether recipients/contributors are visitors and what “own” means.
- What is the actual recipient identity selected in Library, and which scrapbook is active after selection?
- Does a contributor choose the ThemeSpreads theme, and what is the default/unfiled strategy?
- What should happen when an envelope exceeds four closed slots or six opened fan positions, or a month exceeds its paper-wheel usable area?
- Are stamps image-only, or should current video support remain in the authored product? Is a caption optional as the reference suggests?
- What are note length/line/overflow constraints?
- Does recording remain strictly one take; can it be discarded/re-recorded before saving; what duration/file-size cap applies?
- Should a final voice card show a generic seeded waveform or a recorded amplitude waveform?
- Are link previews automatic, user-uploaded, optional, or omitted? What privacy/security rules apply to fetching a submitted URL?
- Is exact placement persistent per style, deterministic at render time, or both? If a scrapbook can change style, should the same memory have one placement per style?
- Is local-only persistence an acceptable interim volume, or does the feature require a backend/auth choice first?

## 8. Recommended implementation sequence

1. Confirm product decisions above, especially recipient context, persistence target, and each style's overflow policy.
2. Add canonical domain types, a typed repository interface, fixture-to-domain adapter, renderer adapter, and tests without changing reference layout output.
3. Make `ScrapbookCanvasPage` and every style accept typed memories plus a fixture fallback. Preserve fixture positions exactly while introducing style placement-policy seams.
4. Implement and test pure placement policies per style, including limits/overflow and deterministic seed/order behavior; add measurement reconciliation only where content-driven card bounds require it.
5. Wire Library/page context and real canvas selection/routing. Then pass the existing AddFab `onSelect` into an explicit compose route state.
6. Build the shared compose shell and Note/Link flows first (no device permissions), matching `Compose Flows.dc.html` states and adding accessible real inputs.
7. Extract image upload/metadata/object-URL cleanup from `App.tsx`; build Stamp compose and then a real storage repository.
8. Implement microphone recording, review/re-record and durable audio upload. Verify permission-denied and browser support paths.
9. Integrate return-to-canvas, scroll/focus behavior, persistence failures/retries, and style-specific placement on successful save.
10. Add unit tests for adapters/policies, integration tests for AddFab-to-compose-to-canvas, and visual regression checks against relevant references. Run build, lint and tests after each volume.

## 9. Exact files expected to change in later volumes

Expected existing-file changes:

- `src/types/index.ts` — replace/extend the current app-level `ScrapItem` with canonical domain types or import them from a dedicated domain module.
- `src/components/ScrapbookItem/ScrapbookItem.tsx` — turn the fixture-shaped adapter into the canonical renderer adapter; preserve use of existing four item components.
- `src/scrapbook/canvas/ScrapbookCanvasPage.tsx` — typed items, `onSelect`, context and return integration.
- `src/scrapbook/canvas/styleRegistry.tsx` — typed style props.
- `src/scrapbook/canvas/styles/TornStrata/TornStrata.tsx`, `ThemeSpreads/ThemeSpreads.tsx`, `EnvelopesLip/EnvelopesLip.tsx`, `PaperWheel/PaperWheel.tsx` — consume placed canonical records while retaining fixture fallback and reference interactions.
- Corresponding `*Geometry.ts`/`themeSpreadsData.ts` files only if they need a clearly separated dynamic-region input; never overwrite fixture constants as a generic algorithm.
- `src/screens/CanvasScreen/CanvasScreen.tsx` and `src/screens/AppShell/AppShell.tsx` — active scrapbook context and compose navigation.
- `src/components/AddFab/AddFab.tsx` only for normal callback wiring at call sites; `addFabEngine.ts` should remain unchanged unless the separately approved working-rectangle discrepancy is addressed.
- `src/data/mock.ts`, `src/scrapbook/fixtures/sampleItems.ts`, `src/gallery/registry.tsx` — fixture/adapters and compose preview registration, as appropriate.
- `src/App.tsx` — preferably extract or retire duplicated demo-only upload/preview utilities rather than treating it as product flow.

Expected new files:

- `src/scrapbook/domain/memory.ts`, `memoryRepository.ts`, and `memoryAdapters.ts` (or an equivalent cohesive domain folder).
- `src/scrapbook/placement/{types,tornStrata,themeSpreads,envelopesLip,paperWheel}.ts` with focused tests.
- `src/screens/ComposeMemoryScreen/ComposeMemoryScreen.tsx` and CSS, plus `composeTypes.ts`/draft reducer and four kind modules.
- `src/utils/mediaUpload.ts`, `mediaMetadata.ts`, and `audioRecorder.ts` if extracted as focused utilities.
- Tests for compose state machines, media cleanup, renderer adapters, policies and end-to-end flow.

No dependency installation is justified until the persistence backend and recording/browser-support decisions are made. React, browser file APIs and MediaRecorder are sufficient for an initial implementation; a backend/client SDK choice should follow the product persistence decision.
