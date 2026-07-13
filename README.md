# Smart Waste Management Dashboard - Cologne

React + Vite dashboard with a Python, FastAPI and SQLite backend for a city-wide smart waste bin prototype. The app connects to the local server and visualizes multiple smart waste sorting bins across Cologne, Germany.

Each simulated bin has Trash, Recycling, and Compost compartments, live fill levels, a map location, operational status, and route planning support.

## Features

- Responsive navigation with Overview, Smart Bins, Route Planning and Settings pages
- Persistent bin data and measurements in SQLite
- REST API for adding, deleting and inspecting bins
- Live city-wide WebSocket snapshot stream every 30 seconds
- Cologne map using OpenStreetMap tiles through Leaflet
- 20 simulated smart bin locations around Cologne
- Threshold filter for collection planning
- Summary cards for total bins, full bins, almost-full bins, average fill, and connection status
- Sortable smart bin table and individual detail views
- Backend route generation with a nearest-neighbor heuristic
- Multi-part Google Maps export for generated collection routes
- Custom collection route start points
- Reusable map, address search and manual coordinate location picker
- Demo settings for pausing updates and resetting all fill levels
- Straight-line Haversine distance estimate for the MVP route

## Environment

Create `.env.local` in the project root when you want to override the default city WebSocket URL:

```env
VITE_SMART_BIN_CITY_URL=ws://localhost:8181/ws
VITE_SMART_BIN_API_URL=/api
```

If the file is missing, the frontend defaults to `ws://localhost:8181/ws` and `/api`.

## Run The Demo

Install frontend and backend dependencies:

```bash
npm install
pip install -r requirements.txt
```

Start the backend and simulator:

```bash
npm run mock-server
```

The server provides REST endpoints and a WebSocket on port `8181`. Optional CLI arguments are:

```bash
npm run mock-server -- 8181 cologne-smart-bin-mock
```

Start the frontend in another terminal:

```bash
npm run dev
```

Open the Vite URL shown in the terminal, usually `http://localhost:5173`.

## Mock Data

`scripts/backend.py` sends one city-wide frame every 30 seconds and immediately after data changes:

- `city: "Cologne"`
- `device_group_id`
- `timestamp_ms`
- `bins`

The mock server simulates 20 stable locations around Cologne, including Koelner Dom, Koeln Hauptbahnhof, University of Cologne, Rheinauhafen, Neumarkt, Heumarkt, Stadtgarten, Deutz, Ehrenfeld, Nippes, Muelheim, Poller Wiesen, and Rheinpark.

Fill levels change only slightly during each update. Bin data, current fill levels and measurement history are stored in `data/smart-bins.db`.

Address search uses the public OpenStreetMap Nominatim service only when a search is submitted. Search requests are limited to one per second and biased towards Cologne.

## Threshold And Routes

The dashboard defaults to an 80% collection threshold. Move the “Include bins from fill level” slider to include bins where at least one compartment is greater than or equal to the selected value.

Click “Generate collection route” to build a route from the fixed Waste Collection Depot. The current route optimizer:

- starts at the depot
- visits the nearest unvisited included bin
- continues until every included bin is visited
- returns to the depot
- estimates total distance with the Haversine formula

This is an MVP approximation with straight-line distances. It does not call a paid API and does not need API keys. The route service can later be replaced with OSRM, OpenRouteService, Google Maps, or another routing engine.

## Notes

- Python 3.10 or newer is required for the backend.
- Raspberry Pi integration is intentionally not implemented yet.
- Real AI classification and authentication are intentionally out of scope for this prototype.
