import { WebSocketServer } from "ws";

const DEFAULT_PORT = 8181;
const [portArg, deviceGroupIdArg] = process.argv.slice(2);
const PORT = Number(portArg) || DEFAULT_PORT;
const DEVICE_GROUP_ID = deviceGroupIdArg || "cologne-smart-bin-mock";

const BINS_TEMPLATE = [
  { bin_id: "CGN-001", label: "Koelner Dom", district: "Innenstadt", lat: 50.9413, lng: 6.9583 },
  { bin_id: "CGN-002", label: "Koeln Hauptbahnhof", district: "Innenstadt", lat: 50.9428, lng: 6.9599 },
  { bin_id: "CGN-003", label: "University of Cologne", district: "Lindenthal", lat: 50.9281, lng: 6.9285 },
  { bin_id: "CGN-004", label: "Rheinauhafen", district: "Altstadt-Sued", lat: 50.9239, lng: 6.9657 },
  { bin_id: "CGN-005", label: "Neumarkt", district: "Innenstadt", lat: 50.9365, lng: 6.9478 },
  { bin_id: "CGN-006", label: "Heumarkt", district: "Innenstadt", lat: 50.9362, lng: 6.9607 },
  { bin_id: "CGN-007", label: "Aachener Weiher", district: "Lindenthal", lat: 50.9307, lng: 6.9228 },
  { bin_id: "CGN-008", label: "Stadtgarten", district: "Neustadt-Nord", lat: 50.9463, lng: 6.9384 },
  { bin_id: "CGN-009", label: "Mediapark", district: "Neustadt-Nord", lat: 50.9485, lng: 6.9441 },
  { bin_id: "CGN-010", label: "Deutzer Freiheit", district: "Deutz", lat: 50.9369, lng: 6.9748 },
  { bin_id: "CGN-011", label: "Lanxess Arena", district: "Deutz", lat: 50.9384, lng: 6.9829 },
  { bin_id: "CGN-012", label: "Chlodwigplatz", district: "Suedstadt", lat: 50.9217, lng: 6.9595 },
  { bin_id: "CGN-013", label: "Zuelpicher Strasse", district: "Innenstadt", lat: 50.9306, lng: 6.9366 },
  { bin_id: "CGN-014", label: "Volksgarten", district: "Suedstadt", lat: 50.9214, lng: 6.9449 },
  { bin_id: "CGN-015", label: "Ehrenfeld", district: "Ehrenfeld", lat: 50.9515, lng: 6.9166 },
  { bin_id: "CGN-016", label: "Nippes", district: "Nippes", lat: 50.9652, lng: 6.9531 },
  { bin_id: "CGN-017", label: "Muelheim Wiener Platz", district: "Muelheim", lat: 50.9618, lng: 7.0044 },
  { bin_id: "CGN-018", label: "Poller Wiesen", district: "Poll", lat: 50.9189, lng: 6.9827 },
  { bin_id: "CGN-019", label: "Rheinpark", district: "Deutz", lat: 50.9468, lng: 6.9738 },
  { bin_id: "CGN-020", label: "Suedstadt", district: "Suedstadt", lat: 50.9179, lng: 6.9609 },
];

const COMPARTMENTS = ["trash", "recycling", "compost"];

const bins = BINS_TEMPLATE.map((template, index) => ({
  ...template,
  compartments: {
    trash: { fill: 20 + ((index * 9) % 68) + Math.random() * 4 },
    recycling: { fill: 18 + ((index * 13) % 72) + Math.random() * 4 },
    compost: { fill: 12 + ((index * 7) % 62) + Math.random() * 4 },
  },
  lastWasteAt: 0,
  lastCollectionAt: 0,
}));

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const getCompartmentStatus = (percent) => {
  if (percent <= 10) return "empty";
  if (percent <= 74) return "normal";
  if (percent <= 89) return "almost_full";
  return "full";
};

const fillToDistance = (percent) => {
  const minDistance = 7;
  const maxDistance = 55;
  const noise = Math.random() * 1.6 - 0.8;
  return clamp(maxDistance - (percent / 100) * (maxDistance - minDistance) + noise, minDistance, maxDistance);
};

const simulateBin = (bin, nowSeconds) => {
  for (const key of COMPARTMENTS) {
    bin.compartments[key].fill = clamp(bin.compartments[key].fill + 0.08 + Math.random() * 0.18, 0, 100);
  }

  if (nowSeconds - bin.lastWasteAt > 3 + Math.random() * 10) {
    bin.lastWasteAt = nowSeconds;
    const target = COMPARTMENTS[Math.floor(Math.random() * COMPARTMENTS.length)];
    bin.compartments[target].fill = clamp(bin.compartments[target].fill + 3 + Math.random() * 12, 0, 100);
  }

  const maxFill = Math.max(...COMPARTMENTS.map((key) => bin.compartments[key].fill));
  const collectionDue = maxFill >= 92 && nowSeconds - bin.lastCollectionAt > 35 + Math.random() * 35;

  if (collectionDue || Math.random() < 0.002) {
    bin.lastCollectionAt = nowSeconds;
    const collectAll = Math.random() > 0.35;
    for (const key of COMPARTMENTS) {
      if (collectAll || bin.compartments[key].fill >= 75) {
        bin.compartments[key].fill = 4 + Math.random() * 14;
      }
    }
  }
};

const createFrame = (timestampMs) => ({
  city: "Cologne",
  device_group_id: DEVICE_GROUP_ID,
  timestamp_ms: timestampMs,
  bins: bins.map((bin) => {
    const compartments = Object.fromEntries(
      COMPARTMENTS.map((key) => {
        const fill = clamp(Number(bin.compartments[key].fill.toFixed(1)), 0, 100);
        return [
          key,
          {
            fill_level_percent: fill,
            distance_cm: Number(fillToDistance(fill).toFixed(1)),
            status: getCompartmentStatus(fill),
          },
        ];
      }),
    );

    return {
      bin_id: bin.bin_id,
      label: bin.label,
      district: bin.district,
      lat: bin.lat,
      lng: bin.lng,
      compartments,
    };
  }),
});

const wss = new WebSocketServer({ port: PORT });
const started = Date.now();

console.log(`Mock city bin server running on ws://localhost:${PORT} (${DEVICE_GROUP_ID})`);
console.log(`Simulating ${BINS_TEMPLATE.length} smart bins in Cologne`);

wss.on("connection", (socket, request) => {
  console.log(`[mock] client connected from ${request.socket.remoteAddress}`);

  const timer = setInterval(() => {
    const nowSeconds = (Date.now() - started) / 1000;
    bins.forEach((bin) => simulateBin(bin, nowSeconds));

    if (socket.readyState === socket.OPEN) {
      socket.send(JSON.stringify(createFrame(Date.now())));
    }
  }, 1000);

  socket.on("close", () => {
    clearInterval(timer);
    console.log("[mock] client disconnected");
  });
});
