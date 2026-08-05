# Smart Bin - Raspberry Pi

`smartbin.py` runs on the bin itself. It does two independent jobs:

1. **Sorting** - when something comes close to the trigger sensor it takes a
   photo, has the AI classify it as Paper or Plastic and opens the matching
   flap with a servo.
2. **Fill-level reporting** - two more ultrasonic sensors sit in the lids and
   look down into the bins. Once per second their measurement is pushed to the
   dashboard backend over a WebSocket, where it replaces the simulated values.

Both run at the same time; the fill-level reporting lives in a background
thread and never blocks the sorting.

The dashboard those reports go to, the backend and the full bill of materials
are described in the [main README](../README.md). The printed parts are in
[`../printables/readme.md`](../printables/readme.md).

## Wiring

All sensors are HC-SR04 (5 V VCC, GND, TRIG, ECHO). **ECHO puts out 5 V and
must go through a voltage divider** (e.g. 1 kΩ / 2 kΩ) before it touches a Pi
GPIO, which is 3.3 V only.

| Function | Component | TRIG / Signal | ECHO |
|---|---|---|---|
| Trigger (object in front of the bin) | HC-SR04 | GPIO23 (Pin 16) | GPIO24 (Pin 18) |
| Fill level Paper -> section `recycling` | HC-SR04 | GPIO5 (Pin 29) | GPIO6 (Pin 31) |
| Fill level Plastic -> section `trash` | HC-SR04 | GPIO20 (Pin 38) | GPIO21 (Pin 40) |
| Flap Paper | SG92R servo | GPIO18 (Pin 12) | - |
| Flap Plastic | SG90 servo | GPIO17 (Pin 11) | - |
| Display | SBC-OLED01 (I2C, 0x3C) | SDA GPIO2 (Pin 3) | SCL GPIO3 (Pin 5) |

The pins are the `FILL_SENSORS` / `SERVO_PINS` constants at the top of
`smartbin.py`.

## Fill-level calibration

The distance from the sensor is converted into a percentage with two
constants in `smartbin.py`:

```python
BIN_EMPTY_CM = 55.0  # sensor -> bin floor, counts as 0 %
BIN_FULL_CM  = 7.0   # sensor -> waste surface when full, counts as 100 %
```

Measure both values once on the real bin and put them in. Each report is the
median of three pings, so a single bad echo does not show up in the dashboard.

## Setup

```bash
pip install -r requirements.txt

cp env.example ~/.kiconnect.env
chmod 600 ~/.kiconnect.env   # contains the API key
nano ~/.kiconnect.env        # fill in API key, camera and dashboard settings
```

The dashboard settings are:

| Variable | Meaning |
|---|---|
| `SMART_BIN_WS_URL` | Ingest socket of the backend, e.g. `ws://192.168.0.10:8181/ws/ingest` |
| `SMART_BIN_ID` | Which bin this Pi reports as - has to exist in the dashboard already |
| `SMART_BIN_INGEST_TOKEN` | Shared secret, must match the backend's `SMART_BIN_INGEST_TOKEN` |

Run it manually:

```bash
source ~/.kiconnect.env && python3 -u smartbin.py
```

Or as a service:

```bash
sudo cp smartbin.service /etc/systemd/system/
sudo systemctl enable --now smartbin
journalctl -u smartbin -f
```

## Behaviour when something is missing

Every peripheral is optional and the program keeps running without it: no OLED,
no camera, no servos, no `websocket-client`, no reachable dashboard. The
dashboard connection reconnects on its own with a backoff of 2 s up to 30 s, so
the Pi survives a backend restart without intervention.

This also covers failures at runtime, not just at startup: if a photo fails -
network camera unreachable, phone gone from the WLAN, CSI camera or
`rpicam-still` broken - the display shows `Camera error`, that trigger is
skipped and the program carries on. Fill-level reporting runs in its own thread
and is unaffected by camera or AI problems.

What each missing part costs you:

| Missing | Consequence |
|---|---|
| OLED | No display output, everything else works |
| Camera or AI key | No classification, no flap opens - fill levels still reported |
| Servos | Classification still runs and is shown, no flap moves |
| `websocket-client` or dashboard | No fill levels in the dashboard, sorting works |
| Fill-level sensor without echo | That compartment is skipped in the report, the other one is still sent |
