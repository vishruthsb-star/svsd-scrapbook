# SVSD Vishruth Cal

An interactive React/Vite scrapbook prototype with a component gallery, standalone product preview, and framed iPhone showcase.

## Routes

- `/#/` — component gallery and isolated screen/component previews.
- `/#/screens/app` — the approved standalone scrapbook application.
- `/#/showcase` — the same live application in an interactive iPhone frame.

The showcase control in the lower-right corner opens a compact scale panel. Auto Fit is the default; the slider supports 50%–150%, and Reset restores Auto Fit. Its preference is stored only in the current browser's local storage.

## Development

```bash
npm install
npm run dev
npm run build
npm test
npm run test:e2e
```

## Deployment

This is a Vite static build. Deploy the repository to Vercel with `npm run build` as the build command and `dist` as the output directory. All application navigation uses `HashRouter`, so the three routes above are served from the root document and require no Vercel rewrites.

Browser-created memories and showcase preferences are local to each browser (IndexedDB/localStorage); they do not sync between devices.
