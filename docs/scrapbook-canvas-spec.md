# Scrapbook canvas spec

## Source of truth
references/Scrapbook Directions.dc.html (plus EnvelopePhone.dc.html and WheelPhone.dc.html where noted). "Exactly as designed" means: copy data arrays, SVG path strings, colours, sizes, easings, durations, z-order and DOM order VERBATIM from that file. Never retype a path or number from memory, and never "improve" a layout or animation. Run `grep -n` on the reference file to find each section.

## What to strip from the reference when porting
The reference draws a phone mock around every frame. Remove ALL of it:
- the 410x864 bezel (#0b0b0b, radius 58), the 48px screen radius, and the 9:41 status text;
- the reference's ScrapbookHeader placement (`top:52px; left:37.5px`) and its dc-import. Use the repo's existing ScrapbookHeader instead;
- the side-panel copy, harness sliders and labels (everything outside the 390x844 screen).
Keep only the content inside the screen.

## Screen frame and safe areas
- Design frame is 390 x 844. Follow the repo's existing page frame convention. Do not invent a scaling scheme.
- Safe areas: top 62, bottom 34, left/right 24.
- Header: the repo's ScrapbookHeader, top-aligned at 62 and centered. Its height is X (measure it, never hardcode).
- IMPORTANT, different from other pages: on canvas pages the safe areas are NOT masked. There is no solid band on top or bottom. The canvas background texture runs edge to edge over the full screen, and scrolling content stays visible as it passes under the header and into the safe areas. Do not add any opaque layer in the safe areas.

## Add button working rectangle
- left edge x = 24, right edge x = 390 - 24 = 366
- bottom edge y = 844 - 34 = 810
- top edge y = 62 + X + 20 (safe top + header height + 20px gap)
- An "alignment" means the pill's outer edge touches that edge of the rectangle:
  - bottom center: pill bottom at y=810, horizontally centered at x=195
  - top right: pill top at y = 62 + X + 20, pill right edge at x=366
- Derive the pill's anchor from the MEASURED pill size (height 52, width = content). Do not hardcode a center like the reference's placement table does.

## Add button visibility (viewer rule)
Pages take `viewer: 'self' | 'other'`. The add button renders ONLY when viewer === 'other'. In your own scrapbook (viewer 'self') the add button is not rendered at all and no space is reserved for it. Pass the viewer through to Item as well if Item supports it.

## Add button behaviour
Use the EXISTING repo AddFab. Do not change its fan animation, direction logic, arc re-aiming, springs, stagger, hold-and-slide-to-select, pick pulse, or icons. Only feed it placement props so its pill lands at the anchor above. The fan logic already picks direction per placement (bottom center: upward semicircle, spread 160, r 108, dir -90; top right: dir 135, spread 110, r 100) and re-aims to stay on screen. If the repo version clamps to hardcoded screen margins (reference values: side 38, top 74, bottom 806) instead of the working rectangle, report it. Do not silently rewrite it.

Scrim: when open, a warm ink scrim (rgba(46,32,18,.38) + backdrop blur 3px, 220ms fade) must cover EVERYTHING: the canvas, all scrapbook content, the ScrapbookHeader, the ThemeNavigation, and any "Put them back" button. Therefore the AddFab layer is mounted at the page root, as the last child, above the header's z-index (reference header z = 50; use z >= 200 for the fab layer). The fab layer itself is pointer-events: none except the pill and discs, so the canvas stays interactive when closed.

## Fonts (load once at app level)
- Shantell Sans, weights 300 to 500
- Barlow Condensed, 400/500/600
- Inter 400 (Add button and "Put them back" pill text)
The canvas root sets `font-family: 'Shantell Sans', cursive; font-weight: 300; color: #111111` (in the reference every screen inherits this from its section wrapper, so do not lose it).

## Shared SVG defs (mount ONCE per page in a hidden <svg width=0 height=0 style="position:absolute">)
Copy verbatim from the top of the reference:
- filter#ink (userSpaceOnUse x=-300 y=-300 w=2400 h=2400, feTurbulence fractalNoise baseFrequency .045 numOctaves 2 seed 3, feDisplacementMap scale 2.4)
- pattern#sd-grid (18x18), #sd-dot (16x16), #sd-lined (12x28), #sd-kraft (7x7)
Expose as <SketchDefs/>.

## Item
Use the repo's Item component. Same props as the reference's `dc-import name="Item"`: type, text, label, city, date, year, denom, dur, src, from, viewer, attach, rot, zoom. Base sizes (before zoom): stamp 150x196, note 200x170, voice 230x146, tag 124x200. Wrapper is `position:absolute; left:x; top:y` and nothing else. Flip, wobble and attach behaviour inside Item are untouched.

## Sample data
The reference's `IT` object (12 items: beer, quiet, leh, film, v1, beach, dog, buses, soup, v2, anyway, snow, each with m = month index and hand) is the fixture. Port it verbatim into a fixture file (e.g. `scrapbook/fixtures/sampleItems.ts`) and copy the referenced images from references/assets/ into the repo's asset location. Each page takes `items` and defaults to the fixture. Wiring real scrapbook data into the per-style placement is a later task: the reference places items by hand (hardcoded x/y/rot/zoom per item id), so for now each page uses those hand placements for the fixture ids.

## Header offset compensation
In the reference the header's bottom edge is at 113 (top 52 + 61). In the app it is at 62 + X. Define `delta = (62 + X) - 113`. Each style prompt says where to apply delta so the visual gap between header and content is identical to the reference. Report the computed delta.
