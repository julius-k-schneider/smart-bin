import { useMemo } from "react";
import { useBinSocket } from "./hooks/useBinSocket";
import { BINS } from "./config/bins";
import { ConnectionStatusBadge } from "./components/ConnectionStatusBadge";
import { CompartmentCard } from "./components/CompartmentCard";
import { AlertPanel } from "./components/AlertPanel";
import type { BinFillFrame } from "./types";

const PRIMARY_BIN = BINS[0];

const formatTime = (value: number | null) => {
  if (value === null) return "—";
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
};

const getHistorySummary = (history: BinFillFrame[]) => {
  return history
    .slice(-8)
    .reverse()
    .map((frame) => ({
      label: formatTime(frame.timestamp_ms),
      values: [
        Math.round(frame.compartments.trash.fill_level_percent),
        Math.round(frame.compartments.recycling.fill_level_percent),
        Math.round(frame.compartments.compost.fill_level_percent),
      ],
    }));
};

const App = () => {
  const { status, latest, history } = useBinSocket({ enabled: true, url: PRIMARY_BIN.url, historySize: 80 });
  const live = status === "open" && latest !== null;
  const historySummary = useMemo(() => getHistorySummary(history), [history]);

  return (
    <div className="app-shell">
      <header>
        <div>
          <h1>AI-Powered Smart Waste Sorting Bin</h1>
          <p>Live fill-level dashboard for Trash, Recycling, and Compost compartments.</p>
        </div>
      </header>

      <div className="status-row">
        <div className="status-card">
          <h2>Connection</h2>
          <div className="status-field">
            <span>Status</span>
            <ConnectionStatusBadge status={status} />
          </div>
          <div className="status-field">
            <span>Device ID</span>
            <strong>{latest?.device_id ?? PRIMARY_BIN.binId}</strong>
          </div>
          <div className="status-field">
            <span>WebSocket URL</span>
            <strong>{PRIMARY_BIN.url}</strong>
          </div>
          <div className="status-field">
            <span>Last update</span>
            <strong>{formatTime(latest?.timestamp_ms ?? null)}</strong>
          </div>
          <div className="status-field">
            <span>Receiving live data</span>
            <strong>{live ? "Yes" : "No"}</strong>
          </div>
        </div>

        <div className="status-card">
          <h2>Bin snapshot</h2>
          <p>Current values are updated automatically as the mock smart bin sends new frames.</p>
          <div className="status-field">
            <span>Frame count</span>
            <strong>{history.length}</strong>
          </div>
          <div className="status-field">
            <span>Latest device</span>
            <strong>{latest?.device_id ?? "Awaiting data"}</strong>
          </div>
        </div>
      </div>

      <div className="cards-grid">
        <CompartmentCard name="Trash" accent="trash" data={latest?.compartments.trash ?? { fill_level_percent: 0, status: "empty" as const }} />
        <CompartmentCard name="Recycling" accent="recycling" data={latest?.compartments.recycling ?? { fill_level_percent: 0, status: "empty" as const }} />
        <CompartmentCard name="Compost" accent="compost" data={latest?.compartments.compost ?? { fill_level_percent: 0, status: "empty" as const }} />
      </div>

      <div className="status-row">
        <div className="history-card">
          <h2>Recent updates</h2>
          <p>Last frames received from the smart bin.</p>
          <ul className="history-list">
            {historySummary.map((item) => (
              <li key={item.label} className="history-item">
                <div>
                  <time>{item.label}</time>
                  <p>
                    Trash {item.values[0]}%, Recycler {item.values[1]}%, Compost {item.values[2]}%
                  </p>
                </div>
                <div>
                  <strong>{Math.max(...item.values)}%</strong>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <AlertPanel latest={latest} />
      </div>
    </div>
  );
};

export default App;
