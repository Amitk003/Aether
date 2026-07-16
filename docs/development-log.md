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

## Next: storage branch

Will create IndexedDB schemas with Dexie for nodes, messages, and handshakes stores.
