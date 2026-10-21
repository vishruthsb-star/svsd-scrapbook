# Canvas Placement Implementation Report

## Summary

The four scrapbook presentations now consume the same persisted `PlacedMemory` records. A successfully saved stamp, note, tag, or voice postcard is projected into the active style's native grouping/layout and is revealed by its actual DOM element. No persistence schema migration or duplicate per-style record was introduced.

## Architecture

`AppShell.completeCompose()` remains the single create/save path. The existing target ID is now acknowledged by the active style through `onScrollTargetHandled`, which clears the request after a bounded, DOM-based reveal attempt. This prevents a completed insertion from replaying after a presentation switch.

`src/scrapbook/placement/dynamicLayout.ts` provides deterministic shared projection helpers:

- theme fallback assignment from memory ID, while honoring a valid persisted theme;
- envelope fallback assignment from memory ID;
- Paper Wheel month-of-year assignment from local `createdAt` date;
- stable sorting, size estimates, rotation-aware bounds, and compact packing.

The helpers derive presentation only; canonical memories and IndexedDB records remain unchanged.

## Per-canvas implementation

### Torn Strata

- Retains month strips, fixture placement, BOOP support, and compact packing.
- Uses measured rendered dynamic-item heights to rebuild packing/strip bounds when actual content differs from the conservative estimate.
- Uses safe data-attribute matching rather than an interpolated selector and a bounded reveal retry.

### Theme Spreads

- Projects memories into one of the four existing panels with deterministic assignment.
- Packs dynamic items around fixture bounds and grows the panel/grid through the existing measured-bottom mechanism.
- Activates the correct horizontal panel, then reveals the target in that panel's own vertical scroller.

### Envelopes Lip

- Maps each dynamic memory deterministically into one of the three authored envelopes.
- Keeps each envelope's fixed visual fan but pages its complete contents in six-item subsets; closed envelopes keep their four-item preview model.
- Opens the target envelope, selects its page, and reveals the rendered target. Item interactions stop propagation so they do not close the envelope.

### Paper Wheel

- Groups dynamic memories by local calendar month, retaining the existing 12-position wheel and joining years by month-of-year.
- Packs live entries beneath the selected month's fixture arrangement and grows the scrollable dot-paper layer rather than the wheel.
- Selects the target month before reveal and suppresses the normal month-change scroll reset for that insertion navigation.

## Automatic navigation

Each created item has a stable `data-scrapbook-item-id` wrapper. `useTargetReveal` performs bounded animation-frame retries until the real element appears, calculates visibility using the owning scroller's safe header/bottom-overlay insets, respects reduced motion, and acknowledges the request only after finding the target or exhausting its bounded attempt budget. Target IDs are cleared after acknowledgement and when the user changes presentation.

## Dynamic content expansion

- Torn strips compute height from fixtures, packed live bounds, BOOP stamps, and measured live dimensions.
- Theme panel grids extend to each panel's measured lowest item.
- Envelope closed-stack height continues to derive from real visible-card measurements; paging prevents fan overlap growth.
- Wheel content height follows the selected month's lowest measured item while the disc remains bottom anchored.

## Data and persistence

The canonical `PlacedMemory` model and existing IndexedDB item/blob stores were not changed. Media source reconstruction, one-record-per-memory behavior, and existing fixture data remain intact. Grouping and coordinates are computed at render time, so one memory appears in each presentation without becoming multiple saved records.

## Modified files

- `src/scrapbook/placement/dynamicLayout.ts` — deterministic grouping, sizing, and packing helpers.
- `src/scrapbook/canvas/revealTarget.ts` — bounded safe DOM-target reveal helper.
- `src/scrapbook/canvas/{styleRegistry,ScrapbookCanvasPage}.tsx`, `src/screens/{CanvasScreen,AppShell}/...` — target acknowledgement plumbing.
- Torn Strata component/geometry — measured bounds and hardened reveal.
- Theme Spreads component plus `themeSpreadsGeometry.ts` — dynamic panel projection, packing, and navigation.
- Envelopes Lip component/geometry/CSS — dynamic envelope contents, six-item paging, and navigation.
- Paper Wheel component/geometry — month projection, dynamic packing, and navigation.
- `src/scrapbook/placement/dynamicLayout.test.ts` — focused deterministic grouping/packing coverage.

## Test results

Executed on 2026-10-21:

- `npm.cmd run lint` — passed.
- `npm.cmd test` — passed, 4 files / 19 tests.
- `npm.cmd run build` — passed.

No interactive browser pass was run in this implementation session. Vite reports the pre-existing large generated chunk warning only.

## Remaining limitations

- The new dynamic placements use conservative type/content estimates before DOM measurements arrive. Torn reconciles those measurements; Theme and Wheel obtain measured heights for growth, but dense visual-collision behavior with extreme media/caption combinations still merits browser validation.
- Envelope membership has no existing persisted group field, so the documented deterministic ID-hash fallback is used.
- Manual mobile/touch, media-load timing, reduced-motion, and long-collection validation remain required.

## Manual acceptance testing

1. Open each of the four presentations from a scrapbook profile.
2. Add a stamp, note, tag, and voice postcard in turn; confirm each save returns to the canvas and exposes the actual new artifact.
3. In Theme Spreads, confirm the correct panel activates and can scroll independently.
4. In Envelopes Lip, add more than six records mapping to an envelope, use previous/next, and confirm a newly added record opens on its page without card controls closing the envelope.
5. In Paper Wheel, add records across calendar months and confirm the wheel selects the target month; repeat with different years for the same month.
6. Add long text and portrait/landscape media, resize the frame, reload, and switch presentations; confirm the same records remain present with no automatic replay after switching.
7. Repeat under reduced motion and on touch input; verify fixed header, navigation, AddFab, and wheel/envelope interactions do not cover the revealed target.
