import type { BinFillFrame, BinCompartmentStatus } from "../../types";
import { Badge, Progress } from "@mantine/core";

type Props = {
  name: string;
  data: BinFillFrame["compartments"][keyof BinFillFrame["compartments"]];
  accent: "trash" | "recycling" | "compost";
};

const accentColors: Record<Props["accent"], string> = {
  trash: "gray", recycling: "yellow", compost: "forest",
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
    <article className={`compartment-card compartment-${accent}`}>
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

        <Progress value={Math.min(100, Math.max(0, data.fill_level_percent))} color={accentColors[accent]} size="lg" radius="xl" />
        <Badge className={statusClass} mt="md" variant="light" color={data.status === "full" ? "red" : data.status === "almost_full" ? "yellow" : "forest"}>{statusLabels[data.status]}</Badge>

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
