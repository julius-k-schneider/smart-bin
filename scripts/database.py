import os
import random
import sqlite3
import threading
import time
from pathlib import Path


DEFAULT_DATABASE_PATH = Path(__file__).resolve().parent.parent / "data" / "smart-bins.db"

COMPARTMENT_KEYS = ("trash", "recycling", "compost")

SEED_BINS = [
    ("CGN-001", "Koelner Dom", "Innenstadt", 50.9413, 6.9583),
    ("CGN-002", "Koeln Hauptbahnhof", "Innenstadt", 50.9428, 6.9599),
    ("CGN-003", "University of Cologne", "Lindenthal", 50.9281, 6.9285),
    ("CGN-004", "Rheinauhafen", "Altstadt-Sued", 50.9239, 6.9657),
    ("CGN-005", "Neumarkt", "Innenstadt", 50.9365, 6.9478),
    ("CGN-006", "Heumarkt", "Innenstadt", 50.9362, 6.9607),
    ("CGN-007", "Aachener Weiher", "Lindenthal", 50.9307, 6.9228),
    ("CGN-008", "Stadtgarten", "Neustadt-Nord", 50.9463, 6.9384),
    ("CGN-009", "Mediapark", "Neustadt-Nord", 50.9485, 6.9441),
    ("CGN-010", "Deutzer Freiheit", "Deutz", 50.9369, 6.9748),
    ("CGN-011", "Lanxess Arena", "Deutz", 50.9384, 6.9829),
    ("CGN-012", "Chlodwigplatz", "Suedstadt", 50.9217, 6.9595),
    ("CGN-013", "Zuelpicher Strasse", "Innenstadt", 50.9306, 6.9366),
    ("CGN-014", "Volksgarten", "Suedstadt", 50.9214, 6.9449),
    ("CGN-015", "Ehrenfeld", "Ehrenfeld", 50.9515, 6.9166),
    ("CGN-016", "Nippes", "Nippes", 50.9652, 6.9531),
    ("CGN-017", "Muelheim Wiener Platz", "Muelheim", 50.9618, 7.0044),
    ("CGN-018", "Poller Wiesen", "Poll", 50.9189, 6.9827),
    ("CGN-019", "Rheinpark", "Deutz", 50.9468, 6.9738),
    ("CGN-020", "Suedstadt", "Suedstadt", 50.9179, 6.9609),
]


def get_status(fill_level):
    if fill_level <= 10:
        return "empty"
    if fill_level < 75:
        return "normal"
    if fill_level < 90:
        return "almost_full"
    return "full"


def get_distance(fill_level):
    return round(55 - (fill_level / 100) * 48, 1)


def row_to_bin(row):
    return {
        "bin_id": row["bin_id"],
        "label": row["label"],
        "district": row["district"],
        "lat": row["lat"],
        "lng": row["lng"],
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
        "compartments": {
            "trash": {
                "fill_level_percent": row["trash_fill"],
                "distance_cm": row["trash_distance"],
                "status": get_status(row["trash_fill"]),
            },
            "recycling": {
                "fill_level_percent": row["recycling_fill"],
                "distance_cm": row["recycling_distance"],
                "status": get_status(row["recycling_fill"]),
            },
            "compost": {
                "fill_level_percent": row["compost_fill"],
                "distance_cm": row["compost_distance"],
                "status": get_status(row["compost_fill"]),
            },
        },
    }


class SmartBinDatabase:
    def __init__(self, database_path=None):
        path = database_path or os.getenv("SMART_BIN_DB_PATH") or str(DEFAULT_DATABASE_PATH)
        if path != ":memory:":
            Path(path).parent.mkdir(parents=True, exist_ok=True)
        self.connection = sqlite3.connect(path, check_same_thread=False)
        self.connection.row_factory = sqlite3.Row
        self.connection.execute("PRAGMA foreign_keys = ON")
        self.lock = threading.RLock()
        self.create_tables()
        self.seed()

    def create_tables(self):
        with self.lock, self.connection:
            self.connection.executescript(
                """
                CREATE TABLE IF NOT EXISTS bins (
                    bin_id TEXT PRIMARY KEY, label TEXT NOT NULL, district TEXT NOT NULL,
                    lat REAL NOT NULL, lng REAL NOT NULL, created_at INTEGER NOT NULL
                );
                CREATE TABLE IF NOT EXISTS bin_state (
                    bin_id TEXT PRIMARY KEY REFERENCES bins(bin_id) ON DELETE CASCADE,
                    trash_fill REAL NOT NULL, recycling_fill REAL NOT NULL, compost_fill REAL NOT NULL,
                    trash_distance REAL NOT NULL, recycling_distance REAL NOT NULL,
                    compost_distance REAL NOT NULL, updated_at INTEGER NOT NULL
                );
                CREATE TABLE IF NOT EXISTS measurements (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    bin_id TEXT NOT NULL REFERENCES bins(bin_id) ON DELETE CASCADE,
                    timestamp_ms INTEGER NOT NULL, trash_fill REAL NOT NULL,
                    recycling_fill REAL NOT NULL, compost_fill REAL NOT NULL
                );
                CREATE INDEX IF NOT EXISTS measurements_bin_time
                    ON measurements(bin_id, timestamp_ms DESC);
                """
            )

    def seed(self):
        with self.lock:
            count = self.connection.execute("SELECT COUNT(*) FROM bins").fetchone()[0]
            if count > 0:
                return

            now = int(time.time() * 1000)
            with self.connection:
                for index, bin_data in enumerate(SEED_BINS):
                    trash = round(20 + ((index * 9) % 68) + random.random() * 4, 1)
                    recycling = round(18 + ((index * 13) % 72) + random.random() * 4, 1)
                    compost = round(12 + ((index * 7) % 62) + random.random() * 4, 1)
                    levels = (trash, recycling, compost)
                    self.connection.execute(
                        "INSERT INTO bins (bin_id, label, district, lat, lng, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                        (*bin_data, now),
                    )
                    self.connection.execute(
                        """
                        INSERT INTO bin_state (
                            bin_id, trash_fill, recycling_fill, compost_fill,
                            trash_distance, recycling_distance, compost_distance, updated_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                        """,
                        (bin_data[0], *levels, *(get_distance(level) for level in levels), now),
                    )
                    self.connection.execute(
                        """
                        INSERT INTO measurements (bin_id, timestamp_ms, trash_fill, recycling_fill, compost_fill)
                        VALUES (?, ?, ?, ?, ?)
                        """,
                        (bin_data[0], now, *levels),
                    )

    def get_bins(self):
        with self.lock:
            rows = self.connection.execute(
                "SELECT bins.*, bin_state.* FROM bins JOIN bin_state USING (bin_id) ORDER BY bins.bin_id"
            ).fetchall()
            return [row_to_bin(row) for row in rows]

    def get_bin(self, bin_id):
        with self.lock:
            row = self.connection.execute(
                "SELECT bins.*, bin_state.* FROM bins JOIN bin_state USING (bin_id) WHERE bins.bin_id = ?",
                (bin_id,),
            ).fetchone()
            if row is None:
                return None
            history = self.connection.execute(
                """
                SELECT timestamp_ms, trash_fill, recycling_fill, compost_fill
                FROM measurements WHERE bin_id = ? ORDER BY timestamp_ms DESC LIMIT 20
                """,
                (bin_id,),
            ).fetchall()
            result = row_to_bin(row)
            result["history"] = [dict(measurement) for measurement in history]
            return result

    def add_bin(self, bin_data):
        now = int(time.time() * 1000)
        levels = (bin_data["trash_fill"], bin_data["recycling_fill"], bin_data["compost_fill"])
        with self.lock, self.connection:
            self.connection.execute(
                "INSERT INTO bins (bin_id, label, district, lat, lng, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                (bin_data["bin_id"], bin_data["label"], bin_data["district"], bin_data["lat"], bin_data["lng"], now),
            )
            self.connection.execute(
                """
                INSERT INTO bin_state (
                    bin_id, trash_fill, recycling_fill, compost_fill,
                    trash_distance, recycling_distance, compost_distance, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (bin_data["bin_id"], *levels, *(get_distance(level) for level in levels), now),
            )
            self.connection.execute(
                """
                INSERT INTO measurements (bin_id, timestamp_ms, trash_fill, recycling_fill, compost_fill)
                VALUES (?, ?, ?, ?, ?)
                """,
                (bin_data["bin_id"], now, *levels),
            )
        return self.get_bin(bin_data["bin_id"])

    def delete_bin(self, bin_id):
        with self.lock, self.connection:
            cursor = self.connection.execute("DELETE FROM bins WHERE bin_id = ?", (bin_id,))
            return cursor.rowcount > 0

    def update_compartments(self, bin_id, readings, record_history=True):
        """Write measured values for one bin. Only the reported compartments are
        touched, the remaining ones keep their current value. Returns the updated
        bin or None if the bin does not exist."""
        reported = {key: readings[key] for key in COMPARTMENT_KEYS if key in readings}
        if not reported:
            return None

        now = int(time.time() * 1000)
        with self.lock, self.connection:
            exists = self.connection.execute(
                "SELECT 1 FROM bin_state WHERE bin_id = ?", (bin_id,)
            ).fetchone()
            if exists is None:
                return None

            assignments = []
            values = []
            for key, reading in reported.items():
                fill = round(min(100.0, max(0.0, float(reading["fill_level_percent"]))), 1)
                distance = reading.get("distance_cm")
                distance = get_distance(fill) if distance is None else round(float(distance), 1)
                # Column names come from COMPARTMENT_KEYS, never from the payload.
                assignments.append(f"{key}_fill = ?")
                assignments.append(f"{key}_distance = ?")
                values.extend((fill, distance))

            self.connection.execute(
                f"UPDATE bin_state SET {', '.join(assignments)}, updated_at = ? WHERE bin_id = ?",
                (*values, now, bin_id),
            )
            if record_history:
                state = self.connection.execute(
                    "SELECT trash_fill, recycling_fill, compost_fill FROM bin_state WHERE bin_id = ?",
                    (bin_id,),
                ).fetchone()
                self.connection.execute(
                    """
                    INSERT INTO measurements (bin_id, timestamp_ms, trash_fill, recycling_fill, compost_fill)
                    VALUES (?, ?, ?, ?, ?)
                    """,
                    (bin_id, now, state["trash_fill"], state["recycling_fill"], state["compost_fill"]),
                )
        return self.get_bin(bin_id)

    def simulate_update(self, exclude_bin_ids=()):
        """Move every fill level a little. Bins listed in exclude_bin_ids are fed
        by a real device and must not be overwritten by the simulation."""
        bins = [smart_bin for smart_bin in self.get_bins() if smart_bin["bin_id"] not in exclude_bin_ids]
        now = int(time.time() * 1000)
        with self.lock, self.connection:
            for smart_bin in bins:
                levels = []
                for key in COMPARTMENT_KEYS:
                    current = smart_bin["compartments"][key]["fill_level_percent"]
                    levels.append(round(min(100, max(0, current + random.random() * 1.4 - 0.15)), 1))
                self.connection.execute(
                    """
                    UPDATE bin_state SET trash_fill = ?, recycling_fill = ?, compost_fill = ?,
                        trash_distance = ?, recycling_distance = ?, compost_distance = ?, updated_at = ?
                    WHERE bin_id = ?
                    """,
                    (*levels, *(get_distance(level) for level in levels), now, smart_bin["bin_id"]),
                )
                self.connection.execute(
                    """
                    INSERT INTO measurements (bin_id, timestamp_ms, trash_fill, recycling_fill, compost_fill)
                    VALUES (?, ?, ?, ?, ?)
                    """,
                    (smart_bin["bin_id"], now, *levels),
                )

    def reset_fill_levels(self):
        bins = self.get_bins()
        now = int(time.time() * 1000)
        with self.lock, self.connection:
            for smart_bin in bins:
                levels = [
                    round(random.uniform(8, 35), 1),
                    round(random.uniform(5, 30), 1),
                    round(random.uniform(5, 25), 1),
                ]
                self.connection.execute(
                    """
                    UPDATE bin_state SET trash_fill = ?, recycling_fill = ?, compost_fill = ?,
                        trash_distance = ?, recycling_distance = ?, compost_distance = ?, updated_at = ?
                    WHERE bin_id = ?
                    """,
                    (*levels, *(get_distance(level) for level in levels), now, smart_bin["bin_id"]),
                )
                self.connection.execute(
                    """
                    INSERT INTO measurements (bin_id, timestamp_ms, trash_fill, recycling_fill, compost_fill)
                    VALUES (?, ?, ?, ?, ?)
                    """,
                    (smart_bin["bin_id"], now, *levels),
                )
