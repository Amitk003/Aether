# Architecture

## Overview

Aether is a browser app that lets two nearby devices send messages to each other without internet or mobile networks. It uses sound and light to pass data between devices.

## How data flows

1. **Discovery** - Devices send out a high-frequency chirp (18-20 kHz) every 3 seconds. Nearby devices hear this chirp and know another device is close.
2. **Handshake** - Devices show QR codes to each other. Each device scans the other's QR code to exchange identity and public keys.
3. **Transfer** - Devices send messages by showing animated QR codes on screen. The other device's camera reads these QR codes.
4. **Forwarding** - If the person you are messaging is not nearby, the message stays on your device until it meets another device that can pass it closer to the destination.

## Main parts

### Sound Layer
- Uses frequencies between 18,000 Hz and 20,000 Hz
- Humans cannot hear these frequencies
- Used for finding nearby devices
- Built with Web Audio API

### Light Layer
- Shows QR codes on the screen at about 1 frame per second
- The camera on the other device scans these QR codes
- Used for sending messages
- Built with html5-qrcode library

### Storage Layer
- All messages are stored on your device using IndexedDB
- Uses Dexie library to make IndexedDB easier to work with

### Security Layer
- Every device has a public/private key pair
- Messages are encrypted so only the right person can read them
- Uses the browser's built-in crypto

### Routing Layer
- Messages can hop through many devices to reach their destination
- Uses a seen-message blacklist to avoid sending the same message twice
- Messages have a hop limit of 10 to prevent infinite forwarding

## App states

The app goes through these states:
- idle -> discovering -> transferring -> resolving -> idle
