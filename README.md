# AI-Powered Smart Waste Sorting Bin Dashboard

This repository contains a React + Vite dashboard for a smart waste sorting bin prototype.
It includes a local mock WebSocket server that simulates live bin fill data for Trash, Recycling, and Compost compartments.

## What is included

- `src/hooks/useBinSocket.ts` — custom React hook for WebSocket connection and live frame history
- `src/config/bins.ts` — bin config using `VITE_SMART_BIN_URL`
- `scripts/mock-bin-server.mjs` — local WebSocket mock server emitting realistic fill-level frames
- `src/App.tsx` — responsive dashboard UI with status, compartment cards, alerts, and history

## Getting started

1. Install dependencies

```bash
npm install
```

2. Configure the local environment (optional)

Create a `.env.local` file in the project root with:

```env
VITE_SMART_BIN_URL=ws://localhost:8181
```

If you do not create `.env.local`, the app defaults to `ws://localhost:8181`.

3. Start the mock WebSocket server

```bash
npm run mock-server
```

4. Start the frontend

```bash
npm run dev
```

5. Open the app

Visit the URL shown by Vite, typically `http://localhost:5173`.

## Notes

- The dashboard displays live WebSocket connection status, device ID, WebSocket URL, and latest update time.
- Each compartment card shows fill level, a progress bar, status badge, and optional distance reading.
- Alerts are shown when compartments become `almost_full` or `full`.
- The mock server sends one frame per second and simulates gradual fill changes plus occasional waste insertion events.
- This frontend is ready to connect to a real Raspberry Pi WebSocket source later.
