import asyncio
import json
import math
import os
import re
import sqlite3
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from contextlib import asynccontextmanager, suppress

import uvicorn
from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from database import COMPARTMENT_KEYS, SmartBinDatabase
from route_service import generate_route


UPDATE_INTERVAL_SECONDS = 30
# Devices report about once per second - keeping every one of those frames would
# flood the measurements table, so history is thinned out to this interval.
HISTORY_INTERVAL_SECONDS = 30
DEVICE_GROUP_ID = os.getenv("SMART_BIN_DEVICE_GROUP", "cologne-smart-bin-mock")
# Shared secret for the device ingest socket. Empty means no check (local demo).
INGEST_TOKEN = os.getenv("SMART_BIN_INGEST_TOKEN", "")
simulation_enabled = True
database = SmartBinDatabase()
websocket_clients = set()
# Bins currently fed by a real device - excluded from the simulation.
live_bin_ids = set()
history_written_at = {}
nominatim_lock = asyncio.Lock()
last_nominatim_request = 0.0
nominatim_cache = {}


def create_frame():
    return {
        "city": "Cologne",
        "device_group_id": DEVICE_GROUP_ID,
        "timestamp_ms": int(time.time() * 1000),
        "bins": database.get_bins(),
    }


async def broadcast():
    frame = create_frame()
    disconnected = []
    for client in list(websocket_clients):
        try:
            await client.send_json(frame)
        except Exception:
            disconnected.append(client)
    for client in disconnected:
        websocket_clients.discard(client)


async def simulation_loop():
    while True:
        await asyncio.sleep(UPDATE_INTERVAL_SECONDS)
        if simulation_enabled:
            database.simulate_update(exclude_bin_ids=live_bin_ids)
            await broadcast()


@asynccontextmanager
async def lifespan(_app):
    task = asyncio.create_task(simulation_loop())
    try:
        yield
    finally:
        task.cancel()
        with suppress(asyncio.CancelledError):
            await task


app = FastAPI(title="Smart Bin Backend", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def error_response(message, status_code=400):
    return JSONResponse(status_code=status_code, content={"error": message})


@app.exception_handler(Exception)
async def handle_server_error(_request, error):
    print(f"Backend error: {error}", file=sys.stderr)
    return error_response("Internal server error.", 500)


def validate_bin(body):
    if not isinstance(body, dict):
        return None, "Invalid JSON body."

    bin_id = str(body.get("bin_id", "")).strip()
    label = str(body.get("label", "")).strip()
    district = str(body.get("district", "")).strip()
    try:
        lat = float(body.get("lat"))
        lng = float(body.get("lng"))
        levels = [float(body.get(key)) for key in ("trash_fill", "recycling_fill", "compost_fill")]
    except (TypeError, ValueError):
        return None, "Coordinates and fill levels must be numbers."

    if not re.fullmatch(r"[A-Za-z0-9-]{2,30}", bin_id):
        return None, "Bin ID must contain 2-30 letters, numbers or hyphens."
    if not label or not district:
        return None, "Name and district are required."
    if not math.isfinite(lat) or lat < -90 or lat > 90:
        return None, "Latitude is invalid."
    if not math.isfinite(lng) or lng < -180 or lng > 180:
        return None, "Longitude is invalid."
    if any(not math.isfinite(level) or level < 0 or level > 100 for level in levels):
        return None, "All fill levels must be between 0 and 100."

    return {
        "bin_id": bin_id,
        "label": label,
        "district": district,
        "lat": lat,
        "lng": lng,
        "trash_fill": levels[0],
        "recycling_fill": levels[1],
        "compost_fill": levels[2],
    }, None


def validate_reading(body):
    """Validate one measurement frame coming from a device (Raspberry Pi)."""
    if not isinstance(body, dict):
        return None, "Invalid JSON body."

    bin_id = str(body.get("bin_id", "")).strip()
    if not re.fullmatch(r"[A-Za-z0-9-]{2,30}", bin_id):
        return None, "Bin ID must contain 2-30 letters, numbers or hyphens."

    compartments = body.get("compartments")
    if not isinstance(compartments, dict) or not compartments:
        return None, "compartments must contain at least one section."

    readings = {}
    for key, value in compartments.items():
        if key not in COMPARTMENT_KEYS:
            return None, f"Unknown compartment '{key}'."
        if not isinstance(value, dict):
            return None, f"Compartment '{key}' must be an object."
        try:
            fill = float(value.get("fill_level_percent"))
        except (TypeError, ValueError):
            return None, f"fill_level_percent for '{key}' must be a number."
        if not math.isfinite(fill) or fill < 0 or fill > 100:
            return None, f"fill_level_percent for '{key}' must be between 0 and 100."

        distance = value.get("distance_cm")
        if distance is not None:
            try:
                distance = float(distance)
            except (TypeError, ValueError):
                return None, f"distance_cm for '{key}' must be a number."
            if not math.isfinite(distance) or distance < 0:
                return None, f"distance_cm for '{key}' must not be negative."

        readings[key] = {"fill_level_percent": fill, "distance_cm": distance}

    return {"bin_id": bin_id, "compartments": readings}, None


def validate_start_point(value):
    if value is None:
        return None, None
    if not isinstance(value, dict):
        return None, "Route start point is invalid."
    try:
        lat = float(value.get("lat"))
        lng = float(value.get("lng"))
    except (TypeError, ValueError):
        return None, "Route start point coordinates must be numbers."
    if not math.isfinite(lat) or lat < -90 or lat > 90 or not math.isfinite(lng) or lng < -180 or lng > 180:
        return None, "Route start point coordinates are invalid."
    label = str(value.get("label") or "Custom route start").strip()
    return {"label": label, "lat": lat, "lng": lng}, None


def fetch_nominatim_results(query):
    parameters = urllib.parse.urlencode({
        "q": query,
        "format": "jsonv2",
        "limit": 5,
        "countrycodes": "de",
        "viewbox": "6.75,51.1,7.2,50.75",
        "bounded": 0,
        "addressdetails": 1,
    })
    request = urllib.request.Request(
        f"https://nominatim.openstreetmap.org/search?{parameters}",
        headers={
            "User-Agent": "SmartBinDashboard-UniversityProject/0.1",
            "Accept-Language": "en,de;q=0.8",
        },
    )
    with urllib.request.urlopen(request, timeout=10) as response:
        return json.loads(response.read().decode("utf-8"))


@app.get("/api/bins")
async def get_bins():
    return create_frame()


@app.get("/api/bins/{bin_id}")
async def get_bin(bin_id: str):
    smart_bin = database.get_bin(bin_id)
    if smart_bin is None:
        return error_response("Bin not found.", 404)
    return smart_bin


@app.post("/api/bins", status_code=201)
async def add_bin(request: Request):
    try:
        body = await request.json()
    except ValueError:
        return error_response("Invalid JSON body.")
    bin_data, error = validate_bin(body)
    if error:
        return error_response(error)
    try:
        smart_bin = database.add_bin(bin_data)
    except sqlite3.IntegrityError:
        return error_response("This Bin ID already exists.", 409)
    await broadcast()
    return smart_bin


@app.delete("/api/bins/{bin_id}")
async def delete_bin(bin_id: str):
    if not database.delete_bin(bin_id):
        return error_response("Bin not found.", 404)
    await broadcast()
    return {"success": True}


@app.post("/api/routes")
async def create_route(request: Request):
    try:
        body = await request.json()
        threshold = float(body.get("threshold"))
    except (AttributeError, TypeError, ValueError):
        return error_response("Threshold must be between 0 and 100.")
    if not math.isfinite(threshold) or threshold < 0 or threshold > 100:
        return error_response("Threshold must be between 0 and 100.")
    start_point, start_error = validate_start_point(body.get("start_point"))
    if start_error:
        return error_response(start_error)
    return generate_route(database.get_bins(), threshold, start_point)


@app.get("/api/geocode")
async def geocode(request: Request):
    global last_nominatim_request
    query = str(request.query_params.get("q") or "").strip()
    if len(query) < 3:
        return error_response("Enter at least three characters for the address search.")
    cache_key = query.casefold()
    results = nominatim_cache.get(cache_key)
    if results is None:
        try:
            async with nominatim_lock:
                results = nominatim_cache.get(cache_key)
                if results is None:
                    wait_time = max(0, 1 - (time.monotonic() - last_nominatim_request))
                    if wait_time:
                        await asyncio.sleep(wait_time)
                    last_nominatim_request = time.monotonic()
                    results = await asyncio.to_thread(fetch_nominatim_results, query)
                    nominatim_cache[cache_key] = results
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError):
            return error_response("The address search service is currently unavailable.", 502)

    locations = []
    for result in results:
        try:
            locations.append({
                "place_id": result["place_id"],
                "display_name": result["display_name"],
                "lat": float(result["lat"]),
                "lng": float(result["lon"]),
            })
        except (KeyError, TypeError, ValueError):
            continue
    return {"results": locations}


@app.get("/api/settings")
async def get_settings():
    return {
        "simulation_enabled": simulation_enabled,
        "update_interval_seconds": UPDATE_INTERVAL_SECONDS,
        "device_group_id": DEVICE_GROUP_ID,
        "live_device_bin_ids": sorted(live_bin_ids),
    }


@app.patch("/api/settings")
async def update_settings(request: Request):
    global simulation_enabled
    try:
        body = await request.json()
    except ValueError:
        return error_response("Invalid JSON body.")
    enabled = body.get("simulation_enabled") if isinstance(body, dict) else None
    if not isinstance(enabled, bool):
        return error_response("simulation_enabled must be true or false.")
    simulation_enabled = enabled
    return await get_settings()


@app.post("/api/settings/reset-fill-levels")
async def reset_fill_levels():
    database.reset_fill_levels()
    await broadcast()
    return {"success": True, "message": "All fill levels were reset for the demo."}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    websocket_clients.add(websocket)
    await websocket.send_json(create_frame())
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        websocket_clients.discard(websocket)


@app.websocket("/ws/ingest")
async def ingest_endpoint(websocket: WebSocket):
    """Devices push their measured fill levels here. Every accepted frame is
    written to the database and immediately broadcast to the dashboards."""
    await websocket.accept()
    if INGEST_TOKEN and websocket.query_params.get("token") != INGEST_TOKEN:
        await websocket.close(code=1008)
        return

    claimed_bin_id = None
    try:
        while True:
            try:
                body = json.loads(await websocket.receive_text())
            except ValueError:
                await websocket.send_json({"ok": False, "error": "Invalid JSON body."})
                continue

            reading, error = validate_reading(body)
            if error:
                await websocket.send_json({"ok": False, "error": error})
                continue

            bin_id = reading["bin_id"]
            now = time.monotonic()
            record_history = now - history_written_at.get(bin_id, 0.0) >= HISTORY_INTERVAL_SECONDS
            updated = database.update_compartments(bin_id, reading["compartments"], record_history)
            if updated is None:
                await websocket.send_json({"ok": False, "error": f"Bin '{bin_id}' is not registered."})
                continue
            if record_history:
                history_written_at[bin_id] = now

            if claimed_bin_id != bin_id:
                live_bin_ids.discard(claimed_bin_id)
                claimed_bin_id = bin_id
                live_bin_ids.add(bin_id)

            await websocket.send_json({"ok": True, "bin_id": bin_id, "timestamp_ms": updated["updated_at"]})
            await broadcast()
    except WebSocketDisconnect:
        pass
    finally:
        live_bin_ids.discard(claimed_bin_id)


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8181
    if len(sys.argv) > 2:
        DEVICE_GROUP_ID = sys.argv[2]
    print(f"Smart bin server running on http://localhost:{port}")
    print(f"WebSocket available on ws://localhost:{port}/ws")
    print(f"Device ingest available on ws://localhost:{port}/ws/ingest")
    print(f"Updating fill levels every {UPDATE_INTERVAL_SECONDS} seconds")
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
