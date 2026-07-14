import type { CityBinSnapshotFrame, ConnectionStatus } from "../../types";
import { getMaxFillLevel, getOverallStatus } from "../../utils/fillLevel";

type CitySummaryCardsProps = {
  data: CityBinSnapshotFrame | null;
  status: ConnectionStatus;
  threshold: number;
};

const formatTime = (ms: number) =>
  new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(ms));

export const CitySummaryCards = ({ data, status, threshold }: CitySummaryCardsProps) => {
  const totalBins = data?.bins.length ?? 0;
  const binsAboveThreshold =
    data?.bins.filter((bin) =>
      Object.values(bin.compartments).some((compartment) => compartment.fill_level_percent >= threshold),
    ).length ?? 0;
  const fullBins = data?.bins.filter((bin) => getOverallStatus(bin) === "full").length ?? 0;
  const almostFullBins = data?.bins.filter((bin) => getOverallStatus(bin) === "almost_full").length ?? 0;
  const averageFill = data
    ? Math.round(data.bins.reduce((sum, bin) => sum + getMaxFillLevel(bin), 0) / Math.max(1, data.bins.length))
    : 0;

  return (
    <div className="status-row">
      <article className="status-card summary-card">
        <h2>Total bins</h2>
        <strong>{totalBins}</strong>
      </article>
      <article className="status-card summary-card">
        <h2>Above threshold</h2>
        <strong>{binsAboveThreshold}</strong>
        <span>From {threshold}% fill</span>
      </article>
      <article className="status-card summary-card">
        <h2>Full bins</h2>
        <strong className={fullBins > 0 ? "status-full" : "status-normal"}>{fullBins}</strong>
      </article>
      <article className="status-card summary-card">
        <h2>Almost full</h2>
        <strong className={almostFullBins > 0 ? "status-almost_full" : "status-normal"}>{almostFullBins}</strong>
      </article>
      <article className="status-card summary-card">
        <h2>Average fill</h2>
        <strong>{averageFill}%</strong>
      </article>
      <article className="status-card summary-card">
        <h2>Last update</h2>
        <strong className="time-value">{data ? formatTime(data.timestamp_ms) : "-"}</strong>
        <span>{status === "open" ? "WebSocket connected" : status === "connecting" ? "Connecting" : "Reconnecting"}</span>
      </article>
    </div>
  );
};
