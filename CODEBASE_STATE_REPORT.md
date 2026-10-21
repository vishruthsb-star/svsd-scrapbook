# Codebase State Report

**Audit date:** 20 October 2026  
**Repository:** `SVSD_Vishruth_Cal`  
**Purpose:** Product, implementation, and engineering handoff for an assistant without repository access.

## 1. Executive Summary

This repository contains a visual prototype for a personal scrapbook product. Its premise is that memories shared by friends should feel like mail kept in a shoebox: a person's page contains hand-drawn photo stamps, handwritten notes, voice postcards, and link tags. A card-catalog-like Library offers a way to choose a friend's scrapbook, while an individual canvas arranges remembered items by month.

The intended users are a scrapbook owner and invited friends or visitors. The intended use cases are browsing a friend's memory collection, switching between friends, opening and flipping keepsakes, and eventually adding memories. The implemented experience is currently a front-end prototype: a Home view with sample people, a multi-style Journal canvas with fixture memories, and a component gallery for exploring UI. There is no application backend, authentication, real invitation flow, real scrapbook ownership, or persistence of scrapbook content. The gallery's older item board has local demo state and browser storage, but that should not be mistaken for product data.

The code includes substantial custom visual work: seeded SVG line art, four item types with shared flip/back/decor behavior, an animated Library, screen transitions, four canvas layouts, and a fan-shaped add control. The main product shell appears at `#/screens/app` from the gallery, not at `/`; `/` is the gallery index. The home and canvas screens are composed by `AppShell`, but current canvas props use sample data and a visitor view. The add button is displayed but has no selection callback in the integrated canvas. The development stage is best described as a detailed, interactive design prototype with core presentation flows implemented and product data/actions still mocked or absent.

## 2. Product Concept and User Experience

### Concept and intended flow

The product models social memories as physical-feeling artifacts instead of a conventional feed. The intended hierarchy is a home/library screen, a selected person's scrapbook, then individual artifacts that can be opened or flipped. The references also show an add flow intended to fan outward from a pill control, with choices for stamp, note, voice, or tag.

### Implemented journeys

1. **Open the prototype:** Navigate to the gallery root (`/`) and choose the App screen. The gallery mounts `AppShell`, which starts on Home.
2. **Switch Home and Journal:** Use the bottom tab bar. The two panels stay mounted and fade between visible states. The Journal currently shows the fixed torn-strata canvas for a visitor.
3. **Browse the Library:** Select a folder tab to animate the catalog. The initial selection is Priya. In the Home screen wiring, `onOpen` is not supplied, so selecting the already-active person does not navigate to a distinct scrapbook.
4. **Browse the canvas:** Scroll the monthly torn-paper strips and flip sample items. The other three styles can be inspected from gallery component previews, not selected from the product's Home or Journal UI.
5. **Explore component prototypes:** Gallery entries expose isolated components and canvas styles at fixed preview sizes. The older root-level `App.tsx` also contains richer test controls, file upload, sample board removal, and URL preview fetching; it is not mounted by `main.tsx`'s routes.

### Navigation and behavior

`src/main.tsx` uses `HashRouter`. Routes are `/` (GalleryIndex), `/screens/:id` (ScreenStage), and `/components/:id` (ComponentStage). `src/gallery/registry.tsx` currently lists one screen, `app`, and a set of component and style previews. Within AppShell, `HomeBottomNavigation` switches `home` and `journal` state without route changes. There is no account/auth navigation or server-backed routing.

The scrapbook item components implement click/tap flips and role-dependent sender/date privacy. VoicePostcard uses an HTML audio element when an audio source is provided. ParcelTag can open its link. The component gallery and legacy harness use supplied sample values rather than persisted entities. In `ScrapbookCanvasPage`, the add control is rendered for `view="visitor"`, but no `onSelect` is passed, so selecting an add kind does not start a creation flow.

### Product assumptions and documented UX decisions

`CLAUDE.md` and `docs/scrapbook-canvas-spec.md` establish conventions: use a 390-wide reference coordinate system centered in the live frame; all standard screens use `ScreenShell`; canvas pages instead use its bands-free canvas variant; safe-area tokens live in `src/index.css`; and the canvas styles use fixture-specific hand placements copied from reference designs. Item decorations are seeded to remain stable between renders. Reduced-motion preferences are observed for some transitions. These are implementation rules, not evidence of a deployed product decision or user research.

## 3. Repository Structure

```text
.
├── CLAUDE.md                         # Detailed product/design/implementation instructions
├── CODEBASE_STATE_REPORT.md          # This handoff
├── package.json / package-lock.json  # Scripts and dependencies
├── vite.config.ts                    # Vite, React plugin, @ -> src alias
├── tsconfig*.json / eslint.config.js  # TypeScript and lint configuration
├── index.html                        # Vite document shell
├── docs/
│   └── scrapbook-canvas-spec.md      # Canvas porting and layout constraints
├── references/                       # Standalone HTML/DC prototypes and source assets
├── public/
│   ├── aquarium.jpg                  # Legacy harness sample
│   └── scrapbook/                    # Canvas fixture JPEGs
├── src/
│   ├── main.tsx                      # React root and hash routes
│   ├── App.tsx / App.css             # Legacy item playground/demo board (not main route)
│   ├── index.css                     # Global fonts/tokens/reset
│   ├── types/index.ts                # Item/media/layout/geometry TypeScript types
│   ├── data/mock.ts                  # Home sample people and default canvas style
│   ├── assets/                       # Rose, icon, bundled font asset
│   ├── components/                   # Shared and feature UI components
│   │   ├── Library/                  # Animated card-catalog geometry and motion
│   │   ├── AddFab/                   # Imperative animated add-fan engine and wrapper
│   │   ├── ScreenShell/              # Mobile frame and safe-area behavior
│   │   ├── ScrapbookItem/, ScrapbookHeader/, ThemeNavigation/
│   │   └── Stamp, Note, VoicePostcard, ParcelTag, FlipCard, ItemBack, Decor, etc.
│   ├── screens/
│   │   ├── AppShell/                 # Home/Journal composition and transitions
│   │   ├── HomeScreen/               # Header, Library, invite section
│   │   └── CanvasScreen/             # Product-shell selection of canvas style
│   ├── scrapbook/
│   │   ├── canvas/                  # Shared canvas page, anchors, fixture rendering
│   │   │   └── styles/              # TornStrata, ThemeSpreads, EnvelopesLip, PaperWheel
│   │   └── fixtures/sampleItems.ts  # Twelve reference-derived sample memories
│   ├── gallery/                     # Gallery index, preview stages, registry
│   ├── utils/                       # Geometry, layout, image decoding, filters, helpers
│   └── data/
└── .claude/settings.local.json      # Local Claude configuration (not needed for product)
```

`node_modules/` and `dist/` are generated/dependency directories and omitted. The working tree also contains an unrelated untracked `Microsoft/Windows/PowerShell/ModuleAnalysisCache` file/tree; it is not part of the application architecture and was not included in this report.

## 4. Technical Architecture

### Stack and startup

- React 19, TypeScript 6, Vite 8, React Router 7 (`HashRouter`).
- CSS modules are not used; feature CSS files are imported alongside components.
- `src/main.tsx` imports fonts, mounts `ScrapDefs`, then renders routes under `StrictMode`.
- `vite.config.ts` configures `@` as an alias to `src`.
- No API client, backend SDK, database, authentication provider, or service integration is present. One legacy demo fetches Microlink's screenshot API directly.

### Composition and data flow

`main.tsx` → `GalleryIndex` → `ScreenStage` → `AppShell` → persistent `ScreenPanel`s → `HomeScreenShell`/`CanvasScreen` → feature components. AppShell owns the active bottom-tab value. HomeScreen passes constants from `data/mock.ts` into Header, Library, and InviteSection. CanvasScreen selects `torn-strata`, `visitor`, and top-right add placement. `ScrapbookCanvasPage` measures its frame/header (and sometimes add pill width), derives layout values, renders a `CANVAS_STYLES` entry, and mounts the shared add control.

The separate item-card system accepts explicit props (item identifier, seed, viewer, sender, date, media/text). `utils/geometry.ts` and `utils/layout.ts` compute seeded SVG and layout geometry. Item components combine those calculations with shared FlipCard, ItemBack, Decor, ScrapDefs, and RemoveButton components. The old `App.tsx` is a standalone harness for those components and not the active route tree.

### State and persistence

There is no global state library. React local state and props drive the screens. AppShell tracks the selected Home/Journal tab; Library supports controlled or internal selected state; card items hold local flip/play state; each canvas style handles local presentation interactions. The product Home's sample people and selected index are constants. Canvas styles draw the static `sampleItems.ts` fixture with hard-coded placements.

The only confirmed product-adjacent browser persistence is in unmounted `App.tsx`: the demo board's removed IDs are saved under `scrapbook-board-v1`. Uploaded files use temporary object URLs revoked on replacement/unmount. No account memory or scrapbook content is saved. The root app shell does pre-decode fixture photos with `utils/decodeImages.ts` to reduce first canvas paint delay.

### Core models

`src/types/index.ts` defines `StampMedia` (`image | video | empty`), `StampViewer` (`other | owner | self`), card geometry/layout shapes, and the discriminated `ScrapItem` union: stamp, note, voice, tag. The canvas fixture has a separate `SampleItemBase`/`MkResult` model in `src/scrapbook/fixtures/sampleItems.ts`, with type, text, date/year, sender, month (`m`), hand grouping, media and optional placement dimensions. The canvas page's `items` prop is currently `unknown[]` and unused; the fixtures are not wired through that prop. This is an architectural seam to resolve when connecting dynamic data.

## 5. Screens and Features Inventory

Status labels mean implementation visible in this repository; “Implemented” does not imply production service behavior.

| Name | Status | Purpose and implementation | Files / limitations |
|---|---|---|---|
| Gallery index | Implemented | Entry point for component and screen previews. | `src/gallery/GalleryIndex.tsx`, `registry.tsx`. This is the `/` route, not a polished end-user landing page. |
| App shell | Implemented (prototype) | Hosts Home and Journal panels, bottom tabs, transitions, and photo predecode. | `src/screens/AppShell/AppShell.tsx`, `AppShell.css`. State is local; no route/deep link per selected tab. |
| Home / Library | Partially implemented | Header, animated folder catalog, invite copy/link. Sample people and selected person are static. | `src/screens/HomeScreen/`, `src/components/Library/`, `Header/`, `InviteSection/`. Selecting a person updates Library selection only; no friend scrapbook selection/navigation. |
| Invite section | Partially implemented | Displays a generated-looking handle link and copy control. | `InviteSection.tsx/css`. Clipboard copy is real best-effort; invite button has optional callback but Home does not supply one. No invite/send workflow or real link validation. |
| Journal canvas, torn strata | Implemented as fixed fixture prototype | Monthly torn paper bands, labels, sample item arrangements, scroll. Integrated into AppShell as visitor. | `CanvasScreen.tsx`, `ScrapbookCanvasPage.tsx`, `styles/TornStrata/`, `sampleItems.ts`. Static fixture and hand placements; no live data or authoring. |
| Theme spreads | Implemented as preview prototype | Swipeable themed/panel layout and sample item presentation. | `styles/ThemeSpreads/`. Gallery only; not selectable in product shell. |
| Envelopes lip | Implemented as preview prototype | Envelope/month interaction fans items out and supports “Put them back.” | `styles/EnvelopesLip/`, `EnvelopePhone.dc.html`. Local presentation state only. |
| Paper wheel | Implemented as preview prototype | Drag/tap month wheel and transition between item groups. | `styles/PaperWheel/`, `WheelPhone.dc.html`. Local presentation state only. |
| Add memory fan | Partially implemented | Imperative animated add pill/fan with item-kind selection affordances and anchors. | `components/AddFab/`; canvas mounts it for visitor. Integrated screen provides no `onSelect`, so choices have no creation result. |
| Item cards (stamp, note, voice, tag) | Implemented as interactive components | Seeded visuals, flip/back face, viewer-dependent sender/date behavior, decorations; media/link/play controls. | `components/{Stamp,Note,VoicePostcard,ParcelTag}.tsx` and shared components. Gallery previews show them; canvas uses a different `ScrapbookItem` rendering path. |
| Legacy playground / board | Prototype only | Mixed item board, controls, localStorage removals, file uploads and Microlink preview fetching. | `src/App.tsx`, `App.css`. Not mounted in `main.tsx`; therefore not part of normal route flow. |

## 6. Component Inventory

| Component / group | Purpose, props, state, integration |
|---|---|
| `ScreenShell` | Centered fixed-width mobile frame, scroll container, safe-area bands. `variant="canvas"` removes bands/padding and leaves scrolling to canvas styles. Used by screens and canvas. |
| `AppShell` / `ScreenPanel` | Persistent Home/Journal panels with opacity transition, delayed `inert`/`aria-hidden` on exit, one-time enter animation and reduced-motion handling. Bottom navigation is overlaid at shell level. |
| `HomeBottomNavigation` | Two tabs (Home, Journal), keyboard navigation, selected styling and animated pill. Wired to AppShell state. |
| `Header` | Home greeting/title and send affordance. Used by Home. Any send action is presentation-only unless callback is passed. |
| `Library` | SVG folder/card-catalog with tabs, unread dots, configurable geometry and custom motion hook (`useLibraryMotion`). Controlled/uncontrolled selection and `onSelect`/`onOpen`. Integrated with mock people. |
| `InviteSection` | Rose doodle, link copy and invite button; component can receive `handle`/`onInvite`. Clipboard feedback is timed; invite callback is not wired from Home. |
| `ScrapbookHeader` | Back/title/avatar header. Back callback optional; current canvas does not supply one. |
| `ScrapbookCanvasPage` | Shared canvas stage, measures frame/header and add-pill width, passes dimensions/delta to style registry, mounts `SketchDefs` and AddFab. `items` prop is currently accepted but unused. |
| Canvas style components | `TornStrata`, `ThemeSpreads`, `EnvelopesLip`, `PaperWheel` each own layout and interaction shape; registry maps `CanvasStyle` strings to component renderers. They consume fixture data/placements and presentation state. |
| `ScrapbookItem` | Canvas-specific adapter/renderer for the fixture's four item kinds, applying item visuals and placement. Inspect it before changing canvas item behavior. |
| `AddFab` + `addFabEngine` | React lifecycle wrapper over imperative DOM/CSS/animation engine. Options are captured at construction; placement changes are separately applied. Host is pointer-events-none and controls opt back in. |
| `Stamp`, `Note`, `VoicePostcard`, `ParcelTag` | Standalone reusable scrap cards. Accept viewer/seed and item-specific text/media/link/audio; use deterministic geometry and common flip/back behavior. Voice card's audio UI requires actual audio source to play. |
| `FlipCard`, `ItemBack`, `Decor`, `RemoveButton`, `ScrapDefs` | Shared flip, privacy-aware reverse face, deterministic tape/clip/corner adornment, conditional remove control, SVG filters/patterns. Remove action only displays for self/owner when a callback is provided. |
| `ThemeNavigation`, `PillButton`, `SketchDefs` | Reusable navigation/pill/SVG definitions, available through gallery and/or canvas. |
| `GalleryIndex`, `ScreenStage`, `ComponentStage`, `ScrapbookStylePreview` | Development preview infrastructure; `registry.tsx` is the single gallery registration list. |

The repository has two overlapping item rendering systems: standalone card components (`Stamp`, etc.) and canvas `ScrapbookItem`. Avoid assuming that fixing one automatically changes the other.

## 7. Design System and Visual Implementation

- **Typography:** Fonts are loaded once in `src/main.tsx`: Shantell Sans (300/500), Barlow Condensed (400/500/600), DM Mono 400, and variable Inter. `src/index.css` exposes `--font-hand`, `--font-condensed`, and `--font-inter`. The item references and canvas use handwritten Shantell Sans; labels/navigation use condensed and UI uses Inter where appropriate.
- **Global tokens:** `src/index.css` defines safe-area values (`62px`, `32px`, `24px`), screen background `#faf7f0`, frame width `402px`, text colors, and link blue. `src/utils/filters.ts` contains item ink/paper/filter constants. Other feature colors are often local CSS or inline SVG values.
- **Layout:** `ScreenShell.css` centers a max 402px viewport and creates scroll/safe-area behavior. Canvas uses measured real frame dimensions while preserving 390px design coordinates, with `designX0` centering. `HomeScreen.css` owns specific section spacing; Home scales Library to fit available width.
- **Visual treatment:** Wobbly line art is generated with seeded geometry utilities and SVG filters/patterns. Item cards use consistent flip, back layout, and decorations. Canvas styles use torn paper, scrapbook textures, envelopes, or wheel layouts. CSS transitions and imperative AddFab motion implement movement; reduced-motion handling exists in several transitions.
- **Icons/assets:** Many icons are hand-authored inline SVG. `src/assets/rose.svg` drives the invite flower. `public/scrapbook/*.jpg` are fixture photos. Reference images and HTML/DC exports remain under `references/`.
- **Responsive/accessibility:** The shell is mobile-frame oriented and centers on wider viewports. Some controls have labels and tab semantics; AppShell panels use `inert`, `aria-hidden`, and roles; InviteSection provides keyboard copy and live status. Coverage is not comprehensive: inspect SVG/control labels and keyboard support before shipping. Several art layers are decorative SVG; some controls/callbacks are inert without parent wiring.

There is no single tokenized component library or formal design-token package. Global tokens and shared primitives exist, but much visual styling remains distributed by feature.

## 8. Reference Files and Implementation Fidelity

`CLAUDE.md` is unusually important and explicitly names sources of truth. `docs/scrapbook-canvas-spec.md` gives layout/porting constraints. The source files are the design references; matching component names alone does not establish fidelity.

| Reference | Meaning and current relationship |
|---|---|
| `references/Scrapbook Directions.dc.html` | Main canvas design export. `sampleItems.ts`, `TornStrata`, `ThemeSpreads`, and canvas styles port fixture data/layouts from it. Design spec says strip phone bezel/harness and use app shell/header. |
| `references/EnvelopePhone.dc.html`, `WheelPhone.dc.html` | Style-specific envelope and wheel details used alongside the main canvas reference. |
| `references/Item.dc.html` | Source for Note, VoicePostcard, ParcelTag and common item presentation. CLAUDE says Stamp instead follows `stamp-test.html`. |
| `references/stamp-test.html` | Documented source of truth for standalone Stamp behavior/layout. |
| `references/Scrapbook Add Button.html` | Source for `AddFab` engine/fan animation. The integrated page positions the control but does not implement creation callbacks. |
| `references/scrapbook-header.html`, `home-bottom-navigation.html`, `theme-navigation.html` | Visual sources for corresponding React components. |
| `references/InviteSection.dc.html`, `library-harness.html` | Design/harness references for invitation and Library. |
| `references/co Scrapbook.dc.html`, `co-scrapbook-v2.dc.html` | Board-level design context. CLAUDE documents that v2 adds an unimplemented card-catalog screen and imports item design rather than redefining its internals. |
| `references/CanvasPhone.dc.html`, `references/WheelPhone.dc.html` | Phone design/harness references for canvas variations; inspect alongside production styles when changing those layouts. |

Reference-backed details include fixture values and custom animation/geometry. No automated screenshot or pixel-diff validation was run. The report therefore cannot certify pixel-level parity. Static prototype assets in `references/` are not runtime assets unless imported/copied into `public/` or `src/`.

## 9. Data Models and Application State

The standalone item system's central union is:

```ts
type ScrapItem = StampScrapItem | NoteScrapItem | VoiceScrapItem | TagScrapItem;
type StampViewer = 'other' | 'owner' | 'self';
```

Each standalone item has a common `id`, deterministic `seed`, `viewer`, `senderName`, `date`, and optional caption. Kind-specific fields carry media, note text, audio metadata, or URL/preview. The actual canvas fixture has a separate type union and IDs (`beer`, `quiet`, `leh`, `film`, `v1`, `beach`, `dog`, `buses`, `soup`, `v2`, `anyway`, `snow`) with sender, date/year, month and hand grouping. Images are local JPEGs under `public/scrapbook/`.

State is local React component state. Important transitions include Home/Journal panel activation; Library selection; flip-card front/back; voice play/pause; open/closed add fan; envelope open/return; theme/month selection; and demo removal. Canvas content itself is fixture-based, not mutable application state. Only the legacy board's set of IDs is persisted in localStorage. Its temporary uploaded object URLs are resource-managed but not durable data.

## 10. Development Progress

### Accomplished

- Functional build and routing/gallery framework.
- Home and Journal prototype with tab transition and a custom folder Library.
- Four custom item card types and shared card behaviors.
- Four canvas style prototypes and reference-derived sample fixture.
- Responsive frame/safe-area abstractions and custom visual language.
- Imperative add-fan control and preview harnesses.
- Unit tests for canvas geometry/anchor logic and library geometry (12 tests currently pass).

### Partial/in progress by code state

- Home Library selection does not resolve actual friend pages.
- Invite and add controls have optional APIs but are not connected to actual operations.
- Canvas display is visitor-only in the shell, static and built around fixture-specific positioning.
- Multiple canvas designs are gallery previews, not user-selectable/persisted preferences.
- The domain types for standalone cards and canvas fixtures are separate and not unified.

### Experimental/legacy

The root-level `App.tsx` is a rich item playground with board, upload controls, localStorage remove/reset and a Microlink screenshot request. It is not referenced by `main.tsx`, while current app UI is registered as a Gallery screen. Treat it as a harness unless route wiring changes.

Git history was available. Recent commits include `eabf9ab` (“Change default scrapbook to torn strata design”), `f672144` (HomeBottomNavigation switching between Home and Canvas), and `b220a2c` (spacing/vertical scroll update). This supports that canvas selection and navigation were actively being developed, but does not establish broader product decisions or a complete chronology.

## 11. Known Issues and Technical Debt

### Confirmed from code

- No backend/auth/data service exists; users, dates and memories are constants/fixtures.
- Root path is a developer gallery rather than the product shell.
- Home's people list changes Library selection but is not connected to a corresponding scrapbook.
- `InviteSection`'s invite callback and `ScrapbookHeader`'s back callback are optional and not supplied in the shown product wiring.
- Canvas `items?: unknown[]` is documented as accepted but unused. Current style implementations use fixture/hand-coded placements.
- AddFab is mounted without an `onSelect` in `ScrapbookCanvasPage`, so the visible choice fan has no product action.
- Four style choices are not exposed in product navigation or persisted as user preference.
- Two item-rendering paths exist and may diverge: standalone card components and canvas `ScrapbookItem`.
- README is still the generic Vite template and does not explain the product; CLAUDE.md is the substantive guide.
- `App.tsx` behavior is not part of current routing; it is easy for developers to mistake it for the active app.
- `Microsoft/Windows/PowerShell/ModuleAnalysisCache` is an unrelated untracked item visible in `git status`; leave it untouched unless its owner clarifies otherwise.

### Potential risks to verify during future work

- Accessibility should be reviewed end-to-end for all pointer-driven canvas interactions, focus order, reduced motion, and SVG-only affordances.
- Microlink screenshot fetch in the unused demo depends on a third party, browser network/CORS behavior and remote service availability; it is not a production integration.
- Any new item/data flow must reconcile the canvas fixture shape with the `ScrapItem` union rather than assume they are interchangeable.
- Reference fidelity has no visual regression tooling in the repo, so CSS/geometry changes need deliberate preview comparison.
- Some hooks and imperative animation systems measure DOM/font sizes; font loading and resizing are important, especially around AddFab and canvas placements.

No TODO/FIXME markers were found in scanned `src`, `docs`, or `CLAUDE.md` content. That does not prove there are no unfinished features; the partial wiring above is visible without TODO markers.

## 12. Development Environment

### Commands

```bash
npm install
npm run dev       # Vite development server
npm run build     # tsc -b && vite build
npm run lint      # eslint .
npm test          # vitest run
npm run preview   # preview built dist output
```

No environment variables are required by the active app. The legacy playground makes a direct Microlink request for an optional URL screenshot preview. Static output is produced in `dist/`. Dependencies are declared in `package.json`.

### Validation run for this report

| Command | Result |
|---|---|
| `npm run build` | Passed; TypeScript project build and Vite production build completed. |
| `npm run lint` | Passed; ESLint reported no diagnostics. |
| `npm test` | Passed; 2 test files, 12 tests. |

These checks verify compile/lint/unit tests only. No browser/e2e or visual reference comparison was run.

## 13. Current State and Next Steps

The repository is a technically substantial front-end design prototype. The main Home-to-Journal presentation works with fixture content and a custom visual system. The path from presentation prototype to functioning scrapbook product remains open: identity, real friend/page selection, durable data, add/create flows, and invitations are not implemented.

Recommended priorities (recommendations, not documented roadmap):

1. Decide and document the intended product route/entrypoint (gallery-first or product-first).
2. Define real user, scrapbook, and memory entities and connect the Library selection to a page.
3. Choose a single canonical item model and adapt both card renderers or retire the duplicated path.
4. Wire the add fan to explicit creation screens/forms and persistence; ensure owner/visitor authorization behavior.
5. Wire invitation and back/navigation controls and define their actual destinations/actions.
6. Add integration/browser tests for navigation, item controls, responsive layouts, accessibility and reduced motion; consider screenshot baselines for reference-heavy design.

## 14. AI Development Handoff

Read these first before changing UI or behavior:

1. `CLAUDE.md` — repository-specific architecture and visual invariants.
2. `docs/scrapbook-canvas-spec.md` — canvas coordinates, safe areas and source-of-truth rules.
3. `src/main.tsx`, `src/gallery/registry.tsx`, `src/screens/AppShell/AppShell.tsx` — routes and active product composition.
4. `src/screens/CanvasScreen/CanvasScreen.tsx`, `src/scrapbook/canvas/ScrapbookCanvasPage.tsx`, `src/scrapbook/canvas/styleRegistry.tsx` — active canvas selection and shared shell.
5. `src/scrapbook/fixtures/sampleItems.ts` and `src/components/ScrapbookItem/` — canvas sample records and rendering.
6. `src/types/index.ts`, `src/components/Library/`, `src/components/AddFab/` — domain seam and complex interactions.

Preserve these conventions unless deliberately changing the design: one `ScreenShell` per screen; edit safe-area values only in `src/index.css`; register new preview entries through `src/gallery/registry.tsx`; keep sample data centralized; use seeded geometry to avoid visual jitter; retain shared item flip/back/decor abstractions; don't reimplement `AddFab` animation casually; and compare against the specifically designated reference file for the component being changed. The four canvas styles intentionally have different scrolling models, so a single generic scroller is not assumed.

Do not assume the gallery is the product UI, the legacy `App.tsx` is currently routed, fixtures are user data, an optional callback is connected, the add control creates anything, canvas `items` is consumed, a component's presence means it is integrated, or the reference exports are all runnable applications. Do not invent undocumented rationale or treat localStorage demo state as persistence architecture.

## 15. Evidence and Confidence

Primary evidence inspected includes:

- Startup/routing: `src/main.tsx`; route registration: `src/gallery/registry.tsx`.
- Product composition/transitions: `src/screens/AppShell/AppShell.tsx` and `AppShell.css`; screen wiring: `src/screens/HomeScreen/HomeScreen.tsx`, `HomeScreenShell.tsx`, `src/screens/CanvasScreen/CanvasScreen.tsx`.
- Canvas architecture: `src/scrapbook/canvas/ScrapbookCanvasPage.tsx`, `styleRegistry.tsx`, `constants.ts`, four `styles/*` modules, `src/scrapbook/fixtures/sampleItems.ts`.
- Models/data: `src/types/index.ts`, `src/data/mock.ts`.
- Components/styles: `src/components/`, `src/utils/`, `src/index.css`, `src/screens/*/*.css`.
- Product/design instructions: `CLAUDE.md`, `docs/scrapbook-canvas-spec.md`; reference exports and assets: `references/`.
- Environment and validation: `package.json`, `vite.config.ts`, `tsconfig*.json`, `eslint.config.js`, build/lint/test results recorded above.
- Available history: recent `git log` entries; current `git status` noted above.

**Confidence:** High for current routes, code-level wiring, available files, scripts, and test/build results. Medium for product intent where it is inferred from designs and copy rather than explicit requirements. Pixel-level fidelity, runtime behavior across browsers/devices, third-party preview availability, production deployment, and actual user experience could not be verified here. No account/backend behavior exists to validate. The report uses “intended” where support comes from design references/specification and “implemented” where source code demonstrates the behavior.

## 16. Quick Reference

### Product summary in five sentences

This is a scrapbook prototype built around memories represented as postal-style keepsakes. A Home screen presents a hand-drawn friend Library and invite section. A Journal screen displays fixture memories in a torn-paper monthly canvas, with three other canvas styles available as previews. Reusable stamp, note, voice, and link cards have custom visuals and interactions. The interface is much further along than its underlying product data, account, invitation, and authoring functionality.

### At a glance

- **Stack:** React 19, TypeScript 6, Vite 8, React Router 7, CSS, Vitest, ESLint.
- **Important directories:** `src/screens`, `src/components`, `src/scrapbook/canvas`, `src/scrapbook/fixtures`, `src/gallery`, `src/data`, `src/utils`, `references`, `docs`.
- **Screens:** Gallery; AppShell (Home and Journal tabs); Home/Library; torn-strata canvas. Theme spreads, envelopes lip and paper wheel exist as previews.
- **Major components:** Library, ScreenShell, HomeBottomNavigation, InviteSection, ScrapbookCanvasPage, ScrapbookItem, AddFab, Stamp, Note, VoicePostcard, ParcelTag, FlipCard, ItemBack, Decor.
- **Core data:** `ScrapItem` discriminated union for card components; separate `SampleItemBase`/`MkResult` canvas fixture model.
- **Status:** Interactive front-end prototype; no backend/auth or durable scrapbook content.
- **Top outstanding tasks:** Real data model and persistence; friend selection/page navigation; add flow; invitation behavior; canonical item model; accessibility/integration validation.
- **Commands:** `npm install`, `npm run dev`, `npm run build`, `npm run lint`, `npm test`, `npm run preview`.
- **Critical files:** `CLAUDE.md`, `docs/scrapbook-canvas-spec.md`, `src/main.tsx`, `src/gallery/registry.tsx`, `src/screens/AppShell/AppShell.tsx`, `src/screens/CanvasScreen/CanvasScreen.tsx`, `src/scrapbook/canvas/ScrapbookCanvasPage.tsx`, `src/types/index.ts`.
