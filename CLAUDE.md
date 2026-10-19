# SVSD Vishruth Cal

## What this is

A hand-drawn, postal-ephemera-themed scrapbook app, built for a storytelling design
competition. The visual language is "mail you'd find in a shoebox": stamps, handwritten
notes, voice postcards, and tags — each rendered with wobbly, seeded hand-drawn SVG line
art rather than straight vector shapes.

Planned components: **stamp**, **note**, **voice** (postcard), **tag**. Only the stamp is
implemented so far.

## Stack

- Vite + React + TypeScript (strict-ish `tsconfig.app.json`: `noUnusedLocals`,
  `noUnusedParameters`, `verbatimModuleSyntax` — use `import type` for type-only imports).
- Plain CSS with CSS custom properties. No Tailwind, no animation libraries — transitions
  are hand-written CSS transitions/keyframes.
- Fonts: `@fontsource/shantell-sans` (body/handwriting) and `@fontsource/barlow-condensed`
  (condensed uppercase labels), already installed and imported in `src/main.tsx`.
- Deploys to Vercel as a static site (`vite build` output only — no server).

## Conventions

- One component per file, each with its own co-located CSS file
  (`ComponentName.tsx` + `ComponentName.css`), imported directly in the component.
- Shared, non-visual logic (seeded RNG, layout math, SVG filter defs) lives in
  `src/utils/*.ts`, not duplicated per component.
- Hand-drawn line art is generated, not hand-authored SVG paths: a seeded RNG perturbs
  straight lines/boxes/polygons so the same seed always draws the same "wobble".

## Reference files

These live in `references/` (note the literal spaces and `.dc.html` extensions — keep the
filenames exactly as given):

- `references/stamp-test.html` — a tested, working single-file preview of the Stamp
  component (geometry, layout, flip interaction, privacy-by-viewer behavior). **This file
  is the source of truth for the stamp.** When porting stamp logic into the React app,
  match this file's behavior exactly; if anything here conflicts with `Item.dc.html`,
  `stamp-test.html` wins.
- `references/Item.dc.html` — original design source for stamp, note, voice, and tag
  (template-style markup, not runnable React). Context only.
- `references/co Scrapbook.dc.html` — the design board these components come from.
  Context only.

## Status

Stamp component is ported into `src/components/Stamp.tsx` + `Stamp.css`, backed by
`src/utils/layout.ts`, `src/utils/geometry.ts`, and `src/utils/filters.ts`, with shared
types in `src/types/index.ts`. Note, voice, and tag components come later.
