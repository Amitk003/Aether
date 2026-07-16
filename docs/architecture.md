# Architecture

## Overview

Aether is a browser app that lets two devices talk to each other without internet or mobile networks. It uses sound and light to pass data between devices.

## How data flows

1. **Discovery** - Devices send out a high-frequency chirp (18-20 kHz) every 5 seconds. Nearby devices hear this chirp and know another device is close.
2. **Handshake** - Devices exchange their IDs and routing information using sound.
3. **Transfer** - Devices send messages by showing animated QR codes on screen. The other device's camera reads these QR codes.
4. **Forwarding** - If the recipient is not nearby, the message stays on the device until it meets another device that can pass it closer to the destination.

## Main parts

### Acoustic Layer (Sound)
- Uses frequencies between 18,000 Hz and 20,000 Hz
- Humans cannot hear these frequencies
- Used for: device discovery, exchanging small control data
- Built with Web Audio API

### Optical Layer (Light)
- Shows QR codes on the screen at 8-12 frames per second
- The camera on the other device scans these QR codes
- Used for: sending messages, files, and larger data
- Built with html5-qrcode library

### Storage Layer
- All messages are stored locally on the device using IndexedDB
- Uses Dexie library to make IndexedDB easier to work with

### Security Layer
- Every device has a public/private key pair
- Messages are encrypted so only the intended recipient can read them
- Uses browser's built-in crypto (window.crypto.subtle)

### Routing Layer
- Messages can hop through multiple devices to reach their destination
- Uses the PRoPHET algorithm to decide which messages to forward to which device
- Based on how often devices meet each other

## State Machine

The app follows this flow:
- IDLE -> DISCOVERY -> NEGOTIATION -> TRANSFER -> RESOLUTION -> IDLE
