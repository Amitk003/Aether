# Setup Guide

## Requirements

- Node.js 18 or higher
- npm 9 or higher
- A modern browser (Chrome, Edge, Safari, Firefox)

## Install

```bash
npm install
```

## Run in development mode

```bash
npm run dev
```

This starts a dev server at http://localhost:5173.

## Build for production

```bash
npm run build
```

This creates a dist/ folder with the built app ready to deploy.

## Test on another device

1. Run `npm run dev` on your computer
2. Find your computer's local IP address
3. On the other device, open http://YOUR_IP:5173 in the browser
4. Both devices need to be on the same WiFi network

## Run tests

```bash
npm test
```

## Check types

```bash
npm run lint
```

## Important notes

- Camera and microphone only work on HTTPS or localhost
- On iPhone, add the app to your Home Screen for best results (it works as a PWA)
- Keep the browser tab open and the screen on during data transfer
- The app works offline once you have opened it once (PWA caches all files)
