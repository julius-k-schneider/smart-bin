import { WebSocketServer } from "ws";

const DEFAULT_PORT = 8181;
const [portArg, deviceIdArg] = process.argv.slice(2);
const PORT = Number(portArg) || DEFAULT_PORT;
const DEVICE_ID = deviceIdArg || "smart-bin-mock";

const compartments = {
  trash: { fill: 12, label: "Trash" },
  recycling: { fill: 7, label: "Recycling" },
  compost: { fill: 4, label: "Compost" },
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const getStatus = (percent) => {
  if (percent <= 10) return "empty";
  if (percent <= 74) return "normal";
  if (percent <= 89) return "almost_full";
  return "full";
};

const fillToDistance = (percent) => {
  const min = 8;
  const max = 55;
  return max - (percent / 100) * (max - min) + (Math.random() * 1.8 - 0.9);
};

const wss = new WebSocketServer({ port: PORT });

console.log(`Mock bin server running on ws://localhost:${PORT} (${DEVICE_ID})`);

wss.on("connection", (socket, request) => {
  const started = Date.now();
  let lastWasteAt = 0;
  const eventInterval = 8000 + Math.random() * 12000;

  console.log(`[mock] client connected from ${request.socket.remoteAddress}`);

  const timer = setInterval(() => {
    const elapsedMs = Date.now() - started;
    const nowSeconds = elapsedMs / 1000;

    const frame = {
      device_id: DEVICE_ID,
      timestamp_ms: elapsedMs,
      compartments: {
        trash: {
          fill_level_percent: clamp(compartments.trash.fill + (Math.sin(nowSeconds / 16) * 1.6), 0, 100),
          distance_cm: 0,
          status: "normal",
        },
        recycling: {
          fill_level_percent: clamp(compartments.recycling.fill + (Math.cos(nowSeconds / 14) * 1.2), 0, 100),
          distance_cm: 0,
          status: "normal",
        },
        compost: {
          fill_level_percent: clamp(compartments.compost.fill + (Math.sin(nowSeconds / 18) * 1.1), 0, 100),
          distance_cm: 0,
          status: "normal",
        },
      },
    };

    if (nowSeconds - lastWasteAt >= eventInterval) {
      lastWasteAt = nowSeconds;
      const target = ["trash", "recycling", "compost"][Math.floor(Math.random() * 3)];
      const delta = 6 + Math.random() * 10;
      compartments[target].fill = clamp(compartments[target].fill + delta, 0, 100);
    }

    Object.keys(frame.compartments).forEach((key) => {
      const compartment = frame.compartments[key];
      const baseFill = compartments[key].fill;
      compartment.fill_level_percent = clamp(Number(baseFill.toFixed(1)), 0, 100);
      compartment.distance_cm = Number(fillToDistance(compartment.fill_level_percent).toFixed(1));
      compartment.status = getStatus(compartment.fill_level_percent);
    });

    if (socket.readyState === socket.OPEN) {
      socket.send(JSON.stringify(frame));
    }
  }, 1000);

  socket.on("close", () => {
    clearInterval(timer);
    console.log("[mock] client disconnected");
  });
});
