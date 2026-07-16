# Development Log

## main branch setup

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
- Installed dependencies: react, react-dom, dexie, ggwave, html5-qrcode, qrcode
- Dev dependencies: vite, vitest, vite-plugin-pwa, vite-plugin-wasm, typescript, @vitejs/plugin-react
- Removed wirehair-wasm from deps (Windows-incompatible postinstall script; will use pure-JS LT fallback)
- Set up vite.config.ts with react(), wasm(), and VitePWA plugins
- Created dark theme CSS with CSS custom properties
- Created src/ folder structure: components, hooks, utils, types
- Verified: tsc --noEmit passes, vite build succeeds (PWA output with service worker)
- Pushed scaffold branch to remote (5 commits)

## Next: storage branch

Will create IndexedDB schemas with Dexie for nodes, messages, and handshakes stores.
