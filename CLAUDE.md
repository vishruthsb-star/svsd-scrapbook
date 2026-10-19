# SVSD Vishruth Cal

## What this is

A hand-drawn, postal-ephemera-themed scrapbook app, built for a storytelling design
competition. The visual language is "mail you'd find in a shoebox": stamps, handwritten
notes, voice postcards, and parcel tags — each rendered with wobbly, seeded hand-drawn
SVG line art rather than straight vector shapes.

All four item kinds are implemented: **Stamp** (photo/video), **Note** (text),
**VoicePostcard** (audio), **ParcelTag** (link).

## Stack

- Vite + React + TypeScript (strict-ish `tsconfig.app.json`: `noUnusedLocals`,
  `noUnusedParameters`, `verbatimModuleSyntax` — use `import type` for type-only imports).
- Plain CSS with CSS custom properties. No Tailwind, no animation libraries — transitions
  are hand-written CSS transitions/keyframes.
- Fonts: `@fontsource/shantell-sans` (300/500, the handwriting body font) and
  `@fontsource/barlow-condensed` (400/500, condensed uppercase labels), imported once in
  `src/main.tsx`. Every component references them via the `--font-hand` / `--font-condensed`
  CSS variables declared in `src/index.css` — never hardcode the font stack elsewhere.
- Deploys to Vercel as a static site (`vite build` output only — no server).

## Conventions

- One component per file, each with its own co-located CSS file
  (`ComponentName.tsx` + `ComponentName.css`), imported directly in the component. The
  exceptions are the explicitly cross-item stylesheets (`FlipCard.css`, `ItemBack.css`,
  `Decor.css`, `Item.css`) — see below.
- Shared, non-visual logic (seeded RNG, layout math, SVG filter defs) lives in
  `src/utils/*.ts`, not duplicated per component. In particular:
  - `inkStrokeWidths(zoom)` (geometry.ts) — the `{thick, thin}` stroke widths every item
    computes from its `zoom` prop. Don't recompute `2/zoom`/`1.4/zoom` inline.
  - `censorWidthFor(width, px)` (layout.ts) — the back face's censor-bar width formula.
  - `mediaSlotLayout(width, ratio)` (layout.ts) — the fixed-width/clamped-ratio slot sizing
    shared by Stamp's photo slot and ParcelTag's preview slot.
  - `useMeasuredHeight(text, measureFn)` (useMeasuredHeight.ts) — the "measure from a
    hidden DOM mirror, re-measure on fonts-ready" pattern used by Stamp's caption and
    ParcelTag's link line.
  - `INK_FILTER_STYLE`, `DEFAULT_INK`, `FIELD_PAPER`, `FIELD_WHITE` (filters.ts) — the one
    place the ink filter's `style` object and the house ink/paper colors are defined.
    Always reference these instead of writing `'url(#ink)'` or a color literal.
- Hand-drawn line art is generated, not hand-authored SVG paths: a seeded RNG
  (`makeRng` in geometry.ts) perturbs straight lines/boxes/polygons so the same seed
  always draws the same "wobble". A few primitives are deliberately *not* wobbled — the
  ParcelTag's punched hole/string and the Note's torn-edge notches are static/fixed
  geometry (they represent hardware, not ink), matching Item.dc.html exactly.

## Component map

| Component | File | Draws | Size |
|---|---|---|---|
| `Stamp` | `components/Stamp.tsx` | photo/video slot + caption | 150×H (grows with caption) |
| `Note` | `components/Note.tsx` | handwritten text, fixed box (no auto-grow/clamp) | 200×170 fixed |
| `VoicePostcard` | `components/VoicePostcard.tsx` | waveform + play button wired to a real `<audio>` | 230×146 fixed |
| `ParcelTag` | `components/ParcelTag.tsx` | preview slot (reuses Stamp's slot math) + link line | 124×H (grows with slot/link) |

Shared infrastructure every item is built on:

- **`FlipCard`** (`components/FlipCard.tsx` + `.css`) — the tap/click-to-flip mechanism
  (perspective 1100px, 560ms cubic-bezier(.34,1.56,.64,1), visibility swap at 230ms).
  Every item renders its own front/back content and hands it to
  `<FlipCard front={...} back={...} .../>` rather than reimplementing the flip. Any
  interactive element inside front/back content (VoicePostcard's play button, ParcelTag's
  link) **must** call `e.stopPropagation()` in its own click handler, or the click bubbles
  up and flips the card instead of activating the control.
- **`ItemBack`** (`components/ItemBack.tsx` + `.css`) — the shared "to — owner / from —
  name-or-censor / date" back face, used by all four kinds (Item.dc.html renders this
  identically across types, varying only the card's own size/insets). Viewer rules:
  `other` censors the sender's name and hides the date; `owner` shows the sender's name
  and date; `self` shows "you" in place of the sender's name.
- **`Decor`** (`components/Decor.tsx` + `.css`) — wraps an item's `<FlipCard/>` with its
  random "stuck-on" embellishment (tape, a paperclip, or torn corners), chosen
  deterministically from the item's `seed` alone (`utils/decor.ts`, built on the same
  seeded RNG as the line art) — the user never controls it, and it never changes across
  re-renders of the same item. 0–2 pieces per item; some items get none. Decor sits
  outside the item's own clipped content (`overflow: visible`) so tape can overhang the
  card's edges, and it never rotates with the flip.
- **`ScrapDefs`** (`components/ScrapDefs.tsx`) — the shared `#ink` filter / `#h-d` hatch
  pattern, mounted once near the app root; every item and every `Decor` piece references
  these by id.
- **`Item.css`** (`components/Item.css`) — the cross-item CSS classes every kind's
  front/back layer draws on: `.item-lay` (the base stroke/line-art layer), `.media-slot`
  (+ its `img`/`video` rules, shared by Stamp's photo slot and ParcelTag's preview slot),
  `.media-chip` (the empty-slot label chip, shared by Stamp and ParcelTag).

## File map

```
src/
  types/index.ts         ScrapItem model + per-kind layout/geometry/media types
  utils/
    geometry.ts           makeRng, inkStrokeWidths, {stamp,note,voice,tag}Geometry
    layout.ts             mediaSlotLayout, censorWidthFor, {stamp,tag} layout + caption/link measuring
    decor.ts               pickDecor — seeded 0–2 tape/clip/corners pieces
    filters.ts             INK_FILTER_ID/STYLE, HATCH_PATTERN_ID, DEFAULT_INK, FIELD_PAPER/WHITE
    useMeasuredHeight.ts    shared "measure from hidden DOM, re-measure on fonts-ready" hook
  components/
    ScrapDefs.tsx           shared SVG <defs> (ink filter, hatch pattern)
    FlipCard.tsx/.css       shared flip mechanics
    ItemBack.tsx/.css       shared back face
    Decor.tsx/.css          shared seeded decor wrapper
    Item.css                shared front-layer classes (.item-lay/.media-slot/.media-chip)
    Stamp.tsx/.css
    Note.tsx/.css
    VoicePostcard.tsx/.css
    ParcelTag.tsx/.css
  App.tsx/.css              demo harness: a "board" (mixed scatter, all four kinds) plus a
                             playground + preset shelf per item kind
  index.css                 global reset, --font-hand/--font-condensed/--ink-link vars
```

## Reference files

These live in `references/` (note the literal spaces and `.dc.html` extensions — keep the
filenames exactly as given):

- `references/stamp-test.html` — a tested, working single-file preview of the Stamp
  component (geometry, layout, flip interaction, privacy-by-viewer behavior). **This file
  is the source of truth for the stamp.** When porting stamp logic into the React app,
  match this file's behavior exactly; if anything here conflicts with `Item.dc.html`,
  `stamp-test.html` wins.
- `references/Item.dc.html` — original design source for stamp, note, voice, and tag
  (template-style markup, not runnable React). Source of truth for Note, VoicePostcard,
  and ParcelTag (Stamp defers to stamp-test.html instead, per above).
- `references/co Scrapbook.dc.html` — the design board these components come from.
  Context only.

## Harness notes (App.tsx)

- Any file the harness turns into a `blob:` object URL (photo/video/audio uploads,
  ParcelTag preview uploads) is tracked in a ref and revoked both on replace (before
  assigning the new URL) and on unmount. A fetched ParcelTag preview (from the Microlink
  screenshot API) is a plain remote URL, not a blob — fetching one also revokes any
  previously-uploaded blob preview, since it's about to be replaced.
- The "Board" section's decor/tilt comes from `seededRot(seed)`, a deterministic jitter
  derived from the item's own seed (not `Math.random()`) — it never changes on re-render.
  Its global viewer toggle is independent of each playground section's own viewer state.
