# Aether

A browser app that lets you send messages to nearby devices. No internet. No WiFi. No Bluetooth. Just sound and light.

## How it works

Aether uses two things your device already has:

- **Sound** - Your speaker plays high-frequency tones (18-20 kHz) that nearby devices can hear. Humans cannot hear these tones. This is how devices find each other.
- **Light** - Your screen shows QR codes that change every second. The other device's camera reads these QR codes to receive messages.

Messages are encrypted so only the right person can read them. If the person you are messaging is not nearby, your device holds the message and forwards it when it meets another device that is closer to the destination.

## Why use Aether?

- Works in places with no internet
- No SIM card or mobile network needed
- No data charges
- Works on any phone or laptop with a browser
- Messages are private and encrypted

## What you need

- A phone or laptop with a browser (Chrome, Edge, Safari, Firefox)
- Speaker and microphone (for finding nearby devices)
- Camera and screen (for sending messages)

## Quick start

```bash
npm install
npm run dev
```

Open the app on two devices on the same WiFi network to test.

## Built with

- Vite + React + TypeScript
- Web Audio API for sound
- HTML5 QR code scanner for light
- IndexedDB (Dexie) for storing messages
- Web Crypto API for encryption
