# Compose UI diagnostic report

## 1. Executive summary

The implementation compiles, lints, and its existing 12 geometry/unit tests pass. That does **not** verify the add-memory journey. The most likely reason the expected UI is not visible at `http://localhost:5173/` is confirmed: the root hash route mounts the developer Gallery, not the product `AppShell`. The product is at `http://localhost:5173/#/screens/app`.

The four compose variants exist in one `ComposeMemoryScreen` module and are connected to the live AppShell through AddFab for the only active product canvas, torn strata. They are not separate routes. A selected AddFab kind updates `composeKind`, conditionally mounts an overlay, and hides the bottom navigation.

There are confirmed functional and rendering defects. Most importantly, the voice screen's close control resets its recording draft but never invokes AppShell's `onClose`, so it does not dismiss the full-screen overlay. Persisted/dynamic items also render in a fixed overlay outside every style's native scroll/group tree. This means TornStrata items can be clipped rather than expanding/scrolled with their month, and ThemeSpreads, EnvelopesLip, and PaperWheel do not actually integrate their dynamic items with their native navigation or grouping behavior.

Confidence labels below refer to source-level evidence. No browser DevTools, screenshot, console, network, microphone, or IndexedDB interaction was performed in this audit; Playwright is installed but no local browser automation harness is configured.

## 2. Expected UI vs actual implementation

| Expected | Actual | Status |
| --- | --- | --- |
| Opening localhost shows product journey | `/` renders `GalleryIndex` | Confirmed mismatch |
| Product route starts Home and supports Journal | `#/screens/app` renders `AppShell` | Confirmed |
| Four named compose screens | One conditional component with four internal functions | Functional equivalent, not four routed screens |
| Full-screen compose from AddFab | `AppShell` mounts `ComposeMemoryScreen` above canvas | Connected for TornStrata |
| Close all flows returns to canvas | Stamp/Note/Link delegate to parent; Voice only resets local draft | Confirmed Voice failure |
| Dynamic item enters each style's native structure | `ScrapbookCanvasPage` draws all dynamic items in one fixed absolute overlay | Confirmed failure for style-native behavior |
| Post-send reveal of target group | Overlay closes; no scroll, focus, highlight, wheel/spread/envelope navigation | Confirmed missing |

## 3. Live application routing map

| URL | Mounted component | What is visible |
| --- | --- | --- |
| `http://localhost:5173/` or `#/` | `GalleryIndex` | Developer gallery, **not** Home/Journal product UI |
| `http://localhost:5173/#/screens/app` | `AppShell` | Live Home + Journal application shell |
| `http://localhost:5173/#/components/compose-memory` | `ComposeMemoryScreen` | Standalone compose preview with internal kind tabs; no AppShell/AddFab/persistence integration |
| `http://localhost:5173/#/components/add-fab` | `AddFab` preview | Standalone fan, no completion callback |
| `http://localhost:5173/#/components/scrapbook-canvas-page-torn-strata-visitor` | Canvas preview | Fixture canvas only; no AppShell creation store |
| equivalent `theme-spreads`, `envelopes-lip`, `paper-wheel` component routes | Individual fixture previews | Do not receive persisted product items |

Evidence: `src/main.tsx:20-25` registers only Gallery, ScreenStage, and ComponentStage hash routes. `src/gallery/registry.tsx:27-34` registers `AppShell` as gallery screen id `app`, rather than as `/`.

## 4. Compose screen mount status

| Flow | Exists/CSS | Mount condition | State/reachability | Findings |
| --- | --- | --- | --- | --- |
| Photo/Stamp | `ComposeMemoryScreen.tsx:34-46`, imported CSS line 7 | `composeKind === 'stamp'` | picker, decode/load/error, caption, send | Mounted from AddFab; source uses browser object URL. Cancel file selection leaves prior state, which is reasonable. |
| Text/Note | line 48 | `composeKind === 'note'` | textarea, non-whitespace send | Mounted; real Note remains pointer-events-none behind textarea. Long text is capped at 420 but its underlying fixed Note can still visually overflow. |
| Link/Tag | line 50 | `composeKind === 'tag'` | link/title fields and URL check | Mounted; URL parser permits an added `https://` at submission but title remains optional. |
| Audio/Voice | line 52 | `composeKind === 'voice'` | `getUserMedia`, `MediaRecorder`, review | Mounted, but its CloseButton invokes `again`, not the parent close callback. Confirmed overlay cannot close with X. |

`src/screens/ComposeMemoryScreen/ComposeMemoryScreen.tsx:55` selects these variants. The gallery preview is the same React component, but it uses default recipient `maya`, internal debug kind tabs, and has no product completion handler.

## 5. AddFab integration status

**Confirmed connected for the active product canvas.** `ScrapbookCanvasPage.tsx:168-177` supplies `onSelect={onAddSelect}` to the existing engine-backed AddFab unchanged. `CanvasScreen.tsx:12-14` passes AppShell's callback. `AppShell.tsx:133-137` writes history state and updates `composeKind` unless another compose flow is already open.

User-visible limitations:

- The active product style is hard-coded to `torn-strata` in `CanvasScreen.tsx:14`. AddFab selection cannot be exercised in the product with the other three styles.
- A browser Back event simply sets `composeKind` to `null` (`AppShell.tsx:121-124`), preserving the mounted canvas but offering no confirmation for unsaved text/link drafts.
- There is no visible save-pending state. `savingRef` prevents a second storage call (`AppShell.tsx:143-144`), but the enabled Send button remains tappable while the first promise is in flight.

## 6. CSS and visibility issues

1. **Root route expectation mismatch** — confirmed. `main.tsx:22` mounts GalleryIndex at `/`; no global redirect points to AppShell. Impact: users who only open localhost see a gallery and may never reach AddFab/compose.
2. **Compose overlay is structurally above the app** — confirmed from CSS. `.app-shell-compose` is absolute/inset with z-index 300 (`AppShell.css`, final rule), above header/AddFab z-index 200; it should not sit behind the canvas. Browser inspection is still required to verify real stacking across filters/transforms.
3. **Compose coordinates are tied to a different layout context** — suspected. `ComposeMemoryScreen` wraps another default `ScreenShell` (`ComposeMemoryScreen.tsx:55`) inside the AppShell's absolute overlay. Its child `.compose-page` is absolute, while ScreenShell adds safe-area padding and opaque bands. Reference positions in `ComposeMemoryScreen.css` were copied as fixed values. This nested shell may shift/crop the composition depending on desktop/mobile viewport and needs visual inspection.
4. **No missing compose stylesheet import** — confirmed. `ComposeMemoryScreen.tsx:7` imports `ComposeMemoryScreen.css`; main imports the global font packages.
5. **Dynamic items can be hidden by clipping** — confirmed. `.scrapbook-canvas-page` has `overflow:hidden` (`ScrapbookCanvasPage.css:3-6`) and dynamic items are absolute children of its non-scrolling canvas overlay (`lines 16-22`). Placement y values beyond viewport height cannot be reached by TornStrata's internal scroll container.

## 7. Post-Send rendering and placement issues

Trace verified from source:

1. `ComposeMemoryScreen` calls `onComplete(memory)` — `ComposeMemoryScreen.tsx:55`.
2. `AppShell.completeCompose` builds a `PlacedMemory`, persists it, then appends it to local state — `AppShell.tsx:141-159`.
3. `CanvasScreen` filters those records by selected recipient and passes them to `ScrapbookCanvasPage` — `AppShell.tsx:174`, `CanvasScreen.tsx:12-14`.
4. `ScrapbookCanvasPage` calls `placeMemories(style, items, frame.w)` and maps all results to `ScrapbookItem` — `ScrapbookCanvasPage.tsx:144-160`.

Confirmed defects:

- **TornStrata grouping is not rendered inside chronological torn strips.** `placeMemories` groups by YYYY-MM, but each group restarts at y=150 (`placement/index.ts:9`), so two months' created items overlap in the same visual area. The TornStrata component never receives the collection.
- **Dynamic items are outside style scrollers.** They are siblings layered over `CANVAS_STYLES[...]`, not children of TornStrata's `.torn-strata-scroll`, ThemeSpreads panel scroller, EnvelopesLip scroll, or PaperWheel scroll. Consequently they do not participate in content-height expansion, scroll position, or native z-order.
- **No post-send reveal exists.** No ref, `scrollIntoView`, scrollTop update, active theme, open envelope, or wheel selection is updated after save.
- **ThemeSpreads integration: not complete.** The generic overlay uses `theme` only to calculate a group string. It does not select/append panels or navigate ThemeNavigation.
- **EnvelopesLip integration: not complete.** It does not create envelopes, assign native closed/fan slots, add overflow paging, or alter open state.
- **PaperWheel integration: not complete.** It does not drive the wheel's selected month or insert into the wheel's computed `items` list.

The current default TornStrata is therefore the closest visible integration, but it is still a fixed overlay rather than a strip-aware, scrollable insertion.

## 8. Persistence integration status

`src/scrapbook/persistence/localScrapbookStore.ts` creates IndexedDB database `svsd-scrapbook-v1`, item store `items`, blob store `blobs`, and recipient index.

Confirmed positives:

- `saveMemory` stores a structured item record and the optional stamp/voice Blob in one readwrite transaction.
- Persisted records deliberately omit the transient `src` field and `loadMemories` restores a fresh object URL from a blob.
- Persistence failure rejects `saveMemory`; AppShell catches it and does not append the item or close compose (`AppShell.tsx:154-162`).

Confirmed/suspected issues:

- **Source object-URL lifecycle is incomplete** — confirmed by code review. AppShell creates new object URLs for immediate rendering (`AppShell.tsx:150`) but does not revoke them when items are replaced, recipient changes, or AppShell unmounts. `loadMemories` creates more URLs (`localScrapbookStore.ts:8`) with no owner cleanup. Impact: long-running session memory leak.
- **No IndexedDB test coverage** — confirmed. Existing tests are only two files/12 tests, unrelated to persistence or compose flows.
- **Browser IndexedDB availability/quota/private-mode behavior** — suspected until browser testing. Errors are caught, but source audit cannot prove an alert is reachable or the database opens in the target browser.

## 9. Gallery and preview availability

The one compose preview is registered in `src/gallery/registry.tsx:40-47`, reachable at `#/components/compose-memory`. It uses the production `ComposeMemoryScreen` module, but only its standalone/default mode; it does not prove AddFab, recipient context, saving, persistence, or return-to-canvas behavior.

The style previews are fixture-only registry entries and do not receive `items`; no gallery preview currently demonstrates a newly created/persisted item in any of the four styles.

## 10. Confirmed bugs

| Finding | Evidence | Impact | Fix priority |
| --- | --- | --- | --- |
| Localhost root shows gallery, not product | `main.tsx:22` | Expected UI appears absent | P0 |
| Voice X cannot dismiss compose overlay | `VoiceCompose` in `ComposeMemoryScreen.tsx:52` uses `onClose={again}` | User can become stuck in voice compose except browser Back | P0 |
| Created TornStrata month groups overlap | `placement/index.ts:9` restarts y for each group | New items collide/are not chronological | P0 |
| Dynamic items are outside each style scroll/group tree | `ScrapbookCanvasPage.tsx:151-160` | clipping; no correct style-specific insertion/reveal | P0 |
| Other three styles are not product-selectable | `CanvasScreen.tsx:14` | claimed 16 combinations cannot be tested in app | P1 |
| No post-save reveal/navigation | no target-item navigation in AppShell/styles | saved item may not be visible | P1 |
| Object URLs leak | AppShell/load store create without lifecycle owner | long-session resource leak | P1 |
| Send has no visible in-flight disabled state | `savingRef` only | repeated-tap feedback/UX issue | P2 |

## 11. Suspected issues requiring browser verification

- Nested default ScreenShell around compose may misalign reference coordinates or clip bottom controls at short desktop viewport heights.
- AddFab press-hold-slide-release behavior was not exercised; source still uses the unmodified engine, but runtime behavior must be tested.
- `MediaRecorder`, microphone denial, and audio persistence vary by browser/codec.
- ParcelTag's external favicon request and actual link activation require network/browser checks.
- `crypto.randomUUID`, IndexedDB availability, and `URL.createObjectURL` need target-browser validation.
- No runtime console was captured; Vite served HTTP 200 successfully but this is not a React runtime inspection.

## 12. Recommended fixes in priority order

1. Decide/implement the intended root product entry route or clearly expose the App route from the gallery; the current root behavior is the primary discoverability failure.
2. Make all four close controls invoke AppShell's cancel callback; correct the Voice flow before further UI work.
3. Move dynamic item placement into each native style renderer. Start with TornStrata: append month-aware items to strip data, grow strip/content height, and scroll/reveal the inserted item.
4. Implement native ThemeSpreads, EnvelopesLip, and PaperWheel adapters before claiming all-style placement.
5. Add post-save target reveal using style-specific navigation/ref APIs.
6. Give Compose an explicit submitting state and disable Send/close appropriately while IndexedDB writes.
7. Centralize object URL ownership/revocation and add persistence integration tests.
8. Add gallery harnesses that pass deterministic generated memories into each style.

## 13. Exact files requiring changes

- `src/main.tsx` and/or `src/gallery/registry.tsx` — intended root/app access.
- `src/screens/ComposeMemoryScreen/ComposeMemoryScreen.tsx` and CSS — Voice close, submit state, nested-shell visual review.
- `src/screens/AppShell/AppShell.tsx` — save UI state, target reveal, URL cleanup.
- `src/scrapbook/placement/index.ts` — replace overlay coordinate-only behavior with group-aware layouts.
- `src/scrapbook/canvas/ScrapbookCanvasPage.tsx` and CSS — remove generic fixed overlay after style adapters own dynamic items.
- all four `src/scrapbook/canvas/styles/*/*.tsx` plus supporting geometry/data modules — native dynamic grouping/overflow/navigation.
- `src/scrapbook/persistence/localScrapbookStore.ts` — object URL ownership API and automated tests.
- `src/gallery/registry.tsx` / a dedicated preview harness — populated-style previews.

## 14. Manual reproduction steps

1. Run `npm run dev`; open `http://localhost:5173/`. Observe that this is the gallery.
2. Open `http://localhost:5173/#/screens/app` for the product shell.
3. Select a Library person, select Journal, then open AddFab. Test tap and press/hold/slide selection for each icon.
4. Verify Stamp, Note, and Tag X controls return to Journal. In Voice, press X: the source predicts it resets but leaves the compose overlay visible.
5. Submit a Note, then submit another after changing the device date/month if possible. In TornStrata, inspect whether both appear at the same y region rather than separate strips.
6. Refresh, revisit the same recipient, and test restored stamp/voice rendering and playback.
7. Open `#/components/compose-memory` to inspect the standalone compose views; use its lower-right kind tabs.
8. Open each canvas preview route from the Gallery and confirm it does not contain product-created records.

## 15. Remaining unknowns

- Exact visual offset/visibility on the user's browser and viewport.
- Console/runtime errors, font loading failures, and network request failures.
- IndexedDB/media persistence behavior under quota/private browsing.
- MediaRecorder/device permission behavior.
- Whether the AddFab imperative engine maintains its gesture behavior in the mounted canvas.
- Whether the user was opening `/`, `#/screens/app`, or an outdated Vite server when the UI seemed absent.
