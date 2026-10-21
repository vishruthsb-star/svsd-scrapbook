# BOOP Sticker Placement Implementation Report

## Root cause

BOOP stamps were created, persisted in localStorage, held in `AppShell` state, and passed through the shared canvas registry. Torn Strata was the only renderer that consumed them. Theme Spreads, Envelopes Lip, and Paper Wheel accepted neither sticker projection nor sticker target navigation.

## Implementation

- Added a shared dynamic-element projection layer that accepts both `PlacedMemory` and `PlacedBoopStamp` without changing either persistence model.
- Preserved BOOP's native SVG renderer, width, rotation, recipient text, and localStorage persistence.
- Namespaced BOOP target IDs (`boop:<id>`) so a sticker cannot collide with a memory target ID.
- Theme Spreads deterministically assigns and collision-packs stickers in a panel with memories/fixtures, then reveals the actual SVG wrapper.
- Envelopes Lip includes stickers in Winter envelope paging and the existing open/reveal mechanism at native sticker dimensions.
- Paper Wheel groups stickers by `createdAt` month, collision-packs them above the fixed wheel, expands content, selects the month, and reveals the real SVG wrapper.
- Torn Strata keeps its existing packing/rendering; its BOOP DOM target now uses the namespaced target ID.

## Winter-only prototype rule

`WINTER_ENVELOPE_INDEX` and `envelopeForElement()` centralize the temporary policy. Every dynamic memory and BOOP stamp projects into the existing Winter envelope, including restored records. Fixture envelope membership and fixture order remain unchanged. The Winter envelope retains six-item fan pages, so dynamic content remains accessible beyond the visible subset.

## Files modified

- `src/scrapbook/placement/dynamicLayout.ts`
- `src/screens/AppShell/AppShell.tsx`
- Torn Strata, Theme Spreads, Envelopes Lip, and Paper Wheel style components/geometry
- `src/scrapbook/canvas/boopPlacement.test.ts`

## Validation

- `npm.cmd run lint` — passed.
- `npm.cmd test` — passed, 5 files / 24 tests.
- `npm.cmd run build` — passed.

No browser test was run. Manual validation remains advisable for the 390 × 844 viewport, touch gestures, extreme collection density, and post-transition envelope reveal positioning.
