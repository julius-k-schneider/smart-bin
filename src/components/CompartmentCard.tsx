import type { BinFillFrame, BinCompartmentStatus } from "../types";

type Props = {
  name: string;
  data: BinFillFrame["compartments"][keyof BinFillFrame["compartments"]];
  accent: "trash" | "recycling" | "compost";
};

const accentColors: Record<Props["accent"], string> = {
  trash: "linear-gradient(90deg, #22272f 0%, #0f172a 100%)",
  recycling: "linear-gradient(90deg, #facc15 0%, #eab308 100%)",
  compost: "linear-gradient(90deg, #16a34a 0%, #22c55e 100%)",
};

const statusLabels: Record<BinCompartmentStatus, string> = {
  empty: "Empty",
  normal: "Normal",
  almost_full: "Almost full",
  full: "Full",
};

export const CompartmentCard = ({ name, data, accent }: Props) => {
  const statusClass = `badge-${data.status}`;

  return (
    <article className="compartment-card" style={{ backgroundImage: accentColors[accent] }}>
      <div className="content">
        <div className="compartment-name">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 7h16" />
            <path d="M9 7v12" />
            <path d="M15 7v12" />
            <path d="M6 7l1-3h10l1 3" />
          </svg>
          <h2>{name}</h2>
        </div>

        <p>Fill level</p>
        <div className="fill-value">{Math.round(data.fill_level_percent)}%</div>

        <div className="progress-track">
          <div
            className="progress-bar"
            style={{
              width: `${Math.min(100, Math.max(0, data.fill_level_percent))}%`,
              background: accent === "recycling" ? "#fde047" : accent === "compost" ? "#34d399" : "#cbd5e1",
            }}
          />
        </div>

        <div className={`status-badge ${statusClass}`}>{statusLabels[data.status]}</div>

        <div className="detail-row">
          {data.distance_cm !== undefined ? (
            <p>Distance: {data.distance_cm.toFixed(1)} cm</p>
          ) : (
            <p>Distance: unavailable</p>
          )}
          <p>Status: {statusLabels[data.status]}</p>
        </div>
      </div>
    </article>
  );
};
