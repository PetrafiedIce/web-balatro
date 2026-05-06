# Lobby

Lobby is a Next.js 14 app router launcher for browser-playable LOVE games.

The first supported game is Balatro through the vendored MIT-licensed
`web-balatro` runtime. Lobby does not include, fetch, host, or distribute
Balatro game files. Users provide their own local `Balatro.exe`; the browser
extracts and patches it locally, then stores the built `vanilla` version in
IndexedDB for later launches.

## Development

```sh
npm install
npm run dev
```

## Build

```sh
npm run build
```

The app is intended for Vercel deployment. Cross-origin isolation headers are
configured in `next.config.mjs` for the love.js runtime.

## Credits

- `web-balatro` by W0W53R, MIT licensed. Vendored files live in
  `public/lib/web-balatro`.
- [love.js](https://github.com/2dengine/love.js) by 2dengine.