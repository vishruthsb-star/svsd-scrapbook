# Canvas Element Placement — Architecture Reconnaissance

**Scope:** read-only source investigation. This report is the only repository file created for this task; no implementation, test, configuration, or source changes were made. Source paths and line references below refer to the audited working tree on 2026-10-21. Runtime behavior was not manually reproduced in a browser.

## 1. Executive Summary

The live add flow is integrated through the app shell. `AddFab` reports a selected kind to `AppShell.openCompose`; the compose screen returns one of four payloads; `AppShell.completeCompose` builds a `PlacedMemory`, gives it a UUID and timestamp, saves it to IndexedDB, appends it to React state, sets a target ID, and closes compose. `CanvasScreen` forwards those records and target ID into the shared canvas page.

The four styles do not yet consume the same dynamic records. Torn Strata groups live memories by month, computes deterministic collision-aware placements alongside its fixture items, extends its paper strips to fit, renders created records with `ScrapbookItem`, and attempts to scroll its own container to the inserted DOM element. Theme Spreads, Envelopes Lip, and Paper Wheel still render hard-coded `sampleItems` fixture collections. Their props omit live items and target IDs, so saved memories do not enter those canvases. The generic `placeMemories()` utility exists but no active canvas imports it.

“Working reference” is qualified: Torn handles dynamic placement and a target reveal at source level, but boot-time restoration does not reset/retarget the scroll ID, the scroll selector interpolates an unescaped ID, and the target effect has no retry if the target is not found at its first animation frame. Repeated adds replace `scrollTargetId` with a fresh UUID, which is normally distinct. The page remains client-local: IndexedDB persistence is per browser/device, with no sync or backend.

The strongest architectural finding is a seam already partly present: shared creation, identity, persistence and target notification live in `AppShell`; grouping, geometry, capacity and navigation belong to each style. Sharing Torn’s complete geometry would be incompatible with Theme’s horizontal theme panels, Envelopes’ envelope/fan interaction, and Paper Wheel’s month selection and bottom-anchored disc.

## 2. Architecture Map

| Path | Responsibility / evidence |
|---|---|
| `src/components/AddFab/AddFab.tsx` | React wrapper around the imperative add fan; `onSelect` callback receives `AddFabKind` (lines 8–14, 48–79). |
| `src/components/AddFab/addFabEngine.ts` | Imperative fan rendering, gesture and selection behavior; receives callback through options. |
| `src/screens/AppShell/AppShell.tsx` | Product orchestration: selected recipient, compose, `createdItems`, `scrollTargetId`, IndexedDB load/save and canvas props (lines 131–145, 238–282, 305–312). |
| `src/screens/ComposeMemoryScreen/ComposeMemoryScreen.tsx` | Four compose modes and `ComposedMemory` union (`stamp`, `note`, `tag`, `voice`); screen invokes completion callback. |
| `src/screens/CanvasScreen/CanvasScreen.tsx` | Bridges shell to `ScrapbookCanvasPage`; passes style, `items`, target and controls (lines 13–15). |
| `src/scrapbook/canvas/ScrapbookCanvasPage.tsx` | Measures frame/header, mounts shared header/FAB/defs, selects renderer via registry (lines 112–181). It deliberately leaves scrolling to styles. |
| `src/scrapbook/canvas/styleRegistry.tsx` | Canvas style union, shared prop shape and dispatch to four components (lines 9–38). |
| `src/scrapbook/canvas/styles/TornStrata/TornStrata.tsx` | Dynamic records, DOM target marker and vertical target scrolling. |
| `src/scrapbook/canvas/styles/TornStrata/tornStrataGeometry.ts` | Fixture geometry plus month grouping, deterministic placement, strip growth and height calculation. |
| `src/scrapbook/canvas/styles/ThemeSpreads/ThemeSpreads.tsx` | Four fixture theme panels, horizontally snapping navigation, measured content height; no live memory props. |
| `src/scrapbook/canvas/styles/ThemeSpreads/themeSpreadsData.ts` | Static theme-panel labels, ink and fixture item IDs/positions. |
| `src/scrapbook/canvas/styles/EnvelopesLip/EnvelopesLip.tsx` | Static envelope interaction, measured fixture card dimensions and closed/open rendering. |
| `src/scrapbook/canvas/styles/EnvelopesLip/envelopesLipGeometry.ts` | Static seasonal item IDs, envelope grouping/fan and dynamic height from measurements. |
| `src/scrapbook/canvas/styles/PaperWheel/PaperWheel.tsx` | Static wheel labels/items, month selection by drag/tap, measured selected-item height. |
| `src/scrapbook/canvas/styles/PaperWheel/paperWheelGeometry.ts` | Static 12-month wheel geometry and fixture placement/scaling. |
| `src/scrapbook/placement/index.ts` | `PlacedMemory` shape and generic `placeMemories` algorithm. Search shows no active consumer; Torn uses its separate packing entry point. |
| `src/scrapbook/placement/compactPlacement.ts` | Shared bounds overlap and compact-placement utility consumed by Torn geometry. |
| `src/components/ScrapbookItem/ScrapbookItem.tsx` | Adapter from canvas fixture/dynamic props to existing Stamp, Note, VoicePostcard and ParcelTag components. |
| `src/scrapbook/persistence/localScrapbookStore.ts` | IndexedDB item/blob stores; save and recipient-indexed load. |
| `src/scrapbook/boopStamps.ts` | Separate BOOP stamp localStorage model; Torn renders them and they share target IDs, but they are not compose item types. |
| `src/scrapbook/fixtures/sampleItems.ts` | Fixture IDs, content and `mk()` geometry consumed by all static style layouts and Torn’s reference content. |
| `src/components/Stamp.tsx`, `Note.tsx`, `VoicePostcard.tsx`, `ParcelTag.tsx` | Reusable artifact renderers with shared flip/decor conventions. Canvas uses them via `ScrapbookItem`, not compose preview markup as the persisted renderer. |
| `src/components/FlipCard.tsx`, `Decor.tsx`, `ItemBack.tsx`, `RemoveButton.tsx` | Shared flip/back/decor/remove behavior for the artifact components. `ScrapbookItem` currently does not pass an `onRemove` callback. |
| `src/components/ThemeNavigation/ThemeNavigation.tsx` | Theme panel selector. |
| `src/components/ScreenShell/ScreenShell.tsx` | Screen/frame shell; canvas variant is bands-free. Style-specific scroll containers are inside renderers. |
| `docs/scrapbook-canvas-spec.md` | Reference-source conventions and explicit fixture-first historical scope; not proof that current product wiring is complete. |
| `CLAUDE.md` | Component and project conventions. Current source supersedes any stale architecture statements. |
| `CODEBASE_STATE_REPORT.md` | Recent product-state audit; broadly matches current code about IndexedDB and incomplete style-native dynamic placement. |

Legacy `src/App.tsx` is a demo harness and is not the live product flow. The active flow is routed through `main.tsx`/gallery into `AppShell`; the root gallery is not itself the scrapbook product screen.

## 3. Torn Strata — Working Reference

### End-to-end flow

1. `ScrapbookCanvasPage` mounts `AddFab` only for `view === 'visitor'`, with `onSelect={onAddSelect}`. `CanvasScreen` forwards the prop from `AppShell.openCompose`.
2. `openCompose(kind)` pushes browser history and sets `composeKind`. `ComposeMemoryScreen` displays the kind-specific form. Photo compose returns a File, caption and aspect ratio; note returns text; link returns title/URL; voice returns recorded Blob/duration. In source, successful compose invokes `onComplete` (`ComposeMemoryScreen.tsx`, `ComposedMemory` and screen dispatcher).
3. `completeCompose` guards concurrent saves with `savingRef`, creates `crypto.randomUUID()`, derives a deterministic numeric seed from that ID, and constructs a recipient-associated record with `createdAt`. Stamp/voice media gets a `media:<id>` key and a temporary object URL. It awaits `saveMemory`; only on success does it append state, set `scrollTargetId`, and close compose. Save failures log and alert; no state append occurs.
4. `loadMemories(recipient.name)` restores recipient records on recipient change. `saveMemory` stores structured records (with `src` omitted) and optional media blobs in IndexedDB; `loadMemories` recreates object URLs for media.
5. `CanvasScreen` passes recipient-filtered `createdItems` and `scrollTargetId` to `ScrapbookCanvasPage`, which passes both to the style selected by the profile presentation.
6. Torn’s `buildStrata(headerDelta, frameW, items, boopStamps)` groups memories by `createdAt` month. It adds a 142px grid-texture strip definition for each new month not present in the fixture definitions. Within each strip, fixture bounds are marked occupied and `packDynamicStrataItems` places sorted dynamic records using `findCompactPlacement`; placed dynamic bounds are then included when BOOP stamps are packed. Strip height includes the lowest dynamic/BOOP content and page height sums strips plus padding.
7. `TornStrata` renders each created record under a `data-scrapbook-item-id` wrapper and routes its kind through `ScrapbookItem`. It uses the item’s text/media/url/aspect ratio/author/date/seed and the shared flip-capable visual components.
8. `useLayoutEffect` schedules one animation frame, queries the Torn scroller for the target wrapper, checks whether it lies within safe top/bottom margins, and if necessary scrolls to center it. `prefers-reduced-motion` switches smooth scroll to automatic.

### Call flow

```text
AddFab selection
  → CanvasScreen.onAddSelect
  → AppShell.openCompose(kind)
  → ComposeMemoryScreen kind-specific submit
  → AppShell.completeCompose(payload)
      → UUID + seed + PlacedMemory
      → saveMemory(IndexedDB item + optional media Blob)
      → setCreatedItems([...items, item])
      → setScrollTargetId(item.id)
      → closeCompose()
  → CanvasScreen(items, scrollTargetId)
  → ScrapbookCanvasPage → CANVAS_STYLES[style]
  → TornStrata → buildStrata → packDynamicStrataItems
  → DOM wrapper [data-scrapbook-item-id]
  → layout effect / animation frame → Torn scroller.scrollTo(...)
```

### Placement facts and limits

- Positions are not saved in `PlacedMemory`; they are recalculated from ID, dimensions, creation time, active style and current frame on render. Thus switching canvas presentation changes presentation/placement, not the underlying record.
- `packDynamicStrataItems` sorts by creation time then ID, uses `z = .84`, estimates sizes by kind (stamp ratio influences height; note/voice/tag use fixed estimates), derives small deterministic rotation from ID, rotates the footprint for collision bounds and packs below the month label while treating fixture cards as occupied.
- `findCompactPlacement` searches candidate positions using occupied bounds and a seed. This is stronger than simple overlap-free rows, but the use of estimated sizes means long captions and actual rendered dimensions can still exceed estimates. Exact visual collision outcomes are not runtime verified.
- New records are grouped by month. The generic `theme` field is ignored by Torn. A first record in a new month creates a strip; multiple adds in a month share its dynamic placement set. Recalculation may move later records if ordering or viewport width changes.
- CSS positions item wrappers absolutely within strips; strip and parent content heights are explicit and computed in geometry. Strata are layered paper strips in reverse DOM order, so newer strips paint over older strips. Background tear texture is generated per strip and uses its computed height.
- Target scrolling is real-element based, and respects reduced motion. It is not a common navigation interface. A target that is absent at the effect’s frame is not retried. `scrollTargetId` is also retained after use; `lastTargetRef` prevents repeating an identical target on style remount. A newly generated UUID avoids same-ID repeats in ordinary add flow.
- The selector uses a quoted attribute selector built by string interpolation. UUIDs are selector-safe in practice; arbitrary externally supplied item IDs are not guaranteed safe. The target is only rendered in Torn. On load/reload there is no target set for the newest restored record.

## 4. Theme Spreads — Findings

**Architecture.** `ThemeSpreads` is selected by the style registry. It owns a horizontal scroller of four panels (`late-nights`, `laughing`, `trips`, `songs`) and a `ThemeNavigation` control. Each panel has a nested vertical content scroller and static reference item positions from `THEME_PANELS`; items are materialized by `mk(id, placement)` and rendered with `ScrapbookItem`. The panel page sizes to `max(frameH, measured lowest content + header delta + nav clearance)`. Its current component props do not include `items` or `scrollTargetId`.

**Intended layout as implemented.** Horizontal snapping/panel selection is the organizing model; each panel has hand-placed, two-to-four fixture content and can grow vertically based on actual measured child bottoms. Dynamic content requires a theme assignment/grouping and panel-specific geometry; there is no live-content mapping today.

**Insertion failure.** The shared compose flow reaches and saves data independently of the active presentation, and `CanvasScreen` forwards it. The style registry passes a common prop object, but `ThemeSpreads` destructures only `view`, header/frame values and design offset. It never maps `items`, so newly committed records are omitted from rendering. No evidence indicates a failed state update or persistence failure for a successful save. No live-item element exists for target navigation, and the component does not receive the target ID. Confirmed code-level omission; no browser reproduction performed.

## 5. Envelopes Lip — Findings

**Architecture.** `EnvelopesLip` and `buildEnvelopes` use `SE`, a fixed three-envelope array of fixture IDs, labels and seasons. Each envelope has a closed pocket state with up to four visible items and an open fan state of up to six. Clicking opens/closes; a “Put them back” action closes. `LipItemSlot` measures rendered fixture height and rotated top deltas; `buildEnvelopes` uses those measurements to compute closed envelope spacing and overall stack height. Props omit live items and target ID.

**Intended layout as implemented.** A vertical sequence of envelopes; opening one drops it into a six-item fan. Closed items occupy standing slots, while labels and a pocket lip define each section. `innerH` grows with the fixed sequence’s measured envelope footprints; while an envelope is open, it uses `frameH`. This structure does not provide an append operation for additional records.

**Insertion failure.** Records reach the shared style registry but are not consumed; `buildEnvelopes` only maps its constant fixture IDs. Therefore dynamic records do not become envelope contents and cannot have a target DOM wrapper. This is the confirmed omission. There is also a capacity mismatch: fixture envelopes contain five or six IDs, while the closed presentation hides items after the first four and open fan uses six; how records beyond six should map to envelopes/sections is not encoded. The geometry references fixed `sampleItems` dimensions/IDs and does not establish a product grouping rule for arbitrary live records.

## 6. Paper Wheel — Findings

**Architecture.** `PaperWheel` computes a twelve-position month wheel and selected-month content through `buildWheel`. The wheel’s labels can be selected by tap; dragging changes the effective month with pointer movement and vibration feedback. Geometry maps fixture item IDs to month indices and coordinates, then scales positions based on available vertical space. Items use `ScrapbookItem` inside `MeasuredItem`. The scroll container’s height includes selected visible items, while the wheel itself is fixed/bottom-anchored and overlays the scroll area. Props omit dynamic records and target ID.

**Intended layout as implemented.** Radial wheel navigation selects a month; that month’s fixture items appear above the wheel. The content scrolls vertically behind the disc, but month selection resets scroll to the top. The wheel is 12 months with static date labels and fixed radius/rise; this is not a conventional append-only vertical canvas. The current data only spans fixture months and geometry has no live month-index adapter.

**Insertion failure.** The style receives no live records in its component signature and `buildWheel()` maps the fixed `IDS` list. No inserted record is rendered or targetable. This is a confirmed omission. Also, month labels, `hasM`, empty-month copy, available-height scaling, and selected-month item visibility are all calculated from fixture metadata. Arbitrary additional records have no defined radial month slot, visual ordering or capacity behavior. Existing scroll reset on month change could conflict with target navigation unless navigation first selects the target’s month.

## 7. Four-Canvas Comparison Matrix

| Dimension | Torn Strata | Theme Spreads | Envelopes Lip | Paper Wheel |
|---|---|---|---|---|
| Main component | `TornStrata.tsx` | `ThemeSpreads.tsx` | `EnvelopesLip.tsx` | `PaperWheel.tsx` |
| Element data source | Fixture `ST` plus live `PlacedMemory[]` and BOOP stamps | `THEME_PANELS` and `sampleItems` fixtures | Constant `SE` fixture IDs and `sampleItems` | `IDS`/`IT` fixtures in `sampleItems` |
| Insertion handler | `AppShell.completeCompose` (shared) | Same handler; renderer ignores data | Same handler; renderer ignores data | Same handler; renderer ignores data |
| Layout mechanism | Vertical torn strips, absolute item wrappers | Horizontal panels with independent vertical scrollers | Vertical envelope stack, click-to-open fan | Radial month selector, selected-month items above wheel |
| Placement algorithm | Deterministic compact packing with rotated fixture bounds | Hand-authored fixture coordinates; no dynamic placement | Fixed slots/fan from fixture IDs; measured sizes | Fixed month-specific fixture positions/scaling |
| Dynamic content support | Yes for `PlacedMemory` and BOOP stamps at source level | None in renderer | None in renderer | None in renderer |
| Canvas sizing strategy | Sum computed strip heights + padding/FAB allowance | Per-panel measured content bottom + nav clearance | Measured fixed envelope footprint stack; frame height when open | Selected visible item bottom + wheel rise/safe clearance |
| Overflow handling | Computed paper/content height; vertical style scroller | Nested panel vertical scroll and horizontal snap | Vertical scroll stack; open view frame-sized | Vertical scroll behind fixed wheel; selected-month switch resets top |
| Scroll/navigation mechanism | Own vertical scroller; ID-based scroll after target | ThemeNavigation + horizontal `scrollTo`; no target navigation | Click envelope and smooth reset to top; no target navigation | Wheel tap/drag selects month; no target navigation |
| New element visibility | Rendered and target-scrolled for newly added item, subject to effect timing | Not rendered | Not rendered | Not rendered |
| Persistence behavior | Shared IndexedDB item/blob record; placement recalculated | Same shared store, though renderer omits records | Same shared store, though renderer omits records | Same shared store, though renderer omits records |
| Primary blockers | Estimated dimensions; no load-time reveal; target effect one-shot/no retry | No live item mapping, theme assignment, target contract | No live mapping or policy for more envelope sections/capacity | No live month assignment/selection/reveal contract |

## 8. Shared vs Canvas-Specific Responsibilities

**Already shared:** compose types and authoring UI; unique ID/seed/timestamp/recipient metadata; save/load API; React collection state; callback from add UI; target ID state; common style registry props; `ScrapbookItem` adapter; compact bounds-placement primitive. `PlacedMemory` stores content and identity, not canvas coordinates.

**Currently style-specific:** grouping (month/theme/envelope/wheel index), dimensions and orientation, placement/overlap, canvas background expansion, section capacity, scroll container, navigation/selection, and target visibility. Torn currently implements both its own placement and target navigation inside its renderer. The other styles do not consume the shared records or target.

**Reuse opportunities, not a design decision:** `PlacedMemory`, persistence and authoring can remain shared. `compactPlacement` may be useful for freeform canvas areas, but is not automatically appropriate for a wheel or envelope slot. A common “target item requested” signal is already present; a style-owned operation must map an ID to its panel/month/envelope and then reveal the actual rendered element. Measuring item DOM after render is more reliable for variable captions than the current generic size estimates.

**Risks of copying Torn wholesale:** its month strips, vertical packing and vertical `scrollTo` semantics conflict with theme panel grouping and horizontal navigation; envelopes need section assignment and open/fan capacity behavior; Paper Wheel must select a month and coordinate item content with a wheel that overlays the viewport. All would require substantial layout-specific adaptation.

## 9. Dynamic Canvas Growth

| Style | Current bounds and growth | Design implications / unknowns |
|---|---|---|
| Torn Strata | Strip heights grow to cover fixture, live packed-item and BOOP bounds. `strataPageHeight` adds 40px, plus AddFab/safe-area clearance in visitor mode. Tear SVG is generated at the computed height. | Vertical growth is implemented for dynamic records. Resizing can recalculate placement; existing positions are not persisted. Estimated `naturalSize` can undercount long text or actual media layout. Background texture/tear is regenerated at height. |
| Theme Spreads | Four panels have fixed frame width and base frame height, but each panel inner height grows to the real measured bottom plus `headerDelta`, fixed nav bottom, measured nav height and 24px. Grid SVG follows that height. | Vertical growth exists for static panel content; horizontal unit is a fixed four-panel theme set. Adding memories needs a decision on theme assignment and whether a new theme or additional panel is allowed. Panel ink SVG remains frame-height, while grid extends; source alone cannot establish how extra content should affect decorations. |
| Envelopes Lip | Closed envelope stack height uses measured fixture-card footprint and 44px gaps, plus safe-bottom and 24px clearance. It has three fixed envelopes. Open state resets content height to frame height and fans at most six items. | Current vertical growth accommodates the three existing envelopes only. Arbitrary growth likely means additional envelope sections or more content per fan, but intended product capacity/interaction is not encoded. Background SVG follows `innerH`; each body/pocket art is fixed-size. |
| Paper Wheel | Fixed 12-month, fixed-radius wheel (`RADIUS=246`, `RISE=198`); selected month’s item layer/scroll height uses measured visible fixture bottom. Disc and needle remain bottom-anchored; dot background follows content height. | Growth is tied to selected month content and scroll, not an assumption that the wheel itself expands. More records in a month could stack/pack above wheel, but no dynamic grouping/placement exists. More than 12 month sections would require a changed wheel metaphor/model; source does not specify it. |

All styles are within a frame measured by `ScrapbookCanvasPage` using `ResizeObserver`. Their scroll containers are separate and CSS-controlled. Transforms such as `headerDelta`, item rotation and wheel rotation mean wrapper coordinates and visible bounds differ. No evidence of dynamic responsive reflow for live item placement has been tested at 390px or other viewport sizes.

## 10. Automatic Navigation After Insertion

- `AppShell` sets an ID only after IndexedDB save succeeds. It does not clear the target on style change or restore a target from the latest loaded item.
- `ScrapbookCanvasPage` passes the ID through the shared registry props. Only Torn Strata declares/uses it. Other three component interfaces do not receive it.
- Torn queries its own `.torn-strata-scroll` for a wrapper marked with the ID. The actual target element is rendered before the layout effect; the extra `requestAnimationFrame` allows one layout frame. It checks safe margins and scrolls to center if needed, respecting `prefers-reduced-motion`.
- Potential timing limitation: if a target is missing on that frame (state race, style remount/transition, malformed ID), the effect returns and has no observer/retry. It sets `lastTargetRef` before checking target presence, so the same ID is not retried by a subsequent effect. On regular add, state append and target ID are batched after save and Torn renders them together, which likely makes the normal path work; this is code-based inference, not browser verification.
- Theme’s actual model offers horizontal panel navigation and a nested vertical scroller; target reveal would first need a panel decision. Paper Wheel may need to select a month before targeting the item and its current month change resets scroll. Envelopes may need to open the containing envelope (closed mode displays max four items, open fan max six). These are style-specific operations; a shared approximate coordinate or “scroll to bottom” is insufficient.
- Sticky/floating elements include the shared header, style-specific ThemeNavigation and AddFab/BOOP layers, and shell-level bottom navigation. Torn applies explicit safe top/bottom checks; no common offset contract exists for the other styles. Reduced motion is honored by Torn scroll only; other styles have their own smooth navigation and no insertion behavior to audit.
- No runtime test was run, so fixed UI occlusion, nested-scroll interactions, touch behavior, and real post-animation coordinates remain unverified.

## 11. Root-Cause Analysis

| Symptom | Root cause / strongest evidence | Files and location | Confidence | User impact |
|---|---|---|---|---|
| New memories do not appear in Theme Spreads | Renderer uses only static `THEME_PANELS` fixture IDs; component props/destructuring do not include live items. | `ThemeSpreads.tsx` lines 99–100, 135–206; `themeSpreadsData.ts` | **Confirmed** | Save can succeed while active canvas appears unchanged. |
| New memories do not appear in Envelopes Lip | `buildEnvelopes` maps constant `SE` fixture IDs; component has no live `items` or target prop. | `EnvelopesLip.tsx` lines 93–94, 117–; `envelopesLipGeometry.ts` lines 46–57, 123– | **Confirmed** | Added records are absent from envelope stack. |
| New memories do not appear in Paper Wheel | `buildWheel` maps constant `IDS` and fixture `IT`; component has no live data/target prop. | `PaperWheel.tsx` line 88 onward; `paperWheelGeometry.ts` lines 147–165 | **Confirmed** | Added records are absent from selected month. |
| Target reveal is unavailable in three styles | Registry shape carries target, but only Torn component consumes it. | `styleRegistry.tsx` lines 24–38; other renderer interfaces | **Confirmed** | User remains on current panel/month/envelope after successful save. |
| Theme group of a newly created record is unspecified | `PlacedMemory.theme` is optional, but compose does not set it; generic placer defaults missing theme to `late-nights`. Theme renderer does not call that placer. | `placement/index.ts`; `AppShell.tsx` `completeCompose` | **Confirmed** as missing metadata; product grouping intent **unknown** | Even after rendering is connected, no authoring/grouping rule is represented. |
| Torn layout can diverge from rendered dimensions | Geometry uses kind/aspect estimates; Stamp caption and other text sizing can be content-driven. No post-render placement correction exists for Torn. | `tornStrataGeometry.ts` `naturalSize`/packing; `CLAUDE.md` component size map | **Probable** | Long captions or unexpected media dimensions may overlap or exceed measured strip bounds. |
| Torn restore does not navigate to latest record | Load sets `createdItems` but does not set `scrollTargetId`; initial target is null. | `AppShell.tsx` load effect and state init | **Confirmed** | After refresh, restored content may be below the initial viewport with no auto-reveal. |
| Torn target effect may miss a delayed target | One RAF, then absent target returns; last target is recorded before selector check and there is no retry. | `TornStrata.tsx` `useLayoutEffect` | **Confirmed source limitation**, normal-path impact **unknown** | A timing/remount race could leave newly added item out of view. |
| Item removal is not connected in canvas adapter | `ScrapbookItem` supports `onRemove` optionally, but dynamic renderer does not pass it and shell has no remove-state handler. | `ScrapbookItem.tsx`; `TornStrata.tsx` dynamic render | **Confirmed** | Remove affordance may not appear for created records in this canvas route. |
| ID uniqueness assumes modern Web Crypto support | Compose directly calls `crypto.randomUUID()` without fallback; BOOP path has a fallback. | `AppShell.tsx` `completeCompose` vs BOOP handler | **Confirmed** | On unsupported/blocked environments creation can fail before save; browser support not runtime tested. |

## 12. Architectural Options

These are alternatives for review, not a selection or implementation plan.

| Approach | Reuse | Complexity | Regression risk | Canvas compatibility |
|---|---|---|---|---|
| Reuse Torn placement/rendering directly for all styles | Reuses `packDynamicStrataItems`, `ScrapbookItem`, and reveal code. | Low initial wiring, but high adaptation cost once styles need their own group semantics. | High: changes visual metaphors and may collide with fixture layouts or navigation. | Poor for Theme’s horizontal themes, Envelopes’ fixed pocket/fan interaction, and Paper Wheel’s radial month selector. Could be compatible only as a temporary freeform layer with explicit compromises. |
| Shared insertion pipeline with one placement/navigation strategy per style | Reuses compose/store/IDs/authoring/target notification; keeps group, geometry, growth and reveal style-owned. | Medium to high: style adapters need data and DOM measurement contracts; each requires independent capacity rules. | Medium: shared mutation path can be regression-tested while layout changes remain local; four renderers still need integration. | Strongest fit to existing separation and metaphors. It requires resolving theme and envelope grouping/capacity, and wheel month behavior. |
| Keep canonical content records and add style-specific derived projections at canvas boundary | Shared persistence remains presentation-neutral; each canvas derives a view model from the same records, with optional cached/explicit metadata if future requirements demand stable positions. | Medium: define projection inputs and rules, migrate/interpret legacy records, choose if any projection metadata is persisted. | Medium: per-style projection may change after resize/presentation switch; persisted position introduces migration/invalidation risk. | High if projection respects each native metaphor. Useful if deterministic placement across reloads/viewport changes is required; source does not establish that requirement. |

## 13. Implementation Dependencies and Risks

- Define the product grouping rule for Theme Spreads (user-selected theme, inferred theme, or fallback) and make sure compose carries it if required.
- Define whether Envelopes Lip may create additional envelope sections, how many records fit each, how empty/over-capacity sections behave, and the order in closed/open states.
- Define Paper Wheel’s record month source, month range behavior beyond its current 12 slots, and whether selecting a past/future month changes wheel geometry.
- Decide whether placement should be recalculated on each viewport/style change or persist per presentation. Today `PlacedMemory` stores no placement metadata; Torn placement is derived.
- Decide how missing/corrupt legacy media blobs and loaded records without placement metadata should be treated. Store loading is typed by cast and does not validate record schema.
- Establish a measured-dimension policy for caption growth, aspect ratio extremes, tags and voice cards. Torn uses estimated sizes; the other styles already contain measurement patterns for fixture items.
- Define a style navigation contract that can identify the item’s actual DOM node after selecting its section and waiting for animation/layout. Account for nested scrollers and style overlays.
- Resolve whether visitor-created records should have author-visible “self” item view. `ScrapbookItem.mapView` maps every visitor view to `other`; it does not compare `authorId` to current viewer.
- Wire any remove control/persistence behavior before exposing it as available; dynamic items currently do not receive the optional removal callback.
- Repeated saves are serialized only by a boolean guard; rapid extra submits while saving are ignored. Save state is not modeled as a per-item transaction, and object URLs are not clearly revoked on record replacement/unmount (not the focus of placement but relevant for repeated photo/voice additions).
- Resizing a frame changes style geometry and can change placements. Mobile 390px, short viewport, reduced motion, touch gestures, text growth, flipping and background expansion require validation. Existing fixture tests cover only selected Torn geometry/anchor behavior; no AppShell/persistence/e2e integration test was identified in the reports, and this task did not run tests.

## 14. Proposed Verification Checklist

This is a proposed matrix, not executed in this reconnaissance.

| Canvas | Stamp | Note | Tag | Voice postcard | Empty/multiple | Growth and navigation |
|---|---|---|---|---|---|---|
| Torn Strata | Add photo with portrait/landscape extremes and long caption; verify media and flip | Add short/long text; verify bounds | Add valid URL/title | Record, save, play | First item; rapid consecutive adds; mixed types; multiple months | New month strip; same month collision/stack; reload; switch style; resize; target safe area/reduced motion; BOOP coexistence |
| Theme Spreads | Verify actual theme assignment and item size | Verify panel placement and variable text | Verify URL interaction | Verify playback and panel placement | Empty panel and multiple records per theme | Horizontal panel selection followed by vertical item reveal; panel growth/background; sticky nav clearance; reload/resize |
| Envelopes Lip | Determine envelope membership and closed/open visibility | Measure long note bounds | Verify link controls while open | Verify playback without accidental envelope toggling | Empty book; >4 closed and >6 fan items; create new envelope policy | Stack growth; open the target envelope and reveal item; preserve 44px visual gap; animation settle; scroll/overlay behavior |
| Paper Wheel | Assign record to month and test image ratios | Text size/content | Tag URL behavior | Playback while wheel remains usable | Empty month; multiple items/month; months outside current 12 slots | Select target month, reveal actual item above wheel; content growth; scroll reset; wheel drag/touch conflicts; resize |

Across each case, verify IndexedDB round trip, duplicate ID handling, attribution/view rules, flip, pointer/touch interaction, actual DOM visibility (not only approximate coordinates), z-order, backgrounds/masks, reduced motion, repeated saves and user switching recipient. Distinguish local IndexedDB behavior from cross-device/server sync, which is absent.

## 15. Open Questions

1. Should a new memory’s theme be selected during compose, inferred from content, or assigned to a default panel?
2. Should Envelopes Lip grow by adding new envelopes, increasing per-envelope capacity, or changing the fan/closed interaction? What is its semantic grouping unit (season, date, author, or another rule)?
3. Does Paper Wheel show only a fixed year, roll across years, or create multiple wheels? What timestamp should control month placement?
4. Should layout metadata remain derived and responsive, or be persisted so a placed element stays in the same location after reload and viewport changes?
5. On restoration, should the app reveal the most recently added record, preserve last navigation selection, or open at the top/default selection?
6. Which viewer identity is available for distinguishing a visitor’s own contribution from other authors? Current model uses a prototype contributor ID.
7. Are existing fixture items intended to remain mixed with user memories in production, or are they preview-only once live data is available?
8. What are the target behaviors for an envelope/wheel item whose containing group is currently hidden or off-screen, especially during transitions?
9. Which runtime/browser matrix and mobile interaction acceptance criteria should be used? This repository alone does not establish successful microphone recording, IndexedDB behavior in constrained modes, or exact visual occlusion.
