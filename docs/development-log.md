# Development Log

## main branch

- Initialized git repo
- Added remote: https://github.com/Amitk003/Aether
- Created .gitignore
- Created README.md
- Created docs/ folder with architecture.md, setup.md, development-log.md
- Created initial commit on main
- Renamed default branch from master to main
- Pushed main to remote origin
- Added research files to .gitignore to keep them out of the repo

## scaffold branch

- Created Vite + React + TypeScript project with PWA support
- Initial deps: react, react-dom, dexie, ggwave, html5-qrcode, qrcode
- Initial devDeps: vite, vitest, vite-plugin-pwa, vite-plugin-wasm, typescript, @vitejs/plugin-react
- Removed wirehair-wasm (Windows-incompatible postinstall script)
- Set up vite.config.ts with react(), wasm(), and VitePWA plugins
- Created dark theme CSS with CSS custom properties
- Created src/ folder structure: components, hooks, utils, types
- Verified: tsc and vite build pass
- Pushed scaffold branch to remote (5 commits)

### Technical decision: Removed WASM dependencies

Issues found during code review:

1. ggwave: WASM data-over-sound library is overkill for sending 16-byte handshakes. WebAssembly adds bundle size, async init states, and iOS Safari memory crash risk. We only need the Web Audio API (OscillatorNode, AnalyserNode) for simple FSK tones. Pure JS approach is ~80 lines, zero deps, zero crash risk.

2. vite-plugin-wasm: No longer needed since ggwave was removed. The build target was changed from 'esnext' to 'es2020' since we no longer need top-level await for WebAssembly.

3. wirehair-wasm: Already removed. It had a postinstall script using Unix commands (rm -rf) that fails on Windows. We will use simple chunk carousel for QR transfer instead of fountain codes.

Actions taken:
- npm uninstall ggwave vite-plugin-wasm
- Removed wasm() plugin from vite.config.ts
- Changed build target from esnext to es2020
- Removed .wasm from workbox glob patterns
- All builds still pass

### Code review fixes

Issues found and fixed during code review:

1. Missing svg in workbox globPatterns: Added 'svg' to the list. Without this, all SVG icons would break when running offline because the Service Worker would not cache them.

2. allowImportingTsExtensions in tsconfig.json: Removed this option. Importing with full .tsx extensions is bad practice and causes issues with other tools. All imports should use extensionless paths (e.g., import App from './App').

Actions taken:
- Added 'svg' to workbox globPatterns in vite.config.ts
- Removed allowImportingTsExtensions from tsconfig.json
- Verified no imports in the codebase use extensions (they don't)
- tsc and vite build both pass
- PWA precache count went from 5 to 6 entries (SVG now included)

## Next: storage branch

Will create IndexedDB schemas with Dexie for nodes, messages, and handshakes stores.

### Code review fixes - Part 2

Issues found and fixed during code review:

1. Missing PWA Manifest Icons: The PWA configuration was missing `icons` definitions in the manifest, which prevents mobile browsers from prompting to install the app or displaying a custom logo on home screens.
2. Missing jpg in workbox globPatterns: The PWA did not cache JPG files, meaning the newly added PWA icons would not be available offline.

Actions taken:
- Generated a futuristic neon app icon (`aether_logo.jpg`) using AI image generation.
- Copied it to `/public` in two standard PWA sizes: `pwa-192x192.jpg` and `pwa-512x512.jpg`.
- Added the `icons` array mapping these assets in `vite.config.ts`.
- Included `jpg` in `globPatterns` in `vite.config.ts`.
- Verified build and caching behavior.

## Next: storage branch

Will create IndexedDB schemas with Dexie for nodes, messages, and handshakes stores.
