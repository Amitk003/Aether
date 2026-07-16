# Aether

A browser-based offline messaging app that uses sound and light to transfer data between devices. No internet, WiFi, or Bluetooth required for communication.

## How it works

Devices talk to each other using:
- **Sound** - High-frequency tones (18-20 kHz) for discovering nearby devices and exchanging small data
- **Light** - Animated QR codes on screen for sending larger messages

Messages are encrypted end-to-end and can hop between devices to reach their destination.

## Tech Stack

- Vite + React + TypeScript
- Progressive Web App (PWA) for offline use
- Web Audio API for sound transmission
- HTML5 QR Code scanner for optical transmission
- IndexedDB (Dexie) for local storage

## Getting Started

```bash
npm install
npm run dev
```

Open the app on two devices on the same network to test.
