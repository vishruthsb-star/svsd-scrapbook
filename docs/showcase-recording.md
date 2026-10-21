# Showcase MP4 recording

`/#/showcase` has a developer-only recorder for the iPhone prototype. The live phone remains an interactive, CSS-scaled presentation: its 402 × 844 app iframe is clipped by the rounded device aperture and overlaid by the hardware image. That composition is intentionally never captured.

## Capture architecture

Record opens a separate same-origin **Scrapbook recording** browser window. It renders the exact product iframe at 3× its native logical dimensions: **1206 × 2532**. There is no bezel, presentation mask, controls, shadow, cursor layer, or rounded clipping in this page.

The browser asks the user to share a browser tab. Select the newly opened *Scrapbook recording* tab (not the showcase tab, a window, or the entire screen). The showcase uses `MediaStreamTrackProcessor` to acquire tab frames, WebCodecs `VideoEncoder` to encode AVC/H.264 at 28 Mbps/60 fps, and `mp4-muxer` to produce a genuine `video/mp4` container. Frames are encoded as they arrive rather than retained raw in memory. The finished MP4 downloads using the browser's normal download workflow as `scrapbook-demo-YYYY-MM-DD-HH-MM-SS.mp4`.

The selected source must report at least 1206 × 2532 pixels. The recorder refuses lower-resolution sources rather than upscaling a low-resolution preview. The physical showcase scale slider has no role in the capture path.

## Requirements and use

Use a current Chromium browser (Chrome or Edge) with WebCodecs and `MediaStreamTrackProcessor`; allow pop-ups and screen/tab capture.

1. Run `npm.cmd run dev`, then open `http://localhost:5173/#/showcase`.
2. Open the floating controls and choose **Record**.
3. In the browser chooser, select the newly opened **Scrapbook recording** tab. Keep its tab-share resolution at full quality.
4. Interact with the prototype in that recording window. It is the application itself, rendered at native export resolution.
5. Click **Stop Recording** in the showcase controls (the red REC/Stop pill remains visible when controls are collapsed). The capture window closes, the encoder flushes, and the MP4 downloads. **Download MP4** is retained as a fallback.

The resulting dimensions are 1206 × 2532, because this repository's actual product viewport is 402 × 844; these are the correct 3× dimensions (the 1170 × 2532 example in the brief applies to a 390 × 844 source).

## Limitations

Tab capture requires an explicit user selection and is a Chromium capability; Safari/Firefox currently do not offer this exact WebCodecs pipeline. Browser/OS policy can cap the shared tab's source resolution; such a capture is rejected with an actionable error. The capture window is deliberately separate so its tab has no phone chrome or controls; interactions performed in it share the same origin/storage but are not live-mirrored back into the decorative showcase iframe. Audio is not recorded in this volume.

For a later playback volume, insert the downloaded MP4 inside the existing `PhoneContent` area and let the live `PhoneMask`/frame supply rounded corners and hardware decoration.
