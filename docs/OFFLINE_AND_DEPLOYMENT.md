# Web deployment and offline behavior

The GitHub Pages workflow tests and validates the app, builds it with `VITE_BASE_PATH=/teclaler/`, then publishes `dist` from `main` using GitHub Actions. The live site is [carlashub.github.io/teclaler](https://carlashub.github.io/teclaler/).

`npm run build` inserts every built file into the service worker's versioned precache list. This includes the three locale audio libraries, images, app code and manifest. A completed first visit installs the offline cache. Navigation requests try the network first and fall back to the cached app entry page. Other static requests use the cache first. A new build changes the cache version and replaces only TeclaLer's old caches.

To verify a release locally:

```powershell
npm ci
npm test
npm run validate:content
$env:VITE_BASE_PATH = '/teclaler/'
npm run build
npm run preview
```

The draft pt-PT recordings in `public/audio/pt-PT` are packaged for offline use. They still require human pronunciation review; the manifest marks them `needs_review`. `npm run validate:content -- --release` is intentionally stricter and will fail until child-facing audio has been approved.
