# Smart Waste Management Dashboard - Cologne

React + Vite dashboard for a city-wide smart waste bin prototype. The app connects to a local mock WebSocket server and visualizes multiple smart waste sorting bins across Cologne, Germany.

Each simulated bin has Trash, Recycling, and Compost compartments, live fill levels, a map location, operational status, and route planning support.

## Features

- Live city-wide WebSocket snapshot stream
- Cologne map using OpenStreetMap tiles through Leaflet
- 20 simulated smart bin locations around Cologne
- Threshold filter for collection planning
- Summary cards for total bins, full bins, almost-full bins, average fill, and connection status
- Table sorted with bins above the selected threshold first
- Frontend-only route generation with a nearest-neighbor heuristic
- Straight-line Haversine distance estimate for the MVP route

## Environment

Create `.env.local` in the project root when you want to override the default city WebSocket URL:

```env
VITE_SMART_BIN_CITY_URL=ws://localhost:8181
```

If the file is missing, the frontend defaults to `ws://localhost:8181`.

## Run The Demo

Install dependencies:

```bash
npm install
```

Start the mock city WebSocket server:

```bash
npm run mock-server
```

The server listens on port `8181` by default. Optional CLI arguments are:

```bash
npm run mock-server -- 8181 cologne-smart-bin-mock
```

Start the frontend in another terminal:

```bash
npm run dev
```

Open the Vite URL shown in the terminal, usually `http://localhost:5173`.

## Mock Data

`scripts/mock-bin-server.mjs` streams one city-wide frame every second:

- `city: "Cologne"`
- `device_group_id`
- `timestamp_ms`
- `bins`

The mock server simulates 20 stable locations around Cologne, including Koelner Dom, Koeln Hauptbahnhof, University of Cologne, Rheinauhafen, Neumarkt, Heumarkt, Stadtgarten, Deutz, Ehrenfeld, Nippes, Muelheim, Poller Wiesen, and Rheinpark.

Fill levels slowly increase over time. The server occasionally simulates waste insertion events and collection events where one or more compartments drop back to a low fill level.

## Threshold And Routes

The dashboard defaults to an 80% collection threshold. Move the “Include bins from fill level” slider to include bins where at least one compartment is greater than or equal to the selected value.

Click “Generate collection route” to build a route from the fixed Waste Collection Depot. The current route optimizer:

- starts at the depot
- visits the nearest unvisited included bin
- continues until every included bin is visited
- returns to the depot
- estimates total distance with the Haversine formula

This is an MVP approximation with straight-line distances. It does not call a paid API and does not need API keys. The route utility is isolated so it can later be replaced with OSRM, OpenRouteService, Google Maps, or another routing engine.

## Notes

- This project is frontend-focused.
- Raspberry Pi integration is intentionally not implemented yet.
- Real AI classification, authentication, and database storage are intentionally out of scope for this prototype.
