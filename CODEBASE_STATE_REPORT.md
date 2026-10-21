# Codebase State Report

**Audit date:** 21 October 2026 (America/New_York)  
**Repository:** `SVSD_Vishruth_Cal`  
**Audited commit:** `3600f9cd7a3603490dbdd709d0ac25def17b1847` (`Update scrapbook UI and interactions`)  
**Scope:** Full source and documentation inventory; current working-tree additions included. No application source was modified for this audit.

## Executive summary

This is a React scrapbook prototype built around the idea of postal keepsakes: photo stamps, handwritten notes, voice postcards, parcel tags, and small BOOP stamps arranged in a friend's scrapbook. The intended experience is to browse one's own book or a friend's, switch its presentation, add a memory, and receive mailbox activity. There is no server, account system, or real multi-user synchronization. The current runtime is a local browser prototype with hardcoded people/notifications, browser storage, and fixture content.

Compared with the previous report, the app now has an active Home → scrapbook path, functional AddFab → four compose flows → IndexedDB save/load, a scrapbook profile with presentation and contributor controls, a mailbox/invitation prototype, and the BOOP stamp picker with local persistence. The four original canvas presentations and four artifact renderers remain. Current application entry is still the Gallery at `/#/`; the product is `/#/screens/app`.

The experience is materially more integrated, but not production-complete. The mailbox and participant list are fixtures; invitation acceptance is explicitly a placeholder; profile controls are local state; content has no server sync or authorization. Created memories are persisted locally but rendered through a generic absolute-position layer rather than each canvas style's native grouping/scroll system. Build and tests pass; lint has one confirmed error. See validation below.

## Product intent and current behavior

### Intended product

The product frames shared memories as ephemera saved in a scrapbook. A book owner can view their own book, browse books in a Library, choose a visual presentation (canvas, wheel, envelope, or cover/spreads), and permit contributors to add artifacts. A visitor can compose photo, note, link, or voice memories; BOOP is a lightweight stamped reaction. The mailbox is intended to surface invitations and memory activity.

### What currently works in this repository

- The gallery route exposes the product shell and isolated component/screen previews.
- Home opens the owner's scrapbook cover or a selected Library person's scrapbook. Browser history is used for back navigation.
- The scrapbook header opens a profile screen; profile choices map to one of four canvas styles and are persisted in `localStorage` per `library:<name>` key.
- AddFab selection opens a matching compose flow. Photo selection, note entry, URL/title entry, and browser microphone recording/review are implemented. Successful submissions are written to IndexedDB and appended to current state.
- IndexedDB persists item records and photo/audio blobs by recipient. Reloading loads records and creates object URLs for media.
- A visitor mailbox displays static notification rows. Selecting a row opens a local invitation placeholder, or opens a scrapbook and sets an item scroll target.
- BOOP's ten reference SVG designs are displayed in a picker. Selection appends a positioned stamp to localStorage and the canvas overlay.
- Four canvas presentations, seeded visual cards, flips, and style-specific local interactions remain available. The gallery can inspect style/view variants independently.

### What remains simulated or incomplete

No authentication, backend/API, server persistence, real invitations, permission enforcement, delivery, notification read updates, or real social relationships exist. The mailbox's targets are demo data. Profile contributors, cover images, and presentation selections are local-only; cover images are in-memory object URLs rather than persisted files. Created memory content is local to the browser. The dynamic overlay has placement, clipping, grouping, and reveal defects described below. There is no browser-level or visual regression suite.

## Repository structure

Generated `node_modules/` and `dist/` are excluded. `Microsoft/Windows/PowerShell/ModuleAnalysisCache` and `.claude/` are present as untracked/local artifacts; neither is application source. `.git` reports the current commit above. Git status also showed `?? .claude/`; Git's global ignore file could not be read due to host permissions, so status visibility may be incomplete for globally ignored files.

```text
.
├── CLAUDE.md                              # engineering rules, visual and item implementation conventions
├── CODEBASE_STATE_REPORT.md               # this handoff
├── README.md                              # still generic Vite starter text
├── package.json / package-lock.json       # scripts and pinned dependency graph
├── vite.config.ts / tsconfig*.json         # Vite alias/build and TypeScript projects
├── eslint.config.js / index.html           # lint and document shell
├── docs/
│   ├── scrapbook-canvas-spec.md            # authoritative canvas port constraints
│   ├── compose-and-placement-architecture.md # compose/data architecture audit and known integration risks
│   └── compose-ui-diagnostic-report.md     # compose wiring diagnostic and reproducible findings
├── references/                             # standalone HTML/DC design sources, assets and harnesses
├── public/
│   ├── favicon.svg, aquarium.jpg
│   └── scrapbook/                          # four local canvas fixture JPEGs
└── src/
    ├── main.tsx, index.css, App.tsx, App.css
    ├── assets/                              # rose, airplane icon, Inter file
    ├── components/                          # reusable visual primitives (see inventory)
    ├── data/                                # hardcoded home, mailbox and profile fixtures
    ├── gallery/                             # gallery routes, registry, previews and FAB layout lab
    ├── screens/
    │   ├── AppShell/                        # product state, orchestration, overlays and local persistence calls
    │   ├── HomeScreen/                      # Home cover, Library and invite composition
    │   ├── CanvasScreen/                    # shell adapter into shared canvas page
    │   ├── ComposeMemoryScreen/              # four authoring flows
    │   ├── MailboxScreen/ InvitationScreen/  # notification list and placeholder acceptance screen
    │   └── ScrapbookProfileScreen/           # local book settings and contributor UI
    ├── scrapbook/
    │   ├── canvas/                           # shared frame, fab anchor and four style renderers
    │   ├── fixtures/                         # reference-derived sample memories
    │   ├── persistence/                      # IndexedDB item/blob store
    │   ├── placement/                        # generic dynamic memory placement helper
    │   └── boopStamps.ts                      # local BOOP stamp records/storage
    ├── types/index.ts                        # base card and contributor/presentation types
    └── utils/                                # geometry, filters, measured text, image decoding
```

### Where to change things

- Route registration and font/global setup: `src/main.tsx`, `src/index.css`.
- Product flow, history, storage orchestration and selected book: `src/screens/AppShell/AppShell.tsx`.
- Home and people selection: `src/screens/HomeScreen/` and `src/data/mock.ts`.
- Compose controls and media state: `src/screens/ComposeMemoryScreen/`.
- Canvas frame/overlay and add anchors: `src/scrapbook/canvas/ScrapbookCanvasPage.tsx`, `fabAnchor.ts`, and `styles/`.
- Dynamic placement and persistence: `src/scrapbook/placement/`, `src/scrapbook/persistence/localScrapbookStore.ts`.
- Mailbox fixtures: `src/data/mailboxNotifications.ts`; profile fixture defaults/mapping: `src/data/scrapbookProfile.ts`.
- Reusable visual components must be added to the single gallery registry, `src/gallery/registry.tsx`, in accordance with `CLAUDE.md`.
- Legacy item board: root `src/App.tsx` / `App.css`; it is not imported by the active entry route.

## Architecture

### Stack and entry

`package.json` identifies the package as `vite-tmp` version `0.0.0`. Runtime dependencies: React/React DOM `^19.2.8`, React Router DOM `^7.18.4`, and Fontsource packages for Shantell Sans, Barlow Condensed, DM Mono, and variable Inter. Dev tools include Vite `^8.3.0`, TypeScript `~6.0.2`, ESLint `^10.10.0`, Vitest `^5.0.5`, and Playwright `^1.63.0` (installed, but no e2e suite is configured).

`src/main.tsx` imports the fonts, mounts `ScrapDefs`, enables `StrictMode`, then mounts `HashRouter`. Routes: `/` → `GalleryIndex`, `/screens/:id` → `ScreenStage`, `/components/:id` → `ComponentStage`. `src/gallery/registry.tsx` is the registration table; screen `app` mounts `AppShell`. Vite alias `@` points to `src`. There is no API client or backend SDK.

```text
main.tsx
└── HashRouter
    ├── / → GalleryIndex → registry
    ├── /screens/app → ScreenStage → AppShell
    │   ├── HomeScreenShell → Header + ScrapbookCover + Library + InviteSection
    │   ├── CanvasScreen → ScrapbookCanvasPage → canvas style + AddFab + BoopFab
    │   ├── ComposeMemoryScreen overlay → Stamp / Note / Tag / Voice authoring
    │   ├── MailboxScreen → static notifications → InvitationScreen or CanvasScreen
    │   └── ScrapbookProfileScreen → style/contributor/cover controls
    └── /components/:id → ComponentStage → isolated preview
```

AppShell is the central state owner. It tracks selected Library person, opened book, profile/mailbox/invitation/compose visibility, created memories, BOOP stamps, scroll target, and in-memory profile data. It uses browser `history.pushState`/`popstate` for nested screens. `ScreenPanel` keeps Home and canvas panels mounted for opacity transitions and manages `inert`, `aria-hidden`, and visibility at transition completion. The profile presentation is stored in localStorage; BOOP records in localStorage; scrapbook memories and blobs in IndexedDB. These are browser-local stores, not cloud persistence.

### Data models and flow

- `ScrapItem` in `src/types/index.ts` is the original four-kind render-oriented union.
- Canvas reference samples are a separate `SampleItemBase`/`MkResult` fixture model in `src/scrapbook/fixtures/sampleItems.ts`.
- Dynamic saved items use `PlacedMemory` in `src/scrapbook/placement/index.ts`: recipient/book/author IDs, date, kind, content/media fields and optional theme/mediaKey. `placeMemories()` maps records to absolute x/y/rotation/zoom coordinates.
- Mailbox rows and prototype target items are static values in `src/data/mailboxNotifications.ts`.
- Profile contributors are static defaults in `src/data/scrapbookProfile.ts`; AppShell makes local mutable copies.
- BOOP stamps use a separate `PlacedBoopStamp` model and localStorage key in `src/scrapbook/boopStamps.ts`.

Compose success constructs a `PlacedMemory`, writes it via `saveMemory`, appends to `createdItems`, sets a scroll target, then closes compose. On recipient changes, AppShell loads that recipient's IndexedDB records plus matching static prototype items. For stamp/voice, blobs are stored separately and recreated as object URLs on load. The `src` object URLs are not centrally revoked when loaded/created memory sets change; this is a confirmed lifecycle risk.

## Screens and flows

### Gallery and AppShell

The root hash is developer infrastructure, not the product Home. Open `/#/screens/app`. The App route initially renders Home, keeps panels mounted, and overlays compose when selected. The Home bottom tab navigation documented by the prior report is no longer the current primary flow: the latest Home has a scrapbook cover and Library; canvas is opened as a separate panel. `HomeScreenShell` routes the owner's cover to `own` and Library selections to named books.

### Home

`HomeScreenShell.tsx` adapts Home to AppShell callbacks. `HomeScreen.tsx` composes `Header` (send opens mailbox), `HandDrawnDivider`, `ScrapbookCover`, `Library`, and `InviteSection`. Library selection updates AppShell and opening a person enters that person's book. Library geometry is measured and scaled to available width. The cover animation delays navigation by 180ms unless reduced motion is requested. InviteSection's standalone visual invite affordance remains present, but the active Home does not pass a send/invite callback to that section; no live invite transaction results from it. Owner, recipient names and folder entries are fixture data.

Confirmed lint issue: `HomeScreen.tsx:24` assigns `openOwnScrapbookRef.current` during render, rejected by `react-hooks/refs`.

### Scrapbook canvas

`CanvasScreen.tsx` chooses style from the profile presentation mapping and passes owner, back/profile callbacks, add selection, dynamic items, BOOPs and scroll target into `ScrapbookCanvasPage`. Canvas style implementations are `TornStrata`, `ThemeSpreads`, `EnvelopesLip`, and `PaperWheel`. Each owns its own scrolling or local presentation interactions; reference fixture placements remain fixed. `ScrapbookCanvasPage` measures frame and header, computes the spec header delta, anchors AddFab from measured dimensions, mounts shared SVG defs, and renders BOOP at top-right in visitor context. The canvas spec calls for an unmasked, bands-free canvas shell.

AppShell currently passes the active recipient's created records. `ScrapbookCanvasPage` computes placements and renders dynamic `ScrapbookItem`s as an absolute overlay over the canvas style. The helper groups by month/theme but resets layout coordinates for each group; the overlay is outside the style-specific scroll/group trees. Thus save/load is implemented, but natural chronological placement, overflow expansion, style-native insertion, and reliable post-save reveal are not. `scrollTargetId` does not itself solve absent native scroll/reveal integration. The compose/placement docs detail this.

### Compose memory

`ComposeMemoryScreen.tsx` offers stamp, note, tag, and voice modes. The active AppShell sets `showDevTabs={false}` and sends the selected AddFab kind. Stamp opens an image picker and previews via object URL; note has text input capped at 420 characters; tag validates the URL shape and accepts an optional title; voice requests microphone permission and uses `MediaRecorder`, review playback and redo. The composed memory is saved locally on Send.

The voice close action currently runs `discard(); close();`, so the earlier diagnostic's stuck-close finding is fixed in the audited working tree. Browser permissions, codec compatibility and IndexedDB failure paths have not been exercised in a browser audit.

### Mailbox and invitation

`MailboxScreen.tsx` renders static rows from `MAILBOX_NOTIFICATIONS`, including unread dots, illustrations and keyboard-operable buttons. AppShell routes invitation targets to `InvitationScreen`; other targets open a book and may set a target ID. `InvitationScreen.tsx` explicitly states that the prototype records the invitation without accepting it. No read state is updated, and notification data is not generated by user activity.

### Scrapbook profile

`ScrapbookProfileScreen.tsx` displays cover art, presentation choices, contributor permissions and invite control. Presentation choice changes the canvas mapping and localStorage value. Removing contributors and adding a name (via `window.prompt`) only update AppShell state. Cover image selection uses an object URL held in memory and revoked on replacement/unmount; it is not persisted. These controls demonstrate a UI state, not access control or invitations.

## Component inventory

Integration status describes the active AppShell path, not whether a component can render in isolation.

| Component | File | Purpose / key props | State | Integration status |
|---|---|---|---|---|
| `AppShell` / `ScreenPanel` | `src/screens/AppShell/AppShell.tsx` | Product flow orchestration, local history and stores | Owns major screen/data state | Integrated prototype; high coupling |
| `Header` | `src/components/Header/` | Home masthead; `onSendClick` | Minimal | Integrated; send opens mailbox |
| `ScrapbookCover` | `src/components/ScrapbookCover/` | Owner book cover and burst interaction | Animation refs | Integrated on Home; gallery preview |
| `Library` | `src/components/Library/` | Animated folder catalog; people/select/open | Selected folder; motion hook | Integrated with fixture people and book opening |
| `InviteSection` | `src/components/InviteSection/` | Handle/link/copy/invite visuals | Copy feedback | Partially integrated; invite action not wired on Home |
| `HomeScreen` / `HomeScreenShell` | `src/screens/HomeScreen/` | Home composition and callback adapter | Geometry refs and cover timer | Integrated; one lint error |
| `HomeBottomNavigation` | `src/components/HomeBottomNavigation/` | Legacy home/journal tabs | Selection | Gallery/legacy; not primary current AppShell navigation |
| `ScrapbookHeader` | `src/components/ScrapbookHeader/` | Canvas title/back/profile actions | None | Integrated in canvas |
| `ScrapbookCanvasPage` | `src/scrapbook/canvas/` | Frame, style, fab and dynamic overlay composition | Measurements, picker states | Integrated, placement incomplete |
| `TornStrata` | `src/scrapbook/canvas/styles/TornStrata/` | Torn monthly strips | Scroll/presentation state | Integrated default style; dynamic items overlaid separately |
| `ThemeSpreads` | `src/scrapbook/canvas/styles/ThemeSpreads/` | Theme panels and sample items | Panel/swipe state | Integrated by profile choice; dynamic insertion not native |
| `EnvelopesLip` | `src/scrapbook/canvas/styles/EnvelopesLip/` | Envelope open/fan/return interaction | Open envelope | Integrated by profile choice; dynamic insertion not native |
| `PaperWheel` | `src/scrapbook/canvas/styles/PaperWheel/` | Month wheel interaction | Selected month/drag | Integrated by profile choice; dynamic insertion not native |
| `ScrapbookItem` | `src/components/ScrapbookItem/` | Canvas adapter for fixture/dynamic item kinds | Card-local | Integrated in canvas overlay and gallery |
| `Stamp` | `src/components/Stamp.tsx` | Image/video keepsake | Flip/measure state | Reused by item adapters, compose, gallery, legacy harness |
| `Note` | `src/components/Note.tsx` | Handwritten card | Flip/measure state | Reused; compose and gallery |
| `VoicePostcard` | `src/components/VoicePostcard.tsx` | Audio postcard/waveform | Playback/audio state | Reused; compose and gallery; real recording in browser flow |
| `ParcelTag` | `src/components/ParcelTag.tsx` | Link artifact and preview | Flip/measure state | Reused; compose/gallery; link metadata is local |
| `FlipCard`, `ItemBack`, `Decor`, `RemoveButton` | `src/components/` | Shared flip/privacy/decor/remove behaviors | Flip and callbacks | Integrated into standalone item cards; not equivalent to every canvas renderer path |
| `AddFab` / `addFabEngine` | `src/components/AddFab/` | Animated item-kind fan; `onSelect` | Imperative engine; open state | Integrated to compose in active canvas |
| `BoopFab` / `BoopStamp` | `src/components/BoopFab/` | Picker and ten SVG reactions | Open/picked | Integrated; selected stamps locally persisted |
| `MailboxStamp` | `src/components/MailboxStamp/` | Perforated mailbox type icon | None | Integrated in mailbox; static data |
| `MailboxScreen` | `src/screens/MailboxScreen/` | Notification list | Parent-owned navigation | Integrated prototype |
| `InvitationScreen` | `src/screens/InvitationScreen/` | Placeholder invitation destination | None | Integrated placeholder only |
| `ScrapbookProfileScreen` | `src/screens/ScrapbookProfileScreen/` | Presentation, contributors, cover | Parent-owned values | Integrated local demo controls |
| `ScreenShell` | `src/components/ScreenShell/` | Frame, safe areas, scrolling | None | Shared structural primitive |
| `ThemeNavigation`, `PillButton`, `HandDrawnDivider`, `SketchDefs`, `ScrapDefs` | `src/components/` | Canvas nav, control, separator, SVG definitions | Varies | Reused across canvas/gallery/screens |
| Gallery stages and preview harnesses | `src/gallery/` | Screen/component development previews | Preview-local state | Integrated development tooling, not product flows |

Two item render paths remain: the standalone `Stamp`/`Note`/`VoicePostcard`/`ParcelTag` components with shared flip/decor layers, and canvas `ScrapbookItem` over fixture geometry. Do not assume a change to one renderer automatically affects the other.

## Design system and visual implementation

### Global tokens and fonts

`src/index.css` defines `--font-hand: 'Shantell Sans', 'Comic Sans MS', cursive`, `--font-condensed: 'Barlow Condensed', sans-serif`, `--font-inter: 'Inter Variable', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`, `--ink-link: #2e6be6`, `--color-text-muted: #a1a1a1`, `--color-text-strong: #000000`, `--safe-top: 62px`, `--safe-bottom: 32px`, `--safe-side: 24px`, `--screen-bg: #faf7f0`, and `--screen-frame-width: 402px`. Body uses Shantell Sans at weight 300; letterbox background is `#1a1a1a`. `src/main.tsx` loads Shantell Sans 300/500, Barlow Condensed 400/500/600, DM Mono 400, and variable Inter. Inter is also bundled at `src/assets/fonts/inter-latin-400.woff2` for component use where referenced.

The canvas spec uses a 390 × 844 design frame and safe top/bottom/side of 62/34/24 for its canvas-specific reference geometry; global shell bottom token is 32px. Do not silently conflate those separate coordinate conventions. Canvas header height and frame are measured; `fabAnchor()` uses measured pill width for top-right and the working rectangle. FAB host z-index is configured at 200. The canvas has no opaque safe-area bands.

### Styling and motion

Styling is plain co-located CSS, with no Tailwind or animation package. SVG line art uses seeded geometry for stable wobble. `src/utils/geometry.ts`, `layout.ts`, `decor.ts`, and `filters.ts` centralize geometry, text/media sizing, deterministic decoration, and shared ink/paper definitions. AddFab remains an imperative DOM/CSS engine; other screens use CSS transitions and Web Animations API (cover), with reduced-motion support in selected systems. Profile and mailbox currently define separate SVG filter IDs/values. Colors and pixel values are often authored locally in component CSS/SVG, so `index.css` is not a complete design-token system.

`ScreenShell` centers a 402px frame and manages safe-area masks for normal screens. Canvas and compose use its `variant="canvas"` bands-free mode. The style-specific canvases own scrolling. There is no single documented global z-index scale beyond key local values (canvas AddFab 200; compose overlay 300 per `AppShell.css`). Reference HTML/DC files are visual/design sources only unless explicitly imported; BOOP intentionally imports its reference HTML as raw source to retain exact authored stamp SVG data.

### Responsive/accessibility observations

The product is a mobile frame centered on desktop and the Library scales to fit. Canvas coordinates remain centered against 390 design width while actual frame dimensions are measured. Several controls use semantic buttons and labels, `ScreenPanel` handles hidden/inert states, and reduced motion is supported in selected animations. No full keyboard, screen-reader, contrast, small-height, or browser matrix audit has been performed. The voice flow depends on browser microphone APIs.

## Functional interaction inventory

| Trigger | Handler/state change | Feedback and completion | Persistence / limitation |
|---|---|---|---|
| Home header send | AppShell `openMailbox` | Mailbox panel transition | Route history only; rows are fixtures |
| Owner cover activation | Home animation callback → `openOwnScrapbook` | Burst then opens own canvas | Not persistent |
| Library folder/open | `onSelectPerson` / `openPersonScrapbook` | Folder animation and canvas opens | Selected person is local, people are fixtures |
| Canvas header profile | `openProfile` | Profile panel | Local presentation preference persists; other profile values do not |
| Profile presentation button | `selectPresentation` | Active option hatching and canvas style changes | localStorage per book key |
| Profile remove/invite/cover controls | AppShell state update, prompt, file input | Contributor list/cover updates locally | No permission service; cover image not durable |
| AddFab open/select | AddFab callback → `openCompose(kind)` | Compose overlay with kind-specific screen | History state; draft is not persisted |
| Photo picker/send | `PhotoCompose` → `completeCompose` | Image preview, caption; then canvas data update | IndexedDB item + Blob; object URL lifecycle needs ownership cleanup |
| Note type/send | textarea state → `completeCompose` | Live text and enabled send | IndexedDB text record |
| Link type/send | URL validation and title state → `completeCompose` | ParcelTag preview and send | IndexedDB URL/title; no fetched preview in active compose |
| Voice record/stop/review/send | getUserMedia/MediaRecorder and audio element | Timer, bars, playback/re-record | IndexedDB Blob; browser/codec dependent |
| Close/back compose | screen callback/history | Returns to canvas; photo may confirm discard | Draft local only |
| Mailbox row | `openMailboxNotification` | Invitation placeholder or selected scrapbook | Notification read flag is static, never marked read |
| BOOP picker/select | `addBoopStamp` | Selection animation and positioned SVG | localStorage; not server-delivered |
| Flip/play/link/remove card | Item card handlers | Card flips, audio plays, link opens, conditional remove | Per-component state/callback; dynamic product removal path must be verified |
| Canvas style interactions | Each style local event handlers | Scroll, swipe, envelope fan, wheel/month changes | Presentation only; native insertion of dynamic items incomplete |

The visible `InviteSection` and invitation/profile UI should not be interpreted as a working invitation lifecycle. Mailbox rows do not derive from compose or BOOP events. Browser history gives back affordances but is not a server route model.

## Changes since previous report

The previous report described a Home/Journal tab shell and a static canvas, stated that AddFab had no product callback, and described all scrapbook content as fixture-only. At audited commit `3600f9c`, those statements are superseded:

| Area | Previous report | Current verified state |
|---|---|---|
| Home composition | Header + Library + InviteSection; bottom Home/Journal tabs | New cover-first Home with section dividers, own scrapbook cover, Library, and mailbox access; active AppShell opens a separate canvas panel |
| Book selection | Library selection did not open a person book | AppShell has `openOwnScrapbook` and `openPersonScrapbook`; selected name determines recipient scope |
| Add memory | AddFab rendered without a callback | AddFab callback now opens compose modes through AppShell |
| Compose | Reference-only/not implemented | `ComposeMemoryScreen` implements stamp/note/tag/voice authoring and is integrated in the shell |
| Persistence | No product memory persistence | `localScrapbookStore.ts` uses IndexedDB item/blob stores with recipient index; local-only, no sync |
| Dynamic items | No dynamic memories | AppShell passes loaded/new `PlacedMemory` records into canvas overlay; visual integration is incomplete |
| Canvas styles | Only torn strata in shell; other styles gallery-only | Profile maps to and selects all four styles; native dynamic placement is still incomplete |
| Profile | Not present | New profile screen exposes presentation, contributor removal/invite prompt, cover image selection |
| Mailbox | Not present | New mailbox screen with static typed notifications, invitation placeholder and book targets |
| BOOP | Not present | New picker from reference HTML, ten vector stamps, localStorage placement |
| Tests | 2 files / 12 tests | 3 files / 16 tests pass (current test command) |
| Lint/build | Prior report recorded passing | Build passes with chunk warning; lint currently fails at `HomeScreen.tsx:24` |

Recent git history (newest first) includes `3600f9c Update scrapbook UI and interactions`, `ab7bcc5 Implement mailbox screen and update spacing`, `d421cb5 Implement BOOP button, stamp picker, and canvas improvements`, `6b7244f Add scrapbook cover component and update component gallery`, `9169995 Fix compose UI, safe areas, and collision-free scrapbook placement`, and `b42834c Add compose flow design reference`. The commit names and code support the presence/timing of those changes; they do not prove product requirements or design approval. Current uncommitted `.claude/` is not described by commit history.

## Development progress matrix

Definitions: **Complete** means integrated for the stated prototype scope; **Partial** means usable flow with significant gaps; **Prototype** means demonstration/fixture behavior; **Not started** means absent; **Deprecated** means inactive path.

| Feature | Status | Evidence / boundary |
|---|---|---|
| Vite/React entry, gallery routing | Complete | `main.tsx`, registry; gallery is root |
| Home, owner cover, Library navigation | Partial | Functional local navigation; fixture identities, no account model |
| Four artifact visuals and shared interactions | Complete for visual component scope | Gallery and compose reuse; canvas has separate renderer path |
| Four canvas presentations | Prototype | Visually interactive; dynamic records not native to each style |
| AddFab → compose selection | Complete for local flow | AppShell callback connected |
| Stamp/note/tag/voice compose UI | Partial | UI and submission work; media/browser, draft and UX gaps remain |
| Local memory persistence | Partial | IndexedDB records/blobs; no server, tests or URL cleanup ownership |
| Dynamic memory placement/reveal | Partial | Absolute placement overlay exists; grouping/scroll/reveal defects |
| BOOP picker and local stamps | Partial | Picker and local persistence work; no real delivery |
| Mailbox | Prototype | Static rows and navigation only; no live events/read updates |
| Invitation acceptance | Not started | Screen explicitly says it does not accept invitation |
| Profile presentation preference | Partial | Per-book localStorage works; no server sync |
| Contributor/permission management | Prototype | Local UI state only; not authorization |
| Backend/auth/sharing | Not started | No service or identity integration |
| Legacy `src/App.tsx` item playground | Deprecated from active routing | Not imported in `main.tsx`; useful only as harness/reference |
| Automated tests | Partial | Geometry/anchor tests only, 16 pass; no compose/store/e2e tests |

## Known issues and technical debt

### Confirmed

1. **Lint fails:** `src/screens/HomeScreen/HomeScreen.tsx:24` writes to a ref during render; ESLint `react-hooks/refs` rejects it.
2. **Dynamic placement is not style-native:** `placeMemories()` restarts positions for each group, and the generic overlay is outside style scrollers/groups. Multiple groups can overlap and content can be clipped.
3. **No dependable post-save reveal:** setting `scrollTargetId` is not sufficient without a connected style-specific scroll/selection implementation.
4. **Persistence is local only:** IndexedDB is per browser/device; no cloud or shared access.
5. **Object URL lifecycle:** compose-created and `loadMemories()`-created media URLs are not clearly revoked when memory state is replaced or AppShell unmounts. Cover URLs do have explicit cleanup.
6. **Mailbox/invitation and profile permissions are presentation/local state only.** No read update, acceptance, access enforcement, or real invite delivery.
7. **No tests for AppShell flows, ComposeMemoryScreen, IndexedDB, mailbox targets, BOOP persistence, or dynamic placement integration.**
8. **Large production chunk:** build reports 515.13 kB minified JS (163.98 kB gzip), over Vite's 500 kB warning threshold.
9. **Duplicate rendering models:** `ScrapItem`, sample fixture data, and `PlacedMemory` are separate contracts; changes can diverge between renderer paths.
10. **README remains generic Vite template text.** `CLAUDE.md` and docs are more authoritative.

### Risks needing runtime verification

- Microphone permission denial, browser codec support, playback, IndexedDB quota/private browsing and mobile browser behavior have not been manually exercised in this audit.
- Responsive layout at short viewport heights, screen-reader order, keyboard control for all canvas gestures, contrast, and reduced-motion coverage need browser evaluation.
- Dynamic overlay placement may collide with headers or style content and may miss native z-order; source structure confirms the architectural gap, exact visual impact is viewport-dependent.
- No screenshot/pixel comparison confirms current reference fidelity.
- Historical `docs/compose-ui-diagnostic-report.md` contains detailed findings from an earlier working-tree state. Its VoiceCompose stuck-close issue is no longer present: the current handler discards then calls close.

## Development environment and validation

Run from repository root:

```bash
npm install
npm run dev       # Vite development server
npm run build     # tsc -b && vite build
npm run lint      # eslint .
npm test          # vitest run
npm run preview   # serve dist build
```

Actual audit results:

| Command | Result |
|---|---|
| `npm run build` | **Passed.** TypeScript and Vite build succeeded; Vite warned that the 515.13 kB minified JS chunk exceeds the 500 kB threshold. |
| `npm run lint` | **Failed.** One error: `HomeScreen.tsx:24`, `react-hooks/refs` (cannot update ref during render). |
| `npm test` | **Passed.** 3 test files, 16 tests. |

No app code was changed to achieve these results. Playwright is declared as a dependency but there is no configured browser test script. No browser interaction, visual test, or install command was run. No secrets or environment values were inspected for this audit.

## Recommended next steps

These are audit recommendations, not a claim of an existing approved roadmap:

1. Fix the lint error and add a focused Home cover/navigation regression test.
2. Move dynamic item placement into canvas-style-owned render/group/scroll data. Start with TornStrata month strips, then implement explicit style adapters for theme, envelopes and wheel.
3. Connect target-item reveal to each style's real scroller/selection and test multi-month insertion, reload and recipient changes.
4. Define object URL ownership and cleanup for created/loaded stamp and voice media; cover existing cover URL cleanup behavior with tests.
5. Add persistence and compose integration tests, including failure cases, and test voice close/permission behavior in supported browsers.
6. Decide the intended root entry experience (gallery or product) and update README accordingly.
7. Replace static mailbox/invitation/contributor fixtures with real service contracts only after backend, identity and permission requirements are defined.
8. Evaluate lazy loading/code splitting to address the production chunk warning, and perform responsive/accessibility/reference visual checks.

## What the Next Coding Agent Must Know

- Read first: `CLAUDE.md`, this report, `docs/scrapbook-canvas-spec.md`, `docs/compose-and-placement-architecture.md`, and `docs/compose-ui-diagnostic-report.md`. Treat source as current truth and the diagnostic report as potentially stale.
- Current product preview is `/#/screens/app`; `/` is the gallery. Main routes are in `src/main.tsx`, and new reusable visuals belong in the existing `src/gallery/registry.tsx` convention.
- Reuse `Stamp`, `Note`, `VoicePostcard`, `ParcelTag`, `FlipCard`, `ItemBack`, `Decor`, `AddFab`, `BoopFab`, `ScrapbookHeader`, `ScreenShell`, and the existing four canvas renderers. Avoid a third card implementation.
- AppShell already wires Home → book, profile, mailbox, AddFab → compose, IndexedDB save/load, and local BOOP stamps. Extend these paths rather than duplicating screens or storage.
- Canvas reference fidelity is governed by `docs/scrapbook-canvas-spec.md` and the files under `references/`; preserve measured frame/header/fab anchoring and each style's own scrolling/layout. The current dynamic-item overlay is a known incomplete seam.
- The source of truth for global safe-area tokens is `src/index.css`; canvas reference bottom safe area is 34px while global shell token is 32px. Do not conflate them.
- Do not treat static mailbox rows, `PROFILE_CONTRIBUTORS`, local profile mutations, localStorage, or IndexedDB as server-backed behavior or permissions.
- `src/App.tsx` is the old, unmounted item harness. It is not the product entrypoint.
- Fragile/high-coupling files: `AppShell.tsx` (many concerns/history/storage), `ScrapbookCanvasPage.tsx` (measuring and z-layer orchestration), AddFab's imperative engine (constructor-time options), and the separate fixture/dynamic placement models.
- Current build passes, lint fails at `HomeScreen.tsx:24`, and tests pass 16/16. Do not infer browser/API behavior from those checks.

## Quick reference

- **Product route:** `/#/screens/app`; **gallery:** `/#/`.
- **Active orchestration:** `src/screens/AppShell/AppShell.tsx`.
- **Current state:** integrated local prototype; no backend/auth/sync.
- **Core implemented flows:** Home/book navigation, 4 compose modes, IndexedDB save/load, 4 canvas presentations, mailbox placeholder, profile UI, BOOP picker.
- **Biggest gap:** dynamic memories are not placed/revealed inside style-native canvas content.
- **Validation:** build passed with large-chunk warning; lint failed at `HomeScreen.tsx:24`; 16 tests passed.
- **Audit commit:** `3600f9cd7a3603490dbdd709d0ac25def17b1847`.
- **Report:** `CODEBASE_STATE_REPORT.md`.
