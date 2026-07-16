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

### Review: JPG icons too large, wrong format

Problems found:
- Both JPG files were 672 KB each (bloated precache)
- JPEG lacks transparency support, not standard for PWA icons
- Missing apple-touch-icon link for iOS home screens

Fixes:
- Removed oversized JPGs (git rm)
- Generated proper PNG icons using System.Drawing (192x192: 4.4 KB, 512x512: 16.5 KB)
- Updated vite.config.ts: icons now reference PNG files, removed jpg from globPatterns
- Added apple-touch-icon link to index.html
- Build passes, precache now 10 entries (161.83 KiB total)

## storage branch

- Created src/types/db.ts with Node, Message, Handshake interfaces
- Created src/utils/db.ts with AetherDB class (extends Dexie)
  - nodes store: upsert, get, getAll
  - messages store: save, get, getPending, getExpired, markDelivered, deleteExpired
  - handshakes store: record, getRecent, getByNode
- Added TTL-based message expiration
- Installed fake-indexeddb for testing
- Created src/test-setup.ts with fake-indexeddb auto import
- Wrote 9 tests covering all store operations (all passing)
- Verified tsc and vite build pass

## Next: ui-shell branch

Will create the dark UI dashboard with Inbox, Outbox, and Find Peer panels.
