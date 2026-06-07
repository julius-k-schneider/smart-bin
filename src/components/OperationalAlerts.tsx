import type { CityBinSnapshotFrame } from "../types";
import { getOverallStatus } from "../utils/fillLevel";

type OperationalAlertsProps = {
  data: CityBinSnapshotFrame | null;
  threshold: number;
};

export const OperationalAlerts = ({ data, threshold }: OperationalAlertsProps) => {
  if (!data) {
    return (
      <div className="alert-card muted-card">
        <h2>Operational Alerts</h2>
        <p>Connecting to city dashboard...</p>
      </div>
    );
  }

  const binsAboveThreshold = data.bins.filter((bin) =>
    Object.values(bin.compartments).some((compartment) => compartment.fill_level_percent >= threshold),
  );
  const fullBins = data.bins.filter((bin) => getOverallStatus(bin) === "full");
  const almostFullBins = data.bins.filter((bin) => getOverallStatus(bin) === "almost_full");

  const alerts = [
    fullBins.length > 0
      ? {
          severity: "critical",
          message: `${fullBins.length} bin${fullBins.length === 1 ? " is" : "s are"} full and should be prioritized.`,
        }
      : null,
    almostFullBins.length > 0
      ? {
          severity: "warning",
          message: `${almostFullBins.length} bin${almostFullBins.length === 1 ? " is" : "s are"} almost full.`,
        }
      : null,
    binsAboveThreshold.length > 0
      ? {
          severity: "info",
          message: `${binsAboveThreshold.length} bin${binsAboveThreshold.length === 1 ? " is" : "s are"} above the selected threshold (${threshold}%).`,
        }
      : {
          severity: "info",
          message: "No bins currently require collection for the selected threshold.",
        },
  ].filter(Boolean) as Array<{ severity: "critical" | "warning" | "info"; message: string }>;

  return (
    <div className="alert-card">
      <h2>Operational Alerts</h2>
      <div className="alert-list">
        {alerts.map((alert, index) => (
          <div key={`${alert.severity}-${index}`} className={`alert-message alert-${alert.severity}`}>
            {alert.message}
          </div>
        ))}
      </div>
    </div>
  );
};
