#!/usr/bin/env python3
"""Smart-Bin: on proximity (< THRESHOLD_CM) takes a photo, sends it to the AI
API (KIConnect NRW) for waste classification and shows the result on the OLED.
It then opens the matching bin flap (Paper / Plastic) with a servo.

- Distance sensor: HC-SR04 on GPIO23 (TRIG) / GPIO24 (ECHO, via resistor).
  Raw measurement with RPi.GPIO + internal pull-down (robust, with timeouts).
- Camera: network camera (phone app "IP Webcam") via CAMERA_URL; falls back to
  the local CSI camera (picamera2) or rpicam-still if CAMERA_URL is unset.
- Display: SBC-OLED01 128x64 on I2C-1 (SDA Pin3 / SCL Pin5), address 0x3C.
- AI: photo -> OpenAI-compatible /chat/completions -> category + reason.
  Credentials come from environment variables (see env.example):
    KICONNECT_BASE_URL, KICONNECT_API_KEY, KICONNECT_MODEL, CAMERA_URL
- Images are stored with a timestamp in ~/captures/.
"""
import base64
import json
import os
import re
import subprocess
import urllib.request
import urllib.error
from datetime import datetime
from pathlib import Path
from time import sleep, time

import RPi.GPIO as GPIO

# --- Configuration ---
TRIG = 23
ECHO = 24
THRESHOLD_CM = 15.0    # trigger when distance is below this
PRE_PHOTO_S = 0.5      # wait after trigger before the photo (avoids motion blur)
NUM_PHOTOS = 1         # number of photos per trigger
COOLDOWN_S = 3.0       # lock-out after a trigger
MEAS_TIMEOUT_S = 0.03  # max wait per echo edge
RESULT_S = 5.0         # how long the result stays on the display
SAVE_DIR = Path.home() / "captures"

# Camera: picamera2 keeps the camera open (fast, <1 s/photo). Keep resolution
# moderate - enough for classification and small to upload. rpicam-still stays
# a fallback if picamera2 is missing.
CAMERA_SIZE = (1280, 960)
CAMERA_WARMUP_S = 1.5  # once at startup, for exposure/white balance

# Network camera (e.g. phone app "IP Webcam"): if CAMERA_URL is set, the photo
# is fetched via HTTP from there instead of the CSI camera.
# Example: CAMERA_URL="http://192.168.178.99:8080/shot.jpg"
CAMERA_URL = os.environ.get("CAMERA_URL", "")

# Servos (SG92R + SG90): one servo per bin/category.
# Motion: CLOSED (0 deg) -> OPEN (180 deg), hold SERVO_OPEN_S, then CLOSED again.
SERVO_PINS = {"Paper": 18, "Plastic": 17}
SERVO_FREQ = 50        # Hz - standard for hobby servos (20 ms period)
SERVO_CLOSED = 0.0     # closed end position (deg) - one edge
SERVO_OPEN = 180.0     # open end position (deg) - the opposite edge
SERVO_MOVE_S = 0.6     # time for the servo to reach the end position
SERVO_OPEN_S = 5.0     # how long the flap stays open

# AI API (from environment; defaults as fallback)
AI_URL = os.environ.get("KICONNECT_BASE_URL", "https://chat.kiconnect.nrw/api/v1")
AI_KEY = os.environ.get("KICONNECT_API_KEY", "")
AI_MODEL = os.environ.get("KICONNECT_MODEL") or "Mistral Small 3-2-24b Instruct KI:Inferenz.nrw"

CATEGORIES = ("Paper", "Plastic")  # only these open a bin
SYSTEM_PROMPT = (
    "You are a waste classifier for a smart bin. "
    "You get a photo. If it clearly shows a single waste item, classify it as "
    "EXACTLY one of: Paper, Plastic. "
    "If NO waste is visible - for example only a hand, an empty scene, or an "
    "unrelated object - use the category None. "
    "Reply ONLY with a JSON object in exactly this format, no other text, no Markdown: "
    '{"category": "<Paper|Plastic|None>", "reason": "<max 8 words, in English>"}. '
    "Choose exactly one category. Do not express uncertainty."
)

SAVE_DIR.mkdir(exist_ok=True)

# --- GPIO setup (internal pull-down keeps ECHO cleanly LOW at rest) ---
GPIO.setmode(GPIO.BCM)
GPIO.setwarnings(False)
GPIO.setup(TRIG, GPIO.OUT)
GPIO.setup(ECHO, GPIO.IN, pull_up_down=GPIO.PUD_DOWN)
GPIO.output(TRIG, False)
sleep(0.3)

# --- Servos (optional, fail cleanly) ---
_servos = {}  # category -> GPIO.PWM
try:
    _closed_duty = 2.5 + (SERVO_CLOSED / 180.0) * 10.0  # duty for the closed position
    for _cat, _pin in SERVO_PINS.items():
        GPIO.setup(_pin, GPIO.OUT)
        _pwm = GPIO.PWM(_pin, SERVO_FREQ)
        _pwm.start(_closed_duty)  # move to closed position at startup
        _servos[_cat] = _pwm
    sleep(SERVO_MOVE_S)       # time for both to reach the closed position
    for _pwm in _servos.values():
        _pwm.ChangeDutyCycle(0)  # pulse off -> servo quiet/power saving
    print(f"Servos ready: {[(k, SERVO_PINS[k]) for k in _servos]}")
except Exception as e:
    _servos = {}
    print(f"Servos unavailable ({e!r}) - continuing without servos.")

# --- OLED (optional, fails cleanly) ---
try:
    from luma.core.interface.serial import i2c
    from luma.oled.device import ssd1306
    from luma.core.render import canvas
    _oled = ssd1306(i2c(port=1, address=0x3C))
    _oled.contrast(255)  # full brightness - default was too dim on this panel
except Exception as e:  # OLED missing/broken -> program keeps running anyway
    _oled = None
    print(f"OLED unavailable ({e}) - continuing without display.")

# --- Camera (picamera2, open once and keep open) ---
try:
    from picamera2 import Picamera2
    _cam = Picamera2()
    _cam.configure(_cam.create_still_configuration(main={"size": CAMERA_SIZE}))
    _cam.start()
    sleep(CAMERA_WARMUP_S)  # one-time warmup - after that every photo is instant
    print("Camera ready (picamera2).")
except Exception as e:  # picamera2 missing -> fall back to rpicam-still
    _cam = None
    print(f"picamera2 unavailable ({e}) - using rpicam-still (slower).")


def oled_show(*lines):
    """Write several text lines to the OLED (silent if no display)."""
    if _oled is None:
        return
    try:
        with canvas(_oled) as draw:
            draw.rectangle(_oled.bounding_box, outline="white")
            for i, text in enumerate(lines[:4]):
                draw.text((6, 5 + i * 15), text, fill="white")
    except Exception:
        pass  # a display hiccup must never stop the core function


def oled_result(category: str, reason: str):
    """Category large + wrapped reason on the OLED."""
    lines = [category]
    cur = ""
    for word in reason.split():
        if len(cur) + len(word) + 1 <= 20:
            cur = (cur + " " + word).strip()
        else:
            lines.append(cur)
            cur = word
    if cur:
        lines.append(cur)
    oled_show(*lines)


def _angle_duty(deg: float) -> float:
    """Servo angle (0..180 deg) -> PWM duty in % at 50 Hz.
    0 deg ~ 0.5 ms (2.5%), 180 deg ~ 2.5 ms (12.5%)."""
    deg = max(0.0, min(180.0, deg))
    return 2.5 + (deg / 180.0) * 10.0


def servo_open(category: str):
    """Open the bin for the category: CLOSED -> OPEN, hold SERVO_OPEN_S, then
    CLOSED again. Does nothing if there is no servo for it."""
    pwm = _servos.get(category)
    if pwm is None:
        print(f"  no servo for '{category}' (_servos={list(_servos)})")
        return
    try:
        print(f"  servo '{category}' opening (GPIO {SERVO_PINS[category]})")
        pwm.ChangeDutyCycle(_angle_duty(SERVO_OPEN))   # fully open
        sleep(SERVO_OPEN_S)                            # hold open
        pwm.ChangeDutyCycle(_angle_duty(SERVO_CLOSED)) # close again
        sleep(SERVO_MOVE_S)
        pwm.ChangeDutyCycle(0)  # pulse off -> servo does not jitter / saves power
    except Exception as e:
        print(f"  servo error for '{category}': {e!r}")  # never stop the core function


def distance_cm():
    """One HC-SR04 measurement. Returns cm or None on timeout."""
    GPIO.output(TRIG, True)
    sleep(0.00001)  # 10us trigger pulse
    GPIO.output(TRIG, False)

    t = time()
    while GPIO.input(ECHO) == 0:
        if time() - t > MEAS_TIMEOUT_S:
            return None
    start = time()
    while GPIO.input(ECHO) == 1:
        if time() - start > MEAS_TIMEOUT_S:
            return None
    return (time() - start) * 34300 / 2  # sound there+back -> /2


def photo(path: Path):
    """Take a single image. Prefers a network camera (CAMERA_URL, e.g. phone
    app 'IP Webcam'); otherwise the open picamera2 camera (fast); finally falls
    back to rpicam-still."""
    if CAMERA_URL:
        with urllib.request.urlopen(CAMERA_URL, timeout=10) as r:
            data = r.read()
        with open(path, "wb") as f:
            f.write(data)
        return
    if _cam is not None:
        _cam.capture_file(str(path))
        return
    subprocess.run(
        ["rpicam-still", "-n", "--immediate", "-o", str(path)],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )


def classify(paths):
    """Send image(s) to the AI -> (category, reason).
    Falls back cleanly to ('Error', ...) on any failure."""
    if not AI_KEY:
        return ("Error", "no API key set")

    content = [{"type": "text", "text": "Classify the object in the photo."}]
    for p in paths:
        with open(p, "rb") as f:
            b64 = base64.b64encode(f.read()).decode()
        content.append({"type": "image_url",
                        "image_url": {"url": "data:image/jpeg;base64," + b64}})

    body = {
        "model": AI_MODEL,
        "temperature": 0,
        "max_tokens": 120,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": content},
        ],
    }
    req = urllib.request.Request(
        AI_URL.rstrip("/") + "/chat/completions",
        data=json.dumps(body).encode(),
        headers={"Authorization": "Bearer " + AI_KEY,
                 "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=90) as r:
            answer = json.load(r)["choices"][0]["message"]["content"]
    except Exception as e:
        print(f"AI error: {e}")
        return ("Error", "AI unreachable")

    # extract JSON from possible Markdown fences
    m = re.search(r"\{.*\}", answer, re.DOTALL)
    if not m:
        print(f"AI answer unparsable: {answer!r}")
        return ("Unknown", "answer unclear")
    try:
        data = json.loads(m.group(0))
        cat = str(data.get("category", "")).strip()
        reason = str(data.get("reason", "")).strip()
    except Exception:
        return ("Unknown", "answer unclear")

    # normalize category (tolerate spelling/language)
    norm = cat.lower()
    if norm.startswith("paper") or norm.startswith("papier"):
        cat = "Paper"
    elif norm.startswith("plastic") or norm.startswith("plastik"):
        cat = "Plastic"
    elif norm.startswith("none") or norm.startswith("nichts") or norm.startswith("kein"):
        cat = "None"  # no waste detected -> open no bin
    else:
        cat = "Unknown"  # nothing clear -> open no bin
    return (cat, reason or "-")


def capture_and_classify():
    stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    oled_show("Capturing...", f"{NUM_PHOTOS} photo")
    paths = []
    for i in range(1, NUM_PHOTOS + 1):
        path = SAVE_DIR / f"{stamp}_{i}.jpg"
        photo(path)
        paths.append(path)
        print(f"  saved: {path}")

    oled_show("Analyzing...", "AI running")
    category, reason = classify(paths)
    print(f"  -> {category}: {reason}")
    if category in SERVO_PINS:        # Paper/Plastic -> open the matching bin
        oled_result(category, reason)
        servo_open(category)
    elif category == "None":          # no waste detected (only a hand etc.)
        oled_result("No waste", reason)
    else:                             # Error / Unknown -> open nothing
        oled_result(category, reason)
    sleep(RESULT_S)


print(f"Ready. Triggers below {THRESHOLD_CM:.0f} cm. Ctrl+C to stop.")
oled_show("SMART BIN", "ready")
try:
    while True:
        d = distance_cm()
        if d is not None and d < THRESHOLD_CM:
            print(f"Object detected at {d:.1f} cm -> photo in {PRE_PHOTO_S}s")
            oled_show("Detected", "hold still...")
            sleep(PRE_PHOTO_S)  # brief wait so the image is not blurred
            capture_and_classify()
            print(f"  Cooldown {COOLDOWN_S:.0f}s ...")
            sleep(COOLDOWN_S)
            oled_show("SMART BIN", "ready")
        else:
            sleep(0.1)
except KeyboardInterrupt:
    print("\nStopped.")
    oled_show("Stopped")
finally:
    for _pwm in _servos.values():
        try:
            _pwm.stop()
        except Exception:
            pass
    if _cam is not None:
        try:
            _cam.stop()
            _cam.close()
        except Exception:
            pass
    GPIO.cleanup()
